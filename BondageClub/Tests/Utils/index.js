"use strict";

// Keep this file as .cjs
// TS is only able to handle `require("./Utils")` calls when index.js is present and not index.cjs
const Game = require("./game.cjs");

module.exports = {
	character,
	utils,
	Game,
};
