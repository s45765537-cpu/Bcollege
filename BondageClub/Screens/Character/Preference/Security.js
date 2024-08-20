"use strict";

/**
 * Loads the preference security screen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenSecurityLoad() {
	ElementCreateInput("InputEmailOld", "text", "", "100");
	ElementCreateInput("InputEmailNew", "text", "", "100");
	ServerSend("AccountQuery", { Query: "EmailStatus" });
}

/**
 * Sets the security preferences for a player. Redirected to from the main Run function if the player is in the
 * security settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenSecurityRun() {
	DrawCharacter(Player, 50, 50, 0.9);
	MainCanvas.textAlign = "left";
	DrawText(TextGet("SecurityPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("UpdateEmailOld"), 500, 225, "Black", "Gray");
	DrawText(TextGet("UpdateEmailNew"), 500, 305, "Black", "Gray");
	ElementPosition("InputEmailOld", 1200, 225, 800);
	ElementPosition("InputEmailNew", 1200, 305, 800);
	DrawText(TextGet("UpdateEmailDescription"), 800, 397, "Black", "Gray");
	MainCanvas.textAlign = "center";
	DrawButton(500, 365, 250, 64, TextGet("UpdateEmail"), "White", "");
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
}

/**
 * Handles the click events in the security settings dialog for a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenSecurityClick() {

	// If the user clicked the exit icon to return to the main screen
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenSecurityExit();

	// If we must update the email
	if (MouseIn(500, 365, 250, 50)) {
		var EmailOld = ElementValue("InputEmailOld");
		var EmailNew = ElementValue("InputEmailNew");

		if ((EmailOld == "" || CommonEmailIsValid(EmailOld)) && (EmailNew == "" || CommonEmailIsValid(EmailNew)))
			ServerSend("AccountUpdateEmail", { EmailOld: EmailOld, EmailNew: EmailNew });
		else
			ElementValue("InputEmailNew", TextGet("UpdateEmailInvalid"));
	}
}

/**
 * Exits the preference screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenSecurityExit() {
	PreferenceSubscreen = "";
	ElementRemove("InputEmailOld");
	ElementRemove("InputEmailNew");
}
