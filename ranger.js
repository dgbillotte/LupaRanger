import { SelectWindow } from "./select-window.js";

export class Track {
    buffer;
    // loopStart=0;
    // loopEnd=0;
    playbackRate;
    clips = [];

    #canvasCtx;


    constructor(options) {
        this.buffer = options.buffer;
        // this.loopStart = options.loopStart;
        // this.loopEnd = options.loopEnd;
        this.playbackRate = options.playbackRate;
    }

    setCanvas(canvas) {
        this.#canvasCtx = canvas.getContext('2d');
        this.#canvasCtx.canvas.addEventListener('mousedown', this.mouseDownHandler.bind(this));
    }


    mouseDownHandler(event) {
        // see if it is a clip click

        // if not, create a new clip
        // - create a select window, then call it's mouseDown handler
        let clipWindow = new SelectWindow(this.#canvasCtx, 0, 64, 1024);
        clipWindow.mouseDownHandler(event);
        this.clips.push(clipWindow);
    }
}


export class Ranger {
    #audioContext;
    #tracks = [];
    #playInterval;
    #lengthSec;
    #trackList;

    constructor(audioContext, htmlRoot, lengthSec=4) {
        this.#audioContext = audioContext;
        this.#lengthSec = lengthSec;
        this.#trackList = htmlRoot.querySelector('.tracklist');
    }

    addTrack(track) {
        this.#tracks.push(track);

        // add canvas element to html
        let canvas = document.createElement('canvas');
        canvas.width=1024;
        canvas.height=64;
        canvas.classList.add('track');
        canvas.id = 'track' + this.#tracks.length;
        this.#trackList.appendChild(canvas);

        track.setCanvas(canvas);

        // wire up the event handlers for the track
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
                    // loop: true,
                    // loopStart: 0,
                    // loopEnd: track.buffer.length,
                    playbackRate: track.playbackRate
                });
                // console.log("playing: ", track.loopStart, track.loopEnd, now, , clip.end(track.buffer.length));
                node.connect(this.#audioContext.destination);
                // console.log("Bar Time: ", now, clip.startScaled(this.#lengthSec), clip.endScaled(this.#lengthSec));
                node.start(now + clip.startScaled(this.#lengthSec));
                node.stop(now + clip.endScaled(this.#lengthSec));
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