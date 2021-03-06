let app;
let db;
let storage;
let ctx;
let canvas;

const ENV1_BASE_URL = "./Samples/Env1";
const ENV2_BASE_URL = "./Samples/Env2";
const ENV3_BASE_URL = "./Samples/Env3";
const ENV4_BASE_URL = "./Samples/Env4";
const DRUM_BASE_URL = "./Samples/Drum/";
const BASE_MIDI_NOTES_NUM = { "C1": 24, "C2": 36, "C3": 48, "C4": 60, "C5": 72, "C6": 84 };


const state = {
    //if needed to activate logs to debug put logON to true
    logON: false,
    loadingPage: {
        value: 0,
        limit: 0,
        lastUpdate: undefined,
        lastUpdateMessage: undefined,
        isFirstLoading: true,
        loadingText: {
            0: "Pick an element and build your environment",
            1: "Modify music with elements",
            2: "Try different combinations!",
            3: "Like it? Save it. Load it.",
            4: "If you're bored try \"MUSIC\" button",
            5: "Click pause if you need some rest",
            6: "Relax watching some pixelated sheeps",
            7: "Phone cabs are not so old...",
            8: "Palms? Seems to be in L.A.",
            9: "Be careful with cacti!",
            10: "Keep it loud with volume slider",
            11: "It's a good day for a swim",
            12: "Aahh...there's nothing better than the shade of a tree",
        }
    },
    transPlaying: false,
    hiddenGainVal: 0.8,
    isLoadingInstr: 0,
    imagesToDraw: {},
    environments: undefined,
    elementTypes: undefined,
    elements: [],
    queueCounter: 0,
    queueDay: 0, //0 night, 1 night to day, 2 day, 3 day to night
    now1: 0,
    canvasFactor: 8,
    framereq: undefined,
    fps: 15,
    instruments: {},
    stateChanged: false,
    readyModel: false,
    readyToPlay: false,
    isPlaying: true,
    isMelodyGenerated: false,
    key: "c", //main key of the system
    bpm: 60,
    totalLength: "",
    navigationPage: 0,
    startingId: 0,
    snapshots: [],
    master: {},
    playingPart: [],
    loopProgressSaved: 0,
    loopTimes: 0,
    theme: 4, // 0: bright, 1: dark
    lpf: undefined,
    buttonSound: undefined,
    nesBtnSound: undefined,
    drawing: {
        idList: {
            astrumDay: 21,
            astrumNight: 20,
            landscape: 0,
            floor: 8,
            building: 12,
            tree: 16,
            background: 1,
            flyingObject: []
        },
        image: {
            flyingObject: []
        },
        audio: {
            chords: "| F6 | Em7 A7 | Dm7 | Cm7 F7 |",
            melody: "f+4 c+8 a8 e+4 c+8 a8\nd+8 e+8 cb8 d+8 db+8 bb8 g8 ab8\na4 f8 d8 g8 a8 f8 e8\neb8 g16 bb16 d+8 db+8 r8 f8 f16 g8 f16",
            instruments: {
                chords: "",
            },
            cloudsInst: [0, 0, 0, 0],
        }
    },
}

/**
 *  Function to initialize the main settings of the player 
 */
async function initializeMyApp() {

    //initialize the drawing values

    // prioritize sustained playback
    initializeFirebase();
    Tone.context.lookAhead = 0.1;
    setNow()
    setMasterChain()
    controlledLog("master chain set")
    getMasterChain().channel.chain(getMasterChain().compressor, getMasterChain().hiddenGain, getMasterChain().mainGain, Tone.Destination)
    setLimit(40)
    increase();
    await initiateState()
    buildInstruments()
    setLimit(90)
    orderElements()
    await createMenu()
    assignClick()
    updatePage(0)
    prepareCanvas();
    controlledLog("nodes initialization")
    await generateNodes();
    setLimit(100)
    document.getElementById("loadingMessage").hidden = true;
    state.buttonSound = new ButtonSound();
    state.nesBtnSound = new NesBtnSound();
}

/**
 * bootstrap to start the whole system 
 */
initializeMyApp()

/***
 * 
 * 
 * MVC
 * 
 * 
 */

/**
 * state initialization
 */

async function initiateState() {
    let data = await getMenuTypes()
    state.elementTypes = data.primaryTypes
    state.environments = data.environments
    let elements = await getElements()
    state.elements = elements
}

function getSelectedIdList() {
    return state.drawing.idList;
}

function getStateElements() {
    return state.elements;
}

function getImage() {
    return state.drawing.image
}


function setNow() {
    state.loadingPage.lastUpdate = Date.now();
    state.loadingPage.lastUpdateMessage = Date.now();
}
function getMasterChain() {
    return state.master
}
function setMasterChain() {
    state.master = {
        compressor: new Tone.Compressor({
            threshold: -15,
            ratio: 7,
        }),
        hiddenGain: new Tone.Gain(state.hiddenGainVal),
        mainGain: new Tone.Gain(1),
        channel: new Tone.Channel(),
        mainVolumeSave: 1
    }
}

function setMasterVolume(value) {
    if (value > 0) state.master.mainVolumeSave = value
    state.master.mainGain.gain.value = value
}
function getSavedVolume() {
    return state.master.mainVolumeSave
}

function getMasterVolume() {
    return state.master.mainGain.gain.value
}



/**
 * loading bar improvement using requestAnimationFrame
 */
function setLimit(toValue) {
    state.loadingPage.limit = toValue
}
async function waitBarLoaded() {
    return new Promise(resolve => {
        if (state.loadingPage.value >= 100) {
            resolve();
            controlledLog("bar loaded")
        }
    });
}


function isHidden(el) {
    var style = window.getComputedStyle(el);
    return (style.visibility == 'hidden')
}

function increase() {
    let loadingText = document.getElementById("loadingMessage");
    let element = document.getElementById("loadingId");
    let panel = document.getElementById("initialLoadingPanel");
    let secondLoadingMessage = document.getElementById("secondLoadingMessage")
    let fromValue = state.loadingPage.value;
    let limit = state.loadingPage.limit;

    // color in theme
    if (!state.loadingPage.isFirstLoading) {
        switch (state.theme) {
            case 0:
                panel.setAttribute("style", "background-color : #a4dada !important");
                break;
            case 1:
                panel.setAttribute("style", "background-color : #09202d !important");
                break;
            case 2:
                panel.setAttribute("style", "background-color : #D8572A !important");
                break;
            case 3:
                panel.setAttribute("style", "background-color : #68D89B !important");
                break;
            case 4:
                panel.setAttribute("style", "background-color : #FFD95C !important");
                break;
        }
    }
    else panel.setAttribute("style", "background-color : #242f3f !important");

    if ((Date.now() - state.loadingPage.lastUpdate) > (1000 / 15)) {
        if (fromValue < limit) {
            state.loadingPage.value = fromValue + 1;
            element.value = state.loadingPage.value;

            if (limit < 50 && (Date.now() - state.loadingPage.lastUpdateMessage) > 3000) {
                let id = Math.round(Math.random() * Object.keys(state.loadingPage.loadingText).length);
                let text = Object.values(state.loadingPage.loadingText)[id];
                loadingText.textContent = text;
                state.loadingPage.lastUpdateMessage = Date.now();
            }
            else if (limit < 100 && (Date.now() - state.loadingPage.lastUpdateMessage) > 3000) {
                let id = Math.round(Math.random() * Object.keys(state.loadingPage.loadingText).length);
                let text = Object.values(state.loadingPage.loadingText)[id];
                loadingText.textContent = text;
                state.loadingPage.lastUpdateMessage = Date.now();
            }
        }
        if (fromValue >= 100) {
            document.getElementById("container").hidden = false
            document.getElementById("initialLoadingPanel").style.visibility = 'hidden'
            state.loadingPage.resolvePromise()
            controlledLog("promise solved")
            controlledLog(state.drawing)
        } else {
            window.requestAnimationFrame(increase)
            state.loadingPage.lastUpdate = Date.now()
        }
    } else {
        window.requestAnimationFrame(increase)
    }

    if (state.loadingPage.value <= 0) {
        state.loadingPage.finishPromise = new Promise(resolve => {
            state.loadingPage.resolvePromise = resolve;
            controlledLog("promise launched")
        });
    }
}




/**
 * id of the element to load to change the actual drawing state
 * @param {int} idValue 
 */
function modifyIdList(idValue) {
    controlledLog(idValue)
    let modifyingValue = state.elements.find(element => element.id == idValue)
    controlledLog("modifying value")
    controlledLog(modifyingValue)
    switch (modifyingValue.elementType) {
        case ("floor"): {
            state.drawing.idList[modifyingValue.elementType] = modifyingValue.id
        } break;
        case ("background"): {
            state.drawing.idList[modifyingValue.elementType] = modifyingValue.id
        } break;
        case ("landscape"): {
            state.drawing.idList[modifyingValue.elementType] = modifyingValue.id
            state.isMelodyGenerated = false;
            document.getElementById("btn-ct").classList.remove("is-primary")
        } break;
        case ("building"): {
            state.drawing.idList[modifyingValue.elementType] = modifyingValue.id
        } break;
        case ("tree"): {
            state.drawing.idList[modifyingValue.elementType] = modifyingValue.id
        } break;
        case ("astrumDay"): {
            state.drawing.idList[modifyingValue.elementType] = modifyingValue.id
        } break;
        case ("astrumNight"): {
            state.drawing.idList[modifyingValue.elementType] = modifyingValue.id
        } break;
        case ("flyingObject"): {
            const count = {};
            for (const element of state.drawing.idList[modifyingValue.elementType]) {
                if (count[element]) {
                    count[element] += 1;
                } else {
                    count[element] = 1;
                }
            }
            if (count[modifyingValue.id] > 2) {
                while (state.drawing.idList[modifyingValue.elementType].indexOf(modifyingValue.id) != -1) {
                    let index = state.drawing.idList[modifyingValue.elementType].indexOf(modifyingValue.id)
                    state.drawing.idList[modifyingValue.elementType].splice(index, 1)
                }
            } else {
                state.drawing.idList[modifyingValue.elementType].push(modifyingValue.id)
            }
        } break;

    }
    controlledLog(getIdList());
}

/**
 * function used to update the state of the system 
 */
async function updateState() {
    let ids = getIdList()
    controlledLog("ID VALUES:");
    controlledLog(ids)
    let flyObjsArr = []
    state.imagesToDraw["flyingObject"] = flyObjsArr
    state.drawing.image["flyingObject"] = {}
    var i = 0;
    for (let id of ids) {
        controlledLog(i++)
        let modifyingValue = state.elements.find(element => element.id == id)
        controlledLog("modifyingValue")
        controlledLog(modifyingValue)
        switch (modifyingValue.elementType) {
            case ("floor"): {
                state.drawing.image[modifyingValue.elementType] = modifyingValue.image
                state.drawing.audio.instruments["chords"] = modifyingValue.audio.instrument

            } break;
            case ("background"): {
                state.drawing.image[modifyingValue.elementType] = modifyingValue.image

            } break;
            case ("landscape"): {
                state.startingId = modifyingValue.audio.nodeId;
                state.drawing.image[modifyingValue.elementType] = modifyingValue.image
            } break;
            case ("building"): {
                state.drawing.image[modifyingValue.elementType] = modifyingValue.image
                state.drawing.audio.instruments["melody"] = modifyingValue.audio.instrument
            } break;
            case ("tree"): {
                state.drawing.image[modifyingValue.elementType] = modifyingValue.image
                state.drawing.audio.instruments["bass"] = modifyingValue.audio.instrument
            } break;
            case ("astrumDay"): {
                state.drawing.image[modifyingValue.elementType] = modifyingValue.image
                state.imagesToDraw[modifyingValue.elementType] = await DrawableImage.build(state.drawing.image[modifyingValue.elementType])
            } break;
            case ("astrumNight"): {
                state.drawing.image[modifyingValue.elementType] = modifyingValue.image
                //state.imagesToDraw[modifyingValue.elementType] = await DrawableImage.build(state.drawing.image[modifyingValue.elementType])
            } break;
            case ("flyingObject"): {
                if (state.drawing.image[modifyingValue.elementType][modifyingValue.id] == undefined) {
                    state.drawing.image[modifyingValue.elementType][modifyingValue.id] = {
                        image: modifyingValue.image,
                        quantity: 1
                    }
                } else {
                    state.drawing.image[modifyingValue.elementType][modifyingValue.id]["quantity"]++;
                }
            } break;

        }
    }
    for (const item in state.drawing.image) {
        controlledLog("item::")
        controlledLog(item)
        if (item != "flyingObject") {
            state.imagesToDraw[item] = await DrawableImage.build(state.drawing.image[item])
        } else {
            controlledLog("cloudsList:")
            controlledLog(state.drawing.image);
            state.drawing.audio.cloudsInst = [0, 0, 0, 0]
            for (const idItem in state.drawing.image[item]) {
                controlledLog(idItem)
                state.drawing.audio.cloudsInst[idItem - 22] = state.drawing.image[item][idItem].quantity;
                var templateToPush = await DrawableImage.build(state.drawing.image[item][idItem].image)
                for (i = 0; i < state.drawing.image[item][idItem].quantity; i++) {
                    var valToPush = templateToPush.clone();
                    valToPush.left = 0.5 * i + (Math.random() * 0.4) + 0.3;
                    var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
                    var bottomToPush = 1 - (0.3) - (i * 0.2 + (- 0.1 * Math.random()));
                    if (bottomToPush < 0.5) bottomToPush = bottomToPush + 0.2
                    valToPush.bottom = bottomToPush
                    state.imagesToDraw[item].push(valToPush);
                }
            }
        }
    }
    controlledLog("CLOUDS ARRAY")
    controlledLog(state.drawing.audio.cloudsInst)

}

