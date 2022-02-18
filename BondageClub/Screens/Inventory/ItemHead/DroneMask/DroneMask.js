//Heavily References Bib.js and Transport Jacket
"use strict";
let InventoryItemHeadDroneMaskOriginalText = null;
const InventoryItemHeadDroneMaskFont = "Impact";
var InventoryItemHeadDroneMaskAllowedChars = /^[a-zA-Z0-9 ~!]*$/;
// Load item extension properties
function InventoryItemHeadDroneMaskPattern5Load(){

    const C = CharacterGetCurrent();

    // ElementCreateInput("TagText", "text", DialogFocusItem.Property.Text || "", "16")
    const input = ElementCreateInput("TagText", "text", DialogFocusItem.Property.Text || "", "16");
    if (input) {
        input.pattern = DynamicDrawTextInputPattern;
        input.addEventListener("input", (e) => InventoryItemHeadDroneMaskTextChange(C, DialogFocusItem, e.target.value))
    } // Testing for dynamically displayed input 
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
        InventoryItemHeadDroneMaskExit();
    }

    // Exits screen
    if (MouseIn(1885, 25, 90, 90)) {
        InventoryItemHeadDroneMaskExit();
        return ExtendedItemExit();
    }
}

// Leaves extended screen
function InventoryItemHeadDroneMaskExit() {
   ElementRemove("TagText");
   ExtendedItemSubscreen = null;
}

// Leave extended screen with changes saved
function InventoryItemHeadDroneMaskPattern5Exit() {
    const C = CharacterGetCurrent();
    const item = DialogFocusItem;

    CharacterRefresh(C);
    ChatRoomCharacterItemUpdate(C, item.Asset.Group.Name);

    ElementRemove("TagText");
    InventoryItemHeadDroneMaskOriginalText = null;
    DialogFocusItem = null;
    if (DialogInventory != null) DialogMenuButtonBuild(C);
}

// Referenced from TransportJacket for experimentation
const InventoryItemHeadDroneMaskTextChange = CommonLimitFunction((C, item, text) => {
   item = DialogFocusItem || item;
      if (DynamicDrawTextRegex.test(text)) {
       item.Property.Text = text.substring(0, 16)
       CharacterLoadCanvas(C);
   }
});

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
        const FontName = InventoryItemHeadDroneMaskFont;
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