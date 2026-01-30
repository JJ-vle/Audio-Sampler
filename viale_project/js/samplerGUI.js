// samplerGUI.js
import SamplerEngine from "./samplerEngine.js";
import SoundItem from "./sounds.js";
import WaveformDrawer from './waveformdrawer.js';

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

        this.presets = [];
        this.samples = [];
        this.state = [];
        this.soundItems = [];

    }


    async init() {
        const res = await fetch("http://localhost:3000/api/presets");
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
    }

    populatePresetList() {
        this.presetSelect.innerHTML = "";
        this.presets.forEach((p, i) => {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = p.name;
            this.presetSelect.appendChild(opt);
        });
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

                // cree le SoundItem
                const soundItem = new SoundItem(
                    index,
                    buffer,
                    this.ctx,
                    this.waveformCanvas,
                    document.getElementById("myCanvasOverlay"),
                    sample.name
                );
                this.soundItems[index] = soundItem;
        
                // initialise waveform pour la première fois
                await this.engine.ensureContext();
                soundItem.onPlayClick();
        
                // clic sur pad pour rejouer
                pad.onclick = async () => {
                    await this.engine.ensureContext();
                    soundItem.onPlayClick();
                };

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

    
}