function getIdList() {
    let arToRet = []
    for (const [key, value] of Object.entries(state.drawing.idList)) {
        switch (key) {
            case ("floor"): {
                arToRet.push(value)
            } break;
            case ("background"): {
                arToRet.push(value)
            } break;
            case ("landscape"): {
                arToRet.push(value)
            } break;
            case ("building"): {
                arToRet.push(value)
            } break;
            case ("tree"): {
                arToRet.push(value)
            } break;
            case ("astrumDay"): {
                arToRet.push(value)
            } break;
            case ("astrumNight"): {
                arToRet.push(value)
            } break;
            case ("flyingObject"): {
                for (let el of value) {
                    arToRet.push(el)
                }
            } break;

        }
    }

    return arToRet
}

function orderElements() {
    let orderedEl = []
    let elements = state.elements
    let elementTypes = state.elementTypes
    let environments = state.environments
    for (let elType of elementTypes) {
        for (let env of environments) {
            let el = elements.find(element => ((element.elementType == elType) && (element.environment == env)))
            let index = elements.indexOf(el)
            elements.splice(index, 1)
            orderedEl.push(el)
        }
    }
    let el1;
    while ((el1 = elements.find(element => ((element.elementType == "flyingObject")))) != undefined) {
        let index = elements.indexOf(el1)
        elements.splice(index, 1)
        orderedEl.push(el1)
    }
    while (elements.length > 0) {
        let el = elements.pop()
        orderedEl.push(el)
    }
    state.elements = orderedEl;

}


function getImageToDraw(key) {
    return state.imagesToDraw[key]
}
function getFrameReq() {
    return state.framereq
}
function setFrameReq(value) {
    state.framereq = value
}

/**
 * work on play pause elements
 */

function setPlaying(value) {
    state.isPlaying = value
}

function isPlaying() {
    return state.isPlaying
}
function getAnimationSnap() {
    return state.now1
}
function setAnimationSnap(value) {
    state.now1 = value
}
function getFPS() {
    return state.fps
}

function getNavPage() {
    return state.navigationPage
}

function setNavPage(aPage) {
    state.navigationPage = aPage
}

function setInstrument(instrName, instrInstance) {

    state.instruments[instrName] = instrInstance;
}

function getInstrument(instrName) {
    return state.instruments[instrName];
}

function getInstrumentList() {
    return state.drawing.audio.instruments;
}

function getPlayingInstrument(instrUse) {
    let instr = getInstrument(state.drawing.audio.instruments[instrUse])
    return instr;
}

/*
    Nodes handling
*/

async function generateNodes() {
    var nodeList = await getNodes()
    var mMelody = new MarkovMelody(nodeList)
    state.melodyNodes = mMelody
}

function generateMelody(startId) {
    return state.melodyNodes.generateMelody(startId)
}

function getMelodyString() {
    return state.drawing.audio.melody;
}

function getChordString() {
    return state.drawing.audio.chords;
}

function getStartingNode() {
    return state.startingId;
}

function addPlayingPart(playingPart) {
    state.playingPart.push(playingPart)
}
function getPlayingPartLength() {
    return state.playingPart.length
}
function getPlayingPart() {
    return state.playingPart
}


// {
//   "__idEnvStructure": "1x -> mountain, 2x -> desert, 3x -> city, 4x -> seaside, 5x -> skyelement",
//   "__idElemStructure": "x1 -> background, x2 -> landscape, x3 -> floor, x4 -> building, x5 -> shrub"
// },
/**
 * 
 * @param {bool} isFirst values that states if the function is called during the initialization 
 */
async function propagateStateChanges(isFirst) {

    controlledLog("state before propagation")
    controlledLog(state)
    if (state.drawing.image.isChanged) {
        //TODO: adding function to reshape the image of the view 
        state.drawing.image.isChanged = false
    }

    if (state.drawing.chords.isChanged === true) {
        if (state.playingPartChords) {
            state.playingPartChords.cancel(0)
        } else {
        }
        Tone.Transport.loopEnd = state.drawing.loopLength;
        Object.keys(state.effects.harmony).forEach(key => {
            controlledLog(state.effects.harmony[key])
            state.effects.harmony[key].wet.value = 0;
        });
        for (i = 0; i < state.drawing.chords.effects.length; i++) {
            controlledLog(state.drawing.chords.effects[i].effect)
            controlledLog(state.effects.harmony)

            state.effects.harmony[state.drawing.chords.effects[i].effect].set(state.drawing.chords.effects[i].setup)
        }
        state.playingPartChords = playChordSequence(state.drawing.chords.sequence, state.key, state.instruments[state.drawing.chords.instrument], 1)
        state.playingPartChords.loopEnd = state.drawing.chords.loopLength
        state.playingPartChords.loop = true;
        state.drawing.chords.isChanged = false
    }

    if (state.drawing.melody.isChanged === true) {
        if (!isFirst) {
            state.drawing.melody.playingPart.stop()
        }
        Object.keys(state.effects.melody).forEach(key => {
            state.effects.melody[key].wet.value = 0;
        });
        for (i = 0; i < state.drawing.melody.effects.length; i++) {
            state.effects.melody[state.drawing.melody.effects[i].effect].set(state.drawing.melody.effects[i].setup)
        }

        state.drawing.melody.playingPart = addNotePartToTransport(generatePart(state.drawing.melody.sequence), state.instruments[state.drawing.melody.instrument], 0)
        state.drawing.melody.isChanged = false
    }
    controlledLog("state after propagation")
    controlledLog(state)
}



function buildInstruments() {

    //building audio channels
    let melodyChannel = new Tone.Channel({ channelCount: 2 });
    let harmonyChannel = new Tone.Channel();
    let bassChannel = new Tone.Channel();
    let drumChannel = new Tone.Channel();
    // state.lpf = new Tone.AutoFilter("0.2Hz", 300, 2).start();
    // state.lpf.set({
    //     type: "sine",
    //     wet: 1,
    //     depth: 1,

    // })
    state.lpf = new Tone.Filter(20000, "lowpass", -24);
    state.lpf.connect(getMasterChain().channel);
    harmonyChannel.chain(
        state.lpf
    )
    bassChannel.chain(
        state.lpf
    )
    melodyChannel.chain(
        state.lpf
    )
    drumChannel.chain(
        state.lpf
    )

    /*      building instruments         */

    /* leads */
    let bell = new Bell();
    let moog = new Moog();
    let sitar = new Sitar()
    let marimba = new Marimba();

    bell.connect(melodyChannel)
    moog.connect(melodyChannel)
    sitar.connect(melodyChannel)
    marimba.connect(melodyChannel)

    setInstrument("Bell", bell)
    setInstrument("Lead", moog)
    setInstrument("Sitar", sitar)
    setInstrument("Marimba", marimba)


    /* bass */
    let bass1 = new Bass1()
    let bass2 = new Bass2()
    let bass3 = new Bass3()
    let bass4 = new Bass4()

    bass1.connect(bassChannel)
    bass2.connect(bassChannel)
    bass3.connect(bassChannel)
    bass4.connect(bassChannel)


    setInstrument("Bass1", bass1)
    setInstrument("Bass2", bass2)
    setInstrument("Bass3", bass3)
    setInstrument("Bass4", bass4)


    /* pads */
    let synth1 = new Synth1()
    let synth2 = new Synth2()
    let synth3 = new Synth3()
    let synth4 = new Synth4()

    synth1.connect(harmonyChannel)
    synth2.connect(harmonyChannel)
    synth3.connect(harmonyChannel)
    synth4.connect(harmonyChannel)


    setInstrument("Synth1", synth1)
    setInstrument("Synth2", synth2)
    setInstrument("Synth3", synth3)
    setInstrument("Synth4", synth4)

    /* drum machine */
    let drum = new DrumMachine();
    setInstrument("Drum", drum);
    drum.connect(drumChannel);



    // building ambient effects
    let reverbChannel = new Tone.Channel(3).connect(getMasterChain().channel);
    let merge = new Tone.Merge().connect(reverbChannel);

    let reverbL = new Tone.Reverb({
        decay: 5.2,
        predelay: 0.6,
        wet: 1,
    }).connect(merge, 0, 0);

    let reverbR = new Tone.Reverb({
        decay: 5.1,
        predelay: 0.5,
        wet: 1,
    }).connect(merge, 0, 1);

    // reverb sends
    melodyChannel.fan(reverbL, reverbR);
    harmonyChannel.fan(reverbL, reverbR);
    // setFilterFreq(1)

}

function setFilterFreq(val) {
    let aFreq = logMap(val, 0, 1, 2000, 20000)
    state.lpf.set({
        frequency: aFreq
    })
}

function logMap(inValue, inMin, inMax, outMin, outMax) {
    var minp = inMin;
    var maxp = inMax;

    var minv = Math.log(outMin);
    var maxv = Math.log(outMax);

    // calculate adjustment factor
    var scale = (maxv - minv) / (maxp - minp);

    return Math.exp(minv + scale * (inValue - minp));
}

async function waitInstLoaded() {
    return new Promise(resolve => {
        while (state.isLoading == 0) {
            resolve();
            controlledLog("all Instruments are loaded")
            controlledLog(state.isLoading)
        }
    });
}


async function startMusic() {

    state.master.hiddenGain.gain.rampTo(state.hiddenGainVal, 0.2)
    Tone.Transport.bpm.value = 60

    Tone.Transport.start("+0.5", "0:0:0");
    getInstrument("Drum").playPattern(state.drawing.audio.cloudsInst);

    setPlaying(true);
}


function stopMusic() {
    state.master.hiddenGain.gain.rampTo(0, 0.2)
    Tone.Transport.stop();
    setPlaying(false);
}


function togglePlayPause() {
    if (state.isPlaying) {
        Tone.Transport.pause()
        state.isPlaying = false
        controlledLog(state.isPlaying)
        state.master.hiddenGain.gain.rampTo(0, 0.2)
        document.getElementById("btn-play-play").style.display = "block"
        document.getElementById("btn-play-pause").style.display = "none"
    } else {
        Tone.Transport.start()
        state.isPlaying = true
        setFrameReq(window.requestAnimationFrame(countFPS))
        state.master.hiddenGain.gain.rampTo(state.hiddenGainVal, 0.2)
        document.getElementById("btn-play-pause").style.display = "block"
        document.getElementById("btn-play-play").style.display = "none"
    }
}

window.addEventListener("keydown", function (event) {
    if (event.key == "MediaPlayPause") togglePlayPause()
}, true);


/**
 * 
 * @param {*} noteSequence quantized noteSequence generated by magenta models
 * @returns 
 */
