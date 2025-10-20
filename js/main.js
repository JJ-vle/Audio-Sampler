import { loadAndDecodeSound } from './soundutils.js';
import SoundItem from './sounds.js';

let ctx;
document.querySelector("#startButton").onclick = () => {
    if (!ctx) ctx = new AudioContext();
};
let presets = [];
let container, canvas, canvasOverlay, presetSelect;
let soundItems = [];


window.onload = async function init() {
    ctx = new AudioContext();

    canvas = document.querySelector("#myCanvas");
    canvasOverlay = document.querySelector("#myCanvasOverlay");
    container = document.querySelector("#buttonContainer");
    presetSelect = document.querySelector("#presetSelect");

    // Fetch presets from server
    const response = await fetch("http://localhost:3000/api/presets");
    presets = await response.json();

    presets.forEach((preset, index) => {
        const opt = document.createElement("option");
        opt.value = index;
        opt.textContent = preset.name || `Preset ${index + 1}`;
        presetSelect.appendChild(opt);
    });

    //await loadPreset(0);

    // Dropdown change listener
    presetSelect.addEventListener("change", async (e) => {
        const index = parseInt(e.target.value);
        await loadPreset(index);
    });

    // Animate trim bars if needed
    function animate() {
        requestAnimationFrame(animate);
        if (window.currentSound) {
            window.currentSound.trimbarsDrawer.clear();
            window.currentSound.trimbarsDrawer.draw();
        }
    }
    animate();
};

async function loadPreset(index) {
    const preset = presets[index];
    if (!preset) return;

    container.innerHTML = ""; // vide les anciens boutons

    // Génère les URLs correctes avec encodeURIComponent
    const soundURLs = preset.samples.map(s => 
        `http://localhost:3000/presets/${encodeURIComponent(s.url.replace(/^\.\//, ''))}`
    );
    const decodedSounds = await loadAndDecodeSound(soundURLs, ctx);

    // Crée les SoundItem pour chaque sample
    soundItems = decodedSounds.map(
        (buffer, i) => new SoundItem(i, buffer, ctx, canvas, canvasOverlay, preset.samples[i].name)
    );

    soundItems.forEach(item => item.attachTo(container));
}

