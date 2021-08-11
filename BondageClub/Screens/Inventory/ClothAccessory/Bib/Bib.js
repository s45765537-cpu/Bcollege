"use strict";
var InventoryClothAccessoryBibAllowedChars = /^[a-zA-Z0-9 ~!]*$/;
// Loads the item extension properties
function InventoryClothAccessoryBibTxt1Load() {
	ElementCreateInput("TagText", "text", DialogFocusItem.Property.Text || "", "24");
}

// Draw the extension screen
function InventoryClothAccessoryBibTxt1Draw() {
	// Draw the header and item
	DrawAssetPreview(1387, 125, DialogFocusItem.Asset);

	// Tag data
	ElementPosition("TagText", 1375, 680, 250);
	DrawButton(1500, 651, 350, 64, DialogFindPlayer("CustomTagText"), ElementValue("TagText").match(InventoryClothAccessoryBibAllowedChars) ? "White" : "#888", "");
}

// Catches the item extension clicks
function InventoryClothAccessoryBibTxt1Click() {
	if (
		MouseIn(1500, 651, 350, 64) &&
		DialogFocusItem.Property.Text !== ElementValue("TagText") &&
		ElementValue("TagText").match(InventoryClothAccessoryBibAllowedChars)
	) {
		DialogFocusItem.Property.Text = ElementValue("TagText");
		InventoryClothAccessoryBibChange();
	}

	// Exits the screen
	if (MouseIn(1885, 25, 90, 90)) {
		InventoryClothAccessoryBibExit();
	}
}

// Leaves the extended screen
function InventoryClothAccessoryBibExit() {
	ElementRemove("TagText");
	ExtendedItemSubscreen = null;
}

// When the tag is changed
function InventoryClothAccessoryBibChange() {
	var C = CharacterGetCurrent();
	CharacterRefresh(C);
	if (CurrentScreen == "ChatRoom") {
		var Dictionary = [];
		Dictionary.push({ Tag: "SourceCharacter", Text: Player.Name, MemberNumber: Player.MemberNumber });
		Dictionary.push({ Tag: "DestinationCharacter", Text: C.Name, MemberNumber: C.MemberNumber });
		ChatRoomPublishCustomAction("ChangeCustomTag", false, Dictionary);
	}
	InventoryClothAccessoryBibExit();
}

// Drawing function for the text on the tag
function AssetsClothAccessoryBibAfterDraw({
	C, A, X, Y, Property, drawCanvas, drawCanvasBlink, AlphaMasks, L, Color
}) {
	if (L === "_Text") {
		const Properties = Property || {};
		const Type = Properties.Type || "x0";
		if (!Type.includes("x1")) return;

		// We set up a canvas
		let Height = 60;
		let Width = 120;
		let XOffset = 10;
		let YOffset = 22;
		const FontName = "sans-serif";
		const TempCanvas = AnimationGenerateTempCanvas(C, A, Width, Height);

		const text = Property && typeof Property.Text === "string" && InventoryClothAccessoryBibAllowedChars.test(Property.Text) ? Property.Text : "Tag";

		// We draw the desired info on that canvas
		let context = TempCanvas.getContext('2d');
		context.font = "18px " + FontName;
		context.fillStyle = Color;
		context.textAlign = "center";
		context.fillText(text, Width / 2, Width / 2, Width);

		// We print the canvas to the character based on the asset position
		drawCanvas(TempCanvas, X + XOffset, Y + YOffset, AlphaMasks);
		drawCanvasBlink(TempCanvas, X + XOffset, Y + YOffset, AlphaMasks);
	}
}
