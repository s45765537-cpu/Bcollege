"use_strict";

/**
 * Take an object and remove all entries with (explicit) undefined values
 * @template {object} T
 * @param {T} obj
 * @returns {T}
 */
function filterNullValues(obj) {
	const ret = /** @type {typeof obj} */({});
	for (const [k, v] of entries(obj)) {
		if (v !== undefined) {
			ret[k] = v;
		}
	}
	return ret;
}

/**
 * A {@link Object.entries} variant annotated to return respect literal key types
 * @template {{}} T
 * @param {T} obj A record with string-based keys
 * @returns {[keyof T, T[keyof T]][]} The key/value pairs in the passed record
 */
function entries(obj) {
	return /** @type {[keyof T, T[keyof T]][]} */(Object.entries(obj));
}

/**
 * A {@link Object.keys} variant annotated to return respect literal key types
 * @template {object} T
 * @param {T} obj A record with string-based keys
 * @returns {(keyof T)[]} The keys in the passed record
 */
function keys(obj) {
	return /** @type {(keyof T)[]} */(Object.keys(obj));
}

/**
 * Deep-clones an object
 * @todo JSON serialization will break things like functions, Sets and Maps.
 * @template T
 * @param {T} obj
 * @param {null | ((this: any, key: string, value: any) => any)} [replacer]
 * @param {null | ((this: any, key: string, value: any) => any)} [reviver]
 * @returns {T}
 */
function cloneDeep(obj, reviver=null, replacer=null) {
	reviver ??= undefined;
	replacer ??= undefined;
	return /** @type {T} */ (JSON.parse(JSON.stringify(obj, replacer), reviver));
}

module.exports = {
  filterNullValues,
  entries,
  keys,
  cloneDeep,
};
