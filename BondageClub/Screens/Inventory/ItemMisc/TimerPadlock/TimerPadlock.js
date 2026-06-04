"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscTimerPadlockDrawHook(data, originalFunction) {
	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!item || !lockItem) {
		return;
	}

	if (typeof item.Property?.RemoveTimer !== "number" || item.Property.RemoveTimer < CurrentTime) {
		DialogLeaveFocusItem();
		return;
	}

	originalFunction();
	DrawText(AssetTextGet(lockItem.Asset.Group.Name + lockItem.Asset.Name + "Intro"), 1500, 600, "white", "gray");
	DrawText(InterfaceTextGet("TimerLeft") + " " + TimerToString(item.Property.RemoveTimer - CurrentTime), 1500, 500, "white", "gray");

	if (typeof item.Property.LockMemberNumber === "number")
		DrawText(InterfaceTextGet("LockMemberNumber") + " " + item.Property.LockMemberNumber.toString(), 1500, 700, "white", "gray");

	if ((Player.MemberNumber == item.Property.LockMemberNumber) && Player.CanInteract()) {
		MainCanvas.textAlign = "left";
		DrawButton(1100, 836, 64, 64, "", "White", (item.Property.RemoveItem) ? "Icons/Checked.png" : "");
		DrawText(InterfaceTextGet("RemoveItemWithTimer"), 1200, 868, "white", "gray");
		MainCanvas.textAlign = "center";
	} else {
		DrawText(InterfaceTextGet(item.Property.RemoveItem ? "WillRemoveItemWithTimer" : "WontRemoveItemWithTimer"), 1500, 868, "white", "gray");
	}
	if (Player.CanInteract()) DrawButton(1350, 910, 300, 65, AssetTextGet("RestartTimer"), "White");
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemMiscTimerPadlockClickHook(data, originalFunction) {
	originalFunction();
	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!C || !C.FocusGroup || !item || !lockItem) {
		return;
	}
	if (!Player.CanInteract()) return;

	if (MouseIn(1100, 836, 64, 64) && Player.MemberNumber === item.Property?.LockMemberNumber) {
		item.Property.RemoveItem = !item.Property.RemoveItem;
		ChatRoomCharacterItemUpdate(C);
	}
	if (MouseIn(1350, 910, 300, 65)) {
		InventoryItemMiscTimerPadlockReset(C, item, lockItem);
		DialogLeaveFocusItem();
	}
}

/**
 *
 * @param {Character} C
 * @param {Item} item
 * @param {Item} lockItem
 */
function InventoryItemMiscTimerPadlockReset(C, item, lockItem) {
	item.Property ??= {};
	if (lockItem.Asset.RemoveTimer > 0) item.Property.RemoveTimer = Math.round(CurrentTime + (lockItem.Asset.RemoveTimer * 1000));

	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacter(C)
		.focusGroup(item.Asset.Group.Name)
		.build();
	ChatRoomPublishCustomAction("TimerRestart", true, Dictionary);
}
