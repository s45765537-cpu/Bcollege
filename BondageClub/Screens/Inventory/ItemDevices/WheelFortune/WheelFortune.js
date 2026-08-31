"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemDevicesWheelFortuneLoadHook() {
	WheelFortuneReturnScreen = CommonGetScreen();
	WheelFortuneBackground = "MainHall";
	if (ServerPlayerIsInChatRoom()) WheelFortuneBackground = ChatRoomData?.Background ||  "Black";
	WheelFortuneCharacter = CharacterGetCurrent();
	DialogLeave();
	CommonSetScreen("MiniGame", "WheelFortune");
}
