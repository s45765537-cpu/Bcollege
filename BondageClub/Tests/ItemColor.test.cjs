"use strict";
const { Game } = require("./Utils");

Game.load("../Scripts/Common.js");
Game.load("../Scripts/Translation.js");
Game.load("../Scripts/Text.js");
Game.load("../Screens/Character/ItemColor/ItemColor.js");

/** @satisfies {ColorAssetMock} */
const partialAsset1 = {
	get ColorableLayerCount() { return this.DefaultColor.length; },
	DefaultColor: ["Default", "#112233"],
	Group: {},
};

/** @satisfies {ColorAssetMock} */
const partialAsset2 = {
	get ColorableLayerCount() { return this.DefaultColor.length; },
	DefaultColor: ["Default", "Default"],
	Group: {},
};

describe("ItemColorIsDefault", () => {
	it("equivalent to non-default color: string-based", () => {
		const item = { Asset: partialAsset1, Color: "Default" };
		expect(Game.ItemColorIsDefault(item)).toBe(false);
	});

	it("equivalent to default color: string-based", () => {
		const item = { Asset: partialAsset2, Color: "Default" };
		expect(Game.ItemColorIsDefault(item)).toBe(true);
	});

	it("equivalent to default color: implicit (undefined)", () => {
		const item = { Asset: partialAsset1, Color: undefined };
		expect(Game.ItemColorIsDefault(item)).toBe(true);
	});

	it("equivalent to default color: array-based", () => {
		const item = { Asset: partialAsset1, Color: partialAsset1.DefaultColor };
		expect(Game.ItemColorIsDefault(item)).toBe(true);
	});

	it("equivalent to default color: array-based (array too long w.r.t. reference)", () => {
		const item = { Asset: partialAsset1, Color: [...partialAsset1.DefaultColor, "Default", "Default"] };
		expect(Game.ItemColorIsDefault(item)).toBe(true);
	});

	it("equivalent to non-default color: array-based", () => {
		const item = { Asset: partialAsset1, Color: ["#000000"] };
		expect(Game.ItemColorIsDefault(item)).toBe(false);
	});
});
