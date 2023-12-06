"use strict";

/** @type {ExtendedItemCallbacks.BeforeDraw} */
function AssetsItemArmsHempRopeBeforeDraw(data) {
	const typeRecord = (data.Property && data.Property.TypeRecord) || {};
	const subType = typeRecord.typed || 0;

	if (data.LayerType === "BedSpreadEagle") {
		return {
			X: data.X - 50,
			Y: data.Y - 150,
		};
	} else if (subType === 12 && data.L === "_Suspension") {
		return {
			// Hide the rope split-into-four behind hair as otherwise it appears odd
			Y: data.Y + 30,
		};
	}

	return null;
}
