"use strict";

const { Game } = require("./Utils");

Game.load("../Scripts/Common.js");

Game.load("../Scripts/GameLog.js");

/** @type {PlayerCharacter} */
let Player;
/** @type {LogRecord[]} */
let Log;

beforeEach(() => {
	// Build a dummy Player object just for its log
	Log = [];
	Game.Player = { Log: Log };

	const f = jest.fn(() => undefined);
	Game.ServerPlayerLogSync = f;
});

describe("LogGet", () => {
	beforeEach(() => {
		Log.push(
			// @ts-expect-error
			{ Name: "Name", Group: "Group" },
		);
	});

	it("returns a record if one matches", () => {
		const record = Game.LogGet("Name", "Group");
		expect(record).toMatchObject({ Name: "Name", Group: "Group" });
	});

	it("returns null if there's no match", () => {
		const record = Game.LogGet("Other", "None");
		expect(record).toBe(undefined);
	});
});

describe("LogAdd", () => {
	it("ignores an invalid name or group", () => {
		const length = Log.length;
		Game.LogAdd("Name", null);
		Game.LogAdd(null, "Group");
		expect(Log.length).toEqual(length);
	});

	it("ignores invalid values", () => {
		const length = Log.length;
		Game.LogAdd("Name", "Group", true);
		expect(Log.length).toEqual(length);

		const record = Game.LogGet("Name", "Group");
		expect(record).not.toBe(null);
	});


	it("puts a record for the given name and group", () => {
		const length = Log.length;
		Game.LogAdd("Name", "Group");
		expect(Log.length).toEqual(length + 1);

		const record = Game.LogGet("Name", "Group");
		expect(record).toMatchObject({ Name: "Name", Group: "Group", Value: undefined });
	});

	it("puts a record for the given name and group with the given value", () => {
		const length = Log.length;
		Game.LogAdd("Name", "Group", 10);
		expect(Log.length).toEqual(length + 1);

		const record = Game.LogGet("Name", "Group");
		expect(record).toMatchObject({ Name: "Name", Group: "Group", Value: 10 });
	});

	it("puts a record for the given name, group and string value", () => {
		const length = Log.length;
		Game.LogAdd("Name", "Group", "Test");
		expect(Log.length).toEqual(length + 1);

		const record = Game.LogGet("Name", "Group");
		expect(record).toMatchObject({ Name: "Name", Group: "Group", Value: "Test" });
	});

	it("puts a record for the given name, group and string array value", () => {
		const length = Log.length;
		Game.LogAdd("Name", "Group", ["1", "2", "3"]);
		expect(Log.length).toEqual(length + 1);

		const record = Game.LogGet("Name", "Group");
		expect(record).toMatchObject({ Name: "Name", Group: "Group", Value: ["1", "2", "3"] });
	});

	it("pushes out to server by default", () => {
		Game.LogAdd("Name", "Group", 0);
		expect(Game.ServerPlayerLogSync.mock.calls).toHaveLength(1);
	});

	it("skips server pushes on request", () => {
		Game.LogAdd("Name", "Group", 0, false);
		expect(Game.ServerPlayerLogSync.mock.calls).toHaveLength(0);
	});
});

