"use strict";

/** @deprecated - Superseded by `span.dialog-status`. */
var DialogText = /** @type {never} */("");
/** @deprecated  - Superseded by `span.dialog-status[data-default]`.*/
var DialogTextDefault = /** @type {never} */("");
/** @deprecated  - Superseded by `span.dialog-status[data-timeout-id]`.*/
var DialogTextDefaultTimer = /** @type {never} */(-1);

/** The duration temporary status message show up for, in ms
 * @type {number}
 */
var DialogTextDefaultDuration = 5000;
/**
 * The default color to use when applying items.
 * @type {null | string}
 */
var DialogColorSelect = null;
/**
 * The list of available items for the selected group.
 * @type {DialogInventoryItem[]}
 */
var DialogInventory = [];
/**
 * The current page offset of the item list. Also used for activities.
 * @type {number}
 */
var DialogInventoryOffset = 0;

/**
 * The grid configuration for most item views (items, permissions, activities)
 * @type {CommonGenerateGridParameters}
 */
const DialogInventoryGrid = (() => {
	const gap = 20;
	const padding = 25;
	const topButtonSize = 90;
	const itemWidth = 200;
	const itemHeight = 244;
	return {
		x: 2000 - padding - (9 * topButtonSize + 8 * gap),
		y: 185,
		width: 4 * itemWidth + 3 * gap,
		height: 3 * itemHeight + 2 * gap,
		itemWidth,
		itemHeight,
	};
})();

/**
 * The item currently selected in the Dialog and showing its extended screen.
 *
 * Note that in case this is a lock, the item being locked is available in {@link DialogFocusSourceItem}.
 * @type {Item|null}
 */
var DialogFocusItem = null;
/** @type {Item|null} */
var DialogTightenLoosenItem = null;
/**
 * The actual item being locked while the lock asset has its extended screen drawn.
 * @type {Item|null}
 */
var DialogFocusSourceItem = null;
/** @type {null | ReturnType<typeof setTimeout>} */
var DialogFocusItemColorizationRedrawTimer = null;
/**
 * The list of currently visible menu item buttons.
 * @type {DialogMenuButton[]}
 */
var DialogMenuButton = [];
/**
 * The dialog's current mode, what is currently shown.
 * @type {DialogMenuMode}
 */
var DialogMenuMode = "dialog";

/** @deprecated Use {@link DialogMenuMode}. */
var DialogColor = /** @type {never} */(null);
/** @deprecated Use {@link DialogMenuMode}. */
var DialogItemPermissionMode = /** @type {never} */(null);
/** @deprecated Use {@link DialogMenuMode}.*/
var DialogItemToLock = /** @type {never} */(null);
/** @deprecated Use {@link DialogMenuMode}. */
var DialogActivityMode = /** @type {never} */(false);
/** @deprecated Use {@link DialogMenuMode}. */
var DialogLockMenu = /** @type {never} */(false);
/** @deprecated Use {@link DialogMenuMode}. */
var DialogCraftingMenu = /** @type {never} */(false);

/**
 * The group that was selected before we entered the expression coloring screen
 * @type {{mode: DialogMenuMode, group: AssetItemGroup}}
 */
var DialogExpressionPreviousMode = null;

/** @type {ExpressionItem[]} */
var DialogFacialExpressions = [];
/** The maximum number of expressions per page for a given asset group. */
const DialogFacialExpressionsPerPage = 18;
/**
 * The currently selected expression page number for a given asset group.
 * Contains up to {@link DialogFacialExpressionsPerPage} expressions.
 */
let DialogFacialExpressionsSelectedPage = 0;
var DialogFacialExpressionsSelected = -1;
var DialogFacialExpressionsSelectedBlindnessLevel = 2;
/** @type {Character[]} */
var DialogSavedExpressionPreviews = [];
/** @type {Pose[][]} */
var DialogActivePoses = [];
var DialogExtendedMessage = "";
/**
 * The list of available activities for the selected group.
 * @type {ItemActivity[]}
 */
var DialogActivity = [];
/** @satisfies {Record<string, DialogSortOrder>} */
var DialogSortOrder = /** @type {const} */({
	Enabled: 1,
	Equipped: 2,
	BothFavoriteUsable: 3,
	TargetFavoriteUsable: 4,
	PlayerFavoriteUsable: 5,
	Usable: 6,
	TargetFavoriteUnusable: 7,
	PlayerFavoriteUnusable: 8,
	Unusable: 9,
	Blocked: 10
});
/** @type {null | DialogSelfMenuOptionType} */
var DialogSelfMenuSelected = null;
var DialogLeaveDueToItem = false; // This allows dynamic items to call DialogLeave() without crashing the game
var DialogLentLockpicks = false;
var DialogGamingPreviousRoom = "";
/** @type {"" | ModuleType} */
var DialogGamingPreviousModule = "";
var DialogButtonDisabledTester = /Disabled(For\w+)?$/u;
/**
 * The attempted action that's leading the player to struggle.
 * @type {DialogStruggleActionType?}
 */
let DialogStruggleAction = null;
/**
 * The item we're struggling out of, or swapping from.
 * @type {Item}
 */
let DialogStrugglePrevItem = null;
/**
 * The item we're swapping to.
 * @type {Item}
 */
let DialogStruggleNextItem = null;
/** Whether we went through the struggle selection screen or went straight through. */
let DialogStruggleSelectMinigame = false;

/** @type {Map<string, string>} */
var PlayerDialog = new Map();

/** @type {FavoriteState[]} */
var DialogFavoriteStateDetails = [
	{
		TargetFavorite: true,
		PlayerFavorite: true,
		Icon: "FavoriteBoth",
		UsableOrder: DialogSortOrder.BothFavoriteUsable,
		UnusableOrder: DialogSortOrder.TargetFavoriteUnusable
	},
	{
		TargetFavorite: true,
		PlayerFavorite: false,
		Icon: "Favorite",
		UsableOrder: DialogSortOrder.TargetFavoriteUsable,
		UnusableOrder: DialogSortOrder.TargetFavoriteUnusable
	},
	{
		TargetFavorite: false,
		PlayerFavorite: true,
		Icon: "FavoritePlayer",
		UsableOrder: DialogSortOrder.PlayerFavoriteUsable,
		UnusableOrder: DialogSortOrder.PlayerFavoriteUnusable
	},
	{
		TargetFavorite: false,
		PlayerFavorite: false,
		Icon: null,
		UsableOrder: DialogSortOrder.Usable,
		UnusableOrder: DialogSortOrder.Unusable
	},
];

/**
 * The list of menu types available when clicking on yourself
 * @type {readonly DialogSelfMenuOptionType[]}
 */
var DialogSelfMenuOptions = [
	{
		Name: "Expression",
		IsAvailable: () => true,
		Draw: DialogDrawExpressionMenu,
		Click: DialogClickExpressionMenu,
	},
	{
		Name: "Pose",
		IsAvailable: () => (CurrentScreen == "ChatRoom" || CurrentScreen == "Photographic"),
		Load: DialogLoadPoseMenu,
		Draw: DialogDrawPoseMenu,
		Click: DialogClickPoseMenu,
	},
	{
		Name: "SavedExpressions",
		IsAvailable: () => true,
		Draw: DialogDrawSavedExpressionsMenu,
		Click: DialogClickSavedExpressionsMenu,
	},
	{
		Name: "OwnerRules",
		IsAvailable: () => false,
		Draw: DialogDrawOwnerRulesMenu,
		Click: () => { },
	},
];

/**
 * Namespace with {@link DialogLeaveFocusItem} helpers for setting up new screens.
 * @namespace
 */
var DialogLeaveFocusItemHandlers = {
	/**
	 * Screen setup callbacks for after exiting the tighten/loosen menu; screen names are used as keys.
	 * @type {Record<string, (item: Item) => void>}
	 */
	DialogTightenLoosenItem: {
		Crafting: (item) => {
			// Subtract deterministic modifiers so that only the difficulty factor remains
			CraftingSelectedItem.DifficultyFactor = (
				item.Difficulty
				- SkillGetLevel(Player, "Bondage")
				- item.Asset.Difficulty
				- (item.Craft?.Property === "Secure" ? 4 : 0)
			);
			item.Difficulty = item.Asset.Difficulty;
			CraftingModeSet("Name");
		},
	},

	/**
	 * Screen setup callbacks for after exiting the extended item menu; screen names are used as keys.
	 * @type {Record<string, (item: Item) => void>}
	 */
	DialogFocusItem: {
		Appearance: () => DialogLeave(),
		Crafting: (item) => {
			CraftingUpdateFromItem(item);
			CraftingModeSet("Name");
		},
		Shop2: () => {
			Shop2Vars.Mode = "Preview";
			Shop2Load();
		},
	},
};

/**
 * Returns character based on argument
 * @param {Character | string} C - The characer to get; can be `"Player"` to get player or empty to get current
 * @returns {Character} - The actual character
 */
function DialogGetCharacter(C) {
	if (typeof C === "string")
		return (C.toUpperCase().trim() == "PLAYER") ? Player : CurrentCharacter;
	return C;
}

/**
 * Compares the player's reputation with a given value
 * @param {ReputationType} RepType - The name of the reputation to check
 * @param {string} Value - The value to compare
 * @returns {boolean} - Returns TRUE if a specific reputation type is less or equal than a given value
 */
function DialogReputationLess(RepType, Value) { return (ReputationGet(RepType) <= parseInt(Value)); }

/**
 * Compares the player's reputation with a given value
 * @param {ReputationType} RepType - The name of the reputation to check
 * @param {string} Value - The value to compare
 * @returns {boolean} - Returns TRUE if a specific reputation type is greater or equal than a given value
 */
function DialogReputationGreater(RepType, Value) { return (ReputationGet(RepType) >= parseInt(Value)); }

/**
 * Compares the player's money with a given amount
 * @param {string} Amount - The amount of money that must be met
 * @returns {boolean} - Returns TRUE if the player has enough money
 */
function DialogMoneyGreater(Amount) { return (parseInt(Player.Money) >= parseInt(Amount)); }

/**
 * Changes a given player's account by a given amount
 * @param {string} Amount - The amount that should be charged or added to the player's account
 * @returns {void} - Nothing
 */
function DialogChangeMoney(Amount) { CharacterChangeMoney(Player, parseInt(Amount)); }

/**
 * Alters the current player's reputation by a given amount
 * @param {ReputationType} RepType - The name of the reputation to change
 * @param {number|string} Value - The value, the player's reputation should be altered by
 * @returns {void} - Nothing
 */
function DialogSetReputation(RepType, Value) { ReputationChange(RepType, (parseInt(ReputationGet(RepType)) * -1) + parseInt(Value)); } // Sets a fixed number for the player specific reputation

/**
 * Change the player's reputation progressively through dialog options (a reputation is easier to break than to build)
 * @param {ReputationType} RepType - The name of the reputation to change
 * @param {number|string} Value - The value, the player's reputation should be altered by
 * @returns {void} - Nothing
 */
function DialogChangeReputation(RepType, Value) { ReputationProgress(RepType, Value); }

/**
 * Equips a specific item on the player from dialog
 * @param {string} AssetName - The name of the asset that should be equipped
 * @param {AssetGroupName} AssetGroup - The name of the corresponding asset group
 * @returns {void} - Nothing
 */
function DialogWearItem(AssetName, AssetGroup) { InventoryWear(Player, AssetName, AssetGroup); }

/**
 * Equips a random item from a given group to the player from dialog
 * @param {AssetGroupName} AssetGroup - The name of the asset group to pick from
 * @returns {void} - Nothing
 */
function DialogWearRandomItem(AssetGroup) { InventoryWearRandom(Player, AssetGroup); }

/**
 * Removes an item of a specific item group from the player
 * @param {AssetGroupName} AssetGroup - The item to be removed belongs to this asset group
 * @returns {void} - Nothing
 */
function DialogRemoveItem(AssetGroup) { InventoryRemove(Player, AssetGroup); }

/**
 * Releases a character from restraints
 * @param {string | Character} C - The character to be released.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {void} - Nothing
 */
function DialogRelease(C) { CharacterRelease(DialogGetCharacter(C)); }

/**
 * Strips a character naked and removes the restraints
 * @param {string | Character} C - The character to be stripped and released.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {void} - Nothing
 */
function DialogNaked(C) { CharacterNaked(DialogGetCharacter(C)); }

/**
 * Fully restrain a character with random items
 * @param {string | Character} C - The character to be restrained.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {void} - Nothing
 */
function DialogFullRandomRestrain(C) { CharacterFullRandomRestrain(DialogGetCharacter(C)); }

/**
 * Checks, if a specific log has been registered with the player
 * @template {LogGroupType} T
 * @param {LogNameType[T]} LogType - The name of the log to search for
 * @param {T} LogGroup - The name of the log group
 * @returns {boolean} - Returns true, if a specific log is registered
 */
function DialogLogQuery(LogType, LogGroup) { return LogQuery(LogType, LogGroup); }

/**
 * Sets the AllowItem flag on the current character
 * @param {string} Allow - The flag to set. Either "TRUE" or "FALSE"
 * @returns {boolean} - The boolean version of the flag
 */
function DialogAllowItem(Allow) { return CurrentCharacter.AllowItem = (Allow.toUpperCase().trim() == "TRUE"); }

/**
 * Returns the value of the AllowItem flag of a given character
 * @param {string | Character} C - The character whose flag should be returned.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - The value of the given character's AllowItem flag
 */
function DialogDoAllowItem(C) { return !DialogDontAllowItemPermission(C); }


/**
 * Returns TRUE if the AllowItem flag doesn't allow putting an item on the current character
 * @returns {boolean} - The reversed value of the given character's AllowItem flag
 */
function DialogDontAllowItemPermission(C) { return !DialogGetCharacter(C ? C : CurrentCharacter).AllowItem; }

/**
 * Returns TRUE if no item can be used by the player on the current character because of the map distance
 * @returns {boolean} - TRUE if distance is too far (more than 1 tile)
 */
function DialogDontAllowItemDistance() {
	if ((CurrentCharacter == null) || CurrentCharacter.IsPlayer()) return false;
	if ((CurrentScreen !== "ChatRoom") || !ChatRoomMapViewIsActive()) return false;
	if (ChatRoomMapViewHasSuperPowers() || ChatRoomMapViewCharacterOnWhisperRange(CurrentCharacter)) return false;
	return true;
}

/**
 * Determines if the given character is kneeling
 * @param {string | Character} C - The character to check
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - Returns true, if the given character is kneeling
 */
function DialogIsKneeling(C) { return DialogGetCharacter(C).IsKneeling(); }

/**
 * Determines if the player is owned by the current character
 * @returns {boolean} - Returns true, if the player is owned by the current character, false otherwise
 */
function DialogIsOwner() { return CurrentCharacter.IsOwner(); }

/**
 * Determines, if the current character is the player's lover
 * @returns {boolean} - Returns true, if the current character is one of the player's lovers
 */
function DialogIsLover() { return CurrentCharacter.IsLoverOfCharacter(Player); }

/**
 * Determines if the current character is owned by the player
 * @returns {boolean} - Returns true, if the current character is owned by the player, false otherwise
 */
function DialogIsProperty() { return CurrentCharacter.IsOwnedByPlayer(); }

/**
 * Checks, if a given character is currently restrained
 * @param {string | Character} C - The character to check.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - Returns true, if the given character is wearing restraints, false otherwise
 */
function DialogIsRestrained(C) { return DialogGetCharacter(C).IsRestrained(); }

/**
 * Checks, if a given character is currently blinded
 * @param {string | Character} C - The character to check.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - Returns true, if the given character is blinded, false otherwise
 */
function DialogIsBlind(C) { return DialogGetCharacter(C).IsBlind(); }

/**
 * Checks, if a given character is currently wearing a vibrating item
 * @param {string | Character} C - The character to check.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - Returns true, if the given character is wearing a vibrating item, false otherwise
 */
function DialogIsEgged(C) { return DialogGetCharacter(C).IsEgged(); }

/**
 * Checks, if a given character is able to change her clothes
 * @param {string | Character} C - The character to check.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - Returns true, if the given character is able to change clothes, false otherwise
 */
function DialogCanInteract(C) { return DialogGetCharacter(C).CanInteract(); }

/**
 * Sets a new pose for the given character
 * @param {string} C - The character whose pose should be altered.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @param {null | AssetPoseName} [NewPose=null] - The new pose, the character should take.
 * Can be omitted to bring the character back to the standing position.
 * @returns {void} - Nothing
 */
function DialogSetPose(C, NewPose) { PoseSetActive((C.toUpperCase().trim() == "PLAYER") ? Player : CurrentCharacter, NewPose || null, true); }

/**
 * Checks, whether a given skill of the player is greater or equal a given value
 * @param {SkillType} SkillType - Name of the skill to check
 * @param {string} Value - The value, the given skill must be compared to
 * @returns {boolean} - Returns true if a specific skill is greater or equal than a given value
 */
function DialogSkillGreater(SkillType, Value) { return (parseInt(SkillGetLevel(Player, SkillType)) >= parseInt(Value)); }

/**
 * Checks, if a given item is available in the player's inventory
 * @param {string} InventoryName
 * @param {AssetGroupName} InventoryGroup
 * @returns {boolean} - Returns true, if the item is available, false otherwise
 */
function DialogInventoryAvailable(InventoryName, InventoryGroup) { return InventoryAvailable(Player, InventoryName, InventoryGroup); }

/**
 * Checks, if the player is the administrator of the current chat room
 * @returns {boolean} - Returns true, if the player belogs to the group of administrators for the current char room false otherwise
 */
function DialogChatRoomPlayerIsAdmin() { return (ChatRoomPlayerIsAdmin() && (CurrentScreen == "ChatRoom")); }

/**
 * Checks, if a safe word can be used.
 * @returns {boolean} - Returns true, if the player is currently within a chat room
 */
function DialogChatRoomCanSafeword() { return (CurrentScreen == "ChatRoom" && !AsylumGGTSIsEnabled() && Player.GameplaySettings.EnableSafeword); }

/**
 * Checks if the player is currently owned.
 * @returns {boolean} - Returns true, if the player is currently owned by an online player (not in trial)
 */
function DialogCanViewRules() { return Player.IsFullyOwned(); }

/**
 * Checks if the has enough GGTS minutes to spend on different activities, for GGTS level 6 and up
 * @param {string} Minute - The number of minutes to compare
 * @returns {boolean} - TRUE if the player has enough minutes
 */
function DialogGGTSMinuteGreater(Minute) { return AsylumGGTSHasMinutes(parseInt(Minute)); }

/**
 * Checks if the player can spend GGTS minutes on herself, for GGTS level 6 and up
 * @returns {boolean} - TRUE if the player has enough minutes
 */
function DialogGGTSCanSpendMinutes() { return (AsylumGGTSIsEnabled() && (AsylumGGTSGetLevel(Player) >= 6)); }

/**
 * The player can ask GGTS for specific actions at level 6, requiring minutes as currency
 * @param {string} Action - The action to trigger
 * @param {string} Minute - The number of minutes to spend
 * @returns {void}
 */
function DialogGGTSAction(Action, Minute) {
	AsylumGGTSDialogAction(Action, parseInt(Minute));
}

/**
 * Checks if the player can beg GGTS to unlock the room
 * @returns {boolean} - TRUE if GGTS can unlock
 */
function DialogGGTSCanUnlock() {
	return (ChatRoomPlayerIsAdmin() && (CurrentScreen == "ChatRoom") && AsylumGGTSHasMinutes(30) && (ChatRoomData != null) && ChatRoomData.Locked);
}

/**
 * Checks if the player can get the GGTS helmet, only available from GGTS
 * @returns {boolean} - TRUE if GGTS can unlock
 */
function DialogGGTSCanGetHelmet() {
	return (AsylumGGTSHasMinutes(200) && (!InventoryAvailable(Player, "FuturisticHelmet", "ItemHood") || !InventoryAvailable(Player, "GGTSHelmet", "ItemHood")));
}

/**
 * Nurses can do special GGTS interactions with other players
 * @returns {boolean} - TRUE if the player is a nurse in a GGTS room
 */
function DialogCanStartGGTSInteractions() {
	return (AsylumGGTSIsEnabled() && (CurrentCharacter != null) && (AsylumGGTSGetLevel(CurrentCharacter) >= 1) && !DialogCanWatchKinkyDungeon() && (ReputationGet("Asylum") > 0));
}

/**
 * Nurses can ask GGTS for specific interactions with other players
 * @param {string} Interaction - The interaction to trigger
 * @returns {void}
 */
function DialogGGTSInteraction(Interaction) {
	AsylumGGTSDialogInteraction(Interaction);
}

/**
 * Checks the prerequisite for a given dialog
 * @param {number} D - Index of the dialog to check
 * @returns {boolean} - Returns true, if the prerequisite is met, false otherwise
 */
function DialogPrerequisite(D) {
	if (CurrentCharacter.Dialog[D].Prerequisite == null)
		return true;
	else if (CurrentCharacter.Dialog[D].Prerequisite.indexOf("Player.") == 0)
		return Player[CurrentCharacter.Dialog[D].Prerequisite.substring(7, 250).replace("()", "").trim()]();
	else if (CurrentCharacter.Dialog[D].Prerequisite.indexOf("!Player.") == 0)
		return !Player[CurrentCharacter.Dialog[D].Prerequisite.substring(8, 250).replace("()", "").trim()]();
	else if (CurrentCharacter.Dialog[D].Prerequisite.indexOf("CurrentCharacter.") == 0)
		return CurrentCharacter[CurrentCharacter.Dialog[D].Prerequisite.substring(17, 250).replace("()", "").trim()]();
	else if (CurrentCharacter.Dialog[D].Prerequisite.indexOf("!CurrentCharacter.") == 0)
		return !CurrentCharacter[CurrentCharacter.Dialog[D].Prerequisite.substring(18, 250).replace("()", "").trim()]();
	else if (CurrentCharacter.Dialog[D].Prerequisite.indexOf("(") >= 0)
		return CommonDynamicFunctionParams(CurrentCharacter.Dialog[D].Prerequisite);
	else if (CurrentCharacter.Dialog[D].Prerequisite.substring(0, 1) != "!")
		return !!window[CurrentScreen + CurrentCharacter.Dialog[D].Prerequisite.trim()];
	else
		return !window[CurrentScreen + CurrentCharacter.Dialog[D].Prerequisite.substr(1, 250).trim()];
}


/**
 * Checks if the player can play VR games
 * @returns {boolean} - Whether or not the player is wearing a VR headset with Gaming type
 */
function DialogHasGamingHeadset() {
	return (!KinkyDungeonReady && Player.Effect.includes("KinkyDungeonParty"));
}

/**
 * Checks if the player can play VR games
 * @returns {boolean} - Whether or not the player is wearing a VR headset with Gaming type
 */
function DialogHasGamingHeadsetReady() {
	return (KinkyDungeonReady && Player.Effect.includes("KinkyDungeonParty"));
}

/**
 * Checks if the player can watch VR games
 * @returns {boolean} - Whether or not the player is wearing a VR headset with Gaming type
 */
function DialogCanWatchKinkyDungeon() {
	if (CurrentCharacter) {
		if (!CurrentCharacter.Effect.includes("KinkyDungeonParty")) return false;

		if (Player.Effect.includes("VR")) return true;
	}
	return false;
}


/**
 * Starts the kinky dungeon game
 * @returns {void}
 */
function DialogStartKinkyDungeon() {
	if (ArcadeKinkyDungeonLoad()) {
		if (CurrentCharacter) {
			if (KinkyDungeonPlayerCharacter != CurrentCharacter) {
				KinkyDungeonGameRunning = false; // Reset the game to prevent carrying over spectator data
			}
			KinkyDungeonPlayerCharacter = CurrentCharacter;
			if (KinkyDungeonPlayerCharacter != Player && CurrentCharacter.MemberNumber) {
				KinkyDungeonGameData = null;
				ServerSend("ChatRoomChat", { Content: "RequestFullKinkyDungeonData", Type: "Hidden", Target: CurrentCharacter.MemberNumber });
			}
		}
		DialogGamingPreviousRoom = CurrentScreen;
		DialogGamingPreviousModule = CurrentModule;
		MiniGameStart("KinkyDungeon", 0, "DialogEndKinkyDungeon");
	}
}


/**
 * Return to previous room
 * @returns {void}
 */
function DialogEndKinkyDungeon() {
	if (DialogGamingPreviousModule) {
		CommonSetScreen(DialogGamingPreviousModule, DialogGamingPreviousRoom);
	}
}

/**
 * Checks whether the player has a key for the item
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} Item - The item that should be unlocked
 * @returns {boolean} - Returns true, if the player can unlock the given item with a key, false otherwise
 */
function DialogHasKey(C, Item) {
	if (InventoryGetItemProperty(Item, "SelfUnlock") == false && (!Player.CanInteract() || C.IsPlayer())) return false;
	if (C.IsOwnedByPlayer() && InventoryAvailable(Player, "OwnerPadlockKey", "ItemMisc") && Item.Asset.Enable) return true;
	const lock = InventoryGetLock(Item);
	if (lock && lock.Asset.FamilyOnly && Item.Asset.Enable && LogQuery("BlockFamilyKey", "OwnerRule") && Player.IsFullyOwned()) return false;
	if (C.IsLoverOfPlayer() && InventoryAvailable(Player, "LoversPadlockKey", "ItemMisc") && Item.Asset.Enable && Item.Property && Item.Property.LockedBy && !Item.Property.LockedBy.startsWith("Owner")) return true;
	if (lock && lock.Asset.ExclusiveUnlock) {
		// Locks with exclusive access (intricate, high-sec)
		const allowedMembers = CommonConvertStringToArray(Item.Property.MemberNumberListKeys);
		// High-sec, check if we're in the keyholder list
		if (Item.Property.MemberNumberListKeys != null) return allowedMembers.includes(Player.MemberNumber);
		// Intricate, check that we added that lock
		if (Item.Property.LockMemberNumber == Player.MemberNumber) return true;
	}
	let UnlockName = /** @type {EffectName} */("Unlock" + Item.Asset.Name);
	if ((Item.Property != null) && (Item.Property.LockedBy != null))
		UnlockName = /** @type {EffectName} */("Unlock" + Item.Property.LockedBy);
	for (let I = 0; I < Player.Inventory.length; I++)
		if (InventoryItemHasEffect(Player.Inventory[I], UnlockName)) {
			if (lock != null) {
				if (lock.Asset.LoverOnly && !C.IsLoverOfPlayer()) return false;
				if (lock.Asset.OwnerOnly && !C.IsOwnedByPlayer()) return false;
				if (lock.Asset.FamilyOnly && !C.IsFamilyOfPlayer()) return false;
				return true;
			} else return true;
		}
	return false;
}

/**
 * Checks whether the player is able to unlock the provided item on the provided character
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} Item - The item that should be unlocked
 * @returns {boolean} - Returns true, if the player can unlock the given item, false otherwise
 */
function DialogCanUnlock(C, Item) {
	if ((!C.IsPlayer()) && !Player.CanInteract()) return false;
	if ((Item != null) && (Item.Property != null) && (Item.Property.LockedBy === "ExclusivePadlock")) return (!C.IsPlayer());
	if (LogQuery("KeyDeposit", "Cell")) return false;
	if ((Item != null) && (Item.Asset != null) && (Item.Asset.OwnerOnly == true)) return Item.Asset.Enable && C.IsOwnedByPlayer();
	if ((Item != null) && (Item.Asset != null) && (Item.Asset.LoverOnly == true)) return Item.Asset.Enable && C.IsLoverOfPlayer();
	if ((Item != null) && (Item.Asset != null) && (Item.Asset.FamilyOnly == true)) return Item.Asset.Enable && C.IsFamilyOfPlayer();
	return DialogHasKey(C, Item);
}

/**
 * Checks whether we can lockpick a lock.
 * @param {Character} C
 * @param {Item} Item
 * @returns {boolean}
 */
function DialogCanPickLock(C, Item) {
	return DialogGetPickLockDialog(C, Item) === "PickLock";
}

/**
 * Checks whether we can lockpick a lock and return an appropriate dialog key.
 * `"PickLock"` will be returned if the lock can be picked.
 * @param {Character} C
 * @param {Item} Item
 * @returns {`PickLock${PickLockAvailability}`}
 */
function DialogGetPickLockDialog(C, Item) {
	if (!C || !Item) return "PickLockDisabled";

	// Check that the character allows lockpicking
	if (!C.IsPlayer() && C.OnlineSharedSettings && C.OnlineSharedSettings.DisablePickingLocksOnSelf)
		return "PickLockPermissionsDisabled";

	// Check that the lock is accessible, and that we're free to do so
	const groupIsBlocked = Item.Asset.Group.IsItem() && InventoryGroupIsBlocked(C, Item.Asset.Group.Name);
	const playerHandsAreBlocked = InventoryGroupIsBlocked(Player, "ItemHands");
	if (!InventoryAllow(C, Item.Asset) || groupIsBlocked || playerHandsAreBlocked || !InventoryItemIsPickable(Item))
		return "PickLockInaccessibleDisabled";

	// Check that he player can access their tools.
	// Maybe in the future you will be able to hide a lockpick in your panties :>
	if (!Player.CanPickLocks())
		return "PickLockNoPicksDisabled";

	return "PickLock";
}

/**
 * Checks whether we can access a lock.
 *
 * This function is used to enable the locked submenu
 *
 * @param {Character} C - The character wearing the lock
 * @param {Item} Item - The locked item to inspect
 * @returns {boolean}
 */
function DialogCanCheckLock(C, Item) {
	if (!Item) return false;

	// Check that this is a locked item
	const lockedBy = InventoryGetItemProperty(Item, "LockedBy");
	if (!InventoryItemHasEffect(Item, "Lock", true) || !lockedBy)
		return false;

	if (!DialogCanInspectLock(Item) && !DialogCanPickLock(C, Item) && !DialogCanUnlock(C, Item))
		return false;

	return true;
}

/**
 * Some specific screens like the movie studio cannot allow the player to use items on herself, return FALSE if it's the case
 * @returns {boolean} - Returns TRUE if we allow using items
 */
function DialogAllowItemScreenException() {
	if ((CurrentScreen == "MovieStudio") && (MovieStudioCurrentMovie != "")) return false;
	return true;
}

/**
 * Returns the current character dialog intro
 * @returns {string} - The name of the current dialog, if such a dialog exists, any empty string otherwise
 */
function DialogIntro() {
	for (let D = 0; D < CurrentCharacter.Dialog.length; D++)
		if ((CurrentCharacter.Dialog[D].Stage == CurrentCharacter.Stage) && (CurrentCharacter.Dialog[D].Option == null) && (CurrentCharacter.Dialog[D].Result != null) && DialogPrerequisite(D))
			return CurrentCharacter.Dialog[D].Result;
	return "";
}


/**
 * Generic dialog function to leave conversation. De-inititalizes global variables and reverts the
 * FocusGroup of the player and the current character to null
 * @returns {void} - Nothing
 */
function DialogLeave() {

	DialogLeaveFocusItem();

	// Reset the character's height
	if (CurrentCharacter && CharacterAppearanceForceUpCharacter == CurrentCharacter.MemberNumber) {
		CharacterAppearanceForceUpCharacter = -1;
		CharacterRefresh(CurrentCharacter, false);
	}

	// Reset the mode, selected group & character, exiting the dialog
	DialogMenuMode = null;
	Object.values(DialogMenuMapping).forEach(obj => obj.Exit());
	if (CurrentCharacter) {
		DialogChangeFocusToGroup(CurrentCharacter, null);
	}
	CurrentCharacter = null;

	// Reset the state of the self menu
	DialogSelfMenuSelected = null;
	DialogSavedExpressionPreviews = [];
	DialogFacialExpressionsSelected = -1;
	DialogFacialExpressions = [];

	// Go controller, go!
	ControllerClearAreas();
}

/**
 * Generic dialog function to remove a piece of the conversation that's already done
 * @returns {void} - Nothing
 */
function DialogRemove() {
	var pos = 0;
	for (let D = 0; D < CurrentCharacter.Dialog.length; D++)
		if ((CurrentCharacter.Dialog[D].Stage == CurrentCharacter.Stage) && (CurrentCharacter.Dialog[D].Option != null) && DialogPrerequisite(D)) {
			if (MouseIn(1025, 160 + pos * 105, 950, 90)) {
				CurrentCharacter.Dialog.splice(D, 1);
				break;
			}
			pos++;
		}
}

/**
 * Generic dialog function to remove any dialog from a specific group
 * @param {string} GroupName - All dialog options are removed from this group
 * @returns {void} - Nothing
 */
function DialogRemoveGroup(GroupName) {
	const GroupNameUpper = GroupName.trim().toUpperCase();
	for (let D = CurrentCharacter.Dialog.length - 1; D >= 0; D--)
		if ((CurrentCharacter.Dialog[D].Group != null) && (CurrentCharacter.Dialog[D].Group.trim().toUpperCase() == GroupNameUpper)) {
			CurrentCharacter.Dialog.splice(D, 1);
		}
}

/**
 * Performs a "Back" action through the menu "stack".
 */
function DialogMenuBack() {
	switch (DialogMenuMode) {
		case "activities":
		case "crafted":
		case "locked":
		case "locking":
			DialogChangeMode("items");
			break;

		case "layering":
			Layering.Exit();
			break;

		case "colorItem":
			ItemColorCancelAndExit();
			DialogChangeMode("items");
			break;

		case "colorDefault":
			ColorPickerHide();
			DialogColorSelect = null;
			ElementRemove("InputColor");
			DialogChangeMode("items");
			break;

		case "colorExpression": {
			const { mode, group } = DialogExpressionPreviousMode;
			DialogChangeMode(mode || "dialog");
			DialogChangeFocusToGroup(Player, group);
			DialogExpressionPreviousMode = null;
		}
			break;

		case "dialog":
			DialogLeave();
			break;

		case "extended":
		case "tighten":
			DialogLeaveFocusItem();
			break;

		case "items":
			DialogLeaveItemMenu();
			break;

		case "permissions":
			DialogChangeMode("items");
			break;

		case "struggle":
			if (StruggleMinigameIsRunning()) {
				StruggleMinigameStop();
				// Move back to the item list only if we automatically started to struggle
				if (!DialogStruggleSelectMinigame) {
					DialogStruggleSelectMinigame = false;
					DialogChangeMode("items");
				}
			} else {
				DialogChangeMode("items");
			}
			break;

		default:
			console.trace(`Unknown menu mode "${DialogMenuMode}, resetting`);
			DialogChangeMode("dialog");
			CurrentCharacter = null;
			break;
	}
}

/**
 * Returns whether the current mode shows items.
 */
function DialogModeShowsInventory() {
	return ["items", "activities", "locking", "permissions"].includes(DialogMenuMode);
}

/**
 * Helper used to check whether the player is in the Appearance screen
 */
function DialogIsInWardrobe() {
	return CurrentScreen === "Appearance";
}

/**
 * Leaves the item menu for both characters.
 *
 * This exits the item-selecting UI and switches back to the current character's dialog options.
 *
 * @returns {void} - Nothing
 */
function DialogLeaveItemMenu() {
	DialogChangeFocusToGroup(CharacterGetCurrent(), null);
}

/**
 * Leaves the item menu of the focused item (be it the extended item- or tighten/loosen menu) and
 * perform any screen-specific setup for {@link CurrentScreen}.
 * @see {@link DialogLeaveFocusItemHandlers} Namespace with helper functions for setting up new screens
 */
function DialogLeaveFocusItem() {
	if (DialogTightenLoosenItem != null) {
		const item = DialogTightenLoosenItem;
		TightenLoosenItemExit();

		// If we still have a focused item, then we entered tightening through its extended screen
		const screenCallback = DialogLeaveFocusItemHandlers.DialogTightenLoosenItem[CurrentScreen];
		if (DialogFocusItem) {
			DialogChangeMode("extended");
		} else if (screenCallback) {
			screenCallback(item);
		} else {
			DialogChangeMode("items");
		}
	} else if (DialogFocusItem != null) {
		const item = DialogFocusItem;
		ExtendedItemExit();
		if (DialogFocusItem) {
			// We're only exiting an extended subscreen
			return;
		}

		const screenCallback = DialogLeaveFocusItemHandlers.DialogFocusItem[CurrentScreen];
		if (screenCallback) {
			screenCallback(item);
		} else {
			DialogChangeMode("items");
		}
	}
}

/**
 * Adds the item in the dialog list
 * @param {Character} C - The character the inventory is being built for
 * @param {Item} item - The item to be added to the inventory
 * @param {boolean} isWorn - Should be true, if the item is currently being worn, false otherwise
 * @param {DialogSortOrder} [sortOrder] - Defines where in the inventory list the item is sorted
 * @returns {void} - Nothing
 */
function DialogInventoryAdd(C, item, isWorn, sortOrder) {
	if (DialogMenuMode !== "permissions") {
		const asset = item.Asset;

		if (!isWorn && !asset.Enable)
			return;

		// Make sure we do not add owner/lover/family only items for invalid characters, owner/lover locks can be applied on the player by the player for self-bondage
		if (asset.OwnerOnly && !isWorn && !C.IsOwnedByPlayer())
			if (!C.IsPlayer() || !C.IsOwned() || !asset.IsLock || (C.IsPlayer() && LogQuery("BlockOwnerLockSelf", "OwnerRule")))
				return;
		if (asset.LoverOnly && !isWorn && !C.IsLoverOfPlayer()) {
			if (!asset.IsLock || C.GetLoversNumbers(true).length == 0) return;
			if (C.IsPlayer()) {
				if (LogQuery("BlockLoverLockSelf", "LoverRule")) return;
			}
			else if (!C.IsOwnedByPlayer() || LogQueryRemote(C, "BlockLoverLockOwner", "LoverRule")) return;
		}
		if (asset.FamilyOnly && asset.IsLock && !isWorn && (C.IsPlayer()) && LogQuery("BlockOwnerLockSelf", "OwnerRule")) return;
		if (asset.FamilyOnly && (!C.IsPlayer()) && !C.IsFamilyOfPlayer()) return;
		if (asset.FamilyOnly && asset.IsLock && !C.IsPlayer() && C.IsOwner()) return;
		if (asset.FamilyOnly && asset.IsLock && C.IsPlayer() && (C.IsOwned() === false)) return;

		// Do not show keys if they are in the deposit
		if (LogQuery("KeyDeposit", "Cell") && InventoryIsKey(item)) return;

		// Don't allow gendered assets in the opposite-gender-only space
		if (!CharacterAppearanceGenderAllowed(asset)) return;

		// Make sure we do not duplicate the item in the list
		for (const invItem of DialogInventory) {
			if (
				invItem.Asset.Name === item.Asset.Name
				&& invItem.Asset.Group.Name === item.Asset.Group.Name
				&& invItem.Craft == null
				&& item.Craft == null
			) {
				return;
			}
		}
	}

	// Adds the item to the selection list
	const inventoryItem = DialogInventoryCreateItem(C, item, isWorn, sortOrder);
	if (item.Craft != null) {
		inventoryItem.Craft = item.Craft;
		if (inventoryItem.SortOrder.charAt(0) == DialogSortOrder.Usable.toString()) inventoryItem.SortOrder = DialogSortOrder.PlayerFavoriteUsable.toString() + item.Asset.Description;
		if (inventoryItem.SortOrder.charAt(0) == DialogSortOrder.Unusable.toString()) inventoryItem.SortOrder = DialogSortOrder.PlayerFavoriteUnusable.toString() + item.Asset.Description;
	}
	DialogInventory.push(inventoryItem);

}

/**
 * Creates an individual item for the dialog inventory list
 * @param {Character} C - The character the inventory is being built for
 * @param {Item} item - The item to be added to the inventory
 * @param {boolean} isWorn - Should be true if the item is currently being worn, false otherwise
 * @param {DialogSortOrder} [sortOrder] - Defines where in the inventory list the item is sorted
 * @returns {DialogInventoryItem} - The inventory item
 */
function DialogInventoryCreateItem(C, item, isWorn, sortOrder) {
	const asset = item.Asset;
	const favoriteStateDetails = DialogGetFavoriteStateDetails(C, asset);

	// Determine the sorting order for the item
	if (DialogMenuMode !== "permissions") {
		if (InventoryBlockedOrLimited(C, item)) {
			sortOrder = DialogSortOrder.Blocked;
		}
		else if (sortOrder == null) {
			if (asset.DialogSortOverride != null) {
				sortOrder = asset.DialogSortOverride;
			} else {
				if (InventoryAllow(C, asset, undefined, false) && InventoryChatRoomAllow(asset.Category)) {
					sortOrder = favoriteStateDetails.UsableOrder;
				} else {
					sortOrder = favoriteStateDetails.UnusableOrder;
				}
			}
		}
	} else if (sortOrder == null) {
		sortOrder = DialogSortOrder.Enabled;
	}

	// Determine the icons to display in the preview image
	/** @type {InventoryIcon[]} */
	let icons = [];
	if (favoriteStateDetails.Icon) icons.push(favoriteStateDetails.Icon);
	icons = icons.concat(DialogGetLockIcon(item, isWorn));
	if (InventoryIsAllowedLimited(C, item)) icons.push("AllowedLimited");
	icons = icons.concat(DialogGetAssetIcons(asset));
	icons = icons.concat(DialogEffectIcons.GetIcons(item));

	/** @type {DialogInventoryItem} */
	return {
		...item,
		Worn: isWorn,
		Icons: icons,
		SortOrder: sortOrder.toString() + asset.Description,
		Vibrating: isWorn && InventoryItemHasEffect(item, "Vibrating", true),
	};
}

/**
 * Returns settings for an item based on whether the player and target have favorited it, if any
 * @param {Character} C - The targeted character
 * @param {Asset} asset - The asset to check favorite settings for
 * @param {string} [type=null] - The type of the asset to check favorite settings for
 * @returns {FavoriteState} - The details to use for the asset
 */
function DialogGetFavoriteStateDetails(C, asset, type = null) {
	const isTargetFavorite = InventoryIsFavorite(C, asset.Name, asset.Group.Name, type);
	const isPlayerFavorite = !C.IsPlayer() && InventoryIsFavorite(Player, asset.Name, asset.Group.Name, type);
	return DialogFavoriteStateDetails.find(F => F.TargetFavorite == isTargetFavorite && F.PlayerFavorite == isPlayerFavorite);
}

/**
 * Return icons representing the asset's current lock state
 * @param {Item} item
 * @param {boolean} isWorn
 */
function DialogGetLockIcon(item, isWorn) {
	/** @type {InventoryIcon[]} */
	const icons = [];
	if (InventoryItemHasEffect(item, "Lock")) {
		if (item.Property && item.Property.LockedBy)
			icons.push(item.Property.LockedBy);
		else
			// One of the default-locked items
			icons.push(isWorn ? "Locked" : "Unlocked");
	} else if (item.Craft && item.Craft.Lock) {
		if (!isWorn || InventoryItemHasEffect(item, "Lock"))
			icons.push(item.Craft.Lock);
	}
	return icons;
}

/**
 * Returns a list of icons associated with the asset
 * @param {Asset} asset - The asset to get icons for
 * @returns {InventoryIcon[]} - A list of icon names
 */
function DialogGetAssetIcons(asset) {
	let icons = [];
	icons = icons.concat(asset.PreviewIcons);
	if (asset.OwnerOnly) icons.push("OwnerOnly");
	if (asset.LoverOnly) icons.push("LoverOnly");
	if (asset.FamilyOnly) icons.push("FamilyOnly");
	if (asset.AllowActivity && asset.AllowActivity.length > 0) icons.push("Handheld");
	return icons;
}

/**
 * Namespace with functions for getting inventory icons (see {@link DialogEffectIcons.GetIcons})
 * @namespace
 */
const DialogEffectIcons = /** @type {const} */({
	/** @type {Partial<Record<InventoryIcon, readonly EffectName[]>>} */
	Table: {
		"GagLight": ["GagVeryLight", "GagLight", "GagEasy"],
		"GagNormal": ["GagNormal", "GagMedium"],
		"GagHeavy": ["GagHeavy", "GagVeryHeavy"],
		"GagTotal": ["GagTotal", "GagTotal2", "GagTotal3", "GagTotal4"],
		"DeafLight": ["DeafLight"],
		"DeafNormal": ["DeafNormal", "DeafHeavy"],
		"DeafHeavy": ["DeafTotal"],
		"BlindLight": ["BlindLight"],
		"BlindNormal": ["BlindNormal", "BlindHeavy"],
		"BlindHeavy": ["BlindTotal"],
	},
	/**
	 * Return icons for each "interesting" effect on the item.
	 * @param {Item} item
	 * @returns {InventoryIcon[]} - A list of icon names.
	 */
	GetIcons: function(item) {
		const effects = new Set([...item.Asset.Effect, ...(item.Property?.Effect ?? [])]);
		const craftingProperty = item.Craft?.Property;
		return DialogEffectIcons.GetEffectIcons(effects, craftingProperty);
	},
	/** @type {(effects: Iterable<EffectName>, prop?: CraftingPropertyType) => null | InventoryIcon[]} */
	GetEffectIcons: function (effects, prop) {
		/** @type {InventoryIcon[]} */
		const icons = [];
		for (const effect of effects) {
			switch (effect) {
				case "Block":
				case "Freeze":
					icons.push(effect);
					continue;
			}

			const icon = (
				DialogEffectIcons._GetGagIcon(effect, prop)
				|| DialogEffectIcons._GetBlindIcon(effect, prop)
				|| DialogEffectIcons._GetDeafIcon(effect)
			);
			if (icon) {
				icons.push(icon);
			}
		}
		return icons;
	},
	/** @type {(effect: EffectName, prop?: CraftingPropertyType) => null | InventoryIcon} */
	_GetGagIcon(effect, prop) {
		let level = SpeechGagLevelLookup[/** @type {GagEffectName} */(effect)];
		if (level === undefined) {
			return null;
		} else if (prop === "Small") {
			level -= 2;
		} else if (prop === "Large") {
			level += 2;
		}
		return DialogEffectIcons._GagLevelToIcon(level);
	},
	/** @type {(effect: EffectName, prop?: CraftingPropertyType) => null | InventoryIcon} */
	_GetBlindIcon(effect, prop) {
		let level = CharacterBlindLevels.get(/** @type {BlindEffectName} */(effect));
		if (level === undefined) {
			return null;
		} else if (prop === "Thin") {
			level -= 2;
		} else if (prop === "Thick") {
			level += 2;
		}
		return DialogEffectIcons._BlindLevelToIcon(level);
	},
	/** @type {(effect: EffectName) => undefined | InventoryIcon} */
	_GetDeafIcon(effect) {
		/** @type {InventoryIcon[]} */
		const keys = ["DeafLight", "DeafNormal", "DeafHeavy"];
		return keys.find(k => DialogEffectIcons.Table[k].includes(effect));
	},
	/** @type {(level?: number) => null | InventoryIcon} */
	_GagLevelToIcon: function (level) {
		if (!level || level < SpeechGagLevelLookup.GagVeryLight) {
			return null;
		} else if (level <= SpeechGagLevelLookup.GagEasy) {
			return "GagLight";
		} else if (level <= SpeechGagLevelLookup.GagMedium) {
			return "GagNormal";
		} else if (level <= SpeechGagLevelLookup.GagVeryHeavy) {
			return "GagHeavy";
		} else {
			return "GagTotal";
		}
	},
	/** @type {(level?: number) => null | InventoryIcon} */
	_BlindLevelToIcon: function (level) {
		if (!level || level < CharacterBlindLevels.get("BlindLight")) {
			return null;
		} else if (level <= CharacterBlindLevels.get("BlindLight")) {
			return "BlindLight";
		} else if (level <= CharacterBlindLevels.get("BlindHeavy")) {
			return "BlindNormal";
		} else {
			return "BlindHeavy";
		}
	},
});

/**
 * Some special screens can always allow you to put on new restraints. This function determines, if this is possible
 * @returns {boolean} - Returns trues, if it is possible to put on new restraints.
 */
function DialogAlwaysAllowRestraint() {
	return (CurrentScreen == "Photographic");
}

/**
 * Checks whether the player can use a remote on the given character and item
 * @param {Character} C - the character that the item is equipped on
 * @param {Item} Item - the item to check for remote usage against
 * @return {VibratorRemoteAvailability} - Returns the status of remote availability: Available, NoRemote, NoLoversRemote, RemotesBlocked, CannotInteract, NoAccess, InvalidItem
 */
function DialogCanUseRemoteState(C, Item) {
	// Can't use remotes if there is no item, or if the item doesn't have the needed effects.
	if (!Item || !InventoryItemHasEffect(Item, "UseRemote")) return "InvalidItem";
	// Can't use remotes if the player cannot interact with their hands
	if (!Player.CanInteract()) return "CannotInteract";
	// Can't use remotes on self if the player is owned and their remotes have been blocked by an owner rule
	if (C.IsPlayer() && Player.IsFullyOwned() && LogQuery("BlockRemoteSelf", "OwnerRule")) return "RemotesBlocked";
	if (Item.Asset.LoverOnly) {
		if (!C.IsLoverOfPlayer()) {
			return "NoAccess";
		} else if (!InventoryAvailable(Player, "LoversVibratorRemote", "ItemVulva")) {
			return "NoLoversRemote";
		} else {
			return "Available";
		}
	} else {

		// Otherwise, the player must have a vibrator remote and some items can block remotes
		if (C.Effect.indexOf("BlockRemotes") >= 0) {
			return "RemotesBlocked";
		}
		if (!InventoryAvailable(Player, "VibratorRemote", "ItemVulva")) {
			return "NoRemote";
		}
		if (LogQuery("BlockRemote", "OwnerRule")) {
			return "NoRemoteOwnerRuleActive";
		}
		return "Available";
	}
}

/**
 * Checks whether the player can color the given item on the given character
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} Item - The item to check the player's ability to color against
 * @returns {boolean} - TRUE if the player is able to color the item, FALSE otherwise
 */
function DialogCanColor(C, Item) {
	const ItemColorable = Item && Item.Asset && Item.Asset.ColorableLayerCount > 0;
	const CanUnlock = InventoryItemHasEffect(Item, "Lock", true) ? DialogCanUnlock(C, Item) : true;
	return (Player.CanInteract() && CanUnlock && ItemColorable) || DialogAlwaysAllowRestraint();
}

/**
 * Checks whether a lock can be inspected while blind.
 * @param {Item} Item - The locked item
 * @returns {boolean}
 */
function DialogCanInspectLock(Item) {
	if (!Item) return false;

	const lockedBy = InventoryGetItemProperty(Item, "LockedBy");
	return !Player.IsBlind() || ["SafewordPadlock", "CombinationPadlock"].includes(lockedBy);
}

/**
 * Builds the possible dialog activity options based on the character settings
 * @param {Character} C - The character for which to build the activity dialog options
 * @param {boolean} reload - Perform a {@link DialogMenu.Reload} hard reset of the active `activities` mode
 * @return {void} - Nothing
 */
function DialogBuildActivities(C, reload=true) {
	if (C.FocusGroup == null) {
		DialogActivity = [];
	} else {
		DialogActivity = ActivityAllowedForGroup(C, C.FocusGroup.Name);
	}

	if (reload) {
		switch (DialogMenuMode) {
			case "activities":
				DialogMenuMapping.activities.Reload(null, null, { reset: true });
				break;
		}
	}
}

/**
 * Build the buttons in the top menu
 * @param {Character} C - The character for whom the dialog is prepared
 * @returns {void} - Nothing
 */
function DialogMenuButtonBuild(C) {

	DialogMenuButton = [];

	// Hide "Exit" button for the screens where
	if (!["colorExpression", "colorItem"].includes(DialogMenuMode))
		DialogMenuButton = ["Exit"];

	// There's no group focused, hence no menu to draw
	if (C.FocusGroup == null) return;

	/** The item in the current slot */
	const Item = InventoryGet(C, C.FocusGroup.Name);
	const ItemBlockedOrLimited = !!Item && InventoryBlockedOrLimited(C, Item);
	const IsItemLocked = InventoryItemHasEffect(Item, "Lock", true);
	const IsGroupBlocked = InventoryGroupIsBlocked(C);

	if (DialogMenuMode === "colorDefault") {
		DialogMenuButton.push("ColorCancel");
		DialogMenuButton.push("ColorSelect");
	}

	else if (DialogMenuMode === "struggle") {
		// Struggle has no additional buttons
	}

	else if (DialogMenuMode === "locked") {
		// If the item isn't locked, there are no more buttons to add
		const Lock = InventoryGetLock(Item);
		if (!IsItemLocked || !Lock) return;

		const LockBlockedOrLimited = InventoryBlockedOrLimited(C, Lock) || ItemBlockedOrLimited;

		if (
			Item != null
			&& !IsGroupBlocked
			&& DialogCanUnlock(C, Item)
			&& (
				(!Player.IsBlind() && (!C.IsPlayer() || C.CanInteract()))
				|| (C.IsPlayer() && !Player.CanInteract() && InventoryItemHasEffect(Item, "Block", true))
			)
		) {
			DialogMenuButton.push("Unlock");
		}
		if (InventoryItemIsPickable(Item)) {
			DialogMenuButton.push(DialogGetPickLockDialog(C, Item));
		}
		if (DialogCanInspectLock(Item)) {
			DialogMenuButton.push(LockBlockedOrLimited ? "InspectLockDisabled" : "InspectLock");
		}

	}

	else if (
		DialogMenuMode === "crafted"
		|| DialogMenuMode === "layering"
		|| DialogMenuMode === "activities"
		|| DialogMenuMode === "locking"
	) {
		// No buttons there
	}

	// Pushes all valid main buttons, based on if the player is restrained, has a blocked group, has the key, etc.
	else {
		if (DialogMenuMode === "permissions") {
			DialogMenuButton.push("NormalMode");
			return;
		}

		if (IsItemLocked && DialogCanUnlock(C, Item) && !IsGroupBlocked && (!C.IsPlayer() || Player.CanInteract()))
			DialogMenuButton.push("Remove");

		if (
			!IsGroupBlocked
			&& Item?.Asset.AllowTighten
			&& (IsItemLocked ? DialogCanUnlock(C, Item) : Player.CanInteract())
		) {
			DialogMenuButton.push("TightenLoosen");
		}

		if (DialogCanCheckLock(C, Item))
			DialogMenuButton.push("LockMenu");

		if ((Item != null) && C.IsPlayer() && (!Player.CanInteract() || (IsItemLocked && !DialogCanUnlock(C, Item))) && (DialogMenuButton.indexOf("Unlock") < 0) && !IsGroupBlocked)
			DialogMenuButton.push("Struggle");

		if ((Item != null) && (Item.Craft != null))
			DialogMenuButton.push("Crafting");

		// If the Asylum GGTS controls the item, we show a disabled button and hide the other buttons
		if (AsylumGGTSControlItem(C, Item)) {
			DialogMenuButton.push("GGTSControl");
		} else if (Item != null) {
			// There's an item in the slot

			if (!IsItemLocked && Player.CanInteract() && !IsGroupBlocked) {
				if (InventoryDoesItemAllowLock(Item)) {
					DialogMenuButton.push(ItemBlockedOrLimited ? "LockDisabled" : "Lock");
				}

				if (InventoryItemHasEffect(Item, "Mounted", true))
					DialogMenuButton.push("Dismount");
				else if (InventoryItemHasEffect(Item, "Enclose", true))
					DialogMenuButton.push("Escape");
				else
					DialogMenuButton.push("Remove");
			}

			const canUseRemoteState = DialogCanUseRemoteState(C, Item);
			if (
				Item.Asset.Extended &&
				(Player.CanInteract() || DialogAlwaysAllowRestraint() || Item.Asset.AlwaysInteract) &&
				(!IsGroupBlocked || Item.Asset.AlwaysExtend) &&
				(!Item.Asset.OwnerOnly || (C.IsOwnedByPlayer())) &&
				(!Item.Asset.LoverOnly || (C.IsLoverOfPlayer())) &&
				(!Item.Asset.FamilyOnly || (C.IsFamilyOfPlayer())) &&
				canUseRemoteState === "InvalidItem"
			) {
				DialogMenuButton.push(ItemBlockedOrLimited ? "UseDisabled" : "Use");
			}

			if (!DialogMenuButton.includes("Use") && canUseRemoteState !== "InvalidItem") {
				/** @type {DialogMenuButton} */
				let button = null;
				switch (canUseRemoteState) {
					case "Available":
						button = ItemBlockedOrLimited ? "RemoteDisabled" : "Remote";
						break;
					default:
						button = `RemoteDisabledFor${canUseRemoteState}`;
						break;
				}
				DialogMenuButton.push(button);
			}
		}

		// Color selection
		if (DialogCanColor(C, Item)) {
			DialogMenuButton.push(ItemBlockedOrLimited ? "ColorPickDisabled" : "ColorChange");
		} else {
			DialogMenuButton.push("ColorDefault");
		}

		if (DialogActivity.length > 0) DialogMenuButton.push("Activity");

		// Item permission enter/exit
		if (C.IsPlayer()) {
			DialogMenuButton.push("PermissionMode");
		}

		if (Item != null && !C.IsNpc()) {
			DialogMenuButton.push("Layering");
		}
	}
}

/**
 * Sort the inventory list by the global variable SortOrder (a fixed number & current language description)
 * @returns {void} - Nothing
 */
function DialogInventorySort() {
	DialogInventory.sort((a, b) => a.SortOrder.localeCompare(b.SortOrder, undefined, { numeric: true, sensitivity: 'base' }));
}

/**
 * Returns TRUE if the crafted item can be used on a character, validates for owners and lovers
 * @param {Character} C - The character whose inventory must be built
 * @param {CraftingItem} Craft - The crafting properties of the item
 * @param {Asset} A - The items asset
 * @returns {Boolean} - TRUE if we can use it
 */
function DialogCanUseCraftedItem(C, Craft, A) {
	// Validates the craft asset
	if (!C || !Craft || !A) return false;

	if (A.OwnerOnly && !C.IsOwnedByPlayer()) return false;
	if (A.LoverOnly && !(C.IsLoverOfPlayer() || C.IsOwnedByPlayer())) return false;
	if (A.FamilyOnly && !(C.IsFamilyOfPlayer() || C.IsLoverOfPlayer() || C.IsOwnedByPlayer())) return false;

	/** @type {undefined | Asset} */
	const lock = AssetLocks[/** @type {AssetLockType} */(Craft.Lock)];
	if (lock != null) {
		if (lock.OwnerOnly && !DialogCanUseOwnerLockOn(C)) return false;
		if (lock.LoverOnly && !DialogCanUseLoverLockOn(C)) return false;
		if (lock.FamilyOnly && !DialogCanUseFamilyLockOn(C)) return false;
	}
	return true;
}

/**
 * Returns TRUE if the player can use owner locks on the target character
 * @param {Character} target - The target to (potentially) lock
 * @returns {Boolean} - TRUE if the player can use owner locks on the target, FALSE otherwise
 */
function DialogCanUseOwnerLockOn(target) {
	return target.IsPlayer()
		? (target.IsOwned() && !LogQuery("BlockOwnerLockSelf", "OwnerRule"))
		: target.IsOwnedByPlayer();
}

/**
 * Returns TRUE if the player can use lover locks on the target character
 * @param {Character} target - The target to (potentially) lock
 * @returns {Boolean} - TRUE if the player can use lover locks on the target, FALSE otherwise
 */
function DialogCanUseLoverLockOn(target) {
	return target.IsPlayer()
		? (target.GetLoversNumbers(true).length > 0 && !LogQuery("BlockLoverLockSelf", "LoverRule"))
		: target.IsOwnedByPlayer()
			? !LogQueryRemote(target, "BlockLoverLockOwner", "LoverRule")
			: target.IsLoverOfPlayer();
}

/**
 * Returns TRUE if the player can use family locks on the target character
 * @param {Character} target - The target to (potentially) lock
 * @returns {Boolean} - TRUE if the player can use family locks on the target, FALSE otherwise
 */
function DialogCanUseFamilyLockOn(target) {
	return target.IsPlayer()
		? (target.IsOwned() && !LogQuery("BlockOwnerLockSelf", "OwnerRule"))
		: target.IsOwner() // Owner is in family, but you can't use family locks on them
			? false
			: target.IsFamilyOfPlayer();
}

/**
 * Build the inventory listing for the dialog which is what's equipped,
 * the player's inventory and the character's inventory for that group
 * @param {Character} C - The character whose inventory must be built
 * @param {boolean} [resetOffset=false] - The offset to be at, if specified.
 * @param {boolean} [locks=false] - If TRUE we build a list of locks instead.
 * @param {boolean} reload - Perform a {@link DialogMenu.Reload} hard reset of the active `items`, `locking` or `permissions` mode
 * @returns {void} - Nothing
 */
function DialogInventoryBuild(C, resetOffset=false, locks=false, reload=true) {

	if (resetOffset)
		DialogInventoryOffset = 0;

	DialogInventory = [];

	// Make sure there's a focused group
	if (C.FocusGroup == null) return;

	if (locks) {
		for (const item of Player.Inventory) {
			if (item.Asset != null && item.Asset.IsLock) {
				DialogInventoryAdd(C, item, false);
			}
		}
		DialogInventoryOffset = Math.max(0, Math.min(DialogInventory.length, DialogInventoryOffset));
		DialogInventorySort();
		return;
	}

	const CurItem = C.Appearance.find(A => A.Asset.Group.Name == C.FocusGroup.Name && A.Asset.DynamicAllowInventoryAdd(C));

	// In item permission mode we add all the enable items except the ones already on, unless on Extreme difficulty
	if (DialogMenuMode === "permissions") {
		for (const A of C.FocusGroup.Asset) {
			if (!A.Enable)
				continue;

			if (A.Wear) {
				const isWorn = CurItem && CurItem.Asset.Name === A.Name && CurItem.Asset.Group.Name === A.Group.Name;
				DialogInventoryAdd(Player, { Asset: A }, isWorn, DialogSortOrder.Enabled);
			} else if (A.IsLock) {
				const LockIsWorn = InventoryCharacterIsWearingLock(C, /** @type {AssetLockType} */ (A.Name));
				DialogInventoryAdd(Player, { Asset: A }, LockIsWorn, DialogSortOrder.Enabled);
			}
		}
	} else {
		// First, we add anything that's currently equipped
		if (CurItem)
			DialogInventoryAdd(C, CurItem, true);

		// Second, we add everything from the victim inventory
		for (const I of C.Inventory)
			if ((I.Asset != null) && (I.Asset.Group.Name == C.FocusGroup.Name) && I.Asset.DynamicAllowInventoryAdd(C))
				DialogInventoryAdd(C, I, false);

		// Third, we add everything from the player inventory if the player isn't the victim
		if (!C.IsPlayer())
			for (const I of Player.Inventory)
				if ((I.Asset != null) && (I.Asset.Group.Name == C.FocusGroup.Name) && I.Asset.DynamicAllowInventoryAdd(C))
					DialogInventoryAdd(C, I, false);

		// Fourth, we add all free items (especially useful for clothes), or location-specific always available items
		for (const A of Asset)
			if (A.Group.Name === C.FocusGroup.Name && A.DynamicAllowInventoryAdd(C))
				if (A.Value === 0 || (A.AvailableLocations.includes("Asylum") && (CurrentScreen.startsWith("Asylum") || ChatRoomSpace === "Asylum")))
					DialogInventoryAdd(C, { Asset: A }, false);

		// Fifth, we add all crafted items for the player that matches that slot
		for (const Craft of (Player.Crafting ?? [])) {
			if (Craft == null || Craft.Disabled) {
				continue;
			}

			for (const Asset of (CraftingAssets[Craft.Item] ?? [])) {
				if (Asset.Group.Name === C.FocusGroup.Name && DialogCanUseCraftedItem(C, Craft, Asset)) {
					DialogInventoryAdd(C, { Asset, Craft }, false);
				}
			}
		}

		// Sixth. we add all crafted items from the character that matches that slot
		if (!C.IsPlayer() && !C.IsNpc()) {
			const Crafting = CraftingDecompressServerData(C.Crafting ?? "");
			for (const Craft of Crafting) {
				if (Craft == null || Craft.Private) {
					continue;
				}

				Craft.MemberName = CharacterNickname(C);
				Craft.MemberNumber = C.MemberNumber;
				for (const Asset of (CraftingAssets[Craft.Item] ?? [])) {
					if (Asset.Group.Name === C.FocusGroup.Name && DialogCanUseCraftedItem(C, Craft, Asset)) {
						DialogInventoryAdd(C, { Asset, Craft }, false);
					}
				}
			}
		}

		// Seventh, if the player is using the online map room and is located on an object tile, she can use that object
		if ((CurrentScreen == "ChatRoom") && ChatRoomMapViewIsActive() && Player.MapData) {
			let Obj = ChatRoomMapViewGetObjectAtPos(Player.MapData.Pos.X, Player.MapData.Pos.Y);
			if ((Obj != null) && (Obj.AssetName != null) && (Obj.AssetGroup != null))
				for (const A of Asset)
					if ((A.Name === Obj.AssetName) && (A.Group.Name === Obj.AssetGroup) && (A.Group.Name === C.FocusGroup.Name))
						DialogInventoryAdd(C, { Asset: A }, false);
		}

	}

	DialogInventoryOffset = Math.max(0, Math.min(DialogInventory.length, DialogInventoryOffset));
	DialogInventorySort();

	if (reload) {
		switch (DialogMenuMode) {
			case "items":
			case "locking":
			case "permissions":
				DialogMenuMapping[DialogMenuMode]?.Reload(null, null, { reset: true });
				break;
		}
	}
}

/**
 * Create a stringified list of the group and the assets currently in the dialog inventory
 * @param {Character} C - The character the dialog inventory has been built for
 * @returns {string} - The list of assets as a string
 */
function DialogInventoryStringified(C) {
	return (C.FocusGroup ? C.FocusGroup.Name : "") + (DialogInventory ? JSON.stringify(DialogInventory.map(I => I.Asset.Name).sort()) : "");
}

/**
 * Build the initial state of the selection available in the facial expressions menu
 * @returns {void} - Nothing
 */
function DialogFacialExpressionsBuild() {
	DialogFacialExpressions = [];
	for (let I = 0; I < Player.Appearance.length; I++) {
		const PA = Player.Appearance[I];
		const ExpressionList = [...(PA.Asset.Group.AllowExpression || [])];
		if (!ExpressionList.length || PA.Asset.Group.Name == "Eyes2") continue;
		// Make sure the default expression always appear
		if (!ExpressionList.includes(null)) ExpressionList.unshift(null);
		// If there are no allowed expression, skip the group entirely
		if (!ExpressionList.some(expr => CharacterIsExpressionAllowed(Player, PA, expr))) continue;
		/** @type {ExpressionItem} */
		const Item = {
			Appearance: PA,
			Group: /** @type {ExpressionGroupName} */(PA.Asset.Group.Name),
			CurrentExpression: (PA.Property == null) ? null : PA.Property.Expression,
			ExpressionList: ExpressionList,
		};
		DialogFacialExpressions.push(Item);
	}
	// Temporary (?) solution to make the facial elements appear in a more logical order, as their alphabetical order currently happens to match up
	DialogFacialExpressions = DialogFacialExpressions.sort(function (a, b) {
		return a.Appearance.Asset.Group.Name < b.Appearance.Asset.Group.Name ? -1 : a.Appearance.Asset.Group.Name > b.Appearance.Asset.Group.Name ? 1 : 0;
	});
}

/**
 * Saves the expressions to a slot
 * @param {number} Slot - Index of saved expression (0 to 4)
 */
function DialogFacialExpressionsSave(Slot) {
	Player.SavedExpressions[Slot] = [];
	for (let x = 0; x < DialogFacialExpressions.length; x++) {
		Player.SavedExpressions[Slot].push({ Group: DialogFacialExpressions[x].Group, CurrentExpression: DialogFacialExpressions[x].CurrentExpression });
	}
	if (Player.SavedExpressions[Slot].every(expression => !expression.CurrentExpression))
		Player.SavedExpressions[Slot] = null;
	ServerAccountUpdate.QueueData({ SavedExpressions: Player.SavedExpressions });
	DialogBuildSavedExpressionsMenu();
}

/**
 * Loads expressions from a slot
 * @param {number} Slot - Index of saved expression (0 to 4)
 */
function DialogFacialExpressionsLoad(Slot) {
	const expressions = Player.SavedExpressions && Player.SavedExpressions[Slot];
	if (expressions != null) {
		expressions.forEach(e => CharacterSetFacialExpression(Player, e.Group, e.CurrentExpression));
		DialogFacialExpressionsBuild();
	}
}

/**
 * Builds the savedexpressions menu previews.
 * @returns {void} - Nothing
 */
function DialogBuildSavedExpressionsMenu() {
	const ExcludedGroups = ["Mask"];
	const AppearanceItems = Player.Appearance.filter(A => A.Asset.Group.Category === "Appearance" && !ExcludedGroups.includes(A.Asset.Group.Name));
	const BaseAppearance = AppearanceItems.filter(A => !A.Asset.Group.AllowExpression);
	const ExpressionGroups = AppearanceItems.filter(A => A.Asset.Group.AllowExpression);
	Player.SavedExpressions.forEach((expression, i) => {
		if (expression) {
			const PreviewCharacter = CharacterLoadSimple("SavedExpressionPreview-" + i);
			PreviewCharacter.Appearance = BaseAppearance.slice();
			ExpressionGroups.forEach(I =>
				PreviewCharacter.Appearance.push({
					Asset: I.Asset,
					Color: I.Color,
					Property: I.Property ? { ...I.Property } : undefined,
				})
			);

			for (let x = 0; x < expression.length; x++) {
				CharacterSetFacialExpression(PreviewCharacter, expression[x].Group, expression[x].CurrentExpression);
			}

			DialogSavedExpressionPreviews[i] = PreviewCharacter;
		}
	});
}

/**
 * Draws the savedexpressions menu
 * @returns {void} - Nothing
 */
function DialogDrawSavedExpressionsMenu() {
	DrawText(InterfaceTextGet("SavedExpressions"), 210, 90, "White", "Black");

	if ((!DialogSavedExpressionPreviews || !DialogSavedExpressionPreviews.length) && Player.SavedExpressions.some(expression => expression != null))
		DialogBuildSavedExpressionsMenu();

	for (let x = 0; x < 5; x++) {
		if (Player.SavedExpressions[x] == null) {
			DrawText(InterfaceTextGet("SavedExpressionsEmpty"), 160, 216 + (x * 170), "White", "Black");
		} else {
			const PreviewCanvas = DrawCharacterSegment(DialogSavedExpressionPreviews[x], 100, 30, 300, 220);
			MainCanvas.drawImage(PreviewCanvas, 20, 92 + (x * 175), 260, 190);
		}

		DrawButton(290, 160 + (x * 170), 120, 50, InterfaceTextGet("SavedExpressionsSave"), "White");
		DrawButton(290, 220 + (x * 170), 120, 50, InterfaceTextGet("SavedExpressionsLoad"), "White");
	}
}

/** Handles clicks in the savedexpressions menu
 * @returns {void} - Nothing
 */
function DialogClickSavedExpressionsMenu() {
	if (MouseXIn(290, 120)) {
		for (let x = 0; x < 5; x++) {
			if (MouseYIn(160 + (x * 170), 50)) {
				DialogFacialExpressionsSave(x);
			}
		}
	}
	if (MouseXIn(290, 120)) {
		for (let x = 0; x < 5; x++) {
			if (MouseYIn(220 + (x * 170), 50)) {
				DialogFacialExpressionsLoad(x);
			}
		}
	}
}

/**
 * Build the initial state of the pose menu
 * @param {Character} [C] The character for whom {@link DialogActivePoses} whill be constructed; defaults to {@link CurrentCharacter}
 * @returns {void} - Nothing
 */
function DialogLoadPoseMenu(C=CurrentCharacter) {
	DialogActivePoses = [];

	// Gather all unique categories from poses
	const PoseCategories = new Set(PoseFemale3DCG
		.filter(P => (P.AllowMenu || P.AllowMenuTransient && PoseAvailable(C, P.Category, P.Name)))
		.map(P => P.Category)
	);

	// Add their pose in order so they're grouped together
	PoseCategories.forEach(Category => {
		DialogActivePoses.push(PoseFemale3DCG.filter(P => (P.AllowMenu || P.AllowMenuTransient && PoseAvailable(C, P.Category, P.Name)) && P.Category == Category));
	});
}



/**
 * Handles the Click events in the Dialog Screen
 * @returns {boolean} - Whether a button was clicked
 */
function DialogMenuButtonClick() {

	// Hack because those panes handle their menu icons themselves
	if (["colorExpression", "colorItem", "extended", "layering", "tighten"].includes(DialogMenuMode)) return false;

	// Gets the current character and item
	/** The focused character */
	const C = CharacterGetCurrent();
	/** The focused item */
	const Item = C.FocusGroup ? InventoryGet(C, C.FocusGroup.Name) : null;

	// Finds the current icon
	for (let I = 0; I < DialogMenuButton.length; I++) {
		if (MouseIn(1885 - I * 110, 15, 90, 90)) {

			const button = DialogMenuButton[I];
			// Exit Icon - Go back one level in the menu
			if (button === "Exit") {
				DialogMenuBack();
				return true;
			}

			// Use Icon - Pops the item extension for the focused item
			else if (button === "Use" && Item) {
				DialogExtendItem(Item);
				return true;
			}

			// Remote Icon - Pops the item extension
			else if (button === "Remote" && DialogCanUseRemoteState(C, Item) === "Available") {
				DialogExtendItem(Item);
				return true;
			}

			// Lock Icon - Rebuilds the inventory list with locking items
			else if (button === "Lock") {
				if (Item && InventoryDoesItemAllowLock(Item)) {
					DialogChangeMode("locking");
				}
				return true;
			}

			// Unlock Icon - If the item is padlocked, we immediately unlock.  If not, we start the struggle progress.
			else if (button === "Unlock" && Item) {
				// Check that this is not one of the sticky-locked items
				const isNotStickyLock = InventoryItemHasEffect(Item, "Lock", true) && !InventoryItemHasEffect(Item, "Lock", false);
				if (C.FocusGroup.IsItem() && isNotStickyLock && (!C.IsPlayer() || C.CanInteract())) {
					InventoryUnlock(C, C.FocusGroup.Name);
					if (ChatRoomPublishAction(C, "ActionUnlock", Item, null)) {
						DialogLeave();
					} else {
						DialogChangeMode("items");
					}
				} else
					DialogStruggleStart(C, "ActionUnlock", Item, null);
				return true;
			}

			// Tighten/Loosen Icon - Opens the sub menu
			else if (button === "TightenLoosen" && Item) {
				DialogSetTightenLoosenItem(Item);
				return true;
			}

			// Remove/Struggle Icon - Starts the struggling mini-game (can be impossible to complete)
			else if (
				(button === "Remove" || button === "Struggle" || button === "Dismount" || button === "Escape")
				&& Item) {
				/** @type {DialogStruggleActionType} */
				let action = "ActionRemove";
				if (InventoryItemHasEffect(Item, "Lock")) {
					action = "ActionUnlockAndRemove";
				} else if (C.IsPlayer()) {
					action = `Action${button}`;
				}
				DialogStruggleStart(C, action, Item, null);
				return true;
			}

			// PickLock Icon - Starts the lockpicking mini-game
			else if (button === "PickLock" && Item) {
				StruggleMinigameStart(C, "LockPick", Item, null, DialogStruggleStop);
				DialogChangeMode("struggle");
				DialogMenuButtonBuild(C);
				return true;
			}

			// When the player inspects a lock
			else if (button === "InspectLock" && Item) {
				const Lock = InventoryGetLock(Item);
				if (Lock != null) DialogExtendItem(Lock, Item);
				return true;
			}

			// Color picker Icon - Select a default color to batch-apply on items
			else if (button === "ColorDefault") {
				DialogChangeMode("colorDefault");
				ElementCreateInput("InputColor", "text", (DialogColorSelect != null) ? DialogColorSelect.toString() : "");
				return true;

			// Starts picking colors for the item, keeps the original color and shows it at the bottom
			} else if (button === "ColorChange" && Item != null) {
				const originalColor = Item.Color;
				DialogChangeMode("colorItem");
				ItemColorLoad(C, Item, 1300, 25, 675, 950);
				ItemColorOnExit((save) => {
					DialogChangeMode("items");
					if (save && !CommonColorsEqual(originalColor, Item.Color)) {
						if (C.IsPlayer()) ServerPlayerAppearanceSync();
						ChatRoomPublishAction(C, "ActionChangeColor", Object.assign({}, Item, { Color: originalColor }), Item);
					}
				});
				return true;
			}

			// When the user selects a color, applies it to the item
			else if (button === "ColorSelect" && CommonIsColor(ElementValue("InputColor"))) {
				DialogColorSelect = ElementValue("InputColor");
				ColorPickerHide();
				ElementRemove("InputColor");
				DialogChangeMode("items");
				return true;
			}

			// When the user cancels out of color picking, we recall the original color
			else if (button === "ColorCancel") {
				DialogColorSelect = null;
				ColorPickerHide();
				ElementRemove("InputColor");
				DialogChangeMode("items");
				return true;
			}

			// When the user selects the lock menu, we enter
			else if (Item && button === "LockMenu") {
				DialogChangeMode("locked");
				return true;
			}

			// When the user selects the lock menu, we enter
			else if (Item && button === "Crafting") {
				DialogChangeMode("crafted");
				return true;
			}

			// When the user wants to select a sexual activity to perform
			else if (button === "Activity") {
				DialogChangeMode("activities");
				return true;
			}

			// When we enter item permission mode, we rebuild the inventory to set permissions
			else if (button === "PermissionMode") {
				DialogChangeMode("permissions");
				return true;
			}

			// When we leave item permission mode, we upload the changes for everyone in the room
			else if (button === "NormalMode") {
				DialogChangeMode("items");
				return true;
			}

			else if (Item && button === "Layering") {
				DialogChangeMode("layering");
				return true;
			}
		}
	}

	return false;
}

/**
 * Publishes the item action to the local chat room or the dialog screen
 * @param {Character} C - The character who is the actor in this action
 * @param {string} Action - The action performed
 * @param {Item} ClickItem - The item that is used
 * @returns {void} - Nothing
 */
function DialogPublishAction(C, Action, ClickItem) {
	// Publishes the item result
	if ((CurrentScreen == "ChatRoom") && !InventoryItemHasEffect(ClickItem)) {
		if (ChatRoomPublishAction(C, Action, null, ClickItem))
			DialogLeave();
	}
	else if (C.IsNpc()) {
		let Line = ClickItem.Asset.Group.Name + ClickItem.Asset.DynamicName(Player);
		let D = DialogFind(C, Line, null, false);
		if (D != "") {
			C.CurrentDialog = D;
			DialogLeaveItemMenu();
		}
	}

}

/**
 * Returns TRUE if the clicked item can be processed, make sure it's not the same item as the one already used
 * @param {Item} CurrentItem - The item currently equiped
 * @param {Item} ClickItem - The clicked item
 * @returns {boolean} - TRUE when we can process
 */
function DialogAllowItemClick(CurrentItem, ClickItem) {
	if (CurrentItem == null) return true;
	if (CurrentItem.Asset.Name != ClickItem.Asset.Name) return true;
	if ((CurrentItem.Craft == null) && (ClickItem.Craft != null)) return true;
	if ((CurrentItem.Craft != null) && (ClickItem.Craft == null)) return true;
	if ((CurrentItem.Craft != null) && (ClickItem.Craft != null) && (CurrentItem.Craft.Name != ClickItem.Craft.Name)) return true;
	return false;
}

/**
 * Handles `permissions`-mode clicks on an item
 * @param {DialogInventoryItem} ClickItem - The item that is clicked
 * @param {null | Item} CurrentItem
 * @returns {ItemPermissionMode} - Nothing
 */
function DialogPermissionsClick(ClickItem, CurrentItem=null) {
	const worn = (ClickItem.Worn || (CurrentItem && (CurrentItem.Asset.Name == ClickItem.Asset.Name)));
	return DialogInventoryTogglePermission(ClickItem, worn);
}

/**
 * Handles `locking`-mode clicks on an item
 * @param {DialogInventoryItem} ClickedLock - The item that is clicked
 * @param {Character} C
 * @param {null | Item} CurrentItem
 */
function DialogLockingClick(ClickedLock, C, CurrentItem=null) {
	InventoryLock(C, CurrentItem, ClickedLock, Player.MemberNumber);
	IntroductionJobProgress("DomLock", ClickedLock.Asset.Name, true);
	DialogChangeMode("items");
	if (ChatRoomPublishAction(C, "ActionAddLock", CurrentItem, ClickedLock)) {
		DialogLeave();
	}
}

/**
 * Handles `items`-mode clicks on an item
 * @param {DialogInventoryItem} ClickItem - The item that is clicked
 * @param {Character} C - The target character
 * @param {null | Item} CurrentItem - The equipped item (if any)
 */
function DialogItemClick(ClickItem, C, CurrentItem=null) {
	// We're dealing with a previously equipped extended item; open the extended item menu
	if (CurrentItem?.Asset.Extended && !DialogAllowItemClick(CurrentItem, ClickItem)) {
		DialogExtendItem(CurrentItem);
		return;
	}

	// Special-casing for items that cannot actually be worn
	if (!ClickItem.Asset.Wear) {
		if (InventoryItemHasEffect(ClickItem, /** @type {EffectName} */(`Unlock${CurrentItem?.Asset.Name}`))) {
			// Unlock an item if one clicks the key
			DialogStruggleStart(C, "ActionUnlock", CurrentItem, null);
		} else if (ClickItem.Asset.Name === "VibratorRemote" || ClickItem.Asset.Name === "LoversVibratorRemote") {
			// The vibrating egg remote can open the vibrating egg's extended dialog
			if (DialogCanUseRemoteState(C, CurrentItem) === "Available") { DialogExtendItem(CurrentItem); }
		} else {
			// Runs the activity arousal process if activated, & publishes the item action text to the chatroom
			DialogPublishAction(C, "ActionUse", ClickItem);
			ActivityArousalItem(Player, C, ClickItem.Asset);
		}
		return;
	}

	/** @type {DialogStruggleActionType} */
	let action;
	if (CurrentItem && ClickItem) {
		action = "ActionSwap";
	} else if (ClickItem) {
		action = "ActionUse";
	} else {
		action = "ActionRemove";
	}
	DialogStruggleStart(C, action, CurrentItem, ClickItem);
}

/**
 *
 * @param {Character} C
 * @param {ItemActivity} clickedActivity
 * @param {null | Item} equippedItem
 */
function DialogActivityClick(C, clickedActivity, equippedItem) {
	if (C.IsNpc() && clickedActivity.Item) {
		let Line = C.FocusGroup.Name + clickedActivity.Item.Asset.DynamicName(Player);
		let D = DialogFind(C, Line, null, false);
		if (D != "") {
			C.CurrentDialog = D;
		}
	}
	IntroductionJobProgress("SubActivity", clickedActivity.Activity.MaxProgress.toString(), true);
	if (clickedActivity.Item?.Asset.Name === "ShockRemote") {
		if (typeof equippedItem?.Property?.TriggerCount === "number") {
			equippedItem.Property.TriggerCount++;
			ChatRoomCharacterItemUpdate(C, C.FocusGroup.Name);
		}
	}
	ActivityRun(Player, C, C.FocusGroup, clickedActivity);
	// Leave the dialog so we see the character's reaction
	if (CurrentScreen === "ChatRoom")
		DialogLeave();
}

/**
 * Toggle permission of an item in the dialog inventory list
 * @param {DialogInventoryItem} item
 * @param {boolean} worn - True if the player is changing permissions for an item they're wearing
 * @returns {ItemPermissionMode} The new item permission
 */
function DialogInventoryTogglePermission(item, worn) {
	const permission = InventoryTogglePermission(item, null, worn);

	// Refresh the inventory item
	const itemIndex = DialogInventory.findIndex(i => i.Asset.Name == item.Asset.Name && i.Asset.Group.Name == item.Asset.Group.Name);
	const sortOrder = /** @type {DialogSortOrder} */ (parseInt(item.SortOrder.replace(/[^0-9].+/gm, '') || DialogSortOrder.Usable)); // only keep the number at the start
	DialogInventory[itemIndex] = DialogInventoryCreateItem(Player, item, item.Worn, sortOrder);
	return permission;
}

/**
 * Changes the dialog mode and perform the initial setup.
 *
 * @param {DialogMenuMode} mode The new mode for the dialog.
 * @param {boolean} reset Whether to reset the mode back to its defaults
 */
function DialogChangeMode(mode, reset=false) {
	const C = CharacterGetCurrent();

	// Handle changing to the expression color picker having to restore the selected mode & group
	if (mode === "colorExpression" && (!DialogExpressionPreviousMode || DialogExpressionPreviousMode.mode !== "colorExpression")) {
		DialogExpressionPreviousMode = { mode: DialogMenuMode, group: C.FocusGroup };
	}

	DialogMenuMapping[DialogMenuMode]?.Unload();
	const modeChange = DialogMenuMode !== mode || reset;
	DialogMenuMode = mode;

	switch (DialogMenuMode) {
		case "activities":
		case "crafted":
		case "items":
		case "locked":
		case "locking":
		case "permissions": {
			if (DialogMenuMode !== "locking") {
				// FIXME: Ensure we don't leave that set, that's only for "locking" mode
				DialogFocusSourceItem = null;
			}

			/** @type {DialogMenu} */
			const screenfunctions = DialogMenuMapping[DialogMenuMode];
			if (C && C.FocusGroup) {
				screenfunctions.Init(C, C.FocusGroup);
				screenfunctions.Resize(true);
			}
			break;
		}

		case "colorItem":
		case "colorDefault":
		case "colorExpression":
			DialogInventoryBuild(C, modeChange);
			DialogMenuButtonBuild(C);
			DialogBuildActivities(C);
			break;

		case "dialog":
			DialogInventory = [];
			DialogMenuButton = [];
			break;

		case "extended":
		case "tighten":
		case "struggle":
			DialogMenuButtonBuild(C);
			break;

		case "layering": {
			const item = InventoryGet(C, C?.FocusGroup?.Name);
			if (item) {
				const mutable = InventoryItemHasEffect(item, "Lock") ? DialogCanUnlock(C, item) : Player.CanInteract();
				Layering.Init(item, C, {
					x: DialogInventoryGrid.x,
					y: Layering.DisplayDefault.y - 10,
					w: (Layering.DisplayDefault.x + Layering.DisplayDefault.w) - DialogInventoryGrid.x,
					h: Layering.DisplayDefault.h + 10,
				}, reset, !mutable);
			}
			break;
		}

		default:
			console.warn(`Asked to change to mode ${DialogMenuMode}, but setup missing`);
			break;
	}

	// `DialogChangeMode()` acts as the de facto `Load()` function for dialog subscreens, hence passing along `load: true`
	DialogResize(true);
}

/**
 * Change the given character's focused group.
 * @param {Character} C - The character to change the focus of.
 * @param {AssetItemGroup|string} Group - The group that should gain focus.
 */
function DialogChangeFocusToGroup(C, Group) {
	/** @type {null | AssetGroup} */
	let G = null;
	if (typeof Group === "string") {
		G = AssetGroupGet(C.AssetFamily, /** @type {AssetGroupName} */ (Group));
		if (!Group) return;
	} else {
		G = Group;
	}

	// Deselect any extended screen and color picking in progress
	// It's done without calling DialogLeaveFocusItem() so it
	// acts as cancelling out of a in-progress edit.
	DialogLeaveFocusItem();
	if (DialogMenuMode === "colorExpression" || DialogMenuMode === "colorItem")
		ItemColorCancelAndExit();
	else if (DialogMenuMode === "colorDefault") {
		ColorPickerHide();
		ElementRemove("InputColor");
	} else if (DialogMenuMode === "layering" && !InventoryGet(C, G?.Name)) {
		DialogMenuBack();
	}

	// Stop sounds & expressions from struggling/swapping items
	AudioDialogStop();

	// Stop any strugling minigame
	if(StruggleMinigameIsRunning()) {
		StruggleMinigameStop();
	}

	// If we're in the two-character dialog, clear their focused group
	if (!CurrentCharacter.IsPlayer()) {
		Player.FocusGroup = null;
		CurrentCharacter.FocusGroup = null;
	}

	// Now set the selected group and refresh
	const previousGroup = C.FocusGroup;
	C.FocusGroup = /** @type {AssetItemGroup} */ (G);
	if (C.FocusGroup) {
		// If we're changing permissions on ourself, don't change to the item list
		// Same for activities/layering, keep us in that mode if the focus moves around
		if ((DialogMenuMode === "permissions" && C.IsPlayer()) || DialogMenuMode === "activities" || DialogMenuMode === "layering") {
			// Set the mode back to itself to trigger a refresh of the state variables.
			DialogChangeMode(DialogMenuMode, !previousGroup || C.FocusGroup.Name !== previousGroup.Name);
		} else {
			DialogChangeMode("items", true);
		}
	} else {
		// We don't have a focused group anymore. Switch to dialog mode.
		DialogChangeMode("dialog");
	}
}

/**
 * Handles the click in the dialog screen
 * @type {ScreenFunctions["Click"]}
 */
function DialogClick(event) {
	// Check that there's actually a character selected
	if (!CurrentCharacter) return;

	// Gets the current character
	let C = CharacterGetCurrent();

	// Check if the user clicked on one of the top menu icons
	if (DialogMenuButtonClick()) return;

	// User clicked on the interacted character or herself, check if we need to update the menu
	if (MouseIn(0, 0, 1000, 1000) && (CurrentCharacter.AllowItem || (MouseX < 500)) && (!CurrentCharacter.IsPlayer() || (MouseX > 500)) && (DialogIntro() != "") && DialogAllowItemScreenException()) {
		C = (MouseX < 500) ? Player : CurrentCharacter;
		let X = MouseX < 500 ? 0 : 500;
		for (const Group of AssetGroup) {
			if (!Group.IsItem()) continue;
			const Zone = Group.Zone.find(Z => DialogClickedInZone(C, Z, 1, X, 0, C.HeightRatio));
			if (Zone) {
				DialogChangeFocusToGroup(C, Group);
				break;
			}
		}
	}

	// If the user clicked in the facial expression menu
	if (MouseXIn(0, 500) && CurrentCharacter != null) {
		DialogSelfMenuClick(CurrentCharacter);
	}

	if (DialogMenuMode === "dialog") {
		// If we need to leave the dialog (only allowed when there's an entry point to the dialog, not in the middle of a conversation)
		if (MouseIn(1885, 25, 90, 90) && DialogIntro() != "" && DialogIntro() != "NOEXIT")
			DialogMenuBack();

		// If the user clicked on a text dialog option, we trigger it
		if (MouseIn(1025, 100, 950, 890) && CurrentCharacter != null) {
			let optionID = 0;
			for (let D = 0; D < CurrentCharacter.Dialog.length; D++) {
				if ((CurrentCharacter.Dialog[D].Stage == CurrentCharacter.Stage) && (CurrentCharacter.Dialog[D].Option != null) && DialogPrerequisite(D)) {
					if (MouseIn(1025, 160 + optionID * 105, 950, 90)) {
						// If the player is gagged, the answer will always be the same
						if (!Player.CanTalk()) CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "PlayerGagged");
						else CurrentCharacter.CurrentDialog = CurrentCharacter.Dialog[D].Result;

						// A dialog option can change the conversation stage, show text or launch a custom function
						if ((Player.CanTalk() && CurrentCharacter.CanTalk()) || SpeechFullEmote(CurrentCharacter.Dialog[D].Option)) {
							CurrentCharacter.CurrentDialog = CurrentCharacter.Dialog[D].Result;
							if (CurrentCharacter.Dialog[D].NextStage != null) CurrentCharacter.Stage = CurrentCharacter.Dialog[D].NextStage;
							if (CurrentCharacter.Dialog[D].Function != null) CommonDynamicFunctionParams(CurrentCharacter.Dialog[D].Function);
						} else if ((CurrentCharacter.Dialog[D].Function != null) && (CurrentCharacter.Dialog[D].Function.trim() == "DialogLeave()"))
							DialogLeave();
						break;
					}
					optionID++;
				}
			}
		}
		return;
	}

	// Block out clicking on anything else if we're not supposed to interact with the selected character
	if (C.FocusGroup === null || !C.AllowItem || DialogIntro() === "") return;

	/** The item currently sitting in the focused group */
	const FocusItem = InventoryGet(C, C.FocusGroup.Name);

	// If the user clicked the Up button, move the character up to the top of the screen
	if ((CurrentCharacter.HeightModifier < -90 || CurrentCharacter.HeightModifier > 30) && (CurrentCharacter.FocusGroup != null) && MouseIn(510, 50, 90, 90)) {
		CharacterAppearanceForceUpCharacter = CharacterAppearanceForceUpCharacter == CurrentCharacter.MemberNumber ? -1 : CurrentCharacter.MemberNumber;
		return;
	}

	// If the user clicked anywhere outside the current character item zones, ensure the position is corrected
	if (CharacterAppearanceForceUpCharacter == CurrentCharacter.MemberNumber && ((MouseX < 500) || (MouseX > 1000) || (CurrentCharacter.FocusGroup == null))) {
		CharacterAppearanceForceUpCharacter = -1;
		CharacterRefresh(CurrentCharacter, false, false);
	}

	// If the user wants to speed up the add / swap / remove progress
	if (MouseIn(1000, 200, 1000, 800) && DialogMenuMode === "struggle") {
		if (StruggleMinigameIsRunning()) {
			StruggleMinigameClick();
		} else {
			for (const [idx, [game, data]] of StruggleGetMinigames().entries()) {
				if (MouseIn(1387 + 300 * (idx - 1), 550, 225, 275) && data.DisablingCraftedProperty && !InventoryCraftPropertyIs(DialogStrugglePrevItem, data.DisablingCraftedProperty)) {
					StruggleMinigameStart(Player, game, DialogStrugglePrevItem, DialogStruggleNextItem, DialogStruggleStop);
					DialogMenuButtonBuild(C);
				}
			}
			if ((CurrentScreen === "ChatRoom") && MouseIn(1300, 880, 400, 65)) StruggleChatRoomStart();
		}
		return;
	}

	if (DialogMenuMode === "extended") {
		if (DialogFocusItem != null)
			CommonDynamicFunction("Inventory" + DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Click()");
		return;
	} else if (DialogMenuMode === "tighten") {
		if (DialogTightenLoosenItem != null)
			TightenLoosenItemClick();
		return;
	} else if (DialogMenuMode === "colorItem" || DialogMenuMode === "colorExpression") {
		if (MouseIn(1300, 25, 675, 950) && FocusItem) {
			ItemColorClick(C, C.FocusGroup.Name, 1200, 25, 775, 950, true);
			return;
		}
	}

	DialogMenuMapping[DialogMenuMode]?.Click(event);
}

/** @type {ScreenFunctions["Resize"]} */
function DialogResize(load) {
	switch (DialogMenuMode) {
		case "layering":
			Layering.Resize(load);
			return;
	}

	DialogMenuMapping[DialogMenuMode]?.Resize(load);
}

/**
 * Returns whether the clicked co-ordinates are inside the asset zone
 * @param {Character} C - The character the click is on
 * @param {RectTuple} Zone - The 4 part array of the rectangular asset zone on the character's body: [X, Y, Width, Height]
 * @param {number} Zoom - The amount the character has been zoomed
 * @param {number} X - The X co-ordinate of the click
 * @param {number} Y - The Y co-ordinate of the click
 * @param {number} HeightRatio - The displayed height ratio of the character
 * @returns {boolean} - If TRUE the click is inside the zone
 */
function DialogClickedInZone(C, Zone, Zoom, X, Y, HeightRatio) {
	let CZ = DialogGetCharacterZone(C, Zone, X, Y, Zoom, HeightRatio);
	return MouseIn(CZ[0], CZ[1], CZ[2], CZ[3]);
}

/**
 * Return the co-ordinates and dimensions of the asset group zone as it appears on screen
 * @param {Character} C - The character the zone is calculated for
 * @param {readonly [number, number, number, number]} Zone - The 4 part array of the rectangular asset zone: [X, Y, Width, Height]
 * @param {number} X - The starting X co-ordinate of the character's position
 * @param {number} Y - The starting Y co-ordinate of the character's position
 * @param {number} Zoom - The amount the character has been zoomed
 * @param {number} HeightRatio - The displayed height ratio of the character
 * @returns {[number, number, number, number]} - The 4 part array of the displayed rectangular asset zone: [X, Y, Width, Height]
 */
function DialogGetCharacterZone(C, Zone, X, Y, Zoom, HeightRatio) {
	X += CharacterAppearanceXOffset(C, HeightRatio) * Zoom;
	Y += CharacterAppearanceYOffset(C, HeightRatio) * Zoom;
	Zoom *= HeightRatio;

	let Left = X + Zone[0] * Zoom;
	let Top = CharacterAppearsInverted(C) ? 1000 - (Y + (Zone[1] + Zone[3]) * Zoom) : Y + Zone[1] * Zoom;
	let Width = Zone[2] * Zoom;
	let Height = Zone[3] * Zoom;
	return [Left, Top, Width, Height];
}

/**
 * Finds and sets the next available character sub menu.
 * @returns {void} - Nothing
 */
function DialogFindNextSubMenu() {
	var CurrentIndex = DialogSelfMenuOptions.indexOf(DialogSelfMenuSelected);
	if (CurrentIndex == -1) CurrentIndex = 0;

	var NextIndex = CurrentIndex + 1 == DialogSelfMenuOptions.length ? 0 : CurrentIndex + 1;

	for (let SM = NextIndex; SM < DialogSelfMenuOptions.length; SM++) {
		if (DialogSelfMenuOptions[SM].IsAvailable()) {
			if (DialogSelfMenuOptions[SM].Load)
				DialogSelfMenuOptions[SM].Load();
			DialogSelfMenuSelected = DialogSelfMenuOptions[SM];
			return;
		}
		if (SM + 1 == DialogSelfMenuOptions.length) SM = -1;
	}
}

/**
 * Finds and set an available character sub menu.
 * @param {string} MenuName - The name of the sub menu, see DialogSelfMenuOptions.
 * @param {boolean} force - Whether to check availability of the menu first.
 * @returns {boolean} - True, when the sub menu is found and available and was switched to. False otherwise and nothing happened.
 */
function DialogFindSubMenu(MenuName, force=false) {
	for (let MenuIndex = 0; MenuIndex < DialogSelfMenuOptions.length; MenuIndex++) {
		let MenuOption = DialogSelfMenuOptions[MenuIndex];
		if (MenuOption.Name == MenuName) {
			if (force || MenuOption.IsAvailable()) {
				if (MenuOption.Load)
					MenuOption.Load();
				DialogSelfMenuSelected = MenuOption;
				return true;
			}
			return false;
		}
	}
	return false;
}

/**
 * Finds and sets a facial expression group. The expression sub menu has to be already opened.
 * @param {ExpressionGroupName} ExpressionGroup - The name of the expression group, see XXX.
 * @returns {boolean} True, when the expression group was found and opened. False otherwise and nothing happens.
 */
function DialogFindFacialExpressionMenuGroup(ExpressionGroup) {
	if (DialogSelfMenuSelected.Name != "Expression") return false;
	if (!DialogFacialExpressions || !DialogFacialExpressions.length) DialogFacialExpressionsBuild();
	let I = DialogFacialExpressions.findIndex(expr => expr.Group == ExpressionGroup);
	if (I != -1) {
		DialogFacialExpressionsSelected = I;
		if (DialogMenuMode === "colorExpression") ItemColorSaveAndExit();
		return true;
	}
	return false;
}

/**
 * Displays the given text for 5 seconds
 * @param {string} status - The text to be displayed
 * @param {number} timer - the number of milliseconds to display the message for
 * @param {null | { asset?: Asset, group?: AssetGroup, C?: Character }} replace - Attempt to perform replacements within the `status` text
 * @returns {void} - Nothing
 */
function DialogSetStatus(status, timer=0, replace=null) {
	const elem = document.getElementById(DialogMenuMapping[DialogMenuMode]?.ids.status ?? "");
	if (!elem) {
		return;
	}

	replace ??= {};
	if (replace.group || replace.asset) {
		status = status.replaceAll("GroupName", DialogActualNameForGroup(replace.C ?? Player, replace.group ?? replace.asset.Group).toLowerCase());
	}
	if (replace.asset) {
		status = status.replaceAll("AssetName", replace.asset.Description);
	}
	if (replace.C) {
		status = status.replaceAll("DialogCharacterObject", CharacterNickname(replace.C));
	}

	const timeoutID = elem.getAttribute("data-timeout-id");
	if (timer > 0) {
		if (timeoutID) {
			clearTimeout(Number.parseInt(timeoutID, 10));
		} else {
			elem.setAttribute("data-default", elem.textContent);
		}

		elem.textContent = status;
		elem.setAttribute("data-timeout-id", setTimeout(DialogStatusTimerHandler, timer, elem).toString());
	} else {
		// We let the timer for the non-default message expire normally
		if (timeoutID) {
			elem.setAttribute("data-default", status);
		} else {
			elem.textContent = status;
		}
	}
}

/**
 * Timer handler for managing timed dialog statuses.
 * @param {Element} elem - The relevant `span.dialog-status` element
 * @satisfies {TimerHandler}
 */
function DialogStatusTimerHandler(elem) {
	elem.textContent = elem.getAttribute("data-default") ?? "";
	elem.removeAttribute("data-default");
	elem.removeAttribute("data-timeout-id");
}

/** Clears the current status message. */
function DialogStatusClear() {
	const id = DialogMenuMapping[DialogMenuMode]?.ids.status;
	if (!id) {
		return;
	}

	const elem = document.getElementById(id);
	const timeoutID = elem?.getAttribute("data-timeout-id");
	if (timeoutID) {
		clearTimeout(Number.parseInt(timeoutID, 10));
		DialogStatusTimerHandler(elem);
	}
}

/**
 * Shows the extended item menu for a given item, if possible.
 * Therefore a dynamic function name is created and then called.
 * @param {Item} Item - The item the extended menu should be shown for
 * @param {Item} [SourceItem] - The source of the extended menu
 * @returns {void} - Nothing
 */
function DialogExtendItem(Item, SourceItem) {
	const C = CharacterGetCurrent();
	if (AsylumGGTSControlItem(C, Item)) return;
	if (InventoryBlockedOrLimited(C, Item)) return;
	DialogChangeMode("extended");
	DialogFocusItem = Item;
	DialogFocusSourceItem = SourceItem;
	ExtendedItemInit(C, Item.Asset.IsLock ? SourceItem : Item, false, true);
	CommonDynamicFunction("Inventory" + Item.Asset.Group.Name + Item.Asset.Name + "Load()");
}

/**
 * Shows the tigthen/loosen item menu for a given item, if possible.
 * @param {Item} Item - The item to open the menu for
 * @returns {void} - Nothing
 */
function DialogSetTightenLoosenItem(Item) {
	const C = CharacterGetCurrent();
	if (AsylumGGTSControlItem(C, Item)) return;
	if (InventoryBlockedOrLimited(C, Item)) return;
	DialogChangeMode("tighten");
	DialogTightenLoosenItem = Item;
	TightenLoosenItemLoad();
}

/**
 * Validates that the player is allowed to change the item color and swaps it on the fly
 * @param {Character} C - The player who wants to change the color
 * @param {string} Color - The new color in the format "#rrggbb"
 * @returns {void} - Nothing
 */
function DialogChangeItemColor(C, Color) {

	// Validates that the player isn't blind and can interact with the item
	if (!Player.CanInteract() || Player.IsBlind() || !C.FocusGroup) return;

	// If the item is locked, make sure the player could unlock it before swapping colors
	var Item = InventoryGet(C, C.FocusGroup.Name);
	if (Item == null) return;
	if (InventoryItemHasEffect(Item, "Lock", true) && !DialogCanUnlock(C, Item)) return;

	// Make sure the item is allowed, the group isn't blocked and it's not an enclosing item
	if (!InventoryAllow(C, Item.Asset) || InventoryGroupIsBlocked(C)) return;
	if (InventoryItemHasEffect(Item, "Enclose", true) && (C.IsPlayer())) return;

	// Apply the color & redraw the character after 100ms.  Prevent unnecessary redraws to reduce performance impact
	Item.Color = Color;
	clearTimeout(DialogFocusItemColorizationRedrawTimer);
	DialogFocusItemColorizationRedrawTimer = setTimeout(function () { CharacterAppearanceBuildCanvas(C); }, 100);

}

/**
 * Draw the list of activities
 *
 * @deprecated - See {@link DialogMenuMapping.activities.Load} and {@link DialogMenuMapping.activities.Reload} for the new DOM-based menu
 * @param {Character} C - The character currently focused in the dialog.
 * @returns {void} - Nothing
 */
function DialogDrawActivityMenu(C) {
	// Keep around as deprecated no-op
}

/**
 * Returns the button image name for a dialog menu button based on the button name.
 * @param {DialogMenuButton} ButtonName - The menu button name
 * @param {Item} FocusItem - The focused item
 * @returns {string} - The button image name
 */
function DialogGetMenuButtonImage(ButtonName, FocusItem) {
	if (ButtonName === "ColorDefault" || ButtonName === "ColorChange" || ButtonName === "ColorPickDisabled") {
		return ItemColorIsSimple(FocusItem) ? "ColorChange" : "ColorChangeMulti";
	} else if (ButtonName.includes("PickLock")) {
		return "PickLock";
	} else if (DialogIsMenuButtonDisabled(ButtonName)) {
		return ButtonName.replace(DialogButtonDisabledTester, "");
	} else {
		return ButtonName;
	}
}

/**
 * Returns the background color of a dialog menu button based on the button name.
 * @param {DialogMenuButton} ButtonName - The menu button name
 * @returns {string} - The background color that the menu button should use
 */
function DialogGetMenuButtonColor(ButtonName) {
	if (DialogIsMenuButtonDisabled(ButtonName)) {
		return "#808080";
	} else if (ButtonName === "ColorDefault") {
		return DialogColorSelect || "#fff";
	} else {
		return "#fff";
	}
}

/**
 * Determines whether or not a given dialog menu button should be disabled based on the button name.
 * @param {DialogMenuButton} ButtonName - The menu button name
 * @returns {boolean} - TRUE if the menu button should be disabled, FALSE otherwise
 */
function DialogIsMenuButtonDisabled(ButtonName) {
	return DialogButtonDisabledTester.test(ButtonName);
}

/**
 * Draw the list of items
 *
 * @deprecated - See {@link DialogMenuMapping.items.Load} and {@link DialogMenuMapping.items.Reload} for the new DOM-based menu
 * @param {Character} C - The character currently focused in the dialog.
 * @returns {void} - Nothing
 */
function DialogDrawItemMenu(C) {
	// Keep around as deprecated no-op
}

// NOTE: The `Dialog` screen/subscreen lacks proper `Run()` support (see `DrawProcess`), hence its explicit omission here
/**
 * Base class for managing various {@link DialogMenu} subscreens.
 * @template {string} [ModeType=string] - The name of the mode associated with this instance (_e.g._ {@link DialogMenuMode})
 * @template {DialogInventoryItem | ItemActivity | null} [ClickedObj=any] - The underlying item or activity object of the clicked grid buttons (if applicable)
 * @abstract
 * @extends {Omit<ScreenFunctions, "Run">}
 */
class DialogMenu {
	/**
	 * An object containg all DOM element IDs referenced in the {@link DialogMenu} subclass.
	 * @abstract
	 * @readonly
	 * @type {Readonly<Record<string, string> & { root: string, status?: string, grid?: string, icon?: string }>}
	 */
	ids;

	/**
	 * An object containg all event listeners referenced in the {@link DialogMenu} subclass.
	 * @readonly
	 * @satisfies {Record<string, (this: HTMLElement, ev: Event) => any>}
	 */
	eventListeners;

	/**
	 * The name of the mode associated with this instance (see {@link DialogMenuMode}).
	 * @readonly
	 * @type {ModeType}
	 */
	mode;

	/**
	 * An object mapping IDs to {@link DialogMenu.GetClickStatus} helper functions.
	 * Used for evaluating the error statuses of item clicks.
	 *
	 * Additional checks can be freely added here.
	 * @abstract
	 * @readonly
	 * @type {Record<string, DialogMenu<string, ClickedObj>["GetClickStatus"]>}
	 */
	clickStatusCallbacks;

	/**
	 * See {@link DialogMenu.shape}
	 * @private
	 * @type {null | RectTuple}
	 */
	_shape = null;

	/**
	 * Get or set the position & shape of the current subscreen as defined by the root element.
	 *
	 * Performs a {@link DialogMenu.Resize} if a new shape is assigned.
	 */
	get shape() {
		return this._shape;
	}
	set shape(value) {
		if (value != null && !CommonArraysEqual(this._shape, value)) {
			this._shape = value;
			this.Resize(false);
		}
	}

	/**
	 * The default position & shape of the current subscreen as defined by the root element.
	 *
	 * See {@link DialogMenu.shape}.
	 * @readonly
	 * @satisfies {Readonly<RectTuple>}
	 */
	defaultShape = Object.freeze(/** @type {const} */([1115, 120, 885, 855]));

	/**
	 * See {@link DialogMenu.C}
	 * @private
	 * @type {null | Character}
	 */
	_C = null;

	/**
	 * Get or set the currently selected character.
	 *
	 * Performs a hard {@link DialogMenu.Reload} if a new character is assigned.
	 */
	get C() {
		return this._C;
	}
	set C(value) {
		const elem = document.getElementById(this.ids.root);
		if (value == null) {
			this._C = null;
			elem?.removeAttribute("data-character-id");
		} else if (this.C.ID !== value.ID) {
			this._C = value;
			elem?.setAttribute("data-character-id", value.ID);
			this.Reload(null, null, { reset: true });
		}
	}

	/**
	 * See {@link DialogMenu.focusGroup}.
	 * @private
	 * @type {null | AssetItemGroup}
	 */
	_focusGroup = null;

	/**
	 * Get or set the currently selected group.
	 *
	 * Performs a hard {@link DialogMenu.Reload} if a new focus group is assigned.
	 */
	get focusGroup() {
		return this._focusGroup;
	}
	set focusGroup(value) {
		const elem = document.getElementById(this.ids.root);
		if (value == null) {
			this._focusGroup = null;
			elem?.removeAttribute("data-group");
		} else if (this.focusGroup.Name !== value.Name) {
			this._focusGroup = value;
			elem?.setAttribute("data-group", value.Name);
			this.Reload(null, null, { reset: true });
		}
	}

	/**
	 * @param {ModeType} mode The name of the mode associated with this instance
	 */
	constructor(mode) {
		this.mode = mode;

		const dialogMenu = this;
		this.eventListeners = {
			/**
			 * @type {(this: HTMLButtonElement, ev: MouseEvent) => null | string}
			 * @returns A status message if an _unexpected_ error is encountered and null otherwise
			 */
			_ClickButton: function(event) {
				const clickedObj = dialogMenu._GetClickedObject(this);
				if (!clickedObj || !dialogMenu.C || !dialogMenu.focusGroup) {
					event.stopImmediatePropagation();
					return "Internal error";
				}

				const equippedItem = InventoryGet(dialogMenu.C, dialogMenu.focusGroup.Name);
				const status = dialogMenu.GetClickStatus(dialogMenu.C, clickedObj, equippedItem);
				if (status) {
					event.stopImmediatePropagation();
					dialogMenu.Reload(null, null, { status, statusTimer: DialogTextDefaultDuration });
					return status;
				} else {
					dialogMenu._ClickButton(this, dialogMenu.C, clickedObj, equippedItem);
					return null;
				}
			},

			/**
			 * @type {(this: HTMLButtonElement, ev: MouseEvent) => null | string}
			 * @returns A status message if an _expected_ error is encountered and null otherwise
			 */
			_ClickDisabledButton: function(event) {
				const clickedObj = dialogMenu._GetClickedObject(this);
				if (!clickedObj || !dialogMenu.C || !dialogMenu.focusGroup) {
					event.stopImmediatePropagation();
					return null;
				}

				const equippedItem = InventoryGet(dialogMenu.C, dialogMenu.focusGroup.Name);
				const status = dialogMenu.GetClickStatus(dialogMenu.C, clickedObj, equippedItem);
				if (status) {
					DialogSetStatus(status, DialogTextDefaultDuration, { asset: equippedItem?.Asset, C: dialogMenu.C, group: dialogMenu.focusGroup });
					return status;
				} else {
					// Force a reload (and a new click event) if the click somehow _did not_ fail
					dialogMenu.Reload().then((reloadStatus) => {
						if (reloadStatus && this.getAttribute("aria-disabled") !== "true") {
							this.dispatchEvent(new MouseEvent("click", event));
						}
					});
					event.stopImmediatePropagation();
					return null;
				}
			},
		};
	}

	/**
	 * Initialize the {@link DialogMenu} subscreen.
	 *
	 * Serves as a {@link ScreenFunctions["Load"]} wrapper with added parameters.
	 * @param {Character} C The character in question
	 * @param {AssetItemGroup} focusGroup The focused item group
	 * @param {null | { shape?: RectTuple }} style Misc styling for the subscreen
	 * @returns {HTMLDivElement} The div containing the dialog subscreen root element
	 */
	Init(C, focusGroup, style=null) {
		style ??= {};
		this._C = C;
		this._focusGroup = focusGroup;
		this._shape = style.shape ?? [...this.defaultShape];
		this.Load();
		return /** @type {HTMLDivElement} */(document.getElementById(this.ids.root));
	}

	/** @type {ScreenFunctions["Load"]} */
	Load() {
		if (!this.C || !this.focusGroup || !this.shape) {
			console.error(
				"Aborting, one or more uninitialized properties",
				{ C: this.C, focusGroup: this.focusGroup, shape: this.shape },
			);
			this.Exit();
			return;
		}

		const root = this._Load();
		root.setAttribute("id", this.ids.root);
		root.setAttribute("screen-generated", CurrentScreen);
		root.setAttribute("data-group", this.focusGroup.Name);
		root.setAttribute("data-character-id", this.C.ID);
		root.setAttribute("data-mode", this.mode);
		root.classList.add("HideOnPopup", "dialog-root");
		if (!root.parentElement) { document.body.append(root); }
		root.toggleAttribute("data-unload", false);

		// Scroll bar resetting is handled by `Resize(load=true)` here; don't perform it twice
		DialogMenuButtonBuild(this.C);
		this.Reload(null, null, { reset: true, resetScrollbar: false });
	}

	/**
	 * Construct and return the (unpopulated) {@link DialogMenu.ids.root} element.
	 * @abstract
	 * @returns {HTMLElement}
	 */
	_Load() {
		throw new Error("Trying to call an abstract method");
	}

	/** @type {ScreenFunctions["Unload"]} */
	Unload() {
		DialogStatusClear();
		document.getElementById(this.ids.root)?.toggleAttribute("data-unload", true);
	}

	/** @type {ScreenFunctions["Click"]} */
	Click(event) {}

	/** @type {ScreenFunctions["Draw"]} */
	Draw() {}

	/** @type {ScreenFunctions["Resize"]} */
	Resize(load) {
		ElementPositionFixed(this.ids.root, ...this.shape);

		if (load) {
			// Scroll to the checked button upon loading
			// Needs to be performed after `ElementPositionFixed()` due to its sensitivity towards the exact shape of the root
			const grid = document.getElementById(this.ids.grid);
			const checkedButton = grid?.querySelector(`.dialog-grid-button[aria-checked='true']`);
			if (checkedButton) {
				checkedButton.scrollIntoView();
			} else {
				grid?.scrollTo({ top: 0 });
			}
		}
	}

	/** @type {ScreenFunctions["Exit"]} */
	Exit() {
		ElementRemove(this.ids.root);
		this._C = null;
		this._focusGroup = null;
		this._shape = null;
	}

	/** @type {ScreenFunctions["KeyDown"]} */
	KeyDown(event) {
		const grid = this.ids.grid ? document.getElementById(this.ids.grid) : null;
		if (!grid || CommonKey.GetModifiers(event)) {
			return false;
		}

		switch (event.key) {
			case "Home":
				grid.scrollTop = 0;
				return true;
			case "End":
				grid.scrollTop = grid.scrollHeight;
				return true;
			case "PageUp":
				grid.scrollTop = Math.max(0, grid.scrollTop - grid.clientHeight);
				return true;
			case "PageDown":
				grid.scrollTop = Math.min(grid.scrollHeight, grid.scrollTop + grid.clientHeight);
				return true;
			case "ArrowUp": {
				const increment = grid.querySelector(".dialog-button")?.clientHeight ?? grid.clientHeight / 3;
				grid.scrollTop = Math.max(0, grid.scrollTop - increment);
				return true;
			}
			case "ArrowDown": {
				const increment = grid.querySelector(".dialog-button")?.clientHeight ?? grid.clientHeight / 3;
				grid.scrollTop = Math.min(grid.scrollHeight, grid.scrollTop + increment);
				return true;
			}
			default:
				return false;
		}
	}

	/**
	 * Reload the subscreen, updating the DOM elements and, if required, re-assigning the character and focus group.
	 * @param {null | Character} C - The selected character; defaults to {@link DialogMenu.C} and will update it inplace otherwise
	 * @param {null | AssetItemGroup} focusGroup - The selected group; defaults to {@link DialogMenu.focusGroup} and will update it inplace otherwise
	 * @param {null | DialogMenu.ReloadOptions} [options] - Further customization options
	 * @returns {Promise<boolean>} - Whether an update was triggered or aborted
	 */
	async Reload(C=null, focusGroup=null, options=null) {
		options ??= {};
		C ??= this.C;
		focusGroup ??= this.focusGroup;
		const root = document.getElementById(this.ids.root);
		if (!root || !C || !focusGroup) {
			return false;
		}

		root.setAttribute("aria-busy", "true");

		// Check if any class-level properties have to be updated
		if (C !== this.C) {
			options.reset ??= true;
			this._C = C;
		}
		if (focusGroup !== this.focusGroup) {
			options.reset ??= true;
			this._focusGroup = focusGroup;
		}
		options.resetScrollbar ??= options.reset;

		// Update the label, icon and grid (if applicable)
		const statusSpan = document.getElementById(this.ids.status);
		if (statusSpan) {
			this._ReloadStatus(root, statusSpan, options);
		}

		const buttonGrid = document.getElementById(this.ids.grid);
		if (buttonGrid) {
			this._ReloadButtonGrid(root, buttonGrid, options);
		}

		const icon = document.getElementById(this.ids.icon);
		if (icon) {
			this._ReloadIcon(root, icon, options);
		}

		root.removeAttribute("aria-busy");
		return true;
	}

	/**
	 * A {@link DialogMenu.Reload} helper function for reloading {@link DialogMenu.ids.status} elements.
	 * @abstract
	 * @param {HTMLElement} root
	 * @param {HTMLElement} status
	 * @param {Pick<DialogMenu.ReloadOptions, "status" | "statusTimer">} options
	 */
	_ReloadStatus(root, status, options) {
		throw new Error("Trying to call an abstract method");
	}

	/**
	 * A {@link DialogMenu.Reload} helper function for reloading {@link DialogMenu.ids.grid} elements.
	 * @abstract
	 * @param {HTMLElement} root
	 * @param {HTMLElement} buttonGrid
	 * @param {Pick<DialogMenu.ReloadOptions, "reset" | "resetScrollbar">} options
	 */
	_ReloadButtonGrid(root, buttonGrid, options) {
		throw new Error("Trying to call an abstract method");
	}

	/**
	 * A {@link DialogMenu.Reload} helper function for reloading {@link DialogMenu.ids.icon} elements.
	 * @abstract
	 * @param {HTMLElement} root
	 * @param {HTMLElement} icon
	 * @param {Pick<DialogMenu.ReloadOptions, never>} options
	 */
	_ReloadIcon(root, icon, options) {
		throw new Error("Trying to call an abstract method");
	}

	/**
	 * Return an error status (if any) for when an item or activity is clicked.
	 *
	 * Error statuses are used for evaluating whether the relevant grid buttons must be disabled or not.
	 * @param {Character} C - The target character
	 * @param {ClickedObj} clickedObj - The item that is clicked
	 * @param {null | Item} equippedItem - The item that is equipped (if any)
	 * @returns {null | string} - The error status or `null` if everything is ok
	 */
	GetClickStatus(C, clickedObj, equippedItem=null) {
		for (const statusCallback of Object.values(this.clickStatusCallbacks)) {
			const status = statusCallback(C, clickedObj, equippedItem);
			if (status != null) {
				return status;
			}
		}
		return null;
	}

	/**
	 * Return the underlying item or activity object of the passed grid button.
	 * @abstract
	 * @param {HTMLButtonElement} button - The clicked button
	 * @returns {ClickedObj | undefined} - The button's underlying item or activity object
	 */
	_GetClickedObject(button) {
		throw new Error("Trying to all an abstract method");
	}

	/**
	 * Helper function for handling the clicks of succesfully validated grid button clicks.
	 * @abstract
	 * @param {HTMLButtonElement} button - The clicked button
	 * @param {Character} C - The target character
	 * @param {ClickedObj} clickedObj - The buttons underlying object (item or activity)
	 * @param {null | Item} equippedItem - The currently equipped item
	 * @returns {void}
	 */
	_ClickButton(button, C, clickedObj, equippedItem) {
		throw new Error("Trying to all an abstract method");
	}
}

/**
 * @template {string} T
 * @extends {DialogMenu<T, DialogInventoryItem>}
 */
class _DialogItemMenu extends DialogMenu {
	ids = Object.freeze({
		root: "dialog-inventory",
		status: "dialog-inventory-status",
		grid: "dialog-inventory-grid",
		icon: "dialog-inventory-icon",
	});

	/** @satisfies {DialogMenu<T, DialogInventoryItem>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {
		InventoryBlockedOrLimited: (C, clickedItem, equippedItem) => {
			return InventoryBlockedOrLimited(C, clickedItem) ? InterfaceTextGet("ExtendedItemNoItemPermission") : null;
		},
		InventoryDisallow: (C, clickedItem, equippedItem) => {
			return InventoryDisallow(C, clickedItem.Asset);
		},
		CanInteract: (C, clickedItem, equippedItem) => {
			return Player.CanInteract() ? null : InterfaceTextGet("AccessBlocked");
		},
		InventoryGroupIsAvailable: (C, clickedItem, equippedItem) => {
			return equippedItem ? InventoryGroupIsAvailable(C, C.FocusGroup.Name, false) : null;
		},
		AsylumGGTSControlItem: (C, clickedItem, equippedItem) => {
			return equippedItem && AsylumGGTSControlItem(C, equippedItem) ? InterfaceTextGet("BlockedByGGTS") : null;
		},
		DialogAllowItemClick: (C, clickedItem, equippedItem) => {
			// Allow extended items to pass through; clicking them opens their extended item mneu
			return (
				equippedItem
				&& !DialogAllowItemClick(equippedItem, clickedItem)
				&& !equippedItem.Asset.Extended
			) ? InterfaceTextGet("BlockedByEquipped") : null;
		},
		DialogCanUnlock: (C, clickedItem, equippedItem) => {
			if (!equippedItem) {
				return null;
			} else if (!DialogAllowItemClick(equippedItem, clickedItem) && equippedItem.Asset.Extended) {
				// Always allow access for equipped extended items; the extended item menu is responsible for enabling/disabling its own buttons
				return null;
			} else if (InventoryItemHasEffect(equippedItem, "Lock", true) && !DialogCanUnlock(C, equippedItem)) {
				return InterfaceTextGet("BlockedByLock");
			} else {
				return null;
			}
		},
		InventoryChatRoomAllow: (C, clickedItem, equippedItem) => {
			return InventoryChatRoomAllow(clickedItem.Asset.Category) ? null : InterfaceTextGet("BlockedByRoom");
		},
		SelfBondage: (C, clickedItem, equippedItem) => {
			if (
				clickedItem.Asset.SelfBondage <= 0
				|| SkillGetLevel(Player, "SelfBondage") >= clickedItem.Asset.SelfBondage
				|| !C.IsPlayer()
				|| DialogAlwaysAllowRestraint()
			) {
				return null;
			} else if (clickedItem.Asset.SelfBondage <= 10) {
				return InterfaceTextGet(`RequireSelfBondage${clickedItem.Asset.SelfBondage}`);
			} else {
				return InterfaceTextGet("CannotUseOnSelf");
			}
		},
	};

	_Load() {
		DialogInventoryBuild(this.C, false, false, false);
		DialogBuildActivities(this.C, false);

		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			children: [
				{
					tag: "span",
					attributes: { id: ids.status },
					classList: ["dialog-status"],
				},
				{
					tag: "div",
					attributes: { id: ids.grid, "aria-labelledby": ids.status },
					classList: ["dialog-grid"],
				},
				{
					tag: "div",
					classList: ["button", "blank-button", "button-styling", "dialog-grid-button", "dialog-icon"],
					attributes: { id: ids.icon, "aria-labelledby": ids.status },
				},
			],
		});
	}

	/** @type {DialogMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, options) {
		/** @type {null | Asset} */
		let asset = null;
		let showIcon = false;
		let textContent = options.status;
		if (textContent == null) {
			switch (this.mode) {
				case "locked": {
					const item = InventoryGet(this.C, this.focusGroup.Name);
					const lock = InventoryGetLock(item);
					if (!lock || !DialogCanInspectLock(item)){
						textContent = InterfaceTextGet("SelectLockedUnknown");
					} else {
						asset = lock.Asset;
						textContent = InterfaceTextGet("SelectLocked").replace("AssetName", lock.Asset.DynamicDescription(this.C).toLowerCase());
					}
					showIcon = true;
					break;
				}
				case "items":
					if (InventoryGroupIsBlockedByOwnerRule(this.C)) {
						textContent = InterfaceTextGet("ZoneBlockedOwner");
						showIcon = true;
					} else if (InventoryIsBlockedByDistance(this.C)) {
						textContent = InterfaceTextGet("ZoneBlockedRange");
						showIcon = true;
					} else if (InventoryGroupIsBlocked(this.C)) {
						textContent = InterfaceTextGet("ZoneBlocked");
						showIcon = true;
					} else if (!Player.CanInteract()) {
						textContent = InterfaceTextGet("AccessBlocked");
						showIcon = true;
					} else {
						textContent = InterfaceTextGet("SelectItemGroup");
					}
					break;
			}
		}

		root.toggleAttribute("data-show-icon", showIcon);
		DialogSetStatus(textContent, options.statusTimer ?? 0, { asset, group: this.focusGroup, C: this.C });
	}

	/** @type {DialogMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, options) {
		if (options.reset) {
			buttonGrid.innerHTML = "";
			DialogInventory.forEach((clickedItem, i) => ElementButton.CreateForAsset(
				`dialog-inventory-${i}`,
				clickedItem,
				this.C,
				this.eventListeners._ClickButton,
				{ clickDisabled: this.eventListeners._ClickDisabledButton },
				{ button: {
					parent: buttonGrid,
					classList: ["dialog-grid-button"],
					attributes: { "aria-checked": clickedItem.Worn, "screen-generated": undefined },
					dataAttributes: { index: i },
				}},
			));
		}

		const equippedItem = InventoryGet(this.C, this.focusGroup.Name);
		for (const [i, button] of Array.from(buttonGrid.children).entries()) {
			const clickedItem = DialogInventory[i];

			const status = this.GetClickStatus(this.C, clickedItem, equippedItem);
			if (status) {
				button.setAttribute("aria-disabled", "true");
			} else {
				button.removeAttribute("aria-disabled");
			}
			button.toggleAttribute("data-hidden", CharacterAppearanceItemIsHidden(clickedItem.Asset.Name, clickedItem.Asset.Group.Name));
			button.toggleAttribute("data-vibrating", clickedItem.Property?.Effect?.includes("Vibrating") ?? false);
		}

		if (options.resetScrollbar) {
			const checkedButton = buttonGrid.querySelector(`.dialog-grid-button[aria-checked='true']`);
			if (checkedButton) {
				checkedButton.scrollIntoView();
			} else {
				buttonGrid.scrollTo({ top: 0 });
			}
		}
	}

	/** @type {DialogMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, options) {
		const grid = document.getElementById(this.ids.grid);
		const dataAttr = ["data-craft", "data-hidden", "data-vibrating"];
		const checkedButton = grid.querySelector(".dialog-grid-button[aria-checked='true']");
		if (checkedButton) {
			icon.innerHTML = checkedButton.innerHTML;
			dataAttr.forEach(attr => icon.toggleAttribute(attr, checkedButton.hasAttribute(attr)));
		} else {
			icon.innerHTML = "";
			dataAttr.forEach(attr => icon.toggleAttribute(attr, false));
		}
	}

	/**
	 * For a given grid button return the underlying item or activity.
	 * @type {DialogMenu<string, DialogInventoryItem>["_GetClickedObject"]}
	 */
	_GetClickedObject(button) {
		return DialogInventory[Number.parseInt(button.getAttribute("data-index"), 10)];
	}

	/**
	 * @type {DialogMenu<string, DialogInventoryItem>["_ClickButton"]}
	 */
	_ClickButton(button, C, clickedObj, equippedItem) {
		DialogItemClick(clickedObj, C, equippedItem);
		if (clickedObj.Asset.Wear && button.getAttribute("aria-checked") !== "true") {
			button.closest(".dialog-grid")?.querySelector("[aria-checked='true']")?.setAttribute("aria-checked", "false");
			button.setAttribute("aria-checked", "true");
		}
	}
}

/**
 * @template {string} T
 * @extends {DialogMenu<T, DialogInventoryItem>}
 */
class _DialogLockingMenu extends DialogMenu {
	ids = Object.freeze({
		root: "dialog-locking",
		status: "dialog-locking-status",
		grid: "dialog-locking-grid",
	});

	/** @satisfies {DialogMenu<T, DialogInventoryItem>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {
		InventoryBlockedOrLimited: (C, clickedLock, equippedItem) => {
			return InventoryBlockedOrLimited(C, clickedLock) ? InterfaceTextGet("ExtendedItemNoItemPermission") : null;
		},
		CurrentItem: (C, clickedLock, equippedItem) => {
			return equippedItem ? null : InterfaceTextGet("NoItemEquipped");
		},
		InventoryDoesItemAllowLock: (C, clickedLock, equippedItem) => {
			return InventoryDoesItemAllowLock(equippedItem) ? null : InterfaceTextGet("AccessBlocked");
		},
	};

	_Load() {
		DialogInventoryBuild(this.C, false, true, false);

		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			children: [
				{ tag: "span", attributes: { id: ids.status }, classList: ["dialog-status"] },
				{ tag: "div", attributes: { id: ids.grid, "aria-labelledby": ids.status }, classList: ["dialog-grid"] },
			],
		});
	}

	/** @type {DialogMenu["_ReloadStatus"]} */
	_ReloadStatus(root, status, options) {
		const textContent = options.status ?? InterfaceTextGet("SelectLock");
		DialogSetStatus(textContent, options.statusTimer ?? 0, { group: this.focusGroup, C: this.C });
	}

	/** @type {DialogMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, options) {
		if (options.reset) {
			buttonGrid.innerHTML = "";
			DialogInventory.forEach((clickedItem, i) => ElementButton.CreateForAsset(
				`dialog-locking-${i}`,
				clickedItem,
				this.C,
				this.eventListeners._ClickButton,
				{ clickDisabled: this.eventListeners._ClickDisabledButton },
				{ button: {
					parent: buttonGrid,
					classList: ["dialog-grid-button"],
					attributes: { "screen-generated": undefined },
					dataAttributes: { index: i },
				}},
			));
		}

		const equippedItem = InventoryGet(this.C, this.focusGroup.Name);
		for (const [i, button] of Array.from(buttonGrid.children).entries()) {
			const clickedLock = DialogInventory[i];

			if (this.GetClickStatus(this.C, clickedLock, equippedItem)) {
				button.setAttribute("aria-disabled", "true");
			} else {
				button.removeAttribute("aria-disabled");
			}
			button.toggleAttribute("data-hidden", CharacterAppearanceItemIsHidden(clickedLock.Asset.Name, clickedLock.Asset.Group.Name));
		}

		if (options.resetScrollbar) {
			buttonGrid.scrollTo({ top: 0 });
		}
	}

	/** @type {DialogMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, options) { /** noop */ }

	/** @type {DialogMenu<string, DialogInventoryItem>["_GetClickedObject"]} */
	_GetClickedObject(button) {
		return DialogInventory[Number.parseInt(button.getAttribute("data-index"), 10)];
	}

	/** @type {DialogMenu<string, DialogInventoryItem>["_ClickButton"]} */
	_ClickButton(button, C, clickedLock, equippedItem) {
		DialogLockingClick(clickedLock, C, equippedItem);
	}
}

/**
 * @template {string} T
 * @extends {DialogMenu<T, DialogInventoryItem>}
 */
class _DialogPermissionMenu extends DialogMenu {
	ids = Object.freeze({
		root: "dialog-permission",
		status: "dialog-permission-status",
		grid: "dialog-permission-grid",
	});

	/** @type {DialogMenu<T, DialogInventoryItem>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {
		IsPlayer: (C, clickedItem, equippedItem) => {
			return C.IsPlayer() ? null : InterfaceTextGet("RequirePlayer");
		},
	};

	_Load() {
		DialogInventoryBuild(this.C, false, false, false);

		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			children: [
				{ tag: "span", attributes: { id: ids.status }, classList: ["dialog-status"] },
				{ tag: "div", attributes: { id: ids.grid, "aria-labelledby": ids.status }, classList: ["dialog-grid"] },
			],
		});
	}

	/** @type {DialogMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, options) {
		const textContent = options.status ?? InterfaceTextGet("DialogMenuPermissionMode");
		DialogSetStatus(textContent, options.statusTimer ?? 0);
	}

	/** @type {DialogMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, options) {
		if (options.reset) {
			buttonGrid.innerHTML = "";
			DialogInventory.forEach((clickedItem, i) => ElementButton.CreateForAsset(
				`dialog-permission-${i}`,
				clickedItem,
				this.C,
				this.eventListeners._ClickButton,
				{ clickDisabled: this.eventListeners._ClickDisabledButton },
				{ button: {
					parent: buttonGrid,
					classList: ["dialog-grid-button"],
					attributes: { "screen-generated": undefined },
					dataAttributes: { index: i },
				}},
			));
		}

		for (const [i, button] of Array.from(buttonGrid.children).entries()) {
			const clickedItem = DialogInventory[i];

			const permissions = this.C.PermissionItems[`${clickedItem.Asset.Group.Name}/${clickedItem.Asset.Name}`];
			button.setAttribute("data-permission", permissions?.Permission ?? "Default");
			button.toggleAttribute("data-hidden", CharacterAppearanceItemIsHidden(clickedItem.Asset.Name, clickedItem.Asset.Group.Name));
		}

		if (options.resetScrollbar) {
			buttonGrid.scrollTo({ top: 0 });
		}
	}

	/** @type {DialogMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, options) { /** noop */ }

	/** @type {DialogMenu<string, DialogInventoryItem>["_GetClickedObject"]} */
	_GetClickedObject(button) {
		return DialogInventory[Number.parseInt(button.getAttribute("data-index"), 10)];
	}

	/** @type {DialogMenu<string, DialogInventoryItem>["_ClickButton"]} */
	_ClickButton(button, C, clickedObj, equippedItem) {
		const permission = DialogPermissionsClick(clickedObj, equippedItem);
		button.setAttribute("data-permission", permission);
	}
}

/**
 * @template {string} T
 * @extends {DialogMenu<T, ItemActivity>}
 */
class _DialogActivitiesMenu extends DialogMenu {
	ids = Object.freeze({
		root: "dialog-activity",
		status: "dialog-activity-status",
		grid: "dialog-activity-grid",
	});

	/** @type {DialogMenu<T, ItemActivity>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {};

	_Load() {
		DialogBuildActivities(this.C);

		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			children: [
				{ tag: "span", attributes: { id: ids.status }, classList: ["dialog-status"] },
				{ tag: "div", attributes: { id: ids.grid, "aria-labelledby": ids.status }, classList: ["dialog-grid"] },
			],
		});
	}

	/** @type {DialogMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, options) {
		const textContent = options.status ?? InterfaceTextGet("SelectActivityGroup");
		DialogSetStatus(textContent, options.statusTimer ?? 0, { C: this.C, group: this.focusGroup });
	}

	/**
	 *
	 * @param {HTMLElement} parent
	 * @param {ItemActivity} activity
	 * @param {number} index
	 * @returns {HTMLButtonElement}
	 */
	_ConstructButton(parent, activity, index) {
		/** @type {InventoryIcon[]} */
		const icons = [];
		if (activity.Blocked === "limited") { icons.push("AllowedLimited"); }
		if (activity.Item) { icons.push("Handheld"); }
		const tooltip = icons.length ? [""] : undefined;

		return ElementButton.Create(
			`dialog-activities-${index}`,
			this.eventListeners._ClickButton,
			{
				icons,
				tooltip,
				tooltipPosition: "bottom",
				image: activity.Item ? `./${AssetGetPreviewPath(activity.Item.Asset)}/${activity.Item.Asset.Name}.png` : `./Assets/Female3DCG/Activity/${activity.Activity.Name}.png`,
				label: activity.Activity.Name,
				clickDisabled: this.eventListeners._ClickDisabledButton,
			},
			{ button: {
				parent,
				classList: ["dialog-grid-button"],
				attributes: { "screen-generated": undefined },
				dataAttributes: {
					name: activity.Activity.Name,
					group: this.focusGroup.Name,
					index,
				},
			}},
		);
	}

	/** @type {DialogMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, options) {
		if (options.reset) {
			buttonGrid.innerHTML = "";
			DialogActivity.forEach((clickedActivity, i) => this._ConstructButton(buttonGrid, clickedActivity, i));
		}

		for (const [i, button] of Array.from(buttonGrid.children).entries()) {
			const clickedActivity = DialogActivity[i];
			if (clickedActivity.Blocked) {
				button.setAttribute("data-permission", "Blocked");
				button.toggleAttribute("disabled", true);
			} else {
				button.removeAttribute("data-permission");
				button.toggleAttribute("disabled", false);
			}
		}

		if (options.resetScrollbar) {
			buttonGrid.scrollTo({ top: 0 });
		}
	}

	/** @type {DialogMenu["_ReloadIcon"]} */
	_ReloadIcon(icon) { /** noop */ }

	/** @type {DialogMenu<string, ItemActivity>["_GetClickedObject"]} */
	_GetClickedObject(button) {
		return DialogActivity[Number.parseInt(button.getAttribute("data-index"), 10)];
	}

	/** @type {DialogMenu<string, ItemActivity>["_ClickButton"]} */
	_ClickButton(button, C, clickedObj, equippedItem) {
		DialogActivityClick(C, clickedObj, equippedItem);
	}
}

/**
 * @template {string} T
 * @extends {DialogMenu<T, null>}
 */
class _DialogCraftedMenu extends DialogMenu {
	ids = Object.freeze({
		root: "dialog-crafted",
		status: "dialog-crafted-status",
		icon: "dialog-crafted-icon",

		footer: "dialog-crafted-footer",
		info: "dialog-crafted-info",
		description: "dialog-crafted-description",
		private: "dialog-crafted-private",
		name: "dialog-crafted-name",
		property: "dialog-crafted-property",
		crafter: "dialog-crafted-crafter",
	});

	/** @type {DialogMenu["clickStatusCallbacks"]} */
	clickStatusCallbacks = {};

	_Load() {
		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			children: [
				{ tag: "span", attributes: { id: ids.status }, classList: ["dialog-status"] },
				{
					tag: "div",
					attributes: { id: ids.info, "aria-labelledby": ids.status },
					children: [
						{ tag: "span", attributes: { id: ids.name }, classList: [ids.info] },
						{ tag: "span", attributes: { id: ids.crafter }, classList: [ids.info] },
						{ tag: "span", attributes: { id: ids.property }, classList: [ids.info] },
						{ tag: "span", attributes: { id: ids.private }, classList: [ids.info] },
						{ tag: "div", classList: ["button", "blank-button", "button-styling", "dialog-grid-button", "dialog-icon"], attributes: { id: ids.icon } },
						{
							tag: "div",
							attributes: { id: ids.footer },
							classList: [ids.info],
							children: [
								{ tag: "span", attributes: { id: ids.description } },
							],
						},
					],
				},
			],
		});
	}

	/** @type {DialogMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, options) {
		const textContent = options.status ?? InterfaceTextGet("CraftedItemProperties");
		DialogSetStatus(textContent, options.statusTimer ?? 0);
	}

	/** @type {DialogMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, options) { /** noop */ }

	/** @type {DialogMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, options) {
		const ids = this.ids;
		const item = InventoryGet(this.C, this.focusGroup.Name);

		icon.innerHTML = "";
		[
			ElementButton._ParseImage(icon.id, `./Assets/Female3DCG/${item.Asset.DynamicGroupName}/Preview/${item.Asset.Name}.png`),
			ElementButton._ParseLabel(icon.id, item.Asset.Description),
			ElementButton._ParseIcons(icon.id, [
				DialogGetFavoriteStateDetails(this.C, item.Asset)?.Icon,
				...DialogGetLockIcon(item, true),
				...DialogGetAssetIcons(item.Asset),
				...DialogEffectIcons.GetIcons(item)
			])?.iconGrid,
		].filter(Boolean).forEach(e => icon.append(e));

		const [name, crafter, property, description, private_] = [ids.name, ids.crafter, ids.property, ids.description, ids.private].map(i => document.getElementById(i));
		name.textContent = InterfaceTextGet("CraftingName").replace("CraftName", item.Craft.Name);
		crafter.textContent = InterfaceTextGet("CraftingMember").replace("MemberName", item.Craft.MemberName).replace("MemberNumber", item.Craft.MemberNumber.toString());
		property.textContent = InterfaceTextGet("CraftingProperty").replace("CraftProperty", item.Craft.Property);
		description.textContent = InterfaceTextGet("CraftingDescription").replace("CraftDescription", CraftingDescription.Decode(item.Craft.Description));
		private_.textContent = InterfaceTextGet("CraftingPrivate").replace("CraftPrivate", CommonCapitalize(item.Craft.Private.toString()));
	}

	/** @type {DialogMenu<string, null>["_GetClickedObject"]} */
	_GetClickedObject(button) { return null; /** noop */ }

	/** @type {DialogMenu<string, null>["_ClickButton"]} */
	_ClickButton(button, C, clickedObj, equippedItem) { /** noop */ }
}

/** @satisfies {Partial<Record<DialogMenuMode, DialogMenu<DialogMenuMode>>>} */
var DialogMenuMapping = /** @type {const} */({
	activities: new _DialogActivitiesMenu("activities"),
	crafted: new _DialogCraftedMenu("crafted"),
	items: new _DialogItemMenu("items"),
	locked: new _DialogItemMenu("locked"),
	locking: new _DialogLockingMenu("locking"),
	permissions: new _DialogPermissionMenu("permissions"),
});

/**
 * Searches in the dialog for a specific stage keyword and returns that dialog option if we find it, error otherwise
 * @param {string} KeyWord - The key word to search for
 * @returns {string}
 */
function DialogFindPlayer(KeyWord) {
	const res = PlayerDialog.get(KeyWord);
	return res !== undefined ? res : `${TEXT_NOT_FOUND_PREFIX} "DialogPlayer.csv": ${KeyWord}`;
}

/**
 * Searches in the dialog for a specific stage keyword and returns that dialog option if we find it
 * @param {Character} C - The character whose dialog optio*
 * @param {string} KeyWord1 - The key word to search for
 * @param {string} [KeyWord2] - An optionally given second key word. is only looked for, if specified and the first
 * keyword was not found.
 * @param {boolean} [ReturnPrevious=true] - If specified, returns the previous dialog, if neither of the the two key words were found
 ns should be searched
 * @returns {string} - The name of a dialog. That can either be the one with the keyword or the previous dialog.
 * An empty string is returned, if neither keyword was found and no previous dialog was given.
 */
function DialogFind(C, KeyWord1, KeyWord2, ReturnPrevious = true) {
	for (let D = 0; D < C.Dialog.length; D++)
		if (C.Dialog[D].Stage == KeyWord1)
			return C.Dialog[D].Result.trim();
	if (KeyWord2 != null)
		for (let D = 0; D < C.Dialog.length; D++)
			if (C.Dialog[D].Stage == KeyWord2)
				return C.Dialog[D].Result.trim();
	return ((ReturnPrevious == null) || ReturnPrevious) ? C.CurrentDialog : "";
}

/**
 * Searches in the dialog for a specific stage keyword and returns that dialog option if we find it and replace the names
 * @param {Character} C - The character whose dialog options should be searched
 * @param {string} KeyWord1 - The key word to search for
 * @param {string} [KeyWord2] - An optionally given second key word. is only looked for, if specified and the first
 * keyword was not found.
 * @param {boolean} [ReturnPrevious] - If specified, returns the previous dialog, if neither of the the two key words were found
 * @returns {string} - The name of a dialog. That can either be the one with the keyword or the previous dialog.
 * An empty string is returned, if neither keyword was found and no previous dialog was given. 'SourceCharacter'
 * is replaced with the player's name and 'DestinationCharacter' with the current character's name.
 */
function DialogFindAutoReplace(C, KeyWord1, KeyWord2, ReturnPrevious) {
	return DialogFind(C, KeyWord1, KeyWord2, ReturnPrevious)
		.replace("SourceCharacter", CharacterNickname(Player))
		.replace("DestinationCharacter", CharacterNickname(CharacterGetCurrent()));
}

/**
 * Draw the up/down arrow to bump a character up and down if they're hidden.
 */
function DialogDrawRepositionButton() {
	if (!CurrentCharacter.HeightModifier == null || !CurrentCharacter.FocusGroup) return;

	let drawButton = "";
	if (CharacterAppearanceForceUpCharacter == CurrentCharacter.MemberNumber) {
		drawButton = "Icons/Remove.png";
	} else if (CurrentCharacter.HeightModifier < -90) {
		drawButton = CurrentCharacter.IsInverted() ? "Icons/Down.png" : "Icons/Up.png";
	} else if (CurrentCharacter.HeightModifier > 30) {
		drawButton = CurrentCharacter.IsInverted() ? "Icons/Up.png" : "Icons/Down.png";
	}
	if (drawButton)
		DrawButton(510, 50, 90, 90, "", "White", drawButton, InterfaceTextGet("ShowAllZones"));
}

/**
 * Draws the top menu buttons of the current dialog.
 *
 * @param {Character} C The character currently focused.
 */
function DialogDrawTopMenu(C) {
	const FocusItem = InventoryGet(C, C.FocusGroup.Name);

	for (let I = DialogMenuButton.length - 1; I >= 0; I--) {
		const ButtonColor = DialogGetMenuButtonColor(DialogMenuButton[I]);
		const ButtonImage = DialogGetMenuButtonImage(DialogMenuButton[I], FocusItem);
		const ButtonHoverText = InterfaceTextGet(`DialogMenu${DialogMenuButton[I]}`);
		const ButtonDisabled = DialogIsMenuButtonDisabled(DialogMenuButton[I]);
		DrawButton(1885 - I * 110, 15, 90, 90, "", ButtonColor, "Icons/" + ButtonImage + ".png", ButtonHoverText, ButtonDisabled);
	}
}

/**
 * Draws the left menu for the character
 * @param {Character} C - The currently focused character
 */
function DialogSelfMenuDraw(C) {
	if (!C.IsPlayer()) return;

	if (DialogSelfMenuOptions.filter(SMO => SMO.IsAvailable()).length > 1 && !CommonPhotoMode)
		DrawButton(420, 50, 90, 90, "", "White", "Icons/Next.png", InterfaceTextGet("NextPage"));

	if (!DialogSelfMenuSelected)
		DialogDrawExpressionMenu();
	else
		DialogSelfMenuSelected.Draw();
}

/**
 * Handles clicks on the left menu
 * @param {Character} C - The currently focused character
 */
function DialogSelfMenuClick(C) {
	if (!C.IsPlayer()) return;

	if (MouseIn(420, 50, 90, 90) && DialogSelfMenuOptions.filter(SMO => SMO.IsAvailable()).length > 1) {
		DialogFindNextSubMenu();
		return;
	}

	if (!DialogSelfMenuSelected)
		DialogClickExpressionMenu();
	else
		DialogSelfMenuSelected.Click();
}

/**
 * Load function for starting the Dialog subscreen.
 * @type {ScreenFunctions["Load"]}
 */
function DialogLoad() {
	if (CurrentCharacter == null) {
		return;
	}
	const C = CurrentCharacter;

	const newDialog = !Player.CanTalk() ? DialogFind(C, "PlayerGagged", "") : DialogIntro();
	if (newDialog) {
		C.CurrentDialog = newDialog;
	}

	DialogChangeMode(DialogMenuMode ?? "dialog", true);
}

/**
 * Draws the initial Dialog screen.
 *
 * This is the main handler for drawing the Dialog UI, which activates
 * when the player clicks on herself or another player.
 *
 * @type {ScreenFunctions["Draw"]}
 */
function DialogDraw() {

	// Customization can be used in dialog if screen is online chat room
	if ((CurrentScreen == "ChatRoom") && ChatRoomCustomized) {
		const drawBGToRect = DrawShowChatRoomCustomBackground() ? { x: 0, y: 0, w: 2000, h: 1000 } : null;
		ChatAdminRoomCustomizationProcess(ChatRoomData.Custom, drawBGToRect, true);
	}

	// Check that there's actually a character selected
	if (!CurrentCharacter) return;
	if (ControllerIsActive()) {
		ControllerClearAreas();
	}

	// Draw both the player and the interaction character
	if (!CurrentCharacter.IsPlayer())
		DrawCharacter(Player, 0, 0, 1);
	DrawCharacter(CurrentCharacter, 500, 0, 1);

	const C = CharacterGetCurrent();

	// Drawing the character causes ScriptDraw hooks to be called, some of which
	// can cause the dialog to close (like the Futuristic Training Belt)
	if (!C) return;
	CharacterCheckHooks(C, true);

	DialogSelfMenuDraw(C);

	if (DialogMenuMode === "dialog") {
		// Draws the intro text or dialog result
		if ((DialogIntro() != "") && (DialogIntro() != "NOEXIT")) {
			DrawTextWrap(SpeechTransformDialog(CurrentCharacter, CurrentCharacter.CurrentDialog), 1025, -5, 840, 165, "white", null, 3);
			DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
		} else DrawTextWrap(SpeechTransformDialog(CurrentCharacter, CurrentCharacter.CurrentDialog), 1025, -5, 950, 165, "white", null, 3);

		// Draws the possible answers
		let pos = 0;
		for (let D = 0; D < CurrentCharacter.Dialog.length; D++) {
			if ((CurrentCharacter.Dialog[D].Stage == CurrentCharacter.Stage) && (CurrentCharacter.Dialog[D].Option != null) && DialogPrerequisite(D)) {
				DrawTextWrap(SpeechTransformDialog(Player, CurrentCharacter.Dialog[D].Option), 1025, 160 + 105 * pos, 950, 90, "black", (MouseIn(1025, 160 + pos * 105, 950, 90) && !CommonIsMobile) ? "cyan" : "white", 2);
				pos++;
			}
		}

		// The more time you spend with an NPC, the more the love will rise
		NPCInteraction();
		return;
	}

	// Block out drawing anything else if we're not supposed to interact with the selected character
	if (C.FocusGroup === null || !C.AllowItem || DialogIntro() === "") return;

	/** The item currently sitting in the focused group */
	const FocusItem = InventoryGet(C, C.FocusGroup.Name);

	// Draws the top menu text & icons
	if (!["extended", "tighten", "colorExpression", "colorItem", "layering"].includes(DialogMenuMode))
		DialogDrawTopMenu(C);

	// If the player is struggling or lockpicking
	if (DialogMenuMode === "struggle") {
		if (StruggleMinigameDraw(C)) {
			// Minigame running and drawn
		} else {

			// Draw previews for the assets we're swapping/struggling
			if (DialogStrugglePrevItem && DialogStruggleNextItem) {
				DrawItemPreview(DialogStrugglePrevItem, C, 1200, 100);
				DrawItemPreview(DialogStruggleNextItem, C, 1200, 100);
			} else if (DialogStrugglePrevItem || DialogStruggleNextItem) {
				const item = DialogStrugglePrevItem || DialogStruggleNextItem;
				DrawItemPreview(item, C, 1387, 100);
			}

			// Draw UI to select struggling minigame
			DrawText(InterfaceTextGet("ChooseStruggleMethod"), 1500, 500, "White", "Black");
			for (const [idx, [game, data]] of StruggleGetMinigames().entries()) {
				const offset = 300 * idx;
				const hover = MouseIn(1087 + offset, 550, 225, 275);
				const disabled = data.DisablingCraftedProperty ? InventoryCraftPropertyIs(DialogStrugglePrevItem, data.DisablingCraftedProperty) : false;
				const bgColor = disabled ? "Gray" : (hover ? "aqua" : "white");
				DrawRect(1087 + offset, 550, 225, 275, bgColor);
				DrawImageResize("Icons/Struggle/" + game + ".png", 1089 + offset, 552, 221, 221);
				DrawTextFit(InterfaceTextGet(`Struggle${game}`), 1200 + offset, 800, 221, "black");
			}

			// In online chat rooms, there's a fourth "Chat Room Struggle" option
			if (CurrentScreen === "ChatRoom") {
				DrawButton(1300, 880, 400, 65, InterfaceTextGet("ChatRoomStruggleButton"), "White");
			}

		}
		return;
	}

	if (DialogMenuMode === "extended") {
		if (DialogFocusItem) {
			CommonDynamicFunction("Inventory" + DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Draw()");
			DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
			return;
		} else {
			DialogChangeMode("items");
		}
	} else if (DialogMenuMode === "tighten") {
		if (DialogTightenLoosenItem) {
			TightenLoosenItemDraw();
			return;
		} else {
			DialogChangeMode("items");
		}
	} else if ((DialogMenuMode === "colorItem" || DialogMenuMode === "colorExpression") && FocusItem) {
		ItemColorDraw(C, C.FocusGroup.Name, 1200, 25, 775, 950, true);
		return;
	} else if (DialogMenuMode === "colorDefault") {
		ElementPosition("InputColor", 1450, 65, 300);
		ColorPickerDraw(1300, 145, 675, 830,
			/** @type {HTMLInputElement} */(document.getElementById("InputColor")),
			function (Color) { DialogChangeItemColor(C, Color); });
		return;
	}

	// Draw a repositioning button if some zones are offscreen
	DialogDrawRepositionButton();

	DialogMenuMapping[DialogMenuMode]?.Draw();
}

/**
 * Draw the menu for changing facial expressions
 * @returns {void} - Nothing
 */
function DialogDrawExpressionMenu() {

	// Draw the expression groups
	DrawText(InterfaceTextGet("FacialExpression"), 165, 25, "White", "Black");
	if (typeof DialogFacialExpressionsSelected === 'number' && DialogFacialExpressionsSelected >= 0 && DialogFacialExpressionsSelected < DialogFacialExpressions.length && DialogFacialExpressions[DialogFacialExpressionsSelected].Appearance.Asset.Group.AllowColorize && DialogFacialExpressions[DialogFacialExpressionsSelected].Group !== "Eyes") {
		DrawButton(320, 50, 90, 90, "", "White", "Icons/ColorChange.png", InterfaceTextGet("DialogMenuColorExpressionChange"));
	}
	DrawButton(220, 50, 90, 90, "", "White", "Icons/BlindToggle" + DialogFacialExpressionsSelectedBlindnessLevel + ".png", InterfaceTextGet("BlindToggleFacialExpressions"));
	const Expression = WardrobeGetExpression(Player);
	const Eye1Closed = Expression.Eyes === "Closed";
	const Eye2Closed = Expression.Eyes2 === "Closed";
	let WinkIcon = "WinkNone";
	if (Eye1Closed && Eye2Closed) WinkIcon = "WinkBoth";
	else if (Eye1Closed) WinkIcon = "WinkR";
	else if (Eye2Closed) WinkIcon = "WinkL";
	DrawButton(120, 50, 90, 90, "", "White", `Icons/${WinkIcon}.png`, InterfaceTextGet("WinkFacialExpressions"));
	DrawButton(20, 50, 90, 90, "", "White", "Icons/Reset.png", InterfaceTextGet("ClearFacialExpressions"));
	if (!DialogFacialExpressions || !DialogFacialExpressions.length) DialogFacialExpressionsBuild();

	for (const [i, FE] of DialogFacialExpressions.entries()) {
		const OffsetY = 185 + 100 * i;
		DrawButton(20, OffsetY, 90, 90, "", i == DialogFacialExpressionsSelected ? "Cyan" : "White", "Assets/Female3DCG/" + FE.Group + (FE.CurrentExpression ? "/" + FE.CurrentExpression : "") + "/Icon.png");

		// Draw the table with expressions
		if (i == DialogFacialExpressionsSelected) {
			const nPages = Math.ceil(FE.ExpressionList.length / DialogFacialExpressionsPerPage);
			if (nPages > 1) {
				DrawButton(155, 785, 90, 90, "", "White", `Icons/Prev.png`, InterfaceTextGet("PrevExpressions"));
				DrawButton(255, 785, 90, 90, "", "White", `Icons/Next.png`, InterfaceTextGet("NextExpressions"));
			}
			const expressionSubset = FE.ExpressionList.slice(
				DialogFacialExpressionsSelectedPage * DialogFacialExpressionsPerPage,
				DialogFacialExpressionsSelectedPage * DialogFacialExpressionsPerPage + DialogFacialExpressionsPerPage,
			);
			for (const [j, expression] of expressionSubset.entries()) {
				const EOffsetX = 155 + 100 * (j % 3);
				const EOffsetY = 185 + 100 * Math.floor(j / 3);
				const allowed = CharacterIsExpressionAllowed(Player, FE.Appearance, expression);
				const color = (expression == FE.CurrentExpression ? "Pink" : (!allowed ? "#888" : "White"));
				const icon = "Assets/Female3DCG/" + FE.Group + (expression ? "/" + expression : "") + "/Icon.png";
				DrawButton(EOffsetX, EOffsetY, 90, 90, "", color, icon);
			}
		}
	}
}

/**
 * Return the page number of the expression item's current expression.
 * @param {ExpressionItem} item - The expression item
 * @returns {number} The page number of the item's current expression
 */
function DialogGetCurrentExpressionPage(item) {
	const index = item.ExpressionList.findIndex(name => item.CurrentExpression === name);
	return index === -1 ? 0 : Math.floor(index / DialogFacialExpressionsPerPage);
}

/**
 * Handles clicks in the dialog expression menu.
 * @returns {void} - Nothing
 */
function DialogClickExpressionMenu() {
	if (MouseIn(20, 50, 90, 90)) {
		CharacterResetFacialExpression(Player);
		DialogFacialExpressions.forEach(FE => {
			// Reset the fluids' custom color
			if (FE.Group === "Fluids") {
				FE.Appearance.Color = "Default";
			}
			FE.CurrentExpression = null;
		});
		if (DialogMenuMode === "colorExpression") ItemColorSaveAndExit();
	} else if (MouseIn(120, 50, 90, 90)) {
		const CurrentExpression = DialogFacialExpressions.find(FE => FE.Group == "Eyes").CurrentExpression;
		const EyesExpression = WardrobeGetExpression(Player);
		const LeftEyeClosed = EyesExpression.Eyes2 === "Closed";
		const RightEyeClosed = EyesExpression.Eyes === "Closed";
		if (!LeftEyeClosed && !RightEyeClosed) CharacterSetFacialExpression(Player, "Eyes2", "Closed", null);
		else if (LeftEyeClosed && !RightEyeClosed) CharacterSetFacialExpression(Player, "Eyes", "Closed", null);
		else if (LeftEyeClosed && RightEyeClosed) CharacterSetFacialExpression(Player, "Eyes2", CurrentExpression !== "Closed" ? CurrentExpression : null, null);
		else CharacterSetFacialExpression(Player, "Eyes", CurrentExpression !== "Closed" ? CurrentExpression : null, null);
	} else if (MouseIn(220, 50, 90, 90)) {
		DialogFacialExpressionsSelectedBlindnessLevel += 1;
		if (DialogFacialExpressionsSelectedBlindnessLevel > 3)
			DialogFacialExpressionsSelectedBlindnessLevel = 1;
	} else if (MouseIn(320, 50, 90, 90)) {
		if (typeof DialogFacialExpressionsSelected === 'number' && DialogFacialExpressionsSelected >= 0 && DialogFacialExpressionsSelected < DialogFacialExpressions.length && DialogFacialExpressions[DialogFacialExpressionsSelected].Appearance.Asset.Group.AllowColorize && DialogFacialExpressions[DialogFacialExpressionsSelected].Group !== "Eyes") {
			DialogChangeMode("colorExpression");
			const GroupName = DialogFacialExpressions[DialogFacialExpressionsSelected].Appearance.Asset.Group.Name;
			const Item = InventoryGet(Player, GroupName);
			const originalColor = Item.Color;
			Player.FocusGroup = /** @type {AssetItemGroup} */ (AssetGroupGet(Player.AssetFamily, GroupName));
			ItemColorLoad(Player, Item, 1200, 25, 775, 950, true);
			ItemColorOnExit((save) => {
				DialogMenuBack();
				if (save && !CommonColorsEqual(originalColor, Item.Color)) {
					ServerPlayerAppearanceSync();
					ChatRoomCharacterItemUpdate(Player, GroupName);
				}
			});
		}
	} else {
		// Expression category buttons
		for (let I = 0; I < DialogFacialExpressions.length; I++) {
			if (MouseIn(20, 185 + 100 * I, 90, 90)) {
				if (DialogFacialExpressionsSelected !== I) {
					DialogFacialExpressionsSelected = I;
					DialogFacialExpressionsSelectedPage = DialogGetCurrentExpressionPage(DialogFacialExpressions[I]);
				}
				if (DialogMenuMode === "colorExpression") ItemColorSaveAndExit();
			}
		}

		// Expression table
		if (DialogFacialExpressionsSelected >= 0 && DialogFacialExpressionsSelected < DialogFacialExpressions.length) {
			const FE = DialogFacialExpressions[DialogFacialExpressionsSelected];

			// Switch pages
			const nPages = Math.ceil(FE.ExpressionList.length / DialogFacialExpressionsPerPage);
			if (MouseIn(155, 785, 90, 90) && nPages > 1) {
				DialogFacialExpressionsSelectedPage = (DialogFacialExpressionsSelectedPage + nPages - 1) % nPages;
				return;
			} else if (MouseIn(255, 785, 90, 90) && nPages > 1) {
				DialogFacialExpressionsSelectedPage = (DialogFacialExpressionsSelectedPage + 1) % nPages;
				return;
			}

			const expressionSubset = FE.ExpressionList.slice(
				DialogFacialExpressionsSelectedPage * DialogFacialExpressionsPerPage,
				DialogFacialExpressionsSelectedPage * DialogFacialExpressionsPerPage + DialogFacialExpressionsPerPage,
			);
			for (const [j, expression] of expressionSubset.entries()) {
				const EOffsetX = 155 + 100 * (j % 3);
				const EOffsetY = 185 + 100 * Math.floor(j / 3);
				if (MouseIn(EOffsetX, EOffsetY, 90, 90) && CharacterIsExpressionAllowed(Player, FE.Appearance, expression)) {
					CharacterSetFacialExpression(Player, FE.Group, expression);
					FE.CurrentExpression = expression;
				}
			}
		}
	}
}

/**
 * Draws the pose sub menu
 * @returns {void} - Nothing
 */
function DialogDrawPoseMenu() {
	// Draw the pose groups
	DrawText(InterfaceTextGet("PoseMenu"), 250, 100, "White", "Black");

	for (const [offsetX, poseGroup] of CommonEnumerate(DialogActivePoses, 140, 140)) {
		for (const [offsetY, { Category, Name }] of CommonEnumerate(poseGroup, 180, 100)) {
			let isActive = false;
			if (Player.ActivePoseMapping[Category] === Name) {
				isActive = true;
			} else if (Name === "BaseUpper" && !(Player.ActivePoseMapping.BodyUpper || Player.ActivePoseMapping.BodyFull)) {
				isActive = true;
			} else if (Name === "BaseLower" && !(Player.ActivePoseMapping.BodyLower || Player.ActivePoseMapping.BodyFull)) {
				isActive = true;
			}
			DrawButton(offsetX, offsetY, 90, 90, "", !Player.CanChangeToPose(Name) ? "#888" : isActive ? "Pink" : "White", `Icons/Poses/${Name}.png`);
		}
	}
}

/**
 * Handles clicks in the pose sub menu
 * @returns {void} - Nothing
 */
function DialogClickPoseMenu() {
	for (const [offsetX, poseGroup] of CommonEnumerate(DialogActivePoses, 140, 140)) {
		for (const [offsetY, { Category, Name }] of CommonEnumerate(poseGroup, 180, 100)) {
			const isActive = Player.ActivePoseMapping[Category] === Name;
			if (MouseIn(offsetX, offsetY, 90, 90) && !isActive && Player.CanChangeToPose(Name)) {
				if (ChatRoomOwnerPresenceRule("BlockChangePose", Player)) {
					DialogLeave();
					return;
				}
				PoseSetActive(Player, Name);
				if (CurrentScreen == "ChatRoom") ServerSend("ChatRoomCharacterPoseUpdate", { Pose: Player.ActivePose });
			}
		}
	}
}


/**
 * Sets the current character sub menu to the owner rules
 * @returns {void} - Nothing
 */
function DialogViewOwnerRules() {
	DialogFindSubMenu("OwnerRules", true);
}

/**
 * Draws the rules sub menu
 * @returns {void} - Nothing
 */
function DialogDrawOwnerRulesMenu() {
	// Draw the pose groups
	DrawText(InterfaceTextGet("RulesMenu"), 230, 100, "White", "Black");

	/** @type {{Tag: string, Value?: number}[]} */
	const ToDisplay = [];

	if (LogQuery("BlockOwnerLockSelf", "OwnerRule")) ToDisplay.push({ Tag: "BlockOwnerLockSelf" });
	if (LogQuery("BlockChange", "OwnerRule")) ToDisplay.push({ Tag: "BlockChange", Value: LogValue("BlockChange", "OwnerRule") });
	if (LogQuery("BlockWhisper", "OwnerRule")) ToDisplay.push({ Tag: "BlockWhisper" });
	if (LogQuery("BlockKey", "OwnerRule")) ToDisplay.push({ Tag: "BlockKey" });
	if (LogQuery("BlockFamilyKey", "OwnerRule")) ToDisplay.push({ Tag: "BlockFamilyKey" });
	if (LogQuery("BlockRemote", "OwnerRule")) ToDisplay.push({ Tag: "BlockRemote" });
	if (LogQuery("BlockRemoteSelf", "OwnerRule")) ToDisplay.push({ Tag: "BlockRemoteSelf" });
	if (LogQuery("ReleasedCollar", "OwnerRule")) ToDisplay.push({ Tag: "ReleasedCollar" });
	if (LogQuery("BlockNickname", "OwnerRule")) ToDisplay.push({ Tag: "BlockNickname" });
	if (LogQuery("BlockLoverLockSelf", "LoverRule")) ToDisplay.push({ Tag: "BlockLoverLockSelf" });
	if (LogQuery("BlockLoverLockOwner", "LoverRule")) ToDisplay.push({ Tag: "BlockLoverLockOwner" });
	if (ToDisplay.length == 0) ToDisplay.push({ Tag: "Empty" });

	for (const [i, { Tag, Value }] of ToDisplay.entries()) {
		const Y = 180 + 110 * i;
		const TextToDraw = InterfaceTextGet(`RulesMenu${Tag}`) + (Value ? ` ${TimerToString(Value - CurrentTime)}` : "");
		DrawTextWrap(TextToDraw, 25, Y, 485, 95, "#fff", undefined, 2);
	}
}

/**
 * Sets the skill ratio for the player, will be a % of effectiveness applied to the skill when using it.
 * This way a player can use only a part of her bondage or evasion skill.
 * @param {SkillType} SkillType - The name of the skill to influence
 * @param {string} NewRatio - The ratio of this skill that should be used
 * @returns {void} - Nothing
 */
function DialogSetSkillRatio(SkillType, NewRatio) {
	SkillSetRatio(Player, SkillType, parseInt(NewRatio) / 100);
}

/**
 * Leave the dialog and revert back to a safe state, when the player uses her safe word
 * @returns {void} - Nothing
 */
function DialogChatRoomSafewordRevert() {
	DialogLeave();
	ChatRoomSafewordRevert();
}

/**
 * Leave the dialog and release the player of all restraints before returning them to the Main Lobby
 * @returns {void} - Nothing
 */
function DialogChatRoomSafewordRelease() {
	DialogLeave();
	ChatRoomSafewordRelease();
}

/**
 * Close the dialog and switch to the crafting screen.
 * @returns {void} - Nothing
 */
function DialogOpenCraftingScreen() {
	const FromChatRoom = (CurrentScreen === "ChatRoom");
	DialogLeave();
	CraftingShowScreen(FromChatRoom);
}

/**
 * Check whether it's possible to access the crafting interface.
 * @returns {boolean}
 */
function DialogCanCraft() {
	if ((CurrentModule != "Online") || (CurrentScreen != "ChatRoom")) return false;
	return !Player.IsRestrained() || !Player.IsBlind();
}

/**
 * Provides a group's real name for male characters
 *
 * @param {Character} C
 * @param {AssetGroup} G
 */
function DialogActualNameForGroup(C, G) {
	let repl = G.Description;
	if (C && C.HasPenis() && ["ItemVulva", "ItemVulvaPiercings"].includes(G.Name)) {
		repl = G.Name === "ItemVulva" ? InterfaceTextGet("DialogGroupNameItemPenis") : InterfaceTextGet("DialogGroupNameItemGlans");
	}
	return repl;
}

/**
 * Propose one of the struggle minigames or start one automatically.
 *
 * This function checks the difficulty of the current struggle attempt and
 * either use the Strength minigame by default or setup the menu state to show
 * the selection screen.
 *
 * @param {Character} C
 * @param {DialogStruggleActionType} Action
 * @param {Item} PrevItem
 * @param {Item} NextItem
 */
function DialogStruggleStart(C, Action, PrevItem, NextItem) {

	// Sets the status struggle and cancels previous struggles
	if (ChatRoomStruggleData != null) StruggleChatRoomStop();
	ChatRoomStatusUpdate("Struggle");

	// If it's not the player struggling, or we're applying a new item, or the
	// existing item is locked with a key the character has, or the player can
	// interact with it and it's not a mountable item, or the item's difficulty
	// is low enough to progress by itself, we're currently trying to swap items
	// on someone.
	const autoStruggle = (C != Player || PrevItem == null || ((PrevItem != null)
		&& (!InventoryItemHasEffect(PrevItem, "Lock", true) || DialogCanUnlock(C, PrevItem))
		&& ((Player.CanInteract() && !InventoryItemHasEffect(PrevItem, "Mounted", true))
			|| StruggleStrengthGetDifficulty(C, PrevItem, NextItem).auto >= 0)));
	if (autoStruggle) {
		DialogStruggleAction = Action;
		DialogStruggleSelectMinigame = false;
		StruggleMinigameStart(C, "Strength", PrevItem, NextItem, DialogStruggleStop);
	} else {
		DialogStruggleAction = Action;
		DialogStrugglePrevItem = PrevItem;
		DialogStruggleNextItem = NextItem;
		DialogStruggleSelectMinigame = true;
	}
	DialogChangeMode("struggle");
	// Refresh menu buttons
	DialogMenuButtonBuild(C);

}

/**
 * Handle the struggle minigame completing, either as a failure, an interruption, or a success.
 *
 * @type {StruggleCompletionCallback}
 */
function DialogStruggleStop(C, Game, { Progress, PrevItem, NextItem, Skill, Attempts, Interrupted, Auto }) {
	const Success = Progress >= 100;
	if (Interrupted) {
		// Handle the minigame having been interrupted by showing a message in chat
		let action;
		if (PrevItem != null && NextItem != null && !NextItem.Asset.IsLock)
			action = "ActionInterruptedSwap";
		else if (StruggleProgressNextItem != null)
			action = "ActionInterruptedAdd";
		else
			action = "ActionInterruptedRemove";

		ChatRoomPublishAction(C, action, PrevItem, NextItem);

		DialogLeave();
		return;
	} else if (Game === "LockPick") {
		if (Success) {
			if (C.FocusGroup && C) {
				const item = InventoryGet(C, C.FocusGroup.Name);
				if (item) {
					InventoryUnlock(C, item);
					ChatRoomPublishAction(C, "ActionPick", item, null);
				}
			}
			SkillProgress(Player, "LockPicking", Skill);
		}

		// For an NPC we move out to their reaction, for other characters we return to the item list
		if (C.IsNpc()) {
			DialogLeaveItemMenu();
		} else {
			DialogChangeMode("items");
		}
		return;
	} else if (Game === "Dexterity" || Game === "Flexibility" || Game === "Strength") {

		if (!Success) {
			// Send a stimulation event for that
			if (Attempts >= 10 && !Auto && Progress >= 0 && Progress < 100) {
				ChatRoomStimulationMessage("StruggleFail");
			}
			return;
		}

		// Removes the item & associated items if needed, then wears the new one
		InventoryRemove(C, C.FocusGroup.Name);
		if (NextItem != null) {
			let Color = (DialogColorSelect == null) ? "Default" : DialogColorSelect;
			if ((NextItem.Craft != null) && CommonIsColor(NextItem.Craft.Color))
				Color = NextItem.Craft.Color;

			const isCraft = (NextItem.Craft != null);
			InventoryWear(C, NextItem.Asset.Name, NextItem.Asset.Group.Name, Color, SkillGetWithRatio(Player, "Bondage"), Player.MemberNumber, NextItem.Craft, !isCraft);
			if (isCraft) {
				InventoryCraft(Player, C, /** @type {AssetGroupItemName} */(NextItem.Asset.Group.Name), NextItem.Craft, true);
			}

			// Refresh the item by getting it back
			NextItem = InventoryGet(C, NextItem.Asset.Group.Name);
		}

		// Handle skills
		if (C.IsPlayer()) {
			if (NextItem === null) {
				// We successfully removed one of our items
				SkillProgress(Player, "Evasion", Skill);
			} else if (PrevItem === null) {
				// We successfully added an item
				SkillProgress(Player, "SelfBondage", Skill);
			}
		} else if (NextItem !== null) {
			// We successfully added an item on someone
			SkillProgress(Player, "Bondage", Skill);
		}

		// Reset the the character's position
		if (CharacterAppearanceForceUpCharacter == C.MemberNumber) {
			CharacterAppearanceForceUpCharacter = -1;
			CharacterRefresh(C, false);
		}

		// Update the dialog state
		if (C.IsNpc()) {
			// For NPCs, we need to show their reaction and never leave the dialog abruptly
			C.CurrentDialog = DialogFind(C, (NextItem == null ? "Remove" + PrevItem.Asset.Name : NextItem.Asset.Name), (NextItem == null ? "Remove" : "") + C.FocusGroup.Name);
			DialogLeaveItemMenu();
		} else if (NextItem === null) {
			// Removing an item, we move back to the menu
			ChatRoomPublishAction(C, DialogStruggleAction, PrevItem, NextItem);
			DialogChangeMode("items");
		} else if (
			NextItem !== null
			&& NextItem.Asset.Extended
			&& (
				NextItem.Craft == null
				|| NextItem.Craft.TypeRecord == null
				|| Object.values(NextItem.Craft.TypeRecord).every(i => i === 0)
			)
		) {
			// Applying an extended, non-crafted/typeless crafted item, refresh the inventory and open the extended UI
			ChatRoomPublishAction(C, DialogStruggleAction, PrevItem, NextItem);
			DialogExtendItem(NextItem);
		} else {
			// Applying a non-extended or crafted-with-preset-type item, just exit the dialog altogether
			ChatRoomPublishAction(C, DialogStruggleAction, PrevItem, NextItem);
			DialogLeave();
		}
	}
}

/**
 * Keyboard handler for dialogs
 *
 * @type {KeyboardEventListener}
 */
function DialogKeyDown(event) {
	if (CurrentCharacter) {
		if (StruggleKeyDown(event)) {
			return true;
		} else if (CommonKey.IsPressed(event, "Escape")) {
			DialogMenuBack();
			return true;
		} else {
			return DialogMenuMapping[DialogMenuMode]?.KeyDown(event) ?? false;
		}
	}
	return false;
}

/**
 * Mouse down handler for dialogs
 *
 * @type {MouseEventListener}
 */
function DialogMouseDown(event) {
	if (CurrentCharacter) StruggleMouseDown(event);
}
