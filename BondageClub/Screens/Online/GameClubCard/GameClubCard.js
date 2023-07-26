"use strict";
var GameClubCardBackground = "Sheet";
var GameClubCardEntryPlayerSlot = 0;

/**
 * Gets the current state of online Club Card.
 * @returns {OnlineGameStatus}
 */
function GameClubCardGetStatus() {
	if (Player.Game && Player.Game.ClubCard && ["", "Running"].includes(Player.Game.ClubCard.Status))
		return Player.Game.ClubCard.Status;
	return "";
}

/**
 * Set the current state of online Club Card.
 * @param {OnlineGameStatus} s
 * @returns {void}
 */
function GameClubCardSetStatus(s) {
	if (!["", "Running"].includes(s))
		return;

	if (Player.Game == null || Player.Game.ClubCard == null)
		ClubCardCommonLoad();

	/* @ts-ignore */
	Player.Game.ClubCard.Status = s;
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
}

/**
 * Checks if the character is an admin for the room/game.
 * @param {Character} C - Character to check for
 * @returns {boolean} -  Returns TRUE if that character is an admin/the game administrator
 */
function GameClubCardIsAdmin(C) {
	return (ChatRoomData.Admin.indexOf(C.MemberNumber) >= 0);
}

/**
 * Draws the Club Card icon of a character
 * @param {Character} C - Character for which to draw the icons
 * @param {number} X - Position on the X axis of the canvas
 * @param {number} Y - Position on the Y axis of the canvas
 * @param {number} Zoom - Zoom factor of the character
 * @returns {void} - Nothing
 */
function GameClubCardDrawIcon(C, X, Y, Zoom) {
	let Icon = 0;
	if ((C != null) && (C.Game != null) && (C.Game.ClubCard != null) && ((C.Game.ClubCard.PlayerSlot === 1) || (C.Game.ClubCard.PlayerSlot === 2))) Icon = C.Game.ClubCard.PlayerSlot;
	DrawImageZoomCanvas("Icons/ClubCard/PlayerSlot" + Icon.toString() + ".png", MainCanvas, 0, 0, 100, 100, X, Y, 100 * Zoom, 100 * Zoom);
}

/**
 * Draws the online game images/text needed on the characters
 * @param {Character} C - Character to draw the info for
 * @param {number} X - Position of the character the X axis
 * @param {number} Y - Position of the character the Y axis
 * @param {number} Zoom - Amount of zoom the character has (Height)
 * @returns {void} - Nothing
 */
function GameClubCardDrawCharacter(C, X, Y, Zoom) {
	if ((CurrentModule == "Online") && (CurrentScreen == "ChatRoom")) {
		GameClubCardDrawIcon(C, X + 70 * Zoom, Y + 800 * Zoom, Zoom);
	}
}

/**
 * Loads the online Club Card configuration screen.
 * @returns {void} - Nothing
 */
function GameClubCardLoad() {
	ClubCardCommonLoad();
	if (Player.Game == null) Player.Game = {};
	if (Player.Game.ClubCard.PlayerSlot == null) Player.Game.ClubCard.PlayerSlot = 0;
	GameClubCardEntryPlayerSlot = Player.Game.ClubCard.PlayerSlot;
}

/**
 * Runs the online Club Card configuration screen
 * @returns {void} - Nothing
 */
function GameClubCardRun() {
	DrawCharacter(Player, 50, 50, 0.9);
	DrawText(TextGet("Title"), 1100, 150, "Black", "Gray");
	DrawText(TextGet("SelectPlayerSlot"), 750, 300, "Black", "Gray");
	DrawText(TextGet((GameClubCardGetStatus() == "") ? "StartCondition" : "RunningGame"), 1100, 450, "Black", "Gray");
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	if (GameClubCardGetStatus() == "") DrawBackNextButton(1000, 268, 400, 64, TextGet("PlayerSlot" + Player.Game.ClubCard.PlayerSlot.toString()), "White", "", () => "", () => "");
	else DrawText(TextGet("PlayerSlot" + Player.Game.ClubCard.PlayerSlot.toString()), 1200, 300, "Black", "Gray");
	GameClubCardDrawIcon(Player, 1480, 210, 1.8);
	if (GameClubCardCanLaunchGame()) DrawButton(900, 600, 400, 64, TextGet("StartGame"), "White");
}

