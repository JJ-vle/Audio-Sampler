import SamplerGUI from './samplerGUI.js';

let ctx;

window.onload = async function init() {
    ctx = new AudioContext();

    // Initialise l'interface du sampler
    const gui = new SamplerGUI(ctx);
    await gui.init();
};

