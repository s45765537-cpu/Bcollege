const fs = require("fs"); 
const ClubCardList = [
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
		MoneyPerTurn: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if ((CCPlayer.Board != null) && (CCPlayer.Board.length >= 7)) ClubCardRemoveFromBoard(CCPlayer, this);
		}
	},
	{
		ID: 1014,
		Name: "Rope Sensei",
		RequiredLevel: 2,
		FamePerTurn: 1,
		MoneyPerTurn: 1,
		Group: ["Shibari"]
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
			const abdlBabyPlayed = ClubCardGetCardsPlayedOnTurn(opponent, opponent.ClubCardTurnCounter -1).some(card => {
				return card.Group?.includes("ABDLBaby");
			});

			const playerFameAtStartOfTurn = CCPlayer.Fame - CCPlayer.LastFamePerTurn;

			if (abdlBabyPlayed && playerFameAtStartOfTurn > opponent.Fame) {
				ClubCardPlayerAddFame(CCPlayer, CCPlayer.LastFamePerTurn * -1);
				CCPlayer.LastFamePerTurn = 0;
				ClubCardLogPublish("Effect Contract Caretaker", CCPlayer);
			}
		},
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
		BeforeTurnEnd: function(CCPlayer) {
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
		BeforeTurnEnd: function(CCPlayer) {
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
		BeforeTurnEnd: function(CCPlayer) {
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
		BeforeTurnEnd: function(CCPlayer) {
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
	{
		ID: 3009,
		Name: "Detective",
		Group: ["Police"],
		MoneyPerTurn: 1,
		RequiredLevel: 2,
	},

	// 4000 - Fetishists (Synergies with other groups)
	{
		ID: 4000,
		Name: "Maid Lover",
		Group: ["Fetishist"],
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Maid"));
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
		ID: 4007, //Fetishist Card Rope Slave +
		Name: "Rope Slave",
		Group: ["Fetishist", "Shibari"],
		BeforeTurnEnd: function(CCPlayer) {
			const alvinOrRopeSenseiPresent = ClubCardNameIsOnBoard(CCPlayer, "Rope Sensei") || ClubCardNameIsOnBoard(CCPlayer, "Alvin");
			if(alvinOrRopeSenseiPresent) {
				ClubCardPlayerAddFame(CCPlayer, 1);
			}
		}
	},
	{
		ID: 4008,
		Name: "Daycare Enthusiast",
		Group: ["Fetishist"],
		AfterTurnEnd: function(CCPlayer) {
			const abdlMommyCardsPlayed =  ClubCardGetCardsPlayedOnTurn(CCPlayer, CCPlayer.ClubCardTurnCounter).filter(card => ClubCardCardHasGroup(card, "ABDLMommy"));
			abdlMommyCardsPlayed.forEach(() => {
				ClubCardPlayerAddFame(CCPlayer, 3);
			});

			const abdlBabyCardsPlayed =  ClubCardGetCardsPlayedOnTurn(CCPlayer, CCPlayer.ClubCardTurnCounter).filter(card => ClubCardCardHasGroup(card, "ABDLBaby"));
			abdlBabyCardsPlayed.forEach(() => {
				ClubCardPlayerAddMoney(CCPlayer, 3);
			});
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
		BeforeTurnEnd: function(CCPlayer) {
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
		MoneyPerTurn: -1,
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
			if (ClubCardGroupIsOnBoard(CCPlayer, "ABDLBaby")) ClubCardPlayerAddFame(CCPlayer, 25);
		},
		CanPlay: function(CCPlayer) {
			return ClubCardGroupIsOnBoard(CCPlayer, "ABDLBaby");
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
		ID: 10007,
		Name: "Fussy Baby",
		Group: ["ABDLBaby"],
		MoneyPerTurn: 1,
		BeforeOpponentTurnEnd: function(CCPlayer) {
			let cardOwner = ClubCardGetOpponent(CCPlayer);
			let playedAnEvent = ClubCardGetCardsPlayedOnTurn(CCPlayer, CCPlayer.ClubCardTurnCounter).some(card => card.Type === "Event");
			if(!playedAnEvent) {
				return;
			}

			ClubCardRemoveFromBoard(cardOwner, this);
			ClubCardAddToHand(cardOwner, this);
			ClubCardPlayerAddFame(cardOwner, 4);
		},
	},
	{
		ID: 10008,
		Name: "Nanny",
		FamePerTurn: 2,
		RequiredLevel: 3,
		Group: ["ABDLMommy"],
		AfterTurnEnd: function(CCPlayer) {
			const abdlBabyCardsPlayed =  ClubCardGetCardsPlayedOnTurn(CCPlayer, CCPlayer.ClubCardTurnCounter).filter(card => ClubCardCardHasGroup(card, "ABDLBaby"));
			abdlBabyCardsPlayed.forEach(() => {
				ClubCardPlayerAddFame(CCPlayer, CCPlayer.Level);
			});
		}
	},
	{
		ID: 10009,
		Name: "Dommy Mommy",
		FamePerTurn: 1,
		MoneyPerTurn: -5,
		RequiredLevel: 5,
		Group: ["ABDLMommy","Dominant"],
		OnPlay: function(CCPlayer) {
			// get all members, exclude events from board count
			const membersOnBoard = CCPlayer.Board.filter(card => card.Type !== "Event").length;

			ClubCardPlayerAddFame(CCPlayer, membersOnBoard);
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
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Mildred")) ClubCardPlayerAddFame(CCPlayer, 5);
		}
	},
	{
		ID: 11007,
		Name: "Substitute Teacher",
		Group: ["CollegeTeacher"],
		MoneyPerTurn: -2,
		BeforeTurnEnd: function(CCPlayer) {
			const effectFame = ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent");
			ClubCardPlayerAddFame(CCPlayer, ClubCardGetMaxEffectFromCard(this, effectFame));
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
		BeforeOpponentTurnEnd: function(CCPlayer) {
			let cardOwner = ClubCardGetOpponent(CCPlayer);
			const hasCollegeMember = ClubCardGroupIsOnBoard(cardOwner, 'CollegeTeacher') || ClubCardGroupOnBoardCount(cardOwner, 'Staff') >= 2;
			if(!hasCollegeMember) {
				return;
			}

			const eventsAndLiabilitiesPlayed = ClubCardGetCardsPlayedOnTurn(CCPlayer, CCPlayer.ClubCardTurnCounter).filter(
				card => card.Type === "Event" || ClubCardCardHasGroup(card, "Liability"),
			);
			eventsAndLiabilitiesPlayed.forEach(() => {
				ClubCardPlayerAddMoney(cardOwner, -CCPlayer.Level);
				ClubCardPlayerDrawCard(cardOwner, 1);
				ClubCardLogPublish("Effect Student Custodian", CCPlayer, -CCPlayer.Level);
			});
		}
	},
	{
		ID: 11013,
		Name: "Med Student",
		Group: ["CollegeStudent", "AsylumNurse"],
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			const asylumPatientPresent = ClubCardGroupIsOnBoard(CCPlayer, "AsylumPatient");
			if(asylumPatientPresent) {
				ClubCardPlayerAddMoney(CCPlayer, 1);
			}

			const collegeTeacherPresent = ClubCardGroupIsOnBoard(CCPlayer, "CollegeTeacher");
			if(collegeTeacherPresent) {
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
		Group: ["Mistress", "Shibari", "Player"],
		RewardMemberNumber: 41997,
		RequiredLevel: 3,
		FamePerTurn: 2,
		MoneyPerTurn: -1,
	},

	// Event cards
	{
		ID: 30000,
		Name: "Scratch and Win",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 7);
			ClubCardLogPublish("GainMoney", CCPlayer, 7);
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
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
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
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
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
		}
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
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
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
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
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

			const shibariCardsOnBoard = ClubCardGroupOnBoardCount(CCPlayer, "Shibari");
			Fame = Fame + shibariCardsOnBoard;
			ClubCardPlayerAddFame(CCPlayer, Fame);
			ClubCardLogPublish("GainFame", CCPlayer, Fame);
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return ((CCPlayer.Board != null) && (CCPlayer.Board.length > 0));
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
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
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
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
		}
	},
	{
		ID: 30016,
		Name: "Weekend Meeting",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 3);
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
		}
	},
	{
		ID: 30017,
		Name: "Fancy Meeting",
		Type: "Event",
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 5);
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
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
			ClubCardPlayerDiscardCard(ClubCardGetOpponent(CCPlayer), 4);
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
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
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
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

			const targetIsDominantOrMistress = ClubCardCardHasGroup(ClubCardSelection, "Dominant") || ClubCardCardHasGroup(ClubCardSelection, "Mistress");
			if(targetIsDominantOrMistress) {
				ClubCardAlvinCondition(CCPlayer);
			}

			let Opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardRemoveFromBoard(Opponent, ClubCardSelection);
			let Money = Math.pow(Opponent.Level, 2);
			ClubCardPlayerAddMoney(CCPlayer, Money * -1);
			ClubCardLogPublish("LoseMoney", CCPlayer, Money);
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
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
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
		}
	},
	{
		ID: 30023,
		Name: "Toy Box",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 3);
			ClubCardLogPublish("GainMoney", CCPlayer, 3);
			ClubCardPlayerDrawCard(CCPlayer, 1);
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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

			ClubCardAlvinCondition(CCPlayer);
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
		}
	},
	{
		ID: 30025,
		Name: "Launder",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			let Money = CCPlayer.Money;
			ClubCardPlayerAddMoney(CCPlayer, Money*-1);
			let Fame = Math.floor(Money/3);
			ClubCardPlayerAddFame(CCPlayer, Fame);
			ClubCardLogPublish("GainFame", CCPlayer, Fame);
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			if(ClubCardGroupIsOnBoard(CCPlayer, "Criminal")&&CCPlayer.Money>=3) return true;
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
				ClubCardLogPublish("Effect Bad Press", CCPlayer);
			}
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
		AfterTurnEnd: function(CCPlayer) {
			let Fame = CCPlayer.LastFamePerTurn;
			if (Fame > 0) {
				ClubCardPlayerAddFame(CCPlayer, Fame);
				CCPlayer.LastFamePerTurn = Fame * 2;
				ClubCardLogPublish("Effect Clever Marketing", CCPlayer);
			}
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
				ClubCardLogPublish("Effect Repay Loan", CCPlayer);
			}
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
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
		AfterTurnEnd: function(CCPlayer) {
			let Money = CCPlayer.LastMoneyPerTurn;
			if (Money > 0) {
				ClubCardPlayerAddMoney(CCPlayer, Money);
				CCPlayer.LastMoneyPerTurn = Money * 2;
				ClubCardLogPublish("Effect Bank Loan", CCPlayer);
			}
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
		}
	},
	{
		ID: 31004,
		Name: "Teamwork",
		Type: "Event",
		Time: 4,
		ExtraDraw: 1,
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
		}
	},
	{
		ID: 31005,
		Name: "Overtime",
		Type: "Event",
		Time: 3,
		ExtraPlay: 1,
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
		}
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
				ClubCardLogPublish("Effect Porn Convention", CCPlayer, Fame);
			}
		},
		BeforeOpponentTurnEnd: function(CCPlayer) {
			let Fame = ClubCardGroupOnBoardCount(CCPlayer, "PornActress");
			if (Fame > 0) {
				Fame = Fame * 3;
				ClubCardPlayerAddFame(CCPlayer, Fame);
				ClubCardLogPublish("Effect Porn Convention", CCPlayer, Fame);
			}
		},
		CanPlay: function(CCPlayer) {
			if(ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain")) return false;
			if(ClubCardEventNameIsInEvents(CCPlayer, "Restrain")) return false;
			return true;
		}
	},
	{
		ID: 31007,
		Name: "Daycare Party",
		Type: "Event",
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			let mommyCount = ClubCardGroupOnBoardCount(CCPlayer, "ABDLMommy");
			ClubCardPlayerAddFame(CCPlayer, mommyCount * 4);
			ClubCardPlayerDrawCard(CCPlayer, mommyCount);
			if(mommyCount > 0) {
				ClubCardLogPublish("Effect Daycare Party", CCPlayer, mommyCount);
			}
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
			ClubCardLogPublish("Effect Recess", CCPlayer, abdlAndCollegeBonus);
		}
	},
	{
		ID: 31010,
		Name: "First Bell",
		Type: "Event",
		Time: 0,
		OnPlay: function(CCPlayer) {
			const hasTeacher = ClubCardGroupIsOnBoard(CCPlayer, "CollegeTeacher");
			if(CCPlayer.ClubCardTurnCounter === 1 || hasTeacher) {
				this.ExtraPlay = 1;
			}

			const drawn = ClubCardPlayerDrawGroupCard(CCPlayer, "CollegeStudent");
			if(drawn) {
				ClubCardLogPublish("Effect First Bell Draw", CCPlayer);
			} else {
				ClubCardLogPublish("Effect First Bell No Draw", CCPlayer);
			}
		},
		BeforeOpponentTurnEnd: function() {
			this.ExtraPlay = 0;
		}
	}
];

const text = {
  "Exit": "Exit the game",
  "Level1": "Apartment",
  "Level2": "Cottage",
  "Level3": "House",
  "Level4": "Mansion",
  "Level5": "Manor",
  "Fame": "Fame:",
  "Money": "Money:",
  "PlayCard": "Play this card",
  "Draw": "Draw and end your turn",
  "CannotDraw": "End your turn",
  "SelectCard": "Select this card",
  "CancelPending": "Don't play this card",
  "Bankrupt": "Go bankrupt",
  "Concede": "Concede the game",
  "StopWatch": "Stop watching",
  "OnlineConcede": "SOURCEPLAYER conceded and left the game.",
  "OnlineStopWatch": "SOURCEPLAYER stopped watching and left the game.",
  "Yes": "Yes",
  "No": "No",
  "DeckNumber": "Deck #",
  "Play": "Play",
  "CanWinNewCard": "Your opponent has this card you can win:",
  "WonNewCard": "You've reached 100 Fame and won this card:",
  "NoValidDeckFound": "PLAYERNAME's deck isn't valid.  Using the default deck instead.",
  "SelectDeck": "Select the deck to play with.",
  "WaitingSelectDeck": "Waiting for deck selection.",
  "UsingDeck": "PLAYERNAME's deck is selected.",
  "ConfirmBankrupt": "Go bankrupt and start a fresh new club?",
  "ConfirmConcede": "Do you really want to concede this game?",
  "ConfirmExit": "Do you want to stop watching this game?",
  "WentBankrupt": "SOURCEPLAYER went bankrupt and started a new club.",
  "VictoryForPlayer": "Congratulations!  You've reached 100 Fame and won the game.",
  "VictoryForAI": "Your opponent reached 100 Fame and won the game.",
  "VictoryOnline": "PLAYERNAME reached 100 Fame and won the game.",
  "Return": "End the game",
  "OpponentPlaying": "Your opponent is playing...",
  "WatchingGame": "Watching the game...",
  "PlayACard": "PLAYERNAME plays CARDNAME.",
  "PlayACardOpponentBoard": "PLAYERNAME plays CARDNAME on the opponent's board.",
  "PlayAnotherCard": "PLAYERNAME can play another card.  The turn continues.",
  "StartPlayer": "You've been chosen to start the game.  Select a card to play or end your turn by drawing.",
  "StartOpponent": "Your opponent has been chosen to start the game.  Please wait for her move.",
  "StartOnline": "PLAYERNAME has been selected to start.  Both players must pick a deck.",
  "EndTurnPlayer": "SOURCEPLAYER FAMEMONEY.  It's OPPONENTPLAYER turn.",
  "EndDrawPlayer": "SOURCEPLAYER draws a card.  FAMEMONEY.  It's OPPONENTPLAYER's turn.",
  "UpgradeToLevel2": "Get Cottage (MONEY)",
  "UpgradeToLevel3": "Get House (MONEY)",
  "UpgradeToLevel4": "Get Mansion (MONEY)",
  "UpgradeToLevel5": "Get Manor (MONEY)",
  "UpgradedToLevel2": "PLAYERNAME upgraded to Cottage for MONEYAMOUNT Money.",
  "UpgradedToLevel3": "PLAYERNAME upgraded to House for MONEYAMOUNT Money.",
  "UpgradedToLevel4": "PLAYERNAME upgraded to Mansion for MONEYAMOUNT Money.",
  "UpgradedToLevel5": "PLAYERNAME upgraded to Manor for MONEYAMOUNT Money.",
  "GainFame": "SOURCEPLAYER gained AMOUNT Fame.",
  "GainMoney": "SOURCEPLAYER gained AMOUNT Money.",
  "LoseFame": "SOURCEPLAYER lost AMOUNT Fame.",
  "LoseMoney": "SOURCEPLAYER lost AMOUNT Money.",
  "StealFame": "SOURCEPLAYER stole AMOUNT Fame from OPPONENTPLAYER.",
  "StealMoney": "SOURCEPLAYER stole AMOUNT Money from OPPONENTPLAYER.",
  "MemberLeaveClub": "CARDTITLE leaves SOURCEPLAYER's club.",
  "EventRemoved": "CARDTITLE event is removed.",
  "EventExpired": "CARDTITLE event has expired.",
  "ChatHere": "Chat here...",
  "GroupLiability": "Liability",
  "GroupStaff": "Staff",
  "GroupPolice": "Police",
  "GroupCriminal": "Criminal",
  "GroupFetishist": "Fetishist",
  "GroupPornActress": "Porn Actress",
  "GroupMaid": "Maid",
  "GroupAsylumPatient": "Asylum Patient",
  "GroupAsylumNurse": "Asylum Nurse",
  "GroupDominant": "Dominant",
  "GroupMistress": "Mistress",
  "GroupABDLBaby": "ABDL Baby",
  "GroupABDLMommy": "ABDL Mommy",
  "GroupCollegeStudent": "College Student",
  "GroupCollegeTeacher": "College Teacher",
  "GroupPlayer": "Online Player",
  "GroupShibari": "Shibari",
  "Title Kinky Neighbor": "Kinky Neighbor",
  "Text Kinky Neighbor": "+2 Money per turn if Cute Girl Next Door is present.",
  "Title Cute Girl Next Door": "Cute Girl Next Door",
  "Text Cute Girl Next Door": "<F>The neighborhood is getting better everyday.",
  "Title Voyeur": "Voyeur",
  "Text Voyeur": "+4 Money per turn if Exhibitionist is present.",
  "Title Exhibitionist": "Exhibitionist",
  "Text Exhibitionist": "<F>We prefer the term naturist.",
  "Title Party Animal": "Party Animal",
  "Text Party Animal": "<F>The best plans always begin by: Hold my beer.",
  "Title Auctioneer": "Auctioneer",
  "Text Auctioneer": "Double all bonuses from auctions.",
  "Title Uptown Girl": "Uptown Girl",
  "Text Uptown Girl": "<F>She's been living in her white bread world.",
  "Title Tourist": "Tourist",
  "Text Tourist": "<F>I'll need a vacation from my vacation.",
  "Title Diplomat": "Diplomat",
  "Text Diplomat": "<F>Business or leasure?  Pain and pleasure.",
  "Title Gambler": "Gambler",
  "Text Gambler": "+4 Money when she enters your club.",
  "Title Red Twin": "Red Twin",
  "Text Red Twin": "<F>We don't share minds but can share orgasms.",
  "Title Blue Twin": "Blue Twin",
  "Text Blue Twin": "+3 Fame per turn if Red Twin is present.",
  "Title Rope Bunny": "Rope Bunny",
  "Text Rope Bunny": "+2 Money per turn if at least one Dominant is present.",
  "Title Shy Submissive": "Shy Submissive",
  "Text Shy Submissive": "Will leave your club at end of turn if there are more than 6 members.",
  "Title Rope Sensei": "Rope Sensei",
  "Text Rope Sensei": "<F>ロープを尊重する",
  "Title LARP Queen": "LARP Queen",
  "Text LARP Queen": "\"<F>For my next quest, I need enchanted ropes, love potions and a cursed chastity belt.\"",
  "Title Local Influencer": "Local Influencer",
  "Text Local Influencer": "You lose 4 Money and draw a card when she enters your club.",
  "Title Wannabe Princess": "Wannabe Princess",
  "Text Wannabe Princess": "+2 Fame per turn if your building level is a Manor.",
  "Title Waitress": "Waitress",
  "Text Waitress": "+1 Money per turn if Party Animal is present.  +1 Money per turn if Tourist is present.",
  "Title Bouncer": "Bouncer",
  "Text Bouncer": "<F>Your ass will bounce on the street if you make me mad.",
  "Title Accountant": "Accountant",
  "Text Accountant": "+1 Money per turn at House level or better.  +1 Money per turn at Manor level.",
  "Title Secretary": "Secretary",
  "Text Secretary": "Your 3 turns event cards will last one extra turn.",
  "Title Associate": "Associate",
  "Text Associate": "You can play one extra card per turn.",
  "Title Human Resource": "Human Resource",
  "Text Human Resource": "Draw an extra card each time you end your turn by drawing a card.",
  "Title Policewoman": "Policewoman",
  "Text Policewoman": "<F>I took the job for the free handcuffs.",
  "Title Pusher": "Pusher",
  "Text Pusher": "+3 Money per turn for Junkie and +1 Money per turn for Sidney.   Leave the club at end of turn if a Police is present.",
  "Title Junkie": "Junkie",
  "Text Junkie": "Leave club at end of turn if a Police is present.",
  "Title Zealous Cop": "Zealous Cop",
  "Text Zealous Cop": "\"<F>Rules are rules, and I'll make sure they will be followed.\"",
  "Title Gangster": "Gangster",
  "Text Gangster": "+2 Money per turn per Criminal present.  Leave the club at end of turn if a Police is present.",
  "Title Paroled Thief": "Paroled Thief",
  "Text Paroled Thief": "Opponent gets +1 Money at end of turn.  Leave the club at end of turn if a Police is present.",
  "Title Police Cadet": "Police Cadet",
  "Text Police Cadet": "<F>Hey!  Give me back my keys!",
  "Title Stepmother": "Stepmother",
  "Text Stepmother": "Removes all Police and Liability members from your club when she enters.",
  "Title Sheriff": "Sheriff",
  "Text Sheriff": "Draw 2 cards when she enters your club.",
  "Title Maid Lover": "Maid Lover",
  "Text Maid Lover": "+1 Money per turn for each Maid present.",
  "Title Diaper Lover": "Diaper Lover",
  "Text Diaper Lover": "+1 Money per turn for each ABDL Baby present.",
  "Title Masochist": "Masochist",
  "Text Masochist": "+1 Fame per turn and +1 Money per turn if at least one Dominant is present.",
  "Title Feet Worshiper": "Feet Worshiper",
  "Text Feet Worshiper": "+2 Money per turn if at least one Porn Actress or ABDL Mommy is present.",
  "Title Fin-Dom Simp": "Fin-Dom Simp",
  "Text Fin-Dom Simp": "\"+1 Money per turn for each Dominant present, maximum of +3.\"",
  "Title Fin-Dom Whale": "Fin-Dom Whale",
  "Text Fin-Dom Whale": "+2 Money per turn for each Mistress present.  Draw a card when she enters your club.",
  "Title Porn Addict": "Porn Addict",
  "Text Porn Addict": "+1 Money per turn for each Porn member present.",
  "Title Porn Amateur": "Porn Amateur",
  "Text Porn Amateur": "<F>I'll be the next Marylin Cumroe.",
  "Title Porn Movie Director": "Porn Movie Director",
  "Text Porn Movie Director": "+1 Fame per turn and +1 Money per turn for each Porn Actress present.",
  "Title Porn Lesbian": "Porn Lesbian",
  "Text Porn Lesbian": "+1 Fame per turn if at least one other Porn Actress is present.",
  "Title Porn Veteran": "Porn Veteran",
  "Text Porn Veteran": "<F>My body count?  You don't want to know.",
  "Title Porn Star": "Porn Star",
  "Text Porn Star": "\"<F>My father would not approve, until I got him a new house.\"",
  "Title Cam Girl": "Cam Girl",
  "Text Cam Girl": "Draw a card when she enters your club.",
  "Title Rookie Maid": "Rookie Maid",
  "Text Rookie Maid": "<F>I can't wait for the sorority initiation.",
  "Title Coat Check Maid": "Coat Check Maid",
  "Text Coat Check Maid": "<F>Do not lose your receipt ticket.",
  "Title Regular Maid": "Regular Maid",
  "Text Regular Maid": "<F>Should I refresh your drink Miss?",
  "Title French Maid": "French Maid",
  "Text French Maid": "<F>Pour un service impeccable et coquin.",
  "Title Head Maid": "Head Maid",
  "Text Head Maid": "+1 Fame per turn for each other Maid present.",
  "Title Confused Maid": "Confused Maid",
  "Text Confused Maid": "<F>I've tried three dusters but this toilet is still clogged.",
  "Title Curious Patient": "Curious Patient",
  "Text Curious Patient": "<F>Why are the walls padded?",
  "Title Part-Time Patient": "Part-Time Patient",
  "Text Part-Time Patient": "+6 Money when she enters your club.",
  "Title Novice Nurse": "Novice Nurse",
  "Text Novice Nurse": "+1 Fame per turn for each Asylum Patient present. Max 3",
  "Title Commited Patient": "Commited Patient",
  "Text Commited Patient": "<F>My jacket is never tight enough.",
  "Title Veteran Nurse": "Veteran Nurse",
  "Text Veteran Nurse": "+2 Fame per turn for each Asylum Patient present. Max 6",
  "Title Permanent Patient": "Permanent Patient",
  "Text Permanent Patient": "<F>Monday exam is quite similar to therapy Tuesday.",
  "Title Doctor": "Doctor",
  "Text Doctor": "+3 Fame per turn for each Asylum Patient present.",
  "Title Picky Nurse": "Picky Nurse",
  "Text Picky Nurse": "Only enters if 2 Asylum Patient or more are present.  Leaves if there are less than 2 Asylum Patient.",
  "Title Amateur Rigger": "Amateur Rigger",
  "Text Amateur Rigger": "<F>Purple hands?  I'm sure it's normal.",
  "Title Domme": "Domme",
  "Text Domme": "<F>Your knees will be sore tonight.",
  "Title Madam": "Madam",
  "Text Madam": "<F>I will take care of your needs and your money.",
  "Title Mistress": "Mistress",
  "Text Mistress": "<F>This collar will remind you of my power.",
  "Title Dominatrix": "Dominatrix",
  "Text Dominatrix": "<F>Bring your credit card slave.",
  "Title Mistress Sophie": "Mistress Sophie",
  "Text Mistress Sophie": "<F>Votre douleur est mon plaisir.",
  "Title Scammer": "Scammer",
  "Text Scammer": "<F>This new crypto will change everything.",
  "Title Pyramid Schemer": "Pyramid Schemer",
  "Text Pyramid Schemer": "\"<F>You recruit five friends, who recruit five friends, who...\"",
  "Title Ponzi Schemer": "Ponzi Schemer",
  "Text Ponzi Schemer": "\"<F>Trust me, this police ankle bracelet is only a kink of mine.\"",
  "Title Party Pooper": "Party Pooper",
  "Text Party Pooper": "<F>Why is everyone so boring nowadays?",
  "Title College Dropout": "College Dropout",
  "Text College Dropout": "-1 Fame per turn for each College Student present.",
  "Title Union Leader": "Union Leader",
  "Text Union Leader": "-1 Money per turn for each Maid and Staff present.",
  "Title No-Fap Advocate": "No-Fap Advocate",
  "Text No-Fap Advocate": "-2 Fame per turn for each Porn Actress present.",
  "Title Pandora Infiltrator": "Pandora Infiltrator",
  "Text Pandora Infiltrator": "\"<F>Pssssst, you want to try a real BDSM club?\"",
  "Title Uncontrollable Sub": "Uncontrollable Sub",
  "Text Uncontrollable Sub": "-1 Fame per turn for each Dominant present.  -1 Fame per turn for each Mistress present.",
  "Title Baby Girl": "Baby Girl",
  "Text Baby Girl": "+1 Money per turn if at least one ABDL Mommy is present.",
  "Title Caring Mother": "Caring Mother",
  "Text Caring Mother": "<F>Mother do you think they'll try to break my balls.",
  "Title Diaper Baby": "Diaper Baby",
  "Text Diaper Baby": "+3 Money per turn if at least one Maid is present.",
  "Title Sugar Baby": "Sugar Baby",
  "Text Sugar Baby": "<F>This baby wants a diamond pacifier.",
  "Title Babysitter": "Babysitter",
  "Text Babysitter": "+2 Fame per turn for each ABDL Baby present. Max 5",
  "Title Soap Opera Mother": "Soap Opera Mother",
  "Text Soap Opera Mother": "+25 Fame when she enters your club if at least one ABDL Baby is present.",
  "Title Amanda": "Amanda",
  "Text Amanda": "<F>I never thought I would find a second home in this perverted place.",
  "Title Sarah": "Sarah",
  "Text Sarah": "+1 Fame per turn if Amanda or Mistress Sophie is present.  -2 Fame per turn if Sidney is present.",
  "Title Sidney": "Sidney",
  "Text Sidney": "<F>Anyone that calls me Piggy will end up in a hogtie.",
  "Title Jennifer": "Jennifer",
  "Text Jennifer": "Select and remove one member from your club before she enters.",
  "Prerequisite Jennifer": "Select a member from your club to remove before Jennifer enters.",
  "Title College Freshwoman": "College Freshwoman",
  "Text College Freshwoman": "+1 Fame per turn if Julia is present.  +1 Fame per turn if Yuki is present.",
  "Title College Nerd": "College Nerd",
  "Text College Nerd": "+1 Money per turn if Julia is present.  +1 Money per turn if Yuki is present.",
  "Title College Hidden Genius": "Hidden Genius",
  "Text College Hidden Genius": "+5 Fame per turn if Mildred is present.",
  "Title Substitute Teacher": "Substitute Teacher",
  "Text Substitute Teacher": "+1 Fame per turn for each College Student present. Max 3",
  "Title Julia": "Julia",
  "Text Julia": "<F>Seeing them learn and grow is magnifico.",
  "Title Yuki": "Yuki",
  "Text Yuki": "<F>You cannot learn with a closed mind or closed legs.",
  "Title Mildred": "Mildred",
  "Text Mildred": "\"<F>In my class, silence is gold and will be enforced.\"",
  "Title Sam the Busty Cow": "Sam the Busty Cow",
  "Text Sam the Busty Cow": "<F>Got Milk?",
  "Title Suki": "Suki",
  "Text Suki": "+1 Fame per turn if at least one maid is present.",
  "Title Angela": "Angela",
  "Text Angela": "<F>Hmms nya~ Could I interest you in a lewd potion mew?~",
  "Title Scratch and Win": "Scratch and Win",
  "Text Scratch and Win": "+7 Money.",
  "Title Kinky Garage Sale": "Kinky Garage Sale",
  "Text Kinky Garage Sale": "+12 Money.",
  "Title Second Mortgage": "Second Mortgage",
  "Text Second Mortgage": "+20 Money.",
  "Title Foreign Investment": "Foreign Investment",
  "Text Foreign Investment": "+30 Money.",
  "Title Cat Burglar": "Cat Burglar",
  "Text Cat Burglar": "Steals up to 4 Money from opponent.  Money must be positive.  Won't work if opponent has Police.",
  "Title Money Heist": "Money Heist",
  "Text Money Heist": "Steals up to 12 Money from opponent.  Money must be positive.  Won't work if opponent has Police.",
  "Title BDSM Ball": "BDSM Ball",
  "Text BDSM Ball": "\"+1 Fame for each member that's not Dominant, Liability, Maid or Staff.\"",
  "Title Vampire Ball": "Vampire Ball",
  "Text Vampire Ball": "\"+3 Fame for each member that's not Dominant, Liability, Maid or Staff.\"",
  "Title Straitjacket Saturday": "Straitjacket Saturday",
  "Text Straitjacket Saturday": "+4 Money for each Asylum Patient and Asylum Nurse.",
  "Title Charity Auction": "Charity Auction",
  "Text Charity Auction": "\"Select and remove one member from your club, gain 1 Fame per building level.\"",
  "Prerequisite Charity Auction": "Select a member from your club to remove for Fame.",
  "Title Slave Auction": "Slave Auction",
  "Text Slave Auction": "\"Select and remove one member from your club, gain 1 Money per building level.\"",
  "Prerequisite Slave Auction": "Select a member from your club to remove for Money.",
  "Title College Bash": "College Bash",
  "Text College Bash": "+2 Fame for each College Girl.  Extra +2 Fame if Sidney is present.",
  "Title Ransomware": "Ransomware",
  "Text Ransomware": "Opponent loses 5 Money per building level.  Cannot be played if your opponent has Amanda or Jennifer.",
  "Title Shibari Evening": "Shibari Evening",
  "Text Shibari Evening": "+1 Fame for each Non-Dominant members in your club. +1 Extra Fame for each Shibari member.",
  "Title Moving Out of Town": "Moving Out of Town",
  "Text Moving Out of Town": "Remove any member from your opponent club.",
  "Prerequisite Moving Out of Town": "Select a member from your opponent club to remove.",
  "Prerequisite Kidnapping": "Select a member from your opponent's club to kidnap.",
  "Title Virtual Meeting": "Virtual Meeting",
  "Text Virtual Meeting": "Draw 2 cards",
  "Title Weekend Meeting": "Weekend Meeting",
  "Text Weekend Meeting": "Draw 3 cards",
  "Title Fancy Meeting": "Fancy Meeting",
  "Text Fancy Meeting": "Draw 5 cards",
  "Title Prank": "Prank",
  "Text Prank": "Your opponent discards 2 random cards.",
  "Title Sabotage": "Sabotage",
  "Text Sabotage": "Your opponent discards 4 random cards.",
  "Title Nursery Night": "Nursery Night",
  "Text Nursery Night": "\"+3 Money for each ABDL Baby, ABDL Mommy and Maid in your club.\"",
  "Title Bad Press": "Bad Press",
  "Text Bad Press": "\"For 3 turns, your opponent gains no Fame at the end of turn.  Cancels opponent Clever Marketing.\"",
  "Effect Bad Press": "No Fame is gained because of OPPONENTPLAYER Bad Press event.",
  "Title Clever Marketing": "Clever Marketing",
  "Text Clever Marketing": "\"For 3 turns, you gain double Fame at the end of turn.  Cancels opponent Bad Press.\"",
  "Effect Clever Marketing": "Fame gained is doubled because of SOURCEPLAYER Clever Marketing event.",
  "Title Repay Loan": "Repay Loan",
  "Text Repay Loan": "\"For 3 turns, your opponent gains no Money at the end of turn.  Cancels opponent Bank Loan.\"",
  "Effect Repay Loan": "No Money is gained because of OPPONENTPLAYER Repay Loan event.",
  "Title Bank Loan": "Bank Loan",
  "Text Bank Loan": "\"For 3 turns, you gain double Money at the end of turn.  Cancels opponent Repay Loan.\"",
  "Effect Bank Loan": "Money gained is doubled because of SOURCEPLAYER Bank Loan event.",
  "Title Teamwork": "Teamwork",
  "Text Teamwork": "\"For 4 turns, you draw an extra card each time you draw a card.\"",
  "Title Overtime": "Overtime",
  "Text Overtime": "\"For 3 turns, you can play an extra card.\"",
  "Title Porn Convention": "Porn Convention",
  "Text Porn Convention": "\"For 3 turns, all players gain 3 Fame for each Porn Actress in their club at end of turn.\"",
  "Effect Porn Convention": "SOURCEPLAYER gains AMOUNT Fame from the Porn Convention.",
  "Title Kidnapping": "Kidnapping",
  "Text Kidnapping": "Remove any member from your opponent club.  You lose opponent building level^2 Money.",
  "Title Pandora Box": "Pandora's Box",
  "Text Pandora Box": "All players discard their current hand and draw 5 new cards.",
  "Effect Pandora Box": "SOURCEPLAYER opens Pandora's Box.  All players discard their hand and draw 5 new cards.",
  "Title Toy Box": "Toy Box",
  "Text Toy Box": "+3 Money and draw a card.",
  "Title Restrain": "Restrain",
  "Text Restrain": "\"For 3 turns, you nor your opponent can play Events. Cancels all Events.\"",
  "Title Detective": "Detective",
  "Text Detective": "For each card your opponent draws gain 1 Money. If no Liability are present gain 1 Fame and 1 Money instead.",
  "Title Launder": "Launder",
  "Text Launder": "A Criminal must be present. Lose all your Money. +1 Fame for every 3 Money lost.",
  "Title Big Baby": "Big Baby",
  "Text Big Baby": "+1 Money if opponent has more cards in their hand. Opponent draws a card when she enters your club.",
  "Title Fussy Baby": "Fussy Baby",
  "Text Fussy Baby": "Returns to hand when the opponent plays an Event and you gain 4 fame.",
  "Title Daycare Enthusiast": "Daycare Enthusiast",
  "Text Daycare Enthusiast": "Gain 3 fame when an ABDL Mommy enters your club. Gain 3 money when an ABDL Baby enters your club.",
  "Title Daycare Party": "Daycare Party",
  "Text Daycare Party": "Gain 4 Fame and draw a card for each ABDL Mommy present.",
  "Effect Daycare Party": "Gained AMOUNT fame from the Daycare Party",
  "Title Nanny": "Nanny",
  "Text Nanny": "\"When an ABDL Baby enters your club, gain fame equal to your club level.\"",
  "Title Dommy Mommy": "Dommy Mommy",
  "Text Dommy Mommy": "+1 Fame per turn for each ABDL Baby present. Gain 1 Fame for each member present when she enters your club.",
  "Title Contract Caretaker": "Contract Caretaker",
  "Text Contract Caretaker": "\"When a ABDL Baby enters your club, if opponent has more fame they don't gain fame at the end of their next turn\"",
  "Effect Contract Caretaker": "No Fame is gained because of OPPONENTPLAYER Contract Caretaker.",
  "Title Teacher's Aide": "Teacher's Aide",
  "Text Teacher's Aide": "Aiding her teacher day and night",
  "Title Homeroom": "Homeroom",
  "Text Homeroom": "Can only be played if you control 3 or more College members. Both players cannot advance their club for 4 turns.",
  "Title Student Custodian": "Student Custodian",
  "Text Student Custodian": "\"When the opponent plays an liability or event, if you control a teacher or staff, you draw a card and lose 1 money per opponent building level.\"",
  "Effect Student Custodian": "OPPONENTPLAYER lost AMOUNT money and drew a card from Student Custodian",
  "Title Recess": "Recess",
  "Text Recess": "Draw 2 cards. Gain 2 money for each ABDL Baby and College Student present.",
  "Effect Recess": "SOURCEPLAYER draws 2 cards and gains AMOUNT money from Recess",
  "Title Med Student": "Med Student",
  "Text Med Student": "+1 Money per turn if an Asylum Patient is present. +1 Fame per turn if a College Teacher is present.",
  "Title First Bell": "First Bell",
  "Text First Bell": "\"Draw a random college student from your deck. If it's your first turn or you control a teacher, play again.\"",
  "Effect First Bell Draw": "SOURCEPLAYER draws 1 card from First Bell",
  "Effect First Bell No Draw": "SOURCEPLAYER could not draw any cards from First Bell",
  "Title Alvin": "Alvin",
  "Text Alvin": "Summon a Ropeslave when playing Restrain or Kidnapping a Dominant or Mistress",
  "Effect Alvin": "Alvin summoned a rope slave for SOURCEPLAYER",
  "Title Rope Slave": "Rope Slave",
  "Text Rope Slave": "Gain +1 Fame per turn if Alvin or Rope Sensei present."
}

const test = ClubCardList.map(card => ({
    Id: card.ID,
    Name: card.Name,
    Type: card.Type,
    Description: text[`Text ${card.Name}`].replaceAll('"', '').replaceAll("<F>", ''),
    FamePerTurn: card.FamePerTurn,
    MoneyPerTurn: card.MoneyPerTurn,
    Groups: card.Group,
}))

fs.writeFileSync('cardBlob.json', JSON.stringify(test));
