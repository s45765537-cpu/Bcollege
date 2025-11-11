'use strict';

var KeybindingDefaults = {
	/**
	 * Default keybinding categories for organizing commands.
	 *
	 * @type {readonly Keybindings.Category[]}
	 */
	DefaultCategories: [
		{
			id: "chat"
		},
		{
			id: "maproom"
		},
		{
			id: "chatroom"
		},
		{
			id: "navigation"
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
			prerequisite: () =>
				(document.activeElement === null
					|| document.activeElement === document.body
					|| document.activeElement.id === "MainCanvas"
					|| document.activeElement instanceof HTMLDialogElement)
				&& document.activeElement.id !== "InputChat"
		},
		{
			id: 'isInChatRoom',
			prerequisite: () => ServerPlayerIsInChatRoom(),
			showInUI: true
		},
		{
			id: 'isOnChatRoomScreen',
			prerequisite: () => ServerPlayerIsInChatRoom() && CurrentScreen === "ChatRoom" && CurrentCharacter === null,
			showInUI: true
		},
		{
			id: 'isChatRoomCharacterMode',
			prerequisite: () => ServerPlayerIsInChatRoom() && ChatRoomIsViewActive("Character"),
			showInUI: true
		},
		{
			id: 'isChatRoomMapMode',
			prerequisite: () => ServerPlayerIsInChatRoom() && ChatRoomIsViewActive("Map"),
			showInUI: true
		},
		{
			id: 'isChatRoomChatFocused',
			prerequisite: () => document.activeElement === ElementWrap('InputChat'),
			showInUI: true
		},
		{
			id: 'isChatRoomChatNOTFocused',
			prerequisite: () => document.activeElement !== ElementWrap('InputChat'),
			showInUI: true
		},
		{
			id: 'noModifiers',
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
