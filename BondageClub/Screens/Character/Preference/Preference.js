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

	// No valid data means no special factor
	if ((C == null) || (C.ArousalSettings == null) || (C.ArousalSettings.Activity == null) || (typeof C.ArousalSettings.Activity !== "string")) return 2;

	// Finds the ID of the activity specified
	let ID = -1;
	for (let A of ActivityFemale3DCG)
		if (A.Name === Type) {
			ID = A.ActivityID;
			break;
		}
	if (ID == -1) return 2;

	// Gets the value and make sure it's valid
	let Value = C.ArousalSettings.Activity.charCodeAt(ID) - 100;
	if (Self) Value = Value % 10;
	else Value = Math.floor(Value / 10);
	// @ts-ignore
	return ((Value >= 0) && (Value <= 4)) ? Value : 2;

}

/**
 * Sets the love factor of a sexual activity for the character
 * @param {Character} C - The character for whom the activity factor should be set
 * @param {ActivityName} Type - The type of the activity that is performed
 * @param {boolean} Self - Determines, if the current player is giving (false) or receiving (true)
 * @param {ArousalFactor} Factor - The factor of the sexual activity (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceSetActivityFactor(C, Type, Self, Factor) {

	// Make sure the Activity data is valid
	if ((typeof Factor !== "number") || (Factor < 0) || (Factor > 4)) return;
	if ((C == null) || (C.ArousalSettings == null)) return;
	if ((C.ArousalSettings.Activity == null) || (typeof C.ArousalSettings.Activity !== "string")) C.ArousalSettings.Activity = PreferenceArousalActivityDefaultCompressedString;
	while ((C.ArousalSettings.Activity.length < PreferenceArousalActivityDefaultCompressedString.length))
		C.ArousalSettings.Activity = C.ArousalSettings.Activity + PreferenceArousalTwoFactorToChar();

	// Finds the ID of the Activity specified
	let ID = -1;
	for (let F of ActivityFemale3DCG)
		if (F.Name === Type) {
			ID = F.ActivityID;
			break;
		}
	if (ID == -1) return;

	// Gets and sets the factors
	let SelfFactor = PreferenceGetActivityFactor(C, Type, true);
	let OtherFactor = PreferenceGetActivityFactor(C, Type, false);
	if (Self) SelfFactor = Factor;
	else OtherFactor = Factor;

	// Sets the Fetish in the compressed string
	C.ArousalSettings.Activity = C.ArousalSettings.Activity.substring(0, ID) + PreferenceArousalTwoFactorToChar(SelfFactor, OtherFactor) + C.ArousalSettings.Activity.substring(ID + 1);

}

/**
 * Gets the factor of a fetish for the player, "2" for normal is default if factor isn't found
 * @param {Character} C - The character to query
 * @param {FetishName} Type - The name of the fetish
 * @returns {ArousalFactor} - Returns the love factor of the fetish for the character (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceGetFetishFactor(C, Type) {

	// No valid data means no fetish
	if ((C == null) || (C.ArousalSettings == null) || (C.ArousalSettings.Fetish == null) || (typeof C.ArousalSettings.Fetish !== "string")) return 2;

	// Finds the ID of the fetish specified
	let ID = -1;
	for (let F of FetishFemale3DCG)
		if (F.Name === Type) {
			ID = F.FetishID;
			break;
		}
	if (ID == -1) return 2;

	// If value is between 0 and 4, we return it
	let Value = C.ArousalSettings.Fetish.charCodeAt(ID) - 100;
	// @ts-ignore
	return ((Value >= 0) && (Value <= 4)) ? Value : 2;

}

/**
 * Sets the arousal factor of a fetish for a character
 * @param {Character} C - The character to set
 * @param {FetishName} Type - The name of the fetish
 * @param {ArousalFactor} Type - New arousal factor for that fetish (0 is horrible, 2 is normal, 4 is great)
 * @returns {void} - Nothing
 */
function PreferenceSetFetishFactor(C, Type, Factor) {

	// Make sure the fetish data is valid
	if ((typeof Factor !== "number") || (Factor < 0) || (Factor > 4)) return;
	if ((C == null) || (C.ArousalSettings == null)) return;
	if ((C.ArousalSettings.Fetish == null) || (typeof C.ArousalSettings.Fetish !== "string")) C.ArousalSettings.Fetish = PreferenceArousalFetishDefaultCompressedString;
	while ((C.ArousalSettings.Fetish.length < PreferenceArousalFetishDefaultCompressedString.length))
		C.ArousalSettings.Fetish = C.ArousalSettings.Fetish + PreferenceArousalFactorToChar();

	// Finds the ID of the fetish specified
	let ID = -1;
	for (let F of FetishFemale3DCG)
		if (F.Name === Type) {
			ID = F.FetishID;
			break;
		}
	if (ID == -1) return;

	// Sets the Fetish in the compressed string
	C.ArousalSettings.Fetish = C.ArousalSettings.Fetish.substring(0, ID) + PreferenceArousalFactorToChar(Factor) + C.ArousalSettings.Fetish.substring(ID + 1);

}

/**
 * Validates the character arousal object and converts it's objects to compressed string if needed
 * @param {number} Factor - The factor of enjoyability from 0 (turn off) to 4 (very high)
 * @param {boolean} Orgasm - Whether the zone can give an orgasm
 * @returns {string} - A string of 1 char that represents the compressed zone
 */
function PreferenceArousalFactorToChar(Factor = 2, Orgasm = false) {
	if ((Factor < 0) || (Factor > 4)) Factor = 2;
	return String.fromCharCode(100 + Factor + (Orgasm ? 10 : 0));
}

/**
 * Validates the character arousal object and converts it's objects to compressed string if needed
 * @param {number} Factor1 - The first factor of enjoyability from 0 (turn off) to 4 (very high)
 * @param {number} Factor2 - The second factor of enjoyability from 0 (turn off) to 4 (very high)
 * @returns {string} - A string of 1 char that represents the compressed zone
 */
function PreferenceArousalTwoFactorToChar(Factor1 = 2, Factor2 = 2) {
	if ((Factor1 < 0) || (Factor1 > 4)) Factor1 = 2;
	if ((Factor2 < 0) || (Factor2 > 4)) Factor2 = 2;
	return String.fromCharCode(100 + Factor1 + (Factor2 * 10));
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
	};

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
		};
	}
	Zone.Factor = Factor;

	// Creates the new char and slides it in the compressed string
	C.ArousalSettings.Zone = C.ArousalSettings.Zone.substring(0, Group.ArousalZoneID) + PreferenceArousalFactorToChar(Zone.Factor, Zone.Orgasm) + C.ArousalSettings.Zone.substring(Group.ArousalZoneID + 1);

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
		};
	}
	Zone.Orgasm = CanOrgasm;

	// Creates the new char and slides it in the compressed string
	C.ArousalSettings.Zone = C.ArousalSettings.Zone.substring(0, Group.ArousalZoneID) + PreferenceArousalFactorToChar(Zone.Factor, Zone.Orgasm) + C.ArousalSettings.Zone.substring(Group.ArousalZoneID + 1);

}

/**
 * Checks, if the arousal activity controls must be activated
 * @returns {boolean} - Returns true if we must activate the preference controls, false otherwise
 */
function PreferenceArousalIsActive() {
	return (PreferenceArousalActiveList[PreferenceArousalActiveIndex] != "Inactive");
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
		LabelColor: JSON.stringify(C.LabelColor) || "",
	};

	// Non-player specific settings
	PreferenceInit(C);

	// If the settings aren't set before, construct them to replicate the default behavior

	if (!CommonIsColor(C.LabelColor)) C.LabelColor = "#ffffff";

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
	if (typeof C.ChatSettings.OOCAutoClose !== "boolean") C.ChatSettings.OOCAutoClose = true;

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
	if (typeof C.OnlineSettings.FriendListAutoRefresh !== "boolean") C.OnlineSettings.FriendListAutoRefresh = true;

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
	if (!PreferenceGraphicsFrameLimit.includes(C.GraphicsSettings.MaxFPS)) C.GraphicsSettings.MaxFPS = DEFAULT_FRAMERATE;
	if (!PreferenceGraphicsFrameLimit.includes(C.GraphicsSettings.MaxUnfocusedFPS)) C.GraphicsSettings.MaxUnfocusedFPS = 0;
	if (typeof C.GraphicsSettings.ShowFPS !== "boolean") C.GraphicsSettings.ShowFPS = false;

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
		C.OnlineSharedSettings.AllowRename = true;
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
	PreferenceInitPlayer();
	PreferenceSubscreen = PreferenceSubscreens.find(s => s.name === "Main");

	// Backward-compatibility: just throw the old-style screens into the mix
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
 * @returns {void} - Nothing
 */
function PreferenceExit() {
	if (PreferenceSubscreen.name !== "Main") {
		if (!PreferenceSubscreenExit())
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
