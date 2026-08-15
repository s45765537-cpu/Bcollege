"use_strict";

const { Game } = require("./game.cjs");

/**
 * @template {HTMLElementTagNameMap} K
 * @overload
 * @param {K} selector
 * @returns {HTMLElementTagNameMap[K]}
 *//**
 * @template {Element} [E=Element]
 * @overload
 * @param {string} selector
 * @returns {E}
 *//**
 * Query a selector and throw if it cannot be found.
 *
 * See {@link document.querySelector}
 * @param {string} selectors
 * @returns {Element}
 */
function querySelector(selectors) {
	/** @type {null | HTMLButtonElement} */
	const ret = Game.document.querySelector(selectors);
	if (!ret) {
		throw new Error(`Missing "${Game.CurrentModule}/${Game.CurrentScreen}" element "${selectors}"`);
	}
	return ret;
};

module.exports = {
	querySelector,
};
