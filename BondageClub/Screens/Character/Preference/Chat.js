"use strict";

/** @type {ChatColorThemeType[]} */
var PreferenceChatColorThemeList = ["Light", "Dark", "Light2", "Dark2"];
var PreferenceChatColorThemeIndex = 0;
/** @type {ChatEnterLeaveType[]} */
var PreferenceChatEnterLeaveList = ["Normal", "Smaller", "Hidden"];
var PreferenceChatEnterLeaveIndex = 0;
/** @type {ChatMemberNumbersType[]} */
var PreferenceChatMemberNumbersList = ["Always", "Never", "OnMouseover"];
var PreferenceChatMemberNumbersIndex = 0;
/** @type {ChatFontSizeType[]} */
var PreferenceChatFontSizeList = ["Small", "Medium", "Large"];
var PreferenceChatFontSizeIndex = 1;
var PreferenceChatPageIndex = 0;
var PreferenceChatPageList = [0, 1];

function PreferenceSubscreenChatLoad() {
	PreferenceChatColorThemeIndex = (PreferenceChatColorThemeList.indexOf(Player.ChatSettings.ColorTheme) < 0) ? 0 : PreferenceChatColorThemeList.indexOf(Player.ChatSettings.ColorTheme);
	PreferenceChatEnterLeaveIndex = (PreferenceChatEnterLeaveList.indexOf(Player.ChatSettings.EnterLeave) < 0) ? 0 : PreferenceChatEnterLeaveList.indexOf(Player.ChatSettings.EnterLeave);
	PreferenceChatMemberNumbersIndex = (PreferenceChatMemberNumbersList.indexOf(Player.ChatSettings.MemberNumbers) < 0) ? 0 : PreferenceChatMemberNumbersList.indexOf(Player.ChatSettings.MemberNumbers);
	PreferenceChatFontSizeIndex = (PreferenceChatFontSizeList.indexOf(Player.ChatSettings.FontSize)) < 0 ? 1 : PreferenceChatFontSizeList.indexOf(Player.ChatSettings.FontSize);
}

