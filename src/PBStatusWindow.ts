// PBStatusWindow.ts
//
// The PBStatusWindow, SW, is a draggable, resizable window that can be used for displaying
// information.  The windowDiv is the parent of all the other divs, and
// all writing is done to the clientDiv.  Clicking the closeDiv hides the window,
// but does not delete it or the information being written to the client.
// Clicking on the client clears all information.  Multiple SWs are supported.  Hiding
// and showing all SWs is supported.

import {PBConst} from "./PBConst.js";

class PBStatusWindow {
    static theStatusWindows: PBStatusWindow[] = []; // All of the SWs in order of creation
    static theZOrder: PBStatusWindow[] = [];  // The SWs in increasing z order of display.
    static allClosed: boolean = true;

    windowDiv: HTMLDivElement;
    titleDiv: HTMLDivElement;  // The draggable part
    titleTextDiv: HTMLDivElement;
    titleText: Text;  // The title in the draggable part
    closeDiv: HTMLDivElement;  // The close button
    closeText: Text;
    clientDiv: HTMLDivElement; // Client area for text

    constructor(public title: string) {
        this.createElements(title);
        this.setElementIDs();
        this.appendChildren();
        this.setStyles();
        this.addEventHandlers();
        PBStatusWindow.theStatusWindows.push(this);
        PBStatusWindow.zSort(this);
        PBStatusWindow.close(this, PBStatusWindow.allClosed);
    }

    static zSort(lastSW: PBStatusWindow) {
        // With elements, higher zIndex values are displayed on top of lower values.
        // Sort the SWs so that lastSW has the highest zIndex.
        // This can be used when a SW is created, or it is clicked.
        let i = 0;
        const initialZ = 100;

        let theSW: any;
        for (theSW in PBStatusWindow.theZOrder) {
            if (theSW === lastSW)
                PBStatusWindow.theZOrder.splice(i, 1);
            else
                PBStatusWindow.theZOrder[i].windowDiv.style.zIndex = String(initialZ + i);
            i++;
        }
        PBStatusWindow.theZOrder.push(lastSW);
        lastSW.windowDiv.style.zIndex = String(initialZ + i);
    };

    static setElementStyle(theElement: HTMLDivElement, theStyle: any) {
        // theStyle is an object with keys of CSS styles and associated values.
        // Don't forget that CSS styles with a '-' (kebab case) are changed to camel case
        // with the dash removed.  e.g. z-index -> zIndex
        let keyNames = Object.keys(theStyle);
        let i: any;
        for (i in keyNames) {
            theElement.style[keyNames[i] as any] = theStyle[keyNames[i]];
        }
    };

    static getObjectByID(theId: string) {
        // the ID is of the form #PBSW.divType, where # is the index into theStatusWindow array
        let theSW: PBStatusWindow = undefined;
        let theSWStr = /\d+PBSW/.exec(theId);
        if (theSWStr) {
            let theIndex = parseInt(theSWStr[0]);
            if (theIndex < PBStatusWindow.theStatusWindows.length)
                theSW = PBStatusWindow.theStatusWindows[theIndex];
        }
        return(theSW);
    };

    static bringToFront(theID: string) {
        // Bring the SW associated with this ID to the front of the other SWs
        let theSW = PBStatusWindow.getObjectByID(theID);
        if (theSW)
            PBStatusWindow.zSort(theSW);
    };

    createElements(title: string) {
        // Append all of the created elements to form the SW
        this.windowDiv = document.createElement("div"); // This is the main div of the floating window.  All others are children of this.
        this.titleDiv = document.createElement("div");  // The draggable part
        this.titleTextDiv = document.createElement("div");
        this.titleText = document.createTextNode(title);  // The title in the draggable part
        this.closeDiv = document.createElement("div");  // The close button
        this.closeText = document.createTextNode('X');
        this.clientDiv = document.createElement("div"); // Client area for text
    };

    setElementIDs() {
        // Give each element of the window an ID that can be used to retrieve the object from theStatusWindow array
        let str = PBStatusWindow.theStatusWindows.length + 'PBSW.';
        this.windowDiv.id = str + 'windowDiv';
        this.titleDiv.id = str + 'titleDiv';
        this.titleTextDiv.id = str + 'windowDiv';
        this.closeDiv.id = str + 'closeDiv';
        this.clientDiv.id = str + 'clientDiv';
    };

    appendChildren() {
        // Append all of the children to form the SW
        document.body.appendChild(this.windowDiv);
        this.windowDiv.appendChild(this.titleDiv);
        this.titleDiv.appendChild(this.titleTextDiv);
        this.titleDiv.appendChild(this.closeDiv);
        this.titleTextDiv.appendChild(this.titleText);
        this.closeDiv.appendChild(this.closeText);
        this.windowDiv.appendChild(this.clientDiv);
    };

