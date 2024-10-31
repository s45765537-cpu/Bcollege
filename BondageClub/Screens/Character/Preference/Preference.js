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
 * @type {PreferenceSubscreenName[]}
 * @deprecated the old name. Remove after the extensions have caught up
 */
var PreferenceSubscreenList = [];

/**
 * All the base settings screens
 * @type {PreferenceSubscreen[]}
 */
const PreferenceSubscreens = [
	{
		name: "Main",
		hidden: true,
		run: PreferenceSubscreenMainRun,
		click: PreferenceSubscreenMainClick,
	},
	{
		name: "General",
		load: PreferenceSubscreenGeneralLoad,
		run: PreferenceSubscreenGeneralRun,
		click: PreferenceSubscreenGeneralClick,
		exit: PreferenceSubscreenGeneralExit,
	},
	{
		name: "Difficulty",
		run: PreferenceSubscreenDifficultyRun,
		click: PreferenceSubscreenDifficultyClick,
	},
	{
		name: "Restriction",
		run: PreferenceSubscreenRestrictionRun,
		click: PreferenceSubscreenRestrictionClick,
	},
	{
		name: "Chat",
		load: PreferenceSubscreenChatLoad,
		run: PreferenceSubscreenChatRun,
		click: PreferenceSubscreenChatClick,
		exit: PreferenceSubscreenChatExit,
	},
	{
		name: "CensoredWords",
		load: PreferenceSubscreenCensoredWordsLoad,
		run: PreferenceSubscreenCensoredWordsRun,
		click: PreferenceSubscreenCensoredWordsClick,
		exit: PreferenceSubscreenCensoredWordsExit,
	},
	{
		name: "Audio",
		load: PreferenceSubscreenAudioLoad,
		run: PreferenceSubscreenAudioRun,
		click: PreferenceSubscreenAudioClick,
		exit: PreferenceSubscreenAudioExit,
	},
	{
		name: "Arousal",
		load: PreferenceSubscreenArousalLoad,
		run: PreferenceSubscreenArousalRun,
		click: PreferenceSubscreenArousalClick,
		exit: PreferenceSubscreenArousalExit,
	},
	{
		name: "Security",
		load: PreferenceSubscreenSecurityLoad,
		run: PreferenceSubscreenSecurityRun,
		click: PreferenceSubscreenSecurityClick,
		exit: PreferenceSubscreenSecurityExit,
	},
	{
		name: "Online",
		run: PreferenceSubscreenOnlineRun,
		click: PreferenceSubscreenOnlineClick,
	},
	{
		name: "Visibility",
		load: PreferenceSubscreenVisibilityLoad,
		run: PreferenceSubscreenVisibilityRun,
		click: PreferenceSubscreenVisibilityClick,
		exit: PreferenceSubscreenVisibilityExit,
	},
	{
		name: "Immersion",
		load: PreferenceSubscreenImmersionLoad,
		run: PreferenceSubscreenImmersionRun,
		click: PreferenceSubscreenImmersionClick,
	},
	{
		name: "Graphics",
		load: PreferenceSubscreenGraphicsLoad,
		run: PreferenceSubscreenGraphicsRun,
		click: PreferenceSubscreenGraphicsClick,
		exit: PreferenceSubscreenGraphicsExit,
	},
	{
		name: "Controller",
		run: PreferenceSubscreenControllerRun,
		click: PreferenceSubscreenControllerClick,
		exit: PreferenceSubscreenControllerExit,
	},
	{
		name: "Notifications",
		load: PreferenceSubscreenNotificationsLoad,
		run: PreferenceSubscreenNotificationsRun,
		click: PreferenceSubscreenNotificationsClick,
		exit: PreferenceSubscreenNotificationsExit,
	},
	{
		name: "Gender",
		run: PreferenceSubscreenGenderRun,
		click: PreferenceSubscreenGenderClick,
	},
	{
		name: "Scripts",
		load: PreferenceSubscreenScriptsLoad,
		run: PreferenceSubscreenScriptsRun,
		click: PreferenceSubscreenScriptsClick,
		exit: PreferenceSubscreenScriptsExit,
	},
	{
		name: "Extensions",
		load: PreferenceSubscreenExtensionsLoad,
		run: PreferenceSubscreenExtensionsRun,
		click: PreferenceSubscreenExtensionsClick,
		exit: PreferenceSubscreenExtensionsExit,
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

let PreferenceDidAddOldStyleScreens = false;

/**
 * Loads the preference screen. This function is called dynamically, when the character enters the preference screen
 * for the first time
 * @returns {void} - Nothing
 */
function PreferenceLoad() {
	PreferenceInitPlayer();
	PreferenceSubscreen = PreferenceSubscreens.find(s => s.name === "Main");

	// Backward-compatibility: just throw the old-style screens into the mix
	if (!PreferenceDidAddOldStyleScreens) {

		if (PreferenceSubscreenList.length > 0) {
			console.warn("Detected old-style subscreens, please upgrade!", PreferenceSubscreenList);
		}
		for (const screen of PreferenceSubscreenList) {
			PreferenceSubscreens.push({
				name: screen,
				load: () => CommonCallFunctionByName(`PreferenceSubscreen${screen}Load`),
				run: () => CommonCallFunctionByName(`PreferenceSubscreen${screen}Run`),
				click: () => CommonCallFunctionByName(`PreferenceSubscreen${screen}Click`),
				exit: () => CommonCallFunctionByName(`PreferenceSubscreen${screen}Exit`),
			});
		}
		PreferenceDidAddOldStyleScreens = true;
	}
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
 * @type {ScreenFunctions["Exit"]}
 */
function PreferenceExit() {
	if (PreferenceSubscreen.name !== "Main") {
		if (PreferenceSubscreenExit())
			return;
	}

	// Exit the preference menus
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
		ItemPermission: Player.ItemPermission,
		LabelColor: Player.LabelColor,
		...ServerPackItemPermissions(Player.PermissionItems),
	};
	ServerAccountUpdate.QueueData(P);
	PreferenceMessage = "";
	CommonSetScreen("Character", "InformationSheet");
}

/**
 * Exit from a specific subscreen by running its handler and checking its validity
 */
function PreferenceSubscreenExit() {
	let valid = true;
	if (PreferenceSubscreen.exit)
		valid = PreferenceSubscreen.exit();

	if (!valid) return valid;

	PreferenceMessage = "";
	PreferenceSubscreen = PreferenceSubscreens.find(s => s.name === "Main");
	return valid;
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
	ProgressTimer: 100,
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
