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

Game.load("../Screens/Online/ChatRoom/ChatRoom.js");

describe("ChatRoomMessageMentionsCharacter", () => {
	it("should return true when Chinese name attached to greeting", () => {
		const character = { Name: "小明" };
		const msg = "你好小明！";
		const result = Game.ChatRoomMessageMentionsCharacter(character, msg);
		expect(result).toBe(true);
	});

	// Note: This test is commented out in the original
	xit("should return false when Chinese partial match (Ming vs Ming-Yue)", () => {
		const character = { Name: "小明" };
		const msg = "我不认识小明月";
		const result = Game.ChatRoomMessageMentionsCharacter(character, msg);
		expect(result).toBe(false);
	});

	// --- JAPANESE (Kanji/Hiragana/Katakana) ---
	it("should return true when Japanese name followed by honorific 'san'", () => {
		const character = { Name: "田中" };
		const msg = "田中さんはどこですか？";
		const result = Game.ChatRoomMessageMentionsCharacter(character, msg);
		expect(result).toBe(true);
	});

	it("should return false when Japanese name 'Sakura' inside 'Masakurabashi' (place name)", () => {
		const character = { Name: "さくら" };
		const msg = "まさくらばし";
		const result = Game.ChatRoomMessageMentionsCharacter(character, msg);
		expect(result).toBe(false);
	});

	// --- KOREAN (Hangul) ---
	it("should return true when Korean name followed by vocative particle 'ya'", () => {
		const character = { Name: "민지" };
		const msg = "민지야, 밥 먹었어?";
		const result = Game.ChatRoomMessageMentionsCharacter(character, msg);
		expect(result).toBe(true);
	});

	// --- ENGLISH (Latin) ---
	it("should return true when English standard mention", () => {
		const character = { Name: "Zoe" };
		const msg = "Hello Zoe!";
		const result = Game.ChatRoomMessageMentionsCharacter(character, msg);
		expect(result).toBe(true);
	});

	it("should return true when English standard mention with special characters 1", () => {
		const character = { Name: "𝒕𝒉𝒊𝒔" };
		const msg = "Hello this!";
		const result = Game.ChatRoomMessageMentionsCharacter(character, msg);
		expect(result).toBe(true);
	});

	it("should return true when English standard mention with special characters 2", () => {
		const character = { Name: "𝓉𝒽𝒾𝓈" };
		const msg = "Hello this!";
		const result = Game.ChatRoomMessageMentionsCharacter(character, msg);
		expect(result).toBe(true);
	});

	it("should return false when English partial match inside word", () => {
		const character = { Name: "Zoe" };
		const msg = "Is that a bozoe?";
		const result = Game.ChatRoomMessageMentionsCharacter(character, msg);
		expect(result).toBe(false);
	});

	// --- NICKNAME CASE ---
	it("should return true when nickname matches the short version", () => {
		const character = { Name: "Juniper", Nickname: "June" };
		const msg = "See you in June!";
		const result = Game.ChatRoomMessageMentionsCharacter(character, msg);
		expect(result).toBe(true);
	});
});
