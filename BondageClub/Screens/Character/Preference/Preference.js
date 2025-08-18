"use strict";
/**
 * The background to use for the settings screen
 */
var PreferenceBackground = "Sheet";

/**
 * A message shown by some subscreen
 * @type {string}
 */
var PreferenceMessage = "";

/**
 * The currently active subscreen
 *
 * @type {PreferenceSubscreen?}
 */
var PreferenceSubscreen = null;

/**
 * All the base settings screens
 * @type {PreferenceSubscreen[]}
 */
const PreferenceSubscreens = [
	{
		name: "Main",
		hidden: true,
		load: () => PreferenceSubscreenMainLoad(),
		run: () => PreferenceSubscreenMainRun(),
		click: () => PreferenceSubscreenMainClick(),
	},
	{
		name: "General",
		load: () => PreferenceSubscreenGeneralLoad(),
		run: () => PreferenceSubscreenGeneralRun(),
		click: () => PreferenceSubscreenGeneralClick(),
		exit: () => PreferenceSubscreenGeneralExit(),
		unload: () => PreferenceSubscreenGeneralUnload(),
	},
	{
		name: "Difficulty",
		run: () => PreferenceSubscreenDifficultyRun(),
		click: () => PreferenceSubscreenDifficultyClick(),
	},
	{
		name: "Restriction",
		run: () => PreferenceSubscreenRestrictionRun(),
		click: () => PreferenceSubscreenRestrictionClick(),
	},
	{
		name: "Chat",
		load: () => PreferenceSubscreenChatLoad(),
		run: () => PreferenceSubscreenChatRun(),
		click: () => PreferenceSubscreenChatClick(),
		exit: () => PreferenceSubscreenChatExit(),
	},
	{
		name: "CensoredWords",
		load: () => PreferenceSubscreenCensoredWordsLoad(),
		run: () => PreferenceSubscreenCensoredWordsRun(),
		click: () => PreferenceSubscreenCensoredWordsClick(),
		exit: () => PreferenceSubscreenCensoredWordsExit(),
		unload: () => PreferenceSubscreenCensoredWordsUnload(),
	},
	{
		name: "Audio",
		load: () => PreferenceSubscreenAudioLoad(),
		run: () => PreferenceSubscreenAudioRun(),
		click: () => PreferenceSubscreenAudioClick(),
		exit: () => PreferenceSubscreenAudioExit(),
		unload: () => PreferenceSubscreenAudioUnload(),
	},
	{
		name: "Arousal",
		load: () => PreferenceSubscreenArousalLoad(),
		run: () => PreferenceSubscreenArousalRun(),
		click: () => PreferenceSubscreenArousalClick(),
		exit: () => PreferenceSubscreenArousalExit(),
		unload: () => PreferenceSubscreenArousalUnload(),
	},
	{
		name: "Security",
		load: () => PreferenceSubscreenSecurityLoad(),
		run: () => PreferenceSubscreenSecurityRun(),
		click: () => PreferenceSubscreenSecurityClick(),
		exit: () => PreferenceSubscreenSecurityExit(),
		unload: () => PreferenceSubscreenSecurityUnload(),
	},
	{
		name: "Online",
		load: () => PreferenceSubscreenOnlineLoad(),
		run: () => PreferenceSubscreenOnlineRun(),
		click: () => PreferenceSubscreenOnlineClick(),
	},
	{
		name: "Visibility",
		load: () => PreferenceSubscreenVisibilityLoad(),
		run: () => PreferenceSubscreenVisibilityRun(),
		click: () => PreferenceSubscreenVisibilityClick(),
		exit: () => PreferenceSubscreenVisibilityExit(),
		unload: () => PreferenceSubscreenVisibilityUnload(),
	},
	{
		name: "Immersion",
		load: () => PreferenceSubscreenImmersionLoad(),
		run: () => PreferenceSubscreenImmersionRun(),
		click: () => PreferenceSubscreenImmersionClick(),
	},
	{
		name: "Graphics",
		load: () => PreferenceSubscreenGraphicsLoad(),
		run: () => PreferenceSubscreenGraphicsRun(),
		click: () => PreferenceSubscreenGraphicsClick(),
		exit: () => PreferenceSubscreenGraphicsExit(),
		unload: () => PreferenceSubscreenGraphicsUnload(),
	},
	{
		name: "Controller",
		load: () => PreferenceSubscreenControllerLoad(),
		run: () => PreferenceSubscreenControllerRun(),
		click: () => PreferenceSubscreenControllerClick(),
		exit: () => PreferenceSubscreenControllerExit(),
		unload: () => PreferenceSubscreenControllerUnload(),
	},
	{
		name: "Notifications",
		load: () => PreferenceSubscreenNotificationsLoad(),
		run: () => PreferenceSubscreenNotificationsRun(),
		click: () => PreferenceSubscreenNotificationsClick(),
		exit: () => PreferenceSubscreenNotificationsExit(),
		unload: () => PreferenceSubscreenNotificationsUnload(),
	},
	{
		name: "Gender",
		run: () => PreferenceSubscreenGenderRun(),
		click: () => PreferenceSubscreenGenderClick(),
	},
	{
		name: "Scripts",
		load: () => PreferenceSubscreenScriptsLoad(),
		run: () => PreferenceSubscreenScriptsRun(),
		click: () => PreferenceSubscreenScriptsClick(),
		exit: () => PreferenceSubscreenScriptsExit(),
		unload: () => PreferenceSubscreenScriptsUnload(),
	},
	{
		name: "Extensions",
		load: () => PreferenceSubscreenExtensionsLoad(),
		run: () => PreferenceSubscreenExtensionsRun(),
		click: () => PreferenceSubscreenExtensionsClick(),
		exit: () => PreferenceSubscreenExtensionsExit(),
		unload: () => PreferenceSubscreenExtensionsUnload(),
	},
];

/**
 * The current page ID for multi-page screens.
 *
 * This is automatically reset to 1 when a screen loads
 */
var PreferencePageCurrent = 1;

/** @type {Record<string,PreferenceExtensionsSettingItem>} */
let PreferenceExtensionsSettings = {};

/**
 * Open a specific subscreen
 * @param {PreferenceSubscreenName} subscreen
 * @param {number} page
 */
async function PreferenceOpenSubscreen(subscreen, page = 1) {
	if (CurrentModule !== "Character" || CurrentScreen !== "Preference") {
		await CommonSetScreen("Character", "Preference");
	}
	PreferenceSubscreen?.unload?.();

	PreferenceSubscreen = PreferenceSubscreens.find(s => s.name === subscreen) ?? null;
	if (!CommonIsNonNegativeInteger(page)) page = 1;
	PreferencePageCurrent = page;
	PreferenceMessage = "";
	PreferenceSubscreen?.load?.();
}

/**
 * Loads the preference screen. This function is called dynamically, when the character enters the preference screen
 * for the first time
 * @type {ScreenLoadHandler}
 */