/**
 * Handles clicks in the online Club Card configuration screen
 * @returns {void} - Nothing
 */
function GameClubCardClick() {

	// When the user exits
	if (MouseIn(1815, 75, 90, 90)) GameClubCardExit();

	// When the user selects a new player slot
	if (MouseIn(1000, 268, 200, 64) && (GameClubCardGetStatus() == "")) {
		Player.Game.ClubCard.PlayerSlot--;
		if (Player.Game.ClubCard.PlayerSlot < 0) Player.Game.ClubCard.PlayerSlot = 2;
	}
	if (MouseIn(1200, 268, 200, 64) && (GameClubCardGetStatus() == "")) {
		Player.Game.ClubCard.PlayerSlot++;
		if (Player.Game.ClubCard.PlayerSlot > 2) Player.Game.ClubCard.PlayerSlot = 0;
	}

	// If the administrator wants to start the game
	if (MouseIn(900, 600, 400, 64) && GameClubCardCanLaunchGame()) {

		// Updates the player data
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		ChatRoomCharacterUpdate(Player);

		// Notices everyone in the room that the game starts
		const Dictionary = new DictionaryBuilder()
			.sourceCharacter(Player)
			.build();
		Dictionary.push({Tag: "SourceCharacter", Text: CharacterNickname(Player), MemberNumber: Player.MemberNumber});
		ServerSend("ChatRoomChat", { Content: "ClubCardGameStart", Type: "Action" , Dictionary: Dictionary});

		// Sends the 1st and 2nd players in the packet
		let P1 = -1;
		let P2 = -1;
		for (let C = 0; C < ChatRoomCharacter.length; C++) {
			if ((ChatRoomCharacter[C].Game != null) && (ChatRoomCharacter[C].Game.ClubCard != null) && (ChatRoomCharacter[C].Game.ClubCard.PlayerSlot === 1)) P1 = ChatRoomCharacter[C].MemberNumber;
			if ((ChatRoomCharacter[C].Game != null) && (ChatRoomCharacter[C].Game.ClubCard != null) && (ChatRoomCharacter[C].Game.ClubCard.PlayerSlot === 2)) P2 = ChatRoomCharacter[C].MemberNumber;
		}

		// Sends the start flag to everyone in the room
		ServerSend("ChatRoomGame", { GameProgress: "Start", Player1: P1, Player2: P2 });
		GameClubCardSetStatus("Running");
		ChatRoomCharacterUpdate(Player);
		CommonSetScreen("Online", "ChatRoom");

	}

}

/**
 * Triggered when the player exits the Club Card config screen.
 * @returns {void} - Nothing
 */
function GameClubCardExit() {

	// When the game isn't running, we allow to change the class or team
	if (GameClubCardGetStatus() == "") {

		// Notices everyone in the room of the change in the player slot
		if (GameClubCardEntryPlayerSlot != Player.Game.ClubCard.PlayerSlot) {
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.build();
			ServerSend("ChatRoomChat", { Content: "ClubCardNewPlayerSlot" + Player.Game.ClubCard.PlayerSlot.toString(), Type: "Action", Dictionary: Dictionary });
		}

		// Updates the player and go back to the chat room
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		ChatRoomCharacterUpdate(Player);

	}

	// Returns to the chat screen
	CommonSetScreen("Online", "ChatRoom");

}

/**
 * Checks there's 1 player in slot 1 and slot 2 so we can start the game.
 * @returns {boolean} - Returns TRUE if the game can be launched
 */
function GameClubCardCanLaunchGame() {
	let P1Count = 0;
	let P2Count = 0;
	if (GameClubCardGetStatus() != "") return false;
	if (!GameClubCardIsAdmin(Player)) return false;
	for (let C = 0; C < ChatRoomCharacter.length; C++) {
		if ((ChatRoomCharacter[C].Game != null) && (ChatRoomCharacter[C].Game.ClubCard != null) && (ChatRoomCharacter[C].Game.ClubCard.PlayerSlot === 1)) P1Count++;
		if ((ChatRoomCharacter[C].Game != null) && (ChatRoomCharacter[C].Game.ClubCard != null) && (ChatRoomCharacter[C].Game.ClubCard.PlayerSlot === 2)) P2Count++;
	}
	return ((P1Count == 1) && (P2Count == 1));
}

