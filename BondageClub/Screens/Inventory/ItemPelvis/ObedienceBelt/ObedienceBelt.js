"use strict";

/** @type {ExtendedItemCallbacks.Load} */
function InventoryItemPelvisObedienceBelts1Load() {
}

/** @type {ExtendedItemCallbacks.Draw} */
function InventoryItemPelvisObedienceBelts1Draw() {
	// Draw the header and item
	ExtendedItemDrawHeader(1387, 125);

	MainCanvas.textAlign = "left";
	ExtendedItemDrawCheckbox(
		"ShowText", 1100, 590, DialogFocusItem.Property.ShowText,
		{ text: DialogFindPlayer("ObedienceBeltShowChatMessage"), textColor: "White", changeWhenLocked: false },
	);
	ExtendedItemDrawCheckbox(
		"PunishOrgasm", 1100, 660, DialogFocusItem.Property.PunishOrgasm,
		{ text: DialogFindPlayer("ObedienceBeltPunishOrgasm"), textColor: "White", changeWhenLocked: false },
	);
	ExtendedItemDrawCheckbox(
		"PunishStandup", 1100, 730, DialogFocusItem.Property.PunishStandup,
		{ text: DialogFindPlayer("ObedienceBeltPunishStandup"), textColor: "White", changeWhenLocked: false },
	);
	MainCanvas.textAlign = "center";
	ExtendedItemCustomDraw("TriggerShock", 1635, 625, null, false, false);
}

/** @type {ExtendedItemCallbacks.Click} */
function InventoryItemPelvisObedienceBelts1Click() {
	if (MouseIn(1885, 25, 90, 90)) {
		InventoryItemPelvisObedienceBelts1Exit();
		return;
	}

	const C = CharacterGetCurrent();
	const property = DialogFocusItem.Property;
	if (MouseIn(1100, 590, 64, 64)) {
		ExtendedItemCustomClickAndPush(C, DialogFocusItem, "ShowText", () => property.ShowText = !property.ShowText, false, false);
	} else if (MouseIn(1100, 660, 64, 64)) {
		ExtendedItemCustomClickAndPush(C, DialogFocusItem, "PunishOrgasm", () => property.PunishOrgasm = !property.PunishOrgasm, false, false);
	} else if (MouseIn(1100, 730, 64, 64)) {
		ExtendedItemCustomClickAndPush(C, DialogFocusItem, "PunishStandup", () => property.PunishStandup = !property.PunishStandup, false, false);
	} else if (MouseIn(1387, 800, 225, 55)) {
		ExtendedItemCustomClick("TriggerShock", PropertyShockPublishAction, false, false);
	}
}

/** @type {ExtendedItemCallbacks.Exit} */
function InventoryItemPelvisObedienceBelts1Exit() {
	ExtendedItemSubscreen = null;
}

/**
 * @param {Item} Item
 * @param {Character} C
 */
function InventoryObedienceBeltCheckPunish(Item, C) {
	const { PunishOrgasm, PunishStandup, PunishStruggle } = Item.Property;
	if (Item.Property.NextShockTime - CurrentTime <= 0 && PunishOrgasm && C.ArousalSettings && C.ArousalSettings.OrgasmStage > 1) {
		// Punish the player if they orgasm
		Item.Property.NextShockTime = CurrentTime + FuturisticChastityBeltShockCooldownOrgasm; // Difficult to have two orgasms in 10 seconds
		return "Orgasm";
	} else if (PunishStandup && FuturisticTrainingBeltStandUpFlag) {
		// Punish the player if they stand up
		FuturisticTrainingBeltStandUpFlag = false;
		return "StandUp";
	} else if (PunishStruggle && C.FocusGroup && StruggleProgressPrevItem != null && StruggleProgressStruggleCount > 0 && (StruggleProgress > 3 || StruggleLockPickProgressCurrentTries > 0)) {
		// Punish the player if they Struggle
		return "Struggle";
	}
	return "";
}

/**
 * @param {DynamicScriptCallbackData<ObedienceBeltPersistentData>} data
 * @param {number} LastTime
 */