    setStyles() {
        // Use CSS to style all of the HTML elements.
        // Have seen some strange responses to reasonable values.
        PBStatusWindow.setElementStyle(this.windowDiv,
            {
                position: "absolute",
                left: '1050px',
                top: '160px',
                width: '400px',
                minWidth: '100px',
                height: '400px',
                minHeight: '100px',
                backgroundColor: '#dde3eb',
                border: '2px solid #000000',
                resize: 'both',
                overflow: 'hidden',
                webkitUserSelect: 'none',   /* Safari 3.1+ */
                mozUserSelect: 'none',      /* Firefox 2+ */
                msUserSelect: 'none',       /* IE 10+ */
                userSelect: 'none',         /* Standard syntax */
                paddingTop: '21px',
                paddingBottom: '20px',
                cursor: 'default',
                fontSize: '16px',
                fontFamily: 'Arial'
            }
        );
        PBStatusWindow.setElementStyle(this.titleDiv,
            {
                position: 'absolute',
                left: '0px',
                top: '0px',
                height: "20px",
                width: '100%',
                borderBottom: '1px solid #000000',
                textAlign: 'center'
            }
        );
        PBStatusWindow.setElementStyle(this.closeDiv,
            {
                position: "absolute",
                top: '0px',
                right: '0px',
                width: '20px',
                height: '20px',
                borderLeft: '1px solid #000000',
                backgroundColor: '#cccccc'
            }
        );
        PBStatusWindow.setElementStyle(this.clientDiv,
            {
                width: '100%',
                height: '100%',
                overflow: 'auto',
                backgroundColor: '#ffffff',
                userSelect: 'none',
                borderBottomStyle: 'solid',
                borderWidth: '1px'
            }
        );
    };

    static close(theObject: HTMLDivElement | PBStatusWindow, close: boolean) {
        // Close/show SW based on instance or WindowDiv
        if (theObject) {
            if (theObject instanceof PBStatusWindow) {
                theObject.windowDiv.style.display = close ? 'none' : 'initial';
            } else if (theObject instanceof HTMLDivElement) {
                theObject.style.display = close ? 'none' : 'initial';
            }
        }
    }

    static closeAll(close: boolean) {
        // Close or show all SWs
        if (PBStatusWindow.allClosed != close) {
            PBStatusWindow.allClosed = close;
            PBStatusWindow.theStatusWindows.forEach(function(theSW) {
                PBStatusWindow.close(theSW, close);
            })
        }
    }

    static switchAll() {
        // Switch close/show state of all SWs
        PBStatusWindow.closeAll(!PBStatusWindow.allClosed);
    }

    writeMsg(theMsg: string) {
        this.clientDiv.innerHTML = theMsg + "<br/>" + this.clientDiv.innerHTML;
    };

    writeErr(theErr: string) {
        this.clientDiv.innerHTML = "<span style=\"color:red\">" + theErr + "</span><br/>" + this.clientDiv.innerHTML;
    };

    addEventHandlers() {
        this.titleDiv.addEventListener(PBConst.EVENTS.mouseDown, PBStatusWindow.beginDrag, false);     // For dragging
        this.closeDiv.addEventListener(PBConst.EVENTS.mouseClick, PBStatusWindow.closeOnClick, false);      // For closing
        this.clientDiv.addEventListener(PBConst.EVENTS.mouseClick, PBStatusWindow.clientOnClick, false);    // For bringing to front
        this.windowDiv.addEventListener(PBConst.EVENTS.mouseClick, PBStatusWindow.windowOnClick, false);    // For bringing to front
    };

    static closeOnClick(event: MouseEvent) {
        let theWindowDiv: HTMLDivElement = (event.target as HTMLDivElement).parentNode.parentNode as HTMLDivElement;  // The windowDiv is the grandparent of the closeDiv
        PBStatusWindow.close(theWindowDiv, true);
    };

    static clientOnClick(event: MouseEvent) {
        // Bring SW to front and clear all messages.
        PBStatusWindow.bringToFront((event.target as HTMLDivElement).id);
        (event.target as HTMLDivElement).innerText = '';
    };

    static windowOnClick(event: MouseEvent) {
        // Bring SW to front.
        PBStatusWindow.bringToFront((event.target as HTMLDivElement).id);
    };

    static beginDrag(event: MouseEvent){
        // Invoked when the mouse is clicked on the titleDiv element.
        let elementToDrag = (event.target as HTMLDivElement).parentNode.parentNode as HTMLDivElement;    // Remember the element
        let deltaX = event.clientX - parseInt(elementToDrag.style.left);    // Remember the starting location
        let deltaY = event.clientY - parseInt(elementToDrag.style.top);
        PBStatusWindow.bringToFront(elementToDrag.id);    // The top SW
        document.addEventListener(PBConst.EVENTS.mouseMove, moveHandler, true);
        document.addEventListener(PBConst.EVENTS.mouseUp, upHandler, true);
        event.stopPropagation();    // The message ends here
        event.preventDefault();

        function moveHandler(e: MouseEvent){
            // Still dragging.
            elementToDrag.style.left = (e.clientX - deltaX) + "px";
            elementToDrag.style.top = (e.clientY - deltaY) + "px";
            e.stopPropagation();
        }

        function upHandler(e: MouseEvent){
            // All done.  Clean up.
            document.removeEventListener(PBConst.EVENTS.mouseUp, upHandler, true);
            document.removeEventListener(PBConst.EVENTS.mouseMove, moveHandler, true);
            e.stopPropagation();
        }
    };
}


export {PBStatusWindow};