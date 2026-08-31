"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<TypedItemData | ModularItemData>} */
function InventoryItemBreastForbiddenChastityBraDrawHook(data, originalFunction) {
	originalFunction();
	if (!DialogFocusItem) return;
	if (data.archetype === ExtendedArchetype.MODULAR && data.currentModule !== "ShockModule") {
		return;
	}

	const { TriggerCount, ShowText, PunishOrgasm, PunishStandup, PunishStruggle } = DialogFocusItem.Property ?? {};

	MainCanvas.textAlign = "right";
	DrawText(AssetTextGet("ShockCount"), 1500, 575, "White", "Gray");
	MainCanvas.textAlign = "left";
	DrawText(`${TriggerCount}`, 1510, 575, "White", "Gray");

	MainCanvas.textAlign = "center";
	ExtendedItemCustomDraw("ResetShockCount", 1635, 550, null, false, false);
	ExtendedItemCustomDraw("TriggerShock", 1635, 625, null, false, false);
	MainCanvas.textAlign = "left";
	ExtendedItemDrawCheckbox(
		"ShowText", 1100, 618, !!ShowText,
		{ text: AssetTextGet("ShowMessageInChat"), textColor: "White", changeWhenLocked: false },
	);
	ExtendedItemDrawCheckbox(
		"PunishOrgasm", 1100, 700, !!PunishOrgasm,
		{ text: AssetTextGet("ForbiddenChastityBraPunishOrgasm"), textColor: "White", changeWhenLocked: false },
	);
	ExtendedItemDrawCheckbox(
		"PunishStandup", 1100, 770, !!PunishStandup,
		{ text: AssetTextGet("ForbiddenChastityBraPunishStandup"), textColor: "White", changeWhenLocked: false },
	);
	ExtendedItemDrawCheckbox(
		"PunishStruggle", 1100, 840, !!PunishStruggle,
		{ text: AssetTextGet("ForbiddenChastityBraPunishStruggle"), textColor: "White", changeWhenLocked: false },
	);
	MainCanvas.textAlign = "center";
}

/** @type {ExtendedItemScriptHookCallbacks.Click<TypedItemData | ModularItemData>} */
function InventoryItemBreastForbiddenChastityBraClickHook(data, originalFunction) {
	if (data.archetype === ExtendedArchetype.MODULAR && data.currentModule !== "ShockModule") {
		originalFunction();
		return;
	}

	const C = CharacterGetCurrent();
	const item = DialogFocusItem;
	if (!C || !item) return;
	if (MouseIn(1635, 550, 225, 55)) {
		ExtendedItemCustomClick("ResetShockCount", InventoryItemNeckAccessoriesCollarShockUnitResetCount, false, false);
		return;
	} else if (MouseIn(1635, 625, 225, 55)) {
		ExtendedItemCustomClick("TriggerShock", () => PropertyShockPublishAction(C, item ), false, false);
		return;
	}
	if (!ExtendedItemPermissionMode) {
		const property = /** @type {ItemProperties} */ (item?.Property);
		if (MouseIn(1100, 618, 64, 64)) {
			ExtendedItemCustomClickAndPush(C, item, "ShowText", () => property.ShowText = !property.ShowText, false, false);
		} else if (MouseIn(1100, 700, 64, 64)) {
			ExtendedItemCustomClickAndPush(C, item, "PunishOrgasm", () => property.PunishOrgasm = !property.PunishOrgasm, false, false);
		} else if (MouseIn(1100, 770, 64, 64)) {
			ExtendedItemCustomClickAndPush(C, item, "PunishStandup", () => property.PunishStandup = !property.PunishStandup, false, false);
		} else if (MouseIn(1100, 840, 64, 64)) {
			ExtendedItemCustomClickAndPush(C, item, "PunishStruggle", () => property.PunishStruggle = !property.PunishStruggle, false, false);
		}
	}
	originalFunction();
}

/**
 * @typedef {{ UpdateTime?: number, CheckTime?: number, LastMessageLen?: number, LastTriggerCount?: number, DisplayCount?: number } & AnimationPersistentData} ForbiddenChastityBraPersistentData
 */

/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ModularItemData | TypedItemData, ForbiddenChastityBraPersistentData>} */
function AssetsItemBreastForbiddenChastityBraScriptDrawHook(data, originalFunction, drawData) {
	const persistentData = drawData.PersistentData();
	/** @type {ItemProperties} */
	const property = (drawData.Item.Property ??= {});
	if (typeof persistentData.UpdateTime !== "number") persistentData.UpdateTime = CommonTime() + 4000;
	if (typeof persistentData.LastMessageLen !== "number") persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
	if (typeof persistentData.CheckTime !== "number") persistentData.CheckTime = CommonTime();
	if (typeof persistentData.DisplayCount !== "number") persistentData.DisplayCount = 0;
	if (typeof persistentData.LastTriggerCount !== "number") persistentData.LastTriggerCount = property.TriggerCount ?? 0;
	if (typeof property.NextShockTime !== "number") property.NextShockTime = 0;
	const canShock = typeof property.ShockLevel === "number";

	// Trigger a check if a new message is detected
	let lastMsgIndex = ChatRoomChatLog.length - 1;
	if (lastMsgIndex >= 0 && ChatRoomChatLog[lastMsgIndex].Time > persistentData.CheckTime)
		persistentData.UpdateTime = Math.min(persistentData.UpdateTime, CommonTime() + 200); // Trigger if the user speaks

	const isTriggered = persistentData.LastTriggerCount < (property.TriggerCount ?? 0);
	const newlyTriggered = isTriggered && persistentData.DisplayCount == 0;
	if (newlyTriggered)
		persistentData.UpdateTime = Math.min(persistentData.UpdateTime, CommonTime());

	if (persistentData.UpdateTime < CommonTime()) {

		if (drawData.C.IsPlayer() && CommonTime() > (drawData.Item.Property.NextShockTime ?? 0)) {
			if (canShock) {
				AssetsItemPelvisObedienceBeltUpdate(drawData, persistentData.CheckTime);
			}
			persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
		}

		// Set CheckTime to last processed chat message time
		persistentData.CheckTime = (lastMsgIndex >= 0 ? ChatRoomChatLog[lastMsgIndex].Time : 0);

		if (persistentData.LastTriggerCount > (property.TriggerCount ?? 0)) persistentData.LastTriggerCount = 0;
		const wasBlinking = property.BlinkState;
		property.BlinkState = wasBlinking && !newlyTriggered ? false : true;
		const timeFactor = isTriggered ? 12 : 1;
		const timeToNextRefresh = (wasBlinking ? 4000 : 1000) / timeFactor;
		persistentData.UpdateTime = CommonTime() + timeToNextRefresh;
		AnimationRequestRefreshRate(drawData.C, (5000 / timeFactor) - timeToNextRefresh);
		AnimationRequestDraw(drawData.C);
	}
}

