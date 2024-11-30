"use strict";
var ChatCreateBackground = "Sheet";
var ChatCreateResult = [];
var ChatCreateMessage = "";
/** @type {null | boolean} */
var ChatCreatePrivate = null;
/** @type {null | boolean} */
var ChatCreateLocked = null;
/** @type {ChatRoomMapType} */
var ChatCreateMap = "Never";
/** @type {ServerChatRoomGame} */
var ChatCreateGame = "";
/** @type {ServerChatRoomGame[]} */
var ChatCreateGameList = ["", "ClubCard", "LARP", "MagicBattle", "GGTS"];
var ChatCreateBackgroundIndex = 0;
var ChatCreateBackgroundSelect = "";
/** @type {null | string[]} */
var ChatCreateBackgroundList = null;
var ChatCreateShowBackgroundMode = false;
var ChatCreateIsHidden = false;
/** @type {ServerChatRoomLanguage} */
var ChatCreateLanguage = "EN";
/** @type {ServerChatRoomLanguage[]} */
var ChatCreateLanguageList = ["EN", "DE", "FR", "ES", "CN", "RU", "UA"];

/**
 * Loads the chat creation screen properties and creates the inputs
 * @type {ScreenFunctions["Load"]}
 */
function ChatCreateLoad() {

	// Resets the online games status
	if (GameLARPGetStatus() != "") GameLARPSetStatus("");
	if (GameMagicBattleGetStatus() != "") GameMagicBattleSetStatus("");
	if (GameClubCardGetStatus() != "") GameClubCardSetStatus("");

	// If the current background isn't valid, we pick the first one
	ChatCreateBackgroundIndex = ChatCreateBackgroundList.indexOf(ChatCreateBackgroundSelect);
	if (ChatCreateBackgroundIndex < 0) {
		ChatCreateBackgroundIndex = 0;
	}
	ChatCreateBackgroundSelect = ChatCreateBackgroundList[ChatCreateBackgroundIndex];

	// Prepares the controls to create a room
	ElementRemove("InputSearch");
	if (document.getElementById("InputName") == null) {
		// Prepares the controls to edit a room
		const InputName = ElementCreateInput("InputName", "text", "", "20");
		InputName.setAttribute("autocomplete", "off");
		InputName.setAttribute("pattern", "^[\x20-\x7E]+$");
		ElementCreateInput("InputSize", "number", "10");
		document.getElementById("InputSize").setAttribute("min", "2");
		document.getElementById("InputSize").setAttribute("max", "20");
		document.getElementById("InputSize").setAttribute("autocomplete", "off");
		ElementCreateTextArea("InputDescription");
		document.getElementById("InputDescription").setAttribute("maxLength", 100);
		document.getElementById("InputDescription").setAttribute("autocomplete", "off");
		document.getElementById("InputDescription").setAttribute("placeholder", TextGet("DescriptionExplanation"));
		ElementValue("InputDescription", "");
		ElementCreateTextArea("InputAdminList");
		document.getElementById("InputAdminList").setAttribute("maxLength", 2000);
		document.getElementById("InputAdminList").setAttribute("autocomplete", "off");
		document.getElementById("InputAdminList").setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
		ElementValue("InputAdminList", Player.MemberNumber.toString());
		ElementCreateTextArea("InputWhitelist");
		document.getElementById("InputWhitelist").setAttribute("maxLength", 2000);
		document.getElementById("InputWhitelist").setAttribute("autocomplete", "off");
		document.getElementById("InputWhitelist").setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
		ElementValue("InputWhitelist", "");
		ElementCreateTextArea("InputBanList");
		document.getElementById("InputBanList").setAttribute("maxLength", 2000);
		document.getElementById("InputBanList").setAttribute("autocomplete", "off");
		document.getElementById("InputBanList").setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
		const AutoBan = /** @type {("BlackList" | "GhostList")[]} */ ([]);
		if (Player.OnlineSettings) {
			if (Player.OnlineSettings.AutoBanBlackList) AutoBan.push("BlackList");
			if (Player.OnlineSettings.AutoBanGhostList) AutoBan.push("GhostList");
		}
		ElementValue("InputBanList", CommonConvertArrayToString(ChatRoomConcatenateBanList(AutoBan, [])));
	}
	ChatCreateMessage = "";
	ChatCreatePrivate = ChatCreatePrivate || false;

	TextPrefetch("Online", "ChatBlockItem");
}

