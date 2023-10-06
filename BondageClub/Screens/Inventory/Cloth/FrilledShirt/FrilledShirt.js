"use strict";

/** @type {ExtendedItemCallbacks.Init} */
function InventoryClothFrilledShirtInit(C, Item, Push, Refresh) {
	return ExtendedItemInitNoArch(C, Item, { Opacity: Item.Asset.Opacity }, Push, Refresh);
}

/** @type {ExtendedItemCallbacks.Load} */
function InventoryClothFrilledShirtLoad() {
	PropertyOpacityLoad();
	DialogExtendedMessage = DialogFindPlayer("OpacityLabel");
}

/** @type {ExtendedItemCallbacks.Draw} */
function InventoryClothFrilledShirtDraw() {
	ExtendedItemDrawHeader();
	DrawText(DialogExtendedMessage, 1505, 380, "#fff", "#000");
	PropertyOpacityDraw();
}

/** @type {ExtendedItemCallbacks.Click} */
function InventoryClothFrilledShirtClick() {
	if (MouseIn(1885, 25, 90, 90)) {
		DialogLeaveFocusItem();
	}
}

/** @type {ExtendedItemCallbacks.Exit} */
function InventoryClothFrilledShirtExit() {
	PropertyOpacityExit();
}

