"use strict";

var PreferenceSettingsVolumeList = [1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
var PreferenceSettingsVolumeIndex = 0;
var PreferenceSettingsMusicVolumeIndex = 0;


function PreferenceSubscreenAudioLoad() {
	PreferenceSettingsVolumeIndex = (PreferenceSettingsVolumeList.indexOf(Player.AudioSettings.Volume) < 0) ? 0 : PreferenceSettingsVolumeList.indexOf(Player.AudioSettings.Volume);
	PreferenceSettingsMusicVolumeIndex = (PreferenceSettingsVolumeList.indexOf(Player.AudioSettings.MusicVolume) < 0) ? 0 : PreferenceSettingsVolumeList.indexOf(Player.AudioSettings.MusicVolume);
}

/**
 * Sets the audio preferences for the player. Redirected to from the main Run function if the player is in the audio
 * settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenAudioRun() {
	DrawCharacter(Player, 50, 50, 0.9);
	MainCanvas.textAlign = "left";
	DrawText(TextGet("AudioPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("AudioVolume"), 800, 225, "Black", "Gray");
	DrawBackNextButton(500, 193, 250, 64, Player.AudioSettings.Volume * 100 + "%", "White", "",
		() => PreferenceSettingsVolumeList[(PreferenceSettingsVolumeIndex + PreferenceSettingsVolumeList.length - 1) % PreferenceSettingsVolumeList.length] * 100 + "%",
		() => PreferenceSettingsVolumeList[(PreferenceSettingsVolumeIndex + 1) % PreferenceSettingsVolumeList.length] * 100 + "%");
	DrawText(TextGet("MusicVolume"), 800, 310, "Black", "Gray");
	DrawBackNextButton(500, 272, 250, 64, Player.AudioSettings.MusicVolume * 100 + "%", "White", "",
		() => PreferenceSettingsVolumeList[(PreferenceSettingsMusicVolumeIndex + PreferenceSettingsVolumeList.length - 1) % PreferenceSettingsVolumeList.length] * 100 + "%",
		() => PreferenceSettingsVolumeList[(PreferenceSettingsMusicVolumeIndex + 1) % PreferenceSettingsVolumeList.length] * 100 + "%");
	DrawCheckbox(500, 352, 64, 64, TextGet("AudioPlayBeeps"), Player.AudioSettings.PlayBeeps);
	DrawCheckbox(500, 432, 64, 64, TextGet("AudioPlayItem"), Player.AudioSettings.PlayItem);
	DrawCheckbox(500, 512, 64, 64, TextGet("AudioPlayItemPlayerOnly"), Player.AudioSettings.PlayItemPlayerOnly);
	DrawCheckbox(500, 592, 64, 64, TextGet("AudioNotifications"), Player.AudioSettings.Notifications);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
}

/**
 * Handles click events for the audio preference settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenAudioClick() {

	// If the user clicked the exit icon to return to the main screen
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenExit();

	// Volume increase/decrease control
	if (MouseIn(500, 193, 250, 64)) {
		if (MouseX <= 625) PreferenceSettingsVolumeIndex = (PreferenceSettingsVolumeList.length + PreferenceSettingsVolumeIndex - 1) % PreferenceSettingsVolumeList.length;
		else PreferenceSettingsVolumeIndex = (PreferenceSettingsVolumeIndex + 1) % PreferenceSettingsVolumeList.length;
		Player.AudioSettings.Volume = PreferenceSettingsVolumeList[PreferenceSettingsVolumeIndex];
	}

	// Music volume increase/decrease control
	if (MouseIn(500, 272, 250, 64)) {
		if (MouseX <= 625) {
			PreferenceSettingsMusicVolumeIndex = (PreferenceSettingsVolumeList.length + PreferenceSettingsMusicVolumeIndex - 1) % PreferenceSettingsVolumeList.length;
		} else {
			PreferenceSettingsMusicVolumeIndex = (PreferenceSettingsMusicVolumeIndex + 1) % PreferenceSettingsVolumeList.length;
		}
		Player.AudioSettings.MusicVolume = PreferenceSettingsVolumeList[PreferenceSettingsMusicVolumeIndex];
		if ((ChatAdminRoomCustomizationMusic != null) && (ChatAdminRoomCustomizationMusic.src != null)) {
			ChatAdminRoomCustomizationPlayMusic(ChatAdminRoomCustomizationMusic.src);
			if (Player.AudioSettings.MusicVolume > 0)
				ChatAdminRoomCustomizationMusic.volume = Math.min(Player.AudioSettings.MusicVolume, 1) * 0.25;
		}
	}

	// Individual audio check-boxes
	if (MouseXIn(500, 64)) {
		if (MouseYIn(352, 64)) Player.AudioSettings.PlayBeeps = !Player.AudioSettings.PlayBeeps;
		if (MouseYIn(432, 64)) Player.AudioSettings.PlayItem = !Player.AudioSettings.PlayItem;
		if (MouseYIn(512, 64)) Player.AudioSettings.PlayItemPlayerOnly = !Player.AudioSettings.PlayItemPlayerOnly;
		if (MouseYIn(592, 64)) Player.AudioSettings.Notifications = !Player.AudioSettings.Notifications;
	}
}

/**
 * Exits the preference screen.
 */
function PreferenceSubscreenAudioExit() {
	return true;
}

function PreferenceSubscreenAudioUnload() {
	// If audio has been disabled for notifications, disable each individual notification audio setting
	if (!Player.AudioSettings.Notifications) {
		for (const setting in Player.NotificationSettings) {
			let audio = Player.NotificationSettings[setting]?.Audio;
			if (typeof audio === 'number' && audio > 0) Player.NotificationSettings[setting].Audio = NotificationAudioType.NONE;
		}
	}
}