function generatePart(noteSequence) {
    controlledLog(noteSequence)
    //var qpm = 
    var numofnotes = noteSequence.notes.length
    var notesToTranscribe = noteSequence.notes
    var notes = []
    var stepsPerQuarter = noteSequence.quantizationInfo.stepsPerQuarter;
    for (var i = 0; i < numofnotes; i++) {
        noteFromArray = notesToTranscribe[i]
        controlledLog(noteFromArray.quantizedStartStep)
        var note = Note.fromMidi(noteFromArray.pitch)
        var velocity = 0.5;
        var measure = Math.floor(noteFromArray.quantizedStartStep / (4 * stepsPerQuarter))
        var quarter = Math.floor((noteFromArray.quantizedStartStep % (4 * stepsPerQuarter)) / 4)
        var sixteenth = Math.floor(noteFromArray.quantizedStartStep) - quarter * 4 - measure * 16;
        controlledLog(measure)
        var timeString = measure + ":" + quarter + ":" + sixteenth;
        var durationSteps = noteFromArray.quantizedEndStep - noteFromArray.quantizedStartStep
        var measureDur = Math.floor(durationSteps / (4 * stepsPerQuarter))
        var quarterDur = Math.floor((durationSteps % (4 * stepsPerQuarter)) / 4)
        var sixteenthDur = Math.floor(durationSteps) - quarterDur * 4 - measureDur * 16;
        var durationString = measureDur + ":" + quarterDur + ":" + sixteenthDur;
        var indexInput = {
            time: timeString,
            note: note,
            velocity: velocity,
            duration: durationString
        }
        notes.push(indexInput)
    }
    controlledLog(notes)
    return notes
}
/**
 * 
 * @param {*} melodyString 
 * @returns format {midiNote,duration,time}
 */
function parseMelodyString(melodyString) {
    let notesToRet = [];
    let barsArray = melodyString.split("\n")
    controlledLog("melody Parsed by bar")
    controlledLog(barsArray)
    barsArray.pop();
    controlledLog("melody Parsed by bar after pop last empty element")
    controlledLog(barsArray)
    let barsNum = barsArray.length
    let barIndex = 0;
    let quarterIndex = 0;
    let sixteenthIndex = 0;
    for (let bar of barsArray) {
        let notesArray = bar.split(" ")
        controlledLog(notesArray)
        for (let note of notesArray) {
            let noteMap = buildNoteFromString(note)
            let timeSig = barIndex + ":" + quarterIndex + ":" + sixteenthIndex
            noteMap["time"] = timeSig
            if (noteMap.note != "r") {
                notesToRet.push(noteMap)
            }
            switch (noteMap.duration) {
                case "1m":
                    barIndex = barIndex + 1;
                    break;
                case "1m.":
                    barIndex = barIndex + 1;
                    quarterIndex = quarterIndex + 2
                    break;
                case "1m..":
                    barIndex = barIndex + 1;
                    quarterIndex = quarterIndex + 3
                    break;
                case "2n":
                    quarterIndex = quarterIndex + 2;
                    break;
                case "2n.":
                    quarterIndex = quarterIndex + 3;
                    break;
                case "2n..":
                    quarterIndex = quarterIndex + 3;
                    sixteenthIndex = sixteenthIndex + 2;
                    break;
                case "4n":
                    quarterIndex = quarterIndex + 1;
                    break;
                case "4n.":
                    quarterIndex = quarterIndex + 1;
                    sixteenthIndex = sixteenthIndex + 2;
                    break;
                case "4n..":
                    quarterIndex = quarterIndex + 1;
                    sixteenthIndex = sixteenthIndex + 3;
                    break;
                case "8n":
                    sixteenthIndex = sixteenthIndex + 2;
                    break;
                case "8n.":
                    sixteenthIndex = sixteenthIndex + 3;
                    break;
                case "16n":
                    sixteenthIndex = sixteenthIndex + 1;
                    break;
            }

            if (sixteenthIndex >= 4) {
                let carry = sixteenthIndex % 4
                let value = Math.floor(sixteenthIndex / 4)
                quarterIndex = quarterIndex + value;
                sixteenthIndex = carry;
            }
            if (quarterIndex >= 4) {
                let carry = quarterIndex % 4
                let value = Math.floor(quarterIndex / 4)
                barIndex = barIndex + value;
                quarterIndex = carry;
            }

            controlledLog(noteMap)
        }

    }

    let loopValue = barIndex + ":" + quarterIndex + ":" + sixteenthIndex;
    controlledLog(barsArray)
    controlledLog(notesToRet)
    return {
        notesArray: notesToRet,
        loopValue: loopValue
    };
}

function buildNoteFromString(noteString) {
    let midiNote;
    let duration;
    let noteStr;
    let durNum;
    //find the char starting duration
    var num = /\d/;
    var firstNum = noteString.match(num);
    var numPos = noteString.indexOf(firstNum);

    //midiNote value calculation from string
    midiNote = noteString.charAt(0);
    if (midiNote != "r") {
        if (noteString.charAt(1) == "b" || noteString.charAt(1) == "#") midiNote = midiNote + noteString.charAt(1);
        let octave = 3 + (count(noteString, "+")) - (count(noteString, "-"))
        midiNote = midiNote + octave;
    } else {
        midiNote = "r"
    }
    let points = count(noteString, ".");
    let mystr = noteString.substring(numPos, noteString.length - points);
    controlledLog(mystr)

    switch (mystr) {
        case "1": duration = "1m"
            break;
        case "2": duration = "2n"
            break;
        case "4": duration = "4n"
            break;
        case "8": duration = "8n"
            break;
        case "16": duration = "16n"
            break;
    }

    for (let i = 0; i < points; i++) {
        duration = duration + "."
    }
    let noteToRet = {
        note: midiNote,
        duration: duration
    }
    controlledLog(noteToRet)
    return noteToRet;
}

/**
 * counts the occurences of a character in a certain string
 * @param {} str 
 * @param {*} find 
 * @returns 
 */
function count(str, find) {
    return (str.split(find)).length - 1;
}


/**
 * 
 * @param {*} notePart 
 * @param {*} instrument 
 * @param {*} startTime 
 * @returns 
 */

function addNotePartToTransport(notePart, instrument) {
    const part = new Tone.Part((time, value) => {
        instrument.triggerAttack(value.note, value.duration, time, 0.5)
    }, notePart).start(0)
    return part
}

function playChordSequence(chordsSequence, instrument) {
    controlledLog(instrument)
    let chordsPlayed = new Tone.Part(((time, value) => {

        instrument.triggerAttackRelease(value.notes, value.duration, time, 1)
        getPlayingInstrument("bass").triggerAttackRelease(value.notes, value.duration, time);
    }), chordsSequence).start(0)
    return chordsPlayed
}


function parseChordsString(chordsString) {
    let chordsToRet = []
    let barsArray = []
    barsArray = chordsString.split("|")
    barsArray.shift()
    barsArray.pop()
    let numOfBars = barsArray.length
    let barCount = 0;
    let quarterCount = 0;
    let sixteenthCount = 0;
    for (let bar of barsArray) {
        let chordsBar = bar.split(" ");
        controlledLog(chordsBar)
        chordsBar.shift()
        chordsBar.pop()
        controlledLog(chordsBar)
        quarterCount = 0;
        sixteenthCount = 0;
        let quarterAdd = 4 / chordsBar.length;
        controlledLog(quarterAdd)
        for (let aChord of chordsBar) {
            var dur;
            switch (quarterAdd) {
                case 4: dur = "1m";
                    break;
                case 2: dur = "2n";
                    break;
                case 1: dur = "4n";
                    break;
            }
            var tTime = barCount + ":" + quarterCount + ":" + sixteenthCount
            let notesArray = fromChordToNotes(aChord)
            let chord = {
                notes: notesArray,
                time: tTime,
                duration: dur
            }
            quarterCount = quarterCount + quarterAdd

            chordsToRet.push(chord)
        }
        if (quarterCount >= 4) {
            quarterCount = quarterCount % 4
        }
        barCount++;
    }
    controlledLog(chordsToRet)
    let barLoop = barCount + ":" + quarterCount + ":" + sixteenthCount
    return {
        chordsList: chordsToRet,
        barLoop: barLoop
    }
}
function fromChordToNotes(chordName) {
    var notesArray = Tonal.Chord.get(chordName).notes
    var distanceFromC = Tonal.Interval.distance("C", notesArray[notesArray.length - 1])
    controlledLog("distance from C: " + distanceFromC)
    let noteOctave = 3
    for (var j = notesArray.length - 1; j >= 0; j--) {
        if (Tonal.Interval.semitones(Tonal.Interval.distance("C", notesArray[j])) > Tonal.Interval.semitones(distanceFromC)) {
            noteOctave--;
            distanceFromC = Tonal.Interval.distance("C", notesArray[j])
        }
        notesArray[j] = notesArray[j] + noteOctave

    }
    controlledLog(notesArray)
    return notesArray
}


function initMusic() {
    Tone.Transport.cancel()
    let computedMelody = parseMelodyString(getMelodyString())
    let computeChords = parseChordsString(getChordString())
    controlledLog(computedMelody)
    if (computeChords.barLoop != computedMelody.loopValue) {
        console.error("loop bars no consistent, melodyLoop: " + computedMelody.loopValue + ", chordsloop: " + computeChords.barLoop)
    }
    addNotePartToTransport(computedMelody.notesArray, getPlayingInstrument("melody"))
    playChordSequence(computeChords.chordsList, getPlayingInstrument("chords"))
    // playChordSequence(computeChords.chordsList, getPlayingInstrument("chords"))
    Tone.Transport.loopEnd = computedMelody.loopValue;
    Tone.Transport.loop = true;

}





//canvas handling

var t = Tone.Time('16m').toMilliseconds()
var omega = 0; /* canvas angular speed */
var factor = 4;
var time0 = 0//Tone.Transport.now()*1000//.toMilliseconds()//new Date();
controlledLog("time0")
controlledLog(time0)

let themeButton = document.getElementById('themeSelector');
updateTheme();
themeButton.onclick = updateTheme;

function updateTheme() {
    controlledLog("THEME CLICKED");
    let body = document.body;
    let upbar = document.getElementById("upbar");
    let navbar = document.querySelectorAll(".navbar");
    let cloudsLabels = document.querySelectorAll(".token-add");
    controlledLog(getComputedStyle(body))

    state.theme = (state.theme + 1) % 5;

    switch (state.theme) {
        case 0:
            //apply bright theme
            body.setAttribute("style", "background-color : #a4dada !important");
            upbar.setAttribute("style", "background-color : #69c9ce  !important");
            navbar.forEach((bar) => { bar.setAttribute("style", "background-color : #69c9ce  !important"); })
            cloudsLabels.forEach((label) => { label.setAttribute("style", "color: black !important") });
            break;

        case 1:
            //apply dark theme
            body.setAttribute("style", "background-color : #09202d  !important");
            upbar.setAttribute("style", "background-color : #010a18  !important");
            navbar.forEach((bar) => { bar.setAttribute("style", "background-color : #010a18  !important"); })
            cloudsLabels.forEach((label) => { label.setAttribute("style", "color: white !important") });
            break;

        case 2:
            //apply red theme
            body.setAttribute("style", "background-color : #D8572A  !important");
            upbar.setAttribute("style", "background-color : #C32F27  !important");
            navbar.forEach((bar) => { bar.setAttribute("style", "background-color : #C32F27  !important"); })
            cloudsLabels.forEach((label) => { label.setAttribute("style", "color: white !important") });
            break;

        case 3:
            //apply green theme
            body.setAttribute("style", "background-color : #68D89B  !important");
            upbar.setAttribute("style", "background-color : #4F9D69  !important");
            navbar.forEach((bar) => { bar.setAttribute("style", "background-color : #4F9D69  !important"); })
            cloudsLabels.forEach((label) => { label.setAttribute("style", "color: black !important") });
            break;

        case 4:
            //apply green theme
            body.setAttribute("style", "background-color : #FFD95C  !important");
            upbar.setAttribute("style", "background-color : #FFD100  !important");
            navbar.forEach((bar) => { bar.setAttribute("style", "background-color : #FFD100  !important"); })
            cloudsLabels.forEach((label) => { label.setAttribute("style", "color: black !important") });
            break;

        default:
            controlledLog("THEME ERROR");
            break;
    }


};


function prepareCanvas() {
    const canvasDiv = document.getElementById('canvas-div');
    canvas = document.getElementById("main-canvas")
    canvas.className = "canvases";
    canvas.width = 256 * factor;
    canvas.height = 128 * factor;
    canvasDiv.appendChild(canvas);
    ctx = canvas.getContext('2d');
    var moonRadius = canvas.width / 1.1;
}


async function initImages() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    controlledLog(getImageToDraw("astrumDay"))
    controlledLog(getImageToDraw("astrumNight"))
    state.loopProgressSaved = 0;
    state.loopTimes = 0;
    setFrameReq(window.requestAnimationFrame(countFPS))
}

