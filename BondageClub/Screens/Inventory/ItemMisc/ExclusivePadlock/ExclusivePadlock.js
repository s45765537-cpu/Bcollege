"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscExclusivePadlockDrawHook(data, originalFunction) {
	originalFunction();

	DrawText(DialogFindPlayer(DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Intro"), 1500, 600, "white", "gray");
	let msg = DialogFindPlayer(DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Detail");
	const subst = ChatRoomPronounSubstitutions(CurrentCharacter, "TargetPronoun", false);
	msg = CommonStringSubstitute(msg, subst);
	DrawText(msg, 1500, 700, "white", "gray");

	if ((DialogFocusSourceItem != null) && (DialogFocusSourceItem.Property != null) && (DialogFocusSourceItem.Property.LockMemberNumber != null))
		DrawText(DialogFindPlayer("LockMemberNumber") + " " + DialogFocusSourceItem.Property.LockMemberNumber.toString(), 1500, 800, "white", "gray");
}
