"use strict";

/** @typedef {{ LastSuction?: number, SuctionDuration?: number } & AnimationPersistentData} LactationPumpPersistentData */

/** @type {ExtendedItemCallbacks.BeforeDraw<LactationPumpPersistentData>} */
function AssetsItemNipplesLactationPumpBeforeDraw(data) {
	// If suspended off the ground, use the normal pose image
	if (data.C.IsSuspended() && (data.C.HeightRatioProportion ?? 1) < 1) {
		return { Pose: null };
	}

	return data;
}

/** Minimum time (in ms) the pump waits between its messages. Max is two times that. */
const LactationPumpDuration = 5 * 60 * 1000;

function LactationPumpGetRandomDuration() {
	return LactationPumpDuration + Math.round(Math.random() * LactationPumpDuration);
}

/** @type {ExtendedItemCallbacks.ScriptDraw<LactationPumpPersistentData>} */
function AssetsItemNipplesLactationPumpScriptDraw(data) {
	const { Item, C } = data;
	const persist = data.PersistentData();
	Item.Property ??= {};

	// We do nothing if suction is disabled or if we're rendering someone else
	if (!Item.Property.SuctionLevel || !C.IsPlayer() || !Item.Asset.Group.IsItem()) return;

	if (persist.LastSuction === undefined) {
		persist.LastSuction = CurrentTime;
	}
	if (persist.SuctionDuration === undefined) {
		persist.SuctionDuration = LactationPumpGetRandomDuration();
	}

	if ((CurrentTime - persist.LastSuction) >= persist.SuctionDuration) {
		const activity = AssetGetActivity("Female3DCG", "Suck");
		if (activity) {
			/** @type {ItemActivity} */
			const itemActivity = { Activity: activity, Item: Item, Group: Item.Asset.Group.MirrorActivitiesFrom ?? Item.Asset.Group.Name };
			ActivityRun(C, C, Item.Asset.Group, itemActivity, false);
		}

		const dict = new DictionaryBuilder()
			.targetCharacterName(C)
			.performActivity("Suck", Item.Asset.Group, Item, 1)
			.suctionLevel(Item.Property.SuctionLevel)
			.markAutomatic();
		ChatRoomPublishCustomAction("LactationPumpSuctionEvent", false, dict.build());

		persist.LastSuction = CurrentTime;
		persist.SuctionDuration = LactationPumpGetRandomDuration();
	}
}
