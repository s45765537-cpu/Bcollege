"use strict";
var ChatAdminBackground = "Sheet";
var ChatAdminMessage = "";
var ChatAdminBackgroundIndex = 0;
var ChatAdminPreviewBackgroundMode = false;
/** @type {ServerChatRoomGame[]} */
var ChatAdminGameList = ["", "ClubCard", "LARP", "MagicBattle", "GGTS"];
/** @type {ServerChatRoomLanguage[]} */
var ChatAdminLanguageList = ["EN", "DE", "FR", "ES", "CN", "RU", "UA"];
/** @type {null | string[]} */
var ChatAdminBackgroundList = null;
/** @type {ServerChatRoomLanguage} */
var ChatAdminDefaultLanguage = "EN";

/** @type {ChatRoomSettings | null} */
var ChatAdminData = null;
/** @type {"create" | "update" | null} */
var ChatAdminMode = null;

/**
 * Show the room editor screen in creation mode
 */
function ChatAdminShowCreate() {
	ChatAdminStart("create");
}

/**
 * Show the room editor screen in update mode
 * @param {ChatRoom} roomData
 */
function ChatAdminShowEdit(roomData) {
	/** @type {ChatRoomSettings} */
	const copy = {
		Name: roomData.Name,
		Description: roomData.Description,
		Admin: roomData.Admin,
<<<<<<< HEAD
		Whitelist: roomData.Whitelist,
=======
>>>>>>> c9e2a064b (Merge the ChatCreate screen into ChatAdmin)
		Ban: roomData.Ban,
		Background: roomData.Background,
		Limit: roomData.Limit,
		Game: roomData.Game,
		Locked: roomData.Locked,
		Private: roomData.Private,
		BlockCategory: roomData.BlockCategory,
		Language: roomData.Language,
		Space: roomData.Space,
		MapData: roomData.MapData,
		Custom: roomData.Custom,
	};
	ChatAdminStart("update", copy);
}

/**
 * Sets up the chat room editor screen and switches to it
 *
 * This should not be called directly; use {@link ChatAdminShowCreate} or {@link ChatAdminShowEdit}
 *
 * @param {"create" | "update"} mode
 * @param {ChatRoomSettings | undefined} roomData
 */
function ChatAdminStart(mode, roomData = undefined) {
	ChatAdminMode = mode;
	if (mode === "create") {
		/** @type {("BlackList" | "GhostList")[]} */
		const banTypes = [];
		if (Player.OnlineSettings.AutoBanBlackList) {
			banTypes.push("BlackList");
		}
		if (Player.OnlineSettings.AutoBanGhostList) {
			banTypes.push("GhostList");
		}
		const banList = ChatRoomConcatenateBanList(banTypes);
		ChatAdminData = {
			Name: "",
			Description: "",
			Admin: [Player.MemberNumber],
<<<<<<< HEAD
			Whitelist: [],
=======
>>>>>>> c9e2a064b (Merge the ChatCreate screen into ChatAdmin)
			Ban: banList,
			Background: "",
			Limit: 10,
			Game: "",
			Locked: false,
			Private: false,
			BlockCategory: [],
			Language: ChatAdminDefaultLanguage,
<<<<<<< HEAD
			Space: ChatRoomSpace,
=======
			Space: "",
>>>>>>> c9e2a064b (Merge the ChatCreate screen into ChatAdmin)
			MapData: { Type: "Never" },
			// Custom: {},
		};
	} else if (mode === "update") {
		ChatAdminData = roomData;
	} else {
		throw new Error(`invalid mode ${mode}!`);
	}
	CommonSetScreen("Online", "ChatAdmin");
}

/**
 * Return whether the editor can actually modify the data
 * @returns {boolean}
 */
function ChatAdminCanEdit() {
	return ChatAdminMode === "create" || ChatAdminData.Admin.includes(Player.MemberNumber);
}

/**
 * Loads the given room data and sets up the UI for it
 * @type {ScreenFunctions["Load"]}
 */
