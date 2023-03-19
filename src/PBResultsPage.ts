// PBResultsPage.ts
//
// This class handles the results page for the menu.  The results are
// saved/restored in the browser.
//

import {TestItem} from "./PBTester.js";
import {PBConst} from "./PBConst.js";
import {PBResultCustomComponent} from "./PBResultCustomComponent.js";
import {MyOptions, DEFAULT_OPTIONS} from "./PBOptionsPage.js";

interface ResultItem {
    numTests: number,
    numCorrect: number
}

class PBResultsPage {
    static ITEMS_PER_OCTAVE = 12;

    theResults: Array<ResultItem>;
    theRCCs: Array<PBResultCustomComponent>;    // The results custom components.
    theOptions: MyOptions = DEFAULT_OPTIONS;

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
        document.addEventListener(PBConst.EVENTS.optionsUpdated, (event: CustomEvent) => {this.onOptionsUpdated(event);}, false);
    }

    onUnload(){
        // The window is being shut down.  Save everything.
        localStorage.setItem(PBConst.STORAGE.statsPage, JSON.stringify(this.theResults));
    }

    onOptionsUpdated(event: CustomEvent) {
        this.theOptions = event.detail;
    }

    onNoteAnswered(event: CustomEvent) {
        let theTest = event.detail.theTestItem as TestItem;
        let index = (theTest.testNote - this.theOptions.midiLow) % PBResultsPage.ITEMS_PER_OCTAVE;
        if (index >= 0) {
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
        // Need to get the results from the browser.
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
                <result-component id="idResultCC_Do" x="100" y="200" label="Do" ></result-component>
                <result-component id="idResultCC_Re" x="140" y="200" label="Re" ></result-component>
                <result-component id="idResultCC_Mi" x="180" y="200" label="Mi" ></result-component>
                <result-component id="idResultCC_Fa" x="220" y="200" label="Fa" ></result-component>
                <result-component id="idResultCC_So" x="260" y="200" label="So" ></result-component>
                <result-component id="idResultCC_La" x="300" y="200" label="La" ></result-component>
                <result-component id="idResultCC_Ti" x="340" y="200" label="Ti" ></result-component>
                <result-component id="idResultCC_Di" x="120" y="50" label="Di" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idResultCC_Ri" x="160" y="50" label="Ri" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idResultCC_Fi" x="240" y="50" label="Fi" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idResultCC_Si" x="280" y="50" label="Si" backgroundColor="black" fontColor="white"></result-component>
                <result-component id="idResultCC_Li" x="320" y="50" label="Li" backgroundColor="black" fontColor="white"></result-component>
            </div>
            `);
    }

    getRCCIds() {
        // Get the results custom components
        let theNames: string[] = ['idResultCC_Do', 'idResultCC_Di', 'idResultCC_Re', 'idResultCC_Ri', 'idResultCC_Mi', 'idResultCC_Fa', 'idResultCC_Fi', 'idResultCC_So', 'idResultCC_Si', 'idResultCC_La', 'idResultCC_Li', 'idResultCC_Ti'];
        this.theRCCs = [];
        theNames.forEach((theName, index) => {this.theRCCs[index] = document.getElementById(theName) as PBResultCustomComponent;});
    }

}

export {PBResultsPage};