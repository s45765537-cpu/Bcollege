"use strict";
var DisclaimerBackground = "Sheet";

/**
 * Loads the disclaimer screen
 * @returns {void} - Nothing
 */
function DisclaimerLoad() {
}

/**
 * Runs & draws the disclaimer screen
 * @returns {void} - Nothing
 */
function DisclaimerRun() {
	for (let L = 0; L <= 10; L++)
		DrawText(TextGet("Line" + L.toString()), 1000, 130 + L * 60, "Black", "Silver");
	DrawButton(700, 840, 250, 60, TextGet("Return"), "White", "");
	DrawButton(1050, 840, 250, 60, TextGet("Accept"), "White", "");
}

/**
 * Handles click events in the disclaimer screen
 * @returns {void} - Nothing
 */
function DisclaimerClick() {
	if (MouseIn(700, 840, 250, 60)) DisclaimerExit();
	if (MouseIn(1050, 840, 250, 60)) {
		InventoryRemove(Player, "ItemFeet");
		InventoryRemove(Player, "ItemLegs");
		InventoryRemove(Player, "ItemArms");
		CharacterAppearanceSetDefault(Player);

		// Redirect the player to the login screen after they have their character created
		CharacterAppearanceLoadCharacter(Player, (result) => {
			if (result)
				CommonSetScreen("Character", "Creation");
			else
				CommonSetScreen("Character", "Login");
		});
	}
}

/**
 * Does the cleanup, if the user exits the screen
 * @returns {void} - Nothing
 */
function DisclaimerExit() {
	CommonSetScreen("Character", "Login");
}
