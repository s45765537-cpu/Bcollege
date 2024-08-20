"use strict";

/**
 * Sets the online preferences for the player. Redirected to from the main Run function if the player is in the online
 * settings subscreen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenOnlineRun() {
	MainCanvas.textAlign = "left";
	DrawText(TextGet("OnlinePreferences"), 500, 125, "Black", "Gray");
	DrawCheckbox(500, 172, 64, 64, TextGet("AutoBanBlackList"), Player.OnlineSettings.AutoBanBlackList);
	DrawCheckbox(500, 255, 64, 64, TextGet("AutoBanGhostList"), Player.OnlineSettings.AutoBanGhostList);
	DrawCheckbox(500, 335, 64, 64, TextGet("SearchShowsFullRooms"), Player.OnlineSettings.SearchShowsFullRooms);
	DrawCheckbox(500, 415, 64, 64, TextGet("SearchFriendsFirst"), Player.OnlineSettings.SearchFriendsFirst);
	DrawCheckbox(500, 495, 64, 64, TextGet("DisableAnimations"), Player.OnlineSettings.DisableAnimations);
	DrawCheckbox(500, 575, 64, 64, TextGet("EnableAfkTimer"), Player.OnlineSettings.EnableAfkTimer);
	DrawCheckbox(500, 655, 64, 64, TextGet("AllowFullWardrobeAccess"), Player.OnlineSharedSettings.AllowFullWardrobeAccess);
	DrawCheckbox(500, 735, 64, 64, TextGet("BlockBodyCosplay"), Player.OnlineSharedSettings.BlockBodyCosplay);
	DrawCheckbox(1300, 172, 64, 64, TextGet("ShowStatus"), Player.OnlineSettings.ShowStatus);
	DrawCheckbox(1300, 255, 64, 64, TextGet("SendStatus"), Player.OnlineSettings.SendStatus);
	DrawText(TextGet("RoomCustomizationLabel"), 500, 840, "Black", "Gray");
	MainCanvas.textAlign = "center";
	DrawButton(850, 808, 350, 64, TextGet("RoomCustomizationLevel" + Player.OnlineSettings.ShowRoomCustomization.toString()), "White");
	MainCanvas.textAlign = "left";
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	DrawCharacter(Player, 50, 50, 0.9);
	MainCanvas.textAlign = "center";
}

/**
 * Handles the click events for the online settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenOnlineClick() {
	const OnlineSettings = Player.OnlineSettings;
	const OnlineSharedSettings = Player.OnlineSharedSettings;
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreen = "";
	else if (MouseIn(500, 175, 64, 64)) OnlineSettings.AutoBanBlackList = !OnlineSettings.AutoBanBlackList;
	else if (MouseIn(500, 255, 64, 64)) OnlineSettings.AutoBanGhostList = !OnlineSettings.AutoBanGhostList;
	else if (MouseIn(500, 335, 64, 64)) OnlineSettings.SearchShowsFullRooms = !OnlineSettings.SearchShowsFullRooms;
	else if (MouseIn(500, 415, 64, 64)) OnlineSettings.SearchFriendsFirst = !OnlineSettings.SearchFriendsFirst;
	else if (MouseIn(500, 495, 64, 64)) OnlineSettings.DisableAnimations = !OnlineSettings.DisableAnimations;
	else if (MouseIn(500, 575, 64, 64)) {
		OnlineSettings.EnableAfkTimer = !OnlineSettings.EnableAfkTimer;
		AfkTimerSetEnabled(OnlineSettings.EnableAfkTimer);
	}
	else if (MouseIn(500, 655, 64, 64)) OnlineSharedSettings.AllowFullWardrobeAccess = !OnlineSharedSettings.AllowFullWardrobeAccess;
	else if (MouseIn(500, 735, 64, 64)) OnlineSharedSettings.BlockBodyCosplay = !OnlineSharedSettings.BlockBodyCosplay;
	else if (MouseIn(850, 808, 350, 64)) {
		Player.OnlineSettings.ShowRoomCustomization++;
		if (Player.OnlineSettings.ShowRoomCustomization > 3) Player.OnlineSettings.ShowRoomCustomization = 0;
	}
	else if (MouseIn(1300, 175, 64, 64)) OnlineSettings.ShowStatus = !OnlineSettings.ShowStatus;
	else if (MouseIn(1300, 255, 64, 64)) OnlineSettings.SendStatus = !OnlineSettings.SendStatus;
}