async function PreferenceLoad() {
	await PreferenceOpenSubscreen("Main");
}

/**
 * Runs the preference screen. This function is called dynamically on a repeated basis.
 * So don't use complex loops or other function calls within this method
 * @returns {void} - Nothing
 */
function PreferenceRun() {
	// Backward-compatibility: automatically substitute strings for the actual subscreen
	if (typeof PreferenceSubscreen === "string") {
		const subscreenName = PreferenceSubscreen === "" ? "Main" : PreferenceSubscreen;
		PreferenceSubscreen = PreferenceSubscreens.find(s => s.name === subscreenName);
		if (!PreferenceSubscreen) PreferenceSubscreen = PreferenceSubscreens.find(s => s.name === "Main");
	}
	PreferenceSubscreen.run();
}

/**
 * Handles click events in the preference screen that are propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceClick() {
	if (ControllerIsActive()) {
		ControllerClearAreas();
	}
	PreferenceSubscreen.click();
}

/**
 * Is called when the player exits the preference screen. All settings of the preference screen are sent to the server.
 * If the player is in a subscreen, they exit to the main preferences menu instead.
 * @type {ScreenExitHandler}
 */
function PreferenceExit() {
	if (PreferenceSubscreen.name !== "Main") {
		// If we are in a subscreen, the only exit is to the main preference screen
		PreferenceSubscreenExit();
		return;
	}

	// Exit the preference menus
	// Only a normal exit triggers an update to server. so we don't send data in unload function,
	// which could be called from disconnects
	const P = {
		ArousalSettings: Player.ArousalSettings,
		ChatSettings: Player.ChatSettings,
		VisualSettings: Player.VisualSettings,
		AudioSettings: Player.AudioSettings,
		ControllerSettings: Player.ControllerSettings,
		GameplaySettings: Player.GameplaySettings,
		ImmersionSettings: Player.ImmersionSettings,
		RestrictionSettings: Player.RestrictionSettings,
		OnlineSettings: Player.OnlineSettings,
		OnlineSharedSettings: Player.OnlineSharedSettings,
		GraphicsSettings: Player.GraphicsSettings,
		NotificationSettings: Player.NotificationSettings,
		GenderSettings: Player.GenderSettings,
		ItemPermission: Player.AllowedInteractions,
		AllowedInteractions: Player.AllowedInteractions,
		LabelColor: Player.LabelColor,
		...ServerPackItemPermissions(Player.PermissionItems),
	};
	ServerAccountUpdate.QueueData(P);
	PreferenceMessage = "";
	CommonSetScreen("Character", "InformationSheet");
}

/**
 * Clear all GUI data and DOM elements creates by the preference screen load function
 * We don't do this in exit function for disconnects do not trigger the exit function
 */
function PreferenceUnload() {
	if (PreferenceSubscreen.name !== "Main") {
		PreferenceSubscreen.unload?.();
	}
}

/**
 * Exit from a specific subscreen by running its handler and checking its validity
 */
function PreferenceSubscreenExit() {
	const validExit = PreferenceSubscreen.exit?.();

	// Only when the results is false (not undefined)
	// The exit is just a exit of the subscreen's substate, return to block more exit.
	if (validExit === false) return;

	PreferenceOpenSubscreen("Main");
}

/**
 * Draw a button to navigate multiple pages in a preference subscreen
 * @param {number} Left - The X co-ordinate of the button
 * @param {number} Top - The Y co-ordinate of the button
 * @param {number} TotalPages - The total number of pages on the subscreen
 * @returns {void} - Nothing
 */
function PreferencePageChangeDraw(Left, Top, TotalPages) {
	DrawBackNextButton(Left, Top, 200, 90, TextGet("Page") + " " + PreferencePageCurrent.toString() + "/" + TotalPages.toString(), "White", "", () => "", () => "");
}

/**
 * Handles clicks of the button to navigate multiple pages in a preference subscreen
 * @param {number} Left - The X co-ordinate of the button
 * @param {number} Top - The Y co-ordinate of the button
 * @param {number} TotalPages - The total number of pages on the subscreen
 * @returns {void} - Nothing
 */
function PreferencePageChangeClick(Left, Top, TotalPages) {
	if (MouseIn(Left, Top, 100, 90)) {
		PreferencePageCurrent--;
		if (PreferencePageCurrent < 1) PreferencePageCurrent = TotalPages;
	}
	else if (MouseIn(Left + 100, Top, 100, 90)) {
		PreferencePageCurrent++;
		if (PreferencePageCurrent > TotalPages) PreferencePageCurrent = 1;
	}
}

/**
 * Draws a back/next button for use on preference pages
 * @param {number} Left - The left offset of the button
 * @param {number} Top - The top offset of the button
 * @param {number} Width - The width of the button
 * @param {number} Height - The height of the button
 * @param {readonly string[]} List - The preference list that the button should be associated with
 * @param {number} Index - The current preference index for the given preference list
 * @returns {void} - Nothing
 */
function PreferenceDrawBackNextButton(Left, Top, Width, Height, List, Index) {
	DrawBackNextButton(Left, Top, Width, Height, TextGet(List[Index]), "White", "",
		() => TextGet(List[PreferenceGetPreviousIndex(List, Index)]),
		() => TextGet(List[PreferenceGetNextIndex(List, Index)]),
	);
}

/**
 * Returns the index of the previous preference list item (and wraps back to the end of the list if currently at 0)
 * @param {readonly unknown[]} List - The preference list
 * @param {number} Index - The current preference index for the given list
 * @returns {number} - The index of the previous item in the array, or the last item in the array if currently at 0
 */
function PreferenceGetPreviousIndex(List, Index) {
	return (List.length + Index - 1) % List.length;
}

/**
 * Returns the index of the next preference list item (and wraps back to the start of the list if currently at the end)
 * @param {readonly unknown[]} List - The preference list
 * @param {number} Index - The current preference index for the given list
 * @returns {number} - The index of the next item in the array, or 0 if the array is currently at the last item
 */
function PreferenceGetNextIndex(List, Index) {
	return (Index + 1) % List.length;
}

/**
 * Private helper to quickly check boolean settings
 * @param {boolean} defaultValue
 * @returns {(arg: boolean) => boolean}
 */
const isBool = (defaultValue) => {
	return (arg) => {
		return typeof arg === "boolean" ? arg : defaultValue;
	};
};

/**
 * Private helper to quickly check items in lists
 * @template T
 * @param {T[]} list
 * @param {T} defaultValue
 * @returns {(arg: unknown) => T}
 */
const isItem = (list, defaultValue) => {
	return (arg) => {
		return CommonIncludes(list, arg) ? arg : defaultValue;
	};
};

/**
 * Private helper to quickly check numbers
 * @template {number} T
 * @param {number} min
 * @param {number} max
 * @param {T} defaultValue
 * @returns {(arg: T) => T}
 */
