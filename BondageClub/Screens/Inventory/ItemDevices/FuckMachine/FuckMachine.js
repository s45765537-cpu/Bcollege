function InventoryItemDevicesFuckMachineLoad() {
	VibratorModeLoad([VibratorModeSet.STANDARD, VibratorModeSet.ADVANCED]);
}

function InventoryItemDevicesFuckMachineDraw() {
	VibratorModeDraw([VibratorModeSet.STANDARD, VibratorModeSet.ADVANCED]);
}

function InventoryItemDevicesFuckMachineClick() {
	VibratorModeClick([VibratorModeSet.STANDARD, VibratorModeSet.ADVANCED]);
}


function AssetsItemDevicesFuckMachineBeforeDraw({ PersistentData, L, X, Y, Property }) {
	const Data = PersistentData();
	if (typeof Data.DildoState !== "number") Data.DildoState = 0;
	if (typeof Data.Modifier !== "number") Data.Modifier = 1;
	
	const YOffset = 27;
	
	if (L === "_Dildo") return { Y: Y + YOffset + Data.DildoState };
	if (L !== "_Pole") return;
	
	const Properties = Property || {};
	const Intensity = typeof Properties.Intensity === "number" ? Properties.Intensity : -1;

	
	const FuckLength = 32;
	const AnimationQualityRatio = (Player.GraphicsSettings ? Math.max(Player.GraphicsSettings.AnimationQuality * 0.6, 30) : 30) / 30;
	Data.Speed = (Intensity + 1) * 2;
	if (Data.DildoState >= FuckLength) {
		Data.Modifier = -1;
	} else if (Data.DildoState <= -FuckLength) {
		Data.Modifier = 1;
	}
	
	Data.DildoState += Data.Modifier * Data.Speed * AnimationQualityRatio;
	
	return { Y: Y + YOffset + Data.DildoState };
}

function AssetsItemDevicesFuckMachineScriptDraw(data) {
	VibratorModeScriptDraw(data);
	const Data = data.PersistentData();
	const Properties = data.Item.Property || {};
	const FrameTime = Player.GraphicsSettings ? Math.max(30, (Player.GraphicsSettings.AnimationQuality * 0.6)) : 30;
	const Intensity = typeof Properties.Intensity === "number" ? Properties.Intensity : -1;

	if (typeof Data.FuckChangeTime !== "number") Data.FuckChangeTime = CommonTime() + FrameTime;
	
	if (Intensity !== -1 && Data.FuckChangeTime < CommonTime()) {
		Data.FuckChangeTime = CommonTime() + FrameTime;
		AnimationRequestRefreshRate(data.C, FrameTime);
		AnimationRequestDraw(data.C);
	}
}