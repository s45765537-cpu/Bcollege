"use strict";
var ChatRoomMapVisible = false;
var ChatRoomMapAllow = true;
var ChatRoomMapWidth = 40;
var ChatRoomMapHeight = 40;
var ChatRoomMapViewRange = 4;
var ChatRoomMapViewRangeMin = 1;
var ChatRoomMapViewRangeMax = 7;
var ChatRoomMapTileOffset = 100;
var ChatRoomMapEditMode = "";
var ChatRoomMapEditSubMode = "";
var ChatRoomMapEditStarted = false;
var ChatRoomMapEditID = -1;
var ChatRoomMapEditSelection = [];
var ChatRoomMapEditRange = 1;
var ChatRoomMapUpdateRoomNext = null;
var ChatRoomMapUpdatePlayerNext = null;
var ChatRoomMapFocusedCharacter = null;

var ChatRoomMapTileList = [

	{ ID: 0, Type: "Floor", Style: "OakWood" },
	{ ID: 10, Type: "Floor", Style: "Stone" },
	{ ID: 20, Type: "Floor", Style: "Ceramic" },
	{ ID: 30, Type: "Floor", Style: "Carpet" },
	{ ID: 40, Type: "Floor", Style: "Padded" },
	{ ID: 100, Type: "Floor", Style: "Dirt" },
	{ ID: 110, Type: "Floor", Style: "Grass" },
	{ ID: 120, Type: "Floor", Style: "Sand" },
	{ ID: 130, Type: "Floor", Style: "Gravel" },

	{ ID: 1000, Type: "Wall", Style: "Wood" },
	{ ID: 1010, Type: "Wall", Style: "Log" },
	{ ID: 1020, Type: "Wall", Style: "Japanese" },
	{ ID: 1030, Type: "Wall", Style: "Stone" },
	{ ID: 1040, Type: "Wall", Style: "Brick" },
	{ ID: 1050, Type: "Wall", Style: "Dungeon" },
	{ ID: 1060, Type: "Wall", Style: "Square" },
	{ ID: 1070, Type: "Wall", Style: "Steel" },
	{ ID: 1080, Type: "Wall", Style: "Padded" },

	{ ID: 2000, Type: "Water", Style: "Pool" },
	{ ID: 2010, Type: "Water", Style: "Sea" },
	{ ID: 2020, Type: "Water", Style: "Ocean" },

];

var ChatRoomMapObjectList = [

	{ ID: 0, Type: "FloorDecoration", Style: "Blank" },
	{ ID: 10, Type: "FloorDecoration", Style: "Pillow" },
	{ ID: 20, Type: "FloorDecoration", Style: "Locker", Top: -1, Height: 2, Speed: 0.5 },
	{ ID: 30, Type: "FloorDecoration", Style: "XCross", Top: -1, Height: 2, Speed: 0.5 },

	{ ID: 1000, Type: "FloorObstacle", Style: "Blank" },
	{ ID: 1010, Type: "FloorObstacle", Style: "Statue", Top: -1, Height: 2 },
	{ ID: 1020, Type: "FloorObstacle", Style: "Barrel", Top: -1, Height: 2 },
	{ ID: 1030, Type: "FloorObstacle", Style: "OakTree", Top: -1, Height: 2 },
	{ ID: 1040, Type: "FloorObstacle", Style: "PineTree", Top: -1, Height: 2 },

	{ ID: 2000, Type: "WallDecoration", Style: "Blank" },
	{ ID: 2010, Type: "WallDecoration", Style: "Painting" },
	{ ID: 2020, Type: "WallDecoration", Style: "Mirror" },
	{ ID: 2030, Type: "WallDecoration", Style: "Candelabra" },
	{ ID: 2040, Type: "WallDecoration", Style: "Whip" },

	{ ID: 3000, Type: "WallPath", Style: "Blank" },
	{ ID: 3010, Type: "WallPath", Style: "WoodDoor", Locked: false },
	{ ID: 3011, Type: "WallPath", Style: "WoodDoor", Locked: true },
	{ ID: 3020, Type: "WallPath", Style: "PaddedDoor", Locked: false },
	{ ID: 3021, Type: "WallPath", Style: "PaddedDoor", Locked: true },
	{ ID: 3030, Type: "WallPath", Style: "HiddenDoor", Locked: false },
	{ ID: 3031, Type: "WallPath", Style: "HiddenDoor", Locked: true },

];

