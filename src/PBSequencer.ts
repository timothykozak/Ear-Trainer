//
//  pbSequencer.ts
//
// The sequencer controls the playing of notes.  This is accomplished
// by running the class on a 100ms timer.  A sequence property contains an
// array of SequenceItems, which defines what note to play and when.
// Events are dispatched when notes are played.  It is up to other
// classes to respond to these events.
//

import {PBConst, NoteType} from "./PBConst.js";

interface SequenceItem {
    note: number,   // A MIDI note
    state: boolean, // True equals note on
    time: number,   // Current time in clock ticks
    noteType: NoteType
}

class PBSequencer {
    static I_CHORD = [PBConst.MIDI.MIDDLE_C, PBConst.MIDI.MIDDLE_C + 4, PBConst.MIDI.MIDDLE_C + 7];
    static IV_CHORD = [PBConst.MIDI.MIDDLE_C + 5, PBConst.MIDI.MIDDLE_C + 9, PBConst.MIDI.MIDDLE_C];
    static V_CHORD = [PBConst.MIDI.MIDDLE_C + 7, PBConst.MIDI.MIDDLE_C - 1, PBConst.MIDI.MIDDLE_C + 2];

    sequence: SequenceItem[] = [];
    sequenceRunning: boolean;
    ticks = 0;
    ticksBetweenChords = 5;
    noteBeingTested: number;

    constructor() {
        this.resetSequence();
        setInterval(() => {this.onTimer()}, 100);   // One tick equals 100ms
        document.addEventListener(PBConst.EVENTS.sequencerExecuteCommand, (event: CustomEvent) => {this.onCommand(event);});
    }

    dispatchStatusMessage(isAnError: boolean, theMessage: string) {
        document.dispatchEvent(new CustomEvent(PBConst.EVENTS.statusMessage,
          {detail: {theType: PBConst.MESSAGE_TYPE.sequencer, error: isAnError, theText: theMessage}}));
    }

    onCommand(event: CustomEvent) {
        let theCommand = event.detail.command;
        let theNote = event.detail.note;
        switch (theCommand) {
            case PBConst.SEQUENCER_COMMANDS.reset:
                this.resetSequence();
                break;
            case PBConst.SEQUENCER_COMMANDS.playNote:
                this.playNote(theNote);
                break;
            case PBConst.SEQUENCER_COMMANDS.playCadenceAndNote:
                this.cadencePlusNote(theNote);
                break;
            default:
                this.dispatchStatusMessage(true, 'Received unknown execucteCommand:' + theCommand);
                break;
        }
    }

    setSequencerRunning(isRunning: boolean) {
        this.sequenceRunning = isRunning;
        document.dispatchEvent(new CustomEvent(PBConst.EVENTS.sequencerRunning, {detail: isRunning}));
    }

    resetSequence() {
        this.setSequencerRunning(false);
        this.ticks = 0;
        this.sequence = []; // Clear out old sequence
    }

    onTimer() {
        // Timer event received.  See if any notes to be played.
        if (this.sequence.length > 0) {
            this.setSequencerRunning(true);
            this.sequence.forEach((item, index) => {    // The items are not in any order, need to check all of them.
                if (item.time == this.ticks) {  // Dispatch events to play notes and to update the display.
                    document.dispatchEvent(new CustomEvent(PBConst.EVENTS.sequencerNotePlayed, {detail: item}));
                    if (item.noteType == NoteType.Testing) {
                        document.dispatchEvent(new CustomEvent(PBConst.EVENTS.sequencerTestNotePlayed, {detail: item}));
                    }
                }
            });

            this.sequence = this.sequence.filter((item) => {return(item.time != this.ticks)}); // Remove the processed notes
            if (this.sequence.length == 0) {    // No more notes
                this.resetSequence();
            } else {
                this.ticks++;
            }
        }
    }

    validMIDI(theMIDI: number) : boolean {
        return ((theMIDI >= PBConst.MIDI.LOW.SOUND) && (theMIDI <= PBConst.MIDI.HIGH.SOUND));
    }

    addNoteToSequence(theNote: number, theState: boolean, theTime: number, theNoteType: NoteType) { // Tack to end of sequence.  To do a chord, don't increment the time
        this.sequence.push({note: theNote, state: theState, time: theTime, noteType: theNoteType} as SequenceItem);
    }

    playNote(theMIDI: number) {
        // Play a note right now
        if (this.validMIDI(theMIDI)) {
            this.addNoteToSequence(theMIDI, true, this.ticks, NoteType.Immediate);
            this.addNoteToSequence(theMIDI, false, this.ticks + this.ticksBetweenChords, NoteType.Immediate);
        }
    }

    addChord(theNotes: number[], theState: boolean, theTime: number, theNoteType: NoteType) {
        theNotes.forEach((theNote, theIndex) => {
            this.addNoteToSequence(theNote, theState, theTime, theNoteType);
        })
    }

    addTerminatedChord(theNotes: number[], theTime: number, theNoteType: NoteType) {
        this.addChord(theNotes, true, theTime, theNoteType);  // Turn the chord on
        this.addChord(theNotes, false, theTime + this.ticksBetweenChords, theNoteType);  // Turn the chord off
    }

    cadenceSequence() {
        let theTime = 1;
        this.addTerminatedChord(PBSequencer.I_CHORD, theTime, NoteType.Cadence1);
        theTime += this.ticksBetweenChords;
        this.addTerminatedChord(PBSequencer.IV_CHORD, theTime, NoteType.Cadence2);
        theTime += this.ticksBetweenChords;
        this.addTerminatedChord(PBSequencer.V_CHORD, theTime, NoteType.Cadence3);
        theTime += this.ticksBetweenChords;
        this.addTerminatedChord(PBSequencer.I_CHORD, theTime, NoteType.Cadence4);
    }

    cadencePlusNote(theNote: number) {
        this.noteBeingTested = theNote;
        this.cadenceSequence();
        this.addNoteToSequence(theNote, true, this.ticksBetweenChords * 8, NoteType.Testing);
        this.addNoteToSequence(theNote, false, this.ticksBetweenChords * 9, NoteType.Testing);
        document.dispatchEvent(new CustomEvent(PBConst.EVENTS.sequencerCadenceStarted, {detail: this.noteBeingTested}));
    }
}
export {PBSequencer, NoteType, SequenceItem};