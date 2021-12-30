/*
Philosophies of the Project (to remind myself):
- the end product of each stage/tool should be consumable
  by the other tools. The Clip/Loop is the basis for this.
- in the movement of a loop through the system, priority is
  given to smooth movement through the workflow and simple
  code to that aim. Therefore, concern is not given to saving
  previous state. Experiments should be performed on copies.



Current Focus: Get Loopshop fully integrated with Cutter

Next Steps:
- finish up 1st round of loopshop(LS):
  - LS should realtime sync with the selection in loop-cutter
  - add a little padding at top of display so that clipping is visible
- Source track library (exists in simple form):
  - edit name
  - copy 


- Visuals:
  - display info about buffers, clips, tracks, etc: length (samples and time), sampleRate
  - show a running "read-head" on displayed waveforms when they are running
    - display info about read-head position
    - allow manipulation of the read-head
    
Bugs:


Thoughts:
- could copyWithin() be used in some kind of cool recursive/fractaly way?
- start with a buffer of noise and use copyWithin() to slowly evolve order

Features:
- Add controls:
- track gain / x mute
- Audio Library
- Add an effect or two
- Stretch: Enable reverse play

-------------------------------------------------------------------------------
----------------------------- Current Modules ---------------------------------

StockPile:
Features:
- reload in LoopCutter
- delete from session

Looper/Cutter:
Bugs:
Features:
- zoom

LoopShop
- gain
- envelopes

Ranger:
Bugs:
- segments can run before or after the track window, is this ok?
Features:
- allow segments to be pitch controlled, either at start or continuously
- allow segments to wander in an arrangement, so if looped, it will continue to move
- snap segment length to multiples or fractions of clip-length 

Master Bus:
Bugs:
Features:
- add per-channel effects

-------------------------------------------------------------------------------
----------------------------- ToBeDeveloped... --------------------------------
Players:
- MIDI controllers
- comp keyboard
- random/chaos
- quantizer

Clock:
- poly rhythms
- tidal clock

Step Sequencer:
- clips as instruments
- allow for different length tracks

Tidal Sequencer:
- clips as instruments
- tidal patterns

Loop Stitcher
- types:
  - forward/backward/ping-pong
  - single

Clip Shaper
- Fine trim
- Apply effect
- Apply envelope
- Adjust gain
- pitch shift

Input/Output
- Mic/Line In
- Audio Out
- record to file
- save/load session


*/
   

import {Library} from "./library.js"
import {Looper} from "./looper.js"
import {LooperUI} from "./looperUI.js"
import {LoopShop, LoopShopUI} from "./loopshop.js"
import {Loop, Ranger, Track} from "./ranger.js"
import {SystemBus} from "./bus.js"

// Audio / looper variables
let _audioCtx;
let _superLooper;
let _looperUI;
let _loopShop;
let _loopShopUI;
let _ranger;
let _bus;
let _library;
// const _sourceBuffers = [];
// const _loops = [];


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


//-------------------- Setup MIDI --------------------------
let _midiAccess;

function onMIDISuccess(midiAccess) {
    _midiAccess = midiAccess;
    const inputs = midiAccess.inputs;
    if(inputs.size > 0) {
        var iterator = inputs.values(); // returns an iterator that loops over all inputs
        var input = iterator.next().value; // get the first input
        input.onmidimessage = handleMIDIMessage;
        console.log('connected to MIDI device: ' + input.name);
    }
}

function onMIDIFailure(msg) {
    console.log( "Failed to get MIDI access - " + msg );
}

function handleMIDIMessage(event) {
    let data = event.data;

    // this is key on for channel A
    if(data[0] == 154) {
        const midiNote = data[1];
        const velocity = data[2];

        if(velocity == 0) {
            _looperUI.stop(midiToHz(midiNote));
        } else {
            _looperUI.play(midiToHz(midiNote));
        }
    }
}

function midiToHz(midiNote) {
    return 440 * Math.pow(2, (midiNote-69)/12);
}

//-------------------- End Setup MIDI ----------------------


function init() {
    navigator.requestMIDIAccess().then( onMIDISuccess, onMIDIFailure );

    _library = new Library();
    _audioCtx = new AudioContext();
    if (_audioCtx.state === 'suspended') {
        _audioCtx.resume();
    }
    
    // Create the master bus
    const busElement = document.getElementById('master-bus');
    _bus = new SystemBus(_audioCtx, busElement);

    
    // setup the looper
    const looperBusConnection = _bus.addChannel('Loop Cutter');
    _superLooper = new Looper(_audioCtx, looperBusConnection);
    // initDraw(_superLooper);

    // setup the looper UI
    const canvasCtx = document.getElementById('waveform_canvas').getContext('2d');
    const looperHtmlRoot = document.getElementById('looper');
    _looperUI = new LooperUI(looperHtmlRoot, _superLooper);

    // setup the loopshop and UI
    const loopShopBusConnection = _bus.addChannel('LoopShop');
    _loopShop = new LoopShop(loopShopBusConnection);
    const loopShopHtmlRoot = document.getElementById('loopshop')
    _loopShopUI = new LoopShopUI(loopShopHtmlRoot, _loopShop);
    _looperUI.expander = _loopShopUI;


    // setup the arranger
    const rangerBusConnection = _bus.addChannel('Ranger');
    const rangerElement = document.getElementById('ranger');
    _ranger = new Ranger(_audioCtx, rangerElement, rangerBusConnection);
  
}



// Button to toggle Looper Play/Pause
document.querySelector('#looper .transport-play').addEventListener('click', function() {
    if(! _audioCtx) {
        return; 
    }
    
    if (this.dataset.playing === 'false') {
        this.dataset.playing = 'true';
        _looperUI.play();
      
    } else if (this.dataset.playing === 'true') {
        this.dataset.playing = 'false';
        _looperUI.stop();
    }
});

// Button to add current loop as a track in ranger
document.querySelector('.add-track').addEventListener('click', function() {
    const loop = _superLooper.cutLoop();
    _library.addLoop(loop);
    _ranger.createTrack(loop);
});

// Button to add current loop as a track in ranger
document.querySelector('.to-clip-shop').addEventListener('click', function() {
    const loop = _superLooper.cutLoop();
    _library.addLoop(loop);
    _loopShopUI.loadLoop(loop);
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

for(let button of document.querySelectorAll('.module-buttons .minmax-toggle')) {
    button.addEventListener('click', function(event) {
        event.target.parentNode.parentNode.nextElementSibling.hidden = !event.target.parentNode.parentNode.nextElementSibling.hidden;
    });
}



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
            addFileToUI(audioBuffer, name);
            const loop = _library.loadAudioBuffer(audioBuffer, name);
            loop.loop = true;
            _looperUI.loadLoop(loop);
    });  
}


function addFileToUI(buffer, name) {
    const tmp = document.createElement('tbody');
    tmp.innerHTML =
        `<tr>
            <td>${name}</td>
            <td>${buffer.length}</td>
            <td>${buffer.duration.toFixed(3)}</td>
            <td>${buffer.sampleRate}</td>
            <td>
                <button>Reload</button>
                <button>Remove</button>
            </td>
        </tr>
        `;
    const loadedFiles = document.querySelector('#files .loaded tbody');
    loadedFiles.appendChild(tmp.firstChild);
}

