import { Game } from "./Utils";

Game.load("../Scripts/Common.js");
Game.load("../Scripts/Drawing.js");
Game.load("../Scripts/Server.js");

Game.load("../Scripts/Validation.js");

const partialAsset = {
	get ColorableLayerCount() { return this.DefaultColor.length; },
	DefaultColor: ["Default", "#112233"],
	Group: {
		ColorSchema: ["Default"],
	},
} satisfies ColorAssetMock;

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

Game.load("../Screens/Character/Title/TitleDefault.js");
Game.load("../Scripts/Character.js");
Game.load("../Scripts/Notification.js");
Game.load("../Scripts/Asset.js");
Game.load("../Scripts/Pose.js");
Game.load("../Assets/Female3DCG.js");
Game.load("../Scripts/Preference.js");
Game.load("../Screens/Room/Crafting/Crafting.js");
Game.load("../Scripts/BitString.js");
Game.load("../Screens/Online/ChatRoom/ChatRoomMapView.js");
Game.load("../Screens/Online/ChatRoom/ChatRoomCharacterView.js");
Game.load("../Screens/Online/ChatRoom/ChatRoom.js");
Game.load("../Scripts/Map.js");
Game.load("../Assets/MapData.js");
Game.MapDataLoad();


describe("ServerAccountDataSyncedValidate", () => {
	it("validates titles", () => {
		expect(Game.ServerAccountDataSyncedValidate.Title()).toBe(undefined);
		expect(Game.ServerAccountDataSyncedValidate.Title("Mistress")).toBe("Mistress");
	});

	it("validate nicknames", () => {
		expect(Game.ServerAccountDataSyncedValidate.Nickname()).toBe(undefined);
		expect(Game.ServerAccountDataSyncedValidate.Nickname("Toy")).toBe("Toy");
		expect(Game.ServerAccountDataSyncedValidate.Nickname("Toy#")).toBe(undefined);
		expect(Game.ServerAccountDataSyncedValidate.Nickname("AReallyReallyReallyReallyLongNickname")).toBe(undefined);
	});

	it("validates money", () => {
		expect(Game.ServerAccountDataSyncedValidate.Money(0)).toBe(0);
		expect(Game.ServerAccountDataSyncedValidate.Money(-100)).toBe(0);
		expect(Game.ServerAccountDataSyncedValidate.Money(NaN)).toBe(0);
		expect(Game.ServerAccountDataSyncedValidate.Money("ohno")).toBe(0);
		expect(Game.ServerAccountDataSyncedValidate.Money({})).toBe(0);
	});

	it("validates allowed interactions", () => {
		expect(Game.ServerAccountDataSyncedValidate.AllowedInteractions(-1)).toBe(2);
		expect(Game.ServerAccountDataSyncedValidate.AllowedInteractions(0)).toBe(0);
		expect(Game.ServerAccountDataSyncedValidate.AllowedInteractions(1)).toBe(1);
		expect(Game.ServerAccountDataSyncedValidate.AllowedInteractions(2)).toBe(2);
		expect(Game.ServerAccountDataSyncedValidate.AllowedInteractions(3)).toBe(3);
		expect(Game.ServerAccountDataSyncedValidate.AllowedInteractions(4)).toBe(4);
		expect(Game.ServerAccountDataSyncedValidate.AllowedInteractions(5)).toBe(5);
		expect(Game.ServerAccountDataSyncedValidate.AllowedInteractions(6)).toBe(2);
		expect(Game.ServerAccountDataSyncedValidate.AllowedInteractions(NaN)).toBe(2);
		expect(Game.ServerAccountDataSyncedValidate.AllowedInteractions("ohno")).toBe(2);
		expect(Game.ServerAccountDataSyncedValidate.AllowedInteractions({})).toBe(2);
	});

	it("validates difficulty", () => {
		expect(Game.ServerAccountDataSyncedValidate.Difficulty(null)).toMatchObject({ Level: 1 });
		expect(Game.ServerAccountDataSyncedValidate.Difficulty({ Level: -1 })).toMatchObject({ Level: 1 });
		expect(Game.ServerAccountDataSyncedValidate.Difficulty({ Level: 1, LastChange: -100 })).toMatchObject({ Level: 1 });
		expect(Game.ServerAccountDataSyncedValidate.Difficulty({ Level: Infinity, LastChange: {} })).toMatchObject({ Level: 1 });
		expect(Game.ServerAccountDataSyncedValidate.Difficulty({ Level: 3, LastChange: 1787087737053 })).toMatchObject({ Level: 3, LastChange: 1787087737053 });
	});

	it("validates arousal settings", () => {
		expect(Game.ServerAccountDataSyncedValidate.ArousalSettings({})).toMatchObject({
			Active: "Hybrid",
			Activity: "z".repeat(Math.max(...Game.ActivityFemale3DCG.map((a: Activity) => a.ActivityID)) + 1),
			AffectExpression: true,
			AffectStutter: "All",
			ChangeTime: 0,
			DisableAdvancedVibes: false,
			Fetish: "ffffffffffffffffffff",
			OrgasmCount: 0,
			OrgasmStage: 0,
			OrgasmTimer: 0,
			Progress: 0,
			ProgressTimer: 0,
			ShowOtherMeter: true,
			VFX: "VFXAnimatedTemp",
			VFXFilter: "VFXFilterLight",
			VFXVibrator: "VFXVibratorAnimated",
			VibratorLevel: 0,
			Visible: "Access",
			Zone: "",
		});
	});

	it("validates online settings", () => {
		expect(Game.ServerAccountDataSyncedValidate.OnlineSharedSettings({})).toMatchObject({
			AllowFullWardrobeAccess: false,
			AllowPlayerLeashing: true,
			AllowRename: true,
			BlockBodyCosplay: false,
			DisablePickingLocksOnSelf: false,
			GameVersion: undefined,
			ItemsAffectExpressions: true,
			ScriptPermissions: {
				Block: {
					permission: 0,
				},
				Hide: {
					permission: 0,
				},
			},
			WheelFortune: "",
		});
	});

	it("validates crafts", () => {
		expect(Game.ServerAccountDataSyncedValidate.Crafting({})).toMatchObject([]);
		// XXX: not quite extensive enough
	});

	// XXX: skip

	describe("validates character map data", () => {
		describe("can get a map's flag position", () => {
			it("null with no map", () => {
				expect(Game.ChatRoomMapViewGetEntryFlagPosition()).toBeNull();
			});

			it("the flag's position with a map", () => {
				Game.ChatRoomData = { MapData: { Objects: "blahblahblah" + String.fromCharCode(Game.ChatRoomMapViewObjectEntryID) + "blahblah" }};
				expect(Game.ChatRoomMapViewGetEntryFlagPosition()).toMatchObject({ X: 12, Y: 0 });
			});
		});

		describe("validates position", () => {
			it("with no room data", () => {
				expect(Game.ServerAccountDataSyncedValidate.MapData.Pos({ X: 15, Y: 15 })).toMatchObject({});
			});

			it("with room data", () => {
				Game.ChatRoomData = { MapData: { Objects: "blahblahblahblahblah" }};
				expect(Game.ServerAccountDataSyncedValidate.MapData.Pos({ X: 15, Y: 15 })).toMatchObject({ X: 15, Y: 15 });
				expect(Game.ServerAccountDataSyncedValidate.MapData.Pos(null)).toMatchObject({ X: 20, Y: 20 });
			});

			it("with room data containing a flag", () => {
				Game.ChatRoomData = { MapData: { Objects: "blahblahblah" + String.fromCharCode(Game.ChatRoomMapViewObjectEntryID) + "blahblah" }};
				expect(Game.ServerAccountDataSyncedValidate.MapData.Pos({ X: 15, Y: 15 })).toMatchObject({ X: 15, Y: 15 });
				expect(Game.ServerAccountDataSyncedValidate.MapData.Pos(null)).toMatchObject({ X: 12, Y: 0 });
			});
		});

		it("validates private state", () => {
			expect(Game.ServerAccountDataSyncedValidate.MapData.PrivateState({})).toMatchObject({});
			expect(Game.ServerAccountDataSyncedValidate.MapData.PrivateState(NaN)).toMatchObject({});
			expect(Game.ServerAccountDataSyncedValidate.MapData.PrivateState({ HasBronzeKey: true })).toMatchObject({ HasBronzeKey: true });
			expect(Game.ServerAccountDataSyncedValidate.MapData.PrivateState({ RandomGarbaj: "whatevs bruh" })).toMatchObject({ RandomGarbaj: "whatevs bruh" });
		});

		it("detects not having a room", () => {
			expect(Game.ServerAccountDataSyncedValidate.MapData({ Pos: { X: 15, Y: 15 } })).toMatchObject({});
			expect(Game.ServerAccountDataSyncedValidate.MapData({ Pos: NaN })).toMatchObject({});
		});
	});
});

