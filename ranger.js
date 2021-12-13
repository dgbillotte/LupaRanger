
export class Track {
    buffer;
    loopStart;
    loopEnd;
    playbackRate;
    clips = []

    constructor(options) {
        this.buffer = options.buffer;
        this.loopStart = options.loopStart;
        this.loopEnd = options.loopEnd;
        this.playbackRate = options.playbackRate;
    }

    addClip(start, end) {
        this.clips.push({start: start, end: end, buffer: undefined});
    }
}


export class Ranger {
    #audioContext;
    #tracks = [];
    #playInterval;
    #lengthSec

    constructor(audioContext, lengthSec=4) {
        this.#audioContext = audioContext;
        this.#lengthSec = lengthSec;
    }

    addTrack(track) {
        this.#tracks.push(track);
    }

    play() {
        this.#playInterval = setInterval(f00 => this.playBars(), this.#lengthSec*1000);
        this.playBars();
    }
    
    playBars() {
        const now = this.#audioContext.currentTime;
        for(const track of this.#tracks) {
            for(const clip of track.clips) {
                const node = new AudioBufferSourceNode(this.#audioContext, {
                    buffer: track.buffer,
                    loop: true,
                    loopStart: track.loopStart,
                    loopEnd: track.loopEnd,
                    playbackRate: track.playbackRate
                });
                console.log("playing: ", track.loopStart, track.loopEnd, now, clip.start, clip.end);
                node.connect(this.#audioContext.destination);
                node.start(now + clip.start);
                node.stop(now + clip.end);
            }
        }
    }

    stop() {
        if(this.#playInterval) {
            clearInterval(this.#playInterval);
            this.#playInterval = null;
        }
    }

}