/**
 * Returns TRUE if the map button can be used
 * @returns {boolean} - TRUE if can be used
 */
function ChatRoomMapButton() { return (!ChatRoomMapVisible && (ChatRoomData != null) && (ChatRoomData.MapData != null) && ChatRoomData.MapData.Active); }

/**
 * Sets the correct wall tile based on it's surrounding (North-West, North-Center, etc.)
 * @param {boolean} CW - If Center West is a wall
 * @param {boolean} CE - If Center East is a wall
 * @param {boolean} SW - If South West is a wall
 * @param {boolean} SC - If South Center is a wall
 * @param {boolean} SE - If South East is a wall
 * @returns {number} - a number linked on the image to use
 */
function ChatRoomMapFindWallEffectTile(CW, CE, SW, SC, SE) {

	if (CW && CE && SW && SC && SE) return 0;
	if (!CW && !CE && !SC) return 1;
	if (!CW && CE && !SC) return 2;
	if (CW && !CE && !SC) return 3;
	if (CW && CE && !SC) return 4;

	if (!CW && !CE && SW && SC && SE) return 5;
	if (!CW && !CE && SW && SC && !SE) return 6;
	if (!CW && !CE && !SW && SC && SE) return 7;

	if (CW && CE && !SW && SC && !SE) return 8;	
	if (!CW && CE && !SW && SC && !SE) return 9;
	if (CW && !CE && !SW && SC && !SE) return 10;

	if (!CW && !CE && !SE && SC && !SW) return 11;
	if (CW && !CE && !SE && SC && !SW) return 12;
	if (!CW && CE && !SE && SC && !SW) return 13;

	if (!CW && CE && SE && SC && SW) return 14;
	if (CW && !CE && SE && SC && SW) return 15;

	if (CW && !CE && SW && SC) return 16;
	if (!CW && CE && SC && SE) return 17;

	if (CW && CE && SW && SC && !SE) return 18;
	if (CW && CE && !SW && SC && SE) return 19;

	if (!CW && CE && SW && SC && !SE) return 20;
	if (CW && !CE && !SW && SC && SE) return 21;

	return -1;

}

/**
 * Returns TRUE if the X and Y coordinates is a wall tile, if out of bound we also return TRUE
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {boolean} - TRUE if it's a wall
 */
function ChatRoomMapIsWall(X, Y) {
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapWidth) || (Y >= ChatRoomMapHeight)) return true;
	let ID = ChatRoomData.MapData.Tiles.charCodeAt(X + Y * ChatRoomMapWidth) - ChatRoomMapTileOffset;
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
	let CW = ChatRoomMapIsWall(X - 1, Y);
	let CE = ChatRoomMapIsWall(X + 1, Y);
	let SW = ChatRoomMapIsWall(X - 1, Y + 1);
	let SC = ChatRoomMapIsWall(X, Y + 1);
	let SE = ChatRoomMapIsWall(X + 1, Y + 1);

	// Finds the proper effect and draws it
	let Effect = ChatRoomMapFindWallEffectTile(CW, CE, SW, SC, SE);
	DrawImageResize("Screens/Online/ChatRoom/MapTile/WallEffect/" + Effect.toString() + ".png", ScreenX, ScreenY, TileWidth, TileHeight);

}

/**
 * Apply a wall "3D" effect on the curent map
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {number} - The effect number
 */
