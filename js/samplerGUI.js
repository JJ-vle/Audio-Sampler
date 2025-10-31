import SamplerEngine from './samplerEngine.js';

export default class SamplerGUI {
    constructor(ctx) {
        this.ctx = ctx;
        this.presets = [];
        this.engine = null;

        // UI
        this.grid = document.getElementById("grid");
        this.btnAll = document.getElementById("btnAll");
        this.globalStatus = document.getElementById("globalStatus");
        this.presetSelect = document.getElementById("presetSelect");

        // moteur
        this.engine = new SamplerEngine(this.ctx, this.canvas, this.canvasOverlay, this.container);
    }

    async init() {
        // Récupérer les presets
        const response = await fetch("http://localhost:3000/api/presets");
        this.presets = await response.json();

        if (!this.presets.length) {
            this.globalStatus.textContent = "Aucun preset trouvé.";
            return;
        }

        this.populatePresetList(this.presets);

        // Charge le premier preset par défaut
        await this.loadPreset(0);

        // Changement de preset
        this.presetSelect.addEventListener("change", async (e) => {
            const index = parseInt(e.target.value);
            await this.loadPreset(index);
        });

        // Charger tout
        this.btnAll.addEventListener("click", async () => {
            this.btnAll.disabled = true;
            this.globalStatus.textContent = "Chargement…";
            await this.loadAllSamples();
            this.globalStatus.textContent = "OK";
            setTimeout(() => (this.globalStatus.textContent = ""), 1200);
            this.btnAll.disabled = false;
        });

        this.animate();
    }

    populatePresetList(presets) {
        this.presetSelect.innerHTML = `<option disabled selected>Choose a preset...</option>`;
        presets.forEach((preset, i) => {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = preset.name || `Preset ${i + 1}`;
            this.presetSelect.appendChild(opt);
        });
    }

    async loadPreset(index) {
        const preset = this.presets[index];
        if (!preset) return;
        this.samples = preset.samples || [];

        // ⚡ Charge les SoundItem via l'engine
        await this.engine.loadPreset(preset);

        // Crée la grille 4×4 avec état & barre de progression
        this.createGrid();
    }

    createGrid() {
        const GRID_SIZE = 16;
        const ORDER = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];
        this.slots = new Array(GRID_SIZE).fill(null);

        for (let k = 0; k < Math.min(this.samples.length, GRID_SIZE); k++) {
            this.slots[ORDER[k]] = this.samples[k];
        }

        this.state = this.slots.map(() => ({ buffer: null, loading: false, els: null }));
        this.grid.innerHTML = "";

        this.slots.forEach((sample, i) => {
            const pad = document.createElement("button");
            pad.type = "button";
            pad.className = "pad" + (sample ? "" : " empty");
            pad.disabled = !sample;

            const label = document.createElement("div");
            label.className = "label";
            label.textContent = sample ? sample.name : "—";
            pad.appendChild(label);

            const sub = document.createElement("div");
            sub.className = "sub";
            sub.textContent = sample ? "En attente" : "";
            pad.appendChild(sub);

            if (sample) {
                const prog = document.createElement("div");
                prog.className = "prog";
                const bar = document.createElement("div");
                bar.className = "bar";
                prog.appendChild(bar);
                pad.appendChild(prog);

                // Lecture rapide depuis le pad
                pad.addEventListener("click", async () => {
                    const st = this.state[i];
                    if (!st.buffer) return;
                    await this.ensureAudioContext();
                    const src = this.ctx.createBufferSource();
                    src.buffer = st.buffer;
                    src.connect(this.ctx.destination);
                    src.start(0);
                    pad.classList.add("playing");
                    setTimeout(() => pad.classList.remove("playing"), Math.min(200, st.buffer.duration * 1000));
                });

                this.state[i].els = { pad, sub, bar };
            }

            this.grid.appendChild(pad);
        });
    }

    async ensureAudioContext() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === "suspended") await this.ctx.resume();
        return this.ctx;
    }

    async loadAllSamples() {
        const tasks = this.slots.map((sample, i) =>
            sample
                ? this.loadAndDecode(i, `http://localhost:3000/presets/${encodeURIComponent(sample.url.replace(/^\.\//, ''))}`)
                : Promise.resolve()
        );
        return Promise.allSettled(tasks);
    }

    async loadAndDecode(i, url) {
        const st = this.state[i];
        if (st.loading || st.buffer || !st.els) return;
        st.loading = true;

        const { pad, sub, bar } = st.els;
        pad.disabled = true;
        pad.classList.remove("ready");
        sub.textContent = "Connexion…";
        bar.style.width = "0%";

        try {
            const res = await fetch(url);
            if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
            const total = Number(res.headers.get("content-length") || 0);
            const reader = res.body.getReader();
            const chunks = [];
            let recv = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                recv += value.length;

                if (total > 0) {
                    const pct = Math.max(0, Math.min(100, Math.floor((recv / total) * 100)));
                    bar.style.width = pct + "%";
                    sub.textContent = `${this.niceBytes(recv)} / ${this.niceBytes(total)} (${pct}%)`;
                } else {
                    bar.style.width = "50%";
                    sub.textContent = `${this.niceBytes(recv)} reçus…`;
                }
            }

            const blob = new Blob(chunks, { type: res.headers.get("content-type") || "application/octet-stream" });
            const buf = await this.ctx.decodeAudioData(await blob.arrayBuffer());

            st.buffer = buf;
            sub.textContent = `Prêt (${this.niceBytes(blob.size)})`;
            bar.style.width = "100%";
            pad.classList.add("ready");
            pad.disabled = false;
        } catch (e) {
            sub.textContent = `Erreur: ${e.message}`;
            console.error(e);
            pad.disabled = false;
        } finally {
            st.loading = false;
        }
    }

    niceBytes(n) {
        if (!Number.isFinite(n)) return "";
        const u = ["B", "KB", "MB", "GB"];
        let i = 0, v = n;
        while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
        return v.toFixed(v >= 10 || i === 0 ? 0 : 1) + " " + u[i];
    }

    animate() {
        const loop = () => {
            requestAnimationFrame(loop);
            if (window.currentSound && window.currentSound.trimbarsDrawer) {
                window.currentSound.trimbarsDrawer.clear();
                window.currentSound.trimbarsDrawer.draw();
            }
        };
        loop();
    }
}
