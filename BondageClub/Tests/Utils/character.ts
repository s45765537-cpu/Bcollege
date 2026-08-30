import { Game } from "./game";
import { filterNullValues, cloneDeep } from "./utils";

/**
 * Construct a character of the given type
 * @param name The character game
 * @param options Further options
 * @returns The created character
 */
export function create(name: string, options: null | { type?: CharacterType } = null): Character {
	options ??= {};

	let C: Character;
	switch (options.type ?? "simple") {
		case "simple":
			C = Game.CharacterLoadSimple(name);
			break;
		case "player":
			// FIXME - WIP
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
 */
export function destroy(C: Character): void {
	Game.CharacterDelete(C);
}

/**
 * Refresh the passed character
 */
export function refresh(C: Character): void {
	Game.CharacterRefresh(C, true);
}

/**
 * Reset the appearance of the passed character
 */
export function appearanceReset(C: Character): void {
	Game.CharacterAppearanceSetDefault(C);
}

/**
 * Equip the passed item bundle
 */
export function inventoryWear(C: Character, itemBundle: ItemBundle): Item {
	itemBundle = cloneDeep(itemBundle);
	const item: null | Item = Game.InventoryWear(C, itemBundle.Name, itemBundle.Group, itemBundle.Color, itemBundle.Difficulty, null, itemBundle.Craft, false);
	if (item == null) {
		throw new Error(`Failed to equip "${JSON.stringify(itemBundle)}" bundle`);
	}
	Object.assign(item.Property, itemBundle.Property ?? {});
	return item;
}

/**
 * Convert the passed item list into item bundles, removing any undefined item properties
 */
export function appearancePack(items: readonly Item[]): ItemBundle[] {
	return cloneDeep(items.map(item => {
		const itemBundle: ItemBundle = Game.ServerBundledItemFromAppearanceItem(item);
		// Remove undefined values in order to make Jest's `toMatchObject()` output easier to evaluate
		return filterNullValues(itemBundle);
	}));
}

/**
 * Convert the passed item bundle list into items, removing any undefined item properties
 */
export function appearanceUnpack(items: readonly ItemBundle[]): Item[] {
	return items.map(itemBundle => {
		const item: null | Item = Game.ServerBundledItemToAppearanceItem("Female3DCG", cloneDeep(itemBundle));
		if (item == null) {
			throw new Error(`Failed to unpack "${JSON.stringify(itemBundle)}" bundle`);
		}
		return filterNullValues(item);
	});
}

/**
 * Convert a list of items into asset strings represented via their group- and asset name
 */
export function appearanceStringify(items: readonly Item[]): AssetString[] {
	return items.map(item => `${item.Asset.Group.Name}/${item.Asset.Name}` as const);
}
