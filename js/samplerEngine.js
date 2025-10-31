import { loadAndDecodeSound } from './soundutils.js';
import SoundItem from './sounds.js';

/*
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
*/

export default class SamplerEngine {
    constructor(ctx, container, canvas = null, canvasOverlay = null) {
        this.ctx = ctx;
        this.container = container;           // 🔹 #grid ou #buttonContainer
        this.canvas = canvas;                 // optionnel, pour waveform / trims
        this.canvasOverlay = canvasOverlay;   // optionnel
        this.soundItems = [];
    }

    async loadPreset(preset) {
        if (!this.container) {
            console.warn("SamplerEngine: aucun container défini");
            return;
        }

        this.container.innerHTML = ""; // vide la grille ou container

        if (!preset || !preset.samples) return;

        // Préparer les URLs des samples
        const urls = preset.samples.map(s =>
            `http://localhost:3000/presets/${encodeURIComponent(s.url.replace(/^\.\//, ""))}`
        );

        // Charger et décoder tous les samples
        const decodedBuffers = await Promise.all(
            urls.map(url => this.loadAndDecode(url))
        );

        // Créer les SoundItem
        this.soundItems = decodedBuffers.map((buffer, i) => {
            const s = preset.samples[i];
            return new SoundItem(
                i, buffer, this.ctx, this.canvas, this.canvasOverlay, s.name
            );
        });

        // Ajouter les boutons / pads à la grille
        this.soundItems.forEach(item => item.attachTo(this.container));
    }

    async loadAndDecode(url) {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = await this.ctx.decodeAudioData(arrayBuffer);
        return buffer;
    }

    playSample(sample) {
        if (!sample || !sample.buffer) return;
        const src = this.ctx.createBufferSource();
        src.buffer = sample.buffer;
        src.connect(this.ctx.destination);
        src.start(0);
    }
}

