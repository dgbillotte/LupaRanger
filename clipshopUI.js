import { WaveformView } from "./waveformView.js";

const DISPLAY_BACKGROUND = 'rgb(0,0,0)';
const WAVEFORM_COLOR = 'rgb(255,255,255)';

class ClipShopUI {
    #htmlRoot
    #canvas
    #canvasCtx
    #clipShop
    // #isActive = false;

    constructor(htmlRoot, clipShop) {
        this.#htmlRoot = htmlRoot;
        this.#canvas = htmlRoot.querySelector(canvas.waveform);
        this.#canvas.width = this.#canvas.parentElement.offsetWidth;
        this.#canvasCtx = this.#canvas.getContext('2d');
        this.#clipShop = clipShop;
        this.#waveformView = new WaveformView(this.#canvasCtx, this.#getWaveformBuffer.bind(this), DISPLAY_BACKGROUND, WAVEFORM_COLOR);
        window.addEventListener('resize', this.#resize.bind(this));
    }
    
    #resize() {
        this.#canvas.width = this.#canvas.parentElement.offsetWidth;
        this.draw();
    }

    draw() {
        this.#waveformView.draw(this.#clipShop.getBufferData);
    }

    // get isActive() { return this.#isActive; }
    // set isActive(isActive) { this.#isActive = Boolean(isActive); }

}