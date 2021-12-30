const DISPLAY_BACKGROUND = 'rgb(0,0,0)';
const WAVEFORM_COLOR = 'rgb(255,255,255)';
const XAXIS_COLOR = 'rgb(0,0,255)';


export class WaveformView {
    #canvasCtx
    #backgroundColor
    #traceColor
    #xaxis = '';
    
    constructor(canvasCtx, backgroundColor='', traceColor='') {
        this.#canvasCtx = canvasCtx;
        this.#backgroundColor = backgroundColor || DISPLAY_BACKGROUND;
        this.#traceColor = traceColor || WAVEFORM_COLOR;
    }
    

    draw(waveData, start=0, length=0) {
        const width = this.#canvasCtx.canvas.width;
        const height = this.#canvasCtx.canvas.height;
        this.#canvasCtx.clearRect(0, 0, width, height);
        
        this.#canvasCtx.fillStyle = this.#backgroundColor;  
        this.#canvasCtx.fillRect(0, 0, width, height);
        
        this.drawXAxis();

        this.#canvasCtx.lineWidth = 1;
        this.#canvasCtx.strokeStyle = this.#traceColor;
        this.#canvasCtx.beginPath();
        
        const lengthCalcd = length ? length : waveData.length - start;
        const sliceWidth = width * 1.0 / lengthCalcd;
        
        let x = 0;
        const center = height / 2;
        for(let i = 0; i < lengthCalcd; i++) {
            const y = center + (waveData[i+start] * (center-2));
            
            if(i === 0) {
                this.#canvasCtx.moveTo(x, y);
            } else {
                this.#canvasCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.#canvasCtx.lineTo(width, center);
        this.#canvasCtx.stroke();
    }
    
    drawXAxis() {
        const y = this.#canvasCtx.canvas.height/2;
        const width = this.#canvasCtx.canvas.width;
        this.#canvasCtx.lineWidth = 1;
        this.#canvasCtx.strokeStyle = XAXIS_COLOR;
        this.#canvasCtx.beginPath();
        this.#canvasCtx.moveTo(0, y);
        this.#canvasCtx.lineTo(width, y);
        this.#canvasCtx.stroke();
    }
}