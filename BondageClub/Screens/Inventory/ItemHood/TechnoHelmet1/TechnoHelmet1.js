"use strict";

/** @type {ExtendedItemCallbacks.ScriptDraw<AnimationPersistentData>} */
function AssetsItemHoodTechnoHelmet1ScriptDraw(data) {
	const { C, Item } = data;
	if (!C.IsPlayer()) return;
	const type = Item.Property?.TypeRecord ?? {};
	if (type.v === 5) {
		C.CustomBackground = "HypnoSpiral2";
	} else {
		C.CustomBackground = undefined;
	}
}
