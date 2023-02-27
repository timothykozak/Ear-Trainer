//
// PBConst.ts
//
// Constants used throughout the project

class PBConst {
    static EVENTS = {
        sequencerNotePlayed: "PBSequencerNotePlayed",           // event.detail {SequenceItem}
        sequencerCadenceStarted: "PBSequencerCadenceStarted",   // event.detail = noteBeingTested
        sequencerTestNotePlayed: "PBSequencerTestNotePlayed",   // event.detail = undefined

        testerStarted: "PBTesterStarted",                       // event.detail = undefined
        testerFinished: "PBTesterFinished",                     // event.detail {theResults: TestResults}
        testerNoteAnswered: "PBTesterNoteAnswered",             // event.detail {theTestItem: TestItem, theResults: TestResults}

        soundsInstrumentLoaded: "PBSoundsInstrumentLoaded",     // event.detail = undefined

        keyboardHover: "PBKeyboardHover",                       // event.detail = note

        handleMenu: "PBHandleMenu",                             // event.detail = PBUI.MP_?

        optionsCreateTests: "PBCreateTests",                    // event.detail = standard tests

        resultsReset: "PBResetResults",                         // event.detail = undefined

        transportButton: "PBTransportButton",                   // event.detail = PBUI.TB_?

        mouseLeave: "mouseleave",
        mouseMove: "mousemove",
        mouseClick: "click",
        mouseDown: "mousedown",
        mouseUp: "mouseup",

        keyPress: "keypress",

        unload: "unload"
    };

    static GLYPHS = {   // To view the characters of the font, use http://torinak.com/font/lsfont.html
        // Aruvarb
        brace:              {value: '\u{0e000}', rem: 3.0},
        beginBar:           {value: '\u{0e030}', rem: 1.0},
        endBar:             {value: '\u{0e032}', rem: 1.0},
        gClef:              {value: '\u{1d11e}', rem: 1.0},
        fClef:              {value: '\u{1d122}', rem: 1.0},
        staff5Lines:        {value: '\u{1d11a}', rem: 1.0},
        ledgerLine:         {value: '\u{1d116}', rem: 1.0},

        wholeNote:          {value: '\u{0e1d2}', rem: 1.0},
        halfNoteUp:         {value: '\u{0e1d3}', rem: 1.0},
        halfNoteDown:       {value: '\u{0e1d4}', rem: 1.0},
        quarterNoteUp:      {value: '\u{0e1d5}', rem: 1.0},
        quarterNoteDown:    {value: '\u{0e1d6}', rem: 1.0},

        sharp:              {value: '\u{0e262}', rem: 1.0},
        flat:               {value: '\u{0e260}', rem: 1.0},

        // ionicons
        checkMark:          {value: '\u{0f121}', rem: 0.3},
        xMark:              {value: '\u{0f129}', rem: 0.3},
        gear:               {value: '\u{0f2f7}', rem: 0.3},
        greaterThan:        {value: '\u{0f3d1}', rem: 0.3},
        lessThan:           {value: '\u{0f3cf}', rem: 0.3},
        questionMark:       {value: '\u{0f444}', rem: 0.3},
        pause:              {value: '\u{0f478}', rem: 0.3},
        start:              {value: '\u{0f488}', rem: 0.3},
        stop:               {value: '\u{0f24f}', rem: 0.3},
        home:               {value: '\u{0f384}', rem: 0.3},
        graph:              {value: '\u{0f2b5}', rem: 0.3},
        gitHub:             {value: '\u{0f233}', rem: 0.3},
        hamburger:          {value: '\u{0f20d}', rem: 0.3},
        notes:              {value: '\u{0f20c}', rem: 0.3}
    };

    static MIDI = {
        // On a piano keyboard, 21 is A0, 108 is C8 and 60 is C4 (middle C)
        MIDDLE_C: 60,
        LOW: {
            SOUND: 58,
            KEYBOARD: 58
                },
        HIGH: {
            SOUND: 73,
            KEYBOARD: 73
        },
        MESSAGES: {
            // For a list of MIDI messages see:
            // https://www.midi.org/midi/specifications/item/table-1-summary-of-midi-message
            NOTE_OFF: 0x8,
            NOTE_ON: 0x9,
            AFTERTOUCH: 0xa,
            CONTINUOUS_CONTROLLER: 0xb,
            PATCH_CHANGE: 0xc,
            CHANNEL_PRESSURE: 0xd,
            PITCH_BEND: 0xe,
            NON_MUSICAL_COMMANDS: 0xf,
            ACTIVE_SENSING: 254
        },
        CONTINUOUS_CONTROLLER: {
            DAMPER_PEDAL: 65,
            PORTAMENTO: 66,
            SOSTENUTO_PEDAL: 67,
            SOFT_PEDAL: 68,
            LEGATO_FOOT_SWITCH: 69
        }
    };

    static TRANSPORT_BUTTONS = {
        START: 0,
        STOP: 1
    }

    static STORAGE = {
        optionsPage: "optionsPage",
        statsPage: "statsPage"
    };
}

enum NoteType {  // For notation positioning
    Cadence1,
    Cadence2,
    Cadence3,
    Cadence4,
    Testing,
    Answer,
    Immediate = Answer
}

enum TID { // Transport IDs
    Rewind,
    Stop,
    Start,
    Pause,
    Forward
}

export {PBConst, NoteType, TID};