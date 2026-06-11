"use strict";

const InventoryItemArmsHempRopeRopeCuffsFrontTypedIndex = 17;

/** @type {ExtendedItemCallbacks.BeforeDraw} */
function AssetsItemArmsHempRopeBeforeDraw(data) {
	const subType = data.Property?.TypeRecord?.typed ?? 0;
	if (data.L === "Leash" && subType === InventoryItemArmsHempRopeRopeCuffsFrontTypedIndex) {
		return { LayerType: data.C.HasEffect("IsLeashed") ? "Held" : "" };
	}
	if (subType === 11) { // "BedSpreadEagle"
		return {
			X: data.X - 50,
			Y: data.Y - 150,
		};
	} else if (subType === 12 && data.L === "Suspension") {
		return {
			// Hide the rope split-into-four behind hair as otherwise it appears odd
			Y: data.Y + 30,
		};
	}
	return data;
}
