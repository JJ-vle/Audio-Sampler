import SamplerEngine from './samplerEngine.js';

export default class SamplerGUI {
    constructor(ctx) {
        this.ctx = ctx;
        this.presets = [];
        this.canvas = document.querySelector("#myCanvas");
        this.canvasOverlay = document.querySelector("#myCanvasOverlay");
        this.container = document.querySelector("#buttonContainer");
        this.presetSelect = document.querySelector("#presetSelect");
        this.engine = new SamplerEngine(this.ctx, this.canvas, this.canvasOverlay, this.container);
    }

    async init() {
        // Récupère les presets depuis le serveur
        const response = await fetch("http://localhost:3000/api/presets");
        this.presets = await response.json();

        // Ajoute les presets au <select>
        this.presets.forEach((preset, index) => {
            const opt = document.createElement("option");
            opt.value = index;
            opt.textContent = preset.name || `Preset ${index + 1}`;
            this.presetSelect.appendChild(opt);
        });

        // Événement de changement de preset
        this.presetSelect.addEventListener("change", async (e) => {
            const index = parseInt(e.target.value);
            await this.loadPreset(index);
        });

        // Lance l’animation de mise à jour des trim bars
        this.animate();
    }

    async loadPreset(index) {
        const preset = this.presets[index];
        await this.engine.loadPreset(preset);
    }

    animate() {
        const loop = () => {
            requestAnimationFrame(loop);
            if (window.currentSound) {
                window.currentSound.trimbarsDrawer.clear();
                window.currentSound.trimbarsDrawer.draw();
            }
        };
        loop();
    }
}
