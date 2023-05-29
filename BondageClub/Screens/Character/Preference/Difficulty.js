"use strict";

/** @type {null | number} */
var PreferenceDifficultyLevel = null;
var PreferenceDifficultyAccept = false;

function PreferenceSubscreenDifficultyLoad() {
	PreferenceDifficultyLevel = Player.GetDifficulty();
}

/**
 * Runs and draw the preference screen, difficulty subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenDifficultyRun() {

	// Draw the character and the controls
	MainCanvas.textAlign = "left";
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	DrawText(TextGet("DifficultyPreferences"), 500, 125, "Black", "Gray");

	// When no level is selected, we allow to select one
	if (PreferenceDifficultyLevel == null) {

		// Draw the difficulty levels
		DrawText(TextGet("DifficultyTitle"), 500, 225, "Black", "Gray");
		for (let D = 0; D <= 3; D++) {
			DrawText(TextGet("DifficultySummary" + D.toString() + "A"), 850, 325 + 150 * D, "Black", "White");
			DrawText(TextGet("DifficultySummary" + D.toString() + "B"), 850, 375 + 150 * D, "Black", "White");
		}

		// Draw the difficulty buttons
		MainCanvas.textAlign = "center";
		for (let D = 0; D <= 3; D++)
			DrawButton(500, 320 + 150 * D, 300, 64, TextGet("DifficultyLevel" + D.toString()), (D == Player.GetDifficulty()) ? "#DDFFDD" : "White", "");

	} else {

		// Draw the detailed texts
		for (let T = 0; T <= 4; T++)
			DrawText(TextGet("Difficulty" + PreferenceDifficultyLevel.toString() + "Text" + T.toString()), 500, 225 + 100 * T, "Black", "White");

		// Can only set to 2 or 3 if no change was done for 1 week
		if (PreferenceDifficultyLevel !== Player.GetDifficulty()) {
			const LastChange = ((Player.Difficulty == null) || (Player.Difficulty.LastChange == null) || (typeof Player.Difficulty.LastChange !== "number")) ? Player.Creation : Player.Difficulty.LastChange;
			if ((PreferenceDifficultyLevel <= 1) || (LastChange + 604800000 < CurrentTime)) {
				DrawCheckbox(500, 700, 64, 64, TextGet("DifficultyIAccept"), PreferenceDifficultyAccept);
				MainCanvas.textAlign = "center";
				DrawButton(500, 825, 300, 64, TextGet("DifficultyChangeMode") + " " + TextGet("DifficultyLevel" + PreferenceDifficultyLevel.toString()), PreferenceDifficultyAccept ? "White" : "#ebebe4", "");
			} else DrawText(TextGet("DifficultyWaitSevenDays").replace("NumberOfHours", Math.ceil((LastChange + 604800000 - CurrentTime) / 3600000).toString()), 500, 825, "Black", "White");
		} else DrawText(TextGet("DifficultyAlreadyPlayingOn"), 500, 825, "Black", "White");
		MainCanvas.textAlign = "center";
	}
}

/**
 * Handles the click events in the preference screen, difficulty sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenDifficultyClick() {

	// When no level is selected, the user can pick one to go into details
	if (PreferenceDifficultyLevel == null) {
		PreferenceDifficultyAccept = false;
		if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenDifficultyExit();
		for (let D = 0; D <= 3; D++)
			if (MouseIn(500, 320 + 150 * D, 300, 64))
				PreferenceDifficultyLevel = D;
	} else {

		// If a level is selected, the user must check to confirm
		if (MouseIn(1815, 75, 90, 90)) PreferenceDifficultyLevel = null;
		if (PreferenceDifficultyLevel != Player.GetDifficulty()) {
			var LastChange = ((Player.Difficulty == null) || (Player.Difficulty.LastChange == null) || (typeof Player.Difficulty.LastChange !== "number")) ? Player.Creation : Player.Difficulty.LastChange;
			if ((PreferenceDifficultyLevel <= 1) || (LastChange + 604800000 < CurrentTime)) {
				if (MouseIn(500, 700, 64, 64)) PreferenceDifficultyAccept = !PreferenceDifficultyAccept;
				if (MouseIn(500, 825, 300, 64) && PreferenceDifficultyAccept) {
					Player.Difficulty = { LastChange: CurrentTime, Level: PreferenceDifficultyLevel };
					ServerSend("AccountDifficulty", PreferenceDifficultyLevel);
					PreferenceInitPlayer();
					LoginDifficulty(true);
					PreferenceDifficultyLevel = null;
					PreferenceSubscreenDifficultyExit();
				}
			}
		}
	}
}

/**
 * Exists the difficulty screen. Cleans up elements that are not needed anymore
 * @returns {void} - Nothing
 */
function PreferenceSubscreenDifficultyExit() {
	PreferenceMessage = "";
	PreferenceSubscreen = "";
}
