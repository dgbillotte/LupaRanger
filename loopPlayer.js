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
    #envelopeNode
    #startRelease

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
            preGain: audioContext.createGain(), // *should* be able to get preGain from the loop
            envelope: loop.envelope,
            // detune: ??? maybe
        }, ...state};
    }


    /*
     * --------- Playing Related ----------------------------------------------
     */
    play(startAt=0, detune=null) {
        if(startAt == 0) {
            startAt = this.#audioContext.currentTime;
        }
        this.#player = new AudioBufferSourceNode(this.#audioContext, {
            buffer: this.#loop.audioBuffer,
            loop: true, // loopStart/End don't work without this, so need to stop after one play below
            loopStart:  this.#state.loopStart,
            loopEnd: this.#state.loopEnd,
            playbackRate: this.#state.playbackRate
        });

        this.#player.addEventListener('ended', function(event) {
            // add ended handler here to do any cleanup when a loop ends
            this.stop();
            console.log('loop ended');
        }.bind(this));
       
        
        if(detune) {
            this.#player.detune.value = detune;
        } else {
            this.#player.detune.value = this.#loop.detune;
        }

        let nodeChain = this.#player;

        this.state.preGain.gain.value = this.#loop.preGain;
        nodeChain = nodeChain.connect(this.state.preGain);
        

        const clipDuration = this.loopEnd - this.loopStart;
        let startEnvelope = () => null;
        this.#startRelease = () => null;
        if(this.#state.envelope && this.#state.envelope.type == 'adsr') {
            if(! this.#envelopeNode) {
                this.#envelopeNode = this.#audioContext.createGain();
            }
            
            const sustain = this.#state.envelope.sustain
            startEnvelope = function(startAt) {
                const attackEnd = startAt + this.#state.envelope.attack;
                const decayEnd = attackEnd + this.#state.envelope.decay;
                const releaseEnd = startAt + clipDuration;
                const releaseStart = releaseEnd - this.#state.envelope.release;
                console.log('release end: ', releaseEnd);
                this.#envelopeNode.gain
                    .setValueAtTime(0, startAt)
                    .linearRampToValueAtTime(1, attackEnd)
                    .exponentialRampToValueAtTime(sustain, decayEnd)
            }.bind(this);
                
            this.#startRelease = function(startAt) {
                const releaseEnd = startAt + clipDuration;
                const releaseStart = releaseEnd - this.#state.envelope.release;
                this.#envelopeNode.gain
                    .setValueAtTime(sustain, releaseStart)
                    .linearRampToValueAtTime(0.01, releaseEnd);
            }.bind(this);

            nodeChain = nodeChain.connect(this.#envelopeNode);
        }
        nodeChain.connect(this.#downstreamChain);


        this.#playStartSamples = Math.floor(this.#audioContext.currentTime * this.#loop.audioBuffer.sampleRate);              
        this.#player.start(startAt, this.#state.startOffset); // use the offset here to start at the right time
        startEnvelope(startAt);

        if(this.#state.loop) {
            if(this.#state.duration) {
                this.#startRelease(this.#state.duration - this.#state.envelope.release);
                this.#player.stop(this.#state.duration);

            } else {
                // do nothing, wait for stop to get called
            }
        } else {
            this.#startRelease(startAt);
            this.#player.stop(startAt + clipDuration);
            console.log('stopping at ', startAt + clipDuration, ' seconds');
        }

    }
    
    stop(stopAt=0) {
        if(this.#player) {
            // todo: if there is an envelope attached activate the release
            // and then schedule to stop at end of release
            this.#player.stop(stopAt);
            this.#player.disconnect();//this.#downstreamChain);
            this.#player = null;
        }
    }

    get detune() { return this.#player.detune; }
    
    get sampleRate() { return this.#loop.audioBuffer.sampleRate; }
    
    get sampleData() { return this.#loop.audioBuffer.getChannelData(0); }

    isPlaying() { return Boolean(this.#player); }

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

    

    /*
     * --------- Faux-Loop Interface Related ----------------------------------
     */
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

    get state() { return {...this.#state}; }

    set preGain(preGain) { this.#state.preGain.gain.value = preGain; }

    // adsr is an object with fields: attack, decay, sustain, release
    set adsr(adsr) {
        if(adsr) {
            this.#state.envelope = {
                type: 'adsr',
                ...adsr
            };
        } else {
            this.#state.envelope = {type: 'none'};
        }
    }

}