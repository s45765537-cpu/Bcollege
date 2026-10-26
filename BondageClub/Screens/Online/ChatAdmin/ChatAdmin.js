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
	language: "chat-admin-language",
	backgroundPreview: "chat-admin-background-preview",
	backgroundView: "chat-admin-background-view",
	backgroundPrev: "chat-admin-background-prev",
	backgroundNext: "chat-admin-background-next",
	backgroundSelect: "chat-admin-background-select",
	blockCategory: "chat-admin-block-category",
	game: "chat-admin-game",
	customization: "chat-admin-customization",
	map: "chat-admin-map",
	visibility: "chat-admin-visibility",
	access: "chat-admin-access",
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

	const visibilityKey = /** @type {ChatRoomVisibilityModeLabel} */ (ChatAdminModeKey(ChatRoomVisibilityMode, adminData.Visibility));
	const accessKey = /** @type {ChatRoomAccessModeLabel} */ (ChatAdminModeKey(ChatRoomAccessMode, adminData.Access));
	adminData.Visibility = ChatRoomVisibilityMode[visibilityKey];
	adminData.Access = ChatRoomAccessMode[accessKey];

	ChatAdminMessage = "";
	const canEdit = ChatAdminCanEdit();
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

	const nameInput = ElementInput.Create(ChatAdminID.nameInput, { type: "text" }, {
		attributes: {
			type: "text",
			value: canEdit ? adminData.Name : ChatSearchMuffle(adminData.Name),
			maxLength: 20,
			autocomplete: "off",
			pattern: "^[\x20-\x7E]+$",
			disabled: !canEdit,
			placeholder: TextGet("RoomNamePlaceholder"),
		},
		eventListeners: {
			input: function () {
				if (ChatAdminData && ChatAdminCanEdit()) ChatAdminData.Name = this.value;
			},
		},
	});

	const sizeInput = ElementInput.Create(ChatAdminID.sizeInput, { type: "number" }, {
		attributes: {
			value: adminData.Limit.toString(),
			min: "2",
			max: "20",
			autocomplete: "off",
			disabled: !canEdit,
		},
		eventListeners: {
			input: function () {
				if (!ChatAdminData || !ChatAdminCanEdit()) return;
				const limit = CommonParseInt(this.value);
				if (CommonIsInteger(limit)) ChatAdminData.Limit = limit;
			},
		},
	});

	const descInput = ElementInput.Create(ChatAdminID.descriptionInput, { type: "textarea" }, {
		attributes: {
			maxLength: ServerChatRoomDescriptionMaxLength,
			autocomplete: "off",
			placeholder: TextGet("InputDescriptionPlaceholder"),
			disabled: !canEdit,
		},
		children: [canEdit ? adminData.Description : ChatSearchMuffle(adminData.Description)],
		eventListeners: {
			input: function () {
				if (ChatAdminData && ChatAdminCanEdit()) ChatAdminData.Description = this.value;
			},
		},
	});

	/**
	 * @param {string} id
	 * @param {readonly number[]} list
	 * @param {(value: number[]) => void} commit
	 */
	const memberList = (id, list, commit) => {
		const input = ElementInput.Create(id, { type: "textarea" }, {
			attributes: {
				maxLength: 2000,
				autocomplete: "off",
				placeholder: TextGet("MemberNumbersFormatPlaceholder"),
				disabled: !canEdit,
			},
			children: [list.join(",")],
			eventListeners: {
				input: function () {
					if (ChatAdminCanEdit()) commit(CommonConvertStringToArray(this.value.trim()));
				},
			},
		});
		return input;
	};
	const adminListInput = memberList(ChatAdminID.adminListInput, adminData.Admin, (value) => {
		if (ChatAdminData) ChatAdminData.Admin = value;
	});
	const whitelistInput = memberList(ChatAdminID.whitelistInput, adminData.Whitelist, (value) => {
		if (ChatAdminData) ChatAdminData.Whitelist = value;
	});
	const banListInput = memberList(ChatAdminID.banListInput, adminData.Ban, (value) => {
		if (ChatAdminData) ChatAdminData.Ban = value;
	});

	/**
	 * @param {HTMLTextAreaElement} input
	 * @param {(current: number[]) => number[]} build
	 */
	const quickadd = (input, build) => () => {
		if (!ChatAdminCanEdit()) return;
		ElementValue(input, build(CommonConvertStringToArray(ElementValue(input))).join(","));
	};
	/**
	 * @param {string} text
	 * @param {() => void} onclick
	 * @param {boolean} [wide]
	 */
	const quickButton = (text, onclick, wide) => ElementButton.Create(null, onclick, {
		label: text,
		disabled: !canEdit,
	}, {
		button: { classList: ["chat-admin-text-button", wide ? "chat-admin-quickadd-wide" : null] },
	});

	/**
	 * @param {string} id
	 * @param {readonly { value: string, label: string }[]} options
	 * @param {string} selected
	 * @param {(this: HTMLSelectElement, ev: Event) => void} onChange
	 */
	const dropdown = (id, options, selected, onChange) => ElementDropdown.Create(
		id,
		options.map((option) => ({
			children: [option.label],
			attributes: { value: option.value, selected: option.value === selected },
		})),
		onChange,
		{ disabled: !canEdit },
	);

	const languageSelect = dropdown(
		ChatAdminID.language,
		ServerChatRoomSupportedLanguages.map((lang) => ({
			value: lang,
			label: TranslationGetLanguageName(lang, true) || TextGet("Language" + lang),
		})),
		adminData.Language,
		function () {
			if (!ChatAdminData) return;
			ChatAdminData.Language = /** @type {ServerChatRoomLanguage} */ (this.value);
		},
	);

	const gameSelect = dropdown(
		ChatAdminID.game,
		ChatAdminGameList.map((game) => ({ value: game, label: TextGet("Game" + game) })),
		adminData.Game,
		function () {
			if (!ChatAdminData) return;
			ChatAdminData.Game = /** @type {ServerChatRoomGame} */ (this.value);
		},
	);

	const mapSelect = dropdown(
		ChatAdminID.map,
		ChatRoomMapViewTypeList.map((type) => ({ value: type, label: TextGet("Map" + type) })),
		adminData.MapData.Type,
		function () {
			if (!ChatAdminData) return;
			ChatAdminData.MapData.Type = /** @type {ChatRoomMapType} */ (this.value);
			this.title = TextGet(`Map${this.value}Tooltip`);
		},
	);

	const visibilitySelect = dropdown(
		ChatAdminID.visibility,
		CommonKeys(ChatRoomVisibilityMode).map((key) => ({ value: key, label: TextGet(`VisibilityMode${key}`) })),
		visibilityKey,
		function () {
			if (!ChatAdminData) return;
			ChatAdminData.Visibility = ChatRoomVisibilityMode[/** @type {ChatRoomVisibilityModeLabel} */ (this.value)];
		},
	);

	const accessSelect = dropdown(
		ChatAdminID.access,
		CommonKeys(ChatRoomAccessMode).map((key) => ({ value: key, label: TextGet(`AccessMode${key}`) })),
		accessKey,
		function () {
			if (!ChatAdminData) return;
			ChatAdminData.Access = ChatRoomAccessMode[/** @type {ChatRoomAccessModeLabel} */ (this.value)];
		},
	);

	const backgroundButton = ElementButton.Create(ChatAdminID.backgroundSelect, () => {
		if (!ChatAdminCanEdit() || !ChatAdminData) return;
		BackgroundSelectionMake(ChatSearchBackgroundTagList, ChatAdminData.Background, (name, setBackground) => {
			if (setBackground && ChatAdminData) ChatAdminData.Background = name;
			CommonSetScreen("Online", "ChatAdmin");
		});
	}, {
		image: "Icons/Preference.png",
		tooltip: TextGet("Background"),
		tooltipPosition: "left",
		disabled: !canEdit,
	}, { button: { classList: ["chat-admin-icon-button", "chat-admin-background-picker"] } });

	const backgroundPreview = ElementCreate({
		tag: "div",
		classList: ["chat-admin-background-preview"],
		children: [
			ElementButton.Create(ChatAdminID.backgroundPreview, () => {
				if (!ChatAdminData) return;
				if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
				ChatAdminSetBackgroundPreview(true);
			}, { noStyling: true }, {
				button: {
					classList: ["chat-admin-background-preview-open"],
					children: [{
						tag: "img",
						attributes: {
							src: `Backgrounds/${adminData.Background}.jpg`,
							alt: BackgroundsTextGet(adminData.Background),
							draggable: "false",
						},
					}],
				},
			}),
			backgroundButton,
		],
	});
	const blockButton = ElementButton.Create(
		ChatAdminID.blockCategory,
		() => {
			if (!ChatAdminData) return;
			ChatBlockItemCategory = ChatAdminData.BlockCategory;
			CommonSetScreen("Online", "ChatBlockItem");
		},
		{
			label: TextGet("BlockCategory"),
		},
		{
			button: {
				classList: ["chat-admin-text-button"]
			}
		}
	);

	const customizationButton = ElementButton.Create(
		ChatAdminID.customization,
		() => {
			CommonSetScreen("Online", "ChatAdminRoomCustomization");
		},
		{
			label: TextGet("RoomCustomization"),
		},
		{
			button: {
				classList: [
					"chat-admin-text-button",
					adminData.Custom == null ? null : "chat-admin-has-custom"
				]
			}
		}
	);

	const descLabel = ElementCreateSettingsLabel(TextGet("RoomDescription"), descInput);
	descLabel.classList.add("chat-admin-description-label");

	const main = ElementWrap(`${ChatAdminID.screen}-main`);
	main?.append(
		ElementCreate({
			tag: "div",
			classList: ["chat-admin-identity"],
			children: [
				{
					tag: "div",
					classList: ["chat-admin-name-row"],
					children: [
						ElementCreateSettingsLabel(TextGet("RoomName"), nameInput, { position: "left" }),
						nameInput,
					],
				},
				{
					tag: "div",
					classList: ["chat-admin-meta-row"],
					children: [
						ElementCreateSettingsLabel(TextGet("RoomLanguage"), languageSelect, { position: "left" }),
						languageSelect,
						ElementCreateSettingsLabel(TextGet("RoomSize"), sizeInput, { position: "left" }),
						sizeInput,
					],
				},
			],
		}),
		descLabel,
		descInput,
		ElementCreate({
			tag: "div",
			classList: ["chat-admin-lists"],
			children: [
				{
					tag: "div",
					classList: ["chat-admin-list"],
					children: [
						ElementCreateSettingsLabel(TextGet("RoomAdminList"), adminListInput),
						adminListInput,
						{
							tag: "div",
							classList: ["chat-admin-quickadd"],
							children: [
								quickButton(TextGet("QuickaddAdminOwner"), quickadd(adminListInput, (current) => ChatRoomConcatenateWhitelist(["Owner"], current)), true),
								quickButton(TextGet("QuickaddAdminLovers"), quickadd(adminListInput, (current) => ChatRoomConcatenateWhitelist(["Lovers"], current)), true),
							],
						},
					],
				},
				{
					tag: "div",
					classList: ["chat-admin-list"],
					children: [
						ElementCreateSettingsLabel(TextGet("RoomWhitelist"), whitelistInput),
						whitelistInput,
						{
							tag: "div",
							classList: ["chat-admin-quickadd"],
							children: [
								quickButton(TextGet("QuickaddWhitelistOwner"), quickadd(whitelistInput, (current) => ChatRoomConcatenateWhitelist(["Owner"], current))),
								quickButton(TextGet("QuickaddWhitelistLovers"), quickadd(whitelistInput, (current) => ChatRoomConcatenateWhitelist(["Lovers"], current))),
								quickButton(TextGet("QuickaddWhitelistFriends"), quickadd(whitelistInput, (current) => ChatRoomConcatenateWhitelist(["Friends"], current))),
								quickButton(TextGet("QuickaddWhitelistWhitelist"), quickadd(whitelistInput, (current) => ChatRoomConcatenateWhitelist(["Whitelist"], current))),
							],
						},
					],
				},
				{
					tag: "div",
					classList: ["chat-admin-list"],
					children: [
						ElementCreateSettingsLabel(TextGet("RoomBanList"), banListInput),
						banListInput,
						{
							tag: "div",
							classList: ["chat-admin-quickadd"],
							children: [
								quickButton(TextGet("QuickaddBanBlacklist"), quickadd(banListInput, (current) => ChatRoomConcatenateBanList(["BlackList"], current)), true),
								quickButton(TextGet("QuickaddBanGhostlist"), quickadd(banListInput, (current) => ChatRoomConcatenateBanList(["GhostList"], current)), true),
							],
						},
					],
				},
			],
		}),
	);
	if (canEdit) {
		const note = ElementText.CreateNote(TextGet("QuickaddExplanation"));
		note.classList.add("chat-admin-note");
		main?.append(note);
	}

	ElementWrap(`${ChatAdminID.screen}-aside-r`)?.append(
		backgroundPreview,
		customizationButton,
		blockButton,
		ElementCreate({
			tag: "div",
			classList: ["chat-admin-modes"],
			children: [
				{
					tag: "div",
					classList: ["chat-admin-mode"],
					children: [
						ElementCreateSettingsLabel(TextGet("GameModeHeader"), gameSelect, { position: "left" }),
						gameSelect,
					],
				},
				{
					tag: "div",
					classList: ["chat-admin-mode"],
					children: [
						ElementCreateSettingsLabel(TextGet("MapModeHeader"), mapSelect, { position: "left" }),
						mapSelect,
					],
				},
				{
					tag: "div",
					classList: ["chat-admin-mode"],
					children: [
						ElementCreateSettingsLabel(TextGet("VisibilityModeHeader"), visibilitySelect, { position: "left" }),
						visibilitySelect,
					],
				},
				{
					tag: "div",
					classList: ["chat-admin-mode"],
					children: [
						ElementCreateSettingsLabel(TextGet("AccessModeHeader"), accessSelect, { position: "left" }),
						accessSelect,
					],
				},
			],
		}),
	);

	/**
	 *
	 * @param {string} id
	 * @param {number} delta
	 * @param {string} image
	 * @param {string} tooltip
	 * @param {ElementButton.Options["tooltipPosition"]} tooltipPosition
	 * @param {string} sideClass
	 * @returns {HTMLButtonElement}
	 */
	const backgroundNav = (id, delta, image, tooltip, tooltipPosition, sideClass) => ElementButton.Create(id, () => {
		ChatAdminShiftBackground(delta);
	}, {
		image,
		tooltip,
		tooltipPosition,
		noStyling: true,
	}, {
		button: {
			classList: ["chat-admin-background-nav", sideClass],
			attributes: { "aria-disabled": canEdit ? null : "true" },
		},
	});

	ElementCreate({
		tag: "div",
		attributes: { id: ChatAdminID.backgroundView, hidden: true },
		classList: ["screen", "HideOnPopup", "chat-admin-background-view"],
		parent: document.body,
		eventListeners: {
			click(event) {
				if (event.target instanceof Element && event.target.closest("button")) return;
				ChatAdminSetBackgroundPreview(false);
			},
		},
		children: [
			backgroundNav(ChatAdminID.backgroundPrev, -1, "Icons/Prev.png", TextGet("BackgroundPrevious"), "right", "chat-admin-background-prev"),
			backgroundNav(ChatAdminID.backgroundNext, 1, "Icons/Next.png", TextGet("BackgroundNext"), "left", "chat-admin-background-next"),
			{
				tag: "p",
				classList: ["chat-admin-background-exit"],
				children: [TextGet("ReturnMenu")],
			},
		],
	});

	if (!canEdit) ChatAdminSetMessage("AdminOnly");
	else if (ChatAdminMode === "create") ElementFocus(nameInput);
	TextPrefetch("Online", "ChatBlockItem");
}

function ChatAdminRun() {}

/**
 * Handles clicks that reach the canvas. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatAdminClick() {}

/**
 * Handles the key presses while in the creation screen. When the user presses enter, we create the room.
 * @type {KeyboardEventListener}
 */
function ChatAdminKeyDown(event) {
	if (event.repeat) return false;
	if (ChatAdminBackgroundPreviewOpen()) {
		if (event.target instanceof HTMLButtonElement) return false;
		return CommonKey.IsPressed(event, "Enter");
	}
	const target = event.target;
	if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target instanceof HTMLButtonElement) return false;

	if (CommonKey.IsPressed(event, "Enter") && ChatAdminCanCommit()) {
		ChatAdminCommit();
		return true;
	}
	return false;
}

function ChatAdminResize() {
	ElementPositionFixed(ChatAdminID.screen, 50, 50, 1900, 900);
	ElementPositionFixed(ChatAdminID.backgroundView, 0, 0, 2000, 1000);
}

/**
 * Handles exiting from the editor screen, removes the inputs and resets the state of the variables
 * @type {ScreenExitHandler}
 */
function ChatAdminExit() {
	if (ChatAdminBackgroundPreviewOpen()) {
		ChatAdminSetBackgroundPreview(false);
		return;
	}
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
	ElementRemove(ChatAdminID.backgroundView);
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
 * Point the editor, thumbnail, and preview at a background.
 * @param {string} name
 */
function ChatAdminApplyBackground(name) {
	if (!ChatAdminData || !ChatAdminBackgroundList?.includes(name)) return;
	ChatAdminData.Background = name;

	const img = ElementWrap(ChatAdminID.backgroundPreview)?.querySelector("img");
	if (img instanceof HTMLImageElement) {
		img.src = `Backgrounds/${name}.jpg`;
		img.alt = BackgroundsTextGet(name);
	}

	const view = ElementWrap(ChatAdminID.backgroundView);
	if (view instanceof HTMLElement) view.style.backgroundImage = `url("Backgrounds/${encodeURI(name)}.jpg")`;
}

/**
 * Step through backgrounds in the same order as the background dropdown.
 * @param {number} delta
 */
function ChatAdminShiftBackground(delta) {
	if (!ChatAdminCanEdit() || !ChatAdminData || !ChatAdminBackgroundList?.length) return;
	const names = ChatAdminBackgroundList.slice().sort((a, b) => BackgroundsTextGet(a).localeCompare(BackgroundsTextGet(b)));
	const index = Math.max(0, names.indexOf(ChatAdminData.Background));
	ChatAdminApplyBackground(names[(index + delta + names.length) % names.length]);
}

/**
 * Whether the full-screen background preview is open.
 * @returns {boolean}
 */
function ChatAdminBackgroundPreviewOpen() {
	return ElementWrap(ChatAdminID.backgroundView)?.hidden === false;
}

/**
 * Show or hide the full-screen background preview.
 * @param {boolean} open
 */
function ChatAdminSetBackgroundPreview(open) {
	const screen = ElementWrap(ChatAdminID.screen);
	ElementWrap(ChatAdminID.backgroundView)?.toggleAttribute("hidden", !open);
	screen?.querySelector(":scope > .screen-header")?.toggleAttribute("inert", open);
	screen?.querySelector(":scope > .screen-main-container")?.toggleAttribute("inert", open);
	if (open && ChatAdminData) ChatAdminApplyBackground(ChatAdminData.Background);
}

/**
 * Match a visibility or access value to its mode label.
 * @param {Readonly<Record<string, readonly ServerChatRoomRole[]>>} modes
 * @param {readonly ServerChatRoomRole[]} roles
 * @returns {string}
 */
function ChatAdminModeKey(modes, roles) {
	const key = CommonKeys(modes).find((name) => {
		const allowed = modes[name];
		return allowed.length === roles.length && allowed.every((role) => roles.includes(role));
	});
	return key ?? CommonKeys(modes)[0];
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

	ElementValue(ChatAdminID.nameInput, settings.Name);
	ElementValue(ChatAdminID.descriptionInput, settings.Description);
	ElementValue(ChatAdminID.sizeInput, settings.Limit.toString());
	ElementValue(ChatAdminID.adminListInput, settings.Admin.join(","));
	ElementValue(ChatAdminID.whitelistInput, settings.Whitelist.join(","));
	ElementValue(ChatAdminID.banListInput, settings.Ban.join(","));

	ChatAdminData.Language = settings.Language;
	ChatAdminData.Limit = settings.Limit;
	ChatAdminData.BlockCategory = settings.BlockCategory;
	ChatAdminData.Game = settings.Game;
	ChatAdminData.MapData = settings.MapData;
	ChatAdminData.Custom = settings.Custom;
	ChatAdminData.Visibility = settings.Visibility;
	ChatAdminData.Access = settings.Access;
	ElementValue(ChatAdminID.language, settings.Language);
	ChatAdminApplyBackground(settings.Background);
	ElementValue(ChatAdminID.game, settings.Game);
	ElementValue(ChatAdminID.map, settings.MapData.Type);
	ElementValue(ChatAdminID.visibility, ChatAdminModeKey(ChatRoomVisibilityMode, settings.Visibility));
	ElementValue(ChatAdminID.access, ChatAdminModeKey(ChatRoomAccessMode, settings.Access));
	ElementWrap(ChatAdminID.customization)?.classList.toggle("chat-admin-has-custom", settings.Custom != null);
}

/**
 * Gathers the data from the editor inputs and returns it as a ChatRoomAdminSettings object
 * @returns {ChatRoomAdminSettings | undefined} - The chat room settings based on the current editor inputs, or undefined if ChatAdminData is not set
 */
function ChatEditorGetAdminSettings() {
	if (!ChatAdminData) return;

	return {
		Name: ElementValue(ChatAdminID.nameInput).trim(),
		Language: ChatAdminData.Language,
		Description: ElementValue(ChatAdminID.descriptionInput).trim(),
		Background: ChatAdminData.Background,
		Limit: parseInt(ElementValue(ChatAdminID.sizeInput), 10) || 10,
		Admin: CommonConvertStringToArray(ElementValue(ChatAdminID.adminListInput).trim()),
		Whitelist: CommonConvertStringToArray(ElementValue(ChatAdminID.whitelistInput).trim()),
		Ban: CommonConvertStringToArray(ElementValue(ChatAdminID.banListInput).trim()),
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
		Name: ElementValue(ChatAdminID.nameInput).trim(),
		Language: ChatAdminData.Language,
		Description: ElementValue(ChatAdminID.descriptionInput).trim(),
		Background: ChatAdminData.Background,
		Visibility: ChatAdminData.Visibility,
		Access: ChatAdminData.Access,
		Space: ChatAdminData.Space,
		Game: ChatAdminData.Game,
		Admin: CommonConvertStringToArray(ElementValue(ChatAdminID.adminListInput).trim()),
		Whitelist: CommonConvertStringToArray(ElementValue(ChatAdminID.whitelistInput).trim()),
		Ban: CommonConvertStringToArray(ElementValue(ChatAdminID.banListInput).trim()),
		Limit: parseInt(ElementValue(ChatAdminID.sizeInput), 10),
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
