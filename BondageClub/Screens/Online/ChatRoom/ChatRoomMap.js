"use strict";
var ChatRoomMapVisible = false;
var ChatRoomMapWidth = 40;
var ChatRoomMapHeight = 40;
var ChatRoomMapPosX = ChatRoomMapWidth / 2;
var ChatRoomMapPosY = ChatRoomMapHeight / 2;
var ChatRoomMapViewRange = 4;
var ChatRoomMapViewRangeMin = 1;
var ChatRoomMapViewRangeMax = 7;
var ChatRoomMapTileOffset = 100;
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

	{ ID: 2000, Type: "Door", Style: "Wood", Locked: false },
	{ ID: 2001, Type: "Door", Style: "Wood", Locked: true },
	{ ID: 2010, Type: "Door", Style: "IronBars", Locked: false },
	{ ID: 2011, Type: "Door", Style: "IronBars", Locked: true },
	{ ID: 2020, Type: "Door", Style: "Padded", Locked: false },
	{ ID: 2021, Type: "Door", Style: "Padded", Locked: true },

	{ ID: 3000, Type: "Window", Style: "Wood", Crawl: false },
	{ ID: 3001, Type: "Window", Style: "WoodHidden", Crawl: false },
	{ ID: 3010, Type: "Window", Style: "StoneTunnel", Crawl: true },
	{ ID: 3011, Type: "Window", Style: "StoneHidden", Crawl: false },

	{ ID: 4000, Type: "Water", Style: "Ocean" },
	{ ID: 4010, Type: "Water", Style: "Wave" },

];

/**
 * Returns TRUE if the map button can be used
 * @returns {boolean} - TRUE if can be used
 */
function ChatRoomMapButton() { return (!ChatRoomMapVisible && (ChatRoomData != null) && (ChatRoomData.MapData != null) && ChatRoomData.MapData.Active); }

/**
 * Draw the map grid and character on screen
 * @returns {void} - Nothing
 */
function ChatRoomMapDrawGrid(Left, Top, Width, Height) {

	// Make sure the player position on the grid is valid
	if ((ChatRoomMapPosX == null) || (ChatRoomMapPosX < 0) || (ChatRoomMapPosX >= ChatRoomMapWidth)) ChatRoomMapPosX = ChatRoomMapWidth / 2;
	if ((ChatRoomMapPosY == null) || (ChatRoomMapPosY < 0) || (ChatRoomMapPosY >= ChatRoomMapWidth)) ChatRoomMapPosY = ChatRoomMapWidth / 2;

	// Make sure the map grid is valid
	let Grid = ChatRoomData.MapData.Grid;
	if ((Grid == null) || (Grid.length != ChatRoomMapWidth * ChatRoomMapHeight)) Grid = String.fromCharCode(ChatRoomMapTileOffset).repeat(ChatRoomMapWidth * ChatRoomMapHeight);

	// Defines the width and height of the visible tile
	let TileWidth = Width / ((ChatRoomMapViewRange * 2) + 1);
	let TileHeight = Height / ((ChatRoomMapViewRange * 2) + 1);
	let Pos = 0;

	// For each tiles in the grid
	while (Pos < ChatRoomMapWidth * ChatRoomMapHeight) {
		let X = Pos % ChatRoomMapWidth;
		let Y = Math.floor(Pos / ChatRoomMapWidth);
		let ScreenX = (X - ChatRoomMapPosX) * TileWidth + ChatRoomMapViewRange * TileWidth;
		let ScreenY = (Y - ChatRoomMapPosY) * TileHeight + ChatRoomMapViewRange * TileWidth;
		if ((ScreenX >= 0) && (ScreenX < Width) && (ScreenY >= 0) && (ScreenY < Height)) {
			let TileID = Grid.charCodeAt(Pos) - ChatRoomMapTileOffset;
			for (let Tile of ChatRoomMapTileList)
				if (Tile.ID == TileID) {
					DrawImageResize("Screens/Online/ChatRoom/Map/" + Tile.Type + "/" + Tile.Style + ".png", Left + ScreenX, Top + ScreenY, TileWidth, TileHeight);
					break;
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

	// Draws the show character button
	DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/Character.png");
	DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/Plus.png");
	DrawButton(10, 150, 60, 60, "", "White", "Icons/Small/Minus.png");

}

/**
 * Handles clicks in the chat room map screen
 * @returns {void} - Nothing
 */
function ChatRoomMapClick() {

	// From map view to character view
	if (MouseIn(10, 10, 60, 60)) ChatRoomMapVisible = false;
	if (MouseIn(10, 80, 60, 60) && (ChatRoomMapViewRange > ChatRoomMapViewRangeMin)) ChatRoomMapViewRange--;
	if (MouseIn(10, 150, 60, 60) && (ChatRoomMapViewRange < ChatRoomMapViewRangeMax)) ChatRoomMapViewRange++;

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
