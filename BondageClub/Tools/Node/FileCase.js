import fs from "fs";
import { BASE_PATH, error } from "./Common.js";

/**
 * @param {string} root
 */
function checkFileCasing(root) {
	/** @type {Set<string>} */
	const files = new Set();
	/** @type {string[]} */
	const invalid = [];
	for (const _file of fs.readdirSync(root, { encoding: "utf8", recursive: true })) {
		const file = _file.toLowerCase();
		if (files.has(file)) {
			invalid.push(_file);
		}
		files.add(file);
	}

	if (invalid.length) {
		invalid.sort();
		error(
			`found ${invalid.length} duplicate files with different upper- and/or lower-casing: `
			+ `${JSON.stringify(invalid, undefined, 4)}`,
		);
	}
}

(function () {
	checkFileCasing(BASE_PATH);
}());