const isInt = (min, max, defaultValue) => {
	return (arg) => {
		return CommonIsInteger(arg, min, max) ? /** @type {typeof defaultValue} */(arg) : defaultValue;
	};
};

/**
 * Namespace with default values for {@link ActivityEnjoyment} properties.
 * @satisfies {ActivityEnjoyment}
 * @namespace
 */
var PreferenceActivityEnjoymentDefault = {
	/** @type {ActivityName | undefined} */
	Name: undefined,
	/** @type {ArousalFactor} */
	Self: 2,
	/** @type {ArousalFactor} */
	Other: 2,
};

/**
 * Namespace with default values for {@link ActivityEnjoyment} properties.
 * @satisfies {{ [k in keyof ActivityEnjoyment]: (arg: ActivityEnjoyment[k], C: Character) => ActivityEnjoyment[k] }}
 * @namespace
 */
var PreferenceActivityEnjoymentValidate = {
	/** @type {(arg: ActivityName, C: Character) => undefined | ActivityName} */
	Name: (arg, C) => {
		if (C.IsPlayer()) {
			return typeof arg === "string" ? /** @type {ActivityName} */(arg) : PreferenceActivityEnjoymentDefault.Name;
		} else {
			return CommonIncludes(ActivityFemale3DCGOrdering, arg) ? arg : PreferenceActivityEnjoymentDefault.Name;
		}
	},
	Self: (arg, C) => {
		return CommonIsInteger(arg, 0, 4) ? /** @type {ArousalFactor} */(arg) : PreferenceActivityEnjoymentDefault.Self;
	},
	Other: (arg, C) => {
		return CommonIsInteger(arg, 0, 4) ? /** @type {ArousalFactor} */(arg) : PreferenceActivityEnjoymentDefault.Other;
	},
};

/**
 * Namespace with default values for {@link ArousalFetish} properties.
 * @satisfies {ArousalFetish}
 * @namespace
 */
var PreferenceArousalFetishDefault = {
	/** @type {FetishName | undefined} */
	Name: undefined,
	/** @type {ArousalFactor} */
	Factor: 2,
};

/**
 * Namespace with default values for {@link ArousalFetish} properties.
 * @type {{ [k in keyof ArousalFetish]: (arg: ArousalFetish[k], C: Character) => ArousalFetish[k] }}
 * @namespace
 */
var PreferenceArousalFetishValidate = {
	Name: (arg, C) => {
		return CommonHas(FetishFemale3DCGNames, arg) ? arg : PreferenceArousalFetishDefault.Name;
	},
	Factor: (arg, C) => {
		return CommonIsInteger(arg, 0, 4) ? /** @type {ArousalFactor} */(arg) : PreferenceArousalFetishDefault.Factor;
	},
};

/**
 * Namespace with default values for {@link ArousalZone} properties.
 * @satisfies {ArousalZone}
 * @namespace
 */
var PreferenceArousalZoneDefault = {
	/** @type {AssetGroupItemName | undefined} */
	Name: undefined,
	/** @type {ArousalFactor} */
	Factor: 2,
	/** @type {boolean} */
	Orgasm: false,
};

/**
 * Namespace with default values for {@link ArousalZone} properties.
 * @satisfies {{ [k in keyof ArousalZone]: (arg: ArousalZone[k], C: Character) => ArousalZone[k] }}
 * @namespace
 */
var PreferenceArousalZoneValidate = {
	/** @type {(arg: AssetGroupName, C: Character) => undefined | AssetGroupItemName} */
	Name: (arg, C) => {
		const group = AssetGroup.find(i => i.Name === arg);
		if (
			group?.IsItem()
			&& AssetActivitiesForGroup("Female3DCG", arg, "any").length
		) {
			return group.Name;
		} else {
			return PreferenceArousalZoneDefault.Name;
		}
	},
	Factor: (arg, C) => {
		return CommonIsInteger(arg, 0, 4) ? /** @type {ArousalFactor} */(arg) : PreferenceArousalZoneDefault.Factor;
	},
	Orgasm: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceArousalZoneDefault.Orgasm;
	},
};

/**
 * Namespace with default values for {@link ArousalSettingsType} properties.
 * @type {Required<ArousalSettingsType>}
 * @namespace
 */
var PreferenceArousalSettingsDefault = {
	Active: "Hybrid",
	Visible: "Access",
	ShowOtherMeter: true,
	AffectExpression: true,
	AffectStutter: "All",
	VFX: "VFXAnimatedTemp",
	VFXVibrator: "VFXVibratorAnimated",
	VFXFilter: "VFXFilterLight",
	Progress: 0,
	ProgressTimer: 0,
	VibratorLevel: 0,
	ChangeTime: 0,
	Activity: PreferenceArousalActivityDefaultCompressedString,
	Zone: PreferenceArousalZoneDefaultCompressedString,
	Fetish: PreferenceArousalFetishDefaultCompressedString,
	OrgasmTimer: 0,
	OrgasmStage: 0,
	OrgasmCount: 0,
	DisableAdvancedVibes: false,
};

/**
 * Namespace with functions for validating {@link ArousalSettingsType} properties
 * @type {{ [k in keyof Required<ArousalSettingsType>]: (arg: ArousalSettingsType[k], C: Character) => ArousalSettingsType[k] }}
 * @namespace
 */
