

export class Looper {
    #audioContext;
    #primaryBuffer;
    #loopBuffer;
    #looper;
    #downstreamChain;

    constructor(audioContext, downstreamChain=null) {
        this.#audioContext = audioContext;
        this.#downstreamChain = downstreamChain;
    }

    play() {
        let looper = this.#audioContext.createBufferSource();
        looper.buffer = this.#loopBuffer;
        if(this.#downstreamChain) {
            console.log("using passed in downstream chain")

            // looper.connect(this.#downstreamChain[1]).connect(this.#audioContext.destination);
            looper.connect(this.#downstreamChain[0]).connect(this.#downstreamChain[1]).connect(this.#audioContext.destination);

            // let head = looper;
            // for(const node in this.#downstreamChain) {
            //     head = head.connect(node);
            // } 
            // head.connect(this.#audioContext.destination);
            // looper.connect(this.#downstreamChain).connect(this.#audioContext.destination);
        } else {
            console.log("connecting directly to the output")
            looper.connect(this.#audioContext.destination);
        }
        looper.loop = true;
        looper.start();
        this.#looper = looper;
    }
    
    stop() {
        this.#looper.stop();
        this.#looper = null;
    }
    
    reset() {
        if(this.#looper) {
            this.#looper.stop();
            this.play();
        }
    }
    
    reClip(start, end, width) {
        let startSample = Math.floor(start * 1.0 * this.#primaryBuffer.length / width);
        let stopSample = Math.floor(end * 1.0 * this.#primaryBuffer.length / width);
        // console.log("reClip: ", start, end, width, startSample, stopSample);
        this.#loopBuffer = this.createLoopBuffer(startSample, stopSample-startSample);
        this.reset();
    }
    
    loadPrimaryBuffer(audioBuffer) {
        this.#primaryBuffer = audioBuffer; //this.#audioContext.decodeAudioData(arrayBuffer);
        this.#loopBuffer = this.createLoopBuffer();
    }

    get primaryBufferData() {
        let audioData = new Float32Array(this.#primaryBuffer.length);
        this.#primaryBuffer.copyFromChannel(audioData, 0);
        return audioData;
    }

    get loopBufferData() {
        let audioData = new Float32Array(this.#loopBuffer.length);
        this.#loopBuffer.copyFromChannel(audioData, 0);
        return audioData;
    }

    /*
     * Create a new AudioBuffer for the looper.
     * While a new AudioBuffer object is created each time the clip
     * changes, it does not reload or copy the actual audio data,
     * but instead gets a new limited "view" into the primary buffer
     */
    createLoopBuffer(start=0, length=0) {
        if(length === 0) {
            length = this.#primaryBuffer.length - start;
        }
    
        let share = new AudioBuffer({
            length: length,
            numberOfChannels: this.#primaryBuffer.numberOfChannels,
            sampleRate: this.#primaryBuffer.sampleRate,
            channelCount: this.#primaryBuffer.channelCount
        });
        
        for(let i=0; i < this.#primaryBuffer.numberOfChannels; i++) {
            let f32Buf = this.#primaryBuffer.getChannelData(i);
            let newf32Buf = new Float32Array(f32Buf.buffer, start*4, length);
            // console.log("createLoopBuffer: ", start, length);
            share.copyToChannel(newf32Buf, i);
        }
    
        return share;
    }
}


