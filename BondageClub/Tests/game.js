"use strict";
const fs = require("fs");
const vm = require("vm");
const { TextEncoder: NodeTextEncoder, TextDecoder: NodeTextDecoder } = require("util");

/** @type {typeof globalThis & Record<string, any>} */
const Game = {
	...global,
	window: window,
	document: document,
	console: console,
	XMLHttpRequest: XMLHttpRequest,
	Image: Image,
	TextEncoder: NodeTextEncoder,
	// @ts-expect-error: Minor type mismatch between `window.TextDecoder` and `util.TextDecoder`
	TextDecoder: NodeTextDecoder,
	// @ts-expect-error: _SIGNIFICANT_ type mismatch between `window.Audio` and the `Audio` replacement here due to missing properties
	Audio: class {
		/**
		 * @param {string | undefined} [src]
		 */
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
	/** @type {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} */
	fetch: (url, options) => {
		// #TODO: implement fetch functionality
		return new Promise((resolve, reject) => {});
	},
};

const domGlobals = /** @type {const} */([
	"HTMLElement",
	"HTMLCanvasElement",
]);

domGlobals.forEach((key) => {
	if (key in global) {
		Game[/** @type {string} */(key)] = global[key];
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

/** @type {(file: string) => void} */
function load(file) {
	const contents = fs.readFileSync(file, { encoding: "utf8" });
	for (const key in global) {
		if (
			Object.prototype.hasOwnProperty.call(global, key) &&
			Game[key] === undefined
		) {
			Game[key] = global[/** @type {keyof globalThis} */(key)];
		}
	}

	if (file.endsWith(".html")) {
		// Inject HTML into the JSDOM environment
		// eslint-disable-next-line nounsanitized/property
		document.documentElement.innerHTML = contents;
		const scripts = document.querySelectorAll("script[src]");
		scripts.forEach((s) => {
			const src = /** @type {string} */(s.getAttribute("src"));
			load(resolvePath(file, src));
		});
	} else {
		const script = new vm.Script(contents, { filename: file });
		script.runInNewContext(Game);
	}
}

/**
 * @param {string} name
 * @param {null | { isPlayer?: boolean }} opts
 * @returns {Character}
 */
function createCharacter(name, opts=null) {
	/** @type {Character} */
	const char = Game.CharacterReset(opts?.isPlayer ? 0 : name, "Female3DCG");

	char.Name = char.AccountName = name;

	Game.PreferenceInit(char);
	return char;
}
Game.load = load;
Game.load("index.html");
Game.AssetLoadAll();

Game.createCharacter = createCharacter;

module.exports = Game;