var PreferenceArousalSettingsValidate = {
	Active: (arg, C) => {
		return CommonIncludes(PreferenceArousalActiveList, arg) ? arg : PreferenceArousalSettingsDefault.Active;
	},
	Visible: (arg, C) => {
		return CommonIncludes(PreferenceArousalVisibleList, arg) ? arg : PreferenceArousalSettingsDefault.Visible;
	},
	ShowOtherMeter: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceArousalSettingsDefault.ShowOtherMeter;
	},
	AffectExpression: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceArousalSettingsDefault.AffectExpression;
	},
	AffectStutter: (arg, C) => {
		return CommonIncludes(PreferenceArousalAffectStutterList, arg) ? arg : PreferenceArousalSettingsDefault.AffectStutter;
	},
	VFX: (arg, C) => {
		return CommonIncludes(PreferenceSettingsVFXList, arg) ? arg : PreferenceArousalSettingsDefault.VFX;
	},
	VFXVibrator: (arg, C) => {
		return CommonIncludes(PreferenceSettingsVFXVibratorList, arg) ? arg : PreferenceArousalSettingsDefault.VFXVibrator;
	},
	VFXFilter: (arg, C) => {
		return CommonIncludes(PreferenceSettingsVFXFilterList, arg) ? arg : PreferenceArousalSettingsDefault.VFXFilter;
	},
	Progress: (arg, C) => {
		return CommonIsInteger(arg, 0, 100) ? arg : PreferenceArousalSettingsDefault.Progress;
	},
	ProgressTimer: (arg, C) => {
		return CommonIsInteger(arg, 0, 100) ? arg : PreferenceArousalSettingsDefault.ProgressTimer;
	},
	VibratorLevel: (arg, C) => {
		return CommonIsInteger(arg, 0, 4) ? /** @type {0 | 1 | 2 | 3 | 4} */(arg) : PreferenceArousalSettingsDefault.VibratorLevel;
	},
	ChangeTime: (arg, C) => {
		return CommonIsInteger(arg, 0, CommonTime()) ? arg : PreferenceArousalSettingsDefault.ChangeTime;
	},
	Activity: (arg, C) => {
		let A = (typeof arg === "string" && arg != null) ? arg : PreferenceArousalActivityDefaultCompressedString;
		while (A.length < PreferenceArousalActivityDefaultCompressedString.length)
			A = A + PreferenceArousalTwoFactorToChar();
		return A;
	},
	Zone: (arg, C) => {
		let Z = (typeof arg === "string" && arg != null) ? arg : PreferenceArousalZoneDefaultCompressedString;
		while (Z.length < PreferenceArousalZoneDefaultCompressedString.length)
			Z = Z + PreferenceArousalFactorToChar();
		return Z;
	},
	Fetish: (arg, C) => {
		let F = (typeof arg === "string" && arg != null) ? arg : PreferenceArousalFetishDefaultCompressedString;
		while (F.length < PreferenceArousalFetishDefaultCompressedString.length)
			F = F + PreferenceArousalFactorToChar();
		return F;
	},
	OrgasmTimer: (arg, C) => {
		return CommonIsFinite(arg, 0) ? arg : PreferenceArousalSettingsDefault.OrgasmTimer;
	},
	OrgasmStage: (arg, C) => {
		return CommonIsInteger(arg, 0, 2) ? /** @type {0 | 1 | 2} */(arg) : PreferenceArousalSettingsDefault.OrgasmStage;
	},
	OrgasmCount: (arg, C) => {
		return CommonIsInteger(arg, 0) ? arg : PreferenceArousalSettingsDefault.OrgasmCount;
	},
	DisableAdvancedVibes: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceArousalSettingsDefault.DisableAdvancedVibes;
	},
};

/**
 * Namespace with default values for {@link CharacterOnlineSharedSettings} properties.
 * @type {CharacterOnlineSharedSettings}
 * @namespace
 */
var PreferenceOnlineSharedSettingsDefault = {
	GameVersion: undefined,
	AllowFullWardrobeAccess: false,
	BlockBodyCosplay: false,
	AllowPlayerLeashing: true,
	AllowRename: true,
	DisablePickingLocksOnSelf: false,
	ItemsAffectExpressions: true,
	WheelFortune: "", // Initialized in `WheelFortune.js`
	ScriptPermissions: {
		Hide: { permission: 0 },
		Block: { permission: 0 },
	},
};

/**
 * Namespace with default values for {@link CharacterOnlineSharedSettings} properties.
 * @type {{ [k in keyof Required<CharacterOnlineSharedSettings>]: (arg: CharacterOnlineSharedSettings[k], C: Character) => CharacterOnlineSharedSettings[k] }}
 * @namespace
 */
var PreferenceOnlineSharedSettingsValidate = {
	GameVersion: (arg, C) => {
		let version = typeof arg === "string" ? arg : PreferenceOnlineSharedSettingsDefault.GameVersion;
		if (C.IsPlayer()) {
			if (CommonCompareVersion(GameVersion, version ?? "R0") < 0) {
				CommonVersionUpdated = true;
			}
			version = GameVersion;
		}
		return version;
	},
	AllowFullWardrobeAccess: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.AllowFullWardrobeAccess;
	},
	BlockBodyCosplay: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.BlockBodyCosplay;
	},
	AllowPlayerLeashing: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.AllowPlayerLeashing;
	},
	AllowRename: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.AllowRename;
	},
	DisablePickingLocksOnSelf: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.DisablePickingLocksOnSelf;
	},
	ItemsAffectExpressions: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.ItemsAffectExpressions;
	},
	WheelFortune: (arg, C) => {
		return typeof arg === "string" ? arg : PreferenceOnlineSharedSettingsDefault.WheelFortune;
	},
	ScriptPermissions: (arg, C) => {
		if (!CommonIsObject(arg)) {
			return CommonCloneDeep(PreferenceOnlineSharedSettingsDefault.ScriptPermissions);
		}

		return {
			Hide: {
				permission: CommonIsInteger(arg.Hide?.permission, 0, maxScriptPermission) ? arg.Hide.permission : 0,
			},
			Block: {
				permission: CommonIsInteger(arg.Block?.permission, 0, maxScriptPermission) ? arg.Block.permission : 0,
			},
		};
	},
};


/**
 * Namespace with default values for {@link ChatSettingsType} properties.
 * @type {Required<ChatSettingsType>}
 * @namespace
 */
var PreferenceChatSettingsDefault = {
	ColorActions: true,
	ColorActivities: true,
	ColorEmotes: true,
	ColorNames: true,
	ColorTheme: "Light",
	DisplayTimestamps: true,
	EnterLeave: "Normal",
	FontSize: "Medium",
	MemberNumbers: "Always",
	MuStylePoses: false,
	ShowActivities: true,
	ShowAutomaticMessages: false,
	ShowBeepChat: true,
	ShowChatHelp: true,
	ShrinkNonDialogue: false,
	WhiteSpace: "Preserve",
	CensoredWordsList: "",
	CensoredWordsLevel: 0,
	PreserveChat: true,
	OOCAutoClose: true,
	DisableReplies: false,
};

/**
 * Namespace with functions for validating {@link ChatSettingsType} properties
 * @type {{ [k in keyof Required<ChatSettingsType>]: (arg: ChatSettingsType[k], C: Character) => ChatSettingsType[k] }}
 * @namespace
 */
var PreferenceChatSettingsValidate = {
	ColorActions: isBool(PreferenceChatSettingsDefault.ColorActions),
	ColorActivities: isBool(PreferenceChatSettingsDefault.ColorActivities),
	ColorEmotes: isBool(PreferenceChatSettingsDefault.ColorEmotes),
	ColorNames: isBool(PreferenceChatSettingsDefault.ColorNames),
	ColorTheme: isItem(PreferenceChatColorThemeList, PreferenceChatSettingsDefault.ColorTheme),
	DisplayTimestamps: isBool(PreferenceChatSettingsDefault.DisplayTimestamps),
	EnterLeave: isItem(PreferenceChatEnterLeaveList, PreferenceChatSettingsDefault.EnterLeave),
	FontSize: isItem(PreferenceChatFontSizeList, PreferenceChatSettingsDefault.FontSize),
	MemberNumbers: isItem(PreferenceChatMemberNumbersList, PreferenceChatSettingsDefault.MemberNumbers),
	MuStylePoses: isBool(PreferenceChatSettingsDefault.MuStylePoses),
	ShowActivities: isBool(PreferenceChatSettingsDefault.ShowActivities),
	ShowAutomaticMessages: isBool(PreferenceChatSettingsDefault.ShowAutomaticMessages),
	ShowBeepChat: isBool(PreferenceChatSettingsDefault.ShowBeepChat),
	ShowChatHelp: isBool(PreferenceChatSettingsDefault.ShowChatHelp),
	ShrinkNonDialogue: isBool(PreferenceChatSettingsDefault.ShrinkNonDialogue),
	WhiteSpace: isItem(["", "Preserve"], PreferenceChatSettingsDefault.WhiteSpace),
	CensoredWordsList: (arg, C) => {
		return typeof arg === "string" ? arg : PreferenceChatSettingsDefault.CensoredWordsList;
	},
	CensoredWordsLevel: (arg, C) => {
		return CommonIsInteger(arg, 0, 2) ? arg : PreferenceChatSettingsDefault.CensoredWordsLevel;
	},
	PreserveChat: isBool(PreferenceChatSettingsDefault.PreserveChat),
	OOCAutoClose: isBool(PreferenceChatSettingsDefault.OOCAutoClose),
	DisableReplies: isBool(PreferenceChatSettingsDefault.DisableReplies),
};

