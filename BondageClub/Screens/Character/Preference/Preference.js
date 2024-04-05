"use strict";
var PreferenceBackground = "Sheet";
var PreferenceMessage = "";
var PreferenceSafewordConfirm = false;
/** @type {"InputCharacterLabelColor" | ""} */
var PreferenceColorPick = "";
/** @type {PreferenceSubscreenName | ""} */
var PreferenceSubscreen = "";
/** @type {PreferenceSubscreenName[]} */
var PreferenceSubscreenList = ["General", "Difficulty", "Restriction", "Chat", "CensoredWords", "Audio", "Arousal", "Security", "Online", "Visibility", "Immersion", "Graphics", "Controller", "Notifications", "Gender", "Scripts"];
var PreferencePageCurrent = 1;
/** @type {ChatColorThemeType[]} */
var PreferenceChatColorThemeList = ["Light", "Dark", "Light2", "Dark2"];
var PreferenceChatColorThemeIndex = 0;
/** @type {ChatEnterLeaveType[]} */
var PreferenceChatEnterLeaveList = ["Normal", "Smaller", "Hidden"];
var PreferenceChatEnterLeaveIndex = 0;
/** @type {ChatMemberNumbersType[]} */
var PreferenceChatMemberNumbersList = ["Always", "Never", "OnMouseover"];
var PreferenceChatMemberNumbersIndex = 0;
/** @type {ChatFontSizeType[]} */
var PreferenceChatFontSizeList = ["Small", "Medium", "Large"];
var PreferenceChatFontSizeIndex = 1;
/** @type {SettingsSensDepName[]} */
var PreferenceSettingsSensDepList = ["SensDepLight", "Normal", "SensDepNames", "SensDepTotal", "SensDepExtreme"];
var PreferenceSettingsSensDepIndex = 0;
/** @type {SettingsVFXName[]} */
var PreferenceSettingsVFXList = ["VFXInactive", "VFXSolid", "VFXAnimatedTemp", "VFXAnimated"];
var PreferenceSettingsVFXIndex = 0;
/** @type {SettingsVFXVibratorName[]} */
var PreferenceSettingsVFXVibratorList = ["VFXVibratorInactive", "VFXVibratorSolid", "VFXVibratorAnimated"];
var PreferenceSettingsVFXVibratorIndex = 0;
/** @type {SettingsVFXFilterName[]} */
var PreferenceSettingsVFXFilterList = ["VFXFilterLight", "VFXFilterMedium", "VFXFilterHeavy"];
var PreferenceSettingsVFXFilterIndex = 0;
var PreferenceSettingsVolumeList = [1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
var PreferenceSettingsSensitivityList = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var PreferenceSettingsDeadZoneList = [0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
var PreferenceSettingsVolumeIndex = 0;
var PreferenceSettingsMusicVolumeIndex = 0;
var PreferenceSettingsSensitivityIndex = 13;
var PreferenceSettingsDeadZoneIndex = 1;
/** @type {ArousalActiveName[]} */
var PreferenceArousalActiveList = ["Inactive", "NoMeter", "Manual", "Hybrid", "Automatic"];
var PreferenceArousalActiveIndex = 0;
/** @type {ArousalVisibleName[]} */
var PreferenceArousalVisibleList = ["All", "Access", "Self"];
var PreferenceArousalVisibleIndex = 0;
/** @type {ArousalAffectStutterName[]} */
var PreferenceArousalAffectStutterList = ["None", "Arousal", "Vibration", "All"];
var PreferenceArousalAffectStutterIndex = 0;
/** @type {null | ActivityName[]} */
var PreferenceArousalActivityList = null;
var PreferenceArousalActivityIndex = 0;
/** @type {ArousalFactor} */
var PreferenceArousalActivityFactorSelf = 0;
/** @type {ArousalFactor} */
var PreferenceArousalActivityFactorOther = 0;
/** @type {ArousalFactor} */
var PreferenceArousalZoneFactor = 0;
var PreferenceArousalZoneCount = 18;
// By default on new characters, all zones are of neutral preference and vulva/clit/butt can trigger an orgasm
var PreferenceArousalZoneDefaultCompressedString = "ffpppfffffffffffff";
/** @type {null | FetishName[]} */
var PreferenceArousalFetishList = null;
var PreferenceArousalFetishIndex = 0;
/** @type {ArousalFactor} */
var PreferenceArousalFetishFactor = 0;
var PreferenceVisibilityGroupList = [];
var PreferenceVisibilityGroupIndex = 0;
var PreferenceVisibilityAssetIndex = 0;
var PreferenceVisibilityHideChecked = false;
var PreferenceVisibilityBlockChecked = false;
var PreferenceVisibilityCanBlock = true;
/** @type {null | Asset} */
var PreferenceVisibilityPreviewAsset = null;
/** @type {ItemPermissions[]} */
var PreferenceVisibilityHiddenList = [];
/** @type {ItemPermissions[]} */
var PreferenceVisibilityBlockList = [];
var PreferenceVisibilityResetClicked = false;
/** @type {null | number} */
var PreferenceDifficultyLevel = null;
var PreferenceDifficultyAccept = false;
/** @type {GraphicsFontName[]} */
var PreferenceGraphicsFontList = ["Arial", "TimesNewRoman", "Papyrus", "ComicSans", "Impact", "HelveticaNeue", "Verdana", "CenturyGothic", "Georgia", "CourierNew", "Copperplate"];
/** @type {WebGLPowerPreference[]} */
var PreferenceGraphicsPowerModes = ["low-power", "default", "high-performance"];
var PreferenceGraphicsFontIndex = 0;
/** @type {null | number} */
var PreferenceGraphicsAnimationQualityIndex = null;
/** @type {null | number} */
var PreferenceGraphicsPowerModeIndex = null;
/** @type {null | WebGLContextAttributes} */
var PreferenceGraphicsWebGLOptions = null;
var PreferenceGraphicsAnimationQualityList = [10000, 2000, 200, 100, 50, 0];
/** @type {string[]} */
var PreferenceCensoredWordsList = [];
var PreferenceCensoredWordsOffset = 0;
/** @type {ScriptPermissionProperty[]} */
const PreferenceScriptPermissionProperties = ["Hide", "Block"];
/** @type {null | "global" | "Hide" | "Block"} */
let PreferenceScriptHelp = null;
/** @type {null | ReturnType<typeof setTimeout>} */
let PreferenceScriptTimeoutHandle = null;
/** @type {null | number} */
let PreferenceScriptTimer = null;
let PreferenceScriptWarningAccepted = false;
/** @type {Record<string,PreferenceExtensionsSettingItem>} */
let PreferenceExtensionsSettings = {};
/** @type {PreferenceExtensionsMenuButtonInfo[]} */
let PreferenceExtensionsDisplay = [];
/** @type {PreferenceExtensionsSettingItem | null}*/
let PreferenceExtensionsCurrent = null;
const PreferenceChatPageList = [0, 1];
let PreferenceChatPageIndex = 0;

const ScriptPermissionLevel = Object.freeze({
	SELF: "Self",
	OWNER: "Owner",
	LOVERS: "Lovers",
	FRIENDS: "Friends",
	WHITELIST: "Whitelist",
	PUBLIC: "Public",
});

const ScriptPermissionBits = Object.freeze({
	[ScriptPermissionLevel.SELF]: 1,
	[ScriptPermissionLevel.OWNER]: 2,
	[ScriptPermissionLevel.LOVERS]: 4,
	[ScriptPermissionLevel.FRIENDS]: 8,
	[ScriptPermissionLevel.WHITELIST]: 16,
	[ScriptPermissionLevel.PUBLIC]: 32,
});

const maxScriptPermission = Object.values(ScriptPermissionBits)
	.reduce((sum, bit) => sum | bit, 0);

/**
 * Compares the arousal preference level and returns TRUE if that level is met, or an higher level is met
 * @param {Character} C - The player who performs the sexual activity
 * @param {ArousalActiveName} Level - The name of the level ("Inactive", "NoMeter", "Manual", "Hybrid", "Automatic")
 * @returns {boolean} - Returns TRUE if the level is met or more
 */
function PreferenceArousalAtLeast(C, Level) {
	if ((CurrentModule == "Online") && (CurrentScreen == "ChatRoom") && (ChatRoomGame == "GGTS") && (ChatRoomSpace === "Asylum") && (AsylumGGTSGetLevel(C) >= 4))
		if (InventoryIsWorn(C, "FuturisticChastityBelt", "ItemPelvis") || InventoryIsWorn(C, "FuturisticTrainingBelt", "ItemPelvis") || InventoryIsWorn(C, "FuckMachine", "ItemDevices"))
			return true;
	if ((C.ArousalSettings == null) || (C.ArousalSettings.Active == null)) return false;
	if (Level === C.ArousalSettings.Active) return true;
	if (C.ArousalSettings.Active == "Automatic") return true;
	if ((Level == "Manual") && (C.ArousalSettings.Active == "Hybrid")) return true;
	if ((Level == "NoMeter") && ((C.ArousalSettings.Active == "Manual") || (C.ArousalSettings.Active == "Hybrid"))) return true;
	return false;
}

/**
 * Gets the effect of a sexual activity on the player
 * @param {Character} C - The player who performs the sexual activity
 * @param {ActivityName} Type - The type of the activity that is performed
 * @param {boolean} Self - Determines, if the current player is giving (false) or receiving (true)
 * @returns {ArousalFactor} - Returns the love factor of the activity for the character (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceGetActivityFactor(C, Type, Self) {
	const fieldName = Self ? "Self" : "Other";
	const activity = C.ArousalSettings?.Activity?.find(({ Name }) => Name === Type);
	if (activity != null) {
		return PreferenceActivityEnjoymentValidate[fieldName](activity[fieldName]);
	} else {
		return PreferenceActivityEnjoymentDefault[fieldName];
	}
}

/**
 * Gets the factor of a fetish for the player
 * @param {Character} C - The character to query
 * @param {FetishName} Type - The name of the fetish
 * @returns {ArousalFactor} - Returns the love factor of the fetish for the character (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceGetFetishFactor(C, Type) {
	const factor = C.ArousalSettings?.Fetish?.find(({ Name }) => Name === Type)?.Factor;
	return PreferenceArousalZoneValidate.Factor(factor);
}

/**
 * Sets the love factor of a sexual activity for the character
 * @param {Character} C - The character for whom the activity factor should be set
 * @param {ActivityName} Type - The type of the activity that is performed
 * @param {boolean} Self - Determines, if the current player is giving (false) or receiving (true)
 * @param {ArousalFactor} Factor - The factor of the sexual activity (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceSetActivityFactor(C, Type, Self, Factor) {
	const fieldName = Self ? "Self" : "Other";
	const activity = C.ArousalSettings?.Activity?.find(({ Name }) => Name === Type);
	if (activity != null) {
		activity[fieldName] = Factor;
	}
}

/**
 * Validates the character arousal object and converts it's objects to compressed string if needed
 * @param {number} Factor - The 
 * @returns {string} - A string of 1 char that represents the compressed zone
 */
function PreferenceArousalZoneToChar(Factor, Orgasm) {
	return String.fromCharCode(100 + Factor + (Orgasm ? 10 : 0));
}

/**
 * Gets the corresponding arousal zone definition from a player's preferences (if the group's activities are mirrored,
 * returns the arousal zone definition for the mirrored group).
 * @param {Character} C - The character for whom to get the arousal zone
 * @param {AssetGroupName} ZoneName - The name of the zone to get
 * @returns {null | ArousalZone} - Returns the arousal zone preference object,
 * or null if a corresponding zone definition could not be found.
 */
function PreferenceGetArousalZone(C, ZoneName) {
	/*if (!C.ArousalSettings || !C.ArousalSettings.Zone) {
		return null;
	}
	const Group = AssetGroupGet(C.AssetFamily, ZoneName);
	return C.ArousalSettings.Zone.find((Z) => {
		if ((Group != null) && (Group.MirrorActivitiesFrom)) {
			return Z.Name === Group.MirrorActivitiesFrom;
		}
		return Z.Name === ZoneName;
	}) || null;*/

	// Make sure the data is valid
	if ((C == null) || (C.ArousalSettings == null) || (C.ArousalSettings.Zone == null) || (typeof C.ArousalSettings.Zone !== "string")) return null;

	// Finds the asset group and make sure the string contains it
	let Group = AssetGroupGet(C.AssetFamily, ZoneName);
	if ((Group.ArousalZoneID == null) || (C.ArousalSettings.Zone.length <= Group.ArousalZoneID)) return null;

	let Value = C.ArousalSettings.Zone.charCodeAt(Group.ArousalZoneID) - 100;
	return {
		// @ts-ignore
		Name: ZoneName,
		// @ts-ignore
		Factor: Value % 10,
		Orgasm: (Value >= 10)
	}

}

/**
 * Gets the love factor of a zone for the character
 * @param {Character} C - The character for whom the love factor of a particular zone should be gotten
 * @param {AssetGroupName} ZoneName - The name of the zone to get the love factor for
 * @returns {ArousalFactor} - Returns the love factor of a zone for the character (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceGetZoneFactor(C, ZoneName) {
	/** @type {ArousalFactor} */
	let Factor = 2;
	let Zone = PreferenceGetArousalZone(C, ZoneName);
	if (Zone) Factor = Zone.Factor;
	if ((Factor == null) || (typeof Factor !== "number") || (Factor < 0) || (Factor > 4)) Factor = 2;
	return Factor;
}

/**
 * Sets the love factor for a specific body zone on the player
 * @param {Character} C - The character, for whom the love factor of a particular zone should be set
 * @param {AssetGroupName} ZoneName - The name of the zone, the factor should be set for
 * @param {ArousalFactor} Factor - The factor of the zone (0 is horrible, 2 is normal, 4 is great)
 * @returns {void} - Nothing
 */
function PreferenceSetZoneFactor(C, ZoneName, Factor) {
	
	// Nothing to do if data is invalid
	if ((C == null) || (C.ArousalSettings == null) || (C.ArousalSettings.Zone == null) || (typeof C.ArousalSettings.Zone !== "string")) return;

	// Finds the asset group and make sure the string contains it
	let Group = AssetGroupGet(C.AssetFamily, ZoneName);
	if ((Group.ArousalZoneID == null) || (C.ArousalSettings.Zone.length <= Group.ArousalZoneID)) return;

	// Gets the zone object
	let Zone = PreferenceGetArousalZone(C, ZoneName);
	if (Zone == null) {
		Zone = {
			// @ts-ignore
			Name: ZoneName,
			Factor: 2,
			Orgasm: false
		}
	}
	Zone.Factor = Factor;

	// Creates the new char and slides it in the compressed string
    C.ArousalSettings.Zone = C.ArousalSettings.Zone.substring(0, Group.ArousalZoneID) + PreferenceArousalZoneToChar(Zone.Factor, Zone.Orgasm) + C.ArousalSettings.Zone.substring(Group.ArousalZoneID + 1);

}

/**
 * Determines, if a player can reach on orgasm from a particular zone
 * @param {Character} C - The character whose ability to orgasm we check
 * @param {AssetGroupName} ZoneName - The name of the zone to check
 * @returns {boolean} - Returns true if the zone allows orgasms for a character, false otherwise
 */
function PreferenceGetZoneOrgasm(C, ZoneName) {
	const Zone = PreferenceGetArousalZone(C, ZoneName);
	return !!Zone && !!Zone.Orgasm;
}

/**
 * Sets the ability to induce an orgasm for a given zone*
 * @param {Character} C - The characterfor whom we set the ability to órgasm from a given zone
 * @param {AssetGroupItemName} ZoneName - The name of the zone to set the ability to orgasm for
 * @param {boolean} CanOrgasm - Sets, if the character can cum from the given zone (true) or not (false)
 * @returns {void} - Nothing
 */
function PreferenceSetZoneOrgasm(C, ZoneName, CanOrgasm) {

	// Nothing to do if data is invalid
	if ((C == null) || (C.ArousalSettings == null) || (C.ArousalSettings.Zone == null) || (typeof C.ArousalSettings.Zone !== "string")) return;

	// Finds the asset group and make sure the string contains it
	let Group = AssetGroupGet(C.AssetFamily, ZoneName);
	if ((Group.ArousalZoneID == null) || (C.ArousalSettings.Zone.length <= Group.ArousalZoneID)) return;

	// Gets the zone object
	let Zone = PreferenceGetArousalZone(C, ZoneName);
	if (Zone == null) {
		Zone = {
			// @ts-ignore
			Name: ZoneName,
			Factor: 2,
			Orgasm: false
		}
	}
	Zone.Orgasm = CanOrgasm;

	// Creates the new char and slides it in the compressed string
    C.ArousalSettings.Zone = C.ArousalSettings.Zone.substring(0, Group.ArousalZoneID) + PreferenceArousalZoneToChar(Zone.Factor, Zone.Orgasm) + C.ArousalSettings.Zone.substring(Group.ArousalZoneID + 1);

}

/**
 * Gets a color code for a given arousal factor
 * @param {number} Factor - The factor that should be translated in a color code
 * @returns {string} - The color for the given factor in the format "#rrggbbaa"
 */
function PreferenceGetFactorColor(Factor) {
	if (Factor == 0) return "#FF000088";
	if (Factor == 1) return "#FF000044";
	if (Factor == 3) return "#00FF0044";
	if (Factor == 4) return "#00FF0088";
	return "#80808044";
}

/**
 * Checks, if the arousal activity controls must be activated
 * @returns {boolean} - Returns true if we must activate the preference controls, false otherwise
 */
function PreferenceArousalIsActive() {
	return (PreferenceArousalActiveList[PreferenceArousalActiveIndex] != "Inactive");
}

/**
 * Loads the activity factor combo boxes based on the current activity selected
 * @returns {void} - Nothing
 */
function PreferenceLoadActivityFactor() {
	PreferenceArousalActivityFactorSelf = PreferenceGetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], true);
	PreferenceArousalActivityFactorOther = PreferenceGetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], false);
}

/**
 * Loads the fetish factor combo boxes based on the current fetish selected
 * @returns {void} - Nothing
 */
function PreferenceLoadFetishFactor() {
	PreferenceArousalFetishFactor = PreferenceGetFetishFactor(Player, PreferenceArousalFetishList[PreferenceArousalFetishIndex]);
}

/**
 * Initialize and validates the character settings
 * @param {Character} C - The character, whose preferences are initialized
 * @returns {void} - Nothing
 */
function PreferenceInit(C) {
	C.ArousalSettings = ValdiationApplyRecord(C.ArousalSettings, C, PreferenceArousalSettingsValidate);
}

/**
 * Initialize and validates Player settings
 * @returns {void} - Nothing
 */
