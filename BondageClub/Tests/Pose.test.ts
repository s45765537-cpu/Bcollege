"use strict";

import { Game } from "./Utils";

Game.load("../Scripts/Character.js");
Game.load("../Scripts/ColorPicker.js"); // GetDefaultSavedColors

Game.load("../Scripts/Dialog.js"); // DialogSelfMenuSelected
Game.load("../Scripts/Asset.js"); // PoseType
Game.load("../Scripts/Pose.js"); // PoseAllKneeling
Game.load("../Assets/Female3DCG/Female3DCG.js"); // We need the poses
Game.load("../Scripts/Common.js"); //  CurrentModule, CurrentScreen

// Mock that so we don't depend on the renderer
Game.CharacterRefresh = () => {};
Game.AnimationPurge = () => {};

let Player: PlayerCharacter;

beforeAll(() => {
	Game.Pose = Game.PoseFemale3DCG;
	Game.Pose.forEach((p: Pose) => Game.PoseRecord[p.Name] = p);
});

function createMockPlayer() {
	// Janky CharacterCreatePlayer, skipping settings setup
	Game.Player = Game.CharacterCreate("Female3DCG", Game.CharacterType.PLAYER, "") as PlayerCharacter;
	const oldId = Game.Player.ID;
	Game.Player.ID = 0;
	Game.Player.Log = [];
	Game.Character[0] = Game.Player;
	if (oldId !== 0 && oldId !== undefined) {
		Game.Character.splice(oldId, 1);
	}
	Game.CharacterNextId--;

	Game.Player.Name = "Player";
	Player = Game.Player;
}

beforeEach(() => {
	if (Game.Player) {
		Game.CharacterDelete(Game.Player);
		Game.Player = undefined;
		Player = undefined!;
	}
	createMockPlayer();

	expect(Game.Character).toHaveLength(1);
});

describe("Given a character", () => {
	it("defaults to an empty array", () => {
		expect(Player.ActivePose).toIncludeSameMembers(["BaseUpper", "BaseLower"]);
	});

	it("resets to the default when passed null", () => {
		Game.PoseSetActive(Player, null);
		expect(Player.ActivePose).toIncludeSameMembers(["BaseUpper", "BaseLower"]);
	});

	it("uses the first specified pose in case of conflicts", () => {
		Game.PoseSetActive(Player, ["BaseUpper", "BackElbowTouch"]);
		expect(Player.ActivePose).toIncludeSameMembers(["BaseUpper", "BaseLower"]);
		expect(Player.ActivePose).not.toInclude("BackElbowTouch");
	});
});

describe("Given some stressful pose changes", () => {
	beforeEach(() => {
		Game.PoseSetActive(Player, null);
		expect(Player.ActivePose).toIncludeSameMembers(["BaseUpper", "BaseLower"]);
	});

	it("it manages to keep the pose sane", () => {
		Game.PoseSetActive(Player, "Kneel");
		expect(Player.ActivePose).toIncludeSameMembers(["BaseUpper", "Kneel"]);

		Game.PoseSetActive(Player, "Suspension");
		expect(Player.ActivePose).toIncludeSameMembers(["BaseUpper", "Kneel", "Suspension"]);

		Game.PoseSetActive(Player, "Hogtied");
		expect(Player.ActivePose).toIncludeSameMembers(["Hogtied"]);

		Game.PoseSetActive(Player, "BackElbowTouch");
		expect(Player.ActivePose).toIncludeSameMembers(["BackElbowTouch", "BaseLower"]);
	});
});
