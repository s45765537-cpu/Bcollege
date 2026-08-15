import { Game } from "./Utils";

Game.load("../Scripts/Common.js");
Game.load("../Scripts/Drawing.js");
Game.load("../Scripts/Server.js");

Game.load("../Scripts/Translation.js");
Game.load("../Scripts/Text.js");
Game.load("../Screens/Character/ItemColor/ItemColor.js");

const asset = {
	Name: "Foo",
	get ColorableLayerCount() { return this.DefaultColor.length; },
	DefaultColor: ["Default", "Default"],
	Group: {
		Name: "ItemArms",
	},
} satisfies ColorAssetMock;

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
			Asset: asset,
			Color: ["Default", "Default"],
			Property: { Difficulty: 5 },
		};
		expect(Game.ServerBundledItemFromAppearanceItem(item)).toEqual({
			Group: "ItemArms",
			Name: "Foo",
			Property: { Difficulty: 5 },
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
});