function PreferenceInitPlayer() {
	const C = Player;

	/**
	 * Save settings for comparison
	 * @satisfies {Partial<Record<keyof ServerAccountData, string>>}
	 */
	const PrefBefore = {
		ArousalSettings: JSON.stringify(C.ArousalSettings) || "",
		ChatSettings: JSON.stringify(C.ChatSettings) || "",
		VisualSettings: JSON.stringify(C.VisualSettings) || "",
		AudioSettings: JSON.stringify(C.AudioSettings) || "",
		ControllerSettings: JSON.stringify(C.ControllerSettings) || "",
		GameplaySettings: JSON.stringify(C.GameplaySettings) || "",
		ImmersionSettings: JSON.stringify(C.ImmersionSettings) || "",
		RestrictionSettings: JSON.stringify(C.RestrictionSettings) || "",
		OnlineSettings: JSON.stringify(C.OnlineSettings) || "",
		OnlineSharedSettings: JSON.stringify(C.OnlineSharedSettings) || "",
		GraphicsSettings: JSON.stringify(C.GraphicsSettings) || "",
		NotificationSettings: JSON.stringify(C.NotificationSettings) || "",
		GenderSettings: JSON.stringify(C.GenderSettings) || "",
	};

	// Non-player specific settings
	PreferenceInit(C);

	// TODO: Remove before R81
	PreferenceMigrate(C.ImmersionSettings, C.GraphicsSettings, "AllowBlur", true);

	// If the settings aren't set before, construct them to replicate the default behavior

	// Chat settings
	// @ts-ignore: Individual properties validated separately
	if (!C.ChatSettings) C.ChatSettings = {};
	if (typeof C.ChatSettings.ColorActions !== "boolean") C.ChatSettings.ColorActions = true;
	if (typeof C.ChatSettings.ColorActivities !== "boolean") C.ChatSettings.ColorActivities = true;
	if (typeof C.ChatSettings.ColorEmotes !== "boolean") C.ChatSettings.ColorEmotes = true;
	if (typeof C.ChatSettings.ColorNames !== "boolean") C.ChatSettings.ColorNames = true;
	if (typeof C.ChatSettings.ColorTheme !== "string") C.ChatSettings.ColorTheme = "Light";
	if (typeof C.ChatSettings.DisplayTimestamps !== "boolean") C.ChatSettings.DisplayTimestamps = true;
	if (typeof C.ChatSettings.EnterLeave !== "string") C.ChatSettings.EnterLeave = "Normal";
	if (typeof C.ChatSettings.FontSize !== "string") C.ChatSettings.FontSize = "Medium";
	if (typeof C.ChatSettings.MemberNumbers !== "string") C.ChatSettings.MemberNumbers = "Always";
	if (typeof C.ChatSettings.MuStylePoses !== "boolean") C.ChatSettings.MuStylePoses = false;
	if (typeof C.ChatSettings.ShowActivities !== "boolean") C.ChatSettings.ShowActivities = true;
	if (typeof C.ChatSettings.ShowAutomaticMessages !== "boolean") C.ChatSettings.ShowAutomaticMessages = false;
	if (typeof C.ChatSettings.ShowBeepChat !== "boolean") C.ChatSettings.ShowBeepChat = true;
	if (typeof C.ChatSettings.ShowChatHelp !== "boolean") C.ChatSettings.ShowChatHelp = true;
	if (typeof C.ChatSettings.ShrinkNonDialogue !== "boolean") C.ChatSettings.ShrinkNonDialogue = false;
	if (typeof C.ChatSettings.WhiteSpace !== "string") C.ChatSettings.WhiteSpace = "Preserve";
	if (typeof C.ChatSettings.CensoredWordsList !== "string") C.ChatSettings.CensoredWordsList = "";
	if (typeof C.ChatSettings.CensoredWordsLevel !== "number") C.ChatSettings.CensoredWordsLevel = 0;
	if (typeof C.ChatSettings.PreserveChat !== "boolean") C.ChatSettings.PreserveChat = true;

	// Visual settings
	// @ts-ignore: Individual properties validated separately
	if (!C.VisualSettings) C.VisualSettings = {};
	if (typeof C.VisualSettings.ForceFullHeight !== "boolean") C.VisualSettings.ForceFullHeight = false;
	if (typeof C.VisualSettings.UseCharacterInPreviews !== "boolean") C.VisualSettings.UseCharacterInPreviews = false;

	// Audio settings
	// @ts-ignore: Individual properties validated separately
	if (!C.AudioSettings) C.AudioSettings = {};
	if (typeof C.AudioSettings.Volume !== "number") C.AudioSettings.Volume = 1;
	if (typeof C.AudioSettings.MusicVolume !== "number") C.AudioSettings.MusicVolume = 1;
	if (typeof C.AudioSettings.PlayBeeps !== "boolean") C.AudioSettings.PlayBeeps = false;
	if (typeof C.AudioSettings.PlayItem !== "boolean") C.AudioSettings.PlayItem = false;
	if (typeof C.AudioSettings.PlayItemPlayerOnly !== "boolean") C.AudioSettings.PlayItemPlayerOnly = false;
	if (typeof C.AudioSettings.Notifications !== "boolean") C.AudioSettings.Notifications = false;

	// Controller settings
	// @ts-ignore: Individual properties validated separately
	if (!C.ControllerSettings) C.ControllerSettings = {};
	if (typeof C.ControllerSettings.ControllerActive !== "boolean") C.ControllerSettings.ControllerActive = false;
	if (typeof C.ControllerSettings.ControllerSensitivity !== "number") C.ControllerSettings.ControllerSensitivity = 5;
	if (typeof C.ControllerSettings.ControllerDeadZone !== "number") C.ControllerSettings.ControllerDeadZone = 0.01;

	// @ts-expect-error: checking for old-style mapping
	if (typeof C.ControllerSettings.ControllerA === "number") {
		// Port over to new mapping
		const s = /** @type {ControllerSettingsOld} */(/** @type {unknown} */(C.ControllerSettings));
		const buttonsMapping = {
			[ControllerButton.A]: s.ControllerA,
			[ControllerButton.B]: s.ControllerB,
			[ControllerButton.X]: s.ControllerX,
			[ControllerButton.Y]: s.ControllerY,
			[ControllerButton.DPadU]: s.ControllerDPadUp,
			[ControllerButton.DPadD]: s.ControllerDPadDown,
			[ControllerButton.DPadL]: s.ControllerDPadLeft,
			[ControllerButton.DPadR]: s.ControllerDPadRight,
		};
		const axisMapping = {
			[ControllerAxis.StickLV]: s.ControllerStickUpDown,
			[ControllerAxis.StickLH]: s.ControllerStickLeftRight,
		};
		ControllerLoadMapping(buttonsMapping, axisMapping);
		// Delete the old mapping
		const oldKeys = [
			"ControllerA",
			"ControllerB",
			"ControllerX",
			"ControllerY",
			"ControllerStickUpDown",
			"ControllerStickLeftRight",
			"ControllerStickRight",
			"ControllerStickDown",
			"ControllerDPadUp",
			"ControllerDPadDown",
			"ControllerDPadLeft",
			"ControllerDPadRight",
		];
		for (const old of oldKeys) {
			delete C.ControllerSettings[old];
		}
	} else if (typeof C.ControllerSettings.Buttons === "object") {
		ControllerLoadMapping(C.ControllerSettings.Buttons, C.ControllerSettings.Axis);
	}

	ControllerSensitivity = C.ControllerSettings.ControllerSensitivity;
	ControllerDeadZone = C.ControllerSettings.ControllerDeadZone;
	PreferenceSettingsSensitivityIndex = PreferenceSettingsSensitivityList.indexOf(Player.ControllerSettings.ControllerSensitivity);
	PreferenceSettingsDeadZoneIndex = PreferenceSettingsDeadZoneList.indexOf(Player.ControllerSettings.ControllerDeadZone);

	ControllerStart();

	// Gameplay settings
	// @ts-ignore: Individual properties validated separately
	if (!C.GameplaySettings) C.GameplaySettings = {};
	if (typeof C.GameplaySettings.SensDepChatLog !== "string") C.GameplaySettings.SensDepChatLog = "Normal";
	if (typeof C.GameplaySettings.BlindDisableExamine !== "boolean") C.GameplaySettings.BlindDisableExamine = false;
	if (typeof C.GameplaySettings.DisableAutoRemoveLogin !== "boolean") C.GameplaySettings.DisableAutoRemoveLogin = false;
	if (typeof C.GameplaySettings.ImmersionLockSetting !== "boolean") C.GameplaySettings.ImmersionLockSetting = false;
	if (typeof C.GameplaySettings.EnableSafeword !== "boolean") C.GameplaySettings.EnableSafeword = true;
	if (typeof C.GameplaySettings.DisableAutoMaid !== "boolean") C.GameplaySettings.DisableAutoMaid = false;
	if (typeof C.GameplaySettings.OfflineLockedRestrained !== "boolean") C.GameplaySettings.OfflineLockedRestrained = false;

	// Immersion settings
	// @ts-ignore: Individual properties validated separately
	if (!C.ImmersionSettings) C.ImmersionSettings = {};
	if (typeof C.ImmersionSettings.BlockGaggedOOC !== "undefined") delete C.ImmersionSettings.BlockGaggedOOC;
	if (typeof C.ImmersionSettings.StimulationEvents !== "boolean") C.ImmersionSettings.StimulationEvents = true;
	if (typeof C.ImmersionSettings.ReturnToChatRoom !== "boolean") C.ImmersionSettings.ReturnToChatRoom = false;
	if (typeof C.ImmersionSettings.ReturnToChatRoomAdmin !== "boolean") C.ImmersionSettings.ReturnToChatRoomAdmin = false;
	if (typeof C.ImmersionSettings.ChatRoomMapLeaveOnExit !== "boolean") C.ImmersionSettings.ChatRoomMapLeaveOnExit = false;
	if (typeof C.ImmersionSettings.SenseDepMessages !== "boolean") C.ImmersionSettings.SenseDepMessages = false;
	if (typeof C.ImmersionSettings.ChatRoomMuffle !== "boolean") C.ImmersionSettings.ChatRoomMuffle = false;
	if (typeof C.ImmersionSettings.BlindAdjacent !== "boolean") C.ImmersionSettings.BlindAdjacent = false;
	if (typeof C.ImmersionSettings.AllowTints !== "boolean") C.ImmersionSettings.AllowTints = true;

	// Misc
	if (!ChatRoomValidateProperties(C.LastChatRoom)) C.LastChatRoom = null;

	// Restriction settings
	// @ts-ignore: Individual properties validated separately
	if (!C.RestrictionSettings) C.RestrictionSettings = {};
	if (typeof C.RestrictionSettings.BypassStruggle !== "boolean") C.RestrictionSettings.BypassStruggle = false;
	if (typeof C.RestrictionSettings.SlowImmunity !== "boolean") C.RestrictionSettings.SlowImmunity = false;
	if (typeof C.RestrictionSettings.BypassNPCPunishments !== "boolean") C.RestrictionSettings.BypassNPCPunishments = false;
	if (typeof C.RestrictionSettings.NoSpeechGarble !== "boolean") C.RestrictionSettings.NoSpeechGarble = false;

	// Online settings
	// @ts-ignore: Individual properties validated separately
	if (!C.OnlineSettings) C.OnlineSettings = {};
	if (typeof C.OnlineSettings.AutoBanBlackList !== "boolean") C.OnlineSettings.AutoBanBlackList = false;
	if (typeof C.OnlineSettings.AutoBanGhostList !== "boolean") C.OnlineSettings.AutoBanGhostList = true;
	if (typeof C.OnlineSettings.DisableAnimations !== "boolean") C.OnlineSettings.DisableAnimations = false;
	if (typeof C.OnlineSettings.SearchShowsFullRooms !== "boolean") C.OnlineSettings.SearchShowsFullRooms = true;
	if (typeof C.OnlineSettings.SearchFriendsFirst !== "boolean") C.OnlineSettings.SearchFriendsFirst = false;
	if (typeof C.OnlineSettings.EnableAfkTimer !== "boolean") C.OnlineSettings.EnableAfkTimer = true;
	if (typeof C.OnlineSettings.ShowStatus !== "boolean") C.OnlineSettings.ShowStatus = true;
	if (typeof C.OnlineSettings.SendStatus !== "boolean") C.OnlineSettings.SendStatus = true;

	// Delete old improper settings.
	delete C.ChatSettings.AutoBanBlackList;
	delete C.ChatSettings.AutoBanGhostList;
	delete C.ChatSettings.SearchFriendsFirst;
	delete C.ChatSettings.DisableAnimations;
	delete C.ChatSettings.SearchShowsFullRooms;
	// @ts-ignore: Just backward-compat cleanup
	delete C.OnlineSettings.EnableWardrobeIcon;

	// Onilne shared settings
	C.OnlineSharedSettings = ValdiationApplyRecord(C.OnlineSharedSettings, C, PreferenceOnlineSharedSettingsValidate, true);

	if (typeof C.OnlineSettings.ShowRoomCustomization !== "number") C.OnlineSettings.ShowRoomCustomization = 1;

	// Graphical settings
	// @ts-ignore: Individual properties validated separately
	if (!C.GraphicsSettings) C.GraphicsSettings = {};
	if (typeof C.GraphicsSettings.Font !== "string") C.GraphicsSettings.Font = "Arial";
	if (typeof C.GraphicsSettings.InvertRoom !== "boolean") C.GraphicsSettings.InvertRoom = true;
	if (typeof C.GraphicsSettings.StimulationFlash !== "boolean") C.GraphicsSettings.StimulationFlash = false;
	if (typeof C.GraphicsSettings.DoBlindFlash !== "boolean") C.GraphicsSettings.DoBlindFlash = false;
	if (typeof C.GraphicsSettings.AnimationQuality !== "number") C.GraphicsSettings.AnimationQuality = 100;
	if (typeof C.GraphicsSettings.SmoothZoom !== "boolean") C.GraphicsSettings.SmoothZoom = true;
	if (typeof C.GraphicsSettings.CenterChatrooms !== "boolean") C.GraphicsSettings.CenterChatrooms = true;
	if (typeof C.GraphicsSettings.AllowBlur !== "boolean") C.GraphicsSettings.AllowBlur = true;

	// Notification settings
	let NS = C.NotificationSettings;
	// @ts-ignore: Individual properties validated separately
	if (!NS) NS = {};
	const defaultAudio = typeof NS.Audio === "boolean" && NS.Audio ? NotificationAudioType.FIRST : NotificationAudioType.NONE;
	if (typeof NS.Beeps !== "object") NS.Beeps = PreferenceInitNotificationSetting(NS.Beeps, defaultAudio, NotificationAlertType.POPUP);
	if (typeof NS.Chat !== "undefined") { NS.ChatMessage = NS.Chat; delete NS.Chat; }
	if (typeof NS.ChatMessage !== "object") NS.ChatMessage = PreferenceInitNotificationSetting(NS.ChatMessage, defaultAudio);
	if (typeof NS.ChatMessage.IncludeActions === "boolean") {
		// Convert old version of settings
		const chatMessagesEnabled = NS.ChatMessage.AlertType !== NotificationAudioType.NONE;
		NS.ChatMessage.Normal = chatMessagesEnabled;
		NS.ChatMessage.Whisper = chatMessagesEnabled;
		NS.ChatMessage.Activity = chatMessagesEnabled && NS.ChatMessage.IncludeActions;
		delete NS.ChatMessage.IncludeActions;
	}
	if (typeof NS.ChatMessage.Normal !== "boolean") NS.ChatMessage.Normal = true;
	if (typeof NS.ChatMessage.Whisper !== "boolean") NS.ChatMessage.Whisper = true;
	if (typeof NS.ChatMessage.Activity !== "boolean") NS.ChatMessage.Activity = false;
	if (typeof NS.ChatActions !== "undefined") delete NS.ChatActions;
	if (typeof NS.ChatJoin !== "object") NS.ChatJoin = PreferenceInitNotificationSetting(NS.ChatJoin, defaultAudio);
	if (typeof NS.ChatJoin.Enabled !== "undefined") {
		// Convert old version of settings
		NS.ChatJoin.AlertType = NS.ChatJoin.Enabled ? NotificationAlertType.TITLEPREFIX : NotificationAlertType.NONE;
		NS.ChatJoin.Audio = NotificationAudioType.NONE;
		delete NS.ChatJoin.Enabled;
	}
	if (typeof NS.ChatJoin.Owner !== "boolean") NS.ChatJoin.Owner = false;
	if (typeof NS.ChatJoin.Lovers !== "boolean") NS.ChatJoin.Lovers = false;
	if (typeof NS.ChatJoin.Friendlist !== "boolean") NS.ChatJoin.Friendlist = false;
	if (typeof NS.ChatJoin.Subs !== "boolean") NS.ChatJoin.Subs = false;
	if (typeof NS.Audio !== "undefined") delete NS.Audio;
	if (typeof NS.Disconnect !== "object") NS.Disconnect = PreferenceInitNotificationSetting(NS.Disconnect, defaultAudio);
	if (typeof NS.Larp !== "object") NS.Larp = PreferenceInitNotificationSetting(NS.Larp, defaultAudio, NotificationAlertType.NONE);
	if (typeof NS.Test !== "object") NS.Test = PreferenceInitNotificationSetting(NS.Test, defaultAudio, NotificationAlertType.TITLEPREFIX);
	C.NotificationSettings = NS;

	// Graphical settings
	// @ts-ignore: Individual properties validated separately
	if (!C.GenderSettings) C.GenderSettings = {};
	if (typeof C.GenderSettings.AutoJoinSearch !== "object") C.GenderSettings.AutoJoinSearch = PreferenceInitGenderSetting();
	if (typeof C.GenderSettings.HideShopItems !== "object") C.GenderSettings.HideShopItems = PreferenceInitGenderSetting();
	if (typeof C.GenderSettings.HideTitles !== "object") C.GenderSettings.HideTitles = PreferenceInitGenderSetting();

	// Forces some preferences depending on difficulty

	// Difficulty: non-Roleplay settings
	if (C.GetDifficulty() >= 1) {
		C.RestrictionSettings.BypassStruggle = false;
		C.RestrictionSettings.SlowImmunity = false;
		C.RestrictionSettings.BypassNPCPunishments = false;
		C.RestrictionSettings.NoSpeechGarble = false;
	}

	// Difficulty: Hardcore settings
	if (C.GetDifficulty() >= 2) {
		C.GameplaySettings.EnableSafeword = false;
		C.GameplaySettings.DisableAutoMaid = true;
		C.GameplaySettings.OfflineLockedRestrained = true;
	}

	// Difficulty: Extreme settings
	if (C.GetDifficulty() >= 3) {
		PreferenceSettingsSensDepIndex = PreferenceSettingsSensDepList.length - 1;
		C.GameplaySettings.SensDepChatLog = PreferenceSettingsSensDepList[PreferenceSettingsSensDepIndex];
		C.GameplaySettings.BlindDisableExamine = true;
		C.GameplaySettings.DisableAutoRemoveLogin = true;
		C.ArousalSettings.DisableAdvancedVibes = false;
		C.GameplaySettings.ImmersionLockSetting = true;
		C.ImmersionSettings.StimulationEvents = true;
		C.ImmersionSettings.ReturnToChatRoom = true;
		C.ImmersionSettings.ReturnToChatRoomAdmin = true;
		C.ImmersionSettings.ChatRoomMapLeaveOnExit = true;
		C.ImmersionSettings.SenseDepMessages = true;
		C.ImmersionSettings.ChatRoomMuffle = true;
		C.ImmersionSettings.BlindAdjacent = true;
		C.ImmersionSettings.AllowTints = true;
		C.OnlineSharedSettings.AllowPlayerLeashing = true;
	}

	// Enables the AFK timer for the current player only
	AfkTimerSetEnabled(C.OnlineSettings.EnableAfkTimer);

	// Sync settings if anything changed
	/** @type {{ [k in keyof typeof PrefBefore]?: PlayerCharacter[k] }} */
	const toUpdate = {};

	for (const prop of Object.keys(PrefBefore))
		if (PrefBefore[prop] !== JSON.stringify(C[prop]))
			toUpdate[prop] = C[prop];

	if (Object.keys(toUpdate).length > 0)
		ServerAccountUpdate.QueueData(toUpdate);

	PreferenceValidateArousalData(Player);

}

/**
 * Initialise the Notifications settings, converting the old boolean types to objects
 * @param {object} setting - The old version of the setting
 * @param {NotificationAudioType} audio - The audio setting
 * @param {NotificationAlertType} [defaultAlertType] - The default AlertType to use
 * @returns {NotificationSetting} - The setting to use
 */
function PreferenceInitNotificationSetting(setting, audio, defaultAlertType) {
	const alertType = typeof setting === "boolean" && setting === true ? NotificationAlertType.TITLEPREFIX : defaultAlertType || NotificationAlertType.NONE;
	setting = {};
	setting.AlertType = alertType;
	setting.Audio = audio;
	return setting;
}

/**
 * Initialise a Gender setting
 * @returns {GenderSetting} - The setting to use
 */
function PreferenceInitGenderSetting() {
	return {
		Female: false,
		Male: false
	};
}

