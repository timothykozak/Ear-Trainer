// PBOptionsPage.ts
//
// This class handles the options page of the menu.  It contains custom components
// that are used for entering the frequency that a degree of the octave is tested.
// There are buttons to set some default frequencies.
// There is no OK or Cancel button.  Changes are automatically used.
//

import {KeySignature, PBConst} from "./PBConst.js";
import {PBKeyCustomComponent} from "./PBKeyCustomComponent.js";

interface MyOptions {
    noteFrequency: number[];    // By degree of the 12 note scale
    timeToWait: number;         // In PBSequencer ticks
    tonic: number;              // The tonic of the key, C Major = MIDI 60
    midiLow: number;            // The lowest note on the piano keyboard, which is >= PBConst.MIDI.LOW
    midiHigh: number;           // The highest note on the piano keyboard, which is <= PBConst.MIDI.HIGH
    keySignature: KeySignature;
}

class PBOptionsPage {
    static NOTES_IN_OCTAVE = 12;
    static NOTE_FREQUENCY_NONE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    static NOTE_FREQUENCY_I_IV_V = [5, 0, 0, 0, 0, 5, 0, 5, 0, 0, 0, 0];
    static NOTE_FREQUENCY_ALL = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
    static NOTE_FREQUENCY_WHITE = [5, 0, 5, 0, 5, 5, 0, 5, 0, 5, 0, 5];
    static NOTE_FREQUENCY_BLACK = [0, 5, 0, 5, 0, 0, 5, 0, 5, 0, 5, 0];

    theOptions: MyOptions;
    theDegreesToTest: number[];
    theKCCs: PBKeyCustomComponent[];  // The key custom components (KCC).
    isDirty: boolean;   // Changes have been made.

    constructor(public parentHTMLDiv: HTMLDivElement) {
        this.initListeners();
        customElements.define('key-component', PBKeyCustomComponent);
        this.buildHTML();
        this.getKCCs();
        this.setKCConchange();
        window.addEventListener(PBConst.EVENTS.unload, () => { this.onUnload()});
        this.restoreOptions();
        this.isDirty = false;
    }

    initListeners() {
        document.addEventListener(PBConst.EVENTS.optionsExecuteCommand, (event: CustomEvent) => {this.onExecuteCommand(event)}, false);
    }

    dispatchStatusMessage(isAnError: boolean, theMessage: string) {
        document.dispatchEvent(new CustomEvent(PBConst.EVENTS.statusMessage,
          {detail: {theType: PBConst.MESSAGE_TYPE.optionsPage, error: isAnError, theText: theMessage}}));
    }

    onExecuteCommand(event: CustomEvent) {
        let theCommand:number = event.detail.command;
        switch(theCommand) {
            case PBConst.OPTIONS_COMMANDS.standardTests:
                this.createStandardTest(event.detail.param1);
                break;
            case PBConst.OPTIONS_COMMANDS.requestOptions:
                this.dispatchOptionsUpdated();
                break;
            default:
                this.dispatchStatusMessage(true, 'Unrecognized command: ' + theCommand);
                break;
        }
    }

    dispatchOptionsUpdated() {
        document.dispatchEvent(new CustomEvent(PBConst.EVENTS.optionsUpdated, {detail: this.theOptions}));
    }

    optionsUpdated(){
        this.createNewTest();
        this.dispatchOptionsUpdated();
        document.dispatchEvent(new CustomEvent(PBConst.EVENTS.testerExecuteCommand, {detail: {command: PBConst.TESTER_COMMANDS.degreesToTest, param1: this.theDegreesToTest}}));
    }

    restoreOptions() {
        // Need to get the options from the browser.
        this.theOptions = JSON.parse(localStorage.getItem(PBConst.STORAGE.optionsPage));
        if (!this.theOptions) {
            this.theOptions = DEFAULT_OPTIONS;
        }
        this.setKCCValues();
        this.optionsUpdated();
    }

    lostFocus(){
        // The page has lost the focus
        if (this.isDirty) { // Changes have been made.  Need to make a new test.
            this.isDirty = false;
            this.optionsUpdated();
        }
    }

    onUnload(){
        // The window is being shut down.  Save everything.
        localStorage.setItem(PBConst.STORAGE.optionsPage, JSON.stringify(this.theOptions));
    }

    createStandardTest(testType: number) {
        let theTests = [PBOptionsPage.NOTE_FREQUENCY_NONE,
                        PBOptionsPage.NOTE_FREQUENCY_I_IV_V,
                        PBOptionsPage.NOTE_FREQUENCY_WHITE,
                        PBOptionsPage.NOTE_FREQUENCY_BLACK,
                        PBOptionsPage.NOTE_FREQUENCY_ALL];
        testType = ((testType >= 0) && (testType < theTests.length)) ? testType : 0;
        this.theOptions.noteFrequency = theTests[testType];
        this.createNewTest();
        this.setKCCValues();
    }

