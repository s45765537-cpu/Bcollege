"use strict";
// Player entity
var KinkyDungeonPlayerEntity = null; // The current player entity

// Arousal -- It lowers your stamina regen
var KinkyDungeonStatMaxMax = 72; // Maximum any stat can get boosted to

var KinkyDungeonStatArousalMax = 36;
var KinkyDungeonArousalUnlockSuccessMod = 0.5; // Determines how much harder it is to insert a key while aroused. 1.0 is half success chance, 2.0 is one-third, etc.
var KinkyDungeonStatArousal = 0;
var KinkyDungeonStatArousalRegen = -0.5;
var KinkyDungeonStatArousalRegenStaminaRegenFactor = -0.1; // Stamina drain per time per 100 arousal
var KinkyDungeonStatArousalMiscastChance = 0.75; // Miscast chance at max arousal
var KinkyDungeonVibeLevel = 0;
var KinkyDungeonArousalPerVibe = 1; // How much arousal per turn per vibe energy cost
var KinkyDungeonVibeCostPerIntensity = 0.15;

var KinkyDungeonStatWillpowerExhaustion = 0;
var KinkyDungeonSleepTurns = 0;
// Note that things which increase max arousal (aphrodiasic) also increase the max stamina drain. This can end up being very dangerous as being edged at extremely high arousal will drain all your energy completely, forcing you to wait until the torment is over or the drugs wear off

// Stamina -- your MP. Used to cast spells and also struggle
var KinkyDungeonStatStaminaMax = 36;
var KinkyDungeonStatStamina = KinkyDungeonStatStaminaMax;
var KinkyDungeonStatStaminaRegen = 0;
var KinkyDungeonStatStaminaRegenSleep = 36/20;
var KinkyDungeonStatStaminaRegenWait = 0;
var KinkyDungeoNStatStaminaLow = 4;
var KinkyDungeonStatManaMax = 36;
var KinkyDungeonStatMana = KinkyDungeonStatManaMax;
var KinkyDungeonStatManaRate = 0;
var KinkyDungeonStatManaRegen = 0; // How fast stamina that is converted to mana regenerates
var KinkyDungeonStatManaLowRegen = 0.24; // How fast stamina that is converted to mana regenerates when low
var KinkyDungeonStatManaRegenLowThreshold = 1; // Threshold for fast mana regen
var KinkyDungeonStatStaminaRegenPerSlowLevel = -0.1; // It costs stamina to move while bound
var KinkyDungeonStatStaminaCostStruggle = -1; // It costs stamina to struggle
var KinkyDungeonStatStaminaCostTool = -0.1; // It costs stamina to pick or cut, but much less
var KinkyDungeonStatStaminaCostAttack = -0.1; // Cost to attack
var KinkyDungeonStaminaRate = KinkyDungeonStatStaminaRegen;

// Current Status
var KinkyDungeonStatBeltLevel = 0; // Chastity bra does not add belt level
var KinkyDungeonStatPlugLevel = 0; // Cumulative with front and rear plugs
var KinkyDungeonStatVibeLevel = 0; // Cumulative with diminishing returns for multiple items
var KinkyDungeonStatEdged = false; // If all vibrating effects are edging, then this will be true

var KinkyDungeonStatArousalGainChaste = -0.1; // Cumulative w/ groin and bra

// Restraint stats

var KinkyDungeonSlowLevel = 0; // Adds to the number of move points you need before you move
var KinkyDungeonMovePoints = 0;

var KinkyDungeonBlindLevelBase = 0; // Base, increased by buffs and such, set to 0 after consumed in UpdateStats
var KinkyDungeonBlindLevel = 0; // Blind level 1: -33% vision, blind level 2: -67% vision, Blind level 3: Vision radius = 1
var KinkyDungeonStatBlind = 0; // Used for temporary blindness
var KinkyDungeonDeaf = false; // Deafness reduces your vision radius to 0 if you are fully blind (blind level 3)

// Other stats
var KinkyDungeonGold = 0;
var KinkyDungeonLockpicks = 0;
// 3 types of keys, for 4 different types of padlocks. The last type of padlock requires all 3 types of keys to unlock
// The red keys are one-use only as the lock traps the key
// The green keys are multi-use, but jam often
// The blue keys cannot be picked or cut.
// Monsters are not dextrous enough to steal keys from your satchel, although they may spill your satchel on a nearby tile
var KinkyDungeonRedKeys = 0;
var KinkyDungeonBlueKeys = 0;
// Regular blades are used to cut soft restraints. Enchanted blades turn into regular blades after one use, and can cut magic items
// Some items are trapped with a curse, which will destroy the knife when cut, but otherwise still freeing you
var KinkyDungeonNormalBlades = 1;
var KinkyDungeonEnchantedBlades = 0;



// Combat
var KinkyDungeonTorsoGrabChance = 0.33;

// Your inventory contains items that are on you
var KinkyDungeonInventory = [];
var KinkyDungeonPlayerTags = [];

var KinkyDungeonCurrentDress = "Default";
var KinkyDungeonUndress = 0; // Level of undressedness

// Current list of spells
var KinkyDungeonSpells = [];
var KinkyDungeonPlayerBuffs = {};

// Current list of dresses
var KinkyDungeonDresses = {};

// Temp - for multiplayer in future
var KinkyDungeonPlayers = [];

// For items like the cursed collar which make more enemies appear
var KinkyDungeonDifficulty = 0;

function KinkyDungeonDefaultStats() {
	KinkyDungeonSetDress("Default");
	KinkyDungeonGold = 0;
	KinkyDungeonLockpicks = 1;
	KinkyDungeonRedKeys = 0;
	KinkyDungeonBlueKeys = 0;
	KinkyDungeonNormalBlades = 1;
	KinkyDungeonEnchantedBlades = 0;

	KinkyDungeonPlayerWeapon = null;

	KinkyDungeonStatArousalMax = 36;
	KinkyDungeonStatStaminaMax = 36;
	KinkyDungeonStatManaMax = 36;
	KinkyDungeonStaminaRate = KinkyDungeonStatStaminaRegen;

	KinkyDungeonStatArousal = 0;
	KinkyDungeonStatStamina = KinkyDungeonStatStaminaMax;
	KinkyDungeonStatMana = KinkyDungeonStatManaMax;

	KinkyDungeonMovePoints = 0;
	KinkyDungeonInventory = [];
	KinkyDungeonChangeConsumable(KinkyDungeonConsumables.PotionMana, 1);
	KinkyDungeonChangeConsumable(KinkyDungeonConsumables.PotionStamina, 1);
	KinkyDungeonChangeConsumable(KinkyDungeonConsumables.PotionFrigid, 1);
	KinkyDungeonInventoryAddWeapon("Knife");
	KinkyDungeonPlayerTags = [];

	KinkyDungeonPlayerDamage = KinkyDungeonPlayerDamageDefault;

	// Initialize all the other systems
	KinkyDungeonResetMagic();
	KinkyDungeonInitializeDresses();
	KinkyDungeonDressPlayer();
	KinkyDungeonShrineInit();
}

function KinkyDungeonGetVisionRadius() {
	return (KinkyDungeonSleepTurns > 2) ? 1 : (Math.max((KinkyDungeonDeaf || KinkyDungeonStatBlind > 0) ? 1 : (KinkyDungeonBlindLevel > 2) ? 2 : 3, Math.floor(KinkyDungeonMapBrightness*(1.0 - 0.33 * KinkyDungeonBlindLevel))));
}

function KinkyDungeonDealDamage(Damage) {
	let dmg = Damage.damage;
	let type = Damage.type;
	let arousalTypes = ["grope"];
	let staminaTypesWeak = ["electric", "grope"];
	let staminaTypesStrong = ["glue", "ice", "pain", "crush"];
	let manaTypesWeak = ["electric"];
	let manaTypesString = [];
	if (arousalTypes.includes(type)) {
		KinkyDungeonStatArousal += dmg;
	}
	if (staminaTypesStrong.includes(type)) {
		KinkyDungeonStatStamina -= dmg;
	} else if (staminaTypesWeak.includes(type)) {
		KinkyDungeonStatStamina -= dmg/2;
	}
	if (manaTypesString.includes(type)) {
		KinkyDungeonStatMana -= dmg;
	} else if (manaTypesWeak.includes(type)) {
		KinkyDungeonStatMana -= dmg/2;
	}
	KinkyDungeonSleepTurns = 0;

	return dmg;
}

function KinkyDungeonHasStamina(Cost, AddRate) {
	let s = KinkyDungeonStatStamina;
	if (AddRate) s += KinkyDungeonStaminaRate;

	return s >= Cost;
}
function KinkyDungeonHasMana(Cost, AddRate) {
	let s = KinkyDungeonStatMana;
	if (AddRate) s += KinkyDungeonStatManaRate;

	return s >= Cost;
}



function KinkyDungeonUpdateStats(delta) {
	KinkyDungeonPlayers = [KinkyDungeonPlayerEntity];
	// Initialize
	KinkyDungeonCalculateVibeLevel();
	KinkyDungeonDifficulty = 0;

	var arousalRate = (KinkyDungeonVibeLevel == 0) ? KinkyDungeonStatArousalRegen : (KinkyDungeonArousalPerVibe * KinkyDungeonVibeLevel);
	// Dont regen while exhausted
	if (KinkyDungeonStatWillpowerExhaustion > 0) {
		KinkyDungeonStatWillpowerExhaustion = Math.max(0, KinkyDungeonStatWillpowerExhaustion - delta);
		KinkyDungeonStaminaRate = 0;
		KinkyDungeonStatManaRate = 0;
	} else {
		KinkyDungeonStaminaRate = KinkyDungeonSleepTurns > 0 ? KinkyDungeonStatStaminaRegenSleep : KinkyDungeonStatStaminaRegen;
		KinkyDungeonStatManaRate = (KinkyDungeonStatMana < KinkyDungeonStatManaRegenLowThreshold) ? KinkyDungeonStatManaLowRegen : KinkyDungeonStatManaRegen;
	}

	// Arousal reduces staminal regen
	KinkyDungeonStaminaRate += KinkyDungeonStatArousal / 100 * KinkyDungeonStatArousalRegenStaminaRegenFactor;

	// Update the player tags based on the player's groups
	KinkyDungeonPlayerTags = KinkyDungeonUpdateRestraints(delta);

	KinkyDungeonBlindLevel = Math.max(KinkyDungeonBlindLevelBase, KinkyDungeonPlayer.GetBlindLevel());
	if (KinkyDungeonStatBlind > 0) KinkyDungeonBlindLevel = 3;
	KinkyDungeonDeaf = KinkyDungeonPlayer.IsDeaf();

	// Slowness calculation
	KinkyDungeonCalculateSlowLevel();

	// Unarmed damage calc
	KinkyDungeonPlayerDamage = KinkyDungeonGetPlayerWeaponDamage(!InventoryItemHasEffect(InventoryGet(KinkyDungeonPlayer, "ItemHands"), "Block", true) && !InventoryGroupIsBlockedForCharacter(KinkyDungeonPlayer, "ItemHands"));

	if (!KinkyDungeonPlayer.CanInteract()) {
		KinkyDungeonPlayerDamage.chance /= 2;
	}
	if (!KinkyDungeonPlayer.CanWalk() && KinkyDungeonPlayerDamage.unarmed) {
		KinkyDungeonPlayerDamage.dmg /= 2;
	}
	if (KinkyDungeonPlayer.Pose.includes("Hogtied") || KinkyDungeonPlayer.Pose.includes("Kneel")) {
		KinkyDungeonPlayerDamage.chance /= 1.5;
	}

	KinkyDungeonUpdateStruggleGroups();

	KinkyDungeonDressPlayer();

	// Cap off the values between 0 and maximum
	KinkyDungeonStatArousal += arousalRate*delta;
	KinkyDungeonStatStamina += KinkyDungeonStaminaRate*delta;
	KinkyDungeonStatMana += KinkyDungeonStatManaRate;
	KinkyDungeonStatBlind = Math.max(0, KinkyDungeonStatBlind - delta);

	KinkyDungeonCapStats();

	for (let item of KinkyDungeonInventory) {
		if (item.restraint) {
			if (item.restraint.difficultyBonus) {
				KinkyDungeonDifficulty += item.restraint.difficultyBonus;
			}
		}
	}

}

function KinkyDungeonCapStats() {
	KinkyDungeonStatArousal = Math.max(0, Math.min(KinkyDungeonStatArousal, KinkyDungeonStatArousalMax));
	KinkyDungeonStatStamina = Math.max(0, Math.min(KinkyDungeonStatStamina, KinkyDungeonStatStaminaMax));
	KinkyDungeonStatMana = Math.max(0, Math.min(KinkyDungeonStatMana, KinkyDungeonStatManaMax));
}

function KinkyDungeonCalculateVibeLevel() {
	let oldVibe = KinkyDungeonVibeLevel;
	KinkyDungeonVibeLevel = 0;
	for (let I = 0; I < KinkyDungeonInventory.length; I++) {
		if (KinkyDungeonInventory[I] && KinkyDungeonInventory[I].restraint && KinkyDungeonInventory[I].restraint.intensity) {
			let vibe = KinkyDungeonInventory[I].restraint;
			let drain = vibe.battery - Math.max(0, vibe.battery - KinkyDungeonVibeCostPerIntensity * vibe.intensity);
			if (drain > 0)
				KinkyDungeonVibeLevel = Math.max(KinkyDungeonVibeLevel + drain/4, drain);

			vibe.battery = Math.max(0, vibe.battery - drain);
		}
	}

	if (oldVibe > 0 && KinkyDungeonVibeLevel == 0) {
		if (!KinkyDungeonSendTextMessage(2, TextGet("KinkyDungeonEndVibe"), "#FFaadd", 2)) KinkyDungeonSendActionMessage(2, TextGet("KinkyDungeonEndVibe"), "#FFaadd", 2);
	}

	if (KinkyDungeonVibeLevel > 0) {
		KinkyDungeonSendTextMessage(0, TextGet("KinkyDungeonVibing" + Math.max(0, Math.min(Math.floor(KinkyDungeonVibeLevel), 4))), "#FFaadd", 1);
	}
}

function KinkyDungeonCanOrgasm() {
	for (let I = 0; I < KinkyDungeonInventory.length; I++) {
		if (KinkyDungeonInventory[I] && KinkyDungeonInventory[I].restraint && KinkyDungeonInventory[I].restraint.orgasm) {
			return true;
		}
	}
	return false;
}

function KinkyDungeonCalculateSlowLevel() {
	KinkyDungeonSlowLevel = 0;
	if (KinkyDungeonPlayer.IsMounted() || KinkyDungeonPlayer.Effect.indexOf("Tethered") >= 0 || KinkyDungeonPlayer.IsEnclose()) {KinkyDungeonSlowLevel = 100; KinkyDungeonMovePoints = 0;}
	else {
		let boots = KinkyDungeonGetRestraintItem("ItemBoots");
		if (InventoryItemHasEffect(InventoryGet(KinkyDungeonPlayer, "ItemLegs"), "Block", true) || InventoryItemHasEffect(InventoryGet(KinkyDungeonPlayer, "ItemLegs"), "KneelFreeze", true)) KinkyDungeonSlowLevel += 1.0;
		if (InventoryItemHasEffect(InventoryGet(KinkyDungeonPlayer, "ItemFeet"), "Block", true) || InventoryItemHasEffect(InventoryGet(KinkyDungeonPlayer, "ItemFeet"), "Freeze", true) || InventoryItemHasEffect(InventoryGet(KinkyDungeonPlayer, "ItemFeet"), "Slow", true)) KinkyDungeonSlowLevel += 1;
		if (boots && boots.restraint && boots.restraint.slowboots) KinkyDungeonSlowLevel += 1.0;
		if (KinkyDungeonStatStamina < 0.5) KinkyDungeonSlowLevel = Math.max(3, KinkyDungeonSlowLevel + 2);
		if (KinkyDungeonPlayer.Pose.includes("Kneel")) KinkyDungeonSlowLevel = Math.max(3, KinkyDungeonSlowLevel + 1);
		if (KinkyDungeonPlayer.Pose.includes("Hogtied")) KinkyDungeonSlowLevel = Math.max(5, KinkyDungeonSlowLevel + 1);


		for (let I = 0; I < KinkyDungeonInventory.length; I++) {
			if (KinkyDungeonInventory[I] && KinkyDungeonInventory[I].restraint && KinkyDungeonInventory[I].restraint.freeze) {
				KinkyDungeonSlowLevel = 100;
			}
		}
	}
}
