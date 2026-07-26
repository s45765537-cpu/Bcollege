"use strict";

/** @type {VoiceTriggerType[]} */
var InventoryItemVulvaTechnoChastityCageVoiceTriggers = ["Increase", "Decrease", "Disable", "Shock"];
/** @type {string[]} */
var InventoryItemVulvaTechnoChastityCageVoiceTriggerValues = [];

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemVulvaTechnoChastityCageDrawHook(data, OriginalFunction) {
	OriginalFunction();
	const item = DialogFocusItem;
	if (!item) return;
	//Base screen
	if (data.currentModule === ModularItemBase) {
		InventoryItemPelvisModularChastityBeltDrawBase(item, 75);
	}

	if (data.currentModule === "Intensity") {
		InventoryItemPelvisModularChastityBeltDrawIntensity(item, 75);
	}

	if (data.currentModule === "ShockModule") {
		InventoryItemPelvisModularChastityBeltDrawShockModule(item, 0);
	}

	if (data.currentModule === "VoiceControl") {
		InventoryItemVulvaChastityCageDrawVoiceControl(item, 0);
	} else {
		InventoryItemVulvaTechnoChastityCageDrawVoiceControlCleanup();
	}
}

/**
 * @type {ExtendedItemScriptHookCallbacks.Click<ModularItemData>}
 */
function InventoryItemVulvaTechnoChastityCageClickHook(data, OriginalFunction) {
	const C = CharacterGetCurrent();
	const item = DialogFocusItem;
	if (!C || !item) return;

	if (data.currentModule === "Intensity") {
		InventoryItemPelvisModularChastityBeltClickIntensity(C, item, 75);
	}

	if (data.currentModule === "ShockModule") {
		InventoryItemPelvisModularChastityBeltClickShockModule(C, item, 0);
	}

	if (data.currentModule === "VoiceControl") {
		InventoryItemVulvaTechnoChastityCageClickVoiceControl(C, item, 0);
	}

	OriginalFunction();
}

/**
 * @param {Item} item
 * @param {number} _offset //How many pixels down will the UI be shifted
 */
function InventoryItemVulvaChastityCageDrawVoiceControl(item, _offset) {
	//Create inputs
	item.Property ??= {};
	if (!item.Property.TriggerValues) item.Property.TriggerValues = CommonConvertArrayToString(InventoryItemVulvaTechnoChastityCageVoiceTriggers);
	InventoryItemVulvaTechnoChastityCageVoiceTriggerValues = item.Property.TriggerValues.split(',');
	// Only create the inputs if the zone isn't blocked
	InventoryItemVulvaTechnoChastityCageVoiceTriggers.forEach((trigger, i) => {
		const input = ElementCreateInput("TechnoChastityCage" + trigger, "text", "", "10");
		if (input) input.setAttribute("placeholder", InventoryItemVulvaTechnoChastityCageVoiceTriggerValues[i]);
	});

	InventoryItemVulvaTechnoChastityCageVoiceTriggers.forEach((trigger, i) => {
		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet("ModularChastityBelt" + trigger), 1480, 550 + i*60 + _offset, "white", "gray");
		MainCanvas.textAlign = "center";
		ElementPosition("TechnoChastityCage" + trigger, 1625, 550 + i*60 + _offset, 225, 50);
	});

	// Draw the save button
	ExtendedItemCustomDraw("FuturisticVibratorSaveVoiceCommands", 1510, 550-27 + InventoryItemVulvaTechnoChastityCageVoiceTriggers.length*60 + _offset, null, false, false);

	// Draw the BackNext button
	DrawBackNextButton(1260, 550-27 + InventoryItemVulvaTechnoChastityCageVoiceTriggers.length*60 + _offset, 225, 50, AssetTextGet("FuturisticVibratorPermissions" + (item.Property.AccessMode ?? "")), "White", "",
		() => AssetTextGet("FuturisticVibratorPermissions" + InventoryItemVulvaFuturisticVibratorPreviousAccessMode(item.Property?.AccessMode ?? "")),
		() => AssetTextGet("FuturisticVibratorPermissions" + InventoryItemVulvaFuturisticVibratorNextAccessMode(item.Property?.AccessMode ?? ""))
	);
}

