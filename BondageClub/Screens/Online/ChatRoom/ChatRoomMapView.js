"use strict";
const ChatRoomMapViewName = "Map";
var ChatRoomMapViewWidth = 40;
var ChatRoomMapViewHeight = 40;
var ChatRoomMapViewPerceptionRange = 4;
var ChatRoomMapViewPerceptionRangeMin = 1;
var ChatRoomMapViewPerceptionRangeMax = 7;
var ChatRoomMapViewObjectStartID = 100;
var ChatRoomMapViewObjectEntryID = 110;
/** @type {"" |  "Tile" | "Object" | "TileType" | "ObjectType"} */
var ChatRoomMapViewEditMode = "";
/** @type {"" | ChatRoomMapTileType | ChatRoomMapObjectType} */
var ChatRoomMapViewEditSubMode = "";
var ChatRoomMapViewEditStarted = false;
/** @type {null | ChatRoomMapDoodad} */
var ChatRoomMapViewEditObject = null;
/** @type {number[]} */
var ChatRoomMapViewEditSelection = [];
var ChatRoomMapViewEditRange = 1;
/** @type {ServerChatRoomMapData[]} */
var ChatRoomMapViewEditBackup = [];
/** @type {null | number} */
var ChatRoomMapViewUpdateRoomNext = null;
/** @type {null | number} */
var ChatRoomMapViewUpdatePlayerNext = null;
/** @type {null | number} */
var ChatRoomMapViewUpdateLastMapDataNext = null;
/** @type {null | Character} */
var ChatRoomMapViewFocusedCharacter = null;
var ChatRoomMapViewFocusedCharacterX = 0;
var ChatRoomMapViewFocusedCharacterY = 0;
var ChatRoomMapViewSuperPowersActive = false;
// The base number of miliseconds required to reach a new tile
var ChatRoomMapViewBaseMovementSpeed = 200;
/** @type {null | ChatRoomMapMovement} */
var ChatRoomMapViewMovement = null;
/** @type {ChatRoomMapType[]} */
var ChatRoomMapViewTypeList = ["Never", "Hybrid", "Always"];
var ChatRoomMapViewUpdatePlayerTime = 500;
const ChatRoomMapViewPerceptionRaycastOffset = 0.4999;
const ChatRoomMapViewWhisperRange = 1;
const ChatRoomMapViewInteractionRange = 1;
const ChatRoomMapViewRemoteRange = ChatRoomMapViewPerceptionRangeMax;

/** @type {boolean[]} */
var ChatRoomMapViewVisibilityMask = [];
/** @type {boolean[]} */
var ChatRoomMapViewAudibilityMask = [];
var ChatRoomMapViewTileFog = "";
var ChatRoomMapViewObjectFog = "";
var ChatRoomMapViewKeysPressed = {
	u: false,
	d: false,
	l: false,
	r: false,
};
var ChatRoomMapViewStartOfKeyPress = 0;
/** @type {ChatRoomMapTile[]} */
const ChatRoomMapViewTileList = [
	{ ID: 100, Type: "Floor", Style: "OakWood" },
	{ ID: 110, Type: "Floor", Style: "Stone" },
	{ ID: 115, Type: "Floor", Style: "Pavement" },
	{ ID: 120, Type: "Floor", Style: "Ceramic" },
	{ ID: 130, Type: "Floor", Style: "CarpetPink" },
	{ ID: 131, Type: "Floor", Style: "CarpetBlue" },
	{ ID: 132, Type: "Floor", Style: "CarpetRed" },
	{ ID: 140, Type: "Floor", Style: "Padded" },
	{ ID: 150, Type: "Floor", Style: "LatexFloor" },

	{ ID: 200, Type: "FloorExterior", Style: "Dirt" },
	{ ID: 210, Type: "FloorExterior", Style: "Grass" },
	{ ID: 215, Type: "FloorExterior", Style: "LongGrass" },
	{ ID: 220, Type: "FloorExterior", Style: "Sand" },
	{ ID: 230, Type: "FloorExterior", Style: "Gravel" },
	{ ID: 235, Type: "FloorExterior", Style: "Asphalt" },
	{ ID: 240, Type: "FloorExterior", Style: "Snow" },
	{ ID: 250, Type: "FloorExterior", Style: "StoneSquareGray" },

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
	{ ID: 2025, Type: "Water", Style: "OceanCyan", Transparency: 0.5, TransparencyCutoutHeight: 0.3 },
];

