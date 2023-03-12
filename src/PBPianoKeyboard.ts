//
// PBPianoKeyboard.ts
//
// Draws and handles all input/output through the piano keyboard interface.
// Since we only use one octave of CMaj, we only need to draw A#3 through C#5.
// Watches the sequencer to reflect the notes being played.
// The keyboard is used to answer tested note.

import {SequenceItem} from "./PBSequencer.js";
import {PBConst} from "./PBConst.js";
import {MyRect} from "./PBUI.js";

interface KeyRegion {
    path: Path2D,
    playing: boolean,
    fillStyle: string,
}

class PBPianoKeyboard {

    // Dimensions are in millimeters
    static WHITE_WIDTH = 24;
    static WHITE_LENGTH = 148;
    static BLACK_WIDTH = 13;
    static BLACK_LENGTH = 98;

    static BLACK_KEY_FILL_STYLE = 'black';
    static WHITE_KEY_FILL_STYLE = 'white';
    static HOVER_FILL_STYLE = 'darkgray';
    static SCALE_PER_WIDTH_PER_KEY = 0.000165;    // For determining best scale based on canvas width...
    static SCALE_PER_HEIGHT = 0.0065;   // and height

    // These two arrays are based on the 12 degree chromatic scale with C as degree 0
    static WHITE_KEYS = [true, false, true, false, true, true, false, true, false, true, false, true];
    static X_OFFSET = [ 0, -3, 0, 3, 0, 0, -3, 0, 0, 0, 3, 0];   // Most of the black keys are not centered
    keyRegions: KeyRegion[];

    drawingScale: number = 3;   // This scale is adjusted on resize
    hoverKey: number = -1;  // Key over which the mouse is hovering.  -1 means no key.

    constructor(public canvas: HTMLCanvasElement, public context: CanvasRenderingContext2D, public contextRect: MyRect) {
        if (canvas) {
            this.initListeners();
            this.resize(this.contextRect);
        }
    }

    initListeners() {
        this.canvas.addEventListener(PBConst.EVENTS.mouseDown, (event: MouseEvent) => {this.onMouseDown(event);});
        this.canvas.addEventListener(PBConst.EVENTS.mouseLeave, (event: MouseEvent) => {this.onMouseLeave(event);});
        this.canvas.addEventListener(PBConst.EVENTS.mouseMove, (event: MouseEvent) => {this.onMouseMove(event);});
        document.addEventListener(PBConst.EVENTS.sequencerNotePlayed, (event: CustomEvent) => {this.onSequencerNotePlayed(event);}, false);
        document.addEventListener(PBConst.EVENTS.testerFinished, (event: CustomEvent) => {this.drawKeyboard();}, false);
    }

    dispatchStatusMessage(isAnError: boolean, theMessage: string) {
        document.dispatchEvent(new CustomEvent(PBConst.EVENTS.statusMessage,
          {detail: {theType: PBConst.MESSAGE_TYPE.midi, error: isAnError, theText: theMessage}}));
    }

    onSequencerNotePlayed(event: CustomEvent) {
        // The sequencer has played a note.  Show the key as playing.
        let theItem: SequenceItem = event.detail;
        let theKey = theItem.note - PBConst.MIDI.LOW;
        if (this.hoverKey != theKey) {    // Not hovering over the key, update it
            this.fillRegion(theKey, theItem.state);
        }
    }

    static dispatchHoverEvent(theHoverKey: number) {
        let midiNote = (theHoverKey == -1) ? -1 : theHoverKey + PBConst.MIDI.LOW;
        document.dispatchEvent(new CustomEvent(PBConst.EVENTS.keyboardHover, {detail: midiNote})); // No longer hovering
    }

    checkForHover(event: MouseEvent): number {
        // Returns the key over which the mouse is hovering, or -1 for none.
        let x = event.offsetX;
        let y = event.offsetY;
        let theResult = -1;

        for (let index = 0; index < this.keyRegions.length; index++) {
            // Cycle through all the key regions to see if we have a match.
            if (this.context.isPointInPath(this.keyRegions[index].path, x, y)) {
                theResult = index;
                this.dispatchStatusMessage(false, "Mouseover: key " + index);
            }
        }
        return (theResult);
    }