function countFPS() {
    if (isPlaying()) {
        if (Date.now() - getAnimationSnap() > 1000 / getFPS()) {
            setAnimationSnap(Date.now())
            setFrameReq(window.requestAnimationFrame(createEnvironment));
        } else {

            setFrameReq(window.requestAnimationFrame(countFPS));
        }
    }
}



function createEnvironment() {

    //const values to modify canvas elements 
    const NIGHT_START = 0.3
    const SUNRISE_START = 3.14
    const SUNRISE_END = 3.30
    const DAY_START = 3.70
    const SUNSET_START = 6.10
    const SUNSET_END = 0
    let lightOn = false
    const ALPHASTART = Math.PI * 3 / 2

    let alphaNight = 0
    let alphaSunrise = 0
    let alphaDay = 0
    let alphaSunset = 0
    let sunToDraw = 0

    var time = Tone.Transport.now() * 1000//.toMilliseconds();//Date.now()
    var loopProgress = Tone.Transport.progress
    if (loopProgress < state.loopProgressSaved) {
        state.loopTimes++
    }
    var time2 = (state.loopTimes + loopProgress) * (Tone.Transport.loopEnd) * 1000
    state.loopProgressSaved = loopProgress
    var h = canvas.height;
    var w = canvas.width;

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false;
    var a = 1
    //var a = 6;
    omega = a / t;

    let hAstra = h - getImageToDraw("floor").getNHeight() * factor - 25 * factor;
    let wAstra = w / 2 - ((getImageToDraw("astrumNight").getNWidth()) / 2 * factor) - (0.08 * w)
    var angle = ALPHASTART + (omega * (time2 - time0))//time0.getTime()))

    let angleD = angle % (2 * Math.PI)
    let transAngle = angle % (w)
    // BACKGROUND IMAGE
    // sunset -> night
    if (angleD < NIGHT_START) {
        alphaNight = 1//(1 / (NIGHT_START - SUNSET_END)) * (angleD - SUNSET_END)
        alphaSunrise = 0
        alphaSunset = 1 - (1 / (NIGHT_START - SUNSET_END)) * (angleD - SUNSET_END)
        alphaDay = 0
        lightOn = true
        sunToDraw = 1
        setFilterFreq(alphaSunset / 2)
    }
    // night
    else if (angleD < SUNRISE_START) {
        alphaNight = 1
        alphaSunrise = 0
        alphaSunset = 0
        alphaDay = 0
        lightOn = true
        setFilterFreq(0)
    }
    //  night -> sunrise
    else if (angleD < SUNRISE_END) {
        alphaNight = 1 //- (1 / (SUNRISE_END - SUNRISE_START)) * (angleD - SUNRISE_START)
        alphaSunrise = (1 / (SUNRISE_END - SUNRISE_START)) * (angleD - SUNRISE_START)
        alphaSunset = 0
        alphaDay = 0
        lightOn = true
        setFilterFreq(alphaSunrise / 2)
    }
    // sunrise -> day 
    else if (angleD < DAY_START) {
        alphaNight = 0
        alphaSunrise = 1 //- (1 / (DAY_START - SUNRISE_END)) * (angleD - SUNRISE_END)
        alphaSunset = 0
        alphaDay = (1 / (DAY_START - SUNRISE_END)) * (angleD - SUNRISE_END)
        lightOn = false
        setFilterFreq(0.5 + alphaDay / 2)
    }
    // day
    else if (angleD < SUNSET_START) {
        alphaNight = 0
        alphaSunrise = 0
        alphaSunset = 0
        alphaDay = 1
        lightOn = false
        setFilterFreq(1)
    }
    // day -> sunset
    else {
        alphaNight = 0
        alphaSunrise = 0
        alphaSunset = 1//(1 / (2 * Math.PI - SUNSET_START)) * (angleD - SUNSET_START)
        alphaDay = 1 - (1 / (2 * Math.PI - SUNSET_START)) * (angleD - SUNSET_START)
        lightOn = false
        sunToDraw = (1 / (2 * Math.PI - SUNSET_START)) * (angleD - SUNSET_START)
        setFilterFreq(0.5 + alphaDay / 2)
    }

    let background = getImageToDraw("background");
    background.drawThisImage(0, alphaNight, lightOn, canvas.height, canvas.width, ctx, factor)
    background.drawThisImage(1, alphaSunrise, lightOn, canvas.height, canvas.width, ctx, factor)
    background.drawThisImage(2, alphaSunset, lightOn, canvas.height, canvas.width, ctx, factor)
    background.drawThisImage(3, alphaDay, lightOn, canvas.height, canvas.width, ctx, factor)
    ctx.save();
    ctx.translate(Math.round(w / 2), Math.round(hAstra - 15 * factor))

    ctx.save()

    let moon = getImageToDraw("astrumNight")
    ctx.translate(Math.round(-wAstra * (Math.cos(angle))), Math.round(hAstra * (Math.sin(-angle))))
    ctx.translate(Math.round(-(moon.getNWidth() * factor) / 2), Math.round((moon.getNHeight() * factor) / 2))
    moon.drawThisImage(0, 1, lightOn, 0, 0, ctx, factor)
    ctx.restore()

    ctx.save()

    let sun = getImageToDraw("astrumDay")
    ctx.translate(Math.round(wAstra * (Math.cos(angle - 0.1))), Math.round(hAstra * (Math.sin(angle - 0.1))))
    ctx.translate(Math.round(-(sun.getNWidth() * factor) / 2), Math.round((sun.getNHeight() * factor) / 2))
    sun.drawThisImage(0, 1, lightOn, 0, 0, ctx, factor)
    sun.drawThisImage(1, sunToDraw, lightOn, 0, 0, ctx, factor)


    ctx.restore()
    ctx.restore()

    ctx.save()
    let flyObjs = getImageToDraw("flyingObject")
    if (flyObjs.length != 0) {
        for (let flyObj of flyObjs) {
            ctx.save()
            ctx.translate(-w / 5, 0)
            var valLeft = flyObj.left
            var newLeft = (valLeft + (angle * 0.00002)) % 1.2

            flyObj.left = newLeft
            flyObj.drawThisImage(0, alphaNight, lightOn, canvas.height, canvas.width, ctx, factor)
            flyObj.drawThisImage(1, alphaSunrise, lightOn, canvas.height, canvas.width, ctx, factor)
            flyObj.drawThisImage(2, alphaSunset, lightOn, canvas.height, canvas.width, ctx, factor)
            flyObj.drawThisImage(3, alphaDay, lightOn, canvas.height, canvas.width, ctx, factor)
            ctx.restore()
        }
    }
    ctx.restore()
    // STATIC ELEMENTS
    var landscape = getImageToDraw("landscape")//.drawThisImage(0, 1, lightOn, canvas.height, canvas.width, ctx, factor)
    landscape.drawThisImage(0, alphaNight, lightOn, canvas.height, canvas.width, ctx, factor)
    landscape.drawThisImage(1, alphaSunrise, lightOn, canvas.height, canvas.width, ctx, factor)
    landscape.drawThisImage(2, alphaSunset, lightOn, canvas.height, canvas.width, ctx, factor)
    landscape.drawThisImage(3, alphaDay, lightOn, canvas.height, canvas.width, ctx, factor)
    //getImageToDraw("floor").drawThisImage(0, 1, lightOn, canvas.height, canvas.width, ctx, factor)
    var floor = getImageToDraw("floor")//.drawThisImage(0, 1, lightOn, canvas.height, canvas.width, ctx, factor)
    floor.drawThisImage(0, alphaNight, lightOn, canvas.height, canvas.width, ctx, factor)
    floor.drawThisImage(1, alphaSunrise, lightOn, canvas.height, canvas.width, ctx, factor)
    floor.drawThisImage(2, alphaSunset, lightOn, canvas.height, canvas.width, ctx, factor)
    floor.drawThisImage(3, alphaDay, lightOn, canvas.height, canvas.width, ctx, factor)
    getImageToDraw("building").drawThisImage(0, 1, lightOn, canvas.height, canvas.width, ctx, factor)
    getImageToDraw("tree").drawThisImage(0, 1, lightOn, canvas.height, canvas.width, ctx, factor)

    setFrameReq(window.requestAnimationFrame(countFPS));
}

/**
 * types of images:
 * 0: standard only one behaviour and one type of image
 * 1: hasLights 
 * 2: sun or moon 
 * 3: background 
 * 4: flyingObjec
 */

var generateButton = document.createElement('button')
var helpButton = document.createElement('button')
var menuPanel = document.createElement('div')
menuPanel.className = 'menu-panel'

var btn_left = document.getElementById('btn-sx')
var btn_center = document.getElementById('btn-ct')
var btn_right = document.getElementById('btn-dx')

document.querySelectorAll(".nes-btn").forEach((button) => {
    if (button.id != "btn-ct") {
        button.addEventListener("click", () => {
            state.nesBtnSound.trigger(Tone.now())
        })
    }
})



async function createMenu() {
    controlledLog("menu Creation")
    var btnContainer = document.getElementById("tokenGrid")
    btnContainer.className = 'token-btn-container'
    controlledLog(getStateElements())
    for (let datum of getStateElements()) {
        controlledLog('datum: ')
        controlledLog(datum)
        controlledLog(datum.image.previewUrl)
        controlledLog(datum.elementType)
        if ((datum.elementType == "background") || (datum.elementType == "astrumDay") || (datum.elementType == "astrumNight")) { }
        else {

            var aNewSrc = await getAsset(datum.image.previewUrl)
            var img = document.createElement('img')
            img.src = aNewSrc
            img.className = 'token-image'
            var btnDiv = document.createElement('div')
            var btn = document.createElement('button')
            btn.id = datum.id
            btn.className = 'nes-btn'
            btn.classList.add('token-btn')
            btn.classList.add(datum.elementType)


            btn.style.margin = '7px'
            btn.style.marginLeft = 'auto'
            btn.style.marginRight = 'auto'
            btn.appendChild(img)
            btnDiv.classList.add("token-div")
            if (datum.elementType == "flyingObject") {
                btn.classList.add(datum.elementType + datum.id)
                var tokenAdd = document.createElement('div')
                tokenAdd.id = "tAdd" + btn.id
                tokenAdd.classList.add("token-add");
                tokenAdd.append("0")
                btnDiv.appendChild(btn)
                btnDiv.appendChild(tokenAdd)
                btnContainer.appendChild(btnDiv)


            } else {
                btn.classList.add(datum.environment)
                btnDiv.appendChild(btn)
                btnContainer.appendChild(btnDiv)
            }
        }
    }
}

function assignClick() {
    document.querySelectorAll('.token-btn').forEach((btn) => {

        btn.addEventListener('click', () => {
            var id = btn.id
            var env = btn.classList[3]
            var el = btn.classList[2]
            controlledLog("elements")
            controlledLog(env)
            controlledLog(el)
            modifyIdList(id)

            visualizeSelectedTokens()
            state.nesBtnSound.trigger(Tone.now())
        })
    })
}


function visualizeSelectedTokens() {
    document.querySelectorAll('.token-btn').forEach((btn) => {
        btn.classList.remove('selected-btn')
    });
    document.querySelectorAll('.token-btn').forEach((btn) => {
        var elPos = Object.values(getIdList()).indexOf(parseInt(btn.id))
        var counter = 0;
        while (elPos > -1) {
            counter = counter + 1;
            elPos = Object.values(getIdList()).indexOf(parseInt(btn.id), elPos + 1)
        }
        if (btn.classList.contains("flyingObject")) {
            var tAdd = document.getElementById("tAdd" + btn.id)
            tAdd.removeChild(tAdd.firstChild)
            tAdd.append(counter)
        }
        if (counter > 0) {
            btn.classList.add('selected-btn')
        }
    });
}



function showInitPanel() {
    document.getElementById("panel-container").hidden = !document.getElementById("panel-container").hidden
    document.getElementById('front-panel').hidden = false
    document.getElementById('start-panel').hidden = true;
}

async function updatePage(aPage) {
    setNavPage(aPage)
    controlledLog("page")
    controlledLog(aPage)

    switch (aPage) {
        case 0:
            await menuPage()
            break;

        case 1:
            await playerPage()
            break;
        default:
            break;
    }
}

function disableScrolling() {
    var x = window.scrollX;
    var y = window.scrollY;
    window.onscroll = function () { window.scrollTo(x, y); };
}

