"use strict";
import { Game } from "./Utils";

// Mock out all the stuff that's required before ChatRoom.js can load
Game.ChatRoomCharacterViewRun = () => {};
Game.ChatRoomCharacterViewDraw = () => {};
Game.ChatRoomCharacterViewDrawUi = () => {};
Game.ChatRoomCharacterViewClick = () => {};
Game.ChatRoomCharacterViewKeyDown = () => {};
Game.ChatRoomCharacterViewCanLeave = () => {};
Game.ChatRoomCharacterViewScreenshot = () => {};
Game.ChatRoomCharacterViewActivate = () => {};

Game.ChatRoomMapViewRun = () => {};
Game.ChatRoomMapViewDraw = () => {};
Game.ChatRoomMapViewDrawUi = () => {};
Game.ChatRoomMapViewClick = () => {};
Game.ChatRoomMapViewKeyDown = () => {};
Game.ChatRoomMapViewKeyUp = () => {};
Game.ChatRoomMapViewMouseDown = () => {};
Game.ChatRoomMapViewMouseUp = () => {};
Game.ChatRoomMapViewMouseMove = () => {};
Game.ChatRoomMapViewMouseWheel = () => {};
Game.ChatRoomMapViewRoomUpdated = () => {};
Game.ChatRoomMapViewCanStartWhisper = () => {};
Game.ChatRoomMapViewCanLeave = () => {};
Game.ChatRoomMapViewScreenshot = () => {};
Game.ChatRoomMapViewActivate = () => {};
Game.ChatRoomMapViewDeactivate = () => {};
Game.ChatRoomMapViewResize = () => {};

Game.load("../Scripts/lib/LZString.js");

Game.load("../Scripts/Common.js");
Game.load("../Scripts/BitString.js");
Game.load("../Screens/Online/ChatRoom/ChatRoom.js");
Game.load("../Screens/Online/ChatRoom/ChatRoomMapView.js");

Game.load("../Assets/MapData.js");
Game.load("../Scripts/Map.js");

Game.MapDataLoad();

Game.Player = {};
Game.Player.MapData = null;

beforeEach(() => {
	Game.ChatRoomData = {};
	Game.ChatRoomData.MapData = Game.ChatRoomMapViewInitialize("Always");
	Game.MapManager.Map.loadGlobalMapData(Game.ChatRoomData.MapData);
});

afterEach(() => {
	Game.MapManager.Map.clear();
});

