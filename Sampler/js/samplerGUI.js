// samplerGUI.js
import SamplerEngine from "./samplerEngine.js";
import SoundItem from "./sounds.js";
import WaveformDrawer from './waveformdrawer.js';
import TrimbarsDrawer from './trimbarsdrawer.js';

//export const BASE_URL = "http://localhost:3000"; 
export const BASE_URL = "https://audio-sampler.onrender.com";

// indices de pad selon la grille
const KEY_MAP = {
    // ligne du bas --> touches Z Q S D …
    'a': 12,
    'z': 13,
    'e': 14,
    'r': 15,
    'q': 8,
    's': 9,
    'd': 10,
    'f': 11,
    'w': 4,
    'x': 5,
    'c': 6,
    'v': 7,
    '1': 0,
    '2': 1,
    '3': 2,
    '4': 3
};


export default class SamplerGUI {
    constructor(ctx) {
        this.ctx = ctx;
        this.engine = new SamplerEngine(ctx);

        this.grid = document.getElementById("grid");
        this.presetSelect = document.getElementById("presetSelect");
        this.btnAll = document.getElementById("btnAll");
        this.globalStatus = document.getElementById("globalStatus");

        this.waveformCanvas = document.getElementById("myCanvas");
        this.waveformDrawer = new WaveformDrawer();

        this.trimbarsDrawer = new TrimbarsDrawer(
            document.getElementById("myCanvasOverlay"),
            0,
            this.waveformCanvas.width
        );
        this._initTrimEvents();

        this.presets = [];
        this.samples = [];
        this.state = [];
        this.soundItems = [];

    }

    async init() {
        const res = await fetch(`${BASE_URL}/api/presets`);
        this.presets = await res.json();

        if (!this.presets.length) {
            this.globalStatus.textContent = "Aucun preset.";
            return;
        }

        this.populatePresetList();
        await this.loadPreset(0);

        this.presetSelect.addEventListener("change", e => {
            this.loadPreset(+e.target.value);
        });

        this.btnAll.addEventListener("click", () => this.loadAll());

        document.addEventListener("keydown", async (e) => {
            if (e.repeat) return; // ignore répétition automatique
            const key = e.key.toLowerCase();
            const padIndex = KEY_MAP[key];
            if (padIndex === undefined) return;
        
            const st = this.state[padIndex];
            if (!st) return;
        
            let soundItem = this.soundItems[padIndex];
            const els = st.els;
        
            // si SoundItem n’existe pas encore, créer et charger
            if (!soundItem && this.slots[padIndex]) {
                const sample = this.slots[padIndex];
                if (!sample || !sample.url) return;
        
                st.loading = true;
                if (els) {
                    els.pad.disabled = true;
                    els.sub.textContent = "Chargement…";
                    els.bar.style.width = "0%";
                }
        
                try {
                    const buffer = await this.engine.loadSample(sample, (progress) => {
                        if (!els) return;
                        const pct = Math.floor(progress * 100);
                        els.bar.style.width = pct + "%";
                        els.sub.textContent = `Chargement ${pct}%`;
                    });
                    st.buffer = buffer;
        
                    soundItem = new SoundItem(
                        this,
                        padIndex,
                        buffer,
                        this.ctx,
                        this.waveformCanvas,
                        document.getElementById("myCanvasOverlay"),
                        sample.name
                    );
                    this.soundItems[padIndex] = soundItem;
        
                    if (els) {
                        els.bar.style.width = "100%";
                        els.sub.textContent = "Prêt";
                        els.pad.disabled = false;
                        els.pad.classList.add("ready");
                    }
        
                } catch (err) {
                    console.error("Erreur chargement clavier:", err);
                    if (els) {
                        els.sub.textContent = "Erreur";
                        els.bar.style.width = "0%";
                        els.pad.disabled = false;
                    }
                    st.loading = false;
                    return;
                }
                st.loading = false;
            }
        
            if (!soundItem) return;
        
            // jouer
            await this.engine.ensureContext();
            soundItem.onPlayClick();
        });
        
        
        
    }

    populatePresetList() {
        this.presetSelect.innerHTML = "";
    
        // grouper les presets par type
        const groups = {};
        this.presets.forEach(p => {
            if (!groups[p.type]) groups[p.type] = [];
            groups[p.type].push(p);
        });
    
        // creer les optgroup
        for (const type of Object.keys(groups)) {
            const optgroup = document.createElement("optgroup");
            optgroup.label = type; // label non sélectionnable
    
            groups[type].forEach(p => {
                const opt = document.createElement("option");
                opt.value = this.presets.indexOf(p); // index original pour loadPreset
                opt.textContent = p.name;
                optgroup.appendChild(opt);
            });
    
            this.presetSelect.appendChild(optgroup);
        }
    }
    

    async loadPreset(index) {
        const preset = this.presets[index];
        if (!preset) return;
    
        this.samples = preset.samples;
        this.soundItems = [];
        this.grid.innerHTML = "";
    
        const GRID_SIZE = 16;
        const ORDER = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3]; // bottom-left = pad 0
        this.slots = new Array(GRID_SIZE).fill(null);
    
