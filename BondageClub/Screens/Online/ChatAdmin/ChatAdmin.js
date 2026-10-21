"use strict";
var ChatAdminBackground = "Sheet";
var ChatAdminMessage = "";
/** @deprecated */
var ChatAdminBackgroundIndex = 0;
/** @deprecated */
var ChatAdminPreviewBackgroundMode = false;
/** @type {ServerChatRoomGame[]} */
var ChatAdminGameList = ["", "ClubCard", "LARP", "MagicBattle", "GGTS"];
/** @type {null | string[]} */
var ChatAdminBackgroundList = null;
/** @type {ServerChatRoomLanguage} */
var ChatAdminDefaultLanguage = "EN";

/** @type {ChatRoomAdminSettings | null} */
var ChatAdminData = null;
/** @type {"create" | "update" | null} */
var ChatAdminMode = null;

const ChatAdminID = Object.freeze({
	screen: "chat-admin-screen",
	accept: "chat-admin-accept",
	cancel: "chat-admin-cancel",
	roomImport: "chat-admin-room-import",
	roomExport: "chat-admin-room-export",
	search: "chat-admin-search-button",
	searchInput: "chat-admin-search",
	nameInput: "chat-admin-input-name",
	descriptionInput: "chat-admin-input-description",
	sizeInput: "chat-admin-input-size",
	adminListInput: "chat-admin-input-admin-list",
	whitelistInput: "chat-admin-input-whitelist",
	banListInput: "chat-admin-input-ban-list",
});

/**
 * Loads the given room data and sets up the UI for it
 * @type {ScreenLoadHandler}
 */
async function ChatAdminLoad() {
	const adminData = ChatAdminData;
	if (!adminData) {
		throw new Error('Missing "ChatAdminData" data');
	} else if (!adminData.Background) {
		adminData.Background = Player.OnlineSettings.DefaultChatRoomBackground;
	}
	ChatAdminBackgroundList = BackgroundsGenerateList(ChatSearchBackgroundTagList);
	if (!ChatAdminBackgroundList.includes(adminData.Background)) {
		adminData.Background = ChatAdminBackgroundList[0];
	}

	if (adminData.Language == null || !ServerChatRoomSupportedLanguages.includes(adminData.Language)) adminData.Language = ServerChatRoomSupportedLanguages[0];

	ChatAdminMessage = "";
	const canCommit = ChatAdminCanCommit();

	ElementDOMScreen.getTemplate(ChatAdminID.screen,
		{
			header: ChatAdminTitle(),
			hgroupInHeader: true,
			menubarButtons: [
				ElementButton.Create(
					ChatAdminID.cancel,
					() => ChatAdminExit(),
					{
						image: "Icons/Cancel.png",
						tooltip: TextGet(canCommit ? "Cancel" : "Exit")
					}
				),
				ElementButton.Create(
					ChatAdminID.accept,
					() => { if (ChatAdminCanCommit()) ChatAdminCommit(); },
					{
						image: "Icons/Accept.png",
						disabled: !canCommit,
						tooltip: ChatAdminMode === "create" ? TextGet("Create") : TextGet("Save"),
					}
				),
				ElementButton.Create(
					ChatAdminID.roomImport,
					() => ChatAdminImport(),
					{
						image: "Icons/Upload.png",
						tooltip: TextGet("UploadTooltip"),
						disabled: !canCommit,
					}
				),
				ElementButton.Create(
					ChatAdminID.roomExport,
					() => ChatAdminExport(),
					{
						image: "Icons/Download.png",
						tooltip: TextGet("DownloadTooltip"),
					}
				),
			],
			parent: document.body,
		}
	);
	ElementWrap(`${ChatAdminID.screen}-aside-r`)?.classList.add("scroll-box");


	TextPrefetch("Online", "ChatBlockItem");
}

/**
 * Handles drawing the editor screen
 */
function ChatAdminRun() {
}

/**
 * Handles the click events on the editor screen. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatAdminClick() {
}

/**
 * Handles the key presses while in the creation screen. When the user presses enter, we create the room.
 * @type {KeyboardEventListener}
 */
function ChatAdminKeyDown(event) {
	if (event.repeat) return false;

	if (CommonKey.IsPressed(event, "Enter") && ChatAdminCanCommit()) {
		ChatAdminCommit();
		return true;
	}
	return false;
}

