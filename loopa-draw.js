import { SelectWindow } from "./select-window.js";

const DISPLAY_BACKGROUND = 'rgb(32, 32, 32)';
const WAVEFORM_COLOR = 'rgb(0, 255, 0)';

const _waveformCanvas = document.getElementById("waveform_canvas");
_waveformCanvas.width = _waveformCanvas.parentElement.offsetWidth;
const _waveformCtx = _waveformCanvas.getContext("2d");
window.addEventListener('resize', function() {
    _waveformCanvas.width = _waveformCanvas.parentElement.offsetWidth;
    drawDisplay();
});


let _looper;

function createLooperSelectWindow(canvasCtx, top, bottom, width) {
    return new SelectWindow(canvasCtx, top, bottom, width,
        function(start, end) {
            _looper.reClip(start, end, canvasCtx.canvas.width);
            drawDisplay();   
        }
    );
}


let _looperSelection = createLooperSelectWindow(_waveformCtx, 0, _waveformCtx.canvas.height, _waveformCtx.canvas.width);

export function resetSelection() {
    _looperSelection.unregister();
    _looperSelection = createLooperSelectWindow(_waveformCtx, 0, _waveformCtx.canvas.height, _waveformCtx.canvas.width);
}
    

export function initDraw(looper) {
    _looper = looper
}


//------------------ Draw Functions -----------------------

export function drawDisplay() {
    drawWaveform(_waveformCtx, _looper.primaryBufferData);
    if(_looperSelection) {
        _looperSelection.draw();
    }
}

function drawWaveform(canvasCtx, waveData) {
    const width = canvasCtx.canvas.width;
    const height = canvasCtx.canvas.height;
    canvasCtx.clearRect(0, 0, width, height);
    
    canvasCtx.fillStyle = DISPLAY_BACKGROUND;  
    canvasCtx.fillRect(0, 0, width, height);
    
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = WAVEFORM_COLOR;
    canvasCtx.beginPath();
    
    const sliceWidth = width * 1.0 / waveData.length;
    let x = 0;
    
    const center = height / 2;
    for(let i = 0; i < waveData.length; i++) {
        const y = center + (waveData[i] * center);
        
        if(i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
    }
    
    canvasCtx.lineTo(width, height/2);
    canvasCtx.stroke();
}

