"use strict";
var RelogBackground = "";
var RelogCanvas = document.createElement("canvas");
/** @type {null | RelogData} */
var RelogData = null;

/**
 * Loads the relog screen
 * @returns {void} Nothing
 */
function RelogLoad() {
	// Hides any (non-nested) HTML DOM element with the tag "HideOnPopup", like text boxes
	const elements = /** @type {HTMLElement[]} */(Array.from(document.querySelectorAll(".HideOnPopup, .HideOnDisconnect")));
	for (const e of elements) {
		if (e.parentElement === null || e.parentElement === document.body) {
			e.style.display = "none";
		}
	}

	// Resets login variables and sets the login message
	LoginStatusReset();

	// Keeps a copy of the main canvas and darkens it
	var Context = RelogCanvas.getContext("2d");
	RelogCanvas.width = 2000;
	RelogCanvas.height = 1000;
	Context.drawImage(MainCanvas.canvas, 0, 0);
	Context.fillStyle = "rgba(0, 0, 0, 0.75)";
	Context.fillRect(0, 0, 2000, 1000);

	// Creates the password control without autocomplete and make sure it's cleared
	const passwordField = ElementCreateInput("InputPassword", "password", "", "20");
	passwordField.setAttribute("autocomplete", "off");
	passwordField.focus();
	setTimeout(function() { ElementValue("InputPassword", ""); }, 500);

}

/**
 * Unload the relog screen
 */
function RelogUnload() {
	ElementRemove("InputPassword");

	const Elements = /** @type {HTMLCollectionOf<HTMLElement>} */(document.getElementsByClassName("HideOnDisconnect"));
	for (const element of Elements) {
		element.style.display = "";
	}
}

/**
 * Runs the relog screen
 * @returns {void} Nothing
 */
function RelogRun() {

	// The previous darkened background is drawn
	MainCanvas.drawImage(RelogCanvas, 0, 0);
	const CanLogin = ServerIsConnected && !LoginSubmitted;

	// Draw the relog controls
	const status = LoginGetStatus();
	if (status) {
		DrawText(status, 1000, 150, "White", "Black");
	}
	DrawText(TextGet("EnterPassword"), 1000, 230, "White", "Black");
	DrawText(TextGet("Account") + "  " + Player.AccountName, 1000, 400, "White", "Black");
	DrawText(TextGet("Password"), 1000, 500, "White", "Black");
	ElementPosition("InputPassword", 1000, 550, 500);
	DrawButton(675, 750, 300, 60, TextGet("LogBackIn"), CanLogin ? "White" : "Grey", "");
	DrawButton(1025, 750, 300, 60, TextGet("Leave"), "White", "");

	// Reset any disconnect notifications
	if (document.hasFocus()) NotificationReset(NotificationEventType.DISCONNECT);
}

/**
 * Handles player click events on the relog screen
 * @returns {void} Nothing
 */
function RelogClick() {
	if (MouseIn(675, 750, 300, 60)) {
		// Log Back button
		const Password = ElementValue("InputPassword");
		LoginDoLogin(Player.AccountName, Password);
	}
	if (MouseIn(1025, 750, 300, 60)) RelogExit(); // Give Up button
}

/**
 * Handles player keyboard events on the relog screen
 * @type {KeyboardEventListener}
 */
function RelogKeyDown(event) {
	if (CommonKey.IsPressed(event, "Enter")) {
		// On an "enter" key press, try to relog the player
		const Name = Player.AccountName;
		const Password = ElementValue("InputPassword");
		LoginDoLogin(Name, Password);
		return true;
	}
	return false;
}

/**
 * Sends the player back to the main login screen
 * @type {ScreenExitHandler}
 */
function RelogExit() {
	// eslint-disable-next-line no-self-assign
	window.location = window.location;
}
