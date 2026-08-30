import { Game } from "./game";

/**
 * Query a selector and throw if it cannot be found.
 *
 * See {@link document.querySelector}
 */
export function querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K];
export function querySelector<E extends Element=Element>(selectors: string): E;
export function querySelector(selectors: string): Element {
	const ret: null | Element = Game.document.querySelector(selectors);
	if (!ret) {
		throw new Error(`Missing "${Game.CurrentModule}/${Game.CurrentScreen}" element "${selectors}"`);
	}
	return ret;
};