/**
 * Namespace with default values for {@link VisualSettingsType} properties.
 * @type {Required<VisualSettingsType>}
 * @namespace
 */
var PreferenceVisualSettingsDefault = {
	ForceFullHeight: false,
	UseCharacterInPreviews: false,
	MainHallBackground: undefined,
	PrivateRoomBackground: undefined,
};

/**
 * Namespace with functions for validating {@link VisualSettingsType} properties
 * @type {{ [k in keyof Required<VisualSettingsType>]: (arg: VisualSettingsType[k], C: Character) => VisualSettingsType[k] }}
 * @namespace
 */
var PreferenceVisualSettingsValidate = {
	ForceFullHeight: isBool(PreferenceVisualSettingsDefault.ForceFullHeight),
	UseCharacterInPreviews: isBool(PreferenceVisualSettingsDefault.UseCharacterInPreviews),
	MainHallBackground: (arg, C) => {
		return typeof arg === "string" && arg.length && arg !== "MainHall" ? arg : PreferenceVisualSettingsDefault.MainHallBackground;
	},
	PrivateRoomBackground: (arg, C) => {
		return typeof arg === "string" && arg.length && arg !== "Private" ? arg : PreferenceVisualSettingsDefault.PrivateRoomBackground;
	}
};

/**
 * Namespace with default values for {@link AudioSettingsType} properties.
 * @type {Required<AudioSettingsType>}
 * @namespace
 */
var PreferenceAudioSettingsDefault = {
	Volume: 1,
	MusicVolume: 1,
	PlayItem: false,
	PlayItemPlayerOnly: false,
	Notifications: false,
	// @ts-expect-error deprecated
	PlayBeeps: undefined,
};

/**
 * Namespace with functions for validating {@link AudioSettingsType} properties
 * @type {{ [k in keyof Required<AudioSettingsType>]: (arg: AudioSettingsType[k], C: Character) => AudioSettingsType[k] }}
 * @namespace
 */
var PreferenceAudioSettingsValidate = {
	Volume: (arg) => {
		return CommonIsFinite(arg, 0, 1) ? arg : PreferenceAudioSettingsDefault.Volume;
	},
	MusicVolume: (arg) => {
		return CommonIsFinite(arg, 0, 1) ? arg : PreferenceAudioSettingsDefault.MusicVolume;
	},
	PlayItem: isBool(PreferenceAudioSettingsDefault.PlayItem),
	PlayItemPlayerOnly: isBool(PreferenceAudioSettingsDefault.PlayItemPlayerOnly),
	Notifications: isBool(PreferenceAudioSettingsDefault.Notifications),
	// @ts-expect-error deprecated
	PlayBeeps: (arg) => undefined,
};

/**
 * Namespace with default values for {@link ControllerSettingsType} properties.
 * @type {Required<ControllerSettingsType>}
 * @namespace
 */
var PreferenceControllerSettingsDefault = {
	ControllerActive: false,
	ControllerSensitivity: 5,
	ControllerDeadZone: 0.01,
	Buttons: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16 },
	Axis: {0: 0, 1: 1, 2: 2, 3: 3},
};

/**
 * Namespace with functions for validating {@link ControllerSettingsType} properties
 * @type {{ [k in keyof Required<ControllerSettingsType>]: (arg: ControllerSettingsType[k], C: Character) => ControllerSettingsType[k] }}
 * @namespace
 */
var PreferenceControllerSettingsValidate = {
	ControllerActive: isBool(PreferenceControllerSettingsDefault.ControllerActive),
	ControllerSensitivity: isItem(PreferenceSettingsSensitivityList, PreferenceControllerSettingsDefault.ControllerSensitivity),
	ControllerDeadZone: isItem(PreferenceSettingsDeadZoneList, PreferenceControllerSettingsDefault.ControllerDeadZone),
	Buttons: (arg) => { return arg; },
	Axis: (arg) => { return arg; },
};

/**
 * Namespace with default values for {@link GameplaySettingsType} properties.
 * @type {Required<GameplaySettingsType>}
 * @namespace
 */
var PreferenceGameplaySettingsDefault = {
	SensDepChatLog: "Normal",
	BlindDisableExamine: false,
	DisableAutoRemoveLogin: false,
	ImmersionLockSetting: false,
	EnableSafeword: true,
	DisableAutoMaid: false,
	OfflineLockedRestrained: false,
};

/**
 * Namespace with functions for validating {@link GameplaySettingsType} properties
 * @type {{ [k in keyof Required<GameplaySettingsType>]: (arg: GameplaySettingsType[k], C: Character) => GameplaySettingsType[k] }}
 * @namespace
 */
var PreferenceGameplaySettingsValidate = {
	SensDepChatLog: isItem(PreferenceSettingsSensDepList, PreferenceGameplaySettingsDefault.SensDepChatLog),
	BlindDisableExamine: isBool(PreferenceGameplaySettingsDefault.BlindDisableExamine),
	DisableAutoRemoveLogin: isBool(PreferenceGameplaySettingsDefault.DisableAutoRemoveLogin),
	ImmersionLockSetting: isBool(PreferenceGameplaySettingsDefault.ImmersionLockSetting),
	EnableSafeword: isBool(PreferenceGameplaySettingsDefault.EnableSafeword),
	DisableAutoMaid: isBool(PreferenceGameplaySettingsDefault.DisableAutoMaid),
	OfflineLockedRestrained: isBool(PreferenceGameplaySettingsDefault.OfflineLockedRestrained),
};

/**
 * Namespace with default values for {@link ImmersionSettingsType} properties.
 * @type {Required<ImmersionSettingsType>}
 * @namespace
 */
