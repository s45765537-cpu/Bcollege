import fs from "fs";
import path from "path";

import { parseCSV, BASE_PATH } from "./Common.js";

/**
 *
 * @param {string} funcName
 * @param {string} prefix
 * @returns
 */
function sanitizePrereqString(funcName, prefix) {
	if (funcName.indexOf("Player.") == 0) {
		const name = funcName.substring(7, 250).replace("()", "").trim();
		return `Player.${name}()`;
	} else if (funcName.indexOf("!Player.") == 0) {
		const name = funcName.substring(8, 250).replace("()", "").trim();
		return `!Player.${name}()`;
	} else if (funcName.indexOf("CurrentCharacter.") == 0) {
		const name = funcName.substring(17, 250).replace("()", "").trim();
		return `CurrentCharacter.${name}()`;
	} else if (funcName.indexOf("!CurrentCharacter.") == 0) {
		const name = funcName.substring(18, 250).replace("()", "").trim();
		return `!CurrentCharacter.${name}()`;
	} else if (funcName.indexOf("(") >= 0) {
		return sanitizeFunctionString(funcName, prefix);
	} else if (funcName.substring(0, 1) != "!") {
		return `!!${prefix}${funcName}`;
	} else {
		return `!${prefix}${funcName.slice(1, 250)}`;
	}
}

/** @type {(string: string) => boolean} */
function isNumeric(string) {
	return isFinite(parseFloat(string));
}

/**
 *
 * @param {string} funcName
 * @param {string} prefix
 */
function sanitizeFunctionString(funcName, prefix) {
	// Gets the reverse (!) sign
	var reverse = false;
	if (funcName.substring(0, 1) == "!") reverse = true;
	funcName = funcName.replace("!", "");

	// Gets the real function name and parameters
	var openParenthesisIndex = funcName.indexOf("(");
	var closedParenthesisIndex = funcName.indexOf(")", openParenthesisIndex);
	var ParamsString = funcName.substring(openParenthesisIndex + 1, closedParenthesisIndex);
	var Params = ParamsString.length === 0 ? [] : ParamsString.split(",");
	for (let P = 0; P < Params.length; P++) {
		Params[P] = Params[P].trim().replace('"', '').replace('"', '');
	}
	funcName = funcName.substring(0, openParenthesisIndex);
	if ((funcName.indexOf("Dialog") != 0) && (funcName.indexOf("Inventory") != 0) && (funcName.indexOf(prefix) != 0)) {
		funcName = prefix + funcName;
	}
	return `${reverse ? "!" : ""}${funcName}(${Params.map(i => isNumeric(i) ? i : `"${i}"`).join(", ")})`;
}

/**
 * @param {string} inputName
 * @param {string} outputName
 * @param {string} prefix
 * @returns {boolean}
 */
function csvToTs(inputName, outputName, prefix) {
	let csvHasFunctions = false;
	/** @type {Record<number, Partial<Record<"Function" | "Prerequisite", string>>>} */
	const csvFunctions = {};
	const csv = parseCSV(fs.readFileSync(inputName, { encoding: "utf8" }));
	for (const [i, [_stage, _nextStage, _option, _result, func, prereq]] of csv.entries()) {
		if (func) {
			(csvFunctions[i + 1] ??= {}).Function = sanitizeFunctionString(func, prefix);
			csvHasFunctions = true;
		}
		if (prereq) {
			(csvFunctions[i + 1] ??= {}).Prerequisite = sanitizePrereqString(prereq, prefix);
			csvHasFunctions = true;
		}
	}

	if (!csvHasFunctions) {
		return false;
	}

	let fileOutput = `"use strict";\n// See "${inputName}"\n\n`;
	for (const [i, { Function, Prerequisite }] of Object.entries(csvFunctions)) {
		if (Function) {
			fileOutput += `${Function}; // line ${i} - col 5 - Function\n`;
		}
		if (Prerequisite) {
			fileOutput += `${Prerequisite}; // line ${i} - col 6 - Prerequisite\n`;
		}
		fileOutput += "\n";
	}
	fs.writeFileSync(outputName, fileOutput, { encoding: "utf8" });
	return true;

}

// FIXME: A list of .csv files wherein BC does some unholy mangling and chaining together of screen names
// Ignore them, as we cannot reliably infer the screen name-based function prefixes
const voodooList = new Set([
	"Dialog_NPC_Management_RandomGirl.csv",
	"Dialog_NPC_Shop_Customer.csv",
	"Dialog_NPC_SlaveMarket_SlaveToTrain.csv",
]);

/**
 * @param {string} root
 * @param {string} output
 */
function AllCsvToTS(root, output) {
	root = fs.existsSync(root) ? root : path.join(BASE_PATH, root);
	if (!fs.existsSync(output)) {
		fs.mkdirSync(output);
	} else {
		fs.rmSync(output, { recursive: true, force: true });
		fs.mkdirSync(output);
	}

	let status = false;
	for (const file of fs.readdirSync(root, { encoding: "utf8", recursive: true })) {
		const ext = file.split(".").at(-1);
		const segments = file.split(path.sep);
		const fileName = segments.at(-1);
		const screenName = segments.at(-2);
		if (
			ext === "csv"
			&& fileName?.startsWith("Dialog_NPC_")
			&& screenName
			&& !voodooList.has(fileName)
		) {
			status = csvToTs(path.join(root, file), path.join(output, `${fileName}.js`), screenName) || status;
		}
	}
	return status;
}

const declarationsTemplate = `
type TextKeysInterface = (
	{csvKeys}
);
`.trim();

/**
 *
 * @param {string} root
 * @param {string} output
 */
function interfaceCsvToTS(root, output) {
	root = fs.existsSync(root) ? root : path.join(BASE_PATH, root);
	const outputName = path.join(output, "Interface.csv.d.ts");
	const inputName = path.join(root, "Screens", "Interface.csv");

	const csv = parseCSV(fs.readFileSync(inputName, { encoding: "utf8" }));
	const csvKeyUnion = csv.map(i => i[0]).filter(Boolean).sort().map(i => `"${i}"`).join("\n\t| ");
	const declarations = declarationsTemplate.replace("{csvKeys}", csvKeyUnion);
	fs.writeFileSync(outputName, declarations, { encoding: "utf8" });
}

(function () {
	const output = path.join(BASE_PATH, "Tools", "Node", "csvtypescript_tmp_output");
	AllCsvToTS(BASE_PATH, output);
	interfaceCsvToTS(BASE_PATH, output);
})();
