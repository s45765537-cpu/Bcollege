"use strict";
var KinkyDungeonStruggleGroups = [];
var KinkyDungeonStruggleGroupsBase = [
	"ItemHead",
	"ItemHood",
	"ItemM",
	"ItemEars",
	"ItemArms",
	"ItemNeck",
	"ItemHands",
	"ItemBreast",
	"ItemNipples",
	"ItemNipplesPiercings",
	"ItemPelvis",
	"ItemTorso",
	"ItemLegs",
	"ItemButt",
	"ItemVulva",
	"ItemVulvaPiercings",
	"ItemFeet",
	"ItemBoots",
];
var KinkyDungeonDrawStruggle = true;
var KinkyDungeonDrawState = "Game";
var KinkyDungeonSpellValid = false;
var KinkyDungeonCamX = 0;
var KinkyDungeonCamY = 0;
var KinkyDungeonTargetX = 0;
var KinkyDungeonTargetY = 0;
var KinkyDungeonLastDraw = 0;
var KinkyDungeonDrawDelta = 0;

const KinkyDungeonLastChatTimeout = 10000;

var KinkyDungeonStatBarHeight = 100;

function KinkyDungeonDrawInputs() {
	// Draw the struggle buttons if applicable
	if (KinkyDungeonDrawStruggle && KinkyDungeonStruggleGroups)
		for (let S = 0; S < KinkyDungeonStruggleGroups.length; S++) {
			let sg = KinkyDungeonStruggleGroups[S];
			let ButtonWidth = 60;
			let x = 5 + ((!sg.left) ? (490 - ButtonWidth) : 0);
			let y = 42 + sg.y * (ButtonWidth + 46);

			if (sg.left) {
				MainCanvas.textAlign = "left";
			} else {
				MainCanvas.textAlign = "right";
			}

			let color = "white";
			let locktext = "";
			if (KinkyDungeonPlayer.IsBlind() < 1) {
				if (sg.lock == "Red") {color = "#ff8888"; locktext = TextGet("KinkyRedLockAbr");}
				if (sg.lock == "Blue") {color = "#8888FF"; locktext = TextGet("KinkyBlueLockAbr");}
			} else color = "#888888";

			let GroupText = sg.name ? ("Restraint" + sg.name) : ("KinkyDungeonGroup"+ sg.group); // The name of the group to draw.

			DrawText(TextGet(GroupText) + locktext, x + ((!sg.left) ? ButtonWidth : 0), y-24, color, "black");
			MainCanvas.textAlign = "center";

			let i = 1;
			DrawButton(x, y, ButtonWidth, ButtonWidth, "", "White", KinkyDungeonRootDirectory + "Struggle.png", "");
			if (!sg.blocked) {
				let toolSprite = (sg.lock != "") ? ((sg.lock != "Jammed") ? "Key" : "LockJam") : "Buckle";
				DrawButton(x + ((!sg.left) ? -(ButtonWidth)*i : (ButtonWidth)*i), y, ButtonWidth, ButtonWidth, "", "White", KinkyDungeonRootDirectory + toolSprite + ".png", ""); i++;
				if (KinkyDungeonLockpicks > 0 && sg.lock != "") {DrawButton(x + ((!sg.left) ? -(ButtonWidth)*i : (ButtonWidth)*i), y, ButtonWidth, ButtonWidth, "", "White", KinkyDungeonRootDirectory + "UseTool.png", ""); i++;}
				if (KinkyDungeonNormalBlades > 0 || KinkyDungeonEnchantedBlades > 0) {DrawButton(x + ((!sg.left) ? -(ButtonWidth)*i : (ButtonWidth)*i), y, ButtonWidth, ButtonWidth, "", "White", KinkyDungeonRootDirectory + "Cut.png", ""); i++;}
			}
		}

	if (KinkyDungeonStruggleGroups.length > 0) {
		if (KinkyDungeonDrawStruggle) DrawButton(510, 925, 120, 60, "", "White", KinkyDungeonRootDirectory + "HideTrue.png", "");
		else DrawButton(510, 925, 120, 60, "", "White", KinkyDungeonRootDirectory + "HideFalse.png", "");
	}

	if (KinkyDungeonTargetTile) {
		if (KinkyDungeonTargetTile.Type == "Lock") {
			let action = false;
			if (KinkyDungeonLockpicks > 0) {
				DrawButton(963, 825, 112, 60, TextGet("KinkyDungeonPickDoor"), "White", "", "");
				action = true;
			}

			if ((KinkyDungeonTargetTile.Lock.includes("Red") && KinkyDungeonRedKeys > 0) || (KinkyDungeonTargetTile.Lock.includes("Blue") && KinkyDungeonBlueKeys > 0)) {
				DrawButton(825, 825, 112, 60, TextGet("KinkyDungeonUnlockDoor"), "White", "", "");
				action = true;
			}

			if (!action) DrawText(TextGet("KinkyDungeonLockedDoor"), 950, 850, "white", "silver");

			if (KinkyDungeonTargetTile.Lock.includes("Red"))
				DrawText(TextGet("KinkyRedLock"), 675, 850, "white", "silver");
			else if (KinkyDungeonTargetTile.Lock.includes("Blue"))
				DrawText(TextGet("KinkyBlueLock"), 675, 850, "white", "silver");
		} else if (KinkyDungeonTargetTile.Type == "Shrine") {
			KinkyDungeonDrawShrine();
		} else if (KinkyDungeonTargetTile.Type == "Door") {
			DrawButton(675, 825, 350, 60, TextGet("KinkyDungeonCloseDoor"), "White");
		}
	}

	DrawButton(650, 925, 250, 60, TextGet("KinkyDungeonInventory"), "White", "", "");
	DrawButton(925, 925, 250, 60, TextGet("KinkyDungeonMagic"), "White", "", "");

	if (KinkyDungeonSpells[KinkyDungeonSpellChoices[0]]) {
		let spell = KinkyDungeonSpells[KinkyDungeonSpellChoices[0]];
		DrawText(TextGet("KinkyDungeonSpell"+ spell.name), 1275, 835, "white", "silver");
		DrawText(spell.manacost+ TextGet("KinkyDungeonManaCost"), 1275, 870, "#55AAFF", "silver");
		DrawButton(1230, 895, 90, 90, "", "White", KinkyDungeonRootDirectory + "Spell1.png", "");
	}
	if (KinkyDungeonSpells[KinkyDungeonSpellChoices[1]]) {
		let spell = KinkyDungeonSpells[KinkyDungeonSpellChoices[1]];
		DrawText(TextGet("KinkyDungeonSpell"+ spell.name), 1525, 835, "white", "silver");
		DrawText(spell.manacost+ TextGet("KinkyDungeonManaCost"), 1525, 870, "#55AAFF", "silver");
		DrawButton(1480, 895, 90, 90, "", "White", KinkyDungeonRootDirectory + "Spell2.png", "");
	}
	if (KinkyDungeonSpells[KinkyDungeonSpellChoices[2]]) {
		let spell = KinkyDungeonSpells[KinkyDungeonSpellChoices[2]];
		DrawText(TextGet("KinkyDungeonSpell"+ spell.name), 1775, 835, "white", "silver");
		DrawText(spell.manacost+ TextGet("KinkyDungeonManaCost"), 1775, 870, "#55AAFF", "silver");
		DrawButton(1730, 895, 90, 90, "", "White", KinkyDungeonRootDirectory + "Spell3.png", "");
	}

	KinkyDungeonMultiplayerUpdate(KinkyDungeonNextDataSendTimeDelayPing);

}

function KinkyDungeonDrawProgress(x, y, amount, maxWidth, sprite) {
	let iconCount = 6;
	let scale = maxWidth / (72 * iconCount);
	let interval = 1/iconCount;
	let numIcons = amount / interval;
	for (let icon = 0; icon < numIcons && numIcons > 0; icon += 1) {
		DrawImageZoomCanvas(KinkyDungeonRootDirectory + "Icons/" + sprite + ((icon + 0.5 <= numIcons) ? "Full.png" : "Half.png"), MainCanvas, 0, 0, 72, 72, x + 72 * scale * icon, y, 72*scale, 72*scale, false);
	}
}

function KinkyDungeonDrawStats(x, y, width, heightPerBar) {
	// Draw labels
	let buttonWidth = 48;
	if (KinkyDungeonStatArousal > 0) {
		DrawText(TextGet("StatArousal").replace("MAX", KinkyDungeonStatArousalMax + "").replace("CURRENT", Math.floor(KinkyDungeonStatArousal) + ""), x+width/2 + buttonWidth, y + 25, (KinkyDungeonStatArousal < 100) ? "white" : "pink", "silver");
		if (KinkyDungeonStatArousal > 0 && KinkyDungeonItemCount("PotionFrigid"))
			DrawButton(x, y, buttonWidth, buttonWidth, "", "Pink", KinkyDungeonRootDirectory + "UsePotion.png", "");
	}
	DrawText(TextGet("StatStamina").replace("MAX", KinkyDungeonStatStaminaMax + "").replace("CURRENT", Math.floor(KinkyDungeonStatStamina) + ""), x+width/2 + buttonWidth, y + 25 + heightPerBar, (KinkyDungeonStatStamina > 0.5) ? "white" : "pink", "silver");
	if (KinkyDungeonStatStamina < KinkyDungeonStatStaminaMax && KinkyDungeonItemCount("PotionStamina"))
		DrawButton(x, y+heightPerBar, buttonWidth, buttonWidth, "", "#AAFFAA", KinkyDungeonRootDirectory + "UsePotion.png", "");
	DrawText(TextGet("StatMana").replace("MAX", KinkyDungeonStatManaMax + "").replace("CURRENT", Math.floor(KinkyDungeonStatMana) + ""), x+width/2 + buttonWidth, y + 25 + heightPerBar * 2, (KinkyDungeonStatMana > 0.5) ? "white" : "pink", "silver");
	if (KinkyDungeonStatMana < KinkyDungeonStatManaMax && KinkyDungeonItemCount("PotionMana"))
		DrawButton(x, y+2*heightPerBar, buttonWidth, buttonWidth, "", "#AAAAFF", KinkyDungeonRootDirectory + "UsePotion.png", "");

	let maxVisual = KinkyDungeonStatMaxMax;
	// Draw arousal
	if (KinkyDungeonStatArousal > 0)
		KinkyDungeonDrawProgress(x, y + heightPerBar*0.5, KinkyDungeonStatArousal/maxVisual, width, "Heart");

	// Draw Stamina/Mana
	KinkyDungeonDrawProgress(x, y + heightPerBar*1.5, KinkyDungeonStatStamina/maxVisual, width, "Stamina");
	KinkyDungeonDrawProgress(x, y + heightPerBar*2.5, KinkyDungeonStatMana/maxVisual, width, "Mana");

	DrawButton(x, y+3*heightPerBar, 250, 50, TextGet("KinkyDungeonSleep"), "White");

	var i = 3.5;
	DrawText(TextGet("CurrentGold") + KinkyDungeonGold, x+width/2, y + 25 + i * heightPerBar, "white", "silver"); i+= 0.5;
	DrawText(TextGet("CurrentLockpicks") + KinkyDungeonLockpicks, x+width/2, y + 25 + i * heightPerBar, "white", "silver"); i+= 0.5;
	DrawText(TextGet("CurrentKnife") + KinkyDungeonNormalBlades, x+width/2, y + 25 + i * heightPerBar, "white", "silver"); i+= 0.5;

	if (KinkyDungeonEnchantedBlades > 0) {DrawText(TextGet("CurrentKnifeMagic") + KinkyDungeonEnchantedBlades, x+width/2, y + 25 + i * heightPerBar, "white", "silver"); i+= 0.5;}
	if (KinkyDungeonRedKeys > 0) {DrawText(TextGet("CurrentKeyRed") + KinkyDungeonRedKeys, x+width/2, y + 25 + i * heightPerBar, "white", "silver"); i+= 0.5;}
	if (KinkyDungeonBlueKeys > 0) {DrawText(TextGet("CurrentKeyBlue") + KinkyDungeonBlueKeys, x+width/2, y + 25 + i * heightPerBar, "white", "silver"); i+= 0.5;}
}

function KinkyDungeonHandleHUD() {
	let buttonWidth = 48;
	if (KinkyDungeonDrawState == "Game") {
		if (MouseIn(canvasOffsetX, canvasOffsetY, KinkyDungeonCanvas.width, KinkyDungeonCanvas.height))
			KinkyDungeonSetTargetLocation();

		if (MouseIn(650, 925, 250, 60)) { KinkyDungeonDrawState = "Inventory"; return true;}
		else
		if (MouseIn(925, 925, 250, 60)) { KinkyDungeonDrawState = "Magic"; return true;}
		else if (MouseIn(510, 925, 120, 60)) { KinkyDungeonDrawStruggle = !KinkyDungeonDrawStruggle; return true;}

		if (!KinkyDungeonTargetingSpell) {
			if (KinkyDungeonHandleSpell()) return true;
			KinkyDungeonSpellPress = 0;
		} else {
			KinkyDungeonSpellPress = 0;
		}

		if (KinkyDungeonTargetTile) {
			if (KinkyDungeonTargetTile.Type && KinkyDungeonTargetTile.Type == "Lock") {
				if (KinkyDungeonLockpicks > 0 && MouseIn(963, 825, 112, 60)) {
					KinkyDungeonAdvanceTime(1, true);
					if (KinkyDungeonPickAttempt()) {
						KinkyDungeonTargetTile = null;
						delete KinkyDungeonTiles[KinkyDungeonTargetTileLocation];
					}
					KinkyDungeonMultiplayerUpdate(KinkyDungeonNextDataSendTimeDelay);
					return true;
				}

				if (((KinkyDungeonTargetTile.Lock.includes("Red") && KinkyDungeonRedKeys > 0) || (KinkyDungeonTargetTile.Lock.includes("Yellow") && (KinkyDungeonRedKeys > 0)
					|| (KinkyDungeonTargetTile.Lock.includes("Blue") && KinkyDungeonBlueKeys > 0) )) && MouseIn(825, 825, 112, 60)) {
					KinkyDungeonAdvanceTime(1, true);
					if (KinkyDungeonUnlockAttempt(KinkyDungeonTargetTile.Lock)) {
						KinkyDungeonTargetTile = null;
						delete KinkyDungeonTiles[KinkyDungeonTargetTileLocation];
					}
					KinkyDungeonMultiplayerUpdate(KinkyDungeonNextDataSendTimeDelay);
					return true;
				}
			} else if (KinkyDungeonTargetTile.Type == "Shrine") {
				KinkyDungeonHandleShrine();

			} else if (KinkyDungeonTargetTile.Type == "Door") {
				if (MouseIn(675, 825, 350, 60)) {
					KinkyDungeonAdvanceTime(1, true);
					KinkyDungeonTargetTile = null;
					let x = KinkyDungeonTargetTileLocation.split(',')[0];
					let y = KinkyDungeonTargetTileLocation.split(',')[1];
					KinkyDungeonMapSet(parseInt(x), parseInt(y), "D");
					KinkyDungeonSendActionMessage(3, TextGet("KinkyDungeonCloseDoorDone"), "white", 1);
					KinkyDungeonMultiplayerUpdate(KinkyDungeonNextDataSendTimeDelay);
					return true;
				}
			}
		}

		if (KinkyDungeonStruggleGroups)
			for (let S = 0; S < KinkyDungeonStruggleGroups.length; S++) {
				let sg = KinkyDungeonStruggleGroups[S];
				let ButtonWidth = 60;
				let x = 5 + ((!sg.left) ? (490 - ButtonWidth) : 0);
				let y = 42 + sg.y * (ButtonWidth + 46);

				let i = 0;
				if (MouseIn(x + ((!sg.left) ? -(ButtonWidth)*i : (ButtonWidth)*i), y, ButtonWidth, ButtonWidth)) {KinkyDungeonStruggle(sg, "Struggle"); return true;} i++;
				if (!sg.blocked) {
					if (MouseIn(x + ((!sg.left) ? -(ButtonWidth)*i : (ButtonWidth)*i), y, ButtonWidth, ButtonWidth) && sg.lock != "Jammed") {KinkyDungeonStruggle(sg, (sg.lock != "") ? "Unlock" : "Remove"); return true;} i++;
					if (KinkyDungeonLockpicks > 0 && sg.lock != "")
					{if (MouseIn(x + ((!sg.left) ? -(ButtonWidth)*i : (ButtonWidth)*i), y, ButtonWidth, ButtonWidth)) {KinkyDungeonStruggle(sg, "Pick"); return true;} i++;}
					if (KinkyDungeonNormalBlades > 0 || KinkyDungeonEnchantedBlades > 0)
					{if (MouseIn(x + ((!sg.left) ? -(ButtonWidth)*i : (ButtonWidth)*i), y, ButtonWidth, ButtonWidth)) {KinkyDungeonStruggle(sg, "Cut"); return true;} i++;}
				}
			}

		let xxx = canvasOffsetX + KinkyDungeonCanvas.width+10;
		let yyy = canvasOffsetY;
		if (MouseIn(xxx, yyy + 0 * KinkyDungeonStatBarHeight, buttonWidth, buttonWidth) && KinkyDungeonItemCount("PotionFrigid") && KinkyDungeonStatArousal > 0) {
			KinkyDungeonUseConsumable("PotionFrigid", 1);
		} else if (MouseIn(xxx, yyy + 1 * KinkyDungeonStatBarHeight, buttonWidth, buttonWidth) && KinkyDungeonItemCount("PotionStamina") && KinkyDungeonStatStamina < KinkyDungeonStatStaminaMax) {
			KinkyDungeonUseConsumable("PotionStamina", 1);
		} else if (MouseIn(xxx, yyy + 2 * KinkyDungeonStatBarHeight, buttonWidth, buttonWidth) && KinkyDungeonItemCount("PotionMana") && KinkyDungeonStatMana < KinkyDungeonStatManaMax) {
			KinkyDungeonUseConsumable("PotionMana", 1);
		} else if (MouseIn(xxx, yyy + 3 * KinkyDungeonStatBarHeight, 250, 50)) {
			KinkyDungeonSleepTurns = 20;
		}
	} else if (KinkyDungeonDrawState == "Magic") {
		if (MouseIn(925, 925, 250, 60)) { KinkyDungeonDrawState = "Game"; return true;}
		else return KinkyDungeonHandleMagic();
	} else if (KinkyDungeonDrawState == "Inventory") {
		if (MouseIn(650, 925, 250, 60)) { KinkyDungeonDrawState = "Game"; return true;}
		else return KinkyDungeonHandleInventory();
	} else if (KinkyDungeonDrawState == "Lore") {
		if (MouseIn(650, 925, 250, 60)) { KinkyDungeonDrawState = "Game"; return true;}
		else return KinkyDungeonHandleLore();
	}

	return false;
}


function KinkyDungeonUpdateStruggleGroups() {
	let struggleGroups = KinkyDungeonStruggleGroupsBase;
	KinkyDungeonStruggleGroups = [];

	for (let S = 0; S < struggleGroups.length; S++) {
		let sg = struggleGroups[S];
		let Group = sg;
		if (sg == "ItemM") {
			if (InventoryGet(KinkyDungeonPlayer, "ItemMouth3")) Group = "ItemMouth3";
			else if (InventoryGet(KinkyDungeonPlayer, "ItemMouth2")) Group = "ItemMouth2";
			else Group = "ItemMouth";
		}

		let restraint = KinkyDungeonGetRestraintItem(Group);

		if (restraint) {
			KinkyDungeonStruggleGroups.push({group:Group, left: S % 2 == 0, y: Math.floor(S/2), icon:sg, name:(restraint.restraint) ? restraint.restraint.name : "", lock:restraint.lock, blocked: InventoryGroupIsBlockedForCharacter(KinkyDungeonPlayer, Group)});
		}
	}
}
