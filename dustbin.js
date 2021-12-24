/*
Play Types:
- one shot:
    - loop: false
- fixed loop: loop for duration or multiple of clip length
    - duration: some number of seconds
    - overriden by: for
- forever loop: loop, no end time, must be stop()'ed 
    - forever: true
    - ignored: loop, duration

- params for all types
    - loopOffset
    - loopStart
    - loopEnd
    - playbackRate
    - startNow
*/
export class LoopPlayer {
    // #buffer
    #looper
    #startOffset
    #duration
    #downstreamChain

    constructor(audioCtx, buffer, downstreamChain, opts={}) {
        this.#buffer = buffer;
        this.#downstreamChain = downstreamChain;

        this.#looper = new AudioBufferSourceNode(audioCtx, {
            buffer: buffer,
            loop: opts.loop,
            loopStart:  opts.loopStart || 0,
            loopEnd: opts.loopEnd || 0,
            playbackRate: opts.playbackRate || 1
        });

        this.#looper.connect(downstreamChain);
        this.#startOffset = opts.startOffset || opts.loopStart;
        this.#duration = opts.duration || false;
    }
    
    play(startTime=0) {
        if(this.#duration) {
            this.#looper.start(startTime, this.#startOffset, this.#duration);
        } else {
            this.#looper.start(startTime, this.#startOffset);
        }
    }

    stop() {
        if(this.#looper) {
            this.#looper.stop();
            this.#looper.disconnect(this.#downstreamChain);
            this.#looper = null;
        }
    }

    reset() {
        
    }
}