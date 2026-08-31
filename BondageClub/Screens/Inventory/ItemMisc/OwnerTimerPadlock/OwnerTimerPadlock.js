"use strict";

const OwnerTimerChooseOptions = [
	{ unit: TimeUnits.MINUTES, values: [5, 10, 15, 30, 60, -30, -15, -10, -5] },
	{ unit: TimeUnits.HOURS, values: [1, 2, 3, 4, 8, 12, 16, 24, -12, -8, -4, -3, -2, -1] },
	{ unit: TimeUnits.DAYS, values: [1, 2, 3, 7, 14, 28, -14, -7, -3, -2, -1] },
];
let OwnerTimerChooseOptionsIndex = 1; // default is hours
let OwnerTimerChooseIndexes = [0, 0, 0]; // defaults: [5 minutes, 1 hour, 1 day]

let TimerPadlockAccumulatedSeconds = 0;

/**
 * @param {Character} C
 * @returns {boolean} - Whether the passed character is elligble for full control over the lock
 */
function InventoryItemMiscOwnerTimerPadlockValidator(C) {
	return C.IsOwnedByPlayer();
}

/**
 * @param {NoArchItemData} data
 * @param {null | (() => void)} originalFunction
 * @param {(C: Character) => boolean} validator
 * @satisfies {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>}
 */
function InventoryItemMiscOwnerTimerPadlockDrawHook({ asset }, originalFunction, validator=InventoryItemMiscOwnerTimerPadlockValidator) {
	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	if (!C || !C.FocusGroup || !item) {
		return;
	}

	const property = item.Property;

	if (property?.RemoveTimer === undefined || property.RemoveTimer < CurrentTime) {
		DialogLeaveFocusItem();
		return;
	}

	originalFunction?.();

	if (property.ShowTimer) {
		DrawText(InterfaceTextGet("TimerLeft") + " " + TimerToString(property.RemoveTimer - CurrentTime), 1500, 500, "white", "gray");
	} else {
		if (Player.CanInteract() && validator(C)) {
			DrawText(InterfaceTextGet("TimerHidden"), 1500, 425, "white", "gray");
			DrawText(InterfaceTextGet("TimerLeft") + " " + TimerToString(property.RemoveTimer - CurrentTime), 1500, 500, "white", "gray");
		} else {
			DrawText(InterfaceTextGet("TimerUnknown"), 1500, 500, "white", "gray");
		}
	}
	DrawText(AssetTextGet(asset.Group.Name + asset.Name + "Intro"), 1500, 600, "white", "gray");

	// Draw the settings
	if (Player.CanInteract() && validator(C)) {
		MainCanvas.textAlign = "left";
		DrawButton(1100, 666, 64, 64, "", "White", property.RemoveItem ? "Icons/Checked.png" : "");
		DrawText(InterfaceTextGet("RemoveItemWithTimer"), 1200, 698, "white", "gray");
		DrawButton(1100, 746, 64, 64, "", "White", property.ShowTimer ? "Icons/Checked.png" : "");
		DrawText(InterfaceTextGet("ShowItemWithTimerRemaining"), 1200, 778, "white", "gray");
		DrawButton(1100, 826, 64, 64, "", "White", property.EnableRandomInput ? "Icons/Checked.png" : "");
		DrawText(InterfaceTextGet("EnableRandomInput"), 1200, 858, "white", "gray");
		MainCanvas.textAlign = "center";
	} else {
		if (property.LockMemberNumber != null) {
			DrawText(InterfaceTextGet("LockMemberNumber") + " " + property.LockMemberNumber.toString(), 1500, 700, "white", "gray");
		}

		let msg = AssetTextGet(asset.Group.Name + asset.Name + "Detail");
		const subst = ChatRoomPronounSubstitutions(C, "TargetPronoun", false);
		msg = CommonStringSubstitute(msg, subst);
		DrawText(msg, 1500, 800, "white", "gray");

		DrawText(InterfaceTextGet(property.RemoveItem ? "WillRemoveItemWithTimer" : "WontRemoveItemWithTimer"), 1500, 868, "white", "gray");
	}

	// Draw buttons to add/remove time if available
	if (Player.CanInteract() && validator(C)) {
		DrawButton(1100, 910, 250, 70, InterfaceTextGet("AddTimerTime"), "White");
		const selectedOption = OwnerTimerChooseOptions[OwnerTimerChooseOptionsIndex];
		const timeList = selectedOption.values;
		const unit = selectedOption.unit;
		const selectedIndex = OwnerTimerChooseIndexes[OwnerTimerChooseOptionsIndex];
		const selectedUnitLabel = InterfaceTextGet(unit.label);
		DrawBackNextButton(1400, 910, 250, 70, timeList[selectedIndex] + " " + selectedUnitLabel, "White", "",
			() => timeList[(timeList.length + selectedIndex - 1) % timeList.length] + " " + selectedUnitLabel,
			() => timeList[(selectedIndex + 1) % timeList.length] + " " + selectedUnitLabel,
		);
		const previousUnit = OwnerTimerChooseOptions[(OwnerTimerChooseOptions.length + OwnerTimerChooseOptionsIndex - 1) % OwnerTimerChooseOptions.length].unit;
		const nextUnit = OwnerTimerChooseOptions[(OwnerTimerChooseOptionsIndex + 1) % OwnerTimerChooseOptions.length].unit;
		DrawBackNextButton(1700, 910, 250, 70, selectedUnitLabel, "White", "",
			() => InterfaceTextGet(previousUnit.label),
			() => InterfaceTextGet(nextUnit.label),
		);
	} else if (Player.CanInteract() && property.EnableRandomInput && !property.MemberNumberList?.includes(Player.MemberNumber)) {
		DrawButton(1100, 910, 250, 70, "- 2 " + InterfaceTextGet("Hours"), "White");
		DrawButton(1400, 910, 250, 70, InterfaceTextGet("Random"), "White");
		DrawButton(1700, 910, 250, 70, "+ 2 " + InterfaceTextGet("Hours"), "White");
	}
}

