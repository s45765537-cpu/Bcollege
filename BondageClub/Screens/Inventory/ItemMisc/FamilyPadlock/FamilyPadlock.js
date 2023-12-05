"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscFamilyPadlockDrawHook(data, originalFunction) {
	InventoryItemMiscOwnerPadlockDrawHook(data, originalFunction);
	if (LogQuery("BlockFamilyKey", "OwnerRule"))
		DrawText(DialogFindPlayer("ItemMiscFamilyPadlockDetailNoKey"), 1500, 900, "pink", "gray");
}
