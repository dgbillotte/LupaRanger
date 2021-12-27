import { Loop } from './ranger.js';

export class Looper {
    #audioContext;
    #primaryBuffer;
    #loop = true;
    #loopStart = 0;
    #loopEnd;
    #looper;
    #downstreamChain;
    #playbackRate = 1.0;
    #currentLoop = null;
    #playStartSamples
    
    constructor(audioContext, downstreamChain) {
        this.#audioContext = audioContext;
        this.#downstreamChain = downstreamChain;
        
        const playbackSpeedControl = document.querySelector('#looper .controls .playback-speed');
        playbackSpeedControl.addEventListener('input', function(event) {
            this.playbackRate(event.target.value);
        }.bind(this));
    }

    play() {
        this.#looper = new AudioBufferSourceNode(this.#audioContext, {
            buffer: this.#primaryBuffer,
            loop: true,
            loopStart:  this.#loopStart,
            loopEnd: this.#loopEnd,
            playbackRate: this.#playbackRate
        });
        this.#looper.connect(this.#downstreamChain);
        this.#playStartSamples = Math.floor(this.#audioContext.currentTime * this.#primaryBuffer.sampleRate);              
        this.#looper.start(0, this.#loopStart); // use the offset here to start at the right time
    }
    
    stop() {
        this.#looper.stop();
        this.#looper.disconnect(this.#downstreamChain);
        this.#looper = null;
    }

    playing() {
        return Boolean(this.#looper);
    }
    
    reset() {
        if(this.#looper) {
            this.stop();
            this.play();
        }
    }

    currentSampleIndex() {
        const nowSamples = Math.floor(this.#audioContext.currentTime * this.#primaryBuffer.sampleRate);
        const samplesSinceStart = nowSamples - this.#playStartSamples;
        const loopStartSamples = this.#loopStart * this.#primaryBuffer.sampleRate;
        const clipLengthSamples = Math.floor((this.#loopEnd * this.#primaryBuffer.sampleRate) - loopStartSamples);
        return loopStartSamples + samplesSinceStart % clipLengthSamples;
    }

    get bufferInfo() {
        return {
            samples: this.#primaryBuffer.length,
            duration: this.#primaryBuffer.duration,
            sampleRate: this.#primaryBuffer.sampleRate,
            playbackRate: this.#playbackRate,
            loopStart: this.#loopStart,
            loopEnd: this.#loopEnd,
            currentSample: this.currentSampleIndex()
        };
    }

    cutLoop() {
        const sampleRate = this.#primaryBuffer.sampleRate;
        const f32Buf = this.#primaryBuffer.getChannelData(0)
            .subarray(this.#loopStart*sampleRate, this.#loopEnd*sampleRate);
        const clippedBuffer = new AudioBuffer({
            length: f32Buf.length,
            numberOfChannels: 1,
            sampleRate: sampleRate,
        });
        clippedBuffer.copyToChannel(f32Buf, 0);
        
        const loop = new Loop(clippedBuffer, this.#playbackRate, {
            loop: this.#loop,
            loopStart: this.#loopStart,
            loopEnd: this.#loopEnd,    
        });
        return loop;
    }

    saveLoop() {
        if(! this.#currentLoop) {
            return null;
        }

        this.#currentLoop.loop = this.#loop;
        this.#currentLoop.loopStart = this.#loopStart;
        this.#currentLoop.loopEnd = this.#loopEnd;
        this.#currentLoop.playbackRate = this.#playbackRate;
        return this.#currentLoop;
    }


    reClip(start, end, width) {
        this.#loopStart = (start * 1.0 * this.#primaryBuffer.length / width) / this.#primaryBuffer.sampleRate;
        this.#loopEnd = (end * 1.0 * this.#primaryBuffer.length / width) / this.#primaryBuffer.sampleRate;
        if(this.#looper) {
            this.#looper.loopStart = this.#loopStart;
            this.#looper.loopEnd = this.#loopEnd;
        }
    }
    
    loadLoop(loop) {
        this.#currentLoop = loop;
        this.#primaryBuffer = loop.audioBuffer;
        this.#loopStart = 0;
        this.#loopEnd = loop.audioBuffer.duration;
    }

    playbackRate(playbackRate=1.0) {
        this.#playbackRate = playbackRate;
        this.#looper.playbackRate.value = playbackRate;
    }

    get primaryBufferData() {
        return this.#primaryBuffer.getChannelData(0);
    }
}