/** @type {ScreenFunctions["Unload"]} */
function ChatCreateUnload() {
	ChatRoomStimulationMessage("Walk");
}

/**
 * When the chat creation screen runs, draws the screen
 * @type {ScreenFunctions["Run"]}
 */
function ChatCreateRun() {

	if (ChatCreateShowBackgroundMode) {
		ChatCreateBackground = ChatCreateBackgroundSelect;
		DrawButton(40, 40, 260, 60, TextGet("ReturnMenu"), "White");
		return;
	}

	if (ChatCreateIsHidden)
		ElementToggleGeneratedElements("ChatCreate", true);

	// Draw the controls
	if (!document.getElementById("InputName").getAttribute("placeholder")) {
		document.getElementById("InputDescription").setAttribute("placeholder", TextGet("DescriptionExplanation"));
		document.getElementById("InputAdminList").setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
		document.getElementById("InputWhitelist").setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
		document.getElementById("InputBanList").setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
	}
	if (ChatCreateMessage == "") ChatCreateMessage = "EnterRoomInfo";
	DrawText(TextGet(ChatCreateMessage), 675, 914, "Black", "Gray");
	DrawText(TextGet("RoomName"), 250, 120, "Black", "Gray");
	ElementPosition("InputName", 815, 115, 820);
	DrawText(TextGet("RoomLanguage"), 250, 205, "Black", "Gray");
	DrawButton(405, 172, 300, 60, TextGet("Language" + ChatCreateLanguage), "White");
	DrawText(TextGet("RoomSize"), 850, 205, "Black", "Gray");
	ElementPosition("InputSize", 1099, 200, 250);
	DrawText(TextGet("RoomDescription"), 675, 265, "Black", "Gray");
	ElementPosition("InputDescription", 675, 370, 1100, 170);
	DrawText(TextGet("RoomAdminList"), 295, 485, "Black", "Gray");
	ElementPosition("InputAdminList", 295, 625, 340, 250);
	DrawText(TextGet("RoomWhitelist"), 675, 485, "Black", "Gray");
	ElementPosition("InputWhitelist", 675, 625, 340, 250);
	DrawText(TextGet("RoomBanList"), 1055, 485, "Black", "Gray");
	ElementPosition("InputBanList", 1055, 625, 340, 250);
	DrawText(TextGet("QuickaddAdminHeader"), 295, 775, "Black", "Gray");
	DrawButton(125, 800, 165, 88, TextGet("QuickaddAdminOwner"), "White");
	DrawButton(300, 800, 165, 88, TextGet("QuickaddAdminLovers"), "White");
	DrawText(TextGet("QuickaddWhitelistHeader"), 675, 775, "Black", "Gray");
	DrawButton(505, 800, 165, 42, TextGet("QuickaddWhitelistOwner"), "White");
	DrawButton(680, 800, 165, 42, TextGet("QuickaddWhitelistLovers"), "White");
	DrawButton(505, 846, 340, 42, TextGet("QuickaddWhitelistWhitelist"), "White");
	DrawText(TextGet("QuickaddBanHeader"), 1055, 775, "Black", "Gray");
	DrawButton(885, 800, 165, 88, TextGet("QuickaddBanBlacklist"), "White");
	DrawButton(1060, 800, 165, 88, TextGet("QuickaddBanGhostlist"), "White");

	// Background selection, block button and game selection
	DrawImageResize("Backgrounds/" + ChatCreateBackgroundSelect + ".jpg", 1300, 75, 600, 350);
	DrawBackNextButton(1300, 450, 500, 60, BackgroundsTextGet(ChatCreateBackgroundSelect), "White", null,
		() => BackgroundsTextGet((ChatCreateBackgroundIndex == 0) ? ChatCreateBackgroundList[ChatCreateBackgroundList.length - 1] : ChatCreateBackgroundList[ChatCreateBackgroundIndex - 1]),
		() => BackgroundsTextGet((ChatCreateBackgroundIndex >= ChatCreateBackgroundList.length - 1) ? ChatCreateBackgroundList[0] : ChatCreateBackgroundList[ChatCreateBackgroundIndex + 1]));
	DrawButton(1840, 450, 60, 60, "", "White", "Icons/Small/Preference.png", null);
	DrawButton(1300, 530, 275, 60, TextGet("BlockCategory"), "White");
	DrawBackNextButton(1625, 530, 275, 60, TextGet("Game" + ChatCreateGame), "White",  null, () => "", () => "");
	DrawBackNextButton(1300, 610, 600, 60, TextGet("Map" + ChatCreateMap), "White",  null, () => "", () => "");

	// Private and Locked check boxes
	DrawTextFit(TextGet("RoomPrivate"), 1650, 720, 550, "Black", "Gray");
	DrawButton(1300, 690, 64, 64, "",  "White", ChatCreatePrivate ? "Icons/Checked.png" : "");
	DrawTextFit(TextGet("RoomLocked"), 1650, 800, 550, "Black", "Gray");
	DrawButton(1300, 770, 64, 64, "", "White", ChatCreateLocked ? "Icons/Checked.png" : "");

	// Create & Exit buttons
	DrawButton(1325, 860, 250, 65, TextGet("Create"), "White");
	DrawButton(1625, 860, 250, 65, TextGet("Exit"), "White");
}

