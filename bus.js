import { stringToHTML } from "./helpers.js";

export class SystemBus {
    #audioContext;
    #htmlRoot;
    #channels = [];
    #endChain;
    #finalChain;
    #finalVol;

    constructor(audioContext, htmlRoot, masterChain=[]) {
        this.#audioContext = audioContext;
        this.#htmlRoot = htmlRoot;
        this.#endChain = masterChain;
        this.#finalVol = new GainNode(audioContext);
        this.#finalChain = [this.#finalVol, audioContext.destination];
        this.reconnectDownChain();

        const volumeControl = document.querySelector('#master-bus .master .volume');
        volumeControl.addEventListener('input', function(event) {
            this.#finalVol.gain.value = event.target.value; 
        }.bind(this));
    }

    reconnectDownChain() {
        const chainNodes = this.#endChain.concat(this.#finalChain);

        let chain = chainNodes[0];
        for(let node of chainNodes.slice(1)) {
            chain = chain.connect(node);
        }

        for(let channel of this.#channels) {
            channel.gain.connect(chainNodes[0]);            
        }
    }

    appendEffects(nodes) {
        this.#endChain = this.#endChain.concat(nodes);
        this.reconnectDownChain();
    }

    addChannel(name='') {
        const channelId = 'channel-' + this.#channels.length;
        if(name == '') {
            name = channelId;
        }

        const tmp = document.createElement('div');
        tmp.innerHTML = 
            `<div class="channel" id="${channelId}">
                <p>Channel: ${name}</p>
            </div>
            `;
        const channelHTML = tmp.firstChild;
            
        const channelsSection = document.querySelector('#master-bus .channels');
        channelsSection.appendChild(channelHTML);


        const gain = new GainNode(this.#audioContext);
        this.#channels.push({name: name, gain: gain});

        this.reconnectDownChain();

        return gain;
    }

    set finalVol(volume) {
        this.#finalVol = volume;
    }

 
}

class WetDry {
    #node;
    #wetGain;
    #dryGain;

    context;
    numberOfInputs;
    numberOfOutputs;
    channelCount;
    channelCountMode;
    channelInterpretation

    constructor(node) {
        this.#node = node;
        this.#wetGain = new GainNode(node.context);
        this.#dryGain = new GainNode(node.context);
    }

    connect(node) {
        this.#wetGain.connect(node);
        this.#dryGain.connect(node);
        return node;
    }
    
    disconnect(node) {
        this.#wetGain.disconnect(node);
        this.#dryGain.disconnect(node);
        return node;
    }

    // pass all the properties through to #node
    get context() { return this.#node.context; }
    get numberOfInputs() { return this.#node.numberOfInputs; }
    get numberOfOutputs() { return this.#node.numberOfOutputs; }

    get channelCount() { return this.#node.channelCount; }
    set channelCount(channelCount) { this.#node.channelCount = channelCount; }

    get channelCountMode() { return this.#node.channelCountMode; }
    set channelCountMode(channelCountMode) { this.#node.channelCountMode = channelCountMode; }

    get channelInterpretation() { return this.#node.channelInterpretation; }
    set channelInterpretation(channelInterpretation) { this.#node.channelInterpretation = channelInterpretation; }


}



// below was copied over from loopa-ranger.js during cleanup as
// model for using a distortion and adding ot the system bus
//   //
//   // Add any master effects
//   // 
//   _distNode = _audioCtx.createWaveShaper();
//   _distNode.curve = makeDistortionCurve(_distortionAmount);
//   _distNode.oversample = '4x';
//   _bus.appendEffects(_distNode);
  
  
//   //
//   // connect up all of the UI controls
//   //
  
//   // distortion. this is a master chain control
//   const distortionAmount = document.getElementById('distortion');
//   distortionAmount.addEventListener('input', function() {
//       _distortionAmount = this.value;
//       _distNode.curve = makeDistortionCurve(_distortionAmount);
//   });

// function makeDistortionCurve(amount) {
//     var k = typeof amount === 'number' ? amount : 50,
//       n_samples = 256,
//       curve = new Float32Array(n_samples),
//       deg = Math.PI / 180,
//       i = 0,
//       x;
//     for ( ; i < n_samples; ++i ) {
//       x = i * 2 / n_samples - 1;
//       curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
//     }
//     return curve;
//   };