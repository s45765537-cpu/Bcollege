"use strict";
var ClubCardBuilderBackground = "ClubCardPlayBoard1";
var ClubCardBuilderDeckIndex = -1;
/** @type {null | ClubCard} */
var ClubCardBuilderFocus = null;
/** @type {ClubCard[]} */
var ClubCardBuilderList = [];
var ClubCardBuilderOffset = 0;
/** @type {number[]} */
var ClubCardBuilderDeckCurrent = [];
var ClubCardBuilderMinDeckSize = 30;
var ClubCardBuilderMaxDeckSize = 40;
var ClubCardBuilderFilterIndex = 0;
var ClubCardBuilderFilterGroup = ["All", "Event", "NoGroup", "Liability", "Staff", "Police", "Criminal", "Fetishist", "PornActress", "Maid", "AsylumPatient", "AsylumNurse", "Dominant", "Mistress", "ABDLBaby", "ABDLMommy", "CollegeStudent", "CollegeTeacher", "Knot", "Shibari", "Pet", "Owner", "Reward"];
var ClubCardBuilderRenameIndex = -1;
var ClubCardBuilderCustomizationIndex = "";
var ClubCardBuilderSelectedCardBack = 0;
var ClubCardBuilderCardBackFocus = null;
var ClubCardBuilderCardBackCount = 9;

// All the default decks that NPCs can use
var ClubCardBuilderDefaultDeck = [1000, 1001, 1004, 1006, 1007, 1010, 1011, 1012, 1014, 1020, 2000, 2002, 4000, 6000, 6001, 6002, 6003, 6004, 6006, 6008, 8000, 8002, 8003, 8004, 13001, 30000, 30014, 30016, 31000, 31004];
var ClubCardBuilderMaidDeck = [1004, 1005, 1006, 1007, 1008, 1010, 1011, 1013, 1014, 2000, 2001, 2002, 3000, 3006, 4000, 6000, 6001, 6002, 6003, 6004, 9005, 10000, 10001, 10002, 30001, 30002, 30006, 30009, 30010, 30020];
var ClubCardBuilderDominantDeck = [1000, 1001, 1002, 1003, 1009, 1012, 1013, 1014, 2001, 2004, 2005, 3000, 3003, 3006, 4002, 4004, 4005, 8000, 8001, 8002, 8003, 8004, 9007, 9008, 30000, 30006, 30007, 30013, 31000, 31001];
var ClubCardBuilderPornDeck = [1002, 1003, 1016, 2003, 3001, 3002, 4003, 4006, 5000, 5001, 5002, 5003, 5004, 6000, 6001, 8000, 9000, 9001, 9002, 9006, 30004, 30005, 30014, 30015, 30016, 31002, 31003, 31004, 31005, 31006];
var ClubCardBuilderAsylumDeck = [1000, 1001, 1004, 1007, 1010, 1011, 1013, 5000, 6000, 6003, 7000, 7001, 7002, 7003, 7004, 7005, 7006, 7007, 10000, 10001, 11004, 11005, 30001, 30003, 30008, 30009, 30016, 30018, 31004, 31005];
var ClubCardBuilderABDLDeck = [1000, 1001, 1004, 1007, 1008, 1013, 1016, 4001, 4003, 6000, 6001, 6002, 7000, 7001, 7002, 10000, 10001, 10002, 10003, 10004, 10005, 11004, 11005, 11007, 30000, 30015, 30017, 30018, 30019, 30020];
var ClubCardBuilderCollegeDeck = [1000, 1001, 1010, 1011, 1014, 1016, 2000, 2001, 2002, 2004, 3006, 5000, 5002, 6001, 6004, 8001, 9003, 2005, 9004, 9006, 11004, 11005, 11006, 11007, 30000, 30001, 30002, 30006, 30010, 30011];
var ClubCardBuilderLiabilityDeck = [2000, 2001, 2002, 3001, 3002, 3003, 3004, 3005, 3007, 4002, 4004, 5000, 7001, 8001, 8002, 8003, 8004, 9000, 9001, 9002, 9003, 9004, 9005, 9006, 9007, 9008, 30018, 30019, 31000, 31002];