function InventoryItemVulvaTechnoChastityCageDrawVoiceControlCleanup() {
	InventoryItemVulvaTechnoChastityCageVoiceTriggers.forEach(i => ElementRemove(`TechnoChastityCage${i}`));
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<ModularItemData>} */
function InventoryItemVulvaTechnoChastityCageExitHook(data, originalFunction) {
	InventoryItemVulvaTechnoChastityCageDrawVoiceControlCleanup();
}

/**
 * @param {Character} C
 * @param {Item} item
 * @param {number} _offset //How many pixels down will the UI be shifted
 */
function InventoryItemVulvaTechnoChastityCageClickVoiceControl(C, item, _offset){
	//Click Save
	if (MouseIn(1510, 550-27 + InventoryItemVulvaTechnoChastityCageVoiceTriggers.length*60 + _offset, 225, 55)) {
		ExtendedItemCustomClick("FuturisticVibratorSaveVoiceCommands", () => InventoryItemVulvaChastityCageVoiceControlClickSet(C, item), false, false);
		return;
	}

	//Click BackNext
	if (MouseIn(1260, 550-27 + InventoryItemVulvaTechnoChastityCageVoiceTriggers.length*60 + _offset, 225, 55)) {
		if (MouseX < 1260 + (225 / 2)) {
			ExtendedItemCustomClick("", () => InventoryItemVulvaTechnoChastityCageVoicePrevious(C, item), false, false);
		} else {
			ExtendedItemCustomClick("", () => InventoryItemVulvaTechnoChastityCageVoiceNext(C, item), false, false);
		}
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemVulvaChastityCageVoiceControlClickSet(C, item) {
	let triggerValuesTemp = [];
	for (let I = 0; I < InventoryItemVulvaTechnoChastityCageVoiceTriggers.length; I++) {
		const triggerValue = ElementValue("TechnoChastityCage" + InventoryItemVulvaTechnoChastityCageVoiceTriggers[I]);
		const value = triggerValue !== "" ? triggerValue : InventoryItemVulvaTechnoChastityCageVoiceTriggerValues[I];
		triggerValuesTemp.push(value);
	}

	InventoryItemVulvaTechnoChastityCageVoiceTriggerValues = triggerValuesTemp;

	const temp = CommonConvertArrayToString(InventoryItemVulvaTechnoChastityCageVoiceTriggerValues);

	if (temp != "" && typeof temp === "string") {
		item.Property ??= {};
		item.Property.TriggerValues = temp;
		if (ServerPlayerIsInChatRoom()) {
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.destinationCharacter(C)
				.asset(item.Asset, "AssetName", item.Craft && item.Craft.Name)
				.build();
			ChatRoomPublishCustomAction("FuturisticVibratorSaveVoiceCommandsAction", true, Dictionary);
		}
		DialogLeave();
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 * @returns
 */
function InventoryItemVulvaTechnoChastityCageVoicePrevious(C, item) {
	InventoryItemVulvaFuturisticVibratorSetAccessMode(C, item, InventoryItemVulvaFuturisticVibratorPreviousAccessMode(item.Property?.AccessMode ?? ""));
}

/**
 * @param {Character} C
 * @param {Item} item
 * @returns
 */
function InventoryItemVulvaTechnoChastityCageVoiceNext(C, item) {
	InventoryItemVulvaFuturisticVibratorSetAccessMode(C, item, InventoryItemVulvaFuturisticVibratorNextAccessMode(item.Property?.AccessMode ?? ""));
}

/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ModularItemData, ModularChastityBeltPersistentData>} */
function InventoryItemVulvaChastityCageScriptDrawHook(data, originalFunction, drawData) {
	InventoryItemPelvisModularChastityBeltScriptDrawHookHandler(data, drawData, InventoryItemVulvaTechnoChastityCageVoiceTriggers);
}
