"use strict";

/**
 * @file This file handles the chat lobby search & filter screen
 */

/** Background image */
var ChatSearchBackground = "Introduction";
/** @type {ChatRoomSearchResult[]} */
var ChatSearchResult = [];
/** @type {ChatRoomSearchResult[]} */
var ChatSearchHiddenResult = [];
/** @type {ServerChatRoomSearchRequest | null} */
var ChatSearchLastSearchDataJSON = null;
var ChatSearchLastQuerySearchTime = 0;
var ChatSearchLastQueryJoin = "";
var ChatSearchLastQueryJoinTime = 0;
var ChatSearchResultOffset = 0;
/** The room grid's left offset */
var ChatSearchPageX = 25;
/** The room grid's top offset */
var ChatSearchPageY = 135;
/**
 * Layout parameters for the room grid
 * @type {CommonGenerateGridParameters}
 */
var ChatSearchListParams = {
	x: ChatSearchPageX,
	y: ChatSearchPageY,
	width: MainCanvasWidth - 2 * ChatSearchPageX,
	height: 679,
	itemWidth: 630,
	itemHeight: 85,
	minMarginY: 24,
};
/** Pre-calculated. Must be updated if you change the grid parameters */
var ChatSearchRoomsPerPage = 21;
var ChatSearchMessage = "";
var ChatSearchLeaveRoom = "MainHall";
/** @type {ModuleType} */
var ChatSearchLeaveSpace = "Room";
/** @type {null | Item[]} */
var ChatSearchSafewordAppearance = null;
/** @type {null | Partial<Record<AssetPoseCategory, AssetPoseName>>} */
var ChatSearchSafewordPose = null;
/** @type {null | Partial<Record<AssetPoseCategory, AssetPoseName>>} */
var ChatSearchPreviousActivePose = null;
/** @type {number[]} */
var ChatSearchTempHiddenRooms = [];
/** @type {"" | "Filter"} */
var ChatSearchMode = "";
var ChatSearchGhostPlayerOnClickActive = false;
var ChatSearchShowHiddenRoomsActive = false;
var ChatSearchFilterHelpActive = false;
/** @type {null | { Index: number, RoomLabel: string, MemberLabel: string, WordsLabel: string }} */
var ChatSearchFilterUnhideConfirm = null;
var ChatSearchRejoinIncrement = 1;
/** @type {null | string} */
var ChatSearchReturnToScreen = null;
/** @type {"" | ServerChatRoomLanguage} */
var ChatSearchLanguage = "";
/** @type {"" | ServerChatRoomLanguage} */
var ChatSearchLanguageTemp = "";
var ChatSearchFilterTermsTemp = "";
var ChatSearchRoomSpaces = ["MIXED", "FEMALE_ONLY", "MALE_ONLY"];
var ChatSearchCurrentRoomSpaceIndex = 0;

/**
 * Loads the chat search screen properties, creates the inputs and loads up the first 24 rooms.
 * @type {ScreenFunctions["Load"]}
 */
function ChatSearchLoad() {
	ChatRoomCustomizationClear();
	ChatRoomActivateView(ChatRoomCharacterViewName);
	ChatRoomMapViewEditMode = "";
	ChatRoomMapViewEditBackup = [];
	delete Player.MapData;
	if (ChatSearchReturnToScreen != null) {
		CommonSetScreen("Room", ChatSearchReturnToScreen);
		ChatSearchReturnToScreen = null;
		return;
	}
	CurrentDarkFactor = 0.5;
	if (ChatSearchLeaveRoom == "MainHall") {
		ChatRoomGame = "";
		OnlineGameReset();
	}
	if (ChatSearchSafewordAppearance == null) {
		ChatSearchSafewordAppearance = Player.Appearance.slice(0);
		ChatSearchSafewordPose = Player.ActivePoseMapping;
	}
	AsylumGGTSIntroDone = false;
	AsylumGGTSTask = null;
	AsylumGGTSPreviousPose = { ...Player.PoseMapping };
	Player.ArousalSettings.OrgasmCount = 0;
	ElementCreateSearchInput("InputSearch", () => {
		const rooms = ChatSearchShowHiddenRoomsActive ? ChatSearchHiddenResult : ChatSearchResult;
		return rooms.map(i => i.DisplayName).sort();
	}, { maxLength: 200 });
	ChatSearchQuery();
	ChatSearchMessage = "";
	ChatRoomNotificationReset();
	ChatSearchRejoinIncrement = 1;
	TextPrefetch("Character", "FriendList");
	TextPrefetch("Online", "ChatAdmin");
	TextPrefetch("Online", "ChatRoom");
}

/** @type {ScreenFunctions["Unload"]} */
function ChatSearchUnload() {
	ElementRemove("InputSearch");
	ChatRoomStimulationMessage("Walk");
}

/**
 * When the chat Search screen runs, draws the screen
 * @type {ScreenFunctions["Run"]}
 */
