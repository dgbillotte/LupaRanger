
const waveformCanvas = document.getElementById("waveform_canvas");
const _canvasCtx = waveformCanvas.getContext("2d");


let _mouseDownX = 0;
let _mouseMoveX = 0;
let _clipSelection = null; 

let _primaryBuffer;
let _loopClipper;

export function initDraw(buffer, clipper) {
    _primaryBuffer = buffer;
    _loopClipper = clipper
}

export const WIDTH = 1024;
export const HEIGHT = 256;

const DISPLAY_BACKGROUND = 'rgb(32, 32, 32)';
const WAVEFORM_COLOR = 'rgb(0, 255, 0)';
const SELECT_WINDOW_COLOR = 'rgba(0, 255, 0, 0.25)';
const SELECT_WINDOW_BORDER_COLOR = 'rgb(128, 128, 128)';
const SELECT_WINDOW_HANDLE_COLOR = 'rgb(128, 128, 128)';

//------------------ Draw Functions -----------------------
export function drawWaveform() {
    let buffer =  _primaryBuffer;
    var waveData = new Float32Array(buffer.length);
    buffer.copyFromChannel(waveData, 0);
    
    _canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    
    _canvasCtx.fillStyle = DISPLAY_BACKGROUND;
    _canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
    _canvasCtx.lineWidth = 2;
    _canvasCtx.strokeStyle = WAVEFORM_COLOR;
    _canvasCtx.beginPath();
    
    var sliceWidth = WIDTH * 1.0 / buffer.length;
    var x = 0;
    
    var center = HEIGHT / 2;
    for(var i = 0; i < buffer.length; i++) {
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


export function drawSelectionWindow(start, stop) {
    const selectWidth = stop - start;

    _canvasCtx.lineWidth = 2;
    _canvasCtx.strokeStyle = SELECT_WINDOW_BORDER_COLOR;
    _canvasCtx.fillStyle = SELECT_WINDOW_COLOR;
    _canvasCtx.fillRect(start, 0, selectWidth, HEIGHT);
    _canvasCtx.strokeRect(start, 0, selectWidth, HEIGHT);
    
    _canvasCtx.fillStyle = SELECT_WINDOW_HANDLE_COLOR;
    const startY = HEIGHT/2 - 25;
    _canvasCtx.fillRect(start-10, startY, 20, 50);
    _canvasCtx.fillRect(stop-10, startY, 20, 50);
}


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
    
    _loopClipper.reClip(_clipSelection.start, _clipSelection.end);
    // resetLooper();
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

function updateSelectionWindow(start, end) {
    drawWaveform();
    drawSelectionWindow(start, end);
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

