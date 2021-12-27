import { Loop } from "./ranger.js"
/*

Todo's for THIS sprint (create/integrate library)
- add links to trace clips back to source
- add a uuid to clip
*/

export class Library {
    #sourceBuffers = [];
    #loops = [];

    // // implement this after the core works
    // loadResource(url) {
    //     // handle all the xhr stuff here
    // }

    loadAudioBuffer(audioBuffer, name) {
        this.#sourceBuffers.push(audioBuffer);
        const loop = new Loop(audioBuffer, 0, 1);
        this.#loops.push(loop);
        return loop;
    }

    addLoop(loop) {
        this.#loops.push(loop);
    }

    getLoop(key) {

    }

}