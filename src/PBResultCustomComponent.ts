// PBResultCustomComponent.ts
//
// A custom component used to display the results
// of the tests.


class PBResultCustomComponent extends HTMLElement {
    static DIV_WIDTH = 40;

    shadow: ShadowRoot;
    wrapperElement: HTMLDivElement; // The parent element
    valueElement: HTMLDivElement;
    labelElement: HTMLDivElement;
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
        // The element with the numeric value.
        this.valueElement = document.createElement('div');
        this.valueElement.setAttribute('class', 'valueElement');

        // Just a static label that is set in the html.
        this.labelElement = document.createElement('div');
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
            
            .valueElement {
                width: ${PBResultCustomComponent.DIV_WIDTH - 10}px;
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
        this.wrapperElement.appendChild(this.valueElement);
        this.wrapperElement.appendChild(this.labelElement);
    }
}

export {PBResultCustomComponent};