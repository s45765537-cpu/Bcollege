"use strict";
var ChatRoomMapVisible = false;
var ChatRoomMapAllow = true;
var ChatRoomMapWidth = 40;
var ChatRoomMapHeight = 40;
var ChatRoomMapViewRange = 4;
var ChatRoomMapViewRangeMin = 1;
var ChatRoomMapViewRangeMax = 7;
var ChatRoomMapObjectStartID = 100;
var ChatRoomMapObjectEntryID = 110;
var ChatRoomMapEditMode = "";
var ChatRoomMapEditSubMode = "";
var ChatRoomMapEditStarted = false;
var ChatRoomMapEditObject = null;
var ChatRoomMapEditSelection = [];
var ChatRoomMapEditRange = 1;
var ChatRoomMapEditBackup = [];
var ChatRoomMapUpdateRoomNext = null;
var ChatRoomMapUpdatePlayerNext = null;
var ChatRoomMapUpdateLastMapDataNext = null;
var ChatRoomMapFocusedCharacter = null;
// The base number of miliseconds required to reach a new tile
var ChatRoomMapBaseMovementSpeed = 200;
var ChatRoomMapMovement = null;
var ChatRoomMapEventLoaded = false;
var ChatRoomMapTypeList = ["Never", "Hybrid", "Always"];

var ChatRoomMapTileList = [

	{ ID: 100, Type: "Floor", Style: "OakWood" },
	{ ID: 110, Type: "Floor", Style: "Stone" },
	{ ID: 120, Type: "Floor", Style: "Ceramic" },
	{ ID: 130, Type: "Floor", Style: "Carpet" },
	{ ID: 140, Type: "Floor", Style: "Padded" },
	{ ID: 200, Type: "Floor", Style: "Dirt" },
	{ ID: 210, Type: "Floor", Style: "Grass" },
	{ ID: 220, Type: "Floor", Style: "Sand" },
	{ ID: 230, Type: "Floor", Style: "Gravel" },
	{ ID: 240, Type: "Floor", Style: "Snow" },

	{ ID: 1000, Type: "Wall", Style: "MixedWood" },
	{ ID: 1001, Type: "Wall", Style: "CedarWood" },
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

	{ ID: 100, Type: "FloorDecoration", Style: "Blank" },
	{ ID: 110, Type: "FloorDecoration", Style: "EntryFlag", Top: -0.1, Unique: true },
	{ ID: 120, Type: "FloorDecoration", Style: "BedTeal", Top: -0.25 },
	{ ID: 130, Type: "FloorDecoration", Style: "PillowPink" },
	{ ID: 140, Type: "FloorDecoration", Style: "TableBrown" },
	{ ID: 150, Type: "FloorDecoration", Style: "ThroneRed", Top: -1, Height: 2 },

	{ ID: 1000, Type: "FloorItem", Style: "Blank" },
	{ ID: 1010, Type: "FloorItem", Style: "Kennel", Top: -1, Height: 2, AssetName: "Kennel", AssetGroup: "ItemDevices" },
	{ ID: 1020, Type: "FloorItem", Style: "X-Cross", Top: -1, Height: 2, AssetName: "X-Cross", AssetGroup: "ItemDevices" },
	{ ID: 1030, Type: "FloorItem", Style: "BondageBench", Top: -1, Height: 2, AssetName: "BondageBench", AssetGroup: "ItemDevices" },
	{ ID: 1040, Type: "FloorItem", Style: "Trolley", Top: -1, Height: 2, AssetName: "Trolley", AssetGroup: "ItemDevices" },
	{ ID: 1050, Type: "FloorItem", Style: "Locker", Top: -1, Height: 2, AssetName: "Locker", AssetGroup: "ItemDevices" },
	{ ID: 1060, Type: "FloorItem", Style: "WoodenBox", Top: -1, Height: 2, AssetName: "WoodenBox", AssetGroup: "ItemDevices" },
	{ ID: 1070, Type: "FloorItem", Style: "Coffin", Top: -1.2, Height: 1.85, AssetName: "Coffin", AssetGroup: "ItemDevices" },

	{ ID: 2000, Type: "FloorObstacle", Style: "Blank" },
	{ ID: 2010, Type: "FloorObstacle", Style: "Statue", Top: -1, Height: 2 },
	{ ID: 2020, Type: "FloorObstacle", Style: "Barrel", Top: -0.5, Height: 1.5 },
	{ ID: 2030, Type: "FloorObstacle", Style: "IronBars", Top: -1, Height: 2 },
	{ ID: 2040, Type: "FloorObstacle", Style: "OakTree", Left: -0.25, Top: -1.5, Width: 1.5, Height: 2.5 },
	{ ID: 2050, Type: "FloorObstacle", Style: "PineTree", Top: -1, Height: 2 },
	{ ID: 2060, Type: "FloorObstacle", Style: "ChristmasTree", Top: -1, Height: 2 },

	{ ID: 3000, Type: "WallDecoration", Style: "Blank" },
	{ ID: 3010, Type: "WallDecoration", Style: "Painting" },
	{ ID: 3020, Type: "WallDecoration", Style: "Mirror" },
	{ ID: 3030, Type: "WallDecoration", Style: "Candelabra" },
	{ ID: 3040, Type: "WallDecoration", Style: "Whip" },

	/*
	{ ID: 3000, Type: "WallPath", Style: "Blank" },
	{ ID: 3010, Type: "WallPath", Style: "WoodDoor", Locked: false },
	{ ID: 3011, Type: "WallPath", Style: "WoodDoor", Locked: true },
	{ ID: 3020, Type: "WallPath", Style: "PaddedDoor", Locked: false },
	{ ID: 3021, Type: "WallPath", Style: "PaddedDoor", Locked: true },
	{ ID: 3030, Type: "WallPath", Style: "HiddenDoor", Locked: false },
	{ ID: 3031, Type: "WallPath", Style: "HiddenDoor", Locked: true },
*/

];