function ChatAdminLoad() {
	if (!ChatAdminData.Background) {
		ChatAdminData.Background = ChatAdminBackgroundList[0];
	}

	// We have to reload the index here because we might be coming back from the background selection screen
	ChatAdminBackgroundIndex = ChatAdminBackgroundList.indexOf(ChatAdminData.Background);
	if (ChatAdminBackgroundIndex < 0) ChatAdminBackgroundIndex = 0;
	ChatAdminData.Background = ChatAdminBackgroundList[ChatAdminBackgroundIndex];

	// Sets the chat room language
	if (ChatAdminData.Language == null) ChatAdminData.Language = ChatAdminLanguageList[0];
	if (!ChatAdminLanguageList.includes(ChatAdminData.Language)) ChatAdminData.Language = ChatAdminLanguageList[0];

	if (ChatAdminData.MapData == null) ChatAdminData.MapData = { Type: "Never" };
	if (ChatAdminData.MapData.Type == null) ChatAdminData.MapData.Type = "Never";

	// Prepares the controls to edit a room
	const nameInput = ElementCreateInput("InputName", "text", ChatAdminData.Name, "20");
	nameInput.setAttribute("autocomplete", "off");
	nameInput.setAttribute("pattern", "^[\x20-\x7E]+$");
	const sizeInput = ElementCreateInput("InputSize", "number", ChatAdminData.Limit.toString());
	sizeInput.setAttribute("min", "2");
	sizeInput.setAttribute("max", "20");
	sizeInput.setAttribute("autocomplete", "off");
	const descInput = ElementCreateTextArea("InputDescription");
	descInput.setAttribute("maxLength", 100);
	descInput.setAttribute("autocomplete", "off");
	descInput.setAttribute("placeholder", TextGet("InputDescriptionPlaceholder"));
	ElementValue("InputDescription", ChatAdminData.Description);
	const adminListInput = ElementCreateTextArea("InputAdminList");
	adminListInput.setAttribute("maxLength", 2000);
	adminListInput.setAttribute("autocomplete", "off");
<<<<<<< HEAD
	adminListInput.setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
	ElementValue("InputAdminList", CommonConvertArrayToString(ChatAdminData.Admin));
=======
	adminListInput.setAttribute("placeholder", TextGet("InputAdminListPlaceholder"));
	ElementValue("InputAdminList", CommonConvertArrayToString(ChatAdminData.Admin));
	const banListInput = ElementCreateTextArea("InputBanList");
	banListInput.setAttribute("maxLength", 2000);
	banListInput.setAttribute("autocomplete", "off");
	banListInput.setAttribute("placeholder", TextGet("InputBanListPlaceholder"));
	ElementValue("InputBanList", CommonConvertArrayToString(ChatAdminData.Ban));
>>>>>>> c9e2a064b (Merge the ChatCreate screen into ChatAdmin)
	const whitelistInput = ElementCreateTextArea("InputWhitelist");
	whitelistInput.setAttribute("maxLength", 2000);
	whitelistInput.setAttribute("autocomplete", "off");
	whitelistInput.setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
	ElementValue("InputWhitelist", CommonConvertArrayToString(ChatAdminData.Whitelist));
<<<<<<< HEAD
	const banListInput = ElementCreateTextArea("InputBanList");
	banListInput.setAttribute("maxLength", 2000);
	banListInput.setAttribute("autocomplete", "off");
	banListInput.setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
	ElementValue("InputBanList", CommonConvertArrayToString(ChatAdminData.Ban));
=======
>>>>>>> c9e2a064b (Merge the ChatCreate screen into ChatAdmin)

	// If the player isn't an admin, we disable the inputs
	if (!ChatAdminCanEdit()) {
		nameInput.setAttribute("disabled", "disabled");
		descInput.setAttribute("disabled", "disabled");

		// We also garble them if possible
		ElementValue("InputName", ChatSearchMuffle(ChatAdminData.Name));
		ElementValue("InputDescription", ChatSearchMuffle(ChatAdminData.Description));

		adminListInput.setAttribute("disabled", "disabled");
		banListInput.setAttribute("disabled", "disabled");
		whitelistInput.setAttribute("disabled", "disabled");
		sizeInput.setAttribute("disabled", "disabled");
		ChatAdminMessage = "AdminOnly";
	} else {
		ChatAdminMessage = "UseMemberNumbers";
	}
	TextPrefetch("Online", "ChatBlockItem");
}

/**
 * Handles unloading the editor screen
 * @type {ScreenFunctions["Unload"]}
 */
function ChatAdminUnload() {
	ElementRemove("InputName");
	ElementRemove("InputDescription");
	ElementRemove("InputSize");
	ElementRemove("InputAdminList");
	ElementRemove("InputWhitelist");
	ElementRemove("InputBanList");
}

