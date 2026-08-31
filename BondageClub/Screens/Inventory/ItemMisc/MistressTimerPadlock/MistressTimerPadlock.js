"use strict";

const MistressTimerChooseOptions = [
	{ unit: TimeUnits.MINUTES, values: [5, 10, 15, 30, 60, -30, -15, -10, -5] },
	{ unit: TimeUnits.HOURS, values: [1, 2, 3, 4, -3, -2, -1] },
];
let MistressTimerChooseOptionsIndex = 0; // default is minutes
let MistressTimerChooseIndexes = [0, 0]; // defaults: [5 minutes, 1 hour]

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscMistressTimerPadlockDrawHook({ asset }, originalFunction) {

	// const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!item || !lockItem) {
		return;
	}

	const property = item.Property;

	if (property?.RemoveTimer === undefined || property.RemoveTimer < CurrentTime) {
		DialogLeaveFocusItem();
		return;
	}
	originalFunction();

	if (property.ShowTimer) {
		DrawText(InterfaceTextGet("TimerLeft") + " " + TimerToString(property.RemoveTimer - CurrentTime), 1500, 500, "white", "gray");
	} else {
		DrawText(InterfaceTextGet("TimerUnknown"), 1500, 500, "white", "gray");
	}

	// Draw the settings
	if (Player.CanInteract() && (Player.MemberNumber == property?.LockMemberNumber)) {
		MainCanvas.textAlign = "left";
		DrawButton(1100, 666, 64, 64, "", "White", (property?.RemoveItem) ? "Icons/Checked.png" : "");
		DrawText(InterfaceTextGet("RemoveItemWithTimer"), 1200, 698, "white", "gray");
		DrawButton(1100, 746, 64, 64, "", "White", (property?.ShowTimer) ? "Icons/Checked.png" : "");
		DrawText(InterfaceTextGet("ShowItemWithTimerRemaining"), 1200, 778, "white", "gray");
		DrawButton(1100, 828, 64, 64, "", "White", (property?.EnableRandomInput) ? "Icons/Checked.png" : "");
		DrawText(InterfaceTextGet("EnableRandomInput"), 1200, 858, "white", "gray");
		MainCanvas.textAlign = "center";
	} else {
		if (typeof property?.LockMemberNumber === "number") {
			DrawText(InterfaceTextGet("LockMemberNumber") + " " + property.LockMemberNumber.toString(), 1500, 700, "white", "gray");
		}
		DrawText(InterfaceTextGet((property?.RemoveItem) ? "WillRemoveItemWithTimer" : "WontRemoveItemWithTimer"), 1500, 868, "white", "gray");
	}

	// Draw buttons to add/remove time if available
	if (Player.CanInteract() && (LogQuery("ClubMistress", "Management") || Player.MemberNumber === property?.LockMemberNumber)) {
		DrawButton(1100, 910, 250, 70, InterfaceTextGet("AddTimerTime"), "White");
		const selectedOption = MistressTimerChooseOptions[MistressTimerChooseOptionsIndex];
		const timeList = selectedOption.values;
		const unit = selectedOption.unit;
		const selectedIndex = MistressTimerChooseIndexes[MistressTimerChooseOptionsIndex];
		const selectedUnitLabel = InterfaceTextGet(unit.label);
		DrawBackNextButton(1400, 910, 250, 70, timeList[selectedIndex] + " " + selectedUnitLabel, "White", "",
			() => timeList[(timeList.length + selectedIndex - 1) % timeList.length] + " " + selectedUnitLabel,
			() => timeList[(selectedIndex + 1) % timeList.length] + " " + selectedUnitLabel,
		);
		const previousUnit = MistressTimerChooseOptions[(MistressTimerChooseOptions.length + MistressTimerChooseOptionsIndex - 1) % MistressTimerChooseOptions.length].unit;
		const nextUnit = MistressTimerChooseOptions[(MistressTimerChooseOptionsIndex + 1) % MistressTimerChooseOptions.length].unit;
		DrawBackNextButton(1700, 910, 250, 70, selectedUnitLabel, "White", "",
			() => InterfaceTextGet(previousUnit.label),
			() => InterfaceTextGet(nextUnit.label),
		);
	} else if (Player.CanInteract() && property?.EnableRandomInput && !property?.MemberNumberList?.includes(Player.MemberNumber)) {
		DrawButton(1100, 910, 250, 70, "- " + asset.RemoveTimer * 3 / 60 + " " + InterfaceTextGet("Minutes"), "White");
		DrawButton(1400, 910, 250, 70, InterfaceTextGet("Random"), "White");
		DrawButton(1700, 910, 250, 70, "+ " + asset.RemoveTimer * 3 / 60 + " " + InterfaceTextGet("Minutes"), "White");
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemMiscMistressTimerPadlockClickHook(data, originalFunction) {
	originalFunction();

	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!C || !C.FocusGroup || !item || !lockItem) {
		return;
	}

	if (!Player.CanInteract()) {
		return;
	}

	const property = item.Property;
	const isLockedByPlayer = property?.LockMemberNumber === Player.MemberNumber;
	const isClubMistress = LogQuery("ClubMistress", "Management");

	if (isLockedByPlayer) { // If the player's number is on the lock, they can control toggles
		if (MouseIn(1100, 666, 64, 64)) { // Remove when timer runs out checkbox
			property.RemoveItem = !property.RemoveItem;
			ChatRoomCharacterItemUpdate(C);
			return;
		} else if (MouseIn(1100, 746, 64, 64)) { // Show/hide timer checkbox
			property.ShowTimer = !property.ShowTimer;
			ChatRoomCharacterItemUpdate(C);
			return;
		} else if (MouseIn(1100, 826, 64, 64)) { // Enable random input checkbox
			property.EnableRandomInput = !property.EnableRandomInput;
			ChatRoomCharacterItemUpdate(C);
			return;
		}
	}
	if (isLockedByPlayer || isClubMistress) { // If the player is a Club Mistress or their number is on the lock, they can add/remove time
		if (MouseIn(1100, 910, 250, 70)) { // Add time button
			const selectedOption = MistressTimerChooseOptions[MistressTimerChooseOptionsIndex];
			const selectedTime = selectedOption.values[MistressTimerChooseIndexes[MistressTimerChooseOptionsIndex]];
			const selectedUnit = MistressTimerChooseOptions[MistressTimerChooseOptionsIndex].unit;
			InventoryItemMiscTimerPadlockAdd(C, item, lockItem, selectedTime * selectedUnit.seconds, selectedUnit, false, false);
		} else if (MouseIn(1400, 910, 125, 70)) { // Previous time option
			const selectedOption = MistressTimerChooseOptions[MistressTimerChooseOptionsIndex];
			const values = selectedOption.values;
			const selectedIndex = MistressTimerChooseIndexes[MistressTimerChooseOptionsIndex];
			MistressTimerChooseIndexes[MistressTimerChooseOptionsIndex] = (values.length + selectedIndex - 1) % values.length;
		} else if (MouseIn(1525, 910, 125, 70)) { // Next time option
			const selectedOption = MistressTimerChooseOptions[MistressTimerChooseOptionsIndex];
			const selectedIndex = MistressTimerChooseIndexes[MistressTimerChooseOptionsIndex];
			MistressTimerChooseIndexes[MistressTimerChooseOptionsIndex] = (selectedIndex + 1) % selectedOption.values.length;
		} else if (MouseIn(1700, 910, 125, 70)) { // Previous time mode option
			MistressTimerChooseOptionsIndex = (MistressTimerChooseOptions.length + MistressTimerChooseOptionsIndex - 1) % MistressTimerChooseOptions.length;
		} else if (MouseIn(1825, 910, 125, 70)) { // Next time mode option
			MistressTimerChooseOptionsIndex = (MistressTimerChooseOptionsIndex + 1) % MistressTimerChooseOptions.length;
		}
	} else if (property?.EnableRandomInput && !property?.MemberNumberList?.includes(Player.MemberNumber)) {
		// Everyone else can add/remove time if permitted, and they've not already done so
		if (MouseIn(1100, 910, 250, 70)) { // Remove time
			InventoryItemMiscTimerPadlockAdd(C, item, lockItem, -lockItem.Asset.RemoveTimer * 2, TimeUnits.MINUTES, true);
		} else if (MouseIn(1400, 910, 250, 70)) { // Random
			InventoryItemMiscTimerPadlockAdd(C, item, lockItem, lockItem.Asset.RemoveTimer * 4 * ((Math.random() >= 0.5) ? 1 : -1), TimeUnits.MINUTES, true);
		} else if (MouseIn(1700, 910, 250, 70)) { // Add time
			InventoryItemMiscTimerPadlockAdd(C, item, lockItem, lockItem.Asset.RemoveTimer * 2, TimeUnits.MINUTES, true);
		}
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<NoArchItemData>} */
function InventoryItemMiscMistressTimerPadlockExitHook(Data, OriginalFunction) {
	if (OriginalFunction) {
		OriginalFunction();
	}
	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	if (!C || !item) return;
	InventoryItemMiscSendTimerPadlockChangeMessage(C, item);
}
