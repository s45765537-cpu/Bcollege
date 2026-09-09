import { Game } from "./Utils";

import testParam from "./Server.json";

let extendedAsset: Asset;
const asset = {
	Name: "Foo",
	get ColorableLayerCount() { return this.DefaultColor.length; },
	DefaultColor: ["Default", "Default"],
	Group: {
		Name: "ItemArms",
	},
} satisfies ColorAssetMock;

beforeAll(async () => {
	const ret = await Game.loadAll();
	extendedAsset = Game.AssetGet("Female3DCG", "ItemPelvis", "ModularChastityBelt");
	if (!extendedAsset) {
		throw new Error(`Failed to retrieve asset "ItemPelvis/ModularChastityBelt"`);
	}
	return ret;
});

describe("ServerBundledItemFromAppearanceItem", () => {
	it("non-default difficulty", () => {
		const item = {
			Asset: asset,
			Difficulty: 5,
			Color: ["Default", "Default"],
			Property: {},
		};
		expect(Game.ServerBundledItemFromAppearanceItem(item)).toEqual({
			Group: "ItemArms",
			Name: "Foo",
			Difficulty: 5,
		});
	});

	it("nullish difficulty", () => {
		const item = {
			Asset: asset,
			Difficulty: null,
			Color: ["Default", "Default"],
		};
		expect(Game.ServerBundledItemFromAppearanceItem(item)).toEqual({
			Group: "ItemArms",
			Name: "Foo",
			Difficulty: undefined,
		});
	});

	it("non-default property", () => {
		const item = {
			Asset: extendedAsset,
			Color: ["#CC43C8", "#818181", "#818181", "#818181", "#9A862D", "#BABABA"],
			Property: { TriggerCount: 99, OverridePriority: 6, Difficulty: 5, ShowText: true },
		};
		expect(Game.ServerBundledItemFromAppearanceItem(item)).toEqual({
			Group: "ItemPelvis",
			Name: "ModularChastityBelt",
			Property: { TriggerCount: 99, OverridePriority: 6 },
		});
	});

	it("nullish property", () => {
		const item = {
			Asset: asset,
			Color: ["Default", "Default"],
			Property: null,
		};
		expect(Game.ServerBundledItemFromAppearanceItem(item)).toEqual({
			Group: "ItemArms",
			Name: "Foo",
			Property: undefined,
		});
	});

	it("non-default craft", () => {
		const item = {
			Asset: asset,
			Difficulty: 0,
			Color: ["Default", "Default"],
			Property: {},
			Craft: {
				Name: "Bob",
				Description: "I am a description",
				Effects: {},
				Color: "Default",
				Lock: "",
				Item: "Foo",
				Private: false,
				ItemProperty: { Difficulty: 5 },
			},
		};
		expect(Game.ServerBundledItemFromAppearanceItem(item)).toEqual({
			Group: "ItemArms",
			Name: "Foo",
			Craft: {
				Name: "Bob",
				Description: "I am a description",
				Effects: {},
				Color: "Default",
				Lock: "",
				Item: "Foo",
				Private: false,
				ItemProperty: { Difficulty: 5 },
			},
		});
	});

	it("non-default color: array-based", () => {
		const item = {
			Asset: asset,
			Difficulty: 0,
			Color: ["#001122", "Default"],
			Property: {},
		};
		expect(Game.ServerBundledItemFromAppearanceItem(item)).toEqual({
			Group: "ItemArms",
			Name: "Foo",
			Color: ["#001122", "Default"],
		});
	});

	it("non-default color: string-based (backwards compatibility)", () => {
		const item = {
			Asset: asset,
			Difficulty: 0,
			Color: "#001122",
			Property: {},
		};
		expect(Game.ServerBundledItemFromAppearanceItem(item)).toEqual({
			Group: "ItemArms",
			Name: "Foo",
			Color: "#001122",
		});
	});

	it("default color: string-based (backwards compatibility)", () => {
		const item = {
			Asset: asset,
			Difficulty: 0,
			Color: "Default",
			Property: {},
		};
		expect(Game.ServerBundledItemFromAppearanceItem(item)).toEqual({
			Group: "ItemArms",
			Name: "Foo",
		});
	});

	it("default color: undefined (backwards compatibility)", () => {
		const item = {
			Asset: asset,
			Difficulty: 0,
			Color: undefined,
			Property: {},
		};
		expect(Game.ServerBundledItemFromAppearanceItem(item)).toEqual({
			Group: "ItemArms",
			Name: "Foo",
		});
	});

	const extendedItemParam = Object.entries(testParam.extended_item).map(([k, v]) => { return { name: k, ...v }; });
	it.each(extendedItemParam)("extended item: $name", ({ initialItemType, itemBundleType, finalItemType }) => {
		const item = {
			Asset: extendedAsset,
			Property: { TypeRecord: initialItemType },
		};

		let bundle: ItemBundle;
		let itemRestored: null | Item;
		const consoleError = Game.console.error;
		try {
			// Silence `console.error()` calls due to expected invalid `TypeRecord` values
			Game.console.error = () => undefined;
			bundle = Game.ServerBundledItemFromAppearanceItem(item);
			itemRestored = Game.ServerBundledItemToAppearanceItem("Female3DCG", bundle);
		} finally {
			Game.console.error = consoleError;
		}

		expect(bundle, "item to bundle conversion").toEqual({
			Group: "ItemPelvis",
			Name: "ModularChastityBelt",
			Property: itemBundleType ? { TypeRecord: itemBundleType } : undefined,
		});

		expect(itemRestored, "bundle to item re-conversion").not.toBe(null);
		expect(itemRestored?.Property?.TypeRecord, "bundle to item re-conversion").toEqual(finalItemType);
	});

	const lockParam = testParam.lock.assets.map(({ asset, group, comment }) => {
		return { name: `${group}/${asset} (${comment})`, assetParam: { asset, group }, ...testParam.lock };
	 });
	it.each(lockParam)("locked item: $name", ({ initialItemProperty, itemBundleProperty, finalItemProperty, assetParam }) => {
		const asset: Asset = Game.AssetGet("Female3DCG", assetParam.group, assetParam.asset);
		expect(asset, "asset fetching").not.toBe(null);

		const item = {
			Asset: asset,
			Property: initialItemProperty,
		};
		const bundle: ItemBundle = Game.ServerBundledItemFromAppearanceItem(item);
		const itemRestored: null | Item = Game.ServerBundledItemToAppearanceItem("Female3DCG", bundle);

		expect(bundle, "item to bundle conversion").toEqual({
			Group: asset.Group.Name,
			Name: asset.Name,
			Property: itemBundleProperty,
		});

		expect(itemRestored, "bundle to item re-conversion").not.toBe(null);
		expect(itemRestored?.Property?.LockedBy, "bundle to item re-conversion").toEqual(finalItemProperty.LockedBy);
		expect(itemRestored?.Property?.LockMemberNumber, "bundle to item re-conversion").toEqual(finalItemProperty.LockMemberNumber);
		expect(itemRestored?.Property?.CombinationNumber, "bundle to item re-conversion").toEqual(finalItemProperty.CombinationNumber);
		expect(itemRestored?.Property?.Effect, "bundle to item re-conversion").toEqual(expect.arrayContaining(finalItemProperty.Effect));
	});
});
