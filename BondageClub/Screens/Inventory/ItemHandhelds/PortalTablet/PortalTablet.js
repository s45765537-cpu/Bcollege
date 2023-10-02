"use strict";

/** @type {ExtendedItemCallbacks.Init} */
function InventoryItemHandheldPortalTabletInit(C, Item, Push, Refresh) {
	return PortalLinkTransmitterInit(C, Item, Push, Refresh);
}

/** @type {ExtendedItemCallbacks.Load} */
function InventoryItemHandheldPortalTabletLoad() {
	PortalLinkTransmitterLoad();
}

/** @type {ExtendedItemCallbacks.Draw} */
function InventoryItemHandheldPortalTabletDraw() {
	PortalLinkTransmitterDraw();
}

/** @type {ExtendedItemCallbacks.Click} */
function InventoryItemHandheldPortalTabletClick() {
	PortalLinkTransmitterClick();
}

/** @type {ExtendedItemCallbacks.Exit} */
function InventoryItemHandheldPortalTabletExit() {
	PortalLinkTransmitterExit();
}
