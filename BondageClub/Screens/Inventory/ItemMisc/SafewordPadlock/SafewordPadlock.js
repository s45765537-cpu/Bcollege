"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemMiscSafewordPadlockLoadHook(data, originalFunction) {

	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	if (!C || !C.FocusGroup || !item) {
		return;
	}

	originalFunction();
	item.Property ??= {};

	if (InventoryItemMiscPasswordPadlockIsSet(item)) {
		// Normal lock interface
		ElementCreateInput("Password", "text", "", "8");
		// the current code is shown for owners, lovers and the member whose number is on the padlock
		// It is also shown for the person who is bound by it
		if (
			C.IsPlayer() ||
			Player.MemberNumber === item.Property.LockMemberNumber ||
			C.IsOwnedByPlayer() ||
			C.IsLoverOfPlayer()
		) {
			document.getElementById("Password")?.setAttribute("placeholder", item.Property.Password);
		}
	} else {
		// Set a password and hint
		ElementCreateInput("SetHint", "text", "", "140");
		ElementCreateInput("SetPassword", "text", "", "8");
		// the current code is shown for owners, lovers and the member whose number is on the padlock
		document.getElementById("SetPassword")?.setAttribute("placeholder", item.Property.Password);
		document.getElementById("SetHint")?.setAttribute("placeholder", item.Property.Hint);
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscSafewordPadlockDrawHook(data, originalFunction) {
	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	if (!C || !C.FocusGroup || !item) {
		return;
	}

	if (typeof item.Property?.LockMemberNumber === "number") {
		DrawText(
			InterfaceTextGet("LockMemberNumber") + " " + item.Property.LockMemberNumber.toString(),
			1500, 600, "white", "gray",
		);
	}

	originalFunction();
	InventoryItemMiscPasswordPadlockDrawControls(C, item);
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemMiscSafewordPadlockClickHook(data, originalFunction) {
	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	if (!C || !C.FocusGroup || !item) {
		return;
	}
	originalFunction();
	InventoryItemMiscPasswordPadlockControlsClick(C, item);
}
