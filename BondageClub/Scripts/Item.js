"use strict";

/**
 * Detects specific voice commands from a chat message.
 *
 * This is shared by most voice-detection items that pass in their configured trigger values,
 * and gives back the matching indexes of those.
 *
 * @param {string} msg
 * @param {readonly string[]} TriggerValues
 * @returns {number[]}
 */
function ItemModuleVoiceCommandDetect(msg, TriggerValues) {
	/** @type {number[]} */
	const commandsReceived = [];

	// If the message is OOC, just return immediately
	if (msg.startsWith('(')) return commandsReceived;

	for (const [i, triggervalue] of TriggerValues.entries()) {
		// Don't execute arbitrary regex
		let regexString = triggervalue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

		// Allow `*` wildcard, and normalize case
		regexString = regexString.replace(/\*/g, ".*");
		regexString = regexString.toUpperCase();

		const nonLatinCharRegex = new RegExp('^([^\\x20-\\x7F]|\\\\.\\*)+$');
		let triggerRegex;

		// In general, in most of the Asian language, the full sentence will be considered as one whole word
		// Because how regex consider word boundaries to be position between \w -> [A-Za-z0-9_] and \W.

		// So if commands are set to those languages, the command will never be triggered.
		// Or if the command is not a word
		// This enhancement should allow Asian language commands, and also emoji/special characters
		// (e.g. A symbol such as ↑ or ↓, Languages in CJK group such as Chinese, Japanese, and Korean.)
		// This should be a fun addition to boost the user's experience.
		if (nonLatinCharRegex.test(regexString)) {
			triggerRegex = new RegExp(regexString);
		} else {
			triggerRegex = new RegExp(`\\b${regexString}\\b`);
		}
		const success = triggerRegex.test(msg);

		if (success) commandsReceived.push(i);
	}
	return commandsReceived;
}

/**
 * Handles the generic processing of voice commands.
 *
 * This is used by most voice detection items to get back a list of triggers
 * from the last time the chat log was processed.
 *
 * @param {Character} C
 * @param {Item} item
 * @param {number} LastTime
 * @param {readonly VoiceTriggerType[]} VoiceTriggers
 * @param {readonly string[]} TriggerValues
 * @returns {VoiceTriggerType[]}
 */
function ItemModuleVoiceCommandHandle(C, item, LastTime, VoiceTriggers, TriggerValues) {
	/** @type {VoiceTriggerType[]} */
	const triggers = [];
	if (!item) return triggers;

	// Search from latest message backwards, allowing early exit
	for (let CH = ChatRoomChatLog.length - 1; CH >= 0; CH--) {
		const logEntry = ChatRoomChatLog[CH];

		// Messages are in order, no need to keep looping
		if (logEntry.Time <= LastTime) break;

		// Skip messages from unauthorized users
		const sender = ChatRoomCharacter.find(c => c.MemberNumber === logEntry.SenderMemberNumber);
		if (!sender || !ServerChatRoomGetAllowItem(sender, C)) continue;
		if (item.Property?.AccessMode === ItemVulvaFuturisticVibratorAccessMode.PROHIBIT_SELF && logEntry.SenderMemberNumber === C.MemberNumber) continue;
		if (item.Property?.AccessMode === ItemVulvaFuturisticVibratorAccessMode.LOCK_MEMBER_ONLY && logEntry.SenderMemberNumber !== item.Property.LockMemberNumber) continue;

		let msg = ItemModuleVoiceCommandDetect(logEntry.Chat.toUpperCase(), TriggerValues);

		if (msg.length > 0) {
			for (let i = 0; i < msg.length; i++) {
				triggers.push(VoiceTriggers[msg[i]]);
			}
		}
	}
	return triggers;
}


/**
 * @param {Character} C
 * @param {Item} item
 * @param {number} shockCooldown
 * @param {AssetGroupItemName[]} tamperZones
 */
function ItemModulePunishCheck(C, item, shockCooldown, tamperZones) {
	const { PunishOrgasm, PunishStruggle, PunishStruggleOther, PunishStandup, NextShockTime = 0} = item.Property ??= {};
	if ((CommonTime() > NextShockTime) && PunishOrgasm && C.ArousalSettings && C.ArousalSettings.OrgasmStage > 1) {
		// Punish the player if they orgasm
		item.Property.NextShockTime = CurrentTime + shockCooldown;
		return "Orgasm";
	} else if (PunishStruggleOther && C.FocusGroup && StruggleProgressPrevItem != null && StruggleProgressStruggleCount > 0 && (StruggleProgress > 3 || StruggleLockPickProgressCurrentTries > 0)) {
		// Punish the player if they Struggle with any item
		return "StruggleOther";
	} else if (PunishStruggle && StruggleProgressPrevItem != null && StruggleProgressStruggleCount > 0 && (StruggleProgress > 3 || StruggleLockPickProgressCurrentTries > 0)) {
		if (tamperZones.some(zone => C.FocusGroup?.Name === zone))
			return "Struggle";
	} else if (PunishStandup && C.CanKneel(PoseChangeStatus.NEVER_WITHOUT_AID) && C.IsStanding() && ServerPlayerIsInChatRoom() && shockCooldown < CommonTime()) {
		// Punish the player if they stand up
		return "StandUp";
	}
	return null;
}