describe("recent map doodads", () => {
	it("loads account keys into registry doodads", () => {
		const tileIds = [100, 101, 102, 103, 104, 105, 106, 107, 108, 110, 115, 120, 121, 132, 170, 171, 172];
		const keys = tileIds.map((id) => `Tile:${id}`);
		const capped = Game.ServerAccountDataSyncedValidate.RecentlyUsedMapElements(keys);
		expect(capped).toHaveLength(16);
		expect(capped[0]).toBe(Game.MapDataGetTile(tileIds[0]));

		const resolved = Game.ServerAccountDataSyncedValidate.RecentlyUsedMapElements([
			"Tile:100",
			"Object:100",
			"Tile:100",
			"Effect:12",
			"nope",
			{ ID: 101, DoodadType: "Tile", Type: "Floor", Style: "WoodWhite" },
			{ ID: 100 },
			{ ID: 999999, DoodadType: "Object" },
			5,
		]);
		expect(Game.MapPackDoodads(resolved)).toEqual([
			"Tile:100",
			"Object:100",
			"Effect:12",
			"Tile:101",
		]);
		expect(resolved[0]).toBe(Game.MapDataGetTile(100));
		expect(resolved[1]).toBe(Game.MapDataGetObject(100));
		expect(Game.ServerAccountDataSyncedValidate.RecentlyUsedMapElements(null)).toEqual([]);
	});

	it("converts pre-reference doodads into keys", () => {
		const stored = JSON.parse('[{"ID":370,"Type":"Bathroom","Style":"Toilet","Top":-0.65,"Left":0.05,"Height":1.5,"Width":0.9},{"ID":3027,"Type":"Bathroom","Style":"TowelRack","Top":-0.34,"Height":1.19},{"ID":3028,"Type":"Bathroom","Style":"LaundryBasket","Top":0.05,"Left":0.01,"Height":0.8,"Width":0.98},{"ID":220,"Type":"School","Style":"StudentDesk","Top":-0.1},{"ID":213,"Type":"School","Style":"Lectern","Top":-0.4,"Height":1.25},{"ID":212,"Type":"School","Style":"Globe","Top":-0.25,"Left":0.16,"Height":1.1,"Width":0.69},{"ID":389,"Type":"Bedroom","Style":"Wardrobe","Top":-0.9,"Left":0,"Height":2,"Width":1},{"ID":3510,"Type":"Functional","Style":"ConveyorBeltFast1","Top":0,"Left":0}]');
		const resolved = Game.ServerAccountDataSyncedValidate.RecentlyUsedMapElements(stored);
		expect(Game.MapPackDoodads(resolved)).toEqual([
			"Object:370",
			"Object:3027",
			"Object:3028",
			"Object:220",
			"Object:213",
			"Object:212",
			"Object:389",
			"Object:3510",
		]);
		expect(resolved[3]).toBe(Game.MapDataGetObject(220));
		expect(resolved[3].Style).toBe("StudentDesk");
	});
});

describe("ServerChatRoomDataValidate", () => {
	it("coerces room text fields to safe strings", () => {
		expect(Game.ServerChatRoomDataValidationRecord.Name("My Room")).toBe("My Room");
		expect(Game.ServerChatRoomDataValidationRecord.Name({ tag: "img" })).toBe("");
		expect(Game.ServerChatRoomDataValidationRecord.Description("Hello")).toBe("Hello");
		expect(Game.ServerChatRoomDataValidationRecord.Description({ tag: "img", attributes: { onerror: "alert(1)" } })).toBe("");
	});
});

describe("ServerChatRoomSearchDataValidate", () => {
	it("coerces search text fields to safe strings", () => {
		expect(Game.ServerChatRoomSearchDataValidationRecord.Creator("Ada")).toBe("Ada");
		expect(Game.ServerChatRoomSearchDataValidationRecord.Creator(null)).toBe("");
	});

	it("validates search results", () => {
		const validated = Game.ServerChatRoomSearchDataValidate({
			Name: "Test",
			Description: { tag: "img" },
			Creator: "Host",
			Language: "EN",
			CreatorMemberNumber: 1,
			Creation: 0,
			MemberCount: 1,
			MemberLimit: 10,
			BlockCategory: [],
			Game: "",
			Friends: [{ Type: "Friend", MemberNumber: 2, MemberName: { x: 1 } }],
			Space: "",
			Visibility: ["All"],
			Access: ["All"],
			CanJoin: true,
			MapType: "Never",
		});
		expect(validated.Description).toBe("");
		expect(validated.Friends[0].MemberName).toBe("");
	});
});
