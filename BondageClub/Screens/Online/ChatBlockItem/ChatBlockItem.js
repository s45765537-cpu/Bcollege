"use strict";
var ChatBlockItemBackground = "Sheet";
/** @type {ServerChatRoomBlockCategory[]} */
var ChatBlockItemList = ["ABDL", "SciFi", "Fantasy", "Leashing", "Photos", "Arousal", "Smoking", "Location"];
/** @type {ServerChatRoomBlockCategory[]} */
var ChatBlockItemCategory = [];

/**
 * Loads the chat room item blocking screen
 * @type {ScreenLoadHandler}
 */
async function ChatBlockItemLoad() {}

/**
 * When the chat room item blocking screen runs, draws the screen
 * @returns {void} - Nothing
 */
function ChatBlockItemRun() {}

/**
 * Handles the click events on the chat room item blocking screen. Called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatBlockItemClick() {}

/**
 * Handles exiting from the screen
 * @type {ScreenExitHandler}
 */
function ChatBlockItemExit() {
	CommonSetScreen("Online", "ChatAdmin");
}