/**
 * Namespace for constructing {@link Item} objects.
 */
var AppearanceItem = {
	/**
	 * Construct an item from the passed asset
	 * @param {Asset} asset The asset in question
	 * @param {null | Item.Options} options Further options
	 * @returns {Item} The new item
	 */
	fromAsset: function fromAsset(asset, options=null) {
		options ??= {};
		return {
			Asset: asset,
			Color: ServerParseColor(asset, options.color, asset.Group.ColorSchema),
			Difficulty: options.difficulty ?? 0,
			Property: options.property ? CommonCloneDeep(options.property) : {},
			Craft: options.craft ? CommonCloneDeep(options.craft) : undefined,
		};
	},

	/**
	 * Construct an item from the passed group- and asset names
	 * @param {AssetGroupName} groupName The asset's group name
	 * @param {string} assetName The asset's name
	 * @param {null | Item.Options} options Further options
	 * @returns {null | Item} The new item or `null` if no matching asset can be found
	 */
	fromName: function fromName(groupName, assetName, options=null) {
		const asset = AssetGet("Female3DCG", groupName, assetName);
		if (!asset) {
			return null;
		} else {
			return AppearanceItem.fromAsset(asset, options);
		}
	},
};

/**
 * Dummy character for {@link ItemPropertiesDecompress} validation
 * @type {null | Character}
 */
let ItemPropertiesDummy = null;

/**
 * Compress the passed item's properties in preparation for {@link ItemBundle} creation.
 * @param {Item} item The item whose properties are to be minimized
 * @param {null | { omit?: Iterable<keyof ItemProperties> }} options
 * @returns {ItemPropertiesMinimized | undefined} The minimized item properties
 */
function ItemPropertiesCompress(item, options=null) {
	options ??= {};
	const propertyOmit = new Set(options.omit ?? []);
	if (!item?.Property) {
		return undefined;
	}

	// Initialize it with the known set of (legal) fully user-customizable properties
	const allowedProperties = new Set(ExtendedItemInitPropertyIgnore);
	// FIXME: Temporary backwards compatiblity.
	// Either port these properties over to BC or switch them out for a pre-existing BC equivalent.
	// @ts-expect-error
	allowedProperties.add("LayerOverrides"); // LSCG as of v0.8.17
	// @ts-expect-error
	allowedProperties.add("wceOverrideHide"); // WCE as of v6.3.19

	/** @type {ItemProperties} */
	const baseline = {};
	if (item.Asset.Extended) {
		for (const option of ExtendedItemGatherOptions(item)) {
			switch (option.OptionType) {
				case "VariableHeightOption":
					allowedProperties.add("OverrideHeight");
					break;
				case "TypedItemOption":
				case "ModularItemOption":
				case "VibratingItemOption":
					allowedProperties.add("TypeRecord");
					break;
			}
			Object.assign(baseline, option.Property ?? {}, option.ParentData.baselineProperty ?? {});
			for (const key of CommonKeys(option.ParentData.baselineProperty ?? {})) {
				if (!propertyOmit.has(key)) {
					allowedProperties.add(key);
				}
			}
		}
	}

	// Basic property validation is conducted later on via CraftingValidate
	/** @type {ItemPropertiesMinimized} */
	const ret = {};
	for (const key of allowedProperties) {
		switch (key) {
			case "TypeRecord": {
				let allDefault = true;
				/** @type {TypeRecord} */
				const typeRecord = {};
				for (const [k, v] of Object.entries(item.Property[key] ?? {})) {
					if (v) {
						allDefault = false;
						typeRecord[k] = v;
					} else {
						// TODO: Remove this `else` branch once R132 is live and rely on absent values implictly being 0
						// This is needed due to `ModularItemInit()` failing to handle partial typerecords prior to this commit (<= R131)
						typeRecord[k] = v;
					}
				}
				if (!allDefault) {
					ret[key] = typeRecord;
				}
				break;
			}
			default:
				if (item.Property[key] !== baseline[key]) {
					// @ts-expect-error
					ret[key] = item.Property[key];
				}
				break;
		}
	}
	return Object.values(ret).every(i => i === undefined) ? undefined : ret;
}

/**
 * Decompress the passed item budle properties in preparation for {@link Item} creation.
 * @param {Item} item The final item in which the properties will end up
 * @param {undefined | ItemPropertiesMinimized} properties The minimized item properties
 * @returns {ItemProperties} The maximized item properties
 */
function ItemPropertiesDecompress(item, properties) {
	// For the sake of potential backwards compatibility issues both minimized and maximized properties must be handled
	/** @type {ItemPropertiesMinimized | ItemProperties} */
	const propertiesUnsanitized = properties ?? {};

	const C = ItemPropertiesDummy ??= CharacterLoadSimple("ItemBundleDummy");
	Object.assign(item.Property, propertiesUnsanitized);
	if (item.Asset.Extended) {
		if (propertiesUnsanitized.TypeRecord) {
			ExtendedItemSetOptionByRecord(C, item, propertiesUnsanitized.TypeRecord, { push: false, refresh: false });
		} else {
			ExtendedItemInit(C, item, false, false);
		}
	}
	return item.Property;
}
