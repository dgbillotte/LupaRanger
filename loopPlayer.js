export class LoopPlayer {
    #audioContext
    #loop
    #player
    #downstreamChain
    #playStartSamples // for instrumentation if we want...

    constructor(audioContext, loop, downstreamChain) {
        this.#audioContext = audioContext;
        this.#loop = loop;
        this.#downstreamChain = downstreamChain;
    }

    get loopStart() { return this.#player.loopStart; }
    set loopStart(loopStart) { this.#player.loopStart = loopStart; }
    get loopEnd() { return this.#player.loopEnd; }
    set loopEnd(loopEnd) { this.#player.loopEnd = loopEnd; }
    get playbackRate() { return this.#player.playbackRate.value; }
    set playbackRate(playbackRate) { this.#player.playbackRate.value = playbackRate; }

    play(startAt=0, detune=null) {
        this.#player = new AudioBufferSourceNode(this.#audioContext, {
            buffer: this.#loop.audioBuffer,
            loop: this.#loop.loop,
            loopStart:  this.#loop.loopStart,
            loopEnd: this.#loop.loopEnd,
            playbackRate: this.#loop.playbackRate
        });
        
        if(detune) {
            this.#player.detune.value = detune;
        } else {
            this.#player.detune.value = this.#loop.detune;
        }

        this.#player.connect(this.#downstreamChain);
        this.#playStartSamples = Math.floor(this.#audioContext.currentTime * this.#loop.audioBuffer.sampleRate);              
        this.#player.start(startAt, this.#loop.startOffset); // use the offset here to start at the right time
        if(this.#loop.duration) {
            this.#player.stop(this.#loop.duration);
        }
    }

    get detune() {
        return this.#player.detune;
    }

    isPlaying() { return Boolean(this.#player); }
    
    stop(stopAt=0) {
        if(this.#player) {
            // todo: if there is an envelope attached active the release
            // and then schedule to stop at end of release
            this.#player.stop(stopAt);
            this.#player.disconnect(this.#downstreamChain);
            this.#player = null;
        }
    }

    // todo: this is not accurate if a startOffset other than loopStart is used.
    // it should be pretty simple to add or subtract the difference off of the beginning
    currentSampleIndex() {
        if(this.#player) {
            const nowSamples = Math.floor(this.#audioContext.currentTime * this.#loop.audioBuffer.sampleRate);
            const samplesSinceStart = nowSamples - this.#playStartSamples;
            const loopStartSamples = this.#player.loopStart * this.#loop.audioBuffer.sampleRate;
            const clipLengthSamples = Math.floor((this.#player.loopEnd * this.#loop.audioBuffer.sampleRate) - loopStartSamples);
            return loopStartSamples + samplesSinceStart % clipLengthSamples;
        }
    }


}