/** @type {ChatRoomMapObject[]} */
const ChatRoomMapViewObjectList = [

	{ ID: 100, Type: "FloorDecoration", Style: "Blank" },
	{ ID: 110, Type: "FloorDecoration", Style: "EntryFlag", Top: -0.125, Exit: true, Unique: true },
	{ ID: 115, Type: "FloorDecoration", Style: "ExitFlag", Top: -0.125, Exit: true },
	{ ID: 120, Type: "FloorDecoration", Style: "BedTeal", Top: -0.25 },
	{ ID: 130, Type: "FloorDecoration", Style: "PillowPink" },
	{ ID: 140, Type: "FloorDecoration", Style: "TableBrown" },
	{ ID: 151, Type: "FloorDecoration", Style: "ChairWood", Top: -0.5, Height: 1.5 },
	{ ID: 150, Type: "FloorDecoration", Style: "ThroneRed", Top: -1, Height: 2 },
	{ ID: 160, Type: "FloorDecoration", Style: "KeyBronze", OnEnter: function(){ Player.MapData.PrivateState.HasKeyBronze = true; }, IsVisible: function(){ return !Player.MapData.PrivateState.HasKeyBronze; } },
	{ ID: 162, Type: "FloorDecoration", Style: "KeySilver", OnEnter: function(){ Player.MapData.PrivateState.HasKeySilver = true; }, IsVisible: function(){ return !Player.MapData.PrivateState.HasKeySilver; } },
	{ ID: 164, Type: "FloorDecoration", Style: "KeyGold" , OnEnter: function(){ Player.MapData.PrivateState.HasKeyGold = true; }, IsVisible: function(){ return !Player.MapData.PrivateState.HasKeyGold; } },
	{ ID: 165, Type: "FloorDecoration", Style: "VikingChair" , Top: -0.5, Height: 2 },


	{ ID: 200, Type: "FloorDecorationThemed", Style: "Blank" },
	{ ID: 210, Type: "FloorDecorationThemed", Style: "TeacherDesk", Top: -0.25 },
	{ ID: 220, Type: "FloorDecorationThemed", Style: "StudentDesk", Top: -0.1 },
	{ ID: 250, Type: "FloorDecorationThemed", Style: "SinkDishes", Top: -0.35 },
	{ ID: 260, Type: "FloorDecorationThemed", Style: "LaundryMachine", Top: -0.55, Height: 1.25 },
	{ ID: 270, Type: "FloorDecorationThemed", Style: "IroningBoard", Top: -0.35 },
	{ ID: 300, Type: "FloorDecorationThemed", Style: "ShibariFrame", Top: -1, Height: 2 },
	{ ID: 310, Type: "FloorDecorationThemed", Style: "JapaneseTable", Top: -0.1 },
	{ ID: 320, Type: "FloorDecorationThemed", Style: "BanzaiTree", Top: -0.1 },
	{ ID: 350, Type: "FloorDecorationThemed", Style: "MedicalDesk", Top: -0.15 },

	{ ID: 500, Type: "FloorDecorationParty", Style: "Blank" },
	{ ID: 510, Type: "FloorDecorationParty", Style: "BalloonFiveColor", Top: -0.6, Height: 1.5 },
	{ ID: 511, Type: "FloorDecorationParty", Style: "BalloonTwoHeart", Top: -0.15 },
	{ ID: 520, Type: "FloorDecorationParty", Style: "WeddingCake", Top: -1, Height: 2 },
	{ ID: 521, Type: "FloorDecorationParty", Style: "WeddingArch", Top: -1, Height: 2 },
	{ ID: 530, Type: "FloorDecorationParty", Style: "FlowerVasePink", Top: -0.33 },
	{ ID: 560, Type: "FloorDecorationParty", Style: "BeachUmbrellaStripe", Top: -1.1, Height: 2 },
	{ ID: 570, Type: "FloorDecorationParty", Style: "BeachTowelStripe" },
	{ ID: 580, Type: "FloorDecorationParty", Style: "Speaker", Top: -1.2, Height: 1.85 },

	{ ID: 600, Type: "FloorDecorationCamping", Style: "Blank" },
	{ ID: 610, Type: "FloorDecorationCamping", Style: "LogFire", Top: -0.35 },
	{
		ID: 611,
		Type: "FloorDecorationCamping",
		Style: "LogFireAnim0",
		Height: 1,
		Top: -0.5,
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor(CurrentTime / 150) + X + Y * 3) % 10;
			return "LogFireAnim" + Frame.toString();
		}
	},
	{ ID: 620, Type: "FloorDecorationCamping", Style: "LogSingle", Top: -0.2 },
	{ ID: 630, Type: "FloorDecorationCamping", Style: "TentBlue", Top: -0.3 },
	{ ID: 640, Type: "FloorDecorationCamping", Style: "SleepingBagBlue" },
	{ ID: 650, Type: "FloorDecorationCamping", Style: "ChairRed", Top: -0.35 },
	{ ID: 660, Type: "FloorDecorationCamping", Style: "Hurdle1" },
	{ ID: 670, Type: "FloorDecorationCamping", Style: "Hurdle2" },
	{ ID: 680, Type: "FloorDecorationCamping", Style: "Hurdle3" },

	{ ID: 700, Type: "FloorDecorationExpanding", Style: "Blank" },
	{
		ID: 710,
		Type: "FloorDecorationExpanding",
		Style: "CouchPinkPreview",
		BuildImageName: function(X, Y) {
			let LeftObject = ChatRoomMapViewGetObjectAtPos(X - 1, Y);
			let RightObject = ChatRoomMapViewGetObjectAtPos(X + 1, Y);
			if ((LeftObject != null) && (LeftObject.ID == this.ID) && ((RightObject != null) && (RightObject.ID == this.ID))) return "CouchPinkMiddle";
			if ((LeftObject != null) && (LeftObject.ID == this.ID)) return "CouchPinkRight";
			if ((RightObject != null) && (RightObject.ID == this.ID)) return "CouchPinkLeft";
			return "CouckPinkSmall";
		},
		Top: -0.35
	},
	{
		ID: 720,
		Type: "FloorDecorationExpanding",
		Style: "BedBluePreview",
		BuildImageName: function(X, Y) {
			let LeftObject = ChatRoomMapViewGetObjectAtPos(X - 1, Y);
			let RightObject = ChatRoomMapViewGetObjectAtPos(X + 1, Y);
			if ((LeftObject != null) && (LeftObject.ID == this.ID) && ((RightObject != null) && (RightObject.ID == this.ID))) return "BedBlueMiddle";
			if ((LeftObject != null) && (LeftObject.ID == this.ID)) return "BedBlueRight";
			if ((RightObject != null) && (RightObject.ID == this.ID)) return "BedBlueLeft";
			return "BedBlueSmall";
		},
		Top: -1,
		Height: 2
	},
	{
		ID: 730,
		Type: "FloorDecorationExpanding",
		Style: "BallPitPreview",
		BuildImageName: function(X, Y) {
			let LeftObject = ChatRoomMapViewGetObjectAtPos(X - 1, Y);
			let RightObject = ChatRoomMapViewGetObjectAtPos(X + 1, Y);
			if ((LeftObject != null) && (LeftObject.ID == this.ID) && ((RightObject != null) && (RightObject.ID == this.ID))) return "BallPitMiddle";
			if ((LeftObject != null) && (LeftObject.ID == this.ID)) return "BallPitRight";
			if ((RightObject != null) && (RightObject.ID == this.ID)) return "BallPitLeft";
			return "BallPitSmall";
		},
		Top: -0.25,
		Height: 1.25,
		Transparency: 1,
		TransparencyCutoutHeight: 0.96
	},
	{
		ID: 740,
		Type: "FloorDecorationExpanding",
		Style: "VikingTablePreview",
		BuildImageName: function(X, Y) {
			let LeftObject = ChatRoomMapViewGetObjectAtPos(X - 1, Y);
			let RightObject = ChatRoomMapViewGetObjectAtPos(X + 1, Y);
			if ((LeftObject != null) && (LeftObject.ID == this.ID) && ((RightObject != null) && (RightObject.ID == this.ID))) return "VikingTableMiddle";
			if ((LeftObject != null) && (LeftObject.ID == this.ID)) return "VikingTableRight";
			if ((RightObject != null) && (RightObject.ID == this.ID)) return "VikingTableLeft";
			return "VikingTableSmall";
		},
		Top: -0.25,
		Height: 1.25,
		Transparency: 1,
		TransparencyCutoutHeight: 0.96
	},
	{ ID: 800, Type: "FloorDecorationAnimal", Style: "Blank" },
	{
		ID: 810,
		Type: "FloorDecorationAnimal",
		Style: "CatCaramelHappy",
		Top: -0.2,
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor((CurrentTime + X * 331 + Y * 197) / 2500) + X * 331 + Y * 197) % 100;
			let Anim;
			if ((Frame >= 25) && (Frame <= 27)) Anim = "Stretch";
			else if ((Frame >= 28) && (Frame <= 30)) Anim = "Idle";
			else if ((Frame >= 31) && (Frame <= 33)) Anim = "Happy";
			else if ((Frame >= 34) && (Frame <= 35)) Anim = "Idle";
			else if ((Frame >= 36) && (Frame <= 38)) Anim = "Meow";
			else if ((Frame >= 39) && (Frame <= 40)) Anim = "Happy";
			else if ((Frame >= 41) && (Frame <= 42)) Anim = "Idle";
			else if ((Frame >= 43) && (Frame <= 44)) Anim = "Happy";
			else if ((Frame >= 45) && (Frame <= 49)) Anim = "Play";
			else if ((Frame >= 50) && (Frame <= 51)) Anim = "Meow";
			else if ((Frame >= 52) && (Frame <= 54)) Anim = "Idle";
			else if ((Frame >= 55) && (Frame <= 60)) Anim = "Sleep";
			else if ((Frame >= 61) && (Frame <= 62)) Anim = "Idle";
			else if ((Frame >= 63) && (Frame <= 65)) Anim = "Play";
			else if ((Frame >= 66) && (Frame <= 69)) Anim = "Stretch";
			else if ((Frame >= 70) && (Frame <= 72)) Anim = "Meow";
			else if ((Frame >= 73) && (Frame <= 74)) Anim = "Idle";
			else if ((Frame >= 75) && (Frame <= 75)) Anim = "Happy";
			else if ((Frame >= 76) && (Frame <= 76)) Anim = "Idle";
			else if ((Frame >= 77) && (Frame <= 79)) Anim = "Meow";
			else if ((Frame >= 80) && (Frame <= 81)) Anim = "Stretch";
			else if ((Frame >= 82) && (Frame <= 85)) Anim = "Play";
			else if ((Frame >= 86) && (Frame <= 87)) Anim = "Meow";
			else if ((Frame >= 88) && (Frame <= 90)) Anim = "Happy";
			else if ((Frame >= 91) && (Frame <= 94)) Anim = "Idle";
			else if ((Frame >= 95) && (Frame <= 96)) Anim = "Meow";
			else if ((Frame >= 97) && (Frame <= 100)) Anim = "Stretch";
			else Anim = "Sleep";
			return "CatCaramel" + Anim;
		}
	},
	{
		ID: 820,
		Type: "FloorDecorationAnimal",
		Style: "DogBrownHappy",
		Top: -0.4,
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor((CurrentTime + X * 347 + Y * 179) / 2000) + X * 347 + Y * 179) % 100;
			let Anim;
			if ((Frame >= 20) && (Frame <= 22)) Anim = "Roll";
			else if ((Frame >= 23) && (Frame <= 24)) Anim = "Search";
			else if ((Frame >= 25) && (Frame <= 25)) Anim = "Howl";
			else if ((Frame >= 26) && (Frame <= 27)) Anim = "Crazy";
			else if ((Frame >= 28) && (Frame <= 30)) Anim = "Happy";
			else if ((Frame >= 31) && (Frame <= 31)) Anim = "Play";
			else if ((Frame >= 32) && (Frame <= 34)) Anim = "Scratch";
			else if ((Frame >= 35) && (Frame <= 36)) Anim = "Play";
			else if ((Frame >= 37) && (Frame <= 39)) Anim = "Ball";
			else if ((Frame >= 40) && (Frame <= 41)) Anim = "Crazy";
			else if ((Frame >= 42) && (Frame <= 44)) Anim = "Search";
			else if ((Frame >= 45) && (Frame <= 46)) Anim = "Howl";
			else if ((Frame >= 47) && (Frame <= 49)) Anim = "Roll";
			else if ((Frame >= 50) && (Frame <= 50)) Anim = "Search";
			else if ((Frame >= 51) && (Frame <= 52)) Anim = "Scratch";
			else if ((Frame >= 53) && (Frame <= 64)) Anim = "Happy";
			else if ((Frame >= 55) && (Frame <= 63)) Anim = "Sleep";
			else if ((Frame >= 64) && (Frame <= 67)) Anim = "Search";
			else if ((Frame >= 68) && (Frame <= 70)) Anim = "Ball";
			else if ((Frame >= 71) && (Frame <= 72)) Anim = "Crazy";
			else if ((Frame >= 73) && (Frame <= 73)) Anim = "Howl";
			else if ((Frame >= 74) && (Frame <= 74)) Anim = "Play";
			else if ((Frame >= 75) && (Frame <= 75)) Anim = "Howl";
			else if ((Frame >= 76) && (Frame <= 78)) Anim = "Scratch";
			else if ((Frame >= 79) && (Frame <= 82)) Anim = "Roll";
			else if ((Frame >= 83) && (Frame <= 84)) Anim = "Search";
			else if ((Frame >= 85) && (Frame <= 86)) Anim = "Ball";
			else if ((Frame >= 87) && (Frame <= 89)) Anim = "Crazy";
			else if ((Frame >= 90) && (Frame <= 91)) Anim = "Happy";
			else if ((Frame >= 92) && (Frame <= 92)) Anim = "Howl";
			else if ((Frame >= 93) && (Frame <= 94)) Anim = "Search";
			else if ((Frame >= 95) && (Frame <= 97)) Anim = "Scratch";
			else if ((Frame >= 98) && (Frame <= 100)) Anim = "Roll";
			else Anim = "Sleep";
			return "DogBrown" + Anim;
		}
	},

	{
		ID: 830,
		Type: "FloorDecorationAnimal",
		Style: "RabbitBrownStand",
		Top: -0.3,
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor((CurrentTime + X * 349 + Y * 193) / 1700) + X * 347 + Y * 193) % 200;
			let Anim;
			let F = Frame % 100;
			if ((F >= 2) && (F <= 5)) Anim = "Idle";
			else if ((F >= 6) && (F <= 7)) Anim = "Watch";
			else if ((F >= 8) && (F <= 9)) Anim = "Idle";
			else if ((F >= 10) && (F <= 13)) Anim = "Wait";
			else if ((F >= 14) && (F <= 16)) Anim = "Cute";
			else if ((F >= 17) && (F <= 21)) Anim = "Stand";
			else if ((F >= 22) && (F <= 23)) Anim = "Cute";
			else if ((F >= 24) && (F <= 27)) Anim = "Wait";
			else if ((F >= 28) && (F <= 30)) Anim = "Watch";
			else if ((F >= 31) && (F <= 34)) Anim = "Idle";
			else if ((F >= 35) && (F <= 41)) Anim = "Relax";
			else if ((F >= 42) && (F <= 44)) Anim = "Wait";
			else if ((F >= 45) && (F <= 45)) Anim = "Idle";
			else if ((F >= 46) && (F <= 49)) Anim = "Wait";
			else if ((F >= 50) && (F <= 55)) Anim = "Cute";
			else if ((F >= 56) && (F <= 59)) Anim = "Stand";
			else if ((F >= 60) && (F <= 61)) Anim = "Cute";
			else if ((F >= 62) && (F <= 64)) Anim = "Relax";
			else if ((F >= 65) && (F <= 69)) Anim = "Watch";
			else if ((F >= 70) && (F <= 74)) Anim = "Wait";
			else if ((F >= 75) && (F <= 76)) Anim = "Idle";
			else if ((F >= 77) && (F <= 82)) Anim = "Relax";
			else if ((F >= 83) && (F <= 85)) Anim = "Wait";
			else if ((F >= 86) && (F <= 89)) Anim = "Watch";
			else if ((F >= 90) && (F <= 91)) Anim = "Idle";
			else if ((F >= 92) && (F <= 94)) Anim = "Relax";
			else if ((F >= 95) && (F <= 98)) Anim = "Cute";
			else Anim = "Stand";
			return "RabbitBrown" + Anim + ((Frame >= 100) ? "Right" : "");
		}
	},
	{
		ID: 840,
		Type: "FloorDecorationAnimal",
		Style: "ChickenBrownIdleLeft",
		Left: 0.25,
		Width: 0.5,
		Height: 0.5,
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor((CurrentTime + X * 367 + Y * 173) / 1500) + X * 367 + Y * 173) % 100;
			let Anim;
			if ((Frame >= 14) && (Frame <= 16)) Anim = "IdleLeft";
			else if (Frame == 17) Anim = "EatLeft";
			else if (Frame == 18) Anim = "IdleLeft";
			else if (Frame == 19) Anim = "EatLeft";
			else if (Frame == 20) Anim = "IdleLeft";
			else if (Frame == 21) Anim = "EatLeft";
			else if ((Frame >= 22) && (Frame <= 24)) Anim = "IdleLeft";
			else if (Frame == 25) Anim = "WalkLeft";
			else if (Frame == 26) Anim = "WalkRight";
			else if (Frame == 27) Anim = "WalkLeft";
			else if (Frame == 28) Anim = "WalkRight";
			else if (Frame == 30) Anim = "WalkLeft";
			else if (Frame == 31) Anim = "WalkRight";
			else if ((Frame >= 32) && (Frame <= 34)) Anim = "IdleRight";
			else if ((Frame >= 35) && (Frame <= 39)) Anim = "EatRight";
			else if ((Frame >= 40) && (Frame <= 41)) Anim = "IdleRight";
			else if (Frame == 42) Anim = "WalkLeft";
			else if (Frame == 43) Anim = "WalkRight";
			else if (Frame == 44) Anim = "WalkLeft";
			else if (Frame == 45) Anim = "WalkRight";
			else if ((Frame >= 46) && (Frame <= 50)) Anim = "IdleRight";
			else if ((Frame >= 51) && (Frame <= 67)) Anim = "SleepRight";
			else if ((Frame >= 67) && (Frame <= 69)) Anim = "IdleRight";
			else if ((Frame >= 70) && (Frame <= 71)) Anim = "EatRight";
			else if (Frame == 72) Anim = "IdleRight";
			else if (Frame == 73) Anim = "EatRight";
			else if (Frame == 74) Anim = "IdleRight";
			else if (Frame == 75) Anim = "EatRight";
			else if ((Frame >= 76) && (Frame <= 84)) Anim = "IdleRight";
			else if (Frame == 85) Anim = "WalkRight";
			else if (Frame == 86) Anim = "WalkLeft";
			else if (Frame == 87) Anim = "WalkRight";
			else if (Frame == 88) Anim = "WalkLeft";
			else if (Frame == 89) Anim = "WalkRight";
			else if (Frame == 90) Anim = "WalkLeft";
			else if ((Frame >= 91) && (Frame <= 92)) Anim = "IdleLeft";
			else if ((Frame >= 93) && (Frame <= 97)) Anim = "EatLeft";
			else if ((Frame >= 98) && (Frame <= 100)) Anim = "IdleLeft";
			else Anim = "SleepLeft";
			return "ChickenBrown" + Anim;
		}
	},

	{ ID: 1000, Type: "FloorItem", Style: "Blank" },
	{ ID: 1010, Type: "FloorItem", Style: "Kennel", Top: -1, Height: 2, AssetName: "Kennel", AssetGroup: "ItemDevices" },
	{ ID: 1020, Type: "FloorItem", Style: "X-Cross", Top: -1, Height: 2, AssetName: "X-Cross", AssetGroup: "ItemDevices" },
	{ ID: 1030, Type: "FloorItem", Style: "BondageBench", Top: -1, Height: 2, AssetName: "BondageBench", AssetGroup: "ItemDevices" },
	{ ID: 1040, Type: "FloorItem", Style: "Trolley", Top: -1, Height: 2, AssetName: "Trolley", AssetGroup: "ItemDevices" },
	{ ID: 1050, Type: "FloorItem", Style: "Locker", Top: -1, Height: 2, AssetName: "Locker", AssetGroup: "ItemDevices" },
	{ ID: 1060, Type: "FloorItem", Style: "WoodenBox", Top: -1, Height: 2, AssetName: "WoodenBox", AssetGroup: "ItemDevices" },
	{ ID: 1070, Type: "FloorItem", Style: "Coffin", Top: -1.2, Height: 1.85, AssetName: "Coffin", AssetGroup: "ItemDevices" },
	{ ID: 1080, Type: "FloorItem", Style: "TheDisplayFrame", Top: -1, Height: 2, AssetName: "TheDisplayFrame", AssetGroup: "ItemDevices" },
	{ ID: 1090, Type: "FloorItem", Style: "Pole", Top: -0.85, Height: 1.8, AssetName: "Pole", AssetGroup: "ItemDevices" },

	{ ID: 1100, Type: "FloorNumber", Style: "Blank" },
	{ ID: 1110, Type: "FloorNumber", Style: "Number0" },
	{ ID: 1111, Type: "FloorNumber", Style: "Number1" },
	{ ID: 1112, Type: "FloorNumber", Style: "Number2" },
	{ ID: 1113, Type: "FloorNumber", Style: "Number3" },
	{ ID: 1114, Type: "FloorNumber", Style: "Number4" },
	{ ID: 1115, Type: "FloorNumber", Style: "Number5" },
	{ ID: 1116, Type: "FloorNumber", Style: "Number6" },
	{ ID: 1117, Type: "FloorNumber", Style: "Number7" },
	{ ID: 1118, Type: "FloorNumber", Style: "Number8" },
	{ ID: 1119, Type: "FloorNumber", Style: "Number9" },

	{ ID: 1200, Type: "FloorLetter", Style: "Blank" },
	{ ID: 1201, Type: "FloorLetter", Style: "LetterA" },
	{ ID: 1202, Type: "FloorLetter", Style: "LetterB" },
	{ ID: 1203, Type: "FloorLetter", Style: "LetterC" },
	{ ID: 1204, Type: "FloorLetter", Style: "LetterD" },
	{ ID: 1205, Type: "FloorLetter", Style: "LetterE" },
	{ ID: 1206, Type: "FloorLetter", Style: "LetterF" },
	{ ID: 1207, Type: "FloorLetter", Style: "LetterG" },
	{ ID: 1208, Type: "FloorLetter", Style: "LetterH" },
	{ ID: 1209, Type: "FloorLetter", Style: "LetterI" },
	{ ID: 1210, Type: "FloorLetter", Style: "LetterJ" },
	{ ID: 1211, Type: "FloorLetter", Style: "LetterK" },
	{ ID: 1212, Type: "FloorLetter", Style: "LetterL" },
	{ ID: 1213, Type: "FloorLetter", Style: "LetterM" },
	{ ID: 1214, Type: "FloorLetter", Style: "LetterN" },
	{ ID: 1215, Type: "FloorLetter", Style: "LetterO" },
	{ ID: 1216, Type: "FloorLetter", Style: "LetterP" },
	{ ID: 1217, Type: "FloorLetter", Style: "LetterQ" },
	{ ID: 1218, Type: "FloorLetter", Style: "LetterR" },
	{ ID: 1219, Type: "FloorLetter", Style: "LetterS" },
	{ ID: 1220, Type: "FloorLetter", Style: "LetterT" },
	{ ID: 1221, Type: "FloorLetter", Style: "LetterU" },
	{ ID: 1222, Type: "FloorLetter", Style: "LetterV" },
	{ ID: 1223, Type: "FloorLetter", Style: "LetterW" },
	{ ID: 1224, Type: "FloorLetter", Style: "LetterX" },
	{ ID: 1225, Type: "FloorLetter", Style: "LetterY" },
	{ ID: 1226, Type: "FloorLetter", Style: "LetterZ" },

	{ ID: 1300, Type: "FloorIcon", Style: "Blank" },
	{ ID: 1301, Type: "FloorIcon", Style: "IconCircle" },
	{ ID: 1302, Type: "FloorIcon", Style: "IconSquare" },
	{ ID: 1303, Type: "FloorIcon", Style: "IconTriangle" },
	{ ID: 1304, Type: "FloorIcon", Style: "IconCross" },
	{ ID: 1305, Type: "FloorIcon", Style: "IconDiamond" },
	{ ID: 1306, Type: "FloorIcon", Style: "IconArrowUp" },
	{ ID: 1307, Type: "FloorIcon", Style: "IconArrowDown" },
	{ ID: 1308, Type: "FloorIcon", Style: "IconArrowLeft" },
	{ ID: 1309, Type: "FloorIcon", Style: "IconArrowRight" },

	{ ID: 2000, Type: "FloorObstacle", Style: "Blank" },
	{ ID: 2005, Type: "FloorObstacle", Style: "Rocks", Top: -0.125, Height: 1.125 },
	{ ID: 2010, Type: "FloorObstacle", Style: "Statue", Top: -1, Height: 2 },
	{ ID: 2020, Type: "FloorObstacle", Style: "Barrel", Top: -0.5, Height: 1.5 },
	{ ID: 2030, Type: "FloorObstacle", Style: "IronBars", Top: -1, Height: 2 },
	{ ID: 2031, Type: "FloorObstacle", Style: "BarbFence", Top: -1, Height: 2 },
	{ ID: 2040, Type: "FloorObstacle", Style: "OakTree", Left: -0.25, Top: -1.5, Width: 1.5, Height: 2.5 },
	{ ID: 2045, Type: "FloorObstacle", Style: "OakTree_Fall", Left: -0.25, Top: -1.5, Width: 1.5, Height: 2.5 },
	{ ID: 2050, Type: "FloorObstacle", Style: "PineTree", Top: -1, Height: 2 },
	{ ID: 2055, Type: "FloorObstacle", Style: "PalmTree", Left: -0.30, Top: -1.5, Width: 1.65, Height: 2.5 },
	{ ID: 2060, Type: "FloorObstacle", Style: "ChristmasTree", Top: -1, Height: 2 },
	{ ID: 2070, Type: "FloorObstacle", Style: "Window", Top: -0.5, Height: 1.5 },

	{ ID: 3000, Type: "WallDecoration", Style: "Blank" },
	{ ID: 3010, Type: "WallDecoration", Style: "Painting" },
	{ ID: 3020, Type: "WallDecoration", Style: "Mirror" },
	{
		ID: 3030,
		Type: "WallDecoration",
		Style: "Candelabra0",
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor((CurrentTime + X * 349 + Y * 193) / 150) + X * 347 + Y * 193) % 17;
			if (Frame > 8) Frame = 16 - Frame;
			return "Candelabra" + Frame.toString();
		}
	},
	{ ID: 3040, Type: "WallDecoration", Style: "Whip" },
	{ ID: 3050, Type: "WallDecoration", Style: "Fireplace" },
	{ ID: 3100, Type: "WallDecoration", Style: "SilverShield" },
	{ ID: 3110, Type: "WallDecoration", Style: "CrossedSabers" },
	{ ID: 3200, Type: "WallDecoration", Style: "SchoolBoard" },
	{ ID: 3250, Type: "WallDecoration", Style: "FirstAidKit" },
	{ ID: 3260, Type: "WallDecoration", Style: "EyeTest" },
	{ ID: 3270, Type: "WallDecoration", Style: "Bookshelf" },

	{ ID: 4000, Type: "WallPath", Style: "Blank", CanEnter: function() { return false; } },
	{ ID: 4010, Type: "WallPath", Style: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return true; } },
	{ ID: 4011, Type: "WallPath", Style: "WoodClosed", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.CanInteract(); } },
	{ ID: 4012, Type: "WallPath", Style: "WoodLocked", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.CanInteract() && ChatRoomPlayerIsAdmin(); } },
	{ ID: 4013, Type: "WallPath", Style: "WoodLockedBronze", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.MapData.PrivateState.HasKeyBronze == true; } },
	{ ID: 4014, Type: "WallPath", Style: "WoodLockedSilver", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.MapData.PrivateState.HasKeySilver == true; } },
	{ ID: 4015, Type: "WallPath", Style: "WoodLockedGold", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.MapData.PrivateState.HasKeyGold == true; } },
	{ ID: 4020, Type: "WallPath", Style: "Metal", OccupiedStyle: "MetalOpen", Top: -1, Height: 2, CanEnter: function() { return true; } },
	{ ID: 4021, Type: "WallPath", Style: "MetalUp", OccupiedStyle: "MetalOpen", Top: -1, Height: 2, CanEnter: function(Direction) { return Direction === "U" || Direction === "";  } },
	{ ID: 4022, Type: "WallPath", Style: "MetalDown", OccupiedStyle: "MetalOpen", Top: -1, Height: 2, CanEnter: function(Direction) { return Direction === "D" || Direction === ""; } },

];
/**
 * Returns TRUE if the player is an admin and activated her super powers on the map
 * @returns {boolean} - TRUE if super powers are active
 */
