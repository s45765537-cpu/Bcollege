"use strict";

/** @type {string[]} */
var PreferenceCensoredWordsList = [];
var PreferenceCensoredWordsOffset = 0;

/**
 * Loads the preference censored words screen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenCensoredWordsLoad() {
	PreferenceCensoredWordsOffset = 0;
	PreferenceCensoredWordsList = [];
	if ((Player.ChatSettings.CensoredWordsList != null) && (Player.ChatSettings.CensoredWordsList != ""))
		PreferenceCensoredWordsList = Player.ChatSettings.CensoredWordsList.split("|");
	ElementCreateInput("InputWord", "text", "", "50");
}

/**
 * Sets the censored words for the player. Redirected to from the main Run function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenCensoredWordsRun() {

	// Draw the header
	DrawText(TextGet("CensorTitle"), 930, 105, "Black", "Silver");
	DrawButton(1830, 60, 90, 90, "", "White", "Icons/Exit.png", TextGet("CensorExit"));
	DrawText(TextGet("CensorLevel"), 200, 205, "Black", "Silver");
	DrawButton(350, 175, 550, 60, TextGet("CensorLevel" + Player.ChatSettings.CensoredWordsLevel), "White");
	DrawText(TextGet("CensorWord"), 1080, 205, "Black", "Silver");
	ElementPosition("InputWord", 1385, 200, 300);
	DrawButton(1550, 175, 180, 60, TextGet("CensorAdd"), "White");
	if (PreferenceCensoredWordsList.length > 32) DrawButton(1830, 175, 90, 90, "", "White", "Icons/Next.png");

	// List all words with a delete button
	MainCanvas.textAlign = "left";
	for (let O = PreferenceCensoredWordsOffset; O < PreferenceCensoredWordsList.length && O < PreferenceCensoredWordsOffset + 32; O++) {
		let X = 100 + Math.floor((O - PreferenceCensoredWordsOffset)/ 8) * 450;
		let Y = 270 + ((O % 8) * 84);
		DrawButton(X, Y, 60, 60, "", "White", "Icons/Small/Remove.png");
		DrawText(PreferenceCensoredWordsList[O], X + 100, Y + 30, "Black", "Gray");
	}
	MainCanvas.textAlign = "center";
}

/**
 * Handles click events for the censored words preference settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenCensoredWordsClick() {

	// When the user clicks on the header buttons
	if (MouseIn(1830, 60, 250, 65)) PreferenceSubscreenCensoredWordsExit();
	if (MouseIn(1550, 175, 180, 60)) {
		let Word = ElementValue("InputWord").trim().toUpperCase().replace("|", "");
		if ((Word != "") && (PreferenceCensoredWordsList.indexOf(Word) < 0)) {
			PreferenceCensoredWordsList.push(Word);
			PreferenceCensoredWordsList.sort();
			ElementValue("InputWord", "");
		}
		return;
	}
	if (MouseIn(350, 175, 550, 60)) {
		Player.ChatSettings.CensoredWordsLevel++;
		if (Player.ChatSettings.CensoredWordsLevel > 2) Player.ChatSettings.CensoredWordsLevel = 0;
		return;
	}
	if (MouseIn(1830, 175, 250, 65)) {
		PreferenceCensoredWordsOffset = PreferenceCensoredWordsOffset + 32;
		if (PreferenceCensoredWordsOffset >= PreferenceCensoredWordsList.length) PreferenceCensoredWordsOffset = 0;
		return;
	}

	// When the user clicks to delete one of the words
	for (let O = PreferenceCensoredWordsOffset; O < PreferenceCensoredWordsList.length && O < PreferenceCensoredWordsOffset + 32; O++) {
		let X = 100 + Math.floor((O - PreferenceCensoredWordsOffset)/ 8) * 450;
		let Y = 270 + ((O % 8) * 84);
		if (MouseIn(X, Y, 60, 60)) {
			PreferenceCensoredWordsList.splice(O, 1);
			if (PreferenceCensoredWordsOffset >= PreferenceCensoredWordsList.length) PreferenceCensoredWordsOffset = 0;
			return;
		}
	}
}


/**
 * Exits the preference screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenCensoredWordsExit() {
	ElementRemove("InputWord");
	Player.ChatSettings.CensoredWordsList = PreferenceCensoredWordsList.join("|");
	PreferenceSubscreen = "";
}
