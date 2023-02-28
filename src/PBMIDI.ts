// PBMIDI.ts
//
// This class handles all MIDI communications.
// If WebMIDI is available, it collects all the MIDI
// inputs and outputs.  Only note on and note off
// messages are handled.  Messages from all MIDI inputs
// are accepted.  Outputs are only to the first MIDI
// output.  This class listens to EVENTS.sequencerNotePlayed
// for the playing of notes, and dispatches
// EVENTS.keyboardHover when a key is pressed.
// The pedal is used to ask for the next note, but it sends
// multiple messages, so only the first one is accepted.
//
// The first time this app is run, Chrome will ask the user
// if MIDI can be used.  After that it should remember the
// user's choice.
//
// For the MIDI spec see:
//    https://www.w3.org/TR/webmidi/#sending-midi-messages-to-an-output-device
// For a summary of MIDI messages see:
//    https://www.midi.org/midi/specifications/item/table-1-summary-of-midi-message

import {PBConst} from "./PBConst.js";
import {PBSequencer} from "./PBSequencer";

class PBMIDI {
    available: boolean = false;
    midiAccess: WebMidi.MIDIAccess;
    inputs: WebMidi.MIDIInput[] = [];
    outputs: WebMidi.MIDIOutput[] = [];
    outputIndex: number = -1;
    canAcceptPedal: boolean = false;

    constructor(public sequencer: PBSequencer) {
        this.checkForMIDI();
        this.initListeners();
    }

    initListeners() {
        document.addEventListener(PBConst.EVENTS.sequencerNotePlayed, (event: CustomEvent) => {this.onSequencer(event)}, false);
        document.addEventListener(PBConst.EVENTS.sequencerTestNotePlayed, (event: CustomEvent) => {this.onTestNotePlayed(event)}, false);
        document.addEventListener(PBConst.EVENTS.sequencerCadenceStarted, (event: CustomEvent) => {this.onCadenceStarted(event)}, false);
    }

    setAvailable(value: boolean) {
        this.available = value;
    }

    dispatchStatusMessage(isAnError: boolean, theMessage: string) {
        document.dispatchEvent(new CustomEvent(PBConst.EVENTS.statusMessage,
          {detail: {theType: PBConst.MESSAGE_TYPE.midi, error: isAnError, theText: theMessage}}));
    }

    checkForMIDI() {
        // The callbacks of a promise will never be called before the completion
        // of the current run of the JavaScript event loop.  Therefore, the
        // availability of MIDI is not known at the end of this function.
        // The setAvailable method above is a good breakpoint for both the resolve
        // and failure callbacks.
        if (navigator.requestMIDIAccess) {
            // Chrome requires that sysex be required
            navigator.requestMIDIAccess({sysex: true}).then((midiAccess) => {
                this.setAvailable(true);
                this.midiAccess = midiAccess;
                this.dispatchStatusMessage(false, "MIDI is available.");

                for (let input of midiAccess.inputs.values()) {
                    this.inputs.push(input);
                    input.onmidimessage = (message) => {
                        this.onMIDIMessage(message)
                    };
                }
                for (let output of midiAccess.outputs.values()) {
                    this.outputIndex = 0;   // Default to the first MIDI output
                    this.outputs.push(output);
                }
            }, (error) => {
                this.dispatchStatusMessage(true, "MIDI is NOT available.");
                this.setAvailable(false);
            });
        }
    }

    onTestNotePlayed(event: CustomEvent) {
        this.canAcceptPedal = true;
    }

    onCadenceStarted(event: CustomEvent) {
        this.canAcceptPedal = false;
    }

    onMIDIMessage(message: WebMidi.MIDIMessageEvent) {
        let command = (message.data[0] & 0xf0) >>> 4;   // Command is the highest nibble
        let controller = message.data[0] & 0x0f;       // Controller is the lowest nibble

        if (message.data[0] != PBConst.MIDI.MESSAGES.ACTIVE_SENSING) {
            let note = message.data[1];
            let velocity = (message.data.length > 2) ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

            switch (command) {
                case PBConst.MIDI.MESSAGES.NOTE_ON:
                    (velocity > 0) ? this.noteOnReceived(note, velocity) : this.noteOffReceived(note);
                    break;
                case PBConst.MIDI.MESSAGES.NOTE_OFF:
                    this.noteOffReceived(note);
                    break;
                case PBConst.MIDI.MESSAGES.CONTINUOUS_CONTROLLER:
                    if (this.canAcceptPedal) {
                        let pedal = note;
                        if ((pedal >= PBConst.MIDI.CONTINUOUS_CONTROLLER.DAMPER_PEDAL) &&
                            (pedal <= PBConst.MIDI.CONTINUOUS_CONTROLLER.LEGATO_FOOT_SWITCH)) {
                            document.dispatchEvent(new CustomEvent(PBConst.EVENTS.transportButton,
                                                        {detail: PBConst.TRANSPORT_BUTTONS.START}));
                            this.canAcceptPedal = false;
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    }

    noteOnReceived(note: number, velocity: number) : void {
        this.sequencer.playNote(note);
        // This will display the note pressed on the keyboard.
        document.dispatchEvent(new CustomEvent(PBConst.EVENTS.keyboardHover, {detail: note}));
    }

    noteOffReceived(note: number) : void {
        // These are currently ignored.
    }

    onSequencer(event: CustomEvent) {
        // The sequencer has asked that a note be played.
        if (this.available && (this.outputIndex != -1)) {
            let midiMsg = (event.detail.state) ? PBConst.MIDI.MESSAGES.NOTE_ON : PBConst.MIDI.MESSAGES.NOTE_OFF;   // 0x90 is note on, 0x80 is note off
            midiMsg = midiMsg << 4;
            this.outputs[this.outputIndex].send([midiMsg, event.detail.note, 0x7f]);    // 0x7f is maximum attack
        }
    }
}

export {PBMIDI};