function ChatAdminResize() {
	ElementPositionFixed(ChatAdminID.screen, 50, 50, 1900, 900);
}

/**
 * Handles exiting from the editor screen, removes the inputs and resets the state of the variables
 * @type {ScreenExitHandler}
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
 * Handles unloading the editor screen
 * @type {ScreenUnloadHandler}
 */
function ChatAdminUnload() {
	ElementRemove(ChatAdminID.screen);
}

function ChatAdminImport() {
	if (!ChatAdminCanCommit()) return;

	CommonClipboardRead((res) => {
		try {
			if (!res.ok) {
				throw new Error();
			}

			const data = CommonJSONParse(LZString.decompressFromBase64(res.value ?? "") ?? "");
			if (!data || !ChatEditorValidateAdminSettings(data)) {
				throw new Error();
			}

			ChatEditorAdminSettingsImport(data);
			ChatAdminSetMessage("");
			ToastManager.success(TextGet("UploadSuccess"));
		} catch (error) {
			console.error(error);
			ToastManager.error(TextGet("UploadInvalidCode"));
		}
	});
}

/**
 * Title shown in the screen heading when no status message is set.
 * @returns {string}
 */
function ChatAdminTitle() {
	return TextGet(ChatAdminMode === "create" ? "TitleCreate" : "TitleEdit");
}

/**
 * Store a status message and show it in the screen heading when the editor is open.
 * @param {string} message
 */
function ChatAdminSetMessage(message) {
	ChatAdminMessage = message;
	if (CurrentScreen !== "ChatAdmin") return;

	ElementDOMScreen.setHeading(ChatAdminID.screen, message ? TextGet(message) : ChatAdminTitle());
	const disabled = !ChatAdminCanCommit();
	for (const id of [ChatAdminID.accept, ChatAdminID.roomImport]) {
		ElementWrap(id)?.setAttribute("aria-disabled", String(disabled));
	}
}

function ChatAdminExport() {
	const code = LZString.compressToBase64(JSON.stringify(ChatEditorGetAdminSettings()));
	CommonClipboardWrite(code, (res) => {
		if (res.ok) {
			ToastManager.success(TextGet("DownloadSuccess"));
		} else {
			ToastManager.error(TextGet("DownloadFailed"));
		}
	});
}

/**
 * Show the room editor screen in creation mode
 */
function ChatAdminShowCreate() {
	ChatAdminStart("create");
}

/**
 * Show the room editor screen in update mode
 * @param {ServerChatRoomData} roomData
 */
function ChatAdminShowEdit(roomData) {
	/** @type {ChatRoomSettings} */
	const copy = {
		Name: roomData.Name,
		Description: roomData.Description,
		Admin: roomData.Admin,
		Whitelist: roomData.Whitelist,
		Ban: roomData.Ban,
		Background: roomData.Background,
		Limit: roomData.Limit,
		Game: roomData.Game,
		Visibility: roomData.Visibility,
		Access: roomData.Access,
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
 * @param {ChatRoomSettings | null} roomData
 */
function ChatAdminStart(mode, roomData = null) {
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
			Whitelist: [],
			Ban: banList,
			Background: "",
			Limit: 10,
			Game: "",
			Visibility: ChatRoomVisibilityMode.PUBLIC,
			Access: ChatRoomAccessMode.PUBLIC,
			BlockCategory: [],
			Language: ChatAdminDefaultLanguage,
			Space: ChatSearchGetSpace() ?? undefined,
			MapData: { Type: "Never" },
			// Custom: {},
		};
	} else if (mode === "update") {
		if (roomData == null) {
			throw new Error(`missing room data for mode "${mode}"!`);
		}
		const MapData = {
			...(roomData.MapData ?? {}),
			Type: roomData.MapData?.Type ?? "Never",
		};
		ChatAdminData = { ...roomData, MapData };
	} else {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		throw new Error(`invalid mode "${mode}"!`);
	}
	CommonSetScreen("Online", "ChatAdmin");
}

/**
 * Return whether the editor can actually modify the data
 * @returns {boolean}
 */
function ChatAdminCanEdit() {
	return ChatAdminMode === "create" || !!ChatAdminData?.Admin.includes(Player.MemberNumber);
}

