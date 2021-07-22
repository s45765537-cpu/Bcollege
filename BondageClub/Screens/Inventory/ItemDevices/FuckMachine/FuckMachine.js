function InventoryItemDevicesFuckMachineLoad() {
	VibratorModeLoad([VibratorModeSet.STANDARD, VibratorModeSet.ADVANCED]);
}

function InventoryItemDevicesFuckMachineDraw() {
	VibratorModeDraw([VibratorModeSet.STANDARD, VibratorModeSet.ADVANCED]);
}

function InventoryItemDevicesFuckMachineClick() {
	VibratorModeClick([VibratorModeSet.STANDARD, VibratorModeSet.ADVANCED]);
}


function AssetsItemDevicesFuckMachineBeforeDraw({ PersistentData, L, Y, Property }) {
	if (L !== "_Dildo") return;
	
	const FuckLength = 25;
	const Data = PersistentData();
	const Properties = Property || {};
	const Intensity = typeof Properties.Intensity === "number" ? Properties.Intensity : -1;

	if (typeof Data.DildoState !== "number") Data.DildoState = 0;
	if (typeof Data.Modifier !== "number") Data.Modifier = 1;
	
	Data.Speed = Intensity + 1;
	if (Data.DildoState >= FuckLength) {
		Data.Modifier = -1;
	} else if (Data.DildoState <= -FuckLength) {
		Data.Modifier = 1;
	}
	
	Data.DildoState += Data.Modifier * Data.Speed;
	
	return { Y: Y + Data.DildoState };
}

function AssetsItemDevicesFuckMachineScriptDraw(data) {
	//VibratorModeScriptDraw(data);
	const Data = data.PersistentData();
	const Properties = data.Item.Property || {};
	const FrameTime = 30;
	const Intensity = typeof Properties.Intensity === "number" ? Properties.Intensity : -1;

	if (typeof Data.FuckChangeTime !== "number") Data.FuckChangeTime = CommonTime() + FrameTime;
	
	if (Intensity !== -1 && Data.FuckChangeTime < CommonTime()) {
		Data.FuckChangeTime = CommonTime() + FrameTime;
		Data.DrawRequested = true;
		AnimationRequestRefreshRate(data.C, FrameTime);
		AnimationRequestDraw(data.C);
	}
}