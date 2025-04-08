"use strict";

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
	if (!CommonIsObject(C.ArousalSettings)) return;
	if (!C.ArousalSettings || typeof C.ArousalSettings?.Activity !== "string") C.ArousalSettings.Activity = PreferenceArousalActivityDefaultCompressedString;
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
	if (typeof C.ArousalSettings?.Fetish !== "string") return 2;

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
 * @param {ArousalFactor} Factor - New arousal factor for that fetish (0 is horrible, 2 is normal, 4 is great)
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
 * @param {AssetGroupItemName} ZoneName - The name of the zone to get
 * @returns {null | ArousalZone} - Returns the arousal zone preference object,
 * or null if a corresponding zone definition could not be found.
 */
function PreferenceGetArousalZone(C, ZoneName) {

	// Make sure the data is valid
	if (typeof C.ArousalSettings?.Zone !== "string") return null;

	// Finds the asset group and make sure the string contains it
	let Group = AssetGroupGet(C.AssetFamily, ZoneName);
	if (!Group || !CommonIsNonNegativeInteger(Group.ArousalZoneID) || (C.ArousalSettings.Zone.length <= Group.ArousalZoneID)) return null;

	const Value = C.ArousalSettings.Zone.charCodeAt(Group.ArousalZoneID) - 100;
	let Factor = /** @type {ArousalFactor} */ (CommonClamp(Value, 0, 4));
	// If the value was clamped, default it
	if (Factor !== Value) Factor = 2;
	return {
		Name: ZoneName,
		Factor: Factor,
		Orgasm: (Value >= 10)
	};
}

/**
 * Gets the love factor of a zone for the character
 * @param {Character} C - The character for whom the love factor of a particular zone should be gotten
 * @param {AssetGroupItemName} ZoneName - The name of the zone to get the love factor for
 * @returns {ArousalFactor} - Returns the love factor of a zone for the character (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceGetZoneFactor(C, ZoneName) {
	const Zone = PreferenceGetArousalZone(C, ZoneName);
	/** @type {ArousalFactor} */
	if (!Zone) return 2;
	return Zone.Factor;
}

/**
 * Sets the arousal zone data for a specific body zone on the player
 * @param {Character} C - The character, for whom the love factor of a particular zone should be set
 * @param {AssetGroupItemName} ZoneName - The name of the zone, the factor should be set for
 * @param {ArousalFactor} Factor - The factor of the zone (0 is horrible, 2 is normal, 4 is great)
 * @param {boolean} CanOrgasm - Sets, if the character can cum from the given zone (true) or not (false)
 * @returns {void} - Nothing
 */
function PreferenceSetArousalZone(C, ZoneName, Factor = null, CanOrgasm = null) {
	// Nothing to do if data is invalid
	if (typeof C.ArousalSettings?.Zone !== "string") return;

	// Finds the asset group and make sure the string contains it
	let Group = AssetGroupGet(C.AssetFamily, ZoneName);
	if (!Group || !CommonIsNonNegativeInteger(Group.ArousalZoneID) || (C.ArousalSettings.Zone.length <= Group.ArousalZoneID)) return;

	// Gets the zone object
	let Zone = PreferenceGetArousalZone(C, ZoneName);
	Zone ??= {
		Name: ZoneName,
		Factor: 2,
		Orgasm: false
	};

	if (typeof Factor === "number") {
		Zone.Factor = Factor;
	}
	if (typeof CanOrgasm === "boolean") {
		Zone.Orgasm = CanOrgasm;
	}

	// Creates the new char and slides it in the compressed string
	C.ArousalSettings.Zone = C.ArousalSettings.Zone.substring(0, Group.ArousalZoneID) + PreferenceArousalFactorToChar(Zone.Factor, Zone.Orgasm) + C.ArousalSettings.Zone.substring(Group.ArousalZoneID + 1);
}

