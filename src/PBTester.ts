//
// PBTester.ts
//
// This class actually runs the tests.
//

import {PBSequencer} from "./PBSequencer.js";
import {PBConst} from "./PBConst.js";

interface TestItem {
    testNote: number,
    answerNote: number,
    correct: boolean,
    slow: boolean
}

interface TestResults {
    totalNotes: number,
    notesTested: number,
    numCorrect: number,
    numWrong: number,
    numSlow: number,
    finished: boolean,
    testItems: TestItem[]
}

class PBTester {
    static DEGREE_MIN = 0;  // The degree is the position in the 12 tone musical scale,
                            // with 0 = C, 1 = C#, 2 = D, ... 11 = B
    static DEGREE_MAX = 11;
    static TEST_ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    private _degreesToTest: Array<number>;  // The degrees to be tested
    testRunning: boolean = false;
    degreeBeingTested: number;
    waitingForAnswer: boolean;
    results: TestResults;

    constructor(public audioContext: AudioContext, public sequencer: PBSequencer) {
        document.addEventListener(PBConst.EVENTS.sequencerNotePlayed, (event: CustomEvent) => {this.onNotePlayed(event);}, false);
        document.addEventListener(PBConst.EVENTS.sequencerTestNotePlayed, (event: CustomEvent) => {this.onTestNotePlayed(event);}, false);
    }

    onTestNotePlayed(event: CustomEvent) {
        // Let listeners know that the test note has been played.
        this.waitingForAnswer = true;
    }

    onNotePlayed(event: CustomEvent) {
        // Check if the note played was the answer note.
        if (this.waitingForAnswer && event.detail.state) {  // Make sure to disregard the note off of the degreeBeingTested note
            this.waitingForAnswer = false;
            let midiNote = this.degreeBeingTested + PBConst.MIDI.MIDDLE_C;
            let correctAnswer = (event.detail.note == midiNote);

            this.results.notesTested++; // Update the testItems
            if (correctAnswer)
                this.results.numCorrect++;
            else
                this.results.numWrong++;
            let testItem = {
                testNote: midiNote,
                answerNote: event.detail.note,
                correct: correctAnswer,
                slow: false};
            this.results.testItems.push(testItem);
            document.dispatchEvent(new CustomEvent(PBConst.EVENTS.testerNoteAnswered, {detail: {theTestItem: testItem, theResults: this.results}}));
        }
    }

    set degreesToTest(theDegrees: Array<number>) {
        // theDegrees contains all the degrees to test.  The same degree can show up
        // multiple times or the degree may not show up at all.  The order that the
        // degrees appear does not equal the order that they are played.
        this.stopTest();
        theDegrees.forEach((item: number, index: number) => { // Remove all invalid degrees
            if ((item > PBTester.DEGREE_MAX) || (item < PBTester.DEGREE_MIN))
                theDegrees.splice(index, 1); // Remove invalid degrees
        });
        if (theDegrees.length == 0)
            this._degreesToTest = theDegrees;    // None at all.  Possibly an error condition.  Allow for now.
        else
            this._degreesToTest = theDegrees;
    }

    get degreesToTest() {
        return(this._degreesToTest);
    }

    pickNextNoteToTest(): number {
        // Used to play the next note in the test.
        // Picks a note at random from theDegrees and starts the sequence.
        // Returns the degree being tested, or -1 for failure.
        let theResult = -1;
        if (!this.sequencer.sequenceRunning && this.testRunning) {  // Still running the test
            let length = this._degreesToTest.length;
            if (length > 0) {
                let index = Math.floor(Math.random() * length); // Select a random note to test
                theResult = this._degreesToTest[index];
                this.degreeBeingTested = theResult;
                this._degreesToTest.splice(index, 1);   // Remove the note being tested
                this.sequencer.cadencePlusNote(theResult + PBConst.MIDI.MIDDLE_C);
                this.waitingForAnswer = false;
            } else {
                this.testRunning = false;
                document.dispatchEvent(new CustomEvent(PBConst.EVENTS.testerFinished, {detail: {}}));
            }
        }
        return(theResult);
    }

    initTestResults() {
        this.results = {} as TestResults;
        this.results.totalNotes = this._degreesToTest.length;
        this.results.notesTested = 0;
        this.results.numCorrect = 0;
        this.results.numWrong = 0;
        this.results.numSlow = 0;
        this.results.finished = false;
        this.results.testItems = [];
    }

    startTest() {
        // Even though the audioContext is already created, Chrome suspends it
        // until a user gesture on the page.  If this is the first start,
        // then we need to resume the audioContext before we start the test.
        // Otherwise, notes will be sent to the audioContext before it is ready
        // and the beginning of the cadence will be garbled.
        this.audioContext.resume().then( () => {
            if (!this.sequencer.sequenceRunning && !this.testRunning && (this._degreesToTest.length > 0)) {
                this.testRunning = true; // Test has actually started
                this.initTestResults();
                document.dispatchEvent(new CustomEvent(PBConst.EVENTS.testerStarted, {detail: {}}));
                this.pickNextNoteToTest();
            }
        });
    }

    stopTest() {
        if (this.testRunning) {
            this.testRunning = false;
            this.waitingForAnswer = false;
            document.dispatchEvent(new CustomEvent(PBConst.EVENTS.testerFinished, {detail: {theResults: this.results}}));
        }
    }
}

export {PBTester, TestItem, TestResults};