"use strict";
const { Game } = require("./Utils");

Game.load("../Scripts/Common.js");
Game.load("../Scripts/Drawing.js");
Game.load("../Scripts/Server.js");

Game.load("../Scripts/Validation.js");

/** @satisfies {ColorAssetMock} */
const partialAsset = {
	get ColorableLayerCount() { return this.DefaultColor.length; },
	DefaultColor: ["Default", "#112233"],
	Group: {
		ColorSchema: ["Default"],
	},
};

describe("ValidationSanitizeColor", () => {
	it("invalid color: valid string - BC custom color", () => {
		const item = { Asset: partialAsset, Color: "Default" };
		expect(Game.ValidationSanitizeColor(item)).toBe(true);
		expect(item.Color).toMatchObject(["Default", "Default"]);
	});

	it("invalid color: valid string - hex code", () => {
		const item = { Asset: partialAsset, Color: "#001100" };
		expect(Game.ValidationSanitizeColor(item)).toBe(true);
		expect(item.Color).toMatchObject(["#001100", "#001100"]);
	});

	it("invalid color: invalid string", () => {
		const item = { Asset: partialAsset, Color: "Black" };
		expect(Game.ValidationSanitizeColor(item)).toBe(true);
		expect(item.Color).toMatchObject(partialAsset.DefaultColor);
	});

	it("invalid color: undefined", () => {
		const item = { Asset: partialAsset, Color: undefined };
		expect(Game.ValidationSanitizeColor(item)).toBe(true);
		expect(item.Color).toMatchObject(partialAsset.DefaultColor);
	});

	it("invalid color: integer", () => {
		const item = { Asset: partialAsset, Color: 5 };
		expect(Game.ValidationSanitizeColor(item)).toBe(true);
		expect(item.Color).toMatchObject(partialAsset.DefaultColor);
	});

	it("valid color: string array", () => {
		const item = { Asset: partialAsset, Color: ["#001122", "Default"] };
		expect(Game.ValidationSanitizeColor(item)).toBe(false);
		expect(item.Color).toMatchObject(["#001122", "Default"]);
	});

	it("invalid color: mixed datatype array", () => {
		const item = { Asset: partialAsset, Color: ["#001122", 1] };
		expect(Game.ValidationSanitizeColor(item)).toBe(true);
		expect(item.Color).toMatchObject(["#001122", partialAsset.DefaultColor[1]]);
	});

	it("invalid color: too long string array", () => {
		const item = { Asset: partialAsset, Color: ["#001122", "#334455", "#667788"] };
		expect(Game.ValidationSanitizeColor(item)).toBe(true);
		expect(item.Color).toMatchObject(["#001122", "#334455"]);
	});

	it("invalid color: too short string array", () => {
		const item = { Asset: partialAsset, Color: ["#001122"] };
		expect(Game.ValidationSanitizeColor(item)).toBe(true);
		expect(item.Color).toMatchObject(["#001122", partialAsset.DefaultColor[1]]);
	});
});
