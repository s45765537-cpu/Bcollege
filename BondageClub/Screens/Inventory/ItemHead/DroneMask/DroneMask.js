//Heavily References Bib.js
"use strict";
var InventoryItemHeadDroneMaskAllowedChars = /^[a-zA-Z0-9 ~!]*$/;
// Load item extension properties
function InventoryItemHeadDroneMaskPattern5Load(){
    ElementCreateInput("TagText", "text", DialogFocusItem.Property.Text || "", "16")
}

// Draw extension screen image
function InventoryItemHeadDroneMaskPattern5Draw() {
    // Draw header and item
    DrawAssetPreview(1387,125, DialogFocusItem.Asset);

    // Tag data
    ElementPosition ("TagText", 1505, 600, 250);
    DrawButton(1330,731,340,64, DialogFindPlayer("CustomTagText"), (ElementValue("TagText")).match(InventoryItemHeadDroneMaskAllowedChars) ? "White" : "#888", "");
}

// Click function
function InventoryItemHeadDroneMaskPattern5Click() {
    if (
        MouseIn(1330, 731, 340, 64) &&
        // (DialogFocusItem.Property.Text !== ElementValue("TagText")) &&
        ElementValue("TagText").match(InventoryItemHeadDroneMaskAllowedChars)
    ) {
        DialogFocusItem.Property.Text = ElementValue("TagText");
        InventoryItemHeadDroneMaskChange();
    }

    // Exits screen
    if (MouseIn(1885, 25, 90, 90)) {
        InventoryItemHeadDroneMaskExit();
    }
}

// Leaves extended screen
function InventoryItemHeadDroneMaskExit() {
    ElementRemove("TagText");
    ExtendedItemSubscreen = null;
}

// When text tag is changed
function InventoryItemHeadDroneMaskChange() {
    var C = CharacterGetCurrent();
    CharacterRefresh(C, false);
    InventoryItemHeadDroneMaskExit();
}

// Drawing function for tag text
function AssetsItemHeadDroneMaskAfterDraw({
    C, A, X, Y, Property, drawCanvas, drawCanvasBlink, AlphaMasks, L, Color
}) {
    if (L === "_Text"){
        const Properties = Property || {};
        const Type = Properties.Type || "p0";
        if (!Type.includes("p5")) return;

        // Canvas setup
        let Height = 65;
        let Width = 65;
        let XOffset = 69;
        let YOffset = 89;
        const FontName = "Impact";
        const TempCanvas = AnimationGenerateTempCanvas(C, A, Width, Height);

        const text = Property && typeof Property.Text === "string" && InventoryItemHeadDroneMaskAllowedChars.test(Property.Text) ? Property.Text : "";
        const isAlone = !text;

        const drawOptions = {
            fontSize: 20,
            fontFamily: FontName,
            color: Color,
            width: Width,
        };

        // Draw the text onto the canvas
        let ctx = TempCanvas.getContext('2d');
        DynamicDrawText(text, ctx, Width/2, Height/ (isAlone? 2: 2.5), drawOptions);

        //And print the canvas onto the character based on the above positions
        drawCanvas(TempCanvas, X+ XOffset, Y + YOffset, AlphaMasks);
        drawCanvasBlink(TempCanvas, X + XOffset, Y + YOffset, AlphaMasks);
    }
}