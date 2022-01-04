

/*
    This is paused for now. It seems like a good idea, though I don't know if
    it is really necessary. For now it is not the main point, so leaving it here

    These classes are to manage the UI aspects of the different modules.
    The entire application would have 1 Rack which is then populated with
    several, possibly optional or even plugin, modules.

    There are two types of modules: Playable and Non-playable

    Non-playable:
    - would be the base class and, as of now, would provide for
      show/hide functionality and allow the rack to manage which modules
      are displayed or not.
    - this would be some to any future functionality common to all modules

    Playable:
    - provide play(), stop(), reset() methods
    - integrate with SystemBus to control which access to different input/output sources/destinations
 */

class Module {
    #htmlRoot

    draw() {

    }

    show() {

    }

    hide() {

    }

}

class CutterExpander {
    draw() {

    }

    loadLoop() {
        
    }
}

class Rack {
    #modules = [];
    #activeModule = null;

    addModule(module) {
        this.#modules.push(module);
    }

    draw() {

    }
}