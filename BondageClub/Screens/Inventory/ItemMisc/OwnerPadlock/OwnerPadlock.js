"use strict";


/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscOwnerPadlockDrawHook(data, originalFunction) {
	originalFunction();

	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!C || !C.FocusGroup || !item || !lockItem) {
		return;
	}

	DrawText(AssetTextGet(lockItem.Asset.Group.Name + lockItem.Asset.Name + "Intro"), 1500, 600, "white", "gray");
	if (typeof item.Property?.LockMemberNumber === "number")
		DrawText(InterfaceTextGet("LockMemberNumber") + " " + item.Property.LockMemberNumber.toString(), 1500, 700, "white", "gray");

	let msg = AssetTextGet(lockItem.Asset.Group.Name + lockItem.Asset.Name + "Detail");
	const subst = ChatRoomPronounSubstitutions(C, "TargetPronoun", false);
	msg = CommonStringSubstitute(msg, subst);
	DrawText(msg, 1500, 800, "white", "gray");
}
