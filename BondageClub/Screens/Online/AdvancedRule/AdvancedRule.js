"use strict";
var AdvancedRuleBackground = "Sheet";
/** @type {null | Character | NPCCharacter} */
var AdvancedRuleTarget = null;
/** @type {LogNameAdvanced} */
var AdvancedRuleType = /** @type {never} */ ("");
/** @type {string[]} */
var AdvancedRuleOption = [];
const AdvancedRuleOptionsPerPage = 44;
var AdvancedRulePage = 0;
/**
 * @type {Set<string>}
 */
var AdvancedRuleSelection = new Set();

/** @type {AdvancedRuleScreen[]} */
const AdvancedRuleScreens = [
	"Shop", "Private", "Introduction", "MaidQuarters", "KidnapLeague", "ShibariDojo", "Sarah", "Trouble",
	"SlaveMarket", "Cell", "LARPBattle", "College", "Asylum", "Poker", "Infiltration", "MovieStudio",
	"MagicSchool", "Platform", "Crafting", "Gambling", "Prison", "Photographic", "Stable", "Magic",
	"Nursery", "Cafe", "Arcade", "ClubCard",
];

/**
 * Loads the advanced rule screen
 * @type {ScreenLoadHandler}
 */
async function AdvancedRuleLoad() {
	AdvancedRulePage = 0;
	AdvancedRuleSelection.clear();

	if (AdvancedRuleTarget && AdvancedRuleTarget.Rule) {
		const rule = AdvancedRuleTarget.Rule.find(r => r.Name === AdvancedRuleType);
		if (!rule || !Array.isArray(rule.Value)) return;

		rule.Value.forEach(v => AdvancedRuleSelection.add(v));
	}
}

/**
 * Starts the advanced rule screen and loads it
 * @param {LogNameAdvanced} RuleType
 * @returns {void} - Nothing
 */
function AdvancedRuleOpen(RuleType) {
	AdvancedRuleType = RuleType;
	AdvancedRuleTarget = CurrentCharacter;
	if (RuleType == "BlockScreen") AdvancedRuleOption = [...AdvancedRuleScreens];
	if (RuleType == "BlockAppearance") {
		// Filter out groups we can't really block
		AdvancedRuleOption = AssetGroup.filter(g => g.IsAppearance() && !["Blush", "Emoticon", "Fluids"].includes(g.Name)).map(g => g.Name);
	}
	if (RuleType == "BlockItemGroup") AdvancedRuleOption = AssetGroup.filter(g => g.IsItem()).map(g => g.Name);
	AdvancedRuleOption.sort((a, b) => AdvancedRuleTextGet(AdvancedRuleType, a).localeCompare(AdvancedRuleTextGet(AdvancedRuleType, b)));
	DialogLeave();
	CommonSetScreen("Online", "AdvancedRule");
}

/**
 * Convert an option to its descriptive name
 * @param {AdvancedRuleType} type
 * @param {string} option
 */
function AdvancedRuleTextGet(type, option) {
	if (type === "BlockScreen" || type === "BlockItemGroup") {
		return TextGet(type + option);
	} else {
		const group = AssetGroupGet("Female3DCG", /** @type {AssetGroupName} */ (option));
		return group ? group.Description : TextGet(option);
	}
}

/**
 * Draws the advanced rule text and check boxes
 * @returns {void} - Nothing
 */
function AdvancedRuleRun() {

	// List the options with a check box
	MainCanvas.textAlign = "left";

	const options = AdvancedRuleOption.slice(AdvancedRulePage * AdvancedRuleOptionsPerPage, (AdvancedRulePage + 1) * AdvancedRuleOptionsPerPage);
	for (let O = 0; O < options.length; O++) {
		let X = 100 + Math.floor(O / 11) * 450;
		let Y = 170 + ((O % 11) * 69);
		DrawButton(X, Y, 64, 64, "", "White", (AdvancedRuleSelection.has(options[O])) ? "Icons/Checked.png" : "");
		DrawText(AdvancedRuleTextGet(AdvancedRuleType, options[O]), X + 100, Y + 32, "Black", "Gray");
	}

	// Draw the top row
	MainCanvas.textAlign = "left";
	DrawText(TextGet(AdvancedRuleType + "Title"), 90, 105, "Black", "Silver");
	MainCanvas.textAlign = "center";
	if (AdvancedRuleOption.length > AdvancedRuleOptionsPerPage)
		DrawButton(1485, 60, 90, 90, "", "White", "Icons/Next.png", TextGet("Next"));
	DrawButton(1600, 60, 90, 90, "", "White", "Icons/CheckAll.png", TextGet("CheckAll"));
	DrawButton(1715, 60, 90, 90, "", "White", "Icons/CheckNone.png", TextGet("CheckNone"));
	DrawButton(1830, 60, 90, 90, "", "White", "Icons/Exit.png", TextGet("Exit"));

}

/**
 * Handles the click events. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function AdvancedRuleClick() {

	// When the user exits or check all/none
	if (MouseIn(1600, 60, 90, 90)) AdvancedRuleSelection = new Set(AdvancedRuleOption);
	if (MouseIn(1715, 60, 90, 90)) AdvancedRuleSelection = new Set();
	if (MouseIn(1830, 60, 90, 90)) AdvancedRuleExit();
	if (MouseIn(1485, 60, 90, 90) && AdvancedRuleOption.length > AdvancedRuleOptionsPerPage)
		AdvancedRulePage = (AdvancedRulePage + 1) * AdvancedRuleOptionsPerPage <= AdvancedRuleOption.length ? AdvancedRulePage + 1 : 0;

	// When the user clicks on one of the options
	const options = AdvancedRuleOption.slice(AdvancedRulePage * AdvancedRuleOptionsPerPage, (AdvancedRulePage + 1) * AdvancedRuleOptionsPerPage);
	for (let O = 0; O < options.length; O++) {
		let X = 100 + Math.floor(O / 11) * 450;
		let Y = 170 + ((O % 11) * 69);
		if (MouseIn(X, Y, 64, 64)) {
			if (AdvancedRuleSelection.has(options[O]))

				AdvancedRuleSelection.delete(options[O]);
			else
				AdvancedRuleSelection.add(options[O]);
		}
	}

}

/**
 * Handles exiting from the screen, updates the sub rules
 * @type {ScreenExitHandler}
 */
function AdvancedRuleExit() {
	CommonPromiseCatch(
		CommonSetScreen("Online", "ChatRoom").then(() => {
			if (AdvancedRuleTarget) {
				const builder = new DictionaryBuilder();
				builder.stringList(AdvancedRuleType, [...AdvancedRuleSelection.values()]);
				ServerSend("ChatRoomChat", { Content: "OwnerRule" + AdvancedRuleType, Type: "Hidden", Target: AdvancedRuleTarget.MemberNumber, Dictionary: builder.build() });
				ChatRoomFocusCharacter(AdvancedRuleTarget);
				AdvancedRuleTarget = null;
			}
		})
	);
}