/**
 * Handles the click events on the chat creation screen. Is called from CommonClick()
 * @type {ScreenFunctions["Click"]}
 */
function ChatCreateClick() {

	// Background preview mode
	if (ChatCreateShowBackgroundMode || MouseIn(1300, 75, 600, 350)) {
		ChatCreateShowBackgroundMode = !ChatCreateShowBackgroundMode;
		ChatCreateBackground = "Sheet";
		ElementToggleGeneratedElements("ChatCreate", !ChatCreateShowBackgroundMode);
		return;
	}

	// When the user cancels/exits
	if (MouseIn(1625, 860, 250, 65)) ChatCreateExit();

	// When we select a new background
	if (MouseIn(1300, 450, 500, 60)) {
		ChatCreateBackgroundIndex += ((MouseX < 1550) ? -1 : 1);
		if (ChatCreateBackgroundIndex >= ChatCreateBackgroundList.length) ChatCreateBackgroundIndex = 0;
		if (ChatCreateBackgroundIndex < 0) ChatCreateBackgroundIndex = ChatCreateBackgroundList.length - 1;
		ChatCreateBackgroundSelect = ChatCreateBackgroundList[ChatCreateBackgroundIndex];
	}

	// When we select a new game type
	if (MouseIn(1625, 530, 275, 60)) {
		let Index = ChatCreateGameList.indexOf(ChatCreateGame);
		Index = Index + ((MouseX < 1763) ? -1 : 1);
		if (Index < 0) Index = ChatCreateGameList.length - 1;
		if (Index >= ChatCreateGameList.length) Index = 0;
		ChatCreateGame = ChatCreateGameList[Index];
	}

	// When we select a new map type
	if (MouseIn(1300, 610, 600, 64)) {
		let Index = ChatRoomMapViewTypeList.indexOf(ChatCreateMap);
		Index = Index + ((MouseX < 1600) ? -1 : 1);
		if (Index < 0) Index = ChatRoomMapViewTypeList.length - 1;
		if (Index >= ChatRoomMapViewTypeList.length) Index = 0;
		ChatCreateMap = ChatRoomMapViewTypeList[Index];
	}

	// Item block button
	if (MouseIn(1300, 530, 275, 60)) {
		ElementToggleGeneratedElements("ChatCreate", false);
		ChatCreateBlockItems();
	}

	// Background selection button (Save values before entering)
	if (MouseIn(1840, 450, 60, 60)) {
		ElementToggleGeneratedElements("ChatCreate", false);
		BackgroundSelectionMake(ChatCreateBackgroundList, ChatCreateBackgroundIndex, Name => {
			ChatCreateBackgroundSelect = Name;
		});
	}

	// Flips from one language to another
	if (MouseIn(405, 172, 300, 60)) {
		let Pos = ChatCreateLanguageList.indexOf(ChatCreateLanguage) + 1;
		if (Pos >= ChatCreateLanguageList.length) Pos = 0;
		ChatCreateLanguage = ChatCreateLanguageList[Pos];
	}

	// Private & Locked check boxes + save button + quickban buttons
	if (MouseIn(1300, 690, 64, 64)) ChatCreatePrivate = !ChatCreatePrivate;
	if (MouseIn(1300, 770, 64, 64)) ChatCreateLocked = !ChatCreateLocked;
	if (MouseIn(1325, 860, 250, 65)) ChatCreateRoom();
	if (MouseIn(125, 800, 165, 88)) ElementValue("InputAdminList", CommonConvertArrayToString(ChatRoomConcatenateAdminList(["Owner"], CommonConvertStringToArray(ElementValue("InputAdminList").trim()))));
	if (MouseIn(300, 800, 165, 88)) ElementValue("InputAdminList", CommonConvertArrayToString(ChatRoomConcatenateAdminList(["Lovers"], CommonConvertStringToArray(ElementValue("InputAdminList").trim()))));
	if (MouseIn(505, 800, 165, 42)) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Owner"], CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
	if (MouseIn(680, 800, 165, 42)) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Lovers"], CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
	if (MouseIn(505, 846, 340, 42)) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Whitelist"], CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
	if (MouseIn(885, 800, 165, 88)) ElementValue("InputBanList", CommonConvertArrayToString(ChatRoomConcatenateBanList(["BlackList"], CommonConvertStringToArray(ElementValue("InputBanList").trim()))));
	if (MouseIn(1060, 800, 165, 88)) ElementValue("InputBanList", CommonConvertArrayToString(ChatRoomConcatenateBanList(["GhostList"], CommonConvertStringToArray(ElementValue("InputBanList").trim()))));

}