/**
 * @param {NoArchItemData} data
 * @param {null | (() => void)} originalFunction
 * @param {(C: Character) => boolean} validator
 * @satisfies {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>}
 */
function InventoryItemMiscOwnerTimerPadlockClickHook(data, originalFunction, validator=InventoryItemMiscOwnerTimerPadlockValidator) {
	originalFunction?.();
	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!C || !C.FocusGroup || !item || !lockItem) {
		return;
	}

	if (!Player.CanInteract()) {
		return;
	}

	item.Property ??= {};

	if (validator(C)) { // Owner gets full control over lock
		if (MouseIn(1100, 666, 64, 64)) { // Remove when timer runs out checkbox
			item.Property.RemoveItem = !item.Property.RemoveItem;
			ChatRoomCharacterItemUpdate(C);
		} else if (MouseIn(1100, 746, 64, 64)) { // Show/hide timer checkbox
			item.Property.ShowTimer = !item.Property.ShowTimer;
			ChatRoomCharacterItemUpdate(C);
		} else if (MouseIn(1100, 826, 64, 64)) { // Enable random input checkbox
			item.Property.EnableRandomInput = !item.Property.EnableRandomInput;
			ChatRoomCharacterItemUpdate(C);
		} else if (MouseIn(1100, 910, 250, 70)) { // Add time button
			const selectedOption = OwnerTimerChooseOptions[OwnerTimerChooseOptionsIndex];
			const selectedTime = selectedOption.values[OwnerTimerChooseIndexes[OwnerTimerChooseOptionsIndex]];
			const selectedUnit = OwnerTimerChooseOptions[OwnerTimerChooseOptionsIndex].unit;
			InventoryItemMiscTimerPadlockAdd(C, item, lockItem, selectedTime * selectedUnit.seconds, selectedUnit, false, false);
		} else if (MouseIn(1400, 910, 125, 70)) { // Previous time option
			const selectedOption = OwnerTimerChooseOptions[OwnerTimerChooseOptionsIndex];
			const values = selectedOption.values;
			const selectedIndex = OwnerTimerChooseIndexes[OwnerTimerChooseOptionsIndex];
			OwnerTimerChooseIndexes[OwnerTimerChooseOptionsIndex] = (values.length + selectedIndex - 1) % values.length;
		} else if (MouseIn(1525, 910, 125, 70)) { // Next time option
			const selectedOption = OwnerTimerChooseOptions[OwnerTimerChooseOptionsIndex];
			const selectedIndex = OwnerTimerChooseIndexes[OwnerTimerChooseOptionsIndex];
			OwnerTimerChooseIndexes[OwnerTimerChooseOptionsIndex] = (selectedIndex + 1) % selectedOption.values.length;
		} else if (MouseIn(1700, 910, 125, 70)) { // Previous time mode option
			OwnerTimerChooseOptionsIndex = (OwnerTimerChooseOptions.length + OwnerTimerChooseOptionsIndex - 1) % OwnerTimerChooseOptions.length;
		} else if (MouseIn(1825, 910, 125, 70)) { // Next time mode option
			OwnerTimerChooseOptionsIndex = (OwnerTimerChooseOptionsIndex + 1) % OwnerTimerChooseOptions.length;
		}
	} else if (item.Property.EnableRandomInput && !item.Property.MemberNumberList?.includes(Player.MemberNumber)) {
		// Everyone else can add/remove time if permitted, and they've not already done so
		if (MouseIn(1100, 910, 250, 70)) { // -2 hours
			InventoryItemMiscTimerPadlockAdd(C, item, lockItem, -2 * 3600, TimeUnits.HOURS, true);
		} else if (MouseIn(1400, 910, 250, 70)) { // Random - +/-4 hours
			InventoryItemMiscTimerPadlockAdd(C, item, lockItem, 4 * 3600 * ((Math.random() >= 0.5) ? 1 : -1), TimeUnits.HOURS, true);
		} else if (MouseIn(1700, 910, 250, 70)) { // +2 hours
			InventoryItemMiscTimerPadlockAdd(C, item, lockItem, 2 * 3600, TimeUnits.HOURS, true);
		}
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<NoArchItemData>} */
function InventoryItemMiscOwnerTimerPadlockExitHook(Data, OriginalFunction) {
	if (OriginalFunction) {
		OriginalFunction();
	}
	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	if (!C || !item) return;
	InventoryItemMiscSendTimerPadlockChangeMessage(C, item);
}

