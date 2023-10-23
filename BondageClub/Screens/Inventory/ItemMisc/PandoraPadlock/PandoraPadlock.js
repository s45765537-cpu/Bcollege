"use strict";

/** @type {ExtendedItemCallbacks.Load} */
function InventoryItemMiscPandoraPadlockLoad() {
}

/** @type {ExtendedItemCallbacks.Draw} */
function InventoryItemMiscPandoraPadlockDraw() {
	return InventoryItemMiscMistressPadlockDraw();
}

/** @type {ExtendedItemCallbacks.Click} */
function InventoryItemMiscPandoraPadlockClick() {
	return InventoryItemMiscMistressPadlockClick();
}
