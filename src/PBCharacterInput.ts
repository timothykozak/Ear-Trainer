//
// PBCharacterInput.ts
//
// Handles the character input from computer keyboard.
//

import {PBSequencer} from "./PBSequencer.js";
import {PBConst} from "./PBConst.js";
import {PBStatusWindow} from "./PBStatusWindow.js";

class PBCharacterInput {
    theNote: number = 0;

    constructor(public sequencer: PBSequencer) {
        document.addEventListener(PBConst.EVENTS.keyPress, (event: KeyboardEvent) => {this.onCharacterInput(event);}, false)
    }

    onCharacterInput(event: KeyboardEvent) {
        if (event.key)
            switch (event.key) {
                case 'm':
                case 'M':
                    PBStatusWindow.switchAll(); // Used for hiding/showing all status windows.
                    break;
                case 's':
                case 'S':
                    break;
                case ' ':
                    document.dispatchEvent(new CustomEvent(PBConst.EVENTS.transportButton,
                        {detail: PBConst.TRANSPORT_BUTTONS.START}));
                    break;
                default:
                    break;
            }
    }
}

export {PBCharacterInput};