/**
 * Migrates a named preference from one preference object to another if not already migrated
 * @param {object} from - The preference object to migrate from
 * @param {object} to - The preference object to migrate to
 * @param {string} prefName - The name of the preference to migrate
 * @param {any} defaultValue - The default value for the preference if it doesn't exist
 * @returns {void} - Nothing
 */
function PreferenceMigrate(from, to, prefName, defaultValue) {
	// Check that there's something to migrate (new characters) and that
	// we're not already migrated.

	if (typeof from !== "object" || typeof to !== "object") return;
	if (to[prefName] == null) {
		to[prefName] = from[prefName];
		if (to[prefName] == null) to[prefName] = defaultValue;
		if (from[prefName] != null) delete from[prefName];
	}
}

/**
 * Loads the preference screen. This function is called dynamically, when the character enters the preference screen
 * for the first time
 * @returns {void} - Nothing
 */
function PreferenceLoad() {

	// Sets up the player label color
	PreferenceDifficultyLevel = null;
	if (!CommonIsColor(Player.LabelColor)) Player.LabelColor = "#ffffff";
	PreferenceInitPlayer();

	// Sets the chat themes
	PreferenceChatColorThemeIndex = (PreferenceChatColorThemeList.indexOf(Player.ChatSettings.ColorTheme) < 0) ? 0 : PreferenceChatColorThemeList.indexOf(Player.ChatSettings.ColorTheme);
	PreferenceChatEnterLeaveIndex = (PreferenceChatEnterLeaveList.indexOf(Player.ChatSettings.EnterLeave) < 0) ? 0 : PreferenceChatEnterLeaveList.indexOf(Player.ChatSettings.EnterLeave);
	PreferenceChatMemberNumbersIndex = (PreferenceChatMemberNumbersList.indexOf(Player.ChatSettings.MemberNumbers) < 0) ? 0 : PreferenceChatMemberNumbersList.indexOf(Player.ChatSettings.MemberNumbers);
	PreferenceChatFontSizeIndex = (PreferenceChatFontSizeList.indexOf(Player.ChatSettings.FontSize)) < 0 ? 1 : PreferenceChatFontSizeList.indexOf(Player.ChatSettings.FontSize);
	PreferenceSettingsSensDepIndex = (PreferenceSettingsSensDepList.indexOf(Player.GameplaySettings.SensDepChatLog) < 0) ? 0 : PreferenceSettingsSensDepList.indexOf(Player.GameplaySettings.SensDepChatLog);
	PreferenceSettingsVolumeIndex = (PreferenceSettingsVolumeList.indexOf(Player.AudioSettings.Volume) < 0) ? 0 : PreferenceSettingsVolumeList.indexOf(Player.AudioSettings.Volume);
	PreferenceSettingsMusicVolumeIndex = (PreferenceSettingsVolumeList.indexOf(Player.AudioSettings.MusicVolume) < 0) ? 0 : PreferenceSettingsVolumeList.indexOf(Player.AudioSettings.MusicVolume);
	PreferenceArousalActiveIndex = (PreferenceArousalActiveList.indexOf(Player.ArousalSettings.Active) < 0) ? 0 : PreferenceArousalActiveList.indexOf(Player.ArousalSettings.Active);
	PreferenceSettingsVFXIndex = (PreferenceSettingsVFXList.indexOf(Player.ArousalSettings.VFX) < 0) ? 0 : PreferenceSettingsVFXList.indexOf(Player.ArousalSettings.VFX);
	PreferenceSettingsVFXVibratorIndex = (PreferenceSettingsVFXVibratorList.indexOf(Player.ArousalSettings.VFXVibrator) < 0) ? 0 : PreferenceSettingsVFXVibratorList.indexOf(Player.ArousalSettings.VFXVibrator);
	PreferenceSettingsVFXFilterIndex = (PreferenceSettingsVFXFilterList.indexOf(Player.ArousalSettings.VFXFilter) < 0) ? 0 : PreferenceSettingsVFXFilterList.indexOf(Player.ArousalSettings.VFXFilter);
	PreferenceArousalVisibleIndex = (PreferenceArousalVisibleList.indexOf(Player.ArousalSettings.Visible) < 0) ? 0 : PreferenceArousalVisibleList.indexOf(Player.ArousalSettings.Visible);
	PreferenceArousalAffectStutterIndex = (PreferenceArousalAffectStutterList.indexOf(Player.ArousalSettings.AffectStutter) < 0) ? 0 : PreferenceArousalAffectStutterList.indexOf(Player.ArousalSettings.AffectStutter);
	ChatRoomRefreshFontSize();

	// Prepares the activity list
	PreferenceArousalActivityList = [];
	if (Player.AssetFamily == "Female3DCG")
		for (let A = 0; A < ActivityFemale3DCG.length; A++)
			PreferenceArousalActivityList.push(ActivityFemale3DCG[A].Name);
	PreferenceArousalActivityIndex = 0;
	PreferenceLoadActivityFactor();

	// Prepares the fetish list
	PreferenceArousalFetishList = [];
	if (Player.AssetFamily == "Female3DCG")
		for (let A = 0; A < FetishFemale3DCG.length; A++)
			PreferenceArousalFetishList.push(FetishFemale3DCG[A].Name);
	PreferenceArousalFetishIndex = 0;
	PreferenceLoadFetishFactor();

	// Prepares the graphics settings
	PreferenceGraphicsFontIndex = (PreferenceGraphicsFontList.indexOf(Player.GraphicsSettings.Font) < 0) ? 0 : PreferenceGraphicsFontList.indexOf(Player.GraphicsSettings.Font);
	PreferenceGraphicsAnimationQualityIndex = (PreferenceGraphicsAnimationQualityList.indexOf(Player.GraphicsSettings.AnimationQuality) < 0) ? 0 : PreferenceGraphicsAnimationQualityList.indexOf(Player.GraphicsSettings.AnimationQuality);
	PreferenceGraphicsWebGLOptions = GLDrawGetOptions();
	PreferenceGraphicsPowerModeIndex = (PreferenceGraphicsPowerModes.indexOf(PreferenceGraphicsWebGLOptions.powerPreference) < 0) ? 0 : PreferenceGraphicsPowerModes.indexOf(PreferenceGraphicsWebGLOptions.powerPreference);

	// Prepares the censored words list
	PreferenceCensoredWordsOffset = 0;
	PreferenceCensoredWordsList = [];
	if ((Player.ChatSettings.CensoredWordsList != null) && (Player.ChatSettings.CensoredWordsList != "")) PreferenceCensoredWordsList = Player.ChatSettings.CensoredWordsList.split("|");

}

/**
 * Runs the preference screen. This function is called dynamically on a repeated basis.
 * So don't use complex loops or other function calls within this method
 * @returns {void} - Nothing
 */
function PreferenceRun() {

	// If a subscreen is active, draw that instead
	if (PreferenceSubscreen != "") return CommonDynamicFunction("PreferenceSubscreen" + PreferenceSubscreen + "Run()");

	// Draw the player & controls
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	MainCanvas.textAlign = "left";
	DrawText(TextGet("Preferences"), 500, 125, "Black", "Gray");
	MainCanvas.textAlign = "center";

	// Only show the Extension settings if there are any registered
	const adjustedSubscreenList = Object.keys(PreferenceExtensionsSettings).length > 0 ? PreferenceSubscreenList.concat("Extensions") : PreferenceSubscreenList;

	// Draw all the buttons to access the submenus
	for (let A = 0; A < adjustedSubscreenList.length; A++) {
		DrawButton(500 + 420 * Math.floor(A / 7), 160 + 110 * (A % 7), 400, 90, "", "White", "Icons/" + adjustedSubscreenList[A] + ".png");
		DrawTextFit(TextGet("Homepage" + adjustedSubscreenList[A]), 745 + 420 * Math.floor(A / 7), 205 + 110 * (A % 7), 310, "Black");
	}
}

/**
 * Handles click events in the preference screen that are propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGeneralRun() {

	// Draw the online preferences
	MainCanvas.textAlign = "left";
	DrawText(TextGet("GeneralPreferences"), 500, 125, "Black", "Gray");
	if (PreferenceMessage != "") DrawText(TextGet(PreferenceMessage), 865, 125, "Red", "Black");
	DrawText(TextGet("CharacterLabelColor"), 500, 225, "Black", "Gray");
	ElementPosition("InputCharacterLabelColor", 990, 212, 250);

	let TextColorCSS = "";
	if (CommonIsColor(ElementValue("InputCharacterLabelColor"))) TextColorCSS = ElementValue("InputCharacterLabelColor");
	else TextColorCSS = Player.LabelColor;
	document.getElementById("InputCharacterLabelColor").style.color = TextColorCSS;
	let TextColorHSV = ColorPickerCSSToHSV(TextColorCSS);
	if (TextColorHSV.V > 0.4) {
		document.getElementById("InputCharacterLabelColor").style.backgroundColor = "#111111";
	} else{
		document.getElementById("InputCharacterLabelColor").style.backgroundColor = "#FFFFFF";
	}

	DrawButton(1140, 187, 65, 65, "", "White", "Icons/Color.png");
	DrawButton(500, 280, 90, 90, "", "White", "Icons/Next.png");
	DrawText(TextGet("ItemPermission") + " " + TextGet("PermissionLevel" + Player.ItemPermission.toString()), 615, 325, "Black", "Gray");

	// Checkboxes (Some are not available when playing on Hardcore or Extreme)
	DrawCheckbox(500, 402, 64, 64, TextGet("ForceFullHeight"), Player.VisualSettings.ForceFullHeight);
	DrawCheckbox(500, 482, 64, 64, TextGet("DisablePickingLocksOnSelf"), Player.OnlineSharedSettings.DisablePickingLocksOnSelf);
	const onHighDifficulty = Player.GetDifficulty() >= 2;
	DrawCheckbox(500, 722, 64, 64, TextGet(PreferenceSafewordConfirm ? "ConfirmSafeword" : "EnableSafeword"), Player.GameplaySettings.EnableSafeword, onHighDifficulty);
	DrawCheckbox(500, 562, 64, 64, TextGet("DisableAutoMaid"), !Player.GameplaySettings.DisableAutoMaid, onHighDifficulty);
	DrawCheckbox(500, 642, 64, 64, TextGet("OfflineLockedRestrained"), Player.GameplaySettings.OfflineLockedRestrained, onHighDifficulty);
	if (onHighDifficulty) DrawTextWrap(TextGet("GeneralHardcoreWarning"), 1225, 622, 450, 100, "Red");
	DrawCheckbox(500, 802, 64, 64, TextGet("ItemsAffectExpressions"), Player.OnlineSharedSettings.ItemsAffectExpressions);

	// Draw the player & controls
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	if (PreferenceColorPick != "")
		ColorPickerDraw(1250, 185, 675, 800, /** @type {HTMLInputElement} */(document.getElementById(PreferenceColorPick)));
	else
		ColorPickerHide();

	MainCanvas.textAlign = "center";
}