/**
 * Handles accepting the room editor
 */
function ChatAdminCommit() {
	if (!ChatAdminCanCommit()) return;
	if (ChatAdminMode === "update") {
		ChatEditorUpdateRoom();
	} else {
		ChatEditorCreateRoom();
	}
}

/**
 * Return whether the data in the editor can actually be committed
 * @returns {boolean}
 */
function ChatAdminCanCommit() {
	return ChatAdminCanEdit() && ChatAdminMessage !== "UpdatingRoom" && ChatAdminMessage !== "CreatingRoom";
}

/**
 * Validates whether the given settings is in the correct format for a ChatRoomAdminSettings object
 * @param {unknown} settings - The settings to validate
 * @returns {settings is ChatRoomAdminSettings} - True if the settings are valid, false otherwise
 */
function ChatEditorValidateAdminSettings(settings) {
	if (typeof settings !== "object" || settings === null) return false;
	const s = /** @type {ChatRoomAdminSettings} */ (settings);
	const isMemberNumber = (/** @type {unknown} */ n) => typeof n === "number" && Number.isInteger(n) && n > 0;
	const visibility = CommonEntries(ChatRoomVisibilityMode).map(entry => entry[1]);
	/* eslint-disable indent */
	return typeof s.Name === "string" && /^[\x20-\x7E]+$/.test(s.Name)
		&& typeof s.Language === "string" && ServerChatRoomSupportedLanguages.includes(s.Language)
		&& typeof s.Description === "string" && s.Description.length <= ServerChatRoomDescriptionMaxLength
		&& typeof s.Background === "string" && ChatAdminBackgroundList != null && ChatAdminBackgroundList.indexOf(s.Background) >= 0
		&& typeof s.Limit === "number" && Number.isInteger(s.Limit) && s.Limit >= 2 && s.Limit <= 20
		&& Array.isArray(s.Admin) && s.Admin.every(isMemberNumber)
		&& Array.isArray(s.Whitelist) && s.Whitelist.every(isMemberNumber)
		&& Array.isArray(s.Ban) && s.Ban.every(isMemberNumber)
		&& Array.isArray(s.BlockCategory) && s.BlockCategory.every(cat => ChatBlockItemList.includes(cat))
		&& typeof s.Game === "string" && ChatAdminGameList.includes(s.Game)
		&& Array.isArray(s.Visibility) && visibility.some(v =>
			v.length === s.Visibility.length &&
			v.every(role => s.Visibility.includes(role))
		)
		&& Array.isArray(s.Access) && visibility.some(v =>
			v.length === s.Access.length &&
			v.every(role => s.Access.includes(role))
		)
		&& typeof s.MapData === "object" && (
			s.MapData !== null &&
			typeof s.MapData.Type === "string" &&
			ChatRoomMapViewTypeList.includes(s.MapData.Type) &&
			(s.MapData.Fog === undefined || typeof s.MapData.Fog === "boolean") &&
			// Not validating Tiles/Objects further as this is the standard set by ChatRoomMapViewPaste
			(s.MapData.Tiles === undefined || typeof s.MapData.Tiles === "string") &&
			(s.MapData.Objects === undefined || typeof s.MapData.Objects === "string")
		);
	/* eslint-enable indent */
}

/**
 * Imports the given ChatRoomAdminSettings into the editor inputs
 * @param {ChatRoomAdminSettings} settings - The chat room settings to import
 */
function ChatEditorAdminSettingsImport(settings) {
	if (!ChatAdminData) return;

	ElementValue("InputName", settings.Name);
	ElementValue("InputDescription", settings.Description);
	ElementValue("InputSize", settings.Limit.toString());
	ElementValue("InputAdminList", settings.Admin.join(","));
	ElementValue("InputWhitelist", settings.Whitelist.join(","));
	ElementValue("InputBanList", settings.Ban.join(","));

	ChatAdminData.Language = settings.Language;
	ChatAdminData.Background = settings.Background;
	ChatAdminData.Limit = settings.Limit;
	ChatAdminData.BlockCategory = settings.BlockCategory;
	ChatAdminData.Game = settings.Game;
	ChatAdminData.MapData = settings.MapData;
	ChatAdminData.Custom = settings.Custom;
}

