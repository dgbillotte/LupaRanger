import { WaveformView } from './waveformView.js';
import { Looper } from './looper.js'
import { ADSRWidget } from './adsrWidget.js'
import { LupaColors } from './colors.js'


// export class LoopShop {
//     audioCtx
//     #currentLoop = null;
//     // #downstreamChain;
//     #looper
//     constructor(audioCtx, downstreamChain) {
//         this.audioCtx = audioCtx;
//         // this.#downstreamChain = downstreamChain;
//     }
// }
export class LoopShopUI {
    #htmlRoot
    #canvas
    #canvasCtx
    #waveformView
    #clipped = false;
    #envelope = null;
    #loopPlayer = null
    // #isActive = false;

    constructor(htmlRoot) {
        this.#htmlRoot = htmlRoot;
        this.#canvas = htmlRoot.querySelector('canvas.waveform');
        this.#canvas.width = this.#canvas.parentElement.offsetWidth;
        this.#canvasCtx = this.#canvas.getContext('2d');
        const foreground = LupaColors.get('SHOP_WAVEFORM_COLOR');
        const background = LupaColors.get('SHOP_WAVEFORM_BACKGROUND')
        this.#waveformView = new WaveformView(this.#canvasCtx, background, foreground);
        this.#wireUpUI();
    }
    

    loadLoop(loopPlayer) {
        this.#loopPlayer = loopPlayer;
        this.draw();
    }
    

    draw() {
        this.#drawWaveform(this.#loopPlayer.sampleData);
        if(this.#envelope) {
            this.#envelope.draw();
        }
    }

    #drawWaveform(bufferData) {
        let buffer = this.#applyGain(bufferData);
        buffer = this.#applyEnvelope(buffer);
        // calculate start/stop
        const sampleRate = this.#loopPlayer.sampleRate
        const start = Math.floor(this.#loopPlayer.loopStart * sampleRate);
        const length = Math.floor((this.#loopPlayer.loopEnd * sampleRate) - start);
        this.#waveformView.draw(buffer, start, length);
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

    // createProcessingNodes() {
    //     return function(startTime) {
    //         const gain = this.createGainNode();
    //         const adsr = this.createADSRNode(startTime);
    //         gain.connect(adsr);
            
    //         // return gain;
    //     }.bind(this);
    // }
    
    // createGainNode() {
    //     const gain = this.#loopShop.audioCtx.createGain();
    //     gain.gain.value = this.loopGain;
    //     return gain;
    // }

    get adsrParams() {
        const duration = this.#loopPlayer.loopEnd - this.#loopPlayer.loopStart;
        const pxToSecs = duration / this.#canvas.width;
        
        const sustain = this.#envelope.sustain;
        const attackLength = this.#envelope.attack * pxToSecs;
        const decayLength = this.#envelope.decay * pxToSecs;
        const releaseLength = this.#envelope.release * pxToSecs;

        return {
            type: 'adsr',
            attack: attackLength,
            decay: decayLength,
            sustain: sustain,
            release: releaseLength
        }
    }

    #applyEnvelope(buffer) {
        if(! this.#envelope) {
            return buffer;
        }
        const duration = this.#loopPlayer.loopEnd - this.#loopPlayer.loopStart;
        const sampleRate = this.#loopPlayer.sampleRate;
        const pxToSamples = duration * sampleRate / this.#canvas.width;

        // this is for an ADSR
        const start = Math.floor(this.#loopPlayer.loopStart * sampleRate);
        const end = Math.floor(this.#loopPlayer.loopEnd * sampleRate);

        const sustain = this.#envelope.sustain;
        
        const attackLength = this.#envelope.attack * pxToSamples;
        const attackEnd = start + attackLength;
        const attackInc = 1.0 / attackLength;

        const decayLength = this.#envelope.decay * pxToSamples;
        const decayEnd = attackEnd + decayLength;
        const decayInc = (1.0 - sustain) / decayLength;
        
        const releaseLength = this.#envelope.release * pxToSamples;
        const releaseStart = end - releaseLength;
        const releaseInc = sustain / releaseLength;

        let idx = 0;
        let gain = 0;
        return buffer.map(function(sample) {
            let out = sample;
            if(idx >= start && idx < end) {
                out *= gain;
                if(idx < attackEnd) {
                    gain += attackInc;
                } else if(idx < decayEnd) {
                    gain -= decayInc;
                } else if(idx < releaseStart) {
                    let a = 1;// gain stays the same
                } else {
                    gain -= releaseInc;
                }
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

        // clip-gain slider/text-box
        this.#wireUpClipGain();

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

    #onEnvelopeChange(event) {
        this.#loopPlayer.adsr = this.adsrParams();
        this.draw();
    }

    #wireUpClipGain() {
        this.#htmlRoot.querySelector('#clip-gain').addEventListener('input', function(event) {
            const currentValue = this.#htmlRoot.querySelector('.clip-gain-value').value;
            if(currentValue != event.target.value) {
                this.#htmlRoot.querySelector('.clip-gain-value').value = event.target.value;
                this.draw();
                this.#loopPlayer.preGain = parseFloat(event.target.value);
            }
        }.bind(this));
        this.#htmlRoot.querySelector('.clip-gain-value').addEventListener('input', function(event) {
            const currentValue = this.#htmlRoot.querySelector('#clip-gain').value;
            if(currentValue != event.target.value) {
                this.#htmlRoot.querySelector('#clip-gain').value = event.target.value;
                this.draw();
                this.#loopPlayer.preGain = parseFloat(event.target.value);
            }
        }.bind(this));
    }

    #resize() {
        this.#canvas.width = this.#canvas.parentElement.offsetWidth;
        this.draw();
    }

}