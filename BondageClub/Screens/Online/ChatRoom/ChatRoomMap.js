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
/** @type {"" |  "Tile" | "Object" | "TileType" | "ObjectType"} */
var ChatRoomMapEditMode = "";
/** @type {"" | ChatRoomMapTileType | ChatRoomMapObjectType} */
var ChatRoomMapEditSubMode = "";
var ChatRoomMapEditStarted = false;
/** @type {null | ChatRoomMapDoodad} */
var ChatRoomMapEditObject = null;
/** @type {number[]} */
var ChatRoomMapEditSelection = [];
var ChatRoomMapEditRange = 1;
/** @type {ServerChatRoomMapData[]} */
var ChatRoomMapEditBackup = [];
/** @type {null | number} */
var ChatRoomMapUpdateRoomNext = null;
/** @type {null | number} */
var ChatRoomMapUpdatePlayerNext = null;
/** @type {null | number} */
var ChatRoomMapUpdateLastMapDataNext = null;
/** @type {null | Character} */
var ChatRoomMapFocusedCharacter = null;
var ChatRoomMapSuperPowersActive = false;
// The base number of miliseconds required to reach a new tile
var ChatRoomMapBaseMovementSpeed = 200;
/** @type {null | ChatRoomMapMovement} */
var ChatRoomMapMovement = null;
var ChatRoomMapEventLoaded = false;
/** @type {ChatRoomMapType[]} */
var ChatRoomMapTypeList = ["Never", "Hybrid", "Always"];
var ChatRoomMapUpdatePlayerTime = 500;

/** @type {Record<string, object>} */
var ChatRoomMapTemporaryStorage = {};

/** @type {boolean[]} */
var ChatRoomMapVisibilityMask = [];
/** @type {boolean[]} */
var ChatRoomMapAudibilityMask = [];

/** @type {ChatRoomMapTile[]} */
const ChatRoomMapTileList = [

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

	{ ID: 1000, Type: "Wall", Style: "MixedWood", BlockVision: true },
	{ ID: 1001, Type: "Wall", Style: "CedarWood", BlockVision: true },
	{ ID: 1010, Type: "Wall", Style: "Log", BlockVision: true },
	{ ID: 1020, Type: "Wall", Style: "Japanese", BlockVision: true },
	{ ID: 1030, Type: "Wall", Style: "Stone", BlockVision: true },
	{ ID: 1040, Type: "Wall", Style: "Brick", BlockVision: true },
	{ ID: 1050, Type: "Wall", Style: "Dungeon", BlockVision: true },
	{ ID: 1060, Type: "Wall", Style: "Square", BlockVision: true, BlockHearing: true },
	{ ID: 1070, Type: "Wall", Style: "Steel", BlockVision: true, BlockHearing: true },
	{ ID: 1080, Type: "Wall", Style: "Padded", BlockVision: true, BlockHearing: true },

	{ ID: 2000, Type: "Water", Style: "Pool", Transparency: 0.5, TransparencyCutoutHeight: 0.45 },
	{ ID: 2010, Type: "Water", Style: "Sea", Transparency: 0.5, TransparencyCutoutHeight: 0.45 },
	{ ID: 2020, Type: "Water", Style: "Ocean", Transparency: 0.5, TransparencyCutoutHeight: 0.3 },

];

/** @type {ChatRoomMapObject[]} */
const ChatRoomMapObjectList = [

	{ ID: 100, Type: "FloorDecoration", Style: "Blank" },
	{ ID: 110, Type: "FloorDecoration", Style: "EntryFlag", Top: -0.125, Exit: true, Unique: true },
	{ ID: 115, Type: "FloorDecoration", Style: "ExitFlag", Top: -0.125, Exit: true },
	{ ID: 120, Type: "FloorDecoration", Style: "BedTeal", Top: -0.25 },
	{ ID: 130, Type: "FloorDecoration", Style: "PillowPink" },
	{ ID: 140, Type: "FloorDecoration", Style: "TableBrown" },
	{ ID: 150, Type: "FloorDecoration", Style: "ThroneRed", Top: -1, Height: 2 },
	{ ID: 160, Type: "FloorDecoration", Style: "KeyBronze", OnEnter: function(){ ChatRoomMapTemporaryStorage.HasKeyBronze = true; } },
	{ ID: 162, Type: "FloorDecoration", Style: "KeySilver", OnEnter: function(){ ChatRoomMapTemporaryStorage.HasKeySilver = true; } },
	{ ID: 164, Type: "FloorDecoration", Style: "KeyGold" , OnEnter: function(){ ChatRoomMapTemporaryStorage.HasKeyGold = true; }},

	{ ID: 200, Type: "FloorDecorationThemed", Style: "Blank" },
	{ ID: 210, Type: "FloorDecorationThemed", Style: "TeacherDesk", Top: -0.25 },
	{ ID: 220, Type: "FloorDecorationThemed", Style: "StudentDesk", Top: -0.1 },
	{ ID: 250, Type: "FloorDecorationThemed", Style: "SinkDishes", Top: -0.35 },
	{ ID: 260, Type: "FloorDecorationThemed", Style: "LaundryMachine", Top: -0.55, Height: 1.25 },
	{ ID: 270, Type: "FloorDecorationThemed", Style: "IroningBoard", Top: -0.35 },

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
	{ ID: 2031, Type: "FloorObstacle", Style: "BarbFence", Top: -1, Height: 2 },
	{ ID: 2040, Type: "FloorObstacle", Style: "OakTree", Left: -0.25, Top: -1.5, Width: 1.5, Height: 2.5 },
	{ ID: 2050, Type: "FloorObstacle", Style: "PineTree", Top: -1, Height: 2 },
	{ ID: 2060, Type: "FloorObstacle", Style: "ChristmasTree", Top: -1, Height: 2 },

	{ ID: 3000, Type: "WallDecoration", Style: "Blank" },
	{ ID: 3010, Type: "WallDecoration", Style: "Painting" },
	{ ID: 3020, Type: "WallDecoration", Style: "Mirror" },
	{ ID: 3030, Type: "WallDecoration", Style: "Candelabra" },
	{ ID: 3040, Type: "WallDecoration", Style: "Whip" },
	{ ID: 3050, Type: "WallDecoration", Style: "Fireplace" },
	{ ID: 3200, Type: "WallDecoration", Style: "SchoolBoard" },

	{ ID: 4000, Type: "WallPath", Style: "Blank", CanEnter: function() { return false; } },
	{ ID: 4010, Type: "WallPath", Style: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return true; } },
	{ ID: 4011, Type: "WallPath", Style: "WoodClosed", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.CanInteract(); } },
	{ ID: 4012, Type: "WallPath", Style: "WoodLocked", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.CanInteract() && ChatRoomPlayerIsAdmin(); } },
	{ ID: 4013, Type: "WallPath", Style: "WoodLockedBronze", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return ChatRoomMapTemporaryStorage.HasKeyBronze == true; } },
	{ ID: 4014, Type: "WallPath", Style: "WoodLockedSilver", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return ChatRoomMapTemporaryStorage.HasKeySilver == true; } },
	{ ID: 4015, Type: "WallPath", Style: "WoodLockedGold", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return ChatRoomMapTemporaryStorage.HasKeyGold == true; } },
	{ ID: 4020, Type: "WallPath", Style: "Metal", OccupiedStyle: "MetalOpen", Top: -1, Height: 2, CanEnter: function() { return true; } },
	{ ID: 4021, Type: "WallPath", Style: "MetalUp", OccupiedStyle: "MetalOpen", Top: -1, Height: 2, CanEnter: function(Direction) { return Direction === "U" || Direction === "";  } },
	{ ID: 4022, Type: "WallPath", Style: "MetalDown", OccupiedStyle: "MetalOpen", Top: -1, Height: 2, CanEnter: function(Direction) { return Direction === "D" || Direction === ""; } },

];

/**
 * Returns TRUE if the map button can be used
 * @returns {boolean} - TRUE if can be used
 */
function ChatRoomMapButton() { return (!ChatRoomMapVisible && ChatRoomData?.MapData?.Type != "Never"); }

/**
 * Returns TRUE if the player is an admin and activated her super powers on the map
 * @returns {boolean} - TRUE if super powers are active
 */
function ChatRoomMapHasSuperPowers() { return ChatRoomMapSuperPowersActive && ChatRoomPlayerIsAdmin(); }

/**
 * Initializes the map to its default blank state
 * @param {ChatRoomMapType} mode
 * @returns {ServerChatRoomMapData}
 */
function ChatRoomMapInitialize(mode) {
	const defaultMap = String.fromCharCode(ChatRoomMapObjectStartID).repeat(ChatRoomMapWidth * ChatRoomMapHeight);
	return {
		Type: mode,
		Tiles: defaultMap,
		Objects: defaultMap,
	};
}

/**
 * Initializes the player map data to its default blank state
 * @returns {ChatRoomMapPos}
 */
function ChatRoomMapInitializeCharacter()
{
	let MapData = null;
	// Checks to see if we can load the previously saved position
	if (Player.ImmersionSettings?.ReturnToChatRoom && Player.LastChatRoom?.Name === ChatRoomData.Name && Player.LastMapData) {
		// Restores the saved position
		MapData = Object.assign({}, Player.LastMapData);
	} else {
		// Sets position in the middle of the scren by default, or at the entry flag if possible
		let entryPosition = ChatRoomMapGetEntryFlagPosition();
		if (entryPosition == null) {
			entryPosition = {
				X: ChatRoomMapWidth / 2,
				Y: ChatRoomMapHeight / 2,
			};
		}
		MapData = entryPosition;
	}
	return MapData;
}

/**
 * Activates the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapActivate() {
	ChatRoomMapVisible = true;
	if (ChatRoomMapEventLoaded) return;
	// Make sure the player position is valid
	if (!Player.MapData || !Player.MapData.X || Player.MapData.X < 0 || Player.MapData.X >= ChatRoomMapWidth || !Player.MapData.Y || Player.MapData.Y < 0 || Player.MapData.Y >= ChatRoomMapWidth) {
		Player.MapData = ChatRoomMapInitializeCharacter();
		// Reset temporary storage
		ChatRoomMapTemporaryStorage = {};
		// Update the change instantly so other players don't see this player on an invalid position
		ChatRoomMapUpdatePlayerFlag(-ChatRoomMapUpdatePlayerTime);

	}
	if (ChatRoomData.MapData?.Tiles.length != ChatRoomMapWidth * ChatRoomMapHeight || ChatRoomData.MapData?.Objects.length != ChatRoomMapWidth * ChatRoomMapHeight) {
		ChatRoomData.MapData = ChatRoomMapInitialize("Never");
	}
	ChatRoomMapCalculatePerceptionMasks();
	ChatRoomMapEventLoaded = true;
}

/**
 * Deactivates the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapDeactivate() {
	ChatRoomMapVisible = false;
}

/**
 * Gets a index number for the tile and obejct lists and returns the corrosponting coordinates in X and Y
 * @param {number} index - Index number for the tile and object lists
 * @returns {{x: number, y: number}} - Object containing the resulting x and y coordinates.
 */
function ChatRoomMapIndexToCoordinates(index)
{
	return { x: index % ChatRoomMapWidth, y: Math.floor(index / ChatRoomMapWidth) };
}

/**
 * Gets coordinates in X and Y and returns the corrosponding index number for the tile and object list
 * @param {number} x - X-coordinate to be translated
 * @param {number} y - Y-coordinate to be translated
 * @returns {number} - Index number for the tile and object lists
 */
function ChatRoomMapCoordinatesToIndex(x, y)
{
	return (y * ChatRoomMapWidth) + x;
}

/**
 * Calculates the visibility mask and audibility mask for the map
 * @returns {void} - Nothing
 */
function ChatRoomMapCalculatePerceptionMasks()
{
	if(ChatRoomMapHasSuperPowers()) {
		// When in edit mode or with active super powers, always show everything
		ChatRoomMapVisibilityMask.fill(true);
		ChatRoomMapAudibilityMask.fill(true);
		return;
	}

	const mapLength = ChatRoomMapWidth * ChatRoomMapHeight;
	const sightRange = ChatRoomMapGetSightRange();
	const hearingRange = ChatRoomMapGetHearingRange();

	for(let i=0; i<mapLength; i++) {
		const pos = ChatRoomMapIndexToCoordinates(i);
		// Calculate the view line between player as f(x) = slopeX * x + yIntercept and f(y) = slopeY * y + xIntercept
		const slopeX = (pos.y - Player.MapData.Y) / (pos.x - Player.MapData.X);
		const slopeY = (pos.x - Player.MapData.X) / (pos.y - Player.MapData.Y);
		const yIntercept = Player.MapData.Y - (slopeX * Player.MapData.X);
		const xIntercept = Player.MapData.X - (slopeY * Player.MapData.Y);

		// Initialize this entry of visibility and audibility map with sight and hearing range
		const distance = Math.max(Math.abs(Player.MapData.X - pos.x), Math.abs(Player.MapData.Y - pos.y));
		ChatRoomMapVisibilityMask[i] = sightRange >= distance;
		ChatRoomMapAudibilityMask[i] = hearingRange >= distance;

		// Calculate obstacles in horizontality if horizontal slope is not too steep
		if(slopeX != Infinity)
		{
			// Calculate the step with to plot of f(x) which is 1 if the tile is left of the player and -1 otherwise
			let stepX = 1;
			if(Player.MapData.X > pos.x) {
				stepX = -stepX;
			}

			// Iterate over every x-position between player and target tile
			for(let x=Player.MapData.X+stepX; x!=pos.x && x!=pos.x+stepX; x+=stepX) {
				// If both, visibility and audibility masks already are set to false for this tile, we don't need to continue
				if(ChatRoomMapVisibilityMask[i] == false && ChatRoomMapAudibilityMask[i] == false) {
					break;
				}

				// Adjust X with a very small number to ensure equal rounding in positive and negative direction
				const xAdjusted = x + (0.00000001 * stepX);
				// Calculate the y-position with the view line formular and get the tiles and objecs on the in-between position
				const y = Math.round(slopeX * xAdjusted + yIntercept);
				let tileData = ChatRoomMapGetTileAtPos(x, y);
				let objectData = ChatRoomMapGetObjectAtPos(x, y);
				// If tile data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(tileData != null) {
					ChatRoomMapVisibilityMask[i] &&= tileData.BlockVision ? false : true;
					ChatRoomMapAudibilityMask[i] &&= tileData.BlockHearing ? false : true;
				}
				// If object data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(objectData != null) {
					ChatRoomMapVisibilityMask[i] &&= objectData.BlockVision ? false : true;
					ChatRoomMapAudibilityMask[i] &&= objectData.BlockHearing ? false : true;
				}

			}
		}
		// Calculate obstacles in verticality if vertical slope is not too steep
		if(slopeY != Infinity)
		{
			// Calculate the step with to plot of f(y) which is 1 if the tile is left of the player and -1 otherwise
			let stepY = 1;
			if(Player.MapData.Y > pos.y) {
				stepY = -stepY;
			}

			// Iterate over every y-position between player and target tile
			for(let y=Player.MapData.Y+stepY; y!=pos.y && y!=pos.y+stepY; y+=stepY) {
				// If both, visibility and audibility masks already are set to false for this tile, we don't need to continue
				if(ChatRoomMapVisibilityMask[i] == false && ChatRoomMapAudibilityMask[i] == false) {
					break;
				}

				// Adjust Y with a very small number to ensure equal rounding in positive and negative direction
				const yAdjusted = y + (0.00000001 * stepY);
				// Calculate the x-position with the view line formular and get the tiles and objecs on the in-between position
				const x = Math.round(slopeY * yAdjusted + xIntercept);
				let tileData = ChatRoomMapGetTileAtPos(x, y);
				let objectData = ChatRoomMapGetObjectAtPos(x, y);
				// If tile data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(tileData != null) {
					ChatRoomMapVisibilityMask[i] &&= tileData.BlockVision ? false : true;
					ChatRoomMapAudibilityMask[i] &&= tileData.BlockHearing ? false : true;
				}
				// If object data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(objectData != null) {
					ChatRoomMapVisibilityMask[i] &&= objectData.BlockVision ? false : true;
					ChatRoomMapAudibilityMask[i] &&= objectData.BlockHearing ? false : true;
				}

			}
		}

	}
}

/**
 * Returns the sight range for the current player, based on the blindness level
 * @returns {number} - The number of visible tiles
 */
function ChatRoomMapGetSightRange() {
	if (ChatRoomMapHasSuperPowers()) return ChatRoomMapViewRangeMax;
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
	if (!C?.MapData) return false;
	if (!Player?.MapData) return false;
	const PlayerTileId = ChatRoomMapCoordinatesToIndex(C.MapData.X, C.MapData.Y);
	return ChatRoomMapVisibilityMask[PlayerTileId];
}

/**
 * Returns TRUE if the player can see hear a character at her hearing range
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if hearable
 */
function ChatRoomMapCharacterIsHearable(C) {
	if (!C?.MapData) return false;
	if (!Player?.MapData) return false;
	const PlayerTileId = ChatRoomMapCoordinatesToIndex(C.MapData.X, C.MapData.Y);
	return ChatRoomMapAudibilityMask[PlayerTileId];
}

/**
 * Returns TRUE if the player is on whisper range to another character (1 tile)
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if on whisper range
 */
function ChatRoomMapCharacterOnWhisperRange(C) {
	if (!C?.MapData) return false;
	if (!Player?.MapData) return false;
	const PlayerTileId = ChatRoomMapCoordinatesToIndex(Player.MapData.X, Player.MapData.Y);
	return ChatRoomMapVisibilityMask[PlayerTileId];
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
 * @returns {ChatRoomMapTile | null} - The object at the position
 */
function ChatRoomMapGetTileAtPos(X, Y) {
	if (ChatRoomData.MapData?.Tiles.length !== ChatRoomMapWidth * ChatRoomMapHeight) return null;
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapWidth) || (Y >= ChatRoomMapHeight)) return null;
	let ObjectID = ChatRoomData.MapData.Tiles.charCodeAt(ChatRoomMapCoordinatesToIndex(X, Y));
	const tile = ChatRoomMapTileList.find(o => o.ID === ObjectID);
	return tile;
}

/**
 * Returns the object located at a X and Y position on the map, or NULL if nothing
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {ChatRoomMapObject | null} - The object at the position
 */
function ChatRoomMapGetObjectAtPos(X, Y) {
	if (ChatRoomData.MapData?.Objects.length !== ChatRoomMapWidth * ChatRoomMapHeight) return null;
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapWidth) || (Y >= ChatRoomMapHeight)) return null;
	let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(ChatRoomMapCoordinatesToIndex(X, Y));
	const Obj = ChatRoomMapObjectList.find(o => o.ID === ObjectID);
	return Obj;
}

/**
 * Returns TRUE if there's a wall path on the X, Y position that the player can enter
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {boolean} - TRUE if we can enter
 */
function ChatRoomMapCanEnterWall(X, Y) {
	if (ChatRoomData.MapData?.Objects.length !== ChatRoomMapWidth * ChatRoomMapHeight) return false;
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapWidth) || (Y >= ChatRoomMapHeight)) return false;
	let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(X + Y * ChatRoomMapWidth);
	for (let O of ChatRoomMapObjectList)
		if (O.ID === ObjectID) {
			if (O.CanEnter == null) return false;
			/** @type {ChatRoomMapDirection} */
			let Direction = "";
			if (Player.MapData.X < X) Direction = "R";
			else if (Player.MapData.X > X) Direction = "L";
			else if (Player.MapData.Y < Y) Direction = "D";
			else if (Player.MapData.Y > Y) Direction = "U";
			return O.CanEnter(Direction);
		}
	return false;
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
	let CW = ChatRoomMapIsWall(X - 1, Y) || !ChatRoomMapVisibilityMask[ChatRoomMapCoordinatesToIndex(X - 1, Y)];
	let CE = ChatRoomMapIsWall(X + 1, Y) || !ChatRoomMapVisibilityMask[ChatRoomMapCoordinatesToIndex(X + 1, Y)];
	let SW = ChatRoomMapIsWall(X - 1, Y + 1) || !ChatRoomMapVisibilityMask[ChatRoomMapCoordinatesToIndex(X - 1, Y + 1)];
	let SC = ChatRoomMapIsWall(X, Y + 1) || !ChatRoomMapVisibilityMask[ChatRoomMapCoordinatesToIndex(X, Y + 1)];
	let SE = ChatRoomMapIsWall(X + 1, Y + 1) || !ChatRoomMapVisibilityMask[ChatRoomMapCoordinatesToIndex(X + 1, Y + 1)];

	// Finds the proper effect and draws it
	let Effect = ChatRoomMapFindWallEffectTile(CW, CE, SW, SC, SE);
	DrawImageResize("Screens/Online/ChatRoom/MapTile/WallEffect/" + Effect.toString() + ".png", Math.floor(ScreenX), Math.floor(ScreenY), Math.ceil(TileWidth), Math.ceil(TileHeight));

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
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapUpdatePlayerFlag(-ChatRoomMapUpdatePlayerTime);
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
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapUpdatePlayerFlag(-ChatRoomMapUpdatePlayerTime);
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
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapUpdatePlayerFlag(-ChatRoomMapUpdatePlayerTime);
		return;
	}

}

/**
 * Find the first {@link ChatRoomCharacter} members at the specified X & Y position
 * @param {number} X - The X position on the screen
 * @param {number} Y - The Y position on the screen
 * @returns {null | Character} A character at the specified X & Y position or, if none can be found, `null`
 */
function ChatRoomMapGetCharacterAtPos(X, Y) {
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapWidth) || (Y >= ChatRoomMapHeight)) return null;
	for (let C of ChatRoomCharacter)
		if ((C.MapData != null) && (C.MapData.X === X) && (C.MapData.Y === Y))
			return C;
	return null;
}

/**
 * Returns a object that contains the entry flag's position with x and y parameters or null if no entry flag is set
 * @returns {ChatRoomMapPos|null}
 */
function ChatRoomMapGetEntryFlagPosition()
{
	if (!ChatRoomData.MapData?.Objects) return null;

	const idx = ChatRoomData.MapData.Objects.indexOf(String.fromCharCode(ChatRoomMapObjectEntryID));
	if (idx < 0) return null;

	return {
		X: idx % ChatRoomMapWidth,
		Y: Math.floor(idx / ChatRoomMapWidth)
	};
}

/**
 * Returns TRUE if the player can leave from the map, called from ChatRoomCanLeave()
 * @returns {boolean} - True if the player can leave
 */
function ChatRoomMapCanLeave() {

	// Out of map mode and if player hasn't checked the immersion option, we allow leaving
	if ((ChatRoomData == null) || (ChatRoomData.MapData == null) || (ChatRoomData.MapData.Type === "Never") || !ChatRoomMapVisible) return true;
	if ((Player.MapData == null) || (Player.MapData.X == null) || (Player.MapData.Y == null)) return true;
	if ((Player.ImmersionSettings == null) || !Player.ImmersionSettings.ChatRoomMapLeaveOnExit) return true;

	// Scan 2 tiles grid around the player, if there's an exit flag in it, we allow leaving
	for (let X = Player.MapData.X - 2; X <= Player.MapData.X + 2; X++)
		for (let Y = Player.MapData.Y - 2; Y <= Player.MapData.Y + 2; Y++) {
			let Obj = ChatRoomMapGetObjectAtPos(X, Y);
			if ((Obj != null) && Obj.Exit) return true;
		}

	// If nothing allows leaving
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
	// Manages collisions, moves the player if she's on a tile that cannot be entered
	ChatRoomMapCollision();

	// Defines the width and height of the visible tile
	let TileWidth = Width / ((ChatRoomMapViewRange * 2) + 1);
	let TileHeight = Height / ((ChatRoomMapViewRange * 2) + 1);
	let EditWidth = (ChatRoomMapEditRange - 1) * TileWidth;
	let EditHeight = (ChatRoomMapEditRange - 1) * TileHeight;
	let MaxVisibleRange = ChatRoomMapGetSightRange();
	if (MaxVisibleRange < 1) MaxVisibleRange = 1;
	let CharacterUnderCursor = null;

	// Clears the tile and character selection
	ChatRoomMapEditSelection = [];
	ChatRoomMapFocusedCharacter = null;

	// For each tiles in the grid
	for (let Pos = 0; Pos < ChatRoomMapWidth * ChatRoomMapHeight; Pos++) {
		if(!ChatRoomMapVisibilityMask[Pos]) { continue; }
		// Find the X & Y position of the grid
		let X = Pos % ChatRoomMapWidth;
		let Y = Math.floor(Pos / ChatRoomMapWidth);

		// Only process if the X & Y are within the visible sight range
		let MaxRange = Math.max(Math.abs(X - Player.MapData.X), Math.abs(Y - Player.MapData.Y));
		if (MaxRange > MaxVisibleRange) continue;

		// Defines the screen X and Y positions
		let ScreenX = (X - Player.MapData.X) * TileWidth + ChatRoomMapViewRange * TileWidth;
		let ScreenY = (Y - Player.MapData.Y) * TileHeight + ChatRoomMapViewRange * TileWidth;

		// If this tile's coordinates are out of the view range, we don't have to bother with it
		if ((ScreenX < 0) || (ScreenX >= Width) || (ScreenY < 0) || (ScreenY >= Height)) continue;

		// Drawing variables
		const TileCanvasX = Left + ScreenX;
		const TileCanvasY = Top + ScreenY;
		let FloorWallEffect = -1;
		let DrawRect = false;
		let TileID = ChatRoomData.MapData.Tiles.charCodeAt(Pos);
		let TileData = null;
		let TileImage = null;

		// Finds the tile to draw and keeps it
		for (let Tile of ChatRoomMapTileList)
			if (Tile.ID == TileID) {
				TileData = Tile;
				break;
			}

		// Draw the tile on the grid
		if (TileData != null) {
			TileImage = DrawGetImage("Screens/Online/ChatRoom/MapTile/" + TileData.Type + "/" + TileData.Style + ".png");
			DrawImageResize(TileImage, Math.floor(TileCanvasX), Math.floor(TileCanvasY), Math.ceil(TileWidth), Math.ceil(TileHeight));
			if (TileData.Type == "Wall") ChatRoomMapWallEffect(X, Y, Left + ScreenX, Top + ScreenY, Math.ceil(TileWidth), Math.ceil(TileHeight));
			else FloorWallEffect = ChatRoomMapFloorWallEffect(X, Y);

		}

		// Draw the non blank object next
		let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(Pos);
		if (ObjectID > ChatRoomMapObjectStartID)
			for (let Obj of ChatRoomMapObjectList)
				if (Obj.ID == ObjectID) {
					if(Obj.IsVisible && !Obj.IsVisible()) break;
					if (Obj.Style === "Blank") break;
					// Hide a wall decoration object if the tile before it is not visible
					if (Obj.Type == "WallDecoration" && !ChatRoomMapVisibilityMask[ChatRoomMapCoordinatesToIndex(X, Y+1)]) break;
					let ImageName = Obj.Style;
					if ((Obj.AssetName != null) || (Obj.OccupiedStyle != null)) {
						let Char = ChatRoomMapGetCharacterAtPos(X, Y);
						if ((Char != null) && (Obj.AssetName != null) && (Obj.AssetGroup != null) && InventoryIsWorn(Char, Obj.AssetName, Obj.AssetGroup)) break;
						if ((Char != null) && (Obj.OccupiedStyle != null)) ImageName = Obj.OccupiedStyle;
					}
					DrawImageResize("Screens/Online/ChatRoom/MapObject/" + Obj.Type + "/" + ImageName + ".png", Math.floor(Left + ScreenX + ((Obj.Left == null) ? 0 : TileWidth * Obj.Left)), Math.floor(Top + ScreenY + ((Obj.Top == null) ? 0 : TileHeight * Obj.Top)), Math.ceil(TileWidth * ((Obj.Width == null) ? 1 : Obj.Width)), Math.ceil(TileHeight * ((Obj.Height == null) ? 1 : Obj.Height)));
					break;
				}

		// Keeps the tile as selected if the mouse is within selection
		if (((ChatRoomMapEditMode == "Tile") || (ChatRoomMapEditMode == "Object")) && (Left + ScreenX - EditWidth <= MouseX) && (Left + ScreenX + TileWidth + EditWidth >= MouseX) && (Top + ScreenY - EditHeight <= MouseY) && (Top + ScreenY + TileHeight + EditHeight >= MouseY)) {
			ChatRoomMapEditSelection.push(Pos);
			DrawRect = true;
		}

		// For each characters in the chat room
		for (let C of ChatRoomCharacter)
			if ((C.MapData != null) && (C.MapData.X === X) && (C.MapData.Y === Y)) {

				// Draws the character on the grid
				DrawCharacter(C, Left + ScreenX + (TileWidth * 0.05), Top + ScreenY - (TileHeight * 0.85), TileHeight * 1.8 / 1000);

				// Keeps the character under the cursor
				if ((MouseX >= Left + ScreenX + (TileWidth * 0.05)) && (MouseX <= Left + ScreenX + (TileWidth * 0.95)) && (MouseY >= Top + ScreenY - (TileHeight * 0.85)) && (MouseY <= Top + ScreenY + (TileHeight * 0.95))) {
					ChatRoomMapFocusedCharacter = C;
					CharacterUnderCursor = { Character: C, StatusBaseX: TileCanvasX + (TileWidth / 2), StatusBaseY: TileCanvasY + TileHeight - 20 };
				}

				// Draw the water effect if character stands in water
				if (TileImage != null && TileData != null && TileData.Type == "Water") {
					const transparency = (TileData.Transparency) ? TileData.Transparency : 0.0;
					const transparencyCutoutHeight = (TileData.TransparencyCutoutHeight) ? TileData.TransparencyCutoutHeight : 1.0;
					DrawImageEx(TileImage, MainCanvas, TileCanvasX, TileCanvasY, {Width: TileWidth, Height: TileHeight, Alpha: transparency, AlphaMasks: [[TileCanvasX, TileCanvasY, TileImage.width, TileImage.height * transparencyCutoutHeight]]});
				}

			}

		// Draw the floor wall effect and rectancle if needed at the end
		if (FloorWallEffect != -1) DrawImageResize("Screens/Online/ChatRoom/MapTile/WallEffect/" + FloorWallEffect.toString() + ".png", Math.floor(ScreenX), Math.floor(ScreenY), Math.ceil(TileWidth), Math.ceil(TileHeight));
		if (DrawRect) DrawEmptyRect(Left + ScreenX, Top + ScreenY, TileWidth, TileHeight, "cyan", 3);

	}

	// If the user hovers the mouse over a tile occupied by a character
	if (CharacterUnderCursor) {
		DrawText(CharacterNickname(CharacterUnderCursor.Character), CharacterUnderCursor.StatusBaseX, CharacterUnderCursor.StatusBaseY, (CommonIsColor(CharacterUnderCursor.Character.LabelColor)) ? CharacterUnderCursor.Character.LabelColor : "White", "Black");
		ChatRoomDrawCharacterStatusIcons(CharacterUnderCursor.Character, CharacterUnderCursor.StatusBaseX - 125, CharacterUnderCursor.StatusBaseY - 40, 0.5);
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
				else if ((Obj.Type == "FloorDecorationThemed") && (Tile.Type != "Floor")) ClearObject = true;
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
 * @param {number} UpdateTimeOffset - A offset for the update time. This can be positive to increase the update time or negative to reduce it.
 * @returns {void} - Nothing
 */
function ChatRoomMapUpdatePlayerFlag(UpdateTimeOffset = 0) {
	if (ChatRoomMapUpdatePlayerNext == null)
		ChatRoomMapUpdatePlayerNext = CommonTime() + ChatRoomMapUpdatePlayerTime + UpdateTimeOffset;
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
	ServerSend("ChatRoomCharacterMapDataUpdate", Player.MapData);
}

/**
 * Updates a single character's expression in the chatroom.
 * @param {ServerMapDataResponse} data - Data object containing the new character expression data.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncMapData(data) {

	// Exits if the packet is invalid
	if (!CommonIsObject(data) || (data.MemberNumber == null) || (typeof data.MemberNumber != "number")) return;
	if (!CommonIsObject(data.MapData) || (data.MapData.X == null) || (typeof data.MapData.X != "number") || (data.MapData.Y == null) || (typeof data.MapData.Y != "number")) return;

	// Assigns the MapData to the chatroom character
	for (let C of ChatRoomCharacter)
		if ((C.MemberNumber == data.MemberNumber) && !C.IsPlayer()) {
			C.MapData = { X: data.MapData.X, Y: data.MapData.Y };
			break;
		}

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
	// Set the update flag and reduce the wait time by the time the player already waited
	ChatRoomMapUpdatePlayerFlag(ChatRoomMapMovement.TimeStart - ChatRoomMapMovement.TimeEnd);
	ChatRoomMapMovement = null;
	// After we moved, calculate the new perception masks
	ChatRoomMapCalculatePerceptionMasks();
	// Get the tile and object we entered
	const newTile = ChatRoomMapGetTileAtPos(Player.MapData.X, Player.MapData.Y);
	const newObject = ChatRoomMapGetObjectAtPos(Player.MapData.X, Player.MapData.Y);
	// If the current tile or object have OnEnter functions, execute them
	if(newTile && newTile.OnEnter) newTile.OnEnter();
	if(newObject && newObject.OnEnter) newObject.OnEnter();
}

/**
 * Checks if the player is leashed and if she should follow the leash holder
 * @returns {void} - Nothing
 */
function ChatRoomMapLeash() {

	// Finds the leash holder character
	if (ChatRoomLeashPlayer == null) return;
	for (let C of ChatRoomCharacter)
		if ((C.MemberNumber == ChatRoomLeashPlayer) && !C.IsPlayer()) {

			// Validates the data first
			if ((Player.MapData == null) || (Player.MapData.X == null) || (Player.MapData.Y == null)) return;
			if ((C.MapData == null) || (C.MapData.X == null) || (C.MapData.Y == null)) return;

			// Leash range is 2 tiles
			let Distance = Math.max(Math.abs(Player.MapData.X - C.MapData.X), Math.abs(Player.MapData.Y - C.MapData.Y));
			if (Distance <= 2) return;

			// The X and Y variance tells us where to pull the character
			let VarX = Player.MapData.X - C.MapData.X;
			let VarY = Player.MapData.Y - C.MapData.Y;
			let TargetX = Player.MapData.X;
			let TargetY = Player.MapData.Y;
			if (VarX > 2) TargetX = C.MapData.X + 2;
			if (VarX < -2) TargetX = C.MapData.X - 2;
			if (VarY > 2) TargetY = C.MapData.Y + 2;
			if (VarY < -2) TargetY = C.MapData.Y - 2;

			// If the new target tile cannot be entered, we try another one nearby
			if (ChatRoomMapCanEnterTile(TargetX, TargetY) <= 0) {

				// Tries to bring the character one extra tile toward the leash holder on the invert axis (X instead of Y or vice versa)
				if ((Math.abs(VarX) > 2) && (Math.abs(VarX) > Math.abs(VarY)) && (VarY > 0)) TargetY--;
				if ((Math.abs(VarX) > 2) && (Math.abs(VarX) > Math.abs(VarY)) && (VarY < 0)) TargetY++;
				if ((Math.abs(VarY) > 2) && (Math.abs(VarX) < Math.abs(VarY)) && (VarX > 0)) TargetX--;
				if ((Math.abs(VarY) > 2) && (Math.abs(VarX) < Math.abs(VarY)) && (VarX < 0)) TargetX++;

				// If we still cannot move there
				if (ChatRoomMapCanEnterTile(TargetX, TargetY) <= 0) {

					// Bring the character 1 tile near the leash holder
					if (VarX > 1) TargetX = C.MapData.X + 1;
					if (VarX < -1) TargetX = C.MapData.X - 1;
					if (VarY > 1) TargetY = C.MapData.Y + 1;
					if (VarY < -1) TargetY = C.MapData.Y - 1;

					// If it still doesn't work, we give up
					if (ChatRoomMapCanEnterTile(TargetX, TargetY) <= 0) return;

				}

			}

			// Sends the movement packet
			Player.MapData.X = TargetX;
			Player.MapData.Y = TargetY;
			ChatRoomMapUpdatePlayerFlag();
			return;

		}

}


/**
 * Draws the map, characters and buttons of the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapDraw() {

	// Syncs the room map data with the server if needed
	ChatRoomMapMovementProcess();
	ChatRoomMapLeash();
	ChatRoomMapUpdateRoomSync();
	ChatRoomMapUpdatePlayerSync();
	ChatRoomMapUpdateLastMapDataSync();

	// Draw the full grid on the left side of the screen
	ChatRoomMapDrawGrid(0, 0, 1000, 1000);

	// Admins can grant themselves super powers (teleport, far hearing, etc.)
	if (ChatRoomPlayerIsAdmin())
		DrawButton(790, 860, 60, 60, "", "White", "Icons/Small/" + ((ChatRoomMapSuperPowersActive) ? "SuperPowersActive" : "SuperPowersInactive") + ".png");

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
				DrawButton(10, Y, 60, 60, "", ((Obj.AssetName == null) || (Obj.AssetGroup == null) || InventoryAvailable(Player, Obj.AssetName, Obj.AssetGroup)) ? "White" : "Pink");
				if (Obj.ID == ChatRoomMapEditObject.ID) DrawRect(12, Y + 2, 56, 56, "#00FF00");
				if (Obj.Style !== "Blank") DrawImageResize("Screens/Online/ChatRoom/MapObject/" + Obj.Type + "/" + Obj.Style + ".png", 15, Y + 5, 50, 50);
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

	// Out of map bound or walls cannot enter, super powers skip everything
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapWidth) || (Y >= ChatRoomMapHeight)) return 0;
	if (ChatRoomMapHasSuperPowers()) return ChatRoomMapBaseMovementSpeed / 10;
	if (ChatRoomMapIsWall(X, Y) && !ChatRoomMapCanEnterWall(X, Y)) return 0;

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
 * @param {"West" | "East" | "North" | "South"} D - The direction being travelled (North, South, East, West)
 * @returns {void} - Nothing
 */
function ChatRoomMapMove(D) {

	// Nothing to do if that current move is in progress
	if ((Player.MapData == null) || (Player.MapData.X == null) || (Player.MapData.Y == null)) return;
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
		ChatRoomMapCalculatePerceptionMasks();
	}
}

/**
 * Handles keyboard keys in the chat room map screen
 * @param {KeyboardEvent} event - The event that triggered this
 * @returns {boolean} - Nothing
 */
function ChatRoomMapKeyDown(event) {

	// Nothing to do if a character dialog is open
	if (CurrentCharacter != null) return false;

	// ENTER to go back to the chat box
	if (event.key === "Enter") {
		ElementFocus("InputChat");
		return true;
	} else if (event.key !== "z" && event.ctrlKey) {
		return true;
	} else if (event.key === "z" && event.ctrlKey) {
		if (ChatRoomPlayerIsAdmin()) ChatRoomMapUndo();
		return true;
	} else if ((event.key === "-") || (event.key === "_")) {
		if (ChatRoomMapViewRange > ChatRoomMapViewRangeMin) ChatRoomMapViewRange--;
		return true;
	} else if ((event.key === "+") || (event.key === "=")) {
		if (ChatRoomMapViewRange < ChatRoomMapViewRangeMax) ChatRoomMapViewRange++;
		return true;
	} else if (CommonKeyMove(event) === "u") {
		ChatRoomMapMove("North");
		return true;
	} else if (CommonKeyMove(event) === "l") {
		ChatRoomMapMove("West");
		return true;
	} else if (CommonKeyMove(event) === "d") {
		ChatRoomMapMove("South");
		return true;
	} else if (CommonKeyMove(event) === "r") {
		ChatRoomMapMove("East");
		return true;
	}
	return false;
}

/**
 * Mouse click event is used to focus a character
 * @returns {void} - Nothing
 */
function ChatRoomMapClick() {
	if ((MouseX <= 1000) && (ChatRoomMapFocusedCharacter != null) && (ChatRoomMapEditMode != "Tile") && (ChatRoomMapEditMode != "Object") && !ChatRoomMapEditStarted)
		ChatRoomFocusCharacter(ChatRoomMapFocusedCharacter);
}

/**
 * Mouse down event is used to draw on screen and handle the tiles buttons
 * @returns {void} - Nothing
 */
function ChatRoomMapMouseDown() {

	// The walk buttons in the bottom right of the map
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapVisible) return;
	if (ChatRoomPlayerIsAdmin() && MouseIn(790, 860, 60, 60)) {
		ChatRoomMapSuperPowersActive = !ChatRoomMapSuperPowersActive;
		ChatRoomMapCalculatePerceptionMasks();
		return;
	}
	if ((ChatRoomMapMovement != null) && MouseIn(930, 860, 60, 60)) return ChatRoomMapMovement = null;
	if (MouseIn(860, 860, 60, 60)) return ChatRoomMapMove("North");
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
		if ("Unique" in ChatRoomMapEditObject && ChatRoomMapEditObject.Unique === true)
			for (let Pos = 0; Pos < ChatRoomData.MapData.Objects.length; Pos++)
				if (ChatRoomData.MapData.Objects.charCodeAt(Pos) === ChatRoomMapEditObject.ID)
					ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapObjectStartID) + ChatRoomData.MapData.Objects.substring(Pos + 1);
		for (let Pos of ChatRoomMapEditSelection) {
			ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapEditObject.ID) + ChatRoomData.MapData.Objects.substring(Pos + 1);
			if ("Unique" in ChatRoomMapEditObject && ChatRoomMapEditObject.Unique === true) break;
		}
		ChatRoomMapUpdateFlag();
	}

	// If the map was modified, we keep the previous version as backup so we can undo the changes
	if (JSON.stringify(Backup) != JSON.stringify(ChatRoomData.MapData)) {
		if (ChatRoomMapEditBackup.length > 100) ChatRoomMapEditBackup = ChatRoomMapEditBackup.slice(-100);
		ChatRoomMapEditBackup.push(Backup);
		// Update perception map after a change
		ChatRoomMapCalculatePerceptionMasks();
	}

}

/**
 * Mouse up event is used to stop drawing
 * @returns {void} - Nothing
 */
function ChatRoomMapMouseUp() {
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapVisible) return;
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
	ChatRoomMapCalculatePerceptionMasks();
	ChatRoomSendLocal(TextGet("MapPasteDone"));

}

/**
 * Make sure the whisper target is still valid on the map, and leave whipser mode if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapWhisperValid() {
	if (!ChatRoomMapVisible || (ChatRoomTargetMemberNumber == null)) return;
	for (let C of ChatRoomCharacter)
		if ((C.MemberNumber === ChatRoomTargetMemberNumber) && ChatRoomMapCharacterOnWhisperRange(C))
			return;
	ChatRoomMessage({ Type: "ServerMessage", Content: "WhisperOutOfRange", Sender: Player.MemberNumber });
	ChatRoomSetTarget(null);
}