function ChatSearchRun() {

	// Calls the other screens that could trigger
	KidnapLeagueResetOnlineBountyProgress();
	PandoraPenitentiaryCreate();

	// Draw special screens that hide everything else
	if (ChatSearchFilterHelpActive) return ChatSearchFilterHelpDraw();
	if (ChatSearchFilterUnhideConfirm) return ChatSearchFilterUnhideConfirmDraw();

	// Draw list of rooms depending on the current view
	if (ChatSearchMode == "") {
		ChatSearchNormalDraw();
		ElementSetAttribute("InputSearch", "placeholder", TextGet("EnterName"));
	}
	else if (ChatSearchMode == "Filter") {
		ChatSearchPermissionDraw();
		ElementSetAttribute("InputSearch", "placeholder", TextGet("FilterExcludeTerms"));
	}

	// Draw the back/next buttons if it is needed
	const Result = ChatSearchShowHiddenRoomsActive ? ChatSearchHiddenResult : ChatSearchResult;
	if (Result.length > ChatSearchRoomsPerPage) {
		DrawButton(1035, 25, 90, 90, "", "White", "Icons/Prev.png", TextGet("Prev"));
		DrawButton(1225, 25, 90, 90, "", "White", "Icons/Next.png", TextGet("Next"));
	}

	// Hidden rooms view only shows a back button
	if (ChatSearchShowHiddenRoomsActive) {
		DrawButton(1885, 25, 90, 90, "", "White", "Icons/DialogNormalMode.png", TextGet("NormalFilterMode"));
		return;
	}

	// Draw the bars for the normal mode and the filter mode when not in the hidden rooms view
	ElementPositionFixed("InputSearch", 25, 45, 620);

	DrawTextFit(ChatSearchMessage != "" ? TextGet(ChatSearchMessage) : "", 1000, 935, 490, "White", "Gray");

	let ChatSearchPageCount = Math.floor((Result.length + ChatSearchRoomsPerPage - 1) / ChatSearchRoomsPerPage).toString();
	let ChatSearchCurrentPage = (ChatSearchResultOffset / ChatSearchRoomsPerPage + 1).toString();
	DrawTextFit(`${ChatSearchCurrentPage}/${ChatSearchPageCount}`, 1175, 75, 90, "White", "Gray");

	DrawButton(905, 25, 90, 90, "", ChatSearchMode != "Filter" ? "White" : "Lime", "Icons/Private.png", TextGet(ChatSearchMode != "Filter" ? "FilterMode" : "NormalMode"));

	// FIXME: technically the `TextGet` is only needed for the "All language" cases,
	// but we also support Spanish as a room language which isn't actually in the translation files
	const languageLabel = TranslationGetLanguageName(ChatSearchLanguageTemp, true) || TextGet("Language" + ChatSearchLanguageTemp);
	DrawButton(25, 898, 350, 64, languageLabel, "White");
	DrawButton(685, 25, 90, 90, "", "White", "Icons/Accept.png", ChatSearchMode == "" ? TextGet("SearchRoom") : TextGet("ApplyFilter"));
	DrawButton(795, 25, 90, 90, "", "White", "Icons/Cancel.png", ChatSearchMode == "" ? TextGet("ClearFilter") : TextGet("LoadFilter"));

	if (ChatSearchMode == "") {
		DrawButton(1665, 25, 90, 90, "", "White", "Icons/Plus.png", TextGet("CreateRoom"));
		DrawButton(1775, 25, 90, 90, "", "White", "Icons/FriendList.png", TextGet("FriendList"));
		DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png", TextGet("Exit"));
	} else {
		DrawButton(1555, 25, 90, 90, "", !ChatSearchGhostPlayerOnClickActive ? "Lime" : "White", "Icons/Trash.png", TextGet("TempHideOnClick"));
		DrawButton(1665, 25, 90, 90, "", ChatSearchGhostPlayerOnClickActive ? "Lime" : "White", "Icons/GhostList.png", TextGet("GhostPlayerOnClick"));
		DrawButton(1775, 25, 90, 90, "", "White", "Icons/InspectLock.png", TextGet("ShowHiddenRooms"));
		DrawButton(1885, 25, 90, 90, "", "White", "Icons/Question.png", TextGet("Help"));
	}

	ChatSearchRoomSpaceSelectDraw();
}

/**
 * Handles the click events on the chat search screen. Is called from CommonClick()
 * @type {ScreenFunctions["Click"]}
 */
function ChatSearchClick() {
	if (ChatSearchFilterUnhideConfirm) {
		if (MouseIn(620, 898, 280, 64)) {
			ChatSearchFilterUnhideConfirm = null;
		}
		if (MouseIn(1100, 898, 280, 64)) {
			ChatSearchClickUnhideRoom(ChatSearchFilterUnhideConfirm.Index, true);
			ChatSearchFilterUnhideConfirm = null;
		}
		return;
	}

	// Handle clicks on the room list
	if ((MouseX >= ChatSearchPageX) &&
		(MouseX < 1975) &&
		(MouseY >= ChatSearchPageY) &&
		(MouseY < 875)) {
		if (ChatSearchMode == "Filter") ChatSearchClickPermission();
		if (ChatSearchMode == "") ChatSearchJoin();
	}

	// Handle the back button
	if (MouseIn(1035, 25, 90, 90)) {
		ChatSearchResultOffset -= ChatSearchRoomsPerPage;
		if (ChatSearchResultOffset < 0)
			ChatSearchResultOffset = Math.floor(((ChatSearchShowHiddenRoomsActive ? ChatSearchHiddenResult : ChatSearchResult).length - 1) / ChatSearchRoomsPerPage) * ChatSearchRoomsPerPage;
	}

	// Handle the next button
	if (MouseIn(1225, 25, 90, 90)) {
		ChatSearchResultOffset += ChatSearchRoomsPerPage;
		if (ChatSearchResultOffset >= (ChatSearchShowHiddenRoomsActive ? ChatSearchHiddenResult : ChatSearchResult).length)
			ChatSearchResultOffset = 0;
	}

	// Handle back button for hidden rooms view
	if (ChatSearchShowHiddenRoomsActive) {
		if (MouseIn(1885, 25, 90, 90)) ChatSearchToggleHiddenMode();
		return;
	}

	// Handle the bars for the normal mode and the filter mode when not in the hidden rooms view
	if (MouseIn(905, 25, 90, 90)) {
		ChatSearchToggleSearchMode();
		ChatSearchQuery();
	}

	if (MouseIn(25, 898, 350, 64)) {
		let Pos = !ChatSearchLanguageTemp ? 0 : ChatAdminLanguageList.indexOf(ChatSearchLanguageTemp) + 1;
		if (Pos >= ChatAdminLanguageList.length) {
			ChatSearchLanguageTemp = "";
		}
		else {
			ChatSearchLanguageTemp = ChatAdminLanguageList[Pos];
		}

		ChatSearchSaveLanguageFiltering();
		ChatSearchQuery();
	}



	if (ChatSearchMode == "") {
		if (MouseIn(685, 25, 90, 90)) {
			ChatSearchQuery();
		}

		if (MouseIn(795, 25, 90, 90)) {
			ElementValue("InputSearch", "");
			ChatSearchQuery();
		}

		if (MouseIn(1665, 25, 90, 90)) {
			ChatAdminShowCreate();
		}

		if (MouseIn(1775, 25, 90, 90)) {
			ElementRemove("InputSearch");
			FriendListReturn = { Screen: CurrentScreen, Module: CurrentModule };
			CommonSetScreen("Character", "FriendList");
		}

		if (MouseIn(1885, 25, 90, 90)) {
			ChatSearchExit();
		}
	} else {
		if (MouseIn(685, 25, 90, 90)) ChatSearchSaveLanguageAndFilterTerms();
		if (MouseIn(795, 25, 90, 90)) ChatSearchLoadLanguageAndFilterTerms();

		if (MouseIn(1555, 25, 90, 90)) ChatSearchGhostPlayerOnClickActive = false;
		if (MouseIn(1665, 25, 90, 90)) ChatSearchGhostPlayerOnClickActive = true;
		if (MouseIn(1775, 25, 90, 90)) ChatSearchToggleHiddenMode();
		if (MouseIn(1885, 25, 90, 90)) ChatSearchToggleHelpMode();
	}

	ChatSearchRoomSpaceSelectClick();
}