function ChatRoomMapViewHasSuperPowers() { return ChatRoomMapViewSuperPowersActive && ChatRoomPlayerIsAdmin(); }

/**
 * When the screen loses focus, we clear the keys pressed because we don't want movement to get stuck
 */
function ChatRoomMapViewBlur() {
	ChatRoomMapViewKeysPressed = {d: false, l: false, r: false, u: false};
}

/**
 * Initializes the map to its default blank state
 * @param {ChatRoomMapType} mode
 * @returns {ServerChatRoomMapData}
 */
function ChatRoomMapViewInitialize(mode) {
	const defaultMap = String.fromCharCode(ChatRoomMapViewObjectStartID).repeat(ChatRoomMapViewWidth * ChatRoomMapViewHeight);
	return {
		Type: mode,
		Tiles: defaultMap,
		Objects: defaultMap,
	};
}

/**
 * Initializes the player map data to its default blank state
 * @param {Character} C - The character to be initialized
 * @returns {ChatRoomMapData}
 */
function ChatRoomMapViewInitializeCharacter(C) {

	let MapData = C.MapData ? C.MapData : null;
	// Checks to see if we can load the previously saved position
	if (C.IsPlayer() && Player.ImmersionSettings?.ReturnToChatRoom && Player.LastChatRoom?.Name === ChatRoomData.Name && Player.LastMapData) {
		// Restores the saved position
		MapData = Player.LastMapData;
	}
	if (!MapData || !MapData.Pos || !MapData.PrivateState){
		// Sets position in the middle of the scren by default, or at the entry flag if possible
		let entryPosition = ChatRoomMapViewGetEntryFlagPosition();
		if (entryPosition == null) {
			entryPosition = {
				X: ChatRoomMapViewWidth / 2,
				Y: ChatRoomMapViewHeight / 2,
			};
		}

		MapData = { Pos: entryPosition, PrivateState: {} };
	}
	return MapData;
}

/**
 * Validate the passed chat room map positions.
 * @param {unknown} position
 * @returns {ChatRoomMapPos}
 */
function ChatRoomMapViewValidatePosition(position) {
	const ret = CommonIsObject(position) ? position : {};
	return {
		X: CommonIsInteger(ret.X, 0, ChatRoomMapViewWidth) ? ret.X : ChatRoomMapViewWidth / 2,
		Y: CommonIsInteger(ret.Y, 0, ChatRoomMapViewHeight) ? ret.Y : ChatRoomMapViewHeight / 2,
	};
}

/**
 * Checks if the coordinates are out of bounds relative to the map
 * @param {ChatRoomMapPos} position
 */
function ChatRoomMapViewIsOutOfBounds(position) {
	return position.X > ChatRoomMapViewWidth || 0 > position.X || position.Y > ChatRoomMapViewHeight || 0 > position.Y;
}

/**
 * Performs cleanup when leaving the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewLeave() {
	ChatRoomActivateView(ChatRoomCharacterViewName);
	Player.MapData = null;
}

/**
 * Activates the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewActivate() {
	document.addEventListener("blur", ChatRoomMapViewBlur);
	// Make sure the player position is valid
	if (!Player.MapData || !Player.MapData.Pos|| Player.MapData.Pos.X == null || Player.MapData.Pos.X < 0 || Player.MapData.Pos.X >= ChatRoomMapViewWidth || Player.MapData.Pos.Y == null || Player.MapData.Pos.Y < 0 || Player.MapData.Pos.Y >= ChatRoomMapViewWidth) {
		Player.LastMapData = Player.MapData = ChatRoomMapViewInitializeCharacter(Player);
		// Update the change instantly so other players don't see this player on an invalid position
		ChatRoomMapViewUpdatePlayerFlag(-ChatRoomMapViewUpdatePlayerTime);

	}
	if (ChatRoomData.MapData?.Tiles?.length != ChatRoomMapViewWidth * ChatRoomMapViewHeight || ChatRoomData.MapData?.Objects?.length != ChatRoomMapViewWidth * ChatRoomMapViewHeight) {
		ChatRoomData.MapData = ChatRoomMapViewInitialize(ChatRoomData?.MapData?.Type ?? "Never");
	}
	ChatRoomMapViewCalculatePerceptionMasks();
}

/**
 * Deactivates the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDeactivate() {
	document.removeEventListener("blur", ChatRoomMapViewBlur);
}

/**
 * Indicates if the chat room map view is active or not
 * @returns {boolean} - TRUE if the chat room character view is active, false if not
 */
function ChatRoomMapViewIsActive() {
	return ChatRoomIsViewActive(ChatRoomMapViewName);
}

/** @type {ScreenRunHandler} */
function ChatRoomMapViewRun(time) {

	// Syncs the room map data with the server if needed
	ChatRoomMapViewMovementProcess();
	ChatRoomMapViewLeash();
	ChatRoomMapViewUpdateRoomSync();
	ChatRoomMapViewUpdatePlayerSync();
	ChatRoomMapViewUpdateLastMapDataSync();
	if (ChatRoomMapViewKeysPressed.u) {
		ChatRoomMapViewMove("North");
	} else if (ChatRoomMapViewKeysPressed.d) {
		ChatRoomMapViewMove("South");
	} else if (ChatRoomMapViewKeysPressed.l) {
		ChatRoomMapViewMove("West");
	} else if (ChatRoomMapViewKeysPressed.r) {
		ChatRoomMapViewMove("East");
	}
}

/**
 * Returns TRUE if the player can leave from the map
 * @returns {boolean} - True if the player can leave
 */
function ChatRoomMapViewCanLeave() {

	// Out of map mode and if player hasn't checked the immersion option, we allow leaving
	if ((ChatRoomData == null) || (ChatRoomData.MapData == null) || (ChatRoomData.MapData.Type === "Never") || !ChatRoomMapViewIsActive()) return true;
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return true;
	if ((Player.ImmersionSettings == null) || !Player.ImmersionSettings.ChatRoomMapLeaveOnExit) return true;

	// Scan 2 tiles grid around the player, if there's an exit flag in it, we allow leaving
	for (let X = Player.MapData.Pos.X - 2; X <= Player.MapData.Pos.X + 2; X++)
		for (let Y = Player.MapData.Pos.Y - 2; Y <= Player.MapData.Pos.Y + 2; Y++) {
			let Obj = ChatRoomMapViewGetObjectAtPos(X, Y);
			if ((Obj != null) && Obj.Exit) return true;
		}

	// If there's no exit at all, we always allow leaving
	let ExitCount = 0;
	for (let Obj of ChatRoomMapViewObjectList)
		if ((Obj.Exit === true) && (ChatRoomData.MapData.Objects.indexOf(String.fromCharCode(Obj.ID)) >= 0))
			ExitCount++;
	if (ExitCount == 0) return true;

	// If nothing allows leaving
	return false;

}