    onMouseLeave(event: MouseEvent) {
        // Mouse left the canvas, can not be hovering
        this.dispatchStatusMessage(false, event.type + " event: x " + event.offsetX + " y " + event.offsetY);
        if (this.hoverKey != -1) {
            this.fillRegion(this.hoverKey, false);
        }
        this.hoverKey = -1;
        PBPianoKeyboard.dispatchHoverEvent(-1); // No longer hovering
    }

    onMouseMove(event: MouseEvent) {
        // The mouse has moved.  Check to see if the hover needs to be updated.
        let hoverKey = this.checkForHover(event);
        this.dispatchStatusMessage(false, event.type + " event: x " + event.offsetX + " y " + event.offsetY + "  hoverKey: " + hoverKey);

        if (hoverKey != -1) { // Hovering
            PBPianoKeyboard.dispatchHoverEvent(hoverKey);
            if (this.hoverKey != -1) { // Previously hovering
                if (!(hoverKey == this.hoverKey)) {    // Changed regions
                    this.fillRegion(this.hoverKey, false);
                }
            }
            this.fillRegion(hoverKey, true);
        } else { // Not hovering
            if (this.hoverKey != -1) {  // Remove old hover
                PBPianoKeyboard.dispatchHoverEvent(-1);
                this.fillRegion(this.hoverKey, false);
            }
        }
        this.hoverKey = hoverKey;
    }

    onMouseDown(event: MouseEvent) {
        // Mouse clicked.  Check to see if a note needs to be played.
        let hoverKey = this.checkForHover(event);
        this.dispatchStatusMessage(false, event.type + " event: x " + event.offsetX + " y " + event.offsetY + "  hoverKey: " + hoverKey);
        if (hoverKey != -1) {
            this.dispatchStatusMessage(false, "Piano: Clicked region " + hoverKey);
            let theNote = hoverKey + PBConst.MIDI.LOW;
            document.dispatchEvent(new CustomEvent(PBConst.EVENTS.sequencerExecuteCommand, {detail: {command: PBConst.SEQUENCER_COMMANDS.playNote, note: theNote}}));
        }
    }

    fillRegion(index: number, hover: boolean) {
        if ((index >= 0) && (index < this.keyRegions.length)) { // Valid region
            this.context.save();
            this.context.strokeStyle = "#000";
            let theKeyRegion = this.keyRegions[index];
            this.context.fillStyle = (hover) ? PBPianoKeyboard.HOVER_FILL_STYLE : theKeyRegion.fillStyle;
            this.context.fill(theKeyRegion.path);
            this.context.stroke(theKeyRegion.path);
            this.context.restore();
        }
    }

    clearContextRect() {
        this.context.clearRect(this.contextRect.x, this.contextRect.y, this.contextRect.width, this.contextRect.height);
    }

    updateDrawingScale(theScale: number) {
        this.drawingScale = theScale;
    }

    resize(theContextRect: MyRect) {
        // Calculate the scale based on the height and the width, selecting the minimum that fits.
        this.contextRect = theContextRect;
        let scaleByWidth = this.contextRect.width * PBPianoKeyboard.SCALE_PER_WIDTH_PER_KEY * (PBConst.MIDI.HIGH - PBConst.MIDI.LOW);
        let scaleByHeight = this.contextRect.height * PBPianoKeyboard.SCALE_PER_HEIGHT;
        this.updateDrawingScale(Math.min(scaleByHeight, scaleByWidth));
        this.drawKeyboard();
    }

    buildBlackKeyPath(orgX: number, orgY: number, midiIndex: number): Path2D {
        // Build an individual black key rectangle and return the path.
        let keyPath = new Path2D();
        let x = orgX + Math.floor(this.drawingScale * (PBPianoKeyboard.X_OFFSET[this.midiToScale(midiIndex)] - (PBPianoKeyboard.BLACK_WIDTH / 2)));
        let width = Math.floor(this.drawingScale * PBPianoKeyboard.BLACK_WIDTH);
        let height = Math.floor(this.drawingScale * PBPianoKeyboard.BLACK_LENGTH);
        keyPath.rect(x, orgY, width, height);
        return (keyPath);
    }

