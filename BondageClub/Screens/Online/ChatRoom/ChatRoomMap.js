"use strict";
var ChatRoomMapVisible = false;
var ChatRoomMapWidth = 40;
var ChatRoomMapHeight = 40;
var ChatRoomMapPosX = ChatRoomMapWidth / 2;
var ChatRoomMapPosY = ChatRoomMapHeight / 2;
var ChatRoomMapViewRange = 2;
var ChatRoomMapViewRangeMin = 1;
var ChatRoomMapViewRangeMax = 7;
var ChatRoomMapTileOffset = 100;
var ChatRoomMapEditMode = "";
var ChatRoomMapEditSubMode = "";
var ChatRoomMapEditTileID = -1;
var ChatRoomMapEditSelection = [];
var ChatRoomMapEditRange = 1;
var ChatRoomMapTileList = [

	{ ID: 0, Type: "Floor", Style: "OakWood" },
	{ ID: 10, Type: "Floor", Style: "Stone" },
	{ ID: 20, Type: "Floor", Style: "Ceramic" }, // TO DO : Add Color tag for Ceramic tint
	{ ID: 30, Type: "Floor", Style: "Padded" },

	{ ID: 100, Type: "Floor", Style: "Dirt" },
	{ ID: 110, Type: "Floor", Style: "Grass" },
	{ ID: 120, Type: "Floor", Style: "Sand" },
	{ ID: 130, Type: "Floor", Style: "Gravel" },

	{ ID: 1000, Type: "Wall", Style: "Wood" },
	{ ID: 1010, Type: "Wall", Style: "Stone" },
	{ ID: 1020, Type: "Wall", Style: "Brick" },
	{ ID: 1030, Type: "Wall", Style: "Steel" },
	{ ID: 1040, Type: "Wall", Style: "Padded" },

	{ ID: 2000, Type: "Water", Style: "Sea" },
	{ ID: 2010, Type: "Water", Style: "Ocean" },

/*
	{ ID: 2000, Type: "Path", Style: "WoodWallDoor", Locked: false },
	{ ID: 2001, Type: "Path", Style: "WoodWallDoor", Locked: true },
	{ ID: 2010, Type: "Path", Style: "StoneFloorIronBars", Locked: false },
	{ ID: 2011, Type: "Path", Style: "IronBars", Locked: true },
	{ ID: 2020, Type: "Path", Style: "PaddedDoor", Locked: false },
	{ ID: 2021, Type: "Path", Style: "PaddedDoor", Locked: true },

	{ ID: 3000, Type: "Path", Style: "WoodWindow", Crawl: false },
	{ ID: 3001, Type: "Path", Style: "WoodWindowHidden", Crawl: false },
	{ ID: 3010, Type: "Path", Style: "StoneTunnel", Crawl: true },
	{ ID: 3011, Type: "Path", Style: "StoneHidden", Crawl: false },
*/
];

/**
 * Returns TRUE if the map button can be used
 * @returns {boolean} - TRUE if can be used
 */
function ChatRoomMapButton() { return (!ChatRoomMapVisible && (ChatRoomData != null) && (ChatRoomData.MapData != null) && ChatRoomData.MapData.Active); }

