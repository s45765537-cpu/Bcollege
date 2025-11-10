'use strict';

var KeybindingManager = {
	/** @type {TextCache} */
	TextCache: undefined,
	/**
	 * A map from `KeyboardEvent.code` values to their ASCII key label.
	 *
	 * Used to convert browser key codes into human-readable names.
	 */
	ASCIIKeyboardMap: Object.freeze({
		KeyA: "A",
		KeyB: "B",
		KeyC: "C",
		KeyD: "D",
		KeyE: "E",
		KeyF: "F",
		KeyG: "G",
		KeyH: "H",
		KeyI: "I",
		KeyJ: "J",
		KeyK: "K",
		KeyL: "L",
		KeyM: "M",
		KeyN: "N",
		KeyO: "O",
		KeyP: "P",
		KeyQ: "Q",
		KeyR: "R",
		KeyS: "S",
		KeyT: "T",
		KeyU: "U",
		KeyV: "V",
		KeyW: "W",
		KeyX: "X",
		KeyY: "Y",
		KeyZ: "Z",

		Digit0: "0",
		Digit1: "1",
		Digit2: "2",
		Digit3: "3",
		Digit4: "4",
		Digit5: "5",
		Digit6: "6",
		Digit7: "7",
		Digit8: "8",
		Digit9: "9",

		Enter: "Enter",

		Numpad0: "Num0",
		Numpad1: "Num1",
		Numpad2: "Num2",
		Numpad3: "Num3",
		Numpad4: "Num4",
		Numpad5: "Num5",
		Numpad6: "Num6",
		Numpad7: "Num7",
		Numpad8: "Num8",
		Numpad9: "Num9",
		NumpadAdd: "Num +",
		NumpadSubtract: "Num -",
		NumpadMultiply: "Num *",
		NumpadDivide: "Num /",
		NumpadEnter: "Enter",
		NumpadDecimal: "Num .",

		ArrowLeft: "Left",
		ArrowRight: "Right",
		ArrowUp: "Up",
		ArrowDown: "Down",

		Tab: "Tab",
		Escape: "Esc",
		Space: "Space",
		Delete: "Delete",
		Backspace: "Backspace",
		PageUp: "Page Up",
		PageDown: "Page Down",
		Home: "Home",
		End: "End",

		Alt: "Alt",
		Shift: "Shift",
		Control: "Ctrl",

		Backquote: "`",
		Backslash: "\\",
		Quote: "'",
		Period: ".",
		BracketLeft: "[",
		Slash: "/",
		Comma: ",",
		Minus: "-",
		Equal: "=",
		Semicolon: ";",
		BracketRight: "]",
	}),

	/**
	 * Maps logical modifier keys to their symbol representation.
	 */
	ModifierSymbols: Object.freeze({
		Ctrl: '⌃',
		Shift: '⇧',
		Alt: '⌥'
	}),

	/**
	 * Reverse map of modifier symbols to their logical modifier keys.
	 */
	ReverseModifierSymbols: Object.freeze({
		'⌃': 'Ctrl',
		'⇧': 'Shift',
		'⌥': 'Alt'
	}),


	/**
	 * Class for managing categories, contexts, and keybindings.
	 * Handles registration, updates, serialization, and event handling.
	 */
	KeybindManager: class KeybindManager {
		/** @private @type {Map<string, Keybindings.Keybinding>} */
		keybindings = new Map();
		/** @private @type {Map<string, Keybindings.Category>} */
		categories = new Map();
		/** @private @type {Map<string, Keybindings.Context>} */
		contexts = new Map();

		/**
		 * Initializes with default categories, contexts, and keybindings.
		 */
		constructor() {
			if (!KeybindingManager.TextCache) {
				KeybindingManager.TextCache = new TextCache("Screens/Character/Preference/Text_Keybindings.csv");
			} else KeybindingManager.TextCache.buildCache();

			KeybindingDefaults.DefaultCategories.forEach(c => this.registerCategory(c));
			KeybindingDefaults.DefaultContexts.forEach(c => this.registerContext(c));
			KeybindingDefaults.DefaultKeybindings.forEach(kb => this.registerKeybinding(kb));
		}

		/**
		 * Registers a new keybinding category.
		 * Categories are sorted alphabetically by name after insertion.
		 * Logs errors if invalid or already exists.
		 *
		 * @param {Keybindings.Category} category
		 * @returns {void}
		 */
		registerCategory(category) {
			if (!category) return console.error('No category provided.');
			if (!category.id) return console.error('No category id provided.');
			if (!category.name) return console.error('No category name provided.');

			const cat = this.categories.get(category.id);
			if (cat) return console.error(`Keybinding category '${category.id}' already registered.`);

			this.categories.set(category.id, category);
			this.categories = new Map([...this.categories.entries()]
				.sort((a, b) => this.getTranslated(a[1].id).localeCompare(this.getTranslated(b[1].id))));
		}

		/**
		 * Returns a category by ID.
		 *
		 * @param {string} id
		 * @returns {Keybindings.Category}
		 */
		getCategory(id) {
			return this.categories.get(id);
		}

		/**
		 * Returns all registered categories.
		 *
		 * @returns {Keybindings.Category[]}
		 */
		getAllCategories() {
			return Array.from(this.categories.values());
		}

		/**
		 * Registers a new context with its prerequisite.
		 * Contexts are sorted alphabetically by name after insertion.
		 * Logs errors if invalid or already exists.
		 *
		 * @param {Keybindings.Context} context
		 */
		registerContext(context) {
			if (!context) return console.error('No context provided.');
			if (!context.id) return console.error('No context id provided.');
			if (!context.name) return console.error('No context name provided.');
			if (!context.prerequisite) return console.error('No context prerequisite provided.');

			const ctx = this.contexts.get(context.id);
			if (ctx) return console.error(`Keybinding context '${context.id}' already registered.`);

			this.contexts.set(context.id, context);
			this.contexts = new Map([...this.contexts.entries()]
				.sort((a, b) => this.getTranslated(a[1].name).localeCompare(this.getTranslated(b[1].name))));

		}

		/**
		 * Returns a context by ID.
		 *
		 * @param {string} id
		 * @returns {Keybindings.Context}
		 */
		getContext(id) {
			return this.contexts.get(id);
		}

		/**
		 * Returns all registered contexts.
		 *
		 * @returns {Keybindings.Context[]}
		 */
		getAllContexts() {
			return Array.from(this.contexts.values());
		}

		/**
		 * Registers a new keybinding.
		 * Validates category, contexts, and key combo.
		 * Automatically limits modifiers to a max of two.
		 *
		 * @param {Keybindings.Keybinding} keybinding
		 */
		registerKeybinding(keybinding) {
			if (!keybinding) return console.error('No keybinding provided.');
			if (!keybinding.action) return console.error('No keybinding action provided.');
			if (!keybinding.action.id) return console.error('No keybinding action id provided.');
			if (!keybinding.action.name) return console.error('No keybinding action name provided.');
			if (!keybinding.action.action) return console.error('No keybinding action function provided.');
			if (!keybinding.keyCombo && !keybinding.defaultKeyCombo) return console.error('No keybinding keyCombo provided.');
			if (keybinding.keyCombo?.key === undefined && keybinding.defaultKeyCombo?.key === undefined) return console.error('No keybinding key provided.');
			if (keybinding.readonly === undefined) return console.error('No keybinding readonly property provided.');

			const keybindingEntry = this.keybindings.get(keybinding.action.id);
			const category = this.categories.get(keybinding.categoryId);
			const unregisteredContexts = keybinding.action.contextIds?.filter(ctx => !this.contexts.get(ctx));

			if (keybinding.keyCombo?.key === undefined && keybinding.defaultKeyCombo?.key)
				keybinding.keyCombo = keybinding.defaultKeyCombo;

			if (keybindingEntry && keybindingEntry.uninitialized)
				this._finishUninitializedKeybinding(keybinding);

			if (keybindingEntry && !keybindingEntry.uninitialized)
				return console.error(`Keybinding action with id '${keybinding.action.id}' already registered.`);

			if (keybinding.categoryId && !category && !keybinding.uninitialized)
				return console.error(`Keybinding category '${keybinding.categoryId}' not found.`);

			if (keybinding.action.contextIds?.length > 0 && unregisteredContexts.length > 0)
				return console.error(`Keybinding context(s) '${unregisteredContexts.join(', ')}' not found.`);

			if (keybinding.keyCombo?.modifiers?.size > 2) {
				keybinding.keyCombo.modifiers = new Set([...keybinding.keyCombo.modifiers].slice(0, 2));
				console.warn(`Keybinding '${keybinding.action.name}' has more than 2 modifiers. Only the first 2 will be used.`);
			}

			this.keybindings.set(keybinding.action.id, keybinding);
			this.keybindings = new Map([...this.keybindings.entries()]
				.sort((a, b) => this.getTranslated(a[1].action.name).localeCompare(this.getTranslated(b[1].action.name))));
		}

		/**
		 * Returns a keybinding by its action ID.
		 *
		 * @param {string} actionId
		 * @returns {Keybindings.Keybinding}
		 */
		getKeybinding(actionId) {
			return this.keybindings.get(actionId);
		}

		/**
		 * Returns all keybindings.
		 * Optionally includes uninitialized ones.
		 *
		 * @param {{ showUninitialized: boolean }} [options]
		 * @returns {Keybindings.Keybinding[]}
		 */
		getAllKeybindings(options) {
			if (!options) {
				options = {
					showUninitialized: false
				};
			}

			const keybindings = Array.from(this.keybindings.values());
			if (!options?.showUninitialized) return keybindings.filter(kb => !kb.uninitialized);

			return Array.from(this.keybindings.values());
		}

		/**
		 * Removes a keybinding by action ID.
		 *
		 * @param {string} actionId
		 * @returns {boolean} `true` if deleted, `false` if not found.
		 */
		unregisterKeybinding(actionId) {
			return this.keybindings.delete(actionId);
		}

		/**
		 * Updates the assigned key combo for a keybinding.
		 * Logs an error if readonly or not found.
		 *
		 * @param {string} actionId
		 * @param {Keybindings.KeyCombo} keyCombo
		 */
		updateKeybinding(actionId, keyCombo) {
			const keybinding = this.keybindings.get(actionId);
			if (!keybinding) return console.error(`Keybinding action with id '${actionId}' not found.`);
			if (keybinding.readonly) return console.error(`Keybinding action with id '${actionId}' is readonly.`);

			keybinding.keyCombo = keyCombo;
		}

		/**
		 * Handles a browser `keydown` event, triggering matching keybindings
		 * if their contexts are active and modifiers match.
		 *
		 * @param {KeyboardEvent} event
		 * @returns {boolean} `true` if handled, otherwise `false`.
		 */
		handleKeyPress(event) {
			// prevent any keybinds from being triggered when the keybinds screen is open
			// let the keybinds screen handle its own keybinds hassle
			if (PreferenceSubscreen?.name === 'Keybindings') return false;

			if (event.code in KeybindingManager.ASCIIKeyboardMap === false) return false;

			const code = /** @type {Keybindings.KeyCombo['key']} */ (event.code);

			/** @type {Keybindings.KeyCombo} */
			const keyCombo = {
				key: code,
				modifiers: this.getModifiers(event)
			};

			/** @type {Keybindings.Keybinding[]} */
			const activeKeybindings = [...this.keybindings.values()].filter(kb =>
				kb.keyCombo.key === keyCombo.key &&
				this._areModifiersConflicting(kb.keyCombo.modifiers, keyCombo.modifiers)
			);

			let handled = false;
			for (const keybinding of activeKeybindings) {
				if (keybinding.action.contextIds.every(ctx => this.contexts.get(ctx).prerequisite(event))) {
					handled = keybinding.action.action(event) || handled;
				}
			}

			return handled;
		}

		/**
		 * Extracts modifier keys from a `KeyboardEvent` into a Set.
		 *
		 * @param {KeyboardEvent} event
		 * @returns {Set<Keybindings.ModifierKey>}
		 */
		getModifiers(event) {
			/** @type {Set<Keybindings.ModifierKey>} */
			const modifiers = new Set();
			if (event.ctrlKey) modifiers.add('Ctrl');
			if (event.altKey) modifiers.add('Alt');
			if (event.shiftKey) modifiers.add('Shift');
			return modifiers;
		}

		/**
		 * Finds keybindings that conflict with the one identified by `actionId`.
		 *
		 * @param {string} actionId
		 * @returns {Keybindings.Keybinding[]}
		 */
		getConflictingKeybindings(actionId) {
			const keybinding = this.keybindings.get(actionId);
			if (!keybinding) return [];

			return [...this.keybindings.values()].filter(kb =>
				kb.action.id !== keybinding.action.id &&
				kb.keyCombo.key === keybinding.keyCombo.key &&
				this._areModifiersConflicting(keybinding.keyCombo.modifiers, kb.keyCombo.modifiers) &&
				this._areContextsConflicting(new Set(keybinding.action.contextIds), new Set(kb.action.contextIds))
			);
		}

		/**
		 * Serializes all current keybindings into Player.KeybindingSettings.
		 * Compresses using LZString.
		 */
		serialize() {
			if (!Player) return console.error('Player not initialized.');

			const serialized = [...this.keybindings.values()].filter(kb => !kb.readonly).map(kb => /** @type {Keybindings.KeybindingSerialized} */({
				actionId: kb.action.id,
				keyCombo: kb.keyCombo.key + ' ' + (kb.keyCombo.modifiers ? [...kb.keyCombo.modifiers].map(mod => KeybindingManager.ModifierSymbols[mod]).join('') : '')
			}));
			const stringified = LZString.compressToBase64(JSON.stringify(serialized));
			Player.KeybindingSettings = stringified;
		}

		/**
		 * Restores keybindings from Player.KeybindingSettings.
		 * Registers missing bindings as uninitialized placeholders.
		 */
		deserialize() {
			if (!Player) return console.error('Player not initialized.');

			/** @type {string} */
			const settingsStringified = Player.KeybindingSettings ?? '';

			if (settingsStringified === '') return;

			try {
				/** @type {Keybindings.KeybindingSerialized[]} */
				const settings = JSON.parse(LZString.decompressFromBase64(settingsStringified)) ?? [];

				settings.forEach(kb => {
					const isDefaultKeybinding = this.keybindings.has(kb.actionId);

					const [key, modifiersString] = kb.keyCombo.split(' ');
					/** @type {Set<Keybindings.ModifierKey>} */
					const modifiers = new Set([...(modifiersString || '')].map(sym => KeybindingManager.ReverseModifierSymbols[sym]));

					if (key in KeybindingManager.ASCIIKeyboardMap === false) return console.error(`Unknown key: ${key}`);

					const code = /** @type {Keybindings.KeyCombo['key']} */ (key);

					if (isDefaultKeybinding) {
						if (this.keybindings.get(kb.actionId)?.readonly) return;

						/** @type {Keybindings.KeyCombo} */
						const keyCombo = {
							key: code,
							modifiers: modifiers,
						};

						this.updateKeybinding(kb.actionId, keyCombo);
					} else {
						this.registerKeybinding({
							action: {
								id: kb.actionId,
								name: ' ',
								contextIds: [],
								action: undefined,
							},
							keyCombo: {
								key: code,
								modifiers: modifiers
							},
							categoryId: ' ',
							readonly: false,
							uninitialized: true
						});
					}
				});
			} catch (e) {
				console.error(e);
				return;
			}
		}

		/** @param {string | Partial<Record<ServerChatRoomLanguage | "TW", string>>} raw */
		getTranslated(raw) {
			if (!raw) return "";

			if (typeof raw === "string") {
				const translated = KeybindingManager.TextCache.cache[raw];

				if (translated) return translated;

				return raw;
			} else if (raw[TranslationLanguage]) {
				return raw[TranslationLanguage];
			}
		}

		/** @param {Keybindings.Keybinding} keybinding */
		isDefaultCombo(keybinding) {
			return keybinding.defaultKeyCombo.key === keybinding.keyCombo.key && this._areModifiersConflicting(keybinding.defaultKeyCombo.modifiers, keybinding.keyCombo.modifiers);
		}

		/**
		 * Completes the registration of an uninitialized keybinding.
		 * Used when a binding exists in storage but not in defaults at load time.
		 *
		 * @private
		 * @param {Keybindings.Keybinding} keybinding
		 */
		_finishUninitializedKeybinding(keybinding) {
			const keybindingEntry = this.keybindings.get(keybinding.action.id);

			if (!keybindingEntry)
				return console.error(`Keybinding action with id '${keybinding.action.id}' not found`);

			const conflictingKeybindings = this.getConflictingKeybindings(keybinding.action.id);
			if (conflictingKeybindings.length > 0)
				console.warn(`Keybinding '${keybinding.action.name}' conflicts with another keybinding(s).`, conflictingKeybindings);

			// @ts-ignore
			keybindingEntry.action = keybinding.action;
			// @ts-ignore
			keybindingEntry.defaultKeyCombo = keybinding.defaultKeyCombo;
			// @ts-ignore
			keybindingEntry.categoryId = keybinding.categoryId;
			// @ts-ignore
			keybindingEntry.readonly = keybinding.readonly;
			delete keybindingEntry.uninitialized;
		}

		/**
		 * Checks if two modifier sets match exactly.
		 *
		 * @private
		 * @param {Set<Keybindings.ModifierKey>} modifiers1
		 * @param {Set<Keybindings.ModifierKey>} modifiers2
		 * @returns {boolean}
		 */
		_areModifiersConflicting(modifiers1, modifiers2) {
			modifiers1 ??= new Set();
			modifiers2 ??= new Set();

			return [...modifiers1].every(mod => modifiers2.has(mod)) && [...modifiers2].every(mod => modifiers1.has(mod));
		}

		/**
		 * Checks if two context sets match exactly.
		 *
		 * @private
		 * @param {Set<string>} contexts1
		 * @param {Set<string>} contexts2
		 * @returns {boolean}
		 */
		_areContextsConflicting(contexts1, contexts2) {
			return [...contexts1].every(ctx => contexts2.has(ctx)) && [...contexts2].every(ctx => contexts1.has(ctx));
		}
	}
};
var KeyManager = new KeybindingManager.KeybindManager();
