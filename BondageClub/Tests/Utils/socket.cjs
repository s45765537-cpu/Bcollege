"use_strict";

const { Game } = require("./game.cjs");

/**
 * Mock a "server to client" event
 * @template {keyof ServerToClientEvents} T
 * @param {T} ev The event name
 * @param {Parameters<ServerToClientEvents[T]>} args The even data
 */
function mockResponse(ev, ...args) {
	Game.ServerSocket.mockResponse(ev, ...args);
}

module.exports = {
	mockResponse,
};
