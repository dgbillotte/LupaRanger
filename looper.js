/*
Primary Todos:
- clean up to some simple Vanilla standard

Features:
- X make play restart when loop-window changes
- X make loop-window drag-resizeable
- Add an effect or two
- Stretch: Enable reverse play 

*/


// Hacks to deal with different function names in different browsers
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function(callback, element){
            window.setTimeout(callback, 1000 / 60);
            };
})();

// Audio / looper variables
// for cross browser
const AudioContext = window.AudioContext || window.webkitAudioContext;

let _audioCtx;
let _primaryBuffer;
let _loopBuffer;
let _looper;
let _gainNode;
let _initialized = false;

// UI / selection window variables
let _canvasCtx;
const WIDTH = 1024;
const HEIGHT = 256;
let _mouseDownX = 0;
let _mouseMoveX = 0;
let _clipSelection = null; 


function init() {
    _canvasCtx = waveformCanvas.getContext("2d");
    
    _audioCtx = new AudioContext();
    // var audioSrc = 'dope-drum-loop_C_major.wav'
    // var audioSrc = 'talking.wav'
    // var audioSrc = 'sharks1.wav'
    var audioSrc = 'dungeons.wav'
    // var audioSrc = 'bari1.wav'
    fetchFile(audioSrc, onFileFetched)
    
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
        play();
        this.dataset.playing = 'true';
        
	} else if (this.dataset.playing === 'true') {
        _looper.stop();
		this.dataset.playing = 'false';
	}
    
});

const waveformCanvas = document.getElementById("waveform_canvas");
waveformCanvas.addEventListener('mousedown', mouseDownHandler);
waveformCanvas.addEventListener('mouseup', mouseUpHandler);


//------------------ Click handling for the selection window -------


function mouseDownHandler(event) {
    _mouseDownX = event.offsetX
    
    if(_clipSelection) {
        if(inLeftHandle(event.offsetX, event.offsetY)) {
            waveformCanvas.addEventListener('mousemove', editSelectionLeftMouseMove);
        } else if(inRightHandle(event.offsetX, event.offsetY)) {
            waveformCanvas.addEventListener('mousemove', editSelectionRightMouseMove);
        } else {
            // might be cool to slide the whole window...
        }
        
    } else {
        waveformCanvas.addEventListener('mousemove', createSelectionMouseMove);
    }
}

function mouseUpHandler(event) {
    waveformCanvas.removeEventListener('mousemove', createSelectionMouseMove);
    waveformCanvas.removeEventListener('mousemove', editSelectionLeftMouseMove);
    waveformCanvas.removeEventListener('mousemove', editSelectionRightMouseMove);
    
    if(! _clipSelection) {
        _clipSelection = {
            start: _mouseDownX,
            end: _mouseMoveX
        }
    }
    
    clipTheLoop();
    resetLooper();
}

function createSelectionMouseMove(event) {
    _mouseMoveX = event.offsetX <= WIDTH ? event.offsetX : WIDTH;
    updateSelectionWindow(_mouseDownX, _mouseMoveX);
}

let editSelectionLeftMouseMove = function(event) {
    _clipSelection['start'] = event.offsetX <= WIDTH ? event.offsetX : WIDTH;
    updateSelectionWindow(_clipSelection['start'], _clipSelection['end']);
}

let editSelectionRightMouseMove = function(event) {
    _clipSelection['end'] = event.offsetX <= WIDTH ? event.offsetX : WIDTH;
    updateSelectionWindow(_clipSelection['start'], _clipSelection['end']);
}

function updateSelectionWindow(start, stop) {
    drawWaveform();
    drawSelectionWindow(start, stop);
}

function inLeftHandle(x,y) {
    return (
        x >= _clipSelection.start-10 &&
        x <= _clipSelection.start+10 &&
        y >= HEIGHT/2-25 &&
        y <= HEIGHT/2+25);
    }
    
function inRightHandle(x,y) {
    return (
        x >= _clipSelection.end-10 &&
        x <= _clipSelection.end+10 &&
        y >= HEIGHT/2-25 &&
        y <= HEIGHT/2+25);
}


//------------------ Draw Functions -----------------------
function drawWaveform() {
    
    var waveData = new Float32Array(_primaryBuffer.length);
    _primaryBuffer.copyFromChannel(waveData, 0);
    
    _canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    
    _canvasCtx.fillStyle = 'rgb(64, 64, 64)';
    _canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
    _canvasCtx.lineWidth = 2;
    _canvasCtx.strokeStyle = 'rgb(0,255,0)';
    _canvasCtx.beginPath();
    
    var sliceWidth = WIDTH * 1.0 / _primaryBuffer.length;
    var x = 0;
    
    var center = HEIGHT / 2;
    for(var i = 0; i < _primaryBuffer.length; i++) {
        var y = center + (waveData[i] * center);
        
        if(i === 0) {
            _canvasCtx.moveTo(x, y);
        } else {
            _canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
    }
    
    _canvasCtx.lineTo(WIDTH, HEIGHT/2);
    _canvasCtx.stroke();
}

function drawSelectionWindow(start, stop) {
    selectWidth = stop - start;

    _canvasCtx.lineWidth = 2;
    _canvasCtx.strokeStyle = 'rgb(255,255,0)';
    _canvasCtx.fillStyle = 'rgba(255, 0, 0, 0.25)';
    _canvasCtx.fillRect(start, 0, selectWidth, HEIGHT);
    _canvasCtx.strokeRect(start, 0, selectWidth, HEIGHT);
    
    _canvasCtx.fillStyle = 'rgb(255, 0, 0)';
    startY = HEIGHT/2 - 25;
    _canvasCtx.fillRect(start-10, startY, 20, 50);
    _canvasCtx.fillRect(stop-10, startY, 20, 50);
}

//------------------ Looper Functions ------------------------------

function clipTheLoop() {
    let startSample = _clipSelection.start * 1.0 * _primaryBuffer.length / WIDTH;
    let stopSample = _clipSelection.end * 1.0 * _primaryBuffer.length / WIDTH;
    _loopBuffer = createLoopBuffer(_primaryBuffer, startSample, stopSample-startSample);
}

function play() {
    _looper = _audioCtx.createBufferSource();
    _looper.buffer = _loopBuffer;
    _looper.connect(_gainNode).connect(_audioCtx.destination);
    _looper.loop = true;
    _looper.start();
}

function resetLooper() {
    if(playButton.dataset.playing === 'true') {
        _looper.stop();
        play();
    }
}

//------------------ File Loading & Buffer Handling ----------------

function fetchFile (url, resolve) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function () { resolve(request) }
    request.send()
}

function onFileFetched (request) {
    function onFileDecode (newBuffer){
        _primaryBuffer = newBuffer;
        drawWaveform(_primaryBuffer);
        _loopBuffer = createLoopBuffer(_primaryBuffer);
    }
    
    function onFileDecodeError (e) {
        console.log('Error decoding buffer: ' + e.message);
        console.log(e);
    }    
    
    var audioData = request.response;
    _audioCtx.decodeAudioData(audioData, onFileDecode, onFileDecodeError)
}

/*
 * Create a new AudioBuffer for the looper.
 * While a new AudioBuffer object is created each time the clip
 * changes, it does not reload or copy the actual audio data,
 * but instead gets a new limited "view" into the primary buffer
 */
function createLoopBuffer(audioBuffer, start=0, length=0) {
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