/**
 * Returns TRUE if the map button can be used
 * @returns {boolean} - TRUE if can be used
 */
function ChatRoomMapButton() { return (!ChatRoomMapVisible && (ChatRoomData != null) && (ChatRoomData.MapData != null) && (ChatRoomData.MapData.Type != null) && (ChatRoomData.MapData.Type != "Never")); }

/**
 * Activates the chat room map and the required events
 * @returns {void} - Nothing
 */
function ChatRoomMapActivate() {
	ChatRoomMapVisible = true;
	if (ChatRoomMapEventLoaded) return;
	ChatRoomMapEventLoaded = true;
	if (!CommonIsMobile) document.getElementById("MainCanvas").addEventListener("mousedown", ChatRoomMapMouseDown);
	if (!CommonIsMobile) document.getElementById("MainCanvas").addEventListener("mousedown", ChatRoomMapMouseDown);
	if (!CommonIsMobile) document.getElementById("MainCanvas").addEventListener("mousemove", ChatRoomMapMouseMove);
	if (!CommonIsMobile) document.getElementById("MainCanvas").addEventListener("mouseup", ChatRoomMapMouseUp);
	if (!CommonIsMobile) document.getElementById("MainCanvas").addEventListener("wheel", ChatRoomMapMouseWheel);
	if (!CommonIsMobile) document.getElementById("MainCanvas").addEventListener("keydown", ChatRoomMapKeyDown);
	if (CommonIsMobile) document.getElementById("MainCanvas").addEventListener("touchstart", ChatRoomMapMouseDown);
	if (CommonIsMobile) document.getElementById("MainCanvas").addEventListener("touchmove", ChatRoomMapMouseMove);
	if (CommonIsMobile) document.getElementById("MainCanvas").addEventListener("touchend", ChatRoomMapMouseUp);
}

/**
 * Returns the sight range for the current player, based on the blindness level
 * @returns {number} - The number of visible tiles
 */
function ChatRoomMapGetSightRange() {
	return ChatRoomMapViewRangeMax - Player.GetBlindLevel() * 2;
}

/**
 * Returns the hearing range for the current player, based on the deafness level
 * @returns {number} - The number of tiles
 */
function ChatRoomMapGetHearingRange() {
	return ChatRoomMapViewRangeMax - Player.GetDeafLevel();
}

/**
 * Returns TRUE if the player can see a character at her sight range
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if visible
 */
function ChatRoomMapCharacterIsVisible(C) {
	if ((C == null) || (C.MapData == null) || (C.MapData.X == null) || (C.MapData.Y == null)) return false;
	if ((Player.MapData == null) || (Player.MapData.X == null) || (Player.MapData.Y == null)) return false;
	let SightRange = ChatRoomMapGetSightRange();
	let Distance = Math.max(Math.abs(Player.MapData.X - C.MapData.X), Math.abs(Player.MapData.Y - C.MapData.Y));
	return SightRange >= Distance;
}

/**
 * Returns TRUE if the player can see hear a character at her hearing range
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if hearable
 */