/**
 * Runs and draw the preference screen, difficulty subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenDifficultyRun() {

	// Draw the character and the controls
	MainCanvas.textAlign = "left";
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	DrawText(TextGet("DifficultyPreferences"), 500, 125, "Black", "Gray");

	// When no level is selected, we allow to select one
	if (PreferenceDifficultyLevel == null) {

		// Draw the difficulty levels
		DrawText(TextGet("DifficultyTitle"), 500, 225, "Black", "Gray");
		for (let D = 0; D <= 3; D++) {
			DrawText(TextGet("DifficultySummary" + D.toString() + "A"), 850, 325 + 150 * D, "Black", "White");
			DrawText(TextGet("DifficultySummary" + D.toString() + "B"), 850, 375 + 150 * D, "Black", "White");
		}

		// Draw the difficulty buttons
		MainCanvas.textAlign = "center";
		for (let D = 0; D <= 3; D++)
			DrawButton(500, 320 + 150 * D, 300, 64, TextGet("DifficultyLevel" + D.toString()), (D == Player.GetDifficulty()) ? "#DDFFDD" : "White", "");

	} else {

		// Draw the detailed texts
		for (let T = 0; T <= 4; T++)
			DrawText(TextGet("Difficulty" + PreferenceDifficultyLevel.toString() + "Text" + T.toString()), 500, 225 + 100 * T, "Black", "White");

		// Can only set to 2 or 3 if no change was done for 1 week
		if (PreferenceDifficultyLevel != Player.GetDifficulty()) {
			var LastChange = ((Player.Difficulty == null) || (Player.Difficulty.LastChange == null) || (typeof Player.Difficulty.LastChange !== "number")) ? Player.Creation : Player.Difficulty.LastChange;
			if ((PreferenceDifficultyLevel <= 1) || (LastChange + 604800000 < CurrentTime)) {
				DrawCheckbox(500, 700, 64, 64, TextGet("DifficultyIAccept"), PreferenceDifficultyAccept);
				MainCanvas.textAlign = "center";
				DrawButton(500, 825, 300, 64, TextGet("DifficultyChangeMode") + " " + TextGet("DifficultyLevel" + PreferenceDifficultyLevel.toString()), PreferenceDifficultyAccept ? "White" : "#ebebe4", "");
			} else DrawText(TextGet("DifficultyWaitSevenDays").replace("NumberOfHours", Math.ceil((LastChange + 604800000 - CurrentTime) / 3600000).toString()), 500, 825, "Black", "White");
		} else DrawText(TextGet("DifficultyAlreadyPlayingOn"), 500, 825, "Black", "White");
		MainCanvas.textAlign = "center";

	}

}

/**
 * Runs and draw the preference screen, restriction subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenRestrictionRun() {

	// Draw the character and the controls
	MainCanvas.textAlign = "left";
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	DrawText(TextGet("RestrictionPreferences"), 500, 125, "Black", "Gray");
	const disableButtons = Player.GetDifficulty() > 0;
	DrawText(TextGet(disableButtons ? "RestrictionNoAccess" : "RestrictionAccess"), 500, 225, "Black", "Gray");
	DrawCheckbox(500, 325, 64, 64, TextGet("RestrictionBypassStruggle"), Player.RestrictionSettings.BypassStruggle && !disableButtons, disableButtons);
	DrawCheckbox(500, 425, 64, 64, TextGet("RestrictionSlowImmunity"), Player.RestrictionSettings.SlowImmunity && !disableButtons, disableButtons);
	DrawCheckbox(500, 525, 64, 64, TextGet("RestrictionBypassNPCPunishments"), Player.RestrictionSettings.BypassNPCPunishments && !disableButtons, disableButtons);
	DrawCheckbox(500, 625, 64, 64, TextGet("RestrictionNoSpeechGarble"), Player.RestrictionSettings.NoSpeechGarble && !disableButtons, disableButtons);
	MainCanvas.textAlign = "center";
}

/**
 * Handles click events in the preference screen that are propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceClick() {
	if (ControllerIsActive()) {
		ControllerClearAreas();
	}
	// Pass the click into the opened subscreen
	if (PreferenceSubscreen != "") return CommonDynamicFunction("PreferenceSubscreen" + PreferenceSubscreen + "Click()");

	// Exit button
	if (MouseIn(1815, 75, 90, 90)) PreferenceExit();

	const adjustedSubscreenList = Object.keys(PreferenceExtensionsSettings).length > 0 ? PreferenceSubscreenList.concat("Extensions") : PreferenceSubscreenList;

	// Open the selected subscreen
	for (let A = 0; A < adjustedSubscreenList.length; A++)
		if (MouseIn(500 + 420 * Math.floor(A / 7), 160 + 110 * (A % 7), 400, 90)) {
			if (typeof window["PreferenceSubscreen" + adjustedSubscreenList[A] + "Load"] === "function")
				CommonDynamicFunction("PreferenceSubscreen" + adjustedSubscreenList[A] + "Load()");
			PreferenceSubscreen = adjustedSubscreenList[A];
			PreferencePageCurrent = 1;
			if (adjustedSubscreenList[A] === "Scripts") {
				PreferenceScriptTimer = Date.now() + 5000;
				PreferenceScriptTimeoutHandle = setTimeout(() => {
					PreferenceScriptTimer = null;
					PreferenceScriptTimeoutHandle = null;
				}, 5000);
			}
			break;
		}

}

/**
 * Handles the click events in the preference screen, general sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGeneralClick() {

	// If the user clicks on "Exit"
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenGeneralExit();

	// If we must change the restrain permission level
	if (MouseIn(500, 280, 90, 90)) {
		Player.ItemPermission++;
		if (Player.ItemPermission > 5) Player.ItemPermission = 0;
		if (Player.GetDifficulty() >= 3) LoginExtremeItemSettings(Player.ItemPermission == 0);
	}

	// If we must show/hide/use the color picker
	if (MouseIn(1140, 187, 65, 65)) PreferenceColorPick = (PreferenceColorPick != "InputCharacterLabelColor") ? "InputCharacterLabelColor" : "";
	if (MouseIn(1815, 75, 90, 90) && (PreferenceColorPick != "")) PreferenceColorPick = "";

	// Preference check boxes
	if (MouseIn(500, 402, 64, 64)) Player.VisualSettings.ForceFullHeight = !Player.VisualSettings.ForceFullHeight;
	if (MouseIn(500, 482, 64, 64) ) Player.OnlineSharedSettings.DisablePickingLocksOnSelf = !Player.OnlineSharedSettings.DisablePickingLocksOnSelf;
	if (MouseIn(500, 722, 64, 64) && (Player.GetDifficulty() < 2)) {
		if (!Player.GameplaySettings.EnableSafeword && !Player.IsRestrained() && !Player.IsChaste()) {
			if (PreferenceSafewordConfirm) {
				Player.GameplaySettings.EnableSafeword = true;
				PreferenceSafewordConfirm = false;
			} else PreferenceSafewordConfirm = true;
		} else if (Player.GameplaySettings.EnableSafeword) {
			if (PreferenceSafewordConfirm) {
				Player.GameplaySettings.EnableSafeword = false;
				PreferenceSafewordConfirm = false;
			} else PreferenceSafewordConfirm = true;
		}
	} else PreferenceSafewordConfirm = false;
	if (MouseIn(500, 562, 64, 64) && (Player.GetDifficulty() < 2)) Player.GameplaySettings.DisableAutoMaid = !Player.GameplaySettings.DisableAutoMaid;
	if (MouseIn(500, 642, 64, 64) && (Player.GetDifficulty() < 2)) Player.GameplaySettings.OfflineLockedRestrained = !Player.GameplaySettings.OfflineLockedRestrained;
	if (MouseIn(500, 802, 64, 64)) Player.OnlineSharedSettings.ItemsAffectExpressions = !Player.OnlineSharedSettings.ItemsAffectExpressions;
}

/**
 * Handles the click events in the preference screen, difficulty sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenDifficultyClick() {

	// When no level is selected, the user can pick one to go into details
	if (PreferenceDifficultyLevel == null) {
		PreferenceDifficultyAccept = false;
		if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenDifficultyExit();
		for (let D = 0; D <= 3; D++)
			if (MouseIn(500, 320 + 150 * D, 300, 64))
				PreferenceDifficultyLevel = D;
	} else {

		// If a level is selected, the user must check to confirm
		if (MouseIn(1815, 75, 90, 90)) PreferenceDifficultyLevel = null;
		if (PreferenceDifficultyLevel != Player.GetDifficulty()) {
			var LastChange = ((Player.Difficulty == null) || (Player.Difficulty.LastChange == null) || (typeof Player.Difficulty.LastChange !== "number")) ? Player.Creation : Player.Difficulty.LastChange;
			if ((PreferenceDifficultyLevel <= 1) || (LastChange + 604800000 < CurrentTime)) {
				if (MouseIn(500, 700, 64, 64)) PreferenceDifficultyAccept = !PreferenceDifficultyAccept;
				if (MouseIn(500, 825, 300, 64) && PreferenceDifficultyAccept) {
					Player.Difficulty = { LastChange: CurrentTime, Level: PreferenceDifficultyLevel };
					ServerSend("AccountDifficulty", PreferenceDifficultyLevel);
					PreferenceInitPlayer();
					LoginDifficulty(true);
					PreferenceDifficultyLevel = null;
					PreferenceSubscreenDifficultyExit();
				}
			}
		}

	}

}

/**
 * Handles the click events in the preference screen, restriction sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenRestrictionClick() {
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenDifficultyExit();
	if (MouseIn(500, 325, 64, 64) && (Player.GetDifficulty() == 0)) Player.RestrictionSettings.BypassStruggle = !Player.RestrictionSettings.BypassStruggle;
	if (MouseIn(500, 425, 64, 64) && (Player.GetDifficulty() == 0)) Player.RestrictionSettings.SlowImmunity = !Player.RestrictionSettings.SlowImmunity;
	if (MouseIn(500, 525, 64, 64) && (Player.GetDifficulty() == 0)) Player.RestrictionSettings.BypassNPCPunishments = !Player.RestrictionSettings.BypassNPCPunishments;
	if (MouseIn(500, 625, 64, 64) && (Player.GetDifficulty() == 0)) Player.RestrictionSettings.NoSpeechGarble = !Player.RestrictionSettings.NoSpeechGarble;
}

/**
 * Runs and draws the preference screen, immersion sub-screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenImmersionRun() {

	// Draw the player & base controls
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	if (PreferenceMessage != "") DrawText(TextGet(PreferenceMessage), 865, 125, "Red", "Black");
	PreferencePageChangeDraw(1595, 75, 2); // Uncomment when adding a 2nd page
	MainCanvas.textAlign = "left";
	DrawText(TextGet("ImmersionPreferences"), 500, 125, "Black", "Gray");

	const disableButtons = Player.GetDifficulty() > 2 || (Player.GameplaySettings.ImmersionLockSetting && Player.IsRestrained());
	if (Player.GetDifficulty() <= 2) {
		let CheckImage = disableButtons ? "Icons/CheckLocked.png" : "Icons/CheckUnlocked.png";
		DrawCheckbox(500, 172, 64, 64, TextGet("ImmersionLockSetting"), Player.GameplaySettings.ImmersionLockSetting, disableButtons, "Black", CheckImage);
	} else {
		// Cannot change any value under the Extreme difficulty mode
		DrawText(TextGet("ImmersionLocked"), 500, 205, "Red", "Gray");
	}


	DrawEmptyRect(500, 255, 1400, 0, "Black", 1);

	let CheckHeight = 272;
	let CheckSpacing = 80;

	if (PreferencePageCurrent === 1) {
		DrawText(TextGet("SensDepSetting"), 800, 308, "Black", "Gray"); CheckHeight += CheckSpacing;
		// Disable the BlindDisableExamine checkbox when the SensDep setting overrides its behaviour
		const bdeForceOff = PreferenceSettingsSensDepIndex === PreferenceSettingsSensDepList.indexOf("SensDepLight");
		const bdeForceOn = PreferenceSettingsSensDepIndex === PreferenceSettingsSensDepList.indexOf("SensDepExtreme");
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("BlindDisableExamine"), (Player.GameplaySettings.BlindDisableExamine && !bdeForceOff) || bdeForceOn, disableButtons || bdeForceOff || bdeForceOn);
		CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("BlindAdjacent"), Player.ImmersionSettings.BlindAdjacent, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("ChatRoomMuffle"), Player.ImmersionSettings.ChatRoomMuffle, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("DisableAutoRemoveLogin"), Player.GameplaySettings.DisableAutoRemoveLogin, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("AllowPlayerLeashing"), Player.OnlineSharedSettings.AllowPlayerLeashing, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("ReturnToChatRoom"), Player.ImmersionSettings.ReturnToChatRoom, disableButtons);
		const returnToRoomEnabled = Player.ImmersionSettings.ReturnToChatRoom;
		DrawCheckbox(1300, CheckHeight, 64, 64, TextGet("ReturnToChatRoomAdmin"), returnToRoomEnabled && Player.ImmersionSettings.ReturnToChatRoomAdmin, !returnToRoomEnabled || disableButtons);
		CheckHeight += CheckSpacing;
		const canHideMessages = Player.GameplaySettings.SensDepChatLog !== "SensDepLight";
		DrawCheckbox(1300, 272, 64, 64, TextGet("SenseDepMessages"), canHideMessages && Player.ImmersionSettings.SenseDepMessages, !canHideMessages || disableButtons);
		MainCanvas.textAlign = "center";
		DrawBackNextButton(500, 272, 250, 64, TextGet(Player.GameplaySettings.SensDepChatLog), "White", "",
			() => disableButtons ? "" : TextGet(PreferenceSettingsSensDepList[(PreferenceSettingsSensDepIndex + PreferenceSettingsSensDepList.length - 1) % PreferenceSettingsSensDepList.length]),
			() => disableButtons ? "" : TextGet(PreferenceSettingsSensDepList[(PreferenceSettingsSensDepIndex + 1) % PreferenceSettingsSensDepList.length]));
	}
	else if (PreferencePageCurrent === 2) {
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("StimulationEvents"), Player.ImmersionSettings.StimulationEvents, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("AllowTints"), Player.ImmersionSettings.AllowTints, disableButtons); CheckHeight += CheckSpacing;
		DrawCheckbox(500, CheckHeight, 64, 64, TextGet("ChatRoomMapLeaveOnExit"), Player.ImmersionSettings.ChatRoomMapLeaveOnExit, disableButtons); CheckHeight += CheckSpacing;
		MainCanvas.textAlign = "center";
	}

}

/**
 * Handles the click events in the preference screen, immersion sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenImmersionClick() {

	// If the user clicks on "Exit"
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreen = "";
	// Change page
	PreferencePageChangeClick(1595, 75, 2); // Uncomment when adding a 2nd page

	// Cannot change any value under the Extreme difficulty mode
	if (Player.GetDifficulty() <= 2 && (!Player.GameplaySettings.ImmersionLockSetting || (!Player.IsRestrained()))) {
		let CheckHeight = 272;
		let CheckSpacing = 80;

		// Preference check boxes
		if (MouseIn(500, 172, 64, 64)) Player.GameplaySettings.ImmersionLockSetting = !Player.GameplaySettings.ImmersionLockSetting;

		if (PreferencePageCurrent === 1) {
			// If we must change sens dep settings
			if (MouseIn(500, CheckHeight, 250, 64)) {
				if (MouseX <= 625) PreferenceSettingsSensDepIndex = (PreferenceSettingsSensDepList.length + PreferenceSettingsSensDepIndex - 1) % PreferenceSettingsSensDepList.length;
				else PreferenceSettingsSensDepIndex = (PreferenceSettingsSensDepIndex + 1) % PreferenceSettingsSensDepList.length;
				Player.GameplaySettings.SensDepChatLog = PreferenceSettingsSensDepList[PreferenceSettingsSensDepIndex];
				if (Player.GameplaySettings.SensDepChatLog == "SensDepExtreme") ChatRoomSetTarget(null);
			}
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64) && ![PreferenceSettingsSensDepList.indexOf("SensDepLight"), PreferenceSettingsSensDepList.indexOf("SensDepExtreme")].includes(PreferenceSettingsSensDepIndex))
				Player.GameplaySettings.BlindDisableExamine = !Player.GameplaySettings.BlindDisableExamine;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.BlindAdjacent = !Player.ImmersionSettings.BlindAdjacent;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.ChatRoomMuffle = !Player.ImmersionSettings.ChatRoomMuffle;
			CheckHeight += CheckSpacing;

			// Room control
			if (MouseIn(500, CheckHeight, 64, 64)) Player.GameplaySettings.DisableAutoRemoveLogin = !Player.GameplaySettings.DisableAutoRemoveLogin;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.OnlineSharedSettings.AllowPlayerLeashing = !Player.OnlineSharedSettings.AllowPlayerLeashing;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.ReturnToChatRoom = !Player.ImmersionSettings.ReturnToChatRoom;
			if (MouseIn(1300, CheckHeight, 64, 64) && Player.ImmersionSettings.ReturnToChatRoom)
				Player.ImmersionSettings.ReturnToChatRoomAdmin = !Player.ImmersionSettings.ReturnToChatRoomAdmin;
			CheckHeight += CheckSpacing;

			if (MouseIn(1300, 272, 64, 64) && Player.GameplaySettings.SensDepChatLog !== "SensDepLight")
				Player.ImmersionSettings.SenseDepMessages = !Player.ImmersionSettings.SenseDepMessages;

		}
		else if (PreferencePageCurrent === 2) {
			// Stimulation
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.StimulationEvents = !Player.ImmersionSettings.StimulationEvents;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.AllowTints = !Player.ImmersionSettings.AllowTints;
			CheckHeight += CheckSpacing;
			if (MouseIn(500, CheckHeight, 64, 64)) Player.ImmersionSettings.ChatRoomMapLeaveOnExit = !Player.ImmersionSettings.ChatRoomMapLeaveOnExit;
			CheckHeight += CheckSpacing;
		}
	}

}

/**
 * Is called when the player exits the preference screen. All settings of the preference screen are sent to the server.
 * If the player is in a subscreen, they exit to the main preferences menu instead.
 * @returns {void} - Nothing
 */
function PreferenceExit() {
	if (PreferenceSubscreen !== "") {
		// Exit the subscreen to the main preferences menu
		if (typeof window["PreferenceSubscreen" + PreferenceSubscreen + "Exit"] === "function") {
			window["PreferenceSubscreen" + PreferenceSubscreen + "Exit"]();
		}
		else {
			PreferenceMessage = "";
			PreferenceSubscreen = "";
		}
	} else {
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
			LimitedItems: CommonPackItemArray(Player.LimitedItems),
		};
		ServerAccountUpdate.QueueData(P);
		PreferenceMessage = "";
		CommonSetScreen("Character", "InformationSheet");
	}
}

