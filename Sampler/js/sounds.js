import WaveformDrawer from './waveformdrawer.js';
import { playSound } from './soundutils.js';
import { pixelToSeconds } from './utils.js';

export default class SoundItem {
    constructor(gui, index, buffer, ctx, canvas, canvasOverlay, name = `Sound ${index + 1}`) {
        this.gui = gui;
        this.index = index;
        this.buffer = buffer;
        this.ctx = ctx;
        this.canvas = canvas;
        this.canvasOverlay = canvasOverlay;
        this.name = name;

        this.waveformDrawer = new WaveformDrawer();
        //this.trimbarsDrawer = new TrimbarsDrawer(canvasOverlay, 0, canvas.width);
        this.trim = { left: 0, right: canvas.width }; // default positions
        this.button = this.#createButton();

        //this.#initMouseEvents();
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

        // sauvegarder trims de l’ancien son
        if (window.currentSound) {
            window.currentSound.saveTrim();
        }
        
        window.currentSound = this;
        
        // restaurer
        const td = this.gui.trimbarsDrawer;
        td.leftTrimBar.x  = this.trim.left;
        td.rightTrimBar.x = this.trim.right;
    
        // Clear
        const ctx2d = this.canvas.getContext("2d");
        ctx2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
        // Waveform
        this.waveformDrawer.init(this.buffer, this.canvas, "#83E83E");
        this.waveformDrawer.drawWave(0, this.canvas.height);
    
        // Trimbars
        this.gui.trimbarsDrawer.clear();
        this.gui.trimbarsDrawer.draw();
    
        // Play avec trims
        const start = pixelToSeconds(this.trim.left, this.buffer.duration, this.canvas.width);
        const end = pixelToSeconds(this.trim.right, this.buffer.duration, this.canvas.width);
        playSound(this.ctx, this.buffer, start, end);
    }
    

    saveTrim() {
        const td = this.gui.trimbarsDrawer;
        this.trim.left  = td.leftTrimBar.x;
        this.trim.right = td.rightTrimBar.x;
    }
    

    #initMouseEvents() {
        let mousePos = { x: 0, y: 0 };
    
        this.canvasOverlay.onmousemove = (evt) => {
            const rect = this.canvas.getBoundingClientRect();
            mousePos.x = evt.clientX - rect.left;
            mousePos.y = evt.clientY - rect.top;
    
            // Déplace les trim bars si drag
            this.gui.trimbarsDrawer.moveTrimBars(mousePos);
    
            // Redessine waveform + trims
            const ctx2d = this.canvas.getContext("2d");
            ctx2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.waveformDrawer.drawWave(0, this.canvas.height);
            this.gui.trimbarsDrawer.draw();
        };
    
        this.canvasOverlay.onmousedown = () => this.gui.trimbarsDrawer.startDrag();
        this.canvasOverlay.onmouseup = () => this.gui.trimbarsDrawer.stopDrag();
    }
    
}
