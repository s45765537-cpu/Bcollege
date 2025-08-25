"use strict";
/** @type {ExtendedItemScriptHookCallbacks.Init<ModularItemData>} */
function InventoryClothOffTheShoulderTopInitHook({ asset }, originalFunction, C, item, push, refresh) {
	const ret = originalFunction(C, item, false, false);
	if (ret) {
		ExtendedItemSetOptionByRecord(C, item, { Right: 1 });
	}
	return true;
}
