/*
Primary Todos:
- clean up to some simple Vanilla standard

Features:
- X make play restart when loop-window changes
- X make loop-window drag-resizeable
- Add an effect or two
- Stretch: Enable reverse play 
- increase/decrease playback speed


*/
import {drawDisplay, initDraw } from "./loopa-draw.js";
import {Looper} from "./looper.js"
import {Ranger, Track} from "./ranger.js"

// Audio / looper variables
let _audioCtx;
let _superLooper;
let _gainNode;
let _ranger;
let _initialized = false;
// UI / selection window variables


function init() {
    _audioCtx = new AudioContext();
    // const audioSrc = 'audio/dope-drum-loop_C_major.wav'
    // const audioSrc = 'audio/talking.wav'
    // const audioSrc = 'audio/sharks1.wav'
    // const audioSrc = 'audio/dungeons.wav'
    const audioSrc = 'audio/chirp-2secs.wav'
    // const audioSrc = 'audio/bari1.wav'

    // Gain node. Chain up any other filters/effects here
    _gainNode = _audioCtx.createGain();

    // create the looper
    _superLooper = new Looper(_audioCtx, [_gainNode]);

    // load the first file and get everything going
    fetchLooperFile(audioSrc, function(audioBuffer) {
        // _abt1 = _abt2 = audioBuffer;
        _superLooper.loadPrimaryBuffer(audioBuffer);
        initDraw(_superLooper);
        drawDisplay();
    });

    // connect the volume slider to the gainNode
    const volumeControl = document.querySelector('[data-action="volume"]');
    volumeControl.addEventListener('input', function() {
        _gainNode.gain.value = this.value;
    }, false);

    const playbackSpeed = document.querySelector('[data-action="playback-speed"]');
    playbackSpeed.addEventListener('input', function() {
        _superLooper.playbackRate(this.value);
    }, false);


    // setup the arranger
    _ranger = new Ranger(_audioCtx);



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


// Button to toggle Looper Play/Pause
const looperPlayButton = document.querySelector('.looper .transport-play');
looperPlayButton.addEventListener('click', function() {
    if(! _initialized) {
        return; 
	}
    
	// check if context is in suspended state (autoplay policy)
	if (_audioCtx.state === 'suspended') {
        _audioCtx.resume();
	}
    
	if (this.dataset.playing === 'false') {
        this.dataset.playing = 'true';
        _superLooper.play();
        
	} else if (this.dataset.playing === 'true') {
		this.dataset.playing = 'false';
        _superLooper.stop();
	}
});

// Button to add current loop as a track in ranger
let trackCount = 0;
const addTrackButton = document.querySelector('.add-track');
addTrackButton.addEventListener('click', function() {
    const loop = _superLooper.cloneLoop();
    const track = new Track(loop);
    if(trackCount == 0) {
        track.addClip(0,0.75);
        track.addClip(2, 2.25);
        track.addClip(2.5, 2.75);
    } else {
        track.addClip(1,1.75);
        track.addClip(3,3.25);
        track.addClip(3.5,3.75);
    }
    trackCount++;
    _ranger.addTrack(track);
});

// Button to toggle Ranger Play/Pause
const rangerPlayButton = document.querySelector('.ranger .transport-play');
rangerPlayButton.addEventListener('click', function() {
    if(! _initialized) {
        return; 
	}
    
	// check if context is in suspended state (autoplay policy)
	if (_audioCtx.state === 'suspended') {
        _audioCtx.resume();
	}
    
	if (this.dataset.playing === 'false') {
        this.dataset.playing = 'true';
        _ranger.play();
        
	} else if (this.dataset.playing === 'true') {
		this.dataset.playing = 'false';
        _ranger.stop();
	}
});



//------------------ File Loading & Buffer Handling ----------------

function fetchLooperFile(url, resolve) {
    return fetch(url)
    .then(function(response) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.blob();
    })
    .then(function(blob) {
        return blob.arrayBuffer().then(function(audioData) {
            _audioCtx.decodeAudioData(audioData, resolve, onFileDecodeError);
        });
    });
}

function onFileDecodeError (e) {
    console.log('Error decoding buffer: ' + e.message);
    console.log(e);
}    