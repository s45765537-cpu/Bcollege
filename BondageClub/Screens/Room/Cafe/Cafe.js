"use strict";
var CafeBackground = "MaidCafe";
/** @type {NPCCharacter} */
var CafeMaid = /** @type {never} */ (null);
var CafeVibeIncreased = false;
var CafeEnergyDrinkPrice = 5;
var CafeGlassMilkPrice = 5;
var CafeCupcakePrice = 5;
/** @type {null | string} */
var CafeAskedFor = null;
var CafePrice = 0;

/**
 * CHecks, if the player can be served
 * @returns {boolean} - Returns true, if the player can be served, false otherwise
 */
function CafeMaidCanServe() { return (!CafeMaid.IsRestrained() && !Player.IsRestrained()); }

/**
 * Checks, if the maid from the cafe can serve the player
 * @returns {boolean} - Returns true, if the maid is able to serve, false otherwise
 */
function CafeMaidCannotServe() { return (CafeMaid.IsRestrained()); }

/**
 * Checks, if the player is able to consume a dring
 * @returns {boolean} - Returns true, if player and maid are unrestrained, false otherwise
 */
function CafePlayerCannotConsume() { return (!CafeMaid.IsRestrained() && Player.IsRestrained()); }

/**
 * CHecks, if the player has completed the only serving task
 * @returns {boolean} - Returns true, if the player is done, false otherwise
 */
function CafeOnlineDrinkCompleted() { return (MaidQuartersOnlineDrinkCount >= 5); }

/**
 * Checks, if the player is a head maid and gagged
 * @returns {boolean} - Returns true, if the player is a head maid and gagged
 */
function CafeIsGaggedHeadMaid() { return (!Player.CanTalk() && DialogIsHeadMaid() && !Player.IsBlind()); }

/**
 * Checks if the player is gagged and an experienced maid (reputation higher than 50)
 * @returns {boolean} - Returns true, if the player is gagged and a senior maid, false otherwise
 */
function CafeIsGaggedSeniorMaid() { return (!Player.CanTalk() && !DialogIsHeadMaid() && ReputationGet("Maid") >= 50 && !Player.IsBlind()); }

/**
 * Checks if the player is gagged and an ordinary maid
 * @returns {boolean} - Returns true if the player is gagged and an ordinary maid, false otherwise
 */
function CafeIsGaggedRookieMaid() { return (!Player.CanTalk() && !DialogIsHeadMaid() && ReputationGet("Maid") < 50 && !Player.IsBlind()); }

/**
 * Checks if the player is an experinced maid, but no head maid
 * @returns {boolean} - Returns true, if the player is no head maid and has a reputation of more than 50, false otherwise
 */
function CafeIsMaidChoice() { return (ReputationGet("Maid") >= 50 && !DialogIsHeadMaid()); }

/**
 * Checks, if the player is an ordinary maid
 * @returns {boolean} - Returns true if the player is no head maid and has a reputation of less than 50
 */
function CafeIsMaidNoChoice() { return (ReputationGet("Maid") < 50 && !DialogIsHeadMaid()); }

/**
 * Checks, if a dildo can be applied to the player
 * @returns {boolean} - Returns true, if a dildo can be applied, false otherwise
 */
function CafeCanDildo() { return (!Player.IsVulvaChaste() && InventoryGet(Player, "ItemVulva") == null); }

/**
 * Checks, if the player aked for a certain speciality
 * @param {string} Type - The type of cafe speciality
 * @returns {boolean} - Returns true, if the player asked for a given speciality, false otherwise
 */
function CafeEquired(Type) { return (Type == CafeAskedFor); }

/**
 * Returns TRUE if the player and the current character can play Club Card
 * @returns {boolean} - Returns TRUE if both aren't restrained
 */
function CafeCanPlayClubCard() { return (!Player.IsRestrained() && !CurrentCharacter?.IsRestrained() && !Player.IsGagged() && !CurrentCharacter?.IsGagged()); }

//
/**
 * Loads the Cafe room and initializes the NPCs. This function is called dynamically
 * @type {ScreenLoadHandler}
 */
async function CafeLoad() {
	CafeMaid = CharacterLoadNPC("NPC_Cafe_Maid");
	CafeMaid.AllowItem = DialogIsHeadMaid();
}

/**
 * Run the Cafe room and draw characters. This function is called dynamically at short intervals.
 * Don't use expensive loops or functions from here
 * @returns {void} - Nothing
 */
function CafeRun() {
	DrawCharacter(Player, 500, 0, 1);
	DrawCharacter(CafeMaid, 1000, 0, 1);
	if (Player.CanWalk()) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
}

/**
 * Handles the click events. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function CafeClick() {
	if (MouseIn(500, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (MouseIn(1000, 0, 500, 1000)) {
		if (MaidQuartersMaid != null) {
			if ((MaidQuartersMaid.Stage == "285" || MaidQuartersMaid.Stage == "286") && InventoryIsWorn(Player, "ItemMisc", ["WoodenMaidTrayFull", "WoodenMaidTray"])) {
				if (!CafeMaid.IsRestrained()) {
					CafeMaid.Stage = "100";
					CafeMaid.AllowItem = false;
				}
				else CafeMaid.Stage = "90";
			}
			else CafeMaid.Stage = "0";
		}
		CharacterSetCurrent(CafeMaid);
	}
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) CommonSetScreen("Room", "MainHall");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
}

/**
 * When the player asks for a special, she is told the price
 * @param {string} Item - The special the player asks for
 */
function CafeEquirePrice(Item) {
	CafeAskedFor = Item;
	if (CafeAskedFor == "EnergyDrink") CafePrice = CafeEnergyDrinkPrice;
	if (CafeAskedFor == "GlassMilk") CafePrice = CafeGlassMilkPrice;
	if (CafeAskedFor == "Cupcake") CafePrice = CafeCupcakePrice;
	CafeMaid.CurrentDialog = CafeMaid.CurrentDialog.replace("REPLACEMONEY", CafePrice.toString());

}

/**
 * The player consumes a speciality. The money is subtracted and the effect applied
 * @returns {void} - Nothing
 */
function CafeConsumeSpeciiality() {
	if (Player.Money < CafePrice)  {
		CafeMaid.CurrentDialog = DialogFind(CafeMaid, "NotEnoughMoney");
	}
	else {
		CharacterChangeMoney(Player, CafePrice * -1);
		const evasionModifier = SkillGetModifier(Player, "Evasion");
		const bondageModifier = SkillGetModifier(Player, "Bondage");
		const willpowerModifier = SkillGetModifier(Player, "Willpower");
		const lockpickModifier = SkillGetModifier(Player, "LockPicking");
		const SPECIAL_DRINK_DURATION = 3600000;

		if (CafeAskedFor == "EnergyDrink") {
			let success = SkillSetModifier(Player, "Evasion", evasionModifier + 1, SPECIAL_DRINK_DURATION);
			success = success && SkillSetModifier(Player, "Bondage", bondageModifier + 1, SPECIAL_DRINK_DURATION);
			if (!success) {
				CafeMaid.CurrentDialog = DialogFind(CafeMaid, "EnergyDrinkLimit");
			}
		}

		if (CafeAskedFor == "GlassMilk") {
			let success = SkillSetModifier(Player, "Evasion", evasionModifier - 2, SPECIAL_DRINK_DURATION);
			success = success && SkillSetModifier(Player, "Bondage", bondageModifier - 2, SPECIAL_DRINK_DURATION);
			if (!success) {
				CafeMaid.CurrentDialog = DialogFind(CafeMaid, "GlassMilkLimit");
			}
		}

		if (CafeAskedFor == "Cupcake") {
			let success = SkillSetModifier(Player, "LockPicking", lockpickModifier + 1, SPECIAL_DRINK_DURATION);
			success = success && SkillSetModifier(Player, "Willpower", willpowerModifier + 1, SPECIAL_DRINK_DURATION);
			if (!success) {
				CafeMaid.CurrentDialog = DialogFind(CafeMaid, "CupcakeLimit");
			}
		}
	}
}

/**
 * The cafe maid remove the player's gag
 */
function CafeUngagPlayer() {
	InventoryRemove(Player, "ItemMouth");
	InventoryRemove(Player, "ItemMouth2");
	InventoryRemove(Player, "ItemMouth3");
	InventoryRemove(Player, "ItemHead");
	InventoryRemove(Player, "ItemHood");
}

/**
 * The cafe maid applies chosen bondage
 * @param {"Shibari" | "Tape" | "Leather" | "Latex" | "Heavy"} Style - The style of bondage chosen by the player
 * @returns {void} - Nothing
 */
function CafeServiceBound(Style) {

	CharacterRelease(Player);

	if (Style == "Shibari") {

		// Base items
		let item = CommonGetRandomItemFromList(["NylonRope", "HempRope"]);
		InventoryWear(Player, item, "ItemArms", null, 20);
		InventoryWear(Player, item, "ItemLegs", null, 20);
		item = CommonGetRandomItemFromList(["ClothGag", "WiffleGag", "BambooGag", "ChopstickGag"]);
		const color = item === "ClothGag" ?
			/** @type {const} */ (`#${Math.floor(Math.random()*16777215).toString(16)}`)
			: undefined;
		InventoryWear(Player, item, "ItemMouth", color);

		// Gag Sub Types
		if (item == "ClothGag") {
			TypedItemSetRandomOption(Player, "ItemMouth");
		}
	}

	if (Style == "Tape") {

		// Base items
		const color = /** @type {const} */(`#${Math.floor(Math.random()*16777215).toString(16)}`);
		InventoryWear(Player, "DuctTape", "ItemArms", color, 15);
		InventoryWear(Player, "DuctTape", "ItemHands", color, 15);
		InventoryWear(Player, "DuctTape", "ItemLegs", color, 10);
		InventoryWear(Player, "DuctTape", "ItemMouth", color, 10);

		// Legs Sub Type
		TypedItemSetRandomOption(Player, "ItemLegs");

		// Gag Sub Type
		TypedItemSetRandomOption(Player, "ItemMouth");
	}

	if (Style == "Leather") {

		// Arms
		// RandomNumber = Math.floor(Math.random() * 3);
		let item = CommonGetRandomItemFromList(["LeatherArmbinder", "LeatherCuffs", "Bolero"]);
		InventoryWear(Player, item, "ItemArms", item === "Bolero" ? "#191919" : undefined, 15);

		if (item == "LeatherCuffs") {
			TypedItemSetRandomOption(Player, "ItemArms");
		}

		// Legs
		item = CommonGetRandomItemFromList(["LeatherBelt", "LeatherLegCuffs", "LegBinder"]);
		InventoryWear(Player, item, "ItemLegs", item === "LegBinder" ? "#111111" : undefined);

		if (item == "LeatherLegCuffs") {
			TypedItemSetOptionByName(Player, "ItemLegs", "Closed");
		}

		// Gag
		item = CommonGetRandomItemFromList(["HarnessBallGag", "HarnessPanelGag", "LeatherCorsetCollar", "PlugGag", "MuzzleGag"]);
		InventoryWear(Player, item, "ItemMouth", item === "MuzzleGag" ? "#292929" : undefined);

		// Locks
		InventoryFullLockRandom(Player, CafeMaid);
	}

	if (Style == "Latex") {

		let color = /** @type {const} */ (`#${Math.floor(Math.random()*16777215).toString(16)}`);

		// Arms
		let item = CommonGetRandomItemFromList(["StraitLeotard", "Bolero", "StraitDress", "StraitDressOpen"]);
		InventoryWear(Player, item, "ItemArms", color, 20);

		// Legs
		if (item == "Bolero" || item == "StraitLeotard") {
			item = CommonGetRandomItemFromList(["LegBinder", "HobbleSkirt"]);
			InventoryWear(Player, item, "ItemLegs", color);
		}

		// Gag
		item = CommonGetRandomItemFromList(["HarnessBallGag", "CarrotGag", "MuzzleGag", "LeatherCorsetCollar", "DildoGag", "PumpGag"]);
		InventoryWear(Player, item, "ItemMouth", color);

		if (item == "PumpGag") {
			TypedItemSetRandomOption(Player, "ItemMouth");
		}
	}

	if (Style == "Heavy") {

		// Arms
		let item = CommonGetRandomItemFromList(["LeatherArmbinder", "StraitJacket", "BitchSuit", "StraitDressOpen"]);
		let color = item === "BitchSuit" || item === "StraitDressOpen" ?
			/** @type {const} */ (`#${Math.floor(Math.random()*16777215).toString(16)}`)
			: undefined;
		InventoryWear(Player, item, "ItemArms", color, 20);

		if (item == "StraitJacket") {
			TypedItemSetRandomOption(Player, "ItemArms");
		}

		// Legs
		if (item !== "BitchSuit") {
			item = CommonGetRandomItemFromList(["LeatherLegCuffs", "LeatherBelt", "LegBinder", "HobbleSkirt"]);
			color = item === "LegBinder" || item === "HobbleSkirt" ?
				/** @type {const} */ (`#${Math.floor(Math.random()*16777215).toString(16)}`)
				: undefined;
			InventoryWear(Player, item, "ItemLegs", color);

			if (item == "LeatherLegCuffs") {
				TypedItemSetOptionByName(Player, "ItemLegs", "Closed");
			}
		}

		// Gag
		item = CommonGetRandomItemFromList(["HarnessPanelGag", "PumpGag", "MuzzleGag", "LeatherCorsetCollar", "PlugGag", "DildoGag", "HarnessBallGag1"]);
		InventoryWear(Player, item, "ItemMouth");

		if (item == "PumpGag") {
			TypedItemSetRandomOption(Player, "ItemMouth");
		}

		if (item == "PlugGag") {
			TypedItemSetRandomOption(Player, "ItemMouth");
		}

		// Head
		if (Math.random() >= 0.5) {
			item = CommonGetRandomItemFromList([
				"LeatherBlindfold",
				"StuddedBlindfold",
				"SmallBlindfold",
				"FullBlindfold",
			]);
			InventoryWear(Player, item, "ItemHead");
		} else {
			item = CommonGetRandomItemFromList([
				"LeatherHood",
				"LeatherHoodOpenEyes",
				"LeatherHoodOpenMouth",
				"LeatherHoodSensDep",
				"LeatherHoodSealed"
			]);
			InventoryWear(Player, item, "ItemHood");
		}

		// Locks
		InventoryFullLockRandom(Player, CafeMaid);
	}

	CharacterRefresh(Player);
	Player.FocusGroup = null;
}

/**
 * Make sure the player is bound securely for serving
 * @returns {void} - Nothing
 */
function CafeRamdomBound() {
	if (InventoryGet(Player, "ItemArms") == null) DialogWearRandomItem("ItemArms");
	if (InventoryGet(Player, "ItemLegs") == null) DialogWearRandomItem("ItemLegs");
	if (InventoryGet(Player, "ItemMouth") == null) DialogWearRandomItem("ItemMouth");
	InventorySetDifficulty(Player, "ItemArms", 17);
	CafeRefillTray();
}

/**
 * The maid re-stocks the player's serving tray
 * @returns {void} - Nothing
 */
function CafeRefillTray() {
	// bonus rep on refill if served enough
	if (MaidQuartersOnlineDrinkCount >= 4) ReputationProgress("Maid", 4);
	// top up equiverlant to basic pay for serving a tray + a small bonus
	MaidQuartersOnlineDrinkValue = MaidQuartersOnlineDrinkValue + (MaidQuartersOnlineDrinkCount * 3);
	// Refill try ready to serve again.
	MaidQuartersOnlineDrinkCount = 0;
	// Allow serving the previous customers again.
	MaidQuartersOnlineDrinkCustomer = [];
	// Make sure tray is not empty.
	InventoryWear(Player, "WoodenMaidTrayFull", "ItemMisc");
}

/**
 * The maid uses toy on the player
 * @returns {void} - Nothing
 */
function CafeGivenDildo() {
	InventoryWear(Player, "InflatableVibeDildo", "ItemVulva");
}

/**
 * Maid turns player's Vibe up to moderate
 * @returns {void} - Nothing
 */
function CafeTurnDildoUp() {
	const vibe = InventoryGet(Player, "ItemVulva");
	if (vibe) {
		ExtendedItemSetOptionByRecord(Player, vibe, { i: 2 }, { push: true });
	}
	CafeVibeIncreased = true;
}

/**
 * When the player starts a club card game
 * @returns {void} - Nothing
 */
function CafeClubCardStart() {
	if (!CurrentCharacter) return;
	ClubCardStart(CurrentCharacter, ClubCardBuilderMaidDeck, () => { CafeClubCardEnd(); });
}

/**
 * When the player ends a club card game
 * @returns {SafePromise<void>}
 */
async function CafeClubCardEnd() {
	await CommonSetScreen("Room", "Cafe");
	CharacterSetCurrent(CafeMaid);
	CafeMaid.CurrentDialog = DialogFind(CafeMaid, MiniGameVictory ? "ClubCardVictory" : "ClubCardDefeat");
	CafeMaid.AllowItem = MiniGameVictory;
	CafeMaid.Stage = MiniGameVictory ? "0" : "51";
	if (!MiniGameVictory) CharacterFullRandomRestrain(Player, "ALL", true);
}

/**
 * Sends the bound player back to the main hall
 * @returns {void} - Nothing
 */
function CafeClubCardMainHall() {
	CommonSetScreen("Room", "MainHall");
	DialogLeave();
}
