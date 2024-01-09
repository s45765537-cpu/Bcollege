"use strict";

/**
 * @typedef LactationPumpPersistentData
 * @property {number} [LastSuction]
 * @property {number} [SuctionDuration]
 */

/** @type {ExtendedItemCallbacks.BeforeDraw<LactationPumpPersistentData>} */
function AssetsItemNipplesLactationPumpBeforeDraw(data) {
	// If suspended off the ground, use the normal pose image
	if (data.C.IsSuspended() && data.C.HeightRatioProportion < 1) {
		return { Pose: null };
	}

	return null;
}

const LactationPumpDuration = 10000;

function LactationPumpGetRandomDuration() {
	return LactationPumpDuration + Math.round(Math.random() * LactationPumpDuration);
}

/** @type {ExtendedItemCallbacks.ScriptDraw<LactationPumpPersistentData>} */
function AssetsItemNipplesLactationPumpScriptDraw(data) {
	const { Item, C } = data;
	const persist = data.PersistentData();

	// We do nothing if suction is disabled or if we're rendering someone else
	if (Item.Property.SuctionLevel < 0 || !C.IsPlayer()) return;

	if (persist.LastSuction === undefined) {
		persist.LastSuction = CurrentTime;
	}
	if (persist.SuctionDuration === undefined) {
		persist.SuctionDuration = LactationPumpGetRandomDuration();
	}

	if ((CurrentTime - persist.LastSuction) >= persist.SuctionDuration) {
		/** @type {ItemActivity} */
		const activity = { Activity: AssetGetActivity("Female3DCG", "Suck"), Item: Item };
		ActivityRun(C, C, Item.Asset.Group, activity, false);

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