        // mapping samples --> slots selon l’ordre
        for (let k = 0; k < Math.min(this.samples.length, GRID_SIZE); k++) {
            this.slots[ORDER[k]] = this.samples[k];
        }
    
        // cree les pads selon la grille et initialise l’état
        this.state = this.slots.map(s => ({ buffer: null, loading: false, els: null }));
        this.slots.forEach((sample, i) => {
            if (sample) this.createPad(sample, i);
            else this.createPad({ name: "—", url: null }, i); // pad vide
        });
    }
    

    createPad(sample, index) {
        const pad = document.createElement("button");
        pad.className = "pad";

        const label = document.createElement("div");
        label.textContent = sample.name;
        pad.appendChild(label);

        const sub = document.createElement("div");
        sub.textContent = "En attente";
        pad.appendChild(sub);


        const prog = document.createElement("div");
        prog.className = "prog";
        
        const bar = document.createElement("div");
        bar.className = "bar";
        
        prog.appendChild(bar);
        pad.appendChild(prog);
        
        this.state[index] = { buffer: null, loading: false, els: { pad, sub, bar } };

        if (!sample.url) return;

        pad.addEventListener("click", async () => {
            let soundItem = this.soundItems[index];
        
            // si SoundItem existe déjà --> juste jouer
            if (soundItem) {
                await this.engine.ensureContext();
                soundItem.onPlayClick();
                return;
            }
        
            // sinon creer
            const st = this.state[index];
            pad.disabled = true;
            sub.textContent = "Chargement…";
            bar.style.width = "0%";
        
            try {
                const buffer = await this.engine.loadSample(sample, (progress) => {
                    const pct = Math.floor(progress * 100);
                    bar.style.width = pct + "%";
                    sub.textContent = `Chargement ${pct}%`;
                });
        
                if (!buffer) throw new Error("Buffer non chargé");
        
                soundItem = new SoundItem(
                    this,
                    index,
                    buffer,
                    this.ctx,
                    this.waveformCanvas,
                    document.getElementById("myCanvasOverlay"),
                    sample.name
                );
        
                this.soundItems[index] = soundItem;
        
                await this.engine.ensureContext();
                soundItem.onPlayClick();
        
                bar.style.width = "100%";
                sub.textContent = "Prêt";
                pad.classList.add("ready");
                pad.disabled = false;
        
            } catch (e) {
                sub.textContent = "Erreur";
                bar.style.width = "0%";
                pad.disabled = false;
                console.error(e);
            }
        });
         

        this.grid.appendChild(pad);
    }

    async loadAll() {
        this.globalStatus.textContent = "Chargement…";
        this.btnAll.disabled = true;

        const tasks = this.samples.map((sample, i) => {
            const st = this.state[i];
            if (!st || !st.els || !sample.url) return Promise.resolve();

            const { pad, sub, bar } = st.els;
            st.loading = true;
            pad.disabled = true;
            sub.textContent = "Chargement…";
            bar.style.width = "0%";

            return this.engine.loadSample(sample, (progress) => {
                const pct = Math.floor(progress * 100);
                bar.style.width = pct + "%";
                sub.textContent = `Chargement ${pct}%`;
            })
            .then(async buffer => {
                st.buffer = buffer;

                // crée SoundItem si pas encore existant
                if (!this.soundItems[i]) {
                    const soundItem = new SoundItem(
                        this,
                        i,
                        buffer,
                        this.ctx,
                        this.waveformCanvas,
                        document.getElementById("myCanvasOverlay"),
                        sample.name
                    );
                    this.soundItems[i] = soundItem;

                    // dessine waveform immédiatement
                    await this.engine.ensureContext();
                    soundItem.onPlayClick();

                    // clic sur pad pour rejouer
                    pad.onclick = async () => {
                        await this.engine.ensureContext();
                        soundItem.onPlayClick();
                    };
                }

                pad.classList.add("ready");
                bar.style.width = "100%";
                sub.textContent = "Prêt";
                pad.disabled = false;
            })
            .catch(err => {
                sub.textContent = "Erreur";
                bar.style.width = "0%";
                pad.disabled = false;
                console.error(err);
            })
            .finally(() => {
                st.loading = false;
            });
        });

        await Promise.allSettled(tasks);
        this.globalStatus.textContent = "OK";
        setTimeout(() => this.globalStatus.textContent = "", 1000);
        this.btnAll.disabled = false;
    }
    
    _initTrimEvents() {
        let mousePos = { x: 0, y: 0 };
    
        this.trimbarsDrawer.canvas.onmousemove = (evt) => {
            const rect = this.trimbarsDrawer.canvas.getBoundingClientRect();
            mousePos.x = evt.clientX - rect.left;
            mousePos.y = evt.clientY - rect.top;
    
            this.trimbarsDrawer.moveTrimBars(mousePos);
    
            const ctx2d = this.waveformCanvas.getContext("2d");
            ctx2d.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
            window.currentSound?.waveformDrawer.drawWave(0, this.waveformCanvas.height);
            this.trimbarsDrawer.draw();
        };
    
        this.trimbarsDrawer.canvas.onmousedown = () => this.trimbarsDrawer.startDrag();
        this.trimbarsDrawer.canvas.onmouseup   = () => this.trimbarsDrawer.stopDrag();
    }
    
    
}

