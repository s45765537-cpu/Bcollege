import colors from "ansi-colors";

/** @typedef {{ name: string, code: number, output: string, duration?: number }} CheckResult */

// #region Patterns

/** @type {RegExp} */
const QUOTED_STRING_RE = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;

/** @type {RegExp} */
const FILE_PATH_RE =
	/(?:\.\.?\/|\/|[A-Za-z]:[\\/])?[\w./\\-]+\.(?:js|ts|tsx|mts|cts|css|png|csv|json|md|yml|yaml|txt|html|svg|jpe?g|gif|webp)\b/g;

const DIVIDER = "─".repeat(60);

/** Placeholder byte used while stashing quoted strings during colorization. */
const STASH = String.fromCharCode(0);

// #endregion

// #region Primitives

/**
 * Returns whether the output has color.
 * @param {string} output
 * @returns {boolean}
 */
export function outputHasColor(output) {
	return output.includes("\x1b[");
}

/**
 * Returns the style for a severity.
 * @param {string} severity
 * @returns {(value: string) => string}
 */
function severityStyle(severity) {
	return severity.toLowerCase() === "error" ? colors.red : colors.yellow;
}

/**
 * Formats the duration of a check.
 * @param {number | undefined} durationMs
 * @returns {string}
 */
export function formatDuration(durationMs) {
	if (durationMs === undefined) {
		return colors.gray("(—)");
	}
	return colors.gray(`(${durationMs.toFixed(0)}ms)`);
}

/**
 * Temporarily replaces quoted strings so other patterns do not match inside them.
 * @param {string} text
 * @returns {{ text: string, restore: (value: string) => string }}
 */
function stashQuotedStrings(text) {
	/** @type {string[]} */
	const quoted = [];
	const stashed = text.replace(QUOTED_STRING_RE, (match) => {
		quoted.push(match);
		return `${STASH}${quoted.length - 1}${STASH}`;
	});
	return {
		text: stashed,
		restore: (value) =>
			value.replace(new RegExp(`${STASH}(\\d+)${STASH}`, "g"), (_, index) => colors.green(quoted[Number(index)] ?? "")),
	};
}

/**
 * Colorizes the output of an identifier.
 * @param {string} part
 * @returns {string}
 */
function colorizeIdentifier(part) {
	return part === "null" ? colors.dim("null") : colors.cyan(part);
}

/**
 * Applies generic inline highlights to plain text.
 * @param {string} text
 * @returns {string}
 */
function colorizeInline(text) {
	const { text: stashed, restore } = stashQuotedStrings(text);
	let result = stashed.replace(FILE_PATH_RE, (match) => colors.cyan(match));
	result = result.replace(/\b(TS\d+)\b/g, (_, code) => colors.red.bold(code));
	result = result.replace(/\bnull\b/g, (match) => colors.dim(match));
	return restore(result);
}

/**
 * Colorizes the output of a prefixed line.
 * @param {string} line
 * @param {string} prefix
 * @param {(value: string) => string} stylePrefix
 * @returns {string}
 */
function colorizePrefixedLine(line, prefix, stylePrefix) {
	const match = line.match(/^(\s*)(.+)$/);
	if (!match) {
		return line;
	}

	const [, indent, body] = match;
	const prefixMatch = body.match(new RegExp(`^(${prefix})(\\s*)(.*)$`, "i"));
	if (!prefixMatch) {
		return line;
	}

	const [, label, spacing, rest] = prefixMatch;
	return `${indent}${stylePrefix(label)}${spacing}${colorizeInline(rest)}`;
}

// #endregion

// #region Tool-specific line formatters

/**
 * Colorizes the output of an AssetCheck error line.
 * @param {string} line
 * @returns {string}
 */
function colorizeAssetErrorLine(line) {
	const match = line.match(
		/^(\s*)ERROR:\s*(.+):\s*(Missing asset)\s+("(?:[^"\\]|\\.)*")\s*$/i,
	);
	if (!match) {
		return colorizePrefixedLine(line, "ERROR:", colors.red.bold);
	}

	const [, indent, ids, label, quotedPath] = match;
	const coloredIds = ids.split(":").map(colorizeIdentifier).join(colors.dim(":"));
	return `${indent}${colors.red.bold("ERROR:")} ${coloredIds}${colors.dim(":")} ${colors.dim(label)} ${colors.green(quotedPath)}`;
}

/**
 * Colorizes the output of a TypeScript check result.
 * @param {string} line
 * @returns {string}
 */
function colorizeTypeScriptLine(line) {
	const parenMatch = line.match(/^(.+?\(\d+,\d+\)):\s*(error|warning)\s+(TS\d+):\s*(.*)$/i);
	if (parenMatch) {
		const [, location, severity, code, message] = parenMatch;
		const style = severityStyle(severity);
		return `${colors.cyan(location)}: ${style(severity)} ${colors.red.bold(code)}: ${colorizeInline(message)}`;
	}

	const colonMatch = line.match(/^(.+?):(\d+):(\d+)\s*-\s*(error|warning)\s+(TS\d+):\s*(.*)$/i);
	if (colonMatch) {
		const [, file, lineNo, column, severity, code, message] = colonMatch;
		const style = severityStyle(severity);
		return `${colors.cyan(file)}:${colors.yellow(`${lineNo}:${column}`)} - ${style(severity)} ${colors.red.bold(code)}: ${colorizeInline(message)}`;
	}

	if (/error TS\d+:/i.test(line)) {
		return colorizePrefixedLine(line, "error TS\\d+:", colors.red);
	}

	return line;
}

/**
 * Colorizes the output of an ESLint check result.
 * @param {string} line
 * @returns {string}
 */
function colorizeEslintLine(line) {
	const detailMatch = line.match(
		/^(\s*)(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+([@\w-]+(?:\/[\w-]+)?)\s*$/,
	);
	if (detailMatch) {
		const [, indent, lineNo, column, severity, message, rule] = detailMatch;
		const style = severityStyle(severity);
		return `${indent}${colors.yellow(`${lineNo}:${column}`)}  ${style(severity)}  ${colorizeInline(message)}  ${colors.magenta.dim(rule)}`;
	}

	const trimmed = line.trim();
	if (/^(?:\.\.?\/|\/|[A-Za-z]:)/.test(trimmed) && FILE_PATH_RE.test(trimmed)) {
		return colors.cyan.underline(trimmed);
	}

	return line;
}

/**
 * Colorizes the output of a Prettier check result.
 * @param {string} line
 * @returns {string}
 */
function colorizePrettierLine(line) {
	const match = line.match(/^(\[(?:warn|error)\])\s+(.+)$/i);
	if (match) {
		const [, tag, file] = match;
		const tagColor = /error/i.test(tag) ? colors.red : colors.yellow;
		return `${tagColor(tag)} ${colors.cyan(file)}`;
	}

	if (/^Checking formatting\.\.\.$/i.test(line.trim())) {
		return colors.dim(line);
	}

	return line;
}

// #endregion

// #region Output colorization

/**
 * Colorizes a single line of check output.
 * @param {string} line
 * @returns {string}
 */
function colorizeLine(line) {
	// we don't want to colorize colored output (e.g. AssetCheck, FileCase)
	if (outputHasColor(line)) {
		return line;
	}

	if (/^\s*ERROR:/i.test(line)) {
		return colorizeAssetErrorLine(line);
	}

	if (/^\s*(WARNING|WARN):/i.test(line)) {
		return colorizePrefixedLine(line, "(WARNING|WARN):", colors.yellow.bold);
	}

	if (/\berror TS\d+:/i.test(line) || /\(\d+,\d+\):/.test(line)) {
		const colored = colorizeTypeScriptLine(line);
		if (colored !== line) {
			return colored;
		}
	}

	if (/^\s*\d+:\d+\s+(error|warning)\s+/i.test(line)) {
		const colored = colorizeEslintLine(line);
		if (colored !== line) {
			return colored;
		}
	}

	if (/^\[(?:warn|error)\]/i.test(line.trim()) || /^Checking formatting/i.test(line.trim())) {
		const colored = colorizePrettierLine(line);
		if (colored !== line) {
			return colored;
		}
	}

	const trimmed = line.trim();
	if (trimmed && FILE_PATH_RE.test(trimmed) && !/[:]\s/.test(trimmed)) {
		return colors.cyan.underline(trimmed);
	}

	return colorizeInline(line);
}

/**
 * Colorizes the output of a check result.
 * @param {string} output
 * @returns {string}
 */
export function colorizeOutput(output) {
	// not sure if this can happen, but anyway
	if (!output) {
		return colors.dim("(no output)");
	}

	return output.split(/\r?\n/g).map(colorizeLine).join("\n");
}

/**
 * Returns whether a line of check output is a warning (not an error).
 * @param {string} line
 * @returns {boolean}
 */
export function lineHasWarning(line) {
	if (!line.trim()) {
		return false;
	}

	if (/^\s*(WARNING|WARN):/i.test(line)) {
		return true;
	}

	if (/:\s*warning\s+TS\d+:/i.test(line) || / - warning TS\d+:/i.test(line)) {
		return true;
	}

	if (/^\s*\d+:\d+\s+warning\s+/i.test(line)) {
		return true;
	}

	if (/^\[warn\]/i.test(line.trim())) {
		return true;
	}

	if (/\(\d+ errors?, \d+ warnings?\)/i.test(line) || /^\s*✖.*\b\d+\s+warning/i.test(line)) {
		return true;
	}

	return false;
}

/**
 * Returns whether check output contains any warnings.
 * @param {string} output
 * @returns {boolean}
 */
export function outputHasWarnings(output) {
	return output.split(/\r?\n/g).some(lineHasWarning);
}

// #endregion

// #region Summary & status formatting

/**
 * Formats the name of a check.
 * @param {string} name
 * @returns {string}
 */
export function formatCheckName(name) {
	const colon = name.indexOf(":");
	if (colon === -1) {
		return colors.bold(name);
	}
	return colors.dim(name.slice(0, colon + 1)) + colors.bold(name.slice(colon + 1));
}

/**
 * Formats the status line for a check result.
 * @param {CheckResult} result
 * @returns {string}
 */
export function formatStatusLine(result) {
	/** @type {string} */
	const icon = result.code !== 0
		? colors.red("✗")
		: outputHasWarnings(result.output)
			? colors.yellow("⚠")
			: colors.green("✓");
	return `  ${icon} ${formatCheckName(result.name)} ${formatDuration(result.duration)}`;
}

/**
 * Formats the summary counts for the check results.
 * @param {number} passed
 * @param {number} failed
 * @returns {string}
 */
export function formatSummaryCounts(passed, failed) {
	const failedText = failed ? colors.red(String(failed)) : colors.green("0");
	return colors.bold(`Summary: ${colors.green(String(passed))} passed, ${failedText} failed`);
}

/**
 * Formats the header for the running checks.
 * @param {number} count
 * @returns {string}
 */
export function formatRunningHeader(count) {
	return colors.bold(`Running ${colors.cyan(String(count))} checks…`);
}

/**
 * Formats the heading for a failed check.
 * @param {string} name
 * @returns {string}
 */
export function formatFailureHeading(name) {
	return colors.red.bold.underline(name);
}

/**
 * Formats the heading for a passed check that reported warnings.
 * @param {string} name
 * @returns {string}
 */
export function formatWarningHeading(name) {
	return colors.yellow.bold.underline(name);
}

/** @returns {string} */
export function formatDivider() {
	return colors.bold(DIVIDER);
}

// #endregion
