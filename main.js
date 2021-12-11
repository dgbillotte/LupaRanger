/*
Primary Todos:
- clean up to some simple Vanilla standard

Features:
- X make play restart when loop-window changes
- X make loop-window drag-resizeable
- Add an effect or two
- Stretch: Enable reverse play 

*/
import {drawDisplay, drawOscopeFrame, initDraw } from "./draw.js";
import {Looper} from "./looper.js"

// Audio / looper variables
let _audioCtx;
// let _primaryBuffer;
let _loopBuffer;
let _looper;
let _gainNode;
let _analyzerNode;
let _analyzerBuffer;
let _initialized = false;

// UI / selection window variables

let _superLooper;

function init() {
    _audioCtx = new AudioContext();
    const audioSrc = 'dope-drum-loop_C_major.wav'
    // const audioSrc = 'talking.wav'
    // const audioSrc = 'sharks1.wav'
    // const audioSrc = 'dungeons.wav'
    // const audioSrc = 'bari1.wav'

    // Gain node. Chain up any other filters/effects here
    _gainNode = _audioCtx.createGain();
    _analyzerNode = _audioCtx.createAnalyser();

    // create the looper
    _superLooper = new Looper(_audioCtx, [_analyzerNode, _gainNode]);

    // load the first file and get everything going
    fetchLooperFile(audioSrc, function(audioBuffer) {
        _superLooper.loadPrimaryBuffer(audioBuffer);
        initDraw(_superLooper);
        drawDisplay();
        // animateOscope();
    });

    // setup the data buffer for the analyzer
    _analyzerNode.fftSize = 2048*16;
    // _analyzerBuffer = new Uint8Array(_analyzerNode.frequencyBinCount);
    _analyzerBuffer = new Float32Array(_analyzerNode.frequencyBinCount);


    // connect the volume slider to the gainNode
    const volumeControl = document.querySelector('[data-action="volume"]');
    volumeControl.addEventListener('input', function() {
        _gainNode.gain.value = this.value;
    }, false);
    
    _initialized = true;
}

function animateOscope() {
    if(playButton.dataset.playing === 'true') {
        requestAnimationFrame(animateOscope);
    }
    // _analyzerNode.getByteTimeDomainData(_analyzerBuffer);
    _analyzerNode.getFloatTimeDomainData(_analyzerBuffer);
    drawOscopeFrame(_analyzerBuffer);
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
        this.dataset.playing = 'true';
        _superLooper.play();
        // animateOscope();
        
	} else if (this.dataset.playing === 'true') {
		this.dataset.playing = 'false';
        _superLooper.stop();
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