/**
 * Draws buttons and text for selection of room space.
 * @returns {void} - Nothing
 */
function ChatSearchRoomSpaceSelectDraw() {

	let CurrentLobby = undefined;
	switch (ChatRoomSpace) {
		case "X":
			CurrentLobby = "Mixed";
			break;

		case "M":
			CurrentLobby = "Male";
			break;

		case "Asylum":
			CurrentLobby = "Asylum";
			break;

		default:
			CurrentLobby = "Female";
			break;
	}

	DrawTextWrap(TextGet("Lobby") + " " + TextGet(CurrentLobby), 1495, 885, 390, 100, "#FFFFFF");

	if ((ChatSearchRoomSpaces != null) && (ChatSearchRoomSpaces.length >= 2)) {
		DrawButton(1405, 885, 90, 90, "", "White", "Icons/Prev.png", "");
		DrawButton(1885, 885, 90, 90, "", "White", "Icons/Next.png", "");
	}

}

/**
 * Handles clicks on selection of room space.
 * @returns {void} - Nothing
 */
function ChatSearchRoomSpaceSelectClick() {
	const Genders = Player.GetGenders();
	let TempRoomSpaces = ChatSearchRoomSpaces;

	if (Genders.includes("M")) TempRoomSpaces = TempRoomSpaces.filter(space => space != "FEMALE_ONLY");
	if (Genders.includes("F")) TempRoomSpaces = TempRoomSpaces.filter(space => space != "MALE_ONLY");

	let CurrentRoomSpace = Object.keys(ChatRoomSpaceType).find(key => ChatRoomSpaceType[key] == ChatRoomSpace);

	ChatSearchCurrentRoomSpaceIndex = TempRoomSpaces.indexOf(CurrentRoomSpace);

	if ((ChatSearchRoomSpaces != null) && (ChatSearchRoomSpaces.length >= 2) && MouseIn(1405, 885, 90, 90)) {
		ChatSearchCurrentRoomSpaceIndex--;
		if (ChatSearchCurrentRoomSpaceIndex < 0) {
			ChatSearchCurrentRoomSpaceIndex = TempRoomSpaces.length - 1;
		}

		return ChatSelectStartSearch(ChatRoomSpaceType[TempRoomSpaces[ChatSearchCurrentRoomSpaceIndex]]);
	}

	if ((ChatSearchRoomSpaces != null) && (ChatSearchRoomSpaces.length >= 2) && MouseIn(1885, 885, 90, 90)) {
		ChatSearchCurrentRoomSpaceIndex++;
		if (ChatSearchCurrentRoomSpaceIndex >= TempRoomSpaces.length) {
			ChatSearchCurrentRoomSpaceIndex = 0;
		}

		return ChatSelectStartSearch(ChatRoomSpaceType[TempRoomSpaces[ChatSearchCurrentRoomSpaceIndex]]);
	}
}

/**
 * While in normal view, called when player clicks apply or presses enter.
 * Saves the "temp" options into their normal variables, and sends them to the server.
 * @returns {void} - Nothing
 */
function ChatSearchSaveLanguageFiltering() {
	// Save Language option
	if (ChatSearchLanguage != ChatSearchLanguageTemp) {
		ChatSearchLanguage = ChatSearchLanguageTemp;
		ServerAccountUpdate.QueueData({ RoomSearchLanguage: ChatSearchLanguage });
	}
}

/**
 * While in normal view, calls when player clicks revert.
 * Loads the "temp" options from their normal variables.
 * @returns {void} - Nothing
 */
function ChatSearchLoadLanguageFiltering() {
	// Load options from the saved vars into the temp ones
	ChatSearchLanguageTemp = ChatSearchLanguage;
}

/**
 * @returns {boolean} - True if the player changed the options and the apply/revert buttons should show
 */
function ChatSearchChangedLanguageOrFilterTerms() {
	return ChatSearchLanguageTemp != ChatSearchLanguage || ChatSearchFilterTermsTemp != Player.ChatSearchFilterTerms;
}

/**
 * While in filter view, called when player clicks apply, presses enter, or returns to the normal view.
 * Saves the "temp" options into their normal variables, and sends them to the server.
 * Also refreshes the displayed rooms accordingly.
 * @returns {void} - Nothing
 */
function ChatSearchSaveLanguageAndFilterTerms() {
	let changed = false;

	// Save Language option
	if (ChatSearchLanguage != ChatSearchLanguageTemp) {
		ChatSearchLanguage = ChatSearchLanguageTemp;
		ServerAccountUpdate.QueueData({ RoomSearchLanguage: ChatSearchLanguage });
		changed = true;
	}

	// Save Filter Terms option
	if (Player.ChatSearchFilterTerms != ChatSearchFilterTermsTemp) {
		Player.ChatSearchFilterTerms = ChatSearchFilterTermsTemp;
		ServerSend("AccountUpdate", { ChatSearchFilterTerms: Player.ChatSearchFilterTerms });
		changed = true;

		// Re-apply the filter client side immediately - in case searching doesn't update fast enough
		ChatSearchResult.unshift(...ChatSearchHiddenResult);
		ChatSearchApplyFilterTerms();
	}

	// If either/both options changed, refresh the room list
	if (changed)
		ChatSearchQuery();
}

/**
 * While in filter view, calls when player clicks revert.
 * Also called when entering the filter view, so that the values are correct on first load or if they got changed in any other way somehow.
 * Loads the "temp" options from their normal variables, and updates the search box.
 * @returns {void} - Nothing
 */
function ChatSearchLoadLanguageAndFilterTerms() {
	// Load options from the saved vars into the temp ones
	ChatSearchLanguageTemp = ChatSearchLanguage;
	ChatSearchFilterTermsTemp = Player.ChatSearchFilterTerms;
	ElementValue("InputSearch", ChatSearchFilterTermsTemp);
}