function ChatRoomMapFloorWallEffect(X, Y) {

	// No effect on the very last row
	if (Y >= ChatRoomMapHeight - 1) return -1;

	// Find the soutern wall positions
	let SW = ChatRoomMapIsWall(X - 1, Y + 1);
	let SC = ChatRoomMapIsWall(X, Y + 1);
	let SE = ChatRoomMapIsWall(X + 1, Y + 1);

	// Find the "3D" wall effect and returns it
	if (!SW && SC && !SE) return 50;
	if (!SW && SC && SE) return 51;
	if (SW && SC && !SE) return 52;
	if (SW && SC && SE) return 53;
	return -1;

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
	if (Player.MapData == null) Player.MapData = {};
	if ((Player.MapData.X == null) || (Player.MapData.X < 0) || (Player.MapData.X >= ChatRoomMapWidth)) {
		Player.MapData.X = ChatRoomMapWidth / 2;
		ChatRoomMapUpdatePlayerFlag();
	}
	if ((Player.MapData.Y == null) || (Player.MapData.Y < 0) || (Player.MapData.Y >= ChatRoomMapWidth)) {
		Player.MapData.Y = ChatRoomMapWidth / 2;
		ChatRoomMapUpdatePlayerFlag();
	}

	// Make sure the map grid is valid
	if ((ChatRoomData.MapData.Tiles == null) || (ChatRoomData.MapData.Tiles.length != ChatRoomMapWidth * ChatRoomMapHeight)) ChatRoomData.MapData.Tiles = String.fromCharCode(ChatRoomMapTileOffset).repeat(ChatRoomMapWidth * ChatRoomMapHeight);
	if ((ChatRoomData.MapData.Objects == null) || (ChatRoomData.MapData.Objects.length != ChatRoomMapWidth * ChatRoomMapHeight)) ChatRoomData.MapData.Objects = String.fromCharCode(ChatRoomMapTileOffset).repeat(ChatRoomMapWidth * ChatRoomMapHeight);

	// Defines the width and height of the visible tile
	let TileWidth = Width / ((ChatRoomMapViewRange * 2) + 1);
	let TileHeight = Height / ((ChatRoomMapViewRange * 2) + 1);
	let Pos = 0;
	let EditWidth = (ChatRoomMapEditRange - 1) * TileWidth;
	let EditHeight = (ChatRoomMapEditRange - 1) * TileHeight;
	let MaxVisibleRange = ChatRoomMapViewRangeMax - Player.GetBlindLevel() * 2;
	if (MaxVisibleRange < 1) MaxVisibleRange = 1;

	// Clears the tile and character selection
	ChatRoomMapEditSelection = [];
	ChatRoomMapFocusedCharacter = null;

	// For each tiles in the grid
	while (Pos < ChatRoomMapWidth * ChatRoomMapHeight) {

		// Find the X & Y position of the grid
		let X = Pos % ChatRoomMapWidth;
		let Y = Math.floor(Pos / ChatRoomMapWidth);

		// Only process if the X & Y are within the visible sight range
		let MaxRange = Math.max(Math.abs(X - Player.MapData.X), Math.abs(Y - Player.MapData.Y));
		if (MaxRange <= MaxVisibleRange) {

			// Defines the screen X and Y positions
			let ScreenX = (X - Player.MapData.X) * TileWidth + ChatRoomMapViewRange * TileWidth;
			let ScreenY = (Y - Player.MapData.Y) * TileHeight + ChatRoomMapViewRange * TileWidth;

			let FloorWallEffect = -1;
			let DrawRect = false;

			// Draws the tile and object image and applies the visual effects if needed
			if ((ScreenX >= 0) && (ScreenX < Width) && (ScreenY >= 0) && (ScreenY < Height)) {
				let TileID = ChatRoomData.MapData.Tiles.charCodeAt(Pos) - ChatRoomMapTileOffset;
				for (let Tile of ChatRoomMapTileList)
					if (Tile.ID == TileID) {
						DrawImageResize("Screens/Online/ChatRoom/MapTile/" + Tile.Type + "/" + Tile.Style + ".png", Left + ScreenX, Top + ScreenY, TileWidth, TileHeight);
						if (Tile.Type == "Wall") ChatRoomMapWallEffect(X, Y, Left + ScreenX, Top + ScreenY, TileWidth, TileHeight);
						else FloorWallEffect = ChatRoomMapFloorWallEffect(X, Y);
						break;
					}
				let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(Pos) - ChatRoomMapTileOffset;
				if (ObjectID > 0)
					for (let Obj of ChatRoomMapObjectList)
						if (Obj.ID == ObjectID) {
							DrawImageResize("Screens/Online/ChatRoom/MapObject/" + Obj.Type + "/" + Obj.Style + ".png", Left + ScreenX + ((Obj.Left == null) ? 0 : TileWidth * Obj.Left), Top + ScreenY + ((Obj.Top == null) ? 0 : TileHeight * Obj.Top), TileWidth * ((Obj.Width == null) ? 1 : Obj.Width), TileHeight * ((Obj.Height == null) ? 1 : Obj.Height));
							break;
						}
				if (((ChatRoomMapEditMode == "Tile") || (ChatRoomMapEditMode == "Object")) && (Left + ScreenX - EditWidth <= MouseX) && (Left + ScreenX + TileWidth + EditWidth >= MouseX) && (Top + ScreenY - EditHeight <= MouseY) && (Top + ScreenY + TileHeight + EditHeight >= MouseY)) {
					ChatRoomMapEditSelection.push(Pos);
					DrawRect = true;
				}
			}

			// Draws the characters on that tile
			for (let C of ChatRoomCharacter)
				if ((C.MapData != null) && (C.MapData.X === X) && (C.MapData.Y === Y)) {
					DrawCharacter(C, Left + ScreenX + (TileWidth * 0.05), Top + ScreenY - (TileHeight * 0.85), TileHeight * 1.8 / 1000);
					if ((MouseX >= Left + ScreenX + (TileWidth * 0.05)) && (MouseX <= Left + ScreenX + (TileWidth * 0.95)) && (MouseY >= Top + ScreenY - (TileHeight * 0.85)) && (MouseY <= Top + ScreenY + (TileHeight * 0.95)))
						ChatRoomMapFocusedCharacter = C;
				}

			// Draw the floor wall effect and rectancle if needed at the end
			if (FloorWallEffect != -1) DrawImageResize("Screens/Online/ChatRoom/MapTile/WallEffect/" + FloorWallEffect.toString() + ".png", ScreenX, ScreenY, TileWidth, TileHeight);
			if (DrawRect) DrawEmptyRect(Left + ScreenX, Top + ScreenY, TileWidth, TileHeight, "cyan", 3);

		}

		// Jumps to the next grid position
		Pos++;

	}

}

