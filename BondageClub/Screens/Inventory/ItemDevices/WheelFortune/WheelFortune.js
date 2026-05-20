"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemDevicesWheelFortuneLoadHook() {
	WheelFortuneReturnScreen = CommonGetScreen();
	WheelFortuneBackground = "MainHall";
	if (ServerPlayerIsInChatRoom()) WheelFortuneBackground = ChatRoomGetBackgroundURL();
	WheelFortuneCharacter = CharacterGetCurrent();
	DialogLeave();
	CommonSetScreen("MiniGame", "WheelFortune");
}