/**
 * Loads the deck # in memory so it can be edited
 * @param {number} Deck
 * @returns {void} - Nothing
 */
function ClubCardBuilderLoadDeck(Deck) {

	// Loads the default deck if no deck exists or the deck is invalid
	ClubCardBuilderDeckIndex = Deck;
	if ((Player.Game.ClubCard.Deck.length <= Deck) || (Player.Game.ClubCard.Deck[Deck].length < ClubCardBuilderMinDeckSize) || (Player.Game.ClubCard.Deck[Deck].length > ClubCardBuilderMaxDeckSize)) {
		ClubCardBuilderDeckCurrent = ClubCardBuilderDefaultDeck.slice();
		ClubCardBuilderFilterLoad();
		return;
	}

	// Loads the deck from the saved string
	ClubCardBuilderDeckCurrent = [];
	for (let Index = 0; Index < Player.Game.ClubCard.Deck[Deck].length; Index++)
		ClubCardBuilderDeckCurrent.push(Player.Game.ClubCard.Deck[Deck].charCodeAt(Index));

	// Prepares the filtered list
	ClubCardBuilderFilterLoad();

}

/**
 * Saves the modified deck as a string on the server
 * @returns {void} - Nothing
 */
function ClubCardBuilderSaveChanges() {
	while (Player.Game.ClubCard.Deck.length <= 10)
		Player.Game.ClubCard.Deck.push("");
	let Deck = "";
	for (let C of ClubCardBuilderDeckCurrent)
		Deck = Deck + String.fromCharCode(C);
	Player.Game.ClubCard.Deck[ClubCardBuilderDeckIndex] = Deck;
	ClubCardBuilderDeckIndex = -1;
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
}

/**
 * Saves the modified deck as a string on the server
 * @param {boolean} Save - TRUE to save, FALSE to skip saving
 * @returns {void} - Nothing
 */
function ClubCardBuilderSaveName(Save) {
	if (Save) {
		if (Player.Game.ClubCard.DeckName == null) Player.Game.ClubCard.DeckName = [];
		while (Player.Game.ClubCard.DeckName.length <= 10)
			Player.Game.ClubCard.DeckName.push("");
		Player.Game.ClubCard.DeckName[ClubCardBuilderRenameIndex] = ElementValue("InputName").trim().substring(0, 20);
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	}
	ClubCardBuilderRenameIndex = -1;
	ElementRemove("InputName");
}

/**
 * Saves the selected card back on the server
 * @param {number} CardBack - the number of the saved card back
 * @returns {void} - Nothing
 */
function ClubCardBuilderSaveCardBack(CardBack) {
    Player.Game.ClubCard.CardBack = CardBack;
    ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
    ClubCardBuilderCustomizationIndex = ""
}

/**
 * Loads the filtered cards
 * @returns {void} - Nothing
 */
function ClubCardBuilderFilterLoad() {
	ClubCardBuilderFocus = null;
	ClubCardBuilderList = [];
	ClubCardBuilderOffset = 0;
	for (let Card of ClubCardList)
		if ((Card.Reward == null) || (Player.Game.ClubCard.Reward.indexOf(String.fromCharCode(Card.ID)) >= 0)) {
			let Include = false;
			if (ClubCardBuilderFilterGroup[ClubCardBuilderFilterIndex] == "All") Include = true;
			else if ((ClubCardBuilderFilterGroup[ClubCardBuilderFilterIndex] == "Event") && (Card.Type === "Event")) Include = true;
			else if ((ClubCardBuilderFilterGroup[ClubCardBuilderFilterIndex] == "NoGroup") && (Card.Group == null) && (Card.Type == null)) Include = true;
			else if ((ClubCardBuilderFilterGroup[ClubCardBuilderFilterIndex] == "Reward") && (Card.Reward != null)) Include = true;
			else if ((Card.Group != null) && (Card.Group.indexOf(ClubCardBuilderFilterGroup[ClubCardBuilderFilterIndex]) >= 0)) Include = true;
			if (Include) ClubCardBuilderList.push({...Card});
		}
	for (let Card of ClubCardBuilderList)
		if (Card.RequiredLevel == null)
			Card.RequiredLevel = 1;
	ClubCardBuilderList.sort((a, b) => (((a.Type == null) || (a.Type == "Member")) ? 0 : 100) - (((b.Type == null) || (b.Type == "Member")) ? 0 : 100) + a.RequiredLevel * 10 - b.RequiredLevel * 10 + ((a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0)));
	if (ClubCardBuilderList.length > 0) ClubCardBuilderFocus = ClubCardBuilderList[0];
}

