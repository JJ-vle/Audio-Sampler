import { loadAndDecodeSound } from './soundutils.js';
import SoundItem from './sounds.js';

export default class SamplerEngine {
    constructor(ctx, canvas, canvasOverlay, container) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.canvasOverlay = canvasOverlay;
        this.container = container;
        this.soundItems = [];
    }

    async loadPreset(preset) {
        if (!preset) return;

        // Vide les anciens boutons
        this.container.innerHTML = "";

        // Crée les URLs correctes
        const soundURLs = preset.samples.map(s =>
            `http://localhost:3000/presets/${encodeURIComponent(s.url.replace(/^\.\//, ''))}`
        );

        // Charge et décode les sons
        const decodedSounds = await loadAndDecodeSound(soundURLs, this.ctx);

        // Crée les SoundItem pour chaque échantillon
        this.soundItems = decodedSounds.map(
            (buffer, i) => new SoundItem(i, buffer, this.ctx, this.canvas, this.canvasOverlay, preset.samples[i].name)
        );

        // Ajoute les boutons au container
        this.soundItems.forEach(item => item.attachTo(this.container));
    }
}
