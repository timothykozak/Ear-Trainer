// PBOptionsPage.ts
//
// This class handles the options page of the menu.  It contains custom components
// that are used for entering the frequency that a degree of the octave is tested.
// There are buttons to set some default frequencies.
// There is no OK or Cancel button.  Changes are automatically used.
//

import {PBConst} from "./PBConst.js";
import {PBStatusWindow} from "./PBStatusWindow.js";
import {PBTester} from "./PBTester.js";
import {PBKeyCustomComponent} from "./PBKeyCustomComponent.js";

class PBOptionsPage {
    static NOTES_IN_OCTAVE = 12;
    static NOTE_FREQUENCY_NONE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    static NOTE_FREQUENCY_I_IV_V = [5, 0, 0, 0, 0, 5, 0, 5, 0, 0, 0, 0];
    static NOTE_FREQUENCY_ALL = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
    static NOTE_FREQUENCY_WHITE = [5, 0, 5, 0, 5, 5, 0, 5, 0, 5, 0, 5];
    static NOTE_FREQUENCY_BLACK = [0, 5, 0, 5, 0, 0, 5, 0, 5, 0, 5, 0];

    theOptions: {
        noteFrequency: number[];
        timeToWait: number;
    };
    theKCCs: PBKeyCustomComponent[];  // The key custom components (KCC).
    isDirty: boolean;   // Changes have been made.

    constructor(public statusWindow: PBStatusWindow, public parentHTMLDiv: HTMLDivElement, public tester: PBTester) {
        customElements.define('key-component', PBKeyCustomComponent);
        this.buildHTML();
        this.getKCCs();
        this.setKCConchange();
        window.addEventListener(PBConst.EVENTS.unload, () => { this.onUnload()});
        this.restoreOptions();
        this.isDirty = false;
    }

    restoreOptions() {
        // Need to get the options from the browser.
        this.theOptions = JSON.parse(localStorage.getItem(PBConst.STORAGE.optionsPage));
        if (!this.theOptions) {
            this.theOptions = {
                noteFrequency: PBOptionsPage.NOTE_FREQUENCY_I_IV_V,
                timeToWait: 10 };
        }
        this.setKCCValues();
        this.createNewTest();
    }

    lostFocus(){
        // The page has lost the focus
        if (this.isDirty) { // Changes have been made.  Need to make a new test.
            this.createNewTest();
            this.isDirty = false;
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
        let theDegreesToTest: Array<number> = [];
        this.theOptions.noteFrequency.forEach((value, index) => {
            for (let i = 0; i < value; i++)
                theDegreesToTest.push(index);
        });
        this.tester.degreesToTest = theDegreesToTest;
    }

    buildHTML(){
        // The HTML to build the page.
        this.parentHTMLDiv.insertAdjacentHTML('beforeend',
            `<div>
                <input type="button" value="None" onclick="window.pbEarTraining.ui.options.createStandardTest(0);">
                <input type="button" value="I IV V" onclick="window.pbEarTraining.ui.options.createStandardTest(1);">
                <input type="button" value="White" onclick="window.pbEarTraining.ui.options.createStandardTest(2);">
                <input type="button" value="Black" onclick="window.pbEarTraining.ui.options.createStandardTest(3);">
                <input type="button" value="All" onclick="window.pbEarTraining.ui.options.createStandardTest(4);">
                <key-component id="idC" x="100" y="200" label="C" ></key-component>
                <key-component id="idD" x="140" y="200" label="D" ></key-component>
                <key-component id="idE" x="180" y="200" label="E" ></key-component>
                <key-component id="idF" x="220" y="200" label="F" ></key-component>
                <key-component id="idG" x="260" y="200" label="G" ></key-component>
                <key-component id="idA" x="300" y="200" label="A" ></key-component>
                <key-component id="idB" x="340" y="200" label="B" ></key-component>
                <key-component id="idC#" x="120" y="50" label="C#" backgroundColor="black" fontColor="white"></key-component>
                <key-component id="idD#" x="160" y="50" label="D#" backgroundColor="black" fontColor="white"></key-component>
                <key-component id="idF#" x="240" y="50" label="F#" backgroundColor="black" fontColor="white"></key-component>
                <key-component id="idG#" x="280" y="50" label="G#" backgroundColor="black" fontColor="white"></key-component>
                <key-component id="idA#" x="320" y="50" label="A#" backgroundColor="black" fontColor="white"></key-component>
            </div>
            `);
    }

    getKCCs() {
        // Set the key custom component ids
        let theNames: string[] = ['idC', 'idC#', 'idD', 'idD#', 'idE', 'idF', 'idF#', 'idG', 'idG#', 'idA', 'idA#', 'idB'];
        this.theKCCs = [];
        theNames.forEach((theName, index) => {this.theKCCs[index] = document.getElementById(theName) as PBKeyCustomComponent;});
    }

    setKCConchange() {
        // Sets the onchange callbacks for the key custom components.
        // This is only called when the value is "committed" by the user,
        // as opposed to any time the value is changed.  Therefore, the
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

    getKCCValues() {
        // Get the values from the key custom components and update the noteFrequency.
        this.theKCCs.forEach((theKCC, index) => {
            this.theOptions.noteFrequency[index] = theKCC.value;
        });
    }
}

export {PBOptionsPage};