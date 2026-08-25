"use strict";

const path = require("path");
const fs = require("fs");
const vm = require("vm");
const { TextEncoder: NodeTextEncoder, TextDecoder: NodeTextDecoder } = require("util");

/**
 * @param {string} parentFile - The path to the file
 * @param {string} relativePath - The src
 * @returns {string} The absolute or relative path
 */
function resolvePath(parentFile, relativePath) {
	const parentDir = path.dirname(parentFile);
	return path.join(parentDir, relativePath);
}

/** Required BC symbol overrides to be inserted after the VM has run its course (see {@link Game.load}) */
const postVMMocks = {
	/** @type {(file: string, callback: (this: XMLHttpRequest, xhr: XMLHttpRequest) => void) => void} */
	CommonGet: (file, callback) => {
		const data = fs.readFileSync(file, "utf8");
		const obj = /** @type {XMLHttpRequest} */({
			status: 200,
			responseText: data,
		});
		callback.call(obj, obj);
	},
	/** @type {(request: RequestInfo | URL) => Promise<Response>} */
	CommonFetch: async (url) => {
		const data = fs.readFileSync(`${url}`, "utf8");
		const obj = /** @type {Response} */({
			status: 200,
			async text() { return data; },
		});
		return obj;
	},
	/** @type {() => string} */
	CommonGetServer: () => Game.ServerURL,
	/** @type {() => void} */
	ServerInit: () => undefined,
};

const _Game = {
	...global,
	window: window,
	document: document,
	console: console,
	XMLHttpRequest: XMLHttpRequest,
	Image: Image,
	Element,
	HTMLElement,
	HTMLCanvasElement,
	HTMLImageElement,
	HTMLInputElement,
	HTMLSelectElement,
	HTMLTextAreaElement,
	customElements,
	TextEncoder: NodeTextEncoder,
	TextDecoder: NodeTextDecoder,
	Worker: class {
		/**
		 * @param {string | URL} scriptURL
		 * @param {WorkerOptions} [options]
		 */
		constructor(scriptURL, options) {
		}
		terminate() {}
	},
	/** @type {(query: string) => MediaQueryList} */
	matchMedia(query) {
		return /** @type {MediaQueryList} */({ matches: false });
	},
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
	/** @type {(file: string) => void} */
	load(file) {
		const realFile = path.resolve(path.dirname(__dirname), file);
		const contents = fs.readFileSync(realFile, { encoding: "utf8" });
		for (const _key in global) {
			const key = /** @type {keyof globalThis} */(_key);
			if (
				Object.prototype.hasOwnProperty.call(global, key) &&
				this[key] === undefined
			) {
				// @ts-expect-error: TS is bad at iterating over interfaces
				this[key] = global[key];
			}
		}

		if (file.endsWith(".html")) {
			// Inject HTML into the JSDOM environment
			// eslint-disable-next-line nounsanitized/property
			document.documentElement.innerHTML = contents;
			const scripts = document.querySelectorAll("script[src]");
			scripts.forEach((s) => {
				const src = /** @type {string} */(s.getAttribute("src"));
				this.load(resolvePath(file, src));
			});
		} else {
			const script = new vm.Script(contents, { filename: file });
			script.runInNewContext(this);
			Object.assign(this, postVMMocks);
		}
	},
	/** @type {() => Promise<void>} */
	async loadAll() {
		this.load("../index.html");
		/** @type {Promise<void>} */
		const promise = this.GameStart(true);
		return promise;
	},

	// Symbol initialized after `loadAll`
	/** @type {(isNode?: boolean) => Promise<void>} */
	GameStart: /** @type {never} */(undefined),
};

const Game = /** @type {typeof _Game & Record<string, any>} */(_Game);

module.exports = { Game };