/**
 * Handles the key presses while in the chat search screen.
 * When the user presses enter, we launch the search query or save the temp options.
 * @type {KeyboardEventListener}
 */
function ChatSearchKeyDown(event) {
	if (event.repeat) return false;

	if (CommonKey.IsPressed(event, "Enter")) {
		if (ChatSearchMode == "") {
			ChatSearchQuery();
		} else {
			ChatSearchSaveLanguageAndFilterTerms();
		}
		return true;
	}
	return false;
}

/**
 * Handles exiting from the chat search screen, removes the input.
 * @type {ScreenFunctions["Exit"]}
 */
function ChatSearchExit() {
	ChatSearchMode = "";
	ChatSearchShowHiddenRoomsActive = false;
	ChatSearchFilterHelpActive = false;
	ChatSearchFilterUnhideConfirm = null;
	ChatSearchPreviousActivePose = { ...Player.ActivePoseMapping };
	ChatSearchLastSearchDataJSON = null;
	ElementRemove("InputSearch");
	CommonSetScreen(ChatSearchLeaveSpace, ChatSearchLeaveRoom);
	DrawingGetTextSize.clearCache();
}

/**
 * Draws the filter mode help screen: just text and a back button.
 * @returns {void} - Nothing
 */
function ChatSearchFilterHelpDraw() {
	DrawButton(1885, 25, 90, 90, "", "White", "Icons/DialogNormalMode.png", TextGet("CloseHelp"));

	DrawRect(50, 135, 1900, 800, "White");
	DrawEmptyRect(50, 135, 1900, 800, "Black");
	for (let i = 0; i < 7; i++)
		DrawTextWrap(TextGet("HelpText" + (i + 1)), 70, 135 + i * 100, 1860, 70, "Black", undefined, 2);
}

/**
 * Draws the filter mode unhide confirm screen: just text and confirm/cancel buttons.
 * @returns {void} - Nothing
 */
function ChatSearchFilterUnhideConfirmDraw() {
	const UnhideConfirm = ChatSearchFilterUnhideConfirm;
	DrawRect(50, 50, 1900, 800, "White");
	DrawEmptyRect(50, 50, 1900, 800, "Black");
	let y = 150;
	DrawTextWrap(TextGet("UnhideConfirmRoom").replace("{RoomLabel}", UnhideConfirm.RoomLabel), 70, y, 1860, 70, "Black", undefined, 2);
	y += 100;
	if (UnhideConfirm.MemberLabel != "") {
		DrawTextWrap(TextGet("UnhideConfirmMember").replace("{MemberLabel}", UnhideConfirm.MemberLabel), 70, y, 1860, 70, "Black", undefined, 2);
		y += 100;
	}
	if (UnhideConfirm.WordsLabel != "") {
		DrawTextWrap(TextGet("UnhideConfirmWords").replace("{WordsLabel}", UnhideConfirm.WordsLabel), 70, y, 1860, 70, "Black", undefined, 2);
		y += 100;
	}
	DrawTextWrap(TextGet("UnhideConfirmEnd"), 70, y, 1860, 70, "Black", undefined, 2);
	DrawButton(620, 898, 280, 64, TextGet("UnhideCancel"), "White");
	DrawButton(1100, 898, 280, 64, TextGet("UnhideConfirm"), "White");
}

/**
 * Draws the list of rooms in normal mode.
 * @returns {void} - Nothing
 */
function ChatSearchNormalDraw() {

	// If we can show the chat room search result in normal mode
	if (ChatSearchResult.length === 0) {
		DrawText(TextGet("NoChatRoomFound"), 1000, 450, "White", "Gray");
		return;
	}

	CommonGenerateGrid(ChatSearchResult, ChatSearchResultOffset, ChatSearchListParams, (room, x, y, width, height) => {
		const hasFriends = room.Friends.length > 0;
		const isFull = room.MemberCount >= room.MemberLimit;
		const isBlocked = CharacterHasBlockedItem(Player, room.BlockCategory);

		let bgColor;
		if (isBlocked) {
			bgColor = isFull ? "#884444" : "#FF9999";
		} else if (hasFriends) {
			bgColor = isFull ? "#448855" : "#CFFFCF";
		} else {
			bgColor = isFull ? "#666" : "White";
		}

		DrawButton(x, y, width, height, "", bgColor, null, null, isFull);

		let descOffsetX = 315;
		let descWidth = 620;
		const hasMap = room.MapType === "Always" || room.MapType === "Hybrid";
		const icons = [];
		if (ChatRoomDataIsPrivate(room)) {
			icons.push("Icons/Private.png");
		}
		if (ChatRoomDataIsLocked(room)) {
			icons.push("Icons/CheckLocked.png");
		}
		if (hasMap) {
			icons.push(`Icons/MapType${room.MapType}.png`);
		}
		if (icons.length) {
			const iconPadding = 4;
			const iconSize = 36;
			/** @type {CommonGenerateGridParameters} */
			const iconGrid = {
				x: x + iconPadding,
				y: y + iconPadding,
				width: 2 * iconSize,
				height: 2 * iconSize,
				itemWidth: iconSize,
				itemHeight: iconSize,
				itemMarginX: iconPadding,
				itemMarginY: iconPadding,
				direction: "vertical",
			};
			CommonGenerateGrid(icons, 0, iconGrid, (icon, iconX, iconY, iconWidth, iconHeight) => {
				DrawImageResize(icon, iconX, iconY, iconWidth, iconHeight);
				return false;
			});
			descOffsetX += 40;
			descWidth -= 2 * 40; // centered
		}
		const label = `${(hasFriends ? "(" + room.Friends.length + ") " : "")}${ChatSearchMuffle(room.DisplayName)} - ${ChatSearchMuffle(room.Creator)} ${room.MemberCount}/${room.MemberLimit}`;

		DrawTextFit(label, x + descOffsetX, y + 25, descWidth, "black");
		DrawTextFit(ChatSearchMuffle(room.Description), x + descOffsetX, y + 62, descWidth, "black");

		if (!CommonIsMobile && MouseIn(x, y, width, height)) {
			// Builds the friend list as hover text
			/** @type {{ text: string; color: string}[]} */
			let blocksText = [];
			if (room.Friends.length > 0) {
				let friendsText = TextGet("FriendsInRoom") + " ";
				friendsText += room.Friends.map(f => `${f.MemberName} (${f.MemberNumber})`).join(", ");
				blocksText.push({ text: friendsText, color: "#FFFF88"});
			}

			// Builds the blocked categories list below it
			if (room.BlockCategory.length > 0) {
				let blockedText = TextGet("Block") + " ";
				blockedText += room.BlockCategory.map(c => TextGet(c)).join(", ");
				blocksText.push({ text: blockedText, color: "#FF9999" });
			}

			// Builds the game box below it
			if (room.Game != "") {
				const gameText = TextGet("GameLabel") + " " + TextGet("Game" + room.Game);
				blocksText.push({ text: gameText, color: "#9999FF"});
			}

			// Determine the hover text starting position to ensure there's enough room
			const hoverHeight = 58;
			const hoverPadding = 4;
			let hoverY = y + ChatSearchListParams.itemHeight + 8;

			if (hoverY + (blocksText.length + 1) * (hoverHeight + hoverPadding) > MainCanvasHeight) {
				// Place the hover group over the item to stop it from going outside the canvas
				hoverY = y - blocksText.length * (hoverHeight + hoverPadding);
			}

			for (const { text, color } of blocksText) {
				const itemY = hoverY; // Copy here to "fix" the value inside the callback
				DrawHoverElements.push(() => DrawTextWrap(text, x, itemY, width, hoverHeight, "Black", color, 1));
				hoverY += hoverHeight + hoverPadding;
			}
		}

		return false;
	});
}

