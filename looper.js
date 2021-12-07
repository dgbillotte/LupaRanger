/*
Primary Todos:
- clean up to some simple Vanilla standard

Features:
- make play restart when loop-window changes
- make loop-window drag-resizeable
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


// for cross browser
const AudioContext = window.AudioContext || window.webkitAudioContext;

let audioCtx;
let canvasCtx;
let gainNode;
let primaryBuffer;
let loopBuffer;
let looper;
let initialized = false;

const WIDTH = 1024;
const HEIGHT = 256;

// Button to load the audio file and initialize the
// Canvas and Audio contexts
const loadButton = document.querySelector('.file-load');
loadButton.addEventListener('click', function() {
    if(! initialized) {
        init();
    }
});


// Button to toggle Play/Pause
const playButton = document.querySelector('.transport-play');
playButton.addEventListener('click', function() {
    if(! initialized) {
        return; 
	}
    
	// check if context is in suspended state (autoplay policy)
	if (audioCtx.state === 'suspended') {
        audioCtx.resume();
	}
    
	if (this.dataset.playing === 'false') {
        play();
        this.dataset.playing = 'true';
        
	} else if (this.dataset.playing === 'true') {
        looper.stop();
		this.dataset.playing = 'false';
	}
    
	let state = this.getAttribute('aria-checked') === "true" ? true : false;
	this.setAttribute('aria-checked', state ? "false" : "true" );
    
}, false);



const waveformCanvas = document.getElementById("waveform_canvas");
let selectStartX = 0;
let selectEndX = 0;

let mouseMoveHandler = function(event) {
    selectEndX = event.x <= WIDTH ? event.x : WIDTH;
    
    drawWaveform();
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(255,255,0)';
    canvasCtx.fillStyle = 'rgba(255, 0, 0, 0.25)';
    canvasCtx.fillRect(selectStartX, 0, selectEndX - selectStartX, HEIGHT);
    canvasCtx.strokeRect(selectStartX, 0, selectEndX - selectStartX, HEIGHT);
};

waveformCanvas.addEventListener('mousedown', function(event) {
    mouseDown = true;
    selectStartX = event.x
    waveformCanvas.addEventListener('mousemove', mouseMoveHandler);    
});

waveformCanvas.addEventListener('mouseup', function() {
    waveformCanvas.removeEventListener('mousemove', mouseMoveHandler);
    mouseDown = false;

    clipTheLoop();
});

function clipTheLoop() {
    // calculate start/stop samples
    let startSample = selectStartX * 1.0 * primaryBuffer.length / WIDTH;
    let stopSample = selectEndX * 1.0 * primaryBuffer.length / WIDTH;
    loopBuffer = createLoopBuffer(primaryBuffer, startSample, stopSample-startSample);
}

function init() {
    canvasCtx = waveformCanvas.getContext("2d");
    
    audioCtx = new AudioContext();
    var audioSrc = '/dope-drum-loop_C_major.wav'
    fetchFile(audioSrc, onFileFetched)
    
    // volume
    gainNode = audioCtx.createGain();
    const volumeControl = document.querySelector('[data-action="volume"]');
    volumeControl.addEventListener('input', function() {
        gainNode.gain.value = this.value;
    }, false);
    
    initialized = true;
}


function play() {
    looper = audioCtx.createBufferSource();
    looper.buffer = loopBuffer;
    looper.connect(gainNode).connect(audioCtx.destination);
    looper.loop = true;
    looper.start();
}



function drawWaveform() {
    
    var waveData = new Float32Array(primaryBuffer.length);
    primaryBuffer.copyFromChannel(waveData, 0);
    
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    
    canvasCtx.fillStyle = 'rgb(64, 64, 64)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0,255,0)';
    canvasCtx.beginPath();
    
    var sliceWidth = WIDTH * 1.0 / primaryBuffer.length;
    var x = 0;
    
    var center = HEIGHT / 2;
    for(var i = 0; i < primaryBuffer.length; i++) {
        var y = center + (waveData[i] * center);
        
        if(i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
    }
    
    canvasCtx.lineTo(WIDTH, HEIGHT/2);
    canvasCtx.stroke();
}




function fetchFile (url, resolve) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function () { resolve(request) }
    request.send()
}

function onFileFetched (request) {
    function onFileDecode (newBuffer){
        primaryBuffer = newBuffer;
        drawWaveform(primaryBuffer);
        loopBuffer = createLoopBuffer(primaryBuffer);
    }
    
    function onFileDecodeError (e) {
        console.log('Error decoding buffer: ' + e.message);
        console.log(e);
    }    
    
    var audioData = request.response;
    audioCtx.decodeAudioData(audioData, onFileDecode, onFileDecodeError)
}


function createLoopBuffer(audioBuffer, start=0, length=0) {
    if(length === 0) {
        length = audioBuffer.length - start;
    }
    if(start + length > audioBuffer.length) {
        console.log("shouldn't be getting here, can you hear it?");
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


