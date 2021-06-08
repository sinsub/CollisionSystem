// HTML elements
let canvas;
let ctx;
let canvasDim;
let particleCountSlider;
let displayN;
let mainContainer;
let controls;
let playButton;
let pauseButton;
let resetButton;

window.onload = function () {
    // Get HTML elements
    mainContainer = document.getElementById("main-container");
    controls = document.getElementById("controls");
    particleCountSlider = document.getElementById("particle-count-slider");
    displayN = document.getElementById("display-n");
    playButton = document.getElementById("play-button");
    pauseButton = document.getElementById("pause-button");
    resetButton = document.getElementById("reset-button");
    canvas = document.getElementById("my-canvas");

    // setup canvas
    canvasDim = Math.min(Math.floor(0.95 * (window.innerHeight - controls.clientHeight)), window.innerWidth);
    canvas.width = canvasDim;
    canvas.height = canvasDim;
    ctx = canvas.getContext("2d");
    start();
}

window.onresize = function () {
    ctx.clearRect(0, 0, canvasDim, canvasDim);
    mainContainer = document.getElementById("main-container");
    canvasDim = Math.min(Math.floor(0.95 * (window.innerHeight - controls.clientHeight)), window.innerWidth);
    canvas.width = canvasDim;
    canvas.height = canvasDim;
}

// Two systems
const BROWNIAN = 0;
const DIFFUSION = 1;


let collisionSystem;    // current collision system instance
let setup;  // current system's setup
let type;   // type of system 
let paused; // is the system paused
let reqID;  // last requested animation frame id
let n;      // number of particles
function start() {
    paused = false;
    playButton.disabled = true;
    n = particleCountSlider.value;
    displayN.innerHTML = "Number of particles:" + n;
    type = DIFFUSION;
    reset();
}

function pause() {
    paused = true;
    playButton.disabled = false;
    pauseButton.disabled = true;
}

function play() {
    if (paused) {
        paused = false;
        playButton.disabled = true;
        pauseButton.disabled = false;
        simulate();
    }
}

function reset() {
    ctx.clearRect(0, 0, canvasDim, canvasDim);
    paused = true;
    cancelAnimationFrame(reqID);
    if (type == BROWNIAN) {
        setup = new Brownian(n, 15, 25);
    } else if (type == DIFFUSION) {
        setup = new Diffusion(n, 2);
    }
    collisionSystem = new CollisionSystem(setup.getParticles(), 50000);
    paused = false;
    playButton.disabled = true;
    pauseButton.disabled = false;
    simulate();
}

function brownian() {
    if (type != BROWNIAN) {
        type = BROWNIAN;
        reset();
    }
}

function diffusion() {
    if (type != DIFFUSION) {
        type = DIFFUSION;
        reset();
    }
}


function slider() {
    n = particleCountSlider.value;
    displayN.innerHTML = "Number of small particles:" + n;
    reset();
}

// Utility functions:

function log(tolog) {
    console.log(JSON.parse(JSON.stringify(tolog)));
}

// colours
// lightest to darkest
const colours = ["#A5E1AD", "#4CA1A3", "#511281", "#21094E"];
function randomColour() {
    return colours[Math.floor(Math.random() * colours.length)];
}

// generic draw functions
function drawDisc(x, y, radius, colour) {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(x * canvasDim, y * canvasDim, radius * canvasDim, 0, twoPI);
    ctx.fill();
}

function drawLine(x1, y1, x2, y2, colour) {
    ctx.strokeStyle = colour;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// math constant and functions:
const twoPI = 2 * Math.PI;

function random(hi) { return Math.random() * hi; }
function random(lo, hi) {
    return Math.random() * (hi - lo) + lo;
}

// round up numbers
const roundTo = 1e10;
function round(x) {
    return Math.round(x * roundTo) / roundTo;
}