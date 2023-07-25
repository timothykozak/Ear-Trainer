//
// PBNotation.ts
//
// This module handles the musical notation.  It is passed an HTMLCanvasElement
// on which it draws out the treble staff in the key of C Major.

import {NoteType, SequenceItem} from "./PBSequencer.js";
import {Accidentals, KeySignature, PBConst} from "./PBConst.js";
import {MyRect, PBUI} from "./PBUI.js";
import {TestItem} from "./PBTester.js";
import {DEFAULT_OPTIONS, MyOptions} from "./PBOptionsPage.js";

interface GlyphItem {
    value: string,
    rem: number
}

interface ChromaticNote {
    degree: number, // The diatonic degree, 0 is the tonic
    accidental: Accidentals
}

interface QualifiedNote {
    // A qualified note fully defines the note
    midi: number,   // Middle C is 60
    octave: number, // Middle C is octave 4
    degree: number, // The diatonic degree, 0 is the tonic
    accidental: Accidentals
}

class PBNotation {
    // Sizing and positioning of staff and notes is in widths of a standard note.
    // Any time the contextRect is resized, this width will be recalculated so that
    // the staff can be maximized.
    static ORG_X_IN_NOTE_WIDTHS = 0.5;
    static ORG_Y_IN_NOTE_HEIGHTS = 6.0;
    static FONT_SIZE_IN_NOTE_WIDTHS = 2;
    static QUALIFIED_NOTE_WIDTH_IN_NOTE_WIDTHS = 2.1;
    static NOTE_HEIGHT_IN_NOTE_WIDTHS = 0.5;
    static STAFF_WIDTH_IN_NOTE_WIDTHS = 13;
    static STAFF_HEIGHT_IN_NOTE_WIDTHS = 5.2;
    static ORG_WIDTH = 20;  // The width of the origin cross in pixels

    theOptions: MyOptions = DEFAULT_OPTIONS;

    static xByNoteType = [2, 3, 4, 5, 6, 8, 10];  // Units are in noteWidths

