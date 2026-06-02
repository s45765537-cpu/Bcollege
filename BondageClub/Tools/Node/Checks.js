import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
	colorizeOutput,
	formatDivider,
	formatFailureHeading,
	formatRunningHeader,
	formatStatusLine,
	formatSummaryCounts,
	formatWarningHeading,
	outputHasWarnings,
} from "./ChecksFormat.js";

// #region Configuration

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");

/** @typedef {{ name: string, code: number, output: string, duration?: number }} CheckResult */

/** @type {readonly string[]} */
const CHEAP_CHECKS = [
	"assets:typecheck",
	"assets:check",
	"assets:prettier",
	"assets:eslint",
	"scripts:typecheck:tsc",
	"scripts:typecheck:strict",
	"scripts:lint",
	"files:case",
	"files:csvtypescript",
];

/** @type {readonly string[]} */
const FULL_CHECKS = [
	...CHEAP_CHECKS,
	"scripts:typecheck-expensive",
	"styles:prettier",
];

// #endregion

// #region Check execution

/**
 * Creates a child process, buffering the output and resolving with the result.
 * @param {string} name
 * @returns {Promise<CheckResult>}
 */
function runCheck(name) {
	return new Promise((resolve) => {
		/** @type {string[]} */
		const output = [];
		const npmExecPath = process.env.npm_execpath;
		const useNodeForNpm = typeof npmExecPath === "string" && /\.m?js$/i.test(npmExecPath);
		const command = useNodeForNpm ? process.execPath : "npm";
		/** @type {string[]} */
		const args = useNodeForNpm
			? [npmExecPath, "run", "--silent", name]
			: ["run", "--silent", name];

		const env = { ...process.env };
		if (name === "scripts:typecheck:strict") {
			// kill tsc-strict spinner
			env.CI = "1";
		}

		const startTime = performance.now();
		const child = spawn(command, args, {
			cwd: ROOT,
			env,
			stdio: ["ignore", "pipe", "pipe"],
		});

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => output.push(chunk));
		child.stderr.on("data", (chunk) => output.push(chunk));

		child.on("close", (code) => {
			resolve({
				name,
				code: code ?? 1,
				output: output.join("").trimEnd(),
				duration: performance.now() - startTime,
			});
		});

		child.on("error", (err) => {
			resolve({
				name,
				code: 1,
				output: String(err),
				duration: performance.now() - startTime,
			});
		});
	});
}

/**
 * Runs all checks in parallel and returns the results.
 * @param {readonly string[]} names
 * @returns {Promise<CheckResult[]>}
 */
async function runChecks(names) {
	/** @type {Map<string, CheckResult>} */
	const resultsByName = new Map();

	await Promise.all(
		names.map(async (name) => {
			resultsByName.set(name, await runCheck(name));
		}),
	);

	return names.map((name) => resultsByName.get(name) ?? {
		name,
		code: 1,
		output: "Check did not run",
	});
}

// #endregion

// #region Console output

/**
 * Prints the failure output for a check result.
 * @param {CheckResult} result
 */
function printFailureOutput(result) {
	console.log("\u200B");
	console.log(formatFailureHeading(result.name));
	console.log(colorizeOutput(result.output));
}

/**
 * Prints the warning output for a check that passed but reported warnings.
 * @param {CheckResult} result
 */
function printWarningOutput(result) {
	console.log("\u200B");
	console.log(formatWarningHeading(result.name));
	console.log(colorizeOutput(result.output));
}

/**
 * Prints the summary of the check results.
 * @param {readonly CheckResult[]} results
 */
function printSummary(results) {
	const failed = results.filter((result) => result.code !== 0);
	const passed = results.length - failed.length;

	console.log("\u200B");
	console.log(formatDivider());
	console.log(formatSummaryCounts(passed, failed.length));
	console.log("\u200B");

	for (const result of results) {
		console.log(formatStatusLine(result));
	}

	console.log(formatDivider());
}

// #endregion

// #region Entry point

/**
 * @param {readonly string[]} names
 * @param {boolean} silent
 * @returns {Promise<number>}
 */
async function main(names, silent) {
	if (!silent) {
		console.log(formatRunningHeader(names.length));
	}

	const results = await runChecks(names);

	for (const result of results) {
		if (result.code !== 0) {
			printFailureOutput(result);
		} else if (outputHasWarnings(result.output)) {
			printWarningOutput(result);
		}
	}

	if (!silent) {
		printSummary(results);
	}

	return results.some((result) => result.code !== 0) ? 1 : 0;
}

const cheap = process.argv.includes("--cheap") || process.argv.includes("-c");
const isSilent = process.argv.includes("--silent") || process.argv.includes("-s");
process.exitCode = await main(cheap ? CHEAP_CHECKS : FULL_CHECKS, isSilent);

// #endregion