/**
 * Handles drawing the editor screen
 */
function ChatAdminRun() {
	if (ChatAdminPreviewBackgroundMode) {
		ChatAdminBackground = ChatAdminData.Background;
		DrawButton(40, 40, 260, 60, TextGet("ReturnMenu"), "White");
		return;
	}

	const canEdit = ChatAdminCanEdit();
	// Grey button backgrounds if the player isn't an admin
	const ButtonBackground = canEdit ? "White" : "#ebebe4";

	// Draw the main controls
	DrawText(TextGet(ChatAdminMessage), 675, 910, "Black", "Gray");
	DrawText(TextGet("RoomName"), 250, 105, "Black", "Gray");
	ElementPosition("InputName", 815, 100, 820);
	DrawText(TextGet("RoomLanguage"), 250, 190, "Black", "Gray");
	// FIXME: technically the `TextGet` is only needed for the "All language" cases,
	// but we also support Spanish as a room language which isn't actually in the translation files
	const languageLabel = TranslationGetLanguageName(ChatAdminData.Language, true) || TextGet("Language" + ChatAdminData.Language);
	DrawButton(405, 157, 300, 60, languageLabel, ButtonBackground, null, null, !ChatRoomPlayerIsAdmin());
	DrawText(TextGet("RoomSize"), 850, 190, "Black", "Gray");
	ElementPosition("InputSize", 1099, 185, 250);
	DrawText(TextGet("RoomDescription"), 675, 250, "Black", "Gray");
	ElementPosition("InputDescription", 675, 355, 1100, 170);
	DrawText(TextGet("RoomAdminList"), 295, 475, "Black", "Gray");
	ElementPosition("InputAdminList", 295, 615, 340, 240);
	DrawText(TextGet("RoomWhitelist"), 675, 475, "Black", "Gray");
	ElementPosition("InputWhitelist", 675, 615, 340, 240);
	DrawText(TextGet("RoomBanList"), 1055, 475, "Black", "Gray");
	ElementPosition("InputBanList", 1055, 615, 340, 240);
	DrawButton(125, 746, 340, 60, TextGet("QuickaddAdminOwner"), ButtonBackground, null, null, !canEdit);
	DrawButton(125, 816, 340, 60, TextGet("QuickaddAdminLovers"), ButtonBackground, null, null, !canEdit);
	DrawButton(505, 746, 165, 60, TextGet("QuickaddWhitelistOwner"), ButtonBackground, null, null, !canEdit);
	DrawButton(680, 746, 165, 60, TextGet("QuickaddWhitelistLovers"), ButtonBackground, null, null, !canEdit);
	DrawButton(505, 816, 165, 60, TextGet("QuickaddWhitelistFriends"), ButtonBackground, null, null, !canEdit);
	DrawButton(680, 816, 165, 60, TextGet("QuickaddWhitelistWhitelist"), ButtonBackground, null, null, !canEdit);
	DrawButton(885, 746, 340, 60, TextGet("QuickaddBanBlacklist"), ButtonBackground, null, null, !canEdit);
	DrawButton(885, 816, 340, 60, TextGet("QuickaddBanGhostlist"), ButtonBackground, null, null, !canEdit);

	// Background selection, block button and game selection
	DrawImageResize("Backgrounds/" + ChatAdminData.Background + ".jpg", 1300, 75, 600, 350);
	DrawBackNextButton(1300, 450, 500, 60, BackgroundsTextGet(ChatAdminData.Background), ButtonBackground, null,
<<<<<<< HEAD
		() => BackgroundsTextGet((ChatAdminBackgroundIndex == 0) ? ChatAdminBackgroundList[ChatAdminBackgroundList.length - 1] : ChatAdminBackgroundList[ChatAdminBackgroundIndex - 1]),
		() => BackgroundsTextGet((ChatAdminBackgroundIndex >= ChatAdminBackgroundList.length - 1) ? ChatAdminBackgroundList[0] : ChatAdminBackgroundList[ChatAdminBackgroundIndex + 1]),
=======
		() => BackgroundsTextGet((ChatAdminBackgroundIndex == 0) ? ChatCreateBackgroundList[ChatCreateBackgroundList.length - 1] : ChatCreateBackgroundList[ChatAdminBackgroundIndex - 1]),
		() => BackgroundsTextGet((ChatAdminBackgroundIndex >= ChatCreateBackgroundList.length - 1) ? ChatCreateBackgroundList[0] : ChatCreateBackgroundList[ChatAdminBackgroundIndex + 1]),
>>>>>>> c9e2a064b (Merge the ChatCreate screen into ChatAdmin)
		!canEdit);
	DrawButton(1840, 450, 60, 60, "", ButtonBackground, "Icons/Small/Preference.png", null, !canEdit);
	DrawButton(1300, 550, 275, 60, TextGet("BlockCategory"), "White");
	DrawBackNextButton(1625, 550, 275, 60, TextGet("Game" + ChatAdminData.Game), ButtonBackground, null, () => "", () => "");
	DrawButton(1300, 640, 275, 60, TextGet("RoomCustomization"), (ChatAdminData.Custom == null) ? "White" : "#B0FFB0");
	DrawBackNextButton(1625, 640, 275, 60, TextGet("Map" + ChatAdminData.MapData.Type), ButtonBackground, null, () => "", () => "", !canEdit);
	if (MouseIn(1625, 640, 275, 60)) {
		DrawHoverElements.push(() => {
			DrawButtonHover(1625, 630, 275, 60, TextGet(`Map${ChatAdminData.MapData.Type}Tooltip`));
		});
	}

	// Private and Locked check boxes
	DrawText(TextGet("RoomPrivate"), 1347, 760, "Black", "Gray");
	DrawButton(1426, 728, 64, 64, "", ButtonBackground, ChatAdminData.Private ? "Icons/Checked.png" : "", TextGet("RoomPrivateTooltip"), !canEdit);
	DrawText(TextGet("RoomLocked"), 1676, 760, "Black", "Gray");
	DrawButton(1756, 728, 64, 64, "", ButtonBackground, ChatAdminData.Locked ? "Icons/Checked.png" : "", TextGet("RoomLockedTooltip"), !canEdit);

	// Save & Cancel/Exit buttons + help text
	const commitLabel = ChatAdminMode === "create" ? TextGet("Create") : TextGet("Save");
	DrawButton(1325, 840, 250, 65, commitLabel, ButtonBackground, null, null, !canEdit);
	DrawButton(1625, 840, 250, 65, TextGet(canEdit ? "Cancel" : "Exit"), "White");
}