/**
 * Take a screenshot of the current section of the map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewScreenshot() {
	ChatRoomPhoto(0, 0, 1000, 1000, ChatRoomCharacter);
}

/**
 * Returns TRUE if the player can enter in whisper mode on the current view with the currently focused character
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE is whipser can be started
 */
function ChatRoomMapViewCanStartWhisper(C) {
	return ChatRoomMapViewCharacterOnWhisperRange(C);
}

/**
 * Handles the reception of the room properties from the server.
 * @param {ServerChatRoomSyncMessage} data - Room object containing the updated chatroom properties.
 * @returns {void} - Nothing.
 */
function ChatRoomMapViewSyncRoomProperties(data) {
	// If the chat room map is visible, we need to update the perception map
	ChatRoomMapViewCalculatePerceptionMasks();
}

/**
 * Gets a index number for the tile and obejct lists and returns the corrosponting coordinates in X and Y
 * @param {number} index - Index number for the tile and object lists
 * @returns {{x: number, y: number}} - Object containing the resulting x and y coordinates.
 */
function ChatRoomMapViewIndexToCoordinates(index) {
	return { x: index % ChatRoomMapViewWidth, y: Math.floor(index / ChatRoomMapViewWidth) };
}

/**
 * Gets coordinates in X and Y and returns the corrosponding index number for the tile and object list
 * @param {number} x - X-coordinate to be translated
 * @param {number} y - Y-coordinate to be translated
 * @returns {number} - Index number for the tile and object lists
 */
function ChatRoomMapViewCoordinatesToIndex(x, y) {
	return (y * ChatRoomMapViewWidth) + x;
}

/**
 * Calculates the visibility mask and audibility mask for the map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewCalculatePerceptionMasks() {

	// The player has never opened the map, ignore
	if (!Player.MapData) return;

	// When in edit mode or with active super powers, always show everything
	if (ChatRoomMapViewHasSuperPowers()) {
		ChatRoomMapViewVisibilityMask.fill(true);
		ChatRoomMapViewAudibilityMask.fill(true);
		return;
	}

	const mapLength = ChatRoomMapViewWidth * ChatRoomMapViewHeight;
	const sightRange = ChatRoomMapViewGetSightRange();
	const hearingRange = ChatRoomMapViewGetHearingRange();

	for(let i=0; i<mapLength; i++) {
		const posTile = ChatRoomMapViewIndexToCoordinates(i);
		// Calculate the view line between player as f(x) = slopeX * x + yIntercept and f(y) = slopeY * y + xIntercept
		let dirX = 0;
		if(Player.MapData.Pos.X < posTile.x) { dirX = 1; }
		else if(Player.MapData.Pos.X > posTile.x) { dirX = -1; }
		let dirY = 0;
		if(Player.MapData.Pos.Y < posTile.y) { dirY = 1; }
		else if(Player.MapData.Pos.Y > posTile.y) { dirY = -1; }

		const posTileCorner = { x: posTile.x + (dirX * ChatRoomMapViewPerceptionRaycastOffset), y: posTile.y - (dirY * ChatRoomMapViewPerceptionRaycastOffset) };
		const slopeX = (posTileCorner.y - Player.MapData.Pos.Y) / (posTileCorner.x - Player.MapData.Pos.X);
		const slopeY = (posTileCorner.x - Player.MapData.Pos.X) / (posTileCorner.y - Player.MapData.Pos.Y);
		const yIntercept = Player.MapData.Pos.Y - (slopeX * Player.MapData.Pos.X);
		const xIntercept = Player.MapData.Pos.X - (slopeY * Player.MapData.Pos.Y);

		// Initialize this entry of visibility and audibility map with sight and hearing range
		const distance = Math.max(Math.abs(Player.MapData.Pos.X - posTile.x), Math.abs(Player.MapData.Pos.Y - posTile.y));
		ChatRoomMapViewVisibilityMask[i] = sightRange >= distance;
		ChatRoomMapViewAudibilityMask[i] = hearingRange >= distance;

		// Calculate obstacles in horizontality if horizontal slope is not too steep
		if(slopeX != Infinity && dirX != 0)
		{
			// Iterate over every x-position between player and target tile
			for(let x=Player.MapData.Pos.X+dirX; x!=posTile.x && x!=posTile.x+dirX; x+=dirX) {
				// If both, visibility and audibility masks already are set to false for this tile, we don't need to continue
				if(ChatRoomMapViewVisibilityMask[i] == false && ChatRoomMapViewAudibilityMask[i] == false) {
					break;
				}

				// Calculate the y-position with the view line formular and get the tiles and objecs on the in-between position
				const y = Math.round(slopeX * x + yIntercept);
				let tileData = ChatRoomMapViewGetTileAtPos(x, y);
				let objectData = ChatRoomMapViewGetObjectAtPos(x, y);
				// If tile data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(tileData != null) {
					ChatRoomMapViewVisibilityMask[i] &&= tileData.BlockVision ? false : true;
					ChatRoomMapViewAudibilityMask[i] &&= tileData.BlockHearing ? false : true;
				}
				// If object data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(objectData != null) {
					ChatRoomMapViewVisibilityMask[i] &&= objectData.BlockVision ? false : true;
					ChatRoomMapViewAudibilityMask[i] &&= objectData.BlockHearing ? false : true;
				}

			}
		}
		// Calculate obstacles in verticality if vertical slope is not too steep
		if(slopeY != Infinity && dirY != 0)
		{
			// Iterate over every y-position between player and target tile
			for(let y=Player.MapData.Pos.Y+dirY; y!=posTile.y && y!=posTile.y+dirY; y+=dirY) {
				// If both, visibility and audibility masks already are set to false for this tile, we don't need to continue
				if(ChatRoomMapViewVisibilityMask[i] == false && ChatRoomMapViewAudibilityMask[i] == false) {
					break;
				}

				// Calculate the x-position with the view line formular and get the tiles and objecs on the in-between position
				const x = Math.round(slopeY * y + xIntercept);
				let tileData = ChatRoomMapViewGetTileAtPos(x, y);
				let objectData = ChatRoomMapViewGetObjectAtPos(x, y);
				// If tile data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(tileData != null) {
					ChatRoomMapViewVisibilityMask[i] &&= tileData.BlockVision ? false : true;
					ChatRoomMapViewAudibilityMask[i] &&= tileData.BlockHearing ? false : true;
				}
				// If object data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(objectData != null) {
					ChatRoomMapViewVisibilityMask[i] &&= objectData.BlockVision ? false : true;
					ChatRoomMapViewAudibilityMask[i] &&= objectData.BlockHearing ? false : true;
				}

			}
		}

	}
}

/**
 * Returns the sight range for the current player, based on the blindness level
 * @returns {number} - The number of visible tiles
 */
function ChatRoomMapViewGetSightRange() {
	if (ChatRoomMapViewHasSuperPowers()) return ChatRoomMapViewPerceptionRangeMax;
	return ChatRoomMapViewPerceptionRangeMax - Player.GetBlindLevel() * 2;
}

/**
 * Returns the hearing range for the current player, based on the deafness level
 * @returns {number} - The number of tiles
 */
function ChatRoomMapViewGetHearingRange() {
	return ChatRoomMapViewPerceptionRangeMax - Player.GetDeafLevel();
}

/**
 * Returns TRUE if the player can see a character at her sight range
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if visible
 */
function ChatRoomMapViewCharacterIsVisible(C) {
	if (!C?.MapData) return false;
	if (!Player?.MapData?.Pos) return false;
	const PlayerTileId = ChatRoomMapViewCoordinatesToIndex(C.MapData.Pos.X, C.MapData.Pos.Y);
	return ChatRoomMapViewVisibilityMask[PlayerTileId];
}

/**
 * Returns TRUE if the player can see hear a character at her hearing range
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if hearable
 */
function ChatRoomMapViewCharacterIsHearable(C) {
	if (!C?.MapData) return false;
	if (!Player?.MapData?.Pos) return false;
	const PlayerTileId = ChatRoomMapViewCoordinatesToIndex(C.MapData.Pos.X, C.MapData.Pos.Y);
	return ChatRoomMapViewAudibilityMask[PlayerTileId];
}

/**
 * Returns TRUE if the player is on whisper range to another character (1 tile)
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if on whisper range
 */
function ChatRoomMapViewCharacterOnWhisperRange(C) {
	if ((C == null) || (C.MapData == null) || (C.MapData.Pos == null) || (C.MapData.Pos.X == null) || (C.MapData.Pos.Y == null)) return false;
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return false;
	let Distance = Math.max(Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X), Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y));
	return (Distance <= ChatRoomMapViewWhisperRange);
}

/**
 * Returns TRUE if the player is within interaction range of another character
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if on interaction range
 */
function ChatRoomMapViewCharacterOnInteractionRange(C) {
	if ((C == null) || (C.MapData == null) || (C.MapData.Pos == null) || (C.MapData.Pos.X == null) || (C.MapData.Pos.Y == null)) return false;
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return false;
	let Distance = Math.max(Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X), Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y));
	return (Distance <= ChatRoomMapViewInteractionRange);
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
function ChatRoomMapViewFindWallEffectTile(CW, CE, SW, SC, SE) {

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
function ChatRoomMapViewIsWall(X, Y) {
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return true;
	let ID = ChatRoomData.MapData.Tiles.charCodeAt(X + Y * ChatRoomMapViewWidth);
	return ((ID >= 1000) && (ID < 2000));
}

/**
 * Returns the object located at a X and Y position on the map, or NULL if nothing
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {ChatRoomMapTile | null} - The object at the position
 */
function ChatRoomMapViewGetTileAtPos(X, Y) {
	if (ChatRoomData.MapData?.Tiles.length !== ChatRoomMapViewWidth * ChatRoomMapViewHeight) return null;
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return null;
	let ObjectID = ChatRoomData.MapData.Tiles.charCodeAt(ChatRoomMapViewCoordinatesToIndex(X, Y));
	const tile = ChatRoomMapViewTileList.find(o => o.ID === ObjectID);
	return tile;
}

/**
 * Returns the object located at a X and Y position on the map, or NULL if nothing
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {ChatRoomMapObject | null} - The object at the position
 */
function ChatRoomMapViewGetObjectAtPos(X, Y) {
	if (ChatRoomData.MapData?.Objects.length !== ChatRoomMapViewWidth * ChatRoomMapViewHeight) return null;
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return null;
	let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(ChatRoomMapViewCoordinatesToIndex(X, Y));
	const Obj = ChatRoomMapViewObjectList.find(o => o.ID === ObjectID);
	return Obj;
}

/**
 * Returns TRUE if there's a wall path on the X, Y position that the player can enter
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {boolean} - TRUE if we can enter
 */
function ChatRoomMapViewCanEnterWall(X, Y) {
	if (ChatRoomData.MapData?.Objects.length !== ChatRoomMapViewWidth * ChatRoomMapViewHeight) return false;
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return false;
	let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(X + Y * ChatRoomMapViewWidth);
	for (let O of ChatRoomMapViewObjectList)
		if (O.ID === ObjectID) {
			if (O.CanEnter == null) return false;
			/** @type {ChatRoomMapDirection} */
			let Direction = "";
			if (Player.MapData.Pos.X < X) Direction = "R";
			else if (Player.MapData.Pos.X > X) Direction = "L";
			else if (Player.MapData.Pos.Y < Y) Direction = "D";
			else if (Player.MapData.Pos.Y > Y) Direction = "U";
			return O.CanEnter(Direction);
		}
	return false;
}

/**
 * Returns TRUE if the fog of war feature is currently activated on the map
 * @returns {boolean} - TRUE if fog of war is active
 */
function ChatRoomMapFogIsActive() {
	return ((ChatRoomData == null) || (ChatRoomData.MapData == null) || (ChatRoomData.MapData.Fog == null) || (ChatRoomData.MapData.Fog !== false));
}

/**
 * Returns TRUE if a tile is fully hidden from hide
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {boolean} - TRUE if the tile is hidden
 */
function ChatRoomMapViewTileIsHidden(X, Y) {
	return !ChatRoomMapViewVisibilityMask[ChatRoomMapViewCoordinatesToIndex(X, Y)] && (ChatRoomMapViewTileFog.charCodeAt(X + Y * ChatRoomMapViewWidth) == 0);
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
function ChatRoomMapViewWallEffect(X, Y, ScreenX, ScreenY, TileWidth, TileHeight) {

	// Find all other walls around the current tile
	let CW = ChatRoomMapViewIsWall(X - 1, Y) || ChatRoomMapViewTileIsHidden(X - 1, Y);
	let CE = ChatRoomMapViewIsWall(X + 1, Y) || ChatRoomMapViewTileIsHidden(X + 1, Y);
	let SW = ChatRoomMapViewIsWall(X - 1, Y + 1) || ChatRoomMapViewTileIsHidden(X - 1, Y + 1);
	let SC = ChatRoomMapViewIsWall(X, Y + 1) || ChatRoomMapViewTileIsHidden(X, Y + 1);
	let SE = ChatRoomMapViewIsWall(X + 1, Y + 1) || ChatRoomMapViewTileIsHidden(X + 1, Y + 1);

	// Finds the proper effect and draws it
	let Effect = ChatRoomMapViewFindWallEffectTile(CW, CE, SW, SC, SE);
	DrawImageResize("Screens/Online/ChatRoom/MapTile/WallEffect/" + Effect.toString() + ".png", Math.floor(ScreenX), Math.floor(ScreenY), Math.ceil(TileWidth), Math.ceil(TileHeight));

}

/**
 * Apply a wall "3D" effect on the curent map
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {number} - The effect number
 */
function ChatRoomMapViewFloorWallEffect(X, Y) {

	// No effect on the very last row
	if (Y >= ChatRoomMapViewHeight - 1) return -1;

	// Find the soutern wall positions
	let SW = ChatRoomMapViewIsWall(X - 1, Y + 1);
	let SC = ChatRoomMapViewIsWall(X, Y + 1);
	let SE = ChatRoomMapViewIsWall(X + 1, Y + 1);

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
function ChatRoomMapViewCollision() {

	// Exits right away if no player data or the tile is valid to stand there
	if ((Player.MapData == null) || ((Player.MapData.Pos.X == null)) || ((Player.MapData.Pos.Y == null))) return;
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y) > 0) return;

	// Since there's a collision, we try to find good spots to move the player
	let Tiles = [];
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 1, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X - 1, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 1, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X + 1, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y - 1) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y - 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y + 1) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y + 1 });

	// If we found a tile next to the player
	if (Tiles.length > 0) {
		let Tile = CommonRandomItemFromList(null, Tiles);
		Player.MapData.Pos.X = Tile.X;
		Player.MapData.Pos.Y = Tile.Y;
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapViewUpdatePlayerFlag(-ChatRoomMapViewUpdatePlayerTime);
		return;
	}

	// Tries the current tile corners next
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 1, Player.MapData.Pos.Y - 1) > 0) Tiles.push({ X: Player.MapData.Pos.X - 1, Y: Player.MapData.Pos.Y - 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 1, Player.MapData.Pos.Y - 1) > 0) Tiles.push({ X: Player.MapData.Pos.X + 1, Y: Player.MapData.Pos.Y - 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 1, Player.MapData.Pos.Y + 1) > 0) Tiles.push({ X: Player.MapData.Pos.X - 1, Y: Player.MapData.Pos.Y + 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 1, Player.MapData.Pos.Y + 1) > 0) Tiles.push({ X: Player.MapData.Pos.X + 1, Y: Player.MapData.Pos.Y + 1 });

	// If we found a tile in the corner of the player
	if (Tiles.length > 0) {
		let Tile = CommonRandomItemFromList(null, Tiles);
		Player.MapData.Pos.X = Tile.X;
		Player.MapData.Pos.Y = Tile.Y;
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapViewUpdatePlayerFlag(-ChatRoomMapViewUpdatePlayerTime);
		return;
	}

	// Tries 2 tiles away next
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 2, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X - 2, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 2, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X + 2, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y - 2) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y - 2 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y + 2) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y + 2 });

	// If we found a tile next to the player
	if (Tiles.length > 0) {
		let Tile = CommonRandomItemFromList(null, Tiles);
		Player.MapData.Pos.X = Tile.X;
		Player.MapData.Pos.Y = Tile.Y;
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapViewUpdatePlayerFlag(-ChatRoomMapViewUpdatePlayerTime);
		return;
	}

}

