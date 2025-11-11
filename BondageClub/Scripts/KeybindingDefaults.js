'use strict';

var KeybindingDefaults = {
	/**
	 * Default keybinding categories for organizing commands.
	 *
	 * @type {readonly Keybindings.Category[]}
	 */
	DefaultCategories: [
		{
			id: "chat",
			name: "CategoryChat"
		},
		{
			id: "maproom",
			name: "CategoryMapChatRoom"
		},
		{
			id: "chatroom",
			name: "CategoryChatRoom"
		},
		{
			id: "navigation",
			name: "CategoryNavigation"
		},
	],

	/**
	 * Default contexts where keybindings may be active.
	 * Each context has a prerequisite function to check if it should apply.
	 *
	 * @type {readonly Keybindings.Context[]}
	 */
	DefaultContexts: [
		{
			id: 'always',
			name: 'ContextAlways',
			prerequisite: () =>
				(document.activeElement === null
					|| document.activeElement === document.body
					|| document.activeElement.id === "MainCanvas"
					|| document.activeElement instanceof HTMLDialogElement)
				&& document.activeElement.id !== "InputChat"
		},
		{
			id: 'isInChatRoom',
			name: 'ContextInChatRoom',
			prerequisite: () => ServerPlayerIsInChatRoom(),
			showInUI: true
		},
		{
			id: 'isOnChatRoomScreen',
			name: 'ContextOnChatRoomScreen',
			prerequisite: () => ServerPlayerIsInChatRoom() && CurrentScreen === "ChatRoom" && CurrentCharacter === null,
			showInUI: true
		},
		{
			id: 'isChatRoomCharacterMode',
			name: 'ContextCharacterMode',
			prerequisite: () => ServerPlayerIsInChatRoom() && ChatRoomIsViewActive("Character"),
			showInUI: true
		},
		{
			id: 'isChatRoomMapMode',
			name: 'ContextMapMode',
			prerequisite: () => ServerPlayerIsInChatRoom() && ChatRoomIsViewActive("Map"),
			showInUI: true
		},
		{
			id: 'isChatRoomChatFocused',
			name: 'ContextChatFocused',
			prerequisite: () => document.activeElement === ElementWrap('InputChat'),
			showInUI: true
		},
		{
			id: 'isChatRoomChatNOTFocused',
			name: 'ContextChatNotFocused',
			prerequisite: () => document.activeElement !== ElementWrap('InputChat'),
			showInUI: true
		},
		{
			id: 'noModifiers',
			name: 'ContextNoModifiers',
			prerequisite: (event) => !CommonKey.GetModifiers(event),
			showInUI: false
		}
	],

	/**
	 * Built-in default keybindings initialized at startup.
	 * Each binding specifies an action, its assigned keys, category, and contexts.
	 *
	 * @type {readonly Keybindings.Keybinding[]}
	 */
	DefaultKeybindings: [
		// #region Navigation
		{
			id: 'navigation_home',
			action: {
				name: 'BindScrollToTopName',
				description: 'BindScrollToTopDesc',
				action: CommonNoop,
			},
			contextIds: [],
			keyCombo: {
				key: 'Home',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			id: 'navigation_end',
			action: {
				name: 'BindScrollToBottomName',
				description: 'BindScrollToBottomDesc',
				action: CommonNoop,
			},
			contextIds: [],
			keyCombo: {
				key: 'End',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			id: 'navigation_pageup',
			action: {
				name: 'BindScrollUpName',
				description: 'BindScrollUpDesc',
				action: CommonNoop,
			},
			contextIds: [],
			keyCombo: {
				key: 'PageUp',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			id: 'navigation_pagedown',
			action: {
				name: 'BindScrollDownName',
				description: 'BindScrollDownDesc',
				action: CommonNoop,
			},
			contextIds: [],
			keyCombo: {
				key: 'PageDown',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			id: 'navigation_arrowup',
			action: {
				name: 'BindScrollUpName',
				description: 'BindScrollUpDesc',
				action: CommonNoop,
			},
			contextIds: [],
			keyCombo: {
				key: 'ArrowUp',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			id: 'navigation_arrowdown',
			action: {
				name: 'BindScrollDownName',
				description: 'BindScrollDownDesc',
				action: CommonNoop,
			},
			contextIds: [],
			keyCombo: {
				key: 'ArrowDown',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		// #endregion Navigation
		// #region Map Chatroom
		{
			id: 'maproom_arrowup',
			action: {
				name: 'BindMoveUpName',
				description: 'BindMoveUpDesc',
				action: () => false,
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'ArrowUp',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_W',
			action: {
				name: 'BindMoveUpName',
				description: 'BindMoveUpDesc',
				action: () => false,
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'KeyW',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_arrowdown',
			action: {
				name: 'BindMoveDownName',
				description: 'BindMoveDownDesc',
				action: () => false,
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'ArrowDown',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_S',
			action: {
				name: 'BindMoveDownName',
				description: 'BindMoveDownDesc',
				action: () => false,
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'KeyS',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_arrowleft',
			action: {
				name: 'BindMoveLeftName',
				description: 'BindMoveLeftDesc',
				action: () => false,
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'ArrowLeft',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_A',
			action: {
				name: 'BindMoveLeftName',
				description: 'BindMoveLeftDesc',
				action: () => false,
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'KeyA',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_arrowright',
			action: {
				name: 'BindMoveRightName',
				description: 'BindMoveRightDesc',
				action: () => false,
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'ArrowRight',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_D',
			action: {
				name: 'BindMoveRightName',
				description: 'BindMoveRightDesc',
				action: () => false,
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'KeyD',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'map_zoom_out',
			action: {
				name: "BindMapZoomOutName",
				description: "BindMapZoomOutDesc",
				action: () => {
					if (ChatRoomMapViewPerceptionRange < ChatRoomMapViewPerceptionRangeMax) ChatRoomMapViewPerceptionRange++;
					return true;
				},
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: "Slash",
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'map_zoom_in',
			action: {
				name: "BindMapZoomInName",
				description: "BindMapZoomInDesc",
				action: () => {
					if (ChatRoomMapViewPerceptionRange > ChatRoomMapViewPerceptionRangeMin) ChatRoomMapViewPerceptionRange--;
					return true;
				},
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: "Equal",
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'map_focus_chat',
			action: {
				name: "BindMapFocusChatName",
				description: "BindMapFocusChatDesc",
				action: () => {
					ElementFocus("InputChat");
					return true;
				},
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: "Enter",
			},
			readonly: true,
			categoryId: 'maproom',
		},
		// {
		// id: 'map_admin_undo',
		// action: {
		// name: "BindMapAdminUndo",
		// description: "BindMapAdminUndoDesc",
		// action: () => {
		// if (ChatRoomPlayerIsAdmin()) ChatRoomMapViewUndo();
		// return true;
		// },
		// },
		// contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
		// keyCombo: {
		// key: "KeyZ", // Can't represent a layout-independent Z here (it's W on AZERTY)
		// modifiers: new Set(["Ctrl"]),
		// },
		// readonly: true,
		// categoryId: 'maproom',
		// },
		// #endregion Map ChatRoom
		// #region Chat
		{
			id: 'chat_autocomplete',
			action: {
				name: 'BindAutoCompleteName',
				description: 'BindAutoCompleteDesc',
				action: () => {
					const inputChat = /** @type {HTMLTextAreaElement} */ (ElementWrap('InputChat'));
					if (inputChat?.value.length !== 0) {
						CommandAutoComplete(inputChat.value);
					}

					return false;
				},
			},
			contextIds: ['isInChatRoom', 'isChatRoomChatFocused', 'noModifiers'],
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'Tab',
			}
		},
		{
			id: 'chat_send_chat',
			action: {
				name: 'BindSendMessageName',
				description: 'BindSendMessageDesc',
				action: (event) => {
					event.preventDefault();
					ChatRoomSendChat();
					return true;
				},
			},
			contextIds: ['isInChatRoom', 'isChatRoomChatFocused'],
			categoryId: 'chat',
			readonly: false,
			defaultKeyCombo: {
				key: 'Enter',
			}
		},
		{
			id: 'chat_history_prev',
			action: {
				name: 'BindChatHistoryPreviousName',
				description: 'BindChatHistoryPreviousDesc',
				action: () => {
					ChatRoomScrollHistory(true);
					return true;
				},
			},
			contextIds: ['isInChatRoom', 'isChatRoomChatFocused', 'noModifiers'],
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'PageUp',
			}
		},
		{
			id: 'chat_history_next',
			action: {
				name: 'BindChatHistoryNextName',
				description: 'BindChatHistoryNextDesc',
				action: () => {
					ChatRoomScrollHistory(false);
					return true;
				},
			},
			contextIds: ['isInChatRoom', 'isChatRoomChatFocused', 'noModifiers'],
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'PageDown',
			}
		},
		{
			id: 'chat_focus_change',
			action: {
				name: 'BindFocusChangeName',
				description: 'BindFocusChangeDesc',
				action: () => {
					if (
						document.activeElement.id === "MainCanvas" ||
						document.activeElement === null ||
						document.activeElement === document.body
					) {
						ElementScrollToEnd("TextAreaChatLog");
						ElementFocus("InputChat");

						return true;
					}

					return false;
				},
			},
			contextIds: ['isOnChatRoomScreen', 'noModifiers'],
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'Escape',
			}
		},
		// #endregion Chat
		// #region ChatRoom
		{
			id: 'chatroom_leave',
			action: {
				name: 'BindChatRoomLeaveName',
				description: 'BindChatRoomLeaveDesc',
				action: () => {
					ChatRoomAttemptLeave();
					return true;
				},
			},
			contextIds: ['isInChatRoom'],
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'Escape',
				modifiers: new Set(['Shift'])
			}
		},
		{
			id: 'chatroom_toggle_kneel',
			action: {
				name: 'BindToggleKneelName',
				description: 'BindToggleKneelDesc',
				action: (event) => {
					if (!event.repeat) {
						ChatRoomToggleKneel();
						return true;
					}

					return false;
				},
			},
			contextIds: ['isInChatRoom'],
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'KeyK',
				modifiers: new Set(['Alt'])
			}
		},
		{
			id: 'chatroom_open_profile',
			action: {
				name: 'BindOpenProfileName',
				description: 'BindOpenProfileDesc',
				action: () => {
					if (CurrentCharacter) { DialogLeave({ reload: false }); }
					ChatRoomOpenInformationScreen();

					return true;
				},
			},
			contextIds: ['isInChatRoom'],
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'KeyI',
				modifiers: new Set(['Alt'])
			}
		},
		{
			id: 'chatroom_open_wardrobe',
			action: {
				name: 'BindOpenWardrobeName',
				description: 'BindOpenWardrobeDesc',
				action: () => {
					if (CurrentCharacter) { DialogLeave({ reload: false }); }
					ChatRoomOpenWardrobeScreen();

					return true;
				},
			},
			contextIds: ['isInChatRoom'],
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'KeyB',
				modifiers: new Set(['Alt'])
			}
		},
		{
			id: 'chatroom_open_admin_screen',
			action: {
				name: 'BindOpenAdminScreenName',
				description: 'BindOpenAdminScreenDesc',
				action: () => {
					if (CurrentCharacter) { DialogLeave({ reload: false }); }
					ChatRoomOpenAdminScreen();

					return true;
				},
			},
			contextIds: ['isInChatRoom'],
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'KeyH',
				modifiers: new Set(['Alt'])
			}
		},
		// #endregion ChatRoom
	],
};
