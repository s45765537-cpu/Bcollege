"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemDevicesWheelFortuneLoadHook() {
	WheelFortuneEntryModule = CurrentModule;
	WheelFortuneEntryScreen = CurrentScreen;
	WheelFortuneBackground = "MainHall";
	if (CurrentScreen == "ChatRoom") WheelFortuneBackground = ChatRoomBackground;
	WheelFortuneCharacter = CurrentCharacter;
	DialogLeave();
	CommonSetScreen("MiniGame", "WheelFortune");
}