/**
 * Sets the love factor for a specific body zone on the player
 * @param {Character} C - The character, for whom the love factor of a particular zone should be set
 * @param {AssetGroupItemName} ZoneName - The name of the zone, the factor should be set for
 * @param {ArousalFactor} Factor - The factor of the zone (0 is horrible, 2 is normal, 4 is great)
 * @deprecated Use {@link PreferenceSetArousalZone}
 * @returns {void} - Nothing
 */
function PreferenceSetZoneFactor(C, ZoneName, Factor) {
	PreferenceSetArousalZone(C, ZoneName, Factor);
}

/**
 * Determines, if a player can reach on orgasm from a particular zone
 * @param {Character} C - The character whose ability to orgasm we check
 * @param {AssetGroupItemName} ZoneName - The name of the zone to check
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
 * @deprecated Use {@link PreferenceSetArousalZone}
 * @returns {void} - Nothing
 */
function PreferenceSetZoneOrgasm(C, ZoneName, CanOrgasm) {
	PreferenceSetArousalZone(C, ZoneName, null, CanOrgasm);
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
	C.ArousalSettings = ValidationApplyRecord(C.ArousalSettings, C, PreferenceArousalSettingsValidate);
}

/**
 * Initialize and validates Player settings
 * @param {PlayerCharacter} C
 * @param {Partial<ServerAccountData>} data
 * @returns {void} - Nothing
 */