function enableScrolling() {
    window.onscroll = function () { };
}


function loadMelody() {
    if (!state.isMelodyGenerated) {
        let modifyingValue = state.elements.find(element => element.id == state.drawing.idList.landscape);
        state.startingId = modifyingValue.audio.nodeId;
        let audioObj = state.melodyNodes.generateMelody(state.startingId);
        state.drawing.audio.melody = audioObj.melody;
        state.drawing.audio.chords = audioObj.chords;
        state.isMelodyGenerated = true;
        document.getElementById("btn-ct").classList.add("is-primary")
    }
}



async function playerPage() {
    //window.scrollTo(0,0); 
    //disableScrolling();
    state.loadingPage.isFirstLoading = false;
    state.loadingPage.value = 0;
    controlledLog("value loading page:")
    controlledLog(state.loadingPage.value)
    increase();
    setLimit(60);
    document.getElementById("initialLoadingPanel").style.visibility = 'visible'
    document.getElementById("secondLoadingMessage").hidden = false;
    document.getElementById("container").hidden = true
    state.loadingPage.value = 0;
    setLimit(85);

    await updateState()
    loadMelody()
    setLimit(99);

    document.getElementById("container").hidden = false
    initMusic()
    Tone.start()
    document.getElementById("btn-vol").onclick = volumeButton
    let volSlider = document.getElementById("volume-slider")
    volumeUpdate(70)
    volSlider.addEventListener('input', function () { volumeUpdate(volSlider.value) }, false);
    document.getElementById('confirm-save-dialog').onclick = function () { saveSnapshot(document.getElementById('name_field').value) }
    document.getElementById("btn-dx1").onclick = () => { openFullscreen('main-canvas'); }
    document.getElementById("btn-stop").onclick = () => {
        updatePage(0);
        stopMusic()
        if (tour.isActive()) {
            let step = tour.steps.find(element => element.id == "stopMusicTour")
            step.hide()
            tour.next()
        }
    }
    document.getElementById("btn-play").onclick = () => { togglePlayPause(); }
    document.getElementById("player-navbar").hidden = false;
    document.getElementById("canva-container").hidden = false;
    document.getElementById("menu-container").hidden = true;
    document.getElementById("menu-navbar").hidden = true;
    document.getElementById("upbar").hidden = true;
    //document.getElementById("initialLoadingPanel").style.visibility = 'hidden'
    await state.isLoadingInstr;
    setLimit(100);
    state.isPlaying = true;
    await initImages()
    await state.loadingPage.finishPromise;
    startMusic()
    document.getElementById("secondLoadingMessage").hidden = true
    if (tour.isActive()) {
        tour.next()
    }
}

async function menuPage() {
    //await createMenu()
    visualizeSelectedTokens()
    //document.getElementById("main-fs-button").onclick = () => { openFullscreen("main-body") }
    document.getElementById("btn-dx").onclick = () => {
        updatePage(1);
        if (tour.isActive()) {
            let step = tour.steps.find(element => element.id == "playMusic")
            step.hide()
        }
    }
    document.getElementById("btn-ct").onclick = function () {
        state.isMelodyGenerated = false;
        loadMelody()
        if (tour.isActive()) {
            var step = tour.steps.find(element => element.id == "generateMusic")
        }
        controlledLog("BTN CT CLICKED");
        controlledLog(Tone.now());
        controlledLog(Tone.now);
        state.buttonSound.trigger(Tone.now())
        setTimeout(() => {
            document.getElementById('dialog-music').showModal()
            setTimeout(() => {
                document.getElementById('dialog-music').close()
                if (tour.isActive()) {
                    tour.next();
                }
            }, 1500);
        }, 750);

    }
    document.getElementById("btn-sx").onclick = prepareLoadingSnapshot;
    document.getElementById("player-navbar").hidden = true;
    document.getElementById("canva-container").hidden = true;
    document.getElementById("menu-container").hidden = false;
    document.getElementById("menu-navbar").hidden = false;
    document.getElementById("upbar").hidden = false;
    document.getElementById("confirm-load-dialog").onclick = function () {
        controlledLog("loading select");
        controlledLog(document.getElementById("loading_select").value)
        loadSnapshot(document.getElementById("loading_select").value)
    }
    document.getElementById("delete-load-dialog").onclick = function () {
        controlledLog("loading select");
        controlledLog(document.getElementById("loading_select").value)
        removeSnapshot(document.getElementById("loading_select").value)
    }


}

async function prepareLoadingSnapshot() {
    await getSnapshotsList();
    loading_select = document.getElementById("loading_select")
    controlledLog("loading_select")
    controlledLog(loading_select)
    controlledLog("loading select length:")
    controlledLog(loading_select.length)
    while (loading_select.length > 0) {
        loading_select.remove(0);
    }
    for (var k = 0; k < state.snapshots.length; k++) {
        var option = document.createElement("option");
        option.text = state.snapshots[k].name;
        option.value = state.snapshots[k].docId;
        loading_select.add(option);
    }
    document.getElementById('dialog-load').showModal();
}


/**
 * fullscreen handling part 
 */
function openFullscreen(element) {
    controlledLog(element)
    var elem = document.getElementById(element)
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }

}
/* Close fullscreen */
function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}



window.addEventListener("keydown", function (event) {
    if (event.key == "Escape") closeFullscreen()
}, true);




var prevScrollpos = window.pageYOffset;
window.onscroll = function () {
    var currentScrollPos = window.pageYOffset;
    if (prevScrollpos > currentScrollPos) {
        document.getElementById("upbar").style.top = "0";
    } else {
        document.getElementById("upbar").style.top = "-100px";
    }
    prevScrollpos = currentScrollPos;
}

/**
 * 
 * @param {*} valueToSet index from 0 to 100
 */
function volumeUpdate(valueToSet) {
    //0-100
    if (valueToSet <= 0) {
        document.getElementById("vol-no").style.display = "block"
        document.getElementById("vol-low").style.display = "none"
        document.getElementById("vol-mid").style.display = "none"
        document.getElementById("vol-high").style.display = "none"
    } else if (valueToSet < 40) {
        document.getElementById("vol-no").style.display = "none"
        document.getElementById("vol-low").style.display = "block"
        document.getElementById("vol-mid").style.display = "none"
        document.getElementById("vol-high").style.display = "none"
    } else if (valueToSet < 75) {
        document.getElementById("vol-no").style.display = "none"
        document.getElementById("vol-low").style.display = "none"
        document.getElementById("vol-mid").style.display = "block"
        document.getElementById("vol-high").style.display = "none"
    } else if (valueToSet < 101) {
        document.getElementById("vol-no").style.display = "none"
        document.getElementById("vol-low").style.display = "none"
        document.getElementById("vol-mid").style.display = "none"
        document.getElementById("vol-high").style.display = "block"
    }
    document.getElementById("volume-slider").value = valueToSet;
    let vts = valueToSet / 100
    setMasterVolume(vts)
    controlledLog(getMasterVolume())
}

function volumeButton() {
    let testValue = getMasterVolume() * 100
    controlledLog(testValue)
    if (testValue > 0) {
        volumeUpdate(0)
    } else {
        controlledLog("savedVolume")
        controlledLog(getSavedVolume() * 100)
        volumeUpdate(getSavedVolume() * 100)
    }
}








class DrawableImage {
    constructor(anImageArray, left, bottom, anImageType) {
        this.imageType = anImageType;
        this.imageArray = anImageArray;
        this.left = left;
        this.bottom = bottom;
    }

    static async build(image) {
        //hasLight,urlLightOff,urlLightOn,left,bottom
        let imageArray = []
        for (let url of image.imageArray) {
            let anImage = new Image()
            anImage.src = await getAsset(url)
            imageArray.push(anImage)
        }
        /*
        let property = {}
        switch (image.imageType) {
            case (4):
                property.velocity = image.velocity;
                property.shift = Math.random();
                break;
        }
        if (image.imageType == 4) {
            image.bottom = Math.random()
            image.left = Math.random()
        }
        */
        return new DrawableImage(imageArray, image.left, image.bottom, image.imageType)
    }

    clone() {
        return new DrawableImage(this.imageArray, this.left, this.bottom, this.imageType);
    }
    drawThisImage(imageToDraw = 0, alpha0 = 1, lightOn, canvasHeight = 0, canvasWidth = 0, ctx, factor) {
        var h = this.imageArray[imageToDraw].naturalHeight * factor;
        var w = this.imageArray[imageToDraw].naturalWidth * factor;
        var x = this.left * canvasWidth;
        var y = (1 - this.bottom) * canvasHeight;
        ctx.globalAlpha = alpha0
        let posX = 0;
        let posY = 0;
        switch (this.imageType) {
            case (0):
                posX = x;
                posY = y - h
                break;
            case (1):
                if (lightOn) imageToDraw = 1
                else imageToDraw = 0
                posX = x;
                posY = y - h
                break;
            case (2):
                x = 0;
                y = 0;
                posX = 0;
                posY = 0
                break;
            case (3):
                posX = x;
                posY = y - h
                break;
            case (4):
                posX = x;
                posY = y - h;
                break;
            case (5):
                if (lightOn) imageToDraw = imageToDraw;
                else imageToDraw = imageToDraw + 4
                posX = x;
                posY = y - h
                break;
        }
        ctx.drawImage(this.imageArray[imageToDraw], posX, posY, w, h)
        //ctx.drawImage(imageLightOff, x, y-h, w, h)
        ctx.globalAlpha = 1
    }

    getNWidth() {
        return this.imageArray[0].naturalWidth
    }
    getNHeight() {
        return this.imageArray[0].naturalHeight
    }
    getNImages() {
        return this.imageArray.length
    }
    getLeft() {
        return this.left;
    }
    /*
    getProperty() {
        return this.property
    }
    */
}



/**
 * 
 * 
 * firebase 
 * 
 * 
 * 
 */





function initializeFirebase() {
    const firebaseConfig = {

        apiKey: "AIzaSyCx_9Kyfjn03jNXGM9dj7b8Omfd6CP0awU",

        authDomain: "actamproject-598ad.firebaseapp.com",

        projectId: "actamproject-598ad",

        storageBucket: "actamproject-598ad.appspot.com",

        messagingSenderId: "868627486863",

        appId: "1:868627486863:web:ee55ebd557f3abd6d5b8fa"

    };
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage()
}



//------------------storage handling-------------------------------------- 



async function getAsset(imageName) {
    let assetPos = 'assets/' + imageName
    let reference = storage.ref(assetPos)
    controlledLog(reference)
    let url = await reference.getDownloadURL()
    try {
        return new URL(url)
    } catch (error) {
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
            case 'storage/object-not-found':
                // File doesn't exist
                break;
            case 'storage/unauthorized':
                // User doesn't have permission to access the object
                break;
            case 'storage/canceled':
                // User canceled the upload
                break;

            // ...

            case 'storage/unknown':
                // Unknown error occurred, inspect the server response
                break;
        }
    }
}

async function getSample(instr, note) {
    let instrPos = 'samples/' + instr + '/'
    let notePos = instrPos + note
    controlledLog(notePos)
    let reference = ref(storage, notePos)
    controlledLog(reference)
    let url = await getDownloadURL(reference)
    try {
        return new URL(url)
    } catch (error) {
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
            case 'storage/object-not-found':
                // File doesn't exist
                break;
            case 'storage/unauthorized':
                // User doesn't have permission to access the object
                break;
            case 'storage/canceled':
                // User canceled the upload
                break;

            // ...

            case 'storage/unknown':
                // Unknown error occurred, inspect the server response
                break;
        }
    }
}


//-------------------------------database handling--------------------------//
async function getMenuTypes() {
    const docRef = db.collection("menu").doc("menuTypes");
    let doc = await docRef.get()
    try {
        if (doc.exists) {
            controlledLog("Document data:", doc.data());
            return doc.data();
        } else {
            controlledLog("No such document!");
        }
    } catch (error) {
        controlledLog("Error getting document:", error);
    };

}

async function getElementsByType(type) {
    const q = query(collection(db, "elements"), where("elementType", "==", type));

    const querySnapshot = await getDocs(q);
    elementsToRet = []
    querySnapshot.forEach((doc) => {
        elementsToRet.push(doc.data());
    });
    return elementsToRet
}

async function getElements() {
    let elementsToRet = [];
    let querySnapshot = await db.collection("elements").get()
    querySnapshot.forEach((doc) => {
        controlledLog(doc.id, " => ", doc.data());
        elementsToRet.push(doc.data());
    });
    return elementsToRet
}