function AssetsItemPelvisObedienceBeltUpdate(data, LastTime) {
	let Item = data.Item;
	let C = data.C;

	if (!Item.Property) return;

	const punishment = InventoryObedienceBeltCheckPunish(Item, C);
	switch (punishment) {
		case "Orgasm":
			PropertyShockPublishAction(C, Item, true);
			break;
		case "StandUp":
			PropertyShockPublishAction(C, Item, true);
			PoseSetActive(Player, "Kneel");
			ServerSend("ChatRoomCharacterPoseUpdate", { Pose: Player.ActivePose });
			break;
		case "Struggle":
			// NOTE: The `Struggle` case is currently unused by the obedience belt,
			// but is used by the forbidden chastity bra/belt
			PropertyShockPublishAction(C, Item, true);
			StruggleProgressStruggleCount = 0;
			StruggleProgress = 0;
			DialogLeaveDueToItem = true;
			break;
	}
}

/**
 * @typedef {{ UpdateTime?: number, LastMessageLen?: number, CheckTime?: number }} ObedienceBeltPersistentData
 */

/** @type {ExtendedItemCallbacks.ScriptDraw<ObedienceBeltPersistentData>} */
function AssetsItemPelvisObedienceBeltScriptDraw(data) {
	const persistentData = data.PersistentData();
	if (typeof persistentData.UpdateTime !== "number") persistentData.UpdateTime = CommonTime() + 4000;
	if (typeof persistentData.LastMessageLen !== "number") persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
	if (typeof persistentData.CheckTime !== "number") persistentData.CheckTime = CommonTime();

	if (!data.Item.Property) data.Item.Property = {};
	if (typeof data.Item.Property.NextShockTime !== "number") data.Item.Property.NextShockTime = 0;

	const moduleTypes = ModularItemDeconstructType(data.Item.Property.Type) || [];
	const canShock = moduleTypes.includes("s1");

	// Trigger a check if a new message is detected
	let lastMsgIndex = ChatRoomChatLog.length - 1;
	if (lastMsgIndex >= 0 && ChatRoomChatLog[lastMsgIndex].Time > persistentData.CheckTime)
		persistentData.UpdateTime = Math.min(persistentData.UpdateTime, CommonTime() + 200); // Trigger if the user speaks

	if (persistentData.UpdateTime < CommonTime() && data.C == Player) {

		if (CommonTime() > data.Item.Property.NextShockTime) {
			if (canShock) {
				AssetsItemPelvisObedienceBeltUpdate(data, persistentData.CheckTime);
			}
			persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
		}

		// Set CheckTime to last processed chat message time
		persistentData.CheckTime = (lastMsgIndex >= 0 ? ChatRoomChatLog[lastMsgIndex].Time : 0);
	}
}

/** @type {ExtendedItemScriptHookCallbacks.AfterDraw<TextItemData, ObedienceBeltPersistentData>} */
function AssetsItemPelvisObedienceBeltAfterDrawHook(data, originalFunction, {
	C, A, CA, X, Y, drawCanvas, drawCanvasBlink, AlphaMasks, L, Color
}) {
	if (L !== "_Text") return;

	// Fetch the text property and assert that it matches the character
	// and length requirements
	TextItem.Init(data, C, CA, false);
	const text = CA.Property.Text;

	// Prepare a temporary canvas to draw the text to
	const height = 60;
	const width = 130;
	const tempCanvas = AnimationGenerateTempCanvas(C, A, width, height);
	const ctx = tempCanvas.getContext("2d");

	DynamicDrawTextArc(text, ctx, width / 2, 42, {
		fontSize: 28,
		fontFamily: data.font,
		width,
		color: Color,
		angle: Math.PI,
		direction: DynamicDrawTextDirection.ANTICLOCKWISE,
		textCurve: DynamicDrawTextCurve.SMILEY,
		radius: 300,
	});

	// Draw the temporary canvas onto the main canvas
	drawCanvas(tempCanvas, X + 59, Y + 29, AlphaMasks);
	drawCanvasBlink(tempCanvas, X + 59, Y + 29, AlphaMasks);
}