/**
 * Gathers the data from the editor inputs and returns it as a ChatRoomAdminSettings object
 * @returns {ChatRoomAdminSettings | undefined} - The chat room settings based on the current editor inputs, or undefined if ChatAdminData is not set
 */
function ChatEditorGetAdminSettings() {
	if (!ChatAdminData) return;

	return {
		Name: ElementValue("InputName").trim() || "Penis",
		Language: ChatAdminData.Language,
		Description: ElementValue("InputDescription").trim(),
		Background: ChatAdminData.Background,
		Limit: parseInt(ElementValue("InputSize"), 10) || 10,
		Admin: CommonConvertStringToArray(ElementValue("InputAdminList").trim()),
		Whitelist: CommonConvertStringToArray(ElementValue("InputWhitelist").trim()),
		Ban: CommonConvertStringToArray(ElementValue("InputBanList").trim()),
		BlockCategory: ChatAdminData.BlockCategory,
		Game: ChatAdminData.Game,
		Visibility: ChatAdminData.Visibility,
		Access: ChatAdminData.Access,
		MapData: ChatAdminData.MapData,
		Custom: ChatAdminData.Custom
	};
}

/**
 * Sends the chat room data packet to the server. The response will be handled by ChatAdminResponse once it is received
 * @returns {void} - Nothing
 */
function ChatEditorUpdateRoom() {
	const UpdatedRoom = ChatEditorGetAdminSettings();
	if (!UpdatedRoom) return;
	if (UpdatedRoom.MapData.Type !== "Never") {
		if (!(UpdatedRoom.MapData.Tiles && UpdatedRoom.MapData.Objects))
			UpdatedRoom.MapData = CommonAssign(ChatRoomMapViewInitialize(UpdatedRoom.MapData.Type), UpdatedRoom.MapData);
	}
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });
	ChatAdminSetMessage("UpdatingRoom");
}

/**
 * Handles the reception of the server response after attempting to update a chatroom
 * @param {ServerChatRoomUpdateResponse} data - Response from the server ("Updated" or error message)
 * @returns {void} - Nothing
 */
function ChatAdminResponse(data) {
	if (typeof data !== "string") {
		ChatAdminSetMessage("ResponseInvalidData");
		return;
	}

	if (data !== "Updated") {
		ChatAdminSetMessage("Response" + data);
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
	if (!ChatAdminData) {
		return;
	}

	ServerAccountUpdate.QueueData({ RoomCreateLanguage: ChatAdminData.Language });
	ChatAdminDefaultLanguage = ChatAdminData.Language;
	/** @type {ChatRoomSettings} */
	const NewRoom = {
		Name: ElementValue("InputName").trim(),
		Language: ChatAdminData.Language,
		Description: ElementValue("InputDescription").trim(),
		Background: ChatAdminData.Background,
		Visibility: ChatAdminData.Visibility,
		Access: ChatAdminData.Access,
		Space: ChatAdminData.Space,
		Game: ChatAdminData.Game,
		Admin: CommonConvertStringToArray(ElementValue("InputAdminList").trim()),
		Whitelist: CommonConvertStringToArray(ElementValue("InputWhitelist").trim()),
		Ban: CommonConvertStringToArray(ElementValue("InputBanList").trim()),
		Limit: parseInt(ElementValue("InputSize"), 10),
		BlockCategory: ChatAdminData.BlockCategory,
		Custom: ChatAdminData.Custom
	};
	if (ChatAdminData.MapData.Type !== "Never") {
		if (ChatAdminData.MapData.Tiles && ChatAdminData.MapData.Objects)
			NewRoom.MapData = ChatAdminData.MapData;
		else
			NewRoom.MapData = ChatRoomMapViewInitialize(ChatAdminData.MapData.Type);
	}
	ServerSend("ChatRoomCreate", NewRoom);
	ChatAdminSetMessage("CreatingRoom");
	// ChatRoomSync is in charge of switching the screen to ChatRoom
}

/**
 * Handles the reception of the server response after attempting to create a chatroom: shows the error message, if applicable
 * @param {ServerChatRoomCreateResponse} data - Response from the server
 * @returns {void} - Nothing
 */
function ChatCreateResponse(data) {
	if (typeof data !== "string") {
		ChatAdminSetMessage("ResponseInvalidData");
		return;
	}

	ChatAdminSetMessage("Response" + data);
}