// Sets the correct wall tile based on it's surrounding (North-West, North-Center, etc.)
function ChatRoomMapFindWallEffectTile(NW, NC, NE, CW, CE, SW, SC, SE) {

	if (SC && NC && CE && CW && SE && NE && NW && SW) return 0;
	if (!NC && !CW && !CE && !SC) return 1;

	if (NC && !CW && !CE && !SC) return 2;
	if (!NC && !CW && !CE && SC) return 3;
	if (!NC && !CW && CE && !SC) return 4;
	if (!NC && CW && !CE && !SC) return 5;

	if (NC && !CW && !CE && SC) return 6;
	if (!NC && CW && CE && !SC) return 7;
	if (!NW && NC && !NE && CW && CE && !SW && SC && !SE) return 8;

	if (!NW && NC && !NE && CW && CE && !SC) return 9;
	if (!NC && CW && CE && !SW && SC && !SE) return 10;
	if (NC && !NE && !CW && CE && SC && !SE) return 11;
	if (!NW && NC && CW && !CE && !SW && SC) return 12;

	if (NC && !NE && !CW && CE && !SC) return 13;
	if (!NC && !CW && CE && SC && !SE) return 14;
	if (!NW && NC && CW && !CE && !SC) return 15;
	if (!NC && CW && !CE && !SW && SC) return 16;

	if (!NC && CW && CE && SW && SC && SE) return 17;
	if (NW && NC && NE && CW && CE && !SC) return 18;
	if (NW && NC && CW && !CE && SW && SC) return 19;
	if (NC && NE && !CW && CE && SC && SE) return 20;

	if (NC && NE && !CW && CE && !SC) return 21;
	if (NW && NC && CW && !CE && !SC) return 22;
	if (!NC && !CW && CE && SC && SE) return 23;
	if (!NC && CW && !CE && SW && SC) return 24;

	if (NW && NC && NE && CW && CE && !SW && SC && SE) return 25;
	if (NW && NC && NE && CW && CE && SW && SC && !SE) return 26;
	if (!NW && NC && NE && CW && CE && SW && SC && SE) return 27;
	if (NW && NC && !NE && CW && CE && SW && SC && SE) return 28;

	if (NW && NC && NE && CW && CE && !SW && SC && !SE) return 29;
	if (!NW && NC && !NE && CW && CE && SW && SC && SE) return 30;
	if (!NW && NC && NE && CW && CE && !SW && SC && SE) return 31;
	if (NW && NC && !NE && CW && CE && SW && SC && !SE) return 32;

	if (!NW && NC && NE && CW && CE && !SW && SC && !SE) return 33;
	if (NW && NC && !NE && CW && CE && !SW && SC && !SE) return 34;
	if (!NW && NC && !NE && CW && CE && !SW && SC && SE) return 35;
	if (!NW && NC && !NE && CW && CE && SW && SC && !SE) return 36;

	if (!NC && CW && CE && !SW && SC && SE) return 37;
	if (!NC && CW && CE && SW && SC && !SE) return 38;
	if (!NW && NC && NE && CW && CE && !SC) return 39;
	if (NW && NC && !NE && CW && CE && !SC) return 40;

	if (NC && NE && !CW && CE && SC && !SE) return 41;
	if (NC && !NE && !CW && CE && SC && SE) return 42;
	if (NW && NC && CW && !CE && !SW && SC) return 43;
	if (!NW && NC && CW && !CE && SW && SC) return 44;

	if (NW && NC && !NE && CW && CE && !SW && SC && SE) return 45;
	if (!NW && NC && NE && CW && CE && SW && SC && !SE) return 46;

	return 50;

}

// Returns TRUE if the current tile is a wall
function ChatRoomMapIsWall(X, Y) {
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapWidth) || (Y >= ChatRoomMapHeight)) return true;
	let ID = ChatRoomData.MapData.Grid.charCodeAt(X + Y * ChatRoomMapWidth) - ChatRoomMapTileOffset;
	return ((ID >= 1000) && (ID < 2000));
}

/**
 * Apply a wall "3D" effect on the curent map
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @param {number} ScreenX - The X position on the screen
 * @param {number} ScreenY - The Y position on the screen
 * @param {number} TileWidth - The visible width of a tile
 * @param {number} TileHeight - The visible height of a tile
 * @returns {void} - Nothing
 */
function ChatRoomMapWallEffect(X, Y, ScreenX, ScreenY, TileWidth, TileHeight) {

	// Find all other walls around the current tile
	let NW = ChatRoomMapIsWall(X - 1, Y - 1);
	let NC = ChatRoomMapIsWall(X, Y - 1);
	let NE = ChatRoomMapIsWall(X + 1, Y - 1);
	let CW = ChatRoomMapIsWall(X - 1, Y);
	let CE = ChatRoomMapIsWall(X + 1, Y);
	let SW = ChatRoomMapIsWall(X - 1, Y + 1);
	let SC = ChatRoomMapIsWall(X, Y + 1);
	let SE = ChatRoomMapIsWall(X + 1, Y + 1);
	let Effect = ChatRoomMapFindWallEffectTile(NW, NC, NE, CW, CE, SW, SC, SE);
	DrawImageResize("Screens/Online/ChatRoom/Map/WallEffect/" + Effect.toString() + ".png", ScreenX, ScreenY, TileWidth, TileHeight);

}

/**
 * Draw the map grid and character on screen
 * @param {number} Left - The X position on the screen
 * @param {number} Top - The Y position on the screen
 * @param {number} Width - The width size of the drawn map
 * @param {number} Height - The height size of the drawn map
 * @returns {void} - Nothing
 */
