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


/** @type {{label: string, check: () => boolean, click: () => void}[]} */
const PreferenceSubscreenChatCheckboxes = [
	{ label: "ColorNames", check: () => Player.ChatSettings.ColorNames, click: () => Player.ChatSettings.ColorNames = !Player.ChatSettings.ColorNames },
	{ label: "ColorActions", check: () => Player.ChatSettings.ColorActions, click: () => Player.ChatSettings.ColorActions = !Player.ChatSettings.ColorActions },
	{ label: "ColorEmotes", check: () => Player.ChatSettings.ColorEmotes, click: () => Player.ChatSettings.ColorEmotes = !Player.ChatSettings.ColorEmotes },
	{ label: "ShowActivities", check: () => Player.ChatSettings.ShowActivities, click: () => Player.ChatSettings.ShowActivities = !Player.ChatSettings.ShowActivities },
	{ label: "PreserveWhitespace", check: () => Player.ChatSettings.WhiteSpace == "Preserve", click: () => Player.ChatSettings.WhiteSpace = Player.ChatSettings.WhiteSpace == "Preserve" ? "" : "Preserve" },
	{ label: "ColorActivities", check: () => Player.ChatSettings.ColorActivities, click: () => Player.ChatSettings.ColorActivities = !Player.ChatSettings.ColorActivities },
	{ label: "ShrinkNonDialogue", check: () => Player.ChatSettings.ShrinkNonDialogue, click: () => Player.ChatSettings.ShrinkNonDialogue = !Player.ChatSettings.ShrinkNonDialogue },
	{ label: "MuStylePoses", check: () => Player.ChatSettings.MuStylePoses, click: () => Player.ChatSettings.MuStylePoses = !Player.ChatSettings.MuStylePoses },
	{ label: "DisplayTimestamps", check: () => Player.ChatSettings.DisplayTimestamps, click: () => Player.ChatSettings.DisplayTimestamps = !Player.ChatSettings.DisplayTimestamps },
	{ label: "ShowChatRoomHelp", check: () => Player.ChatSettings.ShowChatHelp, click: () => Player.ChatSettings.ShowChatHelp = !Player.ChatSettings.ShowChatHelp },
	{
		label: "PreserveChat",
		check: () => Player.ChatSettings.PreserveChat,
		click: () => {
			Player.ChatSettings.PreserveChat = !Player.ChatSettings.PreserveChat;
			const roomSeps = /** @type {HTMLDivElement[]} */(Array.from(document.querySelectorAll("#TextAreaChatLog .chat-room-sep")));
			if (Player.ChatSettings.PreserveChat) {
				roomSeps.forEach(e => e.style.display = "");
			}
		}
	},
	{ label: "ShowAutomaticMessages", check: () => Player.ChatSettings.ShowAutomaticMessages, click: () => Player.ChatSettings.ShowAutomaticMessages = !Player.ChatSettings.ShowAutomaticMessages },
	{ label: "ShowBeepChat", check: () => Player.ChatSettings.ShowBeepChat, click: () => Player.ChatSettings.ShowBeepChat = !Player.ChatSettings.ShowBeepChat },
	{ label: "OOCAutoClose", check: () => Player.ChatSettings.OOCAutoClose, click: () => Player.ChatSettings.OOCAutoClose = !Player.ChatSettings.OOCAutoClose },
];

/** @type {CommonGenerateGridParameters} */
const PreferenceSubscreenChatCheckboxGrid = {
	x: 500,
	y: 360,
	width: 1400,
	height: 500,
	itemWidth: 700,
	itemHeight: 64,
	itemMarginY: 8,
	direction: "vertical",
};

