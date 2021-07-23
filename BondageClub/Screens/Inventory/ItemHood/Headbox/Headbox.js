const InventoryItemHoodHeadboxFont = "'Saira Stencil One', 'Arial', sans-serif";
const InventoryItemHoodHeadboxFrameCount = 6;

//TODO: set type for modular subscreen

function AssetsItemHoodHeadboxScriptDraw({ C, PersistentData, Item }) {
    // TODO: proper frame count (change 6 for whatever)
	const Data = PersistentData();
	const Properties = Item.Property || {};
	const Type = Properties.Type ? Properties.Type : "ef0mf0";
	const FrameTime = 200;

    // Init potentially unexisting values
    if (typeof Data.EyeFlapState !== "number")
        Data.EyeFlapState = Type.indexOf("ef1") > -1 ? InventoryItemHoodHeadboxFrameCount : 1;
    if (typeof Data.MouthFlapState !== "number")
        Data.MouthFlapState = Type.indexOf("mf1") > -1 ? InventoryItemHoodHeadboxFrameCount : 1;
    if (typeof Data.ChangeTime !== "number")
        Data.ChangeTime = CommonTime() + FrameTime;
    if (typeof Data.DrawRequested !== "object")
        Data.DrawRequested = {};

    // Trigger refresh for the animation if necessary
	if (Data.MustChange && Data.ChangeTime < CommonTime()) {
		Data.ChangeTime = CommonTime() + FrameTime;
        Data.DrawRequested = { EyeFlapState: true, MouthFlapState: true};
		AnimationRequestRefreshRate(C, FrameTime);
		AnimationRequestDraw(C);
	}
}

function AssetsItemHoodHeadboxBeforeDraw({ PersistentData, L, Property }) {
	if (L !== "_EyeFlap" && L !== "_MouthFlap") return;
	
	const Data = PersistentData();
	const Properties = Property || {};
	const Type = Properties.Type ? Properties.Type : "ef0mf0";
    
    // Determine if the animation should keep playing
    const EyeFlapIsStale = Data.EyeFlapState >= InventoryItemHoodHeadboxFrameCount || Data.EyeFlapState <= 1;
    const MouthFlapIsStale = Data.MouthFlapState >= InventoryItemHoodHeadboxFrameCount || Data.MouthFlapState <= 1;
    if (MouthFlapIsStale && EyeFlapIsStale) Data.MustChange = false;
    
    // Determine the animation frame to draw
    const LayerFlapName = (L === "_EyeFlap") ? "EyeFlapState" : "MouthFlapState";
    const LayerFlapState = Data[LayerFlapName];
    const IsShutting = Type.indexOf((L === "_EyeFlap") ? "ef1" : "mf1") > -1;
	if ((LayerFlapState < InventoryItemHoodHeadboxFrameCount && IsShutting) || (LayerFlapState >= 2 && !IsShutting)) {
		if (Data.DrawRequested[LayerFlapName]) Data[LayerFlapName] += IsShutting ? 1 : -1;
		Data.MustChange = true;
		Data.DrawRequested[LayerFlapName] = false;
        if (LayerFlapState < InventoryItemHoodHeadboxFrameCount && LayerFlapState > 1)
            return { LayerType: "A" + LayerFlapState };
	}
}

function AssetsItemHoodHeadboxAfterDraw({
	C, A, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color
}) {
    if (L === "_Text" && Property && Property.Type && Property.Type.indexOf("txt1") > -1) {
		// We set up a canvas
		const height = 100; //TODO: canvas height, font size, font style style, placement
		const width = 155;
		const tempCanvas = AnimationGenerateTempCanvas(C, A, width, height);
		const ctx = tempCanvas.getContext("2d");

		const text1 = (Property && typeof Property.Text === "string" && DynamicDrawTextRegex.test(Property.Text) ? Property.Text : "♠");

		const drawOptions = {
			fontSize: 18,
			fontFamily: InventoryItemHoodHeadboxFont,
			color: Color,
			effect: DynamicDrawTextEffect.BURN,
			width,
		};

		DynamicDrawText(text1, ctx, width / 2, height / 2 , drawOptions);

		// We print the canvas on the character based on the asset position
		drawCanvas(tempCanvas, X + 170, Y + 200, AlphaMasks);
		drawCanvasBlink(tempCanvas, X + 170, Y + 200, AlphaMasks);
	}
}

function InventoryItemHoodHeadboxText1Load(C) {
    //TODO
}

function InventoryItemHoodHeadboxText1Draw() {
    //TODO
}

function InventoryItemHoodHeadboxText1Click() {
    //TODO
}

function InventoryItemHoodHeadboxText1Exit() {
    //TODO
}