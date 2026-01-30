// samplerEngine.js
export default class SamplerEngine {
    constructor(ctx) {
        this.ctx = ctx;
        this.buffers = new Map(); // key = url
    }

    async ensureContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === "suspended") {
            await this.ctx.resume();
        }
        return this.ctx;
    }

    resolveSampleUrl(sample) {
        let url = sample.url;

        if (url.startsWith("./")) url = url.slice(1);
        if (!url.startsWith("/")) url = "/" + url;
        if (!url.startsWith("/presets/")) url = "/presets" + url;

        return `http://localhost:3000${url}`;
    }

    async loadSample(sample, onProgress) {
        await this.ensureContext()

        const url = this.resolveSampleUrl(sample);
    
        if (this.buffers.has(url)) {
            onProgress?.(1);
            return this.buffers.get(url);
        }
    
        const res = await fetch(url);
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    
        const total = Number(res.headers.get("content-length") || 0);
        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;
    
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
    
            if (total && onProgress) {
                onProgress(received / total);
            }
        }
    
        const blob = new Blob(chunks);
        const buffer = await this.ctx.decodeAudioData(await blob.arrayBuffer());
    
        this.buffers.set(url, buffer);
        onProgress?.(1);
    
        return buffer;
    }
    
    

    async play(buffer) {
        await this.ensureContext(); 
        if (!buffer) return;

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(this.ctx.destination);
        src.start();
    }
}
