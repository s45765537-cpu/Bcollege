"use strict";
const { Game } = require("./Utils");

/** @type {ColorAssetMock} */
let asset;

beforeAll(async () => {
	await Game.loadAll();
	asset = {
		Name: "Foo",
		get ColorableLayerCount() { return this.DefaultColor.length; },
		DefaultColor: ["Default", "#112233"],
		Group: {
			ColorSchema: ["Default", "White", "Asian", "Black"],
		},
	};
});

describe("Item.fromAsset", () => {
	it("item from asset", () => {
		expect(Game.Item.fromAsset(asset, {
			color: "Black",
			difficulty: 5,
			property: { Difficulty: 3 },
		})).toEqual({
			Asset: asset,
			Color: ["Black", "Black"],
			Difficulty: 5,
			Property: { Difficulty: 3 },
		});
	});

	it("item with invalid color", () => {
		expect(Game.Item.fromAsset(asset, { color: "Blegh" })).toMatchObject({
			Color: ["Default", "#112233"],
			Difficulty: 0,
			Property: {},
		});
	});

	it("item with too short of a color array", () => {
		expect(Game.Item.fromAsset(asset, { color: ["#445566"] })).toMatchObject({
			Color: ["#445566", "#112233"],
			Difficulty: 0,
			Property: {},
		});
	});

	it("item with too long of a color array", () => {
		expect(Game.Item.fromAsset(asset, { color: ["#444444", "#555555", "#666666"] })).toMatchObject({
			Color: ["#444444", "#555555"],
			Difficulty: 0,
			Property: {},
		});
	});
});

describe("Item.fromName", () => {
	it("item from group- and asset name", () => {
		expect(Game.Item.fromName("ItemArms", "NylonRope", { color: "#778899" })).toMatchObject({
			Color: ["#778899"],
			Difficulty: 0,
			Property: {},
		});
	});

	it("item from invalid group- and/or asset name", () => {
		expect(Game.Item.fromName("Foo", "Bar")).toBe(null);
	});
});