/**
 * Sets the chat preferences for the player. Redirected to from the main Run function if the player is in the chat
 * settings subscreen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenChatRun() {
	MainCanvas.textAlign = "left";
	DrawText(TextGet("ChatPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("ColorTheme"), 500, 200, "Black", "Gray");
	DrawText(TextGet("EnterLeaveStyle"), 500, 280, "Black", "Gray");
	DrawText(TextGet("DisplayMemberNumbers"), 500, 360, "Black", "Gray");
	DrawText(TextGet("FontSize"), 500, 440, "Black", "Gray");

	switch (PreferenceChatPageIndex) {
		case 0:
			DrawCheckbox(500, 572, 64, 64, TextGet("ColorNames"), Player.ChatSettings.ColorNames);
			DrawCheckbox(500, 652, 64, 64, TextGet("ColorActions"), Player.ChatSettings.ColorActions);
			DrawCheckbox(500, 732, 64, 64, TextGet("ColorEmotes"), Player.ChatSettings.ColorEmotes);
			DrawCheckbox(500, 812, 64, 64, TextGet("ShowActivities"), Player.ChatSettings.ShowActivities);
			DrawCheckbox(1200, 572, 64, 64, TextGet("PreserveWhitespace"), Player.ChatSettings.WhiteSpace == "Preserve");
			DrawCheckbox(1200, 652, 64, 64, TextGet("ColorActivities"), Player.ChatSettings.ColorActivities);
			DrawCheckbox(1200, 732, 64, 64, TextGet("ShrinkNonDialogue"), Player.ChatSettings.ShrinkNonDialogue);
			DrawCheckbox(1200, 812, 64, 64, TextGet("MuStylePoses"), Player.ChatSettings.MuStylePoses);
			break;
		case 1:
			DrawCheckbox(500, 572, 64, 64, TextGet("DisplayTimestamps"), Player.ChatSettings.DisplayTimestamps);
			DrawCheckbox(500, 652, 64, 64, TextGet("ShowChatRoomHelp"), Player.ChatSettings.ShowChatHelp);
			DrawCheckbox(500, 732, 64, 64, TextGet("PreserveChat"), Player.ChatSettings.PreserveChat);
			DrawCheckbox(1200, 572, 64, 64, TextGet("ShowAutomaticMessages"), Player.ChatSettings.ShowAutomaticMessages);
			DrawCheckbox(1200, 652, 64, 64, TextGet("ShowBeepChat"), Player.ChatSettings.ShowBeepChat);
			DrawCheckbox(1200 ,732, 64, 64, TextGet("OOCAutoClose"), Player.ChatSettings.OOCAutoClose);
			break;
	}

	PreferenceDrawBackNextButton(1000, 170, 350, 60, PreferenceChatColorThemeList, PreferenceChatColorThemeIndex);
	PreferenceDrawBackNextButton(1000, 250, 350, 60, PreferenceChatEnterLeaveList, PreferenceChatEnterLeaveIndex);
	PreferenceDrawBackNextButton(1000, 330, 350, 60, PreferenceChatMemberNumbersList, PreferenceChatMemberNumbersIndex);
	PreferenceDrawBackNextButton(1000, 410, 350, 60, PreferenceChatFontSizeList, PreferenceChatFontSizeIndex);
	PreferenceDrawBackNextButton(1000, 490, 350, 60, PreferenceChatPageList.map(i => `ChatSettingsPage${i}`), PreferenceChatPageIndex);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Handles the click events for the chat settings of a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenChatClick() {
	// If the user clicked one of the check-boxes
	switch (PreferenceChatPageIndex) {
		case 0:
			if (MouseXIn(500, 64)) {
				if (MouseYIn(572, 64)) Player.ChatSettings.ColorNames = !Player.ChatSettings.ColorNames;
				if (MouseYIn(652, 64)) Player.ChatSettings.ColorActions = !Player.ChatSettings.ColorActions;
				if (MouseYIn(732, 64)) Player.ChatSettings.ColorEmotes = !Player.ChatSettings.ColorEmotes;
				if (MouseYIn(812, 64)) Player.ChatSettings.ShowActivities = !Player.ChatSettings.ShowActivities;
			} else if (MouseXIn(1200, 64)) {
				if (MouseYIn(572, 64)) Player.ChatSettings.WhiteSpace = Player.ChatSettings.WhiteSpace == "Preserve" ? "" : "Preserve";
				if (MouseYIn(652, 64)) Player.ChatSettings.ColorActivities = !Player.ChatSettings.ColorActivities;
				if (MouseYIn(732, 64)) Player.ChatSettings.ShrinkNonDialogue = !Player.ChatSettings.ShrinkNonDialogue;
				if (MouseYIn(812, 64)) Player.ChatSettings.MuStylePoses = !Player.ChatSettings.MuStylePoses;
			}
			break;
		case 1:
			if (MouseXIn(500, 64)) {
				if (MouseYIn(572, 64)) Player.ChatSettings.DisplayTimestamps = !Player.ChatSettings.DisplayTimestamps;
				if (MouseYIn(652, 64)) Player.ChatSettings.ShowChatHelp = !Player.ChatSettings.ShowChatHelp;
				if (MouseYIn(732, 64)) {
					// Make the room separator visible upon enabling `PreserveChat`
					Player.ChatSettings.PreserveChat = !Player.ChatSettings.PreserveChat;
					const roomSeps = /** @type {HTMLDivElement[]} */(Array.from(document.querySelectorAll("#TextAreaChatLog .chat-room-sep")));
					if (Player.ChatSettings.PreserveChat) {
						roomSeps.forEach(e => e.style.display = "");
					}
				}
			} else if (MouseXIn(1200, 64)) {
				if (MouseYIn(572, 64)) Player.ChatSettings.ShowAutomaticMessages = !Player.ChatSettings.ShowAutomaticMessages;
				if (MouseYIn(652, 64)) Player.ChatSettings.ShowBeepChat = !Player.ChatSettings.ShowBeepChat;
				if (MouseYIn(732, 64)) Player.ChatSettings.OOCAutoClose = !Player.ChatSettings.OOCAutoClose;
			}
			break;
	}

	// If the user used one of the BackNextButtons
	if (MouseIn(1000, 170, 350, 60)) {
		if (MouseX <= 1175) PreferenceChatColorThemeIndex = PreferenceGetPreviousIndex(PreferenceChatColorThemeList, PreferenceChatColorThemeIndex);
		else PreferenceChatColorThemeIndex = PreferenceGetNextIndex(PreferenceChatColorThemeList, PreferenceChatColorThemeIndex);
		Player.ChatSettings.ColorTheme = PreferenceChatColorThemeList[PreferenceChatColorThemeIndex];
	}
	if (MouseIn(1000, 250, 350, 60)) {
		if (MouseX <= 1175) PreferenceChatEnterLeaveIndex = PreferenceGetPreviousIndex(PreferenceChatEnterLeaveList, PreferenceChatEnterLeaveIndex);
		else PreferenceChatEnterLeaveIndex = PreferenceGetNextIndex(PreferenceChatEnterLeaveList, PreferenceChatEnterLeaveIndex);
		Player.ChatSettings.EnterLeave = PreferenceChatEnterLeaveList[PreferenceChatEnterLeaveIndex];
	}
	if (MouseIn(1000, 330, 350, 60)) {
		if (MouseX <= 1175) PreferenceChatMemberNumbersIndex = PreferenceGetPreviousIndex(PreferenceChatMemberNumbersList, PreferenceChatMemberNumbersIndex);
		else PreferenceChatMemberNumbersIndex = PreferenceGetNextIndex(PreferenceChatMemberNumbersList, PreferenceChatMemberNumbersIndex);
		Player.ChatSettings.MemberNumbers = PreferenceChatMemberNumbersList[PreferenceChatMemberNumbersIndex];
	}

	if (MouseIn(1000, 410, 350, 60)) {
		if (MouseX <= 1175) PreferenceChatFontSizeIndex = PreferenceGetPreviousIndex(PreferenceChatFontSizeList, PreferenceChatFontSizeIndex);
		else PreferenceChatFontSizeIndex = PreferenceGetNextIndex(PreferenceChatFontSizeList, PreferenceChatFontSizeIndex);
		Player.ChatSettings.FontSize = PreferenceChatFontSizeList[PreferenceChatFontSizeIndex];
		ChatRoomRefreshFontSize();
	}

	if (MouseIn(1000, 490, 350, 60)) {
		if (MouseX <= 1175) PreferenceChatPageIndex = PreferenceGetPreviousIndex(PreferenceChatPageList, PreferenceChatPageIndex);
		else PreferenceChatPageIndex = PreferenceGetNextIndex(PreferenceChatPageList, PreferenceChatPageIndex);
	}

	// If the user clicked the exit icon to return to the main screen
	if (MouseIn(1815, 75,90,90)) PreferenceSubscreenChatExit();

}

/**
 * Exits the preference screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenChatExit() {
	PreferenceSubscreen = "";
}
