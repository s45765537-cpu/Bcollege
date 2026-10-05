import { Game, character } from "./Utils";

beforeAll(async () => {
	await Game.loadAll();
});

const siblingPrereqs: ActivityPrerequisite[] = ["Sisters", "Brothers", "SiblingsWithDifferentGender", "SiblingsNeutral"];
const allPronouns: CharacterPronouns[] = ["SheHer", "HeHim", "TheyThem", "ItIt"];

function withPronouns(name: string, pronouns: CharacterPronouns, siblings: boolean): Character {
	const C = character.create(name);
	Game.InventoryWear(C, pronouns, "Pronouns");
	C.IsSiblingOfCharacter = () => siblings;
	return C;
}

function passing(acting: Character, acted: Character): ActivityPrerequisite[] {
	const group = Game.AssetGroupGet("Female3DCG", "ItemArms");
	return siblingPrereqs.filter((prereq) => Game.ActivityCheckPrerequisite(prereq, acting, acted, group));
}

describe("ActivityCheckPrerequisite sibling activities", () => {
	it.each([
		["SheHer", "SheHer", "Sisters"],
		["HeHim", "HeHim", "Brothers"],
		["SheHer", "HeHim", "SiblingsWithDifferentGender"],
		["HeHim", "SheHer", "SiblingsWithDifferentGender"],
		["TheyThem", "SheHer", "SiblingsNeutral"],
		["HeHim", "ItIt", "SiblingsNeutral"],
		["TheyThem", "TheyThem", "SiblingsNeutral"],
	] as const)("%s and %s siblings get only %s", (a, b, expected) => {
		expect(passing(withPronouns("A", a, true), withPronouns("B", b, true))).toEqual([expected]);
	});

	it("every pronoun pair of siblings gets exactly one", () => {
		for (const a of allPronouns) {
			for (const b of allPronouns) {
				expect(passing(withPronouns("A", a, true), withPronouns("B", b, true))).toHaveLength(1);
			}
		}
	});

	it("non-siblings get none", () => {
		for (const a of allPronouns) {
			for (const b of allPronouns) {
				expect(passing(withPronouns("A", a, false), withPronouns("B", b, false))).toEqual([]);
			}
		}
	});
});