var PreferenceImmersionSettingsDefault = {
	StimulationEvents: true,
	ReturnToChatRoom: false,
	ReturnToChatRoomAdmin: false,
	ChatRoomMapLeaveOnExit: false,
	SenseDepMessages: false,
	ChatRoomMuffle: false,
	BlindAdjacent: false,
	AllowTints: true,
	ShowUngarbledMessages: true,
	// @ts-expect-error deprecated
	BlockGaggedOOC: undefined,
};

/**
 * Namespace with functions for validating {@link ImmersionSettingsType} properties
 * @type {{ [k in keyof Required<ImmersionSettingsType>]: (arg: ImmersionSettingsType[k], C: Character) => ImmersionSettingsType[k] }}
 * @namespace
 */
var PreferenceImmersionSettingsValidate = {
	StimulationEvents: isBool(PreferenceImmersionSettingsDefault.StimulationEvents),
	ReturnToChatRoom: isBool(PreferenceImmersionSettingsDefault.ReturnToChatRoom),
	ReturnToChatRoomAdmin: isBool(PreferenceImmersionSettingsDefault.ReturnToChatRoomAdmin),
	ChatRoomMapLeaveOnExit: isBool(PreferenceImmersionSettingsDefault.ChatRoomMapLeaveOnExit),
	SenseDepMessages: isBool(PreferenceImmersionSettingsDefault.SenseDepMessages),
	ChatRoomMuffle: isBool(PreferenceImmersionSettingsDefault.ChatRoomMuffle),
	BlindAdjacent: isBool(PreferenceImmersionSettingsDefault.BlindAdjacent),
	AllowTints: isBool(PreferenceImmersionSettingsDefault.AllowTints),
	ShowUngarbledMessages: isBool(PreferenceImmersionSettingsDefault.ShowUngarbledMessages),
	// @ts-expect-error deprecated
	BlockGaggedOOC: (arg) => undefined,
};

/**
 * Namespace with default values for {@link RestrictionSettingsType} properties.
 * @type {Required<RestrictionSettingsType>}
 * @namespace
 */
var PreferenceRestrictionSettingsDefault = {
	BypassStruggle: false,
	SlowImmunity: false,
	BypassNPCPunishments: false,
	NoSpeechGarble: false,
};

/**
 * Namespace with functions for validating {@link RestrictionSettingsType} properties
 * @type {{ [k in keyof Required<RestrictionSettingsType>]: (arg: RestrictionSettingsType[k], C: Character) => RestrictionSettingsType[k] }}
 * @namespace
 */
var PreferenceRestrictionSettingsValidate = {
	BypassStruggle: isBool(PreferenceRestrictionSettingsDefault.BypassStruggle),
	SlowImmunity: isBool(PreferenceRestrictionSettingsDefault.SlowImmunity),
	BypassNPCPunishments: isBool(PreferenceRestrictionSettingsDefault.BypassNPCPunishments),
	NoSpeechGarble: isBool(PreferenceRestrictionSettingsDefault.NoSpeechGarble),
};

/**
 * Namespace with default values for {@link PlayerOnlineSettings} properties.
 * @type {Required<PlayerOnlineSettings>}
 * @namespace
 */
var PreferenceOnlineSettingsDefault = {
	AutoBanBlackList: false,
	AutoBanGhostList: true,
	DisableAnimations: false,
	SearchShowsFullRooms: true,
	SearchFriendsFirst: false,
	EnableAfkTimer: true,
	ShowStatus: true,
	SendStatus: true,
	FriendListAutoRefresh: true,
	ShowRoomCustomization: 1,
	DefaultChatRoomBackground: "CosyChalet"
};

/**
 * Namespace with functions for validating {@link PlayerOnlineSettings} properties
 * @type {{ [k in keyof Required<PlayerOnlineSettings>]: (arg: PlayerOnlineSettings[k], C: Character) => PlayerOnlineSettings[k] }}
 * @namespace
 */
var PreferenceOnlineSettingsValidate = {
	AutoBanBlackList: isBool(PreferenceOnlineSettingsDefault.AutoBanBlackList),
	AutoBanGhostList: isBool(PreferenceOnlineSettingsDefault.AutoBanGhostList),
	DisableAnimations: isBool(PreferenceOnlineSettingsDefault.DisableAnimations),
	SearchShowsFullRooms: isBool(PreferenceOnlineSettingsDefault.SearchShowsFullRooms),
	SearchFriendsFirst: isBool(PreferenceOnlineSettingsDefault.SearchFriendsFirst),
	EnableAfkTimer: isBool(PreferenceOnlineSettingsDefault.EnableAfkTimer),
	ShowStatus: isBool(PreferenceOnlineSettingsDefault.ShowStatus),
	SendStatus: isBool(PreferenceOnlineSettingsDefault.SendStatus),
	FriendListAutoRefresh: isBool(PreferenceOnlineSettingsDefault.FriendListAutoRefresh),
	ShowRoomCustomization: isInt(0, 4, PreferenceOnlineSettingsDefault.ShowRoomCustomization),
	DefaultChatRoomBackground: (arg, C) => {
		return typeof arg === "string" ? arg : PreferenceOnlineSettingsDefault.DefaultChatRoomBackground;
	},
};

/**
 * Namespace with default values for {@link GraphicsSettingsType} properties.
 * @type {Required<GraphicsSettingsType>}
 * @namespace
 */
var PreferenceGraphicsSettingsDefault = {
	Font: "Arial",
	InvertRoom: true,
	StimulationFlash: false,
	DoBlindFlash: false,
	AnimationQuality: 100,
	SmoothZoom: true,
	CenterChatrooms: true,
	AllowBlur: true,
	MaxFPS: DEFAULT_FRAMERATE,
	MaxUnfocusedFPS: 0,
	ShowFPS: false,
};

/**
 * Namespace with functions for validating {@link GraphicsSettingsType} properties
 * @type {{ [k in keyof Required<GraphicsSettingsType>]: (arg: GraphicsSettingsType[k], C: Character) => GraphicsSettingsType[k] }}
 * @namespace
 */
var PreferenceGraphicsSettingsValidate = {
	Font: isItem(PreferenceGraphicsFontList, PreferenceGraphicsSettingsDefault.Font),
	InvertRoom: isBool(PreferenceGraphicsSettingsDefault.InvertRoom),
	StimulationFlash: isBool(PreferenceGraphicsSettingsDefault.StimulationFlash),
	DoBlindFlash: isBool(PreferenceGraphicsSettingsDefault.DoBlindFlash),
	AnimationQuality: isItem(PreferenceGraphicsAnimationQualityList, PreferenceGraphicsSettingsDefault.AnimationQuality),
	SmoothZoom: isBool(PreferenceGraphicsSettingsDefault.SmoothZoom),
	CenterChatrooms: isBool(PreferenceGraphicsSettingsDefault.CenterChatrooms),
	AllowBlur: isBool(PreferenceGraphicsSettingsDefault.AllowBlur),
	MaxFPS: isItem(PreferenceGraphicsFrameLimit, PreferenceGraphicsSettingsDefault.MaxFPS),
	MaxUnfocusedFPS: isItem(PreferenceGraphicsFrameLimit, PreferenceGraphicsSettingsDefault.MaxUnfocusedFPS),
	ShowFPS: isBool(PreferenceGraphicsSettingsDefault.ShowFPS),
};