/**
 * Handles the key presses while in the creation screen. When the user presses enter, we create the room.
 * @type {KeyboardEventListener}
 */
function ChatCreateKeyDown(event) {
	if (event.repeat) return false;

	if (CommonKey.IsPressed(event, "Enter")) {
		ChatCreateRoom();
		return true;
	}
	return false;
}

/**
 * Handles exiting from the chat creation screen, removes the inputs and resets the state of the variable
 * @type {ScreenFunctions["Exit"]}
 */
function ChatCreateExit() {
	ChatCreatePrivate = null;
	ChatCreateLocked = null;
	ChatCreateMap = "Never";
	ChatRoomCreateRemoveInput();
	CommonSetScreen("Online", "ChatSearch");
}

/**
 * Handles the reception of the server response after attempting to create a chatroom: shows the error message, if applicable
 * @param {ServerChatRoomCreateResponse} data - Response from the server
 * @returns {void} - Nothing
 */
function ChatCreateResponse(data) {
	if (typeof data === "string" && data)
		ChatCreateMessage = "Response" + data;
}

/**
 * Sends the chat room data packet to the server and prepares the player to join a room. The response will be handled by ChatCreateResponse once it is received
 * @returns {void} - Nothing
 */
function ChatCreateRoom() {
	ServerAccountUpdate.QueueData({ RoomCreateLanguage: ChatCreateLanguage });
	/** @type {ChatRoomSettings} */
	const NewRoom = {
		Name: ElementValue("InputName").trim(),
		Language: ChatCreateLanguage,
		Description: ElementValue("InputDescription").trim(),
		Background: ChatCreateBackgroundSelect,
		Private: ChatCreatePrivate,
		Locked: ChatCreateLocked,
		Space: ChatRoomSpace,
		Game: ChatCreateGame,
		Admin: CommonConvertStringToArray(ElementValue("InputAdminList").trim()),
		Whitelist: CommonConvertStringToArray(ElementValue("InputWhitelist").trim()),
		Ban: CommonConvertStringToArray(ElementValue("InputBanList").trim()),
		Limit: parseInt(ElementValue("InputSize"), 10),
		BlockCategory: ChatBlockItemCategory
	};
	if (ChatCreateMap != null) NewRoom.MapData = ChatRoomMapViewInitialize(ChatCreateMap);
	ServerSend("ChatRoomCreate", NewRoom);
	ChatCreateMessage = "CreatingRoom";
	ChatRoomPingLeashedPlayers();
}

/**
 * When we need to enter the item blocking screen
 * @returns {void} - Nothing
 */
function ChatCreateBlockItems() {
	ChatBlockItemReturnData = { Screen: "ChatCreate" };
	CommonSetScreen("Online", "ChatBlockItem");
}

/**
 * Removes all chatroom creation inputs
 */
function ChatRoomCreateRemoveInput() {
	ElementRemove("InputName");
	ElementRemove("InputDescription");
	ElementRemove("InputAdminList");
	ElementRemove("InputWhitelist");
	ElementRemove("InputBanList");
	ElementRemove("InputSize");
}
