"use strict";
//#region VARIABLES
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
/** @type {number} MemberNumber of the player to send beep to */
let FriendListBeepTarget = -1;
var FriendListBeepShowRoom = true;
/** @type {FriendListSortingMode} */
let FriendListSortingMode = 'None';
/** @type {FriendListSortingDirection} */
let FriendListSortingDirection = 'Asc';
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
		isVisible: (context) => FriendListModeIndex === 2 && !!context.canAdd,
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
	beepFooter: 'friend-list-beep-footer',
});
//#endregion

//#region SCREEN FUNCTIONS
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
									{ button: {
										classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-online-friends-content', 'fl-beeps-content'],
										attributes: { role: "columnheader" },
									}},
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
		ElementPositionFix(FriendListIDs.beepList, 36, 250, 150, 1500, 800);
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

	if (FriendListBeepTarget !== -1 || beepTextArea) {
		if (CommonKey.IsPressed(event, "Escape")) {
			FriendListBeepMenuClose();
			return true;
		}
	}
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
}

/**
 * @satisfies {ScreenExitHandler}
 * @return {SafePromise<void>}
 */
async function FriendListExit() {
	const beepMenu = document.getElementById(FriendListIDs.beepList);
	if (beepMenu) {
		FriendListBeepMenuClose();
		return;
	}
	ElementRemove(FriendListIDs.root);
	let screenPromise;
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
	FriendListModeIndex = 0;
	return screenPromise;
}
//#endregion

//#region BEEP
/**
 * Creates beep message menu
 * @param {number} MemberNumber Member number of target player
 * @param {IFriendListBeepLogMessage|null} data Beep data of received beep
 */
function FriendListBeep(MemberNumber, data = null) {
	if (FriendListBeepTarget === -1) {
		ElementCreateDiv(FriendListIDs.beepList);
	}
	const FriendListBeepElement = /** @type {HTMLElement} */ (document.getElementById(FriendListIDs.beepList));
	const beepTitle = data === null ? 'Send Beep' : data.Sent ? 'Sent Beep' : 'Received Beep';
	const userName = Player.FriendNames.get(MemberNumber) ?? data?.MemberName;
	const userCaption = `${userName} [${MemberNumber}]`;
	const beepDialog = ElementCreate({
		tag: 'div',
		attributes: {
			id: FriendListIDs.beepList,
			'screen-generated': 'FriendList'
		},
		classList: ['HideOnPopup'],
		dataAttributes: {
			'received': data !== null
		},
		children: [
			{
				tag: 'span',
				children: [
					beepTitle,
				]
			},
			{
				tag: 'span',
				children: [
					userCaption,
				]
			},
			{
				tag: 'textarea',
				attributes: {
					id: FriendListIDs.beepTextArea,
					maxlength: 1000,
					readonly: data !== null,
				},
			},
			{
				tag: 'div',
				attributes: {
					id: FriendListIDs.beepFooter
				},
				children: [
					{
						tag: 'button',
						classList: ['blank-button', 'friend-list-link'],
						children: [
							'Close'
						],
						eventListeners: {
							click: () => FriendListBeepMenuClose()
						}
					},
					{
						tag: 'button',
						classList: ['blank-button', 'friend-list-link', 'mode-specific-content', 'fl-beep-sent-content'],
						attributes: {
							disabled: !ServerPlayerIsInChatRoom(),
						},
						children: [
							FriendListBeepShowRoom && ServerPlayerIsInChatRoom() ? TextGet('ToggleRoomOn') : TextGet('ToggleRoomOff')
						],
						eventListeners: {
							click: function () {
								FriendListBeepShowRoom = !FriendListBeepShowRoom;
								this.textContent = FriendListBeepShowRoom ? TextGet('ToggleRoomOn') : TextGet('ToggleRoomOff');
							}
						}
					},
					{
						tag: 'button',
						classList: ['blank-button', 'friend-list-link', 'mode-specific-content', 'fl-beep-sent-content'],
						children: [
							'Send'
						],
						eventListeners: {
							click: () => FriendListBeepMenuSend()
						}
					},
					{
						tag: 'button',
						classList: ['blank-button', 'friend-list-link', 'mode-specific-content', 'fl-beep-received-content'],
						children: [
							'Reply'
						],
						eventListeners: {
							click: () => {
								if (typeof data?.MemberNumber === "number")
									FriendListBeep(data.MemberNumber);
							}
						}
					}
				]
			}
		]
	});

	FriendListBeepElement.replaceWith(beepDialog);


	const textArea = /** @type {HTMLTextAreaElement} */ (document.getElementById(FriendListIDs.beepTextArea));
	if (textArea) {
		textArea.value = data?.Message ?? '';
		textArea.focus();
	}

	FriendListBeepTarget = MemberNumber;
	FriendListResize(true);
}

/**
 * Closes the beep menu
 */
function FriendListBeepMenuClose() {
	ElementRemove(FriendListIDs.beepList);
	FriendListBeepTarget = -1;
	FriendListBeepShowRoom = true;
}

/**
 * Sends the beep and message on send click
 */
function FriendListBeepMenuSend() {
	if (FriendListBeepTarget === -1) return;

	const textarea = /** @type {HTMLTextAreaElement} */ (document.getElementById(FriendListIDs.beepTextArea));
	if (textarea) {
		const msg = textarea.value;
		ServerSendBeepMessage(FriendListBeepTarget, msg, { includeRoom: FriendListBeepShowRoom });
	}
	FriendListBeepMenuClose();
}

/**
 * Shows the wanted beep on click from beep list
 * @param {number} i index of the beep
 * @returns {SafePromise<void>}
 */
async function FriendListShowBeep(i) {
	const beep = FriendListBeepLog[i];
	if (typeof beep?.MemberNumber !== "number") return;
	FriendListModeIndex = 1;
	await FriendListShow();
	FriendListBeep(beep.MemberNumber, beep);
}
//#endregion

//#region FRIEND LIST
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
	ElementValue("InputSearch", ChatSearchMuffle(room));
}

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
	if (!document.getElementById(FriendListIDs.friendList)) return;

	// Loads the header caption
	const BeepCaption = InterfaceTextGet("Beep");
	const SentCaption = InterfaceTextGet("SentBeep");
	const ReceivedCaption = InterfaceTextGet("ReceivedBeep");
	const MailCaption = InterfaceTextGet("BeepWithMail");
	const sortingSymbol = FriendListSortingDirection === "Asc" ? "↑" : "↓";
	const friendListScrollPercent = ElementGetScrollPercentage(FriendListIDs.friendList) || 0;
	const friendList = /** @type {HTMLElement} */ (document.getElementById(FriendListIDs.friendList));
	friendList.innerHTML = "";

	/** @type {HTMLDivElement[]} */
	const FriendListContent = [];
	FriendListCloseActionsMenu();

	const mode = FriendListMode[FriendListModeIndex];
	ServerUpdateFriendList(data);

	const dataMap = new Map(data.map(friend => [friend.MemberNumber, friend]));

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
		const elem = /** @type {HTMLElement} */ (document.getElementById(id));
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
				pending: false,
				isOnline: true,
				canDelete: FriendListCanDelete(friend.MemberNumber),
				canBeep: true,
				canAdd: false,
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
		// In Beeps mode, we show all the beeps sent and received
		for (let i = FriendListBeepLog.length - 1; i >= 0; i--) {
			const beepData = FriendListBeepLog[i];
			const chatRoomSpaceCaption = InterfaceTextGet(`ChatRoomSpace${beepData.ChatRoomSpace || "F"}`);
			const chatRoomName = ChatSearchMuffle(beepData.ChatRoomName ?? "");
			let beepCaption = '';
			const canSearchRoom = FriendListReturn?.Screen === 'ChatSearch' && ChatSearchGetSpace() === (beepData.ChatRoomSpace ?? "");

			const rawBeepCaption = [];
			if (beepData.Sent) {
				rawBeepCaption.push(SentCaption);
			} else {
				rawBeepCaption.push(ReceivedCaption);
			}
			rawBeepCaption.push(TimerHourToString(beepData.Time));
			if (beepData.Message) {
				rawBeepCaption.push(MailCaption);
			}

			beepCaption = rawBeepCaption.join(' ');

			friendRawData.push({
				memberName: beepData.MemberName,
				memberNumber: beepData.MemberNumber,
				relationType: FriendListGetRelationType(beepData.MemberNumber ?? 0),
				isOnline: !!dataMap.get(beepData.MemberNumber ?? 0),
				canBeep: !!dataMap.get(beepData.MemberNumber ?? 0),
				pending: false,
				canAdd: false,
				canDelete: false,
				chatRoom: {
					name: beepData.ChatRoomName,
					caption: chatRoomName || "-",
					canSearchRoom: canSearchRoom,
					types: [
						chatRoomSpaceCaption && chatRoomName ? FriendListIconMapping[beepData.ChatRoomSpace ?? ""] : null,
						beepData.Private ? FriendListIconMapping.Private : null,
					],
				},
				beep: {
					beepIndex: i,
					hasMessage: !!beepData.Message,
					caption: beepCaption
				}
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
						isPending ? { tag: "span", children: [String.fromCharCode(2**32 - 1)], attributes: { hidden: true } } : undefined,
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
			if (friend.canBeep || friend.beep.hasMessage) {
				row.append(
					ElementButton.Create(
						`friend-list-show-beep-${friend.memberNumber}`,
						() => { if (typeof friend.beep?.beepIndex === "number") FriendListShowBeep(friend.beep.beepIndex); },
						{ noStyling: true },
						{
							button: {
								classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-beeps-content'],
								children: [friend.beep.caption],
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
						friend.beep.caption
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
		ServerSend("AccountQuery", { Query: "OnlineFriends" });
	}
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
						function() { FriendListToggleActionsMenu.call(this, memberNumber); },
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

	Object.assign(menu.style, {
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
 * Handles mode changes for friend list
 * @param {number} modeIndex - mode to change to
 */
function FriendListChangeMode(modeIndex) {
	FriendListModeIndex = modeIndex;
	if (FriendListModeIndex < 0) FriendListModeIndex = FriendListMode.length - 1;
	else if (FriendListModeIndex >= FriendListMode.length) FriendListModeIndex = 0;
	FriendListSortingMode = 'None';
	FriendListSortingDirection = 'Asc';
	document.getElementById(FriendListIDs.root)?.setAttribute("data-mode", FriendListMode[FriendListModeIndex]);
	document.getElementById(FriendListIDs.modeTitle)?.replaceChildren(TextGet(FriendListMode[FriendListModeIndex]));
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
//#endregion

//#region UTILITY FUNCTIONS
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
//#endregion UTILITY FUNCTIONS
