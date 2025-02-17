"use strict";
var ClubCardBackground = "ClubCardPlayBoard1";
var ClubCardColor = ["#808080", "#FFFFFF", "#E0E0E0", "#D0FFD0", "#D0D0FF", "#FFD0D0", "#FFE080"];
var ClubCardFameTextColor = "#5A73FF";
var ClubCardMoneyTextColor = "#228B22";
/** @type {null | Character } */
var ClubCardOpponent = null;
/** @type {number[]} */
var ClubCardOpponentDeck = [];
/** @type {null | ClubCard} */
var ClubCardReward = null;
/**
 *  The variable allows to capture the mouse hovering over the card from the handler inside the ClubCardRenderCard function.
 * @type {null | ClubCard}
 * */
var ClubCardHover = null;
/**
 * Variable through which the current card selected by the player is rendered as a large card.
 * @type {null | ClubCard}
 * */
var ClubCardFocus = null;
var ClubCardFocusAI = null;
/** @type {null | TextCache} */
var ClubCardTextCache = null;
var ClubCardTurnIndex = 0;
var ClubCardTurnCardPlayed = 0;
var ClubCardTurnEndDraw = false;
var ClubCardFameGoal = 100;
/** @type {{ Mode: null | string, Text: null | string, Button1: null | string, Button2: null | string, Function1: null | string, Function2: null | string }} */
var ClubCardPopup = null;
/** @type {null | ClubCard} */
var ClubCardSelection = null;
/** @type {null | ClubCard} */
var ClubCardPending = null;
var ClubCardLevelLimit = [0, 5, 8, 13, 20, 40];
var ClubCardLevelCost = [0, 0, 10, 20, 30, 40];
/** @type {ClubCardPlayer[]} */
var ClubCardPlayer = [];
var ClubCardOnlinePlayerMemberNumber1 = -1;
var ClubCardOnlinePlayerMemberNumber2 = -1;
/**
 * Counter to ensure unique ID incrementation.
 * It is used globally to prevent ID duplication.
 */
let ClubCardUniqueIDCounter = 0;

// #region Card Animations

/**
 * Stores active card animations, updated each frame in ClubCardUpdateCardAnimations().
 * @type {ClubCardActiveAnimation[]}
 */
let ClubCardActiveAnimations = [];

const ClubCardPreviewPosition = { x: 705, y: 250, w: 250 };
const ClubCardPendingPosition = { x: 975, y: 400, w: 100 };
const ClubCardDiscardPosition = { x: 0, y: 500, w: 0 };

// #endregion

//#region Chat Log variable

var ClubCardLogScroll = false;
/**
 * Storage for all processed and displayed log messages
 * @type {ClubCardMessage[]}
 */
let ClubCardLog = [];
/**
 * Temporary buffer used for rendering messages before final log update
 * @type {ClubCardMessage[]}
 */
let ClubCardRenderLog = [];
/**
 * Message storage to accumulate messages before processing and sending
 * @type {ClubCardMessage[]}
 */
let ClubCardMessageStorage = [];

const ClubCardMessageType = Object.freeze({
	//Packet Messages Type
	STARTTURNINFO: "StartTurnInfo",  // Turn Idex + Player
	STARTTURNEVENT: "StartTurnEvent", // Quack Doctor, Master Class
	CARDEFFECT: "CardsEffect", // ( Alvin , Nanny , Fussy Baby, Contract Caretaker , etc)
	KNOTEVENT: "KnotEvent",
	TURNENDEFFECT: "TurnEndEffect",
	FAMEMONEYINFO: "FameMoneyInfo", //end turn income and general increase  money and fame.
	VICTORYINFO: "VictoryInfo",

	//Solo Messages Type
	ACTIONSEPARATOR: "ActionSeparator", //for key messages separating one player's turn into parts.
	PREREQUISTITE : "Prerequisite",
	ACTION: "Actions", // Play Card, Draw Card, Level up Club, Bankrupt, give up and leave the game
	SYSTEM: "SystemMessage", // Spectator join or leave , Select Deck
	PLAYERSMESSAGE: "PlayersMessage",
	PLAYERSDISCONNECTED: "PlayersDisconnected",
});

// List of message types that should be sent immediately
const ClubCardImmediateMessageTypes = [
	ClubCardMessageType.ACTIONSEPARATOR,
	ClubCardMessageType.ACTION,
	ClubCardMessageType.PLAYERSMESSAGE,
	ClubCardMessageType.PLAYERSDISCONNECTED,
	ClubCardMessageType.PREREQUISTITE,
	ClubCardMessageType.SYSTEM
];

const ClubCardStartTurnType = Object.freeze({
	PLAYCARD: "PlayCard",
	DRAWENDTURN: "DrawAndEndTurn",
	BANKRUPT: "Bankrupt",
	UPGRADELEVEL: "UpgradeLevel",
	ENDTURN: "EndTurn" // Technical is the start of a new turn.
});

/**
 * Keys for filling in the function parameters ClubCardMessageAdd
 */
const ClubCardPlaceholderKeys = Object.freeze({
	// PLAYERNAME: "PLAYERNAME",
	// SOURCEPLAYER: "SOURCEPLAYER",
	// OPPONENTPLAYER: "OPPONENTPLAYER",
	// TURNNUMBER: "TURNNUMBER",
	AMOUNT: "AMOUNT",
	CARDNAME: "CARDNAME",
	FAMEMONEY: "FAMEMONEY",
	MONEYAMOUNT: "MONEYAMOUNT",
	FAMEAMOUNT: "FAMEAMOUNT"
});

/** @type {boolean} Variable to check if the start function of the turn has already been called or not. */
let ClubCardIsStartTurn = false;

//#endregion Chat Log

/**
 * The card definitions
 *
 * The BeforeTurnEnd hooks are run before regular fame and money are calculated and
 * are a good place to remove cards so they don't add fame/money that turn. Most
 * cards should prefer this hook instead of AfterTurnEnd (including ones that just
 * add extra money / fame).
 *
 * The AfterTurnEnd hooks run after this, and can be used to adjust the total amount
 * of money / fame gained that turn.
 *
 * @type {ClubCard[]}
 */
var ClubCardList = [

	// 1000 - Regular Members (No specific rules)
	{
		ID: 1000,
		Name: "Kinky Neighbor",
		Type: "Member",
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Cute Girl Next Door")) ClubCardPlayerAddMoney(CCPlayer, 2);
		}
	},
	{
		ID: 1001,
		Name: "Cute Girl Next Door",
		FamePerTurn: 1,
	},
	{
		ID: 1002,
		Name: "Voyeur",
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Exhibitionist")) ClubCardPlayerAddMoney(CCPlayer, 4);
		}
	},
	{
		ID: 1003,
		Name: "Exhibitionist",
	},
	{
		ID: 1004,
		Name: "Party Animal",
		MoneyPerTurn: 2,
		FamePerTurn: -1
	},
	{
		ID: 1005,
		Name: "Auctioneer",
		MoneyPerTurn: 1
	},
	{
		ID: 1006,
		Name: "Uptown Girl",
		MoneyPerTurn: 2,
		RequiredLevel: 2
	},
	{
		ID: 1007,
		Name: "Tourist",
		MoneyPerTurn: 2,
		FamePerTurn: 2,
		RequiredLevel: 4
	},
	{
		ID: 1008,
		Name: "Diplomat",
		MoneyPerTurn: 3,
		FamePerTurn: 3,
		RequiredLevel: 5
	},
	{
		ID: 1009,
		Name: "Gambler",
		MoneyPerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDiscardCard(CCPlayer, 1);
			ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},
	{
		ID: 1010,
		Name: "Red Twin",
		MoneyPerTurn: 1,
		RequiredLevel: 2
	},
	{
		ID: 1011,
		Name: "Blue Twin",
		MoneyPerTurn: 1,
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Red Twin")) ClubCardPlayerAddFame(CCPlayer, 3);
		}
	},
	{
		ID: 1012,
		Name: "Rope Bunny",
		MoneyPerTurn: 1,
		RequiredLevel: 2,
		Group: ["Shibari"],
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Dominant")) ClubCardPlayerAddMoney(CCPlayer, 2);
		}
	},
	{
		ID: 1013,
		Name: "Shy Submissive",
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		turnStart: function(CCPlayer) {
			if ((CCPlayer.Board != null) && (CCPlayer.Board.length >= 8)) ClubCardRemoveFromBoard(CCPlayer, this);
		}
	},
	{
		ID: 1014,
		Name: "Rope Sensei",
		RequiredLevel: 2,
		FamePerTurn: 1,
		MoneyPerTurn: 1,
		Group: ["Shibari", "Sensei"]
	},
	{
		ID: 1015,
		Name: "LARP Queen",
		Reward: "NPC_LARP_Organiser",
		RequiredLevel: 4,
		FamePerTurn: 3,
		MoneyPerTurn: 1
	},
	{
		ID: 1016,
		Name: "Local Influencer",
		FamePerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -4);
			ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},
	{
		ID: 1017,
		Name: "Wannabe Princess",
		FamePerTurn: 1,
		Reward: "Bondage-Brawl-Maid",
		BeforeTurnEnd: function(CCPlayer) {
			if ((CCPlayer.Level != null) && (CCPlayer.Level >= 5)) ClubCardPlayerAddFame(CCPlayer, 2);
		}
	},
	{
		ID: 1018,
		Name: "Contract Caretaker",
		FamePerTurn: 1,
		MoneyPerTurn: -2,
		AfterOpponentTurnEnd: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);

			// Opponent card is played on their turn before the turn counter was incremented and synced online
			const abdlBabyPlayed = ClubCardGetCardsPlayedOnTurn(opponent, opponent.ClubCardTurnCounter - 1).some(card => {
				return card.Group?.includes("ABDLBaby");
			});

			const playerFameAtStartOfTurn = CCPlayer.Fame - CCPlayer.LastFamePerTurn;

			if (abdlBabyPlayed && playerFameAtStartOfTurn > opponent.Fame && CCPlayer.LastFamePerTurn > 0) {
				ClubCardPlayerAddFame(CCPlayer, CCPlayer.LastFamePerTurn * -1);
				CCPlayer.LastFamePerTurn = 0;
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Contract Caretaker", {}, CCPlayer);
			}
		},
	},
	{
		ID: 1019,
		Name: "Attention Whore",
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		Prerequisite: "SelectAnyEvent",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;

			if (ClubCardSelection.Location == "PlayerBoard") {
				const indexToRemove = CCPlayer.Event.findIndex(c => c.ID === ClubCardSelection.ID);
				CCPlayer.Event.splice(indexToRemove, 1);
			}
			if (ClubCardSelection.Location == "OpponentBoard") {
				const opponent = ClubCardGetOpponent(CCPlayer);
				const indexToRemove = opponent.Event.findIndex(c => c.ID === ClubCardSelection.ID);
				opponent.Event.splice(indexToRemove, 1);
			}
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "EventRemoved", {[ClubCardPlaceholderKeys.CARDNAME]: ClubCardSelection.Name}, CCPlayer);
		},
	},
	{
		ID: 1020,
		Name: "Tour Guide",
		RequiredLevel: 3,
		FamePerTurn: 1,
		MoneyPerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 1);
		},
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Tourist")) ClubCardPlayerAddMoney(CCPlayer, 3);
			if (ClubCardNameIsOnBoard(CCPlayer, "Diplomat")) ClubCardPlayerAddFame(CCPlayer, 3);
		}
	},
	{
		ID: 1021,
		Name: "Troublemaker",
		MoneyPerTurn: 1
	},

	// 2000 - Staff Members (Club employees that can be targetted by events)
	{
		ID: 2000,
		Name: "Waitress",
		Group: ["Staff"],
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Party Animal")) ClubCardPlayerAddMoney(CCPlayer, 1);
			if (ClubCardNameIsOnBoard(CCPlayer, "Tourist")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 2001,
		Name: "Bouncer",
		Group: ["Staff"],
		MoneyPerTurn: -1,
		FamePerTurn: 2
	},
	{
		ID: 2002,
		Name: "Accountant",
		Group: ["Staff"],
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.Level >= 3) ClubCardPlayerAddMoney(CCPlayer, 1);
			if (CCPlayer.Level >= 5) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 2003,
		Name: "Secretary",
		Group: ["Staff"],
		ExtraTime: 1,
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			for (const card of CCPlayer.Event) {
				card.Time++;
			}
		}
	},
	{
		ID: 2004,
		Name: "Associate",
		Group: ["Staff"],
		MoneyPerTurn: -2,
		ExtraPlay: 1,
		RequiredLevel: 3
	},
	{
		ID: 2005,
		Name: "Human Resource",
		Group: ["Staff"],
		MoneyPerTurn: -1,
		ExtraDraw: 1,
		RequiredLevel: 3
	},

	// 3000 - Police / Criminal Members (Cancel each others and offer protections against events)
	{
		ID: 3000,
		Name: "Policewoman",
		Group: ["Police"],
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		RequiredLevel: 3
	},
	{
		ID: 3001,
		Name: "Pusher",
		Group: ["Criminal"],
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardRemoveFromBoard(CCPlayer, this);
			else {
				if (ClubCardNameIsOnBoard(CCPlayer, "Sidney")) ClubCardPlayerAddMoney(CCPlayer, 1);
			}
		}
	},
	{
		ID: 3002,
		Name: "Junkie",
		Group: ["Criminal"],
		MoneyPerTurn: 1,
		FamePerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardRemoveFromBoard(CCPlayer, this);
			else {
				if (ClubCardNameIsOnBoard(CCPlayer, "Pusher")) ClubCardPlayerAddMoney(CCPlayer, 2);
			}
		}
	},
	{
		ID: 3003,
		Name: "Zealous Cop",
		Group: ["Liability", "Police"],
		RequiredLevel: 2,
		MoneyPerTurn: -1,
		FamePerTurn: -1
	},
	{
		ID: 3004,
		Name: "Gangster",
		Group: ["Criminal"],
		MoneyPerTurn: 3,
		FamePerTurn: -2,
		RequiredLevel: 3,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardRemoveFromBoard(CCPlayer, this);
			else {
				const effectMoney = Math.min((ClubCardGroupOnBoardCount(CCPlayer, "Criminal") * 2), 5);
				ClubCardPlayerAddMoney(CCPlayer, effectMoney);
			}
		}
	},
	{
		ID: 3005,
		Name: "Paroled Thief",
		Group: ["Liability", "Criminal"],
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardRemoveFromBoard(CCPlayer, this);
			else ClubCardPlayerSteal(ClubCardGetOpponent(CCPlayer), 1, 0);
		}
	},
	{
		ID: 3006,
		Name: "Police Cadet",
		Group: ["Police"],
		FamePerTurn: 1
	},
	{
		ID: 3007,
		Name: "Stepmother",
		Group: ["Criminal"],
		MoneyPerTurn: 5,
		FamePerTurn: -3,
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			let Fame = 0;
			for (const card of CCPlayer.Board) {
				if (card.FamePerTurn && card.FamePerTurn < 0)
					Fame = Fame + 2;
			}
			ClubCardPlayerAddFame(CCPlayer, Fame);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFame", {[ClubCardPlaceholderKeys.AMOUNT]: Fame}, CCPlayer);
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.FamePerTurn && cardPlayed.FamePerTurn < 0 && !ClubCardIsLiability(cardPlayed)) {
				if (cardPlayed.MoneyPerTurn != null) ClubCardPlayerSteal(CCPlayer, 0, (cardPlayed.MoneyPerTurn * 2));
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.FamePerTurn && cardPlayed.FamePerTurn < 0 && ClubCardIsLiability(cardPlayed)) {
				if (cardPlayed.MoneyPerTurn != null) ClubCardPlayerSteal(CCPlayer, 0, (cardPlayed.MoneyPerTurn * 2));
			}
		}
	},
	{
		ID: 3008,
		Name: "Sheriff",
		Group: ["Police"],
		Reward: "NPC_Pandora_RandomGuard",
		FamePerTurn: 1,
		MoneyPerTurn: 1,
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 2);
		}
	},
	{
		ID: 3009,
		Name: "Detective",
		Group: ["Police"],
		MoneyPerTurn: 1,
		RequiredLevel: 2,
	},
	{
		ID: 3010,
		Name: "Earner",
		Group: ["Criminal"],
		FamePerTurn: 1,
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			const effectMoney = Math.min(ClubCardGroupInDiscardPileCount(CCPlayer, "Criminal"), 3);
			ClubCardPlayerAddMoney(CCPlayer, effectMoney);
		}
	},
	{
		ID: 3011,
		Name: "Consigliere",
		Group: ["Criminal"],
		MoneyPerTurn: 3,
		FamePerTurn: -1,
		RequiredLevel: 4,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.Money > 7) {
				ClubCardPlayerAddMoney(CCPlayer, -8);
				ClubCardPlayerAddFame(CCPlayer, 3);
				ClubCardPlayerDrawCard(CCPlayer, 1);
			}
		}
	},
	{
		ID: 3012,
		Name: "Naughty Baby",
		Group: ["Criminal", "ABDLBaby"],
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			if (!ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardPlayerSteal(CCPlayer, 4, 0);
			if (!ClubCardGroupIsOnBoard(opponent, "Police")) ClubCardPlayerSteal(CCPlayer, 0, 4);
		}
	},
	{
		ID: 3013,
		Name: "Sticky Fingers",
		Group: ["Criminal"],
		MoneyPerTurn: 1,
		FamePerTurn: -1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerSteal(CCPlayer, 1, 1, true);
		}
	},
	{
		ID: 3014,
		Name: "Con Artist",
		Group: ["Criminal"],
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		RequiredLevel: 2,
	},
	{
		ID: 3015,
		Name: "Inspector",
		Group: ["Police"],
		MoneyPerTurn: 1,
		RequiredLevel: 2,
	},
	{
		ID: 3016,
		Name: "Tax Auditor",
		Group: ["Police"],
		MoneyPerTurn: 1,
		Prerequisite: "SelectOpponentMember",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardGetOpponent(CCPlayer).Board[ClubCardSelection.ArrayIndex].MoneyPerTurn = 1;
		}
	},

	// 4000 - Fetishists (Synergies with other groups)
	{
		ID: 4000,
		Name: "Maid Lover",
		Group: ["Fetishist"],
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, Math.min(3, ClubCardGroupOnBoardCount(CCPlayer, "Maid")));
		}
	},
	{
		ID: 4001,
		Name: "Diaper Lover",
		Group: ["Fetishist"],
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby"));
		}
	},
	{
		ID: 4002,
		Name: "Masochist",
		Group: ["Fetishist"],
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Dominant")) {
				ClubCardPlayerAddMoney(CCPlayer, 1);
				ClubCardPlayerAddFame(CCPlayer, 1);
			}
		}
	},
	{
		ID: 4003,
		Name: "Feet Worshiper",
		Group: ["Fetishist"],
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "PornActress") || ClubCardGroupIsOnBoard(CCPlayer, "ABDLMommy"))
				ClubCardPlayerAddMoney(CCPlayer, 2);
		}
	},
	{
		ID: 4004,
		Name: "Fin-Dom Simp",
		Group: ["Fetishist"],
		BeforeTurnEnd: function(CCPlayer) {
			let Money = ClubCardGroupOnBoardCount(CCPlayer, "Dominant");
			if (Money > 3) Money = 3;
			ClubCardPlayerAddMoney(CCPlayer, Money);
		}
	},
	{
		ID: 4005,
		Name: "Fin-Dom Whale",
		Group: ["Fetishist"],
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 1);
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Mistress") * 2);
		}
	},
	{
		ID: 4006,
		Name: "Porn Addict",
		Group: ["Fetishist"],
		MoneyPerTurn: 1,
		FamePerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "PornActress"));
		}
	},
	{
		ID: 4007,
		Name: "Rope Slave",
		Group: ["Fetishist", "Shibari"],
		FamePerTurn: 1,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if ((cardPlayed.Type == "Event" && ClubCardCardHasGroup(cardPlayed, "Shibari")) || ClubCardCardHasGroup(cardPlayed, "Knot")) {
				ClubCardPlayerAddMoney(CCPlayer, 1);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Rope Slave", { [ClubCardPlaceholderKeys.AMOUNT]: 1 }, CCPlayer);
			}
		}
	},
	{
		ID: 4008,
		Name: "Daycare Enthusiast",
		Group: ["Fetishist"],
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "ABDLMommy")) {
				ClubCardPlayerAddFame(CCPlayer, 3);
			}
			if (ClubCardCardHasGroup(cardPlayed, "ABDLBaby")) {
				ClubCardPlayerAddMoney(CCPlayer, 3);
			}
		}
	},
	{
		ID: 4009,
		Name: "Shibari Lover",
		Group: ["Fetishist"],
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 1, undefined);
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Shibari") && cardPlayed.Type == "Member") {
				ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 1, undefined);
			}
		}
	},
	{
		ID: 4010,
		Name: "Pet Sitter",
		Group: ["Fetishist"],
		BeforeTurnEnd: function(CCPlayer) {
			const MaxMoney = 5;
			let Money = Math.min((ClubCardGroupOnBoardCount(CCPlayer, "Pet") + ClubCardGroupOnBoardCount(ClubCardGetOpponent(CCPlayer), "Pet")), MaxMoney);
			ClubCardPlayerAddMoney(CCPlayer, Money);
		},
		BeforeOpponentTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Pet")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 4011,
		Name: "Pet Trainer",
		Group: ["Fetishist"],
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Show Dog")) ClubCardPlayerAddFame(CCPlayer, 3);
		},
		onPlayedCard: function (CCPlayer, cardPlayed) {
			const famePerPet = 2;
			if (ClubCardCardHasGroup(cardPlayed, "Pet")) {
				ClubCardPlayerAddFame(CCPlayer, famePerPet);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Pet Trainer", { [ClubCardPlaceholderKeys.AMOUNT]: famePerPet }, CCPlayer);
			}
		}
	},

	// 5000 - Porn Members (Raise both Fame and Money)
	{
		ID: 5000,
		Name: "Porn Amateur",
		Group: ["PornActress"],
		MoneyPerTurn: 1
	},
	{
		ID: 5001,
		Name: "Porn Movie Director",
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "PornActress"));
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "PornActress"));
		}
	},
	{
		ID: 5002,
		Name: "Porn Lesbian",
		Group: ["PornActress"],
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		RequiredLevel: 3,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupOnBoardCount(CCPlayer, "PornActress") >= 2)
				ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 5003,
		Name: "Porn Veteran",
		Group: ["PornActress"],
		MoneyPerTurn: 1,
		FamePerTurn: 2,
		RequiredLevel: 4
	},
	{
		ID: 5004,
		Name: "Porn Star",
		Group: ["PornActress"],
		MoneyPerTurn: 1,
		FamePerTurn: 4,
		RequiredLevel: 5
	},
	{
		ID: 5005,
		Name: "Cam Girl",
		Group: ["PornActress"],
		Reward: "NPC_MovieStudio_Director",
		MoneyPerTurn: 1,
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},

	// 6000 - Maid Members (Raise Fame, cost Money)
	{
		ID: 6000,
		Name: "Rookie Maid",
		Group: ["Maid"],
		FamePerTurn: 1
	},
	{
		ID: 6001,
		Name: "Coat Check Maid",
		Group: ["Maid"],
		MoneyPerTurn: 1
	},
	{
		ID: 6002,
		Name: "Regular Maid",
		Group: ["Maid"],
		MoneyPerTurn: -1,
		FamePerTurn: 2
	},
	{
		ID: 6003,
		Name: "French Maid",
		Group: ["Maid"],
		MoneyPerTurn: -1,
		FamePerTurn: 3,
		RequiredLevel: 3
	},
	{
		ID: 6004,
		Name: "Head Maid",
		Group: ["Maid"],
		MoneyPerTurn: -2,
		FamePerTurn: 3,
		RequiredLevel: 4,
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, Math.min(6, (ClubCardGroupOnBoardCount(CCPlayer, "Maid") - 1)));
		}
	},
	{
		ID: 6005,
		Name: "Confused Maid",
		Group: ["Liability", "Maid"],
		Reward: "NPC_Introduction_Maid",
		FamePerTurn: -2,
		RequiredLevel: 2
	},
	{
		ID: 6006,
		Name: "Quality Maid",
		Group: ["Maid"],
		RequiredLevel: 3,
		MoneyPerTurn: 1,
		FamePerTurn: 1
	},
	{
		ID: 6007,
		Name: "Housekeeper",
		Group: ["Maid"],
		RequiredLevel: 2,
		FamePerTurn: 1,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (!ClubCardCardHasGroup(cardPlayed, "Maid") && cardPlayed.Type === "Member" && cardPlayed.Group != null && !ClubCardIsLiability(cardPlayed)) {
				let sharedGroupCards = CCPlayer.Board.filter(value => cardPlayed.Group.some(group => ClubCardCardHasGroup(value, group)));
				const Fame = Math.min(CCPlayer.Level, sharedGroupCards.length - 1);
				ClubCardPlayerAddFame(CCPlayer, Fame);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Housekeeper", { [ClubCardPlaceholderKeys.AMOUNT]: Fame}, CCPlayer);
			}
		},
		onOpponentPlayedCard: function (CCPlayer, cardPlayed) {
			if (!ClubCardCardHasGroup(cardPlayed, "Maid") && cardPlayed.Type === "Member" && cardPlayed.Group != null && ClubCardIsLiability(cardPlayed)) {
				let sharedGroupCards = CCPlayer.Board.filter(value => cardPlayed.Group.some(group => ClubCardCardHasGroup(value, group)));
				const Fame = Math.min(CCPlayer.Level, sharedGroupCards.length - 1);
				ClubCardPlayerAddFame(CCPlayer, Fame);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Housekeeper", { [ClubCardPlaceholderKeys.AMOUNT]: Fame}, CCPlayer);
			}
		}
	},
	{
		ID: 6008,
		Name: "Maid Manager",
		Group: ["Maid"],
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			let effectAmount = Math.min(4, Math.floor(ClubCardGroupOnBoardCount(CCPlayer, "Maid") / 2));
			if (CCPlayer.Level < 4) ClubCardPlayerAddMoney(CCPlayer, effectAmount);
			else ClubCardPlayerAddFame(CCPlayer, effectAmount);
		}
	},
	{
		ID: 6009,
		Name: "Throne Room Servant",
		Group: ["Maid"],
		RequiredLevel: 4,
		MoneyPerTurn: 2,
		BeforeTurnEnd: function(CCPlayer) {
			let t5cards = CCPlayer.Board.filter(card => card.RequiredLevel == 5);
			let effectFame = Math.min(8, 3 * t5cards.length);
			ClubCardPlayerAddFame(CCPlayer, effectFame);
		}
	},
	{
		ID: 6010,
		Name: "Night Maid",
		Group: ["Maid"],
		RequiredLevel: 5,
		MoneyPerTurn: 2,
		FamePerTurn: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.Event.length > 0) {
				ClubCardPlayerAddFame(CCPlayer, 2);
				ClubCardPlayerAddMoney(CCPlayer, 4);
			}
		}
	},

	// 7000 - Asylum Patient and Nurse Members (Synergies between each other)
	{
		ID: 7000,
		Name: "Curious Patient",
		Group: ["AsylumPatient"],
		MoneyPerTurn: 1
	},
	{
		ID: 7001,
		Name: "Part-Time Patient",
		Group: ["AsylumPatient"],
		MoneyPerTurn: 1
	},
	{
		ID: 7002,
		Name: "Novice Nurse",
		Group: ["AsylumNurse"],
		BeforeTurnEnd: function(CCPlayer) {
			const effectFame = ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient");
			ClubCardPlayerAddFame(CCPlayer, ClubCardGetMaxEffectFromCard(this, effectFame));
		}
	},
	{
		ID: 7003,
		Name: "Commited Patient",
		Group: ["AsylumPatient"],
		MoneyPerTurn: 2,
		RequiredLevel: 2
	},
	{
		ID: 7004,
		Name: "Veteran Nurse",
		Group: ["AsylumNurse"],
		RequiredLevel: 3,
		BeforeTurnEnd: function(CCPlayer) {
			const effectFame = ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") * 2;
			ClubCardPlayerAddFame(CCPlayer, ClubCardGetMaxEffectFromCard(this, effectFame));
		}
	},
	{
		ID: 7005,
		Name: "Permanent Patient",
		Group: ["AsylumPatient"],
		MoneyPerTurn: 3,
		RequiredLevel: 4
	},
	{
		ID: 7006,
		Name: "Doctor",
		Group: ["AsylumNurse"],
		RequiredLevel: 5,
		BeforeTurnEnd: function(CCPlayer) {
			const effectFame = ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") * 3;
			ClubCardPlayerAddFame(CCPlayer, ClubCardGetMaxEffectFromCard(this, effectFame));
		}
	},
	{
		ID: 7007,
		Name: "Picky Nurse",
		Group: ["AsylumNurse"],
		Reward: "NPC_AsylumMeeting_PatientRight",
		FamePerTurn: 3,
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") < 2) ClubCardRemoveFromBoard(CCPlayer, this);
		},
		CanPlay: function(CCPlayer) {
			return (ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") >= 2);
		}
	},
	{
		ID: 7008,
		Name: "Quack Doctor",
		MoneyPerTurn: 1,
		Group: ["AsylumNurse"],
		turnStart: function(CCPlayer) {
			const MAX_FAME_REDUCTION = 4;
			let fameReduction = Math.min(ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient"), MAX_FAME_REDUCTION);

			if (fameReduction != 0) {
				const opponent = ClubCardGetOpponent(CCPlayer);
				ClubCardPlayerAddFame(CCPlayer, fameReduction * -1);
				ClubCardPlayerAddFame(opponent, fameReduction * -1);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Quack Doctor", { [ClubCardPlaceholderKeys.AMOUNT]: fameReduction }, CCPlayer);
			}
		}
	},
	{
		ID: 7009,
		Name: "Theatre Nurse",
		Group: ["AsylumNurse"],
		FamePerTurn: 1,
		RequiredLevel: 3,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "AsylumPatient")) {
				ClubCardPlayerDrawCard(CCPlayer, 1);
				ClubCardPlayerAddMoney(CCPlayer, 3);
			}
		},
	},
	{
		ID: 7010,
		Name: "Hypnotherapist",
		Group: ["AsylumNurse"],
		FamePerTurn: 3,
		MoneyPerTurn: 1,
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			let cardsToReturn = CCPlayer.Board.filter(card => card.RequiredLevel == 1 || card.RequiredLevel == null);
			let opponentCardsToReturn = opponent.Board.filter(card => card.RequiredLevel == 1 || card.RequiredLevel == null);

			for (const C of cardsToReturn) {
				const cardToAdd = ClubCardGetCopyCardByName(C.Name);
				if (ClubCardIsLiability(C)) {
					opponent.Hand.push(cardToAdd);
				} else {
					CCPlayer.Hand.push(cardToAdd);
				}
				ClubCardRemoveFromBoard(CCPlayer, C, true);
			}

			for (const C of opponentCardsToReturn) {
				const cardToAdd = ClubCardGetCopyCardByName(C.Name);
				if (ClubCardIsLiability(C)) {
					CCPlayer.Hand.push(cardToAdd);
				} else {
					opponent.Hand.push(cardToAdd);
				}
				ClubCardRemoveFromBoard(opponent, C, true);
			}

			this.ExtraPlay = 1;

			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Hypnotherapist");
		},
		BeforeOpponentTurnEnd: function() {
			this.ExtraPlay = 0;
		}
	},
	{
		ID: 7011,
		Name: "Prodigious Patient",
		Group: ["AsylumPatient"],
		FamePerTurn: 2,
		MoneyPerTurn: 2,
		RequiredLevel: 4,
		Time: 6,
		onLeaveClub: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardPlayerAddFame(opponent, -15);
			ClubCardPlayerDiscardCard(opponent, 1);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "LoseFame", { [ClubCardPlaceholderKeys.AMOUNT]: 15 }, opponent);
		}
	},

	// 8000 - Dominant Members (Raise lots of Fame, cost Money)
	{
		ID: 8000,
		Name: "Amateur Rigger",
		Group: ["Dominant"],
		FamePerTurn: 1
	},
	{
		ID: 8001,
		Name: "Domme",
		Group: ["Dominant"],
		MoneyPerTurn: -1,
		FamePerTurn: 2
	},
	{
		ID: 8002,
		Name: "Madam",
		Group: ["Dominant"],
		RequiredLevel: 2,
		MoneyPerTurn: -2,
		FamePerTurn: 3
	},
	{
		ID: 8003,
		Name: "Mistress",
		Group: ["Dominant", "Mistress"],
		RequiredLevel: 3,
		MoneyPerTurn: -3,
		FamePerTurn: 4
	},
	{
		ID: 8004,
		Name: "Dominatrix",
		Group: ["Dominant", "Mistress"],
		RequiredLevel: 4,
		MoneyPerTurn: -4,
		FamePerTurn: 6
	},
	{
		ID: 8005,
		Name: "Mistress Sophie",
		Group: ["Dominant", "Mistress"],
		Reward: "NPC-Sophie",
		RequiredLevel: 5,
		MoneyPerTurn: -5,
		FamePerTurn: 8
	},

	// 9000 - Liability Members (Used on other board to handicap)
	{
		ID: 9000,
		Name: "Scammer",
		Group: ["Liability"],
		MoneyPerTurn: -1
	},
	{
		ID: 9001,
		Name: "Pyramid Schemer",
		Group: ["Liability"],
		RequiredLevel: 2,
		MoneyPerTurn: -2
	},
	{
		ID: 9002,
		Name: "Ponzi Schemer",
		Group: ["Liability"],
		RequiredLevel: 4,
		MoneyPerTurn: -4
	},
	{
		ID: 9003,
		Name: "Party Pooper",
		Group: ["Liability"],
		FamePerTurn: -1
	},
	{
		ID: 9004,
		Name: "College Dropout",
		Group: ["Liability"],
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent") * -1);
		}
	},
	{
		ID: 9005,
		Name: "Union Leader",
		Group: ["Liability"],
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Maid") * -1);
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Staff") * -1);
		}
	},
	{
		ID: 9006,
		Name: "No-Fap Advocate",
		Group: ["Liability"],
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "PornActress") * -2);
		}
	},
	{
		ID: 9007,
		Name: "Pandora Infiltrator",
		Group: ["Liability"],
		FamePerTurn: -3,
		RequiredLevel: 3
	},
	{
		ID: 9008,
		Name: "Uncontrollable Sub",
		Group: ["Liability"],
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Dominant") * -1);
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Mistress") * -1);
		}
	},

	// 10000 - ABDL Members (Mostly gives Money)
	{
		ID: 10000,
		Name: "Baby Girl",
		Group: ["ABDLBaby"],
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "ABDLMommy")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 10001,
		Name: "Caring Mother",
		Group: ["ABDLMommy"],
		MoneyPerTurn: 1
	},
	{
		ID: 10002,
		Name: "Diaper Baby",
		Group: ["ABDLBaby"],
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Maid")) ClubCardPlayerAddMoney(CCPlayer, 3);
		}
	},
	{
		ID: 10003,
		Name: "Sugar Baby",
		Group: ["ABDLBaby"],
		RequiredLevel: 4,
		MoneyPerTurn: 4
	},
	{
		ID: 10004,
		Name: "Babysitter",
		Group: ["ABDLMommy", "Staff"],
		RequiredLevel: 2,
		MoneyPerTurn: -2,
		BeforeTurnEnd: function(CCPlayer) {
			const effectFame = ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby") * 2;
			ClubCardPlayerAddFame(CCPlayer, ClubCardGetMaxEffectFromCard(this, effectFame));
		}
	},
	{
		ID: 10005,
		Name: "Soap Opera Mother",
		Group: ["ABDLMommy"],
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "ABDLBaby")) {
				const fame = 25;
				ClubCardPlayerAddFame(CCPlayer, fame);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFame", {[ClubCardPlaceholderKeys.AMOUNT]: fame}, CCPlayer);
			}
		}
	},
	{
		ID: 10006,
		Name: "Big Baby",
		Group: ["ABDLBaby"],
		RequiredLevel: 2,
		MoneyPerTurn: 2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(ClubCardGetOpponent(CCPlayer), 1);
		},
		BeforeTurnEnd: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			if (CCPlayer.Hand.length < Opponent.Hand.length) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		//TODO Fussy Babby, Need a fix for a bug where if your opponent wins at the end of your turn, you hang in the game.
		ID: 10007,
		Name: "Fussy Baby",
		Group: ["ABDLBaby"],
		MoneyPerTurn: 1,
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type === "Event") {
				ClubCardRemoveFromBoard(CCPlayer, this, true);
				ClubCardAddToHand(CCPlayer, this);
				ClubCardPlayerAddFame(CCPlayer, 4);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Fussy Baby", {[ClubCardPlaceholderKeys.AMOUNT]: 4}, CCPlayer);
			}
		}
	},
	{
		ID: 10008,
		Name: "Nanny",
		FamePerTurn: 2,
		RequiredLevel: 3,
		Group: ["ABDLMommy"],
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "ABDLBaby")) {
				ClubCardPlayerAddFame(CCPlayer, CCPlayer.Level);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Nanny", {[ClubCardPlaceholderKeys.AMOUNT]: CCPlayer.Level}, CCPlayer);
			}
		}
	},
	{
		ID: 10009,
		Name: "Dommy Mommy",
		FamePerTurn: 1,
		MoneyPerTurn: -5,
		RequiredLevel: 5,
		Group: ["ABDLMommy", "Dominant"],
		OnPlay: function(CCPlayer) {
			// get all members, exclude events from board count
			const fame = CCPlayer.Board.filter(card => card.Type !== "Event").length;
			ClubCardPlayerAddFame(CCPlayer, fame);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFame", {[ClubCardPlaceholderKeys.AMOUNT]: fame}, CCPlayer);
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby"));
		}
	},


	// 11000 - College Members (Mostly gives Fame, give bonuses/maluses between each other)
	{
		ID: 11000,
		Name: "Amanda",
		Group: ["CollegeStudent"],
		Reward: "NPC-Amanda",
		FamePerTurn: 1
	},
	{
		ID: 11001,
		Name: "Sarah",
		Group: ["CollegeStudent"],
		Reward: "NPC-Sarah",
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Amanda") || ClubCardNameIsOnBoard(CCPlayer, "Mistress Sophie")) ClubCardPlayerAddFame(CCPlayer, 1);
			if (ClubCardNameIsOnBoard(CCPlayer, "Sidney")) ClubCardPlayerAddFame(CCPlayer, -2);
		}
	},
	{
		ID: 11002,
		Name: "Sidney",
		Group: ["CollegeStudent"],
		Reward: "NPC-Sidney",
		FamePerTurn: 1
	},
	{
		ID: 11003,
		Name: "Jennifer",
		Group: ["CollegeStudent"],
		Reward: "NPC-Jennifer",
		FamePerTurn: 1,
		Prerequisite: "SelectOwnMember",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection);
		}
	},
	{
		ID: 11004,
		Name: "College Freshwoman",
		Group: ["CollegeStudent"],
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Yuki")) ClubCardPlayerAddFame(CCPlayer, 1);
			if (ClubCardNameIsOnBoard(CCPlayer, "Julia")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 11005,
		Name: "College Nerd",
		Group: ["CollegeStudent"],
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Yuki")) ClubCardPlayerAddMoney(CCPlayer, 1);
			if (ClubCardNameIsOnBoard(CCPlayer, "Julia")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 11006,
		Name: "College Hidden Genius",
		Group: ["CollegeStudent"],
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Mildred")) ClubCardPlayerAddFame(CCPlayer, 4);
		}
	},
	{
		ID: 11007,
		Name: "Substitute Teacher",
		Group: ["CollegeTeacher"],
		MoneyPerTurn: -2,
		BeforeTurnEnd: function(CCPlayer) {
			const effectFame = ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent");
			ClubCardPlayerAddFame(CCPlayer, Math.min(effectFame, 4));
		}
	},
	{
		ID: 11008,
		Name: "Julia",
		Group: ["CollegeTeacher"],
		Reward: "NPC-Julia",
		RequiredLevel: 2,
		FamePerTurn: 2
	},
	{
		ID: 11009,
		Name: "Yuki",
		Group: ["CollegeTeacher"],
		Reward: "NPC-Yuki",
		RequiredLevel: 3,
		FamePerTurn: 2,
		MoneyPerTurn: 1,
	},
	{
		ID: 11010,
		Name: "Mildred",
		Group: ["CollegeTeacher"],
		Reward: "NPC-Mildred",
		RequiredLevel: 4,
		FamePerTurn: 3,
	},
	{
		ID: 11011,
		Name: "Teacher's Aide",
		Group: ["CollegeTeacher", "CollegeStudent"],
		RequiredLevel: 2,
		FamePerTurn: 1,
		MoneyPerTurn: 1
	},
	{
		ID: 11012,
		Name: "Student Custodian",
		Group: ["CollegeStudent", "Staff"],
		MoneyPerTurn: 1,
		RequiredLevel: 2,
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			const hasCollegeMember = ClubCardGroupIsOnBoard(CCPlayer, 'CollegeTeacher') || ClubCardGroupOnBoardCount(CCPlayer, 'Staff') >= 2;
			if (!hasCollegeMember) {
				return;
			}

			if (cardPlayed.Type === "Event" || ClubCardCardHasGroup(cardPlayed, "Liability")) {
				const moneyToLose = ClubCardGetOpponent(CCPlayer).Level;
				ClubCardPlayerAddMoney(CCPlayer, -moneyToLose);
				ClubCardPlayerDrawCard(CCPlayer, 1);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Student Custodian", {[ClubCardPlaceholderKeys.AMOUNT]: moneyToLose} , CCPlayer);
			}
		}
	},
	{
		ID: 11013,
		Name: "Med Student",
		Group: ["CollegeStudent", "AsylumNurse"],
		RequiredLevel: 2,
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			const asylumPatientPresent = ClubCardGroupIsOnBoard(CCPlayer, "AsylumPatient");
			if (asylumPatientPresent) {
				ClubCardPlayerAddMoney(CCPlayer, 1);
			}

			const collegeTeacherPresent = ClubCardGroupIsOnBoard(CCPlayer, "CollegeTeacher");
			if (collegeTeacherPresent) {
				ClubCardPlayerAddFame(CCPlayer, 1);
			}
		}
	},

	// 12000 - Cards based on online players
	{   // Patreon 2023/09 Contest Winner
		ID: 12000,
		Name: "Sam the Busty Cow",
		Group: ["Player"],
		Reward: "NPC_Stable_Trainer",
		RewardMemberNumber: 98677,
		MoneyPerTurn: 2,
		RequiredLevel: 2
	},
	{   // Discord 2023/09 Contest Winner
		ID: 12001,
		Name: "Suki",
		Group: ["Player"],
		Reward: "NPC_AsylumEntrance_Nurse",
		RewardMemberNumber: 649,
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Maid")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{   // Deviant Art 2023/09 Contest Winner
		ID: 12002,
		Name: "Angela",
		Group: ["Player"],
		Reward: "NPC_Cafe_Maid",
		RewardMemberNumber: 20950,
		FamePerTurn: 1,
		MoneyPerTurn: 3,
		RequiredLevel: 3
	},
	{
		ID: 12003,
		Name: "Alvin",
		Group: ["Dominant", "Mistress", "Sensei", "Player"],
		RewardMemberNumber: 41997,
		RequiredLevel: 3,
		FamePerTurn: 3,
		MoneyPerTurn: -2,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if ((cardPlayed.Type == "Event" && ClubCardCardHasGroup(cardPlayed, "Shibari")) || cardPlayed.Name === "Restrain") {
				ClubCardAlvinCondition(CCPlayer);
			}
		}
	},
	{
		ID: 12004,
		Name: "Sophie",
		Group: ["Player","Kemonomimi"],
		RewardMemberNumber: 1236,
		Reward: "NPC_ClubCardLounge_Tutor",
		RequiredLevel: 3,
		Prerequisite: "SelectAnyMember",
		FamePerTurn: 1,
		MoneyPerTurn: -1,
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) {
				return;
			}

			const modifier = 2;
			const indexToBuff = ClubCardSelection.ArrayIndex;
			let BuffedCard;
			if (ClubCardSelection.Location == "OpponentBoard")
				BuffedCard = ClubCardGetOpponent(CCPlayer).Board[indexToBuff];
			else
				BuffedCard = CCPlayer.Board[indexToBuff];

			if (BuffedCard.FamePerTurn)
				BuffedCard.FamePerTurn = BuffedCard.FamePerTurn * modifier;
			if (BuffedCard.MoneyPerTurn)
				BuffedCard.MoneyPerTurn = BuffedCard.MoneyPerTurn * modifier;

			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Sophie", {[ClubCardPlaceholderKeys.CARDNAME]: ClubCardSelection.Name});
		}
	},
	{
		ID: 12005,
		Name: "Moon",
		Group: ["Player","Pet","Kemonomimi"],
		RewardMemberNumber: 162726,
		Prerequisite: "SelectAnyMember",
		RequiredLevel: 4,
		FamePerTurn: 2,
		MoneyPerTurn: -1,
		OnPlay: function (CCPlayer) {
			const cardToAdd =  ClubCardGetCopyCardByName(ClubCardSelection.Name);
			CCPlayer.Hand.push(cardToAdd);
		}
	},

	// 13000 - Shibari Members
	{
		ID: 13000,
		Name: "Knot Nut",
		Group: ["Knot"],
		MoneyPerTurn: 1
	},
	{
		ID: 13001,
		Name: "Nawashi",
		Group: ["Shibari"],
		RequiredLevel: 4,
		FamePerTurn: 4,
		MoneyPerTurn: -3,
		AfterOpponentTurnEnd: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);

			const nawashiPlayed = ClubCardGetCardsPlayedOnTurn(opponent, opponent.ClubCardTurnCounter - 1).some(card => {
				return card.Name === "Nawashi";
			});

			if (nawashiPlayed && CCPlayer.LastFamePerTurn > 0) {
				ClubCardPlayerAddFame(CCPlayer, CCPlayer.LastFamePerTurn * -1);
				CCPlayer.LastFamePerTurn = 0;
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Nawashi", {}, CCPlayer);
			}
			this.Negated = true;
		}
	},
	{
		ID: 13002,
		Name: "Living Art",
		Group: ["Shibari"],
		MoneyPerTurn: 1,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if ((cardPlayed.Type == "Event" && ClubCardCardHasGroup(cardPlayed, "Shibari")) || ClubCardCardHasGroup(cardPlayed, "Knot")) {
				ClubCardPlayerAddFame(CCPlayer, 1);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Living Art", {[ClubCardPlaceholderKeys.AMOUNT]: 1}, CCPlayer);
			}
		}
	},
	{
		ID: 13003,
		Name: "Rope Slinger",
		Group: ["Shibari"],
		RequiredLevel: 2,
		FamePerTurn: 1,
		OnPlay: function(CCPlayer) {
			for (const card of CCPlayer.Hand.slice()) {
				if (ClubCardCardHasGroup(card, "Knot") && ClubCardCanSummonCard(CCPlayer, card)) {
					ClubCardSummonCard(CCPlayer, card);
					const cardIndexInHnad = CCPlayer.Hand.findIndex(value => value.ID === card.ID);
			        CCPlayer.Hand.splice(cardIndexInHnad, 1);
				}
			}
		},
		onLevelUp: function(CCPlayer) {
			ClubCardRemoveFromBoard(CCPlayer, this, true);
			ClubCardAddToHand(CCPlayer, this);
		}
	},
	{
		ID: 13004,
		Name: "Goddess of Ropes",
		Group: ["Shibari", "Sensei"],
		RequiredLevel: 4,
		FamePerTurn: 5,
		MoneyPerTurn: -5,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Shibari")) {
				ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 1, undefined);
			}
		}
	},

	// 14000 - Pets and Owners
	{
		ID: 14000,
		Name: "Bun Bun",
		Group: ["Pet"],
		MoneyPerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -1);
			ClubCardPlayerAddFame(CCPlayer, 1);
		},
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardCalculateLevelForPets(CCPlayer) >= 5) ClubCardPlayerAddFame(CCPlayer, 1);
			if (ClubCardGroupIsOnBoard(CCPlayer, "Owner")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 14001,
		Name: "Naughty Kitty",
		Group: ["Pet","Kemonomimi"],
		MoneyPerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -3);
			ClubCardPlayerDiscardCard(CCPlayer, 100);
		}
	},
	{
		ID: 14002,
		Name: "Jessica",
		Group: ["Owner", "Mistress"],
		RequiredLevel: 5,
		MoneyPerTurn: 6,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Pet")) {
				const famePerPet = 1;
				ClubCardPlayerAddFame(CCPlayer, famePerPet);
				ClubCardPlayerDrawCard(CCPlayer, 1);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Jessica", {[ClubCardPlaceholderKeys.AMOUNT]: famePerPet}, CCPlayer);
			}
		}
	},
	{
		ID: 14003,
		Name: "MerMaid",
		Group: ["Pet", "Maid"],
		RequiredLevel: 4,
		FamePerTurn: 6,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -25);
			ClubCardPlayerDrawCard(CCPlayer, 1);
			this.ExtraPlay = 1;
		},
		BeforeOpponentTurnEnd: function(CCPlayer) {
			this.ExtraPlay = 0;
		}
	},
	{
		ID: 14004,
		Name: "Puppy",
		Group: ["Pet"],
		RequiredLevel: 2,
		FamePerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -8);
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, Math.floor(ClubCardCalculateLevelForPets(CCPlayer) / 2));
			if (ClubCardGroupIsOnBoard(CCPlayer, "Owner")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 14005,
		Name: "Protective Owner",
		Group: ["Owner"],
		MoneyPerTurn: 1,
		FamePerTurn: -1
	},
	{
		ID: 14006,
		Name: "Feline Fatale",
		Group: ["Pet"],
		Prerequisite: "SelectOpponentMember",
		RequiredLevel: 3,
		FamePerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -14);
			const opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardRemoveFromBoard(opponent, ClubCardSelection);
			const lostFame = ClubCardCalculateLevelForPets(CCPlayer) * -1;
			ClubCardPlayerAddFame(opponent, lostFame);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "LoseFame", { [ClubCardPlaceholderKeys.AMOUNT]: lostFame }, opponent);
		}
	},
	{
		ID: 14007,
		Name: "Wolf Girl",
		Group: ["Pet"],
		RequiredLevel: 2,
		MoneyPerTurn: -1,
		FamePerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -7);
			ClubCardPlayerDiscardCard(ClubCardGetOpponent(CCPlayer), 1);
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, Math.floor(ClubCardCalculateLevelForPets(CCPlayer) / 2));
			if (ClubCardGroupIsOnBoard(CCPlayer, "Owner")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 14008,
		Name: "Pet Rock",
		Group: ["Pet"]
	},
	{
		ID: 14009,
		Name: "Show Dog",
		Group: ["Pet"],
		RequiredLevel: 4,
		MoneyPerTurn: 2,
		FamePerTurn: 4,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -15);
		}
	},
	{
		ID: 14010,
		Name: "Miss Mouse",
		Group: ["Pet"],
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -1);
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Pet")) {
				const famePerPet = Math.floor(ClubCardCalculateLevelForPets(CCPlayer) / 2);
				ClubCardPlayerAddFame(CCPlayer, famePerPet);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Miss Mouse", {[ClubCardPlaceholderKeys.AMOUNT]: famePerPet}, CCPlayer);
			}
		},
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Owner")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 14011,
		Name: "Rich Owner",
		Group: ["Owner"],
		RequiredLevel: 3,
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Pet")) {
				const Money = Math.min(ClubCardGroupOnBoardCount(CCPlayer, "Pet"), 5);
				ClubCardPlayerAddMoney(CCPlayer, Money);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Rich Owner", {[ClubCardPlaceholderKeys.AMOUNT]: Money}, CCPlayer);
			}
		},
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Maid")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},

	// Event cards
	{
		ID: 30000,
		Name: "Scratch and Win",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 7);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainMoney", {[ClubCardPlaceholderKeys.AMOUNT]: 7}, CCPlayer);
		}
	},
	{
		ID: 30001,
		Name: "Kinky Garage Sale",
		Type: "Event",
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 12);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainMoney", {[ClubCardPlaceholderKeys.AMOUNT]: 12}, CCPlayer);
		}
	},
	{
		ID: 30002,
		Name: "Second Mortgage",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 20);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainMoney", {[ClubCardPlaceholderKeys.AMOUNT]: 20}, CCPlayer);
		}
	},
	{
		ID: 30003,
		Name: "Foreign Investment",
		Type: "Event",
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 30);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainMoney", {[ClubCardPlaceholderKeys.AMOUNT]: 30}, CCPlayer);
		}
	},
	{
		ID: 30004,
		Name: "Cat Burglar",
		Type: "Event",
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			let moneyStolen = ClubCardPlayerSteal(CCPlayer, 2, 0).stolenMoney;
			if (moneyStolen < 1)
				ClubCardPlayerSteal(CCPlayer, 0, 2);
			else
				ClubCardPlayerSteal(CCPlayer, 0, 2, true);

			if (!ClubCardGroupIsOnBoard(ClubCardGetOpponent(CCPlayer), "Police")) {
				let extraMoneyStolen = ClubCardPlayerSteal(CCPlayer, 2, 0).stolenMoney;
				if (extraMoneyStolen < 1)
					ClubCardPlayerSteal(CCPlayer, 0, 2);
				else
					ClubCardPlayerSteal(CCPlayer, 0, 2, true);
			}
		}
	},
	{
		ID: 30005,
		Name: "Money Heist",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerSteal(CCPlayer, 6, 0);
			if (ClubCardGroupIsOnBoard(CCPlayer, "Criminal")) ClubCardPlayerSteal(CCPlayer, 2, 0);
			if (!ClubCardGroupIsOnBoard(ClubCardGetOpponent(CCPlayer), "Police"))  ClubCardPlayerSteal(CCPlayer, 4, 0);
		}
	},
	{
		ID: 30006,
		Name: "BDSM Ball",
		Type: "Event",
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			let Fame = 0;
			for (let Card of CCPlayer.Board)
				if ((Card.Group == null) || (!Card.Group.includes("Staff") && !Card.Group.includes("Maid") && !Card.Group.includes("Dominant") && !Card.Group.includes("Liability")))
					Fame++;
			ClubCardPlayerAddFame(CCPlayer, Fame);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFame", {[ClubCardPlaceholderKeys.AMOUNT]: Fame}, CCPlayer);
		}
	},
	{
		ID: 30007,
		Name: "Vampire Ball",
		Type: "Event",
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			let Fame = 0;
			for (let Card of CCPlayer.Board)
				if ((Card.Group == null) || (!Card.Group.includes("Staff") && !Card.Group.includes("Maid") && !Card.Group.includes("Dominant") && !Card.Group.includes("Liability")))
					Fame = Fame + 3;
			ClubCardPlayerAddFame(CCPlayer, Fame);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFame", {[ClubCardPlaceholderKeys.AMOUNT]: Fame}, CCPlayer);
		}
	},
	{
		ID: 30008,
		Name: "Straitjacket Saturday",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			let Money = ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") * 4;
			ClubCardPlayerAddMoney(CCPlayer, Money);
			ClubCardPlayerDrawGroupCard(CCPlayer, ["AsylumNurse"], undefined);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainMoney", {[ClubCardPlaceholderKeys.AMOUNT]: Money}, CCPlayer);
		}
	},
	{
		ID: 30009,
		Name: "Charity Auction",
		Type: "Event",
		Prerequisite: "SelectOwnMember",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection);
			let Fame = CCPlayer.Level;
			let auctioneersPresent = ClubCardNameCountOnBoard(CCPlayer, "Auctioneer");
			while (auctioneersPresent > 0) {
				Fame = Fame * 2;
				auctioneersPresent--;
			}
			ClubCardPlayerAddFame(CCPlayer, Fame);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFame", {[ClubCardPlaceholderKeys.AMOUNT]: Fame}, CCPlayer);
		}
	},
	{
		ID: 30010,
		Name: "Slave Auction",
		Type: "Event",
		Prerequisite: "SelectOwnMember",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection);
			let Money = CCPlayer.Level;
			let auctioneersPresent = ClubCardNameCountOnBoard(CCPlayer, "Auctioneer");
			while (auctioneersPresent > 0) {
				Money = Money * 2;
				auctioneersPresent--;
			}
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection);
			ClubCardPlayerAddMoney(CCPlayer, Money);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainMoney", {[ClubCardPlaceholderKeys.AMOUNT]: Money}, CCPlayer);
		}
	},
	{
		ID: 30011,
		Name: "College Bash",
		Type: "Event",
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			let Fame = ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent") * 2;
			if (Fame > 0) {
				if (ClubCardNameIsOnBoard(CCPlayer, "Sidney")) Fame = Fame * 2;
				ClubCardPlayerAddFame(CCPlayer, Fame);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFame", {[ClubCardPlaceholderKeys.AMOUNT]: Fame}, CCPlayer);
			}
		}
	},
	{
		ID: 30012,
		Name: "Ransomware",
		Type: "Event",
		RequiredLevel: 2,
		Reward: "NPC_Infiltration_Supervisor",
		OnPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			if (!ClubCardNameIsOnBoard(Opponent, "Amanda") && !ClubCardNameIsOnBoard(Opponent, "Jennifer")) {
				const amount = Opponent.Level * -5;
				ClubCardPlayerAddMoney(Opponent, amount);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "LoseMoney", { [ClubCardPlaceholderKeys.AMOUNT]: amount }, Opponent);
			}
		},
		CanPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			return !ClubCardNameIsOnBoard(Opponent, "Amanda") && !ClubCardNameIsOnBoard(Opponent, "Jennifer");
		}
	},
	{
		ID: 30013,
		Name: "Shibari Evening",
		Type: "Event",
		Group: ["Shibari"],
		Reward: "NPC_Shibari_Student",
		OnPlay: function(CCPlayer) {
			if ((CCPlayer.Board == null) || (CCPlayer.Board.length <= 0)) return;
			let Fame = CCPlayer.Board.length - ClubCardGroupOnBoardCount(CCPlayer, "Dominant");

			const shibariCardsOnBoard = ClubCardGroupOnBoardCount(CCPlayer, "Shibari");
			Fame = Fame + shibariCardsOnBoard;
			ClubCardPlayerAddFame(CCPlayer, Fame);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFame", {[ClubCardPlaceholderKeys.AMOUNT]: Fame}, CCPlayer);
		}
	},
	{
		ID: 30014,
		Name: "Moving Out of Town",
		Type: "Event",
		Prerequisite: "SelectOpponentMember",
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromBoard(ClubCardGetOpponent(CCPlayer), ClubCardSelection);
		}
	},
	{
		ID: 30015,
		Name: "Virtual Meeting",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 2);
		}
	},
	{
		ID: 30016,
		Name: "Weekend Meeting",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 3);
		}
	},
	{
		ID: 30017,
		Name: "Fancy Meeting",
		Type: "Event",
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 5);
		}
	},
	{
		ID: 30018,
		Name: "Prank",
		Type: "Event",
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDiscardCard(ClubCardGetOpponent(CCPlayer), 2);
		}
	},
	{
		ID: 30019,
		Name: "Sabotage",
		Type: "Event",
		RequiredLevel: 4,
		Time: 3,
		BeforeOpponentTurnEnd: function(CCPlayer) {
			if (ClubCardTurnCardPlayed > 0) ClubCardPlayerDiscardCard(CCPlayer, 1);
		}
	},
	{
		ID: 30020,
		Name: "Nursery Night",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			let Money = ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby") + ClubCardGroupOnBoardCount(CCPlayer, "ABDLMommy") + ClubCardGroupOnBoardCount(CCPlayer, "Maid");
			Money = Money * 3;
			ClubCardPlayerAddMoney(CCPlayer, Money);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainMoney", {[ClubCardPlaceholderKeys.AMOUNT]: Money}, CCPlayer);
		}
	},
	{
		ID: 30021,
		Name: "Kidnapping",
		Type: "Event",
		Reward: "NPC_KidnapLeague_RandomKidnapper",
		Prerequisite: "SelectOpponentMember",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;

			const targetIsDominantOrMistress = ClubCardCardHasGroup(ClubCardSelection, "Dominant") || ClubCardCardHasGroup(ClubCardSelection, "Mistress");
			if (targetIsDominantOrMistress) {
				let slavesToSummon = ClubCardNameCountOnBoard(CCPlayer, "Alvin");
				while (slavesToSummon > 0) {
					ClubCardAlvinCondition(CCPlayer);
					slavesToSummon--;
				}
			}

			let Opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardRemoveFromBoard(Opponent, ClubCardSelection);
			let Money = Math.pow(Opponent.Level, 2);
			ClubCardPlayerAddMoney(CCPlayer, Money * -1);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "LoseMoney", { [ClubCardPlaceholderKeys.AMOUNT]: Money }, CCPlayer);
		}
	},
	{
		ID: 30022,
		Name: "Pandora Box",
		Type: "Event",
		Reward: "Pandora-Loot-Box",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDiscardCard(CCPlayer, 100);
			ClubCardPlayerDrawCard(CCPlayer, 5);
			const opponent = ClubCardGetOpponent(CCPlayer);
			while (opponent.Hand.length < 4) {
				if (opponent.Deck.length < 1) {
					break;
				}
				ClubCardPlayerDrawCard(opponent, 1);
			}
			ClubCardPlayerDrawCard(opponent, 1);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Pandora Box", {}, CCPlayer);
		}
	},
	{
		ID: 30023,
		Name: "Toy Box",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 3);
			ClubCardPlayerDrawCard(CCPlayer, 1);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainMoney", {[ClubCardPlaceholderKeys.AMOUNT]: 3}, CCPlayer);
		}
	},
	{
		ID: 30024,
		Name: "Restrain",
		Type: "Event",
		Time: 3,
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			const Opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardRemoveCardsFromEventByName(Opponent, Opponent.Event.map(c => c.Name));

			const PlayerEventNames = CCPlayer.Event.map(c => c.Name);
			ClubCardRemoveCardsFromEventByName(CCPlayer, PlayerEventNames.filter(n => n !== "Restrain"));
		}
	},
	{
		ID: 30025,
		Name: "Launder",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			let Money = CCPlayer.Money;
			ClubCardPlayerAddMoney(CCPlayer, Money * -1);
			let Fame = Math.floor(Money / 3);
			ClubCardPlayerAddFame(CCPlayer, Fame);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFame", {[ClubCardPlaceholderKeys.AMOUNT]: Fame}, CCPlayer);
		},
		CanPlay: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Criminal") && CCPlayer.Money >= 3) return true;
			return false;
		}
	},
	{
		ID: 31000,
		Name: "Bad Press",
		Type: "Event",
		Time: 3,
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromEventByName(ClubCardGetOpponent(CCPlayer), "Clever Marketing");
		},
		AfterOpponentTurnEnd: function(CCPlayer) {
			let Fame = CCPlayer.LastFamePerTurn;
			if (Fame > 0) {
				ClubCardPlayerAddFame(CCPlayer, Fame * -1);
				CCPlayer.LastFamePerTurn = 0;
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Bad Press", {}, CCPlayer);
			}
		}
	},
	{
		ID: 31001,
		Name: "Clever Marketing",
		Type: "Event",
		Time: 3,
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromEventByName(ClubCardGetOpponent(CCPlayer), "Bad Press");
		},
		AfterTurnEnd: function (CCPlayer) {
			let Fame = CCPlayer.LastFamePerTurn;
			if (Fame > 0) {
				ClubCardPlayerAddFame(CCPlayer, Fame);
				CCPlayer.LastFamePerTurn = Fame * 2;
				ClubCardMessageAdd(ClubCardMessageType.TURNENDEFFECT, "Effect Clever Marketing", {}, CCPlayer);

			}
		}
	},
	{
		ID: 31002,
		Name: "Repay Loan",
		Type: "Event",
		Time: 3,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromEventByName(ClubCardGetOpponent(CCPlayer), "Bank Loan");
		},
		AfterOpponentTurnEnd: function(CCPlayer) {
			let Money = CCPlayer.LastMoneyPerTurn;
			if (Money > 0) {
				ClubCardPlayerAddMoney(CCPlayer, Money * -1);
				CCPlayer.LastMoneyPerTurn = 0;
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Repay Loan", {}, CCPlayer);
			}
		}
	},
	{
		ID: 31003,
		Name: "Bank Loan",
		Type: "Event",
		Time: 3,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromEventByName(ClubCardGetOpponent(CCPlayer), "Repay Loan");
		},
		AfterTurnEnd: function (CCPlayer) {
			let Money = CCPlayer.LastMoneyPerTurn;
			if (Money > 0) {
				ClubCardPlayerAddMoney(CCPlayer, Money);
				CCPlayer.LastMoneyPerTurn = Money * 2;
				ClubCardMessageAdd(ClubCardMessageType.TURNENDEFFECT, "Effect Bank Loan", {}, CCPlayer);
			}
		}
	},
	{
		ID: 31004,
		Name: "Teamwork",
		Type: "Event",
		Time: 4,
		ExtraDraw: 1
	},
	{
		ID: 31005,
		Name: "Overtime",
		Type: "Event",
		Time: 3,
		ExtraPlay: 1
	},
	{
		ID: 31006,
		Name: "Porn Convention",
		Type: "Event",
		Time: 3,
		RequiredLevel: 4,
		BeforeTurnEnd: function(CCPlayer) {
			let Fame = ClubCardGroupOnBoardCount(CCPlayer, "PornActress");
			if (Fame > 0) {
				Fame = Fame * 3;
				ClubCardPlayerAddFame(CCPlayer, Fame);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Porn Convention", {[ClubCardPlaceholderKeys.AMOUNT]: Fame}, CCPlayer);
			}
		},
		BeforeOpponentTurnEnd: function(CCPlayer) {
			let Fame = ClubCardGroupOnBoardCount(CCPlayer, "PornActress");
			if (Fame > 0) {
				Fame = Fame * 3;
				ClubCardPlayerAddFame(CCPlayer, Fame);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Porn Convention", {[ClubCardPlaceholderKeys.AMOUNT]: Fame}, CCPlayer);
			}
		}
	},
	{
		ID: 31007,
		Name: "Daycare Party",
		Type: "Event",
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			const mommyCount = ClubCardGroupOnBoardCount(CCPlayer, "ABDLMommy");
			const fame = mommyCount * 4;
			ClubCardPlayerAddFame(CCPlayer, fame);
			ClubCardPlayerDrawCard(CCPlayer, mommyCount);
			if (mommyCount > 0)
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Daycare Party", {[ClubCardPlaceholderKeys.AMOUNT]: fame}, CCPlayer);
		}
	},
	{
		ID: 31008,
		Name: "Homeroom",
		Type: "Event",
		Time: 4,
		CanPlay: function(CCPlayer) {
			const collegeCards = CCPlayer.Board.filter(
				card => ClubCardCardHasGroup(card, "CollegeStudent") || ClubCardCardHasGroup(card, "CollegeTeacher")
			);

			return collegeCards.length >= 3;
		}
	},
	{
		ID: 31009,
		Name: "Recess",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			const abdlBabies = ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby");
			const collegeStudents = ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent");
			const abdlAndCollegeBonus = (abdlBabies + collegeStudents) * 2;

			ClubCardPlayerDrawCard(CCPlayer, 2);
			ClubCardPlayerAddMoney(CCPlayer, abdlAndCollegeBonus);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Recess", {[ClubCardPlaceholderKeys.AMOUNT]: abdlAndCollegeBonus}, CCPlayer);
		}
	},
	{
		ID: 31010,
		Name: "First Bell",
		Type: "Event",
		Time: 0,
		OnPlay: function(CCPlayer) {
			const hasTeacher = ClubCardGroupIsOnBoard(CCPlayer, "CollegeTeacher");
			if (CCPlayer.ClubCardTurnCounter === 1 || hasTeacher) {
				this.ExtraPlay = 1;
			}

			const drawn = ClubCardPlayerDrawGroupCard(CCPlayer, ["CollegeStudent"], undefined);
			const textGetKey = drawn
				? "Effect First Bell Draw"
				: "Effect First Bell No Draw";
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, textGetKey, {}, CCPlayer);

		},
		BeforeOpponentTurnEnd: function() {
			this.ExtraPlay = 0;
		}
	},
	{
		ID: 31011,
		Name: "Help Button",
		Type: "Event",
		RequiredLevel: 2,
		Prerequisite: "SelectOwnMember",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection, true);

			// Return the card to its owner's deck
			if (ClubCardIsLiability(ClubCardSelection)) {
				let Opponent = ClubCardGetOpponent(CCPlayer);
				Opponent.Deck.push(ClubCardSelection);
				Opponent.Deck = ClubCardShuffle(Opponent.Deck);
			} else {
				CCPlayer.Deck.push(ClubCardSelection);
				CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
			}

			// Summon a maid or nurse if possible
			const summoned = ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Maid", "AsylumNurse"], 1, ClubCardSelection.RequiredLevel);
			if (!summoned)
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Help Button No Draw", {}, CCPlayer);
		}
	},
	{
		ID: 31012,
		Name: "Public Spanking",
		Type: "Event",
		Time: 3,
		RequiredLevel: 2,
		BeforeTurnEnd: function (CCPlayer) {
			let domsOnBoard = CCPlayer.Board.filter(card => ClubCardCardHasGroup(card, "Dominant"));
			//Maximum Dominant RequiredLevel on the board or 0 if there are none.
			let fameReduction = domsOnBoard.reduce((max, card) => Math.max(max, card.RequiredLevel ?? 1), 0);
			let penalty = 4 + fameReduction;

			const opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardPlayerAddFame(opponent, -penalty);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Public Spanking", {[ClubCardPlaceholderKeys.AMOUNT]: penalty }, opponent);
		}
	},
	{
		ID: 31013,
		Name: "Burlington Bowtie",
		Type: "Event",
		Group: ["Knot"],
		OnPlay: function(CCPlayer) {
			const senseiInClub = CCPlayer.Board.filter(card => ClubCardCardHasGroup(card, "Sensei"));
			const amount = 4 + (senseiInClub.length * 2);
			ClubCardPlayerAddFame(CCPlayer, amount);
			ClubCardMessageAdd(ClubCardMessageType.KNOTEVENT, "Effect Burlington Bowtie", {[ClubCardPlaceholderKeys.AMOUNT]: amount},CCPlayer);
		}
	},
	{
		ID: 31014,
		Name: "Square Knot",
		Type: "Event",
		Group: ["Knot"],
		OnPlay: function (CCPlayer) {
			const fame = 4;
			ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -fame);
			ClubCardMessageAdd(ClubCardMessageType.KNOTEVENT, "Effect Square Knot", {[ClubCardPlaceholderKeys.AMOUNT]: fame}, CCPlayer);
			if (ClubCardGroupIsOnBoard(CCPlayer, "Sensei")) {
				ClubCardPlayerAddFame(CCPlayer, fame);
				ClubCardMessageAdd(ClubCardMessageType.KNOTEVENT, "Effect Square Knot Sensei", {[ClubCardPlaceholderKeys.AMOUNT]: fame}, CCPlayer);
			}
		}
	},
	{
		ID: 31015,
		Name: "Closed Hitch",
		Type: "Event",
		Group: ["Knot"],
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 1);
			ClubCardMessageAdd(ClubCardMessageType.KNOTEVENT, "Effect Closed Hitch", {}, CCPlayer);
		}
	},
	{
		ID: 31016,
		Name: "Struggler's Knot",
		Type: "Event",
		Group: ["Knot"],
		ExtraPlay: 1,
		Time: 0
	},
	{
		ID: 31017,
		Name: "Quick Release Knot",
		Type: "Event",
		Group: ["Knot"],
		OnPlay: function(CCPlayer) {
			const knotsInDiscardPile = CCPlayer.DiscardPile.filter(card => ClubCardCardHasGroup(card, "Knot"));
			const amount = 3 + knotsInDiscardPile.length;
			ClubCardPlayerAddMoney(CCPlayer, amount);
			for (const card of knotsInDiscardPile) {
				CCPlayer.Deck.push(card);
				const indexToRemove = CCPlayer.DiscardPile.findIndex(c => c.ID === card.ID);
				CCPlayer.DiscardPile.splice(indexToRemove, 1);
			}
			CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
			ClubCardMessageAdd(ClubCardMessageType.KNOTEVENT, "Effect Quick Release Knot", {[ClubCardPlaceholderKeys.AMOUNT]: amount}, CCPlayer);
		}
	},
	{
		ID: 31018,
		Name: "Rope Auction",
		Type: "Event",
		Group: ["Shibari"],
		RequiredLevel: 2,
		Prerequisite: "SelectOwnMember",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection);
			let knotsToPlay = 1;
			let auctioneersPresent = ClubCardNameCountOnBoard(CCPlayer, "Auctioneer");
			while (auctioneersPresent > 0) {
				knotsToPlay = knotsToPlay * 2;
				auctioneersPresent--;
			}
			ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], knotsToPlay, undefined);
		}
	},
	{
		ID: 31019,
		Name: "Tie Tight",
		Type: "Event",
		Group: ["Shibari"],
		RequiredLevel: 3,
		Prerequisite: "SelectOpponentMember",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;

			const opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardRemoveFromBoard(opponent, ClubCardSelection, true);
			opponent.Deck.push(ClubCardSelection);
			opponent.Deck = ClubCardShuffle(opponent.Deck);

			ClubCardPlayerDrawCard(opponent, 1);
		}
	},
	{
		ID: 31020,
		Name: "Master Class",
		Type: "Event",
		Group: ["Shibari"],
		RequiredLevel: 3,
		Time: 3,
		turnStart: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Sensei")) {
				ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 1, undefined);
			}
		}
	},
	{
		ID: 31021,
		Name: "Fit To Be Tied",
		Type: "Event",
		Group: ["Shibari"],
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			let knotsInHand = CCPlayer.Hand.filter(card => ClubCardCardHasGroup(card, "Knot"));
			let knotsInDeck = CCPlayer.Deck.filter(card => ClubCardCardHasGroup(card, "Knot"));
			let knotsInDiscard = CCPlayer.DiscardPile.filter(card => ClubCardCardHasGroup(card, "Knot"));

			CCPlayer.Hand = CCPlayer.Hand.filter(card => !ClubCardCardHasGroup(card, "Knot"));
			CCPlayer.Deck = CCPlayer.Deck.filter(card => !ClubCardCardHasGroup(card, "Knot"));
			CCPlayer.DiscardPile = CCPlayer.DiscardPile.filter(card => !ClubCardCardHasGroup(card, "Knot"));

			for (const card of knotsInHand) {
				ClubCardSummonCard(CCPlayer, card);
			}
			for (const card of knotsInDeck) {
				ClubCardSummonCard(CCPlayer, card);
			}
			for (const card of knotsInDiscard) {
				ClubCardSummonCard(CCPlayer, card);
			}
			const knotsToReturn = CCPlayer.DiscardPile.filter(card => ClubCardCardHasGroup(card, "Knot"));
			for (const card of knotsToReturn) {
				CCPlayer.Deck.push(card);
				const indexToRemove = CCPlayer.DiscardPile.findIndex(c => c.ID === card.ID);
				CCPlayer.DiscardPile.splice(indexToRemove, 1);
			}
			CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
		}
	},
	{
		ID: 31022,
		Name: "Pet toys",
		Type: "Event",
		RequiredLevel: 2,
		ExtraPlay: 1,
		Time: 0,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, (ClubCardGroupOnBoardCount(CCPlayer, "Pet") * 2));
			ClubCardPlayerAddFame(CCPlayer, (ClubCardGroupOnBoardCount(CCPlayer, "Owner") * 2));
		}
	},
	{
		ID: 31023,
		Name: "Tips",
		Type: "Event",
		Time: 5,
		turnStart: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 31024,
		Name: "Feather Duster",
		Type: "Event",
		Prerequisite: "SelectAnyEvent",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;

			const isPlayerBoard = ClubCardSelection.Location === "PlayerBoard";
			const targetPlayer = isPlayerBoard ? CCPlayer : ClubCardGetOpponent(CCPlayer);
			const indexToRemove = targetPlayer.Event.findIndex(c => c.ID === ClubCardSelection.ID);
			targetPlayer.Event.splice(indexToRemove, 1);

			if (ClubCardGroupIsOnBoard(CCPlayer, "Maid")) {
				ClubCardPlayerAddMoney(CCPlayer, ClubCardSelection.RequiredLevel ? ClubCardSelection.RequiredLevel : 1);
				ClubCardPlayerDrawCard(CCPlayer, 1);
			}
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "EventRemoved", {[ClubCardPlaceholderKeys.CARDNAME]: ClubCardSelection.Name}, CCPlayer);
		}
	},
	{
		ID: 31025,
		Name: "Afterhours Service",
		Type: "Event",
		RequiredLevel: 5,
		Time: 3,
		BeforeTurnEnd: function(CCPlayer) {
			let groupsCardsOnBoard = CCPlayer.Board.filter(value => ["Maid", "Staff"].some(group => ClubCardCardHasGroup(value, group)));
			ClubCardPlayerAddFame(CCPlayer, groupsCardsOnBoard.length);
			ClubCardPlayerAddMoney(CCPlayer, groupsCardsOnBoard.length * -2);
		}
	}
];

/**
 * Returns TRUE if the current game is online
 * @returns {boolean} - Nothing
 */
function ClubCardIsOnline() {
	return ((ClubCardOnlinePlayerMemberNumber1 != null) && (ClubCardOnlinePlayerMemberNumber1 >= 0));
}

/**
 * Returns TRUE if the BC Player is a player in the current Club Card game
 * @returns {boolean} - Nothing
 */
function ClubCardIsPlaying() {
	return ((ClubCardOnlinePlayerMemberNumber1 == null) || (ClubCardOnlinePlayerMemberNumber1 === -1) || (ClubCardOnlinePlayerMemberNumber1 == Player.MemberNumber) || (ClubCardOnlinePlayerMemberNumber2 == Player.MemberNumber));
}

/**
 * In case one of the players disconnects from the server, the other player sends a message about it to the game chat.
 * @param {number} disconnectedMemberNumber
 */
function ClubCardCheckDisconnected(disconnectedMemberNumber) {
	const isPlayer1 = Player.MemberNumber == ClubCardPlayer[0].Character.MemberNumber;
	const isPlayer2 = disconnectedMemberNumber == ClubCardPlayer[1].Character.MemberNumber;

	if (isPlayer1 && isPlayer2) {
		const CCPlayer = ClubCardPlayer[1];
		ClubCardMessageAdd(ClubCardMessageType.PLAYERSDISCONNECTED, "OnlinePlayerDisconnected", {}, CCPlayer);
	}
}

// #region Reset ClubCard Game Status

/**
 * Resets club card game status and synchronizes
 */
function ClubCardResetGameStatus() {
	Player.Game.ClubCard.PlayerSlot = 0;
	Player.Game.ClubCard.Status = "";
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	ChatRoomCharacterUpdate(Player);
}

/**
 * A hidden message to trigger all room members and a normal notification message to the chat room.
 */
function ClubCardSendRequestResetGame() {
	ServerSend("ChatRoomChat", { Content: "ClubCardAdminResetGameHidden", Type: "Hidden" });

	const Dictionary = new DictionaryBuilder().sourceCharacter(Player).build();
	Dictionary.push({Tag: "SourceCharacter", Text: CharacterNickname(Player), MemberNumber: Player.MemberNumber});
	ServerSend("ChatRoomChat", { Content: "ClubCardAdminResetGame", Type: "Action" , Dictionary: Dictionary});
}

// #endregion Reset Game Status

// #region Chat Log Stuff

/**
 * Adds a message to the storage for processing later.
 * Sends messages immediately if their type matches the ClubCardImmediateMessageTypes array.
 *
 * @param {string} TextGetKey - Localization key
 * @param {string} MessageType - Message type (constant)
 * @param {Record<string, any>} placeholders - Dynamic data for text replacement
 * @param {ClubCardPlayer|null} TargetPlayer - The source player
 * @param {string} MessageText - if TextGetKey is not used
 */
function ClubCardMessageAdd(MessageType, TextGetKey, placeholders = {}, TargetPlayer = null, MessageText = null) {
	const CCPlayer = ClubCardPlayer[ClubCardTurnIndex];
	//self message
	const PlayerName = CharacterNickname(CCPlayer.Character);
	//target message
	const SourcePlayer = TargetPlayer ? CharacterNickname(TargetPlayer.Character) : null;
	const OpponentPlayer = TargetPlayer ? CharacterNickname(ClubCardGetOpponent(TargetPlayer).Character) : null;
	let playerId = (CCPlayer.Control === "AI")
			? "ControlAI"
			: `${CCPlayer.Character.MemberNumber}`;


	const messageEntry = {
		TextGetKey: TextGetKey,
		MessageText: MessageText,
		MessageType: MessageType,
		PlayerId: playerId,
		TurnCounter: CCPlayer.ClubCardTurnCounter,
		Placeholders: placeholders,

		PlayerName: PlayerName,
		SourcePlayer: SourcePlayer,
		OpponentPlayer: OpponentPlayer
	};

	// If the message type is immediate, send it directly and don't store it
	if (ClubCardImmediateMessageTypes.some(type => type === MessageType))
		ClubCardMessageSend(messageEntry);
	else
		ClubCardMessageStorage.push(messageEntry);
}

/**
 * Sends a message to the render log and synchronizes it with other players.
 * This method is used for immediate messages and for sending processed messages from storage.
 *
 * @param {ClubCardMessage} message - The message object to be sent
 * @param {boolean} Push - Whether to send the message to other players
 */
function ClubCardMessageSend(message, Push = true) {
	if (message) {
		// Add message to render log for display in the UI
		ClubCardRenderLog.push(message);
		// Enable auto-scrolling for the chat log
		ClubCardLogScroll = true;

		// Synchronize message with other players if online
		if (Push && ClubCardIsOnline() && message.MessageType != ClubCardMessageType.PREREQUISTITE)
			ServerSend("ChatRoomGame", { GameProgress: "Action", CCLog: message });
	}
}

/**
 * Processes stored messages, merges similar ones, clears the storage,
 * and sends all messages using the ClubCardSendMessage function.
 */
function ClubCardMessageSendAll() {
	if (ClubCardMessageStorage.length === 0) return;

	//TODO Process stored messages to merge similar ones
	ClubCardMessagePacketProcessing();

	// Send each processed message using the send function
	for (const message of ClubCardMessageStorage)
		ClubCardMessageSend(message);

	// Clear storage
	ClubCardMessageStorage = [];
}


// #### Text processing ####

/**
 * Processes and merges specific messages from the storage.
 */
function ClubCardMessagePacketProcessing() {
	const specialCases = ["Effect Hypnotherapist", "StealMoney", "StealFame"];
	const mergeableKeys = ["Effect Rope Slave", "Effect Living Art"];

	const hasRelevantMessages = ClubCardMessageStorage.some(msg =>
		[...specialCases, ...mergeableKeys].includes(msg.TextGetKey)
	);
	if (!hasRelevantMessages) return;

	let ropeSlaveMessages = [];
	let livingArtMessages = [];
	let stealMoneyMessages = [];
	let stealFameMessages = [];
	let burlingtonBowtieMeesages = [];
	let squareKnotMeesages = [];
	let squareKnotSenseiMeesages = [];
	let closedHitchMeesages = [];
	let quickReleaseKnotMeesages = [];

	let isHypnotherapist = false;

	for (let i = 0; i < ClubCardMessageStorage.length; i++) {
		const message = ClubCardMessageStorage[i];
		if (message.TextGetKey === "Effect Rope Slave") ropeSlaveMessages.push({ message, index: i });
		else if (message.TextGetKey === "Effect Living Art") livingArtMessages.push({ message, index: i });
		else if (message.TextGetKey === "StealMoney") stealMoneyMessages.push({ message, index: i });
		else if (message.TextGetKey === "StealFame") stealFameMessages.push({ message, index: i });

		else if (message.TextGetKey === "Effect Hypnotherapist") isHypnotherapist = true;

		else if (message.TextGetKey === "Effect Burlington Bowtie") burlingtonBowtieMeesages.push({ message, index: i });
		else if (message.TextGetKey === "Effect Square Knot") squareKnotMeesages.push({ message, index: i });
		else if (message.TextGetKey === "Effect Square Knot Sensei") squareKnotSenseiMeesages.push({ message, index: i });
		else if (message.TextGetKey === "Effect Closed Hitch") closedHitchMeesages.push({ message, index: i });
		else if (message.TextGetKey === "Effect Quick Release Knot") quickReleaseKnotMeesages.push({ message, index: i });
	}

	// ### Normal merging of messages into one
	if (ropeSlaveMessages.length > 1) ClubCardMessagesMerge(ropeSlaveMessages);
	if (livingArtMessages.length > 1) ClubCardMessagesMerge(livingArtMessages);
	if (burlingtonBowtieMeesages.length > 1) ClubCardMessagesMerge(burlingtonBowtieMeesages);
	if (squareKnotMeesages.length > 1) ClubCardMessagesMerge(squareKnotMeesages);
	if (squareKnotSenseiMeesages.length > 1) ClubCardMessagesMerge(squareKnotSenseiMeesages);
	if (closedHitchMeesages.length > 1) ClubCardMessagesMerge(closedHitchMeesages);
	if (quickReleaseKnotMeesages.length > 1) ClubCardMessagesMerge(quickReleaseKnotMeesages);
	// ###

	// ### Unique processing
	//Effect Hypnotherapist
	if (isHypnotherapist)
		ClubCardMessageStorage = ClubCardMessageStorage.filter(msg => msg.TextGetKey !== "MemberLeaveClub");
	//StealMoney & StealFame
	if (stealMoneyMessages.length > 0 && stealFameMessages.length > 0) {
		ClubCardMessagesMergeSteal(stealMoneyMessages, stealFameMessages);
	} else {
		if (stealMoneyMessages.length > 1) ClubCardMessagesMerge(stealMoneyMessages);
		if (stealFameMessages.length > 1) ClubCardMessagesMerge(stealFameMessages);
	}
	// ###
}


/**
 * Merges multiple messages by summing their AMOUNT placeholder and keeping the last message.
 *
 * @param {Array<{ message: ClubCardMessage, index: number }>} messageArray - The array of messages with their indexes.
 */
function ClubCardMessagesMerge(messageArray) {
	if (messageArray.length <= 1) return;

	const totalAmount = messageArray.reduce((sum, item) =>
		sum + Number(item.message.Placeholders[ClubCardPlaceholderKeys.AMOUNT] || 0), 0
	);

	const lastMessage = { ...messageArray[messageArray.length - 1].message };
	lastMessage.Placeholders[ClubCardPlaceholderKeys.AMOUNT] = totalAmount;

	ClubCardMessageStorage = ClubCardMessageStorage.filter(msg => msg.TextGetKey !== lastMessage.TextGetKey);
	ClubCardMessageStorage.splice(messageArray[messageArray.length - 1].index, 0, lastMessage);
}

/**
 * Merges "StealMoney" and "StealFame" messages into one.
 *
 * @param {Array<{ message: ClubCardMessage, index: number }>} stealMoneyMessages - Messages related to stealing money.
 * @param {Array<{ message: ClubCardMessage, index: number }>} stealFameMessages - Messages related to stealing fame.
 */
function ClubCardMessagesMergeSteal(stealMoneyMessages, stealFameMessages) {
	const minIndex = Math.min(stealMoneyMessages[0].index, stealFameMessages[0].index);

	const newMessage = stealMoneyMessages[0].index === minIndex
        ? stealMoneyMessages[0].message
		: stealFameMessages[0].message;

	const mergedMessage = { ...newMessage };

	const totalMoney = stealMoneyMessages.reduce((sum, item) =>
		sum + Number(item.message.Placeholders[ClubCardPlaceholderKeys.AMOUNT] || 0), 0
	);
	const totalFame = stealFameMessages.reduce((sum, item) =>
		sum + Number(item.message.Placeholders[ClubCardPlaceholderKeys.AMOUNT] || 0), 0
	);

	mergedMessage.TextGetKey = "StealFameMoney";
	mergedMessage.Placeholders = {
		[ClubCardPlaceholderKeys.MONEYAMOUNT]: totalMoney,
		[ClubCardPlaceholderKeys.FAMEAMOUNT]: totalFame
	};

	//Clear ClubCardMessageStorage from StealMoney and StealFame
	ClubCardMessageStorage = ClubCardMessageStorage.filter(msg =>
		msg.TextGetKey !== "StealMoney" && msg.TextGetKey !== "StealFame"
	);

	ClubCardMessageStorage.splice(minIndex, 0, mergedMessage);
}

/**
 * Generates a formatted message text by replacing placeholders with actual values.
 * @param {ClubCardMessage} ClubCardMessage - Message Item
 * @returns {string} MessageText
 */
function ClubCardMessageGetText(ClubCardMessage) {
	let messageText = ClubCardMessage.TextGetKey
		? TextGet(ClubCardMessage.TextGetKey)
		: ClubCardMessage.MessageText;

	if (ClubCardMessage.PlayerName) messageText = messageText.replace("PLAYERNAME", ClubCardMessage.PlayerName);
	if (ClubCardMessage.SourcePlayer) messageText = messageText.replace("SOURCEPLAYER", ClubCardMessage.SourcePlayer);
	if (ClubCardMessage.OpponentPlayer) messageText = messageText.replace("OPPONENTPLAYER", ClubCardMessage.OpponentPlayer);
	if (ClubCardMessage.TurnCounter) messageText = messageText.replace("TURNNUMBER", `${ClubCardMessage.TurnCounter}`);


	for (const [key, value] of Object.entries(ClubCardMessage.Placeholders)) {
		if (key == ClubCardPlaceholderKeys.CARDNAME) {
			const card = ClubCardList.find(c => c.Name === value);
			messageText = messageText.replace(key, `"${card.Title ? card.Title : card.Name}"`);
		}
		else
			messageText = messageText.replace(key, `${value}`);
	}

	return messageText;
}

/**
   * Updated the text by mask, for InnerHTML
   * The function finds the necessary words from the arrays and adds colour labels to them.
   * @param {String} text -Normal Card Text
   * @returns {String} -  Updated for InnerHTML Card Text
   */
function ClubCardGetFormatTextForInnerHTML(text) {
	const ClubcardLanguageFame = ["fame","Славы","声望"];
	const ClubcardLanguageMoney = ["money", "Денег", "金钱"];
	const fameRegex = new RegExp(`[+-]?\\d*\\s*(${ClubcardLanguageFame.join("|")})`, "gi");
	const moneyRegex = new RegExp(`[+-]?\\d*\\s*(${ClubcardLanguageMoney.join("|")})`, "gi");

	const formattedText = text
		.replace(fameRegex, (match) => `<span style='color: ${ClubCardFameTextColor};'>${match}</span>`)
		.replace(moneyRegex, (match) => `<span style='color: ${ClubCardMoneyTextColor};'>${match}</span>`);

	return formattedText;
}

// #endregion ClubCard New Chat Stuff

/**
 * Creates a copy of a card from the ClubCardList based on its name.
 * Assigns a new UniqueID and makes the card visible.
 * @param {string} cardName - The name of the card to copy.
 * @returns {ClubCard} - A new card object if found, otherwise null.
 */
function ClubCardGetCopyCardByName(cardName) {
	const originalCard = ClubCardList.find(card => card.Name === cardName);
	if (!originalCard) return null; // Return null if the card is not found

	return {
		...originalCard, // Copy all properties of the original card
		UniqueID: generateUniqueID(originalCard.ID), // Generate a new unique identifier
		IsVisible: true, // Ensure the copied card is visible
		AnimationState: "idle"
	};
}

/**
 * Creates a copy of a card from the ClubCardList based on its id.
 * Assigns a new UniqueID and makes the card visible.
 * @param {number} cardId - The id of the card to copy.
 * @returns {ClubCard} - A new card object if found, otherwise null.
 */
function ClubCardGetCopyCardByID(cardId) {
	const originalCard = ClubCardList.find(card => card.ID === cardId);
	if (!originalCard) return null; // Return null if the card is not found

	return {
		...originalCard, // Copy all properties of the original card
		UniqueID: generateUniqueID(originalCard.ID), // Generate a new unique identifier
		IsVisible: true, // Ensure the copied card is visible
		AnimationState: "idle"
	};
}

/**
 * Generates a globally unique identifier (UniqueID) for a card.
 * The UniqueID is composed of the card's base ID, a high-precision timestamp,
 * and an incrementing counter to ensure uniqueness.
 * @param {number} cardID - The base ID of the card.
 * @returns {string} - A unique string identifier for the card.
 */
function generateUniqueID(cardID) {
	return `${cardID}${Math.floor(performance.now() * 1e6)}${ClubCardUniqueIDCounter++}`;
}

/**
 * Returns a reference to the array where the card is stored based on its Location.
 * @param {ClubCard} card - The card whose location needs to be found.
 * @returns {ClubCard[] | null} - Reference to the corresponding card array or null if not found.
 */
function ClubCardGetCardArrayByLocation(card) {
	if (!card || !card.Location) return null;

	switch (card.Location) {
		case "PlayerHand":
			return ClubCardPlayer[0].Hand;
		case "OpponentHand":
			return ClubCardPlayer[1].Hand;
		case "PlayerBoard":
			return card.Type === "Event" ? ClubCardPlayer[0].Event : ClubCardPlayer[0].Board;
		case "OpponentBoard":
			return card.Type === "Event" ? ClubCardPlayer[1].Event : ClubCardPlayer[1].Board;
		default:
			return null;
	}
}

/**
 * Creates a popop in the middle of the board that pauses the game
 * @param {string} Mode - The popup mode "DECK", "TEXT" or "YESNO"
 * @param {string|null} Text - The text to display
 * @param {string|null} Button1 - The label of the first button
 * @param {string|null} Button2 - The label of the second button
 * @param {string|null} Function1 - The function of the first button
 * @param {string|null} Function2 - The function of the second button
 * @returns {void} - Nothing
 */
function ClubCardCreatePopup(Mode, Text = null, Button1 = null, Button2 = null, Function1 = null, Function2 = null) {
	ClubCardPopup = {
		Mode: Mode,
		Text: Text,
		Button1: Button1,
		Button2: Button2,
		Function1: Function1,
		Function2: Function2
	};
}

/**
 * Destroys the current popup
 * @returns {void} - Nothing
 */
function ClubCardDestroyPopup() {
	ClubCardPopup = null;
}

/**
 * Returns TRUE if the card is a liability (should be played on the opponent side)
 * @param {ClubCard} Card - The card to evaluate
 * @returns {boolean} - TRUE if the card is a liability
 */
function ClubCardIsLiability(Card) {
	return ((Card != null) && (Card.Group != null) && (Card.Group.indexOf("Liability") >= 0));
}

/**
 * Gets the opponent of the parameter player or the player that's not on it's turn if null
 * @param {ClubCardPlayer|null} CCPlayer - The club card player or null
 * @returns {ClubCardPlayer} - The opponent
 */
function ClubCardGetOpponent(CCPlayer = null) {
	if (CCPlayer == null) return (ClubCardTurnIndex == 0) ? ClubCardPlayer[1] : ClubCardPlayer[0];
	return (CCPlayer.Index == 0) ? ClubCardPlayer[1] : ClubCardPlayer[0];
}

/**
 * Gets the opponent of the parameter player or the player that's not on it's turn if null
 * @param {ClubCardPlayer} CCPlayer - The club card player or null
 * @param {Number} turnCounter
 * @returns {ClubCard[]} - The opponent
 */
function ClubCardGetCardsPlayedOnTurn(CCPlayer, turnCounter) {
	return CCPlayer.CardsPlayedThisTurn[turnCounter] ?? [];
}

// #region Changing data

/**
 * Adds money to the club card player stats
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {Number} Amount - The amount to add
 * @returns {void} - Nothing
 */
function ClubCardPlayerAddMoney(CCPlayer, Amount) {
	if (CCPlayer.Money == null) CCPlayer.Money = 0;
	CCPlayer.Money = CCPlayer.Money + Amount;
}

/**
 * Adds fame to the club card player stats, can trigger a victory
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {Number} Amount - The amount to add
 * @returns {void} - Nothing
 */
function ClubCardPlayerAddFame(CCPlayer, Amount) {
	if (CCPlayer.Fame == null) CCPlayer.Fame = 0;
	CCPlayer.Fame = CCPlayer.Fame + Amount;
}

/**
 * Add fame from a player and remove from the ohter player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {Number} moneyAmount - The money amount to steal
 * @param {Number} fameAmount - The fame amount to steal
 * @param {boolean} isStickyFingers - Whether Sticky Fingers effect should be ignored.
 * @returns {{ stolenMoney: number, stolenFame: number }} - The amounts of money and fame stolen.
 */
function ClubCardPlayerSteal(CCPlayer, moneyAmount, fameAmount, isStickyFingers = false) {
	const opponent = ClubCardGetOpponent(CCPlayer);
	let moneyToSteal = 0;
	let fameToSteal = 0;

	if (fameAmount > 0 && opponent.Fame > 0) {
		fameToSteal = Math.min(fameAmount, opponent.Fame);
		ClubCardPlayerAddFame(CCPlayer, fameToSteal);
		ClubCardPlayerAddFame(opponent, -fameToSteal);
		ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "StealFame", {[ClubCardPlaceholderKeys.AMOUNT]: fameToSteal}, CCPlayer);

		if(!isStickyFingers)
			ClubCardApplyStickyFingers(CCPlayer, opponent);
	}

	if (moneyAmount > 0 && opponent.Money > 0) {
		moneyToSteal = Math.min(moneyAmount, opponent.Money);
		ClubCardPlayerAddMoney(CCPlayer, moneyToSteal);
		ClubCardPlayerAddMoney(opponent, -moneyToSteal);
		ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "StealMoney", {[ClubCardPlaceholderKeys.AMOUNT]: moneyToSteal}, CCPlayer);

		if(!isStickyFingers)
			ClubCardApplyStickyFingers(CCPlayer, opponent);
	}

	return { stolenMoney: moneyToSteal, stolenFame: fameToSteal };
}

/**
 * Applies the "Sticky Fingers" effect, stealing extra resources if possible.
 * @param {ClubCardPlayer} CCPlayer - The club card player.
 * @param {ClubCardPlayer} opponent - The opponent player.
 */
function ClubCardApplyStickyFingers(CCPlayer, opponent) {
	let extraSteal = ClubCardNameCountOnBoard(CCPlayer, "Sticky Fingers");
	while (extraSteal > 0) {
		if (opponent.Money > 0) {
			ClubCardPlayerAddMoney(CCPlayer, 1);
			ClubCardPlayerAddMoney(opponent, -1);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "StealMoney", {[ClubCardPlaceholderKeys.AMOUNT]: 1}, CCPlayer);
		}
		if (opponent.Fame > 0) {
			ClubCardPlayerAddFame(CCPlayer, 1);
			ClubCardPlayerAddFame(opponent, -1);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "StealFame", {[ClubCardPlaceholderKeys.AMOUNT]: 1}, CCPlayer);
		}
		extraSteal--;
	}
}

/**
 * Raises the level of player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @returns {void} - Nothing
 */