function PreferenceInitPlayer(C, data) {

	/**
	 * Save settings for comparison
	 * @satisfies {Partial<Record<keyof ServerAccountData, string>>}
	 */
	const PrefBefore = {
		ArousalSettings: JSON.stringify(data.ArousalSettings) ?? "",
		ChatSettings: JSON.stringify(data.ChatSettings) ?? "",
		VisualSettings: JSON.stringify(data.VisualSettings) ?? "",
		AudioSettings: JSON.stringify(data.AudioSettings) ?? "",
		ControllerSettings: JSON.stringify(data.ControllerSettings) ?? "",
		GameplaySettings: JSON.stringify(data.GameplaySettings) ?? "",
		ImmersionSettings: JSON.stringify(data.ImmersionSettings) ?? "",
		RestrictionSettings: JSON.stringify(data.RestrictionSettings) ?? "",
		OnlineSettings: JSON.stringify(data.OnlineSettings) ?? "",
		OnlineSharedSettings: JSON.stringify(data.OnlineSharedSettings) ?? "",
		GraphicsSettings: JSON.stringify(data.GraphicsSettings) ?? "",
		NotificationSettings: JSON.stringify(data.NotificationSettings) ?? "",
		GenderSettings: JSON.stringify(data.GenderSettings) ?? "",
		LabelColor: JSON.stringify(data.LabelColor) ?? "",
	};

	C.LabelColor = CommonIsColor(data.LabelColor) ? data.LabelColor ?? "" : "#ffffff";
	C.ItemPermission = data.ItemPermission ?? 2;


	C.ArousalSettings = ValidationApplyRecord(data.ArousalSettings, C, PreferenceArousalSettingsValidate);
	C.AudioSettings = ValidationApplyRecord(data.AudioSettings, C, PreferenceAudioSettingsValidate);

	// @ts-ignore: Just backward-compat cleanup
	delete data.ChatSettings?.AutoBanBlackList;
	// @ts-ignore: Just backward-compat cleanup
	delete data.ChatSettings?.AutoBanGhostList;
	// @ts-ignore: Just backward-compat cleanup
	delete data.ChatSettings?.SearchFriendsFirst;
	// @ts-ignore: Just backward-compat cleanup
	delete data.ChatSettings?.DisableAnimations;
	// @ts-ignore: Just backward-compat cleanup
	delete data.ChatSettings?.SearchShowsFullRooms;
	// @ts-ignore: Just backward-compat cleanup
	delete data.OnlineSettings?.EnableWardrobeIcon;
	C.ChatSettings = ValidationApplyRecord(data.ChatSettings, C, PreferenceChatSettingsValidate);

	// @ts-expect-error: checking for old-style mapping
	if (data.ControllerSettings && typeof data.ControllerSettings?.ControllerA === "number") {
		// Port over to new mapping
		const s = /** @type {ControllerSettingsOld} */(/** @type {unknown} */(data.ControllerSettings));
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
			delete data.ControllerSettings[old];
		}
		// @ts-expect-error we don't have all the buttons
		data.ControllerSettings.Buttons = buttonsMapping;
		// @ts-expect-error we don't have all the axis
		data.ControllerSettings.Axis = axisMapping;
	}

	C.ControllerSettings = ValidationApplyRecord(data.ControllerSettings, C, PreferenceControllerSettingsValidate);
	ControllerLoadMapping(C.ControllerSettings.Buttons, C.ControllerSettings.Axis);

	ControllerStart();

	C.GameplaySettings = ValidationApplyRecord(data.GameplaySettings, C, PreferenceGameplaySettingsValidate);
	C.GraphicsSettings = ValidationApplyRecord(data.GraphicsSettings, C, PreferenceGraphicsSettingsValidate);
	C.GenderSettings = ValidationApplyRecord(data.GenderSettings, C, PreferenceGenderSettingsValidate);
	C.ImmersionSettings = ValidationApplyRecord(data.ImmersionSettings, C, PreferenceImmersionSettingsValidate);
	C.OnlineSettings = ValidationApplyRecord(data.OnlineSettings, C, PreferenceOnlineSettingsValidate, true);
	const extraKeys = CommonKeys(C.OnlineSettings).filter(i => !(i in PreferenceOnlineSettingsValidate));
	if (extraKeys.length) {
		console.warn(`Found extra keys ${extraKeys} in Player.OnlineSettings. Please move those to Player.ExtensionSettings`);
	}
	C.OnlineSharedSettings = ValidationApplyRecord(data.OnlineSharedSettings, C, PreferenceOnlineSharedSettingsValidate, true);
	C.RestrictionSettings = ValidationApplyRecord(data.RestrictionSettings, C, PreferenceRestrictionSettingsValidate);
	C.VisualSettings = ValidationApplyRecord(data.VisualSettings, C, PreferenceVisualSettingsValidate);

	// Convert old version of notification settings
	let NS = /** @type {Partial<NotificationSettingsType>} */ (data.NotificationSettings ?? {});
	if (typeof NS.ChatMessage?.IncludeActions === "boolean") {
		const chatMessagesEnabled = NS.ChatMessage.AlertType !== NotificationAudioType.NONE;
		NS.ChatMessage.Normal = chatMessagesEnabled;
		NS.ChatMessage.Whisper = chatMessagesEnabled;
		NS.ChatMessage.Activity = chatMessagesEnabled && NS.ChatMessage.IncludeActions;
		delete NS.ChatMessage.IncludeActions;
	}
	if (typeof NS.ChatActions !== "undefined") delete NS.ChatActions;

	const defaultAudio = typeof NS.Audio === "boolean" && NS.Audio ? NotificationAudioType.FIRST : NotificationAudioType.NONE;
	if (typeof NS.Audio !== "undefined") delete NS.Audio;

	if (typeof NS.ChatJoin?.Enabled !== "undefined") {
		// Convert old version of settings
		NS.ChatJoin.AlertType = NS.ChatJoin.Enabled ? NotificationAlertType.TITLEPREFIX : NotificationAlertType.NONE;
		NS.ChatJoin.Audio = NotificationAudioType.NONE;
		delete NS.ChatJoin.Enabled;
	}
	if (typeof NS.Chat !== "undefined") { NS.ChatMessage = NS.Chat; delete NS.Chat; }

	if (typeof NS.Beeps !== "object") NS.Beeps = PreferenceInitNotificationSetting(NS.Beeps, defaultAudio, NotificationAlertType.POPUP);
	// @ts-expect-error object gets its missing properties afterwards
	if (typeof NS.ChatMessage !== "object") NS.ChatMessage = PreferenceInitNotificationSetting(NS.ChatMessage, defaultAudio);
	if (typeof NS.ChatMessage.Normal !== "boolean") NS.ChatMessage.Normal = true;
	if (typeof NS.ChatMessage.Whisper !== "boolean") NS.ChatMessage.Whisper = true;
	if (typeof NS.ChatMessage.Activity !== "boolean") NS.ChatMessage.Activity = false;
	// @ts-expect-error object gets its missing properties afterwards
	if (typeof NS.ChatJoin !== "object") NS.ChatJoin = PreferenceInitNotificationSetting(NS.ChatJoin, defaultAudio);
	if (typeof NS.ChatJoin.Owner !== "boolean") NS.ChatJoin.Owner = false;
	if (typeof NS.ChatJoin.Lovers !== "boolean") NS.ChatJoin.Lovers = false;
	if (typeof NS.ChatJoin.Friendlist !== "boolean") NS.ChatJoin.Friendlist = false;
	if (typeof NS.ChatJoin.Subs !== "boolean") NS.ChatJoin.Subs = false;
	if (typeof NS.Disconnect !== "object") NS.Disconnect = PreferenceInitNotificationSetting(NS.Disconnect, defaultAudio);
	if (typeof NS.Larp !== "object") NS.Larp = PreferenceInitNotificationSetting(NS.Larp, defaultAudio, NotificationAlertType.NONE);
	if (typeof NS.Test !== "object") NS.Test = PreferenceInitNotificationSetting(NS.Test, defaultAudio, NotificationAlertType.TITLEPREFIX);
	data.NotificationSettings = /** @type {NotificationSettingsType} */ (NS);

	C.NotificationSettings = ValidationApplyRecord(data.NotificationSettings, C, PreferenceNotificationSettingsValidate);

	// Forces some preferences depending on difficulty

	// Difficulty: non-Roleplay settings
	if (C.GetDifficulty() >= Difficulty.REGULAR) {
		C.RestrictionSettings.BypassStruggle = false;
		C.RestrictionSettings.SlowImmunity = false;
		C.RestrictionSettings.BypassNPCPunishments = false;
		C.RestrictionSettings.NoSpeechGarble = false;
	}

	// Difficulty: Hardcore settings
	if (C.GetDifficulty() >= Difficulty.HARDCORE) {
		C.GameplaySettings.EnableSafeword = false;
		C.GameplaySettings.DisableAutoMaid = true;
		C.GameplaySettings.OfflineLockedRestrained = true;
	}

	// Difficulty: Extreme settings
	if (C.GetDifficulty() >= Difficulty.EXTREME) {
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
		C.ImmersionSettings.ShowUngarbledMessages = false;
		C.OnlineSharedSettings.AllowPlayerLeashing = true;
		C.OnlineSharedSettings.AllowRename = true;
	}

	// Sync settings if anything changed
	/** @type {{ [k in keyof typeof PrefBefore]?: PlayerCharacter[k] }} */
	const toUpdate = {};

	for (const [prop, stringPrefBefore] of CommonEntries(PrefBefore))
		if (JSON.stringify(C[prop]) !== stringPrefBefore)
			toUpdate[/** @type {string} */(prop)] = data[prop];

	if (CommonVersionUpdated && (toUpdate != null) && (toUpdate.OnlineSharedSettings != null))
		toUpdate.OnlineSharedSettings.GameVersion = GameVersion;

	if (Object.keys(toUpdate).length > 0)
		ServerAccountUpdate.QueueData(toUpdate);

	PreferenceValidateArousalData(C);

}

/**
 * Initialise the Notifications settings, converting the old boolean types to objects
 * @param {boolean} setting - The old version of the setting
 * @param {NotificationAudioType} audio - The audio setting
 * @param {NotificationAlertType} [defaultAlertType] - The default AlertType to use
 * @returns {NotificationSetting} - The setting to use
 */
function PreferenceInitNotificationSetting(setting, audio, defaultAlertType) {
	const alertType = typeof setting === "boolean" && setting === true ? NotificationAlertType.TITLEPREFIX : defaultAlertType ?? NotificationAlertType.NONE;
	return {
		AlertType: alertType,
		Audio: audio,
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
