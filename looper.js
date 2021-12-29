import { Loop } from './ranger.js';
import { LoopPlayer } from './loopPlayer.js';


export class Looper {
    #audioContext;
    #primaryBuffer;
    #loop = true;
    #loopStart = 0;
    #loopEnd;
    // #looper;
    #downstreamChain;
    #playbackRate = 1.0;
    #currentLoop = null;
    #playStartSamples
    #currentFrequency
    #currentDetune

    #zombies = [];

    #loopPlayer
    
    constructor(audioContext, downstreamChain) {
        this.#audioContext = audioContext;
        this.#downstreamChain = downstreamChain;
        
        const playbackSpeedControl = document.querySelector('#looper .controls .playback-speed');
        playbackSpeedControl.addEventListener('input', function(event) {
            this.playbackRate(event.target.value);
        }.bind(this));
    }

    play(playAt=0, frequency=0) {
        this.#loopPlayer = new LoopPlayer(this.#audioContext, this.#currentLoop, this.#downstreamChain);
        if(frequency > 0) {
            const detune = this.#freqToCents(frequency)
            this.#loopPlayer.play(playAt, detune);
        } else {
            this.#loopPlayer.play(playAt);
        }
    }
    

    stop(stopAt=0) {
        if(this.#loopPlayer) {
            this.#loopPlayer.stop(stopAt);
            this.#loopPlayer = null;
        }
    }

    playing() {
        return Boolean(this.#loopPlayer);
    }
    
    // tuning
    set pitch(frequency) {
        if(frequency == 0) {
            this.#currentFrequency = this.#currentLoop.baseFrequency;
            this.#currentDetune = 0;
            console.log(`BaseFreq: ${this.#currentFrequency}, cents: 0`)
        } else {
            this.#currentFrequency = frequency;
            this.#currentDetune = this.#freqToCents(frequency);
            console.log(`freq: ${frequency}, cents: ${this.#currentDetune}`)
        }
        if(this.#loopPlayer && this.#loopPlayer.isPlaying()) {
            this.#loopPlayer.detune.value = this.#currentDetune;
        }
    }

    // tuning
    #freqToCents(targetFreq) {
        return (1200/Math.LN2) * (Math.log(targetFreq) - this.#currentLoop.baseLog);
    }

    // for visualization
    currentSampleIndex() {
        const nowSamples = Math.floor(this.#audioContext.currentTime * this.#primaryBuffer.sampleRate);
        const samplesSinceStart = nowSamples - this.#playStartSamples;
        const loopStartSamples = this.#loopStart * this.#primaryBuffer.sampleRate;
        const clipLengthSamples = Math.floor((this.#loopEnd * this.#primaryBuffer.sampleRate) - loopStartSamples);
        return loopStartSamples + samplesSinceStart % clipLengthSamples;
    }

    // for visualization
    get bufferInfo() {
        return {
            samples: this.#primaryBuffer.length,
            duration: this.#primaryBuffer.duration,
            sampleRate: this.#primaryBuffer.sampleRate,
            playbackRate: this.#playbackRate,
            loopStart: this.#loopStart,
            loopEnd: this.#loopEnd,
            currentSample: this.#loopPlayer ? this.#loopPlayer.currentSampleIndex() : 0
        };
    }

    // for editing
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
        
        const loop = new Loop(clippedBuffer, 0, this.#playbackRate, {
            loop: this.#loop,
            loopStart: this.#loopStart,
            loopEnd: this.#loopEnd,    
        });
        return loop;
    }

    // for editing
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

    // for editing
    reClip(start, end, width) {
        this.#loopStart = (start * 1.0 * this.#primaryBuffer.length / width) / this.#primaryBuffer.sampleRate;
        this.#loopEnd = (end * 1.0 * this.#primaryBuffer.length / width) / this.#primaryBuffer.sampleRate;
        if(this.#loopPlayer) {
            this.#loopPlayer.loopStart = this.#loopStart;
            this.#loopPlayer.loopEnd = this.#loopEnd;
        }
    }
    
    // for editing (reloading is not needed for playing)
    loadLoop(loop) {
        this.#currentLoop = loop;
        this.#primaryBuffer = loop.audioBuffer;
        this.#loopStart = 0;
        this.#loopEnd = loop.audioBuffer.duration;
        this.#currentFrequency = loop.baseFrequency;
        this.#currentDetune = 0;
    }

    // for editing
    playbackRate(playbackRate=1.0) {
        this.#playbackRate = playbackRate;
        // this.#looper.playbackRate.value = playbackRate;
        this.#loopPlayer.playbackRate = playbackRate;
    }

    // for visualizing
    get primaryBufferData() {
        return this.#primaryBuffer.getChannelData(0);
    }
}