/**
 * Handles the click events on the editor screen. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatAdminClick() {
	// Background preview mode
	if (ChatAdminPreviewBackgroundMode || MouseIn(1300, 75, 600, 350)) {
		ChatAdminPreviewBackgroundMode = !ChatAdminPreviewBackgroundMode;
		ChatAdminBackground = "Sheet";
		ElementToggleGeneratedElements("ChatAdmin", !ChatAdminPreviewBackgroundMode);
		return;
	}

	// When the user cancels/exits
	if (MouseIn(1625, 840, 250, 65)) {
		ChatAdminExit();
		return;
	}

	// Background selection button (admin only) and item block button (anyone)
	if ((MouseIn(1300, 75, 600, 350) || MouseIn(1840, 450, 60, 60) && ChatAdminCanEdit() || MouseIn(1300, 550, 275, 60) || MouseIn(1300, 640, 275, 60))) {
		// We save the current data so we can restore it when coming back from the subscreens
		ChatAdminData = {
			...ChatAdminData,
			Name: ElementValue("InputName"),
			Description: ElementValue("InputDescription"),
			Limit: parseInt(ElementValue("InputSize"), 10),
			Admin: CommonConvertStringToArray(ElementValue("InputAdminList")),
			Whitelist: CommonConvertStringToArray(ElementValue("InputWhitelist")),
			Ban: CommonConvertStringToArray(ElementValue("InputBanList")),
		};
		if (MouseIn(1300, 640, 275, 60)) {
			CommonSetScreen("Online", "ChatAdminRoomCustomization");
			return;
		} else if (MouseIn(1300, 550, 275, 60)) {
			ChatBlockItemEditable = ChatAdminCanEdit();
			ChatBlockItemReturnData = { Screen: "ChatAdmin" };
			ChatBlockItemCategory = ChatAdminData.BlockCategory;
			CommonSetScreen("Online", "ChatBlockItem");
			return;
		} else {
			BackgroundSelectionMake(ChatAdminBackgroundList, ChatAdminBackgroundIndex, (Name) => ChatAdminData.Background = Name);
			return;
		}
	}

	// All other controls are for administrators only
	if (ChatAdminCanEdit()) {
		// When we select a new background
		if (MouseIn(1300, 450, 500, 60)) {
			ChatAdminBackgroundIndex += ((MouseX < 1550) ? -1 : 1);
			if (ChatAdminBackgroundIndex >= ChatAdminBackgroundList.length) ChatAdminBackgroundIndex = 0;
			if (ChatAdminBackgroundIndex < 0) ChatAdminBackgroundIndex = ChatAdminBackgroundList.length - 1;
			ChatAdminData.Background = ChatAdminBackgroundList[ChatAdminBackgroundIndex];
			return;
		}

		// When we select a new game type
		if (MouseIn(1625, 550, 275, 60)) {
			let Index = ChatAdminGameList.indexOf(ChatAdminData.Game);
			Index = Index + ((MouseX < 1763) ? -1 : 1);
			if (Index < 0) Index = ChatAdminGameList.length - 1;
			if (Index >= ChatAdminGameList.length) Index = 0;
			ChatAdminData.Game = ChatAdminGameList[Index];
			return;
		}

		// When we select a new map type
		if (MouseIn(1625, 640, 275, 60)) {
			let Index = ChatRoomMapViewTypeList.indexOf(ChatAdminData.MapData.Type);
			Index = Index + ((MouseX < 1763) ? -1 : 1);
			if (Index < 0) Index = ChatRoomMapViewTypeList.length - 1;
			if (Index >= ChatRoomMapViewTypeList.length) Index = 0;
			ChatAdminData.MapData.Type = ChatRoomMapViewTypeList[Index];
			return;
		}

		if (MouseIn(405, 172, 300, 60)) {
			let Pos = ChatAdminLanguageList.indexOf(ChatAdminData.Language) + 1;
			if (Pos >= ChatAdminLanguageList.length) Pos = 0;
			ChatAdminData.Language = ChatAdminLanguageList[Pos];
			return;
		}

		// Private & Locked check boxes + save button + quickban buttons
		if (MouseIn(1426, 728, 64, 64) && ChatAdminCanEdit()) ChatAdminData.Private = !ChatAdminData.Private;
		if (MouseIn(1756, 728, 64, 64) && ChatAdminCanEdit()) ChatAdminData.Locked = !ChatAdminData.Locked;
		if (MouseIn(1325, 840, 250, 65) && ChatAdminCanEdit()) ChatAdminCommit();
		if (MouseIn(125, 770, 250, 65) && ChatAdminCanEdit()) ElementValue("InputAdminList", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Owner"], CommonConvertStringToArray(ElementValue("InputAdminList").trim()))));
		if (MouseIn(390, 770, 250, 65) && ChatAdminCanEdit()) ElementValue("InputAdminList", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Lovers"], CommonConvertStringToArray(ElementValue("InputAdminList").trim()))));
		if (MouseIn(680, 746, 165, 60) && ChatAdminCanEdit()) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Owner"], CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
		if (MouseIn(680, 746, 165, 60) && ChatAdminCanEdit()) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Lovers"], CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
		if (MouseIn(505, 816, 165, 60) && ChatAdminCanEdit()) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Friends"], CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
		if (MouseIn(680, 816, 165, 60) && ChatAdminCanEdit()) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Whitelist"], CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
		if (MouseIn(695, 770, 250, 65) && ChatAdminCanEdit()) ElementValue("InputBanList", CommonConvertArrayToString(ChatRoomConcatenateBanList(["BlackList"], CommonConvertStringToArray(ElementValue("InputBanList").trim()))));
		if (MouseIn(960, 770, 250, 65) && ChatAdminCanEdit()) ElementValue("InputBanList", CommonConvertArrayToString(ChatRoomConcatenateBanList(["GhostList"], CommonConvertStringToArray(ElementValue("InputBanList").trim()))));
	}
}

/**
 * Handles accepting the room editor
 */