/**
 * Sets the next update flag for the room if it's not already set, the delay is 3 seconds
 * @returns {void} - Nothing
 */
function ChatRoomMapUpdateFlag() {

	// Clears the wrong objects on the map
	for (let Pos = 0; Pos < ChatRoomMapWidth * ChatRoomMapHeight; Pos++) {

		// If there's an object to check
		let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(Pos) - ChatRoomMapTileOffset;
		if (ObjectID >= 1) {

			// Finds the object
			//debugger;
			let ClearObject = false;
			let Obj = null;
			for (let O of ChatRoomMapObjectList)
				if (O.ID == ObjectID) {
					Obj = O;
					break;
				}

			// Clears invalid objects
			if ((Obj == null) || (Obj.Style == "Blank")) {
				ClearObject = true;
			} else {

				// Gets the tile for that object
				let TileID = ChatRoomData.MapData.Tiles.charCodeAt(Pos) - ChatRoomMapTileOffset;
				let Tile = null;
				for (let T of ChatRoomMapTileList)
					if (T.ID == TileID) {
						Tile = T;
						break;
					}

				// Invalid tiles and invalid objects for that tile must be cleared
				if (Tile == null) ClearObject = true;
				else if ((Obj.Type == "FloorDeoration") && (Tile.Type != "Floor")) ClearObject = true;
				else if ((Obj.Type == "FloorObstacle") && (Tile.Type != "Floor")) ClearObject = true;
				else if ((Obj.Type == "WallDecoration") && (Tile.Type != "Wall")) ClearObject = true;
				else if ((Obj.Type == "WallPath") && (Tile.Type != "Wall")) ClearObject = true;
				else if (Tile.Type == "Wall") {

					// If the current tile and the one below is a wall, we clear the object
					let X = Pos % ChatRoomMapWidth;
					let Y = Math.floor(Pos / ChatRoomMapWidth);
					if (ChatRoomMapIsWall(X, Y + 1)) ClearObject = true;

				}

			}

			// Clears the object if needed
			if (ClearObject) ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapTileOffset) + ChatRoomData.MapData.Objects.substring(Pos + 1);

		}

	}

	// Sets the flag
	if (ChatRoomMapUpdateRoomNext == null) ChatRoomMapUpdateRoomNext = CommonTime() + 3000;

}

