//
// PBSounds.ts
//
// This class downloads INSTRUMENT_FILE_NAME, which has information on all sounds on the server
// An instrument has notes B3 through C5 inclusive.  These are separate files that are downloaded.
// This class listens to the sequencer and plays the sequenced notes.
//

import {PBStatusWindow} from "./PBStatusWindow.js";
import {PBConst} from "./PBConst.js";

interface Sound {
    playing: boolean,
    available: boolean,
    buffer: AudioBuffer,
    source: AudioBufferSourceNode
}

interface Instrument {
    name: string,
    description: string,
    url: string
}

class PBSounds {
    static INSTRUMENT_FILE_NAME = "instruments.txt";    // This JSON file contains a list of available instruments.
                                                        // Each instrument is an Instrument interface.
                                                        // At least one instrument must be defined.
                                                        // The first instrument is loaded automatically.
    static BASE_URL = "assets/sounds/";    // This directory contains instruments.txt, and the subdirectories contain all the sounds files.
    static MIDI_FILE_REG_EXP = /\d{1,3}\.mp3/;    // Used to separate a valid MIDI file name from the BASE_URL

    sounds: Array<Sound>;   // The individual sounds for the loaded instrument.
    allSoundsLoaded = false;    // Set to true when all the sounds for the instrument have been loaded.
    instruments: Instrument[] = null;    // From the JSON file INSTRUMENT_FILE_NAME.
    soundsAvailable =0; // Actual sounds available for this instrument.
    soundsRequested = 0;    // Total sounds requested for this instrument.

    constructor(public msgWindow: PBStatusWindow, public context: AudioContext) {
        // Ask for the Instrument file and download the first one.
        document.addEventListener(PBConst.EVENTS.sequencerNotePlayed, (event: CustomEvent) => {this.onSequencer(event)}, false);
        this.buildSoundsArray();
        this.loadInstrumentsJSON();
    }

    onSequencer(event: CustomEvent) {
        // The sequencer has asked that a note be played.
        if (event.detail.state)
            this.playSound(event.detail.note);
    }

    buildSoundsArray() {
        // Generates a default array but does not populate it.
        // This is a sparse array with only the available notes defined.
        this.sounds = [];    // Index into array is the MIDI note number.
        for (let i = PBConst.MIDI.LOW.SOUND; i <= PBConst.MIDI.HIGH.SOUND; i++) {
            this.sounds[i]= {
                available: false,
                buffer: null,
                source: this.context.createBufferSource(),
                playing: false
            };
            this.sounds[i].source.connect(this.context.destination);
        }
    }

    clearOutSoundsArray() {
        // Get rid of all old sounds in preparation for a new instrument.
        this.sounds.forEach((sound: Sound) => {
            sound.available = false;
            sound.source.buffer = null;
            sound.playing = false;
        })
    }

    updateSoundsRequested() {
        // If all sounds have been requested, then dispatch instrument is loaded event.
        this.soundsRequested++;
        if (this.soundsRequested > (PBConst.MIDI.HIGH.SOUND - PBConst.MIDI.LOW.SOUND)) {  // All download requests are finished.
            this.allSoundsLoaded = true;
            document.dispatchEvent(new Event(PBConst.EVENTS.soundsInstrumentLoaded));
            this.msgWindow.writeMsg("Instrument loaded.");
        }
    }

    loadASound(url: string) {
        // Request the sound, decode it and place it in the sounds array.
        window.fetch(PBSounds.BASE_URL + url).
        then((response: Response) => {
            if (!response.ok) { // Can't find the file.
                throw new Error('Network error');
            }
            return (response.arrayBuffer());
        }).then((theArrayBuffer: ArrayBuffer) => {  // Try to decode it.
            return(this.context.decodeAudioData(theArrayBuffer))
        }).then((decodedData: AudioBuffer) => { // Everything is good, add it to the sounds array.
            this.soundsAvailable++;
            this.updateSoundsRequested();
            let fileName = url.match(PBSounds.MIDI_FILE_REG_EXP)[0];    // Figure out which note it is.
            let midiNote = Number(fileName.match(/\d+/)[0]);
            let sound = this.sounds[midiNote];  // Put it in the array.
            sound.available = true;
            sound.buffer = decodedData;
            sound.source.buffer = decodedData;
            sound.playing = false;
        }).catch((error: Error) => {
            this.msgWindow.writeErr('Could not retrieve ' + url + ': ' + error.message);
        })
    }

    loadInstrumentsJSON() {
        // Download the JSON file with the Instrument definitions
        window.fetch(PBSounds.BASE_URL + PBSounds.INSTRUMENT_FILE_NAME).
        then((response) => {
            if (!response.ok) { // Can't get the file.
                throw new Error('Network error');
            }
            return (response.json());   // Got something.
        }).then((theJSON) => {  // Convert from JSON
            this.instruments = theJSON;
            this.msgWindow.writeMsg("instruments.txt was loaded.");
            this.loadInstrument(this.instruments[0]);   // Load the first instrument
        }).catch((error) => {
            this.msgWindow.writeErr('Could not retrieve ' + PBSounds.INSTRUMENT_FILE_NAME + ': ' + error.message);
        })
    }

    loadInstrument(instrument: Instrument) {
        // Download the sounds for a specific instrument.
        this.clearOutSoundsArray(); // Get rid of all the old sounds
        this.allSoundsLoaded = false;   // Prepare for the downloading
        this.soundsAvailable = 0;
        this.soundsRequested = 0;
        for (let i = PBConst.MIDI.LOW.SOUND; i <= PBConst.MIDI.HIGH.SOUND; i++) {    // Get the entire range
            this.loadASound(instrument.url + i + ".mp3");
        }
    }

    playSound(midiNote: number) {
        // Play the note.  If already playing then stop it and start over.
        if ((midiNote >= PBConst.MIDI.LOW.SOUND) && (midiNote <= PBConst.MIDI.HIGH.SOUND)) {
            let sound = this.sounds[midiNote];
            if (sound.available) {
                if (sound.playing) {    // Can only start once, need a new BufferSource
                    sound.source = this.context.createBufferSource();
                    sound.source.buffer = sound.buffer;
                    sound.source.connect(this.context.destination);
                }
                sound.source.start();
                sound.playing = true;
            }
        }
    }
}

export {PBSounds};