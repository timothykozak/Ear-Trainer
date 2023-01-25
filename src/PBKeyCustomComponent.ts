// A custom component used to input a value.
// It is made up of several standard components
// stacked on top of each other.

class PBKeyCustomComponent extends HTMLElement {
    static SLIDER_MIN = 0;
    static SLIDER_MAX = 25;
    static DIV_WIDTH = 40;
    static SLIDER_HEIGHT = 100;

    shadow: ShadowRoot;
    wrapperElement: HTMLDivElement;
    sliderDiv: HTMLDivElement;
    sliderElement: HTMLInputElement;
    valueElement: HTMLInputElement;
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

        // This element will hold the actual slider.
        // Need to do this for proper positioning.
        this.sliderDiv = document.createElement('div');
        this.sliderDiv.setAttribute('class', 'sliderDiv');

        // The slider element itself.
        // It will be rotated in CSS.
        // The slider and the value element interact with each other.
        this.sliderElement = document.createElement('input');
        this.sliderElement.setAttribute('type', 'range');
        this.sliderElement.setAttribute('class', 'stackedSlider');
        this.sliderElement.setAttribute('min', PBKeyCustomComponent.SLIDER_MIN.toString());
        this.sliderElement.setAttribute('max', PBKeyCustomComponent.SLIDER_MAX.toString());
        this.sliderElement.setAttribute('value', '5');
        this.sliderElement.oninput = (event) => {this.valueElement.value = (<HTMLInputElement>event.target).value;};

        // The element with the numeric value.
        // Interacts with the slider.
        this.valueElement = document.createElement('input');
        this.valueElement.setAttribute('type', 'number');
        this.valueElement.setAttribute('class', 'valueElement');
        this.valueElement.setAttribute('min', PBKeyCustomComponent.SLIDER_MIN.toString());
        this.valueElement.setAttribute('max', PBKeyCustomComponent.SLIDER_MAX.toString());
        this.valueElement.value = '5';
        this.valueElement.oninput = (event) => {this.sliderElement.value = (<HTMLInputElement>event.target).value;};

        // Just a static label that is set in the html.
        this.labelElement = document.createElement('div');
        this.labelElement.setAttribute('class', 'labelElement');
        this.labelElement.innerText = (this.hasAttribute('label')) ? this.getAttribute('label') : 'None';

        // Create some CSS to apply to the shadow dom.
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = `
            .wrapperDiv {
                width: ${PBKeyCustomComponent.DIV_WIDTH}px;
                position: absolute;
                top: ${wrapperY}px;
                left: ${wrapperX}px;
                text-align: center;
                border: 1px solid ${fontColor};
                background: ${wrapperColor};
                color: ${fontColor};
            }
            
            .sliderDiv {
                width: ${PBKeyCustomComponent.DIV_WIDTH}px;
                height: ${PBKeyCustomComponent.SLIDER_HEIGHT}px;
                padding-bottom: 5px;
            }
            
            .stackedSlider {
                width: ${PBKeyCustomComponent.SLIDER_HEIGHT}px;
                height: ${PBKeyCustomComponent.DIV_WIDTH}px;
                transform-origin: ${PBKeyCustomComponent.SLIDER_HEIGHT / 2}px ${PBKeyCustomComponent.SLIDER_HEIGHT / 2}px;
                transform: rotate(-90deg);
            }
            
            .valueElement {
                width: ${PBKeyCustomComponent.DIV_WIDTH - 10}px;
            }
            
            .labelElement {
                display-inline: block;
            }
              
            .stackedElement {
                width: ${PBKeyCustomComponent.DIV_WIDTH}px;
            }
          }
        `;

        // Attach the created elements to the shadow dom
        this.shadow.appendChild(this.styleElement);
        this.shadow.appendChild(this.wrapperElement);
        this.sliderDiv.appendChild(this.sliderElement);
        this.wrapperElement.appendChild(this.sliderDiv);
        this.wrapperElement.appendChild(this.valueElement);
        this.wrapperElement.appendChild(this.labelElement);
    }

    set value(theValue: number) {
        let theString: string = theValue.toString();
        this.valueElement.value = theString;
        this.sliderElement.value = theString;
    }

    get value(): number {
        return(parseInt(this.valueElement.value));
    }
}

export {PBKeyCustomComponent};