/**
 * Garbles based on immersion settings
 * @param {string} Text - The text to garble
 * @returns {string} - Garbled text
 */
function ChatSearchMuffle(Text) {
	let ret = Text;
	if (Player.ImmersionSettings && Player.ImmersionSettings.ChatRoomMuffle && Player.GetBlindLevel() > 0) {
		ret = SpeechGarbleByGagLevel(Player.GetBlindLevel() * Player.GetBlindLevel(), Text, true);
		if (ret.length == 0)
			return "...";
		return ret;
	}
	return ret;
}

/**
 * Draws the list of rooms in permission mode.
 * @returns {void} - Nothing
 */
function ChatSearchPermissionDraw() {
	if (((ChatSearchShowHiddenRoomsActive ? ChatSearchHiddenResult : ChatSearchResult).length < 1)) {
		DrawText(TextGet("NoChatRoomFound"), 1000, 450, "White", "Gray");
		return;
	}

	const roomList = ChatSearchShowHiddenRoomsActive ? ChatSearchHiddenResult : ChatSearchResult;

	CommonGenerateGrid(roomList, ChatSearchResultOffset, ChatSearchListParams, (room, x, y, width, height) => {
		const Hover = MouseIn(x, y, width, height) && !CommonIsMobile;
		let bgColor;
		if (ChatSearchShowHiddenRoomsActive) {
			bgColor = Hover ? "red" : "pink";
		} else {
			bgColor = Hover ? "green" : "lime";
		}
		// Draw the room rectangle
		DrawRect(x, y, 630, 85, bgColor);
		const label = `${ChatSearchMuffle(room.DisplayName)} - ${ChatSearchMuffle(room.Creator)} (${room.CreatorMemberNumber})`;
		DrawTextFit(label, x + 315, y + 25, 620, "black");
		DrawTextFit(ChatSearchMuffle(room.Description), x + 315, y + 62, 620, "black");

		if (ChatSearchShowHiddenRoomsActive && MouseIn(x, y, width, height)) {
			const filterReasons = ChatSearchGetFilterReasons(room);

			// Determine the hover text starting position to ensure there's enough room
			let hoverHeight = 58;
			let hoverY = y + ChatSearchListParams.itemHeight + 8;

			let reasons = "";
			if (filterReasons.length > 0) {
				reasons += TextGet("FilteredBecause") + " ";
				reasons += filterReasons.map(r => TextGet(`FilterReason${r}`));
			}

			if (reasons !== "") {
				DrawTextWrap(reasons, x, hoverY, width, hoverHeight, "black", "#FFFF88", 1);
				hoverY += hoverHeight;
			}
		}

		return false;
	});
}

/**
 * Handles the clicks related to the chatroom list when in normal mode
 * @returns {void} - Nothing
 */
function ChatSearchJoin() {
	// Scans results
	CommonGenerateGrid(ChatSearchResult, ChatSearchResultOffset, ChatSearchListParams, (room, x, y, width, height) => {
		if (!MouseIn(x, y, width, height)) return false;
		const RoomName = room.Name;
		if (ChatSearchLastQueryJoin != RoomName || (ChatSearchLastQueryJoin == RoomName && ChatSearchLastQueryJoinTime + 1000 < CommonTime())) {
			ChatSearchLastQueryJoinTime = CommonTime();
			ChatSearchLastQueryJoin = RoomName;
			ServerSend("ChatRoomJoin", { Name: RoomName });
		}
		return true;
	});
}

/**
 * Switch the search screen between the normal view and the filter mode which allows hiding of rooms
 * @returns {void} - Nothing
 */
function ChatSearchToggleSearchMode() {
	if (ChatSearchMode == "") {
		ElementSetAttribute("InputSearch", "maxlength", "200");
		ChatSearchLoadLanguageAndFilterTerms();
		ChatSearchSetFilterChangeHandler(true);
		ChatSearchMode = "Filter";
	} else if (ChatSearchMode == "Filter") {
		ChatSearchSetFilterChangeHandler(false);
		ChatSearchSaveLanguageAndFilterTerms();
		ElementValue("InputSearch", "");
		ElementSetAttribute("InputSearch", "maxlength", "20");
		ChatSearchMode = "";
	}
}

/**
 * Switch to the Hidden Rooms view or back again.
 * Correctly handles adding/removing the input box as needed.
 * @returns {void} - Nothing
 */
function ChatSearchToggleHiddenMode() {
	ChatSearchShowHiddenRoomsActive = !ChatSearchShowHiddenRoomsActive;
	ChatSearchResultOffset = 0;
	if (ChatSearchShowHiddenRoomsActive)
		ElementRemove("InputSearch");
	else {
		ElementCreateSearchInput("InputSearch", () => {
			const rooms = ChatSearchShowHiddenRoomsActive ? ChatSearchHiddenResult : ChatSearchResult;
			return rooms.map(i => i.DisplayName).sort();
		}, { value: ChatSearchFilterTermsTemp, maxLength: 200 });
		ChatSearchSetFilterChangeHandler(true);
	}
}

