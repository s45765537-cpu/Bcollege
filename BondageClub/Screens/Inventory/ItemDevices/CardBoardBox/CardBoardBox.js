"use strict";

/** @type {ExtendedItemScriptHookCallbacks.AfterDraw<TextItemData>} */
function AssetsItemDevicesCardBoardBoxAfterDrawHook(data, originalFunction, {
	C, A, CA, X, Y, drawCanvas, drawCanvasBlink, AlphaMasks, L, Color
}) {
	if (L === "text") {
		let Height = 300;
		let Width = 200;
		let YOffset = 230;
		const TempCanvas = AnimationGenerateTempCanvas(C, A, Width, Height);

		TextItem.Init(data, C, CA, false, false);
		const [text1, text2, text3] = [CA.Property?.Text ?? "", CA.Property?.Text2 ?? "", CA.Property?.Text3 ?? ""];

		/** @type {DynamicDrawOptions} */
		const drawOptions = {
			fontSize: 35,
			fontFamily: data.font,
			color: Color,
			textAlign: "center",
			width: Width,
		};

		const ctx = TempCanvas.getContext('2d');
		if (!ctx) return;
		DynamicDrawText(text1, ctx, Width /2, Height /2, drawOptions);
		DynamicDrawText(text2, ctx, Width /2, Height /2 + 30, drawOptions);
		DynamicDrawText(text3, ctx, Width /2, Height /2 + 60, drawOptions);

		drawCanvas(TempCanvas, X +50, Y + YOffset, AlphaMasks);
		drawCanvasBlink(TempCanvas, X +50, Y + YOffset, AlphaMasks);
	}
}