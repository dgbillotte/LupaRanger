import { SelectWindow } from "./select-window.js";
import { WaveformView } from "./waveformView.js";

const DISPLAY_BACKGROUND = 'rgb(32, 32, 32)';
const WAVEFORM_COLOR = 'rgb(0, 255, 0)';
const POINTER_COLOR = 'rgb(255, 0, 0)';

export class LooperUI {
    #htmlRoot
    #canvas
    #canvasCtx
    #looper
    #waveformView
    #selection
    // #selectionOn = false;
    #selectionOn = true;


    constructor(htmlRoot, looper) {
        this.#htmlRoot = htmlRoot;
        this.#canvas = htmlRoot.querySelector('#waveform_canvas');
        this.#canvas.width = this.#canvas.parentElement.offsetWidth;
        this.#canvasCtx = this.#canvas.getContext('2d');
        this.#looper = looper;
        this.#waveformView = new WaveformView(this.#canvasCtx, DISPLAY_BACKGROUND, WAVEFORM_COLOR);
        this.#selection = new SelectWindow(this.#canvasCtx, 0, this.#canvas.height, this.#canvas.width, this.reclipHandler.bind(this));
        window.addEventListener('resize', this.#resize.bind(this));
    }

    #resize() {
        this.#canvas.width = this.#canvas.parentElement.offsetWidth;
        this.draw();
    }

    reclipHandler(start, end) {
        this.#looper.reClip(start, end, this.#canvasCtx.canvas.width);
        this.setLooperHeader();
        this.draw();
    }

    play() {
        this.#looper.play();
        this.playAnimation();
    }

    stop() {
        this.#looper.stop();
    }

    loadPrimaryBuffer(buffer, name) {
        this.#looper.loadPrimaryBuffer(buffer);
        this.setLooperHeader();
        this.draw();
    }

    setLooperHeader() {
        const header = this.#htmlRoot.querySelector('.module-info');
        const sourceInfo = this.#looper.bufferInfo;
        header.querySelector('.length .samples').innerHTML = sourceInfo.samples;
        header.querySelector('.length .seconds').innerHTML = sourceInfo.duration.toFixed(3);
        if(this.#selection.endScaled() - this.#selection.startScaled() == 0) {
            header.querySelector('.select-start .samples').innerHTML = '--';
            header.querySelector('.select-start .seconds').innerHTML = '--';
            header.querySelector('.select-length .samples').innerHTML = '--';
            header.querySelector('.select-length .seconds').innerHTML = '--';
        } else {
            header.querySelector('.select-start .samples').innerHTML = Math.floor(sourceInfo.loopStart * sourceInfo.sampleRate);
            header.querySelector('.select-start .seconds').innerHTML = sourceInfo.loopStart.toFixed(3);
            header.querySelector('.select-length .samples').innerHTML = Math.floor((sourceInfo.loopEnd - sourceInfo.loopStart) * sourceInfo.sampleRate);
            header.querySelector('.select-length .seconds').innerHTML = (sourceInfo.loopEnd - sourceInfo.loopStart).toFixed(3);
        }
    }

    // setClipInfo() {

    // }

    draw() {
        this.#waveformView.draw(this.#looper.primaryBufferData);
        if(this.#selectionOn) {
            this.#selection.draw();
        }
        if(this.#looper.playing()) {
            this.drawPointer();
        }
    }

    playAnimation() {
        if(this.#looper.playing()) {
            this.draw();
            window.requestAnimationFrame(this.playAnimation.bind(this));
        }
    }

    drawPointer() {
        const loopInfo = this.#looper.bufferInfo;
        const px = this.#canvas.width * loopInfo.currentSample * 1.0 / loopInfo.samples;

        this.#canvasCtx.lineWidth = 1;
        this.#canvasCtx.strokeStyle = POINTER_COLOR;
        this.#canvasCtx.beginPath();

        this.#canvasCtx.moveTo(px, 0);
        this.#canvasCtx.lineTo(px, this.#canvas.height);
        this.#canvasCtx.stroke();
    }

    // set selectionOn(on) {
    //     this.#selectionOn = on;
    // }

    // drawWaveform(waveData) {
    //     const width = this.#canvasCtx.canvas.width;
    //     const height = this.#canvasCtx.canvas.height;
    //     this.#canvasCtx.clearRect(0, 0, width, height);
        
    //     this.#canvasCtx.fillStyle = DISPLAY_BACKGROUND;  
    //     this.#canvasCtx.fillRect(0, 0, width, height);
        
    //     this.#canvasCtx.lineWidth = 1;
    //     this.#canvasCtx.strokeStyle = WAVEFORM_COLOR;
    //     this.#canvasCtx.beginPath();
        
    //     const sliceWidth = width * 1.0 / waveData.length;
    //     let x = 0;
        
    //     const center = height / 2;
    //     for(let i = 0; i < waveData.length; i++) {
    //         const y = center + (waveData[i] * center);
            
    //         if(i === 0) {
    //             this.#canvasCtx.moveTo(x, y);
    //         } else {
    //             this.#canvasCtx.lineTo(x, y);
    //         }
            
    //         x += sliceWidth;
    //     }
        
    //     this.#canvasCtx.lineTo(width, height/2);
    //     this.#canvasCtx.stroke();
    // }
}