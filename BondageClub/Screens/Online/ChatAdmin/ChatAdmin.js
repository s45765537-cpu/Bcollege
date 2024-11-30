"use strict";
var ChatAdminBackground = "Sheet";
var ChatAdminMessage = "";
var ChatAdminBackgroundIndex = 0;
var ChatAdminBackgroundSelect = "";
var ChatAdminPrivate = false;
var ChatAdminLocked = false;
/** @type {object} */
var ChatAdminMapData = { Type: "Never" };
/** @type {ServerChatRoomGame} */
var ChatAdminGame = "";
/** @type {ServerChatRoomGame[]} */
var ChatAdminGameList = ["", "ClubCard", "LARP", "MagicBattle", "GGTS"];
/** @type {string | null} */
var ChatAdminBackgroundSelected = null;
/** @type {Partial<ServerChatRoomData> | null} */
var ChatAdminTemporaryData = null;
/** @type {ServerChatRoomBlockCategory[]} */
var ChatAdminBlockCategory = [];
var ChatAdminInitialLoad = false;
/** @type {ServerChatRoomLanguage} */
var ChatAdminLanguage = "EN";
var ChatAdminCustom = null;

/**
 * Loads the chat Admin screen properties and creates the inputs
 * @returns {void} - Nothing
 */
function ChatAdminLoad() {

	// Loads the customization data
	ChatAdminCustom = ChatAdminTemporaryData ? ChatAdminTemporaryData.Custom : ChatRoomData.Custom;

	// If the current room background isn't valid, we pick the first one
	ChatAdminBackgroundSelect = ChatAdminBackgroundSelected || ChatRoomData.Background;
	ChatAdminBackgroundIndex = ChatCreateBackgroundList.indexOf(ChatAdminBackgroundSelect);
	if (ChatAdminBackgroundIndex < 0) ChatAdminBackgroundIndex = 0;
	ChatAdminBackgroundSelect = ChatCreateBackgroundList[ChatAdminBackgroundIndex];
	if (!ChatAdminInitialLoad) ChatAdminBlockCategory = ChatRoomData.BlockCategory.slice();
	ChatAdminGame = ChatRoomGame;

	const roomData = ChatAdminTemporaryData ? ChatAdminTemporaryData : ChatRoomData;
	// Sets the chat room language
	ChatAdminLanguage = roomData.Language;
	if (ChatAdminLanguage == null) ChatAdminLanguage = ChatCreateLanguageList[0];
	if (ChatCreateLanguageList.indexOf(ChatAdminLanguage) < 0) ChatAdminLanguage = ChatCreateLanguageList[0];

	// Prepares the controls to edit a room
	const InputName = ElementCreateInput("InputName", "text", roomData.Name, "20");
	InputName.setAttribute("autocomplete", "off");
	InputName.setAttribute("pattern", "^[\x20-\x7E]+$");
	ElementCreateInput("InputSize", "number", roomData.Limit.toString());
	document.getElementById("InputSize").setAttribute("min", "2");
	document.getElementById("InputSize").setAttribute("max", "20");
	document.getElementById("InputSize").setAttribute("autocomplete", "off");
	ElementCreateTextArea("InputDescription");
	document.getElementById("InputDescription").setAttribute("maxLength", 100);
	document.getElementById("InputDescription").setAttribute("autocomplete", "off");
	ElementValue("InputDescription", roomData.Description);
	ElementCreateTextArea("InputAdminList");
	document.getElementById("InputAdminList").setAttribute("maxLength", 2000);
	document.getElementById("InputAdminList").setAttribute("autocomplete", "off");
	ElementValue("InputAdminList", CommonConvertArrayToString(roomData.Admin));
	ElementCreateTextArea("InputWhitelist");
	document.getElementById("InputWhitelist").setAttribute("maxLength", 2000);
	document.getElementById("InputWhitelist").setAttribute("autocomplete", "off");
	ElementValue("InputWhitelist", CommonConvertArrayToString(roomData.Whitelist));
	ElementCreateTextArea("InputBanList");
	document.getElementById("InputBanList").setAttribute("maxLength", 2000);
	document.getElementById("InputBanList").setAttribute("autocomplete", "off");
	ElementValue("InputBanList", CommonConvertArrayToString(roomData.Ban));
	ChatAdminPrivate = roomData.Private;
	ChatAdminLocked = roomData.Locked;
	ChatAdminMapData = roomData.MapData;
	if (ChatAdminMapData == null) ChatAdminMapData = { Type: "Never" };
	if (ChatAdminMapData.Type == null) ChatAdminMapData.Type = "Never";

	// If the player isn't an admin, we disable the inputs
	if (!ChatRoomPlayerIsAdmin()) {
		document.getElementById("InputName").setAttribute("disabled", "disabled");
		document.getElementById("InputDescription").setAttribute("disabled", "disabled");

		// We also garble them if possible
		ElementValue("InputName", ChatSearchMuffle(roomData.Name));
		ElementValue("InputDescription", ChatSearchMuffle(roomData.Description));


		document.getElementById("InputAdminList").setAttribute("disabled", "disabled");
		document.getElementById("InputWhitelist").setAttribute("disabled", "disabled");
		document.getElementById("InputBanList").setAttribute("disabled", "disabled");
		document.getElementById("InputSize").setAttribute("disabled", "disabled");
		ChatAdminMessage = "AdminOnly";
	} else ChatAdminMessage = "MemberNumbersFormat";
	ChatAdminInitialLoad = true;
	TextPrefetch("Online", "ChatBlockItem");

}

