"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemDevicesWheelFortuneLoadHook() {
	WheelFortuneReturnScreen = CommonGetScreen();
	WheelFortuneBackground = "MainHall";
	if (CurrentScreen == "ChatRoom") WheelFortuneBackground = ChatRoomBackground;
	WheelFortuneCharacter = CharacterGetCurrent();
	DialogLeave();
	CommonSetScreen("MiniGame", "WheelFortune");
}
