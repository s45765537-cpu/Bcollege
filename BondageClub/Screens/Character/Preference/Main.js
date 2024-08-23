"use strict";

/** @type {CommonGenerateGridParameters} */
const PreferenceSubscreenMainGrid = {
	x: 500,
	y: 160,
	width: 1700,
	height: 700,
	itemWidth: 400,
	itemHeight: 90,
	itemMarginX: 20,
	itemMarginY: 20,
	direction: "vertical",
};

function PreferenceSubscreenMainLoad() {
	const exts = PreferenceSubscreens.find(s => s.name === "Extensions");
	exts.hidden = Object.keys(PreferenceExtensionsSettings).length === 0;
}

function PreferenceSubscreenMainRun() {
	// Draw the player & controls
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	MainCanvas.textAlign = "left";
	DrawText(TextGet("Preferences"), 500, 125, "Black", "Gray");
	MainCanvas.textAlign = "center";

	// Draw all the buttons to access the submenus
	CommonGenerateGrid(PreferenceSubscreens.filter(s => !s.hidden), 0, PreferenceSubscreenMainGrid, (screen, x, y, w, h) => {
		const icon = screen.icon || "Icons/" + screen.name + ".png";
		DrawButton(x, y, w, h, "", "White", icon);
		const desc = screen.description || TextGet("Homepage" + screen.name);
		DrawTextFit(desc, x + 245, y + 46, 310, "Black");
		return false;
	});
}

function PreferenceSubscreenMainClick() {
	// Exit button
	if (MouseIn(1815, 75, 90, 90)) PreferenceExit();

	// Open the selected subscreen
	CommonGenerateGrid(PreferenceSubscreens.filter(s => !s.hidden), 0, PreferenceSubscreenMainGrid, (screen, x, y, w, h) => {
		if (!MouseIn(x, y, w, h)) return false;
		PreferencePageCurrent = 1;
		if (screen.load) screen.load();
		PreferenceSubscreen = screen;
		return true;
	});
}
