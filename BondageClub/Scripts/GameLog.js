"use strict";
/**
 * @type {LogRecord[]}
 * @deprecated Use {@link Player.Log}
 */
var Log = [];

/**
 * Get the log entry corresponding to the given name and group.
 *
 * @template {LogGroupType} T
 * @param {LogNameType[T]} Name
 * @param {T} Group
 * @returns {LogRecord | undefined}
 */
function LogGet(Name, Group) {
	return Player.Log.find(l => l.Group === Group && l.Name === Name);
}

const LogMaxStringArrayLength = 100;
const LogMaxStringLength = 100;

/**
 * Adds a new entry to the player's logs, renews the value if it already exists.
 * @template {LogGroupType} T
 * @param {LogNameType[T]} Name - The name of the log
 * @param {T} Group - The name of the log's group
 * @param {number|string[]} [Value] - Value for the log as the time in ms. Is undefined if the value is permanent
 * @param {boolean} [Push=true] - TRUE if we must push the log to the server
 * @returns {void} - Nothing
 */
function LogAdd(Name, Group, Value, Push=true) {
	if (typeof Name !== "string" || typeof Group !== "string") return;

	if (typeof Value === "string") {
		Value = CommonParseInt(Value, 10) ?? Value;
	} else if (typeof Value === "number") {
		// Numbers are fine
	} else if (Array.isArray(Value)) {
		Value = Value.filter(v => typeof v === "string" && v.length <= LogMaxStringLength);
		Value = Value.slice(0, LogMaxStringArrayLength);
	} else if (!Value) {
		// Anything else falsy ends up as undefined
		Value = undefined;
	} else {
		return;
	}

	// Checks to make sure we don't duplicate a log
	const entry = LogGet(Name, Group);
	if (entry) {
		entry.Value = Value;
	} else {
		/** @type {LogRecord} */
		const newEntry = {
			Name,
			Group,
			Value,
		};
		Player.Log.push(newEntry);
	}

	// Sends the log to the server
	if (Push) ServerPlayerLogSync();
}

/**
 * Deletes a log entry.
 * @template {LogGroupType} T
 * @param {LogNameType[T] | null | undefined} Name - The name of the log. Pass null or undefined to delete the whole group.
 * @param {T} Group - The name of the log's group
 * @param {boolean} [Push=true] - TRUE if we must push the log to the server
 * @returns {void} - Nothing
 */
function LogDelete(Name, Group, Push) {
	if (typeof Group !== "string" && (!Name || typeof Name === "string")) return;

	let deleted = false;
	if (!Name) {
		const toDelete = Player.Log.filter(l => l.Group === Group);

		for (const l of toDelete)
			LogDelete(l.Name, l.Group, false);

		deleted = toDelete.length > 0;
	} else {
		const logIdx = Player.Log.findIndex(l => l.Group === Group && l.Name === Name);
		if (logIdx < 0) return;

		Player.Log.splice(logIdx, 1);
		deleted = true;
	}

	if (deleted && (Push == null) || Push)
		ServerPlayerLogSync();
}

/**
 * Deletes all log entries to starts with the name.
 * @template {LogGroupType} T
 * @param {LogNameType[T]} Name - The name of the log
 * @param {T} Group - The name of the log's group
 * @param {boolean} [Push=true] - TRUE if we must push the log to the server
 * @returns {void} - Nothing
 */
function LogDeleteStarting(Name, Group, Push) {
	const toDelete = Player.Log.filter(l => l.Group === Group && l.Name.startsWith(Name));

	for (const l of toDelete)
		LogDelete(l.Name, l.Group, false);

	if (toDelete.length > 0 && (Push == null || Push))
		ServerPlayerLogSync();
}

/**
 * Checks for an existing record being expired.
 *
 * @template {LogGroupType} T
 * @param {LogNameType[T]} Name - The name of the log to search for
 * @param {T} Group - The name of the log's group
 * @returns {boolean} - Returns false if there's no record, or if the found record's numeric value is less than the current time.
 */
function LogQuery(Name, Group) {
	const entry = LogGet(Name, Group);
	if (!entry) return false;

	return !CommonIsNumeric(entry.Value) || entry.Value >= CurrentTime;
}

/**
 * Checks if the wanted record contains the given ID.
 *
 * This will only return true for stringarray records.
 *
 * @template {LogGroupType} T
 * @param {LogNameType[T]} Name - The log name to scan
 * @param {T} Group - The log group to scan
 * @param {string} ID - The ID to validate (letter, number or other chars are fine)
 * @returns {boolean} - Returns true, if the log contains that ID
 */
function LogContain(Name, Group, ID) {
	if (typeof Name !== "string" || typeof Group !== "string" || typeof ID !== "string") return false;
	const log = Player.Log.find(l => l.Group === Group && l.Name.startsWith(Name));
	if (!log || !Array.isArray(log.Value)) return false;

	return log.Value.includes(ID);
}

/**
 * Returns the numeric value associated to a log.
 * @template {LogGroupType} T
 * @param {LogNameType[T]} Name - The name of the log to query the value
 * @param {T} Group - The name of the log's group
 * @returns {number | null} - The log's numeric value if it exists, or null.
 */
function LogValue(Name, Group) {
	const entry = LogGet(Name, Group);
	if (!entry || !CommonIsNumeric(entry.Value)) return null;

	return entry.Value;
}

/**
 * Returns the string associated to a log.
 * @template {LogGroupType} T
 * @param {LogNameType[T]} Name - The name of the log to query the value
 * @param {T} Group - The name of the log's group
 * @returns {string | null} - The log's string value if it exists, or null.
 */
function LogGetString(Name, Group) {
	const entry = LogGet(Name, Group);
	if (!entry || typeof entry.Value !== "string") return null;
	return entry.Value;
}

/**
 * Returns the string array associated to a log.
 * @template {LogGroupType} T
 * @param {LogNameType[T]} Name - The name of the log to query the value
 * @param {T} Group - The name of the log's group
 * @returns {string[] | null} - The log's string array value if it exists, or null.
 */
function LogGetStringArray(Name, Group) {
	const entry = LogGet(Name, Group);
	if (!entry || !Array.isArray(entry.Value)) return null;
	return entry.Value;
}

/**
 * Loads the account log.
 * @param {readonly LogRecord[]} NewLog - Existing logs received by the server
 * @returns {void} - Nothing
 */
function LogLoad(NewLog) {

	Log = Player.Log = [];

	if (NewLog == null) return;

	for (const log of NewLog) {
		if (/** @type {string} */ (log.Name) === "JoinedStable") {
			// Workaround for the swapped name and group for Stables
			[log.Name, log.Group] = /** @type {any} */ ([log.Group, log.Name]);
		}
		LogAdd(log.Name, log.Group, log.Value, false);
	}
}

/**
 * Searches for an existing log entry on another character.
 * @template {LogGroupType} T
 * @param {Character} C - Character to search on
 * @param {LogNameType[T]} Name - The name of the log to search for
 * @param {T} Group - The name of the log's group
 * @returns {boolean} - Returns TRUE if there is an existing log matching the Name/Group with no value or a value above the current time in ms.
 */
function LogQueryRemote(C, Name, Group) {
	if (C.IsPlayer()) return LogQuery(Name, Group);
	if (!C.Rule || !Array.isArray(C.Rule)) return false;

	const R = C.Rule.find(r => r.Name == Name && r.Group == Group);
	if (R == null) return false;

	return R.Value == null || typeof R.Value === "number" && R.Value >= CurrentTime;
}

/**
 * Filters the Player's log and returns the rule entries that the player's owner is allowed to see.
 * @param {boolean} OwnerIsLover - Indicates that the requester is also the player's lover.
 * @returns {LogRecord[]} - A list of rules that the player's owner is permitted to see
 */
function LogGetOwnerReadableRules(OwnerIsLover) {
	return Player.Log.filter(L => L.Group == "OwnerRule" || (L.Group == "LoverRule" && (OwnerIsLover || L.Name.includes("Owner"))));
}

/**
 * Filters the Player's log and returns the rule entries that the player's lover is allowed to see.
 * @returns {LogRecord[]} - A list of rules that the player's lover is permitted to see
 */
function LogGetLoverReadableRules() {
	return Player.Log.filter(L => L.Group == "LoverRule");
}
