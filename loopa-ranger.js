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

Thoughts:
- could copyWithin() be used in some kind of cool recursive/fractaly way?
- start with a buffer of noise and use copyWithin() to slowly evolove order

Features:
- Add controls:
- track gain / x mute
- Audio Library
- Upload audio file
- Add an effect or two
- Stretch: Enable reverse play 

*/
   
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
   
import {drawDisplay, initDraw, resetSelection } from "./loopa-draw.js";
import {Looper} from "./looper.js"
import {Ranger, Track} from "./ranger.js"
import {SystemBus} from "./bus.js"

// Audio / looper variables
let _audioCtx;
let _superLooper;
let _ranger;
let _bus;
const _sourceBuffers = [];

  


// Local file loader 
document.getElementById('local-file').addEventListener('input', function(event) {
  if(! _audioCtx) {
    init();
  }
  
  const file = event.target.files[0];
  file.arrayBuffer()
    .then((buffer) => loadBuffer(buffer, file.name));
});

document.getElementById('predefined-files').addEventListener('input', function(event) {
  if(! _audioCtx) {
    init();
  }
  
  const url = 'audio/' + event.target.value;;
  fetch(url)
  .then((response) => blobOrError(response))
  .then((blob) => blob.arrayBuffer())
  .then((buffer) => loadBuffer(buffer,  url));
});



function init() {
  _audioCtx = new AudioContext();
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  
  // Create the master bus
  const busElement = document.getElementById('master-bus');
  _bus = new SystemBus(_audioCtx, busElement);

  
  // setup the looper
  const looperBusConnection = _bus.addChannel("Loop Cutter");
  _superLooper = new Looper(_audioCtx, looperBusConnection);
  initDraw(_superLooper);
  
  
  // setup the arranger
  const rangerBusConnection = _bus.addChannel("Ranger");
  const rangerElement = document.querySelector('#ranger');
  _ranger = new Ranger(_audioCtx, rangerElement, rangerBusConnection);
  
}



// Button to toggle Looper Play/Pause
document.querySelector('#looper .transport-play').addEventListener('click', function() {
    if(! _audioCtx) {
        return; 
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
document.querySelector('.add-track').addEventListener('click', function() {
    const loop = _superLooper.cloneLoop();
    _ranger.createTrack(loop);
});

// Button to toggle Ranger Play/Pause
document.querySelector('#ranger .transport-play').addEventListener('click', function() {
  if(! _audioCtx) {
      return; 
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


function blobOrError(response) {
  if(! response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.blob();
}

function loadBuffer(buffer, name) {
  _audioCtx.decodeAudioData(buffer)
  .then(function(audioBuffer) {
    _superLooper.loadPrimaryBuffer(audioBuffer);
    addSourceFile(audioBuffer, name);
    resetSelection();
    drawDisplay();
  });  
}

function addSourceFile(buffer, name) {
  _sourceBuffers.push({name: name, audioBuffer: buffer});

  const tmp = document.createElement('tbody');
  tmp.innerHTML =
    `<tr>
      <td>${name}</td>
      <td>${buffer.length}</td>
      <td><button>Do Som.</button></td>
    </tr>
    `;
  const loadedFiles = document.querySelector('#files .loaded tbody');
  loadedFiles.appendChild(tmp.firstChild);
}


// function fetchLooperFile(url, resolve) {
//     return fetch(url)
//     .then(function(response) {
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       return response.blob();
//     })
//     .then(function(blob) {
//         return blob.arrayBuffer().then(function(audioData) {
//             _audioCtx.decodeAudioData(audioData, resolve, onFileDecodeError);
//         });
//     });
// }

// function onFileDecodeError (e) {
//     console.log('Error decoding buffer: ' + e.message);
//     console.log(e);
// }    