function ChatAdminCommit() {
	if (ChatAdminMode === "update") {
		ChatEditorUpdateRoom();
	} else {
		ChatEditorCreateRoom();
	}
}

/**
 * Handles the key presses while in the creation screen. When the user presses enter, we create the room.
 * @type {KeyboardEventListener}
 */
function ChatAdminKeydown(event) {
	if (event.repeat) return false;

	if (CommonKey.IsPressed(event, "Enter")) {
		ChatAdminCommit();
		return true;
	}
	return false;
}

/**
 * Handles exiting from the editor screen, removes the inputs and resets the state of the variables
 * @type {ScreenFunctions["Exit"]}
 */
function ChatAdminExit() {
	AsylumGGTSReset();
	ChatAdminData = null;

	if (ChatAdminMode === "update") {
		CommonSetScreen("Online", "ChatRoom");
	} else {
		CommonSetScreen("Online", "ChatSearch");
	}
}

/**
 * Sends the chat room data packet to the server. The response will be handled by ChatAdminResponse once it is received
 * @returns {void} - Nothing
 */
function ChatEditorUpdateRoom() {
	/** @type {ChatRoomSettings} */
	const UpdatedRoom = {
		Name: ElementValue("InputName").trim(),
		Language: ChatAdminData.Language,
		Description: ElementValue("InputDescription").trim(),
		Background: ChatAdminData.Background,
		Limit: parseInt(ElementValue("InputSize"), 10),
		Admin: CommonConvertStringToArray(ElementValue("InputAdminList").trim()),
		Whitelist: CommonConvertStringToArray(ElementValue("InputWhitelist").trim()),
		Ban: CommonConvertStringToArray(ElementValue("InputBanList").trim()),
		BlockCategory: ChatAdminData.BlockCategory,
		Game: ChatAdminData.Game,
		Private: ChatAdminData.Private,
		Locked: ChatAdminData.Locked,
		MapData: ChatAdminData.MapData,
		Custom: ChatAdminData.Custom
	};
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });
	ChatAdminMessage = "UpdatingRoom";
}