/**
 * Namespace with default values for {@link GenderSettingsType} properties.
 * @type {Required<GenderSettingsType>}
 * @namespace
 */
var PreferenceGenderSettingsDefault = {
	AutoJoinSearch: { Female: false, Male: false },
	HideShopItems: { Female: false, Male: false },
	HideTitles: { Female: false, Male: false },
};

/**
 * @template {object} T
 * @param {T} shape
 * @returns {(arg: T) => T}
 */
const hasSameShape = (shape) => {
	return (arg) => {
		return CommonIsObject(arg) && CommonArraysEqual(CommonKeys(arg), CommonKeys(shape)) ? arg : shape;
	};
};

/**
 * Namespace with functions for validating {@link GenderSettingsType} properties
 * @type {{ [k in keyof Required<GenderSettingsType>]: (arg: GenderSettingsType[k], C: Character) => GenderSettingsType[k] }}
 * @namespace
 */
var PreferenceGenderSettingsValidate = {
	AutoJoinSearch: hasSameShape(PreferenceGenderSettingsDefault.AutoJoinSearch),
	HideShopItems: hasSameShape(PreferenceGenderSettingsDefault.HideShopItems),
	HideTitles: hasSameShape(PreferenceGenderSettingsDefault.HideTitles),
};


/**
 * Private helper to quick check notification settings
 * @param {NotificationSetting} defaultNotif
 * @returns {(arg: NotificationSetting) => NotificationSetting}
 */
const isValidNotification = (defaultNotif) => {
	return (arg) => {
		return {
			Audio: /** @type {NotificationAudioType} */ (isInt(0, 2, defaultNotif.Audio)(arg.Audio)),
			AlertType: /** @type {NotificationAlertType} */  (isInt(0, 3, defaultNotif.AlertType)(arg.AlertType)),
		};
	};
};

/**
 * Namespace with default values for {@link NotificationSettingsType} properties.
 * @type {Required<NotificationSettingsType>}
 * @namespace
 */
var PreferenceNotificationSettingsDefault = {
	Beeps: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.POPUP },
	ChatMessage: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.NONE, Normal: true, Whisper: true, Activity: false, Mention: false },
	ChatJoin: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.NONE, Owner: false, Lovers: false, Friendlist: false, Subs: false },
	Disconnect: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.NONE },
	Larp: { Audio: NotificationAudioType.NONE, AlertType: NotificationAlertType.NONE },
	Test: { Audio: NotificationAudioType.NONE, AlertType: NotificationAlertType.TITLEPREFIX },

	// Those are deprecated
	Audio: undefined,
	Chat: undefined,
	ChatActions: undefined,
};

/**
 * Namespace with functions for validating {@link NotificationSettingsType} properties
 * @type {{ [k in keyof Required<NotificationSettingsType>]: (arg: NotificationSettingsType[k], C: Character) => NotificationSettingsType[k] }}
 * @namespace
 */
var PreferenceNotificationSettingsValidate = {
	Beeps: isValidNotification(PreferenceNotificationSettingsDefault.Beeps),
	ChatMessage: (arg) => {
		return {
			...isValidNotification(PreferenceNotificationSettingsDefault.ChatMessage)(arg),
			Normal: isBool(PreferenceNotificationSettingsDefault.ChatMessage.Normal)(arg.Normal),
			Whisper: isBool(PreferenceNotificationSettingsDefault.ChatMessage.Whisper)(arg.Whisper),
			Activity: isBool(PreferenceNotificationSettingsDefault.ChatMessage.Activity)(arg.Activity),
			Mention: isBool(PreferenceNotificationSettingsDefault.ChatMessage.Mention)(arg.Mention),
		};
	},
	ChatJoin: (arg) => {
		return {
			...isValidNotification(PreferenceNotificationSettingsDefault.ChatJoin)(arg),
			Owner: isBool(PreferenceNotificationSettingsDefault.ChatJoin.Owner)(arg.Owner),
			Lovers: isBool(PreferenceNotificationSettingsDefault.ChatJoin.Lovers)(arg.Lovers),
			Friendlist: isBool(PreferenceNotificationSettingsDefault.ChatJoin.Friendlist)(arg.Friendlist),
			Subs: isBool(PreferenceNotificationSettingsDefault.ChatJoin.Subs)(arg.Subs),
		};
	},
	Disconnect: isValidNotification(PreferenceNotificationSettingsDefault.Disconnect),
	Larp: isValidNotification(PreferenceNotificationSettingsDefault.Larp),
	Test: isValidNotification(PreferenceNotificationSettingsDefault.Test),
	Audio: () => undefined,
	Chat: () => undefined,
	ChatActions: () => undefined,
};

/**
 * Registers a new extension setting to the preference screen
 * @param {PreferenceExtensionsSettingItem} Setting - The extension setting to register
 * @returns {void} - Nothing
 */
function PreferenceRegisterExtensionSetting(Setting) {
	if((typeof Setting.Identifier !== "string" || Setting.Identifier.length < 1)
		|| typeof Setting.load !== "function"
		|| typeof Setting.run !== "function"
		|| typeof Setting.click !== "function"
		|| (typeof Setting.ButtonText !== "string" && typeof Setting.ButtonText !== "function")
		|| (typeof Setting.Image !== "string" && typeof Setting.Image !== "function" && typeof Setting.Image !== "undefined")) {
		console.error("Invalid extension setting");
		return;
	}
	// Setting Names must be unique
	const existing = PreferenceExtensionsSettings[Setting.Identifier];
	if(existing) {
		console.error(`Extension setting "${existing.Identifier}" already exists`);
		return;
	}
	PreferenceExtensionsSettings[Setting.Identifier] = Setting;

	PreferenceExtensionsSettings = Object.fromEntries(
		Object.entries(PreferenceExtensionsSettings)
			.sort(([, a], [, b]) => {
				const textA = typeof a.ButtonText === "function" ? a.ButtonText() : a.ButtonText;
				const textB = typeof b.ButtonText === "function" ? b.ButtonText() : b.ButtonText;
				return textA.localeCompare(textB);
			})
	);
}

/**
 * Validates the character arousal object and converts it's objects to compressed string if needed
 * @param {Character} C - The character to check
 * @returns {void} - Nothing
 */
