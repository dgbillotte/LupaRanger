/*
Primary Todos:
- clean up to some simple Vanilla standard

Features:
- X make play restart when loop-window changes
- X make loop-window drag-resizeable
- Add an effect or two
- Stretch: Enable reverse play 

*/
import {WIDTH, drawWaveform, drawSelectionWindow, initDraw } from "./draw.js";


// Audio / looper variables
let _audioCtx;
let _primaryBuffer;
let _loopBuffer;
let _looper;
let _gainNode;
let _initialized = false;

// UI / selection window variables

let _superLooper;

function init() {
    _audioCtx = new AudioContext();
    // const audioSrc = 'dope-drum-loop_C_major.wav'
    const audioSrc = 'talking.wav'
    // const audioSrc = 'sharks1.wav'
    // const audioSrc = 'dungeons.wav'
    // const audioSrc = 'bari1.wav'
    fetchLooperSourceFile(audioSrc);
    
    _superLooper = new Looper(_audioCtx);


    // volume
    _gainNode = _audioCtx.createGain();
    const volumeControl = document.querySelector('[data-action="volume"]');
    volumeControl.addEventListener('input', function() {
        _gainNode.gain.value = this.value;
    }, false);
    
    _initialized = true;
}

//------------------ Register Event Handlers -----------------------
// Button to load the audio file and initialize the
// Canvas and Audio contexts
const loadButton = document.querySelector('.file-load');
loadButton.addEventListener('click', function() {
    if(! _initialized) {
        init();
    }
});


// Button to toggle Play/Pause
const playButton = document.querySelector('.transport-play');
playButton.addEventListener('click', function() {
    if(! _initialized) {
        return; 
	}
    
	// check if context is in suspended state (autoplay policy)
	if (_audioCtx.state === 'suspended') {
        _audioCtx.resume();
	}
    
	if (this.dataset.playing === 'false') {
        // play();
        _superLooper.play();
        this.dataset.playing = 'true';
        
	} else if (this.dataset.playing === 'true') {
        // _looper.stop();
        _superLooper.stop();
		this.dataset.playing = 'false';
	}
});


//------------------ Looper Functions ------------------------------

class Looper {
    #audioContext;
    #primaryBuffer;
    #loopBuffer;
    #looper;

    constructor(audioContext, arrayBuffer=null) {
        this.#audioContext = audioContext;
        // if(arrayBuffer) {
        //     this.loadPrimaryBuffer(arrayBuffer);
        // }
    }

    play() {
        let looper = this.#audioContext.createBufferSource();
        looper.buffer = this.#loopBuffer;
        looper.connect(_gainNode).connect(this.#audioContext.destination);
        looper.loop = true;
        looper.start();
        this.#looper = looper;
    }
    
    stop() {
        this.#looper.stop();
        this.#looper = null;
    }
    
    reset() {
        if(this.#looper) {
            this.#looper.stop();
            this.play();
        }
    }
    
    reClip(start, end) {
        let startSample = start * 1.0 * this.#primaryBuffer.length / WIDTH;
        let stopSample = end * 1.0 * this.#primaryBuffer.length / WIDTH;
        this.#loopBuffer = this.createLoopBuffer(this.#primaryBuffer, startSample, stopSample-startSample);
        this.reset();
    }
    
    loadPrimaryBuffer(audioBuffer) {
        this.#primaryBuffer = audioBuffer; //this.#audioContext.decodeAudioData(arrayBuffer);
        this.#loopBuffer = this.createLoopBuffer(this.#primaryBuffer);
    }

    get primaryBufferData() {
        let audioData = new Float32Array(this.#primaryBuffer.length);
        this.#primaryBuffer.copyFromChannel(audioData, 0);
        return audioData;
    }

    /*
     * Create a new AudioBuffer for the looper.
     * While a new AudioBuffer object is created each time the clip
     * changes, it does not reload or copy the actual audio data,
     * but instead gets a new limited "view" into the primary buffer
     */
    createLoopBuffer(audioBuffer, start=0, length=0) {
        if(length === 0) {
            length = audioBuffer.length - start;
        }
    
        let share = new AudioBuffer({
            length: length,
            numberOfChannels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
            channelCount: audioBuffer.channelCount
        });
        
        for(let i=0; i < audioBuffer.numberOfChannels; i++) {
            let f32Buf = audioBuffer.getChannelData(i);
            let newf32Buf = new Float32Array(f32Buf, start, length);
            share.copyToChannel(newf32Buf, i);
        }
    
        return share;
    }
}


//------------------ File Loading & Buffer Handling ----------------

function fetchLooperSourceFile(url) {

    fetch(url)
    .then(function(response) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.blob();
    })
    .then(function(blob) {
        onFileFetched(blob);
    });
}

function onFileFetched (blob) {
    function onFileDecode (newBuffer){
        _primaryBuffer = newBuffer;
        // initDraw(_primaryBuffer, clipTheLoop);
        initDraw(_primaryBuffer, _superLooper);
        
        drawWaveform();

        _superLooper.loadPrimaryBuffer(newBuffer);
    }
    
    function onFileDecodeError (e) {
        console.log('Error decoding buffer: ' + e.message);
        console.log(e);
    }    

    var audioData = blob.arrayBuffer().then(function(audioData) {
        _audioCtx.decodeAudioData(audioData, onFileDecode, onFileDecodeError);
    });
}



