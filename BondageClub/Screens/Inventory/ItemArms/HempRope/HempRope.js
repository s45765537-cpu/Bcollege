"use strict";

/** @type {ExtendedItemCallbacks.BeforeDraw} */
function AssetsItemArmsHempRopeBeforeDraw(data) {
	const typeRecord = data.Property?.TypeRecord ?? {};
	const subType = typeRecord.typed ?? 0;
	const cuffsInFront = subType === 3 && typeRecord.p === 1;
	if (data.L === "Leash") {
		if (!cuffsInFront) return { Y: -10000 };
		// Held art follows the item's IsLeashed flag and chat-room leash state (CharacterRefreshLeash does not reload C.Effect)
		return { LayerType: InventoryItemArmsHempRopeRopeCuffsIsLeashHeld(data.C, data.CA) ? "Held" : "" };
	} else if (data.L === "LeashKnot" || data.L === "RopeCuffs_Link") {
		return cuffsInFront ? data : { Y: -10000 };
	} else if (data.L === "RopeCuffsFront") {
		return cuffsInFront ? data : { Y: -10000 };
	} else if (cuffsInFront && data.L === "") {
		// "RopeCuffs" in the front position: move the behind-the-back rope art off-canvas
		return { Y: -10000 };
	} else if (subType === 11) { // "BedSpreadEagle"
		return {
			X: data.X - 50,
			Y: data.Y - 150,
		};
	} else if (subType === 12 && data.L === "Suspension") {
		return {
			// Hide the rope split-into-four behind hair as otherwise it appears odd
			Y: data.Y + 30,
		};
	}
	return data;
}

/**
 * The poses of the two "RopeCuffs" subscreen positions; index 0 is behind the back (the default), index 1 is in front.
 * Button names double as `AssetStrings.csv` label keys; button coordinates and images come from the subscreen's `DrawData`.
 */
const InventoryItemArmsHempRopeRopeCuffsPositions = /** @type {const} */ ([
	{ Name: "ItemArmsHempRopeRopeCuffsBack", Pose: "BackCuffs", Action: "ArmsRopeSetRopeCuffs" },
	{ Name: "ItemArmsHempRopeRopeCuffsFront", Pose: "BaseUpper", Action: "ArmsRopeSetRopeCuffsFront" }, // hands in front (same as Metal/Wooden cuffs)
]);

/** Index of the "RopeCuffs" option in {@link TypedItemDataLookup}.ItemArmsHempRope.options */
const InventoryItemArmsHempRopeRopeCuffsTypedIndex = 3;

/** Upper-body poses allowed while the rope-cuffs sub-position is selected (overrides the asset's BackBoxTie-only list) */
const InventoryItemArmsHempRopeRopeCuffsAllowActivePose = /** @type {const} */ (["BaseUpper", "BackCuffs"]);

/**
 * @param {Item} item
 * @returns {boolean}
 */
function InventoryItemArmsHempRopeRopeCuffsIsActive(item) {
	return item.Property?.TypeRecord?.typed === InventoryItemArmsHempRopeRopeCuffsTypedIndex;
}

/**
 * Return the currently selected rope cuffs position of the passed item (0: behind back, 1: in front)
 * @param {Item} item
 * @returns {0 | 1}
 */
function InventoryItemArmsHempRopeRopeCuffsGetPosition(item) {
	return item.Property?.TypeRecord?.p === 1 ? 1 : 0;
}

/**
 * Whether the rope-cuffs leash should use held art for the passed character
 * @param {Character} C
 * @param {Item} item
 * @returns {boolean}
 */
function InventoryItemArmsHempRopeRopeCuffsIsLeashHeld(C, item) {
	if (InventoryItemHasEffect(item, "IsLeashed", true)) return true;
	if (C.IsPlayer() && ChatRoomLeashPlayer != null) return true;
	return Array.isArray(ChatRoomLeashList) && C.MemberNumber != null && ChatRoomLeashList.indexOf(C.MemberNumber) >= 0;
}

/**
 * Toggle the leash effect for the front rope-cuffs position (enables chat-room leashing)
 * @param {Item} item
 * @param {0 | 1} position
 * @returns {boolean} Whether the item's `Effect` property was modified
 */
function InventoryItemArmsHempRopeRopeCuffsUpdateLeashEffect(item, position) {
	item.Property ??= {};
	const wantLeash = position === 1;
	const oldEffect = [...(item.Property.Effect ?? [])];
	/** @type {EffectName[]} */
	let effect = [...oldEffect];
	if (position === 0) {
		effect = effect.filter(e => e !== E.Leash && e !== E.IsLeashed);
	} else {
		// Front position: manage Leash only; IsLeashed is owned by CharacterRefreshLeash
		effect = effect.filter(e => e !== E.Leash);
		if (wantLeash) {
			effect.push(E.Leash);
		}
	}
	item.Property.Effect = effect;
	return oldEffect.join() !== effect.join();
}

/**
 * Apply the passed rope cuffs position to the item, updating its `TypeRecord` and `SetPose`,
 * and syncing the character's active upper-body pose (item `SetPose` alone can lose to a stale `ActivePose`)
 * @param {Character} C
 * @param {Item} item
 * @param {0 | 1} position
 * @returns {boolean} Whether the item's properties were updated or not
 */
function InventoryItemArmsHempRopeRopeCuffsSetPosition(C, item, position) {
	const poseName = InventoryItemArmsHempRopeRopeCuffsPositions[position].Pose;
	item.Property ??= {};
	item.Property.TypeRecord ??= {};
	const poseChanged = item.Property.TypeRecord.p !== position || (item.Property.SetPose ?? []).join() !== poseName;
	const allowActivePoseChanged = (item.Property.AllowActivePose ?? []).join() !== InventoryItemArmsHempRopeRopeCuffsAllowActivePose.join();
	item.Property.TypeRecord.p = position;
	item.Property.SetPose = [poseName];
	item.Property.AllowActivePose = [...InventoryItemArmsHempRopeRopeCuffsAllowActivePose];
	const effectChanged = InventoryItemArmsHempRopeRopeCuffsUpdateLeashEffect(item, position);
	if (poseChanged || allowActivePoseChanged) {
		// Force the pose: the asset's generated AllowActivePose is BackBoxTie-only, which blocks BaseUpper in PoseRefresh
		PoseSetActive(C, poseName, true);
	}
	return poseChanged || effectChanged || allowActivePoseChanged;
}

/**
 * Sync rope-cuffs pose and leash effect after equip, validation, or login
 * @param {Character} C
 * @param {Item} item
 * @param {boolean} push
 * @param {boolean} refresh
 * @returns {boolean}
 */
function InventoryItemArmsHempRopeRopeCuffsSync(C, item, push, refresh) {
	if (!InventoryItemArmsHempRopeRopeCuffsIsActive(item)) return false;
	const update = InventoryItemArmsHempRopeRopeCuffsSetPosition(C, item, InventoryItemArmsHempRopeRopeCuffsGetPosition(item));
	if (update) {
		if (refresh) CharacterRefresh(C, push, false);
		if (push) ChatRoomCharacterItemUpdate(C, item.Asset.Group.Name);
	}
	return update;
}

/** @type {ExtendedItemScriptHookCallbacks.Init<TypedItemData>} */
function InventoryItemArmsHempRopeInitHook(data, originalFunction, C, item, push, refresh) {
	const update = originalFunction(C, item, push, refresh);
	if (InventoryItemArmsHempRopeRopeCuffsIsActive(item)) {
		return InventoryItemArmsHempRopeRopeCuffsSync(C, item, push, refresh) || update;
	}
	if (item.Property?.AllowActivePose) {
		delete item.Property.AllowActivePose;
		return true;
	}
	return update;
}

/** @type {ExtendedItemScriptHookCallbacks.Init<NoArchItemData>} */
function InventoryItemArmsHempRopeRopeCuffsInitHook(data, originalFunction, C, item, push, refresh) {
	originalFunction(C, item, false, false);
	return InventoryItemArmsHempRopeRopeCuffsSync(C, item, push, refresh);
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemArmsHempRopeRopeCuffsDrawHook(data, originalFunction) {
	originalFunction();

	const item = DialogFocusItem;
	if (!item) return;
	const position = InventoryItemArmsHempRopeRopeCuffsGetPosition(item);
	InventoryItemArmsHempRopeRopeCuffsPositions.forEach((button, i) => {
		const { position: [x, y], imagePath } = data.drawData.elementData[i];
		ExtendedItemCustomDraw(button.Name, x, y, imagePath, position === i);
	});
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemArmsHempRopeRopeCuffsClickHook(data, originalFunction) {
	originalFunction();
	if (!ExtendedItemSubscreen) return; // The exit button was clicked

	const C = CharacterGetCurrent();
	const item = DialogFocusItem;
	if (!C || !item) return;

	InventoryItemArmsHempRopeRopeCuffsPositions.forEach((button, i) => {
		const position = /** @type {0 | 1} */ (i);
		const [x, y, w, h] = data.drawData.elementData[i].position;
		if (!MouseIn(x, y, w, h)) return;
		ExtendedItemCustomClick(button.Name, () => {
			if (InventoryItemArmsHempRopeRopeCuffsGetPosition(item) === position) return;
			InventoryItemArmsHempRopeRopeCuffsSetPosition(C, item, position);
			CharacterRefresh(C, false, false);
			if (C.IsPlayer()) ServerPlayerAppearanceSync();
			ChatRoomCharacterItemUpdate(C, data.asset.Group.Name);
			if (ServerPlayerIsInChatRoom()) ChatRoomCharacterUpdate(C);
			if (ServerPlayerIsInChatRoom()) {
				const dictionary = new DictionaryBuilder()
					.sourceCharacter(Player)
					.destinationCharacter(C)
					.asset(data.asset)
					.build();
				ChatRoomPublishCustomAction(button.Action, false, dictionary);
			}
		}, true);
	});
}
