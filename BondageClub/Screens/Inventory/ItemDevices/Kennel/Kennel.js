"use strict";

/**
 * @typedef {{ DoorState?: number, DrawRequested?: boolean, MustChange?: boolean, ChangeTime?: number } & AnimationPersistentData} KennelPersistentData
 */

/** @type {ExtendedItemCallbacks.BeforeDraw<KennelPersistentData>} */
function AssetsItemDevicesKennelBeforeDraw(drawData) {
	const { PersistentData, L, Property } = drawData;
	if (L !== "Door") return drawData;

	const Data = PersistentData();
	Data.DoorState ??= 0;
	const Door = Property.Door || false;

	if (Data.DoorState >= 11 || Data.DoorState <= 1) Data.MustChange = false;

	if ((Data.DoorState < 11 && Door) || (Data.DoorState > 1 && !Door)) {
		if (Data.DrawRequested) Data.DoorState += Door ? 1 : -1;
		Data.MustChange = true;
		Data.DrawRequested = false;
		if (Data.DoorState < 11 && Data.DoorState > 1) return { LayerType: "A" + Data.DoorState };
	}
	return drawData;
}

/** @type {ExtendedItemCallbacks.ScriptDraw<KennelPersistentData>} */
function AssetsItemDevicesKennelScriptDraw({ C, PersistentData, Item }) {
	const Data = PersistentData();
	const Properties = Item.Property || {};
	const Door = Properties.Door || false;
	const FrameTime = 200;

	if (typeof Data.DoorState !== "number") Data.DoorState = Door ? 11 : 1;
	if (typeof Data.ChangeTime !== "number") Data.ChangeTime = CommonTime() + FrameTime;

	if (Data.MustChange && Data.ChangeTime < CommonTime()) {
		Data.ChangeTime = CommonTime() + FrameTime;
		Data.DrawRequested = true;
		AnimationRequestRefreshRate(C, FrameTime);
		AnimationRequestDraw(C);
	}
}

/**
 * @param {Character} C
 * @returns {string}
 */
function InventoryItemDevicesKennelGetAudio(C) {
	let wasWorn = InventoryGet(C, "ItemDevices")?.Asset.Name === "Kennel";
	let isSelf = C.IsPlayer();
	return isSelf && wasWorn ? "CageStruggle" : "CageEquip";
}
