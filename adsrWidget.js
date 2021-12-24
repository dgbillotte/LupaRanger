
const LINE_COLOR = 'rgb(255,255,255)';
const HANDLE_COLOR = 'rgb(255,0,0)';

export class ADSRWidget {
    #canvasCtx;
    #attack;
    #decay;
    #sustain;
    #release;
    #envelope = null;

    constructor(canvasCtx) {
        this.#canvasCtx = canvasCtx;
        this.#attack = this.#decay = this.#release = this.#canvasCtx.canvas.width * 0.1;
        this.#sustain = this.#canvasCtx.canvas.height / 2;
    }

    #wireUpHandlers() {
        const canvas = this.#canvasCtx.canvas;
        canvas.querySelector('button.adsr', function() {
            if(this.#envelope == 'adsr') {
                this.#envelope = null;
            } else {
                this.#envelope = 'adsr';
                draw();
            }
            draw();
        }.bind(this));
        // canvas.querySelector('button.ar', function() {
        //     if(this.#envelope == 'ar') {
        //         this.#envelope = null;
        //     } else {
        //         this.#envelope = 'adsr';
        //         draw();
        //     }
        // }.bind(this));
    }

    set attack(attackPx) {
        this.#attack = attackPx;
        this.draw();
    }

    set decay(decayPx) {
        this.#decay = decayPx;
        this.draw();
    }

    set sustain(sustainPx) {
        this.#sustain = sustainPx;
        this.draw();
    }

    set release(releasePx) {
        this.#release = releasePx;
        this.draw();
    }

    get attack() { return this.#attack; }
    get decay() { return this.#decay; }
    get release() { return this.#release; }
    get sustain() { return this.#sustain * 1.0/this.#canvasCtx.canvas.height; }

    // getAttackScaled(clipDuration) {
    //     return clipDuration * this.#attack / this.#canvasCtx.canvas.width;
    // }
    // getDecayScaled(clipDuration) {
    //     return clipDuration * this.#decay / this.#canvasCtx.canvas.width;
    // }
    // getReleaseScaled(clipDuration) {
    //     return clipDuration * this.#release / this.#canvasCtx.canvas.width;
    // }
    // getSustainScaled() {
    //     return this.#sustain / this.#canvasCtx.canvas.width;
    // }

    draw() {
        const width = this.#canvasCtx.canvas.width;
        const height = this.#canvasCtx.canvas.height;
        // const center = height/2;

        const attack = {x:this.#attack, y:0};
        const decay = {x: this.#attack + this.#decay, y: this.#sustain};
        const release = {x: width - this.#release, y: this.#sustain};
        const ctx = this.#canvasCtx;
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(attack.x, attack.y);
        ctx.lineTo(decay.x, decay.y);
        ctx.lineTo(release.x, release.y);
        ctx.lineTo(width, height);
        ctx.stroke();

        ctx.fillStyle = HANDLE_COLOR;
        this.#drawHandleAt(attack.x, attack.y);
        this.#drawHandleAt(decay.x, decay.y);
        this.#drawHandleAt(release.x, release.y);
    }
    
    #drawHandleAt(x, y, width=10) {
        const half = width/2;
        this.#canvasCtx.fillRect(x-half, y-half, width, width);
    }
}