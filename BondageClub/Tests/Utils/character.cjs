const { Game } = require("./game.cjs");
const { filterNullValues, cloneDeep } = require("./utils.cjs");

/**
 * Construct a character of the given type
 * @param {string} name The character game
 * @param {null | { type?: CharacterType }} options Further options
 * @returns {Character} The created character
 */
function create(name, options=null) {
	options ??= {};

	/** @type {Character} */
	let C;
	switch (options.type ?? "simple") {
		case "simple":
			C = Game.CharacterLoadSimple(name);
			break;
		case "player":
			// FIXME - WIP
			/** @type {Character} */
			C = Game.CharacterReset(0, "Female3DCG");
			C.Name = C.AccountName = name;
			Game.PreferenceInit(C);
			throw new Error(`Character type support "${options.type}" not yet implemented`);
		default:
			throw new Error(`Character type support "${options.type}" not yet implemented`);
	}
	appearanceReset(C);
	return C;
}

/**
 * Delete the passed character
 * @param {Character} C
 */
function destroy(C) {
	Game.CharacterDelete(C);
}

/**
 * Refresh the passed character
 * @param {Character} C
 */
function refresh(C) {
	Game.CharacterRefresh(C, true);
}

/**
 * Reset the appearance of the passed character
 * @param {Character} C
 * @returns {void}
 */
function appearanceReset(C) {
	Game.CharacterAppearanceSetDefault(C);
}

/**
 * Equip the passed item bundle
 * @param {Character} C
 * @param {ItemBundle} itemBundle
 * @returns {Item}
 */
function inventoryWear(C, itemBundle) {
	itemBundle = cloneDeep(itemBundle);
	/** @type {null | Item} */
	const item = Game.InventoryWear(C, itemBundle.Name, itemBundle.Group, itemBundle.Color, itemBundle.Difficulty, null, itemBundle.Craft, false);
	if (item == null) {
		throw new Error(`Failed to equip "${JSON.stringify(itemBundle)}" bundle`);
	}
	Object.assign(item.Property, itemBundle.Property ?? {});
	return item;
}

/**
 * Convert the passed item list into item bundles, removing any undefined item properties
 * @param {readonly Item[]} items
 * @returns {ItemBundle[]}
 */
function appearancePack(items) {
	return cloneDeep(items.map(item => {
		/** @type {ItemBundle} */
		const itemBundle = Game.ServerBundledItemFromAppearanceItem(item);
		// Remove undefined values in order to make Jest's `toMatchObject()` output easier to evaluate
		return filterNullValues(itemBundle);
	}));
}

/**
 * Convert the passed item bundle list into items, removing any undefined item properties
 * @param {readonly ItemBundle[]} items
 * @returns {Item[]}
 */
function appearanceUnpack(items) {
	return items.map(itemBundle => {
		/** @type {null | Item} */
		const item = Game.ServerBundledItemToAppearanceItem("Female3DCG", cloneDeep(itemBundle));
		if (item == null) {
			throw new Error(`Failed to unpack "${JSON.stringify(itemBundle)}" bundle`);
		}
		return filterNullValues(item);
	});
}

/**
 * Convert a list of items into asset strings represented via their group- and asset name
 * @param {readonly Item[]} items
 * @returns {AssetString[]}
 */
function appearanceStringify(items) {
	return items.map(item => /** @type {const} */(`${item.Asset.Group.Name}/${item.Asset.Name}`));
}

module.exports = {
  create,
  destroy,
  refresh,
  appearanceReset,
  appearanceStringify,
  inventoryWear,
  appearancePack,
  appearanceUnpack,
};
