import { SelectWindow} from "./select-window.js";



const MIDDLE_C = 261.63
export class Loop {
    #uuid;
    #baseFrequency
    #logBaseF
    #currentFrequency
    #centsOffset
    audioBuffer
    playbackRate
    loop
    loopStart
    loopEnd
    startOffset
    duration; // if looped, how long to play for. 0 -> infinite loop (until stop() is called)
    preGain = 1.0;
    envelope = {type:'none'};
    /*
     An ADSR might look like: {
         type: 'adsr',
         attack: 0.012,
         decay: 0.13
         sustain: 0.7
         release: 0.2
     }
     */

    
    constructor(audioBuffer, baseFrequency=MIDDLE_C, playbackRate=1, opts={}) {
        this.#uuid = crypto.randomUUID();
        this.audioBuffer = audioBuffer;
        this.playbackRate = playbackRate;
        if(this.loop = Boolean(opts.loop)) {
            this.duration = opts.duration !== undefined ? opts.duration : 0;
        }
           
        this.loopStart = opts.loopStart !== undefined ? opts.loopStart : 0;
        this.loopEnd = opts.loopEnd !== undefined ? opts.loopEnd : audioBuffer.duration;
        this.startOffset = opts.startOffset !== undefined ? opts.startOffset : this.loopStart;
        this.#calcBaseFrequency(261.63);
        this.#centsOffset = 0;
    }

    get uuid() { return this.#uuid; }
    get baseFrequency() { return this.#baseFrequency; }
    get baseLog() { return this.#logBaseF; }
    get frequency() { return this.#currentFrequency ? this.#currentFrequency : this.#baseFrequency; }
    set frequency(frequency) {
        this.#currentFrequency = frequency;
        this.#centsOffset = this.#freqToCents(frequency);
     }
     get detune() { return this.#centsOffset; }

    // default is middle C
    #calcBaseFrequency(base=0) {
        if(base > 0) {
            this.#baseFrequency = base;
        } else {
            const end = this.loopEnd > 0 ? this.loopEnd : this.audioBuffer.length;
            this.#baseFrequency = this.audioBuffer.sampleRate / (end - this.loopStart);
        }
        this.#logBaseF = Math.log(this.#baseFrequency);
    }

    #freqToCents(targetFreq) {
        return (1200/Math.LN2) * (Math.log(targetFreq) - this.#logBaseF);
    }

}

export class Track {
    #loop
    #ranger
    #canvasCtx
    #activeClip
    clips = [];
    mute = false;


    constructor(ranger, loop) {
        this.#loop = loop;
        this.#ranger = ranger;
    }

    get buffer() { return this.#loop.audioBuffer; }
    get playbackRate() { return this.#loop.playbackRate; }

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
    #downstreamChain;
    #tracks = [];
    #playInterval;
    #lengthSec;
    #trackList;
    
    constructor(audioContext, htmlRoot, downstreamChain, lengthSec=4) {
        this.#audioContext = audioContext;
        this.#downstreamChain = downstreamChain;
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
            `<div class="track" id="${trackId}">
                <div class="controls">
                    <button class="delete">Delete</button>
                    <button class="clear">Clear</button>
                    <button class="mute">Mute</button>
                </div>
                <canvas class="track" width=1024 height="64"></canvas>
            </div>
            `;
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
                    node.connect(this.#downstreamChain);
                    const start = clip.startScaled(this.#lengthSec);
                    const length = clip.endScaled(this.#lengthSec) - start;
                    node.start(now + start, 0, length);
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