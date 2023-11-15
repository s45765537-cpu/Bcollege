/** Common utility scripts for the test suit. */

"use strict";

const fs = require("fs");

/** Files needed to check the Female3DCG assets. */
const NEEDED_FILES = [
	"Scripts/Common.js",
	"Scripts/Dialog.js",
	"Scripts/Asset.js",
	"Scripts/ExtendedItem.js",
	"Scripts/ModularItem.js",
	"Scripts/TypedItem.js",
	"Scripts/VariableHeight.js",
	"Scripts/VibratorMode.js",
	"Scripts/Property.js",
	"Scripts/TextItem.js",
	"Screens/Inventory/Futuristic/Futuristic.js",
	"Screens/Inventory/ItemTorso/FuturisticHarness/FuturisticHarness.js",
	"Screens/Inventory/ItemNeckAccessories/CollarNameTag/CollarNameTag.js",
	"Screens/Inventory/ItemArms/FullLatexSuit/FullLatexSuit.js",
	"Screens/Inventory/ItemButt/InflVibeButtPlug/InflVibeButtPlug.js",
	"Screens/Inventory/ItemDevices/VacBedDeluxe/VacBedDeluxe.js",
	"Screens/Inventory/ItemDevices/WoodenBox/WoodenBox.js",
	"Screens/Inventory/ItemPelvis/SciFiPleasurePanties/SciFiPleasurePanties.js",
	"Screens/Inventory/ItemNeckAccessories/CollarShockUnit/CollarShockUnit.js",
	"Screens/Inventory/ItemVulva/ClitAndDildoVibratorbelt/ClitAndDildoVibratorbelt.js",
	"Screens/Inventory/ItemBreast/FuturisticBra/FuturisticBra.js",
	"Screens/Inventory/ItemArms/TransportJacket/TransportJacket.js",
	"Screens/Inventory/ItemMouth/FuturisticPanelGag/FuturisticPanelGag.js",
	"Screens/Inventory/ItemNeckAccessories/CollarAutoShockUnit/CollarAutoShockUnit.js",
	"Screens/Inventory/ItemArms/PrisonLockdownSuit/PrisonLockdownSuit.js",
	"Screens/Inventory/ItemPelvis/LoveChastityBelt/LoveChastityBelt.js",
	"Screens/Inventory/ItemVulva/LoversVibrator/LoversVibrator.js",
	"Screens/Inventory/ItemButt/AnalBeads2/AnalBeads2.js",
	"Screens/Inventory/ItemDevices/LuckyWheel/LuckyWheel.js",
	"Screens/Inventory/ItemDevices/FuturisticCrate/FuturisticCrate.js",
	"Screens/Inventory/Cloth/CheerleaderTop/CheerleaderTop.js",
	"Screens/Inventory/ClothAccessory/Bib/Bib.js",
	"Screens/Inventory/ItemDevices/DollBox/DollBox.js",
	"Screens/Inventory/ItemDevices/PetBowl/PetBowl.js",
	"Screens/Inventory/ItemHead/DroneMask/DroneMask.js",
	"Screens/Inventory/ItemMisc/WoodenSign/WoodenSign.js",
	"Screens/Inventory/ItemHood/CanvasHood/CanvasHood.js",
	"Screens/Inventory/ItemPelvis/ObedienceBelt/ObedienceBelt.js",
	"Screens/Inventory/ItemNeckAccessories/CustomCollarTag/CustomCollarTag.js",
	"Screens/Inventory/ItemNeckAccessories/ElectronicTag/ElectronicTag.js",
	"Screens/Inventory/ItemNeckRestraints/PetPost/PetPost.js",
	"Screens/Inventory/ItemVulva/FuturisticVibrator/FuturisticVibrator.js",
	"Screens/Inventory/ItemPelvis/FuturisticTrainingBelt/FuturisticTrainingBelt.js",
	"Screens/Inventory/ItemDevices/KabeshiriWall/KabeshiriWall.js",
	"Screens/Inventory/ItemDevices/FuckMachine/FuckMachine.js",
	"Screens/Inventory/ItemBreast/ForbiddenChastityBra/ForbiddenChastityBra.js",
	"Screens/Inventory/Suit/LatexCatsuit/LatexCatsuit.js",
	"Assets/Female3DCG/Female3DCG.js",
	"Assets/Female3DCG/Female3DCGExtended.js",
	"Scripts/Translation.js",
	"Scripts/Text.js",
	"Screens/Character/ItemColor/ItemColor.js",
	"Scripts/Testing.js",
];

/** The base path for any BC asset/script lookup. */
const BASE_PATH = "../../";

let localError = false;
let globalError = false;

/**
 * Logs the error to console and sets erroneous exit code
 * @param {string} text The error
 */
function error(text) {
	console.log("ERROR:", text);
	process.exitCode = 1;
	localError = true;
	globalError = true;
}

/** @see {@link Object.entries} */
const entries = /** @type {<KT extends String, VT>(record: Partial<Record<KT, VT>>) => [key: KT, value: VT][]} */(Object.entries);

/** @see {@link Object.keys} */
const keys = /** @type {<KT extends String>(record: Partial<Record<KT, unknown>>) => KT[]} */(Object.keys);

/** @see {@link Object.fromEntries} */
const fromEntries = /** @type {<KT extends String, VT>(list: [key: KT, value: VT][]) => Record<KT, VT>} */(Object.fromEntries);

/**
 * Return whether the passed object is a record/interface.
 * @type {(obj: unknown) => obj is Record<string, unknown>}
 */
function isObject(obj) {
	return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

/**
 * Parse a CSV file content into an array
 * @param {string} str - Content of the CSV
 * @returns {string[][]} Array representing each line of the parsed content, each line itself is split by commands and stored within an array.
 */
function parseCSV(str) {
	/** @type {string[][]} */
	let arr = [];
	let quote = false; // true means we're inside a quoted field
	let c;
	let col;
	// We remove whitespace on start and end
	str = str.trim() + "\n";

	// iterate over each character, keep track of current row and column (of the returned array)
	for (let row = (col = c = 0); c < str.length; c++) {
		var cc = str[c],
			nc = str[c + 1]; // current character, next character
		arr[row] = arr[row] || []; // create a new row if necessary
		arr[row][col] = arr[row][col] || ""; // create a new column (start with empty string) if necessary

		// If the current character is a quotation mark, and we're inside a
		// quoted field, and the next character is also a quotation mark,
		// add a quotation mark to the current column and skip the next character
		if (cc == '"' && quote && nc == '"') {
			arr[row][col] += cc;
			++c;
			continue;
		}

		// If it's just one quotation mark, begin/end quoted field
		if (cc == '"') {
			quote = !quote;
			continue;
		}

		// If it's a comma and we're not in a quoted field, move on to the next column
		if (cc == "," && !quote) {
			++col;
			continue;
		}

		// If it's a newline and we're not in a quoted field, move on to the next
		// row and move to column 0 of that new row
		if (cc == "\n" && !quote) {
			++row;
			col = 0;
			continue;
		}

		// Otherwise, append the current character to the current column
		arr[row][col] += cc;
	}
	return arr;
}

/**
 * Loads a CSV file and verifies correct column widths
 * @param {string} path Path to file, relative to BondageClub directory
 * @param {number} expectedWidth Expected number of columns
 */
function loadCSV(path, expectedWidth) {
	const data = parseCSV(fs.readFileSync(BASE_PATH + path, { encoding: "utf-8" }));
	for (let line = 0; line < data.length; line++) {
		if (data[line].length !== expectedWidth) {
			error(`Bad width of line ${line + 1} (${data[line].length} vs ${expectedWidth}) in ${path}`);
		}
	}
	return data;
}

module.exports = {
	NEEDED_FILES,
	BASE_PATH,
	localError,
	globalError,
	error,
	entries,
	keys,
	fromEntries,
	isObject,
	loadCSV,
};