function PreferenceValidateArousalData(C) {

	// Nothing to do without data
	if ((C == null) || (C.ArousalSettings == null)) return;
	let MustUpdate = false;

	// Converts from an array of objects to a string
	if ((C.ArousalSettings.Activity != null) && CommonIsArray(C.ArousalSettings.Activity)) {

		// For all asset group where we save/sync arousal
		let NewActivity = "";
		for (let Activity of ActivityFemale3DCG) {

			// Check if the activity was already setup previously as an object, then convert to the char
			let Found = false;
			for (let A of C.ArousalSettings.Activity) {
				/** @type {object} */
				let OldActivity = A;
				if ((typeof OldActivity === "object") && (OldActivity.Name != null) && (typeof OldActivity.Name === "string") && (OldActivity.Name === Activity.Name) && (OldActivity.Self != null) && (typeof OldActivity.Self === "number") && (OldActivity.Other != null) && (typeof OldActivity.Other === "number")) {
					NewActivity = NewActivity + PreferenceArousalTwoFactorToChar(OldActivity.Self, OldActivity.Other);
					Found = true;
					break;
				}
			}

			// If it wasn't found, we create the char for it
			if (!Found) NewActivity = NewActivity + PreferenceArousalTwoFactorToChar();

		}

		// Assigns the new activity string
		C.ArousalSettings.Activity = NewActivity;
		MustUpdate = true;

	}

	// If the activities are not a string, we rebuild it from scratch
	if ((C.ArousalSettings.Activity != null) && (typeof C.ArousalSettings.Activity !== "string")) {
		C.ArousalSettings.Activity = PreferenceArousalActivityDefaultCompressedString;
		MustUpdate = true;
	}

	// If the length of the activity isn't accurate, we fix it
	if ((C.ArousalSettings.Activity != null) && (typeof C.ArousalSettings.Activity === "string") && (C.ArousalSettings.Activity.length != PreferenceArousalActivityDefaultCompressedString.length)) {
		while (C.ArousalSettings.Activity.length < PreferenceArousalActivityDefaultCompressedString.length)
			C.ArousalSettings.Activity = C.ArousalSettings.Activity + PreferenceArousalTwoFactorToChar();
		if (C.ArousalSettings.Activity.length > PreferenceArousalActivityDefaultCompressedString.length)
			C.ArousalSettings.Activity = C.ArousalSettings.Activity.substring(0, PreferenceArousalActivityDefaultCompressedString.length);
		MustUpdate = true;
	}

	// Converts from an array of objects to a string
	if ((C.ArousalSettings.Fetish != null) && CommonIsArray(C.ArousalSettings.Fetish)) {

		// For all asset group where we save/sync arousal
		let NewFetish = "";
		for (let Fetish of FetishFemale3DCG) {

			// Check if the fetish was already setup previously as an object, then convert to the char
			let Found = false;
			for (let F of C.ArousalSettings.Fetish) {
				/** @type {object} */
				let OldFetish = F;
				if ((typeof OldFetish === "object") && (OldFetish.Name != null) && (typeof OldFetish.Name === "string") && (OldFetish.Name === Fetish.Name) && (OldFetish.Factor != null) && (typeof OldFetish.Factor === "number")) {
					NewFetish = NewFetish + PreferenceArousalFactorToChar(OldFetish.Factor);
					Found = true;
					break;
				}
			}

			// If it wasn't found, we create the char for it
			if (!Found) NewFetish = NewFetish + PreferenceArousalFactorToChar();

		}

		// Assigns the new fetish string
		C.ArousalSettings.Fetish = NewFetish;
		MustUpdate = true;

	}

	// If the fetishes are not a string, we rebuild it from scratch
	if ((C.ArousalSettings.Fetish != null) && (typeof C.ArousalSettings.Fetish !== "string")) {
		C.ArousalSettings.Fetish = PreferenceArousalFetishDefaultCompressedString;
		MustUpdate = true;
	}

	// If the length of the fetish isn't accurate, we fix it
	if ((C.ArousalSettings.Fetish != null) && (typeof C.ArousalSettings.Fetish === "string") && (C.ArousalSettings.Fetish.length != PreferenceArousalFetishDefaultCompressedString.length)) {
		while (C.ArousalSettings.Fetish.length < PreferenceArousalFetishDefaultCompressedString.length)
			C.ArousalSettings.Fetish = C.ArousalSettings.Fetish + PreferenceArousalFactorToChar();
		if (C.ArousalSettings.Fetish.length > PreferenceArousalFetishDefaultCompressedString.length)
			C.ArousalSettings.Fetish = C.ArousalSettings.Fetish.substring(0, PreferenceArousalFetishDefaultCompressedString.length);
		MustUpdate = true;
	}

	// Converts from an array of objects to a string
	if ((C.ArousalSettings.Zone != null) && CommonIsArray(C.ArousalSettings.Zone)) {

		// For all asset group where we save/sync arousal
		let NewZone = "";
		for (let Group of AssetGroup)
			if (Group.ArousalZoneID != null) {

				// Check if the zone was already setup previously as an object, then convert to the char
				let Found = false;
				for (let Z of C.ArousalSettings.Zone) {
					/** @type {object} */
					let Zone = Z;
					if ((typeof Zone === "object") && (Zone.Name != null) && (typeof Zone.Name === "string") && (Zone.Name === Group.Name) && (Zone.Factor != null) && (typeof Zone.Factor === "number") && (Zone.Orgasm != null) && (typeof Zone.Orgasm === "boolean")) {
						NewZone = NewZone + PreferenceArousalFactorToChar(Zone.Factor, Zone.Orgasm);
						Found = true;
						break;
					}
				}

				// If it wasn't found, we create the char for it
				if (!Found) NewZone = NewZone + PreferenceArousalFactorToChar();

			}

		// Assigns the new zone string
		C.ArousalSettings.Zone = NewZone;
		MustUpdate = true;

	}

	// If the zones are not a string, we rebuild it from scratch
	if ((C.ArousalSettings.Zone != null) && (typeof C.ArousalSettings.Zone !== "string")) {
		C.ArousalSettings.Zone = PreferenceArousalZoneDefaultCompressedString;
		MustUpdate = true;
	}

	// If the length of the zone isn't accurate, we fix it
	if ((C.ArousalSettings.Zone != null) && (typeof C.ArousalSettings.Zone === "string") && (C.ArousalSettings.Zone.length != PreferenceArousalZoneDefaultCompressedString.length)) {
		while (C.ArousalSettings.Zone.length < PreferenceArousalZoneDefaultCompressedString.length)
			C.ArousalSettings.Zone = C.ArousalSettings.Zone + PreferenceArousalFactorToChar(2, false);
		if (C.ArousalSettings.Zone.length > PreferenceArousalZoneDefaultCompressedString.length)
			C.ArousalSettings.Zone = C.ArousalSettings.Zone.substring(0, PreferenceArousalZoneDefaultCompressedString.length);
		MustUpdate = true;
	}

	// If we must update the server with the updated data
	if (MustUpdate)
		ServerAccountUpdate.QueueData({ ArousalSettings: Player.ArousalSettings });

}

/**
 * Return a new object with default item permissions
 * @returns {ItemPermissions} - The item permissions
 */
function PreferencePermissionGetDefault() {
	return {
		Hidden: false,
		Permission: "Default",
		TypePermissions: {},
	};
}
