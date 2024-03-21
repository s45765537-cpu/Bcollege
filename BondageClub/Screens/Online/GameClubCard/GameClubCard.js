"use strict";
var GameClubCardBackground = "Sheet";
var GameClubCardEntryPlayerSlot = 0;
var GameClubCardExpectQuery = false;
var GameClubCardQueryAdmin = false;

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
 * @param {OnlineGameStatus} NewStatus
 * @returns {void}
 */
function GameClubCardSetStatus(NewStatus) {

	if (!["", "Running"].includes(NewStatus)) return;

	let ForceUpdate = false;
	if (Player.Game == null || Player.Game.ClubCard == null) {
		ForceUpdate = true;
		ClubCardCommonLoad();
	}

	if (ForceUpdate || (NewStatus !== Player.Game.ClubCard.Status)) {
		Player.Game.ClubCard.Status = NewStatus;
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	}

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
	GameClubCardExpectQuery = false;
	GameClubCardQueryAdmin = false;
	if (Player.Game.ClubCard.PlayerSlot == null) Player.Game.ClubCard.PlayerSlot = 0;
	GameClubCardEntryPlayerSlot = Player.Game.ClubCard.PlayerSlot;
	GameClubCardLoadStatus();
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
	if (GameClubCardCanJoinGame()) DrawButton(900, 600, 400, 64, TextGet("JoinGame"), "White");
	if ((GameClubCardGetStatus() == "Running") && !GameClubCardCanJoinGame()) DrawText(TextGet("CannotJoinDetails"), 1100, 600, "Red", "Gray");
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
		GameClubCardQueryAdmin = true;
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
		return;

	}

	// If a player wants to join the game, we send a query to the room admin
	if (MouseIn(900, 600, 400, 64) && GameClubCardCanJoinGame()) {
		ServerSend("ChatRoomGame", { GameProgress: "Query" });
		CommonSetScreen("Online", "ChatRoom");
		GameClubCardExpectQuery = true;
		return;
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
 * Returns TRUE if the game is running and can be joined
 * @returns {boolean} - TRUE if the player can join
 */
function GameClubCardCanJoinGame() {
	if (GameClubCardCanLaunchGame()) return false;
	for (let C = 0; C < ChatRoomCharacter.length; C++)
		if ((ChatRoomData.Admin.indexOf(ChatRoomCharacter[C].MemberNumber) >= 0) && (Player.MemberNumber != ChatRoomCharacter[C].MemberNumber) && (ChatRoomCharacter[C].Game != null) && (ChatRoomCharacter[C].Game.ClubCard != null) && (ChatRoomCharacter[C].Game.ClubCard.Status == "Running"))
			return true;
	return false;
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
 * Creates a bundle of cards in a string to push to the server.
 * @param {ClubCard[]} Cards - An array of c
 * @param {boolean} IncludeTime - If we must include the time property
 * @returns {string} - A string with all the cards
 */
function GameClubCardDoBundle(Cards, IncludeTime = false) {
	let Result = "";
	if (Cards != null)
		for (let C of Cards)
			Result = Result + String.fromCharCode(C.ID) + (IncludeTime ? ((C.Time == null) ? "N" : C.Time.toString()) : "");
	return Result;
}

/**
 * Processes the club card game data received from the server
 * @param {string} Bundle - An array of c
 * @param {boolean} IncludeTime - If we must include the time property
 * @param {string} Location - The location of the card
 * @returns {ClubCard[]} - A string with all the cards
 */
function GameClubCardUndoBundle(Bundle, IncludeTime = false, Location = null) {
	let Result = [];
	let Card;
	let CardMode = true;
	if (Bundle != null)
		for (let B of Bundle) {
			if (CardMode) {
				let D = B.charCodeAt(0);
				for (let C of ClubCardList)
					if (C.ID == D) {
						Card = {...C};
						if (Card.Type == null) Card.Type = "Member";
						if (Location != null) Card.Location = Location;
						Result.push(Card);
						break;
					}
				if (IncludeTime) CardMode = false;
			} else {
				if (CommonIsNumeric(B)) Card.Time = parseInt(B);
				CardMode = true;
			}
		}
	return Result;
}

/**
 * Loads the full server bundle for a player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {any} Bundle - An array of c
 * @returns {void} - Nothing
 */
function GameClubCardLoadBundle(CCPlayer, Bundle) {
	let Location = (Bundle.MemberNumber === Player.MemberNumber) ? "PlayerBoard" : "OpponentBoard";
	if (Bundle.Level != null) CCPlayer.Level = Bundle.Level;
	if (Bundle.Fame != null) CCPlayer.Fame = Bundle.Fame;
	if (Bundle.Money != null) CCPlayer.Money = Bundle.Money;
	if (Bundle.LastFamePerTurn != null) CCPlayer.LastFamePerTurn = Bundle.LastFamePerTurn;
	if (Bundle.LastMoneyPerTurn != null) CCPlayer.LastMoneyPerTurn = Bundle.LastMoneyPerTurn;
	if (Bundle.FullDeck != null) CCPlayer.FullDeck = GameClubCardUndoBundle(Bundle.FullDeck);
	if (Bundle.Deck != null) CCPlayer.Deck = GameClubCardUndoBundle(Bundle.Deck);
	if (Bundle.Hand != null) CCPlayer.Hand = GameClubCardUndoBundle(Bundle.Hand);
	if (Bundle.Board != null) CCPlayer.Board = GameClubCardUndoBundle(Bundle.Board, false, Location);
	if (Bundle.Event != null) CCPlayer.Event = GameClubCardUndoBundle(Bundle.Event, true, Location);
	if (Bundle.Playing) ClubCardTurnIndex = CCPlayer.Index;
}

/**
 * Assigns both club card players based on the players selection
 * @param {ServerChatRoomGameResponse} Packet - The data packet to process
 * @param {Character} Char - The character that's sending the packet
 * @returns {void} - Nothing
 */
function GameClubCardAssignPlayers(Packet, Char) {
	if (CurrentScreen === "ChatAdmin") ChatAdminExit();
	if (CurrentScreen === "FriendList") FriendListExit();
	if (CurrentScreen === "Preference") PreferenceExit();
	let Msg = TextGet("SelectedPlayerToStart");
	GameClubCardSetStatus("Running");
	MiniGameStart("ClubCard", 0, "GameClubCardEnd");
	ClubCardPlayer[0].Deck = [];
	ClubCardPlayer[0].FullDeck = [];
	ClubCardPlayer[1].Deck = [];
	ClubCardPlayer[1].FullDeck = [];
	ClubCardOnlinePlayerMemberNumber1 = Packet.Data.Player1;
	ClubCardOnlinePlayerMemberNumber2 = Packet.Data.Player2;
	let C1 = null;
	let C2 = null;
	for (let C = 0; C < ChatRoomCharacter.length; C++) {
		if (ChatRoomCharacter[C].MemberNumber === Packet.Data.Player1) C1 = ChatRoomCharacter[C];
		if (ChatRoomCharacter[C].MemberNumber === Packet.Data.Player2) C2 = ChatRoomCharacter[C];
	}
	if (C1.IsPlayer()) {
		ClubCardPlayer[0].Character = C1;
		ClubCardPlayer[0].Control = "Player";
		ClubCardPlayer[1].Character = C2;
		ClubCardPlayer[1].Control = "Online";
		ClubCardTurnIndex = Math.floor(Packet.RNG * 2);
	} else if (C2.IsPlayer()) {
		ClubCardPlayer[0].Character = C2;
		ClubCardPlayer[0].Control = "Player";
		ClubCardPlayer[1].Character = C1;
		ClubCardPlayer[1].Control = "Online";
		ClubCardTurnIndex = 1 - Math.floor(Packet.RNG * 2);
	} else {
		ClubCardPlayer[0].Character = C1;
		ClubCardPlayer[0].Control = "Online";
		ClubCardPlayer[1].Character = C2;
		ClubCardPlayer[1].Control = "Online";
		ClubCardTurnIndex = Math.floor(Packet.RNG * 2);
		ClubCardDestroyPopup();
	}
	if ((Char.MemberNumber == Player.MemberNumber) && (ClubCardTurnIndex == 0)) ClubCardLogAdd(Msg.replace("PLAYERNAME", CharacterNickname(C1)));
	if ((Char.MemberNumber == Player.MemberNumber) && (ClubCardTurnIndex == 1)) ClubCardLogAdd(Msg.replace("PLAYERNAME", CharacterNickname(C2)));

	if (Player.ChatSettings?.PreserveChat ?? true) {
		ChatRoomHideElements();
	} else {
		ElementRemove("InputChat");
		ElementRemove("TextAreaChatLog");
	}
}

/**
 * Loads the club card game data
 * @param {ServerChatRoomGameResponse} Packet - The data packet to process
 * @returns {void} - Nothing
 */
function GameClubCardLoadData(Packet) {
	if (ClubCardPlayer.length < 2 || !ClubCardPlayer[0] || !ClubCardPlayer[1]) {
		return;
	}

	if (Packet.Data.CCData != null) {
		for (let P of Packet.Data.CCData) {
			if (P.MemberNumber == ClubCardPlayer[0].Character.MemberNumber) GameClubCardLoadBundle(ClubCardPlayer[0], P);
			if (P.MemberNumber == ClubCardPlayer[1].Character.MemberNumber) GameClubCardLoadBundle(ClubCardPlayer[1], P);
		}
	}
	if (Packet.Data.CCLog != null) ClubCardLogAdd(Packet.Data.CCLog, false);

	// Check the focused card is still in the player's hand
	ClubCardDefocusCardIfDiscarded();

	// Check if either player has now won
	ClubCardCheckVictory(ClubCardPlayer[0]);
	ClubCardCheckVictory(ClubCardPlayer[1]);
}

/**
 * Processes the club card game data received from the server
 * @param {ServerChatRoomGameResponse} Packet - The data packet to process
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
	if ((Packet.Data.GameProgress === "Start") && GameClubCardIsAdmin(Char))
		GameClubCardAssignPlayers(Packet, Char);

	// If a player wants to query the game status to join it
	if ((Packet.Data.GameProgress === "Query") && (Packet.Sender != Player.MemberNumber) && GameClubCardExpectQuery) {
		let Msg = TextGet("JoinedClubCardGame");
		GameClubCardAssignPlayers(Packet, Char);
		GameClubCardLoadData(Packet);
		ClubCardLogAdd(Msg.replace("PLAYERNAME", CharacterNickname(Player)));
		GameClubCardExpectQuery = false;
		ClubCardDestroyPopup();
	}

	// If the admin must send the current state of the game to the player
	if ((Packet.Data.GameProgress === "Query") && (Packet.Sender != Player.MemberNumber) && GameClubCardQueryAdmin)
		GameClubCardSyncOnlineData("Query");

	// If the game progresses from the other player, we sync it locally
	if ((Packet.Data.GameProgress === "Action") && (Packet.Sender != Player.MemberNumber))
		GameClubCardLoadData(Packet);

}

/**
 * Syncs the online data with all players
 * @param {string} Progress - The progress status to push (default to action)
 * @param {boolean} LocalPlayerOnly - If true, send only the local player. Otherwise, send both.
 * @returns {void} - Nothing
 */
function GameClubCardSyncOnlineData(Progress = "Action", LocalPlayerOnly = false) {
	if (!ClubCardIsOnline()) return;
	let Packet = [];
	for (let CCPlayer of ClubCardPlayer) {
		if (LocalPlayerOnly && CCPlayer.Character.MemberNumber !== Player.MemberNumber) continue;
		Packet.push({
			MemberNumber: CCPlayer.Character.MemberNumber,
			Playing: (CCPlayer.Index == ClubCardTurnIndex),
			Level: CCPlayer.Level,
			Fame: CCPlayer.Fame,
			Money: CCPlayer.Money,
			LastFamePerTurn: CCPlayer.LastFamePerTurn,
			LastMoneyPerTurn: CCPlayer.LastMoneyPerTurn,
			FullDeck: GameClubCardDoBundle(CCPlayer.FullDeck),
			Deck: GameClubCardDoBundle(CCPlayer.Deck),
			Hand: GameClubCardDoBundle(CCPlayer.Hand),
			Board: GameClubCardDoBundle(CCPlayer.Board),
			Event: GameClubCardDoBundle(CCPlayer.Event, true)
		});
	}
	if (Progress == "Action") ServerSend("ChatRoomGame", { GameProgress: Progress, CCData: Packet });
	if (Progress == "Query") ServerSend("ChatRoomGame", { GameProgress: Progress, CCData: Packet, Player1: ClubCardOnlinePlayerMemberNumber1, Player2: ClubCardOnlinePlayerMemberNumber2 });
}

/**
 * When the game ends, we go back to the online chat room
 * @returns {void} - Nothing
 */
function GameClubCardEnd() {
	CommonSetScreen("Online", "ChatRoom");
}
