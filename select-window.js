export class SelectWindow {
    #clipSelection = {start: 0, end: 0};
    #canvasCtx;
    #mouseSlideX;
    #mouseMoveHandler;
    #onSelectionChange;
    #top;
    #bottom;
    #width;
    #lhTop = 10;
    #lhLeft = -5;
    #lhHeight = 40;
    #lhWidth = 10;
    #rhTop = 10;
    #rhLeft = -5;
    #rhHeight = 40;
    #rhWidth = 10;

    // windowColor = 'rgba(0, 255, 0, 0.25)';
    windowColor = 'rgba(255, 0, 0, 0.25)';
    windowBorderColor = 'rgb(128, 128, 128)';
    windowHandleColor = 'rgb(128, 128, 128)';

    constructor(canvasContext, top, bottom, width, onSelectionChange=null, wireMouseDownUp=true) {
        this.#canvasCtx = canvasContext;
        if(wireMouseDownUp) {
            this.#canvasCtx.canvas.addEventListener('mousedown', this.mouseDownHandler.bind(this));
            this.#canvasCtx.canvas.addEventListener('mouseup', this.mouseUpHandler.bind(this));
        }
        this.#onSelectionChange = onSelectionChange;
        this.#top = top;
        this.#bottom = bottom;
        this.#width = width;
    }

    startScaled(scaleMax=0) {
        return (scaleMax == 0)
            ? this.#clipSelection.start
            : scaleMax * 1.0 * this.#clipSelection.start / this.#width;
    }

    endScaled(scaleMax=0) {
        return (scaleMax == 0)
            ? this.#clipSelection.end
            : scaleMax * 1.0 * this.#clipSelection.end / this.#width;
    }

    startEnd(startEnd={}) {
        let redraw = false;
        if(startEnd.start) {
            this.#clipSelection.start = startEnd.start;
            redraw = true;
        }
        if(startEnd.end) {
            this.#clipSelection.end = startEnd.end;
            redraw = true;
        }
        if(redraw) {
            this.draw();
        }
    }

    placeLeftHandle(top, left, height, width) {
        this.#lhTop = top;
        this.#lhLeft = left;
        this.#lhHeight = height;
        this.#lhWidth = width;
    }
    
    placeRightHandle(top, left, height, width) {
        this.#rhTop = top;
        this.#rhLeft = left;
        this.#rhHeight = height;
        this.#rhWidth = width;
    }
    
    placeHandles(top, left, height, width) {
        this.placeLeftHandle(top, left, height, width);
        this.placeRightHandle(top, left, height, width);
    }

    draw() {
        if(this.#clipSelection.start !== this.#clipSelection.end) {
            const selectWidth = this.#clipSelection.end - this.#clipSelection.start;
            
            this.#canvasCtx.fillStyle = this.windowColor;
            this.#canvasCtx.fillRect(this.#clipSelection.start, this.#top, selectWidth, this.#bottom);

            this.#canvasCtx.lineWidth = 2;
            this.#canvasCtx.strokeStyle = this.windowBorderColor;
            this.#canvasCtx.strokeRect(this.#clipSelection.start, this.#top, selectWidth, this.#bottom);
            
            this.#canvasCtx.fillStyle = this.windowHandleColor;
            this.#canvasCtx.fillRect(this.#clipSelection.start+this.#lhLeft, this.#top+this.#lhTop, this.#lhWidth, this.#lhHeight);
            this.#canvasCtx.fillRect(this.#clipSelection.end+this.#rhLeft, this.#top+this.#rhTop, this.#rhWidth, this.#rhHeight);
        }
    }

    mouseDownHandler(event) {
        console.log("select-window mousedown");
        let handler;
        if(this.#clipSelection.start !== this.#clipSelection.end) {
            if(this.inLeftHandle(event.offsetX, event.offsetY)) {
                handler = this.editSelectionLeftMouseMove;

            } else if(this.inRightHandle(event.offsetX, event.offsetY)) {
                handler = this.editSelectionRightMouseMove;

            } else if(event.offsetX >= this.#clipSelection.start && event.offsetX <= this.#clipSelection.end) {
                handler = this.slideSelectionMouseMove;
                this.#mouseSlideX = event.offsetX;
            }
            
        } else {
            this.#clipSelection = { start: event.offsetX,  end: event.offsetX+10 };
            this.draw();
            handler = this.createSelectionMouseMove;
        }
        if(handler) {
            this.#canvasCtx.canvas.removeEventListener('mousemove', this.#mouseMoveHandler);
            this.#mouseMoveHandler = handler.bind(this);
            this.#canvasCtx.canvas.addEventListener('mousemove', this.#mouseMoveHandler);
        }
    }
    
    selectionChanged() {
        if(this.#onSelectionChange) {
            this.#onSelectionChange(this.#clipSelection.start, this.#clipSelection.end);
        } else {
            this.draw();
        }
    }

    mouseUpHandler(event) {
        this.#canvasCtx.canvas.removeEventListener('mousemove', this.#mouseMoveHandler);
        if(this.#clipSelection.start > this.#clipSelection.end) {
            [this.#clipSelection.start, this.#clipSelection.end] = [this.#clipSelection.end, this.#clipSelection.start];
        }
        this.selectionChanged();
        console.log("mouse up fired");
    }
    
    createSelectionMouseMove(event) {
        this.#clipSelection['end'] = event.offsetX <= this.#width ? event.offsetX : this.#width;
        this.selectionChanged();
    }
    
    editSelectionLeftMouseMove(event) {
        this.#clipSelection['start'] = event.offsetX <= this.#width ? event.offsetX : this.#width;
        this.selectionChanged();
    }
    
    editSelectionRightMouseMove(event) {
        this.#clipSelection['end'] = event.offsetX <= this.#width ? event.offsetX : this.#width;
        this.selectionChanged();
    }
    
    slideSelectionMouseMove(event) {
        let delta = event.offsetX - this.#mouseSlideX;
        this.#mouseSlideX = event.offsetX;
        this.#clipSelection['start'] += delta;
        this.#clipSelection['end'] += delta;
        this.selectionChanged();
    }

    inLeftHandle(x,y) {
        return (
            x >= this.#clipSelection.start + this.#lhLeft &&
            x <= this.#clipSelection.start + this.#lhLeft + this.#lhWidth &&
            y >= this.#top + this.#lhTop &&
            y <= this.#top + this.#lhTop + this.#lhHeight
        );
    }
    
    inRightHandle(x,y) {
        return (
            x >= this.#clipSelection.end + this.#rhLeft &&
            x <= this.#clipSelection.end + this.#rhLeft + this.#rhWidth &&
            y >= this.#top + this.#rhTop &&
            y <= this.#top + this.#rhTop + this.#rhHeight
        );
    }

    inSelection(x,y) {
        return (
            x >= this.#clipSelection.start && x < this.#clipSelection.end
            && y >= this.#top && y < this.#bottom)
            || this.inLeftHandle(x,y) || this.inRightHandle(x,y);
    }
}