    buildWhiteKeyPath(orgX: number, orgY: number, midiIndex: number): Path2D {
        // Builds and and returns an individual path for a white key.
        // The white key is a rectangle with a notch from a black key
        // on at least one side.  Math.floor is used to avoid fractional pixels.
        let keyPath = new Path2D();
        let leftNotch = 0;  // Determine left notch, if any
        if (!PBPianoKeyboard.WHITE_KEYS[this.midiToScale(midiIndex - 1)])
            leftNotch = Math.abs(Math.floor(this.drawingScale * (PBPianoKeyboard.X_OFFSET[this.midiToScale(midiIndex - 1)] + (PBPianoKeyboard.BLACK_WIDTH / 2))));
        let rightNotch = 0; // Determine right notch, if any
        if (!PBPianoKeyboard.WHITE_KEYS[this.midiToScale(midiIndex + 1)])
            rightNotch = Math.abs(Math.floor(this.drawingScale * (PBPianoKeyboard.X_OFFSET[this.midiToScale(midiIndex + 1)] - (PBPianoKeyboard.BLACK_WIDTH / 2))));
        let notchLength = Math.floor(this.drawingScale * PBPianoKeyboard.BLACK_LENGTH);
        let width = Math.floor(this.drawingScale * PBPianoKeyboard.WHITE_WIDTH);
        let unNotchedLength = Math.floor(this.drawingScale * (PBPianoKeyboard.WHITE_LENGTH - PBPianoKeyboard.BLACK_LENGTH));    // Length of the key that is not notched
        let x = orgX + leftNotch;
        let y = orgY;

        keyPath.moveTo(x, y);   // Build the path
        keyPath.lineTo(x, y += notchLength);
        keyPath.lineTo(x -= leftNotch, y);
        keyPath.lineTo(x, y += unNotchedLength);
        keyPath.lineTo(x += width, y);
        keyPath.lineTo(x, y -= unNotchedLength);
        keyPath.lineTo(x -= rightNotch, y);
        keyPath.lineTo(x, orgY);
        keyPath.closePath();
        return (keyPath);
    }

    midiToScale(theMIDI: number) : number {
        let theScale = theMIDI % 12;
        return(theScale);
    }

    buildKeyboardRegions() {
        // Build all of the individual white and black key paths.
        this.keyRegions = [];   // Toss old regions
        let orgX = this.contextRect.x + Math.floor(this.drawingScale * PBPianoKeyboard.BLACK_WIDTH / 2);    // Round down to whole pixel, and take into account scaling
        let orgY = this.contextRect.y;
        let thePath: Path2D = null;
        let theFillStyle: string = null;

        for (let midiIndex = PBConst.MIDI.LOW; midiIndex <= PBConst.MIDI.HIGH; midiIndex++) {
            let white = PBPianoKeyboard.WHITE_KEYS[this.midiToScale(midiIndex)];
            if (white) {
                thePath = this.buildWhiteKeyPath(orgX, orgY, midiIndex);
                theFillStyle = PBPianoKeyboard.WHITE_KEY_FILL_STYLE;
                orgX += Math.floor(this.drawingScale * PBPianoKeyboard.WHITE_WIDTH);
            } else {
                thePath = this.buildBlackKeyPath(orgX, orgY, midiIndex);
                theFillStyle = PBPianoKeyboard.BLACK_KEY_FILL_STYLE;
            }
            this.keyRegions.push({
                path: thePath,
                playing: false,
                fillStyle: theFillStyle,
            });
        }
    };

    drawKeyboard() {
        this.clearContextRect();
        this.buildKeyboardRegions();
        this.keyRegions.forEach((region, index) => {
            this.fillRegion(index, false);
        });
    }
}

export {PBPianoKeyboard};