/**
 * Switch to the Filter Help view or back again.
 * Correctly handles adding/removing the input box as needed.
 * @returns {void} - Nothing
 */
function ChatSearchToggleHelpMode() {
	ChatSearchFilterHelpActive = !ChatSearchFilterHelpActive;
	if (ChatSearchFilterHelpActive)
		ElementRemove("InputSearch");
	else {
		ElementCreateSearchInput("InputSearch", () => {
			const rooms = ChatSearchShowHiddenRoomsActive ? ChatSearchHiddenResult : ChatSearchResult;
			return rooms.map(i => i.DisplayName).sort();
		}, { value: ChatSearchFilterTermsTemp, maxLength: 200 });
		ChatSearchSetFilterChangeHandler(true);
	}
}

/**
 * Adds/removes event listeners to the input box when entering/exiting filter view.
 * @param {boolean} add - true to add listeners, false to remove.
 * @returns {void} - Nothing
 */
function ChatSearchSetFilterChangeHandler(add) {
	const EventNames = ['change', 'keypress', 'keydown', 'keyup', 'paste'];
	var i;

	if (add)
		for (i = 0; i < EventNames.length; i++)
			document.getElementById("InputSearch").addEventListener(EventNames[i], ChatSearchFilterChangeHandler);
	else
		for (i = 0; i < EventNames.length; i++)
			document.getElementById("InputSearch").removeEventListener(EventNames[i], ChatSearchFilterChangeHandler);
}

/**
 * Handles the input box being changed in any way, while in filter view.
 * Makes sure the "temp" filter terms variable is kept updated, so the apply/revert buttons will appear/disappear at the correct times.
 * @returns {void} - Nothing
 */
function ChatSearchFilterChangeHandler() {
	ChatSearchFilterTermsTemp = ElementValue("InputSearch");
}

/**
 * Handles the clicks related to the chatroom list when in permission mode
 * @returns {void} - Nothing
 */
function ChatSearchClickPermission() {
	// Scans results + hidden rooms
	const roomList = ChatSearchShowHiddenRoomsActive ? ChatSearchHiddenResult : ChatSearchResult;

	CommonGenerateGrid(roomList, ChatSearchResultOffset, ChatSearchListParams, (room, x, y, width, height) => {
		if (!MouseIn(x, y, width, height)) return false;
		// The player clicked on an existing room
		if (ChatSearchShowHiddenRoomsActive) {
			ChatSearchClickUnhideRoom(room, false);
		} else {
			// Do what player has chosen to do when clicking a room to hide it
			if (ChatSearchGhostPlayerOnClickActive) {
				// Add the room's creator to ghostlist
				ChatRoomListManipulation(Player.GhostList, true, "" + room.CreatorMemberNumber);
			} else {
				// Just temp hide the room
				ChatSearchTempHiddenRooms.push(room.CreatorMemberNumber);
			}
			// Move the room from the normal result to the hidden result
			ChatSearchHiddenResult.push(room);
			const roomIdx = ChatSearchResult.findIndex(r => r.Name === room.Name);
			if (roomIdx >= 0) {
				ChatSearchResult.splice(roomIdx, 1);
			}
		}
		return true;
	});
}

/**
 * Does whatever is necessary to unhide a room.
 * Shows a confirmation screen first, unless the only reason is "TempHidden".
 * This is called when clicking a room in the list and also, if a confirmation is shown, called again when the confirm button is clicked.
 *
 * @param {ChatRoomSearchResult | number} C - Index of the room within ChatSearchHiddenResult
 * @param {boolean} Confirmed - False when clicking on room list, true when clicking Confirm button
 */
function ChatSearchClickUnhideRoom(C, Confirmed) {
	/** @type {ChatRoomSearchResult} */
	const Room = typeof C === "number" ? ChatSearchHiddenResult[C] : C;
	const roomIdx = ChatSearchHiddenResult.findIndex(r => r.Name === Room.Name);
	if (roomIdx === -1) return false;

	const Reasons = ChatSearchGetFilterReasons(Room);
	const ReasonsHasWord = (Reasons.indexOf("Word") != -1);
	const ReasonsHasTempHidden = (Reasons.indexOf("TempHidden") != -1);
	const ReasonsHasGhostList = (Reasons.indexOf("GhostList") != -1);

	// If the only reason is "TempHidden" we don't need a confirmation screen so just act like we clicked the confirm button already
	if (Reasons.length == 1 && ReasonsHasTempHidden) Confirmed = true;

	// If room matches filtered words, calculate the words to be removed/kept
	let KeepTerms = [], RemoveTerms = [];
	if (ReasonsHasWord) {
		let OldTerms = Player.ChatSearchFilterTerms.split(',').filter(s => s);
		for (let Idx = 0; Idx < OldTerms.length; Idx++)
			if (ChatSearchMatchesTerms(Room, [OldTerms[Idx].toUpperCase()]))
				RemoveTerms.push(OldTerms[Idx]);
			else
				KeepTerms.push(OldTerms[Idx]);
	}

	// If not confirmed, store data for later and show confirm screen
	if (!Confirmed) {
		const MemberLabel = ChatSearchMuffle(Room.Creator) + " (" + Room.CreatorMemberNumber + ")";
		let UnhideConfirm = {
			Index: roomIdx,
			RoomLabel: ChatSearchMuffle(Room.DisplayName) + " - " + MemberLabel,
			MemberLabel: "",
			WordsLabel: "",
		};
		if (ReasonsHasGhostList)
			UnhideConfirm.MemberLabel = MemberLabel;
		if (ReasonsHasWord)
			UnhideConfirm.WordsLabel = RemoveTerms.join(',');
		ChatSearchFilterUnhideConfirm = UnhideConfirm;
		return;
	}

	if (ReasonsHasWord) {
		// Remove all filtered terms that this room matches
		Player.ChatSearchFilterTerms = KeepTerms.join(',');
		ServerSend("AccountUpdate", { ChatSearchFilterTerms: Player.ChatSearchFilterTerms });
		// Update the temp var too because we don't reload it when we exit the hidden room list
		ChatSearchFilterTermsTemp = Player.ChatSearchFilterTerms;
	}
	if (ReasonsHasTempHidden) {
		// Remove from Temp Hidden list
		const Idx = ChatSearchTempHiddenRooms.indexOf(Room.CreatorMemberNumber);
		ChatSearchTempHiddenRooms.splice(Idx, 1);
	}
	if (ReasonsHasGhostList) {
		// Remove creator from ghostlist
		ChatRoomListManipulation(Player.GhostList, false, "" + Room.CreatorMemberNumber);
	}

	// Move the room from the hidden result to the normal result
	ChatSearchResult.push(Room);
	ChatSearchHiddenResult.splice(roomIdx, 1);
}

