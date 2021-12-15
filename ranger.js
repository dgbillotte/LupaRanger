import { SelectWindow } from "./select-window.js";

export class Track {
    buffer;
    playbackRate;
    clips = [];
    #activeClip


    #canvasCtx;


    constructor(options) {
        this.buffer = options.buffer;
        this.playbackRate = options.playbackRate;
    }

    setCanvas(canvas) {
        this.#canvasCtx = canvas.getContext('2d');
        this.#canvasCtx.canvas.addEventListener('mousedown', this.mouseDownHandler.bind(this));
        this.#canvasCtx.canvas.addEventListener('mouseup', this.mouseUpHandler.bind(this));
    }

    draw() {
        console.log("Track.draw()");
        this.#canvasCtx.clearRect(0, 0, this.#canvasCtx.canvas.width, this.#canvasCtx.canvas.height);
        this.#canvasCtx.fillStyle = 'rgb(32,32,32)';
        this.#canvasCtx.fillRect(0, 0, this.#canvasCtx.canvas.width, this.#canvasCtx.canvas.height);

        for(const clip of this.clips) {
            clip.draw();
        }
    }

    mouseDownHandler(event) {
        // see if it is a clip click
        for(const clip of this.clips) {
            if(clip.inSelection(event.offsetX, event.offsetY)) {
                this.#activeClip = clip;
                clip.mouseDownHandler(event);
                return;
            }
        }

        // if not, create a new clip
        let clipWindow = new SelectWindow(this.#canvasCtx, 0, 64, 1024, this.draw.bind(this), false);
        clipWindow.mouseDownHandler(event);
        this.clips.push(clipWindow);
    }

    mouseUpHandler(event) {
        if(this.#activeClip) {
            this.#activeClip.mouseUpHandler(event);
            this.#activeClip = null;
        }
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
        // add new canvas to the document
        const tmp = document.createElement('div');
        tmp.innerHTML =
            `<canvas class="track" id=track${this.#tracks.length} width=1024 height="64"></canvas>`;
        const canvas = tmp.firstChild;


        this.#trackList.appendChild(canvas);
        
        track.setCanvas(canvas);
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

                    playbackRate: track.playbackRate
                });
                node.connect(this.#audioContext.destination);
                node.start(now + clip.startScaled(this.#lengthSec), 0, clip.endScaled(this.#lengthSec));
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