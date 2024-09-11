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
	if (PreferenceExtensionsCurrent) {
		PreferenceExtensionsCurrent.run();
		return;
	}

	DrawCharacter(Player, 50, 50, 0.9);

	MainCanvas.textAlign = "left";
	DrawText(TextGet("ExtensionsPreferences"), 500, 125, "Black", "Gray");

	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");

	MainCanvas.textAlign = "center";
	CommonGenerateGrid(PreferenceExtensionsDisplay, 0, PreferenceSubscreenMainGrid, (item, x, y, w, h) => {
		DrawButton(x, y, 400, 90, "", "White", item.Image || null);
		DrawTextFit(item.Button, x + 245, y + 45, 310, "Black");
		return false;
	});
}

/**
 * Handles clicks in the preference subscreen for extensions
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsClick() {
	if (PreferenceExtensionsCurrent) {

		PreferenceExtensionsCurrent.click();
		return;
	}
	if (MouseIn(1815, 75, 90, 90)) PreferenceSubscreenExit();

	CommonGenerateGrid(PreferenceExtensionsDisplay, 0, PreferenceSubscreenMainGrid, (item, x, y, w, h) => {
		if (MouseIn(x, y, w, h)) {
			item.click();
			return true;
		}
		return false;
	});

}

function PreferenceSubscreenExtensionsUnload() {
	PreferenceExtensionsCurrent?.unload?.();
}

function PreferenceSubscreenExtensionsExit() {
	if (PreferenceExtensionsCurrent) {
		if (PreferenceExtensionsCurrent.exit() ?? true) {
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