    createNewTest() {
        // Takes the noteFrequency array and creates an array of degrees
        // to be tested by the tester.
        this.isDirty = true;
        this.theDegreesToTest = [];
        this.theOptions.noteFrequency.forEach((value, index) => {
            for (let i = 0; i < value; i++)
                this.theDegreesToTest.push(index);
        });
    }

    buildHTML(){
        // The HTML to build the page.
        this.parentHTMLDiv.insertAdjacentHTML('beforeend',
            `<div>
                <input type="button" value="None" 
                    onclick="document.dispatchEvent(new CustomEvent('${PBConst.EVENTS.optionsExecuteCommand}', {detail: {command: ${PBConst.OPTIONS_COMMANDS.standardTests}, param1: 0}}));">
                <input type="button" value="I IV V" 
                    onclick="document.dispatchEvent(new CustomEvent('${PBConst.EVENTS.optionsExecuteCommand}', {detail: {command: ${PBConst.OPTIONS_COMMANDS.standardTests}, param1: 1}}));">
                <input type="button" value="White"
                    onclick="document.dispatchEvent(new CustomEvent('${PBConst.EVENTS.optionsExecuteCommand}', {detail: {command: ${PBConst.OPTIONS_COMMANDS.standardTests}, param1: 2}}));">
                <input type="button" value="Black"
                    onclick="document.dispatchEvent(new CustomEvent('${PBConst.EVENTS.optionsExecuteCommand}', {detail: {command: ${PBConst.OPTIONS_COMMANDS.standardTests}, param1: 3}}));">
                <input type="button" value="All"
                    onclick="document.dispatchEvent(new CustomEvent('${PBConst.EVENTS.optionsExecuteCommand}', {detail: {command: ${PBConst.OPTIONS_COMMANDS.standardTests}, param1: 4}}));">
                <key-component id="idKeyCC_Do" x="100" y="200" label="Do" ></key-component>
                <key-component id="idKeyCC_Re" x="140" y="200" label="Re" ></key-component>
                <key-component id="idKeyCC_Mi" x="180" y="200" label="Mi" ></key-component>
                <key-component id="idKeyCC_Fa" x="220" y="200" label="Fa" ></key-component>
                <key-component id="idKeyCC_So" x="260" y="200" label="So" ></key-component>
                <key-component id="idKeyCC_La" x="300" y="200" label="La" ></key-component>
                <key-component id="idKeyCC_Ti" x="340" y="200" label="Ti" ></key-component>
                <key-component id="idKeyCC_Di" x="120" y="50" label="Di" backgroundColor="black" fontColor="white"></key-component>
                <key-component id="idKeyCC_Ri" x="160" y="50" label="Ri" backgroundColor="black" fontColor="white"></key-component>
                <key-component id="idKeyCC_Fi" x="240" y="50" label="Fi" backgroundColor="black" fontColor="white"></key-component>
                <key-component id="idKeyCC_Si" x="280" y="50" label="Si" backgroundColor="black" fontColor="white"></key-component>
                <key-component id="idKeyCC_Li" x="320" y="50" label="Li" backgroundColor="black" fontColor="white"></key-component>
            </div>
            `);
    }

    getKCCs() {
        // Set the key custom component ids
        let theNames: string[] = ['idKeyCC_Do', 'idKeyCC_Di', 'idKeyCC_Re', 'idKeyCC_Ri', 'idKeyCC_Mi', 'idKeyCC_Fa', 'idKeyCC_Fi', 'idKeyCC_So', 'idKeyCC_Si', 'idKeyCC_La', 'idKeyCC_Li', 'idKeyCC_Ti'];
        this.theKCCs = [];
        theNames.forEach((theName, index) => {this.theKCCs[index] = document.getElementById(theName) as PBKeyCustomComponent;});
    }

    setKCConchange() {
        // Sets the onchange callbacks for the key custom components.
        // This is only called when the value is "committed" by the user,
        // as opposed to any time the value is changed.  Therefore,
        // the valueElement and the sliderElement need to be handled
        // separately.
        this.theKCCs.forEach((theKCC, index) => {
            theKCC.valueElement.onchange = (event) => {
                this.theOptions.noteFrequency[index] = parseInt(theKCC.valueElement.value);
                this.isDirty = true;
            };
            theKCC.sliderElement.onchange = (event) => {
                this.theOptions.noteFrequency[index] = parseInt(theKCC.sliderElement.value);
                this.isDirty = true;
            };
        })
    }

    setKCCValues() {
        // Set the values for the key custom components
        this.theKCCs.forEach((theKCC, index) => {
            theKCC.value = this.theOptions.noteFrequency[index];
        });
    }
}

const DEFAULT_OPTIONS: MyOptions = {
    noteFrequency: PBOptionsPage.NOTE_FREQUENCY_I_IV_V,
    timeToWait: 10,
    tonic: 60,
    midiLow: 60,
    midiHigh: 72,
    keySignature: KeySignature.C
};

export {PBOptionsPage, MyOptions, DEFAULT_OPTIONS};