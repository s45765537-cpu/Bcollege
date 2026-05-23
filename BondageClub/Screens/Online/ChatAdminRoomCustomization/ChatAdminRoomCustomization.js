"use strict";
var ChatAdminRoomCustomizationBackground = "Sheet";
/** @type {null | ServerChatRoomCustomData} */
var ChatAdminRoomCustomizationCurrent = null;
var ChatAdminRoomCustomizationIsPreviewing = false;
/** @type {null | "MusicLibrary"} */
var ChatAdminRoomCustomizationMode = null;
/** @type {null | HTMLAudioElement} */
var ChatAdminRoomCustomizationAudio = null;
const ChatAdminRoomCustomizationImageFormats = [".jpg", ".jpeg", ".png", ".webp"];
var ChatAdminRoomCustomizationMusicLibrary = [
	{
		Name: "FantasyAmbience",
		URL: "https://bondageprojects.com/music/FantasyAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=enk9srBmTqQ&ab_channel=Jota-RMusicChannel"
	},
	{
		Name: "HorrorAmbience",
		URL: "https://bondageprojects.com/music/HorrorAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=1JnPSMNuHtw&ab_channel=MarcvanderMeulen%E2%99%AB"
	},
	{
		Name: "WesternAmbience",
		URL: "https://bondageprojects.com/music/WesternAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=wTm-WFM0v-g&ab_channel=MrSnoozeIBackgroundMusicforVideos"
	},
	{
		Name: "MetalInstrumental2021",
		URL: "https://bondageprojects.com/music/MetalInstrumental2021.mp3",
		Source: "https://www.youtube.com/watch?v=AZum7ymw_Ws&ab_channel=MaximumOfHeaven"
	},
	{
		Name: "Pop2020",
		URL: "https://bondageprojects.com/music/Pop2020.mp3",
		Source: "https://www.youtube.com/watch?v=Y7Dk3_hA3-8&ab_channel=therealahmedtn"
	},
	{
		Name: "Pop2022",
		URL: "https://bondageprojects.com/music/Pop2022.mp3",
		Source: "https://www.youtube.com/watch?v=IW0QkXpQs3k&ab_channel=MusicToListen"
	},
	{
		Name: "ProgressiveHouse2022",
		URL: "https://bondageprojects.com/music/ProgressiveHouse2022.mp3",
		Source: "https://www.youtube.com/watch?v=u6PUX87ZaX0&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroDance2022",
		URL: "https://bondageprojects.com/music/ElectroDance2022.mp3",
		Source: "https://www.youtube.com/watch?v=oqGEyAFf6MI&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroDance2023",
		URL: "https://bondageprojects.com/music/ElectroDance2023.mp3",
		Source: "https://www.youtube.com/watch?v=7IjvFZox1Jc&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroRoyKnox",
		URL: "https://bondageprojects.com/music/ElectroRoyKnox.mp3",
		Source: "https://www.youtube.com/watch?v=dh01eSOn9_E&ab_channel=MagicMusic"
	},
	{
		Name: "DanceElectroPop",
		URL: "https://bondageprojects.com/music/DanceElectroPop.mp3",
		Source: "https://www.youtube.com/watch?v=MEkaqZecpUQ&ab_channel=NoCopyrightSounds"
	},
	{
		Name: "DarkTechno",
		URL: "https://bondageprojects.com/music/DarkTechno.mp3",
		Source: "https://www.youtube.com/watch?v=iAguE62acA8&ab_channel=AimToHeadOfficial"
	}
];

/**
 * Checks whether the player is allowed to change customization settings
 * @returns {boolean} - true if the player is allowed to change customization settings, false otherwise
 */
function ChatAdminRoomCustomizationCanEdit() {
	// Either the player is creating the room or they're an admin of an existing one
	return (ChatRoomData === null) || ChatRoomPlayerIsAdmin();
}

