"use strict";

const InventoryItemMiscPasswordPadlockPasswordRegex = /^[A-Z]+$/;

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemMiscPasswordPadlockLoadHook(data, originalFunction) {
	originalFunction();

	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	if (!C || !C.FocusGroup || !item) {
		return;
	}

	// Only create the inputs if the zone isn't blocked
	if (InventoryGroupIsBlocked(C, C.FocusGroup.Name)) return;

	if (InventoryItemMiscPasswordPadlockIsSet(item)) {
		// Normal lock interface
		ElementCreateInput("Password", "text", "", "8");
		// the current code is shown for owners, lovers and the member whose number is on the padlock
		if (
			Player.MemberNumber === item.Property?.LockMemberNumber ||
			C.IsOwnedByPlayer() ||
			C.IsLoverOfPlayer()
		) {
			document.getElementById("Password")?.setAttribute("placeholder", item.Property?.Password);
		}
	} else {
		// Set a password and hint
		ElementCreateInput("SetHint", "text", "", "140");
		ElementCreateInput("SetPassword", "text", "", "8");
		// the current code is shown for owners, lovers and the member whose number is on the padlock
		document.getElementById("SetPassword")?.setAttribute("placeholder", item.Property?.Password);
		document.getElementById("SetHint")?.setAttribute("placeholder", item.Property?.Hint);
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscPasswordPadlockDrawHook(data, originalFunction) {
	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	if (!C || !C.FocusGroup || !item) {
		return;
	}

	originalFunction();

	if (InventoryGroupIsBlocked(C, C.FocusGroup.Name)) {
		// If the zone is blocked, just display some text informing the player that they can't access the lock
		DrawText(InterfaceTextGet("LockZoneBlocked"), 1500, 800, "white", "gray");
	} else {
		InventoryItemMiscPasswordPadlockDrawControls(C, item);
	}
}

/**
 *
 * @param {Character} C
 * @param {Item} item
 * @returns
 */
function InventoryItemMiscPasswordPadlockDrawControls(C, item) {
	item.Property ??= {};

	if (InventoryItemMiscPasswordPadlockIsSet(item)) {
		// Normal lock interface
		if (item.Property.Hint) {
			DrawTextWrap("\"" + item.Property.Hint + "\"", 1000, 640, 1000, 120, "white", undefined, 2);
		}
		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet("PasswordPadlockOld"), 1350, 810, "white", "gray");
		ElementPosition("Password", 1643, 805, 550);
		MainCanvas.textAlign = "center";
		DrawButton(1360, 871, 250, 64, AssetTextGet("PasswordPadlockEnter"), "White", "");
		if (DialogExtendedMessage != "") DrawText(AssetTextGet(DialogExtendedMessage), 1500, 963, "Red", "Black");
	} else {
		ElementPosition("SetHint", 1643, 700, 550);
		ElementPosition("SetPassword", 1643, 770, 550);
		MainCanvas.textAlign = "left";
		DrawText(AssetTextGet("PasswordPadlockSetHint"), 1100, 705, "white", "gray");
		DrawText(AssetTextGet("PasswordPadlockSetPassword"), 1100, 775, "white", "gray");
		MainCanvas.textAlign = "center";
		DrawButton(1360, 891, 250, 64, AssetTextGet("PasswordPadlockChangePassword"), "White", "");
		if (DialogExtendedMessage != "") DrawText(AssetTextGet(DialogExtendedMessage), 1500, 963, "Red", "Black");

		DrawButton(1600, 820, 64, 64, "", "White", item.Property.RemoveOnUnlock ? "Icons/Checked.png" : "");
		DrawText(AssetTextGet("PasswordPadlockRemoveOnUnlock"), 1400, 855, "White", "Gray");
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemMiscPasswordPadlockClickHook(data, originalFunction) {
	originalFunction();
	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	if (!C || !C.FocusGroup || !item) {
		return;
	}

	if (InventoryGroupIsBlocked(C, C.FocusGroup.Name)) return;
	InventoryItemMiscPasswordPadlockControlsClick(C, item);
}

/**
 *
 * @param {Character} C
 * @param {Item} item
 * @returns
 */
function InventoryItemMiscPasswordPadlockControlsClick(C, item) {
	item.Property ??= {};

	if (InventoryItemMiscPasswordPadlockIsSet(item)) {
		if (MouseIn(1360, 871, 250, 64)) {
			InventoryItemMiscPasswordPadlockHandleOpenClick(C, item);
		}
	} else {
		if (MouseIn(1600, 820, 250, 64)) {
			item.Property.RemoveOnUnlock = !item.Property.RemoveOnUnlock;
		} else if (MouseIn(1360, 891, 250, 64)) {
			InventoryItemMiscPasswordPadlockHandleFirstSet(C, item);
			DialogLeaveFocusItem();
		}
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemMiscPasswordPadlockHandleOpenClick(C, item) {
	// Opens the padlock
	if (ElementValue("Password").toUpperCase() === item.Property?.Password) {
		if (item.Property.RemoveOnUnlock) {
			InventoryRemove(C, item.Asset.Group.Name, true);
			ChatRoomCharacterUpdate(C);
		}
		CommonPadlockUnlock(C, item);
	}

	// Send fail message if online
	else if (ServerPlayerIsInChatRoom()) {
		const Dictionary = new DictionaryBuilder()
			.sourceCharacter(Player)
			.destinationCharacter(C)
			.focusGroup(item.Asset.Group.Name)
			.text("Password", ElementValue("Password"))
			.build();
		ChatRoomPublishCustomAction("PasswordFail", true, Dictionary);
	} else { DialogExtendedMessage = "PasswordPadlockError"; }
}

/**
 *
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemMiscPasswordPadlockHandleFirstSet(C, item) {

	item.Property ??= {};

	const pw = ElementValue("SetPassword").toUpperCase();
	const hint = ElementValue("SetHint");
	// We only accept code made of letters
	if (pw === "" || pw.match(InventoryItemMiscPasswordPadlockPasswordRegex)) {
		item.Property.LockSet = true;
		if (pw !== "") item.Property.Password = pw;
		if (hint !== "") item.Property.Hint = hint;

		ChatRoomCharacterItemUpdate(C);
		CharacterRefresh(C);

		InventoryItemMiscPasswordPadlockPublishPasswordChange(C, item);

	} else {
		DialogExtendedMessage = "PasswordPadlockErrorInput";
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<NoArchItemData>} */
function InventoryItemMiscPasswordPadlockExitHook(data, originalFunction) {
	if (originalFunction) originalFunction();
	ElementRemove("Password");
	ElementRemove("SetPassword");
	ElementRemove("SetHint");
}

/**
 *
 * @param {Item} item
 * @returns {boolean}
 */
function InventoryItemMiscPasswordPadlockIsSet(item) {
	return item.Property?.LockSet || typeof item.Property?.LockMemberNumber === "number" && item.Property?.LockMemberNumber !== Player.MemberNumber;
}

/**
 *
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemMiscPasswordPadlockPublishPasswordChange(C, item) {
	if (CurrentScreen === "ChatRoom") {
		const Dictionary = new DictionaryBuilder()
			.sourceCharacter(Player)
			.destinationCharacter(C)
			.focusGroup(item.Asset.Group.Name)
			.build();
		ChatRoomPublishCustomAction("PasswordChangeSuccess", true, Dictionary);
	} else {
		DialogLeaveFocusItem();
	}
}
