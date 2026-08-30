import { Game } from "./game";
import { querySelector } from "./element";

/**
 * Sets the current screen and calls the loading script if needed
 */
export function set(...spec: ScreenSpecifier): Promise<void> {
	return Game.CommonSetScreen(...spec);
}

/**
 * Await a screen changes as triggered via {@link CommonSetScreen}
 */
export async function awaitScreenChange(): Promise<void> {
	await Game.ScreenIsLoadingPromise;
}

/**
 * Simulate a canvas click at the specified coordinates
 * @param x X coordinate in the `[0, 2000]` interval
 * @param y Y coordinate in the `[0, 1000]` interval
 */
export function canvasClick(x: number, y: number): void {
	Game.MouseX = x;
	Game.MouseY = y;
	const canvas: HTMLCanvasElement = querySelector("canvas#MainCanvas");
	canvas.click();
}
