
const waveformCanvas = document.getElementById("waveform_canvas");
const _waveformCtx = waveformCanvas.getContext("2d");
const oscopeCanvas = document.getElementById("oscope_canvas");
const _oscopeCtx = oscopeCanvas.getContext("2d");

let _mouseDownX = 0;
// let _mouseMoveX = 0;
// let _mouseSlideX = 0;
let _clipSelection = null; 

let _looper;

export function initDraw(looper) {
    _looper = looper
}

export const WIDTH = 1024;
export const HEIGHT = 256;

const DISPLAY_BACKGROUND = 'rgb(32, 32, 32)';
const WAVEFORM_COLOR = 'rgb(0, 255, 0)';
const SELECT_WINDOW_COLOR = 'rgba(0, 255, 0, 0.25)';
const SELECT_WINDOW_BORDER_COLOR = 'rgb(128, 128, 128)';
const SELECT_WINDOW_HANDLE_COLOR = 'rgb(128, 128, 128)';

//------------------ Draw Functions -----------------------

 
function drawPrimaryWaveform() {
    drawWaveform(_waveformCtx, _looper.primaryBufferData);
}

function drawClippedWaveform() {
    drawWaveform(_oscopeCtx, _looper.loopBufferData);
}

function drawWaveform(canvasCtx, waveData) {
    // const waveData = _looper.primaryBufferData;
    
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    
    canvasCtx.fillStyle = DISPLAY_BACKGROUND;  
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = WAVEFORM_COLOR;
    canvasCtx.beginPath();
    
    const sliceWidth = WIDTH * 1.0 / waveData.length;
    let x = 0;
    
    const center = HEIGHT / 2;
    for(let i = 0; i < waveData.length; i++) {
        const y = center + (waveData[i] * center);
        
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


function drawSelectionWindow() {
    const selectWidth = _clipSelection.end - _clipSelection.start;
    
    _waveformCtx.lineWidth = 2;
    _waveformCtx.strokeStyle = SELECT_WINDOW_BORDER_COLOR;
    _waveformCtx.fillStyle = SELECT_WINDOW_COLOR;
    _waveformCtx.fillRect(_clipSelection.start, 0, selectWidth, HEIGHT);
    _waveformCtx.strokeRect(_clipSelection.start, 0, selectWidth, HEIGHT);
    
    _waveformCtx.fillStyle = SELECT_WINDOW_HANDLE_COLOR;
    const startY = HEIGHT -75; //HEIGHT/2 - 25;
    _waveformCtx.fillRect(_clipSelection.start-10, startY, 20, 50);
    _waveformCtx.fillRect(_clipSelection.end-10, startY, 20, 50);
}


export function drawDisplay() {
    drawPrimaryWaveform();
    if(_clipSelection) {
        drawClippedWaveform();
        drawSelectionWindow();
    }
}

export function drawOscopeFrame(audioData) {
    _oscopeCtx.clearRect(0, 0, WIDTH, HEIGHT);
    _oscopeCtx.fillStyle = 'rgb(200, 200, 200)';
    _oscopeCtx.fillRect(0, 0, WIDTH, HEIGHT);

    _oscopeCtx.lineWidth = 2;
    _oscopeCtx.strokeStyle = 'rgb(0, 0, 0)';
    _oscopeCtx.beginPath();

    const sliceWidth = WIDTH * 1.0 / audioData.length;
    let x = 0;

    const center = HEIGHT / 2;
    for(let i=0; i < audioData.length; i++) {
        // const y = center * (audioData[i] / 128.0);
        const y = center + (audioData[i] * 128.0);

        if(i === 0) {
            _oscopeCtx.moveTo(x, y);
        } else {
            _oscopeCtx.lineTo(x, y);
        }
        x += sliceWidth;
    }
        
    _oscopeCtx.lineTo(WIDTH, center);
    _oscopeCtx.stroke();
    
}

waveformCanvas.addEventListener('mousedown', mouseDownHandler);
waveformCanvas.addEventListener('mouseup', mouseUpHandler);


//------------------ Click handling for the selection window -------


function mouseDownHandler(event) {
    
    if(_clipSelection) {
        if(inLeftHandle(event.offsetX, event.offsetY)) {
            waveformCanvas.addEventListener('mousemove', editSelectionLeftMouseMove);
            console.log("edit-left handler");
        } else if(inRightHandle(event.offsetX, event.offsetY)) {
            waveformCanvas.addEventListener('mousemove', editSelectionRightMouseMove);
            console.log("edit-right handler");
        } else if(event.offsetX >= _clipSelection.start && event.offsetX <= _clipSelection.end) {
            waveformCanvas.addEventListener('mousemove', slideSelectionMouseMove);
            _mouseDownX = event.offsetX;
            console.log("slide handler");
        }
        
    } else {
        _clipSelection = { start: event.offsetX,  end: event.offsetX+10 };
        drawDisplay();
        waveformCanvas.addEventListener('mousemove', createSelectionMouseMove);
        console.log("create handler");
    }
}

function mouseUpHandler(event) {
    waveformCanvas.removeEventListener('mousemove', createSelectionMouseMove);
    waveformCanvas.removeEventListener('mousemove', editSelectionLeftMouseMove);
    waveformCanvas.removeEventListener('mousemove', editSelectionRightMouseMove);
    waveformCanvas.removeEventListener('mousemove', slideSelectionMouseMove);
   
    console.log("mouse up fired!");

    _looper.reClip(_clipSelection.start, _clipSelection.end, WIDTH);
    drawDisplay();
}

function createSelectionMouseMove(event) {
    _clipSelection['end'] = event.offsetX <= WIDTH ? event.offsetX : WIDTH;
    drawDisplay();
}

let editSelectionLeftMouseMove = function(event) {
    _clipSelection['start'] = event.offsetX <= WIDTH ? event.offsetX : WIDTH;
    drawDisplay();
}

let editSelectionRightMouseMove = function(event) {
    _clipSelection['end'] = event.offsetX <= WIDTH ? event.offsetX : WIDTH;
    drawDisplay();
}

let slideSelectionMouseMove = function(event) {
    let delta = event.offsetX - _mouseDownX;
    _mouseDownX = event.offsetX;
    _clipSelection['start'] += delta;
    _clipSelection['end'] += delta;
    drawDisplay();
    // _loopClipper.reClip(_clipSelection.start, _clipSelection.end, WIDTH);
}


function inLeftHandle(x,y) {
    return (
        x >= _clipSelection.start-10 &&
        x <= _clipSelection.start+10 &&
        y >= HEIGHT-75 &&
        y <= HEIGHT-25
        // y >= HEIGHT/2-25 &&
        // y <= HEIGHT/2+25
    );
}

function inRightHandle(x,y) {
    return (
        x >= _clipSelection.end-10 &&
        x <= _clipSelection.end+10 &&
        y >= HEIGHT-75 &&
        y <= HEIGHT-25
        // y >= HEIGHT/2-25 &&
        // y <= HEIGHT/2+25
    );
}