async function getDocumentElement(docId) {
    const docRef = doc(db, "elements", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        controlledLog("No such document!");
    }
}

async function getNodes() {

    const querySnapshot = await db.collection("nodes").get();
    let elementsToRet = []
    querySnapshot.forEach((doc) => {
        elementsToRet.push(doc.data());
    });
    controlledLog("elToRet")
    controlledLog(elementsToRet)
    return elementsToRet
}

function saveSnapshot(snapshotName) {
    controlledLog("snapshotLaunched");
    db.collection("snapshots").add(
        {
            name: snapshotName,
            idList: state.drawing.idList,
            melody: state.drawing.audio.melody,
            chords: state.drawing.audio.chords
        }
    )
        .then((docRef) => {
            controlledLog("Document written with ID: ", docRef.id);
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
        });

}

function loadSnapshot(id) {
    let selectedSnapshot = state.snapshots.find(element => element.docId == id)
    controlledLog("select snapshot")
    controlledLog(selectedSnapshot)
    state.drawing.idList = selectedSnapshot.idList
    state.drawing.audio.chords = selectedSnapshot.chords
    state.drawing.audio.melody = selectedSnapshot.melody
    visualizeSelectedTokens()
    state.isMelodyGenerated = true;
    document.getElementById("btn-ct").classList.add("is-primary")
}
function removeSnapshot(id) {
    db.collection("snapshots").doc(id).delete().then(() => {
        controlledLog("Document successfully deleted!");
    }).catch((error) => {
        console.error("Error removing document: ", error);
    });
}

async function getSnapshotsList() {
    controlledLog("download started")
    let querySnapshot = await db.collection("snapshots").get();
    let snapshots = [];
    //controlledLog(querySnapshot)
    querySnapshot.forEach((doc) => {
        controlledLog(doc)
        snapshots.push({
            name: doc.data().name,
            melody: doc.data().melody,
            chords: doc.data().chords,
            idList: doc.data().idList,
            docId: doc.id
        });
    });
    state.snapshots = snapshots;
    controlledLog("download ended")
    controlledLog("values:")
    controlledLog(snapshots)

}


/**
 * 
 * markov nodes 
 * 
 */

class MarkovMelody {
    constructor(nodes) {
        this.nodes = nodes
        controlledLog(this.nodes)
    }

    generateMelody(startId = 0) {
        var path = this._generatePath(startId)
        var melodySequence = ""
        var chordsSequence = "|"
        for (let node of path) {
            melodySequence = melodySequence + node.mel + "\n"
            chordsSequence = chordsSequence + " " + node.chord + " |"
        }

        return {
            melody: melodySequence,
            chords: chordsSequence
        }
    }

    _generatePath(anId = 0) {
        var startingNode = this.nodes.find(x => x.id == anId)
        var startingNodeId = startingNode.id
        let thisNodeId = -1;
        var thisNode = startingNode
        let path = []
        while (thisNodeId != startingNodeId) {
            path.push(thisNode)
            controlledLog(thisNode)
            var nextNodeId = this._nextRandomNode(thisNode)
            controlledLog(nextNodeId)
            thisNodeId = nextNodeId
            thisNode = this.nodes.find(x => x.id == nextNodeId)
        }
        return path
    }

    _nextRandomNode(aNode) {
        let possibleNodes = aNode.links
        if (!Array.isArray(possibleNodes)) {
            possibleNodes = Array.from(Object.values(possibleNodes));
        }
        controlledLog(possibleNodes)
        let totalWeights = 0;
        for (var i = 0; i < possibleNodes.length; i++) {
            totalWeights = totalWeights + possibleNodes[i].prob
        }
        var random = Math.random() * totalWeights;
        for (var i = 0; i < possibleNodes.length; i++) {
            random -= possibleNodes[i].prob;

            if (random < 0) {
                return possibleNodes[i].id;
            }
        }
    }

}

async function loadingMusicElements() {
    return new Promise()
}



/*
 * instruments 
 */


class bellSample {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let bellUrls = {
            48: "001_BellC3.wav",
            49: "002_BellCs3.wav",
            50: "003_BellD3.wav",
            51: "004_BellDs3.wav",
            52: "005_BellE3.wav",
            53: "006_BellF3.wav",
            54: "007_BellFs3.wav",
            55: "008_BellG3.wav",
            56: "009_BellGs3.wav",
            57: "010_BellA3.wav",
            58: "011_BellAs3.wav",
            59: "012_BellB3.wav",
            60: "013_BellC4.wav",
            61: "014_BellCs4.wav",
            62: "01_BellD4.wav",
            63: "02_BellDs4.wav",
            64: "03_BellE4.wav",
            65: "04_BellF4.wav",
            66: "05_BellFs4.wav",
            67: "06_BellG4.wav",
            68: "07_BellGs4.wav",
            69: "08_BellA4.wav",
            70: "09_BellAs4.wav",
            71: "10_BellB4.wav",
            72: "11_BellC5.wav",
            73: "12_BellCs5.wav",
            74: "13_BellD5.wav",
            75: "14_BellDs5.wav",
            76: "15_BellE5.wav",
            77: "16_BellF5.wav",
            78: "17_BellFs5.wav",
            79: "18_BellG5.wav",
            80: "19_BellGs5.wav",
            81: "20_BellA5.wav",
            82: "21_BellAs5.wav",
            83: "22_BellB5.wav",
            84: "23_BellC6.wav",
        };
        let bellUrls2 = {};
        Object.keys(bellUrls).forEach(key => {
            bellUrls2[key] = "./BellSamplesMelodies/" + bellUrls[key];
        });
        var bell = new Tone.Players(bellUrls2, () => {
            resolvePromise();
            controlledLog("bell loaded")
        });
        bell.toDestination();
        this.bell = bell;

    }

    triggerAttack(note, time) {
        let ntp = Tonal.Note.midi(note);
        if (ntp == "") {
            console.error("wrong note feeding: " + "note");
        }
        this.bell.player(ntp).start(time);
    }
}

class padSample {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let padUrls = {
            36: "01_SynthC2.wav",
            37: "02_SynthCs2.wav",
            38: "03_SynthD2.wav",
            39: "04_SynthDs2.wav",
            40: "05_SynthE2.wav",
            41: "06_SynthF2.wav",
            42: "07_SynthFs2.wav",
            43: "08_SynthG2.wav",
            44: "09_SynthGs2.wav",
            45: "10_SynthA2.wav",
            46: "11_SynthAs2.wav",
            47: "12_SynthB2.wav",
            48: "13_SynthC3.wav",
            49: "14_SynthCs3.wav",
            50: "15_SynthD3.wav",
            51: "16_SynthDs3.wav",
            52: "17_SynthE3.wav",
            53: "18_SynthF3.wav",
            54: "19_SynthFs3.wav",
            55: "20_SynthG3.wav",
            56: "21_SynthGs3.wav",
            57: "22_SynthA3.wav",
            58: "23_SynthAs3.wav",
            59: "24_SynthB3.wav",
            60: "25_SynthC4.wav",
        };
        let padUrls2 = {};
        Object.keys(padUrls).forEach(key => {
            padUrls2[key] = "./SynthSample/" + padUrls[key];
        });
        var pad = new Tone.Players(padUrls2, () => {
            resolvePromise()
            controlledLog("pad loaded")
        });
        pad.toDestination();
        this.pad = pad;

    }

    triggerAttackRelease(notes, time) {
        notes.forEach((note) => {
            let ntp = Tonal.Note.midi(note);
            if (ntp == "") {
                console.error("wrong note feeding: " + "note");
            }
            this.pad.player(ntp).start(time);
        })


    }
}

let ps = new padSample();

/**
 *********************** PADS *************************
 */
class Synth1 {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C2"];
        let numCycles = BASE_MIDI_NOTES_NUM["C4"] - initNote + 1;
        let padUrls = {};

        for (let i = 0; i < numCycles; i++) {
            padUrls[initNote + i] = ENV1_BASE_URL + `/01_SynthSamplesC2C4/Synth1_${i + 1}.mp3`
        };
        var pad = new Tone.Players(padUrls, () => {
            resolvePromise()
            controlledLog("padEnv1 loaded")
        });
        pad.toDestination();
        this.pad = pad;

    }

    triggerAttackRelease(notes, duration, time) {
        notes.forEach((note) => {
            let ntp = Tonal.Note.midi(note);
            if (ntp == "") {
                console.error("wrong note feeding: " + "note");
            }
            this.pad.player(ntp).start(time);
            //this.pad.player(ntp).stop(time+duration);
            // this.pad.player(ntp).fadeOut='4n';
        })
    }

    connect(node) {
        this.pad.disconnect(Tone.Destination)
        this.pad.connect(node)
    }
}


class Synth2 {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C2"];
        let numCycles = BASE_MIDI_NOTES_NUM["C4"] - initNote + 1;
        let padUrls = {};

        for (let i = 0; i < numCycles; i++) {
            padUrls[initNote + i] = ENV2_BASE_URL + `/02_SynthSamplesC2C4/Synth2_${i + 1}.mp3`
        };
        var pad = new Tone.Players(padUrls, () => {
            resolvePromise()
            controlledLog("padEnv2 loaded")
        });
        pad.toDestination();
        pad.set({
            volume: 0.0,
        });
        this.pad = pad;
    }

    triggerAttackRelease(notes, duration, time) {
        controlledLog("NotesPAD2: " + notes);
        controlledLog(time);
        controlledLog(time + Tone.Time(duration).toSeconds());
        let pattern = [0, 1, 2, 1]
        let dur = Tone.Time(duration).toSeconds();
        let incr = dur / 16;

        for (let i = 0; i < 16; i++) {
            let ntp = Tonal.Note.midi(notes[pattern[i % 4]]);
            this.pad.player(ntp).start(time);
            time += incr
        }
    }

    connect(node) {
        this.pad.disconnect(Tone.Destination);
        this.pad.connect(node);
    }
}

class Synth3 {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C2"];
        let numCycles = BASE_MIDI_NOTES_NUM["C4"] - initNote + 1;
        let padUrls = {};

        for (let i = 0; i < numCycles; i++) {
            padUrls[initNote + i] = ENV3_BASE_URL + `/03_SynthSamplesC2C4/Synth3_${i + 1}.mp3`
        };
        var pad = new Tone.Players(padUrls, () => {
            resolvePromise()
            controlledLog("padEnv3 loaded")
        });
        pad.toDestination();
        this.pad = pad;

    }

    triggerAttackRelease(notes, duration, time) {
        notes.forEach((note) => {
            let ntp = Tonal.Note.midi(note);
            if (ntp == "") {
                console.error("wrong note feeding: " + "note");
            }
            this.pad.player(ntp).start(time);
            //this.pad.player(ntp).stop(time+duration);
            // this.pad.player(ntp).fadeOut='4n';
        })
    }

    connect(node) {
        this.pad.disconnect(Tone.Destination)
        this.pad.connect(node)
    }
}

class Synth4 {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C2"];
        let numCycles = BASE_MIDI_NOTES_NUM["C4"] - initNote + 1;
        let padUrls = {};

        for (let i = 0; i < numCycles; i++) {
            padUrls[initNote + i] = ENV4_BASE_URL + `/04_SynthSamplesC2C4/Synth4_${i + 1}.mp3`
        };
        var pad = new Tone.Players(padUrls, () => {
            resolvePromise
            controlledLog("padEnv4 loaded")
        });
        pad.toDestination();
        this.pad = pad;

    }

    triggerAttackRelease(notes, duration, time) {
        notes.forEach((note) => {
            let ntp = Tonal.Note.midi(note);
            if (ntp == "") {
                console.error("wrong note feeding: " + "note");
            }
            this.pad.player(ntp).start(time);
            //this.pad.player(ntp).stop(time+duration);
            // this.pad.player(ntp).fadeOut='4n';
        })
    }

    connect(node) {
        this.pad.disconnect(Tone.Destination)
        this.pad.connect(node)
    }
}

// let pse1 = new padEnv1();
// let pse2 = new padEnv2();
// let pse3 = new padEnv3();
// let pse4 = new padEnv4();

/**
 *********************** MELODY *************************
 */

class Bell {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C3"];
        let numCycles = BASE_MIDI_NOTES_NUM["C6"] - initNote + 1;
        let melUrls = {};

