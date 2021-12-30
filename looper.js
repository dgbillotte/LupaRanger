import { Loop } from './ranger.js';
import { LoopPlayer } from './loopPlayer.js';


export class Looper {
    #audioContext;
    #primaryBuffer;
    #loop = true;
    #loopStart = 0;
    #loopEnd;
    #downstreamChain;
    #playbackRate = 1.0;
    #currentLoop = null;
    #playStartSamples
    #currentFrequency
    #currentDetune

    #playingLoops =  new Map();

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
        if(frequency > 0) {
            const detune = this.#freqToCents(frequency);
            const lpState = this.#loopPlayer ? this.#loopPlayer.state : {};
            const loopPlayer = new LoopPlayer(this.#audioContext, this.#currentLoop, this.#downstreamChain, lpState);
            loopPlayer.play(playAt, detune);
            const alreadyPlaying = this.#playingLoops.get(frequency);
            if(alreadyPlaying) {
                alreadyPlaying.stop();
            }
            this.#playingLoops.set(frequency, loopPlayer);
        } else {
            this.#loopPlayer.play(playAt);
        }
    }
    
    /*
     There are essentially two play modes:
     - no frequency given, start and continue playing until stop button is pressed
     - if frequency provided, (polyphonic mode?) create a short-lived player for
       each frequency (key-press).
     - frequency provided could also be monophonic, always playing the last pitch it received, meh...
     */
    stop(stopAt=0, frequency=0) {
        if(this.#loopPlayer) {
            if(frequency) {
                const player = this.#playingLoops.get(frequency);
                if(player) {
                    player.stop(stopAt);
                    this.#playingLoops.delete(frequency);
                }
            } else {
                this.#loopPlayer.stop(stopAt);
            }
        }
    }

    playing() {
        return Boolean(this.#loopPlayer && this.#loopPlayer.isPlaying());
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

    get loopPlayer() { return this.#loopPlayer; }

    // tuning
    #freqToCents(targetFreq) {
        return (1200/Math.LN2) * (Math.log(targetFreq) - this.#currentLoop.baseLog);
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
        this.#loopPlayer = new LoopPlayer(this.#audioContext, this.#currentLoop, this.#downstreamChain);
    }

    // for editing
    playbackRate(playbackRate=1.0) {
        this.#playbackRate = playbackRate;
        this.#loopPlayer.playbackRate = playbackRate;
    }

    // for visualizing
    get primaryBufferData() {
        return this.#primaryBuffer.getChannelData(0);
    }
}