/**
 * Sets the audio preferences for the player. Redirected to from the main Run function if the player is in the audio
 * settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenAudioRun() {
	DrawCharacter(Player, 50, 50, 0.9);
	MainCanvas.textAlign = "left";
	DrawText(TextGet("AudioPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("AudioVolume"), 800, 225, "Black", "Gray");
	MainCanvas.textAlign = "center";
	DrawBackNextButton(500, 193, 250, 64, Player.AudioSettings.Volume * 100 + "%", "White", "",
		() => PreferenceSettingsVolumeList[(PreferenceSettingsVolumeIndex + PreferenceSettingsVolumeList.length - 1) % PreferenceSettingsVolumeList.length] * 100 + "%",
		() => PreferenceSettingsVolumeList[(PreferenceSettingsVolumeIndex + 1) % PreferenceSettingsVolumeList.length] * 100 + "%");
	MainCanvas.textAlign = "left";
	DrawText(TextGet("MusicVolume"), 800, 310, "Black", "Gray");
	MainCanvas.textAlign = "center";
	DrawBackNextButton(500, 272, 250, 64, Player.AudioSettings.MusicVolume * 100 + "%", "White", "",
		() => PreferenceSettingsVolumeList[(PreferenceSettingsMusicVolumeIndex + PreferenceSettingsVolumeList.length - 1) % PreferenceSettingsVolumeList.length] * 100 + "%",
		() => PreferenceSettingsVolumeList[(PreferenceSettingsMusicVolumeIndex + 1) % PreferenceSettingsVolumeList.length] * 100 + "%");
	MainCanvas.textAlign = "left";
	DrawCheckbox(500, 352, 64, 64, TextGet("AudioPlayBeeps"), Player.AudioSettings.PlayBeeps);
	DrawCheckbox(500, 432, 64, 64, TextGet("AudioPlayItem"), Player.AudioSettings.PlayItem);
	DrawCheckbox(500, 512, 64, 64, TextGet("AudioPlayItemPlayerOnly"), Player.AudioSettings.PlayItemPlayerOnly);
	DrawCheckbox(500, 592, 64, 64, TextGet("AudioNotifications"), Player.AudioSettings.Notifications);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
}

/**
 * Sets the controller preferences for the player. Redirected to from the main Run function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenControllerRun() {
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	if (!ControllerIsCalibrating()) {
		DrawCharacter(Player, 50, 50, 0.9);
		MainCanvas.textAlign = "left";
		DrawText(TextGet("ControllerPreferences"), 500, 125, "Black", "Gray");
		DrawText(TextGet("Sensitivity"), 800, 225, "Black", "Gray");
		DrawText(TextGet("DeadZone"), 800, 625, "Black", "Gray");
		DrawCheckbox(500, 272, 64, 64, TextGet("ControllerActive"), ControllerIsEnabled());

		DrawButton(500, 380, 400, 90, "", "White");
		DrawTextFit(TextGet("MapButtons"), 590, 425, 310, "Black");

		DrawButton(500, 480, 400, 90, "", "White");
		DrawTextFit(TextGet("MapSticks"), 590, 525, 310, "Black");

		MainCanvas.textAlign = "center";
		DrawBackNextButton(500, 193, 250, 64, Player.ControllerSettings.ControllerSensitivity.toString(), "White", "",
			() => PreferenceSettingsSensitivityList[(PreferenceSettingsSensitivityIndex + PreferenceSettingsSensitivityList.length - 1) % PreferenceSettingsSensitivityList.length].toString(),
			() => PreferenceSettingsSensitivityList[(PreferenceSettingsSensitivityIndex + 1) % PreferenceSettingsSensitivityList.length].toString());
		MainCanvas.textAlign = "center";
		DrawBackNextButton(500, 593, 250, 64, Player.ControllerSettings.ControllerDeadZone.toString(), "White", "",
			() => PreferenceSettingsDeadZoneList[(PreferenceSettingsDeadZoneIndex + PreferenceSettingsDeadZoneList.length - 1) % PreferenceSettingsDeadZoneList.length].toString(),
			() => PreferenceSettingsDeadZoneList[(PreferenceSettingsDeadZoneIndex + 1) % PreferenceSettingsDeadZoneList.length].toString() );
	} else {
		DrawButton(1815, 178, 90, 90, "", "White", "Icons/Cancel.png", TextGet("Skip"));
		const label = ControllerCalibrationStageLabel();
		MainCanvas.textAlign = "left";
		DrawTextFit(label, 590, 425, 310, "Black");
		MainCanvas.textAlign = "center";
	}
}

/**
 * Sets the censored words for the player. Redirected to from the main Run function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenCensoredWordsRun() {

	// Draw the header
	DrawText(TextGet("CensorTitle"), 930, 105, "Black", "Silver");
	DrawButton(1830, 60, 90, 90, "", "White", "Icons/Exit.png", TextGet("CensorExit"));
	DrawText(TextGet("CensorLevel"), 200, 205, "Black", "Silver");
	DrawButton(350, 175, 550, 60, TextGet("CensorLevel" + Player.ChatSettings.CensoredWordsLevel), "White");
	DrawText(TextGet("CensorWord"), 1080, 205, "Black", "Silver");
	ElementPosition("InputWord", 1385, 200, 300);
	DrawButton(1550, 175, 180, 60, TextGet("CensorAdd"), "White");
	if (PreferenceCensoredWordsList.length > 32) DrawButton(1830, 175, 90, 90, "", "White", "Icons/Next.png");

	// List all words with a delete button
	MainCanvas.textAlign = "left";
	for (let O = PreferenceCensoredWordsOffset; O < PreferenceCensoredWordsList.length && O < PreferenceCensoredWordsOffset + 32; O++) {
		let X = 100 + Math.floor((O - PreferenceCensoredWordsOffset)/ 8) * 450;
		let Y = 270 + ((O % 8) * 84);
		DrawButton(X, Y, 60, 60, "", "White", "Icons/Small/Remove.png");
		DrawText(PreferenceCensoredWordsList[O], X + 100, Y + 30, "Black", "Gray");
	}
	MainCanvas.textAlign = "center";

}

/**
 * Sets the chat preferences for the player. Redirected to from the main Run function if the player is in the chat
 * settings subscreen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenChatRun() {
	MainCanvas.textAlign = "left";
	DrawText(TextGet("ChatPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("ColorTheme"), 500, 200, "Black", "Gray");
	DrawText(TextGet("EnterLeaveStyle"), 500, 280, "Black", "Gray");
	DrawText(TextGet("DisplayMemberNumbers"), 500, 360, "Black", "Gray");
	DrawText(TextGet("FontSize"), 500, 440, "Black", "Gray");

	switch (PreferenceChatPageIndex) {
		case 0:
			DrawCheckbox(500, 572, 64, 64, TextGet("ColorNames"), Player.ChatSettings.ColorNames);
			DrawCheckbox(500, 652, 64, 64, TextGet("ColorActions"), Player.ChatSettings.ColorActions);
			DrawCheckbox(500, 732, 64, 64, TextGet("ColorEmotes"), Player.ChatSettings.ColorEmotes);
			DrawCheckbox(500, 812, 64, 64, TextGet("ShowActivities"), Player.ChatSettings.ShowActivities);
			DrawCheckbox(1200, 572, 64, 64, TextGet("PreserveWhitespace"), Player.ChatSettings.WhiteSpace == "Preserve");
			DrawCheckbox(1200, 652, 64, 64, TextGet("ColorActivities"), Player.ChatSettings.ColorActivities);
			DrawCheckbox(1200, 732, 64, 64, TextGet("ShrinkNonDialogue"), Player.ChatSettings.ShrinkNonDialogue);
			DrawCheckbox(1200, 812, 64, 64, TextGet("MuStylePoses"), Player.ChatSettings.MuStylePoses);
			break;
		case 1:
			DrawCheckbox(500, 572, 64, 64, TextGet("DisplayTimestamps"), Player.ChatSettings.DisplayTimestamps);
			DrawCheckbox(500, 652, 64, 64, TextGet("ShowChatRoomHelp"), Player.ChatSettings.ShowChatHelp);
			DrawCheckbox(500, 732, 64, 64, TextGet("PreserveChat"), Player.ChatSettings.PreserveChat);
			DrawCheckbox(1200, 572, 64, 64, TextGet("ShowAutomaticMessages"), Player.ChatSettings.ShowAutomaticMessages);
			DrawCheckbox(1200, 652, 64, 64, TextGet("ShowBeepChat"), Player.ChatSettings.ShowBeepChat);
			break;
	}

	MainCanvas.textAlign = "center";
	PreferenceDrawBackNextButton(1000, 170, 350, 60, PreferenceChatColorThemeList, PreferenceChatColorThemeIndex);
	PreferenceDrawBackNextButton(1000, 250, 350, 60, PreferenceChatEnterLeaveList, PreferenceChatEnterLeaveIndex);
	PreferenceDrawBackNextButton(1000, 330, 350, 60, PreferenceChatMemberNumbersList, PreferenceChatMemberNumbersIndex);
	PreferenceDrawBackNextButton(1000, 410, 350, 60, PreferenceChatFontSizeList, PreferenceChatFontSizeIndex);
	PreferenceDrawBackNextButton(1000, 490, 350, 60, PreferenceChatPageList.map(i => `ChatSettingsPage${i}`), PreferenceChatPageIndex);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Sets the online preferences for the player. Redirected to from the main Run function if the player is in the online
 * settings subscreen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenOnlineRun() {
	MainCanvas.textAlign = "left";
	DrawText(TextGet("OnlinePreferences"), 500, 125, "Black", "Gray");
	DrawCheckbox(500, 172, 64, 64, TextGet("AutoBanBlackList"), Player.OnlineSettings.AutoBanBlackList);
	DrawCheckbox(500, 255, 64, 64, TextGet("AutoBanGhostList"), Player.OnlineSettings.AutoBanGhostList);
	DrawCheckbox(500, 335, 64, 64, TextGet("SearchShowsFullRooms"), Player.OnlineSettings.SearchShowsFullRooms);
	DrawCheckbox(500, 415, 64, 64, TextGet("SearchFriendsFirst"), Player.OnlineSettings.SearchFriendsFirst);
	DrawCheckbox(500, 495, 64, 64, TextGet("DisableAnimations"), Player.OnlineSettings.DisableAnimations);
	DrawCheckbox(500, 575, 64, 64, TextGet("EnableAfkTimer"), Player.OnlineSettings.EnableAfkTimer);
	DrawCheckbox(500, 655, 64, 64, TextGet("AllowFullWardrobeAccess"), Player.OnlineSharedSettings.AllowFullWardrobeAccess);
	DrawCheckbox(500, 735, 64, 64, TextGet("BlockBodyCosplay"), Player.OnlineSharedSettings.BlockBodyCosplay);
	DrawCheckbox(1300, 172, 64, 64, TextGet("ShowStatus"), Player.OnlineSettings.ShowStatus);
	DrawCheckbox(1300, 255, 64, 64, TextGet("SendStatus"), Player.OnlineSettings.SendStatus);
	DrawText(TextGet("RoomCustomizationLabel"), 500, 840, "Black", "Gray");
	MainCanvas.textAlign = "center";
	DrawButton(850, 808, 350, 64, TextGet("RoomCustomizationLevel" + Player.OnlineSettings.ShowRoomCustomization.toString()), "White");
	MainCanvas.textAlign = "left";
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	DrawCharacter(Player, 50, 50, 0.9);
	MainCanvas.textAlign = "center";
}

function PreferenceSubscreenArousalLoad() {
	CharacterAppearanceForceUpCharacter = Player.MemberNumber;
}

/**
 * Sets the arousal preferences for a player. Redirected to from the main Run function if the player is in the arousal
 * settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenArousalRun() {

	// Draws the main labels and player
	DrawCharacter(Player, 50, 50, 0.9, false);
	MainCanvas.textAlign = "left";
	DrawText(TextGet("ArousalPreferences"), 550, 125, "Black", "Gray");
	DrawText(TextGet("ArousalActive"), 550, 225, "Black", "Gray");
	DrawText(TextGet("ArousalStutter"), 550, 460, "Black", "Gray");
	DrawCheckbox(550, 276, 64, 64, TextGet("ArousalShowOtherMeter"), Player.ArousalSettings.ShowOtherMeter);
	DrawCheckbox(550, 356, 64, 64, TextGet("ArousalDisableAdvancedVibes"), Player.ArousalSettings.DisableAdvancedVibes, Player.GetDifficulty() >= 3);


	// The other controls are only drawn if the arousal is active
	if (PreferenceArousalIsActive()) {

		// Draws the labels and check boxes
		DrawCheckbox(1250, 276, 64, 64, TextGet("ArousalAffectExpression"), Player.ArousalSettings.AffectExpression);
		DrawText(TextGet("ArousalVisible"), 1240, 225, "Black", "Gray");
		DrawText(TextGet("ArousalFetish"), 550, 555, "Black", "Gray");
		DrawText(TextGet("ArousalActivity"), 550, 640, "Black", "Gray");
		DrawText(TextGet("ArousalActivityLoveSelf"), 550, 725, "Black", "Gray");
		DrawText(TextGet("ArousalActivityLoveOther"), 1255, 725, "Black", "Gray");

		// Draws all the available character zones
		for (let Group of AssetGroup) {
			if (Group.IsItem() && !Group.MirrorActivitiesFrom && AssetActivitiesForGroup("Female3DCG", Group.Name).length)
				DrawAssetGroupZone(Player, Group.Zone, 0.9, 50, 50, 1, "#808080FF", 3, PreferenceGetFactorColor(PreferenceGetZoneFactor(Player, Group.Name)));
		}

		// The zones can be selected and drawn on the character
		if (Player.FocusGroup != null) {
			DrawCheckbox(1230, 853, 64, 64, TextGet("ArousalAllowOrgasm"), PreferenceGetZoneOrgasm(Player, Player.FocusGroup.Name));
			DrawText(TextGet("ArousalZone" + Player.FocusGroup.Name) + " - " + TextGet("ArousalConfigureErogenousZones"), 550, 795, "Black", "Gray");
			DrawAssetGroupZone(Player, Player.FocusGroup.Zone, 0.9, 50, 50, 1, "cyan");
			MainCanvas.textAlign = "center";
			DrawBackNextButton(550, 853, 600, 64, TextGet("ArousalZoneLove" + PreferenceArousalZoneFactor), PreferenceGetFactorColor(PreferenceGetZoneFactor(Player, Player.FocusGroup.Name)), "", () => "", () => "");
		}
		else DrawText(TextGet("ArousalSelectErogenousZones"), 550, 795, "Black", "Gray");

		// Draws the sub-selection controls
		MainCanvas.textAlign = "center";
		DrawBackNextButton(1505, 193, 400, 64, TextGet("ArousalVisible" + PreferenceArousalVisibleList[PreferenceArousalVisibleIndex]), "White", "", () => "", () => "");
		DrawBackNextButton(900, 598, 500, 64, ActivityDictionaryText("Activity" + PreferenceArousalActivityList[PreferenceArousalActivityIndex]), "White", "", () => "", () => "");
		DrawBackNextButton(900, 683, 300, 64, TextGet("ArousalActivityLove" + PreferenceArousalActivityFactorSelf), PreferenceGetFactorColor(PreferenceGetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], true)), "", () => "", () => "");
		DrawBackNextButton(1605, 683, 300, 64, TextGet("ArousalActivityLove" + PreferenceArousalActivityFactorOther), PreferenceGetFactorColor(PreferenceGetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], false)), "", () => "", () => "");

		// Fetish elements
		DrawBackNextButton(900, 513, 500, 64, TextGet("ArousalFetish" + PreferenceArousalFetishList[PreferenceArousalFetishIndex]), "White", "", () => "", () => "");
		DrawBackNextButton(1455, 513, 450, 64, TextGet("ArousalFetishLove" + PreferenceArousalFetishFactor), PreferenceGetFactorColor(PreferenceGetFetishFactor(Player, PreferenceArousalFetishList[PreferenceArousalFetishIndex])), "", () => "", () => "");
	}

	// We always draw the active & stutter control
	MainCanvas.textAlign = "center";
	DrawBackNextButton(750, 193, 450, 64, TextGet("ArousalActive" + PreferenceArousalActiveList[PreferenceArousalActiveIndex]), "White", "", () => "", () => "");
	DrawBackNextButton(900, 428, 500, 64, TextGet("ArousalStutter" + PreferenceArousalAffectStutterList[PreferenceArousalAffectStutterIndex]), "White", "", () => "", () => "");
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");

}

/**
 * Sets the security preferences for a player. Redirected to from the main Run function if the player is in the
 * security settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenSecurityRun() {
	DrawCharacter(Player, 50, 50, 0.9);
	MainCanvas.textAlign = "left";
	DrawText(TextGet("SecurityPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("UpdateEmailOld"), 500, 225, "Black", "Gray");
	DrawText(TextGet("UpdateEmailNew"), 500, 305, "Black", "Gray");
	ElementPosition("InputEmailOld", 1200, 225, 800);
	ElementPosition("InputEmailNew", 1200, 305, 800);
	DrawText(TextGet("UpdateEmailDescription"), 800, 397, "Black", "Gray");
	MainCanvas.textAlign = "center";
	DrawButton(500, 365, 250, 64, TextGet("UpdateEmail"), "White", "");
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
}

/**
 * Sets the item visibility preferences for a player. Redirected to from the main Run function if the player is in the
 * visibility settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenVisibilityRun() {

	// Character and exit buttons
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1720, 60, 90, 90, "", "White", "Icons/Accept.png", TextGet("LeaveSave"));
	DrawButton(1820, 60, 90, 90, "", "White", "Icons/Cancel.png", TextGet("LeaveNoSave"));
	MainCanvas.textAlign = "left";
	DrawText(TextGet("VisibilityPreferences"), 500, 125, "Black", "Gray");

	// Not available in Extreme mode
	if (Player.GetDifficulty() <= 2) {

		// Left-aligned text controls
		DrawText(TextGet("VisibilityGroup"), 500, 225, "Black", "Gray");
		DrawText(TextGet("VisibilityAsset"), 500, 304, "Black", "Gray");
		DrawCheckbox(500, 352, 64, 64, TextGet("VisibilityCheckboxHide"), PreferenceVisibilityHideChecked);
		DrawCheckbox(500, 432, 64, 64, TextGet("VisibilityCheckboxBlock"), PreferenceVisibilityBlockChecked, !PreferenceVisibilityCanBlock);
		if (PreferenceVisibilityHideChecked) {
			DrawImageResize("Screens/Character/Player/HiddenItem.png", 500, 516, 86, 86);
			DrawText(TextGet("VisibilityWarning"), 600, 548, "Black", "Gray");
		}
		if (PreferenceVisibilityResetClicked) DrawText(TextGet("VisibilityResetDescription"), 500, 732, "Black", "Gray");
		MainCanvas.textAlign = "center";

		// Buttons
		DrawBackNextButton(650, 193, 500, 64, PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Group.Description, "White", "", () => "", () => "");
		DrawBackNextButton(650, 272, 500, 64, PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Asset.Description, "White", "", () => "", () => "");
		DrawButton(500, PreferenceVisibilityResetClicked ? 780 : 700, 300, 64, TextGet("VisibilityReset"), "White", "");

		// Preview icon
		if (PreferenceVisibilityHideChecked) DrawPreviewBox(1200, 193, "Icons/HiddenItem.png", "", { Border: true });

		else DrawAssetPreview(1200, 193, PreferenceVisibilityPreviewAsset, {Description: "", Border: true});
	} else {
		MainCanvas.textAlign = "center";
		DrawText(TextGet("VisibilityLocked"), 1200, 500, "Red", "Gray");
	}

}

/**
 * Sets the graphical preferences for a player. Redirected to from the main Run function if the player is in the
 * visibility settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGraphicsRun() {

	// Character and exit button
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");

	MainCanvas.textAlign = "center";
	PreferencePageChangeDraw(1595, 75, 2); // Uncomment when adding a 2nd page

	MainCanvas.textAlign = "left";
	DrawText(TextGet("VFXPreferences"), 500, 125, "Black", "Gray");

	if (PreferencePageCurrent === 1) {
		DrawText(TextGet("VFX"), 800, 216, "Black", "Gray");
		DrawText(TextGet("GraphicsFont"), 800, 306, "Black", "Gray");
		DrawTextFit(TextGet("GraphicsFontDisclaimer"), 500, 376, 1400, "Black", "Gray");
		DrawCheckbox(500, 430, 64, 64, TextGet("GraphicsInvertRoom"), Player.GraphicsSettings.InvertRoom);
		DrawCheckbox(500, 510, 64, 64, TextGet("GraphicsStimulationFlash"), Player.GraphicsSettings.StimulationFlash);
		DrawCheckbox(500, 590, 64, 64, TextGet("DoBlindFlash"), Player.GraphicsSettings.DoBlindFlash);
		DrawText(TextGet("GeneralAnimationQualityText"), 750, 712, "Black", "Gray");
		if (GLVersion !== "No WebGL") {
			DrawCheckbox(500, 765, 64, 64, TextGet("GraphicsAntialiasing"), PreferenceGraphicsWebGLOptions.antialias);
			DrawText(TextGet("GraphicsPowerMode"), 880, 885, "Black", "Gray");
		} else {
			DrawText(TextGet("GraphicsNoWebGL"), 700, 810, "Red", "Gray");
		}

		MainCanvas.textAlign = "center";
		DrawBackNextButton(500, 182, 250, 64, TextGet(Player.ArousalSettings.VFX), "White", "",
			() => TextGet(PreferenceSettingsVFXList[(PreferenceSettingsVFXIndex + PreferenceSettingsVFXList.length - 1) % PreferenceSettingsVFXList.length]),
			() => TextGet(PreferenceSettingsVFXList[(PreferenceSettingsVFXIndex + 1) % PreferenceSettingsVFXList.length]));

		DrawBackNextButton(500, 270, 250, 64, TextGet(Player.GraphicsSettings.Font), "White", "",
			() => TextGet(PreferenceGraphicsFontList[(PreferenceGraphicsFontIndex + PreferenceGraphicsFontList.length - 1) % PreferenceGraphicsFontList.length]),
			() => TextGet(PreferenceGraphicsFontList[(PreferenceGraphicsFontIndex + 1) % PreferenceGraphicsFontList.length]));

		DrawBackNextButton(500, 680, 200, 64, TextGet("GeneralAnimationQuality" + Player.GraphicsSettings.AnimationQuality), "White", "",
			() => PreferenceGraphicsAnimationQualityIndex == 0 ? "" : TextGet("GeneralAnimationQuality" + PreferenceGraphicsAnimationQualityList[PreferenceGraphicsAnimationQualityIndex - 1].toString()),
			() => PreferenceGraphicsAnimationQualityIndex == PreferenceGraphicsAnimationQualityList.length - 1 ? "" : TextGet("GeneralAnimationQuality" + PreferenceGraphicsAnimationQualityList[PreferenceGraphicsAnimationQualityIndex + 1].toString()));
		if (GLVersion !== "No WebGL") {
			DrawBackNextButton(500, 850, 360, 64, TextGet("PowerMode" + PreferenceGraphicsPowerModes[PreferenceGraphicsPowerModeIndex]), "White", "",
				() => PreferenceGraphicsPowerModeIndex == 0 ? "" : TextGet("PowerMode" + PreferenceGraphicsPowerModes[PreferenceGraphicsPowerModeIndex - 1].toString()),
				() => PreferenceGraphicsPowerModeIndex == PreferenceGraphicsPowerModes.length - 1 ? "" : TextGet("PowerMode" + PreferenceGraphicsPowerModes[PreferenceGraphicsPowerModeIndex + 1].toString()));
		}
	} else if (PreferencePageCurrent === 2) {
		DrawText(TextGet("VFXFilter"), 1000, 216, "Black", "Gray");
		DrawText(TextGet("VFXVibrator"), 1000, 456, "Black", "Gray");
		DrawCheckbox(500, 270, 64, 64, TextGet("SmoothZoom"), Player.GraphicsSettings.SmoothZoom);
		DrawCheckbox(500, 350, 64, 64, TextGet("CenterChatrooms"), Player.GraphicsSettings.CenterChatrooms);
		DrawCheckbox(500, 510, 64, 64, TextGet("AllowBlur"), Player.GraphicsSettings.AllowBlur);

		MainCanvas.textAlign = "center";
		DrawBackNextButton(500, 190, 450, 64, TextGet(Player.ArousalSettings.VFXFilter || PreferenceSettingsVFXFilterList[PreferenceSettingsVFXFilterIndex]), "White", "",
			() => TextGet(PreferenceSettingsVFXFilterList[(PreferenceSettingsVFXFilterIndex + PreferenceSettingsVFXFilterList.length - 1) % PreferenceSettingsVFXFilterList.length]),
			() => TextGet(PreferenceSettingsVFXFilterList[(PreferenceSettingsVFXFilterIndex + 1) % PreferenceSettingsVFXFilterList.length]));

		DrawBackNextButton(500, 430, 450, 64, TextGet(Player.ArousalSettings.VFXVibrator), "White", "",
			() => TextGet(PreferenceSettingsVFXVibratorList[(PreferenceSettingsVFXVibratorIndex + PreferenceSettingsVFXVibratorList.length - 1) % PreferenceSettingsVFXVibratorList.length]),
			() => TextGet(PreferenceSettingsVFXVibratorList[(PreferenceSettingsVFXVibratorIndex + 1) % PreferenceSettingsVFXVibratorList.length]));

	}
}

/**
 * Sets the gender preferences for a player. Redirected to from the main Run function if the player is in the
 * gender settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGenderRun() {
	// Character and exit buttons
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");

	MainCanvas.textAlign = "left";

	DrawText(TextGet("GenderPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("GenderFemales"), 1410, 160, "Black", "Gray");
	DrawText(TextGet("GenderMales"), 1590, 160, "Black", "Gray");

	PreferenceGenderDrawSetting(500, 225, TextGet("GenderAutoJoinSearch"), Player.GenderSettings.AutoJoinSearch);
	PreferenceGenderDrawSetting(500, 305, TextGet("GenderHideShopItems"), Player.GenderSettings.HideShopItems);
	PreferenceGenderDrawSetting(500, 385, TextGet("GenderHideTitles"), Player.GenderSettings.HideTitles);

	MainCanvas.textAlign = "center";
}

/**
 * Draws the two checkbox row for a gender setting
 * @param {number} Left - The X co-ordinate the row starts on
 * @param {number} Top - The Y co-ordinate the row starts on
 * @param {string} Text - The text for the setting's description
 * @param {GenderSetting} Setting - The player setting the row corresponds to
 * @returns {void} - Nothing
 */
function PreferenceGenderDrawSetting(Left, Top, Text, Setting) {
	DrawText(Text, Left, Top, "Black", "Gray");
	DrawCheckbox(Left + 950, Top - 32, 64, 64, "", Setting.Female);
	DrawCheckbox(Left + 950 + 155, Top - 32, 64, 64, "", Setting.Male);
}

function PreferenceSubscreenScriptsRun() {
	const helpColour = "#ff8";

	// Character, exit & help buttons
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");

	MainCanvas.textAlign = "left";

	DrawText(TextGet("ScriptsPreferences"), 500, 125, "Black", "Gray");

	if (!PreferenceScriptWarningAccepted) {
		PreferenceScriptsDrawWarningScreen();
		return;
	}

	// Slightly wacky x-coordinate because DrawTextWrap assumes text is centered (500 - 1300/2 = -150)
	DrawTextWrap(TextGet("ScriptsExplanation"), -150, 150, 1300, 120, "Black");
	DrawButton(1815, 190, 90, 90, "", PreferenceScriptHelp === "global" ? helpColour : "White", "Icons/Question.png");

	/** @type {ScriptPermissionLevel[]} */
	const permissions = Object.values(ScriptPermissionLevel);

	// Can be used to page properties in the future
	/** @type {ScriptPermissionProperty[]} */
	const propertiesPage = PreferenceScriptPermissionProperties;

	MainCanvas.textAlign = "center";
	for (const [i, property] of propertiesPage.entries()) {
		DrawTextFit(TextGet(`ScriptsPermissionProperty${property}`), 850 + 300 * i, 320, 124, "Black", "Gray");
		const helpHover = MouseIn(720 + 300 * i, 296, 48, 48);
		const iconColour = PreferenceScriptHelp === property ? "_Yellow" : helpHover ? "_Cyan" : "";
		DrawImageResize(`Icons/Question${iconColour}.png`, 720 + 300 * i, 296, 48, 48);
		MainCanvas.moveTo(700 + 300 * i, 270);
		MainCanvas.strokeStyle = "rgba(0, 0, 0, 0.5)";
		MainCanvas.lineTo(700 + 300 * i, 270 + (permissions.length + 1) * 90);
		MainCanvas.stroke();
		for (const [j, permissionLevel] of permissions.entries()) {
			const disabled = permissionLevel !== ScriptPermissionLevel.PUBLIC
				&& permissionLevel !== ScriptPermissionLevel.SELF
				&& (
					ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.PUBLIC)
					|| !ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.SELF)
				);
			DrawCheckbox(816 + 300 * i, 386 + 90 * j, 64, 64, "", ValidationHasScriptPermission(Player, property, permissionLevel), disabled);
		}
	}
	MainCanvas.textAlign = "left";

	MainCanvas.moveTo(500, 370);
	MainCanvas.strokeStyle = "rgba(0, 0, 0, 0.5)";
	MainCanvas.lineTo(700 + propertiesPage.length * 300, 370);
	MainCanvas.stroke();

	for (const [i, permissionName] of permissions.entries()) {
		DrawText(TextGet(`ScriptsPermissionLevel${permissionName}`), 500, 410 + 90 * i, "Black", "Gray");
	}

	if (PreferenceScriptHelp === "global") {
		const helpHeight = 90 + 90 * permissions.length;
		DrawRect(500, 270, 1300, helpHeight, helpColour);
		MainCanvas.strokeStyle = "Black";
		MainCanvas.strokeRect(500, 270, 1300, helpHeight);
		DrawTextWrap(TextGet("ScriptsHelpGlobal"), -110, 270, 1260, helpHeight, "Black");
		MainCanvas.textAlign = "center";
		return;
	} else if (PreferenceScriptHelp) {
		const helpHeight = 90 * permissions.length;
		DrawRect(500, 370, 1300, helpHeight, helpColour);
		MainCanvas.strokeStyle = "Black";
		MainCanvas.strokeRect(500, 370, 1300, helpHeight);
		DrawTextWrap(TextGet(`ScriptsHelp${PreferenceScriptHelp}`), -110, 370, 1260, helpHeight, "Black");
	}

	MainCanvas.textAlign = "center";
}

