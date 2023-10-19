"use strict";

/** @type {ExtendedItemCallbacks.Load} */
function InventoryItemMiscMistressPadlockLoad() {
}

/** @type {ExtendedItemCallbacks.Draw} */
function InventoryItemMiscMistressPadlockDraw() {
	DrawAssetPreview(1387, 225, DialogFocusItem.Asset);
	DrawText(DialogFindPlayer(DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Intro"), 1500, 600, "white", "gray");
	let LockMemberNumber = (DialogFocusSourceItem != null && DialogFocusSourceItem.Property != null && DialogFocusSourceItem.Property.LockMemberNumber != null) ? DialogFocusSourceItem.Property.LockMemberNumber : -1;
	if (typeof LockMemberNumber === "string") {
		LockMemberNumber = Number.parseInt(LockMemberNumber);
	}
	if (LockMemberNumber >= 0) {
		DrawText(`${DialogFindPlayer("LockMemberNumber")} ${LockMemberNumber}`, 1500, 700, "white", "gray");
	}
}

/** @type {ExtendedItemCallbacks.Click} */
function InventoryItemMiscMistressPadlockClick() {
	if (MouseIn(1885, 25, 90, 90)) {
		DialogLeaveFocusItem();
	}
}
