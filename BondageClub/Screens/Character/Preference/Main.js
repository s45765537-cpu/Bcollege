"use strict";

function PreferenceSubscreenMainRun() {
	// Draw the player & controls
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	MainCanvas.textAlign = "left";
	DrawText(TextGet("Preferences"), 500, 125, "Black", "Gray");
	MainCanvas.textAlign = "center";

	// Only show the Extension settings if there are any registered
	const adjustedSubscreenList = Object.keys(PreferenceExtensionsSettings).length > 0 ? PreferenceSubscreenList.concat("Extensions") : PreferenceSubscreenList;

	// Draw all the buttons to access the submenus
	for (let A = 0; A < adjustedSubscreenList.length; A++) {
		DrawButton(500 + 420 * Math.floor(A / 7), 160 + 110 * (A % 7), 400, 90, "", "White", "Icons/" + adjustedSubscreenList[A] + ".png");
		DrawTextFit(TextGet("Homepage" + adjustedSubscreenList[A]), 745 + 420 * Math.floor(A / 7), 205 + 110 * (A % 7), 310, "Black");
	}
}

function PreferenceSubscreenMainClick() {
	// Exit button
	if (MouseIn(1815, 75, 90, 90)) PreferenceExit();

	const adjustedSubscreenList = Object.keys(PreferenceExtensionsSettings).length > 0 ? PreferenceSubscreenList.concat("Extensions") : PreferenceSubscreenList;

	// Open the selected subscreen
	for (let A = 0; A < adjustedSubscreenList.length; A++)
		if (MouseIn(500 + 420 * Math.floor(A / 7), 160 + 110 * (A % 7), 400, 90)) {
			if (typeof window["PreferenceSubscreen" + adjustedSubscreenList[A] + "Load"] === "function")
				CommonDynamicFunction("PreferenceSubscreen" + adjustedSubscreenList[A] + "Load()");
			PreferenceSubscreen = adjustedSubscreenList[A];
			PreferencePageCurrent = 1;
			if (adjustedSubscreenList[A] === "Scripts") {
				PreferenceScriptTimer = Date.now() + 5000;
				PreferenceScriptTimeoutHandle = setTimeout(() => {
					PreferenceScriptTimer = null;
					PreferenceScriptTimeoutHandle = null;
				}, 5000);
			}
			break;
		}
}
