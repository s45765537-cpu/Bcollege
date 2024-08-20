"use strict";

/**
 * Sets the gender preferences for a player. Redirected to from the main Run function if the player is in the
 * gender settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGenderRun() {
	// Character and exit buttons
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");

	MainCanvas.textAlign = "left";

	DrawText(TextGet("GenderPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("GenderFemales"), 1410, 160, "Black", "Gray");
	DrawText(TextGet("GenderMales"), 1590, 160, "Black", "Gray");

	PreferenceGenderDrawSetting(500, 225, TextGet("GenderAutoJoinSearch"), Player.GenderSettings.AutoJoinSearch);
	PreferenceGenderDrawSetting(500, 305, TextGet("GenderHideShopItems"), Player.GenderSettings.HideShopItems);
	PreferenceGenderDrawSetting(500, 385, TextGet("GenderHideTitles"), Player.GenderSettings.HideTitles);

	MainCanvas.textAlign = "center";
}

/**
 * Draws the two checkbox row for a gender setting
 * @param {number} Left - The X co-ordinate the row starts on
 * @param {number} Top - The Y co-ordinate the row starts on
 * @param {string} Text - The text for the setting's description
 * @param {PreferenceGenderSetting} Setting - The player setting the row corresponds to
 * @returns {void} - Nothing
 */
function PreferenceGenderDrawSetting(Left, Top, Text, Setting) {
	DrawText(Text, Left, Top, "Black", "Gray");
	DrawCheckbox(Left + 950, Top - 32, 64, 64, "", Setting.Female);
	DrawCheckbox(Left + 950 + 155, Top - 32, 64, 64, "", Setting.Male);
}

/**
 * Handles the click events for the notifications settings of a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGenderClick() {
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreen = "";

	PreferenceGenderClickSetting(1450, 225, Player.GenderSettings.AutoJoinSearch, false);
	PreferenceGenderClickSetting(1450, 305, Player.GenderSettings.HideShopItems, false);
	PreferenceGenderClickSetting(1450, 385, Player.GenderSettings.HideTitles, false);
}

/**
 * Handles the click for a gender setting row
 * @param {number} Left - The X co-ordinate the row starts on
 * @param {number} Top - The Y co-ordinate the row starts on
 * @param {PreferenceGenderSetting} Setting - The player setting the row corresponds to
 * @param {boolean} MutuallyExclusive - Whether only one option can be enabled at a time
 * @returns {void} - Nothing
 */
function PreferenceGenderClickSetting(Left, Top, Setting, MutuallyExclusive) {
	if (MouseIn(Left, Top - 32, 64, 64)) {
		Setting.Female = !Setting.Female;
		if (MutuallyExclusive && Setting.Female) {
			Setting.Male = false;
		}
	}

	if (MouseIn(Left + 155, Top - 32, 64, 64)) {
		Setting.Male = !Setting.Male;
		if (MutuallyExclusive && Setting.Male) {
			Setting.Female = false;
		}
	}
}
