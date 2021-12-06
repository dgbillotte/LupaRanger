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
let buffer;
let buffer_loaded = false;
let source;
let bufferLength;
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
        source.stop();
		this.dataset.playing = 'false';
	}
    
	let state = this.getAttribute('aria-checked') === "true" ? true : false;
	this.setAttribute( 'aria-checked', state ? "false" : "true" );
    
}, false);


function init() {
    var canvas = document.getElementById("waveform_canvas");
    canvasCtx = canvas.getContext("2d");

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
    source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode).connect(audioCtx.destination);
    source.loop = true;
    source.start();
}



function drawWFToCanvas(buffer) {
    
    var bufferLength = buffer.length;
    
    var waveData = new Float32Array(bufferLength);
    buffer.copyFromChannel(waveData, 0);
    
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    
    canvasCtx.fillStyle = 'rgb(64, 64, 64)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0,255,0)';
    canvasCtx.beginPath();
    
    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;
    
    var center = HEIGHT / 2;
    for(var i = 0; i < bufferLength; i++) {
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
        buffer = newBuffer;
        console.info('Got the buffer', buffer);
        buffer_loaded = true;
        drawWFToCanvas(buffer);
        // nothing can start until this is done
    }
    
    function onFileDecodeError (e) {
        console.log('Error decoding buffer: ' + e.message);
        console.log(e);
    }    

    var audioData = request.response;
    audioCtx.decodeAudioData(audioData, onFileDecode, onFileDecodeError)
}



// document.addEventListener('DOMContentLoaded', function () {
// }, false);

