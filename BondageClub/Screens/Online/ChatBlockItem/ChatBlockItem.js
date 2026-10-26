"use strict";
var ChatBlockItemBackground = "Sheet";
/** @type {ServerChatRoomBlockCategory[]} */
var ChatBlockItemList = ["ABDL", "SciFi", "Fantasy", "Leashing", "Photos", "Arousal", "Smoking", "Location"];
/** @type {ServerChatRoomBlockCategory[]} */
var ChatBlockItemCategory = [];

const ChatBlockID = Object.freeze({
	screen: "chat-block-item-screen",
	hint: "chat-block-item-hint",
	list: "chat-block-item-list",
	exit: "chat-block-item-exit",
	/**
	 * @param {ServerChatRoomBlockCategory} category
	 * @returns {string}
	 */
	checkbox(category) {
		return `chat-block-item-${category}`;
	},
});

/**
 * Loads the chat room item blocking screen
 * @type {ScreenLoadHandler}
 */
async function ChatBlockItemLoad() {
	const checkboxes = ChatBlockItemList.map((category) => {
		return ElementCheckbox.CreateLabelled(
			ChatBlockID.checkbox(category),
			TextGet(category),
			function () {
				ChatBlockItemToggle(category, this.checked);
			},
			{
				checked: ChatBlockItemCategory.includes(category),
				disabled: !ChatAdminCanEdit(),
			},
		);
	});

	ElementDOMScreen.getTemplate(ChatBlockID.screen, {
		parent: document.body,
		header: TextGet("Title"),
		hgroupInHeader: true,
		menubarButtons: [
			ElementButton.Create(ChatBlockID.exit, ChatBlockItemExit, {
				image: "Icons/Exit.png",
				tooltip: TextGet("Return"),
			}),
		],
		mainContent: [
			{
				tag: "p",
				attributes: { id: ChatBlockID.hint },
				classList: ["chat-block-item-hint"],
				children: [TextGet("Hint")],
			},
			{
				tag: "div",
				attributes: {
					id: ChatBlockID.list,
					role: "group",
					"aria-labelledby": `${ChatBlockID.screen}-h1`,
					"aria-describedby": ChatBlockID.hint,
				},
				classList: ["chat-block-item-list"],
				children: checkboxes,
			},
		],
	});
}

/**
 * Adds or removes a blocked category
 * @param {ServerChatRoomBlockCategory} category
 * @param {boolean} blocked
 * @returns {void}
 */
function ChatBlockItemToggle(category, blocked) {
	const idx = ChatBlockItemCategory.indexOf(category);
	if (blocked) {
		if (idx < 0) ChatBlockItemCategory.push(category);
	} else if (idx >= 0) {
		ChatBlockItemCategory.splice(idx, 1);
	}
}

/**
 * Runs the chat room item blocking screen
 * @returns {void} - Nothing
 */
function ChatBlockItemRun() {}

/**
 * Handles clicks that reach the canvas. Called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatBlockItemClick() {}

/** @type {ScreenResizeHandler} */
function ChatBlockItemResize() {
	ElementPositionFixed(ChatBlockID.screen, 50, 50, 1900, 900);
}

/** @type {ScreenUnloadHandler} */
function ChatBlockItemUnload() {
	ElementRemove(ChatBlockID.screen);
}

/**
 * Handles exiting from the screen
 * @type {ScreenExitHandler}
 */
function ChatBlockItemExit() {
	CommonSetScreen("Online", "ChatAdmin");
}
