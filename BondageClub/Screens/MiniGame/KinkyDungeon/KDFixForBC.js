'use strict';

// @ts-ignore

let StandalonePatched = false;
// @ts-ignore
// @ts-ignore

let KDCurrentModels = new Map();

/** @type {HTMLCanvasElement} */
// @ts-expect-error Either that or the whole block at KDDraw.js:3231 is wrong
let PIXICanvas = MainCanvas;
