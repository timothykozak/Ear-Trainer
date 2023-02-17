// PBResultCustomComponent.ts
//
// A custom component used to display the results
// of the tests.


import {PBResultsPage} from "./PBResultsPage";

class PBResultCustomComponent extends HTMLElement {
    static DIV_WIDTH = 40;
    static METER_HEIGHT = 100;

    shadow: ShadowRoot;
    wrapperElement: HTMLDivElement; // The parent element
    meterDiv: HTMLDivElement;
    meterElement: HTMLMeterElement;
    meterFraction: HTMLSpanElement;
    labelElement: HTMLSpanElement;
    styleElement: HTMLStyleElement;
    wrapperX: string;
    wrapperY: string;
    wrapperColor: string;
    fontColor: string;

    constructor() {
        super();// Always call super() first
        this.buildWrapper();
        this.buildSubElements();
        this.buildStyle();
        this.buildShadowDOM();
    }

    buildWrapper() {
        // This element wraps all the other elements and is absolute positioned
        // using attributes defined in the html.
        this.wrapperElement = document.createElement('div');
        this.wrapperElement.setAttribute('class', 'wrapperDiv');
        this.wrapperX = (this.hasAttribute('x')) ? this.getAttribute('x') : '100';
        this.wrapperY = (this.hasAttribute('y')) ? this.getAttribute('y') : '100';
        this.wrapperColor = (this.hasAttribute('backgroundColor')) ? this.getAttribute('backgroundColor') : 'white';
        this.fontColor = (this.hasAttribute('fontColor')) ? this.getAttribute('fontColor') : 'black';
    }

    buildSubElements() {
        // Contains the meter
        this.meterDiv = document.createElement('div');
        this.meterDiv.setAttribute('class', 'meterDiv');

        // The meter
        this.meterElement = document.createElement('meter');
        this.meterElement.setAttribute('class', 'meterElement');
        this.meterElement.setAttribute('min', '0.0');
        this.meterElement.setAttribute('max', '1.0');
        this.meterElement.setAttribute('low', '0.33');
        this.meterElement.setAttribute('high', '0.66');
        this.meterElement.setAttribute('optimum', '0.7');
        this.meterElement.setAttribute('value', '0.0');

        this.meterFraction = document.createElement('span');
        this.meterFraction.setAttribute('class', 'meterFraction');

        // Just a static label that is set in the html.
        this.labelElement = document.createElement('span');
        this.labelElement.setAttribute('class', 'labelElement');
        this.labelElement.innerText = (this.hasAttribute('label')) ? this.getAttribute('label') : 'None';
    }

    buildStyle() {
        // Create some CSS to apply to the shadow dom.
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = `
            .wrapperDiv {
                width: ${PBResultCustomComponent.DIV_WIDTH}px;
                position: absolute;
                top: ${this.wrapperY}px;
                left: ${this.wrapperX}px;
                text-align: center;
                border: 1px solid ${this.fontColor};
                background: ${this.wrapperColor};
                color: ${this.fontColor};
            }
            
            .meterDiv {
                width: ${PBResultCustomComponent.DIV_WIDTH}px;
                height: ${PBResultCustomComponent.METER_HEIGHT}px;
                padding-bottom: 5px;
            }
            
            .meterElement {
                width: ${PBResultCustomComponent.METER_HEIGHT}px;
                height: ${PBResultCustomComponent.DIV_WIDTH}px;
                transform-origin: ${PBResultCustomComponent.METER_HEIGHT / 2}px ${PBResultCustomComponent.METER_HEIGHT / 2}px;
                transform: rotate(-90deg);
            }
            
            .meterFraction {
                position: absolute;
                top: ${PBResultCustomComponent.METER_HEIGHT / 2}px;
                left: 12px;
            }
            
            .labelElement {
                display-inline: block;
            }
          }
        `;
    }

    buildShadowDOM() {
        this.shadow = this.attachShadow({mode: 'open'});    // Create a shadow root
        // Attach the created elements to the shadow dom
        this.shadow.appendChild(this.styleElement);
        this.shadow.appendChild(this.wrapperElement);
        this.meterDiv.appendChild(this.meterElement);
        this.meterDiv.appendChild(this.meterFraction);
        this.wrapperElement.appendChild(this.meterDiv);
        this.wrapperElement.appendChild(this.labelElement);
    }

    updateResults(numCorrect: number, numTests: number) {
        this.meterElement.value = (numTests == 0) ? 0 : numCorrect / numTests;
        this.meterFraction.innerHTML = `  <math>
                                            <mfrac>
                                              <mn>${numCorrect}</mn>
                                              <mn>${numTests}</mn>
                                            </mfrac>
                                          </math>`;
    }
}

export {PBResultCustomComponent};