/**
 * Handles the reception of the server response when joining a room or when getting banned/kicked
 * @param {ServerChatRoomSearchResponse} data - Response from the server
 * @returns {void} - Nothing
 */
function ChatSearchResponse(data) {
	if (typeof data !== "string") return;
	if (((data == "RoomBanned") || (data == "RoomKicked")) && ServerPlayerIsInChatRoom()) {
		// This will cause us to send an extra ChatRoomLeave message
		ChatRoomLeave(true);
		CommonSetScreen("Online", "ChatSearch");
	}
	ChatSearchMessage = "Response" + data;
}

/**
 * Censors the chat search result name and description based on the player preference
 * @param {ServerChatRoomSearchData} searchData - The (potentially) to-be censored search result
 * @returns {null | { DisplayName: string, Description: string }} - The censored name and description or, if fully censored, return `null` instead
 */
function ChatSearchCensor(searchData) {
	const DisplayName = CommonCensor(searchData.Name);
	const Description = CommonCensor(searchData.Description);
	if (DisplayName === "¶¶¶" || Description === "¶¶¶") {
		return null;
	} else {
		return { DisplayName, Description };
	}
}

/**
 * Parse the passed server search data, ensuring that all required fields are present.
 * @param {ServerChatRoomSearchResultResponse} searchResults - The unparsed search data as received from the server
 * @returns {(ServerChatRoomSearchData & { DisplayName: string, Order: number })[]} - The fully parsed room search data
 */
function ChatSearchParseResponse(searchResults) {
	if (!CommonIsArray(searchResults)) {
		return [];
	}

	/** @type {(ServerChatRoomSearchData & { DisplayName: string, Order: number })[]} */
	const ret = [];
	let i = 0;
	for (const result of searchResults) {
		const censoredData = ChatSearchCensor(result);
		if (censoredData === null) {
			continue;
		}

		ret.push({ ...result, ...censoredData, Order: i });
		i++;
	}
	return ret;
}

/**
 * Handles the reception of the server data when it responds to the search query
 * @param {ServerChatRoomSearchResultResponse} data - Response from the server, contains the room list matching the query
 * @returns {void} - Nothing
 */
function ChatSearchResultResponse(data) {
	if (PandoraPenitentiaryIsInmate(Player)) {
		PandoraPenitentiaryResult(ChatSearchParseResponse(data ?? []));
		return;
	}
	ElementContent("InputSearch-datalist", "");
	ChatSearchResult = ChatSearchParseResponse(data ?? []);
	ChatSearchResultOffset = 0;
	ChatSearchQuerySort();
	ChatSearchApplyFilterTerms();
	ChatSearchAutoJoinRoom();
}

/**
 * Automatically join a room, for example due to leashes or reconnect
 * @returns {void} - Nothing
 */
function ChatSearchAutoJoinRoom() {
	if (ChatRoomJoinLeash != "") {
		// This is a search triggered after entering the lobby while being leashed
		// Join the room and unset the special leash-to-room flag
		for (let R = 0; R < ChatSearchResult.length; R++) {
			if (ChatSearchResult[R].Name == ChatRoomJoinLeash) {
				ChatSearchLastQueryJoinTime = CommonTime();
				ChatSearchLastQueryJoin = ChatSearchResult[R].Name;
				ServerSend("ChatRoomJoin", { Name: ChatSearchResult[R].Name });
				break;
			}
		}
		ChatRoomJoinLeash = "";
		return;
	}

	// This is a search triggered from a relog
	if (Player.ImmersionSettings && Player.ImmersionSettings.ReturnToChatRoom && Player.LastChatRoom && !PandoraPenitentiaryIsInmate(Player) && ((ChatSearchLeaveRoom !== "AsylumEntrance") || (AsylumGGTSGetLevel(Player) <= 0))) {
		let roomFound = false;
		let roomIsFull = false;
		// Try joining our previous room
		for (let R = 0; R < ChatSearchResult.length; R++) {
			var room = ChatSearchResult[R];
			if (room.Name === Player.LastChatRoom.Name && room.Game == "") {
				if (room.MemberCount < room.MemberLimit) {
					var RoomName = room.Name;
					if (ChatSearchLastQueryJoin != RoomName || (ChatSearchLastQueryJoin == RoomName && ChatSearchLastQueryJoinTime + 1000 < CommonTime())) {
						roomFound = true;
						ChatSearchLastQueryJoinTime = CommonTime();
						ChatSearchLastQueryJoin = RoomName;
						ServerSend("ChatRoomJoin", { Name: RoomName });
						break;
					}
				} else {
					roomIsFull = true;
					break;
				}
			}
		}

		// The room is gone, create from our previous room data if appropriate
		if (!roomFound) {
			if (Player.ImmersionSettings.ReturnToChatRoomAdmin
				&& Player.LastChatRoom.Admin
				&& Player.LastChatRoom.Background
				&& Player.LastChatRoom.Visibility != null
				&& Player.LastChatRoom.Limit
				&& Player.LastChatRoom.Description != null) {

				if ((ChatAdminMessage === "ResponseRoomAlreadyExist" || roomIsFull) && ChatSearchRejoinIncrement < 50) {
					// The ChatRoomCreate call below failed. Append prefix and try again
					ChatSearchRejoinIncrement += 1;
					const ChatRoomSuffix = " " + ChatSearchRejoinIncrement;
					Player.LastChatRoom.Name = Player.LastChatRoom.Name.substring(0, Math.min(Player.LastChatRoom.Name.length, 19 - ChatRoomSuffix.length)) + ChatRoomSuffix; // Added
					ChatAdminMessage = "";
					ChatSearchQuery();
				} else {
					/** @type {ChatRoomSettings} */
					const NewRoom = {
						Name: Player.LastChatRoom.Name.trim(),
						Description: Player.LastChatRoom.Description.trim(),
						Admin: [Player.MemberNumber],
						Whitelist: [],
						Ban: [],
						Background: Player.LastChatRoom.Background,
						Limit: Math.min(Math.max(Player.LastChatRoom.Limit, 2), 10),
						Game: "",
						Visibility: Player.LastChatRoom.Visibility,
						Access: ChatRoomAccessMode.PUBLIC,
						BlockCategory: Player.LastChatRoom.BlockCategory,
						Language: Player.LastChatRoom.Language,
						Space: Player.LastChatRoom.Space,
						Custom: Player.LastChatRoom.Custom,
						MapData: Player.LastChatRoom.MapData,
					};
					ServerSend("ChatRoomCreate", NewRoom);
					ChatAdminMessage = "CreatingRoom";

					// Actually set the real Admin list. This will get restored by ChatRoomRecreate when it runs
					if (Player.ImmersionSettings.ReturnToChatRoomAdmin && Player.LastChatRoom.Admin) {
						NewRoom.Admin = Player.LastChatRoom.Admin;
						ChatRoomNewRoomToUpdate = NewRoom;
						ChatRoomNewRoomToUpdateTimer = CurrentTime + 1000;
					}
				}
			} else {
				ChatSearchMessage = roomIsFull ? "ResponseRoomFull" : "ResponseCannotFindRoom";
				ChatRoomSetLastChatRoom(null);
			}
		}
	}
}

