"use strict";
var MagicSchoolFindsAroundBackground = "ForestPath";
/** @type {NPCCharacter} */
// This cursed thing is because I can't use @ts-expect-error here, as non-strict TS flags it
// but not doing that causes 30 strictness errors
var MagicSchoolFindsAroundKitsune = /** @type {NPCCharacter} */ (/** @type {unknown} */ (null));
var MagicSchoolFindsAroundSpellCount = 0;
var MagicSchoolFindsAroundLastSpell = "";

/**
 * Uncompress a string containing an appearance, then applies that appearance data to the NPC
 * @param {NPCCharacter} C - The NPC character that loads its new appearance
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundPrepareFoundNPC(C) {

	CharacterNaked(C, false);
	CharacterRelease(C, false);

	// BASE APPEARANCE
	InventoryWear(C, "EchoV2", "BodyStyle", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "Eyebrows1", "Eyebrows", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "NoEars", "Head", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "Large", "BodyLower", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "Normal", "BodyUpper", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "H0970", "Height", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "Full", "Mouth", "#520808", undefined, undefined, undefined, false);
	InventoryWear(C, "HairBack75", "HairBack", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "HairFront9", "HairFront", "#1F1F1F", undefined, undefined, undefined, false);
	InventoryWear(C, "Eyes14", "Eyes",  ["Default", "#AB1633", "#4B4B4B", "Default", "#FFFFFF", "#000000"], undefined, undefined, undefined, false);
	InventoryWear(C, "Eyes14", "Eyes2", ["Default", "#AB1633", "#4B4B4B", "Default", "#FFFFFF", "#000000"], undefined, undefined, undefined, false);

	// ACCESSORIES / CLOTHING
	InventoryWear(C, "SunstripePanties1", "Panties", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "ChineseBra1", "Bra", "#0c0c0c", undefined, undefined, undefined, false);
	InventoryWear(C, "LongFishnets", "SuitLower", "#252525", undefined, undefined, undefined, false);
	InventoryWear(C, "ElegantSkirt", "ClothLower", ["#000000", "Default"], undefined, undefined, undefined, false);
	InventoryWear(C, "Pantyhose1", "Socks", "#010101", undefined, undefined, undefined, false);
	InventoryWear(C, "HaremStockings", "SocksRight", ["#370F0F", "#585858"], undefined, undefined, undefined, false);
	InventoryWear(C, "HaremStockings", "SocksLeft", ["Default", "#515151"], undefined, undefined, undefined, false);
	InventoryWear(C, "Ribbon", "AnkletRight", "#CECECE", undefined, undefined, undefined, false);
	InventoryWear(C, "Ribbon", "AnkletLeft", "#CECECE", undefined, undefined, undefined, false);
	InventoryWear(C, "Geta", "Shoes", ["#430D0D", "#D8D8D8"], undefined, undefined, undefined, false);
	InventoryWear(C, "Band2", "Hat", "#414141", undefined, undefined, undefined, false);
	InventoryWear(C, "RosePendant", "Necklace", ["#1E1E1E", "#820202"], undefined, undefined, undefined, false);
	InventoryWear(C, "KitsuneTailStraps", "TailStraps", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "FaceVeil", "Mask", ["#2A2A2A", "#141414"], undefined, undefined, undefined, false);
	InventoryWear(C, "SmallBlurred", "EyeShadow", "#8E2C40", undefined, undefined, undefined, false);
	InventoryWear(C,"CustomizableFluffyEars2","HairAccessory2", ["#262626", "#1F1D1D", "#AE2F2F", "#3B0E0E", ...Array(25).fill("Default")], undefined, undefined, undefined, false);

	// GLOVES
	const gloves = InventoryWear(C, "HaremGlove", "Gloves", ["Default", "#A2A2A2"], undefined, undefined, undefined, false);
	if (gloves) {
		gloves.Property ??= {};
		Object.assign(gloves.Property, { OverridePriority: { Bands: 33, Fabric: 0 } });
	}

	// HAND ACCESSORY
	const rings = InventoryWear(C,"Rings","HandAccessoryRight", ["Default","Default","Default","Default","#A48537","Default","#707070","#00D307","#222222","#CC3333","#222222","#CC3333"], undefined, undefined, undefined, false);
	if (rings) {
		rings.Property ??= {};
		Object.assign(rings.Property, { TypeRecord: { r: 1, t: 1 }, OverridePriority: 34 });
	}

	// MAIN CLOTH
	const cloth = InventoryWear(C,"EveningGown","Cloth",["#681111", "Default", "Default", "#FFFFFF"],undefined,undefined,undefined,false);
	if (cloth) {
		cloth.Property ??= {};
		Object.assign(cloth.Property, { Opacity: [0,1,0,0], OverridePriority: { Back: 0, Bottom: 0, Silk: 0 } });
	}

	// GARTERS
	const garters = InventoryWear(C,"ComboBelt","Garters",["#DD8B8B", "#AEAEAE", "#080808"],undefined,undefined,undefined,false);
	if (garters) {
		garters.Property ??= {};
		Object.assign(garters.Property, { OverridePriority: { Belt: 17, Detail: 11 }, TypeRecord: { c: 1 } });
	}

	CharacterRefresh(C);
}

/**
 * Loads the magic school finds around screen and the NPC
 * @type {ScreenLoadHandler}
 */
async function MagicSchoolFindsAroundLoad() {
	if (MagicSchoolFindsAroundKitsune == null) {
		MagicSchoolFindsAroundKitsune = CharacterLoadNPC("NPC_MagicSchoolFindsAround_Kitsune");
		MagicSchoolFindsAroundPrepareFoundNPC(MagicSchoolFindsAroundKitsune);
		MagicSchoolFindsAroundKitsune.LabelColor = "#4E1313";
		MagicSchoolFindsAroundKitsune.AllowItem = false;
		MagicSchoolFindsAroundKitsune.Name = "Daji";
		MagicSchoolFindsAroundKitsune.Stage = "0";
		delete MagicSchoolFindsAroundKitsune.FixedImage;
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
function MagicSchoolFindsAroundLearnAboutPrizes() {}

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
	MagicSchoolFindsAroundGiveTails();
	MagicSchoolFindsAroundKitsune.Name = "";
	MagicSchoolFindsAroundKitsune.FixedImage = "Screens/Room/MovieStudio/Empty.png";
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
	if (!MagicSchoolFindsAroundQuestStarted()) return;
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
