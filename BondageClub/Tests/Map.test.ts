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

Game.load("../Scripts/Common.js");
Game.load("../Scripts/BitString.js");
Game.load("../Screens/Online/ChatRoom/ChatRoom.js");
Game.load("../Screens/Online/ChatRoom/ChatRoomMapView.js");



Game.load("../Scripts/Map.js");
Game.ChatRoomData = {};
beforeEach(() => {
	Game.ChatRoomData.MapData = Game.ChatRoomMapViewInitialize("Always");
});
describe("MapCanSetCell", () => {
	it("setting a cell out of bounds should fail", () => {
		const stoneWall = 1030;
		expect(Game.MapCanSetCell(stoneWall, "Tile", -1000, -1000)).toBe(false);
	});

	it("setting a cell that doesn't exist should fail", () => {
		const tile = 12130;
		expect(Game.MapCanSetCell(tile, "Tile", 5, 5)).toBe(false);
	});
});

describe("MapSetCell", () => {
	it("placing unique cells should work", () => {
		const entry = 110;
		Game.MapSetCell(entry, "Object", 1, 1, true);
		expect(Game.MapGetCellId("Object", 1, 1)).toEqual(entry);
	});
});

describe("MapClearUniqueCells", () => {
	it("unique cells should clear after a set", () => {
		const entry = 110;
		Game.MapSetCell(entry, "Object", 1, 1, true);
		Game.MapSetCell(entry, "Object", 1, 2, true);
		expect(Game.MapGetCellId("Object", 1, 1) != entry && Game.MapGetCellId("Object", 1, 2) == entry).toBe(true);
	});
});