/**
 * Reconfigures the chat room's customisation
 * @param {string[]} args - The value to set in that property
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationCommand(args) {
	if (!ChatRoomData) {
		throw new Error('Missing "ChatRoomData" data');
	}

	if (!args.length) {
		if (!ChatRoomData.Custom) {
			ChatRoomSendLocal("No custom room data");
			return;
		}
		const str = [];
		if (ChatRoomData.Custom.ImageURL) str.push(`Background image: ${ChatRoomData.Custom.ImageURL}`);
		if (ChatRoomData.Custom.ImageFilter) str.push(`Background filter: ${ChatRoomData.Custom.ImageFilter}`);
		if (ChatRoomData.Custom.MusicURL) str.push(`Background music: ${ChatRoomData.Custom.MusicURL}`);
		str.push(`Music sync is: ${ChatRoomData.Custom.MusicStart !== undefined ? "on" : "off"}`);
		ChatRoomSendLocal("Custom room info:\n" + str.map(s => `- ${s}`).join("\n"));
		return;
	}

	/** @type {ServerChatRoomCustomData | undefined} */
	const customData = CommonCloneDeep(ChatRoomData.Custom) ?? {};
	let param;
	while ((param = args.shift()?.trim())) {
		switch (param) {
			case "enable":
			case "disable": {
				ChatRoomUpdateCustomization(param === "enable");
				break;
			}
			case "image": {
				if (!ChatRoomPlayerIsAdmin()) {
					ChatRoomSendLocal("Editing the room customization requires administrator privileges.");
					break;
				}
				if ("ImageURL" in customData) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				const arg = args.shift()?.trim();
				if (!arg) {
					ChatRoomSendLocal(`Missing argument for "${param}" parameter`);
					return;
				}
				if (arg === "-") {
					customData.ImageURL = undefined;
					return;
				}
				const safeArg = ServerChatRoomDataValidate.Custom.ImageURL(arg);
				if (!safeArg) {
					ChatRoomSendLocal(`Invalid value "${arg}" for "${param}" parameter. It needs an URL or a BC resource path.`);
					return;
				}
				customData.ImageURL = safeArg;
				break;
			}
			case "filter": {
				if (!ChatRoomPlayerIsAdmin()) {
					ChatRoomSendLocal("Editing the room customization requires administrator privileges.");
					break;
				}
				if ("ImageFilter" in customData) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				const arg = args.shift()?.trim();
				if (!arg) {
					ChatRoomSendLocal(`Missing argument for "${param}" parameter`);
					return;
				}
				if (arg === "-") {
					customData.ImageFilter = undefined;
					return;
				}
				const safeArg = ServerChatRoomDataValidate.Custom.ImageFilter(arg);
				if (!safeArg) {
					ChatRoomSendLocal(`Invalid value "${arg}" for "${param}" parameter. It needs an HexColor.`);
					return;
				}
				customData.ImageFilter = safeArg;
				break;
			}
			case "music": {
				if (!ChatRoomPlayerIsAdmin()) {
					ChatRoomSendLocal("Editing the room customization requires administrator privileges.");
					break;
				}
				if ("MusicURL" in customData) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				const arg = args.shift()?.trim();
				if (!arg) {
					ChatRoomSendLocal(`Missing argument for "${param}" parameter`);
					return;
				}
				if (arg.trim() === "-") {
					customData.MusicURL = undefined;
					return;
				}
				const safeArg = ServerChatRoomDataValidate.Custom.MusicURL(arg);
				if (!safeArg) {
					ChatRoomSendLocal(`Invalid value "${arg}" "${param}" for parameter. It needs an URL.`);
					return;
				}
				customData.MusicURL = safeArg;
				break;
			}
			case "sync": {
				if (!ChatRoomPlayerIsAdmin()) {
					ChatRoomSendLocal("Editing the room customization requires administrator privileges.");
					break;
				}
				if ("MusicStart" in customData) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				let arg = args.shift()?.trim();
				if (!arg) {
					ChatRoomSendLocal(`Missing argument for "${param}" parameter`);
					return;
				}
				arg = arg.trim();
				/** @type {Record<string, boolean | undefined>} */
				const boolParams = {
					"1": true,
					"0": false,
					"on": true,
					"off": false,
					"true": true,
					"false": false,
					"-": false,
				};
				if (boolParams[arg] === undefined) {
					ChatRoomSendLocal(`Invalid value "${arg}" "${param}" for parameter. Recognized values are ${Object.keys(boolParams).map(v => `'${v}'`).join(" ")}`);
					return;
				}
				if (boolParams[arg]) {
					customData.MusicStart = CurrentTime;
				} else {
					customData.MusicStart = undefined;
				}
				break;
			}
			default:
				ChatRoomSendLocal(`Unknown parameter "${param}"`);
				return;
		}
	}

	// Update the room's custom data
	const UpdatedRoom = ChatRoomGetSettings(ChatRoomData);
	UpdatedRoom.Custom = ServerChatRoomDataValidate.Custom(customData);
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });
}