/**
 * Find the first {@link ChatRoomCharacter} members at the specified X & Y position
 * @param {number} X - The X position on the screen
 * @param {number} Y - The Y position on the screen
 * @returns {null | Character} A character at the specified X & Y position or, if none can be found, `null`
 */
function ChatRoomMapViewGetCharacterAtPos(X, Y) {
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return null;
	for (let C of ChatRoomCharacter)
		if ((C.MapData?.Pos != null) && (C.MapData.Pos.X === X) && (C.MapData.Pos.Y === Y))
			return C;
	return null;
}

/**
 * Returns a object that contains the entry flag's position with x and y parameters or null if no entry flag is set
 * @returns {ChatRoomMapPos|null}
 */
function ChatRoomMapViewGetEntryFlagPosition() {

	if (!ChatRoomData.MapData?.Objects) return null;

	const idx = ChatRoomData.MapData.Objects.indexOf(String.fromCharCode(ChatRoomMapViewObjectEntryID));
	if (idx < 0) return null;

	return {
		X: idx % ChatRoomMapViewWidth,
		Y: Math.floor(idx / ChatRoomMapViewWidth)
	};
}

/**
 * Draw the map grid and character on screen
 * @param {number} Left - The X position on the screen
 * @param {number} Top - The Y position on the screen
 * @param {number} Width - The width size of the drawn map
 * @param {number} Height - The height size of the drawn map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDrawGrid(Left, Top, Width, Height) {

	// Make sure the player MapData is valid
	if (Player.MapData == null)
		Player.LastMapData = Player.MapData = ChatRoomMapViewInitializeCharacter(Player);

	// Manages collisions, moves the player if she's on a tile that cannot be entered
	ChatRoomMapViewCollision();

	// Defines the width and height of the visible tile
	let TileWidth = Width / ((ChatRoomMapViewPerceptionRange * 2) + 1);
	let TileHeight = Height / ((ChatRoomMapViewPerceptionRange * 2) + 1);
	let EditWidth = (ChatRoomMapViewEditRange - 1) * TileWidth;
	let EditHeight = (ChatRoomMapViewEditRange - 1) * TileHeight;
	let MaxVisibleRange = ChatRoomMapViewGetSightRange();
	if (MaxVisibleRange < 1) MaxVisibleRange = 1;
	let CharacterUnderCursor = null;
	let FogActive = ChatRoomMapFogIsActive();

	// Clears the tile and character selection
	ChatRoomMapViewEditSelection = [];
	ChatRoomMapViewFocusedCharacter = null;

	// Prepares the fog if needed
	if (ChatRoomMapViewTileFog.length != ChatRoomMapViewWidth * ChatRoomMapViewHeight) ChatRoomMapViewTileFog = String.fromCharCode(0).repeat(ChatRoomMapViewWidth * ChatRoomMapViewHeight);
	if (ChatRoomMapViewObjectFog.length != ChatRoomMapViewWidth * ChatRoomMapViewHeight) ChatRoomMapViewObjectFog = String.fromCharCode(0).repeat(ChatRoomMapViewWidth * ChatRoomMapViewHeight);

	// For each tiles in the grid
	for (let Pos = 0; Pos < ChatRoomMapViewWidth * ChatRoomMapViewHeight; Pos++) {

		// Find the X & Y position of the grid
		let X = Pos % ChatRoomMapViewWidth;
		let Y = Math.floor(Pos / ChatRoomMapViewWidth);

		// Only process if the X & Y are within the visible sight range
		let MaxRange = Math.max(Math.abs(X - Player.MapData.Pos.X), Math.abs(Y - Player.MapData.Pos.Y));
		if (MaxRange > MaxVisibleRange) continue;

		// Defines the screen X and Y positions
		let ScreenX = (X - Player.MapData.Pos.X) * TileWidth + ChatRoomMapViewPerceptionRange * TileWidth;
		let ScreenY = (Y - Player.MapData.Pos.Y) * TileHeight + ChatRoomMapViewPerceptionRange * TileWidth;

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
		let ObjectData = null;
		let ObjectImage = null;

		// Out of sight, we draw the fog
		let Fog = false;
		if (FogActive && !ChatRoomMapViewVisibilityMask[Pos]) {
			if (ChatRoomMapViewTileFog.charCodeAt(Pos) == 0) {
				DrawImageResize("Screens/Online/ChatRoom/MapTile/Fog/Full.png", Math.floor(TileCanvasX), Math.floor(TileCanvasY), Math.ceil(TileWidth), Math.ceil(TileHeight));
				continue;
			}
			TileID = ChatRoomMapViewTileFog.charCodeAt(Pos);
			Fog = true;
		}

		// Finds the tile to draw and keeps it
		for (let Tile of ChatRoomMapViewTileList)
			if (Tile.ID == TileID) {
				TileData = Tile;
				break;
			}

		// Draw the tile on the grid
		if (TileData != null) {
			TileImage = DrawGetImage("Screens/Online/ChatRoom/MapTile/" + TileData.Type + "/" + TileData.Style + ".png");
			DrawImageResize(TileImage, Math.floor(TileCanvasX), Math.floor(TileCanvasY), Math.ceil(TileWidth), Math.ceil(TileHeight));
			if (TileData.Type == "Wall") ChatRoomMapViewWallEffect(X, Y, Left + ScreenX, Top + ScreenY, Math.ceil(TileWidth), Math.ceil(TileHeight));
			else FloorWallEffect = ChatRoomMapViewFloorWallEffect(X, Y);
		}

		// Finds the object and updates the fog data
		let ObjectID = Fog ? ChatRoomMapViewObjectFog.charCodeAt(Pos) : ChatRoomData.MapData.Objects.charCodeAt(Pos);
		ChatRoomMapViewTileFog = ChatRoomMapViewTileFog.substring(0, Pos) + String.fromCharCode(TileID) + ChatRoomMapViewTileFog.substring(Pos + 1);
		ChatRoomMapViewObjectFog = ChatRoomMapViewObjectFog.substring(0, Pos) + String.fromCharCode(ObjectID) + ChatRoomMapViewObjectFog.substring(Pos + 1);

		// Draw the non blank object next
		if (ObjectID > ChatRoomMapViewObjectStartID)
			for (let Obj of ChatRoomMapViewObjectList)
				if (Obj.ID == ObjectID) {
					if (Obj.IsVisible && !ChatRoomMapViewHasSuperPowers() && !Obj.IsVisible()) break;
					if (Obj.Style === "Blank") break;
					if (Obj.Type == "WallDecoration" && ChatRoomMapViewTileIsHidden(X, Y + 1)) break;
					let ImageName = Obj.Style;
					if ((Obj.AssetName != null) || (Obj.OccupiedStyle != null)) {
						let Char = ChatRoomMapViewGetCharacterAtPos(X, Y);
						if ((Char != null) && (Obj.AssetName != null) && (Obj.AssetGroup != null) && InventoryIsWorn(Char, Obj.AssetName, Obj.AssetGroup)) break;
						if ((Char != null) && (Obj.OccupiedStyle != null)) ImageName = Obj.OccupiedStyle;
					} else {
						if (Obj.BuildImageName != null)
							ImageName = Obj.BuildImageName(X, Y);
					}
					ObjectData = Obj;
					ObjectImage = "Screens/Online/ChatRoom/MapObject/" + Obj.Type + "/" + ImageName + ".png";
					DrawImageResize(ObjectImage, Math.floor(Left + ScreenX + ((Obj.Left == null) ? 0 : TileWidth * Obj.Left)), Math.floor(Top + ScreenY + ((Obj.Top == null) ? 0 : TileHeight * Obj.Top)), Math.ceil(TileWidth * ((Obj.Width == null) ? 1 : Obj.Width)), Math.ceil(TileHeight * ((Obj.Height == null) ? 1 : Obj.Height)));
					break;
				}

		// Keeps the tile as selected if the mouse is within selection
		if (((ChatRoomMapViewEditMode == "Tile") || (ChatRoomMapViewEditMode == "Object")) && (Left + ScreenX - EditWidth <= MouseX) && (Left + ScreenX + TileWidth + EditWidth >= MouseX) && (Top + ScreenY - EditHeight <= MouseY) && (Top + ScreenY + TileHeight + EditHeight >= MouseY)) {
			ChatRoomMapViewEditSelection.push(Pos);
			DrawRect = true;
		}

		// For each characters in the chat room (don't draw when there's fog)
		if (!Fog)
			for (let C of ChatRoomCharacter)
				if ((C.MapData?.Pos != null) && (C.MapData.Pos.X === X) && (C.MapData.Pos.Y === Y)) {

					// Draws the character on the grid
					DrawCharacter(C, Left + ScreenX + (TileWidth * 0.05), Top + ScreenY - (TileHeight * 0.85), TileHeight * 1.8 / 1000);
					DrawStatus(C, Left + ScreenX + (TileWidth * 0.05), Top + ScreenY - (TileHeight * 0.85), TileHeight * 1.8 / 1000);

					// Keeps the character under the cursor
					if ((MouseX >= Left + ScreenX + (TileWidth * 0.05)) && (MouseX <= Left + ScreenX + (TileWidth * 0.95)) && (MouseY >= Top + ScreenY - (TileHeight * 0.85)) && (MouseY <= Top + ScreenY + (TileHeight * 0.95))) {
						ChatRoomMapViewFocusedCharacter = C;
						ChatRoomMapViewFocusedCharacterX = Left + ScreenX + (TileWidth * 0.05);
						ChatRoomMapViewFocusedCharacterY = Top + ScreenY - (TileHeight * 0.85);
						CharacterUnderCursor = { Character: C, StatusBaseX: TileCanvasX + (TileWidth / 2), StatusBaseY: TileCanvasY + TileHeight - 20 };
					}

					// Draw the water effect if character stands in water
					if (TileImage != null && TileData != null && TileData.Type == "Water") {
						const Transparency = (TileData.Transparency) ? TileData.Transparency : 0.0;
						const TransparencyCutoutHeight = (TileData.TransparencyCutoutHeight) ? TileData.TransparencyCutoutHeight : 1.0;
						DrawImageEx(TileImage, MainCanvas, TileCanvasX, TileCanvasY, {Width: TileWidth, Height: TileHeight, Alpha: Transparency, AlphaMasks: [[TileCanvasX, TileCanvasY, TileImage.width, TileImage.height * TransparencyCutoutHeight]]});
					}

					// Draw the transparency effect for objects
					if ((ObjectImage != null) && (ObjectData != null) && (ObjectData.Transparency != null) && (ObjectData.TransparencyCutoutHeight != null)) {
						let ImgX = Math.floor(Left + ScreenX + ((ObjectData.Left == null) ? 0 : TileWidth * ObjectData.Left));
						let ImgY = Math.floor(Top + ScreenY + ((ObjectData.Top == null) ? 0 : TileHeight * ObjectData.Top));
						let W = Math.ceil(TileWidth * ((ObjectData.Width == null) ? 1 : ObjectData.Width));
						let H = Math.ceil(TileHeight * ((ObjectData.Height == null) ? 1 : ObjectData.Height));
						let WA = Math.ceil(TileImage.width * 2 * ((ObjectData.Width == null) ? 1 : ObjectData.Width));
						let HA = Math.ceil(TileImage.height * ObjectData.TransparencyCutoutHeight * ((ObjectData.Height == null) ? 1 : ObjectData.Height));
						DrawImageEx(ObjectImage, MainCanvas, ImgX, ImgY, {Width: W, Height: H, Alpha: ObjectData.Transparency, AlphaMasks: [[ImgX, ImgY, WA, HA]]});
					}

				}

		// Draw the floor wall effect and rectancle if needed at the end
		if (FloorWallEffect != -1) DrawImageResize("Screens/Online/ChatRoom/MapTile/WallEffect/" + FloorWallEffect.toString() + ".png", Math.floor(ScreenX), Math.floor(ScreenY), Math.ceil(TileWidth), Math.ceil(TileHeight));
		if (DrawRect) DrawEmptyRect(Left + ScreenX, Top + ScreenY, TileWidth, TileHeight, "cyan", 3);

	}

	// For each tiles in the grid, we draw the fog
	if (FogActive && !ChatRoomMapViewHasSuperPowers())
		for (let Pos = 0; Pos < ChatRoomMapViewWidth * ChatRoomMapViewHeight; Pos++) {

			// Find the X & Y position of the grid
			let X = Pos % ChatRoomMapViewWidth;
			let Y = Math.floor(Pos / ChatRoomMapViewWidth);

			// Only process if the X & Y are within the visible sight range
			let MaxRange = Math.max(Math.abs(X - Player.MapData.Pos.X), Math.abs(Y - Player.MapData.Pos.Y));
			if (MaxRange > MaxVisibleRange) continue;

			// Defines the screen X and Y positions
			let ScreenX = (X - Player.MapData.Pos.X) * TileWidth + ChatRoomMapViewPerceptionRange * TileWidth;
			let ScreenY = (Y - Player.MapData.Pos.Y) * TileHeight + ChatRoomMapViewPerceptionRange * TileWidth;

			// If this tile's coordinates are out of the view range, we don't have to bother with it
			if ((ScreenX < 0) || (ScreenX >= Width) || (ScreenY < 0) || (ScreenY >= Height)) continue;

			// Out of sight and with known data, we draw the half fog effect
			if (!ChatRoomMapViewVisibilityMask[Pos])
				if (ChatRoomMapViewTileFog.charCodeAt(Pos) > 0)
					DrawImageResize("Screens/Online/ChatRoom/MapTile/Fog/Half.png", Math.floor(ScreenX), Math.floor(ScreenY), Math.ceil(TileWidth), Math.ceil(TileHeight));

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
function ChatRoomMapViewUpdateFlag() {

	// Clears the wrong objects on the map
	for (let Pos = 0; Pos < ChatRoomMapViewWidth * ChatRoomMapViewHeight; Pos++) {

		// If there's an object to check
		let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(Pos);
		if (ObjectID >= 1) {

			// Finds the object
			//debugger;
			let ClearObject = false;
			let Obj = null;
			for (let O of ChatRoomMapViewObjectList)
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
				for (let T of ChatRoomMapViewTileList)
					if (T.ID == TileID) {
						Tile = T;
						break;
					}

				// Invalid tiles and invalid objects for that tile must be cleared
				if (Tile == null) ClearObject = true;
				else if ((Obj.Type == "FloorDecoration") && (Tile.Type != "Floor") && (Tile.Type != "FloorExterior")) ClearObject = true;
				else if ((Obj.Type == "FloorDecorationThemed") && (Tile.Type != "Floor") && (Tile.Type != "FloorExterior")) ClearObject = true;
				else if ((Obj.Type == "FloorDecorationParty") && (Tile.Type != "Floor") && (Tile.Type != "FloorExterior")) ClearObject = true;
				else if ((Obj.Type == "FloorDecorationCamping") && (Tile.Type != "Floor") && (Tile.Type != "FloorExterior")) ClearObject = true;
				else if ((Obj.Type == "FloorDecorationExpanding") && (Tile.Type != "Floor") && (Tile.Type != "FloorExterior")) ClearObject = true;
				else if ((Obj.Type == "FloorItem") && (Tile.Type != "Floor") && (Tile.Type != "FloorExterior")) ClearObject = true;
				else if ((Obj.Type == "FloorObstacle") && (Tile.Type != "Floor") && (Tile.Type != "FloorExterior")) ClearObject = true;
				else if ((Obj.Type == "WallDecoration") && (Tile.Type != "Wall")) ClearObject = true;
				else if ((Obj.Type == "WallPath") && (Tile.Type != "Wall")) ClearObject = true;
				else if (Tile.Type == "Wall") {

					// If the current tile and the one below is a wall, we clear the object
					let X = Pos % ChatRoomMapViewWidth;
					let Y = Math.floor(Pos / ChatRoomMapViewWidth);
					if (ChatRoomMapViewIsWall(X, Y + 1)) ClearObject = true;

				}

			}

			// Clears the object if needed
			if (ClearObject) ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapViewObjectStartID) + ChatRoomData.MapData.Objects.substring(Pos + 1);

		}

	}

	// Sets the flag
	if (ChatRoomMapViewUpdateRoomNext == null) ChatRoomMapViewUpdateRoomNext = CommonTime() + 5000;

}

/**
 * Sets the next update flags for the player if it's not already set, the delay is 1 seconds for live data and 10 seconds for last map data
 * @param {number} UpdateTimeOffset - A offset for the update time. This can be positive to increase the update time or negative to reduce it.
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdatePlayerFlag(UpdateTimeOffset = 0) {
	if (ChatRoomMapViewUpdatePlayerNext == null)
		ChatRoomMapViewUpdatePlayerNext = CommonTime() + ChatRoomMapViewUpdatePlayerTime + UpdateTimeOffset;
	if (Player.ImmersionSettings && Player.ImmersionSettings.ReturnToChatRoom && (ChatRoomMapViewUpdateLastMapDataNext == null))
		ChatRoomMapViewUpdateLastMapDataNext = CommonTime() + 10000;
}

/**
 * Updates the room data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdateRoomSync() {
	if ((ChatRoomMapViewUpdateRoomNext == null) || (ChatRoomMapViewUpdateRoomNext > CommonTime())) return;
	if (!ChatRoomPlayerIsAdmin()) return;
	ChatRoomMapViewUpdateRoomNext = null;
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: ChatRoomGetSettings(ChatRoomData), Action: "Update" });
}

/**
 * Updates the player map data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdatePlayerSync() {
	if ((ChatRoomMapViewUpdatePlayerNext == null) || (ChatRoomMapViewUpdatePlayerNext > CommonTime())) return;
	ChatRoomMapViewUpdatePlayerNext = null;
	ServerSend("ChatRoomCharacterMapDataUpdate", Player.MapData);
}

/**
 * Updates a character's map data
 * @param {ServerMapDataResponse} data - Data object containing the new character map data.
 * @returns {void} - Nothing.
 */
function ChatRoomMapViewSyncMapData(data) {
	// Exits if we're not in a room
	if (!ChatRoomData) return;

	// Exit if the packet is invalid
	if (!CommonIsObject(data) || typeof data.MemberNumber !== "number") return;

	const char = ChatRoomCharacter.find(c => c.MemberNumber === data.MemberNumber);
	if (!char || char.IsPlayer()) return;

	// Assigns the MapData to the chatroom character
	char.MapData = ServerAccountDataSyncedValidate.MapData(data.MapData, char);
}

/**
 * Updates the player last map data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdateLastMapDataSync() {
	if ((ChatRoomMapViewUpdateLastMapDataNext == null) || (ChatRoomMapViewUpdateLastMapDataNext > CommonTime())) return;
	ChatRoomMapViewUpdateLastMapDataNext = null;
	ServerAccountUpdate.QueueData({ LastMapData: Player.MapData }, true);
}

/**
 * Processes the character movement when the timer has expired
 * @returns {void} - Nothing
 */
function ChatRoomMapViewMovementProcess() {
	if ((ChatRoomMapViewMovement == null) || (ChatRoomMapViewMovement.TimeEnd > CommonTime())) return;
	Player.MapData.Pos.X = ChatRoomMapViewMovement.X;
	Player.MapData.Pos.Y = ChatRoomMapViewMovement.Y;
	// Set the update flag and reduce the wait time by the time the player already waited
	ChatRoomMapViewUpdatePlayerFlag(ChatRoomMapViewMovement.TimeStart - ChatRoomMapViewMovement.TimeEnd);
	ChatRoomMapViewMovement = null;
	// After we moved, calculate the new perception masks
	ChatRoomMapViewCalculatePerceptionMasks();
	// Get the tile and object we entered
	const newTile = ChatRoomMapViewGetTileAtPos(Player.MapData.Pos.X, Player.MapData.Pos.Y);
	const newObject = ChatRoomMapViewGetObjectAtPos(Player.MapData.Pos.X, Player.MapData.Pos.Y);
	// If the current tile or object have OnEnter functions, execute them
	if(newTile && newTile.OnEnter) newTile.OnEnter();
	if(newObject && newObject.OnEnter) newObject.OnEnter();
}

/**
 * Checks if the player is leashed and if she should follow the leash holder
 * @returns {void} - Nothing
 */
function ChatRoomMapViewLeash() {

	// Finds the leash holder character
	if (ChatRoomLeashPlayer == null) return;
	for (let C of ChatRoomCharacter)
		if ((C.MemberNumber == ChatRoomLeashPlayer) && !C.IsPlayer()) {

			// Validates the data first
			if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return;
			if ((C.MapData?.Pos == null) || (C.MapData.Pos.X == null) || (C.MapData.Pos.Y == null)) return;

			// Leash range is 2 tiles
			let Distance = Math.max(Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X), Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y));
			if (Distance <= 2) return;

			// The X and Y variance tells us where to pull the character
			let VarX = Player.MapData.Pos.X - C.MapData.Pos.X;
			let VarY = Player.MapData.Pos.Y - C.MapData.Pos.Y;
			let TargetX = Player.MapData.Pos.X;
			let TargetY = Player.MapData.Pos.Y;
			if (VarX > 2) TargetX = C.MapData.Pos.X + 2;
			if (VarX < -2) TargetX = C.MapData.Pos.X - 2;
			if (VarY > 2) TargetY = C.MapData.Pos.Y + 2;
			if (VarY < -2) TargetY = C.MapData.Pos.Y - 2;

			// If the new target tile cannot be entered, we try another one nearby
			if (ChatRoomMapViewCanEnterTile(TargetX, TargetY) <= 0) {

				// Tries to bring the character one extra tile toward the leash holder on the invert axis (X instead of Y or vice versa)
				if ((Math.abs(VarX) > 2) && (Math.abs(VarX) > Math.abs(VarY)) && (VarY > 0)) TargetY--;
				if ((Math.abs(VarX) > 2) && (Math.abs(VarX) > Math.abs(VarY)) && (VarY < 0)) TargetY++;
				if ((Math.abs(VarY) > 2) && (Math.abs(VarX) < Math.abs(VarY)) && (VarX > 0)) TargetX--;
				if ((Math.abs(VarY) > 2) && (Math.abs(VarX) < Math.abs(VarY)) && (VarX < 0)) TargetX++;

				// If we still cannot move there
				if (ChatRoomMapViewCanEnterTile(TargetX, TargetY) <= 0) {

					// Bring the character 1 tile near the leash holder
					if (VarX > 1) TargetX = C.MapData.Pos.X + 1;
					if (VarX < -1) TargetX = C.MapData.Pos.X - 1;
					if (VarY > 1) TargetY = C.MapData.Pos.Y + 1;
					if (VarY < -1) TargetY = C.MapData.Pos.Y - 1;

					// If it still doesn't work, we give up
					if (ChatRoomMapViewCanEnterTile(TargetX, TargetY) <= 0) return;

				}

			}

			// Sends the movement packet
			Player.MapData.Pos.X = TargetX;
			Player.MapData.Pos.Y = TargetY;
			ChatRoomMapViewUpdatePlayerFlag();
			return;

		}

}


/**
 * Draws the map and characters of the chat room map on the left side of the screen
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDraw() {
	ChatRoomMapViewDrawGrid(0, 0, 1000, 1000);
}

/**
 * Draws the buttons of the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDrawUi() {

	// Admins can grant themselves super powers (teleport, far hearing, etc.)
	if (ChatRoomPlayerIsAdmin())
		DrawButton(790, 860, 60, 60, "", "White", "Icons/Small/" + ((ChatRoomMapViewSuperPowersActive) ? "SuperPowersActive" : "SuperPowersInactive") + ".png");

	// Draw the movement buttons
	if (ChatRoomMapViewMovement == null) {
		DrawButton(860, 860, 60, 60, "", "White", "Icons/Small/North.png");
		DrawButton(790, 930, 60, 60, "", "White", "Icons/Small/West.png");
		DrawButton(860, 930, 60, 60, "", "White", "Icons/Small/South.png");
		DrawButton(930, 930, 60, 60, "", "White", "Icons/Small/East.png");
	} else {
		DrawButton(860, 860, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "North") ? "White" : "#80FF80", "Icons/Small/North.png");
		DrawButton(930, 860, 60, 60, "", "White", "Icons/Small/Cancel.png");
		DrawButton(790, 930, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "West") ? "White" : "#80FF80", "Icons/Small/West.png");
		DrawButton(860, 930, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "South") ? "White" : "#80FF80", "Icons/Small/South.png");
		DrawButton(930, 930, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "East") ? "White" : "#80FF80", "Icons/Small/East.png");
		let Progress = (CommonTime() - ChatRoomMapViewMovement.TimeStart) / (ChatRoomMapViewMovement.TimeEnd - ChatRoomMapViewMovement.TimeStart) * 100;
		DrawProgressBar(790, 992, 200, 8, Progress);
	}

	// Out of edit mode, we draws the basic buttons
	if (ChatRoomMapViewEditMode == "") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/Plus.png");
		DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/Minus.png");
		if (ChatRoomPlayerIsAdmin()) {
			DrawButton(10, 150, 60, 60, "", "White", "Icons/Small/EditTile.png");
			DrawButton(10, 220, 60, 60, "", "White", "Icons/Small/EditObject.png");
			DrawButton(10, 290, 60, 60, "", "White", "Icons/Small/Undo.png");
			DrawButton(10, 360, 60, 60, "", "White", "Icons/Small/Fog" + (ChatRoomMapFogIsActive() ? "Active" : "Inactive") + ".png");
		}
	}

	// In tile type selection mode, the user can select a tile type (floor, wall, etc.)
	if (ChatRoomMapViewEditMode == "TileType") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/MapView.png");
		DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/EditObject.png");
		let X = 0;
		let Y = 0;
		let Type = "";
		let count = 2;
		for (let Tile of ChatRoomMapViewTileList)
			if (Type != Tile.Type) {
				Type = Tile.Type;
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				DrawButton(X, Y, 60, 60, "", "White", "Screens/Online/ChatRoom/MapTile/Type/" + Type + ".png");
				count ++;
			}

	}

	// In tile edit mode, we show all tiles of a spectific tyle
	if (ChatRoomMapViewEditMode == "Tile") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/Edit.png");
		DrawButton(10, 80, 60, 60, "", "White", "Screens/Online/ChatRoom/MapTile/Range/" + ChatRoomMapViewEditRange.toString() + ".png");
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Tile of ChatRoomMapViewTileList){
			if (ChatRoomMapViewEditSubMode == Tile.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				DrawButton(X, Y, 60, 60, "", "White");
				count++;
				if (Tile.ID == ChatRoomMapViewEditObject.ID) DrawRect(X + 2, Y + 2, 56, 56, "#00FF00");
				DrawImageResize("Screens/Online/ChatRoom/MapTile/" + Tile.Type + "/" + Tile.Style + ".png", X + 5, Y + 5, 50, 50);
			}
		}

	}

	// In object type selection mode, the user can select an object type (floor decoration, floor obstacle, wall decoration, etc.)
	if (ChatRoomMapViewEditMode == "ObjectType") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/MapView.png");
		DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/EditTile.png");
		let X = 0;
		let Y = 0;
		let Type = "";
		let count = 2;
		for (let Obj of ChatRoomMapViewObjectList){
			if (Type != Obj.Type) {
				Type = Obj.Type;
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				DrawButton(X, Y, 60, 60, "", "White", "Screens/Online/ChatRoom/MapObject/Type/" + Type + ".png");
				count++;
			}
		}

	}

	// In object edit mode, we show all objects of a spectific tyle
	if (ChatRoomMapViewEditMode == "Object") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/Edit.png");
		DrawButton(10, 80, 60, 60, "", "White", "Screens/Online/ChatRoom/MapTile/Range/" + ChatRoomMapViewEditRange.toString() + ".png");
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Obj of ChatRoomMapViewObjectList)
			if (ChatRoomMapViewEditSubMode == Obj.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				DrawButton(X, Y, 60, 60, "", ((Obj.AssetName == null) || (Obj.AssetGroup == null) || InventoryAvailable(Player, Obj.AssetName, Obj.AssetGroup)) ? "White" : "Pink");
				count++;
				if (Obj.ID == ChatRoomMapViewEditObject.ID) DrawRect(X + 2, Y + 2, 56, 56, "#00FF00");
				if (Obj.Style !== "Blank") DrawImageResize("Screens/Online/ChatRoom/MapObject/" + Obj.Type + "/" + Obj.Style + ".png", X + 5, Y + 5, 50, 50);
			}
	}
}

/**
 * Change the key of charachter - sender
 * @param {Character} target
 * @param {("gold" | "silver" | "bronze")[]} keys
 */
function ChatRoomMapViewChangeKey(target, keys, boolean) {
	if (!ChatRoomPlayerIsAdmin()) return;

	const dictionary = new DictionaryBuilder().mapViewChangeKey(keys, boolean).build();
	ServerSend("ChatRoomChat", { Content: "ChatRoomMapViewChangeKey", Type: "Hidden", Dictionary: dictionary, Target: target?.MemberNumber });
}

/**
 * Change a key from a character from a hidden message - reciver
 * @param {Character} sender
 * @param {ServerChatRoomMessage} data
 */
function ChatRoomMapViewChangeKeyHiddenMessage(sender, data) {
	if (!ChatRoomCharacterIsAdmin(sender)) return;

	const mapViewChangeEntries = data.Dictionary;
	mapViewChangeEntries.map((entrie) => {
		if (!IsMapViewChangeKeyEventDictionaryEntry(entrie)) return;
		const HasKey = `HasKey${entrie.Key.charAt(0).toUpperCase() + entrie.Key.slice(1)}`;
		Player.MapData.PrivateState[HasKey] = entrie.Bool;
	});
}

/**
 * Teleport a character to a specific tile
 * @param {Character} target
 * @param {ChatRoomMapPos} position
 */
function ChatRoomMapViewTeleport(target, position) {
	if (!ChatRoomPlayerIsAdmin()) return;
	if (Player.MemberNumber === target.MemberNumber) Player.Position = position;

	const dictionary = new DictionaryBuilder().mapViewTeleport(position).build();
	ServerSend("ChatRoomChat", { Content: "ChatRoomMapViewTeleport", Type: "Hidden", Dictionary: dictionary, Target: target?.MemberNumber });
}

/**
 * Teleport a character to a specific tile from a hidden message
 * @param {Character} sender
 * @param {ServerChatRoomMessage} data
 */
function ChatRoomMapViewTeleportHiddenMessage(sender, data) {
	if (!ChatRoomCharacterIsAdmin(sender)) return;
	const mapViewTeleportEntry = data.Dictionary[0];
	if (!IsMapViewTeleportEventDictionaryEntry(mapViewTeleportEntry)) return;
	ChatRoomMapViewMovement = null;
	Player.Position = mapViewTeleportEntry.Position;
}

/**
 * Check if a tile on the map can be entered by a player, and return the number of milliseconds required to reach it
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {number} - The number of milliseconds
 */
function ChatRoomMapViewCanEnterTile(X, Y) {

	// Out of map bound or walls cannot enter, super powers skip everything
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return 0;
	if (ChatRoomMapViewHasSuperPowers()) {
		if (CommonTime() - ChatRoomMapViewStartOfKeyPress < 300) return ChatRoomMapViewBaseMovementSpeed;
		return ChatRoomMapViewBaseMovementSpeed / 10;
	}
	if (ChatRoomMapViewIsWall(X, Y) && !ChatRoomMapViewCanEnterWall(X, Y)) return 0;

	// Floor obstacles from 2000 to 3000 cannot be crossed
	let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(X + Y * ChatRoomMapViewWidth);
	if ((ObjectID >= 2000) && (ObjectID < 3000)) return 0;
	// Hurdle 2 cannot be crossed if the Player is Freeze
	if ((ObjectID == 670) && Player.HasEffect("Freeze")) return 0;
	// Hurdle 3 cannot be crossed if the Player is Freeze or slow
	if ((ObjectID == 680) && (Player.HasEffect("Freeze") || Player.HasEffect("Slow"))) return 0;

	// Enclosed or suspended players cannot change tiles
	if (Player.IsEnclose() || Player.IsSuspended() || Player.IsMounted()) return 0;

	// The MapImmobile effect prevents players from moving
	if (Player.HasEffect("MapImmobile")) return 0;

	// Cannot enter a tile occupied by another player
	for (let C of ChatRoomCharacter)
		if (!C.IsPlayer() && (C.MapData?.Pos != null) && (C.MapData.Pos.X === X) && (C.MapData.Pos.Y === Y))
			return 0;

	// Always full speed in water if wearing mermaid tail
	let TileID = ChatRoomData.MapData.Tiles.charCodeAt(X + Y * ChatRoomMapViewWidth);
	if ((TileID >= 2000) && (TileID < 3000) && InventoryIsWorn(Player, "MermaidTail", "ItemLegs")) return ChatRoomMapViewBaseMovementSpeed;

	// Base movement speed first, water tiles are slower
	let Speed = ChatRoomMapViewBaseMovementSpeed;
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
function ChatRoomMapViewMove(D) {

	// Nothing to do if that current move is in progress
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return;
	if ((ChatRoomMapViewMovement != null) && (ChatRoomMapViewMovement.Direction === D)) return;

	// Gets the new position
	let X = Player.MapData.Pos.X + ((D == "West") ? -1 : 0) + ((D == "East") ? 1 : 0);
	let Y = Player.MapData.Pos.Y + ((D == "North") ? -1 : 0) + ((D == "South") ? 1 : 0);
	let Time = ChatRoomMapViewCanEnterTile(X, Y);

	// If we can enter the tile
	if (Time > 0) {
		ChatRoomMapViewMovement = {
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
function ChatRoomMapViewUndo() {
	if (ChatRoomMapViewEditBackup.length > 0) {
		let LastMap = ChatRoomMapViewEditBackup.pop();
		ChatRoomData.MapData = CommonCloneDeep(LastMap);
		ChatRoomMapViewUpdateFlag();
		ChatRoomMapViewCalculatePerceptionMasks();
	}
}

/**
 * Handles keyboard keys in the chat room map screen
 * @type {KeyboardEventListener}
 */
function ChatRoomMapViewKeyDown(event) {

	// Nothing to do if a character dialog is open
	if (CurrentCharacter != null) return false;

	const modifiers = CommonKey.GetModifiers(event);
	switch (event.key) {
		case "Enter":
			ElementFocus("InputChat");
			return true;
		case "-":
		case "_":
			if (ChatRoomMapViewPerceptionRange > ChatRoomMapViewPerceptionRangeMin) ChatRoomMapViewPerceptionRange--;
			return true;
		case "+":
		case "=":
			if (ChatRoomMapViewPerceptionRange < ChatRoomMapViewPerceptionRangeMax) ChatRoomMapViewPerceptionRange++;
			return true;
		case "z":
			if (modifiers === CommonKey.CTRL) {
				if (ChatRoomPlayerIsAdmin()) ChatRoomMapViewUndo();
				return true;
			}
			return false;
	}
	const move = CommonKeyMove(event);
	if (!move) return false;
	if (!ChatRoomMapViewKeysPressed.u && !ChatRoomMapViewKeysPressed.d && !ChatRoomMapViewKeysPressed.l && !ChatRoomMapViewKeysPressed.r && (
		move === 'd' || move === 'l' || move === 'r' || move === 'u'
	)) ChatRoomMapViewStartOfKeyPress = CommonTime();
	ChatRoomMapViewKeysPressed = {d: move === 'd', l: move === 'l', r: move === 'r', u: move === 'u'};
	return true;
}

/**
 * Handles keyboard up keys in the chat room map screen
 * @type {KeyboardEventListener}
 */
function ChatRoomMapViewKeyUp(event) {
	switch (CommonKeyMove(event, true, false)) {
		case "u":
			ChatRoomMapViewKeysPressed.u = false;
			return true;
		case "l":
			ChatRoomMapViewKeysPressed.l = false;
			return true;
		case "d":
			ChatRoomMapViewKeysPressed.d = false;
			return true;
		case "r":
			ChatRoomMapViewKeysPressed.r = false;
			return true;
		default:
			return false;
	}
}

/**
 * Handles clicks the chatroom screen view.
 * @returns {void} - Nothing.
 */
function ChatRoomMapViewClick() {

	// Out of chatroom, exit right away
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;

	// Toggle the superpowers on and off
	if (ChatRoomPlayerIsAdmin() && MouseIn(790, 860, 60, 60)) {
		ChatRoomMapViewSuperPowersActive = !ChatRoomMapViewSuperPowersActive;
		ChatRoomMapViewCalculatePerceptionMasks();
		return;
	}

	// Regular movement buttons
	if ((ChatRoomMapViewMovement != null) && MouseIn(930, 860, 60, 60)) return ChatRoomMapViewMovement = null;
	if (MouseIn(860, 860, 60, 60)) return ChatRoomMapViewMove("North");
	if (MouseIn(790, 930, 60, 60)) return ChatRoomMapViewMove("West");
	if (MouseIn(860, 930, 60, 60)) return ChatRoomMapViewMove("South");
	if (MouseIn(930, 930, 60, 60)) return ChatRoomMapViewMove("East");

	// When clicking on a character
	if ((MouseX <= 1000) && (ChatRoomMapViewFocusedCharacter != null) && (ChatRoomMapViewEditMode != "Tile") && (ChatRoomMapViewEditMode != "Object") && !ChatRoomMapViewEditStarted) {

		// Checks if the arousal meter is showing
		let MeterShow = ChatRoomMapViewFocusedCharacter.IsPlayer();
		if (!ChatRoomMapViewFocusedCharacter.IsPlayer() && Player.ArousalSettings.ShowOtherMeter && ChatRoomMapViewFocusedCharacter.ArousalSettings) {
			if (ChatRoomMapViewFocusedCharacter.ArousalSettings.Visible === "Access") {
				MeterShow = ChatRoomMapViewFocusedCharacter.AllowItem;
			} else if (ChatRoomMapViewFocusedCharacter.ArousalSettings.Visible === "All") {
				MeterShow = true;
			}
		}

		// If we clicked on the thermometer, we zoom/unzoom it
		if (MeterShow) {

			// Defines the X, Y and zoom of the character
			let CharX = ChatRoomMapViewFocusedCharacterX;
			let CharY = ChatRoomMapViewFocusedCharacterY;
			let Zoom = (1 / ((ChatRoomMapViewPerceptionRange * 2) + 1)) * 1.8;

			// Zoom or unzoom
			if (MouseIn(CharX + 60 * Zoom, CharY + 400 * Zoom, 80 * Zoom, 100 * Zoom) && !ChatRoomMapViewFocusedCharacter.ArousalZoom) { ChatRoomMapViewFocusedCharacter.ArousalZoom = true; return; }
			if (MouseIn(CharX + 50 * Zoom, CharY + 615 * Zoom, 100 * Zoom, 85 * Zoom) && ChatRoomMapViewFocusedCharacter.ArousalZoom) { ChatRoomMapViewFocusedCharacter.ArousalZoom = false; return; }

			// If the player can manually control her arousal, we set the progress manual and change the facial expression, it can trigger an orgasm at 100%
			if (ChatRoomMapViewFocusedCharacter.IsPlayer() && MouseIn(CharX + 50 * Zoom, CharY + 200 * Zoom, 100 * Zoom, 500 * Zoom) && ChatRoomMapViewFocusedCharacter.ArousalZoom) {
				if (PreferenceArousalAtLeast(Player, "Manual") && !PreferenceArousalAtLeast(Player, "Automatic")) {
					var Arousal = Math.round((CharY + 625 * Zoom - MouseY) / (4 * Zoom));
					ActivitySetArousal(Player, Arousal);
					if (Player.ArousalSettings.AffectExpression) ActivityExpression(Player, Player.ArousalSettings.Progress);
					if (Player.ArousalSettings.Progress == 100) ActivityOrgasmPrepare(Player);
				}
				return;
			}

			// Don't do anything if the thermometer is clicked without access to it
			if (MouseIn(CharX + 50 * Zoom, CharY + 200 * Zoom, 100 * Zoom, 415 * Zoom) && ChatRoomMapViewFocusedCharacter.ArousalZoom) return;

		}

		// Focuses on the character
		ChatRoomFocusCharacter(ChatRoomMapViewFocusedCharacter);

	}

	// Out of edit mode, we allow the basic buttons
	if (ChatRoomMapViewEditMode == "") {
		if (MouseIn(10, 10, 60, 60) && (ChatRoomMapViewPerceptionRange > ChatRoomMapViewPerceptionRangeMin)) { ChatRoomMapViewPerceptionRange--; return; }
		if (MouseIn(10, 80, 60, 60) && (ChatRoomMapViewPerceptionRange < ChatRoomMapViewPerceptionRangeMax)) { ChatRoomMapViewPerceptionRange++; return; }
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 150, 60, 60)) {
			ChatRoomMapViewEditMode = "TileType";
			ChatRoomMapViewEditSubMode = "";
			return;
		}
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 220, 60, 60)) {
			ChatRoomMapViewEditMode = "ObjectType";
			ChatRoomMapViewEditSubMode = "";
			return;
		}
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 290, 60, 60)) {
			ChatRoomMapViewUndo();
			return;
		}
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 360, 60, 60)) {
			if (ChatRoomMapFogIsActive()) ChatRoomData.MapData.Fog = false;
			else delete ChatRoomData.MapData.Fog;
			ChatRoomMapViewUpdateFlag();
			return;
		}

	// In tile type selection mode, the user can select a tile type (floor, wall, etc.)
	} else if (ChatRoomMapViewEditMode == "TileType") {
		if (MouseIn(10, 10, 60, 60)) { ChatRoomMapViewEditMode = ""; return; }
		if (MouseIn(10, 80, 60, 60)) { ChatRoomMapViewEditMode = "ObjectType"; return; }
		let X = 0;
		let Y = 0;
		let count = 2;
		let Type = "";
		for (let Tile of ChatRoomMapViewTileList)
			if (Type != Tile.Type) {
				Type = Tile.Type;
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					ChatRoomMapViewEditMode = "Tile";
					ChatRoomMapViewEditSubMode = Tile.Type;
					ChatRoomMapViewEditObject = CommonCloneDeep(Tile);
					return;
				}
				count++;
			}

	// In tile edit mode
	} else if ((ChatRoomMapViewEditMode == "Tile")) {
		// The first button returns to type selection
		if (MouseIn(10, 10, 60, 60)) {
			ChatRoomMapViewEditMode = "TileType";
			return;
		}

		// The second button allows changing the edit size from 1 to 5
		if (MouseIn(10, 80, 60, 60)) {
			ChatRoomMapViewEditRange++;
			if (ChatRoomMapViewEditRange > 5) ChatRoomMapViewEditRange = 1;
			return;
		}

		// The other buttons allows changing the edit tile
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Tile of ChatRoomMapViewTileList)
			if (ChatRoomMapViewEditSubMode == Tile.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					ChatRoomMapViewEditObject = CommonCloneDeep(Tile);
					return;
				}
				count++;
			}

	// In object type selection mode, the user can select an object type (floor decoration, floor obstacle, wall decoration, etc.)
	} else if (ChatRoomMapViewEditMode == "ObjectType") {
		if (MouseIn(10, 10, 60, 60)) { ChatRoomMapViewEditMode = ""; return; }
		if (MouseIn(10, 80, 60, 60)) { ChatRoomMapViewEditMode = "TileType"; return; }
		let X = 0;
		let Y = 0;
		let count = 2;
		let Type = "";
		for (let Obj of ChatRoomMapViewObjectList)
			if (Type != Obj.Type) {
				Type = Obj.Type;
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					ChatRoomMapViewEditMode = "Object";
					ChatRoomMapViewEditSubMode = Obj.Type;
					ChatRoomMapViewEditObject = CommonCloneDeep(Obj);
					return;
				}
				count++;
			}

	// In object edit mode
	} else if ((ChatRoomMapViewEditMode == "Object")) {
		// The first button returns to type selection
		if (MouseIn(10, 10, 60, 60)) {
			ChatRoomMapViewEditMode = "ObjectType";
			return;
		}

		// The second button allows changing the edit size from 1 to 5
		if (MouseIn(10, 80, 60, 60)) {
			ChatRoomMapViewEditRange++;
			if (ChatRoomMapViewEditRange > 5) ChatRoomMapViewEditRange = 1;
			return;
		}

		// The other buttons allows changing the edit tile
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Obj of ChatRoomMapViewObjectList)
			if (ChatRoomMapViewEditSubMode == Obj.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					// @ts-ignore
					if ((Obj.AssetName == null) || (Obj.AssetGroup == null) || InventoryAvailable(Player, Obj.AssetName, Obj.AssetGroup))
						ChatRoomMapViewEditObject = CommonCloneDeep(Obj);
					return;
				}
				count++;
			}

	}
}

/**
 * Mouse down event is used to draw on screen and handle the tiles buttons
 * @returns {void} - Nothing
 */
function ChatRoomMapViewMouseDown() {

	// The walk buttons in the bottom right of the map
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;

	// In tile edit mode
	else if ((ChatRoomMapViewEditMode == "Tile") && MouseIn(0, 0, 1000, 1000)) {
		if (MouseIn(10, 10, 60, 60)) { return; }
		if (MouseIn(10, 80, 60, 60)) { return; }

		// The other buttons allows changing the edit tile
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Tile of ChatRoomMapViewTileList)
			if (ChatRoomMapViewEditSubMode == Tile.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					return;
				}
				count++;
			}

		// Enter the drawing mode
		ChatRoomMapViewEditStarted = true;
		ChatRoomMapViewMouseMove();
		return;

	// In object edit mode
	} else if ((ChatRoomMapViewEditMode == "Object") && MouseIn(0, 0, 1000, 1000)) {
		if (MouseIn(10, 10, 60, 60)) { return; }
		if (MouseIn(10, 80, 60, 60)) { return; }

		// The other buttons allows changing the edit tile
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Obj of ChatRoomMapViewObjectList)
			if (ChatRoomMapViewEditSubMode == Obj.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					return;
				}
				count++;
			}

		// Enter the drawing mode
		ChatRoomMapViewEditStarted = true;
		ChatRoomMapViewMouseMove();
		return;

	}

}

/**
 * Mouse move event is used to draw on screen
 * @returns {void} - Nothing
 */
function ChatRoomMapViewMouseMove() {

	// Only in edit mode
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;
	let Backup = CommonCloneDeep(ChatRoomData.MapData);

	// In tile edit mode
	if (ChatRoomMapViewEditStarted && (ChatRoomMapViewEditMode == "Tile") && (ChatRoomMapViewEditObject != null)) {
		for (let Pos of ChatRoomMapViewEditSelection)
			ChatRoomData.MapData.Tiles = ChatRoomData.MapData.Tiles.substring(0, Pos) + String.fromCharCode(ChatRoomMapViewEditObject.ID) + ChatRoomData.MapData.Tiles.substring(Pos + 1);
		ChatRoomMapViewUpdateFlag();
	}

	// In object edit mode, make sure unique items are not duplicated
	if (ChatRoomMapViewEditStarted && (ChatRoomMapViewEditMode == "Object") && (ChatRoomMapViewEditObject != null)) {
		if ("Unique" in ChatRoomMapViewEditObject && ChatRoomMapViewEditObject.Unique === true)
			for (let Pos = 0; Pos < ChatRoomData.MapData.Objects.length; Pos++)
				if (ChatRoomData.MapData.Objects.charCodeAt(Pos) === ChatRoomMapViewEditObject.ID)
					ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapViewObjectStartID) + ChatRoomData.MapData.Objects.substring(Pos + 1);
		for (let Pos of ChatRoomMapViewEditSelection) {
			ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapViewEditObject.ID) + ChatRoomData.MapData.Objects.substring(Pos + 1);
			if ("Unique" in ChatRoomMapViewEditObject && ChatRoomMapViewEditObject.Unique === true) break;
		}
		ChatRoomMapViewUpdateFlag();
	}

	// If the map was modified, we keep the previous version as backup so we can undo the changes
	if (JSON.stringify(Backup) != JSON.stringify(ChatRoomData.MapData)) {
		if (ChatRoomMapViewEditBackup.length > 100) ChatRoomMapViewEditBackup = ChatRoomMapViewEditBackup.slice(-100);
		ChatRoomMapViewEditBackup.push(Backup);
		// Update perception map after a change
		ChatRoomMapViewCalculatePerceptionMasks();
	}

}

/**
 * Mouse up event is used to stop drawing
 * @type {MouseEventListener}
 */
function ChatRoomMapViewMouseUp() {
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;
	ChatRoomMapViewEditStarted = false;
}

/**
 * Mouse wheel event is used to zoom the map
 * @type {MouseWheelEventListener}
 */
function ChatRoomMapViewMouseWheel(Event) {
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;
	if ((MouseX <= 1000) && (Event.deltaY < 0) && (ChatRoomMapViewPerceptionRange > ChatRoomMapViewPerceptionRangeMin)) ChatRoomMapViewPerceptionRange--;
	if ((MouseX <= 1000) && (Event.deltaY > 0) && (ChatRoomMapViewPerceptionRange < ChatRoomMapViewPerceptionRangeMax)) ChatRoomMapViewPerceptionRange++;
}

/**
 * Copies the current map in the clipboard.  Called from the chat field command "mapcopy"
 * @returns {void} - Nothing
 */
function ChatRoomMapViewCopy() {

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
function ChatRoomMapViewPaste(Param) {

	// Validates the data first
	if (typeof Param !== "string" || Param.length === 0) {
		ChatRoomSendLocal(TextGet("MapPasteError"));
		return;
	}

	// Only admins can paste/edit the map
	if (!ChatRoomPlayerIsAdmin()) {
		ChatRoomSendLocal(TextGet("MapPasteAdmin"));
		return;
	}

	// Try to decompress the data
	let DecompressedData = null;
	try {
		DecompressedData = LZString.decompressFromBase64(Param);
	} catch {
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
	} catch {
		MapData = null;
	}

	// If the map data is invalid
	if ((MapData == null) || (MapData.Tiles == null)) {
		ChatRoomSendLocal(TextGet("MapPasteError"));
		return;
	}

	// Loads the map and flags it to be refreshed
	ChatRoomData.MapData = MapData;
	ChatRoomMapViewUpdateFlag();
	ChatRoomMapViewCalculatePerceptionMasks();
	ChatRoomSendLocal(TextGet("MapPasteDone"));

}

/**
 * Make sure the whisper target is still valid on the map, and leave whipser mode if needed
 * @deprecated Unused
 * @returns {void} - Nothing
 */
function ChatRoomMapViewWhisperValid() {
	// No-oped in R104, automatically handled when a whisper tries to be sent
}
