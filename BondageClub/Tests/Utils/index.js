"use strict";

// Keep this file as .js as TS is unable te resolve index.cjs (only .js); both options work fine during runtime though
const { Game } = require("./game.cjs");
const utils = require("./utils.cjs");
const element = require("./element.cjs");
const _screen = require("./screen.cjs");
const character = require("./character.cjs");

module.exports = {
	utils,
	element,
	screen: _screen, // Re-aliasing to prevent overriding of the global `screen` symbol
	character,
	Game,
};