function PreferenceScriptsDrawWarningScreen() {
	DrawText(TextGet("ScriptsWarningTitle"), 500, 220, "#c80800", "Gray");
	DrawTextWrap(TextGet("ScriptsWarning"), -140, 250, 1280, 240, "Black");

	MainCanvas.textAlign = "center";
	const disabled = PreferenceScriptTimer != null;
	const seconds = PreferenceScriptTimer ? Math.ceil((PreferenceScriptTimer - Date.now()) / 1000) : null;
	DrawButton(500, 500, 400, 64, `${TextGet("ScriptsWarningAccept")}${seconds ? ` (${seconds})` : ""}`, disabled ? "rgba(0, 0, 0, 0.12)" : "White", null, null, disabled);
	MainCanvas.textAlign = "left";
}

/**
 * Handles click events for the audio preference settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGraphicsClick() {
	// If the user clicked the exit icon to return to the main screen
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenGraphicsExit();

	// Change page
	PreferencePageChangeClick(1595, 75, 2); // Uncomment when adding a 2nd page

	if (PreferencePageCurrent === 1) {
		if (MouseIn(500, 182, 250, 64)) {
			if (MouseX <= 625) PreferenceSettingsVFXIndex = (PreferenceSettingsVFXList.length + PreferenceSettingsVFXIndex - 1) % PreferenceSettingsVFXList.length;
			else PreferenceSettingsVFXIndex = (PreferenceSettingsVFXIndex + 1) % PreferenceSettingsVFXList.length;
			Player.ArousalSettings.VFX = PreferenceSettingsVFXList[PreferenceSettingsVFXIndex];
		}
		if (MouseIn(500, 270, 250, 64)) {
			if (MouseX <= 625) PreferenceGraphicsFontIndex = (PreferenceGraphicsFontList.length + PreferenceGraphicsFontIndex - 1) % PreferenceGraphicsFontList.length;
			else PreferenceGraphicsFontIndex = (PreferenceGraphicsFontIndex + 1) % PreferenceGraphicsFontList.length;
			Player.GraphicsSettings.Font = PreferenceGraphicsFontList[PreferenceGraphicsFontIndex];
			CommonGetFont.clearCache();
			CommonGetFontName.clearCache();
			DrawingGetTextSize.clearCache();
		}
		if (MouseIn(500, 430, 64, 64)) Player.GraphicsSettings.InvertRoom = !Player.GraphicsSettings.InvertRoom;
		if (MouseIn(500, 510, 64, 64)) Player.GraphicsSettings.StimulationFlash = !Player.GraphicsSettings.StimulationFlash;
		if (MouseIn(500, 590, 64, 64)) Player.GraphicsSettings.DoBlindFlash = !Player.GraphicsSettings.DoBlindFlash;
		if (MouseIn(500, 680, 200, 64)) {
			if (MouseX <= 600) {
				if (PreferenceGraphicsAnimationQualityIndex > 0) PreferenceGraphicsAnimationQualityIndex--;
			} else {
				if (PreferenceGraphicsAnimationQualityIndex < PreferenceGraphicsAnimationQualityList.length - 1) PreferenceGraphicsAnimationQualityIndex++;
			}
			Player.GraphicsSettings.AnimationQuality = PreferenceGraphicsAnimationQualityList[PreferenceGraphicsAnimationQualityIndex];
		}
		if (GLVersion !== "No WebGL" && MouseIn(500, 850, 360, 64)) {
			if (MouseX <= 678) {
				PreferenceGraphicsPowerModeIndex = Math.max(0, PreferenceGraphicsPowerModeIndex - 1);
			} else {
				PreferenceGraphicsPowerModeIndex = Math.min(PreferenceGraphicsPowerModeIndex + 1, PreferenceGraphicsPowerModes.length - 1);
			}
			PreferenceGraphicsWebGLOptions.powerPreference = PreferenceGraphicsPowerModes[PreferenceGraphicsPowerModeIndex];
		}
		if (GLVersion !== "No WebGL" && MouseIn(500, 765, 64, 64)) {
			PreferenceGraphicsWebGLOptions.antialias = !PreferenceGraphicsWebGLOptions.antialias;
		}
	} if (PreferencePageCurrent === 2) {
		if (MouseIn(500, 190, 450, 64)) {
			if (MouseX <= 825) PreferenceSettingsVFXFilterIndex = (PreferenceSettingsVFXFilterList.length + PreferenceSettingsVFXFilterIndex - 1) % PreferenceSettingsVFXFilterList.length;
			else PreferenceSettingsVFXFilterIndex = (PreferenceSettingsVFXFilterIndex + 1) % PreferenceSettingsVFXFilterList.length;
			Player.ArousalSettings.VFXFilter = PreferenceSettingsVFXFilterList[PreferenceSettingsVFXFilterIndex];
		}
		if (MouseIn(500, 430, 450, 64)) {
			if (MouseX <= 825) PreferenceSettingsVFXVibratorIndex = (PreferenceSettingsVFXVibratorList.length + PreferenceSettingsVFXVibratorIndex - 1) % PreferenceSettingsVFXVibratorList.length;
			else PreferenceSettingsVFXVibratorIndex = (PreferenceSettingsVFXVibratorIndex + 1) % PreferenceSettingsVFXVibratorList.length;
			Player.ArousalSettings.VFXVibrator = PreferenceSettingsVFXVibratorList[PreferenceSettingsVFXVibratorIndex];
		}
		if (MouseIn(500, 270, 64, 64)) Player.GraphicsSettings.SmoothZoom = !Player.GraphicsSettings.SmoothZoom;
		if (MouseIn(500, 350, 64, 64)) Player.GraphicsSettings.CenterChatrooms = !Player.GraphicsSettings.CenterChatrooms;
		if (MouseIn(500, 510, 64, 64)) Player.GraphicsSettings.AllowBlur = !Player.GraphicsSettings.AllowBlur;
	}
}

function PreferenceSubscreenGraphicsExit() {
	// Reload WebGL if graphic settings have changed.
	const currentOptions = GLDrawGetOptions();
	if (
		GLVersion !== "No WebGL" &&
		(currentOptions.powerPreference != PreferenceGraphicsWebGLOptions.powerPreference ||
			currentOptions.antialias != PreferenceGraphicsWebGLOptions.antialias)
	) {
		// This uses localStorage so the option is taken into account even at the login screen,
		// since we don't have any idea about the user's GL configuration at that point.
		GLDrawSetOptions(PreferenceGraphicsWebGLOptions);
		GLDrawResetCanvas();
	}
	PreferenceSubscreen = "";
}

/**
 * Handles click events for the audio preference settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenAudioClick() {

	// If the user clicked the exit icon to return to the main screen
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenAudioExit();

	// Volume increase/decrease control
	if (MouseIn(500, 193, 250, 64)) {
		if (MouseX <= 625) PreferenceSettingsVolumeIndex = (PreferenceSettingsVolumeList.length + PreferenceSettingsVolumeIndex - 1) % PreferenceSettingsVolumeList.length;
		else PreferenceSettingsVolumeIndex = (PreferenceSettingsVolumeIndex + 1) % PreferenceSettingsVolumeList.length;
		Player.AudioSettings.Volume = PreferenceSettingsVolumeList[PreferenceSettingsVolumeIndex];
	}

	// Music volume increase/decrease control
	if (MouseIn(500, 272, 250, 64)) {
		if (MouseX <= 625) {
			PreferenceSettingsMusicVolumeIndex = (PreferenceSettingsVolumeList.length + PreferenceSettingsMusicVolumeIndex - 1) % PreferenceSettingsVolumeList.length;
		} else {
			PreferenceSettingsMusicVolumeIndex = (PreferenceSettingsMusicVolumeIndex + 1) % PreferenceSettingsVolumeList.length;
		}
		Player.AudioSettings.MusicVolume = PreferenceSettingsVolumeList[PreferenceSettingsMusicVolumeIndex];
		if ((ChatAdminRoomCustomizationMusic != null) && (ChatAdminRoomCustomizationMusic.src != null)) {
			ChatAdminRoomCustomizationPlayMusic(ChatAdminRoomCustomizationMusic.src);
			if (Player.AudioSettings.MusicVolume > 0)
				ChatAdminRoomCustomizationMusic.volume = Math.min(Player.AudioSettings.MusicVolume, 1) * 0.25;
		}
	}

	// Individual audio check-boxes
	if (MouseXIn(500, 64)) {
		if (MouseYIn(352, 64)) Player.AudioSettings.PlayBeeps = !Player.AudioSettings.PlayBeeps;
		if (MouseYIn(432, 64)) Player.AudioSettings.PlayItem = !Player.AudioSettings.PlayItem;
		if (MouseYIn(512, 64)) Player.AudioSettings.PlayItemPlayerOnly = !Player.AudioSettings.PlayItemPlayerOnly;
		if (MouseYIn(592, 64)) Player.AudioSettings.Notifications = !Player.AudioSettings.Notifications;
	}
}

/**
 * Exists the preference screen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenAudioExit() {
	// If audio has been disabled for notifications, disable each individual notification audio setting
	if (!Player.AudioSettings.Notifications) {
		for (const setting in Player.NotificationSettings) {
			let audio = Player.NotificationSettings[setting].Audio;
			if (typeof audio === 'number' && audio > 0) Player.NotificationSettings[setting].Audio = NotificationAudioType.NONE;
		}
	}

	PreferenceSubscreen = "";
}

/**
 * Handles click events for the controller preference settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenControllerClick() {
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenControllerExit();
	if (MouseIn(1815, 178, 90, 90)) ControllerCalibrationNextStage(true);

	if (!ControllerIsCalibrating()) {

		if (MouseIn(500, 193, 250, 64)) {
			if (MouseX <= 625) PreferenceSettingsSensitivityIndex = (PreferenceSettingsSensitivityList.length + PreferenceSettingsSensitivityIndex - 1) % PreferenceSettingsSensitivityList.length;
			else PreferenceSettingsSensitivityIndex = (PreferenceSettingsSensitivityIndex + 1) % PreferenceSettingsSensitivityList.length;
			Player.ControllerSettings.ControllerSensitivity = PreferenceSettingsSensitivityList[PreferenceSettingsSensitivityIndex];
			ControllerSensitivity = Player.ControllerSettings.ControllerSensitivity;
		}
		if (MouseIn(500, 593, 250, 64)) {
			if (MouseX <= 625) PreferenceSettingsDeadZoneIndex = (PreferenceSettingsDeadZoneList.length + PreferenceSettingsDeadZoneIndex - 1) % PreferenceSettingsDeadZoneList.length;
			else PreferenceSettingsDeadZoneIndex = (PreferenceSettingsDeadZoneIndex + 1) % PreferenceSettingsDeadZoneList.length;
			Player.ControllerSettings.ControllerDeadZone = PreferenceSettingsDeadZoneList[PreferenceSettingsDeadZoneIndex];
			ControllerDeadZone = Player.ControllerSettings.ControllerDeadZone;
		}

		if (MouseIn(590, 400, 310, 90)) {
			ControllerStartCalibration("buttons");
		}

		if (MouseIn(590, 500, 310, 90)) {
			ControllerStartCalibration("axis");
		}

		if (MouseIn(500, 272, 64, 64)) {
			Player.ControllerSettings.ControllerActive = !Player.ControllerSettings.ControllerActive;
			ControllerClearAreas();
			ControllerStart();
		}
	}
}

/**
 * Handles click events for the censored words preference settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenCensoredWordsClick() {

	// When the user clicks on the header buttons
	if (MouseIn(1830, 60, 250, 65)) PreferenceSubscreenCensoredWordsExit();
	if (MouseIn(1550, 175, 180, 60)) {
		let Word = ElementValue("InputWord").trim().toUpperCase().replace("|", "");
		if ((Word != "") && (PreferenceCensoredWordsList.indexOf(Word) < 0)) {
			PreferenceCensoredWordsList.push(Word);
			PreferenceCensoredWordsList.sort();
			ElementValue("InputWord", "");
		}
		return;
	}
	if (MouseIn(350, 175, 550, 60)) {
		Player.ChatSettings.CensoredWordsLevel++;
		if (Player.ChatSettings.CensoredWordsLevel > 2) Player.ChatSettings.CensoredWordsLevel = 0;
		return;
	}
	if (MouseIn(1830, 175, 250, 65)) {
		PreferenceCensoredWordsOffset = PreferenceCensoredWordsOffset + 32;
		if (PreferenceCensoredWordsOffset >= PreferenceCensoredWordsList.length) PreferenceCensoredWordsOffset = 0;
		return;
	}

	// When the user clicks to delete one of the words
	for (let O = PreferenceCensoredWordsOffset; O < PreferenceCensoredWordsList.length && O < PreferenceCensoredWordsOffset + 32; O++) {
		let X = 100 + Math.floor((O - PreferenceCensoredWordsOffset)/ 8) * 450;
		let Y = 270 + ((O % 8) * 84);
		if (MouseIn(X, Y, 60, 60)) {
			PreferenceCensoredWordsList.splice(O, 1);
			if (PreferenceCensoredWordsOffset >= PreferenceCensoredWordsList.length) PreferenceCensoredWordsOffset = 0;
			return;
		}
	}

}

/**
 * Handles the click events for the chat settings of a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenChatClick() {
	// If the user clicked one of the check-boxes
	switch (PreferenceChatPageIndex) {
		case 0:
			if (MouseXIn(500, 64)) {
				if (MouseYIn(572, 64)) Player.ChatSettings.ColorNames = !Player.ChatSettings.ColorNames;
				if (MouseYIn(652, 64)) Player.ChatSettings.ColorActions = !Player.ChatSettings.ColorActions;
				if (MouseYIn(732, 64)) Player.ChatSettings.ColorEmotes = !Player.ChatSettings.ColorEmotes;
				if (MouseYIn(812, 64)) Player.ChatSettings.ShowActivities = !Player.ChatSettings.ShowActivities;
			} else if (MouseXIn(1200, 64)) {
				if (MouseYIn(572, 64)) Player.ChatSettings.WhiteSpace = Player.ChatSettings.WhiteSpace == "Preserve" ? "" : "Preserve";
				if (MouseYIn(652, 64)) Player.ChatSettings.ColorActivities = !Player.ChatSettings.ColorActivities;
				if (MouseYIn(732, 64)) Player.ChatSettings.ShrinkNonDialogue = !Player.ChatSettings.ShrinkNonDialogue;
				if (MouseYIn(812, 64)) Player.ChatSettings.MuStylePoses = !Player.ChatSettings.MuStylePoses;
			}
			break;
		case 1:
			if (MouseXIn(500, 64)) {
				if (MouseYIn(572, 64)) Player.ChatSettings.DisplayTimestamps = !Player.ChatSettings.DisplayTimestamps;
				if (MouseYIn(652, 64)) Player.ChatSettings.ShowChatHelp = !Player.ChatSettings.ShowChatHelp;
				if (MouseYIn(732, 64)) Player.ChatSettings.PreserveChat = !Player.ChatSettings.PreserveChat;
			} else if (MouseXIn(1200, 64)) {
				if (MouseYIn(572, 64)) Player.ChatSettings.ShowAutomaticMessages = !Player.ChatSettings.ShowAutomaticMessages;
				if (MouseYIn(652, 64)) Player.ChatSettings.ShowBeepChat = !Player.ChatSettings.ShowBeepChat;
			}
			break;
	}

	// If the user used one of the BackNextButtons
	if (MouseIn(1000, 170, 350, 60)) {
		if (MouseX <= 1175) PreferenceChatColorThemeIndex = PreferenceGetPreviousIndex(PreferenceChatColorThemeList, PreferenceChatColorThemeIndex);
		else PreferenceChatColorThemeIndex = PreferenceGetNextIndex(PreferenceChatColorThemeList, PreferenceChatColorThemeIndex);
		Player.ChatSettings.ColorTheme = PreferenceChatColorThemeList[PreferenceChatColorThemeIndex];
	}
	if (MouseIn(1000, 250, 350, 60)) {
		if (MouseX <= 1175) PreferenceChatEnterLeaveIndex = PreferenceGetPreviousIndex(PreferenceChatEnterLeaveList, PreferenceChatEnterLeaveIndex);
		else PreferenceChatEnterLeaveIndex = PreferenceGetNextIndex(PreferenceChatEnterLeaveList, PreferenceChatEnterLeaveIndex);
		Player.ChatSettings.EnterLeave = PreferenceChatEnterLeaveList[PreferenceChatEnterLeaveIndex];
	}
	if (MouseIn(1000, 330, 350, 60)) {
		if (MouseX <= 1175) PreferenceChatMemberNumbersIndex = PreferenceGetPreviousIndex(PreferenceChatMemberNumbersList, PreferenceChatMemberNumbersIndex);
		else PreferenceChatMemberNumbersIndex = PreferenceGetNextIndex(PreferenceChatMemberNumbersList, PreferenceChatMemberNumbersIndex);
		Player.ChatSettings.MemberNumbers = PreferenceChatMemberNumbersList[PreferenceChatMemberNumbersIndex];
	}

	if (MouseIn(1000, 410, 350, 60)) {
		if (MouseX <= 1175) PreferenceChatFontSizeIndex = PreferenceGetPreviousIndex(PreferenceChatFontSizeList, PreferenceChatFontSizeIndex);
		else PreferenceChatFontSizeIndex = PreferenceGetNextIndex(PreferenceChatFontSizeList, PreferenceChatFontSizeIndex);
		Player.ChatSettings.FontSize = PreferenceChatFontSizeList[PreferenceChatFontSizeIndex];
		ChatRoomRefreshFontSize();
	}

	if (MouseIn(1000, 490, 350, 60)) {
		if (MouseX <= 1175) PreferenceChatPageIndex = PreferenceGetPreviousIndex(PreferenceChatPageList, PreferenceChatPageIndex);
		else PreferenceChatPageIndex = PreferenceGetNextIndex(PreferenceChatPageList, PreferenceChatPageIndex);
	}

	// If the user clicked the exit icon to return to the main screen
	if (MouseIn(1815, 75,90,90)) PreferenceSubscreenChatExit();

}

/**
 * Handles the click events for the online settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenOnlineClick() {
	const OnlineSettings = Player.OnlineSettings;
	const OnlineSharedSettings = Player.OnlineSharedSettings;
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreen = "";
	else if (MouseIn(500, 175, 64, 64)) OnlineSettings.AutoBanBlackList = !OnlineSettings.AutoBanBlackList;
	else if (MouseIn(500, 255, 64, 64)) OnlineSettings.AutoBanGhostList = !OnlineSettings.AutoBanGhostList;
	else if (MouseIn(500, 335, 64, 64)) OnlineSettings.SearchShowsFullRooms = !OnlineSettings.SearchShowsFullRooms;
	else if (MouseIn(500, 415, 64, 64)) OnlineSettings.SearchFriendsFirst = !OnlineSettings.SearchFriendsFirst;
	else if (MouseIn(500, 495, 64, 64)) OnlineSettings.DisableAnimations = !OnlineSettings.DisableAnimations;
	else if (MouseIn(500, 575, 64, 64)) {
		OnlineSettings.EnableAfkTimer = !OnlineSettings.EnableAfkTimer;
		AfkTimerSetEnabled(OnlineSettings.EnableAfkTimer);
	}
	else if (MouseIn(500, 655, 64, 64)) OnlineSharedSettings.AllowFullWardrobeAccess = !OnlineSharedSettings.AllowFullWardrobeAccess;
	else if (MouseIn(500, 735, 64, 64)) OnlineSharedSettings.BlockBodyCosplay = !OnlineSharedSettings.BlockBodyCosplay;
	else if (MouseIn(850, 808, 350, 64)) {
		Player.OnlineSettings.ShowRoomCustomization++;
		if (Player.OnlineSettings.ShowRoomCustomization > 3) Player.OnlineSettings.ShowRoomCustomization = 0;
	}
	else if (MouseIn(1300, 175, 64, 64)) OnlineSettings.ShowStatus = !OnlineSettings.ShowStatus;
	else if (MouseIn(1300, 255, 64, 64)) OnlineSettings.SendStatus = !OnlineSettings.SendStatus;
}

/**
 * Handles the click events for the arousal settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenArousalClick() {

	// If the user clicked the exit icon to return to the main screen
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenArousalExit();

	// Arousal active control
	if (MouseIn(750, 193, 450, 64)) {
		if (MouseX <= 975) PreferenceArousalActiveIndex = (PreferenceArousalActiveList.length + PreferenceArousalActiveIndex - 1) % PreferenceArousalActiveList.length;
		else PreferenceArousalActiveIndex = (PreferenceArousalActiveIndex + 1) % PreferenceArousalActiveList.length;
		Player.ArousalSettings.Active = PreferenceArousalActiveList[PreferenceArousalActiveIndex];
	}

	// Speech stuttering control
	if (MouseIn(900, 428, 500, 64)) {
		if (MouseX <= 1150) PreferenceArousalAffectStutterIndex = (PreferenceArousalAffectStutterList.length + PreferenceArousalAffectStutterIndex - 1) % PreferenceArousalAffectStutterList.length;
		else PreferenceArousalAffectStutterIndex = (PreferenceArousalAffectStutterIndex + 1) % PreferenceArousalAffectStutterList.length;
		Player.ArousalSettings.AffectStutter = PreferenceArousalAffectStutterList[PreferenceArousalAffectStutterIndex];
	}

	// Show other player meter check box
	if (MouseIn(550, 276, 64, 64))
		Player.ArousalSettings.ShowOtherMeter = !Player.ArousalSettings.ShowOtherMeter;

	// Block advanced modes check box
	if (MouseIn(550, 356, 64, 64) && Player.GetDifficulty() < 3)
		Player.ArousalSettings.DisableAdvancedVibes = !Player.ArousalSettings.DisableAdvancedVibes;

	// If the arousal is active, we allow more controls
	if (PreferenceArousalIsActive()) {

		// Meter affect your facial expressions check box
		if (MouseIn(1250, 276, 64, 64))
			Player.ArousalSettings.AffectExpression = !Player.ArousalSettings.AffectExpression;

		// Arousal visible control
		if (MouseIn(1505, 193, 400, 64)) {
			if (MouseX <= 1705) PreferenceArousalVisibleIndex = (PreferenceArousalVisibleList.length + PreferenceArousalVisibleIndex - 1) % PreferenceArousalVisibleList.length;
			else PreferenceArousalVisibleIndex = (PreferenceArousalVisibleIndex + 1) % PreferenceArousalVisibleList.length;
			Player.ArousalSettings.Visible = PreferenceArousalVisibleList[PreferenceArousalVisibleIndex];
		}

		// Fetish master control
		if (MouseIn(900, 513, 500, 64)) {
			if (MouseX <= 1150) PreferenceArousalFetishIndex = (PreferenceArousalFetishList.length + PreferenceArousalFetishIndex - 1) % PreferenceArousalFetishList.length;
			else PreferenceArousalFetishIndex = (PreferenceArousalFetishIndex + 1) % PreferenceArousalFetishList.length;
			PreferenceLoadFetishFactor();
		}

		// Fetish love control
		if (MouseIn(1455, 513, 450, 64)) {
			if (MouseX <= 1680) PreferenceArousalFetishFactor = PreferenceDecrementArousalFactor(PreferenceArousalFetishFactor);
			else PreferenceArousalFetishFactor = PreferenceIncrementArousalFactor(PreferenceArousalFetishFactor);
			for (let F = 0; F < Player.ArousalSettings.Fetish.length; F++)
				if (Player.ArousalSettings.Fetish[F].Name == PreferenceArousalFetishList[PreferenceArousalFetishIndex])
					Player.ArousalSettings.Fetish[F].Factor = PreferenceArousalFetishFactor;
		}

		// Arousal activity control
		if (MouseIn(900, 598, 500, 64)) {
			if (MouseX <= 1150) PreferenceArousalActivityIndex = (PreferenceArousalActivityList.length + PreferenceArousalActivityIndex - 1) % PreferenceArousalActivityList.length;
			else PreferenceArousalActivityIndex = (PreferenceArousalActivityIndex + 1) % PreferenceArousalActivityList.length;
			PreferenceLoadActivityFactor();
		}

		// Arousal activity love on self control
		if (MouseIn(900, 683, 300, 64)) {
			if (MouseX <= 1050) PreferenceArousalActivityFactorSelf = PreferenceDecrementArousalFactor(PreferenceArousalActivityFactorSelf);
			else PreferenceArousalActivityFactorSelf = PreferenceIncrementArousalFactor(PreferenceArousalActivityFactorSelf);
			PreferenceSetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], true, PreferenceArousalActivityFactorSelf);
		}

		// Arousal activity love on other control
		if (MouseIn(1605, 683, 300, 64)) {
			if (MouseX <= 1755) PreferenceArousalActivityFactorOther = PreferenceDecrementArousalFactor(PreferenceArousalActivityFactorOther);
			else PreferenceArousalActivityFactorOther = PreferenceIncrementArousalFactor(PreferenceArousalActivityFactorOther);
			PreferenceSetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], false, PreferenceArousalActivityFactorOther);
		}

		// Arousal zone love control
		if ((Player.FocusGroup != null) && MouseIn(550, 853, 600, 64)) {
			if (MouseX <= 850) PreferenceArousalZoneFactor = PreferenceDecrementArousalFactor(PreferenceArousalZoneFactor);
			else PreferenceArousalZoneFactor = PreferenceIncrementArousalFactor(PreferenceArousalZoneFactor);
			PreferenceSetZoneFactor(Player, Player.FocusGroup.Name, PreferenceArousalZoneFactor);
		}

		// Arousal zone orgasm check box
		if ((Player.FocusGroup != null) && MouseIn(1230, 853, 64, 64))
			PreferenceSetZoneOrgasm(Player, Player.FocusGroup.Name, !PreferenceGetZoneOrgasm(Player, Player.FocusGroup.Name));

		// In arousal mode, the player can click on her zones
		for (const Group of AssetGroup) {
			if (Group.IsItem() && !Group.MirrorActivitiesFrom && AssetActivitiesForGroup("Female3DCG", Group.Name).length) {
				const Zone = Group.Zone.find(z => DialogClickedInZone(Player, z, 0.9, 50, 50, 1));
				if (Zone) {
					Player.FocusGroup = Group;
					PreferenceArousalZoneFactor = PreferenceGetZoneFactor(Player, Group.Name);
				}
			}
		}

	}

}

/**
 * Increment the passed arousal factor.
 * @param {ArousalFactor} factor
 * @returns {ArousalFactor}
 */