function ChatRoomMapCharacterIsHearable(C) {
	if ((C == null) || (C.MapData == null) || (C.MapData.X == null) || (C.MapData.Y == null)) return false;
	if ((Player.MapData == null) || (Player.MapData.X == null) || (Player.MapData.Y == null)) return false;
	let HearingRange = ChatRoomMapGetHearingRange();
	let Distance = Math.max(Math.abs(Player.MapData.X - C.MapData.X), Math.abs(Player.MapData.Y - C.MapData.Y));
	return HearingRange >= Distance;
}

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
	let ID = ChatRoomData.MapData.Tiles.charCodeAt(X + Y * ChatRoomMapWidth);
	return ((ID >= 1000) && (ID < 2000));
}

/**
 * Returns the object located at a X and Y position on the map, or NULL if nothing
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {object} - The object at the position
 */
function ChatRoomMapGetObjectAtPos(X, Y) {
	if ((ChatRoomData.MapData.Objects == null) || (ChatRoomData.MapData.Objects.length != ChatRoomMapWidth * ChatRoomMapHeight)) return null;
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapWidth) || (Y >= ChatRoomMapHeight)) return null;
	let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(X + Y * ChatRoomMapWidth);
	for (let Obj of ChatRoomMapObjectList)
		if (Obj.ID == ObjectID)
			return CommonCloneDeep(Obj);
	return null;
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
 * Manages collisions, moves the player if she's on a tile that cannot be entered
 * @returns {void} - Nothing
 */
function ChatRoomMapCollision() {

	// Exits right away if no player data or the tile is valid to stand there
	if ((Player.MapData == null) || ((Player.MapData.X == null)) || ((Player.MapData.Y == null))) return;
	if (ChatRoomMapCanEnterTile(Player.MapData.X, Player.MapData.Y) > 0) return;

	// Since there's a collision, we try to find good spots to move the player
	let Tiles = [];
	if (ChatRoomMapCanEnterTile(Player.MapData.X - 1, Player.MapData.Y) > 0) Tiles.push({ X: Player.MapData.X - 1, Y: Player.MapData.Y });
	if (ChatRoomMapCanEnterTile(Player.MapData.X + 1, Player.MapData.Y) > 0) Tiles.push({ X: Player.MapData.X + 1, Y: Player.MapData.Y });
	if (ChatRoomMapCanEnterTile(Player.MapData.X, Player.MapData.Y - 1) > 0) Tiles.push({ X: Player.MapData.X, Y: Player.MapData.Y - 1 });
	if (ChatRoomMapCanEnterTile(Player.MapData.X, Player.MapData.Y + 1) > 0) Tiles.push({ X: Player.MapData.X, Y: Player.MapData.Y + 1 });

	// If we found a tile next to the player
	if (Tiles.length > 0) {
		let Tile = CommonRandomItemFromList(null, Tiles);
		Player.MapData.X = Tile.X;
		Player.MapData.Y = Tile.Y;
		ChatRoomMapUpdatePlayerFlag();
		return;
	}

	// Tries the current tile corners next
	if (ChatRoomMapCanEnterTile(Player.MapData.X - 1, Player.MapData.Y - 1) > 0) Tiles.push({ X: Player.MapData.X - 1, Y: Player.MapData.Y - 1 });
	if (ChatRoomMapCanEnterTile(Player.MapData.X + 1, Player.MapData.Y - 1) > 0) Tiles.push({ X: Player.MapData.X + 1, Y: Player.MapData.Y - 1 });
	if (ChatRoomMapCanEnterTile(Player.MapData.X - 1, Player.MapData.Y + 1) > 0) Tiles.push({ X: Player.MapData.X - 1, Y: Player.MapData.Y + 1 });
	if (ChatRoomMapCanEnterTile(Player.MapData.X + 1, Player.MapData.Y + 1) > 0) Tiles.push({ X: Player.MapData.X + 1, Y: Player.MapData.Y + 1 });

	// If we found a tile in the corner of the player
	if (Tiles.length > 0) {
		let Tile = CommonRandomItemFromList(null, Tiles);
		Player.MapData.X = Tile.X;
		Player.MapData.Y = Tile.Y;
		ChatRoomMapUpdatePlayerFlag();
		return;
	}

	// Tries 2 tiles away next
	if (ChatRoomMapCanEnterTile(Player.MapData.X - 2, Player.MapData.Y) > 0) Tiles.push({ X: Player.MapData.X - 2, Y: Player.MapData.Y });
	if (ChatRoomMapCanEnterTile(Player.MapData.X + 2, Player.MapData.Y) > 0) Tiles.push({ X: Player.MapData.X + 2, Y: Player.MapData.Y });
	if (ChatRoomMapCanEnterTile(Player.MapData.X, Player.MapData.Y - 2) > 0) Tiles.push({ X: Player.MapData.X, Y: Player.MapData.Y - 2 });
	if (ChatRoomMapCanEnterTile(Player.MapData.X, Player.MapData.Y + 2) > 0) Tiles.push({ X: Player.MapData.X, Y: Player.MapData.Y + 2 });

	// If we found a tile next to the player
	if (Tiles.length > 0) {
		let Tile = CommonRandomItemFromList(null, Tiles);
		Player.MapData.X = Tile.X;
		Player.MapData.Y = Tile.Y;
		ChatRoomMapUpdatePlayerFlag();
		return;
	}

}

