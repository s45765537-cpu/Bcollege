"use strict";

const { character, Game } = require("./Utils");

const appearances = /** @type {Record<string, { items: ItemBundle[], removalGroups: AssetGroupName[], actuallyRemovedGroups: AssetGroupName[] }>} */(
	require("./InventoryRemove.json")
);

/** @type {Character} */
let C;
/** @type {ReadonlySet<AssetString>} */
let originalItems;

beforeAll(async () => {
    await Game.loadAll();

	/** @type {AssetItemGroup} */
	const group1 = Game.AssetGroupGet("Female3DCG", "ItemLegs");
	if (!group1) { throw new Error("Missing group 'ItemLegs'"); }
	/** @type {AssetItemGroup} */
	const group2 = Game.AssetGroupGet("Female3DCG", "ItemFeet");
	if (!group2) { throw new Error("Missing group 'ItemFeet'"); }

	/** @type {AssetDefinition.Item} */
	const assetdef1 = {
		Name: "MockCyclicAsset1",
		RemoveItemOnRemove: [{ Group: group2.Name, Name: "MockCyclicAsset2" }],
	};
	/** @type {AssetDefinition.Item} */
	const assetdef2 = {
		Name: "MockCyclicAsset2",
		RemoveItemOnRemove: [{ Group: group1.Name, Name: "MockCyclicAsset1" }],
	};

	Game.AssetAdd(group1, assetdef1, {}, {});
	Game.AssetAdd(group2, assetdef2, {}, {});
});

beforeEach(() => {
    C = character.create("jest-InventoryItem");
    originalItems = new Set(character.appearanceStringify(C.Appearance));
});

afterEach(() => {
    character.destroy(C);
});

/**
 * @param {{ items: ItemBundle[], actuallyRemovedGroups: AssetGroupName[] }} data
 */
function preUnequip({ items, actuallyRemovedGroups }) {
	/** @type {Set<AssetString>} */
	const expectedPeristingItems = new Set();
	/** @type {Set<AssetString>} */
	const expectedRemovedItems = new Set();
	for (const itemBundle of items) {
		character.inventoryWear(C, itemBundle);
		const itemSet = actuallyRemovedGroups.includes(itemBundle.Group) ? expectedRemovedItems : expectedPeristingItems;
		itemSet.add(`${itemBundle.Group}/${itemBundle.Name}`);
	}
	character.refresh(C);
	return { expectedPeristingItems, expectedRemovedItems };
}
/**
 * @param {readonly Item[]} removedItems
 * @param {ReadonlySet<AssetString>} expectedPeristingItems
 * @param {ReadonlySet<AssetString>} expectedRemovedItems
 */
function postUnequip(removedItems, expectedPeristingItems, expectedRemovedItems) {
	const removedItemNames = new Set(character.appearanceStringify(removedItems));
	const currentItems = new Set(character.appearanceStringify(C.Appearance));
	expect(currentItems, "Invalid persisting items").toMatchObject(expectedPeristingItems.union(originalItems));
	expect(removedItemNames, "Invalid removed items").toMatchObject(expectedRemovedItems);
}

describe("InventoryRemove", () => {
	const param = Object.entries(appearances).map(([k, v]) => { return { name: k, ...v }; });

    it.each(param)("InventoryRemove: $name", (data) => {
		const { expectedPeristingItems, expectedRemovedItems } = preUnequip(data);
        /** @type {Item[]} */
        const removedItems = Game.InventoryRemove(C, data.removalGroups);
		postUnequip(removedItems, expectedPeristingItems, expectedRemovedItems);
    });

    it.each(param)("InventoryRemoveItems: $name", (data) => {
		const { expectedPeristingItems, expectedRemovedItems } = preUnequip(data);
		const removalItems = C.Appearance.filter(item => data.removalGroups.includes(item.Asset.Group.Name));
        /** @type {Item[]} */
        const removedItems = Game.InventoryRemoveItems(C, removalItems);
		postUnequip(removedItems, expectedPeristingItems, expectedRemovedItems);
    });
});