/**
 * When the chat Admin screen runs, draws the screen
 * @returns {void} - Nothing
 */
function ChatAdminRun() {

	// Draw the main controls
	DrawText(TextGet(ChatAdminMessage), 675, 914, "Black", "Gray");
	DrawText(TextGet("RoomName"), 250, 120, "Black", "Gray");
	ElementPosition("InputName", 815, 115, 820);
	DrawText(TextGet("RoomLanguage"), 250, 205, "Black", "Gray");
	DrawButton(405, 172, 300, 60, TextGet("Language" + ChatAdminLanguage), ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", null, null, !ChatRoomPlayerIsAdmin());
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
	DrawImageResize("Backgrounds/" + ChatAdminBackgroundSelect + ".jpg", 1300, 75, 600, 350);
	DrawBackNextButton(1300, 450, 500, 60, BackgroundsTextGet(ChatAdminBackgroundSelect), ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", null,
		() => BackgroundsTextGet((ChatAdminBackgroundIndex == 0) ? ChatCreateBackgroundList[ChatCreateBackgroundList.length - 1] : ChatCreateBackgroundList[ChatAdminBackgroundIndex - 1]),
		() => BackgroundsTextGet((ChatAdminBackgroundIndex >= ChatCreateBackgroundList.length - 1) ? ChatCreateBackgroundList[0] : ChatCreateBackgroundList[ChatAdminBackgroundIndex + 1]), !ChatRoomPlayerIsAdmin());
	DrawButton(1840, 450, 60, 60, "", ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", "Icons/Small/Preference.png", null, !ChatRoomPlayerIsAdmin());
	DrawButton(1300, 550, 275, 60, TextGet("BlockCategory"), "White");
	DrawBackNextButton(1625, 550, 275, 60, TextGet("Game" + ChatAdminGame), ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", null, () => "", () => "");
	DrawButton(1300, 640, 275, 60, TextGet("RoomCustomization"), (ChatAdminCustom == null) ? "White" : "#B0FFB0");
	DrawBackNextButton(1625, 640, 275, 60, TextGet("Map" + ChatAdminMapData.Type), ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", null, () => "", () => "");

	// Private and Locked check boxes
	DrawText(TextGet("RoomPrivate"), 1347, 760, "Black", "Gray");
	DrawButton(1426, 728, 64, 64, "", ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", ChatAdminPrivate ? "Icons/Checked.png" : "", null, !ChatRoomPlayerIsAdmin());
	DrawText(TextGet("RoomLocked"), 1676, 760, "Black", "Gray");
	DrawButton(1756, 728, 64, 64, "", ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", ChatAdminLocked ? "Icons/Checked.png" : "", null, !ChatRoomPlayerIsAdmin());

	// Save & Cancel/Exit buttons + help text
	DrawButton(1325, 840, 250, 65, TextGet("Save"), ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", null, null, !ChatRoomPlayerIsAdmin());
	DrawButton(1625, 840, 250, 65, TextGet(ChatRoomPlayerIsAdmin() ? "Cancel" : "Exit"), "White");
}

/**
 * Handles the click events on the admin screen. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatAdminClick() {

	// When the user cancels/exits
	if (MouseIn(1625, 840, 250, 65)) ChatAdminExit();

	// Background selection button (admin only) and item block button (anyone)
	// Saves values before entering.
	if ((ChatRoomPlayerIsAdmin() && (MouseIn(1300, 75, 600, 350) || MouseIn(1840, 450, 60, 60))) || MouseIn(1300, 550, 275, 60) || MouseIn(1300, 640, 275, 60)) {
		ChatAdminTemporaryData = {
			Name: ElementValue("InputName"),
			Language: ChatAdminLanguage,
			Description: ElementValue("InputDescription"),
			Limit: parseInt(ElementValue("InputSize"), 10),
			Admin: CommonConvertStringToArray(ElementValue("InputAdminList")),
			Whitelist: CommonConvertStringToArray(ElementValue("InputWhitelist")),
			Ban: CommonConvertStringToArray(ElementValue("InputBanList")),
			Private: ChatAdminPrivate,
			Locked: ChatAdminLocked,
			MapData: ChatAdminMapData,
			Custom: ChatAdminCustom
		};
		ElementRemove("InputName");
		ElementRemove("InputDescription");
		ElementRemove("InputSize");
		ElementRemove("InputAdminList");
		ElementRemove("InputWhitelist");
		ElementRemove("InputBanList");
		if (MouseIn(1300, 640, 275, 60)) {
			CommonSetScreen("Online", "ChatAdminRoomCustomization");
		} else {
			if (MouseIn(1300, 550, 275, 60)) {
				ChatBlockItemEditable = ChatRoomPlayerIsAdmin();
				ChatBlockItemReturnData = { Screen: "ChatAdmin" };
				ChatBlockItemCategory = ChatAdminBlockCategory;
				CommonSetScreen("Online", "ChatBlockItem");
			} else BackgroundSelectionMake(ChatCreateBackgroundList, ChatAdminBackgroundIndex, Name => ChatAdminBackgroundSelected = Name);
		}
	}

	// All other controls are for administrators only
	if (ChatRoomPlayerIsAdmin()) {

		// When we select a new background
		if (MouseIn(1300, 450, 500, 60)) {
			ChatAdminBackgroundIndex += ((MouseX < 1550) ? -1 : 1);
			if (ChatAdminBackgroundIndex >= ChatCreateBackgroundList.length) ChatAdminBackgroundIndex = 0;
			if (ChatAdminBackgroundIndex < 0) ChatAdminBackgroundIndex = ChatCreateBackgroundList.length - 1;
			ChatAdminBackgroundSelect = ChatCreateBackgroundList[ChatAdminBackgroundIndex];
		}

		// When we select a new game type
		if (MouseIn(1625, 550, 275, 60)) {
			let Index = ChatAdminGameList.indexOf(ChatAdminGame);
			Index = Index + ((MouseX < 1763) ? -1 : 1);
			if (Index < 0) Index = ChatAdminGameList.length - 1;
			if (Index >= ChatAdminGameList.length) Index = 0;
			ChatAdminGame = ChatAdminGameList[Index];
		}

		// When we select a new background
		if (MouseIn(1300, 450, 500, 60)) {
			ChatAdminBackgroundIndex += ((MouseX < 1550) ? -1 : 1);
			if (ChatAdminBackgroundIndex >= ChatCreateBackgroundList.length) ChatAdminBackgroundIndex = 0;
			if (ChatAdminBackgroundIndex < 0) ChatAdminBackgroundIndex = ChatCreateBackgroundList.length - 1;
			ChatAdminBackgroundSelect = ChatCreateBackgroundList[ChatAdminBackgroundIndex];
		}

		// When we select a new map type
		if (MouseIn(1625, 640, 275, 60)) {
			let Index = ChatRoomMapViewTypeList.indexOf(ChatAdminMapData.Type);
			Index = Index + ((MouseX < 1763) ? -1 : 1);
			if (Index < 0) Index = ChatRoomMapViewTypeList.length - 1;
			if (Index >= ChatRoomMapViewTypeList.length) Index = 0;
			ChatAdminMapData.Type = ChatRoomMapViewTypeList[Index];
		}

		// Flips from one language to another
		if (MouseIn(405, 172, 300, 60)) {
			let Pos = ChatCreateLanguageList.indexOf(ChatAdminLanguage) + 1;
			if (Pos >= ChatCreateLanguageList.length) Pos = 0;
			ChatAdminLanguage = ChatCreateLanguageList[Pos];
		}

		// Private & Locked check boxes + save button + quickban buttons
		if (MouseIn(1426, 728, 64, 64)) ChatAdminPrivate = !ChatAdminPrivate;
		if (MouseIn(1756, 728, 64, 64)) ChatAdminLocked = !ChatAdminLocked;
		if (MouseIn(1325, 840, 250, 65) && ChatRoomPlayerIsAdmin()) ChatAdminUpdateRoom();
		if (MouseIn(125, 800, 165, 88)) ElementValue("InputAdminList", CommonConvertArrayToString(ChatRoomConcatenateAdminList(true, false, CommonConvertStringToArray(ElementValue("InputAdminList").trim()))));
		if (MouseIn(300, 800, 165, 88)) ElementValue("InputAdminList", CommonConvertArrayToString(ChatRoomConcatenateAdminList(false, true, CommonConvertStringToArray(ElementValue("InputAdminList").trim()))));
		if (MouseIn(505, 800, 165, 42)) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(true, false, false, CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
		if (MouseIn(680, 800, 165, 42)) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(false, true, false, CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
		if (MouseIn(505, 846, 340, 42)) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(false, false, true, CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
		if (MouseIn(885, 800, 165, 88)) ElementValue("InputBanList", CommonConvertArrayToString(ChatRoomConcatenateBanList(true, false, CommonConvertStringToArray(ElementValue("InputBanList").trim()))));
		if (MouseIn(1060, 800, 165, 88)) ElementValue("InputBanList", CommonConvertArrayToString(ChatRoomConcatenateBanList(false, true, CommonConvertStringToArray(ElementValue("InputBanList").trim()))));

	}
}

/**
 * Handles exiting from the admin screen, removes the inputs and resets the state of the variables
 * @type {ScreenFunctions["Exit"]}
 */
function ChatAdminExit() {
	AsylumGGTSReset();
	ChatAdminBackgroundSelected = null;
	ChatAdminTemporaryData = null;
	ElementRemove("InputName");
	ElementRemove("InputDescription");
	ElementRemove("InputSize");
	ElementRemove("InputAdminList");
	ElementRemove("InputWhitelist");
	ElementRemove("InputBanList");
	CommonSetScreen("Online", "ChatRoom");
	ChatAdminInitialLoad = false;
}

/**
 * Handles the reception of the server response after attempting to update a chatroom: Leaves the admin screen or shows an error message
 * @param {ServerChatRoomUpdateResponse} data - Response from the server ("Updated" or error message)
 * @returns {void} - Nothing
 */
function ChatAdminResponse(data) {
	if (typeof data === "string" && data)
		if (data === "Updated") ChatAdminExit();
		else ChatAdminMessage = "Response" + data;
}

/**
 * Sends the chat room data packet to the server. The response will be handled by ChatAdminResponse once it is received
 * @returns {void} - Nothing
 */
function ChatAdminUpdateRoom() {
	/** @type {ChatRoomSettings} */
	const UpdatedRoom = {
		Name: ElementValue("InputName").trim(),
		Language: ChatAdminLanguage,
		Description: ElementValue("InputDescription").trim(),
		Background: ChatAdminBackgroundSelect,
		Limit: parseInt(ElementValue("InputSize"), 10),
		Admin: CommonConvertStringToArray(ElementValue("InputAdminList").trim()),
		Whitelist: CommonConvertStringToArray(ElementValue("InputWhitelist").trim()),
		Ban: CommonConvertStringToArray(ElementValue("InputBanList").trim()),
		BlockCategory: ChatAdminBlockCategory,
		Game: ChatAdminGame,
		Private: ChatAdminPrivate,
		Locked: ChatAdminLocked,
		MapData: ChatAdminMapData,
		Custom: ChatAdminCustom
	};
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });
	ChatAdminMessage = "UpdatingRoom";
}
