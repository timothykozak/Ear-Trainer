// PBResultsPage.ts
//
// This class handles the results page for the menu.  The results are
// saved/restored in the browser.
//

import {TestItem, TestResults} from "./PBTester.js";
import {PBConst} from "./PBConst.js";
import {PBStatusWindow} from "./PBStatusWindow.js";
import {PBResultCustomComponent} from "./PBResultCustomComponent.js";

interface ResultItem {
    numTests: number,
    numCorrect: number
}

class PBResultsPage {
    static ITEMS_PER_OCTAVE = 12;

    theResults: Array<ResultItem>;
    theRCCs: Array<PBResultCustomComponent>;    // The results custom components.

    constructor(public statusWindow: PBStatusWindow, public parentHTMLDiv: HTMLDivElement) {
        customElements.define('result-component', PBResultCustomComponent);
        this.buildHTML();
        this.getRCCIds();
        window.addEventListener(PBConst.EVENTS.unload, () => { this.onUnload()});
        document.addEventListener(PBConst.EVENTS.testerNoteAnswered, (event: CustomEvent) => {this.onNoteAnswered(event);}, false);
        this.restoreOptions();
    }

    initResults() {
        this.theResults = [];
        for (let index = 0; index < PBResultsPage.ITEMS_PER_OCTAVE; index++) {
            this.theResults.push({numTests: 0, numCorrect: 0});
        }
    }

    clearResults() {
        this.initResults();
    }

    restoreOptions() {
        // Need to get the options from the browser.
        this.theResults = JSON.parse(localStorage.getItem(PBConst.STORAGE.statsPage));
        if (!this.theResults) {
            this.initResults();
        }
    }

    onUnload(){
        // The window is being shut down.  Save everything.
        localStorage.setItem(PBConst.STORAGE.statsPage, JSON.stringify(this.theResults));
    }

    onNoteAnswered(event: CustomEvent) {
        let theTest = event.detail.theTestItem as TestItem;
        let index = theTest.testNote - PBConst.MIDI.MIDDLE_C;
        if ((index >= 0) && (index <= PBResultsPage.ITEMS_PER_OCTAVE)) {
            this.theResults[index].numTests++;
            if (theTest.correct)
                this.theResults[index].numCorrect++;
        }
    }

    buildHTML(){
        // The HTML to build the page.
        this.parentHTMLDiv.insertAdjacentHTML('beforeend',
            `<div>
                <input type="button" value="Clear Results" onclick="window.pbEarTraining.ui.results.clearResults();">
                <result-component id="idC" x="100" y="200" label="C" ></result-component>
                <result-component id="idD" x="140" y="200" label="D" ></result-component>
                <result-component id="idE" x="180" y="200" label="E" ></result-component>
                <result-component id="idF" x="220" y="200" label="F" ></result-component>
                <result-component id="idG" x="260" y="200" label="G" ></result-component>
                <result-component id="idA" x="300" y="200" label="A" ></result-component>
                <result-component id="idB" x="340" y="200" label="B" ></result-component>
                <result-component id="idC#" x="120" y="50" label="C#" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idD#" x="160" y="50" label="D#" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idF#" x="240" y="50" label="F#" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idG#" x="280" y="50" label="G#" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idA#" x="320" y="50" label="A#" backgroundColor="black" fontColor="white"></result-component>
            </div>
            `);
    }

    getRCCIds() {
        // Get the results custom components
        let theNames: string[] = ['idC', 'idC#', 'idD', 'idD#', 'idE', 'idF', 'idF#', 'idG', 'idG#', 'idA', 'idA#', 'idB'];
        this.theRCCs = [];
        theNames.forEach((theName, index) => {this.theRCCs[index] = document.getElementById(theName) as PBResultCustomComponent;});
    }

}

export {PBResultsPage};