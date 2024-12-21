"use strict";

/** @type {ExtendedItemScriptHookCallbacks.AfterDraw<TextItemData>} */
function AssetsFaceMarkingsFaceWritingsAfterDrawHook(data, originalFunction, {
	C, A, CA, X, Y, drawCanvas, drawCanvasBlink, AlphaMasks, L, Color
}) {
	if (L !== "Text")
		return;

	// We set up a canvas
	const Height = 65;
	const Width = 200;
	const TempCanvas = AnimationGenerateTempCanvas(C, A, Width, Height);

	/** @type {DynamicDrawOptions} */
	const drawOptions = {
		fontSize: 8,
		fontFamily: data.font,
		color: Color,
		width: Width,
	};

	switch (CA.Property.TypeRecord.p) {
		case 0: // Cheek L
			X-=22;
			Y-=182;
			drawOptions.textAlign = "center";
			break;
		case 1: // Forehead
			Y-=240;
			drawOptions.textAlign = "center";
			break;
		case 2: // Cheek R
			X+=22;
			Y-=182;
			drawOptions.textAlign = "center";
			break;
		default:
			return;
	}

	if (CA.Property.TypeRecord.p >= 3 && CA.Property.TypeRecord.p <= 5 && C.HasAttribute("UpperLarge")) {
		Y += 17;
	}

	TextItem.Init(data, C, CA, false, false);
	const [text1, text2, text3] = [CA.Property.Text, CA.Property.Text2];

	// We draw the desired info on that canvas
	const ctx = TempCanvas.getContext('2d');
	DynamicDrawText(text1, ctx, Width / 2, Height / 2 - 10, drawOptions);
	DynamicDrawText(text2, ctx, Width / 2, Height / 2, drawOptions);

	// We print the canvas to the character based on the asset position
	drawCanvas(TempCanvas, X + Width/2, Y + Height/2 , AlphaMasks);
	drawCanvasBlink(TempCanvas, X + Width/2, Y + Height/2 , AlphaMasks);
}

