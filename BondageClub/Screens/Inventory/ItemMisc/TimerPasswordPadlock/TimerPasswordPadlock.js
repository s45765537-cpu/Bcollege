"use strict";

const PasswordTimerChooseOptions = [
	{ unit: TimeUnits.MINUTES, values: [5, 10, 15, 30, 60, -30, -15, -10, -5] },
	{ unit: TimeUnits.HOURS, values: [1, 2, 3, 4, -3, -2, -1] },
];
let PasswordTimerChooseOptionsIndex = 0; // default is minutes
let PasswordTimerChooseIndexes = [0, 0]; // defaults: [5 minutes, 1 hour]

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemMiscTimerPasswordPadlockLoadHook(data, originalFunction) {

	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	if (!C || !C.FocusGroup || !item) {
		return;
	}

	originalFunction();

	// Only create the inputs if the zone isn't blocked
	if (InventoryGroupIsBlocked(C, C.FocusGroup.Name)) return;

	// Only create the inputs if the zone isn't blocked
	if (InventoryItemMiscPasswordPadlockIsSet(item)) {
		// Normal lock interface
		ElementCreateInput("Password", "text", "", "8");
		// the current code is shown for owners, lovers and the member whose number is on the padlock
		if (
			Player.MemberNumber === item.Property?.LockMemberNumber ||
			C.IsOwnedByPlayer() ||
			C.IsLoverOfPlayer()
		) {
			document.getElementById("Password")?.setAttribute("placeholder", item.Property?.Password ?? "");
		}
	} else {
		// Set a password and hint
		ElementCreateInput("SetHint", "text", "", "140");
		ElementCreateInput("SetPassword", "text", "", "8");
		// the current code is shown for owners, lovers and the member whose number is on the padlock
		document.getElementById("SetPassword")?.setAttribute("placeholder", item.Property?.Password ?? "");
		document.getElementById("SetHint")?.setAttribute("placeholder", item.Property?.Hint ?? "");
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscTimerPasswordPadlockDrawHook(data, originalFunction) {

	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!C || !C.FocusGroup || !item || !lockItem) {
		return;
	}

	if (typeof item.Property?.RemoveTimer !== "number" || item.Property.RemoveTimer < CurrentTime ) {
		DialogLeaveFocusItem();
		return;
	}

	originalFunction();

	if (item.Property.ShowTimer) {
		DrawText(InterfaceTextGet("TimerLeft") + " " +
			TimerToString(item.Property.RemoveTimer - CurrentTime), 1500, 400, "white", "gray");
	} else {
		DrawText(InterfaceTextGet("TimerUnknown"), 1500, 400, "white", "gray");
	}

	if (item.Property && item.Property.LockMemberNumber != null) {
		const Text = InterfaceTextGet("LockMemberNumber") + " " + item.Property.LockMemberNumber;
		DrawText(Text, 1500, 500, "white", "gray");
	}

	if (InventoryGroupIsBlocked(C, C.FocusGroup.Name)) {
		// If the zone is blocked, just display some text informing the player that they can't access the lock
		DrawText(InterfaceTextGet("LockZoneBlocked"), 1500, 550, "white", "gray");
		return;
	}

	if (InventoryItemMiscPasswordPadlockIsSet(item)) {
		// Normal lock interface
		if (item.Property && item.Property.Hint) {
			DrawText("\"" + item.Property.Hint + "\"", 1500, 550, "white", "gray");
		}
		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet("PasswordPadlockOld"), 1390, 610, "white", "gray");
		ElementPosition("Password", 1585, 605, 350);
		MainCanvas.textAlign = "center";
		DrawButton(1775, 575, 200, 64, AssetTextGet("PasswordPadlockEnter"), "White", "");
		if (DialogExtendedMessage != "") DrawText(AssetTextGet(DialogExtendedMessage), 1500, 200, "Red", "Black");
	} else {
		ElementPosition("SetHint", 1675, 550, 600);
		ElementPosition("SetPassword", 1563, 620, 375);
		MainCanvas.textAlign = "left";
		DrawText(AssetTextGet("PasswordPadlockSetHint"), 1100, 553, "white", "gray");
		DrawText(AssetTextGet("PasswordPadlockSetPassword"), 1100, 623, "white", "gray");
		MainCanvas.textAlign = "center";
		DrawButton(1765, 591, 200, 64, AssetTextGet("PasswordPadlockChangePassword"), "White", "");
		if (DialogExtendedMessage != "") DrawText(AssetTextGet(DialogExtendedMessage), 1500, 200, "Red", "Black");
	}

	// Draw the settings
	if (Player.CanInteract() && (Player.MemberNumber == item.Property.LockMemberNumber)) {
		MainCanvas.textAlign = "left";
		DrawCheckbox(1100, 666, 64, 64, InterfaceTextGet("RemoveItemWithTimer"), !!item.Property.RemoveItem, false, "#fff");
		DrawCheckbox(1100, 746, 64, 64, InterfaceTextGet("ShowItemWithTimerRemaining"), !!item.Property.ShowTimer, false, "#fff");
		DrawCheckbox(1100, 828, 64, 64, InterfaceTextGet("EnableRandomInput"), !!item.Property.EnableRandomInput, false, "#fff");
		MainCanvas.textAlign = "center";
	} else {
		const RemoveTextKey = (item.Property.RemoveItem) ? "WillRemoveItemWithTimer" : "WontRemoveItemWithTimer";
		DrawText(InterfaceTextGet(RemoveTextKey), 1500, 868, "white", "gray");
	}

	// Draw buttons to add/remove time if available
	if (Player.CanInteract() && (Player.MemberNumber == item.Property.LockMemberNumber)) {
		DrawButton(1100, 910, 250, 70, InterfaceTextGet("AddTimerTime"), "White");
		const selectedOption = PasswordTimerChooseOptions[PasswordTimerChooseOptionsIndex];
		const timeList = selectedOption.values;
		const unit = selectedOption.unit;
		const selectedIndex = PasswordTimerChooseIndexes[PasswordTimerChooseOptionsIndex];
		const selectedUnitLabel = InterfaceTextGet(unit.label);
		DrawBackNextButton(1400, 910, 250, 70, timeList[selectedIndex] + " " + selectedUnitLabel, "White", "",
			() => timeList[(timeList.length + selectedIndex - 1) % timeList.length] + " " + selectedUnitLabel,
			() => timeList[(selectedIndex + 1) % timeList.length] + " " + selectedUnitLabel,
		);
		const previousUnit = PasswordTimerChooseOptions[(PasswordTimerChooseOptions.length + PasswordTimerChooseOptionsIndex - 1) % PasswordTimerChooseOptions.length].unit;
		const nextUnit = PasswordTimerChooseOptions[(PasswordTimerChooseOptionsIndex + 1) % PasswordTimerChooseOptions.length].unit;
		DrawBackNextButton(1700, 910, 250, 70, selectedUnitLabel, "White", "",
			() => InterfaceTextGet(previousUnit.label),
			() => InterfaceTextGet(nextUnit.label),
		);
	} else if (Player.CanInteract() && item.Property.EnableRandomInput) {
		if (item.Property.MemberNumberList?.includes(Player.MemberNumber)) return;

		const Minutes = InterfaceTextGet("Minutes");
		const TimeButtonSuffix = `${lockItem.Asset.RemoveTimer * 3 / 60} ${Minutes}`;
		DrawButton(1100, 910, 250, 70, `- ${TimeButtonSuffix}`, "White");
		DrawButton(1400, 910, 250, 70, InterfaceTextGet("Random"), "White");
		DrawButton(1700, 910, 250, 70, `+ ${TimeButtonSuffix}`, "White");
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemMiscTimerPasswordPadlockClickHook(data, originalFunction) {
	originalFunction();

	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!C || !C.FocusGroup || !item || !lockItem) {
		return;
	}

	if (InventoryGroupIsBlocked(C, C.FocusGroup.Name)) return;

	if (InventoryItemMiscPasswordPadlockIsSet(item) && MouseIn(1775, 575, 200, 64)) {
		InventoryItemMiscPasswordPadlockHandleOpenClick(C, item);
		DialogLeaveFocusItem();
	} else if (MouseIn(1765, 591, 200, 64)) {
		InventoryItemMiscPasswordPadlockHandleFirstSet(C, item);
		DialogLeaveFocusItem();
	}

	if (!Player.CanInteract()) return;

	if (Player.MemberNumber === item.Property?.LockMemberNumber) {
		if (MouseXIn(1100, 64)) {
			let Update = true;
			if (MouseYIn(666, 64)) {
				item.Property.RemoveItem = !item.Property.RemoveItem;
			} else if (MouseYIn(746, 64)) {
				item.Property.ShowTimer = !item.Property.ShowTimer;
			} else if (MouseYIn(826, 64)) {
				item.Property.EnableRandomInput = !item.Property.EnableRandomInput;
			} else {
				Update = false;
			}
			if (Update) ChatRoomCharacterItemUpdate(C);
		}
	}

	if (MouseYIn(910, 70)) {
		if (Player.MemberNumber === item.Property?.LockMemberNumber) {
			if (MouseXIn(1100, 250)) {
				const selectedOption = PasswordTimerChooseOptions[PasswordTimerChooseOptionsIndex];
				const selectedTime = selectedOption.values[PasswordTimerChooseIndexes[PasswordTimerChooseOptionsIndex]];
				const selectedUnit = PasswordTimerChooseOptions[PasswordTimerChooseOptionsIndex].unit;
				InventoryItemMiscTimerPadlockAdd(C, item, lockItem, selectedTime * selectedUnit.seconds, selectedUnit, false, false);
			} else if (MouseIn(1400, 910, 125, 70)) { // Previous time option
				const selectedOption = PasswordTimerChooseOptions[PasswordTimerChooseOptionsIndex];
				const values = selectedOption.values;
				const selectedIndex = PasswordTimerChooseIndexes[PasswordTimerChooseOptionsIndex];
				PasswordTimerChooseIndexes[PasswordTimerChooseOptionsIndex] = (values.length + selectedIndex - 1) % values.length;
			} else if (MouseIn(1525, 910, 125, 70)) { // Next time option
				const selectedOption = PasswordTimerChooseOptions[PasswordTimerChooseOptionsIndex];
				const selectedIndex = PasswordTimerChooseIndexes[PasswordTimerChooseOptionsIndex];
				PasswordTimerChooseIndexes[PasswordTimerChooseOptionsIndex] = (selectedIndex + 1) % selectedOption.values.length;
			} else if (MouseIn(1700, 910, 125, 70)) { // Previous time mode option
				PasswordTimerChooseOptionsIndex = (PasswordTimerChooseOptions.length + PasswordTimerChooseOptionsIndex - 1) % PasswordTimerChooseOptions.length;
			} else if (MouseIn(1825, 910, 125, 70)) { // Next time mode option
				PasswordTimerChooseOptionsIndex = (PasswordTimerChooseOptionsIndex + 1) % PasswordTimerChooseOptions.length;
			}
		} else if (item.Property?.EnableRandomInput) {
			if (item.Property.MemberNumberList?.includes(Player.MemberNumber)) return;

			const RemoveTimer = lockItem.Asset.RemoveTimer;
			let TimeToAdd = 0;
			if (MouseXIn(1100, 250)) TimeToAdd = -RemoveTimer * 2;
			else if (MouseXIn(1400, 250)) TimeToAdd = RemoveTimer * 4 * ((Math.random() >= 0.5) ? 1 : -1);
			else if (MouseXIn(1700, 250)) TimeToAdd = RemoveTimer * 2;

			if (TimeToAdd) InventoryItemMiscTimerPadlockAdd(C, item, lockItem, TimeToAdd, TimeUnits.MINUTES, true);
		}
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<NoArchItemData>} */
function InventoryItemMiscTimerPasswordPadlockExitHook(Data, OriginalFunction) {
	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	if (!C || !item) return;
	InventoryItemMiscSendTimerPadlockChangeMessage(C, item);
	InventoryItemMiscPasswordPadlockExitHook(Data, OriginalFunction);
}