/**
 * Returns TRUE if there's a character at an X and Y position that's wearing a specific asset name & group
 * @param {number} X - The X position on the screen
 * @param {number} Y - The Y position on the screen
 * @param {string} AssetName - The width size of the drawn map
 * @param {AssetGroupName} AssetGroup - The height size of the drawn map
 * @returns {boolean} - TRUE if a character wearing this item is found
 */
function ChatRoomMapCharAtPosIsWearing(X, Y, AssetName, AssetGroup) {
	if ((AssetName == null) || (AssetGroup == null)) return false;
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapWidth) || (Y >= ChatRoomMapHeight)) return false;
	for (let C of ChatRoomCharacter)
		if ((C.MapData != null) && (C.MapData.X === X) && (C.MapData.Y === Y))
			if (InventoryIsWorn(C, AssetName, AssetGroup))
				return true;
	return false;
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

	// Make sure the map tiles and objects are valid
	if ((ChatRoomData.MapData.Tiles == null) || (ChatRoomData.MapData.Tiles.length != ChatRoomMapWidth * ChatRoomMapHeight)) ChatRoomData.MapData.Tiles = String.fromCharCode(ChatRoomMapObjectStartID).repeat(ChatRoomMapWidth * ChatRoomMapHeight);
	if ((ChatRoomData.MapData.Objects == null) || (ChatRoomData.MapData.Objects.length != ChatRoomMapWidth * ChatRoomMapHeight)) ChatRoomData.MapData.Objects = String.fromCharCode(ChatRoomMapObjectStartID).repeat(ChatRoomMapWidth * ChatRoomMapHeight);

	// Make sure the player position on the grid is valid
	if (Player.MapData == null) Player.MapData = {};
	if ((Player.MapData.X == null) || (Player.MapData.X < 0) || (Player.MapData.X >= ChatRoomMapWidth) || (Player.MapData.Y == null) || (Player.MapData.Y < 0) || (Player.MapData.Y >= ChatRoomMapWidth)) {

		// Checks to see if we can load the previously saved position
		if (Player.ImmersionSettings && Player.ImmersionSettings.ReturnToChatRoom && (Player.LastChatRoom != null) && (Player.LastChatRoom.Name === ChatRoomData.Name) && (Player.LastMapData != null) && (Player.LastMapData.X != null) && (Player.LastMapData.Y != null)) {

			// Restores the saved position
			Player.MapData.X = Player.LastMapData.X;
			Player.MapData.Y = Player.LastMapData.Y;

		} else {

			// Sets position in the middle of the scren by default, or at the entry flag if possible
			Player.MapData.X = ChatRoomMapWidth / 2;
			Player.MapData.Y = ChatRoomMapWidth / 2;
			for (let P = 0; P < ChatRoomData.MapData.Objects.length; P++)
				if (ChatRoomData.MapData.Objects.charCodeAt(P) === ChatRoomMapObjectEntryID) {
					Player.MapData.X = P % ChatRoomMapWidth;
					Player.MapData.Y = Math.floor(P / ChatRoomMapWidth);
					break;
				}

		}

		// Saves the new position
		ChatRoomMapUpdatePlayerFlag();

	}

	// Manages collisions, moves the player if she's on a tile that cannot be entered
	ChatRoomMapCollision();

	// Defines the width and height of the visible tile
	let TileWidth = Width / ((ChatRoomMapViewRange * 2) + 1);
	let TileHeight = Height / ((ChatRoomMapViewRange * 2) + 1);
	let Pos = 0;
	let EditWidth = (ChatRoomMapEditRange - 1) * TileWidth;
	let EditHeight = (ChatRoomMapEditRange - 1) * TileHeight;
	let MaxVisibleRange = ChatRoomMapGetSightRange();
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

				// Draw the tile first
				let TileID = ChatRoomData.MapData.Tiles.charCodeAt(Pos);
				for (let Tile of ChatRoomMapTileList)
					if (Tile.ID == TileID) {
						DrawImageResize("Screens/Online/ChatRoom/MapTile/" + Tile.Type + "/" + Tile.Style + ".png", Left + ScreenX, Top + ScreenY, TileWidth, TileHeight);
						if (Tile.Type == "Wall") ChatRoomMapWallEffect(X, Y, Left + ScreenX, Top + ScreenY, TileWidth, TileHeight);
						else FloorWallEffect = ChatRoomMapFloorWallEffect(X, Y);
						break;
					}

				// Draw the non blank object next
				let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(Pos);
				if (ObjectID > ChatRoomMapObjectStartID)
					for (let Obj of ChatRoomMapObjectList)
						if (Obj.ID == ObjectID) {
							if (Obj.Style === "Blank") break;
							// @ts-ignore
							if (ChatRoomMapCharAtPosIsWearing(X, Y, Obj.AssetName, Obj.AssetGroup)) break;
							DrawImageResize("Screens/Online/ChatRoom/MapObject/" + Obj.Type + "/" + Obj.Style + ".png", Left + ScreenX + ((Obj.Left == null) ? 0 : TileWidth * Obj.Left), Top + ScreenY + ((Obj.Top == null) ? 0 : TileHeight * Obj.Top), TileWidth * ((Obj.Width == null) ? 1 : Obj.Width), TileHeight * ((Obj.Height == null) ? 1 : Obj.Height));
							break;
						}

				// Keeps the tile as selected if the mouse is within selection
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
 * Sets the next update flag for the room if it's not already set, the delay is 5 seconds
 * @returns {void} - Nothing
 */
