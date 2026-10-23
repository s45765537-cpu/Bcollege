import { Game, utils } from "./Utils";

import savedAppearance from "./PrivateAppearance.json";

const appearance = savedAppearance as AppearanceBundle;

beforeAll(async () => {
	await Game.loadAll();
});

beforeEach(() => {
	Game.PrivateCharacter = [Game.Player];
});

afterEach(() => {
	for (const C of [...Game.Character]) {
		if (C.AccountName === "NPC_Private_Custom") Game.CharacterDelete(C);
	}
	Game.PrivateCharacter = [Game.Player];
});

describe("PrivateLoadCharacter", () => {
	it("loads a saved private NPC appearance", () => {
		const messages = captureConsoleErrors(() => {
			const updateRequired = Game.PrivateLoadCharacter({
				Name: "Sarah",
				AssetFamily: "Female3DCG",
				Appearance: utils.cloneDeep(appearance),
				AppearanceFull: utils.cloneDeep(appearance),
			});
			expect(updateRequired, "saved appearance was rejected").toBe(false);
		});
		expect(messages, "appearance validation rejected the saved NPC").toEqual([]);

		const npc = Game.PrivateCharacter.find((C: Character) => C.Name === "Sarah");
		expect(npc).toBeTruthy();
		expectWornAppearance(npc.Appearance, appearance);
		expectWornAppearance(npc.AppearanceFull, appearance);
	});

	it("still blocks a stranger from replacing an NPC body", () => {
		const npc: NPCCharacter = Game.CharacterLoadNPC("NPC_Private_Custom_stranger", "NPC_Private_Custom", "Room", "Private");
		Game.CharacterAppearanceSetDefault(npc);

		const messages = captureConsoleErrors(() => {
			const valid = Game.ServerAppearanceLoadFromBundle(npc, "Female3DCG", utils.cloneDeep(appearance), 12345);
			expect(valid).toBe(false);
		});
		expect(messages.some((message) => message.includes("Mouth/Regular"))).toBe(true);

		const mouth = npc.Appearance.find((item: Item) => item.Asset.Group.Name === "Mouth");
		expect(mouth?.Asset.Name).toBe("Regular");
	});
});

function expectWornAppearance(actual: readonly Item[], expected: AppearanceBundle) {
	const worn = new Map<AssetGroupName, ItemBundle>(
		Game.ServerAppearanceBundle(actual).map((item: ItemBundle) => [item.Group, item]),
	);
	for (const item of expected) {
		if (!item.Name || !Game.AssetGet("Female3DCG", item.Group, item.Name)) continue;
		expect(worn.get(item.Group)).toMatchObject(withoutExpression(item));
	}
	expect(worn.get("Mouth")?.Name).toBe("Full");
}

/** Facial expressions are reapplied from arousal after load, so they are not part of the saved-item check. */
function withoutExpression(item: ItemBundle): ItemBundle {
	if (!item.Property) return item;
	const { Expression: _expression, ...property } = item.Property;
	if (Object.keys(property).length === 0) {
		const { Property: _property, ...rest } = item;
		return rest;
	}
	return { ...item, Property: property };
}

function captureConsoleErrors(run: () => void): string[] {
	const messages: string[] = [];
	const spy = jest.spyOn(console, "error").mockImplementation((message?: unknown) => {
		messages.push(String(message));
	});
	try {
		run();
	} finally {
		spy.mockRestore();
	}
	return messages.filter((message) => message.startsWith("Invalid "));
}
