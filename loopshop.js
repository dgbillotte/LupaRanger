import { WaveformView } from './waveformView.js';
import { Looper } from './looper.js'
import { ADSRWidget } from './adsrWidget.js'
import { LupaColors } from './colors.js'


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
    #envelope = null;
    #loop = null;
    // #isActive = false;

    constructor(htmlRoot, loopShop) {
        this.#htmlRoot = htmlRoot;
        this.#canvas = htmlRoot.querySelector('canvas.waveform');
        this.#canvas.width = this.#canvas.parentElement.offsetWidth;
        this.#canvasCtx = this.#canvas.getContext('2d');
        this.#loopShop = loopShop;
        const foreground = LupaColors.get('SHOP_WAVEFORM_COLOR');
        const background = LupaColors.get('SHOP_WAVEFORM_BACKGROUND')
        this.#waveformView = new WaveformView(this.#canvasCtx, background, foreground);
        this.#wireUpUI();
    }
    
    
    loadLoop(loop) {
        this.#loop = loop;
        this.#loopShop.loadLoop(loop);
        this.draw();
    }
    

    draw() {
        this.#drawWaveform(this.#loop.audioBuffer.getChannelData(0));
        if(this.#envelope) {
            this.#envelope.draw();
        }
    }

    #drawWaveform(bufferData) {
        let buffer = this.#applyGain(bufferData);
        buffer = this.#applyEnvelope(buffer);
        this.#waveformView.draw(buffer);
    }

    #applyGain(buffer) {
        if(this.loopGain == 1.0) {
            return buffer;
        }

        let clipped = false;
        const newBuffer = buffer.map(function(sample) {
            sample *= this.loopGain;
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
        return newBuffer;
    }

    #applyEnvelope(buffer) {
        if(! this.#envelope) {
            return buffer;
        }
        const duration = this.#loop.audioBuffer.duration;
        const pxToSamples = duration * this.#loop.audioBuffer.sampleRate / this.#canvas.width;

        // this is for an ADSR
        const sustain = this.#envelope.sustain;
        const attack = this.#envelope.attack * pxToSamples;
        const attackInc = 1.0 / attack;
        const decay = this.#envelope.decay * pxToSamples;
        const decayInc = (1.0 - sustain) / decay;
        const release = this.#envelope.release * pxToSamples;
        const releaseInc = sustain / release;
        
        let idx = 0;
        let gain = 0;
        return buffer.map(function(sample) {
            let out = sample*gain;
            // console.log('gain: ', gain);
            if(idx < attack) {
                gain += attackInc;
            } else if(idx < attack + decay) {
                gain -= decayInc;
            } else if(idx < buffer.length - release) {
                let a = 1;// gain stays the same
            } else {
                gain -= releaseInc;
            }
            idx++;
            return out;
        });
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
                this.draw();
            }
        }.bind(this));
        this.#htmlRoot.querySelector('.clip-gain-value').addEventListener('input', function(event) {
            const currentValue = this.#htmlRoot.querySelector('#clip-gain').value;
            if(currentValue != event.target.value) {
                this.#htmlRoot.querySelector('#clip-gain').value = event.target.value;
                this.draw();
            }
        }.bind(this));

        // ADSR Button
        this.#htmlRoot.querySelector('button.adsr').addEventListener('click', function() {
            if(this.#envelope) {
                this.#envelope = null;
            } else {
                this.#envelope = new ADSRWidget(this.#canvasCtx, this.draw.bind(this));
            }
            this.draw();
        }.bind(this));

    }

    #resize() {
        this.#canvas.width = this.#canvas.parentElement.offsetWidth;
        this.draw();
    }

}