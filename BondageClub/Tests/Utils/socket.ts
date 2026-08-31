import { Game } from "./game";

/**
 * Mock a "server to client" event
 * @param ev The event name
 * @param args The even data
 */
export function mockResponse<T extends keyof ServerToClientEvents>(ev: T, ...args: Parameters<ServerToClientEvents[T]>): void {
	Game.ServerSocket.mockResponse(ev, ...args);
}
