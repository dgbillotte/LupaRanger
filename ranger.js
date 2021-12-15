import { SelectWindow } from "./select-window.js";

export class Track {
    #ranger;
    #canvasCtx;
    #activeClip
    buffer;
    playbackRate;
    clips = [];
    mute = false;


    constructor(ranger, options) {
        this.#ranger = ranger;
        this.buffer = options.buffer;
        this.playbackRate = options.playbackRate;
    }

    setCanvas(canvas) {
        this.#canvasCtx = canvas.getContext('2d');
        this.#canvasCtx.canvas.addEventListener('mousedown', this.mouseDownHandler.bind(this));
        this.#canvasCtx.canvas.addEventListener('mouseup', this.mouseUpHandler.bind(this));
    }
    
    setHTML(block) {
        let canvas = block.querySelector('canvas');
        this.#canvasCtx = canvas.getContext('2d');

        canvas.addEventListener('mousedown', this.mouseDownHandler.bind(this));
        canvas.addEventListener('mouseup', this.mouseUpHandler.bind(this));
        block.querySelector('button.delete').addEventListener('click', this.deleteHandler.bind(this));
        block.querySelector('button.clear').addEventListener('click', this.clearHandler.bind(this));
        block.querySelector('button.mute').addEventListener('click', this.muteHandler.bind(this));
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
        let start = event.offsetX;
        let length = Math.floor(this.#canvasCtx.canvas.width * this.buffer.length / (this.#ranger.lengthSec * this.buffer.sampleRate));
        let clipWindow = new SelectWindow(this.#canvasCtx, 0, 64, 1024, this.draw.bind(this), false);
        clipWindow.startEnd({start: start, end: start+length})
        // clipWindow.mouseDownHandler(event);
        this.clips.push(clipWindow);
    }

    mouseUpHandler(event) {
        if(this.#activeClip) {
            this.#activeClip.mouseUpHandler(event);
            this.#activeClip = null;
        }
    }

    deleteHandler(event) {
        event.path[2].remove()
        this.#ranger.deleteTrack(this);
    }
    
    clearHandler() {
        this.clips = [];
        this.draw();
    }
    
    muteHandler() {
        this.mute = ! this.mute;
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
    
    get lengthSec() {
        return this.#lengthSec 
    }

    createTrack(opts) {
        let track = new Track(this, opts);
        this.addTrack(track);
    }

    addTrack(track) {
        // add new canvas to the document
        const trackId = 'track' + this.#tracks.length;
        const tmp = document.createElement('div');
        tmp.innerHTML =
        `<div class="track" id=${trackId}>
            <div class="controls">
                <button class="delete">Delete</button>
                <button class="clear">Clear</button>
                <button class="mute">Mute</button>
            </div>
            <canvas class="track" width=1024 height="64"></canvas>
        </div>`;
        const trackHTML = tmp.firstChild;


        this.#trackList.appendChild(trackHTML);
        
        track.setHTML(trackHTML);
        this.#tracks.push(track);
    }

    deleteTrack(track) {
        const idx = this.#tracks.indexOf(track);
        this.#tracks.splice(idx, 1);


    }

    play() {
        this.#playInterval = setInterval(f00 => this.playBars(), this.#lengthSec*1000);
        this.playBars();
    }
    
    playBars() {
        const now = this.#audioContext.currentTime;
        for(const track of this.#tracks) {
            if(! track.mute) {
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
    }

    stop() {
        if(this.#playInterval) {
            clearInterval(this.#playInterval);
            this.#playInterval = null;
        }
    }

}