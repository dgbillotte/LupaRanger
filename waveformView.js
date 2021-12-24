const DISPLAY_BACKGROUND = 'rgb(0,0,0)';
const WAVEFORM_COLOR = 'rgb(255,255,255)';


export class WaveformView {
    #canvasCtx
    #backgroundColor
    #traceColor
    
    constructor(canvasCtx, backgroundColor='', traceColor='') {
        this.#canvasCtx = canvasCtx;
        this.#backgroundColor = backgroundColor || DISPLAY_BACKGROUND;
        this.#traceColor = traceColor || WAVEFORM_COLOR;
    }



    draw(waveData) {
        const width = this.#canvasCtx.canvas.width;
        const height = this.#canvasCtx.canvas.height;
        this.#canvasCtx.clearRect(0, 0, width, height);
        
        this.#canvasCtx.fillStyle = this.#backgroundColor;  
        this.#canvasCtx.fillRect(0, 0, width, height);
        
        this.#canvasCtx.lineWidth = 1;
        this.#canvasCtx.strokeStyle = this.#traceColor;
        this.#canvasCtx.beginPath();
        
        const sliceWidth = width * 1.0 / waveData.length;
        let x = 0;
        
        const center = height / 2;
        for(let i = 0; i < waveData.length; i++) {
            const y = center + (waveData[i] * center);
            
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
}