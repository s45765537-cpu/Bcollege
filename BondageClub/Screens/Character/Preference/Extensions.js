"use strict";

/** @type {PreferenceExtensionsMenuButtonInfo[]} */
let PreferenceExtensionsDisplay = [];
/** @type {PreferenceExtensionsSettingItem | null}*/
let PreferenceExtensionsCurrent = null;

/**
 * Handles the loading of the preference subscreen for extensions
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsLoad() {
	PreferenceExtensionsDisplay = Object.keys(PreferenceExtensionsSettings).map(
		k => (
			s=>({
				Button: typeof s.ButtonText === "function" ? s.ButtonText() : s.ButtonText,
				Image: s.Image && (typeof s.Image === "function" ? s.Image() : s.Image),
				click: () => {
					PreferenceExtensionsCurrent = s;
					s?.load();
				}
			}))(PreferenceExtensionsSettings[k]));
}

/**
 * Runs and draws the preference subscreen for extensions
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsRun() {
	if(PreferenceExtensionsCurrent === null) {
		DrawCharacter(Player, 50, 50, 0.9);

		MainCanvas.textAlign = "left";
		DrawText(TextGet("ExtensionsPreferences"), 500, 125, "Black", "Gray");

		MainCanvas.textAlign = "center";
		PreferenceExtensionsDisplay.forEach((s, i) => {
			const X = 500 + Math.floor(i / 7) * 420;
			const Y = 160 + (i % 7) * 110;
			DrawButton(X, Y, 400, 90, "", "White", s.Image || null);
			DrawTextFit(s.Button, X + 245, Y + 45, 310, "Black");
		});

		DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	} else {
		PreferenceExtensionsCurrent.run();
	}
}

/**
 * Handles clicks in the preference subscreen for extensions
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsClick() {
	if(PreferenceExtensionsCurrent === null) {
		if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenExit();
		PreferenceExtensionsDisplay.forEach((s, i) => {
			const X = 500 + Math.floor(i / 7) * 420;
			const Y = 160 + (i % 7) * 110;
			if (MouseIn(X, Y, 400, 90)) s.click();
		});
	} else {
		PreferenceExtensionsCurrent.click();
	}
}

function PreferenceSubscreenExtensionsUnload() {
	PreferenceExtensionsCurrent?.unload?.();
}

function PreferenceSubscreenExtensionsExit() {
	if (PreferenceExtensionsCurrent) {
		if (PreferenceExtensionsCurrent.exit()) {
			PreferenceSubscreenExtensionsClear();
			return false;
		}
	}
	return true;
}

/**
 * Exit the preference subscreen for extensions, should be called when
 * leaving custom menu of extensions if the extension exits the menu from itself.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsClear() {
	if (PreferenceExtensionsCurrent === null) return;
	PreferenceExtensionsCurrent.unload?.();
	PreferenceExtensionsCurrent = null;
	// Reload the extension settings
	PreferenceSubscreenExtensionsLoad();
}
