// @ts-strict-ignore
"use strict";

/** @type {ScriptPermissionProperty[]} */
const PreferenceScriptPermissionProperties = ["Hide", "Block"];
/** @type {null | "global" | "Hide" | "Block"} */
let PreferenceScriptHelp = null;
/** @type {null | ReturnType<typeof setTimeout>} */
let PreferenceScriptTimeoutHandle = null;
/** @type {null | number} */
let PreferenceScriptTimer = null;
let PreferenceScriptWarningAccepted = false;

const ScriptPermissionLevel = Object.freeze({
	SELF: "Self",
	OWNER: "Owner",
	LOVERS: "Lovers",
	FRIENDS: "Friends",
	WHITELIST: "Whitelist",
	PUBLIC: "Public",
});

const ScriptPermissionBits = Object.freeze({
	[ScriptPermissionLevel.SELF]: 1,
	[ScriptPermissionLevel.OWNER]: 2,
	[ScriptPermissionLevel.LOVERS]: 4,
	[ScriptPermissionLevel.FRIENDS]: 8,
	[ScriptPermissionLevel.WHITELIST]: 16,
	[ScriptPermissionLevel.PUBLIC]: 32,
});

const maxScriptPermission = Object.values(ScriptPermissionBits)
	.reduce((sum, bit) => sum | bit, 0);


function PreferenceSubscreenScriptsLoad() {
	if (PreferenceScriptWarningAccepted) return;
	PreferenceScriptTimer = Date.now() + 5000;
	PreferenceScriptTimeoutHandle = setTimeout(() => {
		PreferenceScriptTimer = null;
		PreferenceScriptTimeoutHandle = null;
	}, 5000);
}

function PreferenceSubscreenScriptsRun() {
	const helpColour = "#ff8";

	// Character, exit & help buttons
	DrawCharacter(Player, 50, 50, 0.9);

	MainCanvas.textAlign = "left";

	if (!PreferenceScriptWarningAccepted) {
		PreferenceScriptsDrawWarningScreen();
		return;
	}

	// Slightly wacky x-coordinate because DrawTextWrap assumes text is centered (500 - 1300/2 = -150)
	DrawTextWrap(TextGet("ScriptsExplanation"), -150, 150, 1300, 120, "Black");
	DrawButton(1815, 190, 90, 90, "", PreferenceScriptHelp === "global" ? helpColour : "White", "Icons/Question.png");

	/** @type {ScriptPermissionLevel[]} */
	const permissions = Object.values(ScriptPermissionLevel);

	// Can be used to page properties in the future
	/** @type {ScriptPermissionProperty[]} */
	const propertiesPage = PreferenceScriptPermissionProperties;

	MainCanvas.textAlign = "center";
	for (const [i, property] of propertiesPage.entries()) {
		DrawTextFit(TextGet(`ScriptsPermissionProperty${property}`), 850 + 300 * i, 320, 124, "Black", "Gray");
		const helpHover = MouseIn(720 + 300 * i, 296, 48, 48);
		const iconColour = PreferenceScriptHelp === property ? "_Yellow" : helpHover ? "_Cyan" : "";
		DrawImageResize(`Icons/Question${iconColour}.png`, 720 + 300 * i, 296, 48, 48);
		MainCanvas.moveTo(700 + 300 * i, 270);
		MainCanvas.strokeStyle = "rgba(0, 0, 0, 0.5)";
		MainCanvas.lineTo(700 + 300 * i, 270 + (permissions.length + 1) * 90);
		MainCanvas.stroke();
		for (const [j, permissionLevel] of permissions.entries()) {
			const disabled = permissionLevel !== ScriptPermissionLevel.PUBLIC
				&& permissionLevel !== ScriptPermissionLevel.SELF
				&& (
					ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.PUBLIC)
					|| !ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.SELF)
				);
			DrawCheckbox(816 + 300 * i, 386 + 90 * j, 64, 64, "", ValidationHasScriptPermission(Player, property, permissionLevel), disabled);
		}
	}
	MainCanvas.textAlign = "left";

	MainCanvas.moveTo(500, 370);
	MainCanvas.strokeStyle = "rgba(0, 0, 0, 0.5)";
	MainCanvas.lineTo(700 + propertiesPage.length * 300, 370);
	MainCanvas.stroke();

	for (const [i, permissionName] of permissions.entries()) {
		DrawText(TextGet(`ScriptsPermissionLevel${permissionName}`), 500, 410 + 90 * i, "Black", "Gray");
	}

	if (PreferenceScriptHelp === "global") {
		const helpHeight = 90 + 90 * permissions.length;
		DrawRect(500, 270, 1300, helpHeight, helpColour);
		MainCanvas.strokeStyle = "Black";
		MainCanvas.strokeRect(500, 270, 1300, helpHeight);
		DrawTextWrap(TextGet("ScriptsHelpGlobal"), -110, 270, 1260, helpHeight, "Black");
		MainCanvas.textAlign = "center";
		return;
	} else if (PreferenceScriptHelp) {
		const helpHeight = 90 * permissions.length;
		DrawRect(500, 370, 1300, helpHeight, helpColour);
		MainCanvas.strokeStyle = "Black";
		MainCanvas.strokeRect(500, 370, 1300, helpHeight);
		DrawTextWrap(TextGet(`ScriptsHelp${PreferenceScriptHelp}`), -110, 370, 1260, helpHeight, "Black");
	}

	MainCanvas.textAlign = "center";
}

function PreferenceScriptsDrawWarningScreen() {
	DrawText(TextGet("ScriptsWarningTitle"), 500, 220, "#c80800", "Gray");
	DrawTextWrap(TextGet("ScriptsWarning"), -140, 250, 1280, 240, "Black");

	MainCanvas.textAlign = "center";
	const disabled = PreferenceScriptTimer != null;
	const seconds = PreferenceScriptTimer ? Math.ceil((PreferenceScriptTimer - Date.now()) / 1000) : null;
	DrawButton(500, 500, 400, 64, `${TextGet("ScriptsWarningAccept")}${seconds ? ` (${seconds})` : ""}`, disabled ? "rgba(0, 0, 0, 0.12)" : "White", null, null, disabled);
	MainCanvas.textAlign = "left";
}

function PreferenceSubscreenScriptsClick() {
	if (!PreferenceScriptWarningAccepted) {
		PreferenceSubscreenScriptsWarningClick();
		return;
	}

	if (PreferenceScriptHelp === "global") {
		PreferenceScriptHelp = null;
		return;
	} else if (MouseIn(1815, 190, 90, 90)) {
		PreferenceScriptHelp = "global";
		return;
	}

	const ScriptPermissions = Player.OnlineSharedSettings.ScriptPermissions;

	/** @type {ScriptPermissionLevel[]} */
	const permissions = Object.values(ScriptPermissionLevel);

	// Can be used to page properties in the future
	/** @type {ScriptPermissionProperty[]} */
	const propertiesPage = PreferenceScriptPermissionProperties;

	for (const [i, property] of propertiesPage.entries()) {
		if (MouseIn(720 + 300 * i, 296, 48, 48)) {
			if (PreferenceScriptHelp === property) {
				PreferenceScriptHelp = null;
				return;
			} else {
				PreferenceScriptHelp = property;
				return;
			}
		}

		for (const [j, permissionLevel] of permissions.entries()) {
			if (MouseIn(816 + 300 * i, 386 + 90 * j, 64, 64)) {
				const levelSelf = permissionLevel === ScriptPermissionLevel.SELF;
				const levelPublic = permissionLevel === ScriptPermissionLevel.PUBLIC;
				const selfAllowed = ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.SELF);
				const publicAllowed = ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.PUBLIC);
				if (levelSelf) {
					ScriptPermissions[property].permission = selfAllowed ? 0 : ScriptPermissionBits[permissionLevel];
				} else if (levelPublic) {
					ScriptPermissions[property].permission = publicAllowed ? 0 : maxScriptPermission;
				} else if (selfAllowed && !publicAllowed) {
					ScriptPermissions[property].permission ^= ScriptPermissionBits[permissionLevel];
				}
				return;
			}
		}
	}

	PreferenceScriptHelp = null;
}

function PreferenceSubscreenScriptsExit() {
	return true;
}

function PreferenceSubscreenScriptsUnload() {
	if (PreferenceScriptTimeoutHandle != null) {
		clearTimeout(PreferenceScriptTimeoutHandle);
		PreferenceScriptTimeoutHandle = null;
	}
	PreferenceScriptTimer = null;
	const scriptItem = InventoryGet(Player, "ItemScript");
	if (scriptItem) {
		const params = ValidationCreateDiffParams(Player, Player.MemberNumber);
		const { item, valid } = ValidationResolveScriptDiff(null, scriptItem, params);
		if (!valid) {
			console.info("Cleaning script item after permissions modification");
			if (item) {
				Player.Appearance = Player.Appearance.map((playerItem) => {
					return playerItem.Asset.Group.Name === "ItemScript" ? item : playerItem;
				});
			} else {
				InventoryRemove(Player, "ItemScript", false);
			}
			if (ServerPlayerIsInChatRoom()) {
				ChatRoomCharacterUpdate(Player);
			} else {
				CharacterRefresh(Player);
			}
		}
	}
}

function PreferenceSubscreenScriptsWarningClick() {
	if (PreferenceScriptTimer == null && MouseIn(500, 500, 400, 64)) {
		PreferenceScriptWarningAccepted = true;
	}
}
