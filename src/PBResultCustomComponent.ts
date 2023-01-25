// PBResultCustomComponent.ts
//
// A custom component used to display the results
// of the tests.


class PBResultCustomComponent extends HTMLElement {
    static DIV_WIDTH = 40;

    shadow: ShadowRoot;
    wrapperElement: HTMLDivElement;
    valueElement: HTMLDivElement;
    labelElement: HTMLDivElement;
    styleElement: HTMLStyleElement;

    constructor() {

        // Always call super() first
        super();

        // Create a shadow root
        this.shadow = this.attachShadow({mode: 'open'});

        // This element wraps all of the other elements and is absolute positioned
        // using attributes defined in the html.
        this.wrapperElement = document.createElement('div');
        this.wrapperElement.setAttribute('class', 'wrapperDiv');
        let wrapperX = (this.hasAttribute('x')) ? this.getAttribute('x') : 100;
        let wrapperY = (this.hasAttribute('y')) ? this.getAttribute('y') : 100;
        let wrapperColor = (this.hasAttribute('backgroundColor')) ? this.getAttribute('backgroundColor') : 'white';
        let fontColor = (this.hasAttribute('fontColor')) ? this.getAttribute('fontColor') : 'black';


        // The element with the numeric value.
        // Interacts with the slider.
        this.valueElement = document.createElement('div');
        this.valueElement.setAttribute('class', 'valueElement');

        // Just a static label that is set in the html.
        this.labelElement = document.createElement('div');
        this.labelElement.setAttribute('class', 'labelElement');
        this.labelElement.innerText = (this.hasAttribute('label')) ? this.getAttribute('label') : 'None';

        // Create some CSS to apply to the shadow dom.
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = `
            .wrapperDiv {
                width: ${PBResultCustomComponent.DIV_WIDTH}px;
                position: absolute;
                top: ${wrapperY}px;
                left: ${wrapperX}px;
                text-align: center;
                border: 1px solid ${fontColor};
                background: ${wrapperColor};
                color: ${fontColor};
            }
            
            .valueElement {
                width: ${PBResultCustomComponent.DIV_WIDTH - 10}px;
            }
            
            .labelElement {
                display-inline: block;
            }
          }
        `;

        // Attach the created elements to the shadow dom
        this.shadow.appendChild(this.styleElement);
        this.shadow.appendChild(this.wrapperElement);
        this.wrapperElement.appendChild(this.valueElement);
        this.wrapperElement.appendChild(this.labelElement);
    }
}

export {PBResultCustomComponent};