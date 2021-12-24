
const LINE_COLOR = 'rgb(255,255,255)';
const HANDLE_COLOR = 'rgb(255,0,0)';

export class ADSRWidget {
    #canvasCtx;
    #attack;
    #decay;
    #sustain;
    #release;
    #envelope = null;
    #mouseDown = null;
    #mouseMoveHandler = null;
    #onEnvelopeChange;


    constructor(canvasCtx, onEnvelopeChange=null) {
        this.#canvasCtx = canvasCtx;
        this.#onEnvelopeChange = onEnvelopeChange;
        this.#attack = this.#decay = this.#release = this.#canvasCtx.canvas.width * 0.1;
        this.#sustain = this.#canvasCtx.canvas.height / 2;
        this.#wireUpHandlers();

    }

    #wireUpHandlers() {
        this.#canvasCtx.canvas.addEventListener('mousedown', this.#mouseDownHandler.bind(this));
        this.#canvasCtx.canvas.addEventListener('mouseup', this.#mouseUpHandler.bind(this));
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
    get sustain() { return (this.#canvasCtx.canvas.height - this.#sustain) * 1.0/this.#canvasCtx.canvas.height; }

    #mouseDownHandler(event) {
        let handler = null;
        if(this.#inAttackHandler(event.offsetX, event.offsetY)) {
            console.log('attack');
            handler = this.#editAttackMouseMove;
        } else if(this.#inDecayHandler(event.offsetX, event.offsetY)) {
            console.log('decay');
            handler = this.#editDecayMouseMove;
        } else if(this.#inReleaseHandler(event.offsetX, event.offsetY)) {
            console.log('release');
            handler = this.#editReleaseMouseMove;
        }

        if(handler) {
            this.#canvasCtx.canvas.removeEventListener('mousemove', this.#mouseMoveHandler);
            this.#mouseMoveHandler = handler.bind(this);
            this.#canvasCtx.canvas.addEventListener('mousemove', this.#mouseMoveHandler);
        }

        this.#mouseDown = {x: event.offsetX, y: event.offsetY};
    }

    #inAttackHandler(x,y) {
        return (x >= (this.#attack - 5) && x <= (this.#attack + 5) && y <= 10);
    }

    #inDecayHandler(x,y) {
        const decay = this.#attack + this.#decay;
        return (x >= (decay - 5) && x <= (decay + 5) && y >= (this.#sustain -5) && y <= (this.#sustain + 5));
    }

    #inReleaseHandler(x,y) {
        const release = this.#canvasCtx.canvas.width - this.#release;
        return (x >= (release - 5) && x <= (release + 5) && y >= (this.#sustain -5) && y <= (this.#sustain + 5));
    }

    #envelopeChanged() {
        if(this.#onEnvelopeChange) {
            this.#onEnvelopeChange();
        } else {
            this.draw();
        }
    }

    #editAttackMouseMove(event) {
        this.#attack = event.offsetX;
        this.#envelopeChanged();
    }
    #editDecayMouseMove(event) {
        this.#decay = event.offsetX - this.#attack;
        this.#sustain = event.offsetY;
        this.#envelopeChanged();
    }
    #editReleaseMouseMove(event) {
        this.#release = this.#canvasCtx.canvas.width - event.offsetX;
        this.#sustain = event.offsetY;
        this.#envelopeChanged();
    }

    #mouseUpHandler() {
        this.#canvasCtx.canvas.removeEventListener('mousemove', this.#mouseMoveHandler);
    }

    draw() {
        const width = this.#canvasCtx.canvas.width;
        const height = this.#canvasCtx.canvas.height;
        // const center = height/2;

        const attack = {x:this.#attack, y:5};
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