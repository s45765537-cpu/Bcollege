"use strict";
var InformationSheetBackground = "Sheet";
/** @type {null | Character | NPCCharacter} */
var InformationSheetSelection = null;
/** @type {ScreenSpecifier | null} */
var InformationSheetReturnScreen = null;
var InformationSheetSecondScreen = false;

/**
 * Loads the Information Sheet, cache the sub screens
 * @type {ScreenLoadHandler}
 */
async function InformationSheetLoad() {
	TextPrefetch("Character", "FriendList");
	TextPrefetch("Character", "Preference");
	TextPrefetch("Character", "Title");
}

/**
 * Main function of the character info screen. It's called continuously, so be careful
 * to add time consuming functions or loops here
 * @returns {void} - Nothing
 */
function InformationSheetRun() {

	// Draw the character base values
	const C = InformationSheetSelection;
	const CurrentTitle = TitleGet(C);

	DrawCharacter(C, 50, 50, 0.9);
	MainCanvas.textAlign = "left";

	const spacing = 55;
	const spacingLarge = 75;
	let currentY = 125;

	DrawTextFit(TextGet("Name") + " " + C.Name, 550, currentY, 450, "Black", "Gray");
	currentY += spacing;
	if (C.Name !== CharacterNickname(C)) {
		DrawTextFit(TextGet("Nickname") + " " + CharacterNickname(C), 550, currentY, 450, "Black", "Gray");
		currentY += spacing;
	}
	if (CurrentTitle !== "None") {
		DrawTextFit(TextGet("Title") + " " + TextGet("Title" + CurrentTitle), 550, currentY, 450, TitleIsForced(CurrentTitle) ? "Red" : TitleIsEarned(CurrentTitle) ? "#0000BF" : "Black", "Gray");
		currentY += spacing;
	}
	if (C.MemberNumber != null) {
		DrawTextFit(TextGet("MemberNumber") + " " + C.MemberNumber.toString(), 550, currentY, 450, "Black", "Gray");
		currentY += spacing;
	}
	DrawTextFit(TextGet("Pronouns") + " " + CharacterPronounDescription(C), 550, currentY, 450, "Black", "Gray");

	currentY += spacingLarge;

	if (C.IsPlayer()) {
		let memberForLine = TextGet(C.IsBirthday() ? "Birthday" : "MemberFor") + " " + (Math.floor((CurrentTime - C.Creation) / 86400000)).toString() + " " + TextGet("Days");
		DrawTextFit(memberForLine, 550, currentY, 450, (C.IsBirthday() ? "Blue" : "Black"), "Gray");
		currentY += spacing;

		let moneyLine = TextGet("Money") + " " + C.Money.toString() + " $";
		DrawTextFit(moneyLine, 550, currentY, 450, "Black", "Gray");
		currentY += spacing;
	} else if (C.IsOnline() && C.Creation != null) {
		let memberForLine = TextGet("MemberFor") + " " + (Math.floor((CurrentTime - C.Creation) / 86400000)).toString() + " " + TextGet("Days");
		DrawTextFit(memberForLine, 550, currentY, 450, "Black", "Gray");
		currentY += spacing;
	} else if (C.IsNpc()) {
		let friendForLine = TextGet("FriendsFor") + " " + (Math.floor((CurrentTime - NPCEventGet(C, "PrivateRoomEntry")) / 86400000)).toString() + " " + TextGet("Days");
		DrawTextFit(friendForLine, 550, currentY, 450, "Black", "Gray");
		currentY += spacing;

		let relationshipQualifier = "";
		if (C.Love >= 100) relationshipQualifier = "RelationshipPerfect";
		else if (C.Love >= 75) relationshipQualifier = "RelationshipGreat";
		else if (C.Love >= 50) relationshipQualifier = "RelationshipGood";
		else if (C.Love >= 25) relationshipQualifier = "RelationshipFair";
		else if (C.Love > -25) relationshipQualifier = "RelationshipNeutral";
		else if (C.Love > -50) relationshipQualifier = "RelationshipPoor";
		else if (C.Love > -75) relationshipQualifier = "RelationshipBad";
		else if (C.Love > -100) relationshipQualifier = "RelationshipHorrible";
		else relationshipQualifier = "RelationshipAtrocious";

		let loveLine = TextGet("Relationship") + " " + C.Love.toString() + " " + TextGet(relationshipQualifier);
		DrawTextFit(loveLine, 550, currentY, 450, "Black", "Gray");
		currentY += spacing;
	}
	currentY += spacingLarge;

	// For the current player or an online player
	if (C.IsPlayer() || C.IsOnline()) {

		// Shows the difficulty level
		let difficultyLine = `${TextGet("DifficultyLevel" + C.GetDifficulty())} ${TextGet("DifficultyTitle")}`;
		if(C.IsPlayer())
		{
			const MillisecondsPerDay = 86400000;
			const DifficultyChangeMaxDelay = 7;
			const LastChangeTime = typeof C.Difficulty?.LastChange === "number" ? C.Difficulty.LastChange : C.Creation;
			const DaysSinceLastChange = Math.floor((CurrentTime - LastChangeTime) / MillisecondsPerDay);
			const RemainingDays = DaysSinceLastChange >= DifficultyChangeMaxDelay ? 0 : DifficultyChangeMaxDelay - DaysSinceLastChange;
			difficultyLine += TextGet("DifficultyDaysTillCanChange").replace("NumberOfDays", RemainingDays.toString());
		}
		DrawTextFit(difficultyLine, 550, currentY, 450, "Black", "Gray");
		currentY += spacing;

		// Shows the owner
		let ownerLine = TextGet("Owner") + " " + (C.IsOwned() ? C.OwnerName() + (C.OwnerNumber() !== -1 ? " (" + C.OwnerNumber() + ")" : "") : TextGet("OwnerNone"));
		DrawTextFit(ownerLine, 550, currentY, 450, "Black", "Gray");
		currentY += spacing;
		if (C.IsOwned() && (C.IsOwned() != "ggts")) {
			let stageLine = TextGet(!C.IsFullyOwned() ? "TrialFor" : "CollaredFor") + " " + C.OwnedSince().toString() + " " + TextGet("Days");
			DrawTextFit(stageLine, 550, currentY, 450, "Black", "Gray");
			currentY += spacing;
		}

		currentY = 800;

		// Shows the member number and online permissions for other online players

		DrawTextFit(TextGet("AllowedInteractions"), 550, currentY, 450, "Black", "Gray");
		currentY += spacing;
		DrawTextFit(TextGet("AllowedInteraction" + C.AllowedInteractions.toString()), 550, currentY, 450, "Black", "Gray");
		currentY += spacing;
	}

	// Draw the buttons on the right side
	MainCanvas.textAlign = "center";
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	if (C.IsPlayer()) {
		if (!TitleIsForced(CurrentTitle)) DrawButton(1815, 190, 90, 90, "", "White", "Icons/Title.png");
		DrawButton(1815, 305, 90, 90, "", "White", "Icons/Preference.png");
		DrawButton(1815, 420, 90, 90, "", "White", "Icons/FriendList.png");
		DrawButton(1815, 535, 90, 90, "", "White", "Icons/Introduction.png");
		DrawButton(1815, 765, 90, 90, "", "White", "Icons/Next.png");
	} else if (C.IsOnline()) {
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Introduction.png");
		DrawButton(1815, 765, 90, 90, "", "White", "Icons/Next.png");
	}

	// Draw the second screen for reputation & skills
	MainCanvas.textAlign = "left";
	if (InformationSheetSecondScreen) return InformationSheetSecondScreenRun();

	// For player and online characters, we show the lover list (NPC or online)
	if (C.IsPlayer() || C.IsOnline()) {
		DrawText(TextGet("Relationships"), 1200, 125, "Black", "Gray");
		const lovership = C.GetLovership();
		if (lovership.length < 1) DrawText(TextGet("Lover") + " " + TextGet("LoverNone"), 1200, 200, "Black", "Gray");
		for (let [L, lover] of lovership.entries()) {
			DrawText(TextGet("Lover") + " " + lover.Name + (lover.MemberNumber ? " (" + lover.MemberNumber + ")" : ""), 1200, 200 + L * 150, "Black", "Gray");
			DrawText(TextGet((lover.Stage == 0) ? "DatingFor" : (lover.Stage == 1) ? "EngagedFor" : "MarriedFor") + " " + (Math.floor((CurrentTime - lover.Start) / 86400000)).toString() + " " + TextGet("Days"), 1200, 260 + L * 150, "Black", "Gray");
		}
	}
	if (C.IsNpc()) {
		// For NPC characters, shows the lover, owner & traits
		DrawText(TextGet("Lover") + " " + (C.LoverName() ? C.LoverName() : TextGet("LoverNone")), 550, 500, "Black", "Gray");
		const lovership = C.GetLovership();
		const playerLove = lovership.find(l => l.MemberNumber === Player.MemberNumber);
		if (playerLove) {
			DrawText(TextGet((playerLove.Stage == 0) ? "DatingFor" : (playerLove.Stage == 1) ? "EngagedFor" : "MarriedFor") + " " + (Math.floor((CurrentTime - playerLove.Start) / 86400000)).toString() + " " + TextGet("Days"), 550, 575, "Black", "Gray");
		}
		DrawText(TextGet("Owner") + " " + (C.IsOwned() ? C.OwnerName() : TextGet("OwnerNone")), 550, 650, "Black", "Gray");
		if (C.IsOwned())
			DrawText(TextGet(C.IsFullyOwned() ? "CollaredFor" : "TrialFor") + " " + C.OwnedSince().toString() + " " + TextGet("Days"), 550, 725, "Black", "Gray");
		DrawText(TextGet("Trait"), 1000, 125, "Black", "Gray");

		// After one week we show the traits, after two weeks we show the level
		if (CurrentTime >= NPCEventGet(C, "PrivateRoomEntry") * CheatFactor("AutoShowTraits", 0) + 604800000) {
			let Pos = 0;
			for (let T = 0; T < C.Trait.length; T++)
				if ((C.Trait[T].Value != null) && (C.Trait[T].Value != 0)) {
					DrawText(TextGet("Trait" + ((C.Trait[T].Value > 0) ? C.Trait[T].Name : NPCTraitReverse(C.Trait[T].Name))) + " " + ((CurrentTime >= NPCEventGet(C, "PrivateRoomEntry") * CheatFactor("AutoShowTraits", 0) + 1209600000) ? Math.abs(C.Trait[T].Value).toString() : "??"), 1000, 200 + Pos * 75, "Black", "Gray");
					Pos++;
				}
		} else DrawText(TextGet("TraitUnknown"), 1000, 200, "Black", "Gray");

	}
	MainCanvas.textAlign = "center";

}

/**
 * Display the second part of the information sheet for reputation & skills
 * @returns {void} - Nothing
 */
function InformationSheetSecondScreenRun() {

	// For current player and online characters
	var C = InformationSheetSelection;
	if (C.IsPlayer() || C.IsOnline()) {
		const lineHeight = 55;
		// Draw the reputation section
		DrawText(TextGet("Reputation"), 1000, 125, "Black", "Gray");
		let pos = 0;
		for (let R = 0; R < C.Reputation.length; R++)
			if (C.Reputation[R].Value != 0) {
				DrawText(TextGet("Reputation" + C.Reputation[R].Type + ((C.Reputation[R].Value > 0) ? "Positive" : "Negative")) + " " + Math.abs(C.Reputation[R].Value).toString(), 1000, 200 + pos * lineHeight, "Black", "Gray");
				pos++;
			}
		if (pos == 0) DrawText(TextGet("ReputationNone"), 1000, 200, "Black", "Gray");

		// Draw the skill section
		DrawText(TextGet("Skill"), 1425, 125, "Black", "Gray");
		if (!C.IsPlayer()) {
			DrawText(TextGet("Unknown"), 1425, 200, "Black", "Gray");
		} else {
			let skillLine = 0;
			for (const type of SkillValidSkills) {
				const name = TextGet(`Skill${type}`);
				const level = SkillGetLevel(C, type);
				const progress = SkillGetProgress(C, type);
				if (level === 0 && progress === 0) continue;
				const ratio = SkillGetRatio(C, type);
				const modifier = SkillGetModifier(C, type);
				const duration = SkillGetModifierDuration(C, type);

				const skillText = `${name} ${level} (${progress / 10}%)`;
				const color = ratio !== 1 ? "Red" : "Black";
				DrawText(skillText, 1425, 200 + skillLine * lineHeight, color, "Gray");
				skillLine++;
				if (modifier && modifier !== 0) {
					/** @type {CommonSubtituteSubstitution[]} */
					const subst = [
						["ABS", (modifier > 0 ? "+" : "-")],
						["VAL", modifier.toString()],
						["DURATION", TimermsToTime(duration)],
					];
					const modifierColor = modifier > 0 ? "Green" : "Red";
					const modifierText = CommonStringSubstitute(TextGet("SkillModifier"), subst);
					DrawText(modifierText, 1440, 200 + skillLine * lineHeight, modifierColor, "Gray");
					skillLine++;
				}
			}
			if (C.Skill.length == 0) {
				DrawText(TextGet("SkillNone"), 1425, 200, "Black", "Gray");
			}
		}
	}
	MainCanvas.textAlign = "center";

}

/**
 * Handles the click events on the screen
 * @returns {void} - Nothing
 */
function InformationSheetClick() {
	var C = InformationSheetSelection;
	if (MouseIn(1815, 75, 90, 90)) InformationSheetExit();
	if (C.IsPlayer()) {
		if (MouseIn(1815, 190, 90, 90) && !TitleIsForced(TitleGet(C))) CommonSetScreen("Character", "Title");
		if (MouseIn(1815, 305, 90, 90)) CommonSetScreen("Character", "Preference");
		if (MouseIn(1815, 420, 90, 90)) CommonSetScreen("Character", "FriendList");
		if (MouseIn(1815, 535, 90, 90)) CommonSetScreen("Character", "OnlineProfile");
		if (MouseIn(1815, 765, 90, 90)) InformationSheetSecondScreen = !InformationSheetSecondScreen;
	} else if (C.IsOnline()) {
		if (MouseIn(1815, 190, 90, 90)) CommonSetScreen("Character", "OnlineProfile");
		if (MouseIn(1815, 765, 90, 90)) InformationSheetSecondScreen = !InformationSheetSecondScreen;
	}
}

/**
 * Cleanup all elements, if the user exits the screen
 * @type {ScreenExitHandler}
 */
function InformationSheetExit() {
	InformationSheetSecondScreen = false;
	if (InformationSheetReturnScreen) {
		CommonSetScreen(...InformationSheetReturnScreen);
	}
	InformationSheetReturnScreen = null;
}

/**
 * Loads the information sheet for a character
 * @param {Character} C - The character whose information sheet should be displayed
 * @returns {void} - Nothing
 */
function InformationSheetLoadCharacter(C) {
	InformationSheetSelection = C;
	if (!InformationSheetReturnScreen) {
		InformationSheetReturnScreen = CommonGetScreen();
	}
	CommonSetScreen("Character", "InformationSheet");
}
