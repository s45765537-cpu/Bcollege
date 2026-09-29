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