/**
 * Sets the next update flag for the player if it's not already set, the delay is 1 seconds
 * @returns {void} - Nothing
 */
function ChatRoomMapUpdatePlayerFlag() {
	if (ChatRoomMapUpdatePlayerNext == null) ChatRoomMapUpdatePlayerNext = CommonTime() + 1000;
}

/**
 * Updates the room data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapUpdateRoomSync() {
	if ((ChatRoomMapUpdateRoomNext == null) || (ChatRoomMapUpdateRoomNext > CommonTime())) return;
	if (!ChatRoomPlayerIsAdmin()) return;
	ChatRoomMapUpdateRoomNext = null;
	var UpdatedRoom = {
		Name: ChatRoomData.Name,
		Language: ChatRoomData.Language,
		Description: ChatRoomData.Description,
		Background: ChatRoomData.Background,
		Limit: ChatRoomData.Limit.toString(),
		Admin: ChatRoomData.Admin,
		Ban: ChatRoomData.Ban,
		BlockCategory: ChatRoomData.BlockCategory,
		Game: ChatRoomData.Game,
		Private: ChatRoomData.Private,
		Locked: ChatRoomData.Locked,
		MapData: ChatRoomData.MapData,
		Custom: ChatRoomData.Custom,
	};
	// @ts-ignore
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });
}

/**
 * Updates the player data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapUpdatePlayerSync() {
	if ((ChatRoomMapUpdatePlayerNext == null) || (ChatRoomMapUpdatePlayerNext > CommonTime())) return;
	ChatRoomMapUpdatePlayerNext = null;
	ServerAccountUpdate.QueueData({ MapData: Player.MapData }, true);
}

/**
 * Draws the map, characters and buttons of the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapDraw() {

	// Syncs the room map data with the server if needed
	ChatRoomMapUpdateRoomSync();
	ChatRoomMapUpdatePlayerSync();

	// Draw the full grid on the left side of the screen
	ChatRoomMapDrawGrid(0, 0, 1000, 1000);

	// Draw the movement buttons
	DrawButton(860, 790, 60, 60, "", "White", "Icons/Small/North.png");
	DrawButton(790, 860, 60, 60, "", "White", "Icons/Small/West.png");
	DrawButton(930, 860, 60, 60, "", "White", "Icons/Small/East.png");
	DrawButton(860, 930, 60, 60, "", "White", "Icons/Small/South.png");

	// Out of edit mode, we draws the basic buttons
	if (ChatRoomMapEditMode == "") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/ShowCharacter.png");
		DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/Plus.png");
		DrawButton(10, 150, 60, 60, "", "White", "Icons/Small/Minus.png");
		if (ChatRoomPlayerIsAdmin()) DrawButton(10, 220, 60, 60, "", "White", "Icons/Small/EditTile.png");
		if (ChatRoomPlayerIsAdmin()) DrawButton(10, 290, 60, 60, "", "White", "Icons/Small/EditObject.png");
	}

	// In tile type selection mode, the user can select a tile type (floor, wall, etc.)
	if (ChatRoomMapEditMode == "TileType") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/ShowMap.png");
		DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/EditObject.png");
		let Y = 80;
		let Type = "";
		for (let Tile of ChatRoomMapTileList)
			if (Type != Tile.Type) {
				Type = Tile.Type;
				Y = Y + 70;
				DrawButton(10, Y, 60, 60, "", "White", "Screens/Online/ChatRoom/MapTile/Type/" + Type + ".png");
			}
	}

	// In tile edit mode, we show all tiles of a spectific tyle
	if (ChatRoomMapEditMode == "Tile") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/Edit.png");
		DrawButton(10, 80, 60, 60, "", "White", "Screens/Online/ChatRoom/MapTile/Range/" + ChatRoomMapEditRange.toString() + ".png");
		let Y = 80;
		for (let Tile of ChatRoomMapTileList)
			if (ChatRoomMapEditSubMode == Tile.Type) {
				Y = Y + 70;
				DrawButton(10, Y, 60, 60, "", "White");
				if (Tile.ID == ChatRoomMapEditID) DrawRect(12, Y + 2, 56, 56, "#FF0000");
				DrawImageResize("Screens/Online/ChatRoom/MapTile/" + Tile.Type + "/" + Tile.Style + ".png", 15, Y + 5, 50, 50);
			}
	}

	// In object type selection mode, the user can select an object type (floor decoration, floor obstacle, wall decoration, etc.)
	if (ChatRoomMapEditMode == "ObjectType") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/ShowMap.png");
		DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/EditTile.png");
		let Y = 80;
		let Type = "";
		for (let Obj of ChatRoomMapObjectList)
			if (Type != Obj.Type) {
				Type = Obj.Type;
				Y = Y + 70;
				DrawButton(10, Y, 60, 60, "", "White", "Screens/Online/ChatRoom/MapObject/Type/" + Type + ".png");
			}
	}

	// In object edit mode, we show all objects of a spectific tyle
	if (ChatRoomMapEditMode == "Object") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/Edit.png");
		DrawButton(10, 80, 60, 60, "", "White", "Screens/Online/ChatRoom/MapTile/Range/" + ChatRoomMapEditRange.toString() + ".png");
		let Y = 80;
		for (let Obj of ChatRoomMapObjectList)
			if (ChatRoomMapEditSubMode == Obj.Type) {
				Y = Y + 70;
				DrawButton(10, Y, 60, 60, "", "White");
				if (Obj.ID == ChatRoomMapEditID) DrawRect(12, Y + 2, 56, 56, "#FF0000");
				DrawImageResize("Screens/Online/ChatRoom/MapObject/" + Obj.Type + "/" + Obj.Style + ".png", 15, Y + 5, 50, 50);
			}
	}

}

/**
 * Check if a tile on the map can be entered by a player
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {boolean} - TRUE if the player can enter that tile
 */
