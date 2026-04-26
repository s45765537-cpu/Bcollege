"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<TypedItemData>} */
function InventoryItemArmsFullLatexSuitDrawHook(Data, OriginalFunction) {
	OriginalFunction();
	const C = CharacterGetCurrent();
	if (!C) return;
	const CanEquip = InventoryGet(C, "ItemVulva") == null;
	ExtendedItemCustomDraw(
		`${Data.dialogPrefix.option}Wand`,
		...ExtendedXY[6][4],
		"Assets/Female3DCG/ItemVulva/Preview/FullLatexSuitWand.png",
		!CanEquip,
	);
}

/** @type {ExtendedItemScriptHookCallbacks.Click<TypedItemData>} */
function InventoryItemArmsFullLatexSuitClickHook(Data, OriginalFunction) {
	OriginalFunction();
	const C = CharacterGetCurrent();
	if (!C) return;
	if (MouseIn(...ExtendedXY[6][4], 225, 275)) {
		const VulvaItem = InventoryGet(C, "ItemVulva");
		const Worn = (C.IsPlayer() && VulvaItem != null && VulvaItem.Asset.Name === "FullLatexSuitWand");
		ExtendedItemCustomClick("Wand", () => InventoryItemArmsFullLatexSuitSetWand(Data, C), Worn);
	}
}

/** @type {(Data: TypedItemData, C: Character) => void} */
function InventoryItemArmsFullLatexSuitSetWand(Data, C) {
	InventoryWear(C, "FullLatexSuitWand", "ItemVulva");
	ChatRoomCharacterItemUpdate(C, "ItemVulva");
	CharacterRefresh(C);

	const Prefix = ExtendedItemCustomChatPrefix("Wand", Data);
	const Dictionary = [
		{Tag: "SourceCharacter", Text: CharacterNickname(Player), MemberNumber: Player.MemberNumber},
		{Tag: "DestinationCharacter", Text: CharacterNickname(C), MemberNumber: C.MemberNumber},
	];

	ExtendedItemCustomExit(`${Prefix}Wand`, Dictionary);
}