const ChatAdminRoomCustomizationIDs = {
	subscreen: "chatroom-admin-subscreen",
	title: "chatroom-admin-subscreen-hgroup",
	main: "chatroom-admin-subscreen-main",
	grid: "chatroom-admin-subscreen-grid",
	cancelButton: "chatroom-admin-subscreen-cancel",
	previewButton: "chatroom-admin-subscreen-preview",
	clearButton: "chatroom-admin-subscreen-clear",
	saveButton: "chatroom-admin-subscreen-save",
	imageURLInput: "InputImageURL",
	imageFilterInput: "InputImageFilter",
	imageFillModeSelect: "SelectImageFillMode",
	musicURLInput: "InputMusicURL",
	musicSyncCheckbox: "InputMusicSync",
	openLibraryButton: "OpenLibraryButton",
};

/**
 * Loads the chat Admin Custom screen properties and creates the inputs
 * @type {ScreenLoadHandler}
 */
async function ChatAdminRoomCustomizationLoad() {
	if (!ChatAdminData) {
		return;
	}
	const canEditCustom = ChatAdminRoomCustomizationCanEdit();
	const isAdmin = ChatRoomPlayerIsAdmin();
	const adminData = ChatAdminData;

	ChatAdminRoomCustomizationMode = null;
	ChatAdminRoomCustomizationCurrent = null;
	ChatAdminRoomCustomizationIsPreviewing = false;
	const data = ChatAdminRoomCustomizationCurrent = ChatAdminData.Custom ? CommonCloneDeep(ChatAdminData.Custom) : { ImageURL: "", ImageFilter: "", MusicURL: "", SizeMode: DrawingResizeMode.Fill };

	const previewButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.previewButton, () => {
		if (!ChatRoomPlayerIsAdmin()) return;
		ChatAdminRoomCustomizationIsPreviewing = !ChatAdminRoomCustomizationIsPreviewing;
		ChatAdminRoomCustomizationPreviewMusic();
	}, {
		image: "Icons/Public.png",
		tooltip: TextGet("PreviewButtonTooltip"),
		disabled: !isAdmin,
		role: "menuitemcheckbox",
		ariaChecked: ChatAdminRoomCustomizationIsPreviewing,
	});
	const clearButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.clearButton, () => {
		if (!canEditCustom) return;
		ElementValue("InputImageURL", "");
		ElementValue("SelectImageFillMode", DrawingResizeMode.Fill.toString());
		ElementValue("InputImageFilter", "");
		ElementValue("InputMusicURL", "");
		ElementWrap(ChatAdminRoomCustomizationIDs.musicSyncCheckbox)?.toggleAttribute("checked", false);
	}, {
		image: "Icons/Reset.svg",
		tooltip: TextGet("ResetButtonTooltip"),
		disabled: !canEditCustom,
	});
	const saveButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.saveButton, () => {
		const MusicURL = ElementValue("InputMusicURL").trim();
		const syncCheckbox = /** @type {HTMLInputElement} */ (ElementWrap(ChatAdminRoomCustomizationIDs.musicSyncCheckbox));
		// When syncing, preserve the original sync start, unless the track is different
		const MusicStart = syncCheckbox?.checked ?
			MusicURL === ChatRoomData?.Custom?.MusicURL ?
				data.MusicStart ?? CurrentTime
				: CurrentTime
			: undefined;
		adminData.Custom = ServerChatRoomDataValidate.Custom({
			...adminData.Custom ?? {},
			ImageURL: ElementValue("InputImageURL").trim(),
			SizeMode: CommonParseInt(ElementValue("SelectImageFillMode")) ?? DrawingResizeMode.Fill,
			ImageFilter: ElementValue("InputImageFilter").trim(),
			MusicURL,
			MusicStart,
		});
		ChatAdminRoomCustomizationExit();
	}, {
		image: "Icons/Accept.png",
		tooltip: TextGet("SaveButtonTooltip"),
		disabled: !canEditCustom,
	});
	const cancelButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.cancelButton, ChatAdminRoomCustomizationExit, {
		image: "Icons/Cancel.png",
		tooltip: TextGet("CancelButtonTooltip"),
	});

	const subscreen = ElementDOMScreen.getTemplate(
		ChatAdminRoomCustomizationIDs.subscreen,
		{
			menubarButtons: [
				previewButton, clearButton, saveButton, cancelButton
			],
			header: TextGet("Title"),
			parent: document.body,
			hgroupInHeader: true,
		},
	);

	const main = ElementWrap(ChatAdminRoomCustomizationIDs.main);

	const imageInput = ElementCreateInput(ChatAdminRoomCustomizationIDs.imageURLInput, "text", data.ImageURL ?? "", "250");
	imageInput.setAttribute("placeholder", "https://bondageprojects.com/images/school.jpg");
	imageInput.setAttribute("autocomplete", "off");
	imageInput.toggleAttribute("disabled", !canEditCustom);

	const options = Object.entries(DrawingResizeMode).map(([key, value]) => /** @type {Omit<HTMLOptions<"option">, "tag">} */({ attributes: { value, label: TextGet(`BackgroundSizeMode${key}`), selected: value === data.SizeMode } }));

	const imageFillSelect = ElementDropdown.CreateLabelled(ChatAdminRoomCustomizationIDs.imageFillModeSelect, options, TextGet("BackgroundImageFillModeLabel"), function () {
		data.SizeMode = Number(this.value);
	}, { disabled: !canEditCustom || !imageInput.value.trim() });

	imageInput.addEventListener("input", function () {
		data.ImageURL = this.value.trim();
		imageFillSelect.querySelector("select")?.toggleAttribute("disabled", !canEditCustom || !data.ImageURL);
	});

	const filterInput = ElementCreateInput(ChatAdminRoomCustomizationIDs.imageFilterInput, "text", data.ImageFilter ?? "", "10");
	filterInput.setAttribute("autocomplete", "off");
	filterInput.setAttribute("placeholder", "#00000080");
	filterInput.addEventListener('input', function () {
		data.ImageFilter = this.value.trim();
	});

	const musicSyncInput = ElementCheckbox.CreateLabelled(ChatAdminRoomCustomizationIDs.musicSyncCheckbox, TextGet("BackgroundMusicSync"), null, { checked: data.MusicStart !== undefined }, { "container": { parent: document.body }});
	const musicInput = ElementCreateInput(ChatAdminRoomCustomizationIDs.musicURLInput, "text", data.MusicURL ?? "", "250");
	musicInput.setAttribute("autocomplete", "off");
	musicInput.setAttribute("placeholder", "https://bondageprojects.com/music/relax.mp3");
	musicInput.addEventListener("input", function() {
		data.MusicURL = this.value.trim();
		musicSyncInput.querySelector("input")?.toggleAttribute('disabled', !canEditCustom || !data.MusicURL);
	});
	musicInput.addEventListener("change", () => ChatAdminRoomCustomizationPreviewMusic());
	musicSyncInput.querySelector("input")?.toggleAttribute('disabled', !canEditCustom || !musicInput.value.trim());

	const openLibraryButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.openLibraryButton, () => {
		ChatAdminRoomCustomizationMode = "MusicLibrary";
		subscreen.toggleAttribute("hidden", true);
	}, { image: "Icons/Online.png", tooltip: TextGet("OpenLibraryButtonTooltip") });

	const grid = ElementCreate({
		tag: "fieldset",
		parent: main,
		attributes: { id: ChatAdminRoomCustomizationIDs.grid },
		children: [
			ElementText.CreateNote(TextGet("Desc")),
			ElementCreateSettingsLabel(TextGet("BackgroundImageLabel"), imageInput, { position: "left" }),
			imageInput,
			ElementText.CreateNote(TextGet("BackgroundImageNote"), { describes: imageInput }),

			imageFillSelect,

			{
				tag: "div",
				classList: ["setting-group"],
				children: [
					ElementCreateSettingsLabel(TextGet("BackgroundFilterLabel"), filterInput, { position: "left" }),
					filterInput,
				]
			},
			ElementText.CreateNote(TextGet("BackgroundFilterNote"), { describes: filterInput}),

			ElementCreateSettingsLabel(TextGet("BackgroundMusicLabel"), musicInput, { position: "left" }),
			musicInput,
			openLibraryButton,
			ElementText.CreateNote(TextGet("BackgroundMusicNote"), { describes: musicInput }),
			musicSyncInput,
		]
	});
	grid.toggleAttribute('disabled', !canEditCustom);
}

function ChatAdminRoomCustomizationResize() {
	ElementPositionFixed(ChatAdminRoomCustomizationIDs.subscreen, 0, 0, 2000, 1000);
	ElementPositionFixed(ChatAdminRoomCustomizationIDs.previewButton, 1500, 75, 90, 90);
	ElementPositionFixed(ChatAdminRoomCustomizationIDs.clearButton, 1605, 75, 90, 90);
	ElementPositionFixed(ChatAdminRoomCustomizationIDs.saveButton, 1710, 75, 90, 90);
	ElementPositionFixed(ChatAdminRoomCustomizationIDs.cancelButton, 1815, 75, 90, 90);
}

function ChatAdminRoomCustomizationUnload() {
	ElementRemove(ChatAdminRoomCustomizationIDs.subscreen);
}

function ChatAdminRoomCustomizationPreviewMusic() {
	if (ChatAdminRoomCustomizationIsPreviewing) {
		const data = ChatAdminRoomCustomizationCurrent;
		// Enable background music preview
		if (data?.MusicURL && data.MusicURL !== "" && ChatAdminRoomCustomizationAudio?.src !== data.MusicURL) {
			ChatAdminRoomCustomizationAudio?.pause();
			ChatAdminRoomCustomizationAudio = new Audio();
			ChatAdminRoomCustomizationAudio.volume = CommonClamp(Player.AudioSettings.MusicVolume, 0, 1);
			ChatAdminRoomCustomizationAudio.src = data.MusicURL;
			ChatAdminRoomCustomizationAudio.play();
		}
	} else {
		ChatAdminRoomCustomizationAudio?.pause();
		ChatAdminRoomCustomizationAudio = null;
	}
}

/**
 * Runs the customization on the current screen, can be called from elsewhere
 * @deprecated DrawProcess knows how to handle custom backgrounds, and the music support is highly specific
 * @param {ServerChatRoomCustomData | null} Custom - The customization to apply
 * @param {Rect | null} DrawBGToRect - If non-null draw the background to these coordinates. Online chat rooms will use the tracked values elsewhere
 * @param {boolean} DrawBGEffects - If true and drawing a background then apply blur/dark/tint
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationProcess(Custom, DrawBGToRect, DrawBGEffects) {}

/**
 * When the chat Admin Custom screen runs, draws the screen
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationRun() {

	// Shows the background and plays the music if needed
	if (ChatAdminRoomCustomizationIsPreviewing && ChatAdminRoomCustomizationCurrent) {
		DrawRect(0, 0, 2000, 1000, "White");

		const rect = { x: 500, y: 1000 * (1 - ChatRoomCharacterViewZoom) / 2, w: 1000, h: 1000 * ChatRoomCharacterViewZoom };
		const { ImageURL, ImageFilter, SizeMode } = ServerChatRoomDataValidate.Custom(ChatAdminRoomCustomizationCurrent) ?? {};

		if (ImageURL) {
			DrawRect(0, 0, 2000, 1000, "White");
			const opts = {
				blur: Player.GetBlurLevel(),
				darken: DrawGetDarkFactor(),
				tints: Player.GetTints(),
				sizeMode: SizeMode
			};
			DrawRoomBackground(ImageURL, rect, opts);
		}

		// The image filter is a full rectangle over the current background
		if (ImageFilter) {
			DrawRect(...[0, 0, 2000, 1000], ImageFilter);
		}
	}

	// In music library mode
	if (ChatAdminRoomCustomizationMode === "MusicLibrary") {
		const currentURL = ElementValue("InputMusicURL");
		DrawText(TextGet("TitleMusicLibrary"), 1000, 120, "Black", "White");
		DrawButton(1570, 692, 200, 65, TextGet("Return"), "White");
		for (let L = 0; L < ChatAdminRoomCustomizationMusicLibrary.length; L++) {
			let X = Math.floor(L % 3) * 600 + 115;
			let Y = Math.floor(L / 3) * 100 + 210;
			DrawButton(X, Y, 500, 65, TextGet("MusicLibrary" + ChatAdminRoomCustomizationMusicLibrary[L].Name), currentURL === ChatAdminRoomCustomizationMusicLibrary[L].URL ? "LightGreen" : "White");
			DrawButton(X + 500, Y, 65, 65, "", "White", "Icons/Small/YouTube.png");
		}
	}
}

/**
 * Handles the click events on the admin custom screen. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationClick() {
	if (!ChatAdminData) {
		return;
	}

	// If there's no special mode loaded
	if (ChatAdminRoomCustomizationMode == null) {

		// Can show a preview right away in the screen
		if (MouseIn(1570, 722, 200, 65)) {
			ChatAdminRoomCustomizationMode = "MusicLibrary";
			return;
		}
	}

	// In Music Library mode
	if (ChatAdminRoomCustomizationMode === "MusicLibrary") {

		// Can show a preview right away in the screen
		if (MouseIn(1570, 692, 200, 65)) {
			ChatAdminRoomCustomizationMode = null;
			ElementWrap(ChatAdminRoomCustomizationIDs.subscreen)?.toggleAttribute("hidden", false);
			return;
		}

		// If a button is clicked, we select that song
		for (const [L, music] of ChatAdminRoomCustomizationMusicLibrary.entries()) {
			let X = Math.floor(L % 3) * 600 + 115;
			let Y = Math.floor(L / 3) * 100 + 210;
			if (MouseIn(X, Y, 500, 65)) {
				ElementValue("InputMusicURL", music.URL);
				// Send a change event so the previewed track updates
				ElementWrap(ChatAdminRoomCustomizationIDs.musicURLInput)?.dispatchEvent(new Event("change"));
				return;
			}
			if (MouseIn(X + 500, Y, 65, 65)) {
				window.open(music.Source, '_blank')?.focus();
				return;
			}
		}

	}
}

/**
 * Handles exiting from the admin custom screen, removes the inputs
 * @type {ScreenExitHandler}
 */
function ChatAdminRoomCustomizationExit() {
	ChatAdminRoomCustomizationAudio?.pause();
	ChatAdminRoomCustomizationAudio = null;
	CommonSetScreen("Online", "ChatAdmin");
}
