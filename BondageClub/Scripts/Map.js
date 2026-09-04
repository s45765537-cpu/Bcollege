"use strict";

/*
 * Doodad / Element -> Doodad
 * Active Object / Effect / Tile -> Cell
 */

var MapLookupData = {
	get mapData() {
		if (ChatRoomData?.MapData == null) throw new Error("ChatRoomData.MapData is null");
		// @ts-ignore this cannot be null because error is thrown
		return ChatRoomData.MapData;
	},
	set mapData(value) {
		if (ChatRoomData == null) throw new Error("ChatRoomData.MapData is null");
		ChatRoomData.MapData = value;
	},
	get Tile () {
		return this.mapData.Tiles ?? "";},
	set Tile (value) {
		this.mapData.Tiles = value;},
	get Object () {
		return this.mapData.Objects ?? "";},
	set Object (value) {
		this.mapData.Objects = value;},
	get Effect () {
		return this.mapData.Effects ?? "";},
	set Effect (value) {
		this.mapData.Effects = value;},
};

/**
 * Gets coordinates in X and Y and returns the corresponding index number for the tile and object list
 * @param {number} x - X-coordinate to be translated
 * @param {number} y - Y-coordinate to be translated
 * @returns {number} - Index number for the tile and object lists
 */
function MapCoordinatesToIndex(x, y) {
	return (y * ChatRoomMapViewWidth) + x;
}

/**
 * Gets a index number for the tile and object lists and returns the corresponding coordinates in X and Y
 * @param {number} index - Index number for the tile and object lists
 * @returns {ChatRoomMapPos} - Object containing the resulting x and y coordinates.
 */
function MapIndexToCoordinates(index) {
	return { X: index % ChatRoomMapViewWidth, Y: Math.floor(index / ChatRoomMapViewWidth) };
}

/**
 * Gets the effect / object / tile on the map
 * @template {keyof typeof ChatRoomMapViewLookupTables} T
 * @param {T} type - The type of the tile
 * @param {number} x - The X position of the tile
 * @param {number} y - The Y position of the tile
 * @returns {number | null}
 */
function MapGetCellId(type, x, y) {
	let index = MapCoordinatesToIndex(x, y);
	if (MapLookupData[type] == null) return null;
	const id = MapLookupData[type].charCodeAt(index) ?? null;
	return id;
}

/**
 * Gets the effect / object / tile on the map
 * @template {keyof typeof ChatRoomMapViewLookupTables} T
 * @param {T} type - The type of the tile
 * @param {number} x - The X position of the tile
 * @param {number} y - The Y position of the tile
 * @returns {NonNullable<typeof ChatRoomMapViewLookupTables[T][number]> | null}
 */
function MapGetCell(type, x, y) {
	const id = MapGetCellId(type, x, y);
	if (id == null) return null;
	const item = ChatRoomMapViewLookupTables[type]?.[id] ?? null;
	return item;
}

/**
 * Sets the tile of the map
 * @param {number} id - The ID of the tile
 * @param {keyof ChatRoomMapViewLookupTables} type - The type of the tile
 * @param {number} x - The X position of the tile
 * @param {number} y - The Y position of the tile
 * @param {boolean} refresh - Whether to refresh the map
 * @param {boolean} clearUnique - Whether to clear the unique tiles
 * @returns {boolean} - TRUE if the tile was set
 */
function MapSetCell(id, type, x, y, refresh=false, clearUnique=true) {
	const doodad = ChatRoomMapViewLookupTables[type]?.[id];
	if (doodad?.Unique && clearUnique) MapClearUniqueCells(id, type);
	const index = MapCoordinatesToIndex(x, y);
	const data = MapLookupData[type];
	if (data == null) return false;
	MapLookupData[type] = data.slice(0, index) + String.fromCharCode(id) + data.slice(index + 1);
	if (refresh) MapValidateCells();
	return true;
}


/**
 * Clears the unique tiles
 * @param {number} id - The ID of the tile
 * @param {keyof ChatRoomMapViewLookupTables} type - The type of the tile
 * @returns {boolean} - TRUE if the tile was cleared
 */
function MapClearUniqueCells(id, type) {
	if (!ChatRoomMapViewLookupTables[type]?.[id]?.Unique) return false;
	const data = MapLookupData[type];
	if (data == null) return false;

	for (let index = 0; index < data.length; index++) {
		if (data.charCodeAt(index) === id) MapSetCell(ChatRoomMapViewObjectStartID, type, index % ChatRoomMapViewWidth, Math.floor(index / ChatRoomMapViewWidth), false, false);
	}
	if (ChatRoomMapViewUpdateRoomNext == null) ChatRoomMapViewUpdateRoomNext = CommonTime() + 5000;
	return true;
}

/**
 * Checks if the cell can be set
 * @param {number} id - The ID of the doodad
 * @param {keyof ChatRoomMapViewLookupTables} type - The type of the doodad
 * @param {number} x - The X position of the cell
 * @param {number} y - The Y position of the cell
 * @returns {boolean}
 */
function MapCanSetCell(id, type, x, y) {
	if (x > ChatRoomMapViewWidth || y > ChatRoomMapViewHeight || x < 0 || y < 0) return false;
	const doodad = ChatRoomMapViewLookupTables[type]?.[id];
	if (doodad == null) return false;
	if (type == "Object") {
		const object = ChatRoomMapViewLookupTables[type]?.[id];
		if (object?.Style === "Blank") return true;

		const tile = MapGetCell("Tile", x, y);
		if (tile?.Type != "Wall" && object?.CanPlaceOnFloors == false ||
			tile?.Type == "Wall" && !object?.CanPlaceOnWalls) return false;

		const tileUnder = MapGetCell("Tile", x, y+1);
		if (tileUnder?.Type == "Wall" && !object?.CanPlaceInWalls) return false;
	}
	if (type == "Tile") {
		const tile = ChatRoomMapViewLookupTables[type]?.[id];
		if (tile?.Style === "Blank") return true;
	}
	return true;
}

/**
 * Checks if the cell is still valid
 * @param {number} id - The ID of the doodad
 * @param {keyof ChatRoomMapViewLookupTables} type - The type of the doodad
 * @param {number} x - The X position of the cell
 * @param {number} y - The Y position of the cell
 * @returns {boolean}
 */
function MapIsCellValid(id, type, x, y) {
	if (!MapCanSetCell(id, type, x, y)) return false;
	return true;
}

/**
 * Sets the next update flag for the room if it's not already set, the delay is 5 seconds
 * @returns {void} - Nothing
 */
function MapValidateCells() {
	for (let index = 0; index < ChatRoomMapViewWidth * ChatRoomMapViewHeight; index++) {
		const {X, Y} = MapIndexToCoordinates(index);

		const objectId = MapGetCellId("Object", X, Y);
		if (objectId && !MapIsCellValid(objectId, "Object", X, Y)) {
			MapSetCell(ChatRoomMapViewObjectStartID, "Object", X, Y);
		};
	}

	// Sets the flag
	if (ChatRoomMapViewUpdateRoomNext == null) ChatRoomMapViewUpdateRoomNext = CommonTime() + 5000;
}