/**
 * Handles the reception of the server response after attempting to update a chatroom
 * @param {ServerChatRoomUpdateResponse} data - Response from the server ("Updated" or error message)
 * @returns {void} - Nothing
 */
function ChatAdminResponse(data) {
	if (typeof data !== "string") {
		ChatAdminMessage = "ResponseInvalidData";
		return;
	}

	if (data !== "Updated") {
		ChatAdminMessage = "Response" + data;
		return;
	}

	// This is a server message handler, and we might receive this while entering a room on relog,
	// when we update the room back to its proper initial state.
	// In that case, ignore the screen close, since we're actually on the ChatRoom screen.
	if (CurrentScreen === "ChatAdmin") {
		ChatAdminExit();
	}
}

/**
 * Sends the chat room data packet to the server and prepares the player to join a room. The response will be handled by ChatCreateResponse once it is received
 * @returns {void} - Nothing
 */
function ChatEditorCreateRoom() {
	ServerAccountUpdate.QueueData({ RoomCreateLanguage: ChatAdminData.Language });
	ChatAdminDefaultLanguage = ChatAdminData.Language;
	/** @type {ChatRoomSettings} */
	const NewRoom = {
		Name: ElementValue("InputName").trim(),
		Language: ChatAdminData.Language,
		Description: ElementValue("InputDescription").trim(),
		Background: ChatAdminData.Background,
		Private: ChatAdminData.Private,
		Locked: ChatAdminData.Locked,
		Space: ChatAdminData.Space,
		Game: ChatAdminData.Game,
		Admin: CommonConvertStringToArray(ElementValue("InputAdminList").trim()),
<<<<<<< HEAD
		Whitelist: CommonConvertStringToArray(ElementValue("InputWhitelist").trim()),
=======
>>>>>>> c9e2a064b (Merge the ChatCreate screen into ChatAdmin)
		Ban: CommonConvertStringToArray(ElementValue("InputBanList").trim()),
		Limit: parseInt(ElementValue("InputSize"), 10),
		BlockCategory: ChatAdminData.BlockCategory
	};
	if (ChatAdminData.MapData.Type !== "Never") {
		NewRoom.MapData = ChatRoomMapViewInitialize(ChatAdminData.MapData.Type);
	}
	ServerSend("ChatRoomCreate", NewRoom);
	ChatAdminMessage = "CreatingRoom";
}

/**
 * Handles the reception of the server response after attempting to create a chatroom: shows the error message, if applicable
 * @param {ServerChatRoomCreateResponse} data - Response from the server
 * @returns {void} - Nothing
 */
function ChatCreateResponse(data) {
	if (typeof data !== "string") {
		ChatAdminMessage = "ResponseInvalidData";
		return;
	}

	ChatAdminMessage = "Response" + data;
}