/**
 * Loads the club card deck builder
 * @returns {void} - Nothing
 */
function ClubCardBuilderLoad() {
	ClubCardCommonLoad();
	ClubCardBuilderDeckIndex = -1;
	ClubCardBuilderRenameIndex = -1;
}

/**
 * Returns the deck name on slot "Deck"
 * @param {number} Deck - The deck #
 * @returns {string} - The deck name or Deck #X if no name is assigned
 */
function ClubCardBuilderGetDeckName(Deck) {
	if ((Player.Game.ClubCard.DeckName == null) || (Player.Game.ClubCard.DeckName.length < Deck + 1)) return TextGet("DeckNumber") + (Deck + 1).toString();
	if ((Player.Game.ClubCard.DeckName[Deck] == null) || (Player.Game.ClubCard.DeckName[Deck] === "")) return TextGet("DeckNumber") + (Deck + 1).toString();
	return Player.Game.ClubCard.DeckName[Deck];
}

/**
 * Enters in deck rename mode
 * @param {number} Deck - The deck #
 * @returns {void} - Nothing
 */
function ClubCardBuilderRenameMode(Deck) {
	ClubCardBuilderRenameIndex = Deck;
	ElementCreateInput("InputName", "text", "", "20");
}

/**
 * Runs the club card deck builder
 * @returns {void} - Nothing
 */
function ClubCardBuilderRun() {

	// Makes sure the captions are loaded
	ClubCardLoadCaption();

	// In deck rename mode
	if (ClubCardBuilderRenameIndex >= 0) {
		DrawText(TextGet("RenameThisDeck"), 1000, 70, "White", "Black");
		DrawButton(1885, 25, 90, 90, null, "White", "Icons/Cancel.png", TextGet("UndoChanges"));
		DrawButton(1770, 25, 90, 90, null, "White", "Icons/Accept.png", TextGet("SaveChanges"));
		DrawText(ClubCardBuilderGetDeckName(ClubCardBuilderRenameIndex), 1000, 400, "White", "Black");
		ElementPosition("InputName", 1000, 500, 500);
		return;
	}

	// In CardBack mode
	if (ClubCardBuilderCustomizationIndex == "CardBack") {
		let Index = (ClubCardBuilderOffset * -1);
		for (let i = 0; i <= ClubCardBuilderCardBackCount; i++) {
			if ((Index >= 0) && (Index <= 29)) {
				let PosX = (Index % 10) * 154 + 5;
				let PosY = Math.floor(Index / 10) * 305 + 80;
				DrawImageResize("Screens/MiniGame/ClubCard/Sleeve/" + i + ".png", PosX+2, PosY+2, 146, 296);
				DrawImageResize("Screens/MiniGame/ClubCard/Frame/SleeveBorder.png", PosX, PosY, 150, 300);
				if (MouseIn(PosX, PosY, 150, 300)) ClubCardBuilderCardBackFocus = i;
				if (ClubCardBuilderSelectedCardBack == i) DrawImageResize("Screens/MiniGame/ClubCardBuilder/Selected.png", PosX + 110, PosY + 40, 40, 40);
			}
			Index++
		}
		DrawButton(1895, 5, 90, 90, null, "White", "Icons/Cancel.png", TextGet("UndoChanges"));
		DrawButton(1780, 5, 90, 90, null, "White", "Icons/Accept.png", TextGet("SaveCardBack"));

		DrawImageResize("Screens/MiniGame/ClubCard/Sleeve/" + ClubCardBuilderCardBackFocus + ".png", 1549, 109, 437, 882);
		DrawImageResize("Screens/MiniGame/ClubCard/Frame/SleeveBorder.png", 1545, 105, 445, 890);
		if (ClubCardBuilderCardBackFocus == ClubCardBuilderSelectedCardBack) DrawImageResize("Screens/MiniGame/ClubCardBuilder/Selected.png", 1870, 200, 120, 120);

		return;
	}

	// In deck selection mode
	if (ClubCardBuilderDeckIndex == -1) {

		// Draws the 10 decks buttons
		DrawText(TextGet("SelectDeck"), 940, 70, "White", "Black");
		for (let Deck = 0; Deck < 10; Deck++) {
			DrawButton(150 + (Deck % 5) * 350, 300 + Math.floor(Deck / 5) * 300, 300, 60, ClubCardBuilderGetDeckName(Deck), "White");
			DrawButton(150 + (Deck % 5) * 350, 390 + Math.floor(Deck / 5) * 300, 300, 60, TextGet("RenameDeck"), "White");
		}
		DrawButton(1885, 25, 90, 90, null, "White", "Icons/Exit.png", TextGet("Exit"));
		DrawButton(1770, 25, 90, 90, null, "White", "Icons/ClubCard.png", TextGet("ChangeCardBack"));
        DrawButton(1655, 25, 90, 90, null, "White", "Icons/Preference.png", TextGet("ChangeCardBackGround"));
		return;

	}

	// In card selection mode, we draw the cards in a 3x10 grid
	let Index = (ClubCardBuilderOffset * -1);
	for (let Card of ClubCardBuilderList) {
		if ((Index >= 0) && (Index <= 29)) {
			let PosX = (Index % 10) * 154 + 5;
			let PosY = Math.floor(Index / 10) * 305 + 80;
			ClubCardRenderCard(Card, PosX, PosY, 150);
			if (MouseIn(PosX, PosY, 150, 300)) ClubCardBuilderFocus = Card;
			if (ClubCardBuilderDeckCurrent.indexOf(Card.ID) >= 0) DrawImageResize("Screens/MiniGame/ClubCardBuilder/Selected.png", PosX + 110, PosY + 40, 40, 40);
		}
		Index++;
	}

	// Draw the text, the zoomed card and buttons
	ClubCardRenderCard(ClubCardBuilderFocus, 1545, 105, 445);
	if ((ClubCardBuilderFocus != null) && (ClubCardBuilderDeckCurrent.indexOf(ClubCardBuilderFocus.ID) >= 0)) DrawImageResize("Screens/MiniGame/ClubCardBuilder/Selected.png", 1870, 200, 120, 120);
	DrawText(TextGet("SelectCards") + " " + ClubCardBuilderGetDeckName(ClubCardBuilderDeckIndex) + " (" + ClubCardBuilderDeckCurrent.length + " / " + ClubCardBuilderMinDeckSize.toString() + "-" + ClubCardBuilderMaxDeckSize.toString() + ")", 1100, 37, (ClubCardBuilderDeckCurrent.length >= ClubCardBuilderMinDeckSize && ClubCardBuilderDeckCurrent.length <= ClubCardBuilderMaxDeckSize) ? "White" : "Pink", "Black");
	if (ClubCardBuilderFocus == null) DrawTextWrap(TextGet("ClickCard"), 1560, 400, 430, 300, "White");
	DrawButton(1895, 5, 90, 90, null, "White", "Icons/Cancel.png", TextGet("UndoChanges"));
	DrawButton(1780, 5, 90, 90, null, "White", "Icons/Accept.png", TextGet("SaveChanges"));
	DrawButton(1665, 5, 90, 90, null, "White", "Icons/Next.png", TextGet("NextCards"));
	DrawButton(1550, 5, 90, 90, null, "White", "Icons/Prev.png", TextGet("PreviousCards"));
	DrawButton(5, 5, 150, 60, TextGet("Clear"), "White", "", TextGet("ClearHover"));
	DrawButton(159, 5, 150, 60, TextGet("Default"), "White", "", TextGet("DefaultHover"));
	DrawBackNextButton(313, 5, 305, 60, TextGet("Group" + ClubCardBuilderFilterGroup[ClubCardBuilderFilterIndex]), "White", "",
		() => TextGet("Group" + ClubCardBuilderFilterGroup[(ClubCardBuilderFilterIndex + ClubCardBuilderFilterGroup.length - 1) % ClubCardBuilderFilterGroup.length].toString()),
		() => TextGet("Group" + ClubCardBuilderFilterGroup[(ClubCardBuilderFilterIndex + 1) % ClubCardBuilderFilterGroup.length].toString()));

}

