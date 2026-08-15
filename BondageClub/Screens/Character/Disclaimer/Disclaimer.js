"use strict";
var DisclaimerBackground = "Sheet";
const DisclaimerIDs = Object.freeze({
	screen: "disclaimer-screen",
	text: "disclaimer-text",
	return: "disclaimer-return",
	accept: "disclaimer-accept",
	buttons: "disclaimer-buttons",
});
const DisclaimerVersion = 1;
/** @type {null | ((accepted: boolean) => void)} */
var DisclaimerCloseCallback = null;

/**
 * Loads the disclaimer screen
 * @type {ScreenLoadHandler}
 */
async function DisclaimerLoad() {
	const disclaimerTextSection = ElementCreate({
		tag: "section",
		attributes: { id: DisclaimerIDs.text },
		classList: ["disclaimer-text", "NoSelect"],
	});
	const disclaimerButtonsSection = ElementCreate({
		tag: "section",
		attributes: { id: DisclaimerIDs.buttons, role: "group" },
		classList: ["disclaimer-buttons", "NoSelect"],
	});

	ElementDOMScreen.getTemplate(
		DisclaimerIDs.screen,
		{
			parent: document.body,
			header: TextGet("Disclaimer"),
			hgroupInHeader: true,
			mainContent: [
				disclaimerTextSection,
				disclaimerButtonsSection,
			]
		},
	);


	const introLine1 = ElementCreate({
		tag: "p",
		classList: ["disclaimer-line", "disclaimer-intro"],
		children: [
			TextGet("TosIntro1"),
			{ tag: "br" },
			TextGet("TosIntro2")
		],
	});

	const listItems = [
		"TosItem1",
		"TosItem2",
		"TosItem3",
		"TosItem4",
		"TosItem5",
		"TosItem6",
		"TosItem7",
		"TosItem8",
	].map((key) => ElementCreate({
		tag: "li",
		classList: ["disclaimer-list-item"],
		children: [TextGet(key)],
	}));

	const tosList = ElementCreate({
		tag: "ol",
		classList: ["disclaimer-line", "disclaimer-list"],
		children: listItems,
	});

	const outroLine = ElementCreate({
		tag: "p",
		classList: ["disclaimer-line", "disclaimer-outro"],
		children: [TextGet("TosAcceptPrompt")],
	});

	disclaimerTextSection.replaceChildren(introLine1, tosList, outroLine);

	const returnButton = ElementButton.Create(DisclaimerIDs.return, () => DisclaimerClose(false), {
		label: TextGet("TosReturn"),
		name: "reject",
	},
	{
		button: { classList: ["disclaimer-button"] },
	});
	const acceptButton = ElementButton.Create(DisclaimerIDs.accept, () => DisclaimerClose(true), {
		label: TextGet("TosAccept"),
		name: "accept",
	},
	{
		button: { classList: ["disclaimer-button"] },
	});

	disclaimerButtonsSection.replaceChildren(returnButton, acceptButton);
}

/**
 * Runs & draws the disclaimer screen
 * @returns {void} - Nothing
 */
function DisclaimerRun() {}

/**
 * Handles click events in the disclaimer screen
 * @returns {void} - Nothing
 */
function DisclaimerClick() {}

/** @type {ScreenUnloadHandler} */
function DisclaimerUnload() {
	ElementRemove(DisclaimerIDs.screen);
}

/**
 * Opens the disclaimer screen and optionally runs a callback when the player closes it.
 * @param {(accepted: boolean) => void} closeCallback
 * @returns {boolean} Whether the player has already accepted the disclaimer
 */
function DisclaimerOpen(closeCallback) {
	if (!closeCallback) {
		throw Error("DisclaimerOpen: closeCallback is required");
	}
	// Check if the player has already accepted the disclaimer and just trying to log in
	const accepted = (LogValue("Accepted", "Disclaimer") ?? 0) >= DisclaimerVersion;
	if (accepted) {
		closeCallback(accepted);
		return true;
	}
	DisclaimerCloseCallback = closeCallback;
	CommonSetScreen("Character", "Disclaimer");

	return false;
}

/**
 * @param {boolean} accepted
 */
function DisclaimerClose(accepted) {
	if (accepted) {
		LogAdd("Accepted", "Disclaimer", DisclaimerVersion);
	}
	const closeCallback = DisclaimerCloseCallback;
	if (!closeCallback) {
		throw Error("DisclaimeExit: closeCallback is missing");
	}
	DisclaimerCloseCallback = null;
	closeCallback(accepted);
}

function DisclaimerResize() {
	ElementSetPosition(DisclaimerIDs.screen, 100, 100);
	ElementSetSize(DisclaimerIDs.screen, 1800, 800);
	ElementSetFontSize(DisclaimerIDs.screen, "auto");
}