function ChatRoomMapUpdateFlag() {

	// Clears the wrong objects on the map
	for (let Pos = 0; Pos < ChatRoomMapWidth * ChatRoomMapHeight; Pos++) {

		// If there's an object to check
		let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(Pos);
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
				let TileID = ChatRoomData.MapData.Tiles.charCodeAt(Pos);
				let Tile = null;
				for (let T of ChatRoomMapTileList)
					if (T.ID == TileID) {
						Tile = T;
						break;
					}

				// Invalid tiles and invalid objects for that tile must be cleared
				if (Tile == null) ClearObject = true;
				else if ((Obj.Type == "FloorDecoration") && (Tile.Type != "Floor")) ClearObject = true;
				else if ((Obj.Type == "FloorItem") && (Tile.Type != "Floor")) ClearObject = true;
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
			if (ClearObject) ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapObjectStartID) + ChatRoomData.MapData.Objects.substring(Pos + 1);

		}

	}

	// Sets the flag
	if (ChatRoomMapUpdateRoomNext == null) ChatRoomMapUpdateRoomNext = CommonTime() + 5000;

}

/**
 * Sets the next update flags for the player if it's not already set, the delay is 1 seconds for live data and 10 seconds for last map data
 * @returns {void} - Nothing
 */
function ChatRoomMapUpdatePlayerFlag() {
	if (ChatRoomMapUpdatePlayerNext == null)
		ChatRoomMapUpdatePlayerNext = CommonTime() + 1000;
	if (Player.ImmersionSettings && Player.ImmersionSettings.ReturnToChatRoom && (ChatRoomMapUpdateLastMapDataNext == null))
		ChatRoomMapUpdateLastMapDataNext = CommonTime() + 10000;
}

/**
 * Updates the room data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapUpdateRoomSync() {
	if ((ChatRoomMapUpdateRoomNext == null) || (ChatRoomMapUpdateRoomNext > CommonTime())) return;
	if (!ChatRoomPlayerIsAdmin()) return;
	ChatRoomMapUpdateRoomNext = null;
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: ChatRoomGetSettings(ChatRoomData), Action: "Update" });
}

/**
 * Updates the player map data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapUpdatePlayerSync() {
	if ((ChatRoomMapUpdatePlayerNext == null) || (ChatRoomMapUpdatePlayerNext > CommonTime())) return;
	ChatRoomMapUpdatePlayerNext = null;
	ServerAccountUpdate.QueueData({ MapData: Player.MapData }, true);
}

/**
 * Updates the player last map data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapUpdateLastMapDataSync() {
	if ((ChatRoomMapUpdateLastMapDataNext == null) || (ChatRoomMapUpdateLastMapDataNext > CommonTime())) return;
	ChatRoomMapUpdateLastMapDataNext = null;
	ServerAccountUpdate.QueueData({ LastMapData: Player.MapData }, true);
}

/**
 * Processes the character movement when the timer has expired
 * @returns {void} - Nothing
 */
function ChatRoomMapMovementProcess() {
	if ((ChatRoomMapMovement == null) || (ChatRoomMapMovement.TimeEnd > CommonTime())) return;
	Player.MapData.X = ChatRoomMapMovement.X;
	Player.MapData.Y = ChatRoomMapMovement.Y;
	ChatRoomMapUpdatePlayerFlag();
	ChatRoomMapMovement = null;
}

/**
 * Draws the map, characters and buttons of the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapDraw() {

	// Syncs the room map data with the server if needed
	ChatRoomMapMovementProcess();
	ChatRoomMapUpdateRoomSync();
	ChatRoomMapUpdatePlayerSync();
	ChatRoomMapUpdateLastMapDataSync();

	// Draw the full grid on the left side of the screen
	ChatRoomMapDrawGrid(0, 0, 1000, 1000);

	// Draw the movement buttons
	if (ChatRoomMapMovement == null) {
		DrawButton(860, 860, 60, 60, "", "White", "Icons/Small/North.png");
		DrawButton(790, 930, 60, 60, "", "White", "Icons/Small/West.png");
		DrawButton(860, 930, 60, 60, "", "White", "Icons/Small/South.png");
		DrawButton(930, 930, 60, 60, "", "White", "Icons/Small/East.png");
	} else {
		DrawButton(860, 860, 60, 60, "", (ChatRoomMapMovement.Direction !== "North") ? "White" : "#80FF80", "Icons/Small/North.png");
		DrawButton(930, 860, 60, 60, "", "White", "Icons/Small/Cancel.png");
		DrawButton(790, 930, 60, 60, "", (ChatRoomMapMovement.Direction !== "West") ? "White" : "#80FF80", "Icons/Small/West.png");
		DrawButton(860, 930, 60, 60, "", (ChatRoomMapMovement.Direction !== "South") ? "White" : "#80FF80", "Icons/Small/South.png");
		DrawButton(930, 930, 60, 60, "", (ChatRoomMapMovement.Direction !== "East") ? "White" : "#80FF80", "Icons/Small/East.png");
		let Progress = (CommonTime() - ChatRoomMapMovement.TimeStart) / (ChatRoomMapMovement.TimeEnd - ChatRoomMapMovement.TimeStart) * 100;
		DrawProgressBar(790, 992, 200, 8, Progress);
	}

	// Out of edit mode, we draws the basic buttons
	if (ChatRoomMapEditMode == "") {
		DrawButton(10, 10, 60, 60, "", ((ChatRoomData.MapData != null) && (ChatRoomData.MapData.Type != null) && (ChatRoomData.MapData.Type == "Always")) ? "Pink" : "White", "Icons/Small/ShowCharacter.png");
		DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/Plus.png");
		DrawButton(10, 150, 60, 60, "", "White", "Icons/Small/Minus.png");
		if (ChatRoomPlayerIsAdmin()) {
			DrawButton(10, 220, 60, 60, "", "White", "Icons/Small/EditTile.png");
			DrawButton(10, 290, 60, 60, "", "White", "Icons/Small/EditObject.png");
			DrawButton(10, 360, 60, 60, "", "White", "Icons/Small/Undo.png");
		}
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
				if (Tile.ID == ChatRoomMapEditObject.ID) DrawRect(12, Y + 2, 56, 56, "#00FF00");
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
				// @ts-ignore
				DrawButton(10, Y, 60, 60, "", ((Obj.AssetName == null) || (Obj.AssetGroup == null) || InventoryAvailable(Player, Obj.AssetName, Obj.AssetGroup)) ? "White" : "Pink");
				if (Obj.ID == ChatRoomMapEditObject.ID) DrawRect(12, Y + 2, 56, 56, "#00FF00");
				DrawImageResize("Screens/Online/ChatRoom/MapObject/" + Obj.Type + "/" + Obj.Style + ".png", 15, Y + 5, 50, 50);
			}
	}

}

/**
 * Check if a tile on the map can be entered by a player, and return the number of milliseconds required to reach it
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {number} - The number of milliseconds
 */
function ChatRoomMapCanEnterTile(X, Y) {

	// Out of map bound or walls cannot enter
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapWidth) || (Y >= ChatRoomMapHeight)) return 0;
	if (ChatRoomMapIsWall(X, Y)) return 0;

	// Floor obstacles from 2000 to 3000 cannot be crossed
	let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(X + Y * ChatRoomMapWidth);
	if ((ObjectID >= 2000) && (ObjectID < 3000)) return 0;

	// Enclosed or suspended players cannot change tiles
	if (Player.IsEnclose() || Player.IsSuspended() || Player.IsMounted()) return 0;

	// Cannot enter a tile occupied by another player
	for (let C of ChatRoomCharacter)
		if (!C.IsPlayer() && (C.MapData != null) && (C.MapData.X === X) && (C.MapData.Y === Y))
			return 0;

	// Always full speed in water if wearing mermaid tail
	let TileID = ChatRoomData.MapData.Tiles.charCodeAt(X + Y * ChatRoomMapWidth);
	if ((TileID >= 2000) && (TileID < 3000) && InventoryIsWorn(Player, "MermaidTail", "ItemLegs")) return ChatRoomMapBaseMovementSpeed;

	// Base movement speed first, water tiles are slower
	let Speed = ChatRoomMapBaseMovementSpeed;
	if ((TileID >= 2000) && (TileID < 3000)) Speed = Speed * 2.5;

	// The hogtied/bound/slow/plugged modificator
	if ((Player.Pose != null) && (Player.Pose.indexOf("Hogtied") >= 0)) Speed = Speed * 12;
	else if (!Player.CanWalk()) Speed = Speed * 6;
	else if (Player.GetSlowLevel() > 0) Speed = Speed * Player.GetSlowLevel() * 2;
	else if (!Player.CanKneel()) Speed = Speed * 1.5;
	else if (Player.IsPlugged()) Speed = Speed * 1.2;

	// Returns the final calculated speed
	return Speed;

}

/**
 * Moves the player
 * @param {string} D - The direction being travelled (North, South, East, West)
 * @returns {void} - Nothing
 */
function ChatRoomMapMove(D) {

	// Nothing to do if that current move is in progress
	if ((ChatRoomMapMovement != null) && (ChatRoomMapMovement.Direction === D)) return;

	// Gets the new position
	let X = Player.MapData.X + ((D == "West") ? -1 : 0) + ((D == "East") ? 1 : 0);
	let Y = Player.MapData.Y + ((D == "North") ? -1 : 0) + ((D == "South") ? 1 : 0);
	let Time = ChatRoomMapCanEnterTile(X, Y);

	// If we can enter the tile
	if (Time > 0) {
		ChatRoomMapMovement = {
			X: X,
			Y: Y,
			Direction: D,
			TimeStart: CommonTime(),
			TimeEnd: CommonTime() + Time
		};
	}

}

/**
 * Undoes the changes made to the map, from the latest backup in the stack
 * @returns {void} - Nothing
 */
function ChatRoomMapUndo() {
	if (ChatRoomMapEditBackup.length > 0) {
		let LastMap = ChatRoomMapEditBackup.pop();
		ChatRoomData.MapData = CommonCloneDeep(LastMap);
		ChatRoomMapUpdateFlag();
	}
}

/**
 * Handles keyboard keys in the chat room map screen
 * @param {KeyboardEvent} Event - The event that triggered this
 * @returns {void} - Nothing
 */
function ChatRoomMapKeyDown(Event) {

	// ENTER to go back to the chat box
	if (Event.code == "Enter") ElementFocus("InputChat");

	// Control+Z to undo map changes
	if (((Event.key == "Z") || (Event.key == "z")) && Event.ctrlKey && ChatRoomPlayerIsAdmin()) return ChatRoomMapUndo();

	// + and - to change the view range / zoom
	if ((Event.code == "Equal") && (ChatRoomMapViewRange > ChatRoomMapViewRangeMin)) ChatRoomMapViewRange--;
	if ((Event.code == "Minus") && (ChatRoomMapViewRange < ChatRoomMapViewRangeMax)) ChatRoomMapViewRange++;

	// WASD or arrows to move
	if ((Event.code == "KeyW") || (Event.code == "ArrowUp")) ChatRoomMapMove("North");
	if ((Event.code == "KeyA") || (Event.code == "ArrowLeft")) ChatRoomMapMove("West");
	if ((Event.code == "KeyS") || (Event.code == "ArrowDown")) ChatRoomMapMove("South");
	if ((Event.code == "KeyD") || (Event.code == "ArrowRight")) ChatRoomMapMove("East");

}

/**
 * Mouse down event is used to draw on screen and handle the tiles buttons
 * @returns {void} - Nothing
 */
