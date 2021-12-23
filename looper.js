import { Clip } from './ranger.js';

export class Looper {
    #audioContext;
    #primaryBuffer;
    #loopStart = 0;
    #loopEnd;
    #looper;
    #downstreamChain;
    #playbackRate = 1.0;
    #playStartTime;
    #playLastTime;
    #pointerIdx;

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
        this.#playStartTime = this.#playLastTime = this.#audioContext.currentTime;
        this.#playStartSamples = Math.floor(this.#audioContext.currentTime * this.#primaryBuffer.sampleRate);
        this.#pointerIdx = this.#loopStart;
                
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

    cloneLoop() {
        // "copy" the selection from the primaryBuffer
        const sampleRate = this.#primaryBuffer.sampleRate;
        const f32Buf = this.#primaryBuffer.getChannelData(0)
            .subarray(this.#loopStart*sampleRate, this.#loopEnd*sampleRate);
        const clippedBuffer = new AudioBuffer({
            length: f32Buf.length,
            numberOfChannels: 1,
            sampleRate: sampleRate,
        });
        clippedBuffer.copyToChannel(f32Buf, 0);
        return new Clip(clippedBuffer, this.#playbackRate);
    }

    reClip(start, end, width) {
        this.#loopStart = (start * 1.0 * this.#primaryBuffer.length / width) / this.#primaryBuffer.sampleRate;
        this.#loopEnd = (end * 1.0 * this.#primaryBuffer.length / width) / this.#primaryBuffer.sampleRate;
        if(this.#looper) {
            this.#looper.loopStart = this.#loopStart;
            this.#looper.loopEnd = this.#loopEnd;
        }
    }
    
    loadPrimaryBuffer(audioBuffer) {
        this.#primaryBuffer = audioBuffer;
        this.#loopStart = 0;
        this.#loopEnd = audioBuffer.duration;
    }

    playbackRate(playbackRate=1.0) {
        this.#playbackRate = playbackRate;
        this.#looper.playbackRate.value = playbackRate;
    }

    get primaryBufferData() {
        return this.#primaryBuffer.getChannelData(0);
    }
    

    // get loopBufferData() {
    //     let audioData = new Float32Array(this.#loopBuffer.length);
    //     this.#loopBuffer.copyFromChannel(audioData, 0);
    //     return audioData;
    // }

    /*
     * Create a new AudioBuffer for the looper.
     * While a new AudioBuffer object is created each time the clip
     * changes, it does not reload or copy the actual audio data,
     * but instead gets a new limited "view" into the primary buffer
     */
    // createLoopBuffer(start=0, length=0) {
    //     if(length === 0) {
    //         length = this.#primaryBuffer.length - start;
    //     }
    
    //     let share = new AudioBuffer({
    //         length: length,
    //         numberOfChannels: this.#primaryBuffer.numberOfChannels,
    //         sampleRate: this.#primaryBuffer.sampleRate,
    //         channelCount: this.#primaryBuffer.channelCount
    //     });
        
    //     for(let i=0; i < this.#primaryBuffer.numberOfChannels; i++) {
    //         let f32Buf = this.#primaryBuffer.getChannelData(i);
    //         let newf32Buf = new Float32Array(f32Buf.buffer, start*4, length);
    //         // console.log("createLoopBuffer: ", start, length);
    //         share.copyToChannel(newf32Buf, i);
    //     }
    
    //     return share;
    // }
}


