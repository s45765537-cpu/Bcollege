"use strict";

// Keep this file as .js as TS is unable te resolve index.cjs (only .js); both options work fine during runtime though
const { Game } = require("./game.cjs");
const character = require("./character.cjs");
const utils = require("./utils.cjs");

module.exports = {
	character,
	utils,
	Game,
};
