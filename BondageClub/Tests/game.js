"use strict";
const fs = require("fs");
const vm = require("vm");
// eslint-disable-next-line no-redeclare
const { TextEncoder, TextDecoder } = require("util");

/** @type {object} */
let Game = {
	...global,
	window: window,
	document: document,
	console: console,
	XMLHttpRequest: XMLHttpRequest,
	Image: Image,
	TextEncoder: TextEncoder,
	TextDecoder: TextDecoder,
	Audio: class {
		constructor(src) {
			this.src = src;
			this.volume = 1;
			this.paused = true;
		}
		play() {
			this.paused = false;
			return Promise.resolve();
		}
		pause() {
			this.paused = true;
		}
		addEventListener() {}
		removeEventListener() {}
		load() {}
	},
	fetch: (url, options) => {
		// #TODO: implement fetch functionality
		return new Promise((resolve, reject) => {});
	},
};

const domGlobals = ["HTMLElement", "HTMLCanvasElement"];

domGlobals.forEach((key) => {
	if (global[key]) {
		Game[key] = global[key];
	}
});

const path = require("path");

/**
 * @param {string} parentFile - The path to the file
 * @param {string} relativePath - The src
 * @returns {string} The absolute or relative path
 */
function resolvePath(parentFile, relativePath) {
	const parentDir = path.dirname(parentFile);

	return path.join(parentDir, relativePath);
}

function load(file) {
	const contents = fs.readFileSync(file);
	for (const key in global) {
		if (
			Object.prototype.hasOwnProperty.call(global, key) &&
			Game[key] === undefined
		) {
			Game[key] = global[key];
		}
	}

	if (file.endsWith(".html")) {
		// Inject HTML into the JSDOM environment
		// eslint-disable-next-line nounsanitized/property
		document.documentElement.innerHTML = contents;
		const scripts = document.querySelectorAll("script[src]");
		scripts.forEach((s) => {
			const src = s.getAttribute("src");
			load(resolvePath(file, src));
		});
	} else {
		const script = new vm.Script(contents, { filename: file });
		script.runInNewContext(Game);
	}
}

function createCharacter(name, opts) {
	const char = Game.CharacterReset(opts?.isPlayer ? 0 : name, "Female3DCG");

	char.Name = char.AccountName = name;

	Game.PreferenceInit(char);
	return char;
}
Game.load = load;
Game.load("index.html");

Game.createCharacter = createCharacter;

module.exports = Game;