        for (let i = 0; i < numCycles; i++) {
            melUrls[initNote + i] = ENV1_BASE_URL + `/01_BellSamplesC3C6/Bell_${i + 1}.mp3`
        };
        var mel = new Tone.Players(melUrls, () => {
            resolvePromise()
            controlledLog("Bell loaded")
        });
        mel.volume.value = -9;
        mel.toDestination();
        this.mel = mel;
    }

    triggerAttack(note, duration, time) {
        // transposed of 1 ocv
        let ntp = Tonal.Note.midi(note) + 12;
        if (ntp == "") {
            console.error("wrong note feeding: " + "note");
        }
        // this.mel.fadeIn = 0.1
        this.mel.player(ntp).start(time);
    }

    connect(node) {
        this.mel.disconnect(Tone.Destination)
        this.mel.connect(node)
    }
}

class Moog {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C3"];
        let numCycles = BASE_MIDI_NOTES_NUM["C6"] - initNote + 1;
        let melUrls = {};

        for (let i = 0; i < numCycles; i++) {
            melUrls[initNote + i] = ENV2_BASE_URL + `/02_MoogSamplesC3C6/Moog_${i + 1}.mp3`
        };
        var mel = new Tone.Players(melUrls, () => {
            resolvePromise()
            controlledLog("Moog loaded")
        });
        mel.toDestination();
        this.mel = mel;

    }

    triggerAttack(note, duration, time) {
        // let duration = '4n';
        let ntp = Tonal.Note.midi(note) + 12;
        if (ntp == "") {
            console.error("wrong note feeding: " + "note");
        }
        this.mel.player(ntp).start(time);
        this.mel.player(ntp).fadeOut = '8n';
        this.mel.player(ntp).stop(time + Tone.Time(duration).toSeconds());

    }

    connect(node) {
        this.mel.disconnect(Tone.Destination)
        this.mel.connect(node)
    }
}

class Sitar {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C3"];
        let numCycles = BASE_MIDI_NOTES_NUM["C6"] - initNote + 1;
        let melUrls = {};

        for (let i = 0; i < numCycles; i++) {
            melUrls[initNote + i] = ENV3_BASE_URL + `/03_SitarSamplesC3C6/Sitar_${i + 1}.mp3`
        };
        var mel = new Tone.Players(melUrls, () => {
            resolvePromise()
            controlledLog("Sitar loaded")
        });
        mel.toDestination();
        this.mel = mel;

    }

    triggerAttack(note, duration, time) {
        // transposed of 1 ocv
        let ntp = Tonal.Note.midi(note) + 12;
        if (ntp == "") {
            console.error("wrong note feeding: " + "note");
        }
        this.mel.player(ntp).start(time);
        // this.mel.player(ntp).stop(time+duration);
        // this.mel.player(ntp).fadeOut='4n';
    }

    connect(node) {
        this.mel.disconnect(Tone.Destination)
        this.mel.connect(node)
    }
}

class Marimba {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C3"];
        let numCycles = BASE_MIDI_NOTES_NUM["C6"] - initNote + 1;
        let melUrls = {};

        for (let i = 0; i < numCycles; i++) {
            melUrls[initNote + i] = ENV4_BASE_URL + `/04_MarimbaSamplesC3C6/Marimba_${i + 1}.mp3`
        };
        var mel = new Tone.Players(melUrls, () => {
            resolvePromise()
            controlledLog("Marimba loaded")
        });
        mel.set({
            volume: +3,
        })
        const dly = new Tone.FeedbackDelay({
            delayTime: '8n.',
            feedback: 0.1,
            wet: 0.1
        })
        mel.connect(dly);
        dly.toDestination();
        this.mel = mel;
        this.lastnode = dly;
    }

    triggerAttack(note, duration, time) {
        // transposed of 1 ocv
        let ntp = Tonal.Note.midi(note) + 12;
        if (ntp == "") {
            console.error("wrong note feeding: " + "note");
        }
        this.mel.player(ntp).start(time);
        // this.mel.player(ntp).stop(time+duration);
        // this.mel.player(ntp).fadeOut='4n';
    }

    connect(node) {
        this.lastnode.disconnect(Tone.Destination)
        this.lastnode.connect(node)
    }
}

let test1 = new Bell();
let test2 = new Moog();
let test3 = new Sitar();
let test4 = new Marimba();

/**
 *********************** BASS *************************
 */
class Bass1 {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C1"];
        let numCycles = BASE_MIDI_NOTES_NUM["C3"] - initNote + 1;
        let bassUrls = {};

        for (let i = 0; i < numCycles; i++) {
            bassUrls[initNote + i] = ENV1_BASE_URL + `/01_BassSamplesC1C3/Bass1_${i + 1}.mp3`
        };
        var bass = new Tone.Players(bassUrls, () => {
            resolvePromise()
            controlledLog("Bass1 loaded")
        });
        bass.toDestination();
        this.bass = bass;
    }

    triggerAttackRelease(notes, duration, time) {
        controlledLog(notes);
        let ntp1 = Tonal.Note.midi(notes[0]) - 12;
        let ntp5 = Tonal.Note.midi(notes[2]) - 12;

        let dur = Tone.Time(duration).toSeconds();
        let halftime = dur / 2;
        if (ntp1 == "" || ntp5 == "") {
            console.error("wrong note feeding: " + "note");
        }
        this.bass.player(ntp1).start(time);
        this.bass.player(ntp1).fadeOut = '8n';
        this.bass.player(ntp1).stop(time + halftime);

        this.bass.player(ntp5).start(time + halftime);
        this.bass.player(ntp5).fadeOut = '8n';
        this.bass.player(ntp5).stop(time + dur);

    }

    connect(node) {
        this.bass.disconnect(Tone.Destination)
        this.bass.connect(node)
    }
}

class Bass2 {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C1"];
        let numCycles = BASE_MIDI_NOTES_NUM["C3"] - initNote + 1;
        let bassUrls = {};

        for (let i = 0; i < numCycles; i++) {
            bassUrls[initNote + i] = ENV2_BASE_URL + `/02_BassSamplesC1C3/Bass2_${i + 1}.mp3`
        };
        var bass = new Tone.Players(bassUrls, () => {
            resolvePromise()
            controlledLog("Bass2 loaded")
        });
        bass.toDestination();
        this.bass = bass;
    }

    triggerAttackRelease(notes, duration, time) {
        let ntp1 = Tonal.Note.midi(notes[0]) - 12;
        let ntp5 = Tonal.Note.midi(notes[2]) - 12;
        let dur = Tone.Time(duration).toSeconds();
        let halftime = dur / 2;
        if (ntp1 == "" || ntp5 == "") {
            console.error("wrong note feeding: " + "note");
        }
        this.bass.player(ntp1).start(time);
        this.bass.player(ntp1).fadeOut = '8n';
        this.bass.player(ntp1).stop(time + halftime);

        this.bass.player(ntp5).start(time + halftime);
        this.bass.player(ntp5).fadeOut = '8n';
        this.bass.player(ntp5).stop(time + dur);

    }

    connect(node) {
        this.bass.disconnect(Tone.Destination)
        this.bass.connect(node)
    }
}

class Bass3 {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C1"];
        let numCycles = BASE_MIDI_NOTES_NUM["C3"] - initNote + 1;
        let bassUrls = {};

        for (let i = 0; i < numCycles; i++) {
            bassUrls[initNote + i] = ENV3_BASE_URL + `/03_BassSamplesC1C3/Bass3_${i + 1}.mp3`
        };
        var bass = new Tone.Players(bassUrls, () => {
            resolvePromise()
            controlledLog("Bass3 loaded")
        });
        bass.toDestination();
        this.bass = bass;
    }

    triggerAttackRelease(notes, duration, time) {
        let ntp1 = Tonal.Note.midi(notes[0]) - 12;
        let ntp5 = Tonal.Note.midi(notes[2]) - 12;
        let dur = Tone.Time(duration).toSeconds();
        let halftime = dur / 2;
        if (ntp1 == "" || ntp5 == "") {
            console.error("wrong note feeding: " + "note");
        }
        this.bass.player(ntp1).start(time);
        this.bass.player(ntp1).fadeOut = '8n';
        this.bass.player(ntp1).stop(time + halftime);

        this.bass.player(ntp5).start(time + halftime);
        this.bass.player(ntp5).fadeOut = '8n';
        this.bass.player(ntp5).stop(time + dur);

    }

    connect(node) {
        this.bass.disconnect(Tone.Destination)
        this.bass.connect(node)
    }
}

class Bass4 {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        let initNote = BASE_MIDI_NOTES_NUM["C1"];
        let numCycles = BASE_MIDI_NOTES_NUM["C3"] - initNote + 1;
        let bassUrls = {};

        for (let i = 0; i < numCycles; i++) {
            bassUrls[initNote + i] = ENV4_BASE_URL + `/04_BassSamplesC1C3/Bass4_${i + 1}.mp3`
        };
        var bass = new Tone.Players(bassUrls, () => {
            resolvePromise()
            controlledLog("Bass4 loaded")
        });
        bass.toDestination();
        this.bass = bass;
    }

    triggerAttackRelease(notes, duration, time) {
        let ntp1 = Tonal.Note.midi(notes[0]) - 12;
        let ntp5 = Tonal.Note.midi(notes[2]) - 12;
        let dur = Tone.Time(duration).toSeconds();
        let halftime = dur / 2;
        if (ntp1 == "" || ntp5 == "") {
            console.error("wrong note feeding: " + "note");
        }
        this.bass.player(ntp1).start(time);
        this.bass.player(ntp1).fadeOut = '8n';
        this.bass.player(ntp1).stop(time + halftime);

        this.bass.player(ntp5).start(time + halftime);
        this.bass.player(ntp5).fadeOut = '8n';
        this.bass.player(ntp5).stop(time + dur);

    }

    connect(node) {
        this.bass.disconnect(Tone.Destination)
        this.bass.connect(node)
    }
}

/**
 *********************** RYTHMIC *************************
 */
class Kick {

    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        var kickUrl = DRUM_BASE_URL + "Kick_Sample.mp3"
        var kick = new Tone.Player(kickUrl, () => {
            resolvePromise()
            controlledLog("Kick Loaded")
        });
        kick.toDestination();

        this.kick = kick;
    }

    trigger(time, velocity) {
        this.kick.start(time);
    }

    playPart(aPart) {
        switch (aPart) {
            case 0:
                break;
            case 1: {
                const part = new Tone.Part(
                    ((time) => {
                        this.kick.start(time);
                    }),
                    [{ time: "0:0:0" },
                    { time: "0:2:0" },
                    ]
                ).start(0);
                part.loop = true;
                controlledLog("Part playing");
            }
                break;

            case 2: {
                const part = new Tone.Part(
                    ((time) => {
                        this.kick.start(time);
                    }),
                    [{ time: "0:0:0" },
                    { time: "0:0:3" },
                    { time: "0:2:2" },
                    ]
                ).start(0);
                part.loop = true;
                controlledLog("Part playing");
            }
                break;

            case 3: {
                const part = new Tone.Part(
                    ((time) => {
                        this.kick.start(time);
                    }),
                    [{ time: "0:0:0" },
                    { time: "0:2:3" },
                    { time: "0:3:0" },
                    ]
                ).start(0);
                part.loop = true;
                controlledLog("Part playing");
            }
                break;

            default:
                controlledLog("Invalid Pattern ID for Kick");
                break;
        }
    }
    connect(node) {
        this.kick.disconnect(Tone.Destination)
        this.kick.connect(node)
    }

}

class Snare {
    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        var snareUrl = DRUM_BASE_URL + "Snare2_Sample.mp3"
        var snare = new Tone.Player(snareUrl, () => {
            resolvePromise()
            controlledLog("Snare Loaded")
        });
        snare.toDestination();

        this.snare = snare;
    }

    trigger(time, velocity) {
        this.snare.start(time);
    }

    playPart(aPart) {
        switch (aPart) {
            case 0:
                break;
            case 1: {
                const part = new Tone.Part(
                    ((time) => {
                        this.snare.start(time);
                    }),
                    [{ time: "0:1:0" },
                    { time: "0:3:0" }]
                ).start(0);
                part.loop = true;
                controlledLog("Part playing");
            }
                break;

            case 2: {
                const part = new Tone.Part(
                    ((time) => {
                        this.snare.start(time);
                    }),
                    [{ time: "0:1:0" },
                    { time: "0:3:0" },
                    { time: "0:3:2" },
                    ]
                ).start(0);
                part.loop = true;
                controlledLog("Part playing");
            }
                break;

            case 3: {
                const part = new Tone.Part(
                    ((time) => {
                        this.snare.start(time);
                    }),
                    [{ time: "0:0:3" },
                    { time: "0:1:2" },
                    { time: "0:3:2" },
                    ]
                ).start(0);
                part.loop = true;
                controlledLog("Part playing");
            }
                break;

            default:
                controlledLog("Invalid Pattern ID for Snare");
                break;
        }
    }
    connect(node) {
        this.snare.disconnect(Tone.Destination)
        this.snare.connect(node)
    }

}

class HiHat {
    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        var hihatUrl1 = DRUM_BASE_URL + "ShakHH_Hi_Sample.mp3"
        var hihatUrl2 = DRUM_BASE_URL + "ShakHH_Lo_Sample.mp3"
        var hihat = new Tone.Players({ 0: hihatUrl1, 1: hihatUrl2 }, () => {
            resolvePromise()
            controlledLog("HH Loaded")
        });
        hihat.toDestination();
        controlledLog("Players Name: " + hihat.name);

        this.hihat = hihat;
    }

    trigger(time, velocity) {
        this.hihat.start(time);
    }

    playPart(aPart) {
        switch (aPart) {
            case 0:
                break;
            case 1: {
                const part = new Tone.Part(
                    ((time, value) => {
                        this.hihat.player(value.note).start(time);
                    }),
                    [
                        { time: "0:0:0", note: 0 },
                        { time: "0:0:2", note: 1 },
                        { time: "0:1:0", note: 0 },
                        { time: "0:1:2", note: 1 },
                        { time: "0:2:0", note: 0 },
                        { time: "0:2:2", note: 1 },
                        { time: "0:3:0", note: 0 },
                        { time: "0:3:2", note: 1 },
                    ]
                ).start(0);
                part.loop = true;
                part.humanize = 0.02;
                controlledLog("Part playing");
            }
                break;

            case 2: {
                const part = new Tone.Part(
                    ((time, value) => {
                        this.hihat.player(value.note).start(time);
                    }),
                    [
                        // 0: Hi, 1: Lo
                        { time: "0:0:0", note: 0 },
                        { time: "0:0:2", note: 1 },
                        { time: "0:0:3", note: 1 },
                        { time: "0:1:0", note: 0 },
                        { time: "0:1:2", note: 1 },
                        { time: "0:2:0", note: 0 },
                        { time: "0:2:2", note: 1 },
                        { time: "0:2:3", note: 1 },
                        { time: "0:3:0", note: 0 },
                        { time: "0:3:2", note: 1 },
                    ]
                ).start(0);
                part.loop = true;
                part.humanize = 0.02;
                controlledLog("Part playing");
            }
                break;

            case 3: {
                const part = new Tone.Part(
                    ((time, value) => {
                        this.hihat.player(value.note).start(time);
                    }),
                    [
                        // 0: Hi, 1: Lo
                        { time: "0:0:0", note: 0 },
                        { time: "0:0:1", note: 1 },
                        { time: "0:0:2", note: 0 },
                        { time: "0:0:3", note: 1 },
                        { time: "0:1:0", note: 0 },
                        { time: "0:1:1", note: 1 },
                        { time: "0:1:2", note: 0 },
                        { time: "0:1:3", note: 1 },
                        { time: "0:2:0", note: 0 },
                        { time: "0:2:1", note: 1 },
                        { time: "0:2:2", note: 0 },
                        { time: "0:2:3", note: 1 },
                        { time: "0:3:0", note: 0 },
                        { time: "0:3:1", note: 1 },
                        { time: "0:3:2", note: 0 },
                        { time: "0:3:3", note: 1 },
                    ]
                ).start(0);
                part.loop = true;
                part.humanize = 0.02;
                controlledLog("Part playing");
            }
                break;

            default:
                controlledLog("Invalid Pattern ID for Snare");
                break;
        }
    }
    connect(node) {
        this.hihat.disconnect(Tone.Destination)
        this.hihat.connect(node)
    }

}

class Perc {
    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        var percUrl = DRUM_BASE_URL + "Perc_Sample.mp3"
        var perc = new Tone.Player(percUrl, () => {
            resolvePromise()
            controlledLog("Perc Loaded")
        });
        perc.toDestination();

        this.perc = perc;
    }

    trigger(time, velocity) {
        this.perc.start(time);
    }

    playPart(aPart) {
        switch (aPart) {
            case 0:
                break;
            case 1: {
                const part = new Tone.Part(
                    ((time) => {
                        this.perc.start(time);
                    }),
                    [{ time: "0:1:0" },
                    { time: "0:3:0" },
                    { time: "0:3:3" },
                    ]
                ).start(0);
                part.loop = true;
                controlledLog("Part playing");
            }
                break;

            case 2: {
                const part = new Tone.Part(
                    ((time) => {
                        this.perc.start(time);
                    }),
                    [{ time: "0:1:0" },
                    { time: "0:1:1" },
                    { time: "0:2:3" },
                    { time: "0:3:0" },
                    ]
                ).start(0);
                part.loop = true;
                controlledLog("Part playing");
            }
                break;

            case 3: {
                const part = new Tone.Part(
                    ((time) => {
                        this.perc.start(time);
                    }),
                    [{ time: "0:0:3" },
                    { time: "0:1:1" },
                    { time: "0:2:3" },
                    { time: "0:3:1" },
                    ]
                ).start(0);
                part.loop = true;
                controlledLog("Part playing");
            }
                break;

            default:
                controlledLog("Invalid Pattern ID for Perc");
                break;
        }
    }
    connect(node) {
        this.perc.disconnect(Tone.Destination)
        this.perc.connect(node)
    }
}

class DrumMachine {
    constructor() {
        this.kick = new Kick();
        this.snare = new Snare();
        this.hihat = new HiHat();
        this.perc = new Perc();
    }

    // array = [kick, snare, hihat]
    playPattern(array) {
        this.kick.playPart(array[0]);
        this.snare.playPart(array[1]);
        this.hihat.playPart(array[2]);
        this.perc.playPart(array[3])
    }

    connect(node) {
        this.kick.connect(node);
        this.snare.connect(node);
        this.hihat.connect(node);
        this.perc.connect(node);
    }

}

class ButtonSound {
    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        var percUrl = "./Samples/Button/Button.mp3"
        var perc = new Tone.Player(percUrl, () => {
            resolvePromise()
            controlledLog("soundBtn Loaded")
        });
        perc.toDestination();

        this.perc = perc;
    }

    trigger(time) {
        this.perc.start(time);
    }

}

class NesBtnSound {
    constructor() {
        var resolvePromise;
        state.isLoadingInstr = new Promise(resolve => {
            resolvePromise = resolve;
        });
        var percUrl = "./Samples/Button/NesBtnSound.mp3"
        var perc = new Tone.Player(percUrl, () => {
            resolvePromise()
            controlledLog("NesBtnSound Loaded")
        });
        perc.toDestination();

        this.perc = perc;
    }

    trigger(time) {
        this.perc.start(time);
        controlledLog("nesbnsound yeah yeah")
        this.perc.stop(time + 1);
    }

}




/*-----------------------------user guide tour------------------------------------------------------------*/

const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
        classes: 'shadow-md bg-purple-dark',
        scrollTo: true
    }
});

// step #0
tour.addStep({
    id: 'melodyInstrChoice',
    text: 'The buildings on this row allow to choose between different instruments to play the main melody',
    attachTo: {
        element: '.building',
        on: 'left'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Next',
            action: tour.next
        }

    ]
});

// step #1
tour.addStep({
    id: 'bassInstrChoice',
    text: 'The trees on this row allow to choose the instrument used to play the bass part',
    attachTo: {
        element: '.tree',
        on: 'left'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Next',
            action: tour.next
        }

    ]
});

// step #2
tour.addStep({
    id: 'melodytypeChoice',
    text: 'The different landscapes represent the different music styles generated by the system. Choose one of them!!',
    attachTo: {
        element: '.landscape',
        on: 'left'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Next',
            action: tour.next
        }

    ]
});

// step #3
tour.addStep({
    id: 'chordsInstrChoice',
    text: 'The different types of floor on this row allow to choose the different instruments used to play the chords part',
    attachTo: {
        element: '.floor',
        on: 'left'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: "Next",
            action: tour.next,
        }

    ]
});

// step #3
tour.addStep({
    id: 'kickPatternChoice',
    text: 'The number of clouds of the first type represents the rhythmic pattern for kick-drum',
    attachTo: {
        element: '.flyingObject22',
        on: 'top'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: "Next",
            action: tour.next,
        }

    ]
});

// step #3
tour.addStep({
    id: 'snarePatternChoice',
    text: 'The number of clouds of the second type represents the rhythmic pattern for snare-drum',
    attachTo: {
        element: '.flyingObject23',
        on: 'top'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: "Next",
            action: tour.next,
        }

    ]
});

// step #3
tour.addStep({
    id: 'hihatPatternChoice',
    text: 'The number of clouds of the third type represents the rhythmic pattern for the hihat',
    attachTo: {
        element: '.flyingObject24',
        on: 'top'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: "Next",
            action: tour.next,
        }

    ]
});

// step #3
tour.addStep({
    id: 'effectsPatternChoice',
    text: 'The number of clouds of the fourth type represents the rhythmic pattern for the percussive effects',
    attachTo: {
        element: '.flyingObject25',
        on: 'top'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: "Next",
            action: tour.next,
        }

    ]
});

// step #4
tour.addStep({
    id: 'generateMusic',
    text: 'This button allows you to generate a new musical sequence, if a melody is ready to be played the button is blue. \r\n CLICK IT!!',
    attachTo: {
        element: '.musicButtonTour',
        on: 'bottom'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Next',
            action: function () {
                document.getElementById("btn-ct").click();
                // tour.next();
            }

        }
    ]
});

// step #4
tour.addStep({
    id: 'playMusic',
    text: 'This button allows you to start music. \n CLICK IT TO CONTINUE TO THE NEXT STEP!!',
    attachTo: {
        element: '.playButtonTour',
        on: 'bottom'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Next',
            action: function () {
                let step = tour.steps.find(element => element.id == "playMusic")
                step.hide()
                document.getElementById("btn-dx").click();
                //tour.next();
            },
        }
    ]
});

// step #4
tour.addStep({
    id: 'environment',
    text: 'The main canvas visualizes the elements picked in the menu page while the generated music parts play',
    attachTo: {
        element: '.canvasTour',
        on: 'bottom'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Next',
            action: tour.next
        }
    ]
});

// step #4
tour.addStep({
    id: 'playPause',
    text: 'This button allows to pause or play the enviroment',
    attachTo: {
        element: '.playPauseTour',
        on: 'top'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Next',
            action: tour.next
        }
    ]
});
// step #4
tour.addStep({
    id: 'volume',
    text: 'This button allows to adjust the music volume',
    attachTo: {
        element: '.volumeTour',
        on: 'top'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Next',
            action: tour.next
        }
    ]
});
// step #4
tour.addStep({
    id: 'fullscreen',
    text: 'This button allows to set fullscreen playback. Press "ESC" to exit fullscreen',
    attachTo: {
        element: '.fullscreenTour',
        on: 'top'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Next',
            action: tour.next
        }
    ]
});
// step #4
tour.addStep({
    id: 'save',
    text: 'This button allows to save a snapshot of the environment created',
    attachTo: {
        element: '.saveSnapTour',
        on: 'top'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Next',
            action: tour.next
        }
    ]
});
// step #4
tour.addStep({
    id: 'stopMusicTour',
    text: 'Clicking on this button the music stops and the website returns to the menu page. Click to continue to the last step',
    attachTo: {
        element: '.stopTour',
        on: 'top'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Next',
            action: function () {
                document.getElementById("btn-stop").click()
                //tour.next()
            },
        }
    ]
});
// step #5
tour.addStep({
    id: 'Load new music',
    text: 'This button allows you to load a music sequence and an environment saved previously.',
    attachTo: {
        element: '.loadButtonTour',
        on: 'bottom'
    },
    classes: 'example-step-extra-class',
    buttons: [
        {
            text: 'Exit',
            action: tour.complete
        },
        {
            text: 'Complete',
            action: tour.complete,
        }
    ]
});
document.getElementById("guideTourStart").onclick = function () {
    tour.start();
}

function controlledLog(val) {
    if (state.logON) {
        console.log(val)
    }
}