describe("MapManager", () => {
	const blankTile = Game.MapDataGetTile(Game.ChatRoomMapViewObjectStartID);
	expect(blankTile).not.toBe(null);

	const stoneWall = Game.MapDataGetTile(1030);
	expect(stoneWall).not.toBe(null);

	const roomEntry = Game.MapDataGetObject(110); // Unique
	expect(roomEntry).not.toBe(null);

	const blankObject = Game.MapDataGetObject(Game.ChatRoomMapViewObjectStartID);
	expect(blankObject).not.toBe(null);

	const table = Game.MapDataGetObject(140);
	expect(table).not.toBe(null);

	const blankEffect = Game.MapDataGetEffect(Game.ChatRoomMapViewEffectStartID);
	expect(blankEffect).not.toBe(null);

	const shadowMediumEffect = Game.MapDataGetEffect(12);
	expect(shadowMediumEffect).not.toBe(null);

	const tintBlueEffect = Game.MapDataGetEffect(15);
	expect(tintBlueEffect).not.toBe(null);

	describe("setTile", () => {
		it('should set a tile (x,y)', () => {
			expect(Game.MapManager.Map.setTile(10, 10, stoneWall)).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(stoneWall);
		});

		it('should set a tile (index)', () => {
			expect(Game.MapManager.Map.setTile(40, stoneWall)).toBe(true);
			expect(Game.MapManager.Map.getTile(40)).toEqual(stoneWall);
		});

		it('should set a tile in a range', () => {
			expect(Game.MapManager.Map.setTile(10, 10, stoneWall, 1)).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(10, 11)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(11, 10)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(11, 11)).toEqual(stoneWall);
		});

		it('should consider a negative range 0', () => {
			expect(Game.MapManager.Map.setTile(10, 10, stoneWall, -1)).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(10, 11)).toEqual(blankTile);
			expect(Game.MapManager.Map.getTile(11, 10)).toEqual(blankTile);
			expect(Game.MapManager.Map.getTile(11, 11)).toEqual(blankTile);
		});

		it('should fail to set tiles out of bound', () => {
			expect(Game.MapManager.Map.setTile(-10, -10, stoneWall)).toBe(false);
		});
	});

	describe("canSetObject", () => {
		it('should set an object (x,y)', () => {
			expect(Game.MapManager.Map.canSetObject(10, 10, table)).toBe(true);
		});

		it('should set an object (index)', () => {
			expect(Game.MapManager.Map.canSetObject(40, table)).toBe(true);
		});

		it('should fail to set objects out of bounds', () => {
			expect(Game.MapManager.Map.canSetObject(-10, -10, table)).toBe(false);
		});
	});

	describe("setObject", () => {
		it('should set an object (x,y)', () => {
			expect(Game.MapManager.Map.setObject(10, 10, table)).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(table);
		});

		it('should set an object (index)', () => {
			expect(Game.MapManager.Map.setObject(40, table)).toBe(true);
			expect(Game.MapManager.Map.getObject(40)).toEqual(table);
		});

		it('should set an object in a range', () => {
			expect(Game.MapManager.Map.setObject(10, 10, table, 1)).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(table);
			expect(Game.MapManager.Map.getObject(10, 11)).toEqual(table);
			expect(Game.MapManager.Map.getObject(11, 10)).toEqual(table);
			expect(Game.MapManager.Map.getObject(11, 11)).toEqual(table);
		});

		it('should consider a negative range 0', () => {
			expect(Game.MapManager.Map.setObject(10, 10, table, -1)).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(table);
			expect(Game.MapManager.Map.getObject(10, 11)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 11)).toEqual(blankObject);
		});

		it('should fail to set objects out of bounds', () => {
			expect(Game.MapManager.Map.setObject(-10, -10, table)).toBe(false);
		});

		it('should keep unique objects unique', () => {
			expect(Game.MapManager.Map.setObject(10, roomEntry)).toBe(true);
			expect(Game.MapManager.Map.setObject(12, roomEntry)).toBe(true);
			expect(Game.MapManager.Map.getObject(10)).toBe(blankObject);
			expect(Game.MapManager.Map.getObject(12)).toBe(roomEntry);
		});

		it('should ignore range for unique objects', () => {
			expect(Game.MapManager.Map.setObject(10, 10, roomEntry, 1)).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(roomEntry);
			expect(Game.MapManager.Map.getObject(10, 11)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 11)).toEqual(blankObject);
		});
	});

	describe("setEffects", () => {
		it('should set effects (x,y)', () => {
			expect(Game.MapManager.Map.setEffects(10, 10, [shadowMediumEffect, tintBlueEffect])).toBe(true);
			expect(Game.MapManager.Map.getEffects(10, 10)).toEqual([shadowMediumEffect, tintBlueEffect]);
		});

		it('should set effects (index)', () => {
			expect(Game.MapManager.Map.setEffects(40, [shadowMediumEffect, tintBlueEffect])).toBe(true);
			expect(Game.MapManager.Map.getEffects(40)).toEqual([shadowMediumEffect, tintBlueEffect]);
		});

		it('should fail to set effects out of bounds', () => {
			expect(Game.MapManager.Map.setEffects(-10, -10, table)).toBe(false);
		});

		it('should set effects in a range', () => {
			expect(Game.MapManager.Map.setEffects(10, 10, [shadowMediumEffect, tintBlueEffect], 1)).toBe(true);
			expect(Game.MapManager.Map.getEffects(10, 10)).toEqual([shadowMediumEffect, tintBlueEffect]);
			expect(Game.MapManager.Map.getEffects(10, 11)).toEqual([shadowMediumEffect, tintBlueEffect]);
			expect(Game.MapManager.Map.getEffects(11, 10)).toEqual([shadowMediumEffect, tintBlueEffect]);
			expect(Game.MapManager.Map.getEffects(11, 11)).toEqual([shadowMediumEffect, tintBlueEffect]);
		});

		it('should overwrite previous effects (index)', () => {
			expect(Game.MapManager.Map.setEffects(40, [shadowMediumEffect])).toBe(true);
			expect(Game.MapManager.Map.getEffects(40)).toEqual([shadowMediumEffect]);
			expect(Game.MapManager.Map.setEffects(40, [tintBlueEffect])).toBe(true);
			expect(Game.MapManager.Map.getEffects(40)).toEqual([tintBlueEffect]);
		});
	});

	describe("undo", () => {
		it("should return false if there's nothing to undo", () => {
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("should return true if there's something to undo", () => {
			expect(Game.MapManager.Map.setObject(10, 10, table)).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(true);
		});

		it("can undo setTile", () => {
			expect(Game.MapManager.Map.setTile(10, 10, stoneWall)).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(blankTile);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setTile with a range", () => {
			expect(Game.MapManager.Map.setTile(10, 10, stoneWall, 1)).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(11, 10)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(10, 11)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(11, 11)).toEqual(stoneWall);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(blankTile);
			expect(Game.MapManager.Map.getTile(11, 10)).toEqual(blankTile);
			expect(Game.MapManager.Map.getTile(10, 11)).toEqual(blankTile);
			expect(Game.MapManager.Map.getTile(11, 11)).toEqual(blankTile);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setObject", () => {
			expect(Game.MapManager.Map.setObject(10, 10, table)).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setObject with a range", () => {
			expect(Game.MapManager.Map.setObject(10, 10, table, 1)).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(table);
			expect(Game.MapManager.Map.getObject(11, 10)).toEqual(table);
			expect(Game.MapManager.Map.getObject(10, 11)).toEqual(table);
			expect(Game.MapManager.Map.getObject(11, 11)).toEqual(table);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(10, 11)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 11)).toEqual(blankObject);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setObject for an unique object", () => {
			expect(Game.MapManager.Map.setObject(10, 10, table)).toBe(true);
			expect(Game.MapManager.Map.setObject(10, 10, roomEntry)).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 20, roomEntry)).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObject(20, 20)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(roomEntry);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(table);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setEffect", () => {
			expect(Game.MapManager.Map.setEffects(10, 10, [shadowMediumEffect])).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getEffects(10, 10)).toEqual([blankEffect]);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setEffect with a range", () => {
			expect(Game.MapManager.Map.setEffects(10, 10, [shadowMediumEffect], 1)).toBe(true);
			expect(Game.MapManager.Map.getEffects(10, 10)).toEqual([shadowMediumEffect]);
			expect(Game.MapManager.Map.getEffects(11, 10)).toEqual([shadowMediumEffect]);
			expect(Game.MapManager.Map.getEffects(10, 11)).toEqual([shadowMediumEffect]);
			expect(Game.MapManager.Map.getEffects(11, 11)).toEqual([shadowMediumEffect]);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getEffects(10, 10)).toEqual([blankEffect]);
			expect(Game.MapManager.Map.getEffects(11, 10)).toEqual([blankEffect]);
			expect(Game.MapManager.Map.getEffects(10, 11)).toEqual([blankEffect]);
			expect(Game.MapManager.Map.getEffects(11, 11)).toEqual([blankEffect]);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});
	});

	describe("color configs", () => {
		const throne = Game.MapDataGetObject(150);
		const couch = Game.MapDataGetObject(710);
		const colorConfig = { Type: "Color", Colors: ["#3050E0", "Default"] };

		it("should validate color configs against the object's layers", () => {
			expect(Game.MapIsValidColorConfig(colorConfig, throne)).toBe(true);
			expect(Game.MapIsValidColorConfig(colorConfig, table)).toBe(false);
			expect(Game.MapIsValidColorConfig({ Type: "Color", Colors: ["#3050E0"] }, throne)).toBe(false);
			expect(Game.MapIsValidColorConfig({ Type: "Color", Colors: ["red", "Default"] }, throne)).toBe(false);
			expect(Game.MapIsValidColorConfig({ Type: "Sign", Text: "" }, throne)).toBe(false);
		});

		it("should resolve layer colors with defaults", () => {
			expect(Game.MapManager.Map.setObject(10, 10, throne)).toBe(true);
			const index = Game.MapCoordinatesToIndex(10, 10);
			expect(Game.MapGetObjectLayerColors(index, throne)).toEqual(throne.ColorLayers.map(l => l.DefaultColor));
			expect(Game.MapManager.Map.setObjectConfig(index, colorConfig)).toBe(true);
			expect(Game.MapGetObjectLayerColors(index, throne)).toEqual(["#3050E0", throne.ColorLayers[1].DefaultColor]);
		});

		it("should survive a save/load round trip", () => {
			expect(Game.MapManager.Map.setObject(10, 10, throne)).toBe(true);
			expect(Game.MapManager.Map.setObjectConfig(10, 10, colorConfig)).toBe(true);
			const saved = JSON.parse(JSON.stringify(Game.ChatRoomData.MapData));
			Game.MapManager.Map.clear();
			expect(Game.MapManager.Map.loadGlobalMapData(saved)).toBe(true);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toEqual(colorConfig);
		});

		it("should survive an export/import round trip", () => {
			expect(Game.MapManager.Map.setObject(10, 10, throne)).toBe(true);
			expect(Game.MapManager.Map.setObjectConfig(10, 10, colorConfig)).toBe(true);
			const exported = Game.MapManager.Map.exportString();
			Game.ChatRoomData.MapData = Game.ChatRoomMapViewInitialize("Always");
			Game.MapManager.Map.loadGlobalMapData(Game.ChatRoomData.MapData);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toBeUndefined();
			expect(Game.MapManager.Map.importString(exported)).toBe(true);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toEqual(colorConfig);
		});

		it("should clear the colors when the object is replaced, and restore them on undo", () => {
			expect(Game.MapManager.Map.setObject(10, 10, throne)).toBe(true);
			expect(Game.MapManager.Map.setObjectConfig(10, 10, colorConfig)).toBe(true);
			expect(Game.MapManager.Map.setObject(10, 10, couch)).toBe(true);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toBeUndefined();
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(throne);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toEqual(colorConfig);
		});

		it("should keep the colors when the same object is placed again", () => {
			expect(Game.MapManager.Map.setObject(10, 10, throne)).toBe(true);
			expect(Game.MapManager.Map.setObjectConfig(10, 10, colorConfig)).toBe(true);
			expect(Game.MapManager.Map.setObject(10, 10, throne)).toBe(true);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toEqual(colorConfig);
		});

		it("should only paste a color format on the same object", () => {
			const format = { ObjectID: throne.ID, Colors: ["#3050E0", "Default"] };
			expect(Game.MapCanPasteColorFormat(format, throne)).toBe(true);
			expect(Game.MapCanPasteColorFormat(format, couch)).toBe(false);
			expect(Game.MapCanPasteColorFormat(format, table)).toBe(false);
			expect(Game.MapCanPasteColorFormat(null, throne)).toBe(false);
			expect(Game.MapCanPasteColorFormat({ ObjectID: table.ID, Colors: [] }, table)).toBe(false);
		});

		it("can undo setObjectConfig when requested", () => {
			expect(Game.MapManager.Map.setObject(10, 10, throne)).toBe(true);
			expect(Game.MapManager.Map.setObjectConfig(10, 10, colorConfig, { undo: true })).toBe(true);
			const otherConfig = { Type: "Color", Colors: ["Default", "#112233"] };
			expect(Game.MapManager.Map.setObjectConfig(10, 10, otherConfig, { undo: true })).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toEqual(colorConfig);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toBeUndefined();
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(throne);
		});

		it("should not register an undo step for setObjectConfig by default", () => {
			expect(Game.MapManager.Map.setObjectConfig(10, 10, colorConfig)).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("should drop invalid color configs when validating cells", () => {
			expect(Game.MapManager.Map.setObject(10, 10, throne)).toBe(true);
			expect(Game.MapManager.Map.setObjectConfig(10, 10, { Type: "Color", Colors: ["#3050E0"] })).toBe(true);
			Game.MapValidateCells();
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toBeUndefined();
		});
	});
});

describe("with a test map", () => {
	// Shamelessly lifted from Velvet District
	const mapData = "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=@EgCpABoDQAYyaRIGYQHHIQICPGEiBmIAxiEdQj1ncwZnDtchHTI9Z3MGYA4nICUC/kXnX0I9ERXRDkQFtUNTAeUQVwg4BILAPKMEChkVUQ5GBZVDUgHtEFcIOAQVwhwZEjRRAzgGExAMUQAA";

	beforeEach(() => {
		Game.ChatRoomData = {};
		Game.ChatRoomData.MapData = Game.ChatRoomMapViewInitialize("Always");
		expect(Game.MapManager.Map.importString(mapData)).toBe(true);
		expect(Game.ChatRoomData.MapData.Objects).toBe("dddddddddddddddddddddddddddddddd᎒d௾೦೧೥d᎒ddద࿂ర௠d௠dddddddddddddddddddddddࠖߜ᎖ƂdƉ᎖ߜddߩdˆˆdϲϲϲddҹҹddddddddddddҹҹҹҹd࿂dddƀƁddddddddddddАddddd߰߰߰߰߰d߰߰߰߰ddddddࠖ߱߱dddd߱߱dddddϼddddd߸ఄ௾ఄࠂddࠂ߽߳ddddddddூೆªªೆಽೆddddddddྴdddddddȺ߽Ⱥdd߸d߳dddddddࠠdżdddddߩddߩdddddd¢dddddddddĶdddddddddddࠠdߤddddˤddಀྮಽಾಽdddddddd߸dddddddddddddddd೦೧ಽªªಽೆdddƃdddߖdККdddddddࠂddࠪĶddࠂdddddddžſĶdddƂddddddddddddd߳dddddߚdddddddddddddddŽddˤˤˤdddddddd߽ࠂ߳dddĶdࠂdddddddఃdߤd࿂࿂dߤdddŞŞdȺddddddddddddddddddddddࠪdd᎖ªª᎖௾dddೋఃddd᎚࿄᎚ddҹҹd߰߰߰߰d߰߰߰߰߰dҹҹҹҹdddddddࠥdddddࠠࠠddddddddddࠪddddddddࠪdҹҹҹҹddddddddddࠪdddddࠪddddddddddddddddddddddddd྾ூೆdరరddddddddddddddddddࠋddĶĶddࠋddddddddȺddddƅdddd࿂௪dௌdಲdddddddddddddddddddddddddྫddddddŞúúúŞdddddddddd߱dd߱dddddddddddƃdddŲdddddddʊdࠠddddddddddddddddddddddddddddĄddddddˤˤˤˤಀdddddddddddddddddddddddd¦Ķ¦dúddddddʊʊdŀdddddddddd߱dd߱ddddddddddௌ೐ddூௌddddddddࠖdddddddddddddddddddddddúddddĶddddddddddddddࠋddĶĶddࠋdddddddddddːːddddೋ௾ࠖࠖࠖd࿄dddddddddddddddddddddddddddddddddࠠࠠdddddddҹҹҹҹdddddnsdddddddddddྫೆ௠ƄdĎdddddddddddddddddddࠋddddࠋdddddddddŀddddȺdddddddddddddddddࠪࠠddddddࠠࠪddddddಾೋdddd࿄dddddddddddddҹҹddddddddddddddҹҹdddddddddddః྾ఱdddః྾ddddddddddಾ࿂࿂ಾddddddddddddddddddࠠdúdddߤȺɶdࠪddddŲd߮dddʊ߮dŲddddd௾ఃூ྾௾྾ః௠dd¦ddddddddddddddd¦߮dddʊ߮¦ddddddddddߤdddddʀdddddĶɬʊdddddddddྷࠖࠖࠖddddddddФddddddІdddФddddࠠddddddddĶdddſžſddĶddddddೆ௾ddˤః௾ddఃddddddఃdddddࠪddddddddྷ߮dddddƅdߩdddˤddߤddddddࠠƅdddddd߮ྷdddddddddddddƅdddƄddddɬФdddd¦ɬddddddddddƂdd ddʊddddd௾dd௠ೆ௾ddddɶdddddddɶddddddʊdd೥࿂࿂ಲಾdddddddߤdddddddddddȺdddddddࠪdddddddddddddddࠥʔʞdФɬddddɬÜddೋ௾྾ddd྾dd௾ddddddೋd᎓࿂࿂᎓dೋddddddೋdఃd࿂ddఃddߤࠥdddddddddddddddddddddddddddddddddddddd");
		expect(Game.ChatRoomData.MapData.Tiles).toBe("ÈÈÈÈÈÈÈÈÈÈÈúëëëëëëëëëëëëëëëëëëúҴҴϲҴҴҴҴϲҴÈААААААААААúëëëëëëëëëëëëëëëëëëúëyҵëëëëҵyÈАnnnnААúëëúúúúúúúúúúúúëëëëúКy¬ëë¬yÈАААúëëú×××ÒÒÈÒÒĄ×úëëëëúëy¬¬yÈАААúëëúĄььь×È×Ò×ĘúëëëëúҴҴҳұëëҰҲҰÈААААААúëëú×ÒĘÒ×ÈÒĘ××úëëëëúÈҴy¬¬yyÈАnnnnnnnnАúëëúÈÈÈÈÈÈ×ÈÈÈúëëëëúÈҴy¬¬yyÈААААААААААúëëúĎĘ×ÈÈÈÈÈÒÒúëëëëúҴҴұҳëëҲҰҳÈААnnАúëëú×Ò××ÈÒÒߚÒÒúëëëëúҴyy¬¬yyÈАnnnАúëëú×ÒĘÒÈ×ߚúߚ×úëëëëúҴyy¬¬yyÈААnnАúëëúĘ×××È×ÒߚÒÒúëëëëúҴҴyҴҴҴҴyҴÈААnnАúëëúÒ×××ÈÒÒ××ÒúëëëëúÈҴҴҴëëҴҴҴÈААААААААААúëëúúúúúúúúúúúúëëëëúúúúúúúúúúúúúúúúúúúúúúëëússssssssssúëëëëúúúúúúúúúúúúúúúúúúúúëëëëússssssssssúëëëëúАϲϲϲϲϲϲАÈúúúúúúúúúúëëëëúsÒssssssÒsúëëëëúАddddddАÈÈАҵҵҵҵҵҵАúëëëëússssúússssúëëëëúАdddтттАÈÈАxxxxxxАúëëëëússsúߚߚússsúëëëëúАт  АĎÈАxxxxxxАúëëëëússúߚߚߚߚússúëëëëúАт  АÈÈАФxxxxФАúëëëëússúߚߚߚߚússúëëëëúАϲ ߐАÈÈАxxxxxxАúëëëëússsúߚߚússsúëëëëúАттϲϲϲϲАÈÈАxxxxxxnúëëëëússssúússssúëëëëúА ߐϲАĎÈАxxxxxxnúëëëëúsÒssssssÒsúëëëëúА  ϲАÈÈААnnnАААúëëëëússssssssssúëëëëúА  ϲАÈúúúúúúúúúúëëëëússssnnssssúëëëëúАϲϲϲdddАĎëëëëëëëëëëëëëëússÒssssÒssúëëëëúАddddddАĎëëëëëëëëëëëëëëússssssssssúëëëëúААААААААÈúúúúúúúúúúúëëúúúúúúúúúúúúúúëëúúúúúúúúúúúϩϩААÈАϩϩААúëëúАЮЮҴЮЮЮЮҴЮЮАúëëúúúúúúúúúúúddnАÈАndnАúëëúАnnënnënnАúëëАϲьϲььϲьϲАÈÈddАÈАdddАúëëúАnnënnnnënnАúëëАĎddÈĎÈdÈАÈdddАÈАdddАúëëúАnnІЮëëëІnnАúëëАÈÈddÈddÈАÈndÈАÈАnddАúëëúАnnІyyyyІnnАúëëАϲьϲdddϲϲАĎАϩÈАÈААϩϩАúëëúАnnІyëëëІЮëАúëëАdÈÈdddÈĎАÈnddАÈАdÈdАúëëúАëЮІyyyyІyyАúëëАddĎÈdÈÈÈАÈdddАÈАdddАúëëúАyyІyyyyІyyАúëëАьddϲьϲddАÈÈddАÈАddnАúëëúАyyЮЮЮЮЮЮyyАúëëАdddÈddddАĎÈndАÈАndnАúëëúАyyyyyyyyyyАúëëАÈÈdĎÈdÈĎАÈААААÈАААААúëëúААААААААААААúëëААААААААААÈÈÈÈÈÈÈÈÈÈÈúëëúÈÈÈÈÈÈÈÈÈÈÈÈúëëÈÈÈÈÈÈÈĎÈÈÈ");
	});

	it.each<[[x: number, y: number], [tileId: number, objectId: number]]>([
		[[10, 10], [1040, 100]],
		[[11, 10], [250, 100]],
		[[12, 10], [235, 100]],
		[[13, 10], [235, 100]],
		[[14, 10], [250, 100]],
		[[24, 24], [115, 100]],
		[[24, 25], [115, 100]],
		[[24, 26], [115, 2090]],
		[[24, 27], [250, 100]],
		[[24, 28], [1070, 100]],
		[[24, 29], [110, 370]],
	])(
		'tests doodads at position %s',
		(input, expected) => {
			const [x, y] = input;
			const [tileId, objectId] = expected;
			expect(Game.MapManager.Map.getTileId(x, y)).toBe(tileId);
			expect(Game.MapManager.Map.getObjectId(x, y)).toBe(objectId);
			// expect(Game.MapManager.Map.getTile(x, y)).toBe(expected);
		}
	);
})
