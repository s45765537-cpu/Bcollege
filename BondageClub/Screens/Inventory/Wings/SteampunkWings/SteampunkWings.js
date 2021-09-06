function AssetsWingsSteampunkWingsBeforeDraw({ PersistentData, L, LayerType: lt }) {
	if (!L.includes("Wing")) return;

	const MaxFrame = 2;
	const Data = PersistentData();

	if (typeof Data.State !== "number") Data.State = 0;
	if (Data.DrawRequested)
		Data.State = Data.State == MaxFrame ? 0 : Data.State + 1;

	Data.DrawRequested = false;
	const LayerType = Data.State === 0 ? '' : Data.State;
	return { LayerType };
}

function AssetsWingsSteampunkWingsScriptDraw({ C, PersistentData }) {
	const Data = PersistentData();
	const FrameTime = 300;

	if (typeof Data.State !== "number") Data.State = 0;
	if (typeof Data.ChangeTime !== "number") Data.ChangeTime = CommonTime() + FrameTime;

	if (Data.ChangeTime < CommonTime()) {
		Data.ChangeTime = CommonTime() + FrameTime;
		Data.DrawRequested = true;
		AnimationRequestRefreshRate(C, FrameTime);
		AnimationRequestDraw(C);
	}
}