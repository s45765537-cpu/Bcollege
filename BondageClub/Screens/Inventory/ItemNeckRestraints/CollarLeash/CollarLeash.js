"use strict";

/** @type {ExtendedItemCallbacks.BeforeDraw} */
function AssetsItemNeckRestraintsCollarLeashBeforeDraw(data) {
	if (data.L === "Handle" || data.L === "Leash") {
		return { LayerType: data.C.HasEffect("IsLeashed") ? "Held" : ""};
	}
}

/** @type {ExtendedItemCallbacks.BeforeDraw} */
function AssetsItemNeckRestraintsChainLeashBeforeDraw(data) {
	return AssetsItemNeckRestraintsCollarLeashBeforeDraw(data);
}
