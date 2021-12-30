/*
    This class is starting to grow into what I cut it out of....

    I think this needs to be two different classes:
    - one that will simply play a clip as it is configured, possibly with some
      embellishments, but with no intention of **changing** the clip. The purpose
      of this class is to produce audio, not facilitate editing
    - the above functionality plus:
      - ability to stage/audition changes to the clip:
        - loop, loopStart, loopEnd, startOffset
        - playbackRate, baseFrequency, currentFrequency
        - duration?
    - possibly one that handles specifically handles polyphonic playing 

    For now I am charging forward and letting the class grow and will get at
    this quandry later this eve...
 */


export class LoopPlayer {
    #audioContext
    #loop
    #player
    #downstreamChain
    #playStartSamples // for instrumentation if we want...
    #state = {};

    constructor(audioContext, loop, downstreamChain, state={}) {
        this.#audioContext = audioContext;
        this.#loop = loop;
        this.#downstreamChain = downstreamChain;
        this.#state = {...{
            loop: loop.loop,
            loopStart: loop.loopStart,
            loopEnd: loop.loopEnd,
            playbackRate: loop.playbackRate,
            startOffset: loop.startOffset,
            duration: loop.duration,
            preGain: audioContext.createGain(),
            envelope: null,
            // detune: ??? maybe
        }, ...state};

    }

    get loopStart() { return this.#state.loopStart; }
    set loopStart(loopStart) {
        if(this.#state.loopStart == this.#state.startOffset) {
            this.#state.startOffset = loopStart;
        }
        this.#state.loopStart = loopStart;
        if(this.#player) {
            this.#player.loopStart = loopStart;
        }
    }

    get loopEnd() { return this.#state.loopEnd; }
    set loopEnd(loopEnd) {
        this.#state.loopEnd = loopEnd;
        if(this.#player) {
            this.#player.loopEnd = loopEnd;
        }
    }
    
    get playbackRate() { return this.#state.playbackRate; }
    set playbackRate(playbackRate) {
        this.#state.playbackRate = playbackRate;
        if(this.#player) {
            this.#player.playbackRate.value = playbackRate;
        }
    }

    get loopPlay() { return this.#state.loop; }
    set loopPlay(loopPlay) {
        this.#state.loop = Boolean(loopPlay);
        if(this.#player) {
            this.#player.loop = this.#state.loop;
        }
    }

    // this is bad, um-k? this is strictly scaffolding and 
    // needs to be replaced with the proper abstraction / access
    get __loop() { return this.#loop; }

    play(startAt=0, detune=null) {
        this.#player = new AudioBufferSourceNode(this.#audioContext, {
            buffer: this.#loop.audioBuffer,
            loop: this.#state.loop,
            loopStart:  this.#state.loopStart,
            loopEnd: this.#state.loopEnd,
            playbackRate: this.#state.playbackRate
        });

        // this.#player.addEventListener('ended', function(event) {
        //     // add ended handler here to do any cleanup when a loop ends
        // });
        
        if(detune) {
            this.#player.detune.value = detune;
        } else {
            this.#player.detune.value = this.#loop.detune;
        }

        let foo = this.#player;

        this.state.preGain.gain.value = this.#loop.preGain;
        foo = foo.connect(this.state.preGain);
        

        // if(this.#loop.envelope) {
        //     foo = foo.connect(this.#loop.envelope);
        // }

        foo.connect(this.#downstreamChain);


        this.#playStartSamples = Math.floor(this.#audioContext.currentTime * this.#loop.audioBuffer.sampleRate);              
        this.#player.start(startAt, this.#state.startOffset); // use the offset here to start at the right time
        if(this.#state.duration) {
            this.#player.stop(this.#state.duration);
        }
    }

    get detune() {
        return this.#player.detune;
    }

    get state() {
        return {...this.#state};
    }

    set preGain(preGain) {
        this.#state.preGain.gain.value = preGain;
    }

    set adsr(adsr) {
        const env = this.#state.envelope;
        env.type = 'adsr';
        for(let field of ['attack', 'decay', 'sustain', 'release']) {
            const val = adsr[field];
            if(val && typeof(val) == 'number') {
                env[field] = val;
            }
        }
    }

    isPlaying() { return Boolean(this.#player); }
    
    stop(stopAt=0) {
        if(this.#player) {
            // todo: if there is an envelope attached activate the release
            // and then schedule to stop at end of release
            this.#player.stop(stopAt);
            this.#player.disconnect();//this.#downstreamChain);
            this.#player = null;
        }
    }

    // todo: this is not accurate if a startOffset other than loopStart is used.
    // it should be pretty simple to add or subtract the difference off of the beginning
    currentSampleIndex() {
        if(this.#player) {
            const sampleRate = this.#loop.audioBuffer.sampleRate;
            const nowSamples = Math.floor(this.#audioContext.currentTime * sampleRate);
            const samplesSinceStart = nowSamples - this.#playStartSamples;
            const loopStartSamples = this.#player.loopStart * sampleRate;
            const clipLengthSamples = Math.floor((this.#player.loopEnd * sampleRate) - loopStartSamples);
            return loopStartSamples + samplesSinceStart % clipLengthSamples;
        }
    }


}