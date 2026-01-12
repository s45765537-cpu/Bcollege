"use strict";
var MagicSchoolFindsAroundBackground = "ForestPath";
/** @type {NPCCharacter} */
// This cursed thing is because I can't use @ts-expect-error here, as non-strict TS flags it
// but not doing that causes 30 strictness errors
var MagicSchoolFindsAroundKitsune = /** @type {NPCCharacter} */ (/** @type {unknown} */ (null));
/** @type {boolean} */
var PrizesKnowledgeBool = false;
/** @type {string} */
var NPC_FindsAround_Kitsune_Appearance = "NobwRAgmBcYKIDcCmA7Alig5gcQPYHcUwAaMbGMAYQBtcAXACxKpmDAGIA2ADgEZ/ezACJIAZgEMArtTrCxUmc3YAxVWrABdAL7FwUWACVcAZyQAFVABNxKWaXKwAckgDGAa2riXSZpVYdeOEDApW4AJgAGSLDNHT0KABlcLGU0YwYUJDpjZgcwAGVJNDok/CQAJ19/djCAVjq62N1ICjhqJEwbOny3NHK7MgoaegZSiqroNnYImdm5CWlZbWb9KgYMJFMAIXLxQXsKHfEJqYjKM7Om+Nh88ToMSlxy0wG8x+esk45ZudJpn4iSgBgL+wKBAKuLRukhQxjo5TQAAdzF00Jt9oNYGZUZswHEoWBsbYAJ4MExIDF5fK4dw5Uh+SbfXgRZmCZbXMAACXE5SQAFt8nQab0sHTMQVhcYDGhMAwBgypgBmADsEWUaqUtW4Wq1kNW3N5AqF7gwmDFVMlCTE8v8IgWij+tV4Tqdeoo0oARh7krkKBAUB4stLZTbGexKHAIxG3YY0F6fQdYP7AyVrV9w5HMzGqLg+d6tkgHeLsDy6BUxQqOEIhNwtrWlBA4I3G0DuBE29xs9gssdEwUybj6dUACyKiJCcdKGvTzvsglbGyWGJ97mhqbD3gbjfZyiSOG5tAAL3EHvaymoklEomJcB5xmX4u5fQgLm8xmMT2JD8rNU4YT/nBKLwyi8EIoENnAYTKFBSiKlsERwAh8wKAMdoochiwYUWaGYaQOHYfIuFgPhqGEQR9qkRRWGUeheFkTRREkdRzF0VRrG0cR9EsZxbE8RxTHsZhc76jy/LYLQyC+rA4m4MgFa2lxfwQGEynKdm0qilJXKLi+b4fuUxLBnKXwCXxjGKWZRbsBAw7aiq3HsKqTkgt845jsqShhF53lKJQlCKgFiqed5Xm+f5gXZsoXhIAAakgaDUFpACy4jGG46YqZlUB/JuuXDtmnIRAAnKqWmcvFIYnMJrQuGSMUPnkWy4JYxKCsS7RVfiqyOE8fLiIlfZNS1ACqiLIpUQ6wAA6usZZ4isiQ8pgPiDc1xJjJUXUUE+5TKOUyR0EVZXiH0e0HemwGXcoBUneUC7uMqtTHX093pZNbCmZ9FlMdVsBwMSSAevt+DGJSrQA0DBA5Ftf0A6D+V9v9g4sIypnWVsvCcAFSjDlsuO4w5ajqKCEK/fAcOblpSP3iZFno5j2N/PjeNbNxaNgmT+R9dQ1BbBe5S8pYVMA/kDDiJYBDptwkGUMOgJk8o0gDeKSW4JIjDpvU7btpqkQdtmjhIoi7TGEFfaG2NJvzRyZh7sYxJg1idvEtbBKi0g5UTeKZj7Sgauwq73W4LezxlUg4uBxQADSxTGDCSAACondQgq7Ii5oUEnCWp+I6cXUEBc40Eiq8GbAQFyETPF6XQEV3ARelzXOV1w3Jdl+wwSF1Xjft53lccMO1ft4PPe153rdN+X4/d23Y9dwPQ9zyE2gaEAA===";
var MagicSchoolFindsAroundSpellCount = 0;
var MagicSchoolFindsAroundLastSpell = "";

/**
 * Uncompress a string containing an appearance, then applies that appearance data to the NPC
 * @param {Character} C - The character that loads its new appearance
 * @param {string} CompApp - The compressed string of appearance data
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundPrepareFoundNPC(C, CompApp) {
	if (!C.IsPlayer()) {
		C.Stage = "0";
		C.AllowItem = false;
	}
	CharacterNaked(C);

	// Try to decompress the data
	let KitsuneDecompressed = null;
	try {
		KitsuneDecompressed = LZString.decompressFromBase64(CompApp);
	} catch {
		KitsuneDecompressed = null;
	}

	// If we failed to decompress, exit early
	if (KitsuneDecompressed == null)
		return;

	// Tries to get the appearance bundle object
	/** @type {ClipboardAppearanceBundle | null} */
	let App = null;
	try {
		const json = JSON.parse(KitsuneDecompressed);
		// We're being careful below, so this is okay
		App = /** @type {ClipboardAppearanceBundle} */(json);
	} catch {
		App = null;
	}

	// If the loaded data is invalid, exit early
	if ((App == null) || !Array.isArray(App) || (App.length == 0))
		return;

	// Restores the appearance rows that are valid
	let MustRefresh = false;
	for (let AppRow of App)
		if ((AppRow.A != null) && (typeof AppRow.A == "string") && (AppRow.G != null) && (typeof AppRow.G == "string") && AppearanceGroupAllowed(C, AppRow.G)) {

			// On the first update, we clear the current appearance
			if (!MustRefresh)
				for (let A = C.Appearance.length - 1; A >= 0; A--)
					if ((C.Appearance[A].Asset.Group.Category == "Appearance") && C.Appearance[A].Asset.Group.AllowCustomize)
						if (C.Appearance[A].Asset.Group.AllowNone && AppearanceGroupAllowed(C, C.Appearance[A].Asset.Group.Name))
							C.Appearance.splice(A, 1);

			// Apply potential fixups when pasting
			const fixup = LoginInventoryFixups.find(f => f.Old.Group === AppRow.G && (f.Old.Name === AppRow.A || f.Old.Name === "*"));
			if (fixup) {
				AppRow.G = fixup.New.Group;
				if (fixup.New.Name) {
					AppRow.A = fixup.New.Name;
				}
			}

			// Wear the appearance asset and flags for a refresh
			InventoryWear(C, AppRow.A, AppRow.G, AppRow.C, undefined, undefined, undefined, false);
			MustRefresh = true;

		}

	// If at least one appearance row was updated, we refresh the character
	if (MustRefresh) {
		CharacterRefresh(C, false);
	}
}

/**
 * Loads the magic school finds around screen and the NPC
 * @type {ScreenLoadHandler}
 */
async function MagicSchoolFindsAroundLoad() {
	if (MagicSchoolFindsAroundKitsune == null) {
		MagicSchoolFindsAroundKitsune = CharacterLoadNPC("NPC_MagicSchoolFindsAround_Kitsune");
		MagicSchoolFindsAroundKitsune.Name = "Daji";
		MagicSchoolFindsAroundKitsune.LabelColor = "#4E1313";
		CharacterRelease(MagicSchoolFindsAroundKitsune);
		MagicSchoolFindsAroundPrepareFoundNPC(MagicSchoolFindsAroundKitsune, NPC_FindsAround_Kitsune_Appearance);
	}
	MagicSchoolLaboratoryKitsuneQuestUpdate();
}

/**
 * Runs the room
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundRun() {
	// Draw the background and the characters
	DrawCharacter(Player, 500, 0, 1);
	DrawCharacter(MagicSchoolFindsAroundKitsune, 1000, 0, 1);
	DrawButton(1885, 25, 90, 90, "", Player.CanWalk() ? "White" : "Pink", "Icons/Exit.png", TextGet("Exit"));
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png", TextGet("Profile"));
}

/**
 * Handles the click events.  Called from CommonClick()
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundClick() {
	// Check for clicks on the characters
	if (MouseIn(500, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (MouseIn(1000, 0, 500, 1000)) CharacterSetCurrent(MagicSchoolFindsAroundKitsune,);
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) CommonSetScreen("Room", "MagicSchoolLaboratory");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
}


/**
 * Sets a boolean flag on the player to indicate they have learned about the prizes
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundLearnAboutPrizes() {
	PrizesKnowledgeBool = true;
}

/**
 * Starts a magic battle with the Kitsune NPC
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundMagicBattleStart() {
	MagicBattleStart(MagicSchoolFindsAroundKitsune,9,MagicSchoolLaboratoryBackground,"MagicSchoolFindsAroundKitsuneMagicBattleEnd");
}

/**
 * When the magic battle practice ends
 * @returns {Promise<void>} - Nothing
 */
async function MagicSchoolFindsAroundKitsuneMagicBattleEnd() {
	await CommonSetScreen("Room", "MagicSchoolFindsAround");
	CharacterSetCurrent(MagicSchoolFindsAroundKitsune);
	if (!CurrentCharacter) return;
	if (MiniGameVictory) {
		MagicSchoolFindsAroundKitsune.Stage = "70";
		PoseSetActive(CurrentCharacter,'Kneel');
		CharacterAppearanceRestore(Player, MagicBattlePlayerAppearance);
		CharacterRefresh(Player);
	} else {
		MagicSchoolFindsAroundKitsune.Stage = "200";
		MagicSchoolFindsAroundSpellCount = 0;
		CharacterAppearanceRestore(MagicSchoolFindsAroundKitsune, MagicBattleOpponentAppearance);
		CharacterRefresh(MagicSchoolFindsAroundKitsune);
	}
	MagicSchoolFindsAroundKitsune.CurrentDialog = DialogFind(MagicSchoolFindsAroundKitsune, MiniGameVictory ? "BattleSuccess" : "BattleFail");
}

/**
 * When the player starts a club card game
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundClubCardStart() {
	ClubCardOpponent = CurrentCharacter;
	ClubCardOpponentDeck = ClubCardBuilderDefaultDeck;;
	MiniGameStart("ClubCard", 0, "MagicSchoolFindsAroundClubCardEnd");
}

/**
 * When the player ends a club card game
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundClubCardEnd() {
	CommonSetScreen("Room", "MagicSchoolFindsAround");
	CharacterSetCurrent(MagicSchoolFindsAroundKitsune);
	if (!CurrentCharacter) return;
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, MiniGameVictory ? "ClubCardVictory" : "ClubCardDefeat");
}

/**
 * Run out of the Findings room
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundRunAway() {
	DialogLeave();
	CommonSetScreen("Room", "MagicSchoolLaboratory");
}

/**
 * Run out of the Findings room and reset NPC
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundRunAwayEnd() {
	DialogLeave();
	MagicSchoolFindsAroundKitsune.Name = "Daji";
	delete MagicSchoolFindsAroundKitsune.FixedImage;
	CharacterRelease(MagicSchoolFindsAroundKitsune);
	PoseSetActive(MagicSchoolFindsAroundKitsune, 'BaseLower');
	MagicSchoolFindsAroundGiveTails();
	const data = MagicSchoolFindsAroundGetData();
	if (data.KitsuneQuestProgress == 9) {
		data.KitsuneQuestProgress = -1;
	}
	MagicSchoolFindsAroundKitsune.Stage = "0";
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	CommonSetScreen("Room", "MagicSchoolLaboratory");
}

/**
 * Starts the quest to gather essences
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundStartQuest() {
	const data = MagicSchoolFindsAroundGetData();
	data.KitsuneQuestProgress = 0;
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
}

/**
 * Return the current progress of the quest
 * @returns {number}
 */
function MagicSchoolFindsAroundKitsuneGetQuestProgress() {
	const data = MagicSchoolFindsAroundGetData();
	return data.KitsuneQuestProgress ?? -1;
}

/**
 * Quest in-progress?
 * @returns {boolean} - True if in progress
 */
function MagicSchoolFindsAroundQuestStarted() {
	return MagicSchoolFindsAroundKitsuneGetQuestProgress() >= 0;
}

/**
 * Quest completed?
 * @returns {boolean} - True if completed
 */
function MagicSchoolFindsAroundQuestCompleted() {
	return MagicSchoolFindsAroundKitsuneGetQuestProgress() >= 9;
}

/**
 * Returns the fully initialized and validated parameters for the FindsAround game
 * @returns {Required<GameMagicSchoolFindsAroundParameters>} - Nothing
 */
function MagicSchoolFindsAroundGetData() {
	if (!CommonIsObject(Player.Game.MagicSchoolFindsAround)) Player.Game.MagicSchoolFindsAround = {};
	const data = /** @type {Required<GameMagicSchoolFindsAroundParameters>} */ (Player.Game.MagicSchoolFindsAround);
	data.KitsuneQuestProgress = CommonClamp(data.KitsuneQuestProgress ?? -1, -1, 9);
	return data;
}

/**
 * Gives the player the reward tails
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundGiveTails() {
	InventoryAdd(Player, "KitsuneTailStraps", "TailStraps");
}

/** Hide the NPC
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundHideNPC() {
	MagicSchoolFindsAroundKitsune.Name = "";
	MagicSchoolFindsAroundKitsune.FixedImage = "Screens/Room/MovieStudio/Empty.png";
	/*DialogLeave();*/
}

/**
 * Triggered when the player lost and get ungagged by the Kitsune, can affect reputation
 * @param {string} RepChange
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundUngagPlayer(RepChange) {
	DialogChangeReputation("Dominant", CommonParseInt(RepChange) ?? 0);
	InventoryRemove(Player, "ItemMouth");
	InventoryRemove(Player, "ItemMouth2");
	InventoryRemove(Player, "ItemMouth3");
}

/**
 * When the player lost a battle and the Kitsune tests a spell on her
 * @param {string} RepChange
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundLoserSpell(RepChange) {

	// If we must change the player dom/sub reputation
	DialogChangeReputation("Dominant", CommonParseInt(RepChange) ?? 0);

	// After many spells, the event ends CHANGE TO 5
	if (MagicSchoolFindsAroundSpellCount >= 5) {
		MagicSchoolFindsAroundKitsune.Stage = "240";
		MagicSchoolFindsAroundKitsune.CurrentDialog = DialogFind(MagicSchoolFindsAroundKitsune, "SpellEnd");
		return;
	}

	// Finds a valid spell based on the player current predicament.  Some spells can only be done by specific houses.
	let Spell = "";
	while (Spell == "") {
		Spell = CommonRandomItemFromList(MagicSchoolFindsAroundLastSpell, ["Hogtie", "ReleaseHogtie", "FlyingHogtie", "Arousal", "Tickle", "Pain", "SwitchRope", "SwitchChain", "Fail", "Tight"]);
		if ((Spell == "Hogtie") && Player.PoseMapping.BodyFull === "Hogtied") Spell = "";
		if ((Spell == "ReleaseHogtie") && Player.PoseMapping.BodyFull !== "Hogtied") Spell = "";
		if ((Spell == "FlyingHogtie") && Player.PoseMapping.BodyFull !== "Hogtied") Spell = "";
		if ((Spell == "SwitchRope") && ((InventoryGet(Player, "ItemArms")?.Asset.Name == "HempRope") || Player.PoseMapping.BodyFull === "Hogtied")) Spell = "";
		if ((Spell == "SwitchChain") && ((InventoryGet(Player, "ItemArms")?.Asset.Name == "Chains") || Player.PoseMapping.BodyFull === "Hogtied")) Spell = "";
		if ((Spell == "Arousal") && (MagicSchoolFindsAroundKitsune.House != "Maiestas")) Spell = "";
		if ((Spell == "FlyingHogtie") && (MagicSchoolFindsAroundKitsune.House != "Vincula")) Spell = "";
		if ((Spell == "Tickle") && (MagicSchoolFindsAroundKitsune.House != "Amplector")) Spell = "";
		if ((Spell == "Pain") && (MagicSchoolFindsAroundKitsune.House != "Corporis")) Spell = "";
	}

	// Applies the spell effect
	if (Spell == "Arousal") { CharacterSetFacialExpression(Player, "Blush", "High", 8); CharacterSetFacialExpression(Player, "Eyes", "Horny", 8); }
	if (Spell == "Tickle") { CharacterSetFacialExpression(Player, "Blush", "Medium", 8); CharacterSetFacialExpression(Player, "Eyes", "Surprised", 8); }
	if (Spell == "Pain") { CharacterSetFacialExpression(Player, "Blush", "Medium", 8); CharacterSetFacialExpression(Player, "Eyes", "Closed", 8); }
	if (Spell == "Tight") { CharacterSetFacialExpression(Player, "Blush", "Low", 8); CharacterSetFacialExpression(Player, "Eyes", "Closed", 8); }
	if (Spell == "Fail") { CharacterSetFacialExpression(MagicSchoolFindsAroundKitsune, "Blush", "Medium", 8); CharacterSetFacialExpression(MagicSchoolFindsAroundKitsune, "Eyes", "Angry", 8); }
	if (Spell == "FlyingHogtie") {
		const item = InventoryGet(Player, "ItemArms");
		if (item) {
			TypedItemSetOptionByName(Player, item, "SuspensionHogtied");
			const Height = 0.67 * Math.random();
			item.Property ??= {};
			item.Property.OverrideHeight = {
				Height: Height * (Pose.find(p => p.Name === "Hogtied")?.OverrideHeight?.Height ?? 1),
				HeightRatioProportion: Height,
				Priority: 0,
			};
		}
		CharacterSetFacialExpression(Player, "Blush", "High", 8);
		CharacterSetFacialExpression(Player, "Eyes", "Surprised", 8);
	}
	if (Spell == "Hogtie") {
		TypedItemSetOptionByName(Player, "ItemArms", "Hogtied");
	}
	if (Spell == "ReleaseHogtie") {
		TypedItemSetOptionByName(Player, "ItemArms", "Basic");
	}
	if (Spell == "SwitchRope") {
		if (InventoryGet(Player, "ItemLegs") != null) InventoryWear(Player, "HempRope", "ItemLegs");
		if (InventoryGet(Player, "ItemFeet") != null) InventoryWear(Player, "HempRope", "ItemFeet");
		if (InventoryGet(Player, "ItemTorso") != null) InventoryWear(Player, "HempRopeHarness", "ItemTorso");
		if (InventoryGet(Player, "ItemArms") != null) InventoryWear(Player, "HempRope", "ItemArms");
	}
	if (Spell == "SwitchChain") {
		if (InventoryGet(Player, "ItemLegs") != null) InventoryWear(Player, "Chains", "ItemLegs");
		if (InventoryGet(Player, "ItemFeet") != null) InventoryWear(Player, "Chains", "ItemFeet");
		if (InventoryGet(Player, "ItemTorso") != null) InventoryWear(Player, "CrotchChain", "ItemTorso");
		if (InventoryGet(Player, "ItemArms") != null) InventoryWear(Player, "Chains", "ItemArms");
	}
	if ((Spell == "FlyingHogtie") || (Spell == "Hogtie") || (Spell == "ReleaseHogtie") || (Spell == "SwitchRope") || (Spell == "SwitchChain")) CharacterRefresh(Player);

	// Shows the spell dialog
	MagicSchoolFindsAroundLastSpell = Spell;
	MagicSchoolFindsAroundKitsune.Stage = "Spell" + Spell;
	MagicSchoolFindsAroundSpellCount++;
	MagicSchoolFindsAroundKitsune.CurrentDialog = DialogFind(MagicSchoolFindsAroundKitsune, "Spell" + Spell + "Intro");

}

/**
 * Triggered when the player lost and get untied by the Kitsune, can affect reputation
 * @param {string} RepChange
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundReleasePlayer(RepChange) {
	DialogChangeReputation("Dominant", CommonParseInt(RepChange) ?? 0);
	CharacterRelease(Player);
}

/**
 * Returns the player in the main hall in her current bondage
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundPlayerMainHall() {
	DialogLeave();
	CommonSetScreen("Room", "MainHall");
}

/**
 * Magic School Finds Around Kitsune Quest in progress?
 * True if started but not completed (0–8)
 * @returns {boolean}
 */
function DialogKitsuneQuestInProgress() {
	const p = MagicSchoolFindsAroundKitsuneGetQuestProgress();
	return p >= 0 && p < 9;
}

/**
 * Update the Kitsune NPC's quest status as it progresses
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryKitsuneQuestUpdate() {
	if (MagicSchoolFindsAroundKitsune == null) return;
	let Defeats = MagicSchoolFindsAroundKitsuneGetQuestProgress();
	// Quest already started, so set the state directly
	if (Defeats !== -1) MagicSchoolFindsAroundKitsune.Stage = "100";
	if (Defeats < 0) Defeats = 0;
	let MissingDefeats = 9 - Defeats;
	if (MissingDefeats !== 0) {
		MagicSchoolFindsAroundKitsune.CurrentDialog = DialogFind(MagicSchoolFindsAroundKitsune, "100").replace("LEFTDEFEATCOUNT", MissingDefeats.toString());
	} else {
		MagicSchoolFindsAroundKitsune.CurrentDialog = DialogFind(MagicSchoolFindsAroundKitsune, "CompleteQuestRelief");
	}
}

/**
 * Give player essence from defeated student
 * @param {string} Amount - The amount of essence to give
 * @returns {void} - Nothing
 */
function DialogKitsuneGiveEssence(Amount) {
	if (!CurrentCharacter) return;
	DialogRemove();
	PoseSetActive(CurrentCharacter, 'Kneel');
	const data = MagicSchoolFindsAroundGetData();
	data.KitsuneQuestProgress += CommonParseInt(Amount) ?? 0;
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	MagicSchoolLaboratoryKitsuneQuestUpdate();
}