/**
 * Handles clicks during the club card game
 * @returns {void} - Nothing
 */
function ClubCardBuilderClick() {

	// In CardBack mode
	if (ClubCardBuilderCustomizationIndex == "CardBack") {
		if (MouseIn(1895, 5, 90, 90)) { ClubCardBuilderCustomizationIndex = ""; return; }
		if (MouseIn(1780, 5, 90, 90)) return ClubCardBuilderSaveCardBack(ClubCardBuilderSelectedCardBack);
		
		if (MouseIn(1665, 5, 90, 90)) {
			ClubCardBuilderOffset = ClubCardBuilderOffset + 30;
			if (ClubCardBuilderOffset > ClubCardBuilderCardBackCount) ClubCardBuilderOffset = 0;
			return;
		}
		if (MouseIn(1550, 5, 90, 90)) {
			ClubCardBuilderOffset = ClubCardBuilderOffset - 30;
			if (ClubCardBuilderOffset < 0) ClubCardBuilderOffset = Math.floor(ClubCardBuilderCardBackCount / 30) * 30;
			return;
		}
	
		// If the user clicks on the focused card back
		if (MouseIn(1545, 105, 445, 890) && (ClubCardBuilderCardBackFocus != null)) { ClubCardBuilderSelectedCardBack = ClubCardBuilderCardBackFocus; return; }
	
		// If the user clicks on the focused card back from the grid    
		for (let i = 0; i <= ClubCardBuilderCardBackCount; i++) {
			let PosX = (i % 10) * 150 + 20;
			let PosY = Math.floor(i / 10) * 300 + 95;
			if (MouseIn(PosX, PosY, 150, 300)) {
				ClubCardBuilderCardBackFocus = i;
				ClubCardBuilderSelectedCardBack = i;
				return;
			}
		}
		return;
	}

	// In deck rename mode
	if (ClubCardBuilderRenameIndex >= 0) {
		if (MouseIn(1885, 25, 90, 90)) return ClubCardBuilderSaveName(false);
		if (MouseIn(1770, 25, 90, 90)) return ClubCardBuilderSaveName(true);
		return;
	}

	// If the user wants to exit
	if ((ClubCardBuilderDeckIndex == -1) && MouseIn(1885, 25, 90, 90)) return CommonSetScreen("Room", "ClubCardLounge");
	if ((ClubCardBuilderDeckIndex != -1) && MouseIn(1895, 5, 90, 90)) { ClubCardBuilderDeckIndex = -1; return; }
	if ((ClubCardBuilderDeckIndex != -1) && MouseIn(1780, 5, 90, 90) && (ClubCardBuilderDeckCurrent.length >= ClubCardBuilderMinDeckSize) && (ClubCardBuilderDeckCurrent.length <= ClubCardBuilderMaxDeckSize)) return ClubCardBuilderSaveChanges();

	// if the click on change card back
	if ((ClubCardBuilderDeckIndex == -1) && MouseIn(1770, 25, 90, 90)) { 
		ClubCardBuilderOffset = 0; 
		ClubCardBuilderCardBackFocus = (Player.Game.ClubCard.CardBack ? Player.Game.ClubCard.CardBack : 0); 
		ClubCardBuilderCustomizationIndex = "CardBack"; 
		ClubCardBuilderSelectedCardBack = Player.Game.ClubCard.CardBack; 
	}
	// if the user click on change background 
	if ((ClubCardBuilderDeckIndex == -1) && MouseIn(1655, 25, 90, 90)) { 
		let backgrounds = BackgroundsGenerateList(BackgroundsClubCardsTagList);
		let index = backgrounds.indexOf(Player.Game.ClubCard.Background ? Player.Game.ClubCard.Background : "ClubCardPlayBoard1");
		if (index < 0) index = 0;
		BackgroundSelectionMake(backgrounds, index, Name => {
			Player.Game.ClubCard.Background = Name;
			ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		});
	}

	// When we navigate through the cards
	if ((ClubCardBuilderDeckIndex != -1) && MouseIn(1665, 5, 90, 90)) {
		ClubCardBuilderOffset = ClubCardBuilderOffset + 30;
		if (ClubCardBuilderOffset >= ClubCardBuilderList.length) ClubCardBuilderOffset = 0;
		return;
	}
	if ((ClubCardBuilderDeckIndex != -1) && MouseIn(1550, 5, 90, 90)) {
		ClubCardBuilderOffset = ClubCardBuilderOffset - 30;
		if (ClubCardBuilderOffset < 0) ClubCardBuilderOffset = Math.floor((ClubCardBuilderList.length - 1) / 30) * 30;
		return;
	}

	// When we need to clear all the cards or reset to the default deck
	if ((ClubCardBuilderDeckIndex != -1) && MouseIn(5, 5, 150, 60)) ClubCardBuilderDeckCurrent = [];
	if ((ClubCardBuilderDeckIndex != -1) && MouseIn(159, 5, 150, 60)) ClubCardBuilderDeckCurrent = ClubCardBuilderDefaultDeck.slice();

	// When the user clicks on the back/next buttons
	if ((ClubCardBuilderDeckIndex != -1) && MouseIn(313, 5, 305, 60)) {
		if (MouseX <= 466) ClubCardBuilderFilterIndex = (ClubCardBuilderFilterGroup.length + ClubCardBuilderFilterIndex - 1) % ClubCardBuilderFilterGroup.length;
		else ClubCardBuilderFilterIndex = (ClubCardBuilderFilterIndex + 1) % ClubCardBuilderFilterGroup.length;
		ClubCardBuilderFilterLoad();
	}

	// If the user clicks to select a deck
	if (ClubCardBuilderDeckIndex == -1)
		for (let Deck = 0; Deck < 10; Deck++) {
			if (MouseIn(150 + (Deck % 5) * 350, 300 + Math.floor(Deck / 5) * 300, 300, 60)) return ClubCardBuilderLoadDeck(Deck);
			if (MouseIn(150 + (Deck % 5) * 350, 390 + Math.floor(Deck / 5) * 300, 300, 60)) return ClubCardBuilderRenameMode(Deck);
		}

	// If the user clicks on the focused card
	if ((ClubCardBuilderDeckIndex != -1) && MouseIn(1545, 105, 445, 890) && (ClubCardBuilderFocus != null)) {
		if (ClubCardBuilderDeckCurrent.indexOf(ClubCardBuilderFocus.ID) >= 0) ClubCardBuilderDeckCurrent.splice(ClubCardBuilderDeckCurrent.indexOf(ClubCardBuilderFocus.ID), 1);
		else ClubCardBuilderDeckCurrent.push(ClubCardBuilderFocus.ID);
		return;
	}

	// In card selection mode, we can pick a card from the 3x10 grid
	if (ClubCardBuilderDeckIndex != -1) {
		let Index = (ClubCardBuilderOffset * -1);
		for (let Card of ClubCardBuilderList) {
			if ((Index >= 0) && (Index <= 29)) {
				let PosX = (Index % 10) * 150 + 20;
				let PosY = Math.floor(Index / 10) * 300 + 95;
				if (MouseIn(PosX, PosY, 150, 300)) {
					ClubCardBuilderFocus = Card;
					if (ClubCardBuilderDeckCurrent.indexOf(Card.ID) >= 0) ClubCardBuilderDeckCurrent.splice(ClubCardBuilderDeckCurrent.indexOf(Card.ID), 1);
					else ClubCardBuilderDeckCurrent.push(Card.ID);
					return;
				}
			}
			Index++;
		}
	}

}
