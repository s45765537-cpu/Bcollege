"use strict";

/**
 * Runs and draw the preference screen, restriction subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenRestrictionRun() {

	// Draw the character and the controls
	MainCanvas.textAlign = "left";
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	DrawText(TextGet("RestrictionPreferences"), 500, 125, "Black", "Gray");
	const disableButtons = Player.GetDifficulty() > 0;
	DrawText(TextGet(disableButtons ? "RestrictionNoAccess" : "RestrictionAccess"), 500, 225, "Black", "Gray");
	DrawCheckbox(500, 325, 64, 64, TextGet("RestrictionBypassStruggle"), Player.RestrictionSettings.BypassStruggle && !disableButtons, disableButtons);
	DrawCheckbox(500, 425, 64, 64, TextGet("RestrictionSlowImmunity"), Player.RestrictionSettings.SlowImmunity && !disableButtons, disableButtons);
	DrawCheckbox(500, 525, 64, 64, TextGet("RestrictionBypassNPCPunishments"), Player.RestrictionSettings.BypassNPCPunishments && !disableButtons, disableButtons);
	DrawCheckbox(500, 625, 64, 64, TextGet("RestrictionNoSpeechGarble"), Player.RestrictionSettings.NoSpeechGarble && !disableButtons, disableButtons);
	MainCanvas.textAlign = "center";
}

/**
 * Handles the click events in the preference screen, restriction sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenRestrictionClick() {
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenDifficultyExit();
	if (MouseIn(500, 325, 64, 64) && (Player.GetDifficulty() == 0)) Player.RestrictionSettings.BypassStruggle = !Player.RestrictionSettings.BypassStruggle;
	if (MouseIn(500, 425, 64, 64) && (Player.GetDifficulty() == 0)) Player.RestrictionSettings.SlowImmunity = !Player.RestrictionSettings.SlowImmunity;
	if (MouseIn(500, 525, 64, 64) && (Player.GetDifficulty() == 0)) Player.RestrictionSettings.BypassNPCPunishments = !Player.RestrictionSettings.BypassNPCPunishments;
	if (MouseIn(500, 625, 64, 64) && (Player.GetDifficulty() == 0)) Player.RestrictionSettings.NoSpeechGarble = !Player.RestrictionSettings.NoSpeechGarble;
}