/**
 * @param {Character} C
 * @param {Item} item
 * @param {Item} lockItem
 * @param {number} TimeToAddSeconds
 * @param {{label: string, seconds: number}} DisplayTimeUnit
 * @param {boolean} PlayerMemberNumberToList
 * @param {boolean} LeaveDialog
 */
function InventoryItemMiscTimerPadlockAdd(C, item, lockItem, TimeToAddSeconds, DisplayTimeUnit, PlayerMemberNumberToList = false, LeaveDialog = true) {
	const property = (item.Property ??= {});
	const TimerBefore = property.RemoveTimer ?? 0;

	if (PlayerMemberNumberToList) {
		(property.MemberNumberList ??= []).push(Player.MemberNumber);
	}
	if (lockItem.Asset.RemoveTimer > 0) {
		property.RemoveTimer = Math.round(Math.min((property.RemoveTimer ?? 0) + (TimeToAddSeconds * 1000), CurrentTime + (lockItem.Asset.MaxTimer * 1000)));
	}
	if (CurrentScreen === "ChatRoom") {
		const secondsAdded = ((property.RemoveTimer ?? 0) - TimerBefore) / 1000;

		TimerPadlockAccumulatedSeconds += secondsAdded;
	}
}

/**
 * Sends a global chat message of how much time was added or removed from a Timer Padlock.
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemMiscSendTimerPadlockChangeMessage(C, item) {
	if (TimerPadlockAccumulatedSeconds === 0) {
		return;
	}

	let msg = "TimerAddRemoveUnknownTime";
	if (item.Property?.ShowTimer) {
		msg = TimerPadlockAccumulatedSeconds < 0 ? "TimerRemoveTime" : "TimerAddTime";
	}

	let timeString = TimerToDaysHoursMinutesString(Math.abs(TimerPadlockAccumulatedSeconds * 1000));

	const dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacter(C)
		.focusGroup(item.Asset.Group.Name)
		.if(item.Property?.ShowTimer ?? false)
		.text("TimerTime", timeString)
		.endif()
		.build();

	TimerPadlockAccumulatedSeconds = 0;

	ChatRoomPublishCustomAction(msg, false, dictionary);
}