function ChatRoomMapCanEnterTile(X, Y) {

	// Out of map bound or walls cannot enter
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapWidth) || (Y >= ChatRoomMapHeight)) return false;
	if (ChatRoomMapIsWall(X, Y)) return false;

	// Floor obstacles from 1000 to 2000 cannot be crossed
	let ID = ChatRoomData.MapData.Objects.charCodeAt(X + Y * ChatRoomMapWidth) - ChatRoomMapTileOffset;
	if ((ID >= 1000) && (ID < 2000)) return false;

	// Cannot enter a tile occupied by another player
	for (let C of ChatRoomCharacter)
		if (!C.IsPlayer() && (C.MapData != null) && (C.MapData.X === X) && (C.MapData.Y === Y))
			return false;
	return true;

}

/**
 * Moves the player
 * @param {string} D - The X position on the screen
 * @returns {void} - Nothing
 */
function ChatRoomMapMove(D) {

	// Gets the new position
	let X = Player.MapData.X + ((D == "W") ? -1 : 0) + ((D == "E") ? 1 : 0);
	let Y = Player.MapData.Y + ((D == "N") ? -1 : 0) + ((D == "S") ? 1 : 0);

	// If we can enter the tile
	if (ChatRoomMapCanEnterTile(X, Y)) {
		Player.MapData.X = X;
		Player.MapData.Y = Y;
		ChatRoomMapUpdatePlayerFlag();
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

	// WASD to move
	if ((KeyPress == 87) || (KeyPress == 119)) ChatRoomMapMove("N");
	if ((KeyPress == 65) || (KeyPress == 97)) ChatRoomMapMove("W");
	if ((KeyPress == 83) || (KeyPress == 115)) ChatRoomMapMove("S");
	if ((KeyPress == 68) || (KeyPress == 100)) ChatRoomMapMove("E");

}

/**
 * Mouse down event is used to draw on screen and handle the tiles buttons
 * @returns {void} - Nothing
 */
function ChatRoomMapMouseDown(Event) {

	// The walk buttons
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapVisible) return;
	if (MouseIn(860, 790, 60, 60)) return ChatRoomMapMove("N");
	if (MouseIn(790, 860, 60, 60)) return ChatRoomMapMove("W");
	if (MouseIn(930, 860, 60, 60)) return ChatRoomMapMove("E");
	if (MouseIn(860, 930, 60, 60)) return ChatRoomMapMove("S");

	// Out of edit mode, we allow the basic buttons
	if (ChatRoomMapEditMode == "") {
		if (MouseIn(10, 10, 60, 60)) {
			ChatRoomMapVisible = false;
			ChatRoomMapAllow = false;
			return;
		}
		if (MouseIn(10, 80, 60, 60) && (ChatRoomMapViewRange > ChatRoomMapViewRangeMin)) { ChatRoomMapViewRange--; return; }
		if (MouseIn(10, 150, 60, 60) && (ChatRoomMapViewRange < ChatRoomMapViewRangeMax)) { ChatRoomMapViewRange++; return; }
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 220, 60, 60)) {
			ChatRoomMapEditMode = "TileType";
			ChatRoomMapEditSubMode = "";
			return;
		}
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 290, 60, 60)) {
			ChatRoomMapEditMode = "ObjectType";
			ChatRoomMapEditSubMode = "";
			return;
		}
	}

	// In tile type selection mode, the user can select a tile type (floor, wall, etc.)
	if (ChatRoomMapEditMode == "TileType") {
		if (MouseIn(10, 10, 60, 60)) { ChatRoomMapEditMode = ""; return; }
		if (MouseIn(10, 80, 60, 60)) { ChatRoomMapEditMode = "ObjectType"; return; }
		let Y = 80;
		let Type = "";
		for (let Tile of ChatRoomMapTileList)
			if (Type != Tile.Type) {
				Type = Tile.Type;
				Y = Y + 70;
				if (MouseIn(10, Y, 60, 60)) {
					ChatRoomMapEditMode = "Tile";
					ChatRoomMapEditSubMode = Tile.Type;
					ChatRoomMapEditID = Tile.ID;
					return;
				}
			}
	}

	// In tile edit mode
	if ((ChatRoomMapEditMode == "Tile") && MouseIn(0, 0, 1000, 1000)) {

		// The first button returns to type selection
		if (MouseIn(10, 10, 60, 60)) {
			ChatRoomMapEditMode = "TileType";
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
					ChatRoomMapEditID = Tile.ID;
					return;
				}
			}

		// Enter the drawing mode
		ChatRoomMapEditStarted = true;
		ChatRoomMapMouseMove();
		return;

	}

	// In object type selection mode, the user can select an object type (floor decoration, floor obstacle, wall decoration, etc.)
	if (ChatRoomMapEditMode == "ObjectType") {
		if (MouseIn(10, 10, 60, 60)) { ChatRoomMapEditMode = ""; return; }
		if (MouseIn(10, 80, 60, 60)) { ChatRoomMapEditMode = "TileType"; return; }
		let Y = 80;
		let Type = "";
		for (let Obj of ChatRoomMapObjectList)
			if (Type != Obj.Type) {
				Type = Obj.Type;
				Y = Y + 70;
				if (MouseIn(10, Y, 60, 60)) {
					ChatRoomMapEditMode = "Object";
					ChatRoomMapEditSubMode = Obj.Type;
					ChatRoomMapEditID = Obj.ID;
					return;
				}
			}
	}

	// In object edit mode
	if ((ChatRoomMapEditMode == "Object") && MouseIn(0, 0, 1000, 1000)) {

		// The first button returns to type selection
		if (MouseIn(10, 10, 60, 60)) {
			ChatRoomMapEditMode = "ObjectType";
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
		for (let Obj of ChatRoomMapObjectList)
			if (ChatRoomMapEditSubMode == Obj.Type) {
				Y = Y + 70;
				if (MouseIn(10, Y, 60, 60)) {
					ChatRoomMapEditID = Obj.ID;
					return;
				}
			}

		// Enter the drawing mode
		ChatRoomMapEditStarted = true;
		ChatRoomMapMouseMove();
		return;

	}

}