/**
 * Sets the chat preferences for the player. Redirected to from the main Run function if the player is in the chat
 * settings subscreen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenChatRun() {
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");

	MainCanvas.textAlign = "center";
	// PreferencePageChangeDraw(1595, 75, 2);

	MainCanvas.textAlign = "left";
	DrawText(TextGet("ChatPreferences"), 500, 125, "Black", "Gray");

	DrawText(TextGet("ColorTheme"), 500, 210, "Black", "Gray");
	PreferenceDrawBackNextButton(680, 180, 350, 60, PreferenceChatColorThemeList, PreferenceChatColorThemeIndex);
	DrawText(TextGet("FontSize"), 500, 300, "Black", "Gray");
	PreferenceDrawBackNextButton(680, 270, 350, 60, PreferenceChatFontSizeList, PreferenceChatFontSizeIndex);

	DrawText(TextGet("EnterLeaveStyle"), 1090, 210, "Black", "Gray");
	PreferenceDrawBackNextButton(1550, 180, 350, 60, PreferenceChatEnterLeaveList, PreferenceChatEnterLeaveIndex);
	DrawText(TextGet("DisplayMemberNumbers"), 1090, 300, "Black", "Gray");
	PreferenceDrawBackNextButton(1550, 270, 350, 60, PreferenceChatMemberNumbersList, PreferenceChatMemberNumbersIndex);

	CommonGenerateGrid(PreferenceSubscreenChatCheckboxes, 0, PreferenceSubscreenChatCheckboxGrid, (item, x, y) => {
		const { label, check } = item;
		DrawCheckbox(x, y, 64, 64, TextGet(label), check());
		return false;
	});

	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Handles the click events for the chat settings of a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenChatClick() {
	// If the user clicked the exit icon to return to the main screen
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenExit();

	// PreferencePageChangeClick(1595, 75, 2);

	if (MouseIn(680, 180, 350, 60)) {
		if (MouseX <= 680 + 350 / 2) PreferenceChatColorThemeIndex = PreferenceGetPreviousIndex(PreferenceChatColorThemeList, PreferenceChatColorThemeIndex);
		else PreferenceChatColorThemeIndex = PreferenceGetNextIndex(PreferenceChatColorThemeList, PreferenceChatColorThemeIndex);
		Player.ChatSettings.ColorTheme = PreferenceChatColorThemeList[PreferenceChatColorThemeIndex];
	}
	if (MouseIn(680, 270, 350, 60)) {
		if (MouseX <= 680 + 350 / 2) PreferenceChatFontSizeIndex = PreferenceGetPreviousIndex(PreferenceChatFontSizeList, PreferenceChatFontSizeIndex);
		else PreferenceChatFontSizeIndex = PreferenceGetNextIndex(PreferenceChatFontSizeList, PreferenceChatFontSizeIndex);
		Player.ChatSettings.FontSize = PreferenceChatFontSizeList[PreferenceChatFontSizeIndex];
		ChatRoomRefreshFontSize();
	}
	if (MouseIn(1550, 180, 350, 60)) {
		if (MouseX <= 1550 + 350 / 2) PreferenceChatEnterLeaveIndex = PreferenceGetPreviousIndex(PreferenceChatEnterLeaveList, PreferenceChatEnterLeaveIndex);
		else PreferenceChatEnterLeaveIndex = PreferenceGetNextIndex(PreferenceChatEnterLeaveList, PreferenceChatEnterLeaveIndex);
		Player.ChatSettings.EnterLeave = PreferenceChatEnterLeaveList[PreferenceChatEnterLeaveIndex];
	}
	if (MouseIn(1550, 270, 350, 60)) {
		if (MouseX <= 1550 + 350 / 2) PreferenceChatMemberNumbersIndex = PreferenceGetPreviousIndex(PreferenceChatMemberNumbersList, PreferenceChatMemberNumbersIndex);
		else PreferenceChatMemberNumbersIndex = PreferenceGetNextIndex(PreferenceChatMemberNumbersList, PreferenceChatMemberNumbersIndex);
		Player.ChatSettings.MemberNumbers = PreferenceChatMemberNumbersList[PreferenceChatMemberNumbersIndex];
	}

	CommonGenerateGrid(PreferenceSubscreenChatCheckboxes, 0, PreferenceSubscreenChatCheckboxGrid, (item, x, y, w, h) => {
		const { click } = item;
		if (MouseIn(x, y, w, h)) {
			click();
			return true;
		}
		return false;
	});
}

/**
 * Exits the preference screen
 */
function PreferenceSubscreenChatExit() {
	return true;
}
