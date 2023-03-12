// PBResultsPage.ts
//
// This class handles the results page for the menu.  The results are
// saved/restored in the browser.
//

import {TestItem} from "./PBTester.js";
import {PBConst} from "./PBConst.js";
import {PBResultCustomComponent} from "./PBResultCustomComponent.js";

interface ResultItem {
    numTests: number,
    numCorrect: number
}

class PBResultsPage {
    static ITEMS_PER_OCTAVE = 12;

    theResults: Array<ResultItem>;
    theRCCs: Array<PBResultCustomComponent>;    // The results custom components.

    constructor(public parentHTMLDiv: HTMLDivElement) {
        customElements.define('result-component', PBResultCustomComponent);
        this.buildHTML();
        this.getRCCIds();
        this.initListeners();
        this.restoreResults();
    }

    initListeners() {
        window.addEventListener(PBConst.EVENTS.unload, () => { this.onUnload()});
        document.addEventListener(PBConst.EVENTS.testerNoteAnswered, (event: CustomEvent) => {this.onNoteAnswered(event);}, false);
        document.addEventListener(PBConst.EVENTS.resultsReset, (event: CustomEvent) => {this.onInitResults(event);}, false);
    }

    onUnload(){
        // The window is being shut down.  Save everything.
        localStorage.setItem(PBConst.STORAGE.statsPage, JSON.stringify(this.theResults));
    }

    onNoteAnswered(event: CustomEvent) {
        let theTest = event.detail.theTestItem as TestItem;
        let index = theTest.testNote - PBConst.MIDI.LOW;
        if ((index >= 0) && (index <= PBResultsPage.ITEMS_PER_OCTAVE)) {
            this.theResults[index].numTests++;
            if (theTest.correct)
                this.theResults[index].numCorrect++;
            this.updateMeterValue(index);
        }
    }

    onInitResults(event: CustomEvent) {
        this.initResults();
        this.updateAllMeterValues();
    }

    initResults() {
        this.theResults = [];
        for (let index = 0; index < PBResultsPage.ITEMS_PER_OCTAVE; index++) {
            this.theResults.push({numTests: 0, numCorrect: 0});
        }
    }

    updateMeterValue(index: number) {
        this.theRCCs[index].updateResults(this.theResults[index].numCorrect, this.theResults[index].numTests);
    }

    updateAllMeterValues() {
        this.theResults.forEach((element, index) => {this.updateMeterValue(index);} )
    }

    restoreResults() {
        // Need to get the options from the browser.
        this.theResults = JSON.parse(localStorage.getItem(PBConst.STORAGE.statsPage));
        if (!this.theResults) {
            this.initResults();
        }
        this.updateAllMeterValues();
    }

    buildHTML(){
        // The HTML to build the page.
        this.parentHTMLDiv.insertAdjacentHTML('beforeend',
            `<div>
                <input type="button" value="Clear Results"
                    onclick="document.dispatchEvent(new CustomEvent('${PBConst.EVENTS.resultsReset}', {detail: null}));">
                <result-component id="idResultCC_C" x="100" y="200" label="C" ></result-component>
                <result-component id="idResultCC_D" x="140" y="200" label="D" ></result-component>
                <result-component id="idResultCC_E" x="180" y="200" label="E" ></result-component>
                <result-component id="idResultCC_F" x="220" y="200" label="F" ></result-component>
                <result-component id="idResultCC_G" x="260" y="200" label="G" ></result-component>
                <result-component id="idResultCC_A" x="300" y="200" label="A" ></result-component>
                <result-component id="idResultCC_B" x="340" y="200" label="B" ></result-component>
                <result-component id="idResultCC_C#" x="120" y="50" label="C#" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idResultCC_D#" x="160" y="50" label="D#" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idResultCC_F#" x="240" y="50" label="F#" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idResultCC_G#" x="280" y="50" label="G#" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idResultCC_A#" x="320" y="50" label="A#" backgroundColor="black" fontColor="white"></result-component>
            </div>
            `);
    }

    getRCCIds() {
        // Get the results custom components
        let theNames: string[] = ['idResultCC_C', 'idResultCC_C#', 'idResultCC_D', 'idResultCC_D#', 'idResultCC_E', 'idResultCC_F', 'idResultCC_F#', 'idResultCC_G', 'idResultCC_G#', 'idResultCC_A', 'idResultCC_A#', 'idResultCC_B'];
        this.theRCCs = [];
        theNames.forEach((theName, index) => {this.theRCCs[index] = document.getElementById(theName) as PBResultCustomComponent;});
    }

}

export {PBResultsPage};