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
	document.body.replaceChildren();
});

function resetEditor() {
	Game.ChatRoomMapViewEditStarted = false;
	Game.ChatRoomMapViewEditMode = "";
	Game.ChatRoomMapViewEditSubMode = "";
	Game.ChatRoomMapViewEditObject = null;
	Game.ChatRoomMapViewEditRange = 1;
}

describe("editor palette", () => {
	it("clears the selected doodad when the edit mode changes", () => {
		Game.ChatRoomMapViewEditMode = "Object";
		Game.ChatRoomMapViewEditSubMode = "EmptySpace";
		const emptySpace = Game.MapDataGetObject(100);
		Game.ChatRoomMapViewEditObject = emptySpace;

		Game.ChatRoomMapViewEditorSetMode("Object", "EmptySpace");
		expect(Game.ChatRoomMapViewEditObject).toBe(emptySpace);
		expect(Game.ChatRoomMapViewEditSubMode).toBe("EmptySpace");

		Game.ChatRoomMapViewEditorSetMode("ObjectType", "");
		expect(Game.ChatRoomMapViewEditMode).toBe("ObjectType");
		expect(Game.ChatRoomMapViewEditSubMode).toBe("");
		expect(Game.ChatRoomMapViewEditObject).toBeNull();

		Game.ChatRoomMapViewEditorSetMode("Object", "Bedroom");
		expect(Game.ChatRoomMapViewEditMode).toBe("Object");
		expect(Game.ChatRoomMapViewEditSubMode).toBe("Bedroom");
		expect(Game.ChatRoomMapViewEditObject).toBeNull();

		Game.ChatRoomMapViewEditorSetMode("Object", "LivingRoom");
		expect(Game.ChatRoomMapViewEditSubMode).toBe("LivingRoom");
		expect(Game.ChatRoomMapViewEditObject).toBeNull();

		Game.ChatRoomMapViewEditMode = "Tile";
		Game.ChatRoomMapViewEditSubMode = "Floor";
		Game.ChatRoomMapViewEditObject = Game.MapDataGetTile(100);
		Game.ChatRoomMapViewEditorSetMode("TileType", "");
		expect(Game.ChatRoomMapViewEditSubMode).toBe("");
		expect(Game.ChatRoomMapViewEditObject).toBeNull();

		resetEditor();
	});
});

describe("recent items", () => {
	it("keeps a single copy of a doodad", () => {
		Game.ServerSend = () => {};
		Game.Player.RecentlyUsedMapElements = [];
		const effect = Game.MapDataGetEffect(11);
		Game.ChatRoomMapViewEditorSetSelection(effect, "Effect", true);
		Game.ChatRoomMapViewEditorSetSelection(effect, "Effect", true);
		expect(Game.Player.RecentlyUsedMapElements).toEqual([effect]);

		const copy = { ...effect, Color: [...effect.Color] };
		Game.ChatRoomMapViewEditorSetSelection(copy, "Effect", true);
		expect(Game.Player.RecentlyUsedMapElements).toEqual([copy]);

		resetEditor();
	});
});

describe("editor selection", () => {
	it("marks the selected doodad after the palette is rebuilt", () => {
		Game.ElementButton = {
			Create: (_id: unknown, _onClick: unknown, _options: unknown, html: { button: { attributes: Record<string, unknown> } }) => {
				const button = document.createElement("button");
				for (const [key, value] of Object.entries(html.button.attributes) as [string, string][]) {
					if (value != null) button.setAttribute(key, value);
				}
				return button;
			},
		};
		const shadow = Game.MapDataGetEffect(11);
		const tint = Game.MapDataGetEffect(14);
		Game.ChatRoomMapViewEditObject = { ...shadow };
		const selected = Game.ChatRoomMapViewCreateMapElementItem(shadow, false, true);
		const other = Game.ChatRoomMapViewCreateMapElementItem(tint, false, true);
		expect(selected.getAttribute("aria-checked")).toBe("true");
		expect(other.getAttribute("aria-checked")).toBe("false");

		resetEditor();
	});
});
