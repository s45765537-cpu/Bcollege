"use strict";

/** Typed index of the "in front" rope-cuffs option (last entry in the HempRope option list) */
const InventoryItemArmsHempRopeRopeCuffsFrontTypedIndex = 17;

/** @type {ExtendedItemCallbacks.BeforeDraw} */
function AssetsItemArmsHempRopeBeforeDraw(data) {
	const subType = data.Property?.TypeRecord?.typed ?? 0;
	if (data.L === "Leash" && subType === InventoryItemArmsHempRopeRopeCuffsFrontTypedIndex) {
		// Held art follows the item's IsLeashed flag and chat-room leash state (CharacterRefreshLeash does not reload C.Effect)
		return { LayerType: InventoryItemArmsHempRopeRopeCuffsIsLeashHeld(data.C, data.CA) ? "Held" : "" };
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

/**
 * Whether the rope-cuffs leash should use held art for the passed character
 * @param {Character} C
 * @param {Item} item
 * @returns {boolean}
 */
function InventoryItemArmsHempRopeRopeCuffsIsLeashHeld(C, item) {
	if (InventoryItemHasEffect(item, "IsLeashed", true)) return true;
	if (C.IsPlayer() && ChatRoomLeashPlayer != null) return true;
	return Array.isArray(ChatRoomLeashList) && C.MemberNumber != null && ChatRoomLeashList.indexOf(C.MemberNumber) >= 0;
}
