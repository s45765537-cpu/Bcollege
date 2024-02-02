"use strict";
var ClubCardBackground = "ClubCardPlayBoard1";
var ClubCardLog = [];
var ClubCardLogText = "";
var ClubCardLogScroll = false;
var ClubCardColor = ["#808080", "#FFFFFF", "#E0E0E0", "#D0FFD0", "#D0D0FF", "#FFD0D0", "#FFE080"];
var ClubCardOpponent = null;
var ClubCardOpponentDeck = [];
var ClubCardReward = null;
var ClubCardHover = null;
var ClubCardFocus = null;
var ClubCardTextCache = null;
var ClubCardTurnIndex = 0;
var ClubCardTurnCardPlayed = 0;
var ClubCardTurnEndDraw = false;
var ClubCardFameGoal = 100;
var ClubCardPopup = null;
var ClubCardSelection = null;
var ClubCardPending = null;
var ClubCardLevelLimit = [0, 5, 8, 13, 20, 40];
var ClubCardLevelCost = [0, 0, 10, 20, 35, 50];
/** @type {ClubCardPlayer[]} */
var ClubCardPlayer = [];
var ClubCardOnlinePlayerMemberNumber1 = -1;
var ClubCardOnlinePlayerMemberNumber2 = -1;
/** @type {ClubCard[]} */
var ClubCardList = [

	// 1000 - Regular Members (No specific rules)
	{
		ID: 1000,
		Name: "Kinky Neighbor",
		Type: "Member",
		MoneyPerTurn: 1,
		OnTurnEnd: function(CCPlayer) {
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
		OnTurnEnd: function(CCPlayer) {
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
			ClubCardPlayerAddMoney(CCPlayer, 4);
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
		OnTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Red Twin")) ClubCardPlayerAddFame(CCPlayer, 4);
		}
	},
	{
		ID: 1012,
		Name: "Rope Bunny",
		MoneyPerTurn: 1,
		RequiredLevel: 2,
		OnTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Dominant")) ClubCardPlayerAddMoney(CCPlayer, 2);
		}
	},
	{
		ID: 1013,
		Name: "Shy Submissive",
		MoneyPerTurn: 2,
		OnTurnEnd: function(CCPlayer) {
			if ((CCPlayer.Board != null) && (CCPlayer.Board.length >= 7)) ClubCardRemoveFromBoard(CCPlayer, this);
		}
	},
	{
		ID: 1014,
		Name: "Rope Sensei",
		RequiredLevel: 2,
		FamePerTurn: 1,
		MoneyPerTurn: 1
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
		OnTurnEnd: function(CCPlayer) {
			if ((CCPlayer.Level != null) && (CCPlayer.Level >= 5)) ClubCardPlayerAddFame(CCPlayer, 2);
		}
	},

	// 2000 - Staff Members (Club employees that can be targetted by events)
	{
		ID: 2000,
		Name: "Waitress",
		Group: ["Staff"],
		MoneyPerTurn: 1,
		OnTurnEnd: function(CCPlayer) {
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
		OnTurnEnd: function(CCPlayer) {
			if (CCPlayer.Level >= 3) ClubCardPlayerAddMoney(CCPlayer, 1);
			if (CCPlayer.Level >= 5) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 2003,
		Name: "Secretary",
		Group: ["Staff"],
		ExtraTime: 1,
		RequiredLevel: 2
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
		OnTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardRemoveFromBoard(CCPlayer, this);
			else {
				if (ClubCardNameIsOnBoard(CCPlayer, "Junkie")) ClubCardPlayerAddMoney(CCPlayer, 3);
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
		OnTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardRemoveFromBoard(CCPlayer, this);
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
		OnTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardRemoveFromBoard(CCPlayer, this);
			else ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Criminal") * 2);
		}
	},
	{
		ID: 3005,
		Name: "Paroled Thief",
		Group: ["Liability", "Criminal"],
		RequiredLevel: 2,
		MoneyPerTurn: -1,
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(ClubCardGetOpponent(CCPlayer), 1);
			if (ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardRemoveFromBoard(CCPlayer, this);
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
		MoneyPerTurn: 8,
		FamePerTurn: -3,
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveGroupFromBoard(CCPlayer, "Police");
			ClubCardRemoveGroupFromBoard(CCPlayer, "Liability");
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

	// 4000 - Fetishists (Synergies with other groups)
	{
		ID: 4000,
		Name: "Maid Lover",
		Group: ["Fetishist"],
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Maid"));
		}
	},
	{
		ID: 4001,
		Name: "Diaper Lover",
		Group: ["Fetishist"],
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby"));
		}
	},
	{
		ID: 4002,
		Name: "Masochist",
		Group: ["Fetishist"],
		OnTurnEnd: function(CCPlayer) {
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
		OnTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "PornActress") || ClubCardGroupIsOnBoard(CCPlayer, "ABDLMommy"))
				ClubCardPlayerAddMoney(CCPlayer, 2);
		}
	},
	{
		ID: 4004,
		Name: "Fin-Dom Simp",
		Group: ["Fetishist"],
		OnTurnEnd: function(CCPlayer) {
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
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Mistress") * 2);
		}
	},
	{
		ID: 4006,
		Name: "Porn Addict",
		Group: ["Fetishist"],
		MoneyPerTurn: 1,
		FamePerTurn: -1,
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "PornActress"));
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
		OnTurnEnd: function(CCPlayer) {
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
		OnTurnEnd: function(CCPlayer) {
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
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Maid") - 1);
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
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 6);
		}
	},
	{
		ID: 7002,
		Name: "Novice Nurse",
		Group: ["AsylumNurse"],
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient"));
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
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") * 2);
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
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") * 3);
		}
	},
	{
		ID: 7007,
		Name: "Picky Nurse",
		Group: ["AsylumNurse"],
		Reward: "NPC_AsylumMeeting_PatientRight",
		FamePerTurn: 3,
		RequiredLevel: 2,
		OnTurnEnd: function(CCPlayer) {
			if (ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") < 2) ClubCardRemoveFromBoard(CCPlayer, this);
		},
		CanPlay: function(CCPlayer) {
			return (ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") >= 2);
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
		FamePerTurn: 5
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
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent") * -1);
		}
	},
	{
		ID: 9005,
		Name: "Union Leader",
		Group: ["Liability"],
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Maid") * -1);
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Staff") * -1);
		}
	},
	{
		ID: 9006,
		Name: "No-Fap Advocate",
		Group: ["Liability"],
		OnTurnEnd: function(CCPlayer) {
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
		OnTurnEnd: function(CCPlayer) {
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
		OnTurnEnd: function(CCPlayer) {
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
		OnTurnEnd: function(CCPlayer) {
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
		MoneyPerTurn: -1,
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby") * 2);
		}
	},
	{
		ID: 10005,
		Name: "Soap Opera Mother",
		Group: ["ABDLMommy"],
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "ABDLBaby")) ClubCardPlayerAddFame(CCPlayer, 25);
		},
		CanPlay: function(CCPlayer) {
			return ClubCardGroupIsOnBoard(CCPlayer, "ABDLBaby");
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
		OnTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Amanda") || ClubCardNameIsOnBoard(CCPlayer, "Mistress Sophie")) ClubCardPlayerAddFame(CCPlayer, 2);
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
		OnTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Yuki")) ClubCardPlayerAddFame(CCPlayer, 1);
			if (ClubCardNameIsOnBoard(CCPlayer, "Julia")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 11005,
		Name: "College Nerd",
		Group: ["CollegeStudent"],
		FamePerTurn: 1,
		OnTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Yuki")) ClubCardPlayerAddMoney(CCPlayer, 1);
			if (ClubCardNameIsOnBoard(CCPlayer, "Julia")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 11006,
		Name: "College Hidden Genius",
		Group: ["CollegeStudent"],
		OnTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Mildred")) ClubCardPlayerAddFame(CCPlayer, 5);
		}
	},
	{
		ID: 11007,
		Name: "Substitute Teacher",
		Group: ["CollegeTeacher"],
		MoneyPerTurn: -2,
		OnTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent"));
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
		OnTurnEnd: function(CCPlayer) {
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
		RequiredLevel: 4
	},

	// Event cards
	{
		ID: 30000,
		Name: "Scratch and Win",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 7);
			ClubCardLogPublish("GainMoney", CCPlayer, 7);
		}
	},
	{
		ID: 30001,
		Name: "Kinky Garage Sale",
		Type: "Event",
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 12);
			ClubCardLogPublish("GainMoney", CCPlayer, 12);
		}
	},
	{
		ID: 30002,
		Name: "Second Mortgage",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 20);
			ClubCardLogPublish("GainMoney", CCPlayer, 30);
		}
	},
	{
		ID: 30003,
		Name: "Foreign Investment",
		Type: "Event",
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 30);
			ClubCardLogPublish("GainMoney", CCPlayer, 30);
		}
	},
	{
		ID: 30004,
		Name: "Cat Burglar",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			if (ClubCardGroupIsOnBoard(Opponent, "Police")) return;
			let Money = Opponent.Money;
			if (Money > 4) Money = 4;
			if (Money > 0) {
				ClubCardPlayerAddMoney(CCPlayer, Money);
				ClubCardPlayerAddMoney(Opponent, Money * -1);
				ClubCardLogPublish("StealMoney", CCPlayer, Money);
			}
		},
		CanPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			if (ClubCardGroupIsOnBoard(Opponent, "Police")) return false;
			if (Opponent.Money <= 0) return false;
			return true;
		}
	},
	{
		ID: 30005,
		Name: "Money Heist",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			if (ClubCardGroupIsOnBoard(Opponent, "Police")) return;
			let Money = Opponent.Money;
			if (Money > 12) Money = 12;
			if (Money > 0) {
				ClubCardPlayerAddMoney(CCPlayer, Money);
				ClubCardPlayerAddMoney(Opponent, Money * -1);
				ClubCardLogPublish("StealMoney", CCPlayer, Money);
			}
		},
		CanPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			if (ClubCardGroupIsOnBoard(Opponent, "Police")) return false;
			if (Opponent.Money <= 0) return false;
			return true;
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
			ClubCardLogPublish("GainFame", CCPlayer, Fame);
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
			ClubCardLogPublish("GainFame", CCPlayer, Fame);
		},
	},
	{
		ID: 30008,
		Name: "Straitjacket Saturday",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			let Money = (ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") + ClubCardGroupOnBoardCount(CCPlayer, "AsylumNurse")) * 4;
			ClubCardPlayerAddMoney(CCPlayer, Money);
			ClubCardLogPublish("GainMoney", CCPlayer, Money);
		},
		CanPlay: function(CCPlayer) {
			let Money = (ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") + ClubCardGroupOnBoardCount(CCPlayer, "AsylumNurse")) * 4;
			return (Money > 0);
		}
	},
	{
		ID: 30009,
		Name: "Charity Auction",
		Type: "Event",
		Prerequisite: "SelectOwnMember",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			let Fame = CCPlayer.Level;
			if (ClubCardNameIsOnBoard(CCPlayer, "Auctioneer")) Fame = Fame * 2;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection);
			ClubCardPlayerAddFame(CCPlayer, Fame);
			ClubCardLogPublish("GainFame", CCPlayer, Fame);
		}
	},
	{
		ID: 30010,
		Name: "Slave Auction",
		Type: "Event",
		Prerequisite: "SelectOwnMember",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			let Money = CCPlayer.Level;
			if (ClubCardNameIsOnBoard(CCPlayer, "Auctioneer")) Money = Money * 2;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection);
			ClubCardPlayerAddMoney(CCPlayer, Money);
			ClubCardLogPublish("GainMoney", CCPlayer, Money);
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
				ClubCardLogPublish("GainFame", CCPlayer, Fame);
			}
		}
	},
	{
		ID: 30012,
		Name: "Ransomware",
		Type: "Event",
		Reward: "NPC_Infiltration_Supervisor",
		OnPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			if (!ClubCardNameIsOnBoard(Opponent, "Amanda") && !ClubCardNameIsOnBoard(Opponent, "Jennifer")) {
				ClubCardPlayerAddMoney(Opponent, Opponent.Level * -5);
				ClubCardLogPublish("LoseMoney", Opponent, Opponent.Level);
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
		Reward: "NPC_Shibari_Student",
		OnPlay: function(CCPlayer) {
			if ((CCPlayer.Board == null) || (CCPlayer.Board.length <= 0)) return;
			let Fame = CCPlayer.Board.length - ClubCardGroupOnBoardCount(CCPlayer, "Dominant");
			if (ClubCardNameIsOnBoard(CCPlayer, "Rope Sensei")) Fame = Fame * 2;
			ClubCardPlayerAddFame(CCPlayer, Fame);
			ClubCardLogPublish("GainFame", CCPlayer, Fame);
		},
		CanPlay: function(CCPlayer) {
			return ((CCPlayer.Board != null) && (CCPlayer.Board.length > 0));
		}
	},
	{
		ID: 30014,
		Name: "Moving Out of Town",
		Type: "Event",
		Prerequisite: "SelectOpponentMember",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromBoard(ClubCardGetOpponent(CCPlayer), ClubCardSelection);
		},
		CanPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			return ((Opponent.Board != null) && (Opponent.Board.length > 0));
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
		},
		CanPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			return ((Opponent.Hand != null) && (Opponent.Hand.length > 0));
		}
	},
	{
		ID: 30019,
		Name: "Sabotage",
		Type: "Event",
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDiscardCard(ClubCardGetOpponent(CCPlayer), 3);
		},
		CanPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			return ((Opponent.Hand != null) && (Opponent.Hand.length > 0));
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
			ClubCardLogPublish("GainMoney", CCPlayer, Money);
		},
		CanPlay: function(CCPlayer) {
			let Money = ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby") + ClubCardGroupOnBoardCount(CCPlayer, "ABDLMommy") + ClubCardGroupOnBoardCount(CCPlayer, "Maid");
			return (Money > 0);
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
			let Opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardRemoveFromBoard(Opponent, ClubCardSelection);
			let Money = Opponent.Level * 2;
			ClubCardPlayerAddMoney(CCPlayer, Money * -1);
			ClubCardLogPublish("LoseMoney", CCPlayer, Money);
		},
		CanPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			return ((Opponent.Board != null) && (Opponent.Board.length > 0));
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
			ClubCardPlayerDiscardCard(ClubCardGetOpponent(CCPlayer), 100);
			ClubCardPlayerDrawCard(CCPlayer, 5);
			ClubCardPlayerDrawCard(ClubCardGetOpponent(CCPlayer), 5);
			ClubCardLogPublish("Effect Pandora Box", CCPlayer);
		}
	},
	{
		ID: 31000,
		Name: "Bad Press",
		Type: "Event",
		Time: 3,
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromEventByName(ClubCardGetOpponent(CCPlayer), "Clever Marketing");
		},
		OnOpponentTurnEnd: function(CCPlayer) {
			let Fame = CCPlayer.LastFamePerTurn;
			if (Fame > 0) {
				ClubCardPlayerAddFame(CCPlayer, Fame * -1);
				CCPlayer.LastFamePerTurn = 0;
				ClubCardLogPublish("Effect Bad Press", CCPlayer);
			}
		}
	},
	{
		ID: 31001,
		Name: "Clever Marketing",
		Type: "Event",
		Time: 3,
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromEventByName(ClubCardGetOpponent(CCPlayer), "Bad Press");
		},
		OnTurnEnd: function(CCPlayer) {
			let Fame = CCPlayer.LastFamePerTurn;
			if (Fame > 0) {
				ClubCardPlayerAddFame(CCPlayer, Fame);
				CCPlayer.LastFamePerTurn = Fame * 2;
				ClubCardLogPublish("Effect Clever Marketing", CCPlayer);
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
		OnOpponentTurnEnd: function(CCPlayer) {
			let Money = CCPlayer.LastMoneyPerTurn;
			if (Money > 0) {
				ClubCardPlayerAddMoney(CCPlayer, Money * -1);
				CCPlayer.LastMoneyPerTurn = 0;
				ClubCardLogPublish("Effect Repay Loan", CCPlayer);
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
		OnTurnEnd: function(CCPlayer) {
			let Money = CCPlayer.LastMoneyPerTurn;
			if (Money > 0) {
				ClubCardPlayerAddMoney(CCPlayer, Money);
				CCPlayer.LastMoneyPerTurn = Money * 2;
				ClubCardLogPublish("Effect Bank Loan", CCPlayer);
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
		OnTurnEnd: function(CCPlayer) {
			let Fame = ClubCardGroupOnBoardCount(CCPlayer, "PornActress");
			if (Fame > 0) {
				Fame = Fame * 3;
				ClubCardPlayerAddFame(CCPlayer, Fame);
				ClubCardLogPublish("Effect Porn Convention", CCPlayer, Fame);
			}
		},
		OnOpponentTurnEnd: function(CCPlayer) {
			let Fame = ClubCardGroupOnBoardCount(CCPlayer, "PornActress");
			if (Fame > 0) {
				Fame = Fame * 3;
				ClubCardPlayerAddFame(CCPlayer, Fame);
				ClubCardLogPublish("Effect Porn Convention", CCPlayer, Fame);
			}
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
 * Adds a text entry to the game log
 * @param {string} LogEntry - The club card player
 * @param {boolean} Push - The club card player
 * @returns {void} - Nothing
 */
function ClubCardLogAdd(LogEntry, Push = true) {
	if (LogEntry != null) ClubCardLog.push(LogEntry);
	ClubCardLogScroll = true;
	ClubCardLogText = "";
	for (let L of ClubCardLog)
		ClubCardLogText = ClubCardLogText + ((ClubCardLogText == "") ? "" : "\r\n--------------------\r\n") + L;
	if ((LogEntry != null) && Push && ClubCardIsOnline()) {
		ServerSend("ChatRoomGame", { GameProgress: "Action", CCLog: LogEntry });
		// ServerSend("ChatRoomChat", { Content: LogEntry, Type: "Emote" });  Publish to chat room or not???
	}
}

/**
 * Publishes an action to the log and replaces all the tags
 * @param {string} Text - The text to fetch
 * @param {ClubCardPlayer|null} CCPlayer - The source player
 * @param {number|null} Amount - The amount linked to the action
 * @param {ClubCard|null} Card - The card linked to the action
 * @returns {void} - Nothing
 */
function ClubCardLogPublish(Text, CCPlayer = null, Amount = null, Card = null) {
	let Msg = TextGet(Text);
	if ((Msg == null) || (Msg == "")) return;
	let Opponent = ClubCardGetOpponent(CCPlayer);
	if (CCPlayer != null) Msg = Msg.replace("SOURCEPLAYER", CharacterNickname(CCPlayer.Character));
	if (Opponent != null) Msg = Msg.replace("OPPONENTPLAYER", CharacterNickname(Opponent.Character));
	if (Amount != null) Msg = Msg.replace("AMOUNT", Amount.toString());
	if (Card != null) Msg = Msg.replace("CARDTITLE", Card.Title);
	ClubCardLogAdd(Msg);
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
 * Raises the level of player
 * @param {Object} CCPlayer - The club card player
 * @returns {void} - Nothing
 */
function ClubCardUpgradeLevel(CCPlayer) {
	if ((CCPlayer.Level >= ClubCardLevelCost.length - 1) || (CCPlayer.Money < ClubCardLevelCost[CCPlayer.Level + 1])) return;
	CCPlayer.Level++;
	ClubCardPlayerAddMoney(CCPlayer, ClubCardLevelCost[CCPlayer.Level] * -1);
	let Text = TextGet("UpgradedToLevel" + CCPlayer.Level.toString());
	Text = Text.replace("PLAYERNAME", CharacterNickname(CCPlayer.Character));
	Text = Text.replace("MONEYAMOUNT", ClubCardLevelCost[CCPlayer.Level].toString());
	ClubCardLogAdd(Text);
	GameClubCardSyncOnlineData();
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
 * Removes a card from a player board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card object to remove
 * @returns {void} - Nothing
 */
function ClubCardRemoveFromBoard(CCPlayer, Card) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (Card == null)) return;
	let Pos = 0;
	for (let C of CCPlayer.Board) {
		if (C.ID === Card.ID) {
			CCPlayer.Board.splice(Pos, 1);
			ClubCardLogPublish("MemberLeaveClub", CCPlayer, null, Card);
		}
		Pos++;
	}
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
			ClubCardLogPublish("EventRemoved", CCPlayer, null, C);
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
					CCPlayer.Board.splice(Pos, 1);
					Pos--;
					break;
				}
	}
}

/**
 * Shuffles an array of cards
 * @param {Array} array - The array of cards to shuffle
 * @returns {Array} - The shuffled cards
 */
function ClubCardShuffle(array) {
	let currentIndex = array.length,  randomIndex;
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
	if ((CCPlayer == null) || (CCPlayer.Deck == null) || (CCPlayer.Hand == null)) return;
	if (Amount == null) Amount = ClubCardDrawCardCount(CCPlayer);
	let FocusCard = ((CCPlayer.Index == 0) && (Amount == 1));
	while (Amount > 0) {
		if (CCPlayer.Deck.length > 0) {
			if (FocusCard) {
				ClubCardFocus = CCPlayer.Deck[0];
				ClubCardSetGlow(ClubCardFocus, "#00FFFF");
			}
			CCPlayer.Hand.push(CCPlayer.Deck[0]);
			CCPlayer.Deck.splice(0, 1);
		}
		Amount--;
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
		CCPlayer.Hand.splice(Pos, 1);
		Amount--;
	}
}

/**
 * Builds a deck array of object from a deck array of numbers
 * @param {Array} InDeck - The array of number deck
 * @returns {Array} - The resulting deck
 */
function ClubCardLoadDeck(InDeck) {
	let OutDeck = [];
	for (let D of InDeck)
		for (let C of ClubCardList)
			if (C.ID == D) {
				let Card = {...C};
				if (Card.Type == null) Card.Type = "Member";
				OutDeck.push(Card);
				break;
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
	if ((Player.Game.ClubCard.Deck.length <= DeckNum) || (Player.Game.ClubCard.Deck[DeckNum].length != ClubCardBuilderDeckSize)) {
		ClubCardLogAdd(TextGet("NoValidDeckFound").replace("PLAYERNAME", CharacterNickname(Player)));
		Deck = ClubCardBuilderDefaultDeck.slice();
	} else {
		ClubCardLogAdd(TextGet("UsingDeck").replace("PLAYERNAME", CharacterNickname(Player)));
		for (let i = 0; i < ClubCardBuilderDeckSize; i++)
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
		ClubCardLogAdd(ClubCardTextGet("Start" + ((ClubCardTurnIndex == 0) ? "Player" : "Opponent")));
		ClubCardPlayerDrawCard(ClubCardPlayer[0], (ClubCardTurnIndex == 0) ? 5 : 6);
		ClubCardPlayerDrawCard(ClubCardPlayer[1], (ClubCardTurnIndex == 1) ? 5 : 6);
	} else ClubCardPlayerDrawCard(ClubCardPlayer[Index], (ClubCardTurnIndex == Index) ? 5 : 6);

	// Syncs online data
	GameClubCardSyncOnlineData();

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
		ClubCardPlayer[1].Hand.push({...ClubCardReward});
		ClubCardCreatePopup("TEXT", TextGet("CanWinNewCard") + " " + ClubCardReward.Title, TextGet("Play"), null, "ClubCardAIStart()", null);
	} else ClubCardAIStart();

}

/**
 * Draw the club card player hand on screen, show only sleeves if not controlled by player
 * @param {Character} Char - The character to link to that club card player
 * @param {String} Cont - The control linked to that player
 * @param {Array} Cards - The cards to build the deck with
 * @returns {void} - Nothing
 */
function ClubCardAddPlayer(Char, Cont, Cards) {
	let P = {
		Character: {...Char},
		Control: Cont,
		Deck: ClubCardShuffle(ClubCardLoadDeck(Cards)),
		FullDeck: ClubCardLoadDeck(Cards),
		Index: ClubCardPlayer.length,
		Sleeve: "Default",
		Hand: [],
		Board: [],
		Event: [],
		Level: 1,
		Money: 5,
		Fame: 0
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
	if (CCPlayer.Board != null)
		for (let Card of CCPlayer.Board) {
			if (Card.FamePerTurn != null) ClubCardPlayerAddFame(CCPlayer, Card.FamePerTurn);
			if (Card.MoneyPerTurn != null) ClubCardPlayerAddMoney(CCPlayer, Card.MoneyPerTurn);
			if (Card.OnTurnEnd != null) Card.OnTurnEnd(CCPlayer);
		}
	if ((CCPlayer.Money < 0) && (CCPlayer.Fame > StartingFame)) CCPlayer.Fame = StartingFame;
	CCPlayer.LastFamePerTurn = CCPlayer.Fame - StartingFame;
	CCPlayer.LastMoneyPerTurn = CCPlayer.Money - StartingMoney;

	// Runs the event of time cards on the player board and opponent board
	if (CCPlayer.Event != null)
		for (let Card of CCPlayer.Event)
			if (Card.OnTurnEnd != null)
				Card.OnTurnEnd(CCPlayer);
	if (Opponent.Event != null)
		for (let Card of Opponent.Event)
			if (Card.OnOpponentTurnEnd != null)
				Card.OnOpponentTurnEnd(CCPlayer);

	// Display the gained money and fame
	FameMoneyText = ((CCPlayer.LastFamePerTurn >= 0) ? "+" : "") + CCPlayer.LastFamePerTurn.toString() + " Fame, " + ((CCPlayer.LastMoneyPerTurn >= 0) ? "+" : "") + CCPlayer.LastMoneyPerTurn.toString() + " Money";

	// If that player wins the game from Fame gain
	if (ClubCardCheckVictory(CCPlayer)) {
		let Msg = TextGet("VictoryFor" + CCPlayer.Control);
		if (ClubCardIsOnline()) Msg = TextGet("VictoryOnline").replace("PLAYERNAME", CharacterNickname(CCPlayer.Character));
		ClubCardLogAdd(Msg);
		GameClubCardSyncOnlineData();
		return;
	}

	// Adds an entry to the log
	ClubCardTurnEndDraw = Draw;
	if (Draw) {
		ClubCardLogAdd(TextGet("EndDrawPlayer").replace("FAMEMONEY", FameMoneyText).replace("SOURCEPLAYER", CharacterNickname(CCPlayer.Character)).replace("OPPONENTPLAYER", CharacterNickname(Opponent.Character)));
		ClubCardPlayerDrawCard(ClubCardPlayer[ClubCardTurnIndex]);
	} else {
		ClubCardLogAdd(TextGet("EndTurnPlayer").replace("FAMEMONEY", FameMoneyText).replace("SOURCEPLAYER", CharacterNickname(CCPlayer.Character)).replace("OPPONENTPLAYER", CharacterNickname(Opponent.Character)));
	}

	// Move to the next player
	ClubCardTurnIndex++;
	if (ClubCardTurnIndex >= ClubCardPlayer.length) ClubCardTurnIndex = 0;
	ClubCardTurnCardPlayed = 0;
	ClubCardAIStart();

	// When a turn starts, the event time goes down and might expire
	CCPlayer = ClubCardPlayer[ClubCardTurnIndex];
	if (CCPlayer.Event != null)
		for (let Pos = 0; Pos < CCPlayer.Event.length; Pos++) {
			let Card = CCPlayer.Event[Pos];
			if ((Card.Time != null) && (Card.Time > 0)) Card.Time--;
			if ((Card.Time == null) || (Card.Time <= 0)) {
				ClubCardLogPublish("EventExpired", CCPlayer, null, Card);
				CCPlayer.Event.splice(Pos, 1);
				Pos--;
			}
		}

	// Syncs online data
	GameClubCardSyncOnlineData();

}

function ClubCardCheckVictory(CCPlayer) {
	if (CCPlayer.Fame >= ClubCardFameGoal) {
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
	for (let Card of CCPlayer.Board)
		if (Card.ExtraPlay != null)
			Count = Count + Card.ExtraPlay;
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
	if ((Target.Board != null) && (Card.Type == "Member") && (Target.Level != null) && (Target.Board.length >= ClubCardLevelLimit[Target.Level])) return false;
	if ((Card.RequiredLevel != null) && (Target.Level != null) && (Card.RequiredLevel > Target.Level)) return false;
	if ((Card.Prerequisite === "SelectOwnMember") && (CCPlayer.Board.length <= 0)) return false;
	if ((Card.Prerequisite === "SelectOwnMember") && (CCPlayer.Control == "AI") && !ClubCardGroupIsOnBoard(CCPlayer, "Liability")) return false;
	if ((Card.Prerequisite === "SelectOpponentMember") && (ClubCardGetOpponent(CCPlayer).Board.length <= 0)) return false;
	if ((Card.Prerequisite === "SelectOpponentMember") && (CCPlayer.Control == "AI") && (ClubCardGroupOnBoardCount(ClubCardGetOpponent(CCPlayer), "Liability") == ClubCardGetOpponent(CCPlayer).Board.length)) return false;
	if ((Card.Prerequisite === "SelectAnyMember") && (CCPlayer.Board.length + ClubCardGetOpponent(CCPlayer).Board.length <= 0)) return false;
	if ((Card.Prerequisite === "SelectAnyMember") && (CCPlayer.Control == "AI")) return false;
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
	if ((ClubCardPending.Prerequisite === "SelectOwnMember") && (CCPlayer.Index == 0) && (Card.Location == "PlayerBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectOwnMember") && (CCPlayer.Index == 1) && (Card.Location == "OpponentBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectOpponentMember") && (CCPlayer.Index == 0) && (Card.Location == "OpponentBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectOpponentMember") && (CCPlayer.Index == 1) && (Card.Location == "PlayerBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectAnyMember") && ((Card.Location == "PlayerBoard") || (Card.Location == "OpponentBoard")) && (Card.Type === "Member")) return true;
	return false;
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
		ClubCardPending = Card;
		ClubCardLogAdd(TextGet("Prerequisite " + Card.Name));
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

	// Sets the log text, different for a liability card
	let Target = ClubCardFindTarget(Card);
	let Text = TextGet(ClubCardIsLiability(Card) ? "PlayACardOpponentBoard" : "PlayACard");
	Text = Text.replace("PLAYERNAME", CharacterNickname(CCPlayer.Character));
	Text = Text.replace("CARDNAME", Card.Title);
	ClubCardLogAdd(Text);
	ClubCardTurnCardPlayed++;

	// Plays the card
	if (CCPlayer.Hand != null) {
		let Index = 0;
		for (let C of CCPlayer.Hand) {
			if (C.ID == Card.ID) {
				if (Card.Type === "Member") Target.Board.push(Card);
				if ((Card.Type === "Event") && (Card.Time != null) && (Card.Time >= 0)) {
					Target.Event.push(Card);
					Card.Time = Card.Time + ClubCardExtraTime(CCPlayer);
				}
				CCPlayer.Hand.splice(Index, 1);
				Card.Location = (CCPlayer.Index == 0) ? "PlayerBoard" : "OpponentBoard";
				ClubCardSetGlow(Card, (ClubCardTurnIndex == 0) ? "#FFFF00" : "#FF0000");
			}
			Index++;
		}
	}

	// Focuses on the card, runs it's scripts and end the turn if needed
	ClubCardFocus = Card;
	if (Card.OnPlay != null) Card.OnPlay(CCPlayer);
	ClubCardSelection = null;
	ClubCardPending = null;
	if (ClubCardTurnCardPlayed >= ClubCardTurnPlayableCardCount(CCPlayer)) return ClubCardEndTurn();

	// If that player can play more than one card per turn, we announce it
	Text = TextGet("PlayAnotherCard");
	Text = Text.replace("PLAYERNAME", CharacterNickname(CCPlayer.Character));
	ClubCardLogAdd(Text);
	ClubCardAIStart();

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
	if ((Math.random() >= 0.5) && (CCPlayer.Level < ClubCardLevelCost.length - 1) && (CCPlayer.Money >= ClubCardLevelCost[CCPlayer.Level + 1])) {
		ClubCardUpgradeLevel(CCPlayer);
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
	if (ValidCards.length > 0)
		return ClubCardPlayCard(CCPlayer, CommonRandomItemFromList(null, ValidCards));

	// If nothing can be played and money or fame is going negative, the computer can go bankrupt
	if ((CCPlayer.LastMoneyPerTurn != null) && (CCPlayer.LastFamePerTurn != null) && (CCPlayer.LastMoneyPerTurn + CCPlayer.LastFamePerTurn <= 0) && (100 - CCPlayer.Money - CCPlayer.Fame > Math.random() * 100))
		return ClubCardBankrupt();

	// Since nothing could be done, we end the turn by skipping
	ClubCardEndTurn((ClubCardTurnCardPlayed == 0));

}

/**
 * When the opponent (AI) starts it's turn, gives 3 seconds before it's move
 * @returns {void} - Nothing
 */
function ClubCardAIStart() {
	ClubCardDestroyPopup();
	if (!MiniGameEnded && ClubCardPlayer[ClubCardTurnIndex].Control == "AI") setTimeout(ClubCardAIPlay, 3000);
}

/**
 * When a player concedes the game
 * @returns {void} - Nothing
 */
function ClubCardConcede() {
	if (ClubCardIsOnline()) ClubCardLogAdd(TextGet(ClubCardIsPlaying() ? "OnlineConcede" : "OnlineStopWatch").replace("SOURCEPLAYER", CharacterNickname(Player)));
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
	CCPlayer.Level = 1;
	CCPlayer.Money = 5;
	CCPlayer.Fame = 0;
	CCPlayer.Board = [];
	CCPlayer.Event = [];
	CCPlayer.Hand = [];
	CCPlayer.Deck = ClubCardShuffle(CCPlayer.FullDeck.slice());
	ClubCardPlayerDrawCard(CCPlayer, 5);

	// The opponent loses all liability cards on her board
	let Opponent = ClubCardGetOpponent(CCPlayer);
	ClubCardRemoveGroupFromBoard(Opponent, "Liability");

	// Announces the bankrupty and jumps to the next turn
	ClubCardLogPublish("WentBankrupt", CCPlayer);
	ClubCardDestroyPopup();
	ClubCardFocus = null;
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
	if(!ClubCardTextCache){
		const CardTextPath = "Screens/MiniGame/ClubCard/Text_ClubCard.csv";
		ClubCardTextCache = TextAllScreenCache.get(CardTextPath);
		if(!ClubCardTextCache){
			ClubCardTextCache = new TextCache(CardTextPath,"");
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
	ClubCardLogText = "";
	ClubCardFocus = null;
	ClubCardLogScroll = false;
	ClubCardLog = [];
	ClubCardTurnIndex = Math.floor(Math.random() * 2);
	ClubCardPlayer = [];
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
 * @param {Array} Group - The card to draw
 * @returns {string} - The
 */
function ClubCardGetGroupText(Group) {
	if ((Group == null) || (Group.length == 0)) return "";
	let Text = "";
	for (let G of Group)
		Text = Text + ((Text == "") ? "" : ", ") + ClubCardTextGet("Group" + G);
	return Text;
}

/**
 * Draw the club card player hand on screen, show only sleeves if not controlled by player
 * @param {ClubCard|Number} Card - The card to draw
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the card
 * @param {string|null} Sleeve - The sleeve image to draw instead of the card
 * @param {string|null} Source - The source from where it's called
 * @returns {void} - Nothing
 */
function ClubCardRenderCard(Card, X, Y, W, Sleeve = null, Source = null) {

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

	// Draw the sleeved version if required
	if (Sleeve != null) {
		DrawImageResize("Screens/MiniGame/ClubCard/Sleeve/" + Sleeve + ".png", X, Y, W, W * 2);
		return;
	}

	// Keeps the hover card
	if (MouseIn(X, Y, W, W * 2)) {
		ClubCardHover = {...Card};
		ClubCardHover.Location = Source;
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
	DrawTextWrap(Card.Title, X + W * 0.05, Y + W * 0.05, W * 0.9, W * 0.1, "Black");
	let BubblePos = Y + W * 0.2;
	if (ClubCardIsLiability(Card)) BubblePos = ClubCardRenderBubble(null, X + W * 0.05, BubblePos, W * 0.1, "Liability");
	if (Level > 1) BubblePos = ClubCardRenderBubble(Level, X + W * 0.05, BubblePos, W * 0.1, "Level");
	if (Card.FamePerTurn != null) BubblePos = ClubCardRenderBubble(Card.FamePerTurn, X + W * 0.05, BubblePos, W * 0.1, "Fame");
	if (Card.MoneyPerTurn != null) ClubCardRenderBubble(Card.MoneyPerTurn, X + W * 0.05, BubblePos, W * 0.1, "Money");
	if (Card.Text != null) {
		DrawRect(X + W * 0.05, Y + W * 1.5, W * 0.9, W * 0.48, Color + "A0");
		let GroupText = ClubCardGetGroupText(Card.Group);
		if (GroupText != "") {
			if (Card.RewardMemberNumber != null) GroupText = GroupText + " #" + Card.RewardMemberNumber.toString();
			MainCanvas.font = "bold " + Math.round(W / 16) + "px arial";
			DrawTextWrap(GroupText, X + W * 0.05, Y + W * 1.5, W * 0.925, W * 0.1, "Black");
			MainCanvas.font = ((Card.Text.startsWith("<F>")) ? "italic " : "bold ") + Math.round(W / 16) + "px arial";
			DrawTextWrap(Card.Text.replace("<F>", ""), X + W * 0.05, Y + W * 1.6, W * 0.925, W * 0.38, "Black", null, null, Math.round(W / 20));
		}
		else {
			MainCanvas.font = ((Card.Text.startsWith("<F>")) ? "italic " : "bold ") + Math.round(W / 16) + "px arial";
			DrawTextWrap(Card.Text.replace("<F>", ""), X + W * 0.05, Y + W * 1.5, W * 0.925, W * 0.48, "Black", null, null, Math.round(W / 20));
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
 * @param {Object} CCPlayer - The club card player that draws the cards
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
	if (CCPlayer.Character != null) DrawTextWrap(CharacterNickname(CCPlayer.Character), X + W * 0.01, TextY, W * 0.19, H * 0.1, "White");
	if (CCPlayer.Fame != null) DrawTextWrap(TextGet("Fame") + " " + CCPlayer.Fame + (((CCPlayer.LastFamePerTurn != null) && (CCPlayer.LastFamePerTurn != 0)) ? " (" + ((CCPlayer.LastFamePerTurn > 0) ? "+" : "") + CCPlayer.LastFamePerTurn.toString() + ")" : ""), X + W * 0.21, TextY, W * 0.19, H * 0.1, (CCPlayer.Fame >= 0) ? "White" : "Pink");
	if (CCPlayer.Money != null) DrawTextWrap(TextGet("Money") + " " + CCPlayer.Money + (((CCPlayer.LastMoneyPerTurn != null) && (CCPlayer.LastMoneyPerTurn != 0)) ? " (" + ((CCPlayer.LastMoneyPerTurn > 0) ? "+" : "") + CCPlayer.LastMoneyPerTurn.toString() + ")" : ""), X + W * 0.61, TextY, W * 0.19, H * 0.1, (CCPlayer.Money >= 0) ? "White" : "Pink");
	if (CCPlayer.Level != null) DrawTextWrap(TextGet("Level" + CCPlayer.Level) + " (" + CCPlayer.Board.length + " / " + ClubCardLevelLimit[CCPlayer.Level] + ")", X + W * 0.81, TextY, W * 0.19, H * 0.1, ClubCardColor[CCPlayer.Level]);

	// Draws the played cards
	if ((CCPlayer == null) || (CCPlayer.Board == null)) return;
	let FullBoard = [];
	FullBoard = [...CCPlayer.Board];
	if ((CCPlayer.Event != null) && (CCPlayer.Event.length > 0)) FullBoard = FullBoard.concat(CCPlayer.Event);
	let PosX = Math.round(X + (W / 2) - (FullBoard.length * W / 20));
	let IncX = Math.round(W / 10);
	if (PosX < X) {
		PosX = X;
		IncX = Math.round(W / FullBoard.length);
	}
	for (let C of FullBoard) {
		let PosY = Mirror ? Y + H - (H * 0.65) : Y + (H * 0.1);
		ClubCardRenderCard(C, PosX + 5, PosY, (W / 12) - 5, null, (CCPlayer.Control == "Player") ? "PlayerBoard" : "OpponentBoard");
		PosX = PosX + IncX;
	}

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
		ClubCardRenderCard(C, PosX + 5, Y + 5 + (H * 0.1), (W / 10) - 5, (CCPlayer.Control == "Player") ? null : CCPlayer.Sleeve, (CCPlayer.Control == "Player") ? "PlayerHand" : "OpponentHand");
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
	if (ClubCardFocus != null) ClubCardRenderCard(ClubCardFocus, 1705, 5, 290);
	if (document.getElementById("CCLog") == null) {
		ElementCreateTextArea("CCLog");
		let Elem = document.getElementById("CCLog");
		Elem.style.backgroundColor = "#000000";
		Elem.style.color = "#FFFFFF";
	}
	if (document.getElementById("CCChat") == null) {
		ElementCreateInput("CCChat", "text", "", "100");
		let Elem = document.getElementById("CCChat");
		Elem.style.backgroundColor = "#FFFFFF";
		Elem.style.color = "#000000";
		Elem.setAttribute("placeholder", TextGet("ChatHere"));
	}
	ElementPositionFix("CCLog", 20, 1705, (ClubCardFocus == null) ? 5 : 590, 285, (ClubCardFocus == null) ? 825 : 240);
	ElementPosition("CCChat", 1857, 865, 306);
	ElementValue("CCLog", ClubCardLogText);
	if (ClubCardLogScroll) {
		ElementScrollToEnd("CCLog");
		ClubCardLogScroll = false;
	}

	// In deck popup mode
	if ((ClubCardPopup != null) && (ClubCardPopup.Mode == "DECK")) {
		ClubCardStatusText("SelectDeck");
		return;
	}

	// If there's a pending card with a prerequisite
	if (ClubCardPending != null) {
		DrawButton(1805, 905, 90, 90, null, "White", "Screens/MiniGame/ClubCard/Button/CancelPending.png", TextGet("CancelPending"));
		if (ClubCardCanSelectCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus)) DrawButton(1725, 300, 250, 60, TextGet("SelectCard"), "White");
		return;
	}

	// Can concede/exit out of popup mode
	if (ClubCardPopup == null) DrawButton(1905, 905, 90, 90, null, "White", "Screens/MiniGame/ClubCard/Button/Concede.png", TextGet(ClubCardIsPlaying() ? "Concede" : "StopWatch"));

	// If we are waiting for deck selection
	if ((ClubCardPlayer[0].FullDeck == null) || (ClubCardPlayer[0].FullDeck.length == 0) || (ClubCardPlayer[1].FullDeck == null) || (ClubCardPlayer[1].FullDeck.length == 0)) {
		ClubCardStatusText("WaitingSelectDeck");
		return;
	}

	// Draw the bottom butttons and texts
	if ((ClubCardPopup == null) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player")) {
		DrawButton(1805, 905, 90, 90, null, "White", "Screens/MiniGame/ClubCard/Button/Bankrupt.png", TextGet("Bankrupt"));
		DrawButton(1705, 905, 90, 90, null, "White", "Screens/MiniGame/ClubCard/Button/" + ((ClubCardTurnCardPlayed == 0) ? "Draw" : "CannotDraw") + ".png", TextGet((ClubCardTurnCardPlayed == 0) ? "Draw" : "CannotDraw"));
		if (ClubCardCanPlayCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus)) DrawButton(1725, 300, 250, 60, TextGet("PlayCard"), "White");
	} else ClubCardStatusText(ClubCardIsPlaying() ? "OpponentPlaying" : "WatchingGame");

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
 * @returns {void} - Nothing
 */
function ClubCardRun() {
	ClubCardHover = null;
	ClubCardLoadCaption();
	ClubCardRenderBoard(ClubCardPlayer[0], 0, 500, 1700, 500, false);
	ClubCardRenderBoard(ClubCardPlayer[1], 0, 0, 1700, 500, true);
	DrawRect(0, 499, 1700, 2, "White");
	ClubCardRenderHand(ClubCardPlayer[0], 0, 800, 1700, 300);
	ClubCardRenderHand(ClubCardPlayer[1], 0, -200, 1700, 300);
	ClubCardRenderPanel();
	if ((ClubCardPopup == null) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player") && (ClubCardPlayer[ClubCardTurnIndex].Level < ClubCardLevelCost.length - 1) && (ClubCardPlayer[ClubCardTurnIndex].Money >= ClubCardLevelCost[ClubCardPlayer[ClubCardTurnIndex].Level + 1])) DrawButton(1390, 435, 300, 60, TextGet("UpgradeToLevel" + (ClubCardPlayer[ClubCardTurnIndex].Level + 1).toString()).replace("MONEY", ClubCardLevelCost[ClubCardPlayer[ClubCardTurnIndex].Level + 1].toString()), "White");
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
		if (ClubCardPopup.Mode == "DECK")
			for (let Deck = 0; Deck < 10; Deck++)
				if (MouseIn(560 + Math.floor(Deck / 5) * 300, 310 + (Deck % 5) * 80, 280, 60))
					ClubCardLoadDeckNumber(Deck);
		return;
	}

	// If there's a pending card with a prerequisite, there are extra buttons
	if ((ClubCardPending != null) && MouseIn(1725, 300, 250, 60) && ClubCardCanSelectCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus)) return ClubCardSelectCard(ClubCardFocus);
	if ((ClubCardPending != null) && MouseIn(1805, 905, 90, 90)) return ClubCardPending = null;

	// Can always concede/exit
	if (MouseIn(1905, 905, 90, 90)) return ClubCardCreatePopup("YESNO", TextGet(ClubCardIsPlaying() ? "ConfirmConcede": "ConfirmExit"), TextGet("Yes"), TextGet("No"), "ClubCardConcede()", "ClubCardDestroyPopup()");

	// If we are waiting for deck selection
	if ((ClubCardPlayer[0].FullDeck == null) || (ClubCardPlayer[0].FullDeck.length == 0) || (ClubCardPlayer[1].FullDeck == null) || (ClubCardPlayer[1].FullDeck.length == 0)) return;

	// Runs the basic game buttons
	if (MouseIn(1725, 300, 250, 60) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player") && ClubCardCanPlayCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus)) return ClubCardPlayCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus);
	if (MouseIn(1700, 0, 300, 600) && (ClubCardFocus != null)) return ClubCardFocus = null;
	if (MouseIn(1705, 905, 90, 90) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player")) return ClubCardEndTurn((ClubCardTurnCardPlayed == 0));
	if (MouseIn(1805, 905, 90, 90) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player")) return ClubCardCreatePopup("YESNO", TextGet("ConfirmBankrupt"), TextGet("Yes"), TextGet("No"), "ClubCardBankrupt()", "ClubCardDestroyPopup()");
	if (MouseIn(1390, 435, 300, 60) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player") && (ClubCardPlayer[ClubCardTurnIndex].Level < ClubCardLevelCost.length - 1) && (ClubCardPlayer[ClubCardTurnIndex].Money >= ClubCardLevelCost[ClubCardPlayer[ClubCardTurnIndex].Level + 1])) return ClubCardUpgradeLevel(ClubCardPlayer[ClubCardTurnIndex]);

	// Sets the focus card if nothing else was clicked
	if (ClubCardHover != null) return ClubCardFocus = {...ClubCardHover};

}

// The enter key sends a chat
function ClubCardKeyDown(event) {
	if ((document.activeElement.id == "CCChat") && (KeyPress == 13)) {
		let Value = ElementValue("CCChat").trim();
		if (Value != "") {
			event.preventDefault();
			ClubCardLogAdd(CharacterNickname(Player) + ": " + Value);
			ElementValue("CCChat", "");
		}
	}
}
