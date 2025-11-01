import WaveformDrawer from './waveformdrawer.js';
import TrimbarsDrawer from './trimbarsdrawer.js';
import { playSound } from './soundutils.js';
import { pixelToSeconds } from './utils.js';

export default class SoundItem {
    constructor(index, buffer, ctx, canvas, canvasOverlay, name = `Sound ${index + 1}`) {
        this.index = index;
        this.buffer = buffer;
        this.ctx = ctx;
        this.canvas = canvas;
        this.canvasOverlay = canvasOverlay;
        this.name = name;

        this.waveformDrawer = new WaveformDrawer();
        //this.trimbarsDrawer = new TrimbarsDrawer(canvasOverlay, 100, 200);
        //this.trim = { left: 100, right: 200 }; // default positions
        this.trimbarsDrawer = new TrimbarsDrawer(canvasOverlay, 0, canvas.width);
        this.trim = { left: 0, right: canvas.width };
        this.button = this.#createButton();

        this.#initMouseEvents();
    }

    #createButton() {
        const btn = document.createElement("button");
        btn.textContent = this.name; // use the sample name
        btn.style.margin = "4px";
        btn.onclick = () => this.onPlayClick();
        return btn;
    }

    attachTo(container) {
        container.appendChild(this.button);
    }

    onPlayClick() {
        // Sauvegarder trims de l’ancien son
        if (window.currentSound && window.currentSound !== this) {
            window.currentSound.saveTrim();
        }

        window.currentSound = this;

        // Effacer et redessiner la waveform
        const ctx2d = this.canvas.getContext("2d");
        ctx2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.waveformDrawer.init(this.buffer, this.canvas, "#83E83E");
        this.waveformDrawer.drawWave(0, this.canvas.height);

        // Restaurer trims
        this.trimbarsDrawer.leftTrimBar.x = this.trim.left;
        this.trimbarsDrawer.rightTrimBar.x = this.trim.right;

        // Convertir en secondes et jouer
        const start = pixelToSeconds(this.trim.left, this.buffer.duration, this.canvas.width);
        const end = pixelToSeconds(this.trim.right, this.buffer.duration, this.canvas.width);
        playSound(this.ctx, this.buffer, start, end);
    }

    saveTrim() {
        this.trim.left = this.trimbarsDrawer.leftTrimBar.x;
        this.trim.right = this.trimbarsDrawer.rightTrimBar.x;
    }

    #initMouseEvents() {
        let mousePos = { x: 0, y: 0 };

        this.canvasOverlay.onmousemove = (evt) => {
            const rect = this.canvas.getBoundingClientRect();
            mousePos.x = evt.clientX - rect.left;
            mousePos.y = evt.clientY - rect.top;
            this.trimbarsDrawer.moveTrimBars(mousePos);
        };

        this.canvasOverlay.onmousedown = () => this.trimbarsDrawer.startDrag();
        this.canvasOverlay.onmouseup = () => this.trimbarsDrawer.stopDrag();
    }
}
