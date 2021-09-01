"use strict";

var InventoryItemBootsFuturisticHeels2Options = [
	{
		Name: "Shiny",
		Property: { Type: null},
	},
	{
		Name: "Matte",
		Property: { Type: "Matte"},
	},
];

function InventoryItemBootsFuturisticHeels2Load() {
	var C = (Player.FocusGroup != null) ? Player : CurrentCharacter;
	if (InventoryItemFuturisticValidate(C) !== "") {
		InventoryItemFuturisticLoadAccessDenied();
	} else
		ExtendedItemLoad(InventoryItemBootsFuturisticHeels2Options, "FuturisticHeels2Type");
}

function InventoryItemBootsFuturisticHeels2Draw() {
	var C = (Player.FocusGroup != null) ? Player : CurrentCharacter;
	if (InventoryItemFuturisticValidate(C) !== "") {
		InventoryItemFuturisticDrawAccessDenied();
	} else
		ExtendedItemDraw(InventoryItemBootsFuturisticHeels2Options, "FuturisticHeels2Type");

}

function InventoryItemBootsFuturisticHeels2Click() {
	var C = (Player.FocusGroup != null) ? Player : CurrentCharacter;
	if (InventoryItemFuturisticValidate(C) !== "") {
		InventoryItemFuturisticClickAccessDenied();
	} else {
		ExtendedItemClick(InventoryItemBootsFuturisticHeels2Options);
	}
}

function InventoryItemBootsFuturisticHeels2Exit() {
	InventoryItemFuturisticExitAccessDenied();
}

function InventoryItemBootsFuturisticHeels2PublishAction(C, Option) {
	var msg = "FuturisticHeels2Set" + Option.Name;
	var Dictionary = [
		{ Tag: "SourceCharacter", Text: Player.Name, MemberNumber: Player.MemberNumber },
		{ Tag: "DestinationCharacter", Text: C.Name, MemberNumber: C.MemberNumber },
	];
	ChatRoomPublishCustomAction(msg, true, Dictionary);
}

function InventoryItemBootsFuturisticHeels2Validate(C, Item) {
	return InventoryItemFuturisticValidate(C, Item); // All futuristic items refer to the gag
}