/**
 * Resets the online Club Card game so a new game might be started
 * @returns {void} - Nothing
 */
function GameClubCardReset() {
	GameClubCardSetStatus("");
}

/**
 * Ensure all character's Club Card game status are the same
 * @returns {void} - Nothing
 */
function GameClubCardLoadStatus() {
	for (let C = 0; C < ChatRoomCharacter.length; C++)
		if ((ChatRoomData.Admin.indexOf(ChatRoomCharacter[C].MemberNumber) >= 0) && (ChatRoomCharacter[C].Game != null) && (ChatRoomCharacter[C].Game.ClubCard != null) && (ChatRoomCharacter[C].Game.ClubCard.Status != "")) {
			GameClubCardSetStatus(ChatRoomCharacter[C].Game.ClubCard.Status);
			return;
		}
	GameClubCardReset();
}

/**
 * Processes the club card game data received from the server
 * @param {IChatRoomGameResponse} Packet - The data packet to process
 * @returns {void} - Nothing
 */
function GameClubCardProcess(Packet) {

	// Filters out invalid packets
	if ((Packet == null) || (Packet.Data == null) || (Packet.Sender == null)) return;

	// Finds the character that sent the packet
	let Char = null;
	for (let C = 0; C < ChatRoomCharacter.length; C++)
		if (ChatRoomCharacter[C].MemberNumber == Packet.Sender)
			Char = ChatRoomCharacter[C];
	if (Char == null) return;

	// If a room admin started the game
	if ((Packet.Data.GameProgress === "Start") && GameClubCardIsAdmin(Char)) {
		GameClubCardSetStatus("Running");
		MiniGameStart("ClubCard", 0, "GameClubCardEnd");
		ClubCardTurnIndex = Math.floor(Packet.RNG * 2);
		ClubCardPlayer[0].Deck = [];
		ClubCardPlayer[0].FullDeck = [];
		ClubCardPlayer[1].Deck = [];
		ClubCardPlayer[1].FullDeck = [];
		ClubCardOnlinePlayerMemberNumber1 = Packet.Data.Player1;
		ClubCardOnlinePlayerMemberNumber2 = Packet.Data.Player2;
		for (let C = 0; C < ChatRoomCharacter.length; C++) {
			if (ChatRoomCharacter[C].MemberNumber === Packet.Data.Player1) {
				ClubCardPlayer[0].Character = ChatRoomCharacter[C];
				ClubCardPlayer[0].Control = (ChatRoomCharacter[C].MemberNumber === Player.MemberNumber) ? "Player" : "Online";
			}
			if (ChatRoomCharacter[C].MemberNumber === Packet.Data.Player2) {
				ClubCardPlayer[1].Character = ChatRoomCharacter[C];
				ClubCardPlayer[1].Control = (ChatRoomCharacter[C].MemberNumber === Player.MemberNumber) ? "Player" : "Online";
			}
		}
		if (ClubCardPlayer[ClubCardTurnIndex].Character.MemberNumber == Player.MemberNumber)
			ClubCardLogPublish("StartOnline", ClubCardPlayer[ClubCardTurnIndex]);
		ElementRemove("InputChat");
		ElementRemove("TextAreaChatLog");
	}

	// If the game progresses, we sync it locally
	if ((Packet.Data.GameProgress === "Action") && (Packet.Sender != Player.MemberNumber)) {
		if (Packet.Data.CCPlayer != null) ClubCardPlayer = Packet.Data.CCPlayer;
		if (Packet.Data.CCLog != null) ClubCardLogAdd(Packet.Data.CCLog, false);
	}

}

/**
 * When the game ends, we go back to the online chat room
 * @returns {void} - Nothing
 */
function GameClubCardEnd() {
	CommonSetScreen("Online", "ChatRoom");
}
