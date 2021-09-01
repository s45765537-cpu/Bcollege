"use strict";

var InventoryItemBreastFuturisticBra2Options = [
	{
		Name: "Display",
		Property: {Type: null},
	},
	{
		Name: "NoDisplay",
		Property: { Type: "NoDisplay" },
	},
	{
		Name: "DisplayMatte",
		Property: { Type: "Matte" },
	},
	{
		Name: "NoDisplayMatte",
		Property: { Type: "NoDisplayMatte" },
	},
];

function InventoryItemBreastFuturisticBra2Load() {
	var C = (Player.FocusGroup != null) ? Player : CurrentCharacter;
	if (InventoryItemFuturisticValidate(C) !== "") {
		InventoryItemFuturisticLoadAccessDenied();
	} else
		ExtendedItemLoad(InventoryItemBreastFuturisticBra2Options, "FuturisticBra2Type");
}

function InventoryItemBreastFuturisticBra2Draw() {
	var C = (Player.FocusGroup != null) ? Player : CurrentCharacter;
	if (InventoryItemFuturisticValidate(C) !== "") {
		InventoryItemFuturisticDrawAccessDenied();
	} else
		ExtendedItemDraw(InventoryItemBreastFuturisticBra2Options, "FuturisticBra2Type");

}

function InventoryItemBreastFuturisticBra2Click() {
	var C = (Player.FocusGroup != null) ? Player : CurrentCharacter;
	if (InventoryItemFuturisticValidate(C) !== "") {
		InventoryItemFuturisticClickAccessDenied();
	} else {
		ExtendedItemClick(InventoryItemBreastFuturisticBra2Options);
	}
}

function InventoryItemBreastFuturisticBra2Exit() {
	InventoryItemFuturisticExitAccessDenied();
}

function InventoryItemBreastFuturisticBra2PublishAction(C, Option) {
	var msg = "FuturisticBra2Set" + Option.Name;
	var Dictionary = [
		{ Tag: "SourceCharacter", Text: Player.Name, MemberNumber: Player.MemberNumber },
		{ Tag: "DestinationCharacter", Text: C.Name, MemberNumber: C.MemberNumber },
	];
	ChatRoomPublishCustomAction(msg, true, Dictionary);
}

function InventoryItemBreastFuturisticBra2Validate(C, Item) {
	return InventoryItemFuturisticValidate(C, Item); // All futuristic items refer to the gag
}