function ChatRoomMapMouseDown() {

	// The walk buttons
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapVisible) return;
	if (MouseIn(860, 860, 60, 60)) return ChatRoomMapMove("North");
	if ((ChatRoomMapMovement != null) && MouseIn(930, 860, 60, 60)) return ChatRoomMapMovement = null;
	if (MouseIn(790, 930, 60, 60)) return ChatRoomMapMove("West");
	if (MouseIn(860, 930, 60, 60)) return ChatRoomMapMove("South");
	if (MouseIn(930, 930, 60, 60)) return ChatRoomMapMove("East");

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
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 360, 60, 60)) {
			ChatRoomMapUndo();
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
					ChatRoomMapEditObject = CommonCloneDeep(Tile);
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
					ChatRoomMapEditObject = CommonCloneDeep(Tile);
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
					ChatRoomMapEditObject = CommonCloneDeep(Obj);
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
					// @ts-ignore
					if ((Obj.AssetName == null) || (Obj.AssetGroup == null) || InventoryAvailable(Player, Obj.AssetName, Obj.AssetGroup))
						ChatRoomMapEditObject = CommonCloneDeep(Obj);
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

	// Only in edit mode
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapVisible) return;
	let Backup = CommonCloneDeep(ChatRoomData.MapData);

	// In tile edit mode
	if (ChatRoomMapEditStarted && (ChatRoomMapEditMode == "Tile") && (ChatRoomMapEditObject != null)) {
		for (let Pos of ChatRoomMapEditSelection)
			ChatRoomData.MapData.Tiles = ChatRoomData.MapData.Tiles.substring(0, Pos) + String.fromCharCode(ChatRoomMapEditObject.ID) + ChatRoomData.MapData.Tiles.substring(Pos + 1);
		ChatRoomMapUpdateFlag();
	}

	// In object edit mode, make sure unique items are not duplicated
	if (ChatRoomMapEditStarted && (ChatRoomMapEditMode == "Object") && (ChatRoomMapEditObject != null)) {
		if (ChatRoomMapEditObject.Unique === true)
			for (let Pos = 0; Pos < ChatRoomData.MapData.Objects.length; Pos++)
				if (ChatRoomData.MapData.Objects.charCodeAt(Pos) === ChatRoomMapEditObject.ID)
					ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapObjectStartID) + ChatRoomData.MapData.Objects.substring(Pos + 1);
		for (let Pos of ChatRoomMapEditSelection) {
			ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapEditObject.ID) + ChatRoomData.MapData.Objects.substring(Pos + 1);
			if (ChatRoomMapEditObject.Unique === true) break;
		}
		ChatRoomMapUpdateFlag();
	}

	// If the map was modified, we keep the previous version as backup so we can undo the changes
	if (JSON.stringify(Backup) != JSON.stringify(ChatRoomData.MapData)) {
		if (ChatRoomMapEditBackup.length > 100) ChatRoomMapEditBackup = ChatRoomMapEditBackup.slice(-100);
		ChatRoomMapEditBackup.push(Backup);
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

/**
 * Copies the current map in the clipboard.  Called from the chat field command "mapcopy"
 * @returns {void} - Nothing
 */
function ChatRoomMapCopy() {

	// Make sure there's a valid map to copy first
	if ((ChatRoomData == null) || (ChatRoomData.MapData == null) || (ChatRoomData.MapData.Type == null) || (ChatRoomData.MapData.Type == "Never")) {
		ChatRoomSendLocal(TextGet("MapCopyError"));
		return;
	}

	// Stringify and compress the map in a string
	let S = JSON.stringify(ChatRoomData.MapData);
	S = LZString.compressToBase64(S);
	navigator.clipboard.writeText(S);
	ChatRoomSendLocal(TextGet("MapCopyDone"));

}

/**
 * Pastes the current map Param data to load it.  Called from the chat field command "mappaste"
 * @param {string} Param - The parameter that comes with the command
 * @returns {void} - Nothing
 */
function ChatRoomMapPaste(Param) {

	// Cuts the /mappaste characters
	if ((Param == null) || (Param.length < 10)) {
		ChatRoomSendLocal(TextGet("MapPasteError"));
		return;
	}
	Param = Param.trim().substring(9).trim();

	// Only admins can paste/edit the map
	if (!ChatRoomPlayerIsAdmin()) {
		ChatRoomSendLocal(TextGet("MapPasteAdmin"));
		return;
	}

	// Try to decompress the data
	let DecompressedData = null;
	try {
		DecompressedData = LZString.decompressFromBase64(Param);
	} catch(err) {
		DecompressedData = null;
	}

	// If we failed to decompress
	if (DecompressedData == null) {
		ChatRoomSendLocal(TextGet("MapPasteError"));
		return;
	}

	// Tries to get the map data object
	let MapData = null;
	try {
		MapData = JSON.parse(DecompressedData);
	} catch(err) {
		MapData = null;
	}

	// If the map data is invalid
	if ((MapData == null) || (MapData.Tiles == null)) {
		ChatRoomSendLocal(TextGet("MapPasteError"));
		return;
	}

	// Loads the map and flags it to be refreshed
	ChatRoomData.MapData = MapData;
	ChatRoomMapUpdateFlag();
	ChatRoomSendLocal(TextGet("MapPasteDone"));

}
