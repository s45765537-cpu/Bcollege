"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<TypedItemData | ModularItemData>} */
function InventoryItemBreastForbiddenChastityBraDrawHook(data, originalFunction) {
	originalFunction();
	if (data.archetype === ExtendedArchetype.MODULAR && data.currentModule !== "ShockModule") {
		return;
	}

	MainCanvas.textAlign = "right";
	DrawText(DialogFindPlayer("ShockCount"), 1500, 575, "White", "Gray");
	MainCanvas.textAlign = "left";
	DrawText(`${DialogFocusItem.Property.TriggerCount}`, 1510, 575, "White", "Gray");

	DrawCheckbox(1100, 618, 64, 64, DialogFindPlayer("ShowMessageInChat"), DialogFocusItem.Property.ShowText, ExtendedItemPermissionMode, "White");

	MainCanvas.textAlign = "center";
	ExtendedItemCustomDraw("ResetShockCount", 1635, 550);
	ExtendedItemCustomDraw("TriggerShock", 1635, 625);
	MainCanvas.textAlign = "left";
	DrawCheckbox(1100, 700, 64, 64, DialogFindPlayer("ForbiddenChastityBraPunishOrgasm"), DialogFocusItem.Property.PunishOrgasm, ExtendedItemPermissionMode, "White");
	DrawCheckbox(1100, 770, 64, 64, DialogFindPlayer("ForbiddenChastityBraPunishStandup"), DialogFocusItem.Property.PunishStandup, ExtendedItemPermissionMode, "White");
	DrawCheckbox(1100, 840, 64, 64, DialogFindPlayer("ForbiddenChastityBraPunishStruggle"), DialogFocusItem.Property.PunishStruggle, ExtendedItemPermissionMode, "White");
	MainCanvas.textAlign = "center";
}

/** @type {ExtendedItemScriptHookCallbacks.Click<TypedItemData | ModularItemData>} */
function InventoryItemBreastForbiddenChastityBraClickHook(data, originalFunction) {
	if (data.archetype === ExtendedArchetype.MODULAR && data.currentModule !== "ShockModule") {
		originalFunction();
		return;
	}

	const C = CharacterGetCurrent();
	if (MouseIn(1635, 550, 225, 55)) {
		ExtendedItemCustomClick("ResetShockCount", InventoryItemNeckAccessoriesCollarShockUnitResetCount);
		return;
	} else if (MouseIn(1635, 625, 225, 55)) {
		ExtendedItemCustomClick("TriggerShock", PropertyShockPublishAction);
		return;
	}
	if (!ExtendedItemPermissionMode) {
		if (MouseIn(1100, 618, 64, 64)) {
			DialogFocusItem.Property.ShowText = !DialogFocusItem.Property.ShowText;
			ChatRoomCharacterItemUpdate(C, data.asset.Group.Name);
		} else if (MouseIn(1100, 700, 64, 64)) {
			DialogFocusItem.Property.PunishOrgasm = !DialogFocusItem.Property.PunishOrgasm;
			ChatRoomCharacterItemUpdate(C, data.asset.Group.Name);
		} else if (MouseIn(1100, 770, 64, 64)) {
			DialogFocusItem.Property.PunishStandup = !DialogFocusItem.Property.PunishStandup;
			ChatRoomCharacterItemUpdate(C, data.asset.Group.Name);
		} else if (MouseIn(1100, 840, 64, 64)) {
			DialogFocusItem.Property.PunishStruggle = !DialogFocusItem.Property.PunishStruggle;
			ChatRoomCharacterItemUpdate(C, data.asset.Group.Name);
		}
	}
	originalFunction();
}

/**
 * @typedef {{ UpdateTime?: number, CheckTime?: number, LastMessageLen?: number, LastTriggerCount?: number, DisplayCount?: number }} ForbiddenChastityBraPersistentData
 */

/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ModularItemData | TypedItemData, ForbiddenChastityBraPersistentData>} */
function AssetsItemBreastForbiddenChastityBraScriptDrawHook(data, originalFunction, drawData) {
	const persistentData = drawData.PersistentData();
	/** @type {ItemProperties} */
	const property = (drawData.Item.Property = drawData.Item.Property || {});
	if (typeof persistentData.UpdateTime !== "number") persistentData.UpdateTime = CommonTime() + 4000;
	if (typeof persistentData.LastMessageLen !== "number") persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
	if (typeof persistentData.CheckTime !== "number") persistentData.CheckTime = CommonTime();
	if (typeof persistentData.DisplayCount !== "number") persistentData.DisplayCount = 0;
	if (typeof persistentData.LastTriggerCount !== "number") persistentData.LastTriggerCount = property.TriggerCount;
	if (typeof property.NextShockTime !== "number") property.NextShockTime = 0;
	const canShock = typeof property.ShockLevel === "number";

	// Trigger a check if a new message is detected
	let lastMsgIndex = ChatRoomChatLog.length - 1;
	if (lastMsgIndex >= 0 && ChatRoomChatLog[lastMsgIndex].Time > persistentData.CheckTime)
		persistentData.UpdateTime = Math.min(persistentData.UpdateTime, CommonTime() + 200); // Trigger if the user speaks

	const isTriggered = persistentData.LastTriggerCount < property.TriggerCount;
	const newlyTriggered = isTriggered && persistentData.DisplayCount == 0;
	if (newlyTriggered)
		persistentData.UpdateTime = Math.min(persistentData.UpdateTime, CommonTime());

	if (persistentData.UpdateTime < CommonTime()) {

		if (drawData.C.IsPlayer() && CommonTime() > drawData.Item.Property.NextShockTime) {
			if (canShock) {
				AssetsItemPelvisObedienceBeltUpdate(drawData, persistentData.CheckTime);
			}
			persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
		}

		// Set CheckTime to last processed chat message time
		persistentData.CheckTime = (lastMsgIndex >= 0 ? ChatRoomChatLog[lastMsgIndex].Time : 0);

		if (persistentData.LastTriggerCount > property.TriggerCount) persistentData.LastTriggerCount = 0;
		const wasBlinking = property.BlinkState;
		property.BlinkState = wasBlinking && !newlyTriggered ? false : true;
		const timeFactor = isTriggered ? 12 : 1;
		const timeToNextRefresh = (wasBlinking ? 4000 : 1000) / timeFactor;
		persistentData.UpdateTime = CommonTime() + timeToNextRefresh;
		AnimationRequestRefreshRate(drawData.C, (5000 / timeFactor) - timeToNextRefresh);
		AnimationRequestDraw(drawData.C);
	}
}