function ChatRoomMapDrawGrid(Left, Top, Width, Height) {

	// Make sure the player position on the grid is valid
	if ((ChatRoomMapPosX == null) || (ChatRoomMapPosX < 0) || (ChatRoomMapPosX >= ChatRoomMapWidth)) ChatRoomMapPosX = ChatRoomMapWidth / 2;
	if ((ChatRoomMapPosY == null) || (ChatRoomMapPosY < 0) || (ChatRoomMapPosY >= ChatRoomMapWidth)) ChatRoomMapPosY = ChatRoomMapWidth / 2;

	// Make sure the map grid is valid
	if ((ChatRoomData.MapData.Grid == null) || (ChatRoomData.MapData.Grid.length != ChatRoomMapWidth * ChatRoomMapHeight)) ChatRoomData.MapData.Grid = String.fromCharCode(ChatRoomMapTileOffset).repeat(ChatRoomMapWidth * ChatRoomMapHeight);

	// Defines the width and height of the visible tile
	let TileWidth = Width / ((ChatRoomMapViewRange * 2) + 1);
	let TileHeight = Height / ((ChatRoomMapViewRange * 2) + 1);
	let Pos = 0;
	let EditWidth = (ChatRoomMapEditRange - 1) * TileWidth;
	let EditHeight = (ChatRoomMapEditRange - 1) * TileHeight;
	ChatRoomMapEditSelection = [];

	// For each tiles in the grid
	while (Pos < ChatRoomMapWidth * ChatRoomMapHeight) {
		let X = Pos % ChatRoomMapWidth;
		let Y = Math.floor(Pos / ChatRoomMapWidth);
		let ScreenX = (X - ChatRoomMapPosX) * TileWidth + ChatRoomMapViewRange * TileWidth;
		let ScreenY = (Y - ChatRoomMapPosY) * TileHeight + ChatRoomMapViewRange * TileWidth;
		if ((ScreenX >= 0) && (ScreenX < Width) && (ScreenY >= 0) && (ScreenY < Height)) {
			let TileID = ChatRoomData.MapData.Grid.charCodeAt(Pos) - ChatRoomMapTileOffset;
			for (let Tile of ChatRoomMapTileList)
				if (Tile.ID == TileID) {
					DrawImageResize("Screens/Online/ChatRoom/Map/" + Tile.Type + "/" + Tile.Style + ".png", Left + ScreenX, Top + ScreenY, TileWidth, TileHeight);
					if (Tile.Type == "Wall") ChatRoomMapWallEffect(X, Y, Left + ScreenX, Top + ScreenY, TileWidth, TileHeight);
					break;
				}
			if ((ChatRoomMapEditMode == "Tile") && (Left + ScreenX - EditWidth <= MouseX) && (Left + ScreenX + TileWidth + EditWidth >= MouseX) && (Top + ScreenY - EditHeight <= MouseY) && (Top + ScreenY + TileHeight + EditHeight >= MouseY)) {
				ChatRoomMapEditSelection.push(Pos);
				DrawEmptyRect(Left + ScreenX, Top + ScreenY, TileWidth, TileHeight, "cyan", 3);
			}
		}
		Pos++;
	}

	// Draws the player in front of everything
	DrawCharacter(Player, Left + TileWidth * ChatRoomMapViewRange, Top + TileHeight * (ChatRoomMapViewRange - 1), TileHeight * 2 / 1000);

}

