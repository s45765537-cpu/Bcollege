"use strict";

/** @type {SettingsSensDepName[]} */
var PreferenceSettingsSensDepList = ["SensDepLight", "Normal", "SensDepNames", "SensDepTotal", "SensDepExtreme"];
var PreferenceSettingsSensDepIndex = 0;

function PreferenceSubscreenImmersionLoad() {
	PreferenceSettingsSensDepIndex = (PreferenceSettingsSensDepList.indexOf(Player.GameplaySettings.SensDepChatLog) < 0) ? 0 : PreferenceSettingsSensDepList.indexOf(Player.GameplaySettings.SensDepChatLog);
}

/**
 * Runs and draws the preference screen, immersion sub-screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenImmersionRun() {

	// Draw the player & base controls
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	if (PreferenceMessage != "") DrawText(TextGet(PreferenceMessage), 865, 125, "Red", "Black");
	PreferencePageChangeDraw(1595, 75, 2); // Uncomment when adding a 2nd page
	MainCanvas.textAlign = "left";
	DrawText(TextGet("ImmersionPreferences"), 500, 125, "Black", "Gray");

	const disableButtons = Player.GetDifficulty() > 2 || (Player.GameplaySettings.ImmersionLockSetting && Player.IsRestrained());
	if (Player.GetDifficulty() <= 2) {
		let CheckImage = disableButtons ? "Icons/CheckLocked.png" : "Icons/CheckUnlocked.png";
		DrawCheckbox(500, 172, 64, 64, TextGet("ImmersionLockSetting"), Player.GameplaySettings.ImmersionLockSetting, disableButtons, "Black", CheckImage);
	} else {
		// Cannot change any value under the Extreme difficulty mode
		DrawText(TextGet("ImmersionLocked"), 500, 205, "Red", "Gray");
	}


	DrawEmptyRect(500, 255, 1400, 0, "Black", 1);

	let CheckHeight = 272;
	let CheckSpacing = 80;

	if (PreferencePageCurrent === 1) {
		DrawText(TextGet("SensDepSetting"), 800, 308, "Black", "Gray"); CheckHeight += CheckSpacing;
		// Disable the BlindDisableExamine checkbox when the SensDep setting overrides its behaviour
		const bdeForceOff = PreferenceSettingsSensDepIndex === PreferenceSettingsSensDepList.indexOf("SensDepLight");
		const bdeForceOn = PreferenceSettingsSensDepIndex === PreferenceSettingsSensDepList.indexOf("SensDepExtreme");
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("BlindDisableExamine"), (Player.GameplaySettings.BlindDisableExamine && !bdeForceOff) || bdeForceOn, disableButtons || bdeForceOff || bdeForceOn);
		CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("BlindAdjacent"), Player.ImmersionSettings.BlindAdjacent, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("ChatRoomMuffle"), Player.ImmersionSettings.ChatRoomMuffle, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("DisableAutoRemoveLogin"), Player.GameplaySettings.DisableAutoRemoveLogin, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("AllowPlayerLeashing"), Player.OnlineSharedSettings.AllowPlayerLeashing, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("ReturnToChatRoom"), Player.ImmersionSettings.ReturnToChatRoom, disableButtons);
		const returnToRoomEnabled = Player.ImmersionSettings.ReturnToChatRoom;
		DrawCheckbox(1300, CheckHeight, 64, 64, TextGet("ReturnToChatRoomAdmin"), returnToRoomEnabled && Player.ImmersionSettings.ReturnToChatRoomAdmin, !returnToRoomEnabled || disableButtons);
		CheckHeight += CheckSpacing;
		const canHideMessages = Player.GameplaySettings.SensDepChatLog !== "SensDepLight";
		DrawCheckbox(1300, 272, 64, 64, TextGet("SenseDepMessages"), canHideMessages && Player.ImmersionSettings.SenseDepMessages, !canHideMessages || disableButtons);
		DrawBackNextButton(500, 272, 250, 64, TextGet(Player.GameplaySettings.SensDepChatLog), "White", "",
			() => disableButtons ? "" : TextGet(PreferenceSettingsSensDepList[(PreferenceSettingsSensDepIndex + PreferenceSettingsSensDepList.length - 1) % PreferenceSettingsSensDepList.length]),
			() => disableButtons ? "" : TextGet(PreferenceSettingsSensDepList[(PreferenceSettingsSensDepIndex + 1) % PreferenceSettingsSensDepList.length]));
	}
	else if (PreferencePageCurrent === 2) {
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("StimulationEvents"), Player.ImmersionSettings.StimulationEvents, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("AllowTints"), Player.ImmersionSettings.AllowTints, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("ChatRoomMapLeaveOnExit"), Player.ImmersionSettings.ChatRoomMapLeaveOnExit, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("AllowRename"), Player.OnlineSharedSettings.AllowRename, disableButtons); CheckHeight += CheckSpacing;
	}
}

/**
 * Handles the click events in the preference screen, immersion sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenImmersionClick() {

	// If the user clicks on "Exit"
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreen = "";
	// Change page
	PreferencePageChangeClick(1595, 75, 2); // Uncomment when adding a 2nd page

	// Cannot change any value under the Extreme difficulty mode
	if (Player.GetDifficulty() <= 2 && (!Player.GameplaySettings.ImmersionLockSetting || (!Player.IsRestrained()))) {
		let CheckHeight = 272;
		let CheckSpacing = 80;

		// Preference check boxes
		if (MouseIn(500, 172, 64, 64)) Player.GameplaySettings.ImmersionLockSetting = !Player.GameplaySettings.ImmersionLockSetting;

		if (PreferencePageCurrent === 1) {
			// If we must change sens dep settings
			if (MouseIn(500, CheckHeight, 250, 64)) {
				if (MouseX <= 625) PreferenceSettingsSensDepIndex = (PreferenceSettingsSensDepList.length + PreferenceSettingsSensDepIndex - 1) % PreferenceSettingsSensDepList.length;
				else PreferenceSettingsSensDepIndex = (PreferenceSettingsSensDepIndex + 1) % PreferenceSettingsSensDepList.length;
				Player.GameplaySettings.SensDepChatLog = PreferenceSettingsSensDepList[PreferenceSettingsSensDepIndex];
				if (Player.GameplaySettings.SensDepChatLog == "SensDepExtreme") ChatRoomSetTarget(-1);
			}
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64) && ![PreferenceSettingsSensDepList.indexOf("SensDepLight"), PreferenceSettingsSensDepList.indexOf("SensDepExtreme")].includes(PreferenceSettingsSensDepIndex))
				Player.GameplaySettings.BlindDisableExamine = !Player.GameplaySettings.BlindDisableExamine;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.BlindAdjacent = !Player.ImmersionSettings.BlindAdjacent;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.ChatRoomMuffle = !Player.ImmersionSettings.ChatRoomMuffle;
			CheckHeight += CheckSpacing;

			// Room control
			if (MouseIn(500, CheckHeight, 64, 64)) Player.GameplaySettings.DisableAutoRemoveLogin = !Player.GameplaySettings.DisableAutoRemoveLogin;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.OnlineSharedSettings.AllowPlayerLeashing = !Player.OnlineSharedSettings.AllowPlayerLeashing;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.ReturnToChatRoom = !Player.ImmersionSettings.ReturnToChatRoom;
			if (MouseIn(1300, CheckHeight, 64, 64) && Player.ImmersionSettings.ReturnToChatRoom)
				Player.ImmersionSettings.ReturnToChatRoomAdmin = !Player.ImmersionSettings.ReturnToChatRoomAdmin;
			CheckHeight += CheckSpacing;

			if (MouseIn(1300, 272, 64, 64) && Player.GameplaySettings.SensDepChatLog !== "SensDepLight")
				Player.ImmersionSettings.SenseDepMessages = !Player.ImmersionSettings.SenseDepMessages;

		}
		else if (PreferencePageCurrent === 2) {
			// Stimulation
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.StimulationEvents = !Player.ImmersionSettings.StimulationEvents;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.AllowTints = !Player.ImmersionSettings.AllowTints;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.ChatRoomMapLeaveOnExit = !Player.ImmersionSettings.ChatRoomMapLeaveOnExit;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.OnlineSharedSettings.AllowRename = !Player.OnlineSharedSettings.AllowRename;
			CheckHeight += CheckSpacing;
		}
	}
}
