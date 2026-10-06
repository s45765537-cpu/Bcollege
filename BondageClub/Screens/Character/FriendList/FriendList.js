"use strict";
//#region SECTION: VARIABLES
var FriendListBackground = "BrickWall";
/** @deprecated @type {number[]} */
var FriendListConfirmDelete = [];
/** @type {FriendListReturn<any> | null} */
var FriendListReturn = null;
/** @type {FriendListModes} */
var FriendListMode = ["OnlineFriends", "Beeps", "AllFriends"];
var FriendListModeIndex = 0;
/** @type {IFriendListBeepLogMessage[]} */
var FriendListBeepLog = [];
/** @type {Set<number>} */
let FriendListOnlineFriends = new Set();
/** @type {number} MemberNumber of the player to send beep to */
let FriendListBeepTarget = -1;
/** @type {string | null} */
let FriendListBeepChatKey = null;
var FriendListBeepShowRoom = true;
/** @type {FriendListSortingMode} */
let FriendListSortingMode = 'None';
/** @type {FriendListSortingDirection} */
let FriendListSortingDirection = 'Asc';
/** @type {IntersectionObserver | null} */
let FriendListBeepObserver = null;
/** @type {number[]} */
let FriendListBeepChatIndices = [];
/** @type {BeepMessageReplyTo | null} */
let FriendListBeepReplyTarget = null;
/** @type {HTMLElement | null} */
let FriendListBeepReactionPickerEl = null;
/** Display name of the current beep chat partner (set when chat view opens). */
let FriendListBeepChatInterlocutorName = "";
const FriendListBeepMetadataIndicator = "\uf124";
/** Server beep messages are capped at this length, including the metadata trailer. */
const FriendListBeepMessageLimit = 1000;
/** @type {Record<string, FriendListActionDefinition>} */
var FriendListActionDefinitions = {
	delete: {
		id: "delete",
		getIcon: () => "Icons/Remove.png",
		isVisible: () => FriendListModeIndex === 2 || FriendListModeIndex === 0,
		isEnabled: (context) => !!context.canDelete,
		getLabel: () => InterfaceTextGet("Delete"),
		onClick: (context) => FriendListDelete(context.memberNumber),
	},
	add: {
		id: "add",
		getIcon: () => "Icons/Plus.png",
		isVisible: (context) => !!((FriendListModeIndex === 2 || FriendListModeIndex === 0) && !!context.canAdd),
		isEnabled: (context) => !!context.canAdd,
		getLabel: () => InterfaceTextGet("Add"),
		onClick: (context) => {
			ChatRoomListUpdate(Player.FriendList, true, context.memberNumber);
			ServerSend("AccountQuery", { Query: "OnlineFriends" });
		},
	},
	beep: {
		id: "beep",
		getIcon: () => "Icons/Chat.png",
		isVisible: () => true,
		isEnabled: (context) => !!context.canBeep,
		getLabel: () => InterfaceTextGet("Beep"),
		onClick: (context) => FriendListBeep(context.memberNumber),
	},
};

/** @satisfies {{ [key in (ServerChatRoomSpace | "Private")]: FriendListIcon }} */
const FriendListIconMapping = {
	"": { src: "./Icons/FemaleInvert.png", tooltipKey: "TypeFemale", sortKey: "F " },
	M: { src: "./Icons/MaleInvert.png", tooltipKey: "TypeMale", sortKey: "M " },
	X: { src: "./Icons/GenderInvert.png", tooltipKey: "TypeMixed", sortKey: "X" },
	Asylum: { src: "./Icons/Asylum.png", tooltipKey: "TypeAsylum", sortKey: "A " },
	Private: { src: "./Icons/PrivateInvert.png", tooltipKey: "TypePrivate", sortKey: "P" },
};

/**
 * Note that the `Caption` field is only initialized in {@link FriendListLoad}..
 * @type {Record<FriendListRelationType, { Caption?: string, Icon: string, SortingPriority: number }>}
 */
const FriendListTypeData = {
	Owner: {
		Icon: './Icons/Owner.png',
		SortingPriority: 1,
	},
	Lover: {
		Icon: './Icons/Lover.png',
		SortingPriority: 2,
	},
	Submissive: {
		Icon: './Icons/Family.png',
		SortingPriority: 3,
	},
	Friend: {
		Icon: './Icons/FriendList.png',
		SortingPriority: 4,
	},
	Pending: {
		Icon: './Icons/Wait.png',
		SortingPriority: 5,
	},
};

const FriendListAutoRefresh = {
	interval: 30_000,
	nextRefresh: 0,
};

const FriendListIDs = Object.freeze({
	root: 'friend-list-subscreen',
	navBar: 'friend-list-nav-bar',
	header: 'friend-list-header',
	friendList: 'friend-list',
	friendListTable: 'friend-list-table',

	navButtons: 'friend-list-buttons',
	modeTitle: 'friend-list-mode-title',
	searchInput: 'friend-list-search-input',

	btnAutoRefresh: 'friend-list-button-auto-refresh',
	btnAddFriend: 'friend-list-button-add-friend',
	btnRefresh: 'friend-list-button-refresh',
	btnPrev: 'friend-list-button-prev',
	btnNext: 'friend-list-button-next',
	btnExit: 'friend-list-button-exit',

	btnResetSorting: 'friend-list-reset-sorting',

	beepList: 'friend-list-beep-dialog',
	beepTextArea: 'friend-list-beep-textarea',
	beepInputRow: 'friend-list-beep-chat-input-row',
	beepMessages: 'friend-list-beep-chat-log',
	beepChatWrapper: 'friend-list-beep-chat-log-wrapper',
	beepScrollBtn: 'friend-list-beep-scroll-btn',
	beepUnreadBadge: 'friend-list-beep-unread-badge',
	beepNewMessageDivider: 'friend-list-beep-new-message-divider',
	beepReplyPreview: 'friend-list-beep-reply-preview-row',
});
//#endregion !SECTION: VARIABLES

//#region SECTION: SCREEN FUNCTIONS
/** @type {ScreenLoadHandler} */
async function FriendListLoad() {
	// Initialize the relationship type captions
	for (const [relationType, entry] of CommonEntries(FriendListTypeData)) {
		entry.Caption = TextGet(`Type${relationType}`);
	}
	const mode = FriendListMode[FriendListModeIndex];

	const root = document.getElementById(FriendListIDs.root) ?? ElementCreate({
		tag: 'div',
		attributes: {
			id: FriendListIDs.root,
			'screen-generated': 'FriendList',
			"aria-busy": "true",
		},
		classList: ['HideOnPopup'],
		dataAttributes: {
			mode: mode
		},
		parent: document.body,
	});

	FriendListSortingMode = 'None';
	FriendListSortingDirection = 'Asc';

	await TextScreenCache?.loadedPromise;
	root.replaceChildren(
		ElementCreate({
			tag: "div",
			attributes: {
				id: FriendListIDs.navBar
			},
			children: [
				{
					tag: "span",
					attributes: {
						id: FriendListIDs.modeTitle,
					},
					children: [
						TextGet(mode),
					]
				},
				{
					tag: 'input',
					attributes: {
						id: FriendListIDs.searchInput,
						type: 'search',
						maxLength: 100,
					},
					eventListeners: {
						/**
						* @this {HTMLInputElement}
						*/
						input: function () {
							FriendListSearchByProperties(this.value);
						},
					},
				},
				ElementMenu.Create(FriendListIDs.navButtons, [
					ElementButton.Create(
						FriendListIDs.btnAutoRefresh,
						FriendListToggleAutoRefresh,
						{
							tooltip: TextGet("AutoRefresh"),
							role: "checkbox",
							image: "Icons/Wait.png"
						},
						{
							button: {
								classList: ['friend-list-button'],
								attributes: { "aria-checked": Player.OnlineSettings.FriendListAutoRefresh.toString() },
							}
						}
					),
					ElementButton.Create(
						FriendListIDs.btnRefresh,
						() => {
							ServerSend("AccountQuery", { Query: "OnlineFriends" });
						},
						{
							tooltip: TextGet("Refresh"),
							image: "Icons/Reset.png"
						},
						{
							button: {
								classList: ['friend-list-button'],
							}
						}
					),
					ElementButton.Create(
						FriendListIDs.btnAddFriend,
						() => {
							FriendListAddFriends();
						},
						{
							tooltip: TextGet("AddFriends"),
							image: "Icons/Plus.png",
						},
						{
							button: {
								classList: ['friend-list-button'],
							}
						}
					),
					ElementButton.Create(
						FriendListIDs.btnPrev,
						() => {
							FriendListChangeMode(FriendListModeIndex - 1);
						},
						{
							tooltip: TextGet("PrevMode"),
							image: "Icons/Prev.png"
						},
						{
							button: {
								classList: ['friend-list-button'],
							}
						}
					),
					ElementButton.Create(
						FriendListIDs.btnNext,
						() => {
							FriendListChangeMode(FriendListModeIndex + 1);
						},
						{
							tooltip: TextGet("NextMode"),
							image: "Icons/Next.png"
						},
						{
							button: {
								classList: ['friend-list-button'],
							}
						}
					),
					ElementButton.Create(
						FriendListIDs.btnExit,
						() => {
							FriendListExit();
						},
						{
							tooltip: TextGet("Exit"),
							image: "Icons/Exit.png"
						},
						{
							button: {
								classList: ['friend-list-button'],
							}
						}
					)
				])
			]
		}),
		ElementCreate({
			tag: "hr",
			attributes: {
				id: 'friend-list-nav-hr'
			}
		}),
		ElementButton.Create(
			FriendListIDs.btnResetSorting,
			() => {
				FriendListChangeSortingMode('None');
			},
			{
				tooltip: TextGet("ResetSorting"),
				tooltipPosition: 'right',
				image: "Icons/Remove.png"
			},
			{
				button: {
					classList: ['friend-list-button'],
				}
			}
		),
		ElementCreate({
			tag: 'table',
			attributes: {
				id: FriendListIDs.friendListTable,
				"aria-labelledby": FriendListIDs.modeTitle,
			},
			children: [
				{
					tag: 'thead',
					attributes: {
						id: FriendListIDs.header
					},
					children: [
						{
							tag: "tr",
							classList: ["friend-list-row"],
							children: [
								ElementButton.Create(
									"friend-list-member-name",
									() => FriendListChangeSortingMode("MemberName"),
									{ noStyling: true },
									{
										button: {
											classList: ['friend-list-column', 'friend-list-link'],
											attributes: { role: "columnheader" },
										}
									},
								),
								ElementButton.Create(
									"friend-list-member-number",
									() => FriendListChangeSortingMode("MemberNumber"),
									{ noStyling: true },
									{
										button: {
											classList: ['friend-list-column', 'friend-list-link'],
											attributes: { role: "columnheader" },
										}
									},
								),
								ElementButton.Create(
									"friend-list-chat-room-type",
									() => FriendListChangeSortingMode("ChatRoomType"),
									{ noStyling: true },
									{
										button: {
											classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-online-friends-content', 'fl-beeps-content'],
											attributes: { role: "columnheader" },
										}
									},
								),
								ElementButton.Create(
									"friend-list-chat-room-name",
									() => FriendListChangeSortingMode("ChatRoomName"),
									{ noStyling: true },
									{
										button: {
											classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-online-friends-content', 'fl-beeps-content'],
											attributes: { role: "columnheader" },
										}
									},
								),
								ElementButton.Create(
									"friend-list-chat-room-count",
									() => FriendListChangeSortingMode("ChatRoomMemberCount"),
									{ noStyling: true },
									{
										button: {
											classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-online-friends-content', 'fl-beeps-content'],
											attributes: { role: "columnheader" },
										}
									},
								),
								ElementButton.Create(
									"friend-list-relation-type",
									() => FriendListChangeSortingMode("RelationType"),
									{ noStyling: true },
									{
										button: {
											classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-all-friends-content'],
											attributes: { role: "columnheader" },
										}
									},
								),
								{
									tag: "th",
									classList: ['friend-list-column', 'mode-specific-content', 'fl-beeps-content'],
									attributes: { scope: "col" },
									children: [TextGet("ActionRead")],
								},
								{
									tag: "th",
									classList: ['friend-list-column', 'mode-specific-content', 'fl-all-friends-content', 'fl-online-friends-content'],
									attributes: { scope: "col" },
									children: [TextGet("ActionActions")],
								},
							],
						},
					]
				},
				{
					tag: 'hr',
					attributes: {
						id: 'friend-list-header-hr'
					}
				},
				{
					tag: 'tbody',
					classList: ["scroll-box"],
					attributes: {
						id: FriendListIDs.friendList
					},
				}
			]
		}),
	);

	root.setAttribute("aria-busy", "false");
	ServerSend("AccountQuery", { Query: "OnlineFriends" });
}

/** @type {ScreenResizeHandler} */
function FriendListResize() {
	ElementPositionFix(FriendListIDs.root, 36, 0, 0, 2000, 1000);
	if (FriendListBeepTarget !== -1) {
		if (ElementWrap(FriendListIDs.beepList))
			ElementSetFontSize(FriendListIDs.beepList, "auto");
	}
	FriendListRepositionActionsMenu();
}

/** @type {ScreenRunHandler} */
function FriendListRun() {
}

/** @type {ScreenDrawHandler} */
function FriendListDraw() {
	if (Player.OnlineSettings.FriendListAutoRefresh && CommonTime() >= FriendListAutoRefresh.nextRefresh && ServerIsConnected) {
		FriendListAutoRefresh.nextRefresh = CommonTime() + FriendListAutoRefresh.interval;
		ServerSend("AccountQuery", { Query: "OnlineFriends" });
	}
}

/** @type {MouseEventListener} */
function FriendListClick() {
}

/** @type {KeyboardEventListener} */
function FriendListKeyDown(event) {
	const beepTextArea = /** @type {HTMLTextAreaElement} */(document.getElementById(FriendListIDs.beepTextArea));
	const beepTextAreaHasFocus = beepTextArea && document.activeElement === beepTextArea;

	if (beepTextAreaHasFocus) {
		if (event.key === 'Enter' && CommonKey.IsPressed(event, "Enter", CommonKey.CTRL)) {
			FriendListBeepMenuSend();
			return true;
		}
	}

	return false;
}

/** @type {ScreenUnloadHandler} */
function FriendListUnload() {
	const beepMenu = document.getElementById(FriendListIDs.beepList);
	if (beepMenu) {
		FriendListBeepMenuClose();
		return;
	}
	ElementRemove(FriendListIDs.root);
	FriendListModeIndex = 0;
}

/**
 * @satisfies {ScreenExitHandler}
 * @return {SafePromise<void>}
 */
async function FriendListExit() {
	const beepTextArea = /** @type {HTMLTextAreaElement} */(document.getElementById(FriendListIDs.beepTextArea));

	if (FriendListBeepTarget !== -1 || beepTextArea) {
		FriendListBeepMenuClose();
		return;
	}

	let screenPromise;
	document.querySelectorAll(".friend-list-actions-menu.friend-list-actions-menu-detached")
		.forEach((menu) => ElementRemove(menu));
	if (FriendListReturn != null && FriendListReturn.Screen != "FriendList") {
		if (FriendListReturn?.Screen === "ChatRoom" && FriendListReturn?.hasScrolledChat) {
			ElementScrollToEnd("TextAreaChatLog");
		}
		ElementToggleGeneratedElements(FriendListReturn.Screen, true);
		screenPromise = CommonSetScreen(FriendListReturn.Module, FriendListReturn.Screen);
	} else {
		screenPromise = CommonSetScreen("Character", "InformationSheet");
	}
	FriendListReturn = null;
	FriendListOnlineFriends.clear();
	return screenPromise;
}
//#endregion !SECTION: SCREEN FUNCTIONS

//#region SECTION: BEEP

/**
 * Ensures {@link IFriendListBeepLogMessage.Id} is set (from metadata or a new id).
 * @param {IFriendListBeepLogMessage} beep
 * @returns {string}
 */
function FriendListBeepEnsureMessageId(beep) {
	if (beep.Id) return beep.Id;
	const parsed = FriendListBeepParseMessage(beep.Message ?? "");
	const mId = parsed.metadata?.messageId;
	if (typeof mId === "string" && mId.length > 0) {
		beep.Id = mId;
		return beep.Id;
	}
	beep.Id = CommonGenerateUniqueID();
	return beep.Id;
}

/**
 * Generates a chat key from a beep message
 * @param {IFriendListBeepLogMessage} beep
 * @returns {string}
 */
function FriendListBeepGetChatKeyFromBeep(beep) {
	if (beep.MemberNumber != null) return `member:${beep.MemberNumber}`;
	return `npc:${beep.MemberName ?? TextGet("Unknown")}`;
}

/**
 * Appends metadata to a beep message
 * @param {string} message
 * @param {BeepMessageMetadata} metadata
 * @returns {string}
 */
function BeepMessageAppendMetadata(message, metadata) {
	if (typeof message !== "string") message = "";
	if (!CommonIsObject(metadata)) return message;
	return `${message}\n${FriendListBeepMetadataIndicator}${JSON.stringify(metadata)}`;
}

/**
 * Parses a beep message with appended metadata
 * @param {string} rawMessage
 * @returns {{ text: string, metadata: BeepMessageMetadata | null }}
 */
function FriendListBeepParseMessage(rawMessage) {
	if (typeof rawMessage !== "string") return { text: "", metadata: null };

	const separator = FriendListBeepMetadataIndicator;
	const separatorIndex = rawMessage.lastIndexOf(separator);
	if (separatorIndex === -1) return { text: rawMessage, metadata: null };

	const text = rawMessage.slice(0, separatorIndex).trimEnd();
	const metadataRaw = rawMessage.slice(separatorIndex + separator.length);

	try {
		const metadata = JSON.parse(metadataRaw);
		if (CommonIsObject(metadata)) {
			return { text, metadata };
		}
	} catch {
		// Fall through to returning the raw message when metadata is invalid
	}

	return { text: rawMessage, metadata: null };
}

/**
 * Fits a beep payload into {@link FriendListBeepMessageLimit}.
 * A valid metadata trailer is kept intact; only the visible text is shortened.
 * @param {string} message
 * @returns {string}
 */
function FriendListBeepLimitMessageText(message) {
	if (typeof message !== "string" || message.length <= FriendListBeepMessageLimit) return message;

	const separatorIndex = message.lastIndexOf(FriendListBeepMetadataIndicator);
	if (separatorIndex === -1) return message.slice(0, FriendListBeepMessageLimit);

	const parsed = FriendListBeepParseMessage(message);
	if (!parsed.metadata) return message.slice(0, FriendListBeepMessageLimit);

	const trailer = `\n${message.slice(separatorIndex)}`;
	const room = FriendListBeepMessageLimit - trailer.length;
	if (room < 0) return parsed.text.slice(0, FriendListBeepMessageLimit);
	return `${parsed.text.slice(0, room)}${trailer}`;
}

/**
 * @param {IFriendListBeepLogMessage | null | undefined} beep
 * @returns {boolean}
 */
function FriendListBeepIsReaction(beep) {
	return FriendListBeepParseMessage(beep?.Message ?? "").metadata?.messageType === "Reaction";
}

/**
 * A reaction is stored in the beep log but is not a message the player still needs to read.
 * @param {IFriendListBeepLogMessage | null | undefined} beep
 * @returns {boolean}
 */
function FriendListBeepIsUnread(beep) {
	return !!beep && !beep.Sent && beep.Read === false && !FriendListBeepIsReaction(beep);
}

/**
 * A sent message means the earlier incoming beeps in that chat have been seen.
 * @param {number} memberNumber
 */
function FriendListBeepMarkReadBeforeSend(memberNumber) {
	const chatKey = `member:${memberNumber}`;
	for (const beep of FriendListBeepLog) {
		if (FriendListBeepGetChatKeyFromBeep(beep) !== chatKey) continue;
		if (FriendListBeepIsUnread(beep)) beep.Read = true;
	}
}

/**
 * Formats a beep message for display
 * @param {string} senderName
 * @param {{ text: string, metadata: BeepMessageMetadata | null }} parsed
 * @returns {{ text: string, messageType?: BeepMessageType }}
 */
function FriendListBeepFormatMessage(senderName, parsed) {
	const rawText = parsed.text ?? "";
	const messageType = parsed.metadata?.messageType;
	if (messageType === "Reaction") {
		return { text: "", messageType };
	}
	if (messageType === "Reply") {
		return { text: rawText, messageType };
	}
	const wrapMatch = rawText.match(/^(\*{1,2})([\s\S]*)\1$/);
	const strippedText = (wrapMatch
		? wrapMatch[2]
		: rawText.replace(/^\*(?!\*)/, "")
	).trim();

	if (messageType === "Emote") {
		return { text: `*${senderName} ${strippedText}*`, messageType };
	}
	if (messageType === "Action") {
		return { text: `*${strippedText}*`, messageType };
	}

	return { text: rawText, messageType };
}

/**
 * Latest beep in a chat that is an actual message.
 * A reaction does not carry a room, space, or privacy.
 * @param {number[]} messageIndices
 * @returns {IFriendListBeepLogMessage | null}
 */
function FriendListBeepLastMessage(messageIndices) {
	for (const indice of messageIndices.slice().reverse()) {
		const beep = FriendListBeepLog[indice];
		if (beep && !FriendListBeepIsReaction(beep)) return beep;
	}
	return null;
}

/**
 * Room the beep was sent from, when the sender included it.
 * @param {IFriendListBeepLogMessage} beep
 * @returns {string}
 */
function FriendListBeepRoomCaption(beep) {
	const roomName = beep.ChatRoomName;
	if (!roomName) return "";
	let caption = `${InterfaceTextGet("InRoom")} "${ChatSearchMuffle(roomName)}"`;
	if (beep.ChatRoomSpace === "Asylum") {
		caption += ` ${InterfaceTextGet("InAsylum")}`;
	}
	return caption;
}

//#region SECTION: BEEP MESSAGE ACTIONS

/** @type {Set<string>} */
var FriendListBeepReactionEmojis = new Set([
	"👍",
	"👎",
	"❤️",
	"💔",
	"😆",
	"😂",
	"😮",
	"😢",
	"🔥",
	"😳",
	"🥺",
	"😈",
	"🔗",
]);

/** @type {Record<string, FriendListBeepActionDefinition>} */
var FriendListBeepActionDefinitions = {
	reply: {
		id: "reply",
		getIcon: () => "Icons/Reply.svg",
		getLabel: () => TextGet("Reply"),
		isVisible: () => true,
		isEnabled: () => CommonIsNonNegativeInteger(FriendListBeepTarget),
		onClick: (ctx) => FriendListBeepStartReply(ctx.beepIndex),
	},
	copy: {
		id: "copy",
		getIcon: () => "Icons/Copy.svg",
		getLabel: () => TextGet("Copy"),
		isVisible: () => true,
		isEnabled: (ctx) => !!FriendListBeepFormatMessage(ctx.senderName, FriendListBeepParseMessage(ctx.beep.Message ?? "")).text,
		onClick: (ctx) => {
			const formatted = FriendListBeepFormatMessage(ctx.senderName, FriendListBeepParseMessage(ctx.beep.Message ?? ""));
			FriendListBeepCopyMessage(formatted.text || FriendListBeepParseMessage(ctx.beep.Message ?? "").text || "");
		},
	},
	react: {
		id: "react",
		getIcon: () => "Icons/Theater.png",
		getLabel: () => TextGet("React"),
		isVisible: () => true,
		isEnabled: () => CommonIsNonNegativeInteger(FriendListBeepTarget)
			&& FriendListOnlineFriends?.has(FriendListBeepTarget) === true,
		onClick: (ctx, ev) => {
			ev.stopPropagation();
			const btn = /** @type {HTMLButtonElement | null} */ (ev.currentTarget instanceof HTMLButtonElement ? ev.currentTarget : null);
			FriendListBeepToggleReactionPicker(ctx.beepIndex, btn);
		},
	},
};


/**
 * @param {FriendListBeepActionDefinition} action
 * @returns {boolean} Whether the action was registered successfully
 */
function FriendListBeepRegisterAction(action) {
	if (FriendListBeepActionDefinitions[action.id]) {
		console.warn(`Beep action "${action.id}" already registered`);
		return false;
	}
	FriendListBeepActionDefinitions[action.id] = action;

	return true;
}

/**
 * @param {number} beepIndex
 * @returns {FriendListBeepActionContext}
 */
function FriendListBeepBuildActionContext(beepIndex) {
	const beep = FriendListBeepLog[beepIndex];
	const peerName = FriendListBeepChatInterlocutorName || TextGet("Unknown");
	const senderName = (beep.Sent ? Player.Name : (beep.MemberName ?? peerName)) ?? TextGet("Unknown");
	return {
		beepIndex,
		beep,
		senderName,
		isOwn: !!beep.Sent,
	};
}

/**
 * @param {number[]} messageIndices
 * @returns {Map<string, Map<string, { count: number, selfHas: boolean }>>}
 */
function FriendListBeepCollectReactionState(messageIndices) {
	/** @type {Map<string, Map<string, Set<string>>>} */
	const byTarget = new Map();

	for (const index of messageIndices) {
		const beep = FriendListBeepLog[index];
		if (!beep?.Message) continue;
		const parsed = FriendListBeepParseMessage(beep.Message);
		if (parsed.metadata?.messageType !== "Reaction" || !parsed.metadata.reactionTo) continue;
		const targetId = parsed.metadata.reactionTo;
		const emoji = (parsed.metadata.reactionEmoji ?? parsed.text ?? "").trim();
		if (!emoji || !FriendListBeepReactionEmojis.has(emoji)) continue;
		const senderKey = beep.Sent ? "self" : `u:${beep.MemberNumber ?? beep.MemberName ?? "?"}`;
		if (!byTarget.has(targetId)) byTarget.set(targetId, new Map());
		const emojiMap = byTarget.get(targetId);
		if (!emojiMap) continue;
		if (!emojiMap.has(emoji)) emojiMap.set(emoji, new Set());
		const set = emojiMap.get(emoji);
		if (!set) continue;
		if (parsed.metadata.reactionRemove) set.delete(senderKey);
		else set.add(senderKey);
	}

	/** @type {Map<string, Map<string, { count: number, selfHas: boolean }>>} */
	const out = new Map();
	for (const [targetId, emojiMap] of byTarget) {
		/** @type {Map<string, { count: number, selfHas: boolean }>} */
		const row = new Map();
		for (const [emoji, senders] of emojiMap) {
			if (senders.size === 0) continue;
			row.set(emoji, { count: senders.size, selfHas: senders.has("self") });
		}
		if (row.size > 0) out.set(targetId, row);
	}
	return out;
}

/**
 * @param {string} text
 */
function FriendListBeepCopyMessage(text) {
	if (!text) return;
	CommonClipboardWrite(text, (result) => {
		if (!result.ok) return ToastManager.info(TextGet("CopyFailed"), { duration: 3000 });

		ToastManager.info(TextGet("CopyDone"), { duration: 3000 });
	});
}

/**
 * @param {string} id
 * @returns {string}
 */
function FriendListBeepEscapeDataId(id) {
	if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(id);
	return id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * @param {string} id
 */
function FriendListBeepScrollToMessage(id) {
	const container = document.getElementById(FriendListIDs.beepMessages);
	if (!container || !id) return;
	const el = container.querySelector(`[data-beep-id="${FriendListBeepEscapeDataId(id)}"]`);
	if (!(el instanceof HTMLElement)) return;
	el.scrollIntoView({ behavior: "smooth", block: "center" });
	const msgEl = el.querySelector(".friend-list-beep-chat-message");
	const highlightEl = msgEl instanceof HTMLElement ? msgEl : el;
	highlightEl.classList.add("friend-list-beep-chat-highlight");
	window.setTimeout(() => highlightEl.classList.remove("friend-list-beep-chat-highlight"), 1600);
}

/**
 * @param {string} formattedText
 * @param {{ text: string }} parsed
 * @param {number} [maxLen]
 */
function FriendListBeepSnippetFromMessage(formattedText, parsed, maxLen = 120) {
	let t = (formattedText || parsed.text || "").replace(/\s+/g, " ").trim();
	if (t.length > maxLen) t = `${t.slice(0, maxLen - 1)}…`;
	return t;
}

/**
 * @param {number} beepIndex
 */
function FriendListBeepStartReply(beepIndex) {
	const beep = FriendListBeepLog[beepIndex];
	if (!beep) return;
	FriendListBeepEnsureMessageId(beep);
	const ctx = FriendListBeepBuildActionContext(beepIndex);
	const parsed = FriendListBeepParseMessage(beep.Message ?? "");
	const formatted = FriendListBeepFormatMessage(ctx.senderName, parsed);
	FriendListBeepReplyTarget = {
		id: /** @type {string} */ (beep.Id),
		senderName: ctx.senderName,
		snippet: FriendListBeepSnippetFromMessage(formatted.text, parsed),
	};
	FriendListBeepRenderReplyPreview();
	const ta = /** @type {HTMLTextAreaElement | null} */ (ElementWrap(FriendListIDs.beepTextArea));
	ta?.focus();
}

function FriendListBeepCancelReply() {
	FriendListBeepReplyTarget = null;
	ElementRemove(FriendListIDs.beepReplyPreview);
}

function FriendListBeepRenderReplyPreview() {
	if (!FriendListBeepReplyTarget) return;
	const inputWrap = document.querySelector(".friend-list-beep-chat-input");
	if (!inputWrap) return;
	ElementRemove(FriendListIDs.beepReplyPreview);
	const row = ElementCreate({
		tag: "div",
		attributes: { id: FriendListIDs.beepReplyPreview },
		classList: ["friend-list-beep-reply-preview", "no-select"],
		children: [
			{
				tag: "div",
				classList: ["friend-list-beep-reply-preview-text"],
				children: [
					TextSubstitute("ReplyTo", { $memberName: FriendListBeepReplyTarget.senderName }).join(""),
					": ",
					FriendListBeepReplyTarget.snippet,
				],
			},
			ElementButton.Create(
				"friend-list-beep-reply-preview-cancel",
				() => FriendListBeepCancelReply(),
				{
					image: "Icons/Remove.png",
					noStyling: true,
					tooltip: TextGet("CancelReply"),
					labelPosition: "center",
				},
				{
					button: { classList: ["friend-list-beep-reply-preview-cancel"] },
				},
			),
		],
	});
	inputWrap.insertBefore(row, inputWrap.firstChild);
}

/** @type {((ev: PointerEvent) => void) | null} */
let FriendListBeepReactionPickerPointerDownListener = null;

function FriendListBeepDetachReactionPickerDismiss() {
	if (FriendListBeepReactionPickerPointerDownListener) {
		document.removeEventListener("pointerdown", FriendListBeepReactionPickerPointerDownListener, true);
		FriendListBeepReactionPickerPointerDownListener = null;
	}
}

function FriendListBeepCloseReactionPicker() {
	FriendListBeepDetachReactionPickerDismiss();
	if (FriendListBeepReactionPickerEl) {
		FriendListBeepReactionPickerEl.remove();
		FriendListBeepReactionPickerEl = null;
	}
}

/**
 * @param {PointerEvent} ev
 */
function FriendListBeepReactionPickerPointerDown(ev) {
	if (!FriendListBeepReactionPickerEl) return;
	const target = ev.target;
	if (!(target instanceof Element)) return;
	if (FriendListBeepReactionPickerEl.contains(target)) return;
	if (target.closest(".friend-list-beep-chat-toolbar-react")) return;
	FriendListBeepCloseReactionPicker();
}

/**
 * Closes the reaction picker when focus is no longer on it or the react trigger (toggle handles the latter).
 * @this {HTMLElement}
 * @param {FocusEvent} ev
 */
function FriendListBeepReactionPickerFocusOut(ev) {
	const to = ev.relatedTarget;
	if (
		to instanceof Node
		&& (this.contains(to) || (to instanceof Element && !!to.closest(".friend-list-beep-chat-toolbar-react")))
	) {
		return;
	}
	FriendListBeepCloseReactionPicker();
}

/**
 * @param {number} beepIndex
 * @param {HTMLButtonElement | null} anchor
 */
function FriendListBeepToggleReactionPicker(beepIndex, anchor) {
	const beep = FriendListBeepLog[beepIndex];
	if (!beep) return;
	FriendListBeepEnsureMessageId(beep);
	const targetId = /** @type {string} */ (beep.Id);
	if (FriendListBeepReactionPickerEl?.dataset.targetBeepIndex === String(beepIndex)) {
		FriendListBeepCloseReactionPicker();
		return;
	}
	FriendListBeepCloseReactionPicker();

	const picker = ElementCreate({
		tag: "div",
		attributes: {
			id: "friend-list-beep-reaction-picker",
			role: "dialog",
			"aria-label": TextGet("ReactionPickerTitle"),
			tabindex: -1,
		},
		classList: ["friend-list-beep-reaction-picker", "no-select"],
		dataAttributes: { targetBeepIndex: beepIndex.toString(), targetId },
		children: [
			{
				tag: "div",
				classList: ["friend-list-beep-reaction-picker-title"],
				children: [TextGet("ReactionPickerTitle")],
			},
			{
				tag: "div",
				classList: ["friend-list-beep-reaction-picker-grid"],
				children: [...FriendListBeepReactionEmojis].map((emoji, index) =>
					ElementButton.Create(
						`friend-list-beep-react-opt-${index}-${beepIndex}`,
						() => {
							const state = FriendListBeepCollectReactionState(FriendListBeepChatIndices).get(targetId)?.get(emoji);
							const remove = !!state?.selfHas;
							FriendListBeepSendReaction(targetId, emoji, remove);
							FriendListBeepCloseReactionPicker();
						},
						{
							label: emoji,
							noStyling: true,
							labelPosition: "center",
						},
						{
							button: { classList: ["friend-list-beep-reaction-picker-emoji"] },
						},
					),
				),
			},
		],
		eventListeners: {
			focusout: FriendListBeepReactionPickerFocusOut,
		},
		/* Modal <dialog> uses the top layer; pickers on document.body paint underneath. Host inside the dialog. */
		parent: ElementWrap(FriendListIDs.beepList) ?? document.body,
	});
	FriendListBeepReactionPickerEl = picker;
	FriendListBeepReactionPickerPointerDownListener = FriendListBeepReactionPickerPointerDown;
	document.addEventListener("pointerdown", FriendListBeepReactionPickerPointerDownListener, true);
	picker.focus();

	if (anchor) {
		const dialog = picker.parentElement instanceof HTMLElement ? picker.parentElement : null;
		const log = document.getElementById(FriendListIDs.beepMessages);
		const anchorRect = anchor.getBoundingClientRect();
		const limit = (log ?? dialog)?.getBoundingClientRect() ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight);
		const dialogRect = dialog?.getBoundingClientRect();
		const margin = 4;
		/* backdrop-filter on the beep dialog makes it the containing block for position:fixed */
		const originX = dialogRect ? dialogRect.left : 0;
		const originY = dialogRect ? dialogRect.top : 0;
		const boxLeft = limit.left - originX;
		const boxTop = limit.top - originY;
		const boxRight = limit.right - originX;
		const boxBottom = limit.bottom - originY;
		const maxW = Math.max(0, boxRight - boxLeft - margin * 2);
		const maxH = Math.max(0, boxBottom - boxTop - margin * 2);
		picker.style.maxWidth = `${maxW}px`;
		picker.style.maxHeight = `${maxH}px`;
		picker.style.overflow = picker.scrollHeight > maxH + 1 ? "auto" : "visible";

		const pw = picker.offsetWidth;
		const ph = picker.offsetHeight;
		let left = anchorRect.right - originX - pw;
		let top = anchorRect.bottom - originY + 4;
		if (top + ph > boxBottom - margin) {
			top = anchorRect.top - originY - ph - 4;
		}
		left = Math.min(Math.max(boxLeft + margin, left), Math.max(boxLeft + margin, boxRight - pw - margin));
		top = Math.min(Math.max(boxTop + margin, top), Math.max(boxTop + margin, boxBottom - ph - margin));

		picker.style.position = "fixed";
		picker.style.left = `${left}px`;
		picker.style.top = `${top}px`;
		picker.style.zIndex = "1";
	}
}

/**
 * @param {string} targetId
 * @param {string} emoji
 * @param {boolean} remove
 */
function FriendListBeepSendReaction(targetId, emoji, remove) {
	if (!CommonIsNonNegativeInteger(FriendListBeepTarget) || !FriendListBeepReactionEmojis.has(emoji)) return;
	ServerSendBeepMessage(FriendListBeepTarget, emoji, {
		includeRoom: false,
		messageType: "Reaction",
		reactionTo: targetId,
		reactionEmoji: emoji,
		reactionRemove: remove,
	});
	if (FriendListBeepChatKey) {
		FriendListBeep(-1, null, FriendListBeepChatKey);
	}
}

/**
 * @param {number} beepIndex
 * @returns {HTMLElement}
 */
function FriendListBeepBuildActionBar(beepIndex) {
	const ctx = FriendListBeepBuildActionContext(beepIndex);
	const actions = Object.values(FriendListBeepActionDefinitions).filter((a) => (a.isVisible ? a.isVisible(ctx) : true));
	/** @type {HTMLElement[]} */
	const actionButtons = actions.map((action) => {
		const enabled = action.isEnabled ? action.isEnabled(ctx) : true;
		const icon = action.getIcon ? action.getIcon(ctx) : undefined;
		return ElementButton.Create(
			`friend-list-beep-act-${action.id}-${beepIndex}`,
			function (/** @type {PointerEvent} */ ev) {
				if (!enabled) return;
				action.onClick(ctx, ev);
			},
			{
				disabled: !enabled,
				image: icon,
				tooltip: action.getLabel(ctx),
				noStyling: true,
				labelPosition: "center",
				role: "menuitem",
			},
			{
				button: {
					classList: [
						"friend-list-beep-chat-toolbar-btn",
						action.id === "react" ? "friend-list-beep-chat-toolbar-react" : undefined,
					].filter(Boolean),
					attributes: { "data-action": action.id },
				},
			},
		);
	});
	return ElementMenu.Create(
		null,
		actionButtons,
		{ role: "menubar" },
		{
			menu: {
				classList: ["friend-list-beep-chat-actions", "no-select"],
			},
		},
	);
}

//#endregion !SECTION: BEEP MESSAGE ACTIONS

/**
 * Builds a map of chat keys to chat data
 * @returns {Map<string, FriendListBeepChat>}
 */
function FriendListBeepBuildChatMap() {
	/** @type {Map<string, FriendListBeepChat>} */
	const chatMap = new Map();

	FriendListBeepLog.forEach((beep, index) => {
		const chatKey = FriendListBeepGetChatKeyFromBeep(beep);
		const memberNumber = beep.MemberNumber;
		const memberName = memberNumber != null
			? (Player.FriendNames.get(memberNumber) ?? beep.MemberName ?? TextGet("Unknown"))
			: (beep.MemberName ?? TextGet("Unknown"));

		let chat = chatMap.get(chatKey);
		if (!chat) {
			chat = {
				chatKey,
				memberNumber,
				memberName,
				messageIndices: [],
				lastIndex: index,
				lastTime: beep.Time,
				hasMessage: !!beep.Message,
			};
			chatMap.set(chatKey, chat);
		}

		chat.messageIndices.push(index);
		if (beep.Time > chat.lastTime) {
			chat.lastTime = beep.Time;
			chat.lastIndex = index;
		}
		if (beep.Message) chat.hasMessage = true;
		if (memberNumber != null) chat.memberNumber = memberNumber;
		if (memberName) chat.memberName = memberName;
	});

	return chatMap;
}

/**
 * Creates beep chat menu for an interlocutor
 * @param {string} chatKey
 */
function FriendListBeepChat(chatKey) {
	FriendListBeep(-1, null, chatKey);
}

/**
 * Opens the beep chat for a player. A member number with no history opens an empty chat.
 * @param {number} memberNumber Member number of target player
 * @param {IFriendListBeepLogMessage|null} data Beep data of received beep
 * @param {string} [chatKey]
 */
function FriendListBeep(memberNumber, data = null, chatKey = "") {
	FriendListBeepCloseReactionPicker();
	if (!chatKey) {
		const resolvedMember = CommonIsNonNegativeInteger(memberNumber) ? memberNumber : data?.MemberNumber;
		if (CommonIsNonNegativeInteger(resolvedMember)) {
			chatKey = `member:${resolvedMember}`;
			memberNumber = resolvedMember;
		} else if (data) {
			chatKey = FriendListBeepGetChatKeyFromBeep(data);
		}
	}
	if (!chatKey) return;

	const hadRenderedChatMessages = !!ElementWrap(FriendListIDs.beepMessages);
	const refreshingSameChat = hadRenderedChatMessages && FriendListBeepChatKey === chatKey;
	const previousTextArea = /** @type {HTMLTextAreaElement | null} */ (ElementWrap(FriendListIDs.beepTextArea));
	const preservedDraft = previousTextArea?.value ?? "";
	const preservedSelectionStart = previousTextArea?.selectionStart ?? preservedDraft.length;
	const preservedSelectionEnd = previousTextArea?.selectionEnd ?? preservedDraft.length;
	const preservedDraftFocused = refreshingSameChat && !!previousTextArea && document.activeElement === previousTextArea;
	let userName = Player.FriendNames.get(memberNumber) ?? data?.MemberName;
	let isScrolledToEnd = false;
	let preservedScrollTop = 0;
	let shouldOpenChatAtEnd = false;
	/** @type {HTMLElement | null} */
	let firstUnreadMessage = null;
	/** @type {HTMLElement[]} */
	let chatMessageNodes = [];

	/** @type {boolean} */
	let isOnline = false;

	const chatMap = FriendListBeepBuildChatMap();
	let chat = chatMap.get(chatKey);
	if (!chat) {
		if (!CommonIsNonNegativeInteger(memberNumber)) return;
		chat = {
			chatKey,
			memberNumber,
			memberName: Player.FriendNames.get(memberNumber) ?? data?.MemberName ?? TextGet("Unknown"),
			messageIndices: [],
			lastIndex: -1,
			lastTime: new Date(0),
			hasMessage: false,
		};
	}
	FriendListBeepChatKey = chatKey;
	memberNumber = chat.memberNumber ?? memberNumber;
	userName = memberNumber != null
		? (Player.FriendNames.get(memberNumber) ?? chat.memberName)
		: chat.memberName;
	FriendListBeepChatInterlocutorName = userName ?? TextGet("Unknown");
	FriendListBeepTarget = CommonIsNonNegativeInteger(memberNumber) ? /** @type {number} */ (memberNumber) : -1;
	isOnline = memberNumber != null && FriendListOnlineFriends?.has(memberNumber);

	for (const idx of chat.messageIndices) {
		FriendListBeepEnsureMessageId(FriendListBeepLog[idx]);
	}

	const messageLog = ElementWrap(FriendListIDs.beepMessages);
	isScrolledToEnd = ElementIsScrolledToEnd(FriendListIDs.beepMessages);
	preservedScrollTop = messageLog?.scrollTop ?? 0;
	// Action, quote, and chrome buttons reuse stable IDs. Remove the previous dialog
	// before creating them, or ElementButton.Create finds the old nodes and bails.
	ElementRemove(FriendListIDs.beepList);

	const firstUnreadPosition = chat.messageIndices.findIndex((index) => {
		return FriendListBeepIsUnread(FriendListBeepLog[index]);
	});
	shouldOpenChatAtEnd = firstUnreadPosition === -1;
	FriendListBeepChatIndices = chat.messageIndices.slice();

	const reactionState = FriendListBeepCollectReactionState(chat.messageIndices);
	/** @type {Map<string, HTMLElement>} */
	const entryNodesByBeepId = new Map();

	// Messages from the same sender, in the same room, within this window collapse into a single visual group.
	const GROUP_THRESHOLD_MS = 5 * 60 * 1000;
	/** @type {IFriendListBeepLogMessage | null} */
	let previousBeep = null;
	/** @type {BeepMessageType | undefined} */
	let previousMessageType;
	let groupBroken = true;

	chat.messageIndices.forEach((index, position) => {
		if (firstUnreadPosition === position && firstUnreadPosition < chat.messageIndices.length && !isScrolledToEnd) {
			chatMessageNodes.push(ElementCreate({
				tag: 'div',
				attributes: { id: FriendListIDs.beepNewMessageDivider },
				classList: ['friend-list-beep-chat-divider', 'no-select'],
				children: [
					{ tag: 'span', classList: ['friend-list-beep-chat-divider-line'] },
					{ tag: 'span', classList: ['friend-list-beep-chat-divider-text'], children: [TextGet("NewMessages")] },
					{ tag: 'span', classList: ['friend-list-beep-chat-divider-line'] },
				],
			}));
			groupBroken = true;
		}
		const beep = FriendListBeepLog[index];
		const parsed = FriendListBeepParseMessage(beep.Message ?? "");
		if (parsed.metadata?.messageType === "Reaction") {
			return;
		}

		const senderName = (beep.Sent ? Player.Name : (beep.MemberName ?? userName)) ?? TextGet("Unknown");
		const roomCaption = FriendListBeepRoomCaption(beep);
		const formatted = FriendListBeepFormatMessage(senderName, parsed);
		const isEmpty = !formatted.text;
		const messageText = formatted.text || InterfaceTextGet("Beep");
		const timeCaption = TimerHourToString(beep.Time);

		const isAction = formatted.messageType === 'Action';
		const prevIsAction = previousMessageType === 'Action';
		const sameSender = previousBeep != null && !!previousBeep.Sent === !!beep.Sent;
		const sameRoom = previousBeep != null
			&& (previousBeep.ChatRoomName ?? "") === (beep.ChatRoomName ?? "")
			&& (previousBeep.ChatRoomSpace ?? "") === (beep.ChatRoomSpace ?? "");
		const withinTimeWindow = previousBeep != null
			&& (beep.Time.getTime() - previousBeep.Time.getTime()) < GROUP_THRESHOLD_MS;
		const isReply = formatted.messageType === 'Reply';
		const isGrouped = !groupBroken && sameSender && sameRoom && withinTimeWindow && !isAction && !prevIsAction && !isReply;

		const entryClasses = [
			'friend-list-beep-chat-entry',
			beep.Sent ? 'friend-list-beep-chat-sent' : 'friend-list-beep-chat-received',
			formatted.messageType ? `friend-list-beep-chat-type-${formatted.messageType.toLowerCase()}` : undefined,
			isGrouped ? 'friend-list-beep-chat-grouped' : undefined,
		];

		/** @type {(HTMLOptionsUnion | HTMLElement)[]} */
		const entryChildren = [];
		const replyTo = parsed.metadata?.replyTo;
		if (isReply && replyTo?.id) {
			const quoteLabel = `↪ ${replyTo.senderName}: ${replyTo.snippet}`;
			entryChildren.push(ElementButton.Create(
				`friend-list-beep-quote-${index}`,
				() => FriendListBeepScrollToMessage(replyTo.id),
				{
					noStyling: true,
					label: quoteLabel,
					labelPosition: "center",
				},
				{
					button: {
						classList: ['friend-list-beep-chat-quote'],
						dataAttributes: { targetId: replyTo.id },
						attributes: { type: "button" },
					},
				},
			));
		}

		/** @type {HTMLOptionsUnion[]} */
		const metaChildren = [
			{
				tag: "span",
				classList: ["friend-list-beep-chat-sender"],
				style: parsed.metadata?.messageColor ? { color: parsed.metadata.messageColor } : undefined,
				children: [senderName],
			},
		];
		if (roomCaption) {
			metaChildren.push({
				tag: "span",
				classList: ["friend-list-beep-chat-room", "no-select"],
				children: [roomCaption],
			});
		}
		metaChildren.push({
			tag: "span",
			classList: ["friend-list-beep-chat-time", "no-select"],
			children: [timeCaption],
		});

		entryChildren.push(
			ElementCreate({
				tag: "div",
				classList: ["friend-list-beep-chat-entry-header"],
				children: [
					{
						tag: "div",
						classList: ["friend-list-beep-chat-meta"],
						children: metaChildren,
					},
				],
			}),
			ElementCreate({
				tag: "div",
				classList: ["friend-list-beep-chat-body"],
				children: [
					{
						tag: "div",
						classList: [
							"friend-list-beep-chat-message",
							isEmpty ? "friend-list-beep-chat-empty" : undefined,
						].filter(Boolean),
						children: [messageText],
					},
					FriendListBeepBuildActionBar(index),
				],
			}),
		);

		const node = ElementCreate({
			tag: 'div',
			classList: entryClasses,
			dataAttributes: { beepIndex: index.toString(), beepId: beep.Id },
			attributes: { tabindex: "0" },
			children: entryChildren,
		});
		if (beep.Id) entryNodesByBeepId.set(beep.Id, node);

		chatMessageNodes.push(node);
		if (position === firstUnreadPosition) {
			firstUnreadMessage = node;
		}

		previousBeep = beep;
		previousMessageType = formatted.messageType;
		groupBroken = false;
	});

	for (const [targetId, emojiRow] of reactionState) {
		const host = entryNodesByBeepId.get(targetId);
		if (!host) continue;
		/** @type {HTMLElement[]} */
		const reactionButtons = [];
		for (const [emoji, info] of emojiRow) {
			const label = `${emoji}\u00a0${info.count}`;
			reactionButtons.push(ElementButton.Create(
				null,
				() => FriendListBeepSendReaction(targetId, emoji, info.selfHas),
				{
					disabled: !isOnline,
					label,
					noStyling: true,
					labelPosition: "center",
					role: "menuitem",
					ariaChecked: info.selfHas,
				},
				{
					button: {
						classList: ["friend-list-beep-reaction-chip"],
					},
				},
			));
		}
		host.appendChild(ElementMenu.Create(
			null,
			reactionButtons,
			{ role: "menubar" },
			{
				menu: {
					classList: ["friend-list-beep-chat-reactions", "no-select"],
				},
			},
		));
	}

	isOnline = memberNumber != null && FriendListOnlineFriends?.has(memberNumber);
	const userCaption = memberNumber != null ? `${userName} (${memberNumber})` : userName;

	/** @type {HTMLOptionsUnion[]} */
	const dialogChildren = [];
	dialogChildren.push({
		tag: 'div',
		classList: ['friend-list-beep-chat-header', 'no-select'],
		children: [
			{
				tag: 'h1',
				classList: ['friend-list-beep-title'],
				children: [
					{
						tag: 'span',
						classList: ['friend-list-beep-status', isOnline ? 'friend-list-beep-status-online' : 'friend-list-beep-status-offline'],
						attributes: { "aria-hidden": "true" },
					},
					userCaption,
				],
			},
			ElementButton.Create(
				'friend-list-beep-chat-close',
				() => FriendListBeepMenuClose(),
				{
					image: 'Icons/Remove.png',
					noStyling: true,
					tooltip: InterfaceTextGet('Close'),
					labelPosition: 'center',
				},
				{
					button: { classList: ['friend-list-beep-chat-close'] },
				},
			),
		]
	});

	dialogChildren.push({
		tag: 'div',
		attributes: { id: FriendListIDs.beepChatWrapper },
		classList: [FriendListIDs.beepChatWrapper],
		children: [
			{
				tag: 'div',
				attributes: { id: FriendListIDs.beepMessages },
				classList: [FriendListIDs.beepMessages, 'scroll-box'],
				children: chatMessageNodes,
			},
			ElementButton.Create(
				FriendListIDs.beepScrollBtn,
				() => FriendListBeepScrollToBottom(),
				{
					image: 'Icons/CaretDown.svg',
					noStyling: true,
				},
				{
					button: {
						attributes: {
							'aria-label': TextGet('ScrollToBottom'),
							'aria-hidden': 'true',
						},
						classList: [FriendListIDs.beepScrollBtn],
						children: [
							{
								tag: 'span',
								attributes: { id: FriendListIDs.beepUnreadBadge },
								classList: [FriendListIDs.beepUnreadBadge],
							},
						],
					},
				}
			),
		],
	});

	dialogChildren.push({
		tag: 'div',
		classList: [FriendListIDs.beepInputRow],
		attributes: { id: FriendListIDs.beepInputRow },
		children: [
			ElementCheckbox.CreateLabelled(
				'friend-list-beep-chat-toggle-room',
				TextGet('IncludeRoom'),
				() => FriendListBeepShowRoom = !FriendListBeepShowRoom,
				{
					checked: FriendListBeepShowRoom,
					disabled: !ServerPlayerIsInChatRoom(),
				},
				{
					checkbox: { classList: ['friend-list-link', 'friend-list-beep-chat-toggle'] },
				},
			)
		],
	});
	dialogChildren.push({
		tag: 'div',
		classList: ['friend-list-beep-chat-input'],
		children: [
			{
				tag: 'div',
				classList: ['friend-list-beep-chat-input-field'],
				children: [
					{
						tag: 'textarea',
						attributes: {
							id: FriendListIDs.beepTextArea,
							maxlength: 1000,
							readonly: false,
						},
						classList: [FriendListIDs.beepTextArea],
					},
					ElementButton.Create(
						'friend-list-beep-chat-send',
						() => FriendListBeepMenuSend(),
						{
							image: 'Icons/Chat.png',
							disabled: memberNumber == null || !isOnline,
						},
						{
							button: { classList: ['friend-list-beep-chat-send'] },
						},
					),
				],
			},
		],
	});

	const dialog = ElementCreate({
		tag: 'dialog',
		attributes: {
			id: FriendListIDs.beepList,
			'screen-generated': 'FriendList'
		},
		classList: [FriendListIDs.beepList, 'HideOnPopup'],
		dataAttributes: {
			'online': isOnline.toString(),
		},
		children: dialogChildren,
		parent: document.body,
	});
	dialog.showModal();

	const textArea = /** @type {HTMLTextAreaElement} */ (ElementWrap(FriendListIDs.beepTextArea));
	if (textArea) {
		textArea.disabled = memberNumber == null;
		if (refreshingSameChat) {
			textArea.value = preservedDraft;
			if (preservedDraftFocused) textArea.focus();
			textArea.setSelectionRange(preservedSelectionStart, preservedSelectionEnd);
		} else {
			textArea.focus();
		}
	}
	if (FriendListBeepReplyTarget) {
		FriendListBeepRenderReplyPreview();
	}

	FriendListBeepTarget = CommonIsNonNegativeInteger(memberNumber) ? /** @type {number} */ (memberNumber) : -1;
	FriendListResize(true);
	if ((refreshingSameChat && isScrolledToEnd) || (!refreshingSameChat && shouldOpenChatAtEnd)) {
		ElementScrollToEnd(FriendListIDs.beepMessages);
	} else if (!refreshingSameChat) {
		const firstUnreadElement = /** @type {HTMLElement | null} */ (firstUnreadMessage);
		firstUnreadElement?.scrollIntoView({ behavior: "instant", block: "nearest" });
	} else {
		const refreshedLog = ElementWrap(FriendListIDs.beepMessages);
		if (refreshedLog) refreshedLog.scrollTop = preservedScrollTop;
	}
	FriendListBeepSetupReadObserver();
}

/**
 * Closes the beep menu
 */
function FriendListBeepMenuClose() {
	if (FriendListBeepObserver) {
		FriendListBeepObserver.disconnect();
		FriendListBeepObserver = null;
	}
	FriendListBeepCloseReactionPicker();
	FriendListBeepCancelReply();
	FriendListBeepChatIndices = [];
	ElementRemove(FriendListIDs.beepList);
	FriendListBeepTarget = -1;
	FriendListBeepShowRoom = true;
	FriendListBeepChatKey = null;
}

/**
 * Sets up an IntersectionObserver on unread received messages to mark them as
 * read once they scroll into the upper half of the chat viewport, and attaches
 * a scroll listener to toggle the scroll-to-bottom button.
 */
function FriendListBeepSetupReadObserver() {
	if (FriendListBeepObserver) {
		FriendListBeepObserver.disconnect();
		FriendListBeepObserver = null;
	}

	const container = document.getElementById(FriendListIDs.beepMessages);
	if (!container) return;

	FriendListBeepObserver = new IntersectionObserver((entries) => {
		let changed = false;
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			const el = /** @type {HTMLElement} */ (entry.target);
			const idx = CommonParseInt(el.dataset.beepIndex ?? "");
			if (!CommonIsNonNegativeInteger(idx)) continue;
			const beep = FriendListBeepLog[idx];
			if (beep && !beep.Sent && beep.Read === false) {
				beep.Read = true;
				changed = true;
				FriendListBeepObserver?.unobserve(el);
			}
		}
		if (changed) FriendListBeepUpdateScrollState();
	}, {
		root: container,
		threshold: 1,
	});

	container.querySelectorAll('.friend-list-beep-chat-entry.friend-list-beep-chat-received').forEach((el) => {
		const idx = CommonParseInt(/** @type {HTMLElement} */(el).dataset.beepIndex ?? "");
		if (!CommonIsNonNegativeInteger(idx)) return;
		const beep = FriendListBeepLog[idx];
		if (beep && !beep.Sent && beep.Read === false) {
			FriendListBeepObserver?.observe(el);
		}
	});

	container.addEventListener('scroll', () => FriendListBeepUpdateScrollState(), { passive: true });
	FriendListBeepUpdateScrollState();
}

/**
 * Updates the scroll-to-bottom button visibility and unread badge count.
 * The button appears when scrolling down while above the bottom, or when
 * there are unread messages. It hides when the user reaches the bottom
 * or scrolls up (with no unreads).
 */
function FriendListBeepUpdateScrollState() {
	const btn = ElementWrap(FriendListIDs.beepScrollBtn);
	const badge = ElementWrap(FriendListIDs.beepUnreadBadge);
	const divider = ElementWrap(FriendListIDs.beepNewMessageDivider);
	const container = ElementWrap(FriendListIDs.beepMessages);
	if (!btn || !badge || !container) return;

	const isAtBottom = ElementIsScrolledToEnd(container);
	const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
	const isNearBottom = distanceFromBottom < container.clientHeight * 0.5;
	const lastScrollTop = CommonParseInt(container.dataset.scrollTop ?? "0") ?? 0;
	const isScrollingDown = container.scrollTop > lastScrollTop;

	const unreadCount = FriendListBeepChatIndices.reduce((count, index) => {
		return count + (FriendListBeepIsUnread(FriendListBeepLog[index]) ? 1 : 0);
	}, 0);

	const wasVisible = !btn.hasAttribute('data-hidden');
	let isScrollButtonVisible;
	if (isAtBottom) {
		isScrollButtonVisible = false;
	} else if (wasVisible && isScrollingDown) {
		isScrollButtonVisible = true;
	} else {
		isScrollButtonVisible = !isNearBottom && isScrollingDown || unreadCount > 0;
	}

	container.dataset.scrollTop = container.scrollTop.toString();
	btn.toggleAttribute('data-hidden', !isScrollButtonVisible);
	badge.textContent = unreadCount > 0 ? unreadCount.toString() : '';
	badge.toggleAttribute('hidden', unreadCount === 0);
	divider?.toggleAttribute('hidden', unreadCount === 0);
}

/**
 * Marks all messages in the current chat as read and scrolls to the bottom.
 */
function FriendListBeepScrollToBottom() {
	for (const index of FriendListBeepChatIndices) {
		const beep = FriendListBeepLog[index];
		if (beep && !beep.Sent && beep.Read === false) {
			beep.Read = true;
		}
	}
	ElementScrollToEnd(FriendListIDs.beepMessages, { behavior: 'smooth' });
	FriendListBeepUpdateScrollState();
}

/**
 * Sends the beep and message on send click
 */
function FriendListBeepMenuSend() {
	if (FriendListBeepTarget === -1) return;

	const textarea = /** @type {HTMLTextAreaElement} */ (ElementWrap(FriendListIDs.beepTextArea));
	if (textarea) {
		const msg = textarea.value;
		/** @type {{ includeRoom: boolean, messageType?: "Reply", replyTo?: BeepMessageReplyTo }} */
		const sendOpts = { includeRoom: FriendListBeepShowRoom };
		if (FriendListBeepReplyTarget) {
			sendOpts.messageType = "Reply";
			sendOpts.replyTo = FriendListBeepReplyTarget;
		}
		ServerSendBeepMessage(FriendListBeepTarget, msg, sendOpts);
		FriendListBeepCancelReply();
		textarea.value = "";
	}
	if (FriendListBeepChatKey) {
		FriendListBeep(-1, null, FriendListBeepChatKey);
	}
}

/**
 * Shows the wanted beep on click from beep list
 * @param {number} i index of the beep
 * @returns {SafePromise<void>}
 */
async function FriendListShowBeep(i) {
	const beep = FriendListBeepLog[i];
	if (typeof beep?.MemberNumber !== "number") return;
	await FriendListShowBeepChat(FriendListBeepGetChatKeyFromBeep(beep));
}

/**
 * Shows the chat history for a given beep chat
 * @param {string} chatKey
 */
async function FriendListShowBeepChat(chatKey) {
	FriendListModeIndex = 1;
	await FriendListShow();
	FriendListBeepChat(chatKey);
}
//#endregion !SECTION: BEEP

//#region SECTION: FRIEND LIST

/**
 * Loads the friend list data into the HTML div element.
 * @param {ServerFriendInfo[]} data - An array of data, we receive from the server
 *
 * `data.MemberName` - The name of the player
 *
 * `data.MemberNumber` - The ID of the player
 *
 * `data.ChatRoomName` - The name of the ChatRoom
 *
 * `data.ChatRoomSpace` - The space, where this room was created.
 *
 * `data.Type` - The relationship that exists between the player and the friend of the list.
 * @returns {void} - Nothing
 */
function FriendListLoadFriendList(data) {
	const friendList = /** @type {HTMLDivElement} */ (ElementWrap(FriendListIDs.friendList));
	if (!friendList) return;

	// Loads the header caption
	const BeepCaption = InterfaceTextGet("Beep");
	const MailCaption = InterfaceTextGet("BeepWithMail");
	const sortingSymbol = FriendListSortingDirection === "Asc" ? "↑" : "↓";
	const friendListScrollPercent = ElementGetScrollPercentage(FriendListIDs.friendList) || 0;
	friendList.replaceChildren();

	/** @type {HTMLTableRowElement[]} */
	const FriendListContent = [];
	FriendListCloseActionsMenu();

	const mode = FriendListMode[FriendListModeIndex];
	ServerUpdateFriendList(data);

	const dataMap = new Map(data.map(friend => [friend.MemberNumber, friend]));
	FriendListOnlineFriends = new Set(dataMap.keys());

	/** @satisfies {Record<string, FriendListSortingMode>} */
	const columnHeaders = {
		"friend-list-member-name": "MemberName",
		"friend-list-member-number": "MemberNumber",
		"friend-list-chat-room-name": "ChatRoomName",
		"friend-list-chat-room-type": "ChatRoomType",
		"friend-list-relation-type": "RelationType",
		"friend-list-chat-room-count": "ChatRoomMemberCount",
	};
	CommonEntries(columnHeaders).forEach(([id, modeName]) => {
		const elem = /** @type {HTMLSpanElement} */ (ElementWrap(id));
		if (!elem) return;
		const elemSortingSymbol = FriendListSortingMode === modeName ? sortingSymbol : "↕";
		elem.textContent = `${TextGet(modeName)} ${elemSortingSymbol}`;
		switch (elemSortingSymbol) {
			case "↑":
				elem.setAttribute("aria-sort", "ascending");
				break;
			case "↓":
				elem.setAttribute("aria-sort", "descending");
				break;
			default:
				elem.setAttribute("aria-sort", "none");
		}
	});

	/** @type {FriendRawData[]} */
	const friendRawData = [];

	if (mode === "OnlineFriends") {
		// In Friend List mode, we show the friend list and allow doing beeps
		for (const friend of data) {
			const originalChatRoomName = friend.ChatRoomName || '';
			const chatRoomSpaceCaption = InterfaceTextGet(`ChatRoomSpace${friend.ChatRoomSpace || "F"}`);
			const chatRoomName = ChatSearchMuffle(friend.ChatRoomName ?? "");
			const canSearchRoom = FriendListReturn?.Screen === 'ChatSearch' && ChatSearchGetSpace() === (friend.ChatRoomSpace ?? "");

			friendRawData.push({
				memberName: friend.MemberName,
				memberNumber: friend.MemberNumber,
				relationType: FriendListGetRelationType(friend.MemberNumber),
				pending: FriendListIsPending(friend.MemberNumber),
				isOnline: true,
				canDelete: FriendListCanDelete(friend.MemberNumber),
				canBeep: true,
				canAdd: FriendListCanAdd(friend.MemberNumber),
				chatRoom: {
					name: originalChatRoomName,
					caption: chatRoomName || "-",
					canSearchRoom: canSearchRoom,
					types: [
						chatRoomSpaceCaption && chatRoomName ? FriendListIconMapping[friend.ChatRoomSpace ?? ""] : null,
						friend.Private ? FriendListIconMapping.Private : null,
					],
					ChatRoomLimit: friend.ChatRoomLimit,
					ChatRoomMemberCount: friend.ChatRoomMemberCount,
				},
				beep: {
					caption: BeepCaption
				}
			});
		}
	} else if (mode === "Beeps") {
		// In Beeps mode, we show one chat per interlocutor
		const beepChats = Array.from(FriendListBeepBuildChatMap().values())
			.sort((a, b) => b.lastTime.getTime() - a.lastTime.getTime());

		for (const chat of beepChats) {
			const lastBeep = FriendListBeepLog[chat.lastIndex];
			if (!lastBeep) continue;
			const unreadCount = chat.messageIndices.reduce((count, index) => {
				return count + (FriendListBeepIsUnread(FriendListBeepLog[index]) ? 1 : 0);
			}, 0);

			const roomBeep = FriendListBeepLastMessage(chat.messageIndices);
			const chatRoomSpaceCaption = roomBeep ? InterfaceTextGet(`ChatRoomSpace${roomBeep.ChatRoomSpace || "F"}`) : "";
			const chatRoomName = ChatSearchMuffle(roomBeep?.ChatRoomName ?? "");
			const canSearchRoom = !!roomBeep && FriendListReturn?.Screen === 'ChatSearch' && ChatSearchGetSpace() === (roomBeep.ChatRoomSpace ?? "");

			const rawBeepCaption = [
				TimerHourToString(lastBeep.Time),
			];
			if (chat.hasMessage) {
				rawBeepCaption.push(MailCaption);
			}
			const beepCaption = rawBeepCaption.join(' ');

			friendRawData.push({
				memberName: chat.memberName,
				memberNumber: chat.memberNumber ?? 0,
				relationType: FriendListGetRelationType(chat.memberNumber ?? 0),
				isOnline: !!dataMap.get(chat.memberNumber ?? 0),
				canBeep: !!dataMap.get(chat.memberNumber ?? 0),
				pending: FriendListIsPending(chat.memberNumber ?? 0),
				canAdd: FriendListCanAdd(chat.memberNumber ?? 0),
				canDelete: false,
				chatRoom: {
					name: roomBeep?.ChatRoomName,
					caption: chatRoomName || "-",
					canSearchRoom: canSearchRoom,
					types: [
						roomBeep && chatRoomSpaceCaption && chatRoomName ? FriendListIconMapping[roomBeep.ChatRoomSpace ?? ""] : null,
						roomBeep?.Private ? FriendListIconMapping.Private : null,
					],
				},
				beep: {
					chatKey: chat.chatKey,
					hasMessage: true,
					caption: beepCaption,
					unreadCount: unreadCount,
				},
			});
		}
		if (document.hasFocus()) NotificationReset(NotificationEventType.BEEP);
	} else if (mode === "AllFriends") {
		// In Delete mode, we show the friend list and allow the user to remove them
		const allFriendEntries = [
			...Player.FriendNames.entries(),
			...Player.FriendList.map((entry) => /** @type {const} */([entry, Player.FriendNames.get(entry) ?? TextGet("Unknown")])),
			...Player.Lovership.map((entry) => entry.MemberNumber ? /** @type {const} */([entry.MemberNumber, entry.Name]) : undefined).filter(entry => entry !== undefined),
			Player.Ownership ? /** @type {const} */([Player.Ownership?.MemberNumber, Player.Ownership?.Name]) : undefined,
		].filter(entry => entry !== undefined);
		// we are using the map to filter out duplicate entries
		const allFriendMap = new Map(allFriendEntries);
		const allFriends = Array
			.from(allFriendMap.entries())
			.sort((a, b) => a[1].localeCompare(b[1]));

		for (const [memberNumber, memberName] of allFriends) {
			const isOnline = !!dataMap.get(memberNumber);

			friendRawData.push({
				memberName: memberName,
				memberNumber: memberNumber,
				relationType: FriendListGetRelationType(memberNumber),
				canDelete: FriendListCanDelete(memberNumber),
				isOnline: isOnline,
				canBeep: isOnline,
				pending: FriendListIsPending(memberNumber),
				canAdd: FriendListCanAdd(memberNumber),
			});
		}
		friendRawData.sort((a, b) => {
			if (a.pending === b.pending) {
				return 0;
			} else if (a.pending) {
				return 1;
			} else if (b.pending) {
				return -1;
			} else {
				return 0;
			}
		});
	}

	friendRawData.forEach(friend => {
		const isPending = friend.pending === true;
		const row = ElementCreate({
			tag: "tr",
			classList: [
				'friend-list-row',
				...(friend.pending ? ['friend-list-pending'] : []),
			],
			children: [
				{
					tag: "td",
					classList: [
						'friend-list-column',
						'MemberName',
						...(isPending ? ['friend-list-unknown'] : [])
					],
					children: [
						// Insert a hidden, max-size UTF16 character to "Unknown" names for the sake of the sorting order
						isPending ? { tag: "span", children: [String.fromCharCode(2 ** 32 - 1)], attributes: { hidden: true } } : undefined,
						{ tag: "span", children: [friend.memberName], classList: ["friend-list-search-cell"] },
					],
				},
				{
					tag: "td",
					classList: ['friend-list-column', 'MemberNumber'],
					children: [
						{ tag: "span", children: [`${friend.memberNumber ?? ""}`], classList: ["friend-list-search-cell"] },
					],
				},
			]
		});

		if (friend.chatRoom) {
			if (!friend.chatRoom.name || !friend.chatRoom.canSearchRoom) {
				// Sorting is performed via each cell's `textContent`,
				// so explicitly prepend an invisible node with some sorting key
				let totalSortKey = "";
				const imgContainer = ElementCreate({
					tag: "td",
					classList: ['friend-list-column', 'ChatRoomType'],
					children: [
						{ tag: "span", attributes: { hidden: true }, classList: ["friend-list-sorting-node"] },
						...friend.chatRoom.types.map((iconType) => {
							if (iconType != null) {
								const { src, tooltipKey, sortKey: iconSortKey } = iconType;
								totalSortKey += iconSortKey;
								return {
									tag: /** @type {const} */("div"),
									classList: ["friend-list-icon-container"],
									children: [
										{
											tag: /** @type {const} */("img"),
											attributes: { src, decoding: "async", loading: "lazy", alt: TextGet(tooltipKey) },
											classList: ["friend-list-icon"],
										},
										{
											tag: /** @type {const} */("div"),
											attributes: { role: "tooltip", "aria-hidden": "true" },
											children: [TextGet(tooltipKey)],
											classList: ["button-tooltip", "button-tooltip-right"],
										},
									],
								};
							} else {
								// A hidden padding DIV
								totalSortKey += " ";
								return {
									tag: /** @type {const} */("div"),
									classList: ["friend-list-icon-container"],
									attributes: { "aria-hidden": "true" },
									children: ["-"],
								};
							}
						}),
					],
				});
				imgContainer.children[0].textContent = totalSortKey + " ";
				if (imgContainer.children.length === 1) {
					imgContainer.append("-");
				}
				row.append(
					imgContainer,
					ElementCreate({
						tag: "td",
						classList: ['friend-list-column', 'ChatRoomName'],
						children: [friend.chatRoom.caption],
						style: { "user-select": friend.chatRoom.caption === "-" ? "none" : undefined },
					}),
				);
			} else if (friend.chatRoom.canSearchRoom) {
				// Sorting is performed via each cell's `textContent`,
				// so explicitly prepend an invisible node with some sorting key
				let totalSortKey = "";
				const imgContainer = ElementCreate({
					tag: "td",
					classList: ['friend-list-column', 'ChatRoomType'],
					children: [
						{ tag: "span", attributes: { hidden: true }, classList: ["friend-list-sorting-node"] },
						...friend.chatRoom.types.map((iconType) => {
							if (iconType) {
								const { src, tooltipKey, sortKey: iconSortKey } = iconType;
								totalSortKey += iconSortKey;
								return {
									tag: /** @type {const} */("div"),
									classList: ["friend-list-icon-container"],
									children: [
										{
											tag: /** @type {const} */("img"),
											attributes: { src, decoding: "async", loading: "lazy", alt: TextGet(tooltipKey) },
											classList: ["friend-list-icon"],
										},
										{
											tag: /** @type {const} */("div"),
											attributes: { role: "tooltip", "aria-hidden": "true" },
											children: [TextGet(tooltipKey)],
											classList: ["button-tooltip", "button-tooltip-right"],
										},
									],
								};
							} else {
								// A hidden padding DIV
								totalSortKey += " ";
								return {
									tag: /** @type {const} */("div"),
									classList: ["friend-list-icon-container"],
									attributes: { "aria-hidden": "true" },
									children: ["-"],
								};
							}
						}),
					],
				});
				imgContainer.children[0].textContent = totalSortKey + " ";
				if (imgContainer.children.length === 1) {
					imgContainer.append("-");
				}
				row.append(
					imgContainer,
					ElementCreate({
						tag: "td",
						classList: ['friend-list-column', 'friend-list-link', 'blank-button', 'ChatRoomName'],
						children: [friend.chatRoom.caption],
						style: { "user-select": friend.chatRoom.caption === "-" ? "none" : undefined },
						eventListeners: {
							click: () => FriendListChatSearch(friend.chatRoom?.name),
						},
					}),
				);
			}

			let memberCount = "-";
			let sortKey = String.fromCharCode(255);
			const { ChatRoomLimit, ChatRoomMemberCount } = friend.chatRoom;
			if (ChatRoomLimit !== undefined && ChatRoomMemberCount !== undefined) {
				memberCount = `${ChatRoomMemberCount.toString().padStart(2, " ")} / ${ChatRoomLimit.toString().padEnd(2, " ")}`;
				sortKey = `${String.fromCharCode(ChatRoomMemberCount)}${String.fromCharCode(ChatRoomLimit)}`;
			}
			row.append(
				ElementCreate({
					tag: "td",
					classList: ['friend-list-column', 'ChatRoomMemberCount'],
					children: [
						// A hidden element for identifying the cell's priority in the textContent-based friendlist sorting
						{ tag: "span", children: [sortKey], style: { display: "none" } },
						memberCount,
					],
				}),
			);
		}

		if (friend.beep) {
			const beep = friend.beep;
			if (friend.canBeep || beep.hasMessage) {
				/** @type {(Node | string)[]} */
				const beepChildren = [beep.caption];
				if (beep.unreadCount) {
					beepChildren.push((ElementCreate({
						tag: 'span',
						classList: ['friend-list-beep-unread'],
						children: [
							' ✉',
							{
								tag: 'sup',
								children: [beep.unreadCount.toString()],
							},
						],
					})));
				}
				const chatKey = beep.chatKey;
				const beepClick = chatKey
					? () => FriendListShowBeepChat(chatKey)
					: () => {
						const i = beep.beepIndex;
						if (i !== undefined) return FriendListShowBeep(i);
					};
				row.append(
					ElementButton.Create(
						`friend-list-show-beep-${friend.memberNumber}`,
						beepClick,
						{ noStyling: true },
						{
							button: {
								classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-beeps-content'],
								children: beepChildren,
								attributes: { role: "cell" },
							}
						},
					),
				);
			} else {
				row.appendChild(ElementCreate({
					tag: "td",
					classList: ['friend-list-column'],
					children: [
						beep.caption
					],
				}));
			}
		}

		if (friend.relationType) {
			/** @type {HTMLElement} */
			let imgData;
			const relationData = FriendListTypeData[friend.relationType];
			switch (friend.relationType) {
				case "Pending":
					imgData = ElementCreate({
						tag: "div",
						classList: ["friend-list-icon-small", "friend-list-icon-monochrome"],
						attributes: { "aria-hidden": "true" },
						style: { mask: `url("${relationData.Icon}") center center / contain` },
					});
					break;
				default:
					imgData = ElementCreate({
						tag: "img",
						attributes: {
							src: relationData.Icon,
							decoding: "async",
							loading: "lazy",
							"aria-hidden": "true",
						},
						classList: ["friend-list-icon-small"],
					});
					break;
			}
			row.appendChild(ElementCreate({
				tag: "td",
				classList: ['friend-list-column', 'RelationType', 'mode-specific-content', 'fl-all-friends-content'],
				children: [
					imgData,
					// Hidden sorting column; offset the lowest priority to the "a" character (i.e. char code 1 + 96)
					{ tag: "span", children: [String.fromCharCode(96 + relationData.SortingPriority)], attributes: { hidden: true } },
					relationData.Caption,
				],
			}));
		}

		if (friend.relationType) {
			row.appendChild(FriendListCreateActionsCell(friend));
		}

		FriendListContent.push(row);

	});

	// Loads the friend list and sorts it with current settings
	friendList.append(...FriendListContent);
	FriendListSort(FriendListSortingMode, FriendListSortingDirection);
	FriendListSearchByProperties(/** @type {HTMLInputElement} */(document.getElementById(FriendListIDs.searchInput))?.value);
	ElementSetScrollPercentage(FriendListIDs.friendList, friendListScrollPercent, 'instant');
}

/**
 * Registers an action for the friend list action menu.
 * @param {FriendListActionDefinition} action
 */
function FriendListRegisterAction(action) {
	if (FriendListActionDefinitions[action.id])
		return console.error(`Action "${action.id}" already registered`);
	FriendListActionDefinitions[action.id] = action;
}

/**
 * @param {FriendListActionContext} friend
 * @returns {FriendListActionDefinition[]}
 */
function FriendListGetAvailableActions(friend) {
	return Object.values(FriendListActionDefinitions).filter((action) => action.isVisible ? action.isVisible(friend) : true);
}

/**
 * @param {FriendListActionDefinition} action
 * @param {FriendListActionContext} friend
 * @returns {HTMLElement}
 */
function FriendListCreateActionItem(action, friend) {
	const label = action.getLabel(friend);
	const isEnabled = action.isEnabled ? action.isEnabled(friend) : true;
	return ElementButton.Create(
		`friend-list-action-${action.id}-${friend.memberNumber}`,
		() => {
			FriendListCloseActionsMenu();
			action.onClick(friend);
		},
		{
			disabled: !isEnabled,
			image: action.getIcon ? action.getIcon(friend) : undefined,
			label: label,
			labelPosition: "right",
		},
		{
			button: {
				classList: ["friend-list-actions-item"],
				attributes: {
					role: "menuitem",
				},
			},
			img: {
				classList: ["friend-list-actions-icon"],
			}
		},
	);
}

/**
 * @param {FriendRawData} friend
 * @returns {FriendListActionContext}
 */
function FriendListBuildActionContext(friend) {
	return {
		memberNumber: friend.memberNumber ?? -1,
		memberName: friend.memberName ?? TextGet("Unknown"),
		canDelete: friend.canDelete,
		pending: friend.pending,
		relationType: friend.relationType,
		canAdd: friend.canAdd,
		canBeep: friend.canBeep,
		isOnline: friend.isOnline,
	};
}

/**
 * @param {FriendRawData} friend
 * @returns {HTMLElement}
 */
function FriendListCreateActionsCell(friend) {
	const context = FriendListBuildActionContext(friend);
	const actions = FriendListGetAvailableActions(context);
	const memberNumber = context.memberNumber;
	const wrapperId = `friend-list-actions-wrapper-${memberNumber}`;
	const menuId = `friend-list-actions-menu-${memberNumber}`;
	const buttonId = `friend-list-actions-${memberNumber}`;
	return ElementCreate({
		tag: "td",
		classList: ['friend-list-column', 'mode-specific-content', 'fl-all-friends-content', 'fl-online-friends-content'],
		children: [
			{
				tag: "div",
				attributes: {
					id: wrapperId,
					"data-open": "false",
				},
				classList: ["friend-list-actions-wrapper"],
				children: [
					ElementButton.Create(
						buttonId,
						function () { FriendListToggleActionsMenu.call(this, memberNumber); },
						{ noStyling: true },
						{
							button: {
								classList: ['friend-list-actions-button', 'friend-list-link'],
								children: ["•••"],
								attributes: {
									disabled: actions.length === 0,
									role: "cell",
									"aria-haspopup": "menu",
									"aria-expanded": "false",
									"aria-controls": menuId,
								},
							}
						},
					),
					ElementMenu.Create(
						menuId,
						actions.length > 0
							? actions.map((action) => FriendListCreateActionItem(action, context))
							: [TextGet("ActionsNone")],
						{
							role: "menu",
						},
						{
							menu: {
								classList: ["friend-list-actions-menu"],
								eventListeners: {
									focusout: FriendListActionsMenuFocusOut,
								},
							},
						}
					),
				],
			},
		],
	});
}

/**
 * Closes the actions popover if focus is no longer on this menu (or a descendant). {@link FriendListCloseActionsMenu} syncs the trigger and popover.
 * @this {HTMLElement}
 * @param {FocusEvent} ev
 */
function FriendListActionsMenuFocusOut(ev) {
	/** @type {HTMLButtonElement | null} */
	const controller = document.querySelector(`button[aria-controls~="${this.id}"]`);
	if (!controller) {
		return;
	}

	// Prevent losing focus via controller clicks immediately triggering yet another controller click
	const to = ev.relatedTarget;
	if (!(to instanceof Node) || !(this.contains(to) || to === controller)) {
		controller.click();
	}
}

/**
 * @this {HTMLButtonElement}
 * @param {number} memberNumber
 */
function FriendListToggleActionsMenu(memberNumber) {
	const wrapper = ElementWrap(`friend-list-actions-wrapper-${memberNumber}`);
	if (!wrapper) return;

	const wasOpen = this.getAttribute("aria-expanded") === "true";
	FriendListCloseActionsMenu();
	if (wasOpen) return;

	/** @type {HTMLElement | null} */
	const menu = wrapper.querySelector(".friend-list-actions-menu");
	if (!menu) return;

	menu.setAttribute("data-original-parent", wrapper.id);
	menu.setAttribute("open", "true");
	document.body.appendChild(menu);
	FriendListPositionActionsMenu(wrapper, menu);

	/** @type {HTMLButtonElement | null} */
	const firstButton = menu.querySelector("button[role='menuitem'], button[role='menuitemradio'], button[role='menuitemcheckbox']");
	firstButton?.focus();
	this.setAttribute("aria-expanded", "true");
}

function FriendListCloseActionsMenu() {
	document.querySelectorAll("button.friend-list-actions-button[aria-expanded='true']").forEach((button) => {
		const menu = ElementUnpackIDs.fromAttribute(button, "aria-controls")[0];
		if (menu) {
			ElementWrap(menu.getAttribute("data-original-parent"))?.appendChild(menu);
			menu.removeAttribute("data-original-parent");
			menu.removeAttribute("open");
		}
		button.setAttribute("aria-expanded", "false");
	});
}

/**
 * @param {Element} wrapper
 * @param {HTMLElement} menu
 */
function FriendListPositionActionsMenu(wrapper, menu) {
	const anchor = wrapper.querySelector(".friend-list-actions-button");
	const anchorRect = anchor?.getBoundingClientRect() ?? wrapper.getBoundingClientRect();
	const menuRect = menu.getBoundingClientRect();
	const menuWidth = menuRect.width || /** @type {HTMLElement} */(menu).offsetWidth || 0;
	const menuHeight = menuRect.height || /** @type {HTMLElement} */(menu).offsetHeight || 0;
	const margin = 8;
	const offset = 12;
	let left = anchorRect.left - menuWidth - offset;
	let top = anchorRect.top + (anchorRect.height - menuHeight) / 2;
	left = Math.min(Math.max(margin, left), window.innerWidth - menuWidth - margin);
	top = Math.min(Math.max(margin, top), window.innerHeight - menuHeight - margin);

	CommonAssign(menu.style, {
		position: "fixed",
		inset: "auto",
		left: `${left}px`,
		top: `${top}px`,
		right: "auto",
		bottom: "auto",
		margin: "0",
	});
	ElementSetFontSize(menu, "auto");
}

function FriendListRepositionActionsMenu() {
	/** @type {HTMLElement | null} */
	const menu = document.querySelector(".friend-list-actions-menu[open='true']");
	const menuIdPrefix = "friend-list-actions-menu-";
	if (!menu?.id?.startsWith(menuIdPrefix)) return;

	const wrapper = ElementWrap(menu.id.replace(menuIdPrefix, "friend-list-actions-wrapper-"));
	if (!wrapper) return;

	FriendListPositionActionsMenu(wrapper, menu);
}

/**
 * Handles mode changes for friend list
 * @param {number} modeIndex - mode to change to
 */
function FriendListChangeMode(modeIndex) {
	FriendListModeIndex = modeIndex;
	if (FriendListModeIndex < 0) FriendListModeIndex = FriendListMode.length - 1;
	else if (FriendListModeIndex >= FriendListMode.length) FriendListModeIndex = 0;
	FriendListSortingMode = 'None';
	FriendListSortingDirection = 'Asc';
	ElementWrap(FriendListIDs.root)?.setAttribute("data-mode", FriendListMode[FriendListModeIndex]);
	ElementWrap(FriendListIDs.modeTitle)?.replaceChildren(TextGet(FriendListMode[FriendListModeIndex]));
	ServerSend("AccountQuery", { Query: "OnlineFriends" });
}

/**
 * Sorts the friend list depending on the sorting mode
 * and the sorting direction. If the sorting mode is none nothing is done.
 * @param {FriendListSortingMode} sortingMode
 * @param {FriendListSortingDirection} sortingDirection
 */
function FriendListSort(sortingMode, sortingDirection) {
	if (sortingMode === 'None') return;
	const friendlist = document.getElementById(FriendListIDs.friendList);
	if (!friendlist) return;

	const items = friendlist.children;
	const sortedItems = Array.from(items).sort((elmA, elmB) => {
		const contentA = elmA.querySelector(`.${sortingMode}`)?.textContent ?? "";
		const contentB = elmB.querySelector(`.${sortingMode}`)?.textContent ?? "";
		const numberA = Number.parseInt(contentA, 10);
		const numberB = Number.parseInt(contentB, 10);
		if (!isNaN(numberA) && !isNaN(numberB)) {
			return sortingDirection === 'Asc' ? numberA - numberB : numberB - numberA;
		} else {
			return sortingDirection === 'Asc' ?
				contentA.localeCompare(contentB) :
				contentB.localeCompare(contentA);
		}
	});
	friendlist.replaceChildren(...sortedItems);
}

/**
 * Sorts the friend list by properties based on the search input.
 * Searched properties: Name, Nickname (NYI) and MemberNumber
 * @param {string} text
 */
function FriendListSearchByProperties(text) {
	const friendlist = document.getElementById(FriendListIDs.friendList);
	if (!friendlist) return;

	for (const row of friendlist.querySelectorAll("tr")) {
		const cells = row.querySelectorAll('.friend-list-search-cell');
		const cellMatches = ElementSearchQuery.highlight(cells, text);
		row.toggleAttribute("hidden", cellMatches.length === 0);
	}
}

/**
 * Handles changes of the sorting mode
 * @param {FriendListSortingMode} sortingMode
 */
function FriendListChangeSortingMode(sortingMode) {
	if (sortingMode === 'None') {
		FriendListSortingMode = 'None';
		FriendListSortingDirection = 'Asc';
	} else if (sortingMode !== FriendListSortingMode) {
		FriendListSortingMode = sortingMode;
		FriendListSortingDirection = 'Asc';
	} else {
		FriendListSortingDirection = FriendListSortingDirection === 'Asc' ? 'Desc' : 'Asc';
	}

	ServerSend("AccountQuery", { Query: "OnlineFriends" });
}

/**
 * @this {HTMLButtonElement}
 */
function FriendListToggleAutoRefresh() {
	Player.OnlineSettings.FriendListAutoRefresh = this.getAttribute("aria-checked") === "true";
	ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings });
}
//#endregion !SECTION: FRIEND LIST

//#region SECTION: UTILITY FUNCTIONS
/**
 * Checks if the given member number is pending friend request.
 * @param {number} memberNumber
 * @returns {boolean}
 */
function FriendListIsPending(memberNumber) {
	return !Player.FriendNames.has(memberNumber) &&
		!Player.IsLoverOfMemberNumber(memberNumber) &&
		!Player.IsOwnedByMemberNumber(memberNumber) ||
		(
			(Player.SubmissivesList.has(memberNumber) ||
				Player.IsLoverOfMemberNumber(memberNumber) ||
				Player.IsOwnedByMemberNumber(memberNumber)) &&
			!Player.HasOnFriendlist(memberNumber)
		);
}

/**
 * Gets the relation type of the given member number.
 * @param {number} memberNumber
 * @returns {FriendListRelationType}
 */
function FriendListGetRelationType(memberNumber) {
	if (Player.IsOwnedByMemberNumber(memberNumber)) return "Owner";
	else if (Player.IsLoverOfMemberNumber(memberNumber)) return "Lover";
	else if (Player.SubmissivesList.has(memberNumber)) return "Submissive";
	else if (FriendListIsPending(memberNumber)) return "Pending";
	else return "Friend";
}

/**
 * Checks if the player can delete the given member number from their friendlist.
 * @param {number} memberNumber
 * @returns {boolean}
 */
function FriendListCanDelete(memberNumber) {
	return Player.HasOnFriendlist(memberNumber) && !Player.IsOwnedByMemberNumber(memberNumber) && !Player.IsLoverOfMemberNumber(memberNumber);
}

/**
 * Checks if the player can add the given member number to their friendlist.
 * @param {number} memberNumber
 * @returns {boolean}
 */
function FriendListCanAdd(memberNumber) {
	return !Player.HasOnFriendlist(memberNumber);
}

/**
 * Opens the friendlist from any screen
 * @returns {SafePromise<void>}
 */
async function FriendListShow() {
	if (CurrentScreen === 'FriendList') return;
	DialogLeave({ reload: false });
	ElementToggleGeneratedElements(CurrentScreen, false);
	FriendListReturn = {
		Screen: CurrentScreen,
		Module: CurrentModule,
		IsInChatRoom: ServerPlayerIsInChatRoom(),
		hasScrolledChat: ServerPlayerIsInChatRoom() && ElementIsScrolledToEnd("TextAreaChatLog")
	};
	await CommonSetScreen("Character", "FriendList");
}

/**
 * Prompts for a comma-separated list of members to add.
 * @returns {void} - Nothing
 */
function FriendListAddFriends() {
	const input = prompt(TextGet("AddFriendsPrompt"));
	if (input === null) return;

	const memberNumbers = new Set();
	input.split(",").forEach((entry) => {
		const match = entry.trim().match(/\d+/);
		if (!match) return;
		const memberNumber = Number.parseInt(match[0], 10);
		if (!Number.isNaN(memberNumber)) {
			memberNumbers.add(memberNumber);
		}
	});

	if (memberNumbers.size === 0) {
		alert(TextGet("AddFriendsError"));
		return;
	};

	/** @type {number[]} */
	const addedMembers = [];
	memberNumbers.forEach((memberNumber) => {
		if (!CommonIsNonNegativeInteger(memberNumber)) return;
		if (memberNumber === Player.MemberNumber) return;
		if (Player.FriendList.includes(memberNumber)) return;
		addedMembers.push(memberNumber);
		ChatRoomListUpdate(Player.FriendList, true, memberNumber, "FriendRequest", false);
	});

	if (addedMembers.length > 0) {
		ServerPlayerRelationsSync();
		ServerSend("AccountQuery", { Query: "OnlineFriends" });
	}

	alert(addedMembers.length > 0
		? TextSubstitute("AddFriendsSuccess", { $addedMembers: addedMembers.join(", ") }).join("")
		: TextGet("AddFriendsNoNewFriends")
	);
}

/**
 * When the user wants to delete someone from their friend list this must be confirmed.
 * This function either displays the confirm message or deletes the friend from the friendlist
 * @param {number} MemberNumber - The member to delete from the friendlist
 * @returns {void} - Nothing
 */
function FriendListDelete(MemberNumber) {
	const confirmMessage = TextSubstitute("ConfirmDelete", {
		$memberName: Player.FriendNames.get(MemberNumber) ?? TextGet("Unknown"),
		$memberNumber: MemberNumber
	}).join("");
	if (confirm(confirmMessage)) {
		ChatRoomListUpdate(Player.FriendList, false, MemberNumber);
		Player.FriendNames.delete(MemberNumber);
		ServerSend("AccountQuery", { Query: "OnlineFriends" });
	}
}

/**
 * Exits the friendlist
 * @param {string | undefined} room The room to search for
 */
async function FriendListChatSearch(room) {
	if (FriendListReturn?.Screen !== "ChatSearch" || !room) return;
	// XXX: can't use `ChatSearchQuery(room)` here, as `ChatSearchLoad` will trigger a query
	// before us, which will eat the timeout and cause the empty search to win. So just
	// overwrite the underlying search string so it searches for that
	ChatSearchQueryString = room;
	await FriendListExit();
	// Change the text box so the player still can't read it
	ChatSearchQuery(room);
}
//#endregion !SECTION: UTILITY FUNCTIONS