function PreferenceIncrementArousalFactor(factor) {
	return /** @type {ArousalFactor} */((factor + 1) % 5);
}

/**
 * Decrement the passed arousal factor.
 * @param {ArousalFactor} factor
 * @returns {ArousalFactor}
 */
function PreferenceDecrementArousalFactor(factor) {
	return /** @type {ArousalFactor} */((5 + factor - 1) % 5);
}

/**
 * Handles the click events in the security settings dialog for a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenSecurityClick() {

	// If the user clicked the exit icon to return to the main screen
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenSecurityExit();

	// If we must update the email
	if (MouseIn(500, 365, 250, 50)) {
		var EmailOld = ElementValue("InputEmailOld");
		var EmailNew = ElementValue("InputEmailNew");

		if ((EmailOld == "" || CommonEmailIsValid(EmailOld)) && (EmailNew == "" || CommonEmailIsValid(EmailNew)))
			ServerSend("AccountUpdateEmail", { EmailOld: EmailOld, EmailNew: EmailNew });
		else
			ElementValue("InputEmailNew", TextGet("UpdateEmailInvalid"));
	}

}

/**
 * Handles the click events for the notifications settings of a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGenderClick() {
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreen = "";

	PreferenceGenderClickSetting(1450, 225, Player.GenderSettings.AutoJoinSearch, false);
	PreferenceGenderClickSetting(1450, 305, Player.GenderSettings.HideShopItems, false);
	PreferenceGenderClickSetting(1450, 385, Player.GenderSettings.HideTitles, false);
}

/**
 * Handles the click for a gender setting row
 * @param {number} Left - The X co-ordinate the row starts on
 * @param {number} Top - The Y co-ordinate the row starts on
 * @param {GenderSetting} Setting - The player setting the row corresponds to
 * @param {boolean} MutuallyExclusive - Whether only one option can be enabled at a time
 * @returns {void} - Nothing
 */
function PreferenceGenderClickSetting(Left, Top, Setting, MutuallyExclusive) {
	if (MouseIn(Left, Top - 32, 64, 64)) {
		Setting.Female = !Setting.Female;
		if (MutuallyExclusive && Setting.Female) {
			Setting.Male = false;
		}
	}

	if (MouseIn(Left + 155, Top - 32, 64, 64)) {
		Setting.Male = !Setting.Male;
		if (MutuallyExclusive && Setting.Male) {
			Setting.Female = false;
		}
	}
}

function PreferenceSubscreenScriptsClick() {
	if (MouseIn(1815, 75, 90, 90)) {
		PreferenceSubscreenScriptsExitClick();
		return;
	}

	if (!PreferenceScriptWarningAccepted) {
		PreferenceSubscreenScriptsWarningClick();
		return;
	}

	if (PreferenceScriptHelp === "global") {
		PreferenceScriptHelp = null;
		return;
	} else if (MouseIn(1815, 190, 90, 90)) {
		PreferenceScriptHelp = "global";
		return;
	}

	const ScriptPermissions = Player.OnlineSharedSettings.ScriptPermissions;

	/** @type {ScriptPermissionLevel[]} */
	const permissions = Object.values(ScriptPermissionLevel);

	// Can be used to page properties in the future
	/** @type {ScriptPermissionProperty[]} */
	const propertiesPage = PreferenceScriptPermissionProperties;

	for (const [i, property] of propertiesPage.entries()) {
		if (MouseIn(720 + 300 * i, 296, 48, 48)) {
			if (PreferenceScriptHelp === property) {
				PreferenceScriptHelp = null;
				return;
			} else {
				PreferenceScriptHelp = property;
				return;
			}
		}

		for (const [j, permissionLevel] of permissions.entries()) {
			if (MouseIn(816 + 300 * i, 386 + 90 * j, 64, 64)) {
				const levelSelf = permissionLevel === ScriptPermissionLevel.SELF;
				const levelPublic = permissionLevel === ScriptPermissionLevel.PUBLIC;
				const selfAllowed = ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.SELF);
				const publicAllowed = ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.PUBLIC);
				if (levelSelf) {
					ScriptPermissions[property].permission = selfAllowed ? 0 : ScriptPermissionBits[permissionLevel];
				} else if (levelPublic) {
					ScriptPermissions[property].permission = publicAllowed ? 0 : maxScriptPermission;
				} else if (selfAllowed && !publicAllowed) {
					ScriptPermissions[property].permission ^= ScriptPermissionBits[permissionLevel];
				}
				return;
			}
		}
	}

	PreferenceScriptHelp = null;
}

function PreferenceSubscreenScriptsExitClick() {
	PreferenceSubscreen = "";
	if (PreferenceScriptTimeoutHandle != null) {
		clearTimeout(PreferenceScriptTimeoutHandle);
		PreferenceScriptTimeoutHandle = null;
	}
	PreferenceScriptTimer = null;
	const scriptItem = InventoryGet(Player, "ItemScript");
	if (scriptItem) {
		const params = ValidationCreateDiffParams(Player, Player.MemberNumber);
		const { item, valid } = ValidationResolveScriptDiff(null, scriptItem, params);
		if (!valid) {
			console.info("Cleaning script item after permissions modification");
			if (item) {
				Player.Appearance = Player.Appearance.map((playerItem) => {
					return playerItem.Asset.Group.Name === "ItemScript" ? item : playerItem;
				});
			} else {
				InventoryRemove(Player, "ItemScript", false);
			}
			if (ServerPlayerIsInChatRoom()) {
				ChatRoomCharacterUpdate(Player);
			} else {
				CharacterRefresh(Player);
			}
		}
	}
}

function PreferenceSubscreenScriptsWarningClick() {
	if (PreferenceScriptTimer == null && MouseIn(500, 500, 400, 64)) {
		PreferenceScriptWarningAccepted = true;
	}
}

/**
 * Handles the click events for the visibility settings of a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenVisibilityClick() {

	// Most controls are not available in Extreme mode
	if (Player.GetDifficulty() <= 2) {

		// Group button
		if (MouseIn(650, 193, 500, 64)) {
			if (MouseX >= 900) {
				PreferenceVisibilityGroupIndex++;
				if (PreferenceVisibilityGroupIndex >= PreferenceVisibilityGroupList.length) PreferenceVisibilityGroupIndex = 0;
			}
			else {
				PreferenceVisibilityGroupIndex--;
				if (PreferenceVisibilityGroupIndex < 0) PreferenceVisibilityGroupIndex = PreferenceVisibilityGroupList.length - 1;
			}
			PreferenceVisibilityAssetIndex = 0;
			PreferenceVisibilityAssetChanged(true);
		}

		// Asset button
		if (MouseIn(650, 272, 500, 64)) {
			if (MouseX >= 900) {
				PreferenceVisibilityAssetIndex++;
				if (PreferenceVisibilityAssetIndex >= PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets.length) PreferenceVisibilityAssetIndex = 0;
			}
			else {
				PreferenceVisibilityAssetIndex--;
				if (PreferenceVisibilityAssetIndex < 0) PreferenceVisibilityAssetIndex = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets.length - 1;
			}
			PreferenceVisibilityAssetChanged(true);
		}

		// Hide checkbox
		if (MouseIn(500, 352, 64, 64)) {
			PreferenceVisibilityHideChange();
			if (PreferenceVisibilityHideChecked != PreferenceVisibilityBlockChecked && PreferenceVisibilityCanBlock) PreferenceVisibilityBlockChange();
		}

		// Block checkbox
		if (MouseIn(500, 432, 64, 64) && PreferenceVisibilityCanBlock) PreferenceVisibilityBlockChange();

		// Reset button
		if (MouseIn(500, PreferenceVisibilityResetClicked ? 780 : 700, 300, 64)) {
			if (PreferenceVisibilityResetClicked) {
				Player.HiddenItems = [];
				PreferenceVisibilityExit(true);
			}
			else PreferenceVisibilityResetClicked = true;
		}

	}

	// Confirm button
	if (MouseIn(1720, 60, 90, 90)) {
		Player.HiddenItems = PreferenceVisibilityHiddenList;
		Player.BlockItems = PreferenceVisibilityBlockList;
		PreferenceVisibilityExit(true);
	}

	// Cancel button
	if (MouseIn(1820, 60, 90, 90)) PreferenceVisibilityExit(false);

}

/**
 * Handles the loading of the visibility settings of a player
 * @returns {void} - Nothing
 */
function PreferenceSubscreenVisibilityLoad() {
	PreferenceVisibilityHiddenList = Player.HiddenItems.slice();
	PreferenceVisibilityBlockList = Player.BlockItems.slice();
	for (let G = 0; G < AssetGroup.length; G++)
		if (AssetGroup[G].Clothing || AssetGroup[G].Category != "Appearance") {
			const AssetList = AssetGroup[G].Asset
				.filter(A => A.Visible)
				.map(A => ({
					Asset: A,
					Hidden: CharacterAppearanceItemIsHidden(A.Name, AssetGroup[G].Name),
					Blocked: InventoryIsPermissionBlocked(Player, A.Name, AssetGroup[G].Name),
					Limited: InventoryIsPermissionLimited(Player, A.Name, AssetGroup[G].Name),
				}));
			if (AssetList.length > 0) PreferenceVisibilityGroupList.push({ Group: AssetGroup[G], Assets: AssetList });
		}
	PreferenceVisibilityAssetChanged(true);
}

/**
 * Update the checkbox settings and asset preview image based on the new asset selection
 * @param {boolean} RefreshCheckboxes - If TRUE, load the new asset settings. If FALSE, a checkbox was just manually
 *     changed so don't refresh them
 * @returns {void} - Nothing
 */
function PreferenceVisibilityAssetChanged(RefreshCheckboxes) {
	var CurrAsset = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex];

	// Load info for the new asset
	if (RefreshCheckboxes) {
		PreferenceVisibilityHideChecked = CurrAsset.Hidden;
		PreferenceVisibilityBlockChecked = CurrAsset.Blocked;
	}

	// Can't change the Block setting if the item is worn or set to limited permissions
	var WornItem = InventoryGet(Player, PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Group.Name);
	PreferenceVisibilityCanBlock = (WornItem == null || WornItem.Asset.Name != CurrAsset.Asset.Name) && !CurrAsset.Limited;

	// Get the preview image path
	PreferenceVisibilityPreviewAsset = CurrAsset.Asset;

	PreferenceVisibilityResetClicked = false;
}

/**
 * Toggles the Hide checkbox
 * @returns {void} - Nothing
 */
function PreferenceVisibilityHideChange() {
	PreferenceVisibilityHideChecked = !PreferenceVisibilityHideChecked;
	PreferenceVisibilityCheckboxChanged(PreferenceVisibilityHiddenList, PreferenceVisibilityHideChecked);
	PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Hidden = PreferenceVisibilityHideChecked;
	PreferenceVisibilityAssetChanged(false);
}

/**
 * Toggles the Block checkbox
 * @returns {void} - Nothing
 */
function PreferenceVisibilityBlockChange() {
	PreferenceVisibilityBlockChecked = !PreferenceVisibilityBlockChecked;
	PreferenceVisibilityCheckboxChanged(PreferenceVisibilityBlockList, PreferenceVisibilityBlockChecked);
	PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Blocked = PreferenceVisibilityBlockChecked;
	PreferenceVisibilityAssetChanged(false);
}

/**
 * Adds or removes the current item to/from the list based on the new state of the corresponding checkbox
 * @param {ItemBundle[]} List - The list to add or remove the item from
 * @param {boolean} CheckSetting - The new true/false setting of the checkbox
 */
function PreferenceVisibilityCheckboxChanged(List, CheckSetting) {
	var CurrGroup = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Group.Name;
	var CurrAsset = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Asset.Name;
	if (CheckSetting == true) {
		List.push({ Name: CurrAsset, Group: CurrGroup });
	}
	else {
		for (let A = 0; A < List.length; A++)
			if (List[A].Name == CurrAsset && List[A].Group == CurrGroup) {
				List.splice(A, 1);
				break;
			}
	}
}

/**
 * Saves changes to the settings, disposes of large lists & exits the visibility preference screen.
 * @param {boolean} SaveChanges - If TRUE, update HiddenItems and BlockItems for the account
 * @returns {void} - Nothing
 */
function PreferenceVisibilityExit(SaveChanges) {
	if (SaveChanges) ServerPlayerBlockItemsSync();

	PreferenceVisibilityGroupList = [];
	PreferenceVisibilityHiddenList = [];
	PreferenceVisibilityBlockList = [];
	PreferenceSubscreen = "";
}

/**
 * Loads the Preferences screen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGeneralLoad() {
	ElementCreateInput("InputCharacterLabelColor", "text", Player.LabelColor);
}

/**
 * Exists the preference screen. Cleans up elements that are not needed anymore
 * If the selected color is invalid, the player cannot leave the screen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGeneralExit() {
	if (PreferenceColorPick == "") {
		if (CommonIsColor(ElementValue("InputCharacterLabelColor"))) {
			Player.LabelColor = ElementValue("InputCharacterLabelColor");
			PreferenceMessage = "";
			ElementRemove("InputCharacterLabelColor");
			PreferenceSubscreen = "";
		} else PreferenceMessage = "ErrorInvalidColor";
	}
}

/**
 * Exists the difficulty screen. Cleans up elements that are not needed anymore
 * @returns {void} - Nothing
 */
function PreferenceSubscreenDifficultyExit() {
	PreferenceMessage = "";
	PreferenceSubscreen = "";
}

/**
 * Loads the preference security screen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenSecurityLoad() {
	ElementCreateInput("InputEmailOld", "text", "", "100");
	ElementCreateInput("InputEmailNew", "text", "", "100");
	ServerSend("AccountQuery", { Query: "EmailStatus" });
}

/**
 * Loads the preference censored words screen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenCensoredWordsLoad() {
	PreferenceCensoredWordsOffset = 0;
	ElementCreateInput("InputWord", "text", "", "50");
}

/**
 * Get the sensory deprivation setting for the player
 * @returns {boolean} - Return true if sensory deprivation is active, false otherwise
 */
function PreferenceIsPlayerInSensDep() {
	return (
		Player.GameplaySettings
		&& ((Player.GameplaySettings.SensDepChatLog == "SensDepNames") || (Player.GameplaySettings.SensDepChatLog == "SensDepTotal") || (Player.GameplaySettings.SensDepChatLog == "SensDepExtreme"))
		&& (Player.GetDeafLevel() >= 3)
		&& (Player.GetBlindLevel() >= 3 || ChatRoomSenseDepBypass)
	);
}

/**
 * Loads the preference screen. This function is called dynamically, when the character enters the preference screen
 * for the first time
 * @returns {void} - Nothing
 */
function PreferenceSubscreenNotificationsLoad() {
	const NS = Player.NotificationSettings;
	PreferenceNotificationsCheckSetting(NS.Beeps);
	PreferenceNotificationsCheckSetting(NS.ChatMessage);
	PreferenceNotificationsCheckSetting(NS.ChatJoin);
	PreferenceNotificationsCheckSetting(NS.Disconnect);
	PreferenceNotificationsCheckSetting(NS.Test);
}

/**
 * If the setting's alert type is not allowed for this session, e.g. from using a new device/browser, reset it to 'None'
 * @param {NotificationSetting} setting - The notifications setting to check
 * @returns {void} - Nothing
 */
function PreferenceNotificationsCheckSetting(setting) {
	const type = NotificationAlertTypeList.find(N => N === setting.AlertType);
	if (type == null) setting.AlertType = NotificationAlertTypeList[0];
}

/**
 * Sets the notifications preferences for a player. Redirected to from the main Run function if the player is in the
 * notifications settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenNotificationsRun() {

	// Character and exit button
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	//PreferencePageChangeDraw(1705, 185, 2); // Uncomment when adding a 2nd page

	// Left-aligned text controls
	MainCanvas.textAlign = "left";
	const NS = Player.NotificationSettings;

	DrawText(TextGet("NotificationsPreferences"), 500, 125, "Black", "Gray");
	DrawText(TextGet("NotificationsExplanation"), 500, 190, "Black", "Gray");
	DrawEmptyRect(1140, 92, 510, 125, "Black", 2);
	DrawImage("Icons/Audio1.png", 1152, 97);
	DrawText(TextGet("NotificationsAudioExplanation1"), 1205, 125, "Black", "Gray");
	DrawText(TextGet("NotificationsAudioExplanation2"), 1150, 190, "Black", "Gray");


	if (PreferencePageCurrent === 1) {
		PreferenceNotificationsDrawSetting(500, 235, TextGet("NotificationsBeeps"), NS.Beeps);

		PreferenceNotificationsDrawSetting(500, 315, TextGet("NotificationsChatMessage"), NS.ChatMessage);
		DrawText(TextGet("NotificationsOnly"), 550, 427, "Black", "Gray");
		const chatMessageDisabled = NS.ChatMessage.AlertType === NotificationAlertType.NONE;
		DrawCheckbox(1500, 315, 64, 64, TextGet("NotificationsChatMessageMention"), NS.ChatMessage.Mention && !chatMessageDisabled, chatMessageDisabled);
		DrawCheckbox(700, 395, 64, 64, TextGet("NotificationsChatMessageNormal"), NS.ChatMessage.Normal && !chatMessageDisabled, chatMessageDisabled);
		DrawCheckbox(1150, 395, 64, 64, TextGet("NotificationsChatMessageWhisper"), NS.ChatMessage.Whisper && !chatMessageDisabled, chatMessageDisabled);
		DrawCheckbox(1500, 395, 64, 64, TextGet("NotificationsChatMessageActivity"), NS.ChatMessage.Activity && !chatMessageDisabled, chatMessageDisabled);

		PreferenceNotificationsDrawSetting(500, 475, TextGet("NotificationsChatJoin"), NS.ChatJoin);
		DrawText(TextGet("NotificationsOnly"), 550, 587, "Black", "Gray");
		const chatJoinDisabled = NS.ChatJoin.AlertType === NotificationAlertType.NONE;
		DrawCheckbox(700, 555, 64, 64, TextGet("NotificationsChatJoinOwner"), NS.ChatJoin.Owner && !chatJoinDisabled, chatJoinDisabled);
		DrawCheckbox(980, 555, 64, 64, TextGet("NotificationsChatJoinLovers"), NS.ChatJoin.Lovers && !chatJoinDisabled, chatJoinDisabled);
		DrawCheckbox(1260, 555, 64, 64, TextGet("NotificationsChatJoinFriendlist"), NS.ChatJoin.Friendlist && !chatJoinDisabled, chatJoinDisabled);
		DrawCheckbox(1540, 555, 64, 64, TextGet("NotificationsChatJoinSubs"), NS.ChatJoin.Subs && !chatJoinDisabled, chatJoinDisabled);

		PreferenceNotificationsDrawSetting(500, 635, TextGet("NotificationsDisconnect"), NS.Disconnect);
		PreferenceNotificationsDrawSetting(500, 715, TextGet("NotificationsLarp"), NS.Larp);
	}
	else if (PreferencePageCurrent === 2) {
		// New settings here
	}

	// Test buttons
	PreferenceNotificationsDrawSetting(500, 820, "", NS.Test);
	MainCanvas.textAlign = "center";
	DrawEmptyRect(500, 800, 1400, 0, "Black", 1);
	DrawButton(800, 820, 450, 64, TextGet("NotificationsTestRaise"), "White");
	DrawButton(1286, 820, 450, 64, TextGet("NotificationsTestReset"), "White");
}

/**
 * Draws the two checkbox row for a notifications setting
 * @param {number} Left - The X co-ordinate the row starts on
 * @param {number} Top - The Y co-ordinate the row starts on
 * @param {string} Text - The text for the setting's description
 * @param {NotificationSetting} Setting - The player setting the row corresponds to
 * @returns {void} - Nothing
 */
function PreferenceNotificationsDrawSetting(Left, Top, Text, Setting) {
	MainCanvas.textAlign = "center";
	DrawBackNextButton(Left, Top, 164, 64, TextGet("NotificationsAlertType" + Setting.AlertType.toString()), "White", null, () => "", () => "");
	MainCanvas.textAlign = "left";
	const Enabled = Setting.AlertType > 0;
	if (Enabled) {
		DrawButton(Left + 200, Top, 64, 64, "", "White", "Icons/Audio" + Setting.Audio.toString() + ".png");
	} else {
		DrawCheckbox(Left + 200, Top, 64, 64, "", false, true);
	}
	DrawText(Text, Left + 300, Top + 33, "Black", "Gray");
}

/**
 * Handles the click events for the notifications settings of a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenNotificationsClick() {

	// If the user clicked the exit icon to return to the main screen
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenNotificationsExit();
	// Change pages
	//PreferencePageChangeClick(1705, 185, 2); // Uncomment when adding a 2nd page

	// Checkboxes
	const NS = Player.NotificationSettings;
	if (PreferencePageCurrent === 1) {
		PreferenceNotificationsClickSetting(500, 235, NS.Beeps, NotificationEventType.BEEP);

		PreferenceNotificationsClickSetting(500, 315, NS.ChatMessage, NotificationEventType.CHATMESSAGE);
		if (NS.ChatMessage.AlertType > 0) {
			if (MouseIn(1500, 315, 64, 64)) NS.ChatMessage.Mention = !NS.ChatMessage.Mention;
			if (MouseIn(700, 395, 64, 64)) NS.ChatMessage.Normal = !NS.ChatMessage.Normal;
			if (MouseIn(1150, 395, 64, 64)) NS.ChatMessage.Whisper = !NS.ChatMessage.Whisper;
			if (MouseIn(1500, 395, 64, 64)) NS.ChatMessage.Activity = !NS.ChatMessage.Activity;
		}

		PreferenceNotificationsClickSetting(500, 475, NS.ChatJoin, NotificationEventType.CHATJOIN);
		if (NS.ChatJoin.AlertType > 0) {
			if (MouseIn(700, 555, 64, 64)) NS.ChatJoin.Owner = !NS.ChatJoin.Owner;
			if (MouseIn(980, 555, 64, 64)) NS.ChatJoin.Lovers = !NS.ChatJoin.Lovers;
			if (MouseIn(1260, 555, 64, 64)) NS.ChatJoin.Friendlist = !NS.ChatJoin.Friendlist;
			if (MouseIn(1540, 555, 64, 64)) NS.ChatJoin.Subs = !NS.ChatJoin.Subs;
		}

		PreferenceNotificationsClickSetting(500, 635, NS.Disconnect, NotificationEventType.DISCONNECT);
		PreferenceNotificationsClickSetting(500, 715, NS.Larp, NotificationEventType.LARP);
	}
	else if (PreferencePageCurrent === 2) {
		// New settings here
	}

	// Test buttons
	PreferenceNotificationsClickSetting(500, 820, NS.Test, NotificationEventType.TEST);
	if (MouseIn(800, 820, 450, 64)) {
		NotificationRaise(NotificationEventType.TEST, { body: TextGet("NotificationsTestMessage"), character: Player, useCharAsIcon: true });
	}
	if (MouseIn(1286, 820, 450, 64)) NotificationResetAll();
}

/**
 * Handles the click events within a multi-checkbox settings row.
 * @param {number} Left - The X co-ordinate the row starts on
 * @param {number} Top - The Y co-ordinate the row starts on
 * @param {NotificationSetting} Setting - The player setting the row corresponds to
 * @param {NotificationEventType} EventType - The event type the setting corresponds to
 * @returns {void} - Nothing
 */
function PreferenceNotificationsClickSetting(Left, Top, Setting, EventType) {

	// Toggle the alert type
	if (MouseIn(Left, Top, 164, 64)) {
		if (EventType) NotificationReset(EventType);
		if (MouseXIn(Left, 83)) {
			let prevType = NotificationAlertTypeList.findIndex(N => N === Setting.AlertType) - 1;
			if (prevType < 0) prevType = NotificationAlertTypeList.length - 1;
			Setting.AlertType = NotificationAlertTypeList[prevType];
		}
		else if (MouseXIn(Left + 83, 83)) {
			let nextType = NotificationAlertTypeList.findIndex(N => N === Setting.AlertType) + 1;
			if (nextType > NotificationAlertTypeList.length - 1) nextType = 0;
			Setting.AlertType = NotificationAlertTypeList[nextType];
		}
	}

	// Toggle the audio type
	if (MouseIn(Left + 200, Top, 64, 64) && Setting.AlertType > 0) {
		let nextType = NotificationAudioTypeList.findIndex(N => N === Setting.Audio) + 1;
		if (nextType > NotificationAudioTypeList.length - 1) nextType = 0;
		Setting.Audio = NotificationAudioTypeList[nextType];
	}
}

/**
 * Exits the preference screen. Resets the test notifications.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenNotificationsExit() {

	// If any of the settings now have audio enabled, enable the AudioSettings setting as well
	let enableAudio = false;
	for (const setting in Player.NotificationSettings) {
		let audio = Player.NotificationSettings[setting].Audio;
		if (typeof audio === 'number' && audio > 0) enableAudio = true;
	}
	if (enableAudio) Player.AudioSettings.Notifications = true;

	NotificationReset(NotificationEventType.TEST);
	PreferenceSubscreen = "";
}

/**
 * Exits the preference screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenControllerExit() {
	PreferenceSubscreen = "";
	ControllerStopCalibration(true);
}

/**
 * Exits the preference screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenCensoredWordsExit() {
	ElementRemove("InputWord");
	Player.ChatSettings.CensoredWordsList = PreferenceCensoredWordsList.join("|");
	PreferenceSubscreen = "";
}

/**
 * Exits the preference screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenChatExit() {
	if (PreferenceColorPick == "") PreferenceSubscreen = "";
}

/**
 * Exits the preference screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenArousalExit() {
	PreferenceSubscreen = "";
	Player.FocusGroup = null;
	CharacterAppearanceForceUpCharacter = -1;
	CharacterLoadCanvas(Player);
}

/**
 * Exits the preference screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenSecurityExit() {
	PreferenceSubscreen = "";
	ElementRemove("InputEmailOld");
	ElementRemove("InputEmailNew");
}

/**
 * Exits the preference screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenVisibilityExit() {
	PreferenceVisibilityExit(false);
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
	Activity: ActivityFemale3DCG.map(({ Name }) => {
		return { ...PreferenceActivityEnjoymentDefault, Name };
	}),
	Zone: PreferenceArousalZoneDefaultCompressedString,
	Fetish: FetishFemale3DCG.map(({ Name }) => {
		return { ...PreferenceArousalFetishDefault, Name };
	}),
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
		if (!CommonIsArray(arg)) {
			return CommonCloneDeep(PreferenceArousalSettingsDefault.Activity);
		}

		const expectedKeys = new Set(PreferenceArousalSettingsDefault.Activity.map(({ Name }) => Name));
		const ret = arg.map(i => ValdiationApplyRecord(i, C, PreferenceActivityEnjoymentValidate)).filter(activity => {
			if (activity.Name !== undefined) {
				expectedKeys.delete(activity.Name);
				return true;
			} else {
				return false;
			}
		});

		if (expectedKeys.size > 0) {
			ret.push(...CommonCloneDeep(PreferenceArousalSettingsDefault.Activity.filter(({ Name }) => expectedKeys.has(Name))));
		}
		return ret;
	},
	Zone: (arg, C) => {
		/*if (!CommonIsArray(arg)) {
			return CommonCloneDeep(PreferenceArousalSettingsDefault.Zone);
		}

		const expectedKeys = new Set(PreferenceArousalSettingsDefault.Zone.map(({ Name }) => Name));
		const ret = arg.map(i => ValdiationApplyRecord(i, C, PreferenceArousalZoneValidate)).filter(zone => {
			if (zone.Name !== undefined) {
				expectedKeys.delete(zone.Name);
				return true;
			} else {
				return false;
			}
		});

		if (expectedKeys.size > 0) {
			ret.push(...CommonCloneDeep(PreferenceArousalSettingsDefault.Zone.filter(({ Name }) => expectedKeys.has(Name))));
		}
		return ret;*/
		
		return (typeof arg === "string" && arg != null) ? arg : PreferenceArousalZoneDefaultCompressedString;

	},
	Fetish: (arg, C) => {
		if (!CommonIsArray(arg)) {
			return CommonCloneDeep(PreferenceArousalSettingsDefault.Fetish);
		}

		const expectedKeys = new Set(PreferenceArousalSettingsDefault.Fetish.map(({ Name }) => Name));
		const ret = arg.map(i => ValdiationApplyRecord(i, C, PreferenceArousalFetishValidate)).filter(fetish => {
			if (fetish.Name !== undefined) {
				expectedKeys.delete(fetish.Name);
				return true;
			} else {
				return false;
			}
		});

		if (expectedKeys.size > 0) {
			ret.push(...CommonCloneDeep(PreferenceArousalSettingsDefault.Fetish.filter(({ Name }) => expectedKeys.has(Name))));
		}
		return ret;
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
 * Handles the loading of the preference subscreen for extensions
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsLoad() {
	PreferenceExtensionsDisplay = Object.keys(PreferenceExtensionsSettings).map(
		k => (
			s=>({
				Button: typeof s.ButtonText === "function" ? s.ButtonText() : s.ButtonText,
				Image: s.Image && (typeof s.Image === "function" ? s.Image() : s.Image),
				click: () => {
					PreferenceExtensionsCurrent = s;
					s?.load();
				}
			}))(PreferenceExtensionsSettings[k]));
}

/**
 * Runs and draws the preference subscreen for extensions
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsRun() {
	if(PreferenceExtensionsCurrent === null) {
		DrawCharacter(Player, 50, 50, 0.9);

		MainCanvas.textAlign = "left";
		DrawText(TextGet("ExtensionsPreferences"), 500, 125, "Black", "Gray");

		MainCanvas.textAlign = "center";
		PreferenceExtensionsDisplay.forEach((s, i) => {
			const X = 500 + Math.floor(i / 7) * 420;
			const Y = 160 + (i % 7) * 110;
			DrawButton(X, Y, 400, 90, "", "White", s.Image || null);
			DrawTextFit(s.Button, X + 245, Y + 45, 310, "Black");
		});

		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	} else {
		PreferenceExtensionsCurrent.run();
	}
}

/**
 * Handles clicks in the preference subscreen for extensions
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsClick() {
	if(PreferenceExtensionsCurrent === null) {
		if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenExtensionsExit();
		PreferenceExtensionsDisplay.forEach((s, i) => {
			const X = 500 + Math.floor(i / 7) * 420;
			const Y = 160 + (i % 7) * 110;
			if (MouseIn(X, Y, 400, 90)) s.click();
		});
	} else {
		PreferenceExtensionsCurrent.click();
	}
}

function PreferenceSubscreenExtensionsUnload() {
	PreferenceExtensionsCurrent?.unload?.();
}

function PreferenceSubscreenExtensionsExit() {
	if(PreferenceExtensionsCurrent === null) {
		PreferenceSubscreen = "";
	} else if(PreferenceExtensionsCurrent.exit()) {
		PreferenceSubscreenExtensionsClear();
	}
}

/**
 * Exit the preference subscreen for extensions, should be called when
 * leaving custom menu of extensions if the extension exits the menu from itself.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsClear() {
	if(PreferenceSubscreen !== "Extensions" || PreferenceExtensionsCurrent === null) return;
	PreferenceExtensionsCurrent.unload();
	PreferenceExtensionsCurrent = null;
	// Reload the extension settings
	PreferenceSubscreenExtensionsLoad();
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
						NewZone = NewZone + PreferenceArousalZoneToChar(Zone.Factor, Zone.Orgasm);
						Found = true;
						break;
					}
				}
			
				// If it wasn't found, we create the char for it
				if (!Found)
					NewZone = NewZone + PreferenceArousalZoneToChar(2, false);

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
	if ((C.ArousalSettings.Zone != null) && (typeof C.ArousalSettings.Zone === "string") && (C.ArousalSettings.Zone.length != PreferenceArousalZoneCount)) {
		while (C.ArousalSettings.Zone.length < PreferenceArousalZoneCount)
			C.ArousalSettings.Zone = C.ArousalSettings.Zone + PreferenceArousalZoneToChar(2, false);
		if (C.ArousalSettings.Zone.length > PreferenceArousalZoneCount)
			C.ArousalSettings.Zone = C.ArousalSettings.Zone.substring(0, PreferenceArousalZoneCount);
		MustUpdate = true;
	}

	// If we must update the server with the updated data
	if (MustUpdate)
		ServerAccountUpdate.QueueData({ ArousalSettings: Player.ArousalSettings });
	
}