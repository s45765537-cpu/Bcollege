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

/**
 * Adds a new entry to the player's logs, renews the value if it already exists.
 * @template {LogGroupType} T
 * @param {LogNameType[T]} Name - The name of the log
 * @param {T} Group - The name of the log's group
 * @param {number} [Value] - Value for the log as the time in ms. Is undefined if the value is permanent
 * @param {boolean} [Push=true] - TRUE if we must push the log to the server
 * @returns {void} - Nothing
 */
function LogAdd(Name, Group, Value, Push=true) {
	if (typeof Name !== "string" || typeof Group !== "string") return;

	// Makes sure the value is numeric
	if (!CommonIsNumeric(Value) && Value !== undefined) {
		Value = CommonParseInt(Value, 10) ?? undefined;
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
	const value = LogValue(Name, Group);
	if (value === null) return false;

	// Loose null-check here in case there's a null or an undefined stuck in there
	return entry.Value == null || entry.Value >= CurrentTime;
}

/**
 * Checks if there's a log entry with extra ID characters in the log of the player (Exemple: BlockScreenABC return true for ID: A, B or C)
 *
 * @template {LogGroupType} T
 * @param {LogNameType[T]} Name - The log name to scan
 * @param {T} Group - The log group to scan
 * @param {string} ID - The ID to validate (letter, number or other chars are fine)
 * @returns {boolean} - Returns true, if the log contains that ID
 */
function LogContain(Name, Group, ID) {
	if (Player.Log == null) return false;
	for (let L of Player.Log)
		if (Group == L.Group)
			if (L.Name.substring(0, Name.length) == Name)
				return (L.Name.substring(Name.length, 100).indexOf(ID) >= 0);
	return false;
}

/**
 * Returns the value associated to a log.
 * @template {LogGroupType} T
 * @param {LogNameType[T]} Name - The name of the log to query the value
 * @param {T} Group - The name of the log's group
 * @returns {number | null | undefined} - Returns the value of the requested log if it exists, or null. Returns undefined if the log is not found.
 */
function LogValue(Name, Group) {
	const entry = LogGet(Name, Group);
	if (!entry) return null;
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