/**
 * Draws the map, characters and buttons of the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapDraw() {

	// Draw the full grid on the left side of the screen
	ChatRoomMapDrawGrid(0, 0, 1000, 1000);

	// Out of edit mode, we draws the basic buttons
	if (ChatRoomMapEditMode == "") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/ShowCharacter.png");
		DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/Plus.png");
		DrawButton(10, 150, 60, 60, "", "White", "Icons/Small/Minus.png");
		if (ChatRoomPlayerIsAdmin()) DrawButton(10, 220, 60, 60, "", "White", "Icons/Small/Edit.png");
	}

	// In type edit mode, the user can select a tile type (floor, wall, etc.)
	if (ChatRoomMapEditMode == "Type") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/ShowMap.png");
		let Y = 10;
		let Type = "";
		for (let Tile of ChatRoomMapTileList)
			if (Type != Tile.Type) {
				Type = Tile.Type;
				Y = Y + 70;
				DrawButton(10, Y, 60, 60, "", "White", "Screens/Online/ChatRoom/Map/Type/" + Type + ".png");
			}
	}

	// In tile edit mode, we show all tiles of a spectific tyle
	if (ChatRoomMapEditMode == "Tile") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/Edit.png");
		DrawButton(10, 80, 60, 60, "", "White", "Screens/Online/ChatRoom/Map/Range/" + ChatRoomMapEditRange.toString() + ".png");
		let Y = 80;
		for (let Tile of ChatRoomMapTileList)
			if (ChatRoomMapEditSubMode == Tile.Type) {
				Y = Y + 70;
				DrawButton(10, Y, 60, 60, "", "White");
				if (Tile.ID == ChatRoomMapEditTileID) DrawRect(12, Y + 2, 56, 56, "#FF0000");
				DrawImageResize("Screens/Online/ChatRoom/Map/" + Tile.Type + "/" + Tile.Style + ".png", 15, Y + 5, 50, 50);
			}
	}

}

/**
 * Handles clicks in the chat room map screen
 * @returns {void} - Nothing
 */
function ChatRoomMapClick() {

	// Out of edit mode, we allow the basic buttons
	if (ChatRoomMapEditMode == "") {
		if (MouseIn(10, 10, 60, 60)) ChatRoomMapVisible = false;
		if (MouseIn(10, 80, 60, 60) && (ChatRoomMapViewRange > ChatRoomMapViewRangeMin)) ChatRoomMapViewRange--;
		if (MouseIn(10, 150, 60, 60) && (ChatRoomMapViewRange < ChatRoomMapViewRangeMax)) ChatRoomMapViewRange++;
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 220, 60, 60)) {
			ChatRoomMapEditMode = "Type";
			ChatRoomMapEditSubMode = "";
			return;
		}
	}

	// In type edit mode, the user can select a tile type (floor, wall, etc.)
	if (ChatRoomMapEditMode == "Type") {
		if (MouseIn(10, 10, 60, 60)) ChatRoomMapEditMode = "";
		let Y = 10;
		let Type = "";
		for (let Tile of ChatRoomMapTileList)
			if (Type != Tile.Type) {
				Type = Tile.Type;
				Y = Y + 70;
				if (MouseIn(10, Y, 60, 60)) {
					ChatRoomMapEditMode = "Tile";
					ChatRoomMapEditSubMode = Tile.Type;
					ChatRoomMapEditTileID = Tile.ID;
					return;
				}
			}
	}

	// In tile edit mode, we show all tiles of a spectific tyle
	if (ChatRoomMapEditMode == "Tile") {

		// The first button returns to type selection
		if (MouseIn(10, 10, 60, 60)) {
			ChatRoomMapEditMode = "Type";
			return;
		}

		// The second button allows changing the edit size from 1 to 5
		if (MouseIn(10, 80, 60, 60)) {
			ChatRoomMapEditRange++;
			if (ChatRoomMapEditRange > 5) ChatRoomMapEditRange = 1;
			return;
		}

		// The other buttons allows changing the edit tile
		let Y = 80;
		for (let Tile of ChatRoomMapTileList)
			if (ChatRoomMapEditSubMode == Tile.Type) {
				Y = Y + 70;
				if (MouseIn(10, Y, 60, 60)) {
					ChatRoomMapEditTileID = Tile.ID;
					return;
				}
			}

		// When clicking on the map the user can edit tiles
		if (ChatRoomMapEditTileID >= 0)
			for (let Pos of ChatRoomMapEditSelection)
				ChatRoomData.MapData.Grid = ChatRoomData.MapData.Grid.substring(0, Pos) + String.fromCharCode(ChatRoomMapEditTileID + ChatRoomMapTileOffset) + ChatRoomData.MapData.Grid.substring(Pos + 1);

	}

}

/**
 * Handles keyboard keys in the chat room map screen
 * @returns {void} - Nothing
 */
function ChatRoomMapKeyDown() {

	// ENTER to go back to the chat box
	if (KeyPress == 13) ElementFocus("InputChat");

	// + and - to change the view range / zoom
	if (((KeyPress == 43) || (KeyPress == 61)) && (ChatRoomMapViewRange > ChatRoomMapViewRangeMin)) ChatRoomMapViewRange--;
	if (((KeyPress == 45) || (KeyPress == 95)) && (ChatRoomMapViewRange < ChatRoomMapViewRangeMax)) ChatRoomMapViewRange++;

}