describe("LogDelete", () => {
	beforeEach(() => {
		Log.push(
			// @ts-expect-error
			{ Name: "Name", Group: "Group", Value: 1 },
			{ Name: "Another", Group: "Group", Value: 1 },
			{ Name: "Name", Group: "Different", Value: 1 },
			{ Name: "Another", Group: "Different", Value: 1 },
		);
	});

	it("does nothing on an invalid group", () => {
		const length = Log.length;
		Game.LogDelete("Name", null);
		expect(Log.length).toEqual(length);
		expect(Game.ServerPlayerLogSync.mock.calls).toHaveLength(0);
	});

	it("deletes the matching record", () => {
		const length = Log.length;
		Game.LogDelete("Name", "Group");
		expect(Log.length).toEqual(length - 1);
		expect(Game.ServerPlayerLogSync.mock.calls).toHaveLength(1);
	});

	it("deletes the matching record without pushing", () => {
		const length = Log.length;
		Game.LogDelete("Name", "Group", false);
		expect(Log.length).toEqual(length - 1);
		expect(Game.ServerPlayerLogSync.mock.calls).toHaveLength(0);
	});

	it("deletes all matching records", () => {
		const length = Log.length;
		Game.LogDelete(null, "Group");
		expect(Log.length).toEqual(length - 2);
		expect(Game.ServerPlayerLogSync.mock.calls).toHaveLength(1);
	});

	it("deletes all matching records without pushing", () => {
		const length = Log.length;
		Game.LogDelete(null, "Group", false);
		expect(Log.length).toEqual(length - 2);
		expect(Game.ServerPlayerLogSync.mock.calls).toHaveLength(0);
	});
});

// LogDeleteStarting

describe("LogQuery", () => {
	beforeEach(() => {
		Log.push(
			// @ts-expect-error
			{ Name: "Valid", Group: "Group" },
			{ Name: "DidIntro", Group: "Group", Value: undefined },
			{ Name: "Timer", Group: "Group", Value: 1000},
			{ Name: "Timer2", Group: "Group", Value: 10000},
			{ Name: "Name", Group: "Array", Value: ["1", "2", "3"]},
		);
	});

	it("returns false for a non-existing record", () => {
		expect(Game.LogQuery("Invalid", "Group")).toBe(false);
	});

	it("returns true for a non-valued record", () => {
		expect(Game.LogQuery("Valid", "Group")).toBe(true);
		expect(Game.LogQuery("DidIntro", "Group")).toBe(true);
	});

	describe("against a number-valued record", () => {
		beforeEach(() => Game.CurrentTime = 10000);

		it("only returns true if it's more than the current time", () => {
			expect(Game.LogQuery("Timer", "Group")).toBe(false);
			expect(Game.LogQuery("Timer2", "Group")).toBe(true);
		});
	});

	it("returns true for a stringarray-valued record", () => {
		expect(Game.LogQuery("Name", "Array")).toBe(true);
	});
});

describe("getting values", () => {
	beforeEach(() => {
		Log.push(
			// @ts-expect-error
			{ Name: "Name", Group: "Group", Value: 10 },
			{ Name: "Name2", Group: "Group", Value: undefined },
			{ Name: "Another", Group: "Group" },
			{ Name: "Quest1", Group: "Quests", Value: "Done" },
			{ Name: "Groups", Group: "Body", Value: ["A", "B", "C"] },
		);
	});

	describe("LogValue", () => {
		it("ignores an invalid name or group", () => {
			expect(Game.LogValue("Name", null)).toBe(null);
			expect(Game.LogValue(null, "Group")).toBe(null);
		});

		it("returns null if there's no record", () => {
			expect(Game.LogValue("Another", "Group")).toBe(null);
		});

		it("returns a record's numeric value if it exists", () => {
			expect(Game.LogValue("Name", "Group")).toBe(10);
		});

		it("returns null if the record's not numeric", () => {
			expect(Game.LogValue("Name2", "Group")).toBe(null);
			expect(Game.LogValue("Quest1", "Quests")).toBe(null);
			expect(Game.LogValue("Groups", "Body")).toBe(null);
		});
	});

	describe("LogGetString", () => {
		it("returns a record's string value if it exists", () => {
			expect(Game.LogGetString("Quest1", "Quests")).toBe("Done");
		});

		it("returns null if the record's missing or not a string", () => {
			expect(Game.LogGetString("Name", "Group")).toBe(null);
		});
	});

	describe("LogGetStringArray", () => {
		it("returns a record's string array value if it exists", () => {
			expect(Game.LogGetStringArray("Groups", "Body")).toStrictEqual(["A", "B", "C"]);
		});

		it("returns null if the record's missing or not a string array", () => {
			expect(Game.LogGetStringArray("Name", "Group")).toBe(null);
		});
	});
});