/**
 * Sends the search query data to the server. The response will be handled by ChatSearchResponse once it is received
 * @returns {void} - Nothing
 */
function ChatSearchQuery() {

	// No regular chat result if locked in Pandora prison
	if (PandoraPenitentiaryIsInmate(Player)) return;

	var Query = ChatSearchMode == "Filter" ? "" : ElementValue("InputSearch").toUpperCase().trim();
	let FullRooms = (Player.OnlineSettings && Player.OnlineSettings.SearchShowsFullRooms);

	if (ChatRoomJoinLeash != null && ChatRoomJoinLeash != "") {
		Query = ChatRoomJoinLeash.toUpperCase().trim();
	} else if (Player.ImmersionSettings && Player.LastChatRoom && Player.LastChatRoom.Name != "") {
		if (Player.ImmersionSettings.ReturnToChatRoom) {
			Query = Player.LastChatRoom.Name.toUpperCase().trim();
			FullRooms = true;
		} else {
			ChatRoomSetLastChatRoom(null);
		}
	} else {
		ChatSearchRejoinIncrement = 1; // Reset the join increment
	}

	/** @type {ServerChatRoomSearchRequest} */
	const SearchData = { Query: Query, Language: ChatSearchLanguage, Space: ChatRoomSpace, Game: ChatRoomGame, FullRooms: FullRooms, ShowLocked: true };

	// Prevent spam searching the same thing.
	if (!CommonObjectEqual(ChatSearchLastSearchDataJSON, SearchData) || (ChatSearchLastQuerySearchTime + 2000 < CommonTime())) {
		ChatSearchLastQuerySearchTime = CommonTime();
		ChatSearchLastSearchDataJSON = SearchData;
		ChatSearchResult = [];
		ServerSend("ChatRoomSearch", SearchData);
	}
}

/**
 * Sorts the room result based on a player's settings
 * @returns {void} - Nothing
 */
function ChatSearchQuerySort() {
	// Send full rooms to the back of the list and save the order of creation.
	ChatSearchResult.sort((R1, R2) => R1.MemberCount >= R1.MemberLimit ? 1 : (R2.MemberCount >= R2.MemberLimit ? -1 : (R1.Order - R2.Order)));

	// Friendlist option overrides basic order, but keeps full rooms at the back for each number of each different total of friends.
	if (Player.OnlineSettings && Player.OnlineSettings.SearchFriendsFirst)
		ChatSearchResult.sort((R1, R2) => R2.Friends.length - R1.Friends.length);
}

/**
 * Remove any rooms from the room list which contain the player's filter terms in the name
 * @returns {void} - Nothing
 */
function ChatSearchApplyFilterTerms() {
	ChatSearchHiddenResult = ChatSearchResult.filter(room => { return ChatSearchGetFilterReasons(room).length != 0; });
	ChatSearchResult = ChatSearchResult.filter(room => { return ChatSearchGetFilterReasons(room).length == 0; });
	ElementContent("InputSearch-datalist", "");
}

/**
 * Get a list of reasons why a room should be hidden.
 * If the returned array is empty, the room should be shown.
 * @param {{ Name: string, CreatorMemberNumber: number }} Room - the room object to check
 * @returns {string[]} - list of reasons
 */
function ChatSearchGetFilterReasons(Room) {
	const Reasons = [];

	// for an exact room name match, ignore filters
	if (ChatSearchMode == "" && Room.Name.toUpperCase() == ElementValue("InputSearch").toUpperCase().trim())
		return [];

	// are any words filtered?
	if (ChatSearchMatchesTerms(Room, Player.ChatSearchFilterTerms.split(',').filter(s => s).map(s => s.toUpperCase())))
		Reasons.push("Word");

	// is room temp hidden?
	if (ChatSearchTempHiddenRooms.indexOf(Room.CreatorMemberNumber) != -1)
		Reasons.push("TempHidden");

	// is creator on ghostlist?
	if (Player.GhostList.indexOf(Room.CreatorMemberNumber) != -1)
		Reasons.push("GhostList");

	return Reasons;
}

/**
 * Check if a room matches filtered-out terms and should thus be hidden.
 * Also used when deciding which terms need to be removed from the filter option in order to make a room be no longer hidden.
 * Only checks the room name, not the description.
 * @param {{ Name: string }} Room - the room object to check
 * @param {string[]} Terms - list of terms to check
 * @returns {boolean} - true if room matches, false otherwise
 */
function ChatSearchMatchesTerms(Room, Terms) {
	const roomName = Room.Name.toUpperCase();
	return Terms.some(term => roomName.includes(term));
}

/**
 * Calculates starting offset for the ignored rooms list when displaying results in filter/permission mode.
 * @param {number} shownRooms - Number of rooms shown before the ignored rooms.
 * @returns {number} - Starting offset for ingored rooms
 */
function ChatSearchCalculateIgnoredRoomsOffset(shownRooms) {
	return ChatSearchResultOffset + shownRooms - ChatSearchResult.length;
}
