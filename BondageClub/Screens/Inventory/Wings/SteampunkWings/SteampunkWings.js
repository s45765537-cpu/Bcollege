'use strict';

function AssetsWingsSteampunkWingsBeforeDraw({ PersistentData, L, LayerType: lt }) {
	if (!L.includes("Wing")) return;

	const MaxFrame = 8;
	const Data = PersistentData();

	if (typeof Data.State !== "number") Data.State = 0;
	if (typeof Data.Modifier !== "number") Data.Modifier = 1;
	if (Data.DrawRequested) {
		if (Data.State == MaxFrame) Data.Modifier = -1;
		if (Data.State == 0) Data.Modifier = 1;
		Data.State += Data.Modifier;
	}

	Data.DrawRequested = false;
	const LayerType = Data.State === 0 ? '' : Data.State;
	return { LayerType };
}

function AssetsWingsSteampunkWingsScriptDraw({ C, PersistentData }) {
	const Data = PersistentData();
	const FrameTime = 150;

	if (typeof Data.ChangeTime !== "number") Data.ChangeTime = CommonTime() + FrameTime;

	if (Data.ChangeTime < CommonTime()) {
		Data.ChangeTime = CommonTime() + FrameTime;
		Data.DrawRequested = true;
		AnimationRequestRefreshRate(C, FrameTime);
		AnimationRequestDraw(C);
	}
}