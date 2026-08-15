/**
 * Take an object and remove all entries with (explicit) undefined values
 */
export function filterNullValues<T extends object>(obj: T): T {
	const ret = {} as typeof obj;
	for (const [k, v] of entries(obj)) {
		if (v !== undefined) {
			ret[k] = v;
		}
	}
	return ret;
}

/**
 * A {@link Object.entries} variant annotated to return respect literal key types
 * @param obj A record with string-based keys
 * @returns The key/value pairs in the passed record
 */
export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
	return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * A {@link Object.keys} variant annotated to return respect literal key types
 * @param obj A record with string-based keys
 * @returns The keys in the passed record
 */
export function keys<T extends object>(obj: T): (keyof T)[] {
	return Object.keys(obj) as (keyof T)[];
}

/**
 * Deep-clones an object
 */
export function cloneDeep<T>(
	obj: T,
	reviver: null | ((this: any, key: string, value: any) => any) = null,
	replacer: null | ((this: any, key: string, value: any) => any) = null,
): T {
	return JSON.parse(JSON.stringify(obj, replacer ?? undefined), reviver ?? undefined) as T;
}
