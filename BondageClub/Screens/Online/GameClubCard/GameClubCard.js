"use strict";
var GameClubCardBackground = "Sheet";
var GameClubCardEntryPlayerSlot = 0;
var GameClubCardExpectQuery = false;
var GameClubCardQueryAdmin = false;
var GameClubCardChangedRunningSettings = false;

/**
 * Gets the current state of online Club Card.
 * @returns {OnlineGameStatus}
 */
function GameClubCardGetStatus() {
	if (Player.Game.ClubCard && ["", "Running"].includes(Player.Game.ClubCard?.Status ?? ""))
		return Player.Game.ClubCard.Status ?? "";
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

	if (ForceUpdate || (NewStatus !== Player.Game.ClubCard?.Status)) {
		if (Player.Game.ClubCard)
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
	return CommonIsNumeric(C.MemberNumber) && (ChatRoomData?.Admin.includes(C.MemberNumber) ?? false);
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
	if (ServerPlayerIsInChatRoom()) {
		GameClubCardDrawIcon(C, X + 70 * Zoom, Y + 800 * Zoom, Zoom);
	}
}

/**
 * Loads the online Club Card configuration screen.
 * @type {ScreenLoadHandler}
 */
async function GameClubCardLoad() {
	ClubCardCommonLoad();
	GameClubCardExpectQuery = false;
	GameClubCardQueryAdmin = false;
	GameClubCardChangedRunningSettings = false;
	if (Player.Game.ClubCard) {
		Player.Game.ClubCard.PlayerSlot ??= 0;
		GameClubCardEntryPlayerSlot = Player.Game.ClubCard.PlayerSlot;
	}
	GameClubCardLoadStatus();
}

/**
 * Runs the online Club Card configuration screen
 * @returns {void} - Nothing
 */
function GameClubCardRun() {
	if (!Player.Game.ClubCard) return;
	DrawCharacter(Player, 50, 50, 0.9);
	DrawText(TextGet("Title"), 1100, 150, "Black", "Gray");
	DrawText(TextGet("SelectPlayerSlot"), 750, 300, "Black", "Gray");
	DrawText(TextGet((GameClubCardGetStatus() == "") ? "StartCondition" : "RunningGame"), 1100, 450, "Black", "Gray");
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	if (GameClubCardGetStatus() == "") DrawBackNextButton(1000, 268, 400, 64, TextGet("PlayerSlot" + Player.Game.ClubCard.PlayerSlot?.toString()), "White", "", () => "", () => "");
	else DrawText(TextGet("PlayerSlot" + Player.Game.ClubCard.PlayerSlot?.toString()), 1200, 300, "Black", "Gray");
	GameClubCardDrawIcon(Player, 1480, 210, 1.8);
	if (GameClubCardCanLaunchGame()) DrawButton(900, 640, 400, 64, TextGet("StartGame"), "White");
	if (GameClubCardCanJoinGame()) DrawButton(900, 640, 400, 64, TextGet("JoinGame"), "White");
	if ((GameClubCardGetStatus() == "Running") && !GameClubCardCanJoinGame()) DrawText(TextGet("CannotJoinDetails"), 1100, 600, "Red", "Gray");
	if (GameClubCardIsAdmin(Player)) DrawButton(900, 720, 400, 64, TextGet("ResetGame"), "Salmon");


	// Ensure Settings object exists
	Player.Game.ClubCard.Settings ??= {};

	//Auto Spectate Toggle
	Player.Game.ClubCard.Settings.AutoSpectate ??= true;
	DrawCheckbox(900, 800, 60, 60, "", Player.Game.ClubCard.Settings.AutoSpectate);
	DrawTextWrap(TextGet("AutoSpectate"), 970, 800, 350, 60, "Black");

	//Animation Toggle
	Player.Game.ClubCard.Settings.IsAnimation ??= true;
	DrawCheckbox(900, 880, 60, 60, "", Player.Game.ClubCard.Settings.IsAnimation);
	DrawTextWrap(TextGet("IsAnimation"), 970, 880, 350, 60, "Black");
}

/**
 * Handles clicks in the online Club Card configuration screen
 * @returns {void} - Nothing
 */
function GameClubCardClick() {
	if (!Player.Game.ClubCard) return;
	Player.Game.ClubCard.PlayerSlot ??= 0;
	// When the user exits
	if (MouseIn(1815, 75, 90, 90)) GameClubCardExit();

	// When the user selects a new player slot
	if (MouseIn(1000, 268, 200, 64) && (GameClubCardGetStatus() == "")) {
		Player.Game.ClubCard.PlayerSlot = CommonModulo(--Player.Game.ClubCard.PlayerSlot, 3);
	}
	if (MouseIn(1200, 268, 200, 64) && (GameClubCardGetStatus() == "")) {
		Player.Game.ClubCard.PlayerSlot = CommonModulo(++Player.Game.ClubCard.PlayerSlot, 3);
	}

	// If the administrator wants to start the game
	if (MouseIn(900, 640, 400, 64) && GameClubCardCanLaunchGame()) {

		// Updates the player data
		GameClubCardQueryAdmin = true;

		// Sends the 1st and 2nd players in the packet
		let P1 = ChatRoomCharacter.find(c => c.Game?.ClubCard?.PlayerSlot === 1)?.MemberNumber ?? -1;
		let P2 = ChatRoomCharacter.find(c => c.Game?.ClubCard?.PlayerSlot === 2)?.MemberNumber ?? -1;

		GameClubCardExit();

		// We do that after exiting so the final Game update gets sent
		if (P1 !== -1 && P2 !== -1) {
			GameClubCardSetStatus("Running");
			ServerSend("ChatRoomGame", { GameProgress: "Start", Player1: P1, Player2: P2 });

			// Notify everyone in the room that the game is starting
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.build();
			ServerSend("ChatRoomChat", { Content: "ClubCardGameStart", Type: "Action", Dictionary: Dictionary});
		}
		return;
	}

	// If a player wants to join the game, we send a query to the room admin
	if (MouseIn(900, 640, 400, 64) && GameClubCardCanJoinGame()) {
		ServerSend("ChatRoomGame", { GameProgress: "Query" });
		GameClubCardExpectQuery = true;
		if (GameClubCardIsAdmin(Player)) GameClubCardQueryAdmin = true;
		GameClubCardExit();
		return;
	}

	//If the admin clicked reset game status for all players and sends message.
	if (MouseIn(900, 720, 400, 64) && GameClubCardIsAdmin(Player)) {
		ClubCardSendRequestResetGame();
	}

	if (MouseIn(900, 800, 400, 64)) {
		if (Player.Game.ClubCard.Settings)
			Player.Game.ClubCard.Settings.AutoSpectate = !Player.Game.ClubCard.Settings.AutoSpectate;
		GameClubCardChangedRunningSettings = true;
	}

	if (MouseIn(900, 880, 60, 60)) {
		if (Player.Game.ClubCard.Settings)
			Player.Game.ClubCard.Settings.IsAnimation = !Player.Game.ClubCard.Settings.IsAnimation;
		GameClubCardChangedRunningSettings = true;
	}
}

/**
 * Triggered when the player exits the Club Card config screen.
 * @type {ScreenExitHandler}
 */
function GameClubCardExit() {

	if (GameClubCardGetStatus() == "" || GameClubCardChangedRunningSettings) {

		if (!Player.Game.ClubCard) return;

		// Inform everyone in the room that we changed our player slot
		if (GameClubCardEntryPlayerSlot !== Player.Game.ClubCard.PlayerSlot) {
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.build();
			ServerSend("ChatRoomChat", { Content: "ClubCardNewPlayerSlot" + Player.Game.ClubCard.PlayerSlot?.toString(), Type: "Action", Dictionary: Dictionary });
		}

		// This is only safe because the UI locks up player slot changes if a game is running
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		ChatRoomCharacterUpdate(Player);
	}

	CommonSetScreen("Online", "ChatRoom");
}

/**
 *  Checks there's 1 player in slot 1 and slot 2 so we can start the game.
 * @returns {boolean} - Returns TRUE if the game can be launched
 */
function GameClubCardCanLaunchGame() {
	let P1Count = 0;
	let P2Count = 0;
	if (GameClubCardGetStatus() != "") return false;
	if (!GameClubCardIsAdmin(Player)) return false;
	for (const char of ChatRoomCharacter) {
		if (char.Game?.ClubCard?.PlayerSlot === 1) P1Count++;
		if (char.Game?.ClubCard?.PlayerSlot === 2) P2Count++;

	}
	return ((P1Count == 1) && (P2Count == 1));
}

/**
 * Returns TRUE if the game is running and can be joined
 * @returns {boolean} - TRUE if the player can join
 */
function GameClubCardCanJoinGame() {
	return GameClubCardCanLaunchGame()
		&& ChatRoomCharacter.some(char =>
			Player.MemberNumber !== char.MemberNumber
			&& ChatRoomCharacterIsAdmin(char)
			&& char.Game?.ClubCard?.Status === "Running"
		);
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
	for (const char of ChatRoomCharacter) {
		if (ChatRoomCharacterIsAdmin(char) && char.Game?.ClubCard?.Status !== "") {
			GameClubCardSetStatus(char.Game?.ClubCard?.Status ?? "");
			return;
		}
	}
	GameClubCardReset();
}

/**
 * Creates a bundle of cards in a string to push to the server.
 * @param {readonly ClubCard[]} Cards - An array of c
 * @param {boolean} IncludeTime - If we must include the time property
 * @returns {string} - A string with all the cards
 */
function GameClubCardDoBundle(Cards, IncludeTime = false) {
	let Result = "";
	if (Cards != null) {
		for (let C of Cards) {
			let encodedCard = String.fromCharCode(C.ID) + "|" + C.UniqueID;
			if (IncludeTime) {
				encodedCard += "|" + (C.Time == null ? "N" : C.Time.toString());
			}
			Result += encodedCard + ";";
		}
	}
	return Result;
}

/**
 * Creates a bundle of cards in a string to push to the server.
 * @param {readonly ClubCard[]} Cards - An array of ClubCard objects
 * @returns {string} - A string with all the cards
 */
function GameClubCardBoardDoBundle(Cards) {
	let Result = "";

	for (let i = 0; i < Cards.length; i++) {
		const card = Cards[i];

		let ID = `${card.ID}`;
		let ArrayIndex = `${card.ArrayIndex !== undefined ? card.ArrayIndex : ''}`;
		let MoneyPerTurn = `${card.MoneyPerTurn !== undefined ? card.MoneyPerTurn : ''}`;
		let FamePerTurn = `${card.FamePerTurn !== undefined ? card.FamePerTurn : ''}`;
		let Time = `${card.Time !== undefined ? card.Time : ''}`;
		let Negated = `${card.Negated !== undefined ? card.Negated : ''}`;
		let Negating = `${card.Negating !== undefined ? card.Negating : ''}`;
		let EffectKey = `${card.EffectKey !== undefined ? card.EffectKey : ''}`;
		let CanActive = `${card.CanActive !== undefined ? card.CanActive : ''}`;
		let UniqueID = `${card.UniqueID !== undefined ? card.UniqueID : ''}`;
		let Group = card.Group && card.Group.length ? card.Group.join('|') : '';

		Result += `${ID},${ArrayIndex},${MoneyPerTurn},${FamePerTurn},${Time},${Negated},${Negating},${EffectKey},${CanActive},${UniqueID},${Group};`;
	}

	if (Result.endsWith(";")) {
		Result = Result.slice(0, -1);
	}

	return Result;
}

/**
 * Creates a bundle of cards in a string to push to the server.
 * @param {readonly ClubCard[]} Cards - An array of ClubCard objects
 * @returns {string} - A string with all the cards
 */
function GameClubCardHandDoBundle(Cards) {
	let Result = "";
	if (Cards != null) {
		for (let C of Cards) {
			let encodedCard = String.fromCharCode(C.ID) + "|" + C.UniqueID + "|" + `${C.Revealed !== undefined ? C.Revealed : ''}`;
			Result += encodedCard + ";";
		}
	}
	return Result;
}

/**
 * @param {string} Bundle
 * @param {boolean} [IncludeTime]
 * @param {string | null} [Location]
 * @returns {ClubCard[]}
 */
function GameClubCardUndoBundle(Bundle, IncludeTime = false, Location = null) {
	/** @type {ClubCard[]} */
	let Result = [];
	if (!Bundle) return Result;

	let Entries = Bundle.split(";");
	for (let Entry of Entries) {
		if (!Entry) continue;
		let Parts = Entry.split("|");

		let CardID = Parts[0].charCodeAt(0);
		let UniqueID = Parts[1];

		let Card = ClubCardList.find(C => C.ID === CardID);
		if (Card) {
			let NewCard = { ...Card, UniqueID };
			if (Location) NewCard.Location = Location;
			if (IncludeTime && Parts.length > 2 && CommonIsNumeric(Parts[2])) {
				NewCard.Time = parseInt(Parts[2]);
			}
			Result.push(NewCard);
		}
	}
	return Result;
}

/**
 * Parses a string to return an updated array of ClubCard objects.
 * @param {string} bundle - A string containing all the cards
 * @param {string} Location - The location of the card
 * @returns {ClubCard[]} - An array of updated ClubCard objects
 */
function GameClubCardBoardUndoBundle(bundle, Location) {
	const cards = bundle.split(';');
	const result = [];

	for (let i = 0; i < cards.length; i++) {
		const cardString = cards[i];
		const [ID, ArrayIndex, MoneyPerTurn, FamePerTurn, Time, Negated, Negating, EffectKey, CanActive, UniqueID, Group] = cardString.split(',');

		const existingCard = ClubCardList.find(card => card.ID === Number(ID));

		if (existingCard) {
			const card = { ...existingCard };

			if (card.Type == null) card.Type = "Member";
			if (Location != null) card.Location = Location;

			if (ArrayIndex != undefined && ArrayIndex != '') card.ArrayIndex = Number(ArrayIndex);
			if (MoneyPerTurn != undefined && MoneyPerTurn != '') card.MoneyPerTurn = Number(MoneyPerTurn);
			if (FamePerTurn != undefined && FamePerTurn != '') card.FamePerTurn = Number(FamePerTurn);
			if (Time != undefined && Time != '') card.Time = Number(Time);
			if (Negated != undefined && Negated != '') card.Negated = Boolean(Negated);
			if (Negating != undefined && Negating != '') card.Negating = Negating;
			if (EffectKey != undefined && EffectKey != '') card.EffectKey = Number(EffectKey);
			if (CanActive != undefined && CanActive != '') card.CanActive = (CanActive === "true");
			if (UniqueID != undefined && UniqueID != '') card.UniqueID = UniqueID;
			if (Group) card.Group = /** @type {ClubCardGroup[]} */ (Group.split('|'));

			result.push(card);
		}
	}

	return result;
}

/**
 *
 * @param {string} Bundle
 * @param {string | null} [Location]
 * @returns {ClubCard[]}
 */
function GameClubCardHandUndoBundle(Bundle, Location = null) {
	/** @type {ClubCard[]} */
	let Result = [];
	if (!Bundle) return Result;

	let Entries = Bundle.split(";");
	for (let Entry of Entries) {
		if (!Entry) continue;
		let Parts = Entry.split("|");

		let CardID = Parts[0].charCodeAt(0);
		let UniqueID = Parts[1];
		let Revealed = Boolean(Parts[2]);

		let Card = ClubCardList.find(C => C.ID === CardID);
		if (Card) {
			let NewCard = { ...Card, UniqueID };
			if (Revealed) NewCard.Revealed = Revealed;
			Result.push(NewCard);
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
	if (Bundle.DiscardPile != null) CCPlayer.DiscardPile = GameClubCardUndoBundle(Bundle.DiscardPile, false, Location);
	if (Bundle.Playing) ClubCardTurnIndex = CCPlayer.Index;
	if (Bundle.CardsPlayedThisTurn != null) CCPlayer.CardsPlayedThisTurn = Bundle.CardsPlayedThisTurn;
	if (Bundle.CardsPlayedThisTurn !== null) CCPlayer.ClubCardTurnCounter = Bundle.ClubCardTurnCounter;
	if (Bundle.Sleeve !== null) CCPlayer.Sleeve = Bundle.Sleeve;

	//###
	if (Bundle.Hand != null) CCPlayer.Hand = GameClubCardHandUndoBundle(Bundle.Hand);
	if (Bundle.Board != null) CCPlayer.Board = GameClubCardBoardUndoBundle(Bundle.Board, Location);
	if (Bundle.Event != null) CCPlayer.Event = GameClubCardBoardUndoBundle(Bundle.Event, Location);
	//Check that if the user has the selected ClubCardFocus card, we hide its original.
	if (ClubCardIsAnimationOn && ClubCardFocus) {
		let targetCard = [CCPlayer.Hand, CCPlayer.Board, CCPlayer.Event].
			flatMap(collection => collection || []).
			find(card => card.UniqueID === ClubCardFocus?.UniqueID);

		if (targetCard) targetCard.IsVisible = false;
	}
	//###
}

/**
 * Assigns both club card players based on the players selection
 * @param {ServerGameClubCardDataStart | ServerGameClubCardDataQueryResponse} data - The data packet to process
 * @param {number} rng
 * @param {Character} Char - The character that's sending the packet
 * @returns {void} - Nothing
 */
function GameClubCardAssignPlayers(data, rng, Char) {
	ClubCardPlayer[0].Deck = [];
	ClubCardPlayer[0].FullDeck = [];
	ClubCardPlayer[1].Deck = [];
	ClubCardPlayer[1].FullDeck = [];
	const C1 = ChatRoomCharacter.find(c => c.MemberNumber === data.Player1);
	const C2 = ChatRoomCharacter.find(c => c.MemberNumber === data.Player2);
	if (!C1 || !C2) return;
	ClubCardOnlinePlayerMemberNumber1 = data.Player1;
	ClubCardOnlinePlayerMemberNumber2 = data.Player2;
	if (C1?.IsPlayer()) {
		ClubCardPlayer[0].Character = C1;
		ClubCardPlayer[0].Control = "Player";
		ClubCardPlayer[1].Character = C2;
		ClubCardPlayer[1].Control = "Online";
		ClubCardTurnIndex = Math.floor(rng * 2);
	} else if (C2?.IsPlayer()) {
		ClubCardPlayer[0].Character = C2;
		ClubCardPlayer[0].Control = "Player";
		ClubCardPlayer[1].Character = C1;
		ClubCardPlayer[1].Control = "Online";
		ClubCardTurnIndex = 1 - Math.floor(rng * 2);
	} else {
		ClubCardPlayer[0].Character = C1;
		ClubCardPlayer[0].Control = "Online";
		ClubCardPlayer[1].Character = C2;
		ClubCardPlayer[1].Control = "Online";
		ClubCardTurnIndex = Math.floor(rng * 2);
		ClubCardDestroyPopup();
	}
	if (ClubCardPopup?.Mode != "DECK") ElementRemove("DefaultDecksDropdown");

	if ((Char.MemberNumber == Player.MemberNumber) && (ClubCardTurnIndex == 0)) {
		ClubCardMessageAdd(ClubCardMessageType.SYSTEM, "SelectedPlayerToStart", { "PLAYERNAME": CharacterNickname(C1) });
	}
	if ((Char.MemberNumber == Player.MemberNumber) && (ClubCardTurnIndex == 1)) {
		ClubCardMessageAdd(ClubCardMessageType.SYSTEM, "SelectedPlayerToStart", { "PLAYERNAME": CharacterNickname(C2) });
	}
}

/**
 * Loads the club card game data
 * @param {ServerGameClubCardDataQueryResponse | ServerGameClubCardDataAction} data - The data packet to process
 * @returns {void} - Nothing
 */
function GameClubCardLoadData(data) {
	if (ClubCardPlayer.length < 2 || !ClubCardPlayer[0] || !ClubCardPlayer[1]) {
		return;
	}

	if (data.CCData != null) {
		for (let P of data.CCData) {
			if (P.MemberNumber == ClubCardPlayer[0].Character.MemberNumber) GameClubCardLoadBundle(ClubCardPlayer[0], P);
			if (P.MemberNumber == ClubCardPlayer[1].Character.MemberNumber) GameClubCardLoadBundle(ClubCardPlayer[1], P);
		}
	}
	if ("CCLog" in data && data.CCLog) ClubCardMessageSend(data.CCLog, false);

	// Check the focused card is still in the player's hand / board
	ClubCardDefocusCardIfDiscarded();
	ClubCardDefocusCardIfRemoved();

	// Check if either player has now won
	ClubCardCheckVictory(ClubCardPlayer[0]);
	ClubCardCheckVictory(ClubCardPlayer[1]);
}

/**
 *
 * @param {unknown} data
 * @returns {data is ServerGameClubCardDataStart}
 */
function ClubCardIsStartPacket(data) {
	const obj = /** @type {ServerGameClubCardDataStart} */ (data);
	return CommonIsObject(obj)
		&& obj.GameProgress === "Start"
		&& CommonIsNonNegativeInteger(obj.Player1)
		&& CommonIsNonNegativeInteger(obj.Player2);
}

/**
 * @param {unknown} data
 * @returns {data is ServerGameClubCardDataQueryRequest}
 */
function ClubCardIsQueryRequestPacket(data) {
	const obj = /** @type {ServerGameClubCardDataQueryRequest} */ (data);
	return CommonIsObject(obj)
		&& Object.keys(obj).length === 1
		&& obj.GameProgress === "Query";
}

/**
 *
 * @param {unknown} data
 * @returns {data is ServerGameClubCardDataQueryResponse}
 */
function ClubCardIsQueryResponsePacket(data) {
	const obj = /** @type {ServerGameClubCardDataQueryResponse} */ (data);
	return CommonIsObject(obj)
		&& obj.GameProgress === "Query"
		&& Array.isArray(obj.CCData)
		&& CommonIsNonNegativeInteger(obj.Player1)
		&& CommonIsNonNegativeInteger(obj.Player2);
}

/**
 *
 * @param {unknown} data
 * @returns {data is ServerGameClubCardDataAction}
 */
function ClubCardIsActionPacket(data) {
	const obj = /** @type {ServerGameClubCardDataAction} */ (data);
	return CommonIsObject(obj)
		&& obj.GameProgress === "Action"
		&& (typeof obj.CCData === "undefined" || Array.isArray(obj.CCData))
		&& (typeof obj.CCLog === "undefined" || CommonIsObject(obj.CCLog));
}

/**
 * Processes the club card game data received from the server
 * @param {number} senderNumber
 * @param {number} rng
 * @param {unknown} data - The data packet to process
 * @returns {Promise<void>} - Nothing
 */
async function GameClubCardProcess(senderNumber, rng, data) {

	// Finds the character that sent the packet
	const sender = ChatRoomCharacter.find(c => c.MemberNumber === senderNumber);
	if (!sender) return;

	// If a room admin started the game
	if (ClubCardIsStartPacket(data)) {
		if (!GameClubCardIsAdmin(sender)) return;
		if (data.Player1 == Player.MemberNumber
			|| data.Player2 == Player.MemberNumber
			|| (
				(Player.Game?.ClubCard?.Settings?.AutoSpectate ?? true)
				&& CurrentScreen !== "Appearance"
				&& CurrentScreen !== "ClubCardBuilder")
		) {
			if (CurrentScreen !== "ChatRoom") window[`${CurrentScreen}Exit`]?.();
			GameClubCardSetStatus("Running");
			await MiniGameStart("ClubCard", 0, () => GameClubCardEnd());
			GameClubCardAssignPlayers(data, rng, sender);
		}
	}

	// If a player wants to query the game status to join it
	if (ClubCardIsQueryResponsePacket(data)) {
		if (sender.IsPlayer() || !GameClubCardExpectQuery) return;
		if (CurrentScreen !== "ChatRoom") window[`${CurrentScreen}Exit`]?.();
		GameClubCardSetStatus("Running");
		await MiniGameStart("ClubCard", 0, () => GameClubCardEnd());
		GameClubCardAssignPlayers(data, rng, sender);
		GameClubCardLoadData(data);
		ClubCardMessageAdd(ClubCardMessageType.SYSTEM, "JoinedClubCardGame", { "PLAYERNAME": CharacterNickname(Player) });
		GameClubCardExpectQuery = false;
		ClubCardDestroyPopup();
	}

	// If the admin must send the current state of the game to the player
	if (ClubCardIsQueryRequestPacket(data)) {
		if (sender.IsPlayer() || !GameClubCardQueryAdmin) return;
		GameClubCardSyncOnlineData("Query");
	}

	// If the game progresses from the other player, we sync it locally
	if (ClubCardIsActionPacket(data)) {
		if (sender.IsPlayer()) return;
		GameClubCardLoadData(data);
	}
}

/**
 * Syncs the online data with all players
 * @param {string} Progress - The progress status to push (default to action)
 * @param {boolean} LocalPlayerOnly - If true, send only the local player. Otherwise, send both.
 * @returns {void} - Nothing
 */
function GameClubCardSyncOnlineData(Progress = "Action", LocalPlayerOnly = false) {
	if (!ClubCardIsOnline()) return;
	/** @type {ServerChatRoomGameCardGameData[]} */
	let Packet = [];
	for (let CCPlayer of ClubCardPlayer) {
		if (LocalPlayerOnly && CCPlayer.Character.MemberNumber !== Player.MemberNumber) continue;
		Packet.push({
			MemberNumber: CCPlayer.Character.MemberNumber ?? -1,
			Playing: (CCPlayer.Index == ClubCardTurnIndex),
			Level: CCPlayer.Level,
			Fame: CCPlayer.Fame,
			Money: CCPlayer.Money,
			LastFamePerTurn: CCPlayer.LastFamePerTurn ?? 0,
			LastMoneyPerTurn: CCPlayer.LastMoneyPerTurn ?? 0,
			FullDeck: GameClubCardDoBundle(CCPlayer.FullDeck),
			Deck: GameClubCardDoBundle(CCPlayer.Deck),
			Hand: GameClubCardHandDoBundle(CCPlayer.Hand),
			Board: GameClubCardBoardDoBundle(CCPlayer.Board),
			Event: GameClubCardBoardDoBundle(CCPlayer.Event),
			DiscardPile: GameClubCardDoBundle(CCPlayer.DiscardPile),
			CardsPlayedThisTurn: CCPlayer.CardsPlayedThisTurn,
			ClubCardTurnCounter: CCPlayer.ClubCardTurnCounter,
			Sleeve: CCPlayer.Sleeve
		});
	}
	if (Progress == "Action") ServerSend("ChatRoomGame", { GameProgress: "Action", CCData: Packet });
	if (Progress == "Query") ServerSend("ChatRoomGame", { GameProgress: "Query", CCData: Packet, Player1: ClubCardOnlinePlayerMemberNumber1, Player2: ClubCardOnlinePlayerMemberNumber2 });
}

/**
 * When the game ends, we go back to the online chat room
 * @returns {void} - Nothing
 */
function GameClubCardEnd() {
	CommonSetScreen("Online", "ChatRoom");
}