/**
 * Mouse move event is used to draw on screen
 * @returns {void} - Nothing
 */
function ChatRoomMapMouseMove() {
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapVisible) return;
	if (ChatRoomMapEditStarted && (ChatRoomMapEditMode == "Tile") && (ChatRoomMapEditID >= 0)) {
		for (let Pos of ChatRoomMapEditSelection)
			ChatRoomData.MapData.Tiles = ChatRoomData.MapData.Tiles.substring(0, Pos) + String.fromCharCode(ChatRoomMapEditID + ChatRoomMapTileOffset) + ChatRoomData.MapData.Tiles.substring(Pos + 1);
		ChatRoomMapUpdateFlag();
	}
	if (ChatRoomMapEditStarted && (ChatRoomMapEditMode == "Object") && (ChatRoomMapEditID >= 0)) {
		for (let Pos of ChatRoomMapEditSelection)
			ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapEditID + ChatRoomMapTileOffset) + ChatRoomData.MapData.Objects.substring(Pos + 1);
		ChatRoomMapUpdateFlag();
	}
}

/**
 * Mouse up event is used to stop drawing
 * @returns {void} - Nothing
 */
function ChatRoomMapMouseUp() {
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapVisible) return;
	if ((MouseX <= 1000) && (ChatRoomMapFocusedCharacter != null) && (ChatRoomMapEditMode != "Tile") && (ChatRoomMapEditMode != "Object") && !ChatRoomMapEditStarted)
		ChatRoomFocusCharacter(ChatRoomMapFocusedCharacter);
	ChatRoomMapEditStarted = false;
}

/**
 * Mouse wheel event is used to zoom the map
 * @returns {void} - Nothing
 */
function ChatRoomMapMouseWheel(Event) {
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapVisible) return;
	if ((MouseX <= 1000) && (Event.deltaY < 0) && (ChatRoomMapViewRange > ChatRoomMapViewRangeMin)) ChatRoomMapViewRange--;
	if ((MouseX <= 1000) && (Event.deltaY > 0) && (ChatRoomMapViewRange < ChatRoomMapViewRangeMax)) ChatRoomMapViewRange++;
}
