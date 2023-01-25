// PBEarTrainer.ts
//
//
//
// This is the main program.  WebFont is instantiated in the calling
// html and passed to this class.  All other classes are instantiated
// here.  After the instantiations this class does nothing.
//

import {PBStatusWindow} from "./PBStatusWindow.js";
import {PBSounds} from "./PBSounds.js";
import {PBSequencer} from "./PBSequencer.js";
import {PBCharacterInput} from "./PBCharacterInput.js";
import {PBTester} from "./PBTester.js";
import {PBUI} from "./PBUI.js";
import {PBMIDI} from "./PBMIDI.js";

class PBEarTrainer {
    audioContext: AudioContext;
    statusWindow = new PBStatusWindow('Status Messages');
    characterInput: PBCharacterInput;
    midi: PBMIDI;
    sequencer: PBSequencer;
    soundModule: PBSounds;
    tester: PBTester;
    ui: PBUI;

    constructor(public webFont: any) {
        if (this.checkForWebAudio()) {
            this.checkForWebFont();
        }
    }

    checkForWebAudio() {
        try {   // Check if WebAudio API is available.
            this.audioContext = new AudioContext();
            this.statusWindow.writeMsg("Web Audio is available.");
            return (true);
        } catch (e) {
            this.statusWindow.writeErr("Web Audio API is not supported in this browser");
            return (false);
        }
    }

    checkForWebFont() {
        // Need to load the external fonts
        this.webFont.load({
            custom: { families: ['Aruvarb', 'ionicons'] },
            timeout:5000,
            fontactive: (familyName: string) => {
                this.statusWindow.writeMsg(familyName + " font available.");
            },
            fontinactive: (familyName: string) => {
                this.statusWindow.writeMsg(familyName + " font is not available.");
            },
            active: () => {
                this.initClass();   // The fonts are active, start everything
            }
        } as WebFont.Config);
    }

    initClass() {
        // Ready to roll.  Start everything in the proper order.
        this.soundModule = new PBSounds(this.statusWindow, this.audioContext);
        this.sequencer = new PBSequencer();
        this.tester = new PBTester(this.audioContext, this.sequencer);
        this.characterInput = new PBCharacterInput(this.sequencer, this.tester);
        this.midi = new PBMIDI(this.statusWindow, this.sequencer);
        this.ui = new PBUI(this.statusWindow, this.sequencer, this.tester);
        // Register the ServiceWorker
        navigator.serviceWorker.register('./built/PBServiceWorker.js').then((registration) => {
            this.statusWindow.writeMsg('The service worker has been registered ' + registration);
        });

    }
}

export {PBEarTrainer};