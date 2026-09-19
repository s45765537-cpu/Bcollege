import { Game } from "./Utils";

import testParam from "./Server.json";

let extendedAsset: Asset;
const asset = {
	Name: "Foo",
	get ColorableLayerCount() { return this.DefaultColor.length; },
	DefaultColor: ["Default", "Default"],
	Group: {
		Name: "ItemArms",
		HasExpression(): this is AssetExpressionGroup { return false; },
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

	const lockParam = testParam.lock.assets.flatMap(({ asset, group, comment }) => {
		return Object.entries(testParam.lock.locks).map(([lock, _data]) => {
			const data = _data as Record<"initialItemProperty" | "itemBundleProperty" | "finalItemProperty", ItemProperties>;
			return { name: `${lock} - ${group}/${asset} (${comment})`, assetParam: { asset, group }, ...data };
		});
	 });
	it.each(lockParam)("lock item: $name", ({ initialItemProperty, itemBundleProperty, finalItemProperty, assetParam }) => {
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
		expect(itemRestored?.Property?.Effect, "bundle to item re-conversion").toEqual(expect.arrayContaining(finalItemProperty.Effect ?? []));
		expect(itemRestored?.Property?.Password, "bundle to item re-conversion").toEqual(finalItemProperty.Password);
		expect(itemRestored?.Property?.LockSet, "bundle to item re-conversion").toEqual(finalItemProperty.LockSet);
		expect(itemRestored?.Property?.Hint, "bundle to item re-conversion").toEqual(finalItemProperty.Hint);
		expect(itemRestored?.Property?.RemoveOnUnlock, "bundle to item re-conversion").toEqual(finalItemProperty.RemoveOnUnlock);
	});

	it("script item", () => {
		const { initialItemProperty, itemBundleProperty, finalItemProperty } = testParam.itemScript;
		const asset: Asset = Game.AssetGet("Female3DCG", "ItemScript", "Script");
		expect(asset, "asset fetching").not.toBe(null);

		const item = { Asset: asset, Property: initialItemProperty };
		const bundle: ItemBundle = Game.ServerBundledItemFromAppearanceItem(item);
		const itemRestored: null | Item = Game.ServerBundledItemToAppearanceItem("Female3DCG", bundle);

		expect(bundle, "item to bundle conversion").toEqual({
			Group: asset.Group.Name,
			Name: asset.Name,
			Property: itemBundleProperty,
		});

		expect(itemRestored, "bundle to item re-conversion").not.toBe(null);
		expect(itemRestored?.Property?.Hide, "bundle to item re-conversion").toEqual(expect.arrayContaining(finalItemProperty.Hide));
		expect(itemRestored?.Property?.Block, "bundle to item re-conversion").toEqual(expect.arrayContaining(finalItemProperty.Block));
		expect(itemRestored?.Property?.UnHide, "bundle to item re-conversion").toEqual(expect.arrayContaining(finalItemProperty.UnHide));
		expect(itemRestored?.Property?.HideItem, "bundle to item re-conversion").toEqual(expect.arrayContaining(finalItemProperty.HideItem));
	});

	const baselineParam = testParam.baseline.map(({ asset, group, comment, ...rest }) => {
		return { name: `${group}/${asset} (${comment})`, assetParam: { asset, group }, ...rest };
	});
	it.each(baselineParam)("extended item baseline without typerecord: $name", ({ initialItemProperty, itemBundleProperty, finalItemProperty, assetParam }) => {
		const asset: Asset = Game.AssetGet("Female3DCG", assetParam.group, assetParam.asset);
		expect(asset, "asset fetching").not.toBe(null);

		const item = { Asset: asset, Property: initialItemProperty };
		const bundle: ItemBundle = Game.ServerBundledItemFromAppearanceItem(item);
		const itemRestored: null | Item = Game.ServerBundledItemToAppearanceItem("Female3DCG", bundle);

		expect(bundle, "item to bundle conversion").toEqual({
			Group: asset.Group.Name,
			Name: asset.Name,
			Property: itemBundleProperty,
		});

		expect(itemRestored, "bundle to item re-conversion").not.toBe(null);
		expect(itemRestored?.Property?.Text, "bundle to item re-conversion").toEqual(finalItemProperty.Text);
		expect(itemRestored?.Property?.Text2, "bundle to item re-conversion").toEqual(finalItemProperty.Text2);
		expect(itemRestored?.Property?.Text3, "bundle to item re-conversion").toEqual(finalItemProperty.Text3);
	});


	const effectsParam = testParam.effects.map(({ asset, group, comment, ...rest }) => {
		return { name: `${group}/${asset} (${comment})`, assetParam: { asset, group }, ...rest };
	});
	it.each(effectsParam)("items with custom effects: $name", ({ initialItemProperty, itemBundleProperty, finalItemProperty, assetParam }) => {
		const asset: Asset = Game.AssetGet("Female3DCG", assetParam.group, assetParam.asset);
		expect(asset, "asset fetching").not.toBe(null);

		const item = { Asset: asset, Property: initialItemProperty };
		const bundle: ItemBundle = Game.ServerBundledItemFromAppearanceItem(item);
		const itemRestored: null | Item = Game.ServerBundledItemToAppearanceItem("Female3DCG", bundle);

		expect(bundle, "item to bundle conversion").toEqual({
			Group: asset.Group.Name,
			Name: asset.Name,
			Property: itemBundleProperty,
		});

		expect(itemRestored, "bundle to item re-conversion").not.toBe(null);
		expect(itemRestored?.Property?.Effect, "bundle to item re-conversion").toEqual(expect.arrayContaining(finalItemProperty.Effect));
	});

	const variableHeightParam = testParam.variableHeight.map(({ asset, group, comment, ...rest }) => {
		return { name: `${group}/${asset} (${comment})`, assetParam: { asset, group }, ...rest };
	});
	it.each(variableHeightParam)("variable height extended item: $name", ({ initialItemProperty, itemBundleProperty, finalItemProperty, assetParam }) => {
		const asset: Asset = Game.AssetGet("Female3DCG", assetParam.group, assetParam.asset);
		expect(asset, "asset fetching").not.toBe(null);

		const item = { Asset: asset, Property: initialItemProperty };
		const bundle: ItemBundle = Game.ServerBundledItemFromAppearanceItem(item);
		const itemRestored: null | Item = Game.ServerBundledItemToAppearanceItem("Female3DCG", bundle);

		expect(bundle, "item to bundle conversion").toEqual({
			Group: asset.Group.Name,
			Name: asset.Name,
			Property: itemBundleProperty,
		});

		expect(itemRestored, "bundle to item re-conversion").not.toBe(null);
		expect(itemRestored?.Property?.TypeRecord, "bundle to item re-conversion").toEqual(finalItemProperty.TypeRecord);
		expect(itemRestored?.Property?.OverrideHeight, "bundle to item re-conversion").toEqual(finalItemProperty.OverrideHeight);
	});

	const overridePriorityParam = testParam.variableHeight.map(({ asset, group, comment, ...rest }) => {
		return { name: `${group}/${asset} (${comment})`, assetParam: { asset, group }, ...rest };
	});
	it.each(overridePriorityParam)("extended item with a mutable property: $name", ({ initialItemProperty, itemBundleProperty, finalItemProperty, assetParam }) => {
		const asset: Asset = Game.AssetGet("Female3DCG", assetParam.group, assetParam.asset);
		expect(asset, "asset fetching").not.toBe(null);

		const item = { Asset: asset, Property: initialItemProperty };
		const bundle: ItemBundle = Game.ServerBundledItemFromAppearanceItem(item);
		const itemRestored: null | Item = Game.ServerBundledItemToAppearanceItem("Female3DCG", bundle);

		expect(bundle, "item to bundle conversion").toEqual({
			Group: asset.Group.Name,
			Name: asset.Name,
			Property: itemBundleProperty,
		});

		expect(itemRestored, "bundle to item re-conversion").not.toBe(null);
		expect(itemRestored?.Property?.TypeRecord, "bundle to item re-conversion").toEqual(finalItemProperty.TypeRecord);
		expect(itemRestored?.Property?.OverrideHeight, "bundle to item re-conversion").toEqual(finalItemProperty.OverrideHeight);
	});

	const expressionParam = testParam.expression.map(({ asset, group, comment, ...rest }) => {
		return { name: `${group}/${asset} (${comment})`, assetParam: { asset, group }, ...rest };
	});
	it.each(expressionParam)("expression item: $name", ({ initialItemProperty, itemBundleProperty, finalItemProperty, assetParam }) => {
		const asset: Asset = Game.AssetGet("Female3DCG", assetParam.group, assetParam.asset);
		expect(asset, "asset fetching").not.toBe(null);

		const item = { Asset: asset, Property: initialItemProperty };
		const bundle: ItemBundle = Game.ServerBundledItemFromAppearanceItem(item);
		const itemRestored: null | Item = Game.ServerBundledItemToAppearanceItem("Female3DCG", bundle);

		expect(bundle, "item to bundle conversion").toEqual({
			Group: asset.Group.Name,
			Name: asset.Name,
			Property: itemBundleProperty ?? undefined,
		});

		// TODO: Mark expression groups as extended with an explicit `Expression` baseline property; ensuring that it is always initialized
		expect(itemRestored, "bundle to item re-conversion").not.toBe(null);
		expect(itemRestored?.Property?.Expression, "bundle to item re-conversion").toEqual(finalItemProperty.Expression ?? undefined);
	});

	const vibratorModeParam = Object.entries(testParam.vibratingItem.modes).map(([mode, _data]) => {
		const asset = testParam.vibratingItem.asset;
		const group = testParam.vibratingItem.group;
		const data = _data as Record<"initialItemProperty" | "itemBundleProperty" | "finalItemProperty", ItemProperties>;
		return { name: `${group}/${asset} (${mode})`, assetParam: { asset, group }, ...data };
	});
	it.each(vibratorModeParam)("vibrating extended item: $name", ({ initialItemProperty, itemBundleProperty, finalItemProperty, assetParam }) => {
		const asset: Asset = Game.AssetGet("Female3DCG", assetParam.group, assetParam.asset);
		expect(asset, "asset fetching").not.toBe(null);

		const item = { Asset: asset, Property: initialItemProperty };
		const bundle: ItemBundle = Game.ServerBundledItemFromAppearanceItem(item);
		const itemRestored: null | Item = Game.ServerBundledItemToAppearanceItem("Female3DCG", bundle);

		expect(bundle, "item to bundle conversion").toEqual({
			Group: asset.Group.Name,
			Name: asset.Name,
			Property: itemBundleProperty ?? undefined,
		});

		expect(itemRestored, "bundle to item re-conversion").not.toBe(null);
		expect(itemRestored?.Property?.TypeRecord, "bundle to item re-conversion").toEqual(finalItemProperty.TypeRecord);
		expect(itemRestored?.Property?.Mode, "bundle to item re-conversion").toEqual(finalItemProperty.Mode);
		expect(itemRestored?.Property?.Intensity, "bundle to item re-conversion").toEqual(finalItemProperty.Intensity);
		expect(itemRestored?.Property?.Effect, "bundle to item re-conversion").toEqual(expect.arrayContaining(finalItemProperty.Effect ?? []));
		expect(itemRestored?.Property?.State, "bundle to item re-conversion").toEqual(finalItemProperty.State);
	});
});
