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
			prerequisite: () => ServerPlayerIsInChatRoom() && CurrentScreen === "ChatRoom",
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
			action: {
				id: 'navigation_home',
				name: 'BindScrollToTopName',
				description: 'BindScrollToTopDesc',
				action: CommonNoop,
				contextIds: []
			},
			keyCombo: {
				key: 'Home',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			action: {
				id: 'navigation_end',
				name: 'BindScrollToBottomName',
				description: 'BindScrollToBottomDesc',
				action: CommonNoop,
				contextIds: []
			},
			keyCombo: {
				key: 'End',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			action: {
				id: 'navigation_pageup',
				name: 'BindScrollUpName',
				description: 'BindScrollUpDesc',
				action: CommonNoop,
				contextIds: []
			},
			keyCombo: {
				key: 'PageUp',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			action: {
				id: 'navigation_pagedown',
				name: 'BindScrollDownName',
				description: 'BindScrollDownDesc',
				action: CommonNoop,
				contextIds: []
			},
			keyCombo: {
				key: 'PageDown',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			action: {
				id: 'navigation_arrowup',
				name: 'BindScrollUpName',
				description: 'BindScrollUpDesc',
				action: CommonNoop,
				contextIds: []
			},
			keyCombo: {
				key: 'ArrowUp',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			action: {
				id: 'navigation_arrowdown',
				name: 'BindScrollDownName',
				description: 'BindScrollDownDesc',
				action: CommonNoop,
				contextIds: []
			},
			keyCombo: {
				key: 'ArrowDown',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		// #endregion Navigation
		// #region Map Chatroom
		{
			action: {
				id: 'maproom_arrowup',
				name: 'BindMoveUpName',
				description: 'BindMoveUpDesc',
				action: CommonNoop,
				contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"]
			},
			keyCombo: {
				key: 'ArrowUp',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			action: {
				id: 'maproom_W',
				name: 'BindMoveUpName',
				description: 'BindMoveUpDesc',
				action: CommonNoop,
				contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"]
			},
			keyCombo: {
				key: 'KeyW',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			action: {
				id: 'maproom_arrowdown',
				name: 'BindMoveDownName',
				description: 'BindMoveDownDesc',
				action: CommonNoop,
				contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"]
			},
			keyCombo: {
				key: 'ArrowDown',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			action: {
				id: 'maproom_S',
				name: 'BindMoveDownName',
				description: 'BindMoveDownDesc',
				action: CommonNoop,
				contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"]
			},
			keyCombo: {
				key: 'KeyS',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			action: {
				id: 'maproom_arrowleft',
				name: 'BindMoveLeftName',
				description: 'BindMoveLeftDesc',
				action: CommonNoop,
				contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"]
			},
			keyCombo: {
				key: 'ArrowLeft',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			action: {
				id: 'maproom_A',
				name: 'BindMoveLeftName',
				description: 'BindMoveLeftDesc',
				action: CommonNoop,
				contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"]
			},
			keyCombo: {
				key: 'KeyA',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			action: {
				id: 'maproom_arrowright',
				name: 'BindMoveRightName',
				description: 'BindMoveRightDesc',
				action: CommonNoop,
				contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"]
			},
			keyCombo: {
				key: 'ArrowRight',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			action: {
				id: 'maproom_D',
				name: 'BindMoveRightName',
				description: 'BindMoveRightDesc',
				action: CommonNoop,
				contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"]
			},
			keyCombo: {
				key: 'KeyD',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		// #endregion Map ChatRoom
		// #region Chat
		{
			action: {
				id: 'chat_autocomplete',
				name: 'BindAutoCompleteName',
				description: 'BindAutoCompleteDesc',
				action: () => {
					const inputChat = /** @type {HTMLTextAreaElement} */ (ElementWrap('InputChat'));
					if (inputChat?.value.length !== 0) {
						CommandAutoComplete(inputChat.value);
					}

					return false;
				},
				contextIds: ['isInChatRoom', 'isChatRoomChatFocused', 'noModifiers'],
			},
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'Tab',
			}
		},
		{
			action: {
				id: 'chat_send_chat',
				name: 'BindSendMessageName',
				description: 'BindSendMessageDesc',
				action: (event) => {
					event.preventDefault();
					ChatRoomSendChat();
					return true;
				},
				contextIds: ['isInChatRoom', 'isChatRoomChatFocused'],
			},
			categoryId: 'chat',
			readonly: false,
			defaultKeyCombo: {
				key: 'Enter',
			}
		},
		{
			action: {
				id: 'chat_history_prev',
				name: 'BindChatHistoryPreviousName',
				description: 'BindChatHistoryPreviousDesc',
				action: () => {
					ChatRoomScrollHistory(true);
					return true;
				},
				contextIds: ['isInChatRoom', 'isChatRoomChatFocused', 'noModifiers'],
			},
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'PageUp',
			}
		},
		{
			action: {
				id: 'chat_history_next',
				name: 'BindChatHistoryNextName',
				description: 'BindChatHistoryNextDesc',
				action: () => {
					ChatRoomScrollHistory(false);
					return true;
				},
				contextIds: ['isInChatRoom', 'isChatRoomChatFocused', 'noModifiers'],
			},
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'PageDown',
			}
		},
		{
			action: {
				id: 'chat_focus_change',
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
				contextIds: ['isOnChatRoomScreen', 'noModifiers'],
			},
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'Escape',
			}
		},
		// #endregion Chat
		// #region ChatRoom
		{
			action: {
				id: 'chatroom_leave',
				name: 'BindChatRoomLeaveName',
				description: 'BindChatRoomLeaveDesc',
				action: () => {
					ChatRoomAttemptLeave();
					return true;
				},
				contextIds: ['isInChatRoom'],
			},
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'Escape',
				modifiers: new Set(['Shift'])
			}
		},
		{
			action: {
				id: 'chatroom_toggle_kneel',
				name: 'BindToggleKneelName',
				description: 'BindToggleKneelDesc',
				action: (event) => {
					if (!event.repeat) {
						ChatRoomToggleKneel();
						return true;
					}

					return false;
				},
				contextIds: ['isInChatRoom'],
			},
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'KeyK',
				modifiers: new Set(['Alt'])
			}
		},
		{
			action: {
				id: 'chatroom_open_profile',
				name: 'BindOpenProfileName',
				description: 'BindOpenProfileDesc',
				action: () => {
					if (CurrentCharacter) { DialogLeave({ reload: false }); }
					ChatRoomOpenInformationScreen();

					return true;
				},
				contextIds: ['isInChatRoom'],
			},
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'KeyI',
				modifiers: new Set(['Alt'])
			}
		},
		{
			action: {
				id: 'chatroom_open_wardrobe',
				name: 'BindOpenWardrobeName',
				description: 'BindOpenWardrobeDesc',
				action: () => {
					if (CurrentCharacter) { DialogLeave({ reload: false }); }
					ChatRoomOpenWardrobeScreen();

					return true;
				},
				contextIds: ['isInChatRoom'],
			},
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'KeyB',
				modifiers: new Set(['Alt'])
			}
		},
		{
			action: {
				id: 'chatroom_open_admin_screen',
				name: 'BindOpenAdminScreenName',
				description: 'BindOpenAdminScreenDesc',
				action: () => {
					if (CurrentCharacter) { DialogLeave({ reload: false }); }
					ChatRoomOpenAdminScreen();

					return true;
				},
				contextIds: ['isInChatRoom'],
			},
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
