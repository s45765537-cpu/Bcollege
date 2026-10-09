"use strict";

import { character, Game} from "./Utils";

import testAppearanceData from "./InventoryRemove.json";

const appearances = testAppearanceData as Record<string, { items: ItemBundle[], removalGroups: AssetGroupName[], actuallyRemovedGroups: AssetGroupName[] }>;

let C: Character;
let originalItems: ReadonlySet<AssetString>;

beforeAll(async () => {
    await Game.loadAll();

	const group1: AssetItemGroup = Game.AssetGroupGet("Female3DCG", "ItemLegs");
	if (!group1) { throw new Error("Missing group 'ItemLegs'"); }
	const group2: AssetItemGroup = Game.AssetGroupGet("Female3DCG", "ItemFeet");
	if (!group2) { throw new Error("Missing group 'ItemFeet'"); }


	const assetdef1: AssetDefinition.Item = {
		Name: "MockCyclicAsset1",
		RemoveItemOnRemove: [{ Group: group2.Name, Name: "MockCyclicAsset2" }],
	};
	const assetdef2: AssetDefinition.Item = {
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

function preUnequip({ items, actuallyRemovedGroups }: { items: ItemBundle[], actuallyRemovedGroups: AssetGroupName[] }) {
	const expectedPersistingItems = new Set<AssetString>();
	const expectedRemovedItems = new Set<AssetString>();
	for (const itemBundle of items) {
		character.inventoryWear(C, itemBundle);
		const itemSet = actuallyRemovedGroups.includes(itemBundle.Group) ? expectedRemovedItems : expectedPersistingItems;
		itemSet.add(`${itemBundle.Group}/${itemBundle.Name}`);
	}
	character.refresh(C);
	return { expectedPersistingItems, expectedRemovedItems };
}

function postUnequip(removedItems: readonly Item[], expectedPeristingItems: ReadonlySet<AssetString>, expectedRemovedItems: ReadonlySet<AssetString>) {
	const removedItemNames = new Set(character.appearanceStringify(removedItems));
	const currentItems = new Set(character.appearanceStringify(C.Appearance));
	expect(currentItems, "Invalid persisting items").toMatchObject(expectedPeristingItems.union(originalItems));
	expect(removedItemNames, "Invalid removed items").toMatchObject(expectedRemovedItems);
}

describe("InventoryRemove", () => {
	const param = Object.entries(appearances).map(([k, v]) => { return { name: k, ...v }; });

    it.each(param)("InventoryRemove: $name", (data) => {
		const { expectedPersistingItems, expectedRemovedItems } = preUnequip(data);
        const removedItems: Item[] = Game.InventoryRemove(C, data.removalGroups);
		postUnequip(removedItems, expectedPersistingItems, expectedRemovedItems);
    });

    it.each(param)("InventoryRemoveItems: $name", (data) => {
		const { expectedPersistingItems, expectedRemovedItems } = preUnequip(data);
		const removalItems = C.Appearance.filter(item => data.removalGroups.includes(item.Asset.Group.Name));
        const removedItems: Item[] = Game.InventoryRemoveItems(C, removalItems);
		postUnequip(removedItems, expectedPersistingItems, expectedRemovedItems);
    });
});
