import { WaveformView } from './waveformView.js';
import { Looper } from './looper.js'
const DISPLAY_BACKGROUND = 'rgb(0,0,0)';
const WAVEFORM_COLOR = 'rgb(255,255,255)';






export class LoopShop {
    #currentLoop = null;
    // #downstreamChain;
    #looper
    constructor(audioCtx, downstreamChain) {
        // this.#downstreamChain = downstreamChain;
        this.#looper = new Looper(audioCtx, downstreamChain);
    }

    play() {

    }

    stop() {

    }

    reset() {

    }

    get bufferData() {
        if(this.#currentLoop) {
            return this.#currentLoop.audioBuffer;
        }
        return null;
    }

    loadLoop(loop) {
        this.#currentLoop = loop;
    }
}
export class LoopShopUI {
    #htmlRoot
    #canvas
    #canvasCtx
    #loopShop
    #waveformView
    #clipped = false;
    // #isActive = false;

    constructor(htmlRoot, loopShop) {
        this.#htmlRoot = htmlRoot;
        this.#canvas = htmlRoot.querySelector('canvas.waveform');
        this.#canvas.width = this.#canvas.parentElement.offsetWidth;
        this.#canvasCtx = this.#canvas.getContext('2d');
        this.#loopShop = loopShop;
        this.#waveformView = new WaveformView(this.#canvasCtx, DISPLAY_BACKGROUND, WAVEFORM_COLOR);
        this.#wireUpUI();
    }
    
    
    loadLoop(loop) {
        this.#loopShop.loadLoop(loop);
        this.draw(loop.audioBuffer.getChannelData(0));
    }
    
    draw(bufferData) {
        const loopGain = this.loopGain;
        let data;
        if(loopGain > 1.0) {
            let clipped = false;
            data = bufferData.map(function(sample) {
                sample *= loopGain;
                if(sample > 1.0) {
                    sample = 1.0;
                    clipped = true;
                } else if(sample < -1.0) {
                    sample = -1.0;
                    clipped = true;
                }
                return sample;
            }.bind(this));
            this.#setClipped(clipped);
            
            // data = data.map(sample => sample * loopGain).map(sample => (sample <= 1.0) ? sample : 1.0);
        } else {
            data = bufferData;
        }
            
        this.#waveformView.draw(data);
    }

    get loopGain() { 
        return parseFloat(this.#htmlRoot.querySelector('#clip-gain').value);
    }

    #setClipped(clipped=true) {
        this.#clipped = clipped;
        // turn on/off the clipping light
    }

    #wireUpUI() {
        // window resize
        window.addEventListener('resize', this.#resize.bind(this));

        // clip-gain slider
        this.#htmlRoot.querySelector('#clip-gain').addEventListener('input', function(event) {
            const currentValue = this.#htmlRoot.querySelector('.clip-gain-value').value;
            if(currentValue != event.target.value) {
                this.#htmlRoot.querySelector('.clip-gain-value').value = event.target.value;
                this.draw(this.#loopShop.bufferData.getChannelData(0));
            }
        }.bind(this));
        this.#htmlRoot.querySelector('.clip-gain-value').addEventListener('input', function(event) {
            const currentValue = this.#htmlRoot.querySelector('#clip-gain').value;
            if(currentValue != event.target.value) {
                this.#htmlRoot.querySelector('#clip-gain').value = event.target.value;
                this.draw(this.#loopShop.bufferData.getChannelData(0));
                // this.draw(this.#loop.audioBuffer.getChannelData(0));
                // this.draw();
            }
        }.bind(this));



    }

    #resize() {
        this.#canvas.width = this.#canvas.parentElement.offsetWidth;
        this.draw();
    }

}