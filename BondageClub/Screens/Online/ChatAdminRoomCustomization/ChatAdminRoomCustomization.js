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

const ChatAdminRoomCustomizationIDs = Object.freeze({
	subscreen: "chatroom-admin-subscreen",
	title: "chatroom-admin-subscreen-hgroup",
	main: "chatroom-admin-subscreen-main",
	grid: "chatroom-admin-subscreen-grid",
	cancelButton: "chatroom-admin-subscreen-cancel",
	previewButton: "chatroom-admin-subscreen-preview",
	clearButton: "chatroom-admin-subscreen-clear",
	saveButton: "chatroom-admin-subscreen-save",
	imageURLInput: "InputImageURL",
	filterPicker: "room-custom-filter-picker",
	filterLabel: "room-custom-filter-label",
	imageFillModeSelect: "SelectImageFillMode",
	musicURLInput: "InputMusicURL",
	musicSyncCheckbox: "InputMusicSync",
	openLibraryButton: "OpenLibraryButton",
	stage: "room-custom-stage",
	previewFrame: "room-custom-preview-frame",
	previewImage: "room-custom-preview-image",
	previewFilter: "room-custom-preview-filter",
});

/** @type {Readonly<Record<number, "fill" | "cover" | "contain">>} */
const ChatAdminRoomCustomizationSizeFit = {
	[DrawingResizeMode.Fill]: "fill",
	[DrawingResizeMode.FillOriginalRatio]: "cover",
	[DrawingResizeMode.ShowFullOriginalRatio]: "contain",
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
	data.SizeMode ??= DrawingResizeMode.Fill;

	const previewButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.previewButton, () => {
		if (!ChatRoomPlayerIsAdmin()) return;
		ChatAdminRoomCustomizationIsPreviewing = !ChatAdminRoomCustomizationIsPreviewing;
		ChatAdminRoomCustomizationPreviewMusic();
	},
	{
		image: "Icons/Public.png",
		tooltip: TextGet("PreviewButtonTooltip"),
		disabled: !isAdmin,
		role: "menuitemcheckbox",
		ariaChecked: ChatAdminRoomCustomizationIsPreviewing,
	});
	const clearButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.clearButton, () => {
		if (!canEditCustom) return;
		data.SizeMode = DrawingResizeMode.Fill;
		ElementValue(ChatAdminRoomCustomizationIDs.imageURLInput, "");
		ElementValue(ChatAdminRoomCustomizationIDs.imageFillModeSelect, DrawingResizeMode.Fill.toString());
		data.ImageFilter = "";
		ElementValue(ChatAdminRoomCustomizationIDs.musicURLInput, "");
		ElementSetChecked(ChatAdminRoomCustomizationIDs.musicSyncCheckbox, false);
		ChatAdminRoomCustomizationRefreshPreview();
	},
	{
		image: "Icons/Reset.svg",
		tooltip: TextGet("ResetButtonTooltip"),
		disabled: !canEditCustom,
	});
	const saveButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.saveButton, () => {
		const MusicURL = ElementValue(ChatAdminRoomCustomizationIDs.musicURLInput).trim();
		const syncCheckbox = /** @type {HTMLInputElement} */ (ElementWrap(ChatAdminRoomCustomizationIDs.musicSyncCheckbox));
		// When syncing, preserve the original sync start, unless the track is different
		const MusicStart = syncCheckbox?.checked ?
			MusicURL === ChatRoomData?.Custom?.MusicURL ?
				data.MusicStart ?? CurrentTime
				: CurrentTime
			: undefined;
		adminData.Custom = ServerChatRoomDataValidationRecord.Custom({
			...adminData.Custom ?? {},
			ImageURL: ElementValue(ChatAdminRoomCustomizationIDs.imageURLInput).trim(),
			SizeMode: CommonParseInt(ElementValue(ChatAdminRoomCustomizationIDs.imageFillModeSelect)) ?? DrawingResizeMode.Fill,
			ImageFilter: data.ImageFilter,
			MusicURL,
			MusicStart,
		});
		ChatAdminRoomCustomizationExit();
	},
	{
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
				cancelButton,
				saveButton,
				clearButton,
				previewButton,
			],
			header: TextGet("Title"),
			hgroupInHeader: true,
			parent: document.body,
		},
	);

	const main = ElementWrap(ChatAdminRoomCustomizationIDs.main);

	const imageInput = ElementInput.Create(ChatAdminRoomCustomizationIDs.imageURLInput, { type: "text" },
		{
			attributes: {
				placeholder: "https://bondageprojects.com/images/school.jpg",
				autocomplete: "off",
				spellcheck: "false",
				"aria-label": TextGet("BackgroundImageLabel"),
				value: data.ImageURL ?? "",
				maxlength: "250",
				disabled: !canEditCustom,
			},
			eventListeners: {
				input: function() {
					data.ImageURL = this.value.trim();
					imageFillSelect.querySelector("select")?.toggleAttribute("disabled", !canEditCustom || !data.ImageURL);
					ChatAdminRoomCustomizationRefreshPreview();
				}
			}
		}
	);

	const options = Object.entries(DrawingResizeMode).map(([key, value]) => /** @type {Omit<HTMLOptions<"option">, "tag">} */({ attributes: { value, label: TextGet(`BackgroundSizeMode${key}`), selected: value === data.SizeMode } }));

	const imageFillSelect = ElementDropdown.CreateLabelled(ChatAdminRoomCustomizationIDs.imageFillModeSelect, options, TextGet("FillModeShort"), function () {
		data.SizeMode = Number(this.value);
		ChatAdminRoomCustomizationRefreshPreview();
	}, { disabled: !canEditCustom || !imageInput.value.trim() });

	const filterButton = ElementButton.Create(
		ChatAdminRoomCustomizationIDs.filterPicker,
		() => ChatAdminRoomCustomizationOpenFilterPicker(),
		{ disabled: !canEditCustom },
	);
	const filterLabel = ElementCreateSettingsLabel(
		TextGet("BackgroundFilterLabel"),
		filterButton,
		{ position: "left" },
	);
	filterLabel.id = ChatAdminRoomCustomizationIDs.filterLabel;

	const musicSyncInput = ElementCheckbox.CreateLabelled(
		ChatAdminRoomCustomizationIDs.musicSyncCheckbox,
		TextGet("BackgroundMusicSync"),
		null,
		{
			checked: data.MusicStart !== undefined
		},
		{
			"container": {
				parent: document.body
			},
			checkbox: {
				attributes: {
					disabled: !canEditCustom || !data.MusicURL,
				}
			}
		}
	);
	const musicInput = ElementInput.Create(ChatAdminRoomCustomizationIDs.musicURLInput, { type: "text" }, {
		attributes: {
			placeholder: "https://bondageprojects.com/music/relax.mp3",
			autocomplete: "off",
			spellcheck: "false",
			"aria-label": TextGet("BackgroundMusicLabel"),
			value: data.MusicURL ?? "",
			maxlength: "250",
			disabled: !canEditCustom,
		},
		eventListeners: {
			input: function() {
				data.MusicURL = this.value.trim();
				musicSyncInput.querySelector("input")?.toggleAttribute("disabled", !canEditCustom || !data.MusicURL);
			},
			change: function() {
				ChatAdminRoomCustomizationPreviewMusic();
			}
		}
	});

	const openLibraryButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.openLibraryButton, () => {
		ChatAdminRoomCustomizationMode = "MusicLibrary";
		subscreen.toggleAttribute("hidden", true);
	}, {
		image: "Icons/Online.png",
		tooltip: TextGet("OpenLibraryButtonTooltip"),
		disabled: !canEditCustom,
	});

	const previewImage = ElementCreate({
		tag: "img",
		attributes: {
			id: ChatAdminRoomCustomizationIDs.previewImage,
			alt: "",
			draggable: "false",
			referrerpolicy: "no-referrer",
			decoding: "async",
		},
		eventListeners: {
			load: function() {
				if (this.dataset.pending && this.getAttribute("src") === this.dataset.pending) {
					ElementWrap(ChatAdminRoomCustomizationIDs.previewFrame)?.toggleAttribute("data-empty", false);
				}
			},
			error: function() {
				ElementWrap(ChatAdminRoomCustomizationIDs.previewFrame)?.toggleAttribute("data-empty", true);
			}
		}
	});

	const imageHint = ElementText.CreateHint(null, TextGet("BackgroundImageNote"), "left");
	const filterHint = ElementText.CreateHint(null, TextGet("BackgroundFilterNote"), "left");
	const musicHint = ElementText.CreateHint(null, TextGet("BackgroundMusicNote"), "left");

	const intro = ElementText.CreateNote(TextGet("Desc"));
	intro.classList.add("room-custom-intro");

	ElementCreate({
		tag: "div",
		parent: main,
		attributes: { id: ChatAdminRoomCustomizationIDs.grid },
		classList: ["room-custom-board"],
		children: [
			{
				tag: "div",
				classList: ["room-custom-fields", "scroll-box"],
				children: [
					{
						tag: "section",
						classList: ["room-custom-section"],
						children: [
							{ tag: "h2", children: [TextGet("SectionBackground")] },
							{
								tag: "div",
								classList: ["room-custom-field"],
								children: [imageInput, imageHint],
							},
							imageFillSelect,
							{
								tag: "div",
								classList: ["room-custom-filter"],
								children: [filterLabel, filterButton, filterHint],
							},
						],
					},
					{
						tag: "section",
						classList: ["room-custom-section"],
						children: [
							{ tag: "h2", children: [TextGet("SectionMusic")] },
							{
								tag: "div",
								classList: ["room-custom-music-row"],
								children: [musicInput, openLibraryButton, musicHint],
							},
							musicSyncInput,
						],
					},
				],
			},
			{
				tag: "div",
				classList: ["room-custom-stage"],
				attributes: { id: ChatAdminRoomCustomizationIDs.stage },
				children: [
					{
						tag: "div",
						classList: ["room-custom-frame"],
						attributes: { id: ChatAdminRoomCustomizationIDs.previewFrame, "data-empty": true, "data-fit": "fill" },
						children: [
							previewImage,
							{
								tag: "div",
								classList: ["room-custom-preview-filter"],
								attributes: { id: ChatAdminRoomCustomizationIDs.previewFilter, "aria-hidden": "true" },
							},
							{
								tag: "p",
								classList: ["room-custom-empty"],
								children: [TextGet("PreviewEmpty")],
							},
						],
					},
				],
			},
			intro,
		],
	});

	ChatAdminRoomCustomizationRefreshPreview();
}

/**
 * When the chat Admin Custom screen runs, draws the screen
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationRun() {

	// Shows the background and plays the music if needed
	if (ChatAdminRoomCustomizationIsPreviewing && ChatAdminRoomCustomizationCurrent) {
		DrawRect(0, 0, 2000, 1000, "White");

		const rect = { x: 500, y: 1000 * (1 - ChatRoomCharacterViewZoom) / 2, w: 1000, h: 1000 * ChatRoomCharacterViewZoom };
		const { ImageURL, ImageFilter, SizeMode } = ServerChatRoomDataValidationRecord.Custom(ChatAdminRoomCustomizationCurrent) ?? {};

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
		const currentURL = ElementValue(ChatAdminRoomCustomizationIDs.musicURLInput);
		DrawText(TextGet("TitleMusicLibrary"), 1000, 120, "Black", "White");
		DrawButton(1570, 692, 200, 65, TextGet("Return"), "White");
		for (let L = 0; L < ChatAdminRoomCustomizationMusicLibrary.length; L++) {
			let X = Math.floor(L % 3) * 600 + 115;
			let Y = Math.floor(L / 3) * 100 + 210;
			DrawButton(X, Y, 500, 65, TextGet("MusicLibrary" + ChatAdminRoomCustomizationMusicLibrary[L].Name), currentURL === ChatAdminRoomCustomizationMusicLibrary[L].URL ? "LightGreen" : "White");
			DrawButton(X + 500, Y, 65, 65, "", "White", "Icons/YouTube.png");
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
				ElementValue(ChatAdminRoomCustomizationIDs.musicURLInput, music.URL);
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

function ChatAdminRoomCustomizationResize() {
	ElementPositionFixed(ChatAdminRoomCustomizationIDs.subscreen, 50, 50, 1900, 900);
	if (ElementWrap(ColorPicker.ids.root)) ColorPickerResize(false);
}

function ChatAdminRoomCustomizationUnload() {
	ElementRemove(ChatAdminRoomCustomizationIDs.subscreen);
	if (ElementWrap(ColorPicker.ids.root)) ColorPickerExit(true);
}

/**
 * Color picker state for a background filter. An empty filter starts fully transparent.
 * @param {string | undefined} value
 * @returns {NonNullable<ColorPickerInitOptions["colorState"]>}
 */
function ChatAdminRoomCustomizationFilterState(value) {
	const parsed = ColorPickerCSSToColor(value);
	return {
		colors: [parsed?.color ?? "#000000"],
		defaultColors: ["#000000"],
		opacity: [parsed?.opacity ?? 0],
		defaultOpacity: [0],
		editOpacity: true,
	};
}

/**
 * Opens the color picker for the background filter. Accept writes the chosen color back onto the form.
 * @returns {void}
 */
function ChatAdminRoomCustomizationOpenFilterPicker() {
	const data = ChatAdminRoomCustomizationCurrent;
	const picker = ElementWrap(ColorPicker.ids.root);
	if (!data || !ChatAdminRoomCustomizationCanEdit() || (picker && !picker.hidden)) return;

	CommonPromiseCatch(ColorPickerInit({
		colorState: ChatAdminRoomCustomizationFilterState(data.ImageFilter),
		heading: TextGet("BackgroundFilterLabel"),
		onInput: () => null,
		onExit: (state, save) => {
			if (!save) return;
			data.ImageFilter = ChatAdminRoomCustomizationFilterFromState(state);
			ChatAdminRoomCustomizationRefreshPreview();
		},
	}).then(root => root.classList.add("room-custom-color-picker")));
}

/**
 * Builds a background filter hex from a color picker result. Fully transparent values count as no filter.
 * @param {ItemColorExitState} state
 * @returns {string}
 */
function ChatAdminRoomCustomizationFilterFromState(state) {
	const opacity = CommonClamp(state.opacity[0] ?? 1, 0, 1);
	if (Math.round(opacity * 255) === 0) return "";
	return ColorPickerColorToCSS(state.colors[0] ?? "", opacity) ?? "";
}

/**
 * Updates the image preview from the current form data.
 */
function ChatAdminRoomCustomizationRefreshPreview() {
	const data = ChatAdminRoomCustomizationCurrent;
	const frame = ElementWrap(ChatAdminRoomCustomizationIDs.previewFrame);
	const image = /** @type {HTMLImageElement | null} */ (ElementWrap(ChatAdminRoomCustomizationIDs.previewImage));
	const filter = ElementWrap(ChatAdminRoomCustomizationIDs.previewFilter);
	if (!data || !frame || !image || !filter) return;

	const fit = ChatAdminRoomCustomizationSizeFit[data.SizeMode ?? DrawingResizeMode.Fill] ?? "fill";
	frame.setAttribute("data-fit", fit);

	const url = ServerChatRoomDataValidationRecord.Custom.ImageURL(data.ImageURL) ?? "";
	if (!url) {
		image.dataset.pending = "";
		image.removeAttribute("src");
		frame.toggleAttribute("data-empty", true);
	} else if (image.dataset.pending !== url) {
		image.dataset.pending = url;
		frame.toggleAttribute("data-empty", true);
		image.src = url;
	}

	const filterValue = data.ImageFilter ?? "";
	const filterColor = CommonIsColor(filterValue, { allowAlpha: true }) ? filterValue : "";
	filter.style.backgroundColor = filterColor;
	ElementWrap(ChatAdminRoomCustomizationIDs.filterPicker)?.style.setProperty("--button-color", filterColor || "#ffffff");
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
			CommonPromiseCatch(ChatAdminRoomCustomizationAudio.play());
		}
	} else {
		ChatAdminRoomCustomizationAudio?.pause();
		ChatAdminRoomCustomizationAudio = null;
	}
}

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
	const seen = new Set();
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
				if (seen.has(param)) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				seen.add(param);
				const arg = args.shift()?.trim();
				if (!arg) {
					ChatRoomSendLocal(`Missing argument for "${param}" parameter`);
					return;
				}
				if (arg === "-") {
					customData.ImageURL = undefined;
					break;
				}
				const safeArg = ServerChatRoomDataValidationRecord.Custom.ImageURL(arg);
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
				if (seen.has(param)) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				seen.add(param);
				const arg = args.shift()?.trim();
				if (!arg) {
					ChatRoomSendLocal(`Missing argument for "${param}" parameter`);
					return;
				}
				if (arg === "-") {
					customData.ImageFilter = undefined;
					break;
				}
				const safeArg = ServerChatRoomDataValidationRecord.Custom.ImageFilter(arg);
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
				if (seen.has(param)) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				seen.add(param);
				const arg = args.shift()?.trim();
				if (!arg) {
					ChatRoomSendLocal(`Missing argument for "${param}" parameter`);
					return;
				}
				if (arg.trim() === "-") {
					customData.MusicURL = undefined;
					break;
				}
				const safeArg = ServerChatRoomDataValidationRecord.Custom.MusicURL(arg);
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
				if (seen.has(param)) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				seen.add(param);
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
	UpdatedRoom.Custom = ServerChatRoomDataValidationRecord.Custom(customData);
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });
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
