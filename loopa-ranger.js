/*
Primary Todos:

Next Steps:
- Source track library
- Expose the clips behind tracks as their own entity that can be:
  - modified (reloaded in the looper)
  - cloned
- MIDI or pitched composer interface of some kind
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API
- Visuals:
  - display info about buffers, clips, tracks, etc: length (samples and time), sampleRate
  - show a running "read-head" on displayed waveforms when they are running
    - display info about read-head position
    - allow manipulation of the read-head

Bugs:


Features:
- Add controls:
  - track gain / x mute
- Audio Library
- Upload audio file
- Add an effect or two
- Stretch: Enable reverse play 

*/
import {drawDisplay, initDraw, resetSelection } from "./loopa-draw.js";
import {Looper} from "./looper.js"
import {Ranger, Track} from "./ranger.js"
import {SystemBus} from "./bus.js"

// Audio / looper variables
let _audioCtx;
let _superLooper;
let _distNode;
let _ranger;
let _initialized = false;
let _distortionAmount = 1;
let _bus;
const _sourceBuffers = [];
// UI / selection window variables

function makeDistortionCurve(amount) {
    var k = typeof amount === 'number' ? amount : 50,
      n_samples = 256,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for ( ; i < n_samples; ++i ) {
      x = i * 2 / n_samples - 1;
      curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
    }
    return curve;
  };
  
  
  
  function init() {
    _initialized = true;
    _audioCtx = new AudioContext();
    // const audioSrc = 'audio/animals.mp3'
    // const audioSrc = 'audio/husky.wav'
    // const audioSrc = 'audio/stream.wav'
    // const audioSrc = 'audio/water-pouring.wav'
    // const audioSrc = 'audio/dope-drum-loop_C_major.wav'
    // const audioSrc = 'audio/talking.wav'
    // const audioSrc = 'audio/sharks1.wav'
    const audioSrc = 'audio/dungeons.wav'
    // const audioSrc = 'audio/chirp-2secs.wav'
    // const audioSrc = 'audio/bari1.wav'
    

    const fileField = document.getElementById('local-file');
    fileField.addEventListener('input', function(event) {
      const file = event.target.files[0];

      file.arrayBuffer()
        .then(function(buffer) {
          return _audioCtx.decodeAudioData(buffer);
        }).then(function(audioBuffer) {
          _superLooper.loadPrimaryBuffer(audioBuffer);
          const name = 'uploaded';
          _sourceBuffers.push({name: name, audioBuffer: audioBuffer});
          resetSelection();
          drawDisplay();

          const tmp = document.createElement('tbody');
          tmp.innerHTML =
            `<tr>
              <td>${file.name}</td>
              <td>${audioBuffer.length}</td>
              <td><button>Do Som.</button></td>
            </tr>
            `;
          const loadedFiles = document.querySelector('#files .loaded tbody');
          loadedFiles.appendChild(tmp.firstChild);
      });
    });

    // Create the master bus
    const busElement = document.getElementById('master-bus');
    _bus = new SystemBus(_audioCtx, busElement);

    
    // setup the looper
    const looperBusConnection = _bus.addChannel("Loop Cutter");
    _superLooper = new Looper(_audioCtx, looperBusConnection);
    
    
    // setup the arranger
    const rangerBusConnection = _bus.addChannel("Ranger");
    const rangerElement = document.querySelector('#ranger');
    _ranger = new Ranger(_audioCtx, rangerElement, rangerBusConnection);
    
    //
    // Add any master effects
    // 
    _distNode = _audioCtx.createWaveShaper();
    _distNode.curve = makeDistortionCurve(_distortionAmount);
    _distNode.oversample = '4x';
    _bus.appendEffects(_distNode);
    
    
    //
    // connect up all of the UI controls
    //
    
    // distortion. this is a master chain control
    const distortionAmount = document.getElementById('distortion');
    distortionAmount.addEventListener('input', function() {
        _distortionAmount = this.value;
        _distNode.curve = makeDistortionCurve(_distortionAmount);
    });
    
    //
    // load the first file and get everything going
    //
    fetchLooperFile(audioSrc, function(audioBuffer) {
        _superLooper.loadPrimaryBuffer(audioBuffer);
        _sourceBuffers.push({name: audioSrc, audioBuffer: audioBuffer});
        initDraw(_superLooper);
        drawDisplay();

        const tmp = document.createElement('tbody');
        tmp.innerHTML =
          `<tr>
            <td>${audioSrc}</td>
            <td>${audioBuffer.length}</td>
            <td><button>Do Som.</button></td>
          </tr>
          `;
        const loadedFiles = document.querySelector('#files .loaded tbody');
        loadedFiles.appendChild(tmp.firstChild);        
    });
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
    _ranger.createTrack(loop);
});

// Button to toggle Ranger Play/Pause
const rangerPlayButton = document.querySelector('#ranger .transport-play');
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