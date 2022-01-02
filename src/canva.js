import * as Model from "./index.js"
import * as Tone from 'tone'

const canvasDiv = document.getElementById('canvas-div');
// const canva = document.getElementById('main-canvas');
const sky = document.getElementById('sky');
const container = document.getElementById('container')

var generateButton = document.createElement('button')
var helpButton = document.createElement('button')
var menuPanel = document.createElement('div')
menuPanel.className = 'menu-panel'

var factor = 8;
var channels = ['mountain', 'seaside', 'city']


var skySunSet = new Image()
skySunSet.src = new URL('../assets/BG/Background2.png', import.meta.url)
skySunSet.classList.add('sky')
skySunSet.style.opacity = '0';
skySunSet.style.position = 'absolute';
skySunSet.style.zIndex = '1'
canvasDiv.appendChild(skySunSet)

var skyDay = new Image()
skyDay.src = new URL('../assets/BG/Background3.png', import.meta.url)
skyDay.classList.add('sky')
skyDay.style.opacity = '0';
skyDay.style.position = 'absolute';
skyDay.style.zIndex = '1'
canvasDiv.appendChild(skyDay)

var canvas = document.createElement("canvas")
canvas.className = "canvases";
canvas.width = 256*factor;
canvas.height = 128*factor;
canvasDiv.appendChild(canvas);
// state.canvas = canvas;

var ctx = canvas.getContext('2d');

var bg = new Image()
var floor = new Image()
var building = new Image()
var shrub = new Image()

var moon = new Image();
var sun = new Image();
var star = new Image();

var time0 = new Date();
var omega = 0; /* canvas angular speed */
var moonRadius = canvas.width/1.1;
var alpha0 = Math.acos((canvas.width/2)/moonRadius) 

var t = Tone.Time('16m').toMilliseconds()

var state = {
    canvas: {},
    assets: {
        stars: []
    },
    environment: channels[0],
} 

const new_assets = {
    mountains: {
        url: new URL('../assets/BG/Mountains.png', import.meta.url),
        previewUrl: new URL('../assets/PREVS/Mountains prev.png', import.meta.url), 
        left: 0,
        bottom: 0,
        index: 0
    },

    sea: {
        url: new URL('../assets/BG/Sea.png', import.meta.url),
        previewUrl: new URL('../assets/PREVS/Sea prev.png', import.meta.url), 
        left: 0,
        bottom: 0,
        index: 0
    },

    skyline: {
        url: new URL('../assets/BG/Skyline.png', import.meta.url),
        previewUrl: new URL('../assets/PREVS/Skyline prev.png', import.meta.url), 
        left: 0,
        bottom: 0,
        index: 0
    },

    desert: {
        url: new URL('../assets/BG/Desert.png', import.meta.url),
        previewUrl: new URL('../assets/PREVS/Desert prev.png', import.meta.url), 
        left: 0,
        bottom: 0,
        index: 0
    },

    grass: {
        url: new URL('../assets/BG/Grass.png', import.meta.url),
        previewUrl: new URL('../assets/PREVS/Grass prev.png', import.meta.url), 
        left: 0,
        bottom: 0,
    },

    seaSand: {
        url: new URL('../assets/BG/Sand.png', import.meta.url),
        previewUrl: new URL('../assets/PREVS/Sea Sand prev.png', import.meta.url), 
        left: 0,
        bottom: 0,
    },

    desertSand: {
        url: new URL('../assets/BG/Desert Sand.png', import.meta.url),
        previewUrl: new URL('../assets/PREVS/Desert Sand prev.png', import.meta.url), 
        left: 0,
        bottom: 0,
    },

    concrete: {
        url: new URL('../assets/BG/Concrete.png', import.meta.url),
        previewUrl: new URL('../assets/PREVS/Concrete prev.png', import.meta.url), 
        left: 0,
        bottom: 0,
    },

    mountainHouse: {
        url: new URL('../assets/HOUSE/Mountain Home.png', import.meta.url),
        previewUrl: new URL('../assets/HOUSE/Mountain Home.png', import.meta.url),
        left: 0.7,
        bottom: 0.1,
    },
    
    seaHouse: {
        url: new URL('../assets/HOUSE/Sea Home.png', import.meta.url),
        previewUrl: new URL('../assets/HOUSE/Sea Home.png', import.meta.url),
        left: 0.7,
        bottom: 0.1,
    },

    cityHouse: {
        url: new URL('../assets/HOUSE/City Home.png', import.meta.url),
        previewUrl: new URL('../assets/HOUSE/City Home.png', import.meta.url),
        left: 0.7,
        bottom: 0.1,
    },

    desertHouse: {
        url: new URL('../assets/HOUSE/Desert Home.png', import.meta.url),
        previewUrl: new URL('../assets/HOUSE/Desert Home.png', import.meta.url),
        left: 0.7,
        bottom: 0.1,
    },

    moon: {
        url: [
            new URL('../assets/MOON/Moon1.png', import.meta.url),
            new URL('../assets/MOON/Moon2.png', import.meta.url),
            new URL('../assets/MOON/Moon3.png', import.meta.url),
            new URL('../assets/MOON/Moon4.png', import.meta.url),
            new URL('../assets/MOON/Moon5.png', import.meta.url),
        ],
        left: 0,
        bottom: 0,
    },
    moon1: {
        url: new URL('../assets/MOON/Moon1.png', import.meta.url),
        left: 0,
        bottom: 0,
    },
    sun: {
        url: new URL('../assets/MOON/Sole.png', import.meta.url),
        left: 0,
        bottom: 0,
    },

    star: {
        url: [new URL('../assets/Small Star.png', import.meta.url), new URL('../assets/Big Star.png', import.meta.url),],  
    },

    tree1: {
        url: new URL('../assets/TREES/Tree Alt.png', import.meta.url),
        previewUrl: new URL('../assets/TREES/Tree Alt.png', import.meta.url),
        left: 0.35,
        bottom: 0.09,
    }, 

    tree2: {
        url: new URL('../assets/TREES/Tree Maj.png', import.meta.url),
        previewUrl: new URL('../assets/TREES/Tree Maj.png', import.meta.url),
        left: 0.2,
        bottom: 0.15,
    },
    
    tree3: {
        url: new URL('../assets/TREES/Tree Min.png', import.meta.url),
        previewUrl: new URL('../assets/TREES/Tree Min.png', import.meta.url),
        left: 0.2,
        bottom: 0.1,
    }, 

    palm: {
        url: new URL('../assets/TREES/Palm.png', import.meta.url),
        previewUrl: new URL('../assets/TREES/Palm.png', import.meta.url),
        left: 0.3,
        bottom: 0.1,
    }, 

    streetLamp: {
        url: new URL('../assets/TREES/Street Lamp.png', import.meta.url),
        previewUrl: new URL('../assets/TREES/Street Lamp.png', import.meta.url),
        left: 0.3,
        bottom: 0.1,
    },

    cactus: {
        url: new URL('../assets/TREES/Cactus.png', import.meta.url),
        previewUrl: new URL('../assets/TREES/Cactus.png', import.meta.url),
        left: 0.3,
        bottom: 0.1,
    },
}


// TODO: environment

const environment = {
    mountain: {
        background: new_assets.mountains,
        floor: new_assets.grass,
        building: new_assets.mountainHouse,
        shrub: new_assets.tree3,
    },
    desert: {
        background: new_assets.desert,
        floor: new_assets.desertSand,
        building: new_assets.desertHouse,
        shrub: new_assets.cactus,
    },
    city: {
        background: new_assets.skyline,
        floor: new_assets.concrete,
        building: new_assets.cityHouse,
        shrub: new_assets.streetLamp,
    },
    seaside: {
        background: new_assets.sea,
        floor: new_assets.seaSand,
        building: new_assets.seaHouse,
        shrub: new_assets.palm,
    }
}

var environmentToGenerate = {
    background: "mountain",
    floor: "mountain",
    building: "mountain",
    shrub: "mountain",
}

function initImages(env){
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    bg.src = environment[env.background].background.url
    floor.src = environment[env.floor].floor.url
    building.src = environment[env.building].building.url
    shrub.src = environment[env.shrub].shrub.url

    moon.src = new_assets.moon.url;
    sun.src = new_assets.sun.url;
    star.src = new_assets.star.url[0];

    moon.classList.add('invert');
    console.log(moon)

    state.assets.stars = []

    var numOfStars = 32

    for (i=0; i<numOfStars; i++){
        var aStar = {img: star, left: Math.random(), bottom: 1-(Math.random()*0.7)}
        state.assets.stars.push(aStar);
    }

    console.log(state.assets.stars)

    // window.requestAnimationFrame(()=>{createEnvironment(env)});
    window.requestAnimationFrame(()=>{createEnvironment(environmentToGenerate)});
}


function drawThisImage (img, left, bottom) {
    var h = img.naturalHeight*factor;
    var w = img.naturalWidth*factor;
    var x = left * canvas.width;
    var y = (1-bottom) * canvas.height;
    ctx.drawImage(img, x, y-h, w, h)
}

function createEnvironment(env) {
    var time = Date.now()

    var h = canvas.height;
    var w = canvas.width; 

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false;

    state.assets.stars.forEach((star)=>{
        drawThisImage(star.img, star.left, star.bottom)
    })

    // ANIMATED IMAGES
    var s = moonRadius - Math.sqrt(Math.pow(moonRadius,2)-(Math.pow(canvas.width,2)/4))
    var a = 2 * Math.acos(1-(s/moonRadius))
    omega = a/t;

    ctx.save();
    ctx.translate(w/2, h*2)
    // var angle = ((a/60)*time.getSeconds()+(a/60000)*time.getMilliseconds());
    // var angle = ((2*Math.PI/6000)*time.getSeconds()) + ((2*Math.PI/100000)*time.getMilliseconds());
    var angle = (alpha0 + omega * (time-time0.getTime()))
    ctx.rotate(angle);

    ctx.save()
    ctx.translate(moonRadius, 0)
    ctx.rotate(-angle);
    ctx.drawImage(moon, 0, 0, moon.naturalWidth*factor, moon.naturalHeight*factor);
    ctx.restore()

    ctx.save()
    ctx.translate(-moonRadius, 0)
    ctx.rotate(-angle);
    ctx.drawImage(moon, 0, 0, moon.naturalWidth*factor, moon.naturalHeight*factor);
    ctx.restore()

    ctx.save()
    ctx.translate(0, moonRadius)
    ctx.rotate(-angle);
    ctx.drawImage(sun, 0, 0, sun.naturalWidth*factor, sun.naturalHeight*factor);
    ctx.restore()

    ctx.save()
    ctx.translate(0, -moonRadius)
    ctx.rotate(-angle);
    ctx.drawImage(sun, 0, 0, sun.naturalWidth*factor, sun.naturalHeight*factor);
    ctx.restore()

    ctx.restore()
    
    // STATIC IMAGES
    drawThisImage(bg, environment[env.background].background.left, environment[env.background].background.bottom);
    drawThisImage(floor, environment[env.floor].floor.left, environment[env.floor].floor.bottom);
    drawThisImage(building, environment[env.building].building.left, environment[env.building].building.bottom);
    drawThisImage(shrub, environment[env.shrub].shrub.left, environment[env.shrub].shrub.bottom);

    // blendBG()

    // window.requestAnimationFrame(() => {createEnvironment(env)});
    globalThis.framereq = window.requestAnimationFrame(() => {createEnvironment(environmentToGenerate)});
}

function blendBG() {
    var opaSunSet = parseFloat(skySunSet.style.opacity.split()[0])
    var opaDay = parseFloat(skyDay.style.opacity.split()[0])

    if (opaSunSet<=1){
        var opac = opaSunSet + 0.0005;
        skySunSet.style.opacity = `${opac}`
    } else {
        if (opaDay<=1){
            var opac = opaDay + 0.0005;
            skyDay.style.opacity = `${opac}`
        }
    }
}

// initImages(state.environment);  
initImages(environmentToGenerate);  


/* CREATING MENU' */
export  async function initJSON() {
    for(let datum of Model.state.possibleValues.data) {
        datum.image = new_assets[datum.imageName]
    }
}
export async function createMenu () {
    console.log("menu Creation")
    var btnContainer = document.createElement('div')
    btnContainer.className = 'token-btn-container'
    // cycle each environment to create each row 

    console.log(Model.state.possibleValues.elementTypes)
    for (let elType of Model.state.possibleValues.elementTypes) {
        console.log(elType)
        var btnDiv = document.createElement('div')
        btnDiv.className = 'token-btn-div'    
        
        let toPutIn = []
        for(let datum of Model.state.possibleValues.data) {
            if(datum.elementType === elType) {
                toPutIn.push(datum)
            }
        }
        console.log(new_assets["mountains"].previewUrl)
        // cycle every element of the environment
        console.log("toPutIn:")
        console.log(toPutIn)
        for (let datum of toPutIn) {
            console.log('datum: ')
            console.log(datum)
            //console.log(asset[1])
            console.log(datum.image.previewUrl)
            var aNewSrc = datum.image.previewUrl
            var img = document.createElement('img')
            img.src = aNewSrc//asset[1].previewUrl
            img.className = 'token-image'

            var btn = document.createElement('button')

            btn.className = 'nes-btn'
            btn.classList.add('token-btn')
            btn.classList.add(datum.elementType)//asset[0])
            btn.classList.add(datum.environment)

            btn.style.margin = '7px'
            btn.style.marginLeft = 'auto'
            btn.style.marginRight = 'auto'

            btn.appendChild(img)
            btnDiv.appendChild(btn)
        }
        btnContainer.appendChild(btnDiv)
    }

    menuPanel.appendChild(btnContainer)

    generateButton.className = 'nes-btn is-success'
    generateButton.innerText = 'GENERATE'
    generateButton.style.display = 'block'
    generateButton.style.margin = 'auto'
    generateButton.style.marginTop = '20px'
    generateButton.style.verticalAlign = 'middle'

    helpButton.className = 'nes-btn is-warning'
    helpButton.innerText = '?'
    helpButton.style.display = 'block'
    helpButton.style.margin = 'auto' 
    helpButton.style.marginTop = '20px'
    helpButton.style.verticalAlign = 'middle'

    var btnDiv = document.createElement('div')
        btnDiv.style.display = 'block'
        btnDiv.style.height = 'max-content'
        btnDiv.style.marginTop = '10%'
        btnDiv.style.textAlign = 'center'

    var title = document.createElement('p')
        title.innerText = 'MENU'
        title.style.backgroundColor = 'rgb(245, 247, 99)'
        title.style.padding = '10px'
        title.style.borderRadius = '5px'
        title.style.marginTop = '40%'
        title.style.fontSize = 'x-large'
    

    btnDiv.appendChild(helpButton)
    btnDiv.appendChild(generateButton)
    btnDiv.appendChild(title)

    menuPanel.appendChild(btnDiv)

    container.appendChild(menuPanel)

    console.log('envToGen: ')
    console.log(Object.keys(environmentToGenerate))

    // selecting active buttons
    document.querySelectorAll('.token-btn').forEach((btn)=>{
        for(let i of Object.keys(environmentToGenerate)){
            console.log(environmentToGenerate[i])
            if (btn.classList.contains(i) && btn.classList.contains(environmentToGenerate[i])){
                btn.classList.add('selected-btn')
            }
        }
        
    })
}

//createMenu()

/* -------------------------------------------------------- */

export function playableButton (ready) {
    if (ready) {
        playButton.classList.replace('is-disabled', 'is-success');
    }
}

function showInitPanel() {
    document.getElementById("panel-container").hidden = !document.getElementById("panel-container").hidden
    document.getElementById('front-panel').hidden = false
    document.getElementById('start-panel').hidden = true;
}

var okButton = document.getElementById('ok-button');
okButton.onclick = () => {
    var word1 = document.getElementById('name-field1').value
    var word2 = document.getElementById('name-field2').value
    // Model.setSeedWords(word1, word2);
    if ((word1 != "")&&(word2 != "")) {
        document.getElementById('front-panel').hidden = true;
        document.getElementById('start-panel').hidden = false;
        Model.state.emitter.updateReadyToPlay()
        Tone.start()
        //Tone.setContext(new Tone.Context({ latencyHint : "balanced" }))
        Tone.context.latencyHint = "playback"
    }    
}

var playButton = document.getElementById('play-button');
playButton.onclick = ()=> {
    if (playButton.classList.contains('is-success')){
        showInitPanel();
        // window.requestAnimationFrame(moveMoon) 
        Model.startMusic(); 
        
        }
}

document.querySelectorAll('.token-btn').forEach((btn)=>{

    btn.addEventListener('click', ()=>{
        var env = btn.classList[3]
        var el = btn.classList[2]

        document.querySelectorAll('.'+ el).forEach((elem)=>{elem.classList.remove('selected-btn')})
        btn.classList.add('selected-btn')

        environmentToGenerate[el] = env

        console.log(environmentToGenerate)
        
    })
})


generateButton.onclick = () => {
    menuPanel.style.display = 'none'
    cancelAnimationFrame(framereq)
    initImages(environmentToGenerate)
}

document.getElementById('menu').onclick = () => {
    menuPanel.style.display = 'inline-flex  '
}