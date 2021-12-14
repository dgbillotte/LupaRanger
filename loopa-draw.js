import { SelectWindow } from "./select-window.js";

export const WIDTH = 1024;
export const HEIGHT = 256;

const DISPLAY_BACKGROUND = 'rgb(32, 32, 32)';
const WAVEFORM_COLOR = 'rgb(0, 255, 0)';

const waveformCanvas = document.getElementById("waveform_canvas");
const _waveformCtx = waveformCanvas.getContext("2d");

let _looper;

const _looperSelection = new SelectWindow(_waveformCtx, 0, HEIGHT, WIDTH,
    function(start, end) {
        _looper.reClip(start, end, WIDTH);
        drawDisplay();   
    }
);



export function initDraw(looper) {
    _looper = looper
}


//------------------ Draw Functions -----------------------

 
function drawWaveform(canvasCtx, waveData) {
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    
    canvasCtx.fillStyle = DISPLAY_BACKGROUND;  
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
    canvasCtx.lineWidth = 1;
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


export function drawDisplay() {
    drawWaveform(_waveformCtx, _looper.primaryBufferData2);
    if(_looperSelection) {
        _looperSelection.draw();
    }
}