function ClubCardUpgradeLevel(CCPlayer) {
	// Homeroom blocks both players from ugprading while it is on the board
	const opponent = ClubCardGetOpponent(CCPlayer);
	const updatedCost = ClubCardCalculateLevelCost(CCPlayer);
	const blockedByEvent = ClubCardEventNameIsInEvents(CCPlayer, "Homeroom") || ClubCardEventNameIsInEvents(opponent, "Homeroom");
	const affordLevelUp = CCPlayer.Money < updatedCost;
	const isMaxlevel = CCPlayer.Level >= ClubCardLevelCost.length - 1;

	if (isMaxlevel || affordLevelUp || blockedByEvent)
		return;

	ClubCardPlayerAddMoney(CCPlayer, updatedCost * -1);
	CCPlayer.Level++;
	// Troublemaker check
	if (!ClubCardNameIsOnBoard(CCPlayer, "Bouncer")) {
		const famePenalty = ClubCardNameCountOnBoard(opponent, "Troublemaker") * -3;

		if (famePenalty < 0)
			ClubCardPlayerAddFame(CCPlayer, famePenalty);
	}
	// On level up effects
	for (const card of CCPlayer.Board.slice())
		if (card.onLevelUp)
			card.onLevelUp(CCPlayer);

	const textGetKey = "UpgradedToLevel" + CCPlayer.Level.toString();
	ClubCardMessageAdd(ClubCardMessageType.ACTION, textGetKey, {[ClubCardPlaceholderKeys.MONEYAMOUNT]: updatedCost.toString()});
	GameClubCardSyncOnlineData();
}

// #endregion Changing data

/**
 * Returns TRUE if a card (by name) is currently present on a board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {string} CardName - The name of the card
 * @returns {boolean} - TRUE if at least one card with that name is present
 */
function ClubCardEventNameIsInEvents(CCPlayer, CardName) {
	if ((CCPlayer == null) || (CCPlayer.Event == null) || (CardName == null)) return false;
	for (let Card of CCPlayer.Event)
		if (Card.Name === CardName)
			return true;
	return false;
}

/**
 * Returns TRUE if a card (by name) is currently present on a board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {string} CardName - The name of the card
 * @returns {boolean} - TRUE if at least one card with that name is present
 */
function ClubCardNameIsOnBoard(CCPlayer, CardName) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (CardName == null)) return false;
	for (let Card of CCPlayer.Board)
		if (Card.Name === CardName)
			return true;
	return false;
}

/**
 * Returns the amount of a card (by name) that are currently present on a board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {string} CardName - The name of the card
 * @returns {number} - the amount of members with that name on board
 */
function ClubCardNameCountOnBoard(CCPlayer, CardName) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (CardName == null)) return 0;
	let amount = 0;
	for (let Card of CCPlayer.Board)
		if (Card.Name === CardName)
			amount++;
	return amount;
}

/**
 * Returns TRUE if a card (by group) is currently present on a board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {string} GroupName - The name of the card group
 * @returns {boolean} - TRUE if at least one card from that group is present
 */
function ClubCardGroupIsOnBoard(CCPlayer, GroupName) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (GroupName == null)) return false;
	for (let Card of CCPlayer.Board)
		if (Card.Group != null)
			for (let Group of Card.Group)
				if (Group === GroupName)
					return true;
	return false;
}

/**
 * @param {ClubCard} card to evaluate group
 * @param {string} GroupName group name to find
 * @returns {boolean} - True if the card has the group
 */
function ClubCardCardHasGroup(card, GroupName) {
	return card.Group && card.Group.includes(GroupName);
}

/**
 * Returns the number of cards of a specific group found on a board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {string} GroupName - The name of the card group
 * @returns {number} - The number of cards from that group on the board
 */
function ClubCardGroupOnBoardCount(CCPlayer, GroupName) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (GroupName == null)) return 0;
	let Count = 0;
	for (let Card of CCPlayer.Board)
		if (Card.Group != null)
			for (let Group of Card.Group)
				if (Group === GroupName)
					Count++;
	return Count;
}

/**
 * Returns the number of cards of a specific group found in the discard pile
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {string} GroupName - The name of the card group
 * @returns {number} - The number of cards from that group in the discard pile
 */
function ClubCardGroupInDiscardPileCount(CCPlayer, GroupName) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (GroupName == null)) return 0;
	let Count = 0;
	for (let Card of CCPlayer.DiscardPile)
		if (Card.Group != null)
			for (let Group of Card.Group)
				if (Group === GroupName)
					Count++;
	return Count;
}

/**
 * Removes a card from a player board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card object to remove
 * @param {boolean|null} DontDiscard - If the card dont need to go to the discard pile
 * @param {string} [MessageType=ClubCardMessageType.PLAYERCARDSLEFT]
 * @returns {void} - Nothing
 */
function ClubCardRemoveFromBoard(CCPlayer, Card, DontDiscard = false, MessageType = ClubCardMessageType.CARDEFFECT) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (Card == null)) {
		return;
	}

	const indexToRemove = Card.ArrayIndex;
	if (indexToRemove !== -1) {
		if (Card.onLeaveClub != null && !Card.Negated) {
			Card.onLeaveClub(CCPlayer);
		}
		CCPlayer.Board.splice(indexToRemove, 1);
		if (DontDiscard == false) {
			if (ClubCardIsLiability(Card)) {
				ClubCardGetOpponent(CCPlayer).DiscardPile.push(Card);
			} else {
				CCPlayer.DiscardPile.push(Card);
			}
		}
		ClubCardMessageAdd(MessageType, "MemberLeaveClub", {[ClubCardPlaceholderKeys.CARDNAME]: Card.Name}, CCPlayer);
		ClubCardUpdateBoardCardsIndex(CCPlayer);
	}
}

/**
 * Gets the updated cost for a player to level up
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @returns {number} The cost to level up
 */
function ClubCardCalculateLevelCost(CCPlayer) {
	const opponent = ClubCardGetOpponent(CCPlayer);
	let cost = ClubCardLevelCost[CCPlayer.Level + 1] - (ClubCardNameCountOnBoard(CCPlayer, "Quality Maid") * 10);
	if (CCPlayer.Level <= opponent.Level) {
		cost = cost + (ClubCardNameCountOnBoard(CCPlayer, "Inspector") * 10);
	}
	if (opponent.Level <= CCPlayer.Level) {
		cost = cost + (ClubCardNameCountOnBoard(opponent, "Inspector") * 10);
	}
	return cost;
}

/**
 * Gets the club level for pets effects
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @returns {number} club level for pets effects
 */
function ClubCardCalculateLevelForPets(CCPlayer) {
	let level = CCPlayer.Level
		+ ClubCardNameCountOnBoard(CCPlayer, "Protective Owner")
		+ ClubCardNameCountOnBoard(CCPlayer, "Rich Owner")
		+ ClubCardNameCountOnBoard(CCPlayer, "Loving Owner")
		+ (ClubCardNameCountOnBoard(CCPlayer, "Jessica") * 2);
	return level;
}

/**
 * Gets the max effect a card should have depending on its "tier"/required level to play
 * @param {ClubCard} Card
 * @param {number} fame
 * @returns {number} max effect card should have
 */
function ClubCardGetMaxEffectFromCard(Card, fame) {
	const ClubCardMaxFamePerTier = {
		1: 3,
		2: 4,
		3: 6,
		4: 7,
		5: 12,
	};

	return Math.min(fame, ClubCardMaxFamePerTier[Card.RequiredLevel ?? 1]);
}

/**
 * Adds a card to a players hand
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card object to add
 * @returns {void} - Nothing
 */
function ClubCardAddToHand(CCPlayer, Card) {
	if (CCPlayer === null || CCPlayer.Hand === null || Card === null) {
		return;
	}

	CCPlayer.Hand.push(Card);
}

/**
 * Removes several cards from player time events
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {readonly String[]} ListOfCardNames - The names of the cards to remove
 */
function ClubCardRemoveCardsFromEventByName(CCPlayer, ListOfCardNames) {
	ListOfCardNames.forEach(cardName => ClubCardRemoveFromEventByName(CCPlayer, cardName));
}

/**
 * Removes a card from a player time events
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {string} CardName - The card object to remove
 * @returns {void} - Nothing
 */
function ClubCardRemoveFromEventByName(CCPlayer, CardName) {
	if ((CCPlayer == null) || (CCPlayer.Event == null) || (CardName == null)) return;
	let Pos = 0;
	for (let C of CCPlayer.Event) {
		if (C.Name === CardName) {
			CCPlayer.Event.splice(Pos, 1);
			CCPlayer.DiscardPile.push(C);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "EventRemoved", {[ClubCardPlaceholderKeys.CARDNAME]: C.Name}, CCPlayer);
		}
		Pos++;
	}
}

/**
 * Removes all cards that belong to a group (ex: Liability) from a board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {String} GroupName - The group name to remove
 * @returns {void} - Nothing
 */
function ClubCardRemoveGroupFromBoard(CCPlayer, GroupName) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (GroupName == null)) return;
	for (let Pos = 0; Pos < CCPlayer.Board.length; Pos++) {
		let Card = CCPlayer.Board[Pos];
		if (Card.Group != null)
			for (let G of Card.Group)
				if (G == GroupName) {
					if (Card.onLeaveClub != null && !Card.Negated) {
						Card.onLeaveClub(CCPlayer);
					}
					CCPlayer.Board.splice(Pos, 1);
					if (ClubCardIsLiability(Card)) {
						ClubCardGetOpponent(CCPlayer).DiscardPile.push(Card);
					} else {
						CCPlayer.DiscardPile.push(Card);
					}
					Pos--;
					break;
				}
	}
	ClubCardUpdateBoardCardsIndex(CCPlayer);
}

/**
 * Shuffles an array of cards
 * @param {ClubCard[]} array - The array of cards to shuffle
 * @returns {ClubCard[]} - The shuffled cards
 */
function ClubCardShuffle(array) {
	let currentIndex = array.length, randomIndex;
	while (currentIndex != 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}
	return array;
}

/**
 * Sets the glowing border for a card
 * @param {ClubCard} Card - The card that must glow
 * @param {string} Color - The color of the glow
 * @returns {void} - Nothing
 */
function ClubCardSetGlow(Card, Color) {
	Card.GlowTimer = CommonTime() + 10000;
	Card.GlowColor = Color;
}

/**
 * Draw cards from the player deck into it's hand
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws the cards
 * @param {number|null} Amount - The amount of cards to draw, 1 if null
 * @returns {void} - Nothing
 */
function ClubCardPlayerDrawCard(CCPlayer, Amount = null) {
	if ((CCPlayer === null) || (CCPlayer.Deck === null) || (CCPlayer.Hand === null)) {
		return;
	}

	Amount = Amount ?? ClubCardDrawCardCount(CCPlayer);

	let FocusCard = ((CCPlayer.Index == 0) && (Amount == 1));
	while (Amount > 0) {
		if (CCPlayer.Deck.length > 0) {
			if (FocusCard) ClubCardSetGlow(CCPlayer.Deck[0], "#00FFFF");
			CCPlayer.Hand.push(CCPlayer.Deck[0]);
			CCPlayer.Deck.splice(0, 1);
			ClubCardCheckDraw(CCPlayer);
		}
		Amount--;
	}

}

/**
 * Draw cards from the player deck into it's hand
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws the cards
 * @param {readonly string[]} groups - The group to draw from
 * @param {number | undefined} level - The level
 * @returns {boolean} - if cards were drawn or not
 */
function ClubCardPlayerDrawGroupCard(CCPlayer, groups, level) {
	if ((CCPlayer === null) || (CCPlayer.Deck === null) || (CCPlayer.Hand === null)) {
		return false;
	}

	const groupCardsInDeck = CCPlayer.Deck.filter(value => groups.some(group => ClubCardCardHasGroup(value, group) && (!level || value.RequiredLevel === level)));
	if (groupCardsInDeck.length === 0) {
		return false;
	}

	const card = groupCardsInDeck[Math.floor(Math.random() * groupCardsInDeck.length)];
	ClubCardSetGlow(card, "#00FFFF");

	CCPlayer.Hand.push(card);
	const cardIndex = CCPlayer.Deck.findIndex(value => value.ID === card.ID);
	CCPlayer.Deck.splice(cardIndex, 1);

	ClubCardCheckDraw(CCPlayer);
	return true;
}

/**
 * Summon cards from the player deck into it's board
 * @param {ClubCardPlayer} CCPlayer - The club card player that summons the cards
 * @param {readonly string[]} groups - The group to summon from
 * @param {number} amount - The amount of cards to summon
 * @param {number | undefined} level - The level of the cards if needed
 * @returns {boolean} - if cards were summoned or not
 */
function ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, groups, amount, level) {
	if ((CCPlayer === null) || (CCPlayer.Deck === null) || (CCPlayer.Board === null)) {
		return false;
	}

	let groupCardsInDeck;
	groupCardsInDeck = CCPlayer.Deck.filter(value => groups.some(group => ClubCardCardHasGroup(value, group) && value.RequiredLevel == level && ClubCardCanSummonCard(CCPlayer, value)));
	if (groupCardsInDeck.length === 0) {
		return false;
	}

	while (amount > 0) {
		if (groupCardsInDeck.length > 0) {
			const card = groupCardsInDeck[Math.floor(Math.random() * groupCardsInDeck.length)];
			const cardIndex = groupCardsInDeck.findIndex(value => value.ID === card.ID);
			groupCardsInDeck.splice(cardIndex, 1);

			const cardIndexInDeck = CCPlayer.Deck.findIndex(value => value.ID === card.ID);
			CCPlayer.Deck.splice(cardIndexInDeck, 1);

			ClubCardSummonCard(CCPlayer, card);
			groupCardsInDeck = groupCardsInDeck.filter(value => ClubCardCanSummonCard(CCPlayer, value));
		}
		amount--;
	}

	return true;
}

/**
 * Play a card from an effect
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} card - The card to play
 * @returns {void} - Nothing
 */
function ClubCardSummonCard(CCPlayer, card) {
	if (card.Type === "Member" || card.Type == null) {
		card.Type = "Member";
		CCPlayer.Board.push(card);
		ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "MemberSummoned", {[ClubCardPlaceholderKeys.CARDNAME]: card.Name}, CCPlayer);
	}
	if (card.Type === "Event") {
		if ((card.Time != null) && (card.Time >= 0)) {
			CCPlayer.Event.push(card);
			card.Time = card.Time + ClubCardExtraTime(CCPlayer);
		} else {
			CCPlayer.DiscardPile.push(card);
		}
	}

	if (card.OnPlay != null) {
		card.OnPlay(CCPlayer);
	}
	ClubCardOnCardPlayedHandler(CCPlayer, card);
	ClubCardUpdateBoardCardsIndex(CCPlayer);
}

/**
 * Returns TRUE if a specific card can be summoned by the player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card to play
 * @returns {boolean} - TRUE if the card can be summoned
 */
function ClubCardCanSummonCard(CCPlayer, Card) {
	if ((Card.CanPlay != null) && !Card.CanPlay(CCPlayer)) return false;
	if ((CCPlayer.Board != null) && ((Card.Type == "Member") || (Card.Type == null)) && (CCPlayer.Level != null) && CCPlayer.Board.length >= ClubCardLevelLimit[CCPlayer.Level]) return false;
	if (Card.Prerequisite != null) return false;
	if ((Card.Type == "Event") && (ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain"))) return false;
	if ((Card.Type == "Event") && (ClubCardEventNameIsInEvents(CCPlayer, "Restrain"))) return false;

	return true;
}

/**
 * When drawing card, checks for various conditions and triggers.
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws the cards
 * @returns {void} - Nothing
 *
 */
function ClubCardCheckDraw(CCPlayer) {
	const opponent = ClubCardGetOpponent(CCPlayer);
	//Detective check
	ClubCardPlayerAddMoney(opponent, ClubCardNameCountOnBoard(opponent, "Detective"));
	ClubCardPlayerAddFame(opponent, ClubCardNameCountOnBoard(opponent, "Detective"));
	//Naughty Kitty check
	ClubCardPlayerAddMoney(CCPlayer, (ClubCardCalculateLevelForPets(CCPlayer) * ClubCardNameCountOnBoard(CCPlayer, "Naughty Kitty")));
}

/**
 * trigger effects when the player is taking the draw action
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws the cards
 * @returns {void} - Nothing
 */
function ClubCardOnDrawAction(CCPlayer) {
	const opponent = ClubCardGetOpponent(CCPlayer);

	ClubCardPlayerAddMoney(CCPlayer, ClubCardNameCountOnBoard(CCPlayer, "Part-Time Patient"));
	ClubCardPlayerAddFame(CCPlayer, (ClubCardNameCountOnBoard(CCPlayer, "Part-Time Patient") * -1));

	let conArtistsCount = ClubCardNameCountOnBoard(CCPlayer, "Con Artist");
	while (conArtistsCount > 0) {
		ClubCardPlayerSteal(CCPlayer, 0, ClubCardGroupIsOnBoard(opponent, "Police") ? 1 : 2);
		conArtistsCount--;
	}

	if (ClubCardEventNameIsInEvents(opponent, "Sabotage")) ClubCardPlayerAddFame(CCPlayer, -8);
}

/**
 * Common place to handle Alvins effect on kidnapping and Restrain
 * @param {ClubCardPlayer} CCPlayer
 * @returns {void} - Nothing
 *
 */
function ClubCardAlvinCondition(CCPlayer) {
	const hasAlvin = ClubCardNameIsOnBoard(CCPlayer, "Alvin");
	let count = 0;
	for (let card of CCPlayer.Board) {
		if (card.Name == "Rope Slave") {
			count++;
		}
	}
	const hasBoardRoom = CCPlayer.Board.length < ClubCardLevelLimit[CCPlayer.Level];
	if (hasAlvin && hasBoardRoom && count < 3) {
		const ropeSlave = ClubCardGetCopyCardByName("Rope Slave");//ClubCardList.find(card => card.Name === "Rope Slave");
		ClubCardSummonCard(CCPlayer, ropeSlave);
	}
}

/**
 * Removes cards from a player hand
 * @param {ClubCardPlayer} CCPlayer - The club card player that discards
 * @param {number} Amount - The amount of cards to discard
 * @returns {void} - Nothing
 */
function ClubCardPlayerDiscardCard(CCPlayer, Amount) {
	if ((CCPlayer == null) || (CCPlayer.Hand == null) || (Amount == null)) return;
	while ((Amount > 0) && (CCPlayer.Hand.length > 0)) {
		let Pos = Math.floor(Math.random() * CCPlayer.Hand.length);
		if (ClubCardNameIsOnBoard(CCPlayer, "Protective Owner") && ClubCardCardHasGroup(CCPlayer.Hand[Pos], "Pet")) {
			CCPlayer.Deck.push(CCPlayer.Hand[Pos]);
			CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
		} else  {
			CCPlayer.DiscardPile.push(CCPlayer.Hand[Pos]);
		}
		CCPlayer.Hand.splice(Pos, 1);
		Amount--;
	}

	if (CCPlayer.Control === 'Player') ClubCardDefocusCardIfDiscarded();
}

/**
 * Builds a deck array of object from a deck array of numbers
 * @param {readonly number[]} InDeck - The array of number deck
 * @returns {ClubCard[]} - The resulting deck
 */
function ClubCardLoadDeck(InDeck) {
	let OutDeck = [];

	for (let D of InDeck){
		const card = ClubCardGetCopyCardByID(D);
		if (card && card != null) {
			if (card.Type == null) card.Type = "Member";
			OutDeck.push(card);
		}
	}
	return OutDeck;
}

/**
 * Returns the index of the player in the ClubCardPlayer array
 * @returns {number} - The array index position
 */
function ClubCardGetPlayerIndex() {
	if (ClubCardPlayer[0].Control == "Player") return 0;
	if (ClubCardPlayer[1].Control == "Player") return 1;
	return -1;
}

/**
 * Builds a deck array of object from a deck array of numbers
 * @param {number} DeckNum - The array of number deck
 * @returns {void} - The resulting deck
 */
function ClubCardLoadDeckNumber(DeckNum) {
	// Invalid decks cannot be loaded, we get the default one if that's the case
	let Deck = [];
	if ((Player.Game.ClubCard.Deck.length <= DeckNum) || (Player.Game.ClubCard.Deck[DeckNum].length < ClubCardBuilderMinDeckSize) || (Player.Game.ClubCard.Deck[DeckNum].length > ClubCardBuilderMaxDeckSize)) {
		let msg = TextGet("NoValidDeckFound").replace("PLAYERNAME", CharacterNickname(Player));
		ClubCardMessageAdd(ClubCardMessageType.SYSTEM, null, {}, null, msg);
		Deck = ClubCardBuilderDefaultDeck.slice();
	} else {
		let msg = TextGet("UsingDeck").replace("PLAYERNAME", CharacterNickname(Player));
		ClubCardMessageAdd(ClubCardMessageType.SYSTEM, null, {}, null, msg);
		for (let i = 0; i < Player.Game.ClubCard.Deck[DeckNum].length; i++)
			Deck.push(Player.Game.ClubCard.Deck[DeckNum].charCodeAt(i));
	}

	// Loads the deck and shuffles it
	let Index = ClubCardGetPlayerIndex();
	if (Index >= 0) {
		ClubCardPlayer[Index].Deck = ClubCardShuffle(ClubCardLoadDeck(Deck));
		ClubCardPlayer[Index].FullDeck = ClubCardLoadDeck(Deck);
	}

	// Starts the game with the loaded deck
	if (!ClubCardIsOnline()) {
		const textGetKey = "Start" + ((ClubCardTurnIndex == 0) ? "Player" : "Opponent");
		ClubCardMessageAdd(ClubCardMessageType.SYSTEM, textGetKey);
		ClubCardPlayer[0].Hand.push(ClubCardGetCopyCardByName("Tips"));
		ClubCardPlayer[1].Hand.push(ClubCardGetCopyCardByName("Tips"));
		ClubCardPlayerDrawCard(ClubCardPlayer[0], (ClubCardTurnIndex == 0) ? 5 : 6);
		ClubCardPlayerDrawCard(ClubCardPlayer[1], (ClubCardTurnIndex == 1) ? 5 : 6);
	} else {
		ClubCardPlayer[Index].Hand.push(ClubCardGetCopyCardByName("Tips"));
		ClubCardPlayerDrawCard(ClubCardPlayer[Index], (ClubCardTurnIndex == Index) ? 5 : 6);
	}
	// Syncs online data
	// Only send our own data when we select a deck, otherwise we could overwrite the other
	// player's deck selection if they both select at the same time.
	GameClubCardSyncOnlineData("Action", true);

	// If a card can be won against the NPC
	ClubCardReward = null;
	if (!ClubCardIsOnline() && (ClubCardPlayer[1].Character.IsNpc()))
		for (let Card of ClubCardList)
			if ((Card.Reward === "NPC-" + ClubCardPlayer[1].Character.Name) || (Card.Reward === ClubCardPlayer[1].Character.AccountName)) {
				let Char = String.fromCharCode(Card.ID);
				if ((Player.Game == null) || (Player.Game.ClubCard == null) || (Player.Game.ClubCard.Reward == null) || (Player.Game.ClubCard.Reward.indexOf(Char) < 0)) {
					ClubCardReward = Card;
					break;
				}
			}

	// If a card can be won against the online player
	if (ClubCardIsOnline() && ClubCardIsPlaying())
		for (let Card of ClubCardList)
			if ((Card.RewardMemberNumber === ClubCardOnlinePlayerMemberNumber1) || (Card.RewardMemberNumber === ClubCardOnlinePlayerMemberNumber2)) {
				let Char = String.fromCharCode(Card.ID);
				if ((Player.Game == null) || (Player.Game.ClubCard == null) || (Player.Game.ClubCard.Reward == null) || (Player.Game.ClubCard.Reward.indexOf(Char) < 0)) {
					ClubCardReward = Card;
					break;
				}
			}

	// Show the winnable card or start the game right away
	if (ClubCardReward != null) {
		if (ClubCardReward.Type == null) ClubCardReward.Type = "Member";
		ClubCardFocus = ClubCardReward;
		if (ClubCardPlayer[1].Control === "AI") ClubCardPlayer[1].Hand.push({ ...ClubCardReward });
		ClubCardCreatePopup("TEXT", TextGet("CanWinNewCard") + " " + ClubCardReward.Title, TextGet("Play"), null, "ClubCardAIStart()", null);
	} else ClubCardAIStart();

}

/**
 * Draw the club card player hand on screen, show only sleeves if not controlled by player
 * @param {Character} Char - The character to link to that club card player
 * @param {String} Cont - The control linked to that player
 * @param {readonly number[]} Cards - The cards to build the deck with
 * @returns {void} - Nothing
 */
function ClubCardAddPlayer(Char, Cont, Cards) {
	let P = {
		Character: { ...Char },
		Control: Cont,
		Deck: ClubCardShuffle(ClubCardLoadDeck(Cards)),
		FullDeck: ClubCardLoadDeck(Cards),
		Index: ClubCardPlayer.length,
		Sleeve: (Player.Game.ClubCard.CardBack > -1 && Player.Game.ClubCard.CardBack <= ClubCardBuilderCardBackCount) ? Player.Game.ClubCard.CardBack : 0,
		Hand: [],
		Board: [],
		Event: [],
		RenderFullBoard: [],
		DiscardPile: [],
		Level: 1,
		Money: 5,
		Fame: 0,
		CardsPlayedThisTurn: {},
		ClubCardTurnCounter: 1,
	};
	ClubCardPlayer.push(P);
}

/**
 * The player can get rewarded with a new card if she wins VS a specific opponent
 * @returns {void} - Nothing
 */
function ClubCardGetReward() {
	let Char = String.fromCharCode(ClubCardReward.ID);
	if (Player.Game.ClubCard.Reward.indexOf(Char) < 0) {
		ClubCardFocus = ClubCardReward;
		Player.Game.ClubCard.Reward = Player.Game.ClubCard.Reward + Char;
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		ClubCardCreatePopup("TEXT", TextGet("WonNewCard") + " " + ClubCardReward.Title, TextGet("Return"), null, "ClubCardEndGame()", null);
	}
}

/**
 * Runs the before/after turn end handlers
 * @param {ClubCardPlayer} CCPlayer - The player whose turn is ending
 * @param {ClubCardPlayer} Opponent - The other player
 * @param {boolean} Before - true to run BeforeTurnEnd handlers, false to run AfterEndTurn handlers
 * @returns {void}
  */
function ClubCardRunTurnEndHandlers(CCPlayer, Opponent, Before) {
	// Runs handlers on player's board
	if (CCPlayer.Board != null) {
		// Iterate over a copy of the board so the BeforeTurnEnd handlers can remove cards from the
		// board and the behaviour is always well-defined.
		for (const Card of CCPlayer.Board.slice()) {
			if (!Card.Negated) {
				if (Before) {
					if (Card.BeforeTurnEnd != null) Card.BeforeTurnEnd(CCPlayer);
				} else {
					if (Card.AfterTurnEnd != null) Card.AfterTurnEnd(CCPlayer);
				}
			}
		}
	}

	// Runs handlers on opponent board
	if (Opponent.Board != null) {
		// Iterate over a copy of the opponents board so the onOpponentTurnEnd handlers copy
		// so the handlers can remove cards from the board and the behaviour is always well-defined.
		for (const Card of Opponent.Board.slice()) {
			// CCPlayer here is the "opponent" of the card
			if (!Card.Negated) {
				if (Before) {
					if (Card.BeforeOpponentTurnEnd != null) Card.BeforeOpponentTurnEnd(CCPlayer);
				} else {
					if (Card.AfterOpponentTurnEnd != null) Card.AfterOpponentTurnEnd(CCPlayer);
				}
			}
		}
	}

	// Runs the event of time cards on the player board and opponent board
	if (CCPlayer.Event != null) {
		for (const Card of CCPlayer.Event.slice()) {
			if (!Card.Negated) {
				if (Before) {
					if (Card.BeforeTurnEnd != null) Card.BeforeTurnEnd(CCPlayer);
				} else {
					if (Card.AfterTurnEnd != null) Card.AfterTurnEnd(CCPlayer);
				}
			}
		}
	}

	if (Opponent.Event != null) {
		for (const Card of Opponent.Event.slice()) {
			if (!Card.Negated) {
				if (Before) {
					if (Card.BeforeOpponentTurnEnd != null) Card.BeforeOpponentTurnEnd(CCPlayer);
				} else {
					if (Card.AfterOpponentTurnEnd != null) Card.AfterOpponentTurnEnd(CCPlayer);
				}
			}
		}
	}
}

/**
 * @param {string} StartType
 * StartType = ClubCardStartTurnType.BUNKRUPT because otherwise the bankruptcy function won't work.
 */
function ClubCardStartTurn(StartType = ClubCardStartTurnType.BANKRUPT) {
	if (ClubCardIsStartTurn == false) {
		ClubCardMessageAdd(ClubCardMessageType.STARTTURNINFO, "StartTurnLogChat");
		ClubCardCheckEventAndCardExpired();
		ClubCardIsStartTurn = true;
	}

	ClubCardMessageSendAll();
	const CCPlayer = ClubCardPlayer[ClubCardTurnIndex];

	switch (StartType) {
		case ClubCardStartTurnType.PLAYCARD:
			ClubCardPlayCard(CCPlayer, CCPlayer.Control === "Player" ? ClubCardFocus : ClubCardFocusAI);
			break;

		case ClubCardStartTurnType.DRAWENDTURN:
			ClubCardEndTurn((ClubCardTurnCardPlayed == 0));
			break;

		case ClubCardStartTurnType.BANKRUPT:
			ClubCardBankrupt();
			break;

		case ClubCardStartTurnType.UPGRADELEVEL:
			ClubCardUpgradeLevel(ClubCardPlayer[ClubCardTurnIndex]);
			break;
		case ClubCardStartTurnType.ENDTURN:
			break;
		default:
			//If it error
			break;
	}

}

/**
 * When a turn ends, we move to the next player
 * @param {boolean|null} Draw - If the end of turn was triggered by a draw
 * @returns {void} - Nothing
 */
function ClubCardEndTurn(Draw = false) {

	// Adds fame, money and run custom card scripts from the player board
	let CCPlayer = ClubCardPlayer[ClubCardTurnIndex];
	let Opponent = ClubCardGetOpponent(CCPlayer);
	let StartingFame = CCPlayer.Fame;
	let StartingMoney = CCPlayer.Money;
	let FameMoneyText = "";

	ClubCardRunTurnEndHandlers(CCPlayer, Opponent, true);

	// Now add the Fame & Money, so they use the state of the board
	// after any changes made by the BeforeTurnEnd handlers
	if (CCPlayer.Board != null) {
		for (const Card of CCPlayer.Board) {
			if (Card.FamePerTurn != null) ClubCardPlayerAddFame(CCPlayer, Card.FamePerTurn);
			if (Card.MoneyPerTurn != null) ClubCardPlayerAddMoney(CCPlayer, Card.MoneyPerTurn);
		}
	}

	CCPlayer.LastFamePerTurn = CCPlayer.Fame - StartingFame;
	CCPlayer.LastMoneyPerTurn = CCPlayer.Money - StartingMoney;

	ClubCardRunTurnEndHandlers(CCPlayer, Opponent, false);

	if ((CCPlayer.Money < 0) && (CCPlayer.Fame > StartingFame)) {
		CCPlayer.Fame = StartingFame;
		CCPlayer.LastFamePerTurn = 0;
	}

	// Display the gained money and fame
	FameMoneyText = ((CCPlayer.LastFamePerTurn >= 0) ? "+" : "") + CCPlayer.LastFamePerTurn.toString() + " Fame, " + ((CCPlayer.LastMoneyPerTurn >= 0) ? "+" : "") + CCPlayer.LastMoneyPerTurn.toString() + " Money";

	// If that player wins the game from Fame gain
	if (ClubCardCheckVictory(CCPlayer)) {
		ClubCardMessageAdd(ClubCardMessageType.FAMEMONEYINFO, "EndTurnPlayer", {[ClubCardPlaceholderKeys.FAMEMONEY]: FameMoneyText}, CCPlayer);
		const textGetKey = ClubCardIsOnline()
			? "VictoryFor" + CCPlayer.Control
			: "VictoryOnline";
		ClubCardMessageAdd(ClubCardMessageType.VICTORYINFO, textGetKey);
		ClubCardMessageSendAll();
		GameClubCardSyncOnlineData();

		// Notices everyone in the room that the game end
		if (ClubCardIsOnline()) {
			const Dictionary = new DictionaryBuilder().sourceCharacter(Player).build();
			Dictionary.push({Tag: "SourceCharacter", Text: CharacterNickname(Player), MemberNumber: Player.MemberNumber});
			ServerSend("ChatRoomChat", { Content: "ClubCardGameEnd", Type: "Action" , Dictionary: Dictionary});
		}

		return;
	}

	// Adds an entry to the log
	ClubCardTurnEndDraw = Draw;
	if (Draw) {
		//TODO EndDrawPlayer look not good without wrapping to a new line
		ClubCardMessageAdd(ClubCardMessageType.FAMEMONEYINFO, "EndDrawPlayer", {[ClubCardPlaceholderKeys.FAMEMONEY]: FameMoneyText}, CCPlayer);
		ClubCardPlayerDrawCard(ClubCardPlayer[ClubCardTurnIndex]);
		ClubCardOnDrawAction(CCPlayer);
	} else {
		ClubCardMessageAdd(ClubCardMessageType.FAMEMONEYINFO, "EndTurnPlayer", {[ClubCardPlaceholderKeys.FAMEMONEY]: FameMoneyText}, CCPlayer);
	}
	ClubCardMessageSendAll();

	// Move to the next player
	ClubCardTurnIndex++;
	CCPlayer.ClubCardTurnCounter++;
	if (ClubCardTurnIndex >= ClubCardPlayer.length) ClubCardTurnIndex = 0;
	ClubCardTurnCardPlayed = 0;
	ClubCardAIStart();

	ClubCardIsStartTurn = false;
	ClubCardStartTurn(ClubCardStartTurnType.ENDTURN);

	// Syncs online data
	GameClubCardSyncOnlineData();

}

function ClubCardCheckEventAndCardExpired() {
	const CCPlayer = ClubCardPlayer[ClubCardTurnIndex];
	// When a turn starts, the event and members time goes down and might expire, then trigger turn start effects of cards on board
	let turnStartCards = [];
	if (CCPlayer.Board != null) {
		for (let Pos = 0; Pos < CCPlayer.Board.length; Pos++) {
			let Card = CCPlayer.Board[Pos];
			if ((Card.Time != null) && (Card.Time > 0)) Card.Time--;
			if (Card.Time <= 0) {
				ClubCardRemoveFromBoard(CCPlayer, Card, false, ClubCardMessageType.STARTTURNEVENT);
				Pos--;
			}
			if (Card.turnStart != null && !Card.Negated) {
				turnStartCards.push(Card);
			}
		}
	}

	if (CCPlayer.Event != null) {
		for (let Pos = 0; Pos < CCPlayer.Event.length; Pos++) {
			let Card = CCPlayer.Event[Pos];
			if ((Card.Time != null) && (Card.Time > 0)) Card.Time--;
			if ((Card.Time == null) || (Card.Time <= 0)) {
				ClubCardMessageAdd(ClubCardMessageType.STARTTURNEVENT, "EventExpired", {[ClubCardPlaceholderKeys.CARDNAME]: Card.Name},CCPlayer);
				CCPlayer.Event.splice(Pos, 1);
				CCPlayer.DiscardPile.push(Card);
				Pos--;
			}
			if (Card.turnStart != null && !Card.Negated) {
				turnStartCards.push(Card);
			}
		}
	}

	for (const Card of turnStartCards) {
		Card.turnStart(CCPlayer);
	}
}

/**
 * Checks that the focused card is still in the Player's hand
 * and defocuses it if not.
 */
function ClubCardDefocusCardIfDiscarded() {
	if (ClubCardFocus === null) return;
	const playerIndex = ClubCardGetPlayerIndex();
	if (playerIndex === -1) return;
	if (!ClubCardPlayer[playerIndex].Hand.find(c => c.ID === ClubCardFocus.ID)) ClubCardFocus = null;
}

function ClubCardCheckVictory(CCPlayer) {
	if (CCPlayer.Fame >= ClubCardFameGoal) {
		ClubCardFocus = null;
		MiniGameVictory = (CCPlayer.Control == "Player");
		MiniGameEnded = true;
		let Msg = TextGet("VictoryFor" + CCPlayer.Control);
		if (ClubCardIsOnline()) Msg = TextGet("VictoryOnline").replace("PLAYERNAME", CharacterNickname(CCPlayer.Character));
		ClubCardCreatePopup("TEXT", Msg, TextGet("Return"), null, "ClubCardEndGame()", null);
		if (MiniGameVictory && (ClubCardReward != null)) ClubCardGetReward();
		GameClubCardReset();
		return true;
	}
	return false;
}

/**
 * Returns the number of cards that can be played in one turn by a player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @returns {Number} - The number of cards
 */
function ClubCardTurnPlayableCardCount(CCPlayer) {
	if ((CCPlayer == null) || (CCPlayer.Board == null)) return 1;
	let Count = 1;
	for (let Card of CCPlayer.Board) {
		if (Card.ExtraPlay != null) {
			Count = Count + Card.ExtraPlay;
		}
	}
	if (CCPlayer.Event != null)
		for (let Card of CCPlayer.Event)
			if (Card.ExtraPlay != null)
				Count = Count + Card.ExtraPlay;
	if (Count < 1) Count = 1;
	return Count;
}

/**
 * Returns the number of cards that will be drawn when the player choses to draw instead of playing
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @returns {Number} - The number of cards to draw
 */
function ClubCardDrawCardCount(CCPlayer) {
	if ((CCPlayer == null) || (CCPlayer.Board == null)) return 1;
	let Count = 1;
	for (let Card of CCPlayer.Board)
		if (Card.ExtraDraw != null)
			Count = Count + Card.ExtraDraw;
	if (CCPlayer.Event != null)
		for (let Card of CCPlayer.Event)
			if (Card.ExtraDraw != null)
				Count = Count + Card.ExtraDraw;
	if (Count < 1) Count = 1;
	return Count;
}

/**
 * Returns the extra time in turns for event over time
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @returns {Number} - The extra time
 */
function ClubCardExtraTime(CCPlayer) {
	if ((CCPlayer == null) || (CCPlayer.Board == null)) return 0;
	let Count = 0;
	for (let Card of CCPlayer.Board)
		if (Card.ExtraTime != null)
			Count = Count + Card.ExtraTime;
	return Count;
}

/**
 * Returns the player that will be the target of a card.  Liability cards are played on the other side.
 * @param {ClubCard} Card - The card to play
 * @returns {ClubCardPlayer} - The target player
 */
function ClubCardFindTarget(Card) {
	if (ClubCardIsLiability(Card))
		return (ClubCardTurnIndex == 0) ? ClubCardPlayer[1] : ClubCardPlayer[0];
	else
		return ClubCardPlayer[ClubCardTurnIndex];
}

/**
 * Returns TRUE if a specific card can be played by the player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card to play
 * @returns {boolean} - TRUE if the card can be played
 */
function ClubCardCanPlayCard(CCPlayer, Card) {
	if ((CCPlayer == null) || (Card == null) || (Card.Location == null)) return false;
	if ((CCPlayer.Index == 0) && (Card.Location != "PlayerHand")) return false;
	if ((CCPlayer.Index != 0) && (Card.Location != "OpponentHand")) return false;
	if ((Card.CanPlay != null) && !Card.CanPlay(CCPlayer)) return false;
	let Target = ClubCardFindTarget(Card);
	let targetLevel = Target.Level;

	// Jennifer removes a card on her board before entering so should therefor be playable on a full board.
	const boardFull = Target.Board.length >= ClubCardLevelLimit[Target.Level] && Card.Name !== "Jennifer";
	if ((Target.Board != null) && (Card.Type == "Member") && (Target.Level != null) && boardFull) return false;
	if ((Card.RequiredLevel != null) && (Target.Level != null) && (Card.RequiredLevel > targetLevel)) return false;
	if ((Card.Prerequisite === "SelectOwnMember") && (CCPlayer.Board.length <= 0)) return false;
	if ((Card.Prerequisite === "SelectOwnMember") && (CCPlayer.Control == "AI") && !ClubCardGroupIsOnBoard(CCPlayer, "Liability")) return false;
	if ((Card.Prerequisite === "SelectOpponentMember") && (ClubCardGetOpponent(CCPlayer).Board.length <= 0)) return false;
	if ((Card.Prerequisite === "SelectOpponentMember") && (CCPlayer.Control == "AI") && (ClubCardGroupOnBoardCount(ClubCardGetOpponent(CCPlayer), "Liability") == ClubCardGetOpponent(CCPlayer).Board.length)) return false;
	if ((Card.Prerequisite === "SelectAnyMember") && (CCPlayer.Board.length + ClubCardGetOpponent(CCPlayer).Board.length <= 0)) return false;
	if ((Card.Prerequisite === "SelectAnyMember") && (CCPlayer.Control == "AI") && (CCPlayer.Board.length + ClubCardGetOpponent(CCPlayer).Board.length <= 0)) return false;
	if ((Card.Prerequisite === "SelectAnyEvent") && (CCPlayer.Event.length + ClubCardGetOpponent(CCPlayer).Event.length <= 0)) return false;
	if ((Card.Type == "Event") && (ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain"))) return false;
	if ((Card.Type == "Event") && (ClubCardEventNameIsInEvents(CCPlayer, "Restrain"))) return false;

	return true;
}

/**
 * Returns TRUE if a specific card can be selected as a prerequisite for another card by the player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card to select
 * @returns {boolean} - TRUE if the card can be selected
 */
function ClubCardCanSelectCard(CCPlayer, Card) {
	if ((CCPlayer == null) || (Card == null) || (ClubCardPending == null) || (ClubCardPending.Prerequisite == null)) return false;
	if ((ClubCardPending.Prerequisite === "SelectOwnMember") && ClubCardCardsSelectConditions(Card) && (CCPlayer.Index == 0) && (Card.Location == "PlayerBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectOwnMember") && ClubCardCardsSelectConditions(Card) && (CCPlayer.Index == 1) && (Card.Location == "OpponentBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectOpponentMember") && ClubCardCardsSelectConditions(Card) && (CCPlayer.Index == 0) && (Card.Location == "OpponentBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectOpponentMember") && ClubCardCardsSelectConditions(Card) && (CCPlayer.Index == 1) && (Card.Location == "PlayerBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectAnyMember") && ClubCardCardsSelectConditions(Card) && ((Card.Location == "PlayerBoard") || (Card.Location == "OpponentBoard")) && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectAnyEvent") && ClubCardCardsSelectConditions(Card) && ((Card.Location == "PlayerBoard") || (Card.Location == "OpponentBoard")) && (Card.Type === "Event")) return true;
	return false;
}

/**
 * Returns TRUE if a specific card can be selected as a prerequisite for another card by the player
 * @param {ClubCard} Card - The card to select
 * @returns {boolean} - TRUE if the card can be selected
 */
function ClubCardCardsSelectConditions(Card) {
	if (ClubCardPending.Name === "Moon" && Card.Name === "Moon") return false;
	if (ClubCardPending.Name === "Tax Auditor" && Card.RequiredLevel > 3) return false;
	return true;
}

/**
 * When a player plays a card
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card to play
 * @returns {void} - Nothing
 */
function ClubCardPlayCard(CCPlayer, Card) {

	// If the player must select a card before playing the current card
	if ((Card.Prerequisite != null) && (ClubCardSelection == null) && (CCPlayer.Control == "Player")) {
		ClubCardFocus = null;
		Card.IsVisible = false;
		ClubCardPending = Card;
		ClubCardMoveCardToPending(Card);

		const textGetKeyPrereq = "Prerequisite " + Card.Name;
		ClubCardMessageAdd(ClubCardMessageType.PREREQUISTITE, textGetKeyPrereq);
		return;
	}

	// If the AI must select one of her own liability card to remove before playing the current card
	if ((Card.Prerequisite === "SelectOwnMember") && (ClubCardSelection == null) && (CCPlayer.Control == "AI")) {
		let Cards = [];
		for (let C of CCPlayer.Board)
			if (C.Group != null)
				for (let Group of C.Group)
					if (Group === "Liability")
						Cards.push(C);
		ClubCardSelection = CommonRandomItemFromList(null, Cards);
	}

	// If the AI must select one of her opponent card to remove before playing the current card
	if ((Card.Prerequisite === "SelectOpponentMember") && (ClubCardSelection == null) && (CCPlayer.Control == "AI")) {
		let Cards = [];
		for (let C of ClubCardGetOpponent(CCPlayer).Board)
			if ((C.Group == null) || (C.Group.indexOf("Liability") < 0))
				Cards.push(C);
		ClubCardSelection = CommonRandomItemFromList(null, Cards);
	}

	// If the AI must select any card to affect before playing the current card
	if ((Card.Prerequisite === "SelectAnyMember") && (ClubCardSelection == null) && (CCPlayer.Control == "AI")) {
		let cards = [];
		for (const card of CCPlayer.Board) {
			cards.push(card);
			cards[cards.length - 1].Location = "PlayerBoard";
		}
		for (const card of ClubCardGetOpponent(CCPlayer).Board) {
			cards.push(card);
			cards[cards.length - 1].Location = "OpponentBoard";
		}
		const selectedCardNumber = Math.floor(Math.random() * cards.length);
		ClubCardSelection = cards[selectedCardNumber];
		ClubCardSelection.Location = cards[selectedCardNumber].Location;
	}

	// Sets the log text, different for a liability card
	let Target = ClubCardFindTarget(Card);
	const textGetKey = ClubCardIsLiability(Card) ? "PlayACardOpponentBoard" : "PlayACard";
	ClubCardMessageAdd(ClubCardMessageType.ACTION, textGetKey , {[ClubCardPlaceholderKeys.CARDNAME]: Card.Name});
	ClubCardTurnCardPlayed++;

	// Plays the card
	if (CCPlayer.Hand != null) {
		let Index = 0;
		for (let C of CCPlayer.Hand) {
			if (C.ID == Card.ID) {
				if (Card.Type === "Member") {
					Target.Board.push(Card);
				}
				if (Card.Type === "Event") {
					if ((Card.Time != null) && (Card.Time >= 0)) {
						Target.Event.push(Card);
						Card.Time = Card.Time + ClubCardExtraTime(CCPlayer);
					} else {
						Target.DiscardPile.push(Card);
					}
				}
				CCPlayer.Hand.splice(Index, 1);
				Card.Location = (CCPlayer.Index == 0) ? "PlayerBoard" : "OpponentBoard";
				ClubCardSetGlow(Card, (ClubCardTurnIndex == 0) ? "#FFFF00" : "#FF0000");
				break;
			}
			Index++;
		}
		ClubCardUpdateBoardCardsIndex(Target);
	}

	// Focuses on the card, runs it's scripts
	if(CCPlayer.Control == "Player") ClubCardFocus = Card;
	else ClubCardFocusAI = Card;

	if (CCPlayer.CardsPlayedThisTurn[CCPlayer.ClubCardTurnCounter]) {
		CCPlayer.CardsPlayedThisTurn[CCPlayer.ClubCardTurnCounter] = [...CCPlayer.CardsPlayedThisTurn[CCPlayer.ClubCardTurnCounter], Card];
	} else {
		CCPlayer.CardsPlayedThisTurn[CCPlayer.ClubCardTurnCounter] = [Card];
	}

	if (Card.OnPlay != null) Card.OnPlay(CCPlayer);
	ClubCardSelection = null;

	if (CCPlayer.Control == "Player") {
		ClubCardFocus = null;
		ClubCardPending = null;
	}
	else ClubCardFocusAI = null;

	// Run on cards played handlers
	ClubCardOnCardPlayedHandler(CCPlayer, Card);

	// End the turn if needed
	ClubCardMessageSendAll();
	if (ClubCardTurnCardPlayed >= ClubCardTurnPlayableCardCount(CCPlayer))
		return ClubCardEndTurn();

	// If that player can play more than one card per turn, we announce it
	ClubCardMessageAdd(ClubCardMessageType.ACTIONSEPARATOR, "PlayAnotherCard");

	ClubCardAIStart();
}

/**
 * When it adds a card to a player's board, check if there is an effect on board that needs to be triggered.
 * @param {ClubCardPlayer} CCPlayer - The target player
 * @param {ClubCard} Card - The card that was played
 * @returns {void} - Nothing
 */
function ClubCardOnCardPlayedHandler(CCPlayer, Card) {
	for (const C of CCPlayer.Board.slice()) {
		if (C.onPlayedCard != null && !C.Negated) {
			C.onPlayedCard(CCPlayer, Card);
		}
	}

	const opponent = ClubCardGetOpponent(CCPlayer);
	for (const C of opponent.Board.slice()) {
		if (C.onOpponentPlayedCard != null && !C.Negated) {
			C.onOpponentPlayedCard(opponent, Card);
		}
	}
}

/**
 * When it adds a card to a player's board, it updates for all index cards.
 * @param {ClubCardPlayer} Target - The target player
 * @returns {void} - Nothing
 */
function ClubCardUpdateBoardCardsIndex(Target) {
	for (let i = 0; i < Target.Board.length; i += 1) {
		Target.Board[i].ArrayIndex = i;
	}
}

/**
 * When a player selects a card that's a prerequisite for another card
 * @param {ClubCard} Card - The card to play
 * @returns {void} - Nothing
 */
function ClubCardSelectCard(Card) {
	ClubCardSelection = Card;
	ClubCardPlayCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardPending);
}

/**
 * When the AI plays it's move
 * @returns {void} - Nothing
 */
function ClubCardAIPlay() {

	// Make sure the current player is an AI
	let CCPlayer = ClubCardPlayer[ClubCardTurnIndex];
	if (CCPlayer.Control != "AI") return;

	// If the AI can upgrade, there's a 50/50 odds he does it
	if ((Math.random() >= 0.5) && (CCPlayer.Level < ClubCardLevelCost.length - 1) && (CCPlayer.Money >= ClubCardCalculateLevelCost(CCPlayer))) {
		ClubCardStartTurn(ClubCardStartTurnType.UPGRADELEVEL);
		ClubCardAIStart();
		return;
	}

	// Builds an array of all valid cards
	let ValidCards = [];
	if (CCPlayer.Hand != null)
		for (let Card of CCPlayer.Hand) {
			Card.Location = "OpponentHand";
			if (ClubCardCanPlayCard(CCPlayer, Card))
				ValidCards.push(Card);
		}

	// If we have valid cards, we play one at random
	if (ValidCards.length > 0) {
		ClubCardFocusAI = CommonRandomItemFromList(null, ValidCards);
		//ClubCardFocus = CommonRandomItemFromList(null, ValidCards);
		return ClubCardStartTurn(ClubCardStartTurnType.PLAYCARD);
	}

	// If nothing can be played and money or fame is going negative, the computer can go bankrupt
	if ((CCPlayer.LastMoneyPerTurn != null) && (CCPlayer.LastFamePerTurn != null) && (CCPlayer.LastMoneyPerTurn + CCPlayer.LastFamePerTurn <= 0) && (100 - CCPlayer.Money - CCPlayer.Fame > Math.random() * 100))
		return ClubCardStartTurn();

	// Since nothing could be done, we end the turn by skipping
	ClubCardStartTurn(ClubCardStartTurnType.DRAWENDTURN);

}

/**
 * When the opponent (AI) starts it's turn, gives 3 seconds before it's move
 * @returns {void} - Nothing
 */
function ClubCardAIStart() {
	ClubCardDestroyPopup();
	if (!MiniGameEnded && ClubCardPlayer[ClubCardTurnIndex].Control == "AI") setTimeout(ClubCardAIPlay, 1000);
}

/**
 * When a player concedes the game
 * @returns {void} - Nothing
 */
function ClubCardConcede() {
	if (ClubCardIsOnline()) {
		const textGetKey = ClubCardIsPlaying() ? "OnlineConcede" : "OnlineStopWatch";
		const Msg = TextGet(textGetKey).replace("PLAYERNAME", CharacterNickname(Player));
		ClubCardMessageAdd(ClubCardMessageType.SYSTEM, null, {}, null, Msg);
	}
	ClubCardDestroyPopup();
	ClubCardEndGame(false);
}

/**
 * When a player goes bankrupt, she restarts her club from scratch, draws 5 new cards and ends her turn
 * @returns {void} - Nothing
 */
function ClubCardBankrupt() {

	// Resets that player game & board
	let CCPlayer = ClubCardPlayer[ClubCardTurnIndex];

	ClubCardRemoveGroupFromBoard(CCPlayer, "Liability");
	CCPlayer.Level = 1;
	CCPlayer.Money = 5;
	CCPlayer.Fame = 0;
	CCPlayer.Board = [];
	CCPlayer.Event = [];
	CCPlayer.Hand = [];
	CCPlayer.Deck = ClubCardShuffle(CCPlayer.FullDeck.slice());
	CCPlayer.Hand.push(ClubCardGetCopyCardByName("Tips"));
	ClubCardTurnCardPlayed = 0;
	ClubCardPlayerDrawCard(CCPlayer, 5);

	// The opponent loses all liability cards on her board
	let Opponent = ClubCardGetOpponent(CCPlayer);
	ClubCardRemoveGroupFromBoard(Opponent, "Liability");
	// Clear the discard pile after the removing liability cards
	CCPlayer.DiscardPile = [];

	ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "WentBankrupt", {}, CCPlayer);
	///
	ClubCardDestroyPopup();
	if (CCPlayer.Control == "Player") ClubCardFocus = null;
	else ClubCardFocusAI = null;
	ClubCardEndTurn(false);
}

/**
 * When the game ends
 * @param {boolean} Victory - TRUE if the player is victorious
 * @returns {void} - Nothing
 */
function ClubCardEndGame(Victory) {
	ElementRemove("CCLog");
	ElementRemove("CCChat");
	MiniGameEnded = true;
	if (Victory != null) MiniGameVictory = Victory;
	ClubCardOpponentDeck = [];
	// We must reset the status of our game first. When we end the minigame, it will
	// send a status update to the room, so we want this to reflect that we're no longer
	// running the game.
	GameClubCardReset();
	MiniGameEnd();
}

function ClubCardTextGet(Text) {
	if (!ClubCardTextCache) {
		const CardTextPath = "Screens/MiniGame/ClubCard/Text_ClubCard.csv";
		ClubCardTextCache = TextAllScreenCache.get(CardTextPath);
		if (!ClubCardTextCache) {
			ClubCardTextCache = new TextCache(CardTextPath);
			TextAllScreenCache.set(CardTextPath, ClubCardTextCache);
		}
	}
	return ClubCardTextCache ? ClubCardTextCache.get(Text) : "";
}

/**
 * Prepares the card titles, texts and initialize the log if needed
 * @returns {void} - Nothing
 */
function ClubCardLoadCaption() {
	if ((ClubCardList[0].Title == null) && (ClubCardTextGet("Title Kinky Neighbor") != "")) {
		for (let Card of ClubCardBuilderList) {
			Card.Title = ClubCardTextGet("Title " + Card.Name);
			Card.Text = ClubCardTextGet("Text " + Card.Name);
		}
		for (let Card of ClubCardList) {
			Card.Title = ClubCardTextGet("Title " + Card.Name);
			Card.Text = ClubCardTextGet("Text " + Card.Name);
		}
		for (let P of ClubCardPlayer) {
			for (let Card of P.Hand) {
				Card.Title = ClubCardTextGet("Title " + Card.Name);
				Card.Text = ClubCardTextGet("Text " + Card.Name);
			}
			for (let Card of P.Board) {
				Card.Title = ClubCardTextGet("Title " + Card.Name);
				Card.Text = ClubCardTextGet("Text " + Card.Name);
			}
			for (let Card of P.Deck) {
				Card.Title = ClubCardTextGet("Title " + Card.Name);
				Card.Text = ClubCardTextGet("Text " + Card.Name);
			}
			for (let Card of P.FullDeck) {
				Card.Title = ClubCardTextGet("Title " + Card.Name);
				Card.Text = ClubCardTextGet("Text " + Card.Name);
			}
		}
	}
}

/**
 * Assigns the club card object if needed and loads the CSV file
 * @returns {void} - Nothing
 */
function ClubCardCommonLoad() {
	if (Player.Game == null) Player.Game = {};
	if (Player.Game.ClubCard == null) Player.Game.ClubCard = { Deck: [] };
	if (Player.Game.ClubCard.Reward == null) Player.Game.ClubCard.Reward = "";
	ClubCardList[0].Title = null;
	CommonReadCSV("NoArravVar", "MiniGame", "ClubCard", "Text_ClubCard");
}

/**
 * Loads the club card mini-game: Assigns the opponents and draws the cards
 * @returns {void} - Nothing
 */
function ClubCardLoad() {
	ClubCardCommonLoad();
	ClubCardOnlinePlayerMemberNumber1 = -1;
	ClubCardOnlinePlayerMemberNumber2 = -1;
	ClubCardTurnCardPlayed = 0;
	ClubCardIsStartTurn = false;
	ClubCardMessageStorage = [];
	ClubCardFocus = null;
	ClubCardLogScroll = false;
	ClubCardLog = [];
	ClubCardRenderLog = [];
	ClubCardTurnIndex = Math.floor(Math.random() * 2);
	ClubCardPlayer = [];
	ClubCardUniqueIDCounter = 0;
	ClubCardAddPlayer(Player, "Player", []);
	ClubCardAddPlayer(ClubCardOpponent, "AI", ClubCardOpponentDeck);
	ClubCardCreatePopup("DECK");
}

/**
 * Draw the club card player hand on screen, show only sleeves if not controlled by player
 * @param {Number} Value - The card to draw
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the card
 * @param {string} Image - The buble
 * @returns {Number} - The next bubble Y position
 */
function ClubCardRenderBubble(Value, X, Y, W, Image) {
	DrawImageResize("Screens/MiniGame/ClubCard/Bubble/" + Image + ".png", X, Y - W / 20, W, W);
	if (Value != null) DrawTextWrap(Value.toString(), X, Y, W, W, "Black");
	return Y + W * 1.5;
}

/**
 * Returns the text description of all groups, separated by commas
 * @param {readonly string[]} Group - The card to draw
 * @returns {string} - The
 */
function ClubCardGetGroupText(Group) {
	if ((Group == null) || (Group.length == 0)) return "";
	let Text = "";
	for (let G of Group)
		Text = Text + ((Text == "") ? "" : ", ") + ClubCardTextGet("Group" + G);
	return Text;
}


// #region Animation Card ### ### ### ###

/**
 * Returns a reference to the original card based on its UniqueID.
 * @param {ClubCard} card - A copy of the card for which the original needs to be found.
 * @returns {ClubCard|null} - The original card or null if not found.
 */
function ClubCardGetOriginalCard(card) {
	if (!card || !card.Location) return null;
	const targetArray = ClubCardGetCardArrayByLocation(card);
	return targetArray ? targetArray.find(c => c.UniqueID === card.UniqueID) : null;
}

/**
 * Calculates the position of a card in the player's or opponent's hand based on its UniqueID.
 * @param {ClubCard} card - The card object containing UniqueID and Location.
 * @returns {{x: number, y: number, w: number} | null} - The calculated position or null if not found.
 */
function ClubCardCalculateHandPosition(card) {
	if (!card || !card.Location) return null;

	let playerIndex = (card.Location === "PlayerHand") ? 0 : 1;
	let cardArray = ClubCardPlayer[playerIndex].Hand;
	let X = 0, Y = (playerIndex === 0) ? 800 : -200, W = 1700, H = 300;

	if (!cardArray || cardArray.length === 0) return null;

	const index = cardArray.findIndex(c => c.UniqueID === card.UniqueID);
	if (index === -1) return null;

	let PosX = Math.round(X + (W / 2) - (cardArray.length * W / 16));
	let IncX = Math.round(W / 8);

	if (PosX < X) {
		PosX = X;
		IncX = Math.round(W / cardArray.length);
	}

	const cardX = PosX + (index * IncX) + 5;
	const cardY = Y + 5 + (H * 0.1);
	const cardW = (W / 10) - 5;

	return { x: cardX, y: cardY, w: cardW };
}

/**
 * Calculates the position of a card on the player's or opponent's board based on its UniqueID.
 * @param {ClubCard} card - The card object containing UniqueID and Location.
 * @returns {{x: number, y: number, w: number} | null} - The calculated position or null if not found.
 */
function ClubCardCalculateBoardPosition(card) {
	if (!card || !card.Location) return null;

	let playerIndex = (card.Location === "PlayerBoard") ? 0 : 1;
	let cardArray = [...ClubCardPlayer[playerIndex].Board, ...(ClubCardPlayer[playerIndex].Event || [])];
	let X = 0, Y = (playerIndex === 0) ? 500 : 0, W = 1700, H = 500, Mirror = (playerIndex === 1);

	if (!cardArray || cardArray.length === 0) return null;

	const index = cardArray.findIndex(c => c.UniqueID === card.UniqueID);
	if (index === -1) return null;

	let PosX = Math.round(X + (W / 2) - (cardArray.length * W / 20));
	let IncX = Math.round(W / 10);

	if (PosX < X) {
		PosX = X;
		IncX = Math.round(W / cardArray.length);
	}

	let PosY = Mirror ? Y + H - (H * 0.65) : Y + (H * 0.1);

	const cardX = PosX + (index * IncX) + 5;
	const cardW = (W / 12) - 5;

	return { x: cardX, y: PosY, w: cardW };
}

/**
 * Outdated approach
 * Animates the smooth movement of a card from one position to another.
 * @param {Object} options - Animation parameters.
 * @param {ClubCard} options.card - The card to be moved.
 * @param {Object} options.startPosition - The starting position.
 * @param {number} options.startPosition.x - The starting X coordinate.
 * @param {number} options.startPosition.y - The starting Y coordinate.
 * @param {number} options.startPosition.w - The starting width of the card.
 * @param {Object} options.endPosition - The target position.
 * @param {number} options.endPosition.x - The target X coordinate.
 * @param {number} options.endPosition.y - The target Y coordinate.
 * @param {number} options.endPosition.w - The target width of the card.
 * @param {Function|null} [options.onStart] - A function called before the animation starts.
 * @param {Function|null} [options.onComplete] - A function called after the animation completes.
 * @param {number} [options.duration=150] - The animation duration in milliseconds.
 */
function ClubCardBaseCardAnimation({ card, startPosition, endPosition, onStart = null, onComplete = null, duration = 150 }) {
	if (typeof onStart === "function") onStart();
	let startTime = performance.now();

	function step(currentTime) {
		let elapsed = currentTime - startTime;
		let progress = Math.min(elapsed / duration, 1);

		let currentX = startPosition.x + (endPosition.x - startPosition.x) * progress;
		let currentY = startPosition.y + (endPosition.y - startPosition.y) * progress;
		let currentW = startPosition.w + (endPosition.w - startPosition.w) * progress;

		ClubCardRenderCard(card, currentX, currentY, currentW, null, null, true);

		if (progress < 1)
			requestAnimationFrame(step);
		else
			if (typeof onComplete === "function") onComplete(card);
	}

	requestAnimationFrame(step);
}

/**
 * Updates the positions of all active card animations.
 *
 * This function is called every frame within `ClubCardRun()` to animate cards smoothly.
 * It updates the position of each animated card based on the elapsed time and removes
 * completed animations from the `activeAnimations` array.
 *
 * @param {number} Timestamp - The current timestamp provided by `GameRun()`, ensuring synchronization with the game loop.
 *
 * **How it works:**
 * 1. Loops through all active animations in `activeAnimations`.
 * 2. Calculates the progress (0 to 1) of the animation based on elapsed time.
 * 3. Applies an ease-in-out effect for smoother movement.
 * 4️. Updates the card's position (`CurrentX`, `CurrentY`, `CurrentW`).
 * 5️. Once the animation is complete:
 *     - Restores the card’s visibility and state.
 *     - Restores the original card’s visibility if needed.
 *     - Calls `onComplete()` if provided.
 *     - Removes the animation from `activeAnimations`.
 */
function ClubCardUpdateCardAnimations(Timestamp) {
	ClubCardActiveAnimations = ClubCardActiveAnimations.filter(animation => {
		let elapsed = Timestamp - animation.StartTime;
		let progress = Math.min(elapsed / animation.Duration, 1);

		let easedProgress = progress < 0.5
			? 2 * progress * progress
			: 1 - Math.pow(-2 * progress + 2, 2) / 2;

		let currentX = animation.StartPosition.x + (animation.EndPosition.x - animation.StartPosition.x) * easedProgress;
		let currentY = animation.StartPosition.y + (animation.EndPosition.y - animation.StartPosition.y) * easedProgress;
		let currentW = animation.StartPosition.w + (animation.EndPosition.w - animation.StartPosition.w) * easedProgress;

		ClubCardRenderCard(animation.Card, currentX, currentY, currentW, null, null, true);

		if (progress >= 1) {
			clearTimeout(animation.SafetyTimeout);

			animation.Card.IsVisible = true;
			animation.Card.AnimationState = "idle";

			if (animation.OriginalCard && !animation.KeepOriginalHidden) {
				animation.OriginalCard.IsVisible = true;
				animation.OriginalCard.AnimationState = "idle";
			}

			if (typeof animation.OnComplete === "function") animation.OnComplete(animation.Card);
			return false;
		}

		return true;
	});
}


/**
 * Moves a card between predefined positions (Preview, Hand, Pending).
 * Handles both animation of a copy and visibility of the original card.
 * @param {ClubCard} card - The card being moved.
 * @param {Object} startPosition - The starting position {x, y, w}.
 * @param {Object} endPosition - The target position {x, y, w}.
 * @param {boolean} hideOriginal - Whether to hide the original card during animation.
 * @param {boolean} keepOriginalHidden - If true, the original card stays hidden after animation.
 * @param {Function|null} [onStart] - Function called before the animation starts.
 * @param {Function|null} [onComplete] - Function called after the animation completes.
 * @param {number} [duration=200] - Animation duration in milliseconds.
 */
function ClubCardMoveCard(card, startPosition, endPosition, hideOriginal = false, keepOriginalHidden = false, onStart = null, onComplete = null, duration = 200) {
	if (!card || card.AnimationState !== "idle") return;

	card.AnimationState = "moving";
	card.IsVisible = false;

	const originalCard = ClubCardGetOriginalCard(card);

	if (hideOriginal && originalCard) {
		originalCard.IsVisible = false;
		originalCard.AnimationState = "moving";
	}

	if (typeof onStart === "function") onStart();

	const safetyTimeout = setTimeout(() => {
		console.warn(`⚠️ Fallback: Restore ${card.Name} state manually!`);
		if (originalCard && !keepOriginalHidden) {
			originalCard.IsVisible = true;
			originalCard.AnimationState = "idle";
		}
		card.AnimationState = "idle";
	}, duration + 50);

	ClubCardActiveAnimations.push({
		Card: card,
		OriginalCard: originalCard,
		StartTime: performance.now(),
		Duration: duration,
		StartPosition: startPosition,
		EndPosition: endPosition,
		HideOriginal: hideOriginal,
		KeepOriginalHidden: keepOriginalHidden,
		SafetyTimeout: safetyTimeout,
		OnComplete: onComplete
	});
}

/**
 * Moves a card to the preview position (original card stays hidden after).
 */
function ClubCardMoveCardToPreview(card, onStart = null, onComplete = null, duration = 200) {
	ClubCardMoveCard(card,
		{ x: card.CurrentX, y: card.CurrentY, w: card.CurrentW },
		ClubCardPreviewPosition,
		true,
		true,
		onStart,
		onComplete,
		duration);
}

/**
 * Returns a card from preview back to its original position.
 */
function ClubCardReturnCardFromPreview(card, onStart = null, onComplete = null, duration = 200) {
	const originalCard = ClubCardGetOriginalCard(card);

	ClubCardMoveCard(card,
		ClubCardPreviewPosition,
		{ x: originalCard.CurrentX, y: originalCard.CurrentY, w: originalCard.CurrentW },
		false,
		false,
		onStart,
		onComplete,
		duration);
}

/**
 * Returns a card from pending state back to its original position.
 */
function ClubCardReturnCardFromPending(card, onStart = null, onComplete = null, duration = 200) {
	const originalCard = ClubCardGetOriginalCard(card);

	ClubCardMoveCard(card,
		ClubCardPendingPosition,
		{ x: originalCard.CurrentX, y: originalCard.CurrentY, w: originalCard.CurrentW },
		false,
		false,
		onStart,
		onComplete,
		duration);
}

/**
 * Moves a card from preview to pending state.
 * @param {ClubCard} card - The card to be moved.
 * @param {Function|null} [onStart] - A function called before the animation starts.
 * @param {Function|null} [onComplete] - A function called after the animation completes.
 * @param {number} [duration=150] - The animation duration in milliseconds.
 */
function ClubCardMoveCardToPending(card, onStart = null, onComplete = null, duration = 200) {
	ClubCardMoveCard(card,
		ClubCardPreviewPosition,
		ClubCardPendingPosition,
		false,
		true,
		onStart,
		onComplete,
		duration);
}

// #endregion ### ### ### ### ### ### ###

/**
 * Draw the club card player hand on screen, show only sleeves if not controlled by player
 * @param {ClubCard|Number} Card - The card to draw
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the card
 * @param {number|null} Sleeve - The sleeve image to draw instead of the card
 * @param {string|null} Source - The source from where it's called
 * @returns {void} - Nothing
 */
function ClubCardRenderCard(Card, X, Y, W, Sleeve = null, Source = null, isIgnoreIsVisibility = false) {

	// Make sure the card object is valid, find it in the list if possible
	if (Card == null) return;
	if (typeof Card === "number") {
		for (let C of ClubCardList) {
			if (C.ID == Card) {
				Card = C;
				break;
			}
		}
	}
	if (typeof Card !== "object") return;

	//Save Current Card coordinates
	Card.CurrentX = X;
	Card.CurrentY = Y;
	Card.CurrentW = W;

	//Check isVisibility
	if (isIgnoreIsVisibility == false)
		if (Card.IsVisible == false)
			return;
	// Draw the sleeved version if required
	if (Sleeve != null) {
		DrawImageResize("Screens/MiniGame/ClubCard/Sleeve/" + Sleeve + ".png", X, Y, W, W * 2);
		return;
	}

	// Keeps the hover card
	if (Card.AnimationState != "moving") {
		if (MouseIn(X, Y, W, W * 2)) {
			ClubCardHover = { ...Card };
			ClubCardHover.Location = Source;
		}
	}

	// Gets the text and frame color
	let Level = ((Card.RequiredLevel == null) || (Card.RequiredLevel <= 1)) ? 1 : Card.RequiredLevel;
	let Color = ClubCardColor[Level];
	if (Card.Type == null) Card.Type = "Member";

	// Draw the images and texts on the screen
	DrawImageResize("Screens/MiniGame/ClubCard/Frame/" + Card.Type + ((Card.Reward != null) ? "Reward" : "") + Level.toString() + ".png", X, Y, W, W * 2);
	DrawImageResize("Screens/MiniGame/ClubCard/" + Card.Type + "/" + Card.Name + ".png", X + W * 0.05, Y + W * 0.16, W * 0.9, W * 1.8);
	if ((Card.Time != null) && ((Card.Location === "PlayerBoard") || (Card.Location === "OpponentBoard"))) {
		MainCanvas.font = "bold " + Math.round(W / 1.5) + "px arial";
		DrawText(Card.Time.toString(), X + W * 0.5, Y + W * 0.9, "Black", "Silver");
	}
	MainCanvas.font = "bold " + Math.round(W / 12) + "px arial";
	DrawTextWrap(Card.Title, X + W * 0.05, Y + W * 0.05, W * 0.9, W * 0.1, "Black", null, null, Math.round(W / 22));
	let BubblePos = Y + W * 0.2;
	let WModifier = 0.125; // Modifier for adjusting fame, money, level, liability icons
	if (ClubCardIsLiability(Card)) BubblePos = ClubCardRenderBubble(null, X + W * 0.05, BubblePos, W * WModifier, "Liability");
	if (Level > 1) BubblePos = ClubCardRenderBubble(Level, X + W * 0.05, BubblePos, W * WModifier, "Level");
	if (Card.FamePerTurn != null) BubblePos = ClubCardRenderBubble(Card.FamePerTurn, X + W * 0.05, BubblePos, W * WModifier, "Fame");
	if (Card.MoneyPerTurn != null) ClubCardRenderBubble(Card.MoneyPerTurn, X + W * 0.05, BubblePos, W * WModifier, "Money");
	if (Card.Text != null) {
		DrawRect(X + W * 0.05, Y + W * 1.41, W * 0.9, W * 0.58, Color + "A0");
		let GroupText = ClubCardGetGroupText(Card.Group);
		if (GroupText != "") {
			if (Card.RewardMemberNumber && GroupText.includes(ClubCardTextGet("GroupPlayer"))) {
				var playerText = ClubCardTextGet("GroupPlayer");
				GroupText = GroupText.replace(playerText, `${playerText} #${Card.RewardMemberNumber}`);
			}
			MainCanvas.font = "bold " + Math.round(W / 16) + "px arial";
			DrawTextWrap(GroupText, X + W * 0.05, Y + W * 1.44, W * 0.925, W * 0.1, "Black", null, null, Math.round(W / 22));
			MainCanvas.font = ((Card.Text.startsWith("<F>")) ? "italic " : "bold ") + Math.round(W / 16) + "px arial";
			DrawTextWrap(Card.Text.replace("<F>", ""), X + W * 0.05, Y + W * 1.6, W * 0.925, W * 0.38, "Black", null, null, Math.round(W / 22));
		}
		else {
			MainCanvas.font = ((Card.Text.startsWith("<F>")) ? "italic " : "bold ") + Math.round(W / 16) + "px arial";
			DrawTextWrap(Card.Text.replace("<F>", ""), X + W * 0.05, Y + W * 1.5, W * 0.925, W * 0.48, "Black", null, null, Math.round(W / 22));
		}
	}
	MainCanvas.font = CommonGetFont(36);

	// If the card has a glowing border, we draw it
	let Time = CommonTime();
	if ((Card.GlowTimer != null) && (Card.GlowTimer > Time))
		DrawEmptyRect(X + (W * 0.005), Y + (W * 0.01), W - (W * 0.01), W * 2 - (W * 0.02), Card.GlowColor + Math.round((Card.GlowTimer - Time) / 40).toString(16), Math.round(W / 50));

}

/**
 * Draw the club card player board on screen
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws the cards
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the game board
 * @param {number} H - The height of the game board
 * @param {boolean} Mirror - If the board should be rendered bottom to top
 * @returns {void} - Nothing
 */
function ClubCardRenderBoard(CCPlayer, X, Y, W, H, Mirror) {

	// Draws the money, fame and level
	MainCanvas.font = CommonGetFont(Math.round(H / 20));
	let TextY = Mirror ? Y + H * 0.895 : Y + H * 0.01;
	if (CCPlayer.Character != null) DrawTextWrap(CharacterNickname(CCPlayer.Character), X + W * 0.016, TextY, W * 0.19, H * 0.1, "White");
	if (CCPlayer.Fame != null) DrawTextWrap(TextGet("Fame") + " " + CCPlayer.Fame + (((CCPlayer.LastFamePerTurn != null) && (CCPlayer.LastFamePerTurn != 0)) ? " (" + ((CCPlayer.LastFamePerTurn > 0) ? "+" : "") + CCPlayer.LastFamePerTurn.toString() + ")" : ""), X + W * 0.21, TextY, W * 0.19, H * 0.1, (CCPlayer.Fame >= 0) ? "White" : "Pink");
	if (CCPlayer.Money != null) DrawTextWrap(TextGet("Money") + " " + CCPlayer.Money + (((CCPlayer.LastMoneyPerTurn != null) && (CCPlayer.LastMoneyPerTurn != 0)) ? " (" + ((CCPlayer.LastMoneyPerTurn > 0) ? "+" : "") + CCPlayer.LastMoneyPerTurn.toString() + ")" : ""), X + W * 0.61, TextY, W * 0.19, H * 0.1, (CCPlayer.Money >= 0) ? "White" : "Pink");
	if (CCPlayer.Level != null) DrawTextWrap(TextGet("Level" + CCPlayer.Level) + " (" + CCPlayer.Board.length + " / " + ClubCardLevelLimit[CCPlayer.Level] + ")", X + W * 0.81, TextY, W * 0.19, H * 0.1, ClubCardColor[CCPlayer.Level]);

	// Draws the played cards
	if (!CCPlayer || !CCPlayer.Board) return;

	let FullBoard = [...CCPlayer.Board, ...(CCPlayer.Event || [])];
	const isEqualBoard = CCPlayer.RenderFullBoard.length === FullBoard.length
		&& CCPlayer.RenderFullBoard.every((card, index) => card.UniqueID === FullBoard[index].UniqueID);

	if (!isEqualBoard) {
		const remainingCards = CCPlayer.RenderFullBoard
			.filter(oldCard => FullBoard.some(newCard => newCard.UniqueID === oldCard.UniqueID))
			.map(oldCard => ({ ...oldCard }));

		let PosX = Math.round(X + (W / 2) - (FullBoard.length * W / 20));
		let IncX = Math.round(W / 10);
		if (PosX < X) {
			PosX = X;
			IncX = Math.round(W / FullBoard.length);
		}

		for (let C of FullBoard) {
			let PosY = Mirror ? Y + H - (H * 0.65) : Y + (H * 0.1);
			C.CurrentX = PosX + 5;
			C.CurrentY = PosY;
			C.CurrentW = (W / 12) - 5;
			PosX += IncX;
		}

		//########### Record animations for the new card positions
		remainingCards.forEach(copyCard => {
			const originalCard = ClubCardGetOriginalCard(copyCard);
			if (!originalCard) return;

			const startPosition = { x: copyCard.CurrentX, y: copyCard.CurrentY, w: copyCard.CurrentW };
			const endPosition = { x: originalCard.CurrentX, y: originalCard.CurrentY, w: originalCard.CurrentW };

			ClubCardMoveCard(copyCard, startPosition, endPosition, true, false, null, null, 150);
		});
		//###########

		CCPlayer.RenderFullBoard = [...FullBoard];
	}

	for (let C of CCPlayer.RenderFullBoard)
		ClubCardRenderCard(C, C.CurrentX, C.CurrentY, C.CurrentW, null, (CCPlayer.Control === "Player") ? "PlayerBoard" : "OpponentBoard");

	// Puts a shadow over the board if not playing
	MainCanvas.font = CommonGetFont(36);
	if (CCPlayer.Index != ClubCardTurnIndex) DrawRect(X, Y, W, H, "#0000007F");

}

/**
 * Draw the club card player hand on screen, show only sleeves if not controlled by player
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws it's hand
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the game board
 * @param {number} H - The height of the game board
 * @returns {void} - Nothing
 */
function ClubCardRenderHand(CCPlayer, X, Y, W, H) {
	if ((CCPlayer == null) || (CCPlayer.Hand == null)) return;
	let PosX = Math.round(X + (W / 2) - (CCPlayer.Hand.length * W / 16));
	let IncX = Math.round(W / 8);
	if (PosX < X) {
		PosX = X;
		IncX = Math.round(W / CCPlayer.Hand.length);
	}
	for (let C of CCPlayer.Hand) {
		const isSleeve = (CCPlayer.Control == "Player") ? null : (ClubCardNameIsOnBoard(CCPlayer, "Show Dog") ? null : CCPlayer.Sleeve);
		const source = (CCPlayer.Control == "Player") ? "PlayerHand" : "OpponentHand";
		ClubCardRenderCard(C, PosX + 5, Y + 5 + (H * 0.1), (W / 10) - 5, isSleeve, source);
		PosX = PosX + IncX;
	}
}

/**
 * Draw the discard pile on screen
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws it's discard pile
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the discard pile window
 * @param {number} H - The height of the discard pile window
 * @returns {void} - Nothing
 */
function ClubCardRenderDiscardPile(CCPlayer, X, Y, W, H) {
	if ((CCPlayer == null) || (CCPlayer.DiscardPile == null)) return;
	let PosX = Math.round(X + (W / 2) - (CCPlayer.DiscardPile.length * W / 16));
	let IncX = Math.round(W / 8);
	if (PosX < X) {
		PosX = X;
		IncX = Math.round(W / CCPlayer.DiscardPile.length);
	}
	for (let C of CCPlayer.DiscardPile) {
		ClubCardRenderCard(C, PosX + 5, Y + 5 + (H * 0.1), (W / 10) - 5, null, (CCPlayer.Control == "Player") ? "PlayerDiscardPile" : "OpponentDiscardPile");
		PosX = PosX + IncX;
	}
}

/**
 * Shows the status text on the bottom right
 * @param {string} Text - The status text to show
 * @returns {void} - Nothing
 */
function ClubCardStatusText(Text) {
	MainCanvas.font = CommonGetFont((ClubCardPopup == null) ? 26 : 32);
	DrawTextWrap(TextGet(Text), 1715, 900, (ClubCardPopup == null) ? 190 : 280, 100, "White");
	MainCanvas.font = CommonGetFont(36);
}

/**
 * Renders the right side panel
 * @returns {void} - Nothing
 */
function ClubCardRenderPanel() {

	// Draws the focused card, panel and log
	DrawRect(1702, 0, 298, 1000, "#404040");
	DrawRect(1700, 0, 2, 1000, "White");
	if (document.getElementById("CCLog") == null) {
		ElementCreateDiv("CCLog");
		let Elem = document.getElementById("CCLog");
		Elem.style.backgroundColor = "#000000";
		Elem.style.overflowY = "auto";
		Elem.style.whiteSpace = "pre-wrap";
	} else {
		if (ClubCardLog.length == 0) {
			const Elem = document.getElementById("CCLog");
			Elem.innerHTML = "";
		}
	}
	if (document.getElementById("CCChat") == null) {
		ElementCreateInput("CCChat", "text", "", "100");
		let Elem = document.getElementById("CCChat");
		Elem.style.backgroundColor = "#FFFFFF";
		Elem.style.color = "#000000";
		Elem.setAttribute("placeholder", TextGet("ChatHere"));
	}

	ElementPositionFix("CCLog", 20, 1705, 5, 285, 825);
	//old
	//ElementPositionFix("CCLog", 20, 1705, (ClubCardFocus == null) ? 5 : 590, 285, (ClubCardFocus == null) ? 825 : 240);
	ElementPosition("CCChat", 1857, 865, 306);

	if (ClubCardRenderLog.length > 0) {
		for (let messageLogItem of ClubCardRenderLog) {

			messageLogItem.MessageText = messageLogItem.MessageText
				? messageLogItem.MessageText
				: ClubCardMessageGetText(messageLogItem);


			if (messageLogItem == null || messageLogItem.MessageText == "") continue;

			//fix bug double Turn Message in start game
			if (messageLogItem.MessageType == ClubCardMessageType.STARTTURNINFO)
				if (ClubCardLog.some(item => item.MessageText === messageLogItem.MessageText)) continue;
			//one style for all these types message
			const isOneDivContainer = messageLogItem.MessageType == ClubCardMessageType.SYSTEM
				|| messageLogItem.MessageType == ClubCardMessageType.PLAYERSMESSAGE
				|| messageLogItem.MessageType == ClubCardMessageType.PREREQUISTITE
				|| messageLogItem.MessageType == ClubCardMessageType.PLAYERSDISCONNECTED;
			if (isOneDivContainer) {
				ClubCardCreateOneDivContainer(messageLogItem);
			}  else {
				ClubCardCreateTurnDivContainer(messageLogItem);
			}
		}

		ClubCardLog.push(...ClubCardRenderLog);
		//Clear ClubCardRenderLog
		ClubCardRenderLog = [];
	}



	if (ClubCardLogScroll) {
		ElementScrollToEnd("CCLog");
		ClubCardLogScroll = false;
	}

	// In deck popup mode
	if ((ClubCardPopup != null) && (ClubCardPopup.Mode == "DECK")) {
		ClubCardStatusText("SelectDeck");
		return;
	}

	// Can concede/exit out of popup mode
	if (ClubCardPopup == null) DrawButton(1905, 905, 90, 90, null, "White", "Screens/MiniGame/ClubCard/Button/Concede.png", TextGet(ClubCardIsPlaying() ? "Concede" : "StopWatch"));

	// If we are waiting for deck selection
	if ((ClubCardPlayer[0].FullDeck == null) || (ClubCardPlayer[0].FullDeck.length == 0) || (ClubCardPlayer[1].FullDeck == null) || (ClubCardPlayer[1].FullDeck.length == 0)) {
		ClubCardStatusText("WaitingSelectDeck");
		return;
	}

	// Draw the discard and bottom butttons and texts
	if ((ClubCardPopup == null) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player")) {
		DrawButton(1805, 905, 90, 90, null, "White", "Screens/MiniGame/ClubCard/Button/Bankrupt.png", TextGet("Bankrupt"));
		DrawButton(1705, 905, 90, 90, null, "White", "Screens/MiniGame/ClubCard/Button/" + ((ClubCardTurnCardPlayed == 0) ? "Draw" : "CannotDraw") + ".png", TextGet((ClubCardTurnCardPlayed == 0) ? "Draw" : "CannotDraw"));
	} else ClubCardStatusText(ClubCardIsPlaying() ? "OpponentPlaying" : "WatchingGame");
	DrawButton(5, 450, 45, 45, null, "White", "Screens/MiniGame/ClubCard/Button/DiscardPile.png", TextGet("OpponentDiscardPile"));
	DrawButton(5, 505, 45, 45, null, "White", "Screens/MiniGame/ClubCard/Button/DiscardPile.png", TextGet("DiscardPile"));
}

/**
 * Function to create and add system or player messages to document.getElementById(“CCLog”).
 * @param {ClubCardMessage} MessageItem - Message
 */
function ClubCardCreateOneDivContainer(MessageItem) {
	const systemMessageBackground = "#04122a";
	const playerMessageBackground = "#15171A";
	const playersDisconnectedBackground = "#8B0000";
	let divName = null;
	let counter = 1;

	if (MessageItem.MessageType == ClubCardMessageType.PREREQUISTITE) {
		divName = "OneMessagePrerequisite";
		const existingElement = document.getElementById(divName);
		if (existingElement) existingElement.remove();
	}
	else {
		while (true) {
			divName = `OneMessageDiv_Turn${MessageItem.TurnCounter}_${counter}`;
			if (document.getElementById(divName) == null) break;
			counter++;
		}
	}


	const elementDiv = ElementCreateDiv(divName);
	elementDiv.style.color = "white";
	elementDiv.style.marginTop = "2px";
	elementDiv.style.marginBottom = "2px";
	elementDiv.style.borderTop = "1px solid white";
	elementDiv.style.borderBottom = "1px solid white";
	elementDiv.style.borderRadius = "5px";
	elementDiv.style.lineHeight = "1.4";
	elementDiv.style.overflowWrap = "break-word";
	elementDiv.textContent = MessageItem.MessageText;

	if (MessageItem.MessageType == ClubCardMessageType.SYSTEM)
		elementDiv.style.backgroundColor = systemMessageBackground;
	else if (MessageItem.MessageType == ClubCardMessageType.PLAYERSDISCONNECTED)
		elementDiv.style.backgroundColor = playersDisconnectedBackground;
	else
		elementDiv.style.backgroundColor = playerMessageBackground;

	document.getElementById("CCLog").appendChild(elementDiv);
}

/**
 * Function for creating and filling a container with all objects for a stroke by index.
 * @param {ClubCardMessage} MessageItem - Message
 */
function ClubCardCreateTurnDivContainer(MessageItem) {
	//const MainTurnContainerBackgound = "#15171A";
	const ActionSeparatorBackgound = "#2E2E2E";
	const StartTurnTextColor = "#FF9999";

	const turnDivName = `TurnDiv_Turn${MessageItem.TurnCounter}_${MessageItem.PlayerId}`;
	if (document.getElementById(turnDivName) == null) {
		const turnDiv = ElementCreateDiv(turnDivName);
		document.getElementById("CCLog").appendChild(turnDiv);
		turnDiv.style.marginTop = "10px";
		turnDiv.style.marginBottom = "10px";
		turnDiv.style.borderTop = "1px solid white";
		turnDiv.style.borderBottom = "1px solid white";
		turnDiv.style.borderRadius = "10px";
		//turnDivContainer.style.backgroundColor = MainTurnContainerBackgound;
	}
	const messageElement = document.createElement("div");
	messageElement.style.color = "white";
	messageElement.style.marginTop = "2px";
	messageElement.style.marginBottom = "2px";
	messageElement.style.lineHeight = "1.4";
	messageElement.style.overflowWrap = "break-word";
	messageElement.textContent = MessageItem.MessageText;

	if (MessageItem.MessageType == ClubCardMessageType.STARTTURNINFO) {
		messageElement.id = `Message ${ClubCardMessageType.STARTTURNINFO}`;
		messageElement.style.fontWeight = "bold";
		messageElement.style.color = StartTurnTextColor;
		messageElement.style.textAlign = "center";
	} else if (MessageItem.MessageType == ClubCardMessageType.ACTIONSEPARATOR) {
		messageElement.style.backgroundColor = ActionSeparatorBackgound;
		messageElement.style.borderTop = "1px solid white";
		messageElement.style.borderBottom = "1px solid white";
	}
	else {
		messageElement.textContent = null;
		messageElement.innerHTML = ClubCardGetFormatTextForInnerHTML(MessageItem.MessageText);
	}
	document.getElementById(turnDivName).appendChild(messageElement);
}

/**
 * Renders the popup on the top of the game board
 * @returns {void} - Nothing
 */
function ClubCardRenderPopup() {

	// Exit on no popup
	if (ClubCardPopup == null) return;

	// In deck mode, we draw 10 deck buttons
	if (ClubCardPopup.Mode == "DECK") {
		DrawRect(548, 298, 604, 404, "White");
		DrawRect(550, 300, 600, 400, "Black");
		for (let Deck = 0; Deck < 10; Deck++)
			DrawButton(560 + Math.floor(Deck / 5) * 300, 310 + (Deck % 5) * 80, 280, 60, ClubCardBuilderGetDeckName(Deck), "White");
		return;
	}

	// Draw the discard pile popup
	if (ClubCardPopup.Mode == "DISCARDPILE") {
		DrawRect(48, 258, 1604, 484, "White");
		DrawRect(50, 260, 1600, 480, "Black");
		DrawButton(760, 650, 180, 60, ClubCardPopup.Button1, "White");
		if (ClubCardPopup.Text == "Opponent") {
			ClubCardRenderDiscardPile(ClubCardPlayer[1], 52, 252, 1516, 428);
		} else {
			ClubCardRenderDiscardPile(ClubCardPlayer[0], 52, 252, 1516, 428);
		}
		return;
	}

	// Draw the yes/no/text popups
	DrawRect(648, 348, 404, 304, "White");
	DrawRect(650, 350, 400, 300, "Black");
	DrawTextWrap(ClubCardPopup.Text, 670, 360, 370, 210, "White");
	if (ClubCardPopup.Mode == "TEXT") DrawButton(700, 570, 300, 60, ClubCardPopup.Button1, "White");
	if (ClubCardPopup.Mode == "YESNO") {
		DrawButton(660, 570, 180, 60, ClubCardPopup.Button1, "White");
		DrawButton(860, 570, 180, 60, ClubCardPopup.Button2, "White");
	}

}

/**
 * Runs the club card game, draws all the controls
 * @param {number} Timestamp - The current timestamp from GameRun(), used for animation timing.
 * @returns {void} - Nothing
 */
function ClubCardRun(Timestamp) {
	ClubCardHover = null;
	ClubCardLoadCaption();
	ClubCardRenderBoard(ClubCardPlayer[0], 0, 500, 1700, 500, false);
	ClubCardRenderBoard(ClubCardPlayer[1], 0, 0, 1700, 500, true);
	DrawRect(0, 499, 1700, 2, "White");
	ClubCardRenderHand(ClubCardPlayer[0], 0, 800, 1700, 300);
	ClubCardRenderHand(ClubCardPlayer[1], 0, -200, 1700, 300);
	ClubCardUpdateCardAnimations(Timestamp);

	//Render ClubCardFocus
	if (ClubCardFocus != null) {
		ClubCardRenderCard(ClubCardFocus, ClubCardPreviewPosition.x, ClubCardPreviewPosition.y, ClubCardPreviewPosition.w);
		if (!ClubCardPending && ClubCardCanPlayCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus))
			if(ClubCardFocus.IsVisible) DrawButton(725, 505, 215, 50, TextGet("PlayCard"), "White");
	}

	//Render ClubCardPending. If there's a pending card with a prerequisite
	if (ClubCardPending != null) {
		DrawButton(1805, 905, 90, 90, null, "White", "Screens/MiniGame/ClubCard/Button/CancelPending.png", TextGet("CancelPending"));
		ClubCardRenderCard(ClubCardPending, ClubCardPendingPosition.x, ClubCardPendingPosition.y, ClubCardPendingPosition.w);
		if (ClubCardCanSelectCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus))
			if(ClubCardFocus.IsVisible) DrawButton(725, 505, 215, 50, TextGet("SelectCard"), "White");
	}

	ClubCardRenderPanel();

	ClubCardBackground = Player.Game.ClubCard.Background ? Player.Game.ClubCard.Background : "ClubCardPlayBoard1";
	const isLvlUpButtonRender = ClubCardPopup == null &&
		(ClubCardPlayer[ClubCardTurnIndex].Control == "Player") &&
		(ClubCardPlayer[ClubCardTurnIndex].Level < ClubCardLevelCost.length - 1) &&
		(ClubCardPlayer[ClubCardTurnIndex].Money >= ClubCardCalculateLevelCost(ClubCardPlayer[ClubCardTurnIndex])) &&
		// Homeroom stops players leveling up
		!(ClubCardEventNameIsInEvents(ClubCardPlayer[0], "Homeroom") || ClubCardEventNameIsInEvents(ClubCardPlayer[1], "Homeroom"));

	if (isLvlUpButtonRender) {
		const buttonText = TextGet("UpgradeToLevel" + (ClubCardPlayer[ClubCardTurnIndex].Level + 1).toString());
		DrawButton(
			1390,
			435,
			300,
			60,
			buttonText.replace("MONEY", ClubCardCalculateLevelCost(ClubCardPlayer[ClubCardTurnIndex]).toString()),
			"White"
		);
	}

	ClubCardRenderPopup();
}

/**
 * Handles clicks during the club card game
 * @returns {void} - Nothing
 */
function ClubCardClick() {
	// In popup mode, no other clicks can be done but the popup buttons
	if (ClubCardPopup != null) {
		if ((ClubCardPopup.Mode == "TEXT") && MouseIn(700, 570, 300, 60)) return CommonDynamicFunction(ClubCardPopup.Function1);
		if ((ClubCardPopup.Mode == "YESNO") && MouseIn(660, 570, 180, 60)) return CommonDynamicFunction(ClubCardPopup.Function1);
		if ((ClubCardPopup.Mode == "YESNO") && MouseIn(860, 570, 180, 60)) return CommonDynamicFunction(ClubCardPopup.Function2);
		if (ClubCardPopup.Mode == "DISCARDPILE") {
			if (MouseIn(760, 650, 180, 60)) return CommonDynamicFunction(ClubCardPopup.Function1);
			if (ClubCardPopup.Text == "Opponent") {
				if ((ClubCardHover != null) && ClubCardHover.Location == "OpponentDiscardPile") {
					ClubCardFocus = { ...ClubCardHover };
					return;
				}
			} else {
				if ((ClubCardHover != null) && ClubCardHover.Location == "PlayerDiscardPile") {
					ClubCardFocus = { ...ClubCardHover };
					return;
				}
			}
		}
		if (ClubCardPopup.Mode == "DECK")
			for (let Deck = 0; Deck < 10; Deck++)
				if (MouseIn(560 + Math.floor(Deck / 5) * 300, 310 + (Deck % 5) * 80, 280, 60))
					ClubCardLoadDeckNumber(Deck);
		return;
	}

	// If there's a pending card with a prerequisite, there are extra buttons
	if ((ClubCardPending != null) && MouseIn(725, 505, 215, 50) && ClubCardCanSelectCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus)) return ClubCardSelectCard(ClubCardFocus);
	if ((ClubCardPending != null) && MouseIn(1805, 905, 90, 90)) {
		const card = { ...ClubCardPending};
		ClubCardPending = null;
		ClubCardReturnCardFromPending(card);
		return;
	}

	// Can always concede/exit
	if (MouseIn(1905, 905, 90, 90)) return ClubCardCreatePopup("YESNO", TextGet(ClubCardIsPlaying() ? "ConfirmConcede" : "ConfirmExit"), TextGet("Yes"), TextGet("No"), "ClubCardConcede()", "ClubCardDestroyPopup()");

	// If we are waiting for deck selection
	if ((ClubCardPlayer[0].FullDeck == null) || (ClubCardPlayer[0].FullDeck.length == 0) || (ClubCardPlayer[1].FullDeck == null) || (ClubCardPlayer[1].FullDeck.length == 0)) return;

	// Runs the basic game buttons

	//Play Card
	if (MouseIn(725, 505, 215, 50) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player") && ClubCardCanPlayCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus)) return ClubCardStartTurn(ClubCardStartTurnType.PLAYCARD);
	// Click on an empty space to reset the focus of the selected Card.
	if (MouseIn(700, 245, 260, 510) && ClubCardFocus != null && ClubCardFocus.AnimationState != "moving") {
		const card = { ...ClubCardFocus };
		ClubCardFocus = null;
		ClubCardReturnCardFromPreview(card);
		return;
	}
	// Draw card and end turn
	if (MouseIn(1705, 905, 90, 90) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player")) return ClubCardStartTurn(ClubCardStartTurnType.DRAWENDTURN);
	// Open Bancrupt window and bind function close and bancrupt in yes and no
	if (MouseIn(1805, 905, 90, 90) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player")) return ClubCardCreatePopup("YESNO", TextGet("ConfirmBankrupt"), TextGet("Yes"), TextGet("No"), "ClubCardStartTurn()", "ClubCardDestroyPopup()");
	// Upgrade lvl Club
	if (MouseIn(1390, 435, 300, 60) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player") && (ClubCardPlayer[ClubCardTurnIndex].Level < ClubCardLevelCost.length - 1) && (ClubCardPlayer[ClubCardTurnIndex].Money >= ClubCardCalculateLevelCost(ClubCardPlayer[ClubCardTurnIndex]))) return ClubCardStartTurn(ClubCardStartTurnType.UPGRADELEVEL);

	//DISCARDPILE
	if (MouseIn(5, 450, 45, 45)) return ClubCardCreatePopup("DISCARDPILE", "Opponent", TextGet("Close"), null, "ClubCardDestroyPopup()", null);
	if (MouseIn(5, 505, 45, 45)) return ClubCardCreatePopup("DISCARDPILE", null, TextGet("Close"), null, "ClubCardDestroyPopup()", null);

	// Sets the focus card if nothing else was clicked
	if (ClubCardHover && ClubCardHover.AnimationState !== "moving") {
		// If the hovered card is already pending, do nothing
		if (ClubCardPending && ClubCardPending.UniqueID === ClubCardHover.UniqueID) return;
		// Check if the focus card needs to change
		if (!ClubCardFocus || ClubCardFocus.UniqueID !== ClubCardHover.UniqueID) {

			// If there is a card currently in focus, return it to the hand
			if (ClubCardFocus) {
				if (ClubCardFocus.AnimationState != "idle") return;
				ClubCardReturnCardFromPreview(ClubCardFocus);
			}

			const card = { ...ClubCardHover};
			ClubCardFocus = card;
			ClubCardMoveCardToPreview(card);
			return;
		}
	}
}

/**
 * Keyboard event handler for the Club Card game chat
 * @type {KeyboardEventListener}
 */
function ClubCardKeyDown(event) {
	if (document.activeElement.id !== "CCChat") return false;

	if (CommonKey.IsPressed(event, "Enter")) {
		let Value = ElementValue("CCChat").trim();
		if (Value != "") {
			const Msg = CharacterNickname(Player) + ": " + Value;
			ClubCardMessageAdd(ClubCardMessageType.PLAYERSMESSAGE, null, {}, null, Msg);
			ElementValue("CCChat", "");
			return true;
		}
	}
	return false;
}
