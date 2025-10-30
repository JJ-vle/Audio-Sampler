import SamplerGUI from './samplerGUI.js';

let ctx;

document.querySelector("#startButton").onclick = () => {
    if (!ctx) ctx = new AudioContext();
};

window.onload = async function init() {
    ctx = new AudioContext();

    // Initialise l'interface du sampler
    const gui = new SamplerGUI(ctx);
    await gui.init();
};

