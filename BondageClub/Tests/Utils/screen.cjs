"use_strict";

const { Game } = require("./game.cjs");
const element = require("./element.cjs");

/**
 * Sets the current screen and calls the loading script if needed
 * @param {ScreenSpecifier} spec
 * @returns {Promise<void>}
 */
function set(...spec) {
	return Game.CommonSetScreen(...spec);
}

/**
 * Await a screen changes as triggered via {@link CommonSetScreen}
 * @returns {Promise<void>}
 */
async function awaitScreenChange() {
	await Game.ScreenIsLoadingPromise;
}

/**
 * Simulate a canvas click at the specified coordinates
 * @param {number} x X coordinate in the `[0, 2000]` interval
 * @param {number} y Y coordinate in the `[0, 1000]` interval
 * @returns {void}
 */
function canvasClick(x, y) {
	Game.MouseX = x;
	Game.MouseY = y;
	/** @type {HTMLCanvasElement} */
	const canvas = element.querySelector("canvas#MainCanvas");
	canvas.click();
}

module.exports = {
	set,
	canvasClick,
	awaitScreenChange,
};
