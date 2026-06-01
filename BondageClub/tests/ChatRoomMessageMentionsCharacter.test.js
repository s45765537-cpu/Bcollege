"use strict";
const Game = require("./game");

const testCases = [
	// --- CHINESE (Simplified/Traditional) ---
	{
		char: { Name: "小明" },
		msg: "你好小明！",
		expected: true,
		desc: "Chinese attached to greeting",
	},
	{
		char: { Name: "小明" },
		msg: "我不认识小明月",
		expected: false,
		desc: "Chinese partial match (Ming vs Ming-Yue)",
	},

	// --- JAPANESE (Kanji/Hiragana/Katakana) ---
	{
		char: { Name: "田中" },
		msg: "田中さんはどこですか？",
		expected: true,
		desc: "Japanese name followed by honorific 'san'",
	},
	{
		char: { Name: "さくら" },
		msg: "まさくらばし",
		expected: false,
		desc: "Japanese name 'Sakura' inside 'Masakurabashi' (place name)",
	},

	// --- KOREAN (Hangul) ---
	{
		char: { Name: "민지" },
		msg: "민지야, 밥 먹었어?",
		expected: true,
		desc: "Korean name followed by vocative particle 'ya'",
	},
	{
		char: { Name: "민지" },
		msg: "시민지구",
		expected: false,
		desc: "Korean 'Minji' inside 'Civil District'",
	},

	// --- ENGLISH (Latin) ---
	{
		char: { Name: "Zoe" },
		msg: "Hello Zoe!",
		expected: true,
		desc: "English: Standard mention",
	},
	{
		char: { Name: "Zoe" },
		msg: "Is that a bozoe?",
		expected: false,
		desc: "English partial match inside word",
	},

	// --- NICKNAME CASE ---
	{
		char: { Name: "Juniper", Nickname: "June" },
		msg: "See you in June!",
		expected: true,
		desc: "Nickname matching the short version",
	},
];

describe("Game.ChatRoomMessageMentionsCharacter", () => {
	test.each(testCases)(
		"should return $expected when $desc",
		({ char, msg, expected }) => {
			const character = char;

			const result = Game.ChatRoomMessageMentionsCharacter(character, msg);

			expect(result).toBe(expected);
		},
	);
});