    static tonicByKeySignature = [54, 61, 56, 63, 58, 53, 60, 55, 62, 57, 64, 59];   // Midi note
    static accidentalsByKeySignature = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];  // Negative is a flat, positive is a sharp


    // These values are updated in the constructor and when the contextRect is resized.
    orgX: number;  // Coords of the origin, which is the lower left corner of the treble staff
    orgY: number;
    fontSize: number;
    noteWidth: number;
    noteHeight: number;

    currentHoverNote: number;   // A midi value, or -1 if not hovering.
    answerNote: QualifiedNote = null;
    answerNoteCorrect: boolean;
    answerNoteCorrectX: number; // Where the check mark or x is drawn
    answerNoteCorrectY: number;

    grandStaff: boolean = false;

    showHelpers: boolean = false;    // The origin and various rectangles

    constructor(public context: CanvasRenderingContext2D, public contextRect: MyRect) {
        this.resize(this.contextRect);  // The initial sizing.
        this.initListeners();
    }

    initListeners() {
        document.addEventListener(PBConst.EVENTS.sequencerCadenceStarted, () => {this.onCadenceStarted();}, false);
        document.addEventListener(PBConst.EVENTS.sequencerNotePlayed, (event: CustomEvent) => {this.onSequencer(event);}, false);
        document.addEventListener(PBConst.EVENTS.keyboardHover, (event: CustomEvent) => {this.onHover(event);}, false);
        document.addEventListener(PBConst.EVENTS.testerNoteAnswered, (event: CustomEvent) => {this.onAnswered(event);}, false);
        document.addEventListener(PBConst.EVENTS.testerFinished, (event: CustomEvent) => {this.answerNote =null; this.redraw();}, false);
        document.addEventListener(PBConst.EVENTS.optionsUpdated, (event: CustomEvent) => {this.onOptionsUpdated(event);}, false);
    }

    onAnswered(event: CustomEvent) {
        // Called when the note being tested is answered.
        this.answerNoteCorrect = (event.detail.theTestItem as TestItem).correct;
        this.answerNote = this.midiToQualifiedNote(event.detail.theTestItem.answerNote);
        this.drawHoverNote(this.currentHoverNote);
    }

    drawAnswerNote() {
        if (this.answerNote) {
            let x = this.answerNoteCorrectX;
            let y = this.answerNoteCorrectY;
            if (this.answerNoteCorrect)
                this.drawGlyph(x, y, PBConst.GLYPHS.checkMark, 'left', 'middle', 'green', 1, "ionicons");
            else
                this.drawGlyph(x, y, PBConst.GLYPHS.xMark, 'left', 'middle', 'red', 1, "ionicons");
            this.drawQualifiedNote(x, this.answerNote, 'black');
        }
    }

    onCadenceStarted() {
        // The cadence has started.  Redraw the staff.
        this.answerNote = null;
        this.redraw();
    }

    onHover(event: CustomEvent) {
        // Mouse is hovering over the keyboard.  Draw the hover note.
        this.drawHoverNote(event.detail);
    }

    drawHoverNote(midiNote: number, color: string = 'gray') {
        // Draw the note in the hovering area of the staff and then draw the answer
        // note over top of it.
        // Somebody else may be using the clipping rect, so we need to save and then
        // restore it when we finish.
        this.currentHoverNote = midiNote;
        let x = this.answerNoteCorrectX;
        let y = this.orgY;
        let hoverRect = PBUI.buildMyRect(x - this.noteWidth * 0.5, 0, this.noteWidth * PBNotation.QUALIFIED_NOTE_WIDTH_IN_NOTE_WIDTHS, this.contextRect.height);

        this.context.save();    // Save current clipping path, and update with hover clipping pat
        this.context.beginPath();
        this.context.rect(hoverRect.x, hoverRect.y, hoverRect.width, hoverRect.height);
        this.context.clip();

        this.context.clearRect(hoverRect.x, hoverRect.y, hoverRect.width, hoverRect.height);
        if (this.showHelpers)
            this.drawRect(hoverRect.x, hoverRect.y, hoverRect.width, hoverRect.height, 1, 'red', 'butt');
        this.drawGlyph(x - this.noteWidth, y, PBConst.GLYPHS.staff5Lines, 'left', 'middle', 'black', 3);
        if (midiNote != -1)
            this.drawQualifiedNote(x, this.midiToQualifiedNote(midiNote), color);
        this.drawAnswerNote();
        this.context.restore(); // Restore old clipping path
    }

    onOptionsUpdated(event: CustomEvent) {
        this.theOptions = event.detail;
        this.redraw();
    }
    
    resize(theContextRect: MyRect) {
        // The contextRect has been resized.  Recalculate all sizes and redraw the staff.
        this.contextRect = theContextRect;

        let noteWidthByClippingWidth = Math.floor(theContextRect.width / PBNotation.STAFF_WIDTH_IN_NOTE_WIDTHS);
        let noteWidthByClippingHeight = Math.floor(theContextRect.height / PBNotation.STAFF_HEIGHT_IN_NOTE_WIDTHS);
        this.updateNoteWidth(Math.min(noteWidthByClippingHeight, noteWidthByClippingWidth));

        this.orgX = this.contextRect.x + PBNotation.ORG_X_IN_NOTE_WIDTHS * this.noteWidth;
        this.orgY = this.contextRect.y + PBNotation.ORG_Y_IN_NOTE_HEIGHTS * this.noteHeight;

        this.answerNoteCorrectX = this.orgX + (PBNotation.xByNoteType[NoteType.Answer] * this.noteWidth);
        this.answerNoteCorrectY = this.orgY - this.noteHeight * 5;

        this.redraw();
    }

    updateNoteWidth(newSize: number) {
        // Update fundamental sizes.
        this.noteWidth = newSize;
        this.fontSize = this.noteWidth * PBNotation.FONT_SIZE_IN_NOTE_WIDTHS;
        this.noteHeight = this.noteWidth * PBNotation.NOTE_HEIGHT_IN_NOTE_WIDTHS;
    }

    generateChormaticScale() : Array<ChromaticNote> {
        // The chromatic scale is the 12 note scale that contains the degree of the octave along
        // with the accidental.  This is based on the KeySignature.  This follows the standard
        // practice that sharps and flats are not mixed.  Therefore, in key signatures with sharps,
        // the note a half step above F is F#, while in keys with flats it is Gb.  This means that
        // the key signatures with flats have to be treated differently from the key signatures
        // with sharps.  The key of C is grouped with the sharps.
        //
        let theScale: Array<ChromaticNote>;
        if (this.theOptions.keySignature >= KeySignature.C) {   // We are dealing with sharps
            theScale = [
                {degree: 0, accidental: Accidentals.none},
                {degree: 0, accidental: Accidentals.sharp},
                {degree: 1, accidental: Accidentals.none},
                {degree: 1, accidental: Accidentals.sharp},
                {degree: 2, accidental: Accidentals.none},
                {degree: 3, accidental: Accidentals.none},
                {degree: 3, accidental: Accidentals.sharp},
                {degree: 4, accidental: Accidentals.none},
                {degree: 4, accidental: Accidentals.sharp},
                {degree: 5, accidental: Accidentals.none},
                {degree: 5, accidental: Accidentals.sharp},
                {degree: 6, accidental: Accidentals.none}   ];
        } else {    // We are dealing with flats
            theScale = [
                {degree: 0, accidental: Accidentals.none},
                {degree: 1, accidental: Accidentals.flat},
                {degree: 1, accidental: Accidentals.none},
                {degree: 2, accidental: Accidentals.flat},
                {degree: 2, accidental: Accidentals.none},
                {degree: 3, accidental: Accidentals.none},
                {degree: 4, accidental: Accidentals.flat},
                {degree: 4, accidental: Accidentals.none},
                {degree: 5, accidental: Accidentals.flat},
                {degree: 5, accidental: Accidentals.none},
                {degree: 6, accidental: Accidentals.flat},
                {degree: 6, accidental: Accidentals.none}   ];
        }
        return(theScale);
    }

    midiToQualifiedNote(midiNote: number) : QualifiedNote {
        // A qualified note is the diatonic degree plus a possible accidental.
        if ((midiNote < PBConst.MIDI.LOW) || (midiNote > PBConst.MIDI.HIGH))
            return({midi: -1, octave: 0, degree: 0, accidental: Accidentals.none});
        let CDIO = PBConst.CHROMATIC_DEGREES_IN_OCTAVE;
        let theOctave = Math.floor(midiNote / CDIO - 1);
        let theChromaticDegree = midiNote % CDIO;  // Find the chromatic degree relative to C
        let theChromaticScale = this.generateChormaticScale();
        let theChromaticNote = theChromaticScale[theChromaticDegree];
        return({midi: midiNote, octave: theOctave, degree: theChromaticNote.degree, accidental: theChromaticNote.accidental});
    }

    onSequencer (event: CustomEvent) {
        // Sequencer has played a note.
        let theItem: SequenceItem = event.detail;
        if (theItem.state) {
            let x = this.orgX  + (PBNotation.xByNoteType[theItem.noteType] * this.noteWidth);
            this.drawNote(x, theItem.note);
        }
    }

    clearContextRect() {
        // Clear the contextRect.
        this.context.fillStyle = "white";
        this.context.fillRect(this.contextRect.x, this.contextRect.y, this.contextRect.width, this.contextRect.height);
    }

    drawLine(startX: number,  startY: number,  endX: number,  endY: number,  width: number,  color: string,  cap: string) {
        // Basic drawing routine used for drawing the origin and helper rectangles.
        // Note that the staff is drawn with glyphs.
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.lineWidth = width;
        this.context.lineCap = <CanvasLineCap>cap;
        this.context.moveTo(startX, startY);
        this.context.lineTo(endX, endY);
        this.context.stroke();
        this.context.closePath();
    }

    drawRect(startX: number,  startY: number,  width: number,  height: number,  lineWidth: number,  color: string,  cap: string) {
        this.context.strokeStyle = color;
        this.context.lineWidth = lineWidth;
        this.context.lineCap = <CanvasLineCap>cap;
        this.context.rect(startX, startY, width, height);
        this.context.stroke();
    }

    drawOrg() {
        if (this.showHelpers) {
            this.drawLine(this.orgX - PBNotation.ORG_WIDTH, this.orgY, this.orgX + PBNotation.ORG_WIDTH, this.orgY, 1, 'red', 'butt');
            this.drawLine(this.orgX, this.orgY - PBNotation.ORG_WIDTH, this.orgX, this.orgY + PBNotation.ORG_WIDTH, 1, 'red', 'butt');
        }
    }

    drawContextRect() {
        if (this.showHelpers) {
            this.drawRect(this.contextRect.x, this.contextRect.y, this.contextRect.width, this.contextRect.height, 1, 'red', 'butt');
        }
    }

    drawGlyph(x: number, y: number, glyph: GlyphItem, align: string, baseline: string, color: string, repeat: number = 1, font: string = 'aruvarb') {
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.font = (this.fontSize * glyph.rem) + "px " + font; // "px aruvarb";

        this.context.textAlign = <CanvasTextAlign>align;
        this.context.textBaseline = <CanvasTextBaseline>baseline;
        let string = glyph.value;
        while (repeat > 1) {    // Primarily used for drawing the staff
            string += glyph.value;
            repeat--;
        }
        this.context.fillText(string, x, y);
        this.context.closePath();
    }

    drawStaff() {
        // Draw the empty staff with clefs and terminations
        this.drawOrg();
        this.drawContextRect();
        let staffY = this.orgY;
        let ng = PBConst.GLYPHS;    // Notation glyphs
        let lengthInNotes = PBNotation.STAFF_WIDTH_IN_NOTE_WIDTHS - 1;

        // The treble staff
        this.drawGlyph(this.orgX, staffY, ng.staff5Lines, 'left', 'middle', 'black', lengthInNotes);    // Draw treble staff
        this.drawGlyph(this.orgX, staffY, ng.beginBar, 'left', 'middle', 'black');
        this.drawGlyph(this.orgX + (this.noteWidth / 4), staffY - this.noteHeight, ng.gClef, 'left', 'middle', 'black');
        this.drawGlyph(this.orgX + (this.noteWidth * lengthInNotes), staffY, ng.endBar, 'right', 'middle', 'black');

        if (this.grandStaff) {  // Need to draw the bass staff
            staffY += (this.noteHeight * 8);
            this.drawGlyph(this.orgX, staffY, ng.staff5Lines, 'left', 'middle', 'black', lengthInNotes);    // Draw bass staff
            this.drawGlyph(this.orgX, staffY, ng.beginBar, 'left', 'middle', 'black');
            this.drawGlyph(this.orgX + (this.noteWidth / 4), staffY - (3 * this.noteHeight), ng.fClef, 'left', 'middle', 'black');
            this.drawGlyph(this.orgX + (this.noteWidth * lengthInNotes), staffY, ng.endBar, 'right', 'middle', 'black');

            this.drawGlyph(this.orgX, staffY, ng.brace, 'right', 'middle', 'black');  // Draw the combining brace
        }
    }

    drawNote(x: number, theMidi: number) {
        this.drawQualifiedNote(x, this.midiToQualifiedNote(theMidi));
    }

    drawQualifiedNote(x: number, qNote: QualifiedNote, color: string = 'black') {
        // Draw the note, along with accidentals and ledger line
        // ORG_Y is E4 and not C4
        if (qNote.midi != -1) {
            let y = this.orgY +
                ((qNote.octave - 4) * (this.noteHeight * -3.5)) +        // Take into account the octave
                ((qNote.degree - 2) * (this.noteHeight / -2));  // Take into account the degree
            this.drawGlyph(x, y, PBConst.GLYPHS.quarterNoteUp, 'left', 'middle', color);    // Draw the raw note

            if (qNote.midi <= (PBConst.MIDI.MIDDLE_C + 1)) { // Need at least one ledger line
                this.drawGlyph(x - this.noteWidth / 4, this.orgY + (this.noteHeight * 3), PBConst.GLYPHS.ledgerLine, 'left', 'middle', color);  // For middle C
                if (qNote.midi <= (PBConst.MIDI.MIDDLE_C - 2)) // Need a second ledger line
                    this.drawGlyph(x - this.noteWidth / 4, this.orgY + (this.noteHeight * 4), PBConst.GLYPHS.ledgerLine, 'left', 'middle', color);  // For A below middle C
                if (qNote.midi <= (PBConst.MIDI.MIDDLE_C - 4)) // Need a third ledger line
                    this.drawGlyph(x - this.noteWidth / 4, this.orgY + (this.noteHeight * 5), PBConst.GLYPHS.ledgerLine, 'left', 'middle', color);  // For A below middle C
            }

            switch (qNote.accidental) { // May have an accidental
                case Accidentals.sharp:
                    this.drawGlyph(x + this.noteWidth, y, PBConst.GLYPHS.sharp, 'left', 'middle', color);
                    break;
                case Accidentals.flat:
                    this.drawGlyph(x + this.noteWidth, y, PBConst.GLYPHS.flat, 'left', 'middle', color);
                    break;
                case Accidentals.natural:
                    this.drawGlyph(x + this.noteWidth, y, PBConst.GLYPHS.natural, 'left', 'middle', color);
                    break;
            }
        }
    }

    redraw() {
        this.clearContextRect();
        this.drawStaff();
    }
}

export {PBNotation};