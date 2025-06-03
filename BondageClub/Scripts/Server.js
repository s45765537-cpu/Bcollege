"use strict";

/** @type {SocketIO.Socket} */
var ServerSocket = null;
var ServerURL = "http://localhost:4288";
/**
 * @type { { Message: string; Timer: number; ChatRoomName?: string | null; IsMail?: boolean; } }
 * @deprecated Use {@link ServerShowBeep} instead.
 */
var ServerBeep = { Message: "", Timer: 0 };
/** @type {NotificationBeep[] } */
var ServerBeepQueue = [];
var ServerIsConnected = false;
var ServerReconnectCount = 0;
var ServerAccountEmailRegex = /^[a-zA-Z0-9@.!#$%&'*+/=?^_`{|}~-]+$/;
var ServerAccountNameRegex = /^[a-zA-Z0-9]{1,20}$/;
var ServerAccountPasswordRegex = /^[a-zA-Z0-9]{1,20}$/;
var ServerAccountResetNumberRegex = /^[0-9]{1,20}$/;
var ServerCharacterNameRegex = /^[a-zA-Z ]{1,20}$/;
var ServerCharacterNicknameRegex = /^[\p{L}\p{Nd}\p{Z}'-]{1,20}$/u;
var ServerChatMessageMaxLength = 1000;

const ServerScriptMessage = "WARNING! Console scripts can break your account or steal your data. Only run scripts if " +
	"you know what you're doing and you trust the source. See " +
	"https://gitgud.io/BondageProjects/Bondage-College/-/wikis/Player-Safety#scripts-browser-extensions to learn more about " +
	"script safety.";
const ServerScriptWarningStyle = "display: inline-block; color: black; background: #ffe3ad; margin: 16px 0 8px 0; " +
	"padding: 8px 4px; font-size: 20px; border: 6px solid #ffa600; font-family: 'Arial', sans-serif; line-height: 1.6;";

/** Loads the server by attaching the socket events and their respective callbacks */
function ServerInit() {
	ServerSocket = io(ServerURL);
	ServerSocket.on("connect", ServerConnect);
	ServerSocket.on("disconnect", function () { ServerDisconnect(); });
	ServerSocket.io.on("reconnect_attempt", ServerReconnecting);
	ServerSocket.on("ServerInfo", function (data) { ServerInfo(data); });
	ServerSocket.on("CreationResponse", function (data) { CreationResponse(data); });
	ServerSocket.on("LoginResponse", function (data) { LoginResponse(data); });
	ServerSocket.on("LoginQueue", function (data) { LoginQueue(data); });
	ServerSocket.on("ForceDisconnect", function (data) { ServerDisconnect(data, true); });
	ServerSocket.on("ChatRoomSearchResult", function (data) { ChatSearchResultResponse(data); });
	ServerSocket.on("ChatRoomSearchResponse", function (data) { ChatSearchResponse(data); });
	ServerSocket.on("ChatRoomCreateResponse", function (data) { ChatCreateResponse(data); });
	ServerSocket.on("ChatRoomUpdateResponse", function (data) { ChatAdminResponse(data); });
	ServerSocket.on("ChatRoomSync", function (data) { ChatRoomSync(data); });
	ServerSocket.on("ChatRoomSyncMemberJoin", function (data) { ChatRoomSyncMemberJoin(data); });
	ServerSocket.on("ChatRoomSyncMemberLeave", function (data) { ChatRoomSyncMemberLeave(data); });
	ServerSocket.on("ChatRoomSyncRoomProperties", function (data) { ChatRoomSyncRoomProperties(data); });
	ServerSocket.on("ChatRoomSyncCharacter", function (data) { ChatRoomSyncCharacter(data); });
	ServerSocket.on("ChatRoomSyncReorderPlayers", function (data) { ChatRoomSyncReorderPlayers(data); });
	ServerSocket.on("ChatRoomSyncSingle", function (data) { ChatRoomSyncSingle(data); });
	ServerSocket.on("ChatRoomSyncExpression", function (data) { ChatRoomSyncExpression(data); });
	ServerSocket.on("ChatRoomSyncMapData", function (data) { ChatRoomMapViewSyncMapData(data); });
	ServerSocket.on("ChatRoomSyncPose", function (data) { ChatRoomSyncPose(data); });
	ServerSocket.on("ChatRoomSyncArousal", function (data) { ChatRoomSyncArousal(data); });
	ServerSocket.on("ChatRoomSyncItem", function (data) { ChatRoomSyncItem(data); });
	ServerSocket.on("ChatRoomMessage", function (data) { ChatRoomMessage(data); });
	ServerSocket.on("ChatRoomAllowItem", function (data) { ChatRoomAllowItem(data); });
	ServerSocket.on("ChatRoomGameResponse", function (data) { ChatRoomGameResponse(data); });
	ServerSocket.on("PasswordResetResponse", function (data) { PasswordResetResponse(data); });
	ServerSocket.on("AccountQueryResult", function (data) { ServerAccountQueryResult(data); });
	ServerSocket.on("AccountBeep", function (data) { ServerAccountBeep(data); });
	ServerSocket.on("AccountOwnership", function (data) { ServerAccountOwnership(data); });
	ServerSocket.on("AccountLovership", function (data) { ServerAccountLovership(data); });
}

/** @readonly */
var ServerAccountUpdate = new class AccountUpdater {

	constructor() {
		/**
		 * @private
		 * @type {Map<keyof ServerAccountUpdateRequest, any>}
		 */
		this.Queue = new Map;
		/**
		 * @private
		 * @type {null | ReturnType<typeof setTimeout>}
		 */
		this.Timeout = null;
		/**
		 * @private
		 * @type {number}
		 */
		this.Start = 0;
	}

	/** Clears queue and sync with server  */
	SyncToServer() {
		if (this.Timeout) clearTimeout(this.Timeout);
		this.Timeout = null;

		if (this.Queue.size == 0) return;

		const Queue = this.Queue;
		this.Queue = new Map;
		const Data = {};
		Queue.forEach((value, key) => Data[key] = value);

		ServerSend("AccountUpdate", Data);
	}

	/**
	 * Queues a data to be synced at a later time
	 * @param {ServerAccountUpdateRequest} Data
	 * @param {boolean} [Force] - force immediate sync to server
	 */
	QueueData(Data, Force=false) {
		if (!ServerIsLoggedIn()) return; // We're not logged in

		for (const [key, value] of CommonEntries(Data)) {
			this.Queue.set(key, value);
		}

		if (Force) {
			this.SyncToServer();
			return;
		}

		if (this.Timeout) {
			if (Date.now() - this.Start <= 8000) {
				clearTimeout(this.Timeout);
				this.Timeout = null;
			}
		} else this.Start = Date.now();

		if (!this.Timeout) this.Timeout = setTimeout(this.SyncToServer.bind(this), 2000);
	}
};

/**
 * Sets the connection status of the server and updates the login page message
 * @param {boolean} connected - whether or not the websocket connection to the server has been established successfully
 * @param {string} [errorMessage] - the error message to display if not connected
 */
function ServerSetConnected(connected, errorMessage) {
	ServerIsConnected = connected;
	if (connected) {
		ServerReconnectCount = 0;
		LoginSetStatus();
	} else {
		LoginSetStatus(errorMessage, true);
	}
}

function ServerIsLoggedIn() {
	return Player.CharacterID !== "";
}

/**
 * Callback when receiving a "connect" event on the socket - this will be called on initial connection and on
 * successful reconnects.
 */
function ServerConnect() {
	//console.info("Server connection established");
	ServerSetConnected(true);
	console.info("Connected to the Bondage Club Server.");

	const userAgent = navigator.userAgent.toLowerCase();
	if (userAgent.includes("chrome") || userAgent.includes("firefox")) {
		console.log(`\n%c${ServerScriptMessage}%c \n`, ServerScriptWarningStyle, "");
	} else {
		console.log(ServerScriptMessage);
	}
}

/**
 * Callback when receiving a "reconnecting" event on the socket - this is called when socket.io initiates a retry after
 * a failed connection attempt.
 */
function ServerReconnecting() {
	ServerReconnectCount++;
	if (ServerReconnectCount >= 3) LoginSetStatus("ErrorUnableToConnect");
}

/**
 * Callback used to parse received information related to the server
 * @param {{OnlinePlayers: number, Time: number}} data - Data object containing the server information
 * @returns {void} - Nothing
 */
function ServerInfo(data) {
	if (data.OnlinePlayers != null) CurrentOnlinePlayers = data.OnlinePlayers;
	if (data.Time != null) CurrentTime = data.Time;
}

/**
 * Callback used when we are disconnected from the server, try to enter the reconnection mode (relog screen) if the
 * user was logged in
 * @param {ServerForceDisconnectMessage} [data] - Error to log
 * @param {boolean} [close=false] - close the transport
 * @returns {void} - Nothing
 */
function ServerDisconnect(data, close = false) {
	if (!ServerIsConnected) return;
	console.warn("Server connection lost");
	const ShouldRelog = Player.Name != "";
	let msg = ShouldRelog ? "Disconnected" : "ErrorDisconnectedFromServer";
	if (data) {
		console.warn(data);
		msg = data;
	}
	ServerSetConnected(false, msg);
	if (close) {
		ServerSocket.disconnect();
		// If the error was duplicated login, we want to reconnect
		if (data === "ErrorDuplicatedLogin") {
			ServerInit();
		}
	}

	if (ShouldRelog && CurrentScreen != "Relog") {
		if (ServerPlayerIsInChatRoom()) {
			RelogData = { Screen: "ChatSearch", Module: "Online", Character: null, ChatRoomName: ChatRoomData?.Name };
			ChatRoomData = null;
		} else {
			// Forcing cast here because CurrentModule & CurrentScreen can't meaningfully be type-linked
			RelogData = { Screen: /** @type {any} */(CurrentScreen), Module: CurrentModule, Character: CurrentCharacter, ChatRoomName: null };
		}

		DialogLeave();
		CommonSetScreen("Character", "Relog");
	}

	// Raise a notification to alert the user
	if (!document.hasFocus()) {
		NotificationRaise(NotificationEventType.DISCONNECT);
	}
}

/** @typedef {{ screen?: string, callback?: () => boolean }} ServerChatRoomChecksOptions */

/**
 * Namespace with callbacks for determining whether the player is in a chatroom
 * @namespace
 * @see {@link ServerPlayerIsInChatRoom}
 */
var ServerPlayerChatRoom = {
	/**
	 * All registered callbacks representing distinct screens that must be checked in order to determine chatroom presence
	 * @type {((screen: string) => boolean)[]}
	 */
	callbacks: [],

	/**
	 * Register one or more screenname and/or callback for determining whether the player is in a chat room.
	 * @param {ServerChatRoomChecksOptions[]} options
	 */
	register(...options) {
		for (let { screen, callback } of options) {
			if (screen) {
				callback ??= () => true;
				this.callbacks.push((currentScreen) => currentScreen === screen && callback());
			} else if (callback) {
				this.callbacks.push(() => callback());
			}
		}
	},
};

ServerPlayerChatRoom.register(
	{ screen: "ChatRoom" },
	{ screen: "ChatAdmin" },
	{ screen: "GameLARP" },
	{ screen: "Appearance", callback: () => CharacterAppearanceReturnScreen?.[1] === "ChatRoom" },
	{ screen: "InformationSheet", callback: () => InformationSheetReturnScreen?.[1] === "ChatRoom" },
	{ screen: "Title", callback: () => InformationSheetReturnScreen?.[1] === "ChatRoom" },
	{ screen: "OnlineProfile", callback: () => InformationSheetReturnScreen?.[1] === "ChatRoom" },
	{ screen: "FriendList", callback: () => InformationSheetReturnScreen?.[1] === "ChatRoom" && (FriendListReturn == null || FriendListReturn.IsInChatRoom) },
	{ screen: "Preference", callback: () => InformationSheetReturnScreen?.[1] === "ChatRoom" },
	{ screen: "MiniGame", callback: () => DialogGamingReturnScreen?.[1] === "ChatRoom" },
	{ screen: "Crafting", callback: () => CraftingReturnToChatroom },
	{ screen: "Shop2", callback: () => Shop2InitVars.PreviousScreen?.[1] === "ChatRoom" },
	{ screen: "WheelFortune", callback: () => WheelFortuneReturnScreen?.[1] === "ChatRoom" },
	{ screen: "WheelFortuneCustomize", callback: () => WheelFortuneReturnScreen?.[1] === "ChatRoom" },
);

/**
 * Returns whether the player is currently in a chatroom or viewing a subscreen while in a chatroom
 * @returns {boolean} - True if in a chatroom
 */
function ServerPlayerIsInChatRoom() {
	return ServerPlayerChatRoom.callbacks.some(predicate => predicate(CurrentScreen));
}

/** Ratelimit: Max number of messages per interval */
var ServerSendRateLimit = 14;
/** Ratelimit: Length of the rate-limit window, in msec */
var ServerSendRateLimitInterval = 1200;

/**
 * Queued messages waiting to be sent
 *
 * @type {SendRateLimitQueueItem[]}
 */
const ServerSendRateLimitQueue = [];

/** @type {number[]} */
let ServerSendRateLimitTimes = [];

/**
 * Sends a message with the given data to the server via socket.emit
 * @type {<Ev extends import("@socket.io/component-emitter").EventNames<ClientToServerEvents>>(
 *     ev: Ev, ...args: import("@socket.io/component-emitter").EventParams<ClientToServerEvents, Ev>
 * ) => void}
 */
function ServerSend(Message, ...args) {
	if (!ServerIsLoggedIn() && !["AccountCreate", "AccountLogin", "PasswordReset", "PasswordResetProcess"].includes(Message)) return; // We're not logged in
	const queueItem = /** @type {SendRateLimitQueueItem} */({ Message, args });
	ServerSendRateLimitQueue.push(queueItem);

	// Pump the queue manually to fight back against background tab throttling
	ServerSendQueueProcess();
}

/**
 * Process the outgoing server messages queue
 */
function ServerSendQueueProcess() {
	ServerSendRateLimitTimes = ServerSendRateLimitTimes.filter(
		(t) => Date.now() - t < ServerSendRateLimitInterval
	);

	while (
		ServerSendRateLimitTimes.length < ServerSendRateLimit &&
		ServerSendRateLimitQueue.length > 0
	) {
		const item = ServerSendRateLimitQueue.shift();
		if (item) {
			if (item.Message === "ChatRoomChat") {
				const [data] = item.args;
				if (["Chat", "Emote", "Whisper"].includes(data?.Type) && (CommonIsArray(data.Dictionary) || data.Dictionary === undefined)) {
					data.Dictionary = data?.Dictionary ?? [];
					data.Dictionary.push({ Tag: "MsgId", MsgId: CommonGenerateUniqueID() });
				}
			}
			ServerSocket.emit(item.Message, ...item.args);
			ServerSendRateLimitTimes.push(Date.now());
		}
	}
}

/**
 * Syncs Money, owner name and lover name with the server
 * @returns {void} - Nothing
 */
function ServerPlayerSync() {
	// TODO: `Lover` has been deprecated, do we still need to pass it along here?
	ServerAccountUpdate.QueueData({ Money: Player.Money, Owner: Player.Owner, Lover: Player.Lover });
	delete Player.Lover;
}

/**
 * Syncs the full player inventory to the server.
 * @returns {void} - Nothing
 */
function ServerPlayerInventorySync() {
	const Data = InventoryDataBuild(Player);

	// If the result is different, we assign it and update the server account
	if (Data !== Player.InventoryData) {
		Player.InventoryData = Data;
		ServerAccountUpdate.QueueData({ InventoryData: Data }, true);
	}
}

/**
 * Unpack the all item permissions into the quartet of blocked, limited, favorited and hidden item object
 * @param {Partial<Record<`${AssetGroupName}/${string}`, ItemPermissions>>} permissionItems - The packed item permission data
 * @returns {Pick<ServerAccountUpdateRequest, "BlockItems" | "LimitedItems" | "FavoriteItems" | "HiddenItems">} - The unpacked item permission data
 */
function ServerPackItemPermissions(permissionItems) {
	/** @type {Pick<ServerAccountUpdateRequest, "BlockItems" | "LimitedItems" | "FavoriteItems">} */
	const data = {
		BlockItems: {},
		LimitedItems: {},
		FavoriteItems: {},
	};

	/** @type {ServerAccountUpdateRequest["HiddenItems"]} */
	const HiddenItems = [];

	for (const [name, permission] of CommonEntries(permissionItems)) {
		const [groupName, assetName] = /** @type {[AssetGroupName, string]} */(name.split("/"));

		if (permission.Hidden) {
			HiddenItems.push({ Name: assetName, Group: groupName });
		}

		const assetField = /** @type {const} */(`${permission.Permission}Items`);
		if (data[assetField]) {
			data[assetField][groupName] ??= {};
			data[assetField][groupName][assetName] ??= [];
			data[assetField][groupName][assetName].push("");
		}

		for (const [type, typePermission] of Object.entries(permission.TypePermissions)) {
			const typeField = /** @type {const} */(`${typePermission}Items`);
			if (!data[typeField]) {
				continue;
			}

			data[typeField][groupName] ??= {};
			data[typeField][groupName][assetName] ??= [];
			data[typeField][groupName][assetName].push(type);
		}
	}
	return Object.assign(data, { HiddenItems });
}

/**
 * Unpack the quartet of blocked, limited, favorited and hidden item permissions into a single object
 * @param {Pick<Partial<ServerAccountDataSynced>, "BlockItems" | "LimitedItems" | "FavoriteItems" | "HiddenItems">} data - The item permission data as received from the server
 * @param {boolean} onExtreme - If the expected difficulty is Extreme
 * @returns {{ permissions: Partial<Record<`${AssetGroupName}/${string}`, ItemPermissions>>; shouldSync: boolean }} - The packed item permission data
 */
function ServerUnPackItemPermissions(data, onExtreme) {
	/** @type {{permissions: Partial<Record<`${AssetGroupName}/${string}`, ItemPermissions>>; shouldSync: boolean }} */
	const ret = { permissions: {}, shouldSync: false };
	if (!data) {
		return ret;
	}

	/** @type {Set<string>} */
	const limitedAssets = new Set(MainHallStrongLocks);
	for (let [field, permissionObj] of CommonEntries(CommonPick(data, ["BlockItems", "LimitedItems", "FavoriteItems", "HiddenItems"]))) {
		// Extreme never allows for hidden or blocked items (and only a tiny subset of limited items)
		if (onExtreme && (field === "HiddenItems" || field === "BlockItems")) {
			ret.shouldSync = true;
			continue;
		}

		// For the sake of convenience, convert the object-style permissions into array-style
		if (CommonIsObject(permissionObj)) {
			/** @type {ServerItemPermissions[]} */
			const permissionArray = [];
			for (const [Group, groupPermissions] of CommonEntries(permissionObj ?? {})) {
				for (const [Name, assetPermissions] of CommonEntries(groupPermissions ?? {})) {
					if (CommonIsArray(assetPermissions)) {
						for (const Type of assetPermissions) {
							permissionArray.push({ Group, Name, Type });
						}
					} else {
						ret.shouldSync = true;
					}
				}
			}
			permissionObj = permissionArray;
		}

		if (CommonIsArray(permissionObj)) {
			for (const protoPermission of permissionObj) {
				// Validate and sanitize the referenced assets
				let { Group, Name, Type } = protoPermission ?? {};
				let asset = AssetGet("Female3DCG", Group, Name);
				if (!asset) {
					const fixup = LoginInventoryFixups.find(({ Old }) => Old.Group === Group && (Old.Name === Name || Old.Name === "*"));
					if (!fixup) {
						ret.shouldSync = true;
						continue;
					}

					Group = fixup.New.Group;
					if (fixup.New.Name) {
						Name = fixup.New.Name;
					}
					asset = AssetGet("Female3DCG", Group, Name);
				}
				if (!asset) {
					ret.shouldSync = true;
					continue;
				}

				const key = /** @type {const} */(`${Group}/${Name}`);
				const permission = ret.permissions[key] ??= PreferencePermissionGetDefault();
				switch (field) {
					case "HiddenItems":
						if (AssetGroupIsHideable(asset.Group)) {
							permission.Hidden = true;
						} else {
							ret.shouldSync = true;
						}
						break;
					case "BlockItems":
						if (Type) {
							permission.TypePermissions[Type] = "Block";
						} else {
							permission.Permission = "Block";
						}
						break;
					case "FavoriteItems":
						if (Type) {
							permission.TypePermissions[Type] = "Favorite";
						} else {
							permission.Permission = "Favorite";
						}
						break;
					case "LimitedItems":
						if (!onExtreme || limitedAssets.has(Name)) {
							if (Type) {
								permission.TypePermissions[Type] = "Limited";
							} else {
								permission.Permission = "Limited";
							}
						} else {
							ret.shouldSync = true;
						}
						break;
				}
			}
		} else {
			ret.shouldSync = true;
		}
	}
	return ret;
}

/**
 * Syncs player's favorite, blocked, limited and hidden items to the server
 * @returns {void} - Nothing
 */
function ServerPlayerBlockItemsSync() {
	ServerAccountUpdate.QueueData(ServerPackItemPermissions(Player.PermissionItems), true);
}

/**
 * Syncs the full player log array to the server.
 * @returns {void} - Nothing
 */
function ServerPlayerLogSync() {
	ServerAccountUpdate.QueueData({ Log });
}

/**
 * Syncs the full player reputation array to the server.
 * @returns {void} - Nothing
 */
function ServerPlayerReputationSync() {
	ServerAccountUpdate.QueueData({ Reputation: Player.Reputation });
}

/**
 * Syncs the full player skill array to the server.
 * @returns {void} - Nothing
 */
function ServerPlayerSkillSync() {
	ServerAccountUpdate.QueueData({ Skill: Player.Skill });
}

/**
 * Syncs player's relations and related info to the server.
 * @returns {void} - Nothing
 */
function ServerPlayerRelationsSync() {
	/** @type {ServerAccountUpdateRequest} */
	const D = {};
	D.FriendList = Player.FriendList;
	D.GhostList = Player.GhostList;
	D.WhiteList = Player.WhiteList;
	D.BlackList = Player.BlackList;
	Array.from(Player.FriendNames.keys()).forEach(k => {
		if (!Player.FriendList.includes(k) && !Player.SubmissivesList.has(k))
			Player.FriendNames.delete(k);
	});
	D.FriendNames = LZString.compressToUTF16(JSON.stringify(Array.from(Player.FriendNames)));
	D.SubmissivesList = LZString.compressToUTF16(JSON.stringify(Array.from(Player.SubmissivesList)));
	ServerAccountUpdate.QueueData(D, true);
}

/**
 * Syncs {@link Player.ExtensionSettings} to the server.
 * @param {keyof ExtensionSettings} dataKeyName - The single key to sync
 * @param {boolean} [_force] - unused
 */
function ServerPlayerExtensionSettingsSync(dataKeyName, _force = false) {
	if (Player.ExtensionSettings[dataKeyName] === undefined) {
		throw new Error(`Invalid key '${dataKeyName}' attempting to save 'undefined'`);
	}
	const obj = { [`ExtensionSettings.${dataKeyName}`]: Player.ExtensionSettings[dataKeyName] };

	ServerSend("AccountUpdate", obj);
}

/**
 * Prepares an appearance bundle so we can push it to the server. It minimizes it by keeping only the necessary
 * information. (Asset name, group name, color, properties and difficulty)
 * @param {readonly Item[]} Appearance - The appearance array to bundle
 * @returns {AppearanceBundle} - The appearance bundle created from the given appearance array
 */
function ServerAppearanceBundle(Appearance) {
	var Bundle = [];
	for (let A = 0; A < Appearance.length; A++)
		if (Appearance[A].Asset != null) {
			var N = {};
			N.Group = Appearance[A].Asset.Group.Name;
			N.Name = Appearance[A].Asset.Name;
			if ((Appearance[A].Color != null) && (Appearance[A].Color != "Default")) N.Color = Appearance[A].Color;
			if ((Appearance[A].Difficulty != null) && (Appearance[A].Difficulty != 0)) N.Difficulty = Appearance[A].Difficulty;
			if (Appearance[A].Property != null) N.Property = Appearance[A].Property;
			if (Appearance[A].Craft != null) N.Craft = Appearance[A].Craft;
			Bundle.push(N);
		}
	return Bundle;
}

/**
 * Loads the appearance assets from a server bundle that only contains the main info (no asset) and validates their
 * properties to prevent griefing and respecting permissions in multiplayer
 * @param {Character} C - Character for which to load the appearance
 * @param {IAssetFamily} AssetFamily - Family of assets used for the appearance array
 * @param {AppearanceBundle} Bundle - Bundled appearance
 * @param {number} [SourceMemberNumber] - Member number of the user who triggered the change
 * @param {boolean} [AppearanceFull=false] - Whether or not the appearance should be assigned to an NPC's AppearanceFull
 * property
 * @returns {boolean} - Whether or not the appearance bundle update contained invalid items
 */
function ServerAppearanceLoadFromBundle(C, AssetFamily, Bundle, SourceMemberNumber, AppearanceFull=false) {
	if (!Array.isArray(Bundle)) {
		Bundle = [];
	}

	const appearanceDiffs = ServerBuildAppearanceDiff(AssetFamily, C.Appearance, Bundle);
	ServerAddRequiredAppearance(AssetFamily, appearanceDiffs);

	if (SourceMemberNumber == null) SourceMemberNumber = C.MemberNumber;
	const updateParams = ValidationCreateDiffParams(C, SourceMemberNumber);

	let { appearance, updateValid } = CommonKeys(appearanceDiffs)
		// eslint-disable-next-line
		.reduce(({ appearance, updateValid }, groupName) => {
			const diff = appearanceDiffs[groupName];
			const { item, valid } = ValidationResolveAppearanceDiff(groupName, diff[0], diff[1], updateParams);
			if (item) appearance.push(item);
			updateValid = updateValid && valid;
			return { appearance, updateValid };
		}, { appearance: [], updateValid: true });

	const cyclicBlockSanitizationResult = ValidationResolveCyclicBlocks(appearance, appearanceDiffs);
	appearance = cyclicBlockSanitizationResult.appearance;
	updateValid = updateValid && cyclicBlockSanitizationResult.valid;

	if (AppearanceFull) {
		C.AppearanceFull = appearance;
	} else {
		C.Appearance = appearance;
	}

	// If the appearance update was invalid, send another update to correct any issues
	if (!updateValid && C.IsPlayer()) {
		console.warn("Invalid appearance update bundle received. Updating with sanitized appearance.");
		ChatRoomCharacterUpdate(C);
	}
	return updateValid;
}

/**
 * Builds a diff map for comparing changes to a character's appearance, keyed by asset group name
 * @param {IAssetFamily} assetFamily - The asset family of the appearance
 * @param {readonly Item[]} appearance - The current appearance to compare against
 * @param {AppearanceBundle} bundle - The new appearance bundle
 * @returns {AppearanceDiffMap} - An appearance diff map representing the changes that have been made to the character's
 * appearance
 */
function ServerBuildAppearanceDiff(assetFamily, appearance, bundle) {
	/** @type {AppearanceDiffMap} */
	const diffMap = {};
	appearance.forEach((item) => {
		diffMap[item.Asset.Group.Name] = [item, null];
	});
	bundle.forEach((item) => {
		const appearanceItem = ServerBundledItemToAppearanceItem(assetFamily, item);
		if (appearanceItem) {
			const diff = diffMap[item.Group] = (diffMap[item.Group] || [null, null]);
			diff[1] = appearanceItem;
		}
	});
	return diffMap;
}

/**
 * Maps a bundled appearance item, as stored on the server and used for appearance update messages, into a full
 * appearance item, as used by the game client
 * @param {IAssetFamily} assetFamily - The asset family of the appearance item
 * @param {ItemBundle} item - The bundled appearance item
 * @returns {null | Item} - A full appearance item representation of the provided bundled appearance item
 */
function ServerBundledItemToAppearanceItem(assetFamily, item) {
	if (!item || typeof item !== "object" || typeof item.Name !== "string" || typeof item.Group !== "string") return null;

	const asset = AssetGet(assetFamily, item.Group, item.Name);
	if (!asset) return null;

	return {
		Asset: asset,
		Difficulty: parseInt(item.Difficulty == null ? 0 : item.Difficulty),
		Color: ServerParseColor(asset, item.Color, asset.Group.ColorSchema),
		Craft: item.Craft,
		Property: item.Property,
	};
}

/**
 * Parses an item color, based on the allowed colorable layers on an asset, and the asset's color schema
 * @param {Asset} asset - The asset on which the color is set
 * @param {string | readonly string[]} color - The color value to parse
 * @param {readonly string[]} schema - The color schema to validate against
 * @returns {string|string[]} - A parsed valid item color
 */
function ServerParseColor(asset, color, schema) {
	if (typeof color === "string") {
		return ServerValidateColorAgainstSchema(color, schema);
	} else if (CommonIsArray(color)) {
		if (color == null) return "Default";
		if (color.length > asset.ColorableLayerCount) color = color.slice(0, asset.ColorableLayerCount);
		return color.map(c => ServerValidateColorAgainstSchema(c, schema));
	} else {
		return "Default";
	}
}

/**
 * Populates an appearance diff map with any required items, to ensure that all asset groups are present that need to
 * be.
 * @param {IAssetFamily} assetFamily - The asset family for the appearance
 * @param {AppearanceDiffMap} diffMap - The appearance diff map to populate
 * @returns {void} - Nothing
 */
function ServerAddRequiredAppearance(assetFamily, diffMap) {
	AssetGroup.forEach(group => {
		// If it's not in the appearance category or is allowed to empty, return
		if (group.Category !== "Appearance" || group.AllowNone) return;
		// If the current source already has an item in the group, return
		if (diffMap[group.Name] && diffMap[group.Name][0]) return;

		const diff = diffMap[group.Name] = diffMap[group.Name] || [null, null];

		if (group.MirrorGroup) {
			// If we need to mirror an item, see if it exists
			const itemToMirror = diffMap[group.MirrorGroup] && diffMap[group.MirrorGroup][0];
			if (itemToMirror) {
				const mirroredAsset = AssetGet(assetFamily, group.Name, itemToMirror.Asset.Name);
				// If there is an item to mirror, copy it and its color
				if (mirroredAsset) diff[0] = { Asset: mirroredAsset, Color: itemToMirror.Color };
			}
		}

		// If the item still hasn't been filled, use the first item from the group's asset list
		if (!diff[0]) {
			diff[0] = { Asset: group.Asset[0], Color: group.DefaultColor };
		}
	});
}

/**
 * Validates and returns a color against a color schema
 * @param {string} Color - The color to validate
 * @param {readonly string[]} Schema - The color schema to validate against (a list of accepted Color values)
 * @returns {string} - The color if it is a valid hex color string or part of the color schema, or the default color
 *     from the color schema otherwise
 */
function ServerValidateColorAgainstSchema(Color, Schema) {
	var HexCodeRegex = /^#(?:[0-9a-f]{3}){1,2}$/i;
	if (typeof Color === 'string' && (Schema.includes(Color) || HexCodeRegex.test(Color))) return Color;
	return Schema[0];
}

/**
 * Syncs the player appearance with the server database.
 *
 * Note that this will *not* push appearance changes to the rest of the chatroom,
 * which requires either {@link ChatRoomCharacterItemUpdate} or {@link ChatRoomCharacterUpdate}.
 *
 * @returns {void} - Nothing
 */
function ServerPlayerAppearanceSync() {

	// Creates a big parameter string of every appearance items and sends it to the server
	if (Player.AccountName != "") {
		/** @type {ServerAccountUpdateRequest} */
		var D = {};
		D.AssetFamily = Player.AssetFamily;
		D.Appearance = ServerAppearanceBundle(Player.Appearance);
		ServerAccountUpdate.QueueData(D, true);
	}

}

/**
 * Syncs all the private room characters with the server
 * @returns {void} - Nothing
 */
function ServerPrivateCharacterSync() {
	/** @type {{ PrivateCharacter: ServerPrivateCharacterData[] }} */
	const D = { PrivateCharacter: [] };
	for (let ID = 1; ID < PrivateCharacter.length; ID++) {
		var C = {
			Name: PrivateCharacter[ID].Name,
			Love: PrivateCharacter[ID].Love,
			Title: PrivateCharacter[ID].Title,
			Trait: PrivateCharacter[ID].Trait,
			Cage: PrivateCharacter[ID].Cage,
			Owner: PrivateCharacter[ID].Owner,
			Lover: PrivateCharacter[ID].Lover,
			AssetFamily: PrivateCharacter[ID].AssetFamily,
			Appearance: ServerAppearanceBundle(PrivateCharacter[ID].Appearance),
			AppearanceFull: ServerAppearanceBundle(PrivateCharacter[ID].AppearanceFull),
			ArousalSettings: PrivateCharacter[ID].ArousalSettings,
			Event: PrivateCharacter[ID].Event
		};
		if (PrivateCharacter[ID].FromPandora != null) C.FromPandora = PrivateCharacter[ID].FromPandora;
		D.PrivateCharacter.push(C);
	}
	ServerAccountUpdate.QueueData(D);
}

/**
 * Callback used to parse received information related to a query made by the player such as viewing their online
 * friends or current email status
 * @param {ServerAccountQueryResponse} data - Data object containing the query data
 * @returns {void} - Nothing
 */
function ServerAccountQueryResult(data) {
	if ((data != null) && (typeof data === "object") && !Array.isArray(data) && (data.Query != null) && (typeof data.Query === "string") && (data.Result != null)) {
		if (data.Query == "OnlineFriends") FriendListLoadFriendList(data.Result);
		if (data.Query == "EmailStatus" && data.Result && document.getElementById("InputEmailOld"))
			/** @type {HTMLInputElement} */ (document.getElementById("InputEmailOld")).setAttribute("placeholder", TextGet("UpdateEmailLinked"));
		if (data.Query == "EmailStatus" && !data.Result && document.getElementById("InputEmailNew"))
			/** @type {HTMLInputElement} */ (document.getElementById("InputEmailNew")).setAttribute("placeholder", TextGet("UpdateEmailEmpty"));
		if (data.Query == "EmailUpdate") ElementValue("InputEmailNew", TextGet(data.Result ? "UpdateEmailSuccess" : "UpdateEmailFailure"));
	}
}

/**
 * Callback used to parse received information related to a beep from another account
 * @param {ServerAccountBeepResponse} data - Data object containing the beep object which contain at the very least a name and a member
 *     number
 * @returns {void} - Nothing
 */
function ServerAccountBeep(data) {
	if ((data != null) && (typeof data === "object") && !Array.isArray(data) && (data.MemberNumber != null) && (typeof data.MemberNumber === "number") && (data.MemberName != null) && (typeof data.MemberName === "string")) {
		if (!data.BeepType || data.BeepType == "") {
			if (typeof data.Message === "string") {
				data.Message = data.Message.substr(0, 1000);
			} else {
				delete data.Message;
			}
			let msg = `${InterfaceTextGet("BeepFrom")} ${data.MemberName} (${data.MemberNumber})`;
			// We make a copy here since we want to keep opening the correct beep, even if more get added
			const beepIdx = FriendListBeepLog.length;
			if (data.ChatRoomName) {
				msg += ` ${InterfaceTextGet("InRoom")} "${data.ChatRoomName}"${data.ChatRoomSpace === "Asylum" ? " " + InterfaceTextGet("InAsylum") : ''}`;
			}
			if (data.Message) {
				msg += `; ${InterfaceTextGet("BeepWithMessage")}`;
			}

			/**
			 * This function is just there for compat with BCUtil's special "this is an IM beep"
			 * @type {(string) => string}
			 */
			const stripBCUtilCruft = (txt) => {
				return txt.split("\uf124")[0].trimEnd();
			};

			ServerShowBeep(msg, 10000, {
				memberNumber: data.MemberNumber,
				memberName: data.MemberName,
				chatRoomName: data.ChatRoomName,
				...(data.Message && {
					onClick: () => {
						FriendListShowBeep(beepIdx);
					}
				})
			});

			FriendListBeepLog.push({
				MemberNumber: data.MemberNumber,
				MemberName: data.MemberName,
				ChatRoomName: data.ChatRoomName,
				ChatRoomSpace: data.ChatRoomSpace,
				Private: data.Private,
				Sent: false,
				Time: new Date(),
				Message: data.Message
			});
			if (CurrentScreen == "FriendList") ServerSend("AccountQuery", { Query: "OnlineFriends" });
			if (Player.ChatSettings.ShowBeepChat) {
				// "Reply to beep" arrow
				const replyLink = ElementButton.Create(
					`beep-reply-${beepIdx}`, // or just leave to null for an ID auto assignment
					() => {
						ElementValue("InputChat", `/beep ${data.MemberNumber} ${ElementValue("InputChat").replace(/^\/(beep|w) \S+ ?/u, '')}`);
						document.getElementById('InputChat').focus();
					},
					{ noStyling: true },
					{ button: { classList: ["ReplyButton"], children: ['\u21a9\ufe0f'] } },
				);

				// Beep preview link
				const beepLink = document.createElement("a");
				beepLink.classList.add("beep-link");

				let previewMsg = "";
				if (data.Message) {
					previewMsg = stripBCUtilCruft(data.Message);
					if (previewMsg.length > 150) {
						previewMsg = previewMsg.substring(0, 150) + "…";
					}
					msg += `: ${previewMsg}`;
				}
				beepLink.textContent = `(${msg})`;
				beepLink.onclick = (e) => {
					e.preventDefault();
					FriendListShowBeep(beepIdx);
				};

				const div = document.createElement("div");
				div.dataset.time = ChatRoomCurrentTime();
				div.dataset.sender = Player.MemberNumber.toString();
				div.classList.add("ChatMessage", "ChatMessageLocalMessage", "ChatMessageNonDialogue", "ChatMessageBeep");
				div.appendChild(replyLink);
				div.appendChild(beepLink);

				document.querySelector(`
					#TextAreaChatLog .ChatMessageBeep[data-sender="${data.MemberNumber}"] > .ReplyButton:not([tabindex='-1']),
					#TextAreaChatLog .ChatMessageBeep[data-target="${data.MemberNumber}"] > .ReplyButton:not([tabindex='-1'])
				`)?.setAttribute("tabindex", "-1");

				ChatRoomAppendChat(div);
			}
		} else if (data.BeepType == "Leash" && ChatRoomLeashPlayer == data.MemberNumber && data.ChatRoomName) {
			if (Player.OnlineSharedSettings && Player.OnlineSharedSettings.AllowPlayerLeashing != false && ( CurrentScreen != "ChatRoom" || !ChatRoomData || (CurrentScreen == "ChatRoom" && ChatRoomData.Name != data.ChatRoomName))) {
				if (ChatRoomCanBeLeashedBy(data.MemberNumber, Player) && ChatSelectGendersAllowed(data.ChatRoomSpace, Player.GetGenders())) {
					ChatRoomJoinLeash = data.ChatRoomName;

					ChatRoomLeave();
					if (CurrentScreen == "ChatRoom") {
						CommonSetScreen("Online", "ChatSearch");
					} else {
						ChatRoomStart(data.ChatRoomSpace, "", null, null, "Introduction", BackgroundsTagList);
					}
				} else {
					ChatRoomLeashPlayer = null;
				}
			}
		}
	}
}


/**
 * Send a beep message to another player
 * @param {number} target - The member number of the target. We must be friend with them
 * @param {string} [msg] - The message to send to the target.
 * @param {object} [options] - Options for the beep message
 * @param {boolean} [options.includeRoom] - If set, we'll include the current room data we're in
 */
function ServerSendBeepMessage(target, msg, options) {
	if (!CommonIsNonNegativeInteger(target)) return;

	ServerSend("AccountBeep", {
		MemberNumber: target,
		BeepType: "",
		IsSecret: options?.includeRoom,
		Message: msg ?? undefined
	});

	FriendListBeepLog.push({
		MemberNumber: target,
		MemberName: Player.FriendNames.get(target) ?? InterfaceTextGet(`ServerBeepUnknownName`).replace('$target', target.toString()),
		ChatRoomName: options?.includeRoom ? ChatRoomData?.Name : undefined,
		ChatRoomSpace: options?.includeRoom ? ChatRoomData?.Space : undefined,
		Sent: true,
		Private: options?.includeRoom ? !ChatRoomData?.Visibility.includes("All") : undefined,
		Time: new Date(),
		Message: msg ?? undefined
	});
}

/**
 * Show a message as a beep
 * @param {string} message
 * @param {number} duration
 * @param {object} [options]
 * @param {(this: HTMLDivElement, event: MouseEvent) => void} [options.onClick]
 * @param {number} [options.memberNumber]
 * @param {string} [options.memberName]
 * @param {string} [options.chatRoomName]
 * @param {boolean} [options.silent]
 */
function ServerShowBeep(message, duration, options) {
	if (!options.silent) {
		NotificationRaise(NotificationEventType.BEEP, {
			memberNumber: options.memberNumber,
			characterName: options.memberName,
			chatRoomName: options.chatRoomName,
			body: message,
			alarmWhenFocused: true,
		});
	}
	ServerBeepQueue.push({
		Message: message,
		Duration: duration,
		ClickHandler: options?.onClick,
		Silent: options?.silent ?? false,
	});
}


/** Draws the last beep sent by the server if the timer is still valid, used during the drawing process */
function ServerDrawBeep() {

	// Grab the old single beep variable and push that into the queue for backward compatibility
	if (ServerBeep.Message !== "") {
		ServerShowBeep(ServerBeep.Message, ServerBeep.Timer - CommonTime(), { chatRoomName: ServerBeep.ChatRoomName });
		ServerBeep = { Message: "", Timer: 0 };
	}

	if (!ServerBeepQueue.length) {
		ElementRemove("beep");
		return;
	}

	const beep = ServerBeepQueue[0];
	if (typeof beep.Timer === "undefined") {
		beep.Timer = CommonTime() + beep.Duration;
	}

	let beepElement = document.getElementById('beep');
	if (beep.Timer > CommonTime()) {
		if (beepElement && beepElement.textContent !== beep.Message) {
			beepElement.remove();
			beepElement = null;
		}
		if (!beepElement) {
			ElementCreate({
				tag: 'div',
				attributes: {
					id: 'beep',
				},
				dataAttributes: { msg: beep.Message },
				classList: ['HideOnPopup'],
				eventListeners: {
					click: function (e) {
						beep.ClickHandler?.(e);
						this.remove();
						ServerBeepQueue.shift();
					},
				},
				children: [
					{
						tag: 'span',
						classList: ['truncated-text'],
						children: [
							beep.Message
						]
					}
				],
				parent: document.body,
			});
		}
		ElementPositionFix('beep', 30, (CurrentScreen == 'ChatRoom') ? 0 : 500, 0, 1000, 50);
		if (document.hasFocus()) {
			NotificationReset(NotificationEventType.BEEP);
		}
	} else {
		if (beepElement) ElementRemove('beep');
		ServerBeepQueue.shift();
	}
}

/** Handles a click on the beep rectangle if mail is included */
function ServerClickBeep() {
}

/**
 * Opens the friendlist from any screen
 * @deprecated Use {@link FriendListShow()};
 */
function ServerOpenFriendList() {
	FriendListShow();
}

// TODO: `data: object` -> `data: ServerAccountOwnershipResponse`
/**
 * Callback used to parse received information related to the player ownership data
 * @param {object} data - Data object containing the Owner name and Ownership object
 * @returns {void} - Nothing
 */
function ServerAccountOwnership(data) {

	// If we get a result for a specific member number, we show that option in the online dialog
	if ((data != null) && (typeof data === "object") && !Array.isArray(data) && (data.MemberNumber != null) && (typeof data.MemberNumber === "number") && (data.Result != null) && (typeof data.Result === "string"))
		if ((CurrentCharacter != null) && (CurrentCharacter.MemberNumber == data.MemberNumber))
			ChatRoomOwnershipOption = data.Result;

	// If we must update the character ownership data
	if ((data != null) && (typeof data === "object") && !Array.isArray(data) && (data.Owner != null) && (typeof data.Owner === "string") && (data.Ownership != null) && (typeof data.Ownership === "object")) {
		Player.Owner = data.Owner;
		Player.Ownership = data.Ownership;
		LoginValidCollar();
	}

	// If we must clear the character ownership data
	if ((data != null) && (typeof data === "object") && !Array.isArray(data) && (data.ClearOwnership === true)) {
		CharacterClearOwnership(Player, false);
	}

	if (DialogMenuMode === "dialog") {
		DialogMenuMapping.dialog.Reload();
	}
}

// TODO: `data: object` -> `data: ServerAccountLovershipResponse`
/**
 * Callback used to parse received information related to the player lovership data
 * @param {object} data - Data object containing the Lovership array
 * @returns {void} - Nothing
 */
function ServerAccountLovership(data) {

	// If we get a result for a specific member number, we show that option in the online dialog
	if ((data != null) && (typeof data === "object") && !Array.isArray(data) && (data.MemberNumber != null) && (typeof data.MemberNumber === "number") && (data.Result != null) && (typeof data.Result === "string"))
		if ((CurrentCharacter != null) && (CurrentCharacter.MemberNumber == data.MemberNumber))
			ChatRoomLovershipOption = data.Result;

	// If we must update the character lovership data
	if ((data != null) && (typeof data === "object") && !Array.isArray(data) && (data.Lovership != null) && (typeof data.Lovership === "object")) {
		Player.Lovership = data.Lovership;
		LoginLoversItems();
	}

	if (DialogMenuMode === "dialog") {
		DialogMenuMapping.dialog.Reload();
	}
}

/**
 * Compares the source account and target account to check if we allow using an item
 *
 * **This function MUST match server's identical function!**
 * @param {Character} Source
 * @param {Character} Target
 * @returns {boolean}
 */
function ServerChatRoomGetAllowItem(Source, Target) {

	// Make sure we have the required data
	if ((Source == null) || (Target == null)) return false;

	// NPC
	if (typeof Target.MemberNumber !== "number") return true;

	// At zero permission level or if target is source or if owner, we allow it
	if ((Target.ItemPermission <= 0) || (Source.MemberNumber == Target.MemberNumber) || Target.IsOwnedByCharacter(Source)) return true;

	// At one, we allow if the source isn't on the blacklist
	if ((Target.ItemPermission == 1) && !Target.HasOnBlacklist(Source)) return true;

	// At two, we allow if the source is Dominant compared to the Target (25 points allowed) or on whitelist or a lover
	if ((Target.ItemPermission == 2) && (!Target.HasOnBlacklist(Source) && ((ReputationCharacterGet(Source, "Dominant") + 25 >= ReputationCharacterGet(Target, "Dominant")) || Target.HasOnWhitelist(Source) || Source.IsLoverOfCharacter(Target)))) return true;

	// At three, we allow if the source is on the whitelist of the Target or a lover
	if ((Target.ItemPermission == 3) && (Target.HasOnWhitelist(Source) || Source.IsLoverOfCharacter(Target))) return true;

	// At four, we allow if the source is a lover
	if ((Target.ItemPermission == 4) && (Source.IsLoverOfCharacter(Target))) return true;

	// No valid combo, we don't allow the item
	return false;
}

/**
 * Namespace with functions for validating {@link ServerAccountDataSynced} properties, converting them into their valid {@link Character} counterpart
 * @satisfies {{ [k in keyof (ServerAccountDataSynced | Character)]?: (arg: Partial<ServerAccountDataSynced[k]>, C: Character) => Character[k] }}
 * @namespace
 */
var ServerAccountDataSyncedValidate = {
	Title: (arg, C) => {
		return TitleList.some(t => t.Name === arg) ? arg : undefined;
	},
	Nickname: (arg, C) => {
		return typeof arg === "string" ? arg : undefined;
	},
	ItemPermission: (arg, C) => {
		return CommonIsInteger(arg, 0, 5) ? /** @type {0 | 1 | 2 | 3 | 4 | 5} */(arg) : 2;
	},
	Difficulty: (arg, C) => {
		return {
			Level: CommonIsInteger(arg?.Level, 0, 5) ? arg.Level : 1,
			LastChange: CommonIsNonNegativeInteger(arg?.LastChange) ? arg.LastChange : undefined,
		};
	},
	ArousalSettings: (arg, C) => {
		return ValidationApplyRecord(arg, C, PreferenceArousalSettingsValidate);
	},
	OnlineSharedSettings: (arg, C) => {
		return ValidationApplyRecord(arg, C, PreferenceOnlineSharedSettingsValidate, true);
	},
	Crafting: (arg, C) => {
		return CraftingDecompressServerData(arg);
	},
	Game: (arg, C) => {
		if (!CommonIsObject(arg)) {
			arg = {};
		}

		// TODO: Validate individual game settings
		return {
			LARP: CommonIsObject(arg.LARP) ? arg.LARP : undefined,
			MagicBattle: CommonIsObject(arg.MagicBattle) ? arg.MagicBattle : undefined,
			GGTS: CommonIsObject(arg.GGTS) ? arg.GGTS : undefined,
			Poker: CommonIsObject(arg.Poker) ? arg.Poker : undefined,
			ClubCard: CommonIsObject(arg.ClubCard) ? arg.ClubCard : undefined,
			Prison: CommonIsObject(arg.Prison) ? arg.Prison : undefined,
		};
	},
	LabelColor: (arg, C) => {
		return CommonIsColor(arg) ? arg : "#ffffff";
	},
	Creation: (arg, C) => {
		return (CommonIsFinite(arg, 0, CurrentTime)) ? arg : undefined;
	},
	Description: (arg, C) => {
		return typeof arg === "string" ? arg : undefined;
	},
	Ownership: (arg, C) => {
		if (!CommonIsObject(arg)) {
			return null;
		}

		const { Name, MemberNumber, Stage, Start } = arg;
		if (
			typeof Name === "string"
			&& CommonIsInteger(MemberNumber, 0)
			&& (Stage === 0 || Stage === 1)
			&& CommonIsInteger(Start, 0, CommonTime())
		) {
			return { Name, MemberNumber, Stage, Start };
		} else {
			return null;
		}
	},
	Lovership: (arg, C) => {
		if (!CommonIsArray(arg)) {
			return [];
		}

		/** @type {Lovership[]} */
		const ret = [];
		for (const lovership of arg) {
			if (!CommonIsObject(lovership) || lovership.BeginDatingOfferedByMemberNumber) {
				continue;
			}

			const { Name, MemberNumber, Stage, Start } = lovership;
			if (typeof Name !== "string") {
				continue;
			}
			if (Name.startsWith("NPC-")) {
				// NPC lovers only have the name; the rest is in their .Event and/or the player's Log
				ret.push({ Name });
			} else if (
				typeof Name === "string"
				&& CommonIsInteger(MemberNumber, 0)
				&& (Stage === 0 || Stage === 1 || Stage === 2)
				&& CommonIsInteger(Start, 0, CommonTime())
			) {
				ret.push({ Name, MemberNumber, Stage, Start });
			}
		}
		return ret;
	},
	Reputation: (arg, C) => {
		if (!CommonIsArray(arg)) {
			return [];
		}

		/** @type {Reputation[]} */
		const ret = [];
		for (const reputation of arg) {
			if (!CommonIsObject(reputation)) {
				continue;
			}

			const { Type, Value } = reputation;
			if (
				CommonIncludes(ReputationValidReputations, Type)
				&& CommonIsInteger(Value, -100, 100)
			) {
				ret.push({ Type, Value });
			}
		}
		return ret;
	},
	WhiteList: (arg, C) => {
		return arg?.filter(i => CommonIsInteger(i, 0)) ?? [];
	},
	BlackList: (arg, C) => {
		return arg?.filter(i => CommonIsInteger(i, 0)) ?? [];
	},
	MapData: (arg, C) => {
		/** @type {ChatRoomMapData} */
		const data = {
			Pos: {
				X: CommonIsObject(arg?.Pos) && CommonIsInteger(arg.Pos?.X, 0, ChatRoomMapViewWidth) ? arg.Pos.X : ChatRoomMapViewWidth / 2,
				Y: CommonIsObject(arg?.Pos) && CommonIsInteger(arg.Pos?.Y, 0, ChatRoomMapViewHeight) ? arg.Pos.Y : ChatRoomMapViewHeight / 2,
			},
			PrivateState: CommonIsObject(arg?.PrivateState) ? arg.PrivateState : {},
		};
		if (CommonIsObject(arg)) {
			delete arg?.Pos;
			delete arg?.PrivateState;
			Object.assign(data, arg);
		}
		return data;
	}
};
