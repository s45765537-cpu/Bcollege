"use strict";

const AssetsItemHeadInteractiveVRHeadsetBackgrounds = [
	"",
	"SynthWave",
	"Dungeon",
	"SciFiCell",
	"AncientRuins",
	"HypnoticSpiral",
];

/** @type {ExtendedItemCallbacks.ScriptDraw<AnimationPersistentData>} */
function AssetsItemHeadInteractiveVRHeadsetScriptDraw(data) {
	const { C, Item } = data;
	if (!C.IsPlayer()) return;
	const type = Item.Property?.TypeRecord ?? {};
	const bg = AssetsItemHeadInteractiveVRHeadsetBackgrounds[type.b];
	if (type.f === 1) {
		C.CustomBackground = "";
	} else if (type.f !== 0) {
		C.CustomBackground = bg;
	} else {
		C.CustomBackground = undefined;
	}
}
