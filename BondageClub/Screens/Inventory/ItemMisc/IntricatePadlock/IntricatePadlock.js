"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscIntricatePadlockDrawHook(data, originalFunction) {
	originalFunction();

	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!item || !lockItem) {
		return;
	}

	DrawText(AssetTextGet(lockItem.Asset.Group.Name + lockItem.Asset.Name + "Intro"), 1500, 600, "white", "gray");
	if (typeof item.Property?.LockMemberNumber === "number")
		DrawText(InterfaceTextGet("LockMemberNumber") + " " + item.Property.LockMemberNumber.toString(), 1500, 700, "white", "gray");
}
