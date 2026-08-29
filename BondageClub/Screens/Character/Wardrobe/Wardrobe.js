"use strict";
var WardrobeBackground = "Private";
/** @type {(Character | null)[]} */
var WardrobeCharacter = [];
var WardrobeSelection = -1;
var WardrobeOffset = 0;
var WardrobeSize = 24;
/** @type {WardrobeReorderType} */
var WardrobeReorderMode = "None";
/** @type {number[]} */
var WardrobeReorderList = [];
/**
 * Wardrobe screen state.
 * @namespace
 */
var Wardrobe = {
	previewColumns: 6,
	previewRows: 2,
	previewPerPage: () => Wardrobe.previewColumns * Wardrobe.previewRows,
	labelColumns: 3,
	labelRows: 8,
	labelPerPage: () => Wardrobe.labelColumns * Wardrobe.labelRows,
	search: "",
	/** @type {Character} */
	selectedCharacter: /** @type {never} */ (null),
	excludeBodyparts: false,
	/** @type {ScreenSpecifier | null} */
	returnScreen: null,
	/** @type {string | null} */
	appearanceBackup: null,
	/** Cached result of {@link WardrobeGetFilteredSlots}. */
	filteredSlotsCache: /** @type {number[] | null} */ (null),
	/** Search query used to build {@link Wardrobe.filteredSlotsCache}. */
	filteredSlotsQuery: /** @type {string | null} */ (null),
	/** {@link WardrobeSize} used to build {@link Wardrobe.filteredSlotsCache}. */
	filteredSlotsSize: -1,
	/**
	 * Per-canvas draw cache so {@link WardrobeRun} can skip unchanged blits.
	 * @type {Map<string, { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, signature: string }>}
	 */
	canvasCache: new Map(),
	/** Bumped whenever a wardrobe preview appearance may have changed. */
	drawGeneration: 0,
	emptySlotImage: "Icons/NoWardrobe.png",
	filledSlotImage: "Icons/Wardrobe.png",
	/** @type {null | WardrobeActionPreview} */
	previewAction: null,
	/** Slot used by the current Load/Save preview; `-1` when none. */
	previewSlot: -1,
	/** Confirm dialog is open; ignore hover leave/blur. */
	previewLocked: false,
	/** FastLoad result shown on the main canvas while hovering Load. */
	previewLoadCharacter: /** @type {Character | null} */ (null),
	/** FastSave result shown on the side canvas while hovering Save. */
	previewSaveCharacter: /** @type {Character | null} */ (null),
	/** Full-size character columns on the left. */
	characterPreview: {
		width: 500,
		height: 1000,
		/** Left: current character, or Load result while hovering Load. */
		mainX: 0,
		/** Right: selected slot, or Save result while hovering Save. */
		sideX: 500,
	},
	/** Slot inspector panel, kept clear of both character previews. */
	inspectorRect: {
		x: 1100,
		y: 150,
		width: 850,
		height: 700,
	},
	/** Preview grid area to the right of the full-size character(s). */
	grid: {
		x: 500,
		y: 100,
		width: 1500,
		height: 890,
	},
};
const WardrobeID = Object.freeze({
	screen: "wardrobe-screen",
	previous: "wardrobe-previous",
	next: "wardrobe-next",
	page: "wardrobe-page",
	load: "wardrobe-load",
	save: "wardrobe-save",
	delete: "wardrobe-delete",
	rename: "wardrobe-rename",
	search: "wardrobe-search",
	name: "wardrobe-name",
	noMatches: "wardrobe-no-matches",
	status: "wardrobe-status",
	reorder: "wardrobe-reorder",
	exit: "wardrobe-exit",
	excludeBodyparts: "wardrobe-exclude-bodyparts",
	showPreviews: "wardrobe-show-previews",
	previewOverlay: "wardrobe-preview-overlay",
	previewOverlayClose: "wardrobe-preview-overlay-close",
	mainCanvas: "wardrobe-main-canvas",
	sideCanvas: "wardrobe-side-canvas",
	loadPreview: "wardrobe-load-preview",
	savePreview: "wardrobe-save-preview",
	slotGrid: "wardrobe-slot-grid",
	/**
	 * @param {number} index
	 * @returns {string}
	 */
	slotCell: (index) => `wardrobe-slot-cell-${index}`,
	/**
	 * @param {number} index
	 * @returns {string}
	 */
	slotButton: (index) => `wardrobe-slot-button-${index}`,
	/**
	 * @param {number} index
	 * @returns {string}
	 */
	slotCanvas: (index) => `wardrobe-slot-canvas-${index}`,
	/**
	 * @param {number} index
	 * @returns {string}
	 */
	slotEmpty: (index) => `wardrobe-slot-empty-${index}`,
	/**
	 * @param {number} index
	 * @returns {string}
	 */
	slotLoad: (index) => `wardrobe-slot-load-${index}`,
});

/**
 * Slot preview canvas size/zoom. Previews display much smaller than the full character,
 * so a half-res buffer saves fill-rate without looking soft on tablets (also `CommonIsMobile`).
 * @returns {{ width: number, height: number, zoom: number }}
 */
function WardrobeGetSlotCanvasSize() {
	return { width: 250, height: 500, zoom: 0.5 };
}

/**
 * Loads the player's wardrobe. when the player opens the wardrobe screen for the first time.
 * This function is called dynamically.
 * @type {ScreenLoadHandler}
 *
 */
async function WardrobeLoad() {
	CurrentDarkFactor = 0.5;
	Wardrobe.appearanceBackup = CharacterAppearanceBackup;

	const search = ElementCreateInput(WardrobeID.search, "search", "", 20);
	search.placeholder = TextGet("OutfitSearch");
	search.setAttribute("aria-label", TextGet("OutfitSearch"));
	search.setAttribute("autocomplete", "off");
	search.addEventListener("input", WardrobeSearchInput);

	const status = ElementCreate({
		tag: "span",
		attributes: { id: WardrobeID.status },
		children: [WardrobeGetStatusText()],
	});
	const page = ElementCreate({ tag: "span", attributes: { id: WardrobeID.page } });

	const screen = ElementDOMScreen.getTemplate(WardrobeID.screen, {
		hgroupInHeader: true,
		header: status,
		menubarButtons: WardrobeCreateMenuButtons(),
		parent: document.body,
	});
	const header = screen.querySelector(".screen-header");
	const headerHGroup = header?.querySelector(".screen-hgroup");
	if (header && headerHGroup) {
		header.insertBefore(
			ElementCreate({
				tag: "div",
				classList: ["wardrobe-header-controls"],
				children: [search, page],
			}),
			headerHGroup,
		);
	}
	WardrobeLoadCharacters();
	WardrobeCreateElements();
	WardrobeUpdateElements();
}

/**
 * Shows the wardrobe screen. This function is called dynamically on a repeated basis. So don't call complex functions
 * or use extended loops in this function.
 * @returns {void} - Nothing
 */
function WardrobeRun() {
	// Characters are ensured in WardrobeUpdateElements / overlay open — Run only blits.
	const mainCharacter = WardrobeGetMainPreviewCharacter();
	if (mainCharacter) {
		WardrobeDrawToCanvas(WardrobeID.mainCanvas, mainCharacter, 1);
	}
	const sideCharacter = WardrobeGetSidePreviewCharacter();
	if (sideCharacter) {
		WardrobeDrawToCanvas(WardrobeID.sideCanvas, sideCharacter, 1);
	}

	if (WardrobeSelection !== -1 || !WardrobeShowsCharacters()) return;

	const filteredSlots = WardrobeGetFilteredSlots();
	const slotsPerPage = WardrobeGetSlotsPerPage();
	const { zoom } = WardrobeGetSlotCanvasSize();
	for (let C = 0; C < slotsPerPage; C++) {
		const slot = filteredSlots[C + WardrobeOffset];
		if (slot == null || WardrobeIsSlotEmpty(slot)) continue;
		const character = WardrobeCharacter[slot];
		if (!character) continue;
		WardrobeDrawToCanvas(WardrobeID.slotCanvas(C), character, zoom);
	}
}

/**
 * Handles the click events in the wardrobe screen. Clicks are propagated from CommonClick()
 * @type {MouseEventListener}
 */
function WardrobeClick() {
}

/**
 * @type {ScreenResizeHandler}
 */
function WardrobeResize() {
	const { width, height, mainX, sideX } = Wardrobe.characterPreview;
	ElementPositionFixed(WardrobeID.screen, 0, 0, 2000, 1000);
	ElementPositionFixed(WardrobeID.mainCanvas, mainX, 0, width, height);
	ElementPositionFixed(WardrobeID.sideCanvas, sideX, 0, width, height);
	ElementPositionFixed(WardrobeID.noMatches, 500, 420, 1500, 60);
	ElementPositionFixed(`checkbox-pair-${WardrobeID.excludeBodyparts}`, 70, 900, 450);

	if (WardrobeSelection !== -1) {
		const { x, y, width: overlayW, height: overlayH } = Wardrobe.inspectorRect;
		ElementPositionFixed(WardrobeID.previewOverlay, x, y, overlayW, overlayH);
	}

	const { x: X, y: Y, width: Width, height: Height } = Wardrobe.grid;
	ElementPositionFixed(WardrobeID.slotGrid, X, Y, Width, Height);
	WardrobeFitSlotLabels();
}

/**
 * Shrink visible slot names so they fit their label box after a layout change.
 * @returns {void} - Nothing
 */
function WardrobeFitSlotLabels() {
	const grid = ElementWrap(WardrobeID.slotGrid);
	if (!grid || grid.hasAttribute("hidden")) return;
	const names = /** @type {NodeListOf<HTMLElement>} */ (grid.querySelectorAll(".wardrobe-slot-button:not([hidden]) .wardrobe-slot-name"));
	for (const name of names) {
		name.style.fontSize = "";
		ElementFitText(name);
	}
}

/**
 * @type {KeyboardEventListener}
 */
function WardrobeKeyDown(event) {
	return false;
}

/**
 * Exits the wardorbe screen and sends the player back to her private room
 * @type {ScreenExitHandler}
 */
function WardrobeExit() {
	if (WardrobeSelection !== -1) {
		WardrobeTogglePreviewOverlay(-1);
		return;
	}

	CommonSetScreen(...Wardrobe.returnScreen ?? ["Room", "MainHall"]);
	Wardrobe.returnScreen = null;
}

/**
 * Unload the Wardrobe screen
 */
function WardrobeUnload() {
	ElementRemove(WardrobeID.screen);
	WardrobeReorderModeSet("None");
	WardrobeClearCharacters();
	Wardrobe.selectedCharacter = /** @type {never} */ (null);
	WardrobeTogglePreviewOverlay(-1);
	WardrobeSetActionPreview(null, true);
	// Always open the wardrobe on the first page
	WardrobeOffset = 0;
	Wardrobe.search = "";
	WardrobeInvalidateFilteredSlots();
}

/**
 * Removes all wardrobe preview characters.
 * @returns {void} - Nothing
 */
function WardrobeClearCharacters() {
	for (const char of WardrobeCharacter) {
		if (char) CharacterDelete(char);
	}
	WardrobeCharacter = [];
	WardrobeClearActionPreviewCharacters();
	WardrobeInvalidateCanvasCache();
}

/**
 * Slot / action-preview dummies use a `wardrobe-` CharacterID so {@link WardrobeGroupAccessible} treats them like the player.
 * @param {Character} C
 * @returns {boolean}
 */
function WardrobeIsPreviewCharacter(C) {
	return C.CharacterID.startsWith("wardrobe-");
}

/**
 * Character drawn on the main wardrobe canvas.
 * Default: current character. Load hover: FastLoad result onto the current character.
 * @returns {Character | null}
 */
function WardrobeGetMainPreviewCharacter() {
	if (Wardrobe.previewAction === "Load") {
		return Wardrobe.previewLoadCharacter ?? Wardrobe.selectedCharacter;
	}
	return Wardrobe.selectedCharacter;
}

/**
 * Character drawn on the side wardrobe canvas while a slot is open.
 * Default: selected slot. Save hover: how the slot will look after saving.
 * @returns {Character | null}
 */
function WardrobeGetSidePreviewCharacter() {
	if (WardrobeSelection < 0) return null;
	if (Wardrobe.previewAction === "Save") {
		return Wardrobe.previewSaveCharacter ?? Wardrobe.selectedCharacter ?? null;
	}
	return WardrobeCharacter[WardrobeSelection] ?? null;
}

/**
 * Whether the side character canvas should be visible.
 * @returns {boolean}
 */
function WardrobeShouldShowSidePreview() {
	if (WardrobeSelection < 0) return false;
	if (Wardrobe.previewAction === "Save") return true;
	return !WardrobeIsSlotEmpty(WardrobeSelection);
}

/**
 * Sync side-canvas visibility with the current selection / action preview.
 * @returns {void} - Nothing
 */
function WardrobeUpdateSidePreviewVisibility() {
	const sideCanvas = ElementWrap(WardrobeID.sideCanvas);
	if (!sideCanvas) return;
	const showSide = WardrobeShouldShowSidePreview();
	const wasHidden = sideCanvas.hasAttribute("hidden");
	sideCanvas.toggleAttribute("hidden", !showSide);
	if (showSide && wasHidden) {
		WardrobeInvalidateCanvasCache(WardrobeID.sideCanvas);
	}
}

/**
 * @param {null | WardrobeActionPreview} action
 * @param {boolean} [force]
 * @param {number} [slot] - Slot to preview; defaults to {@link WardrobeSelection}.
 * @returns {void} - Nothing
 */
function WardrobeSetActionPreview(action, force = false, slot) {
	if (!force && Wardrobe.previewLocked) return;
	const previewSlot = action == null ? -1 : (slot ?? WardrobeSelection);
	if (Wardrobe.previewAction === action && Wardrobe.previewSlot === previewSlot) return;

	Wardrobe.previewAction = action;
	Wardrobe.previewSlot = previewSlot;
	WardrobeClearActionPreviewCharacters();
	if (action === "Load") WardrobeBuildLoadPreviewCharacter();
	else if (action === "Save") WardrobeBuildSavePreviewCharacter();
	WardrobeUpdateSidePreviewVisibility();
	WardrobeInvalidateCanvasCache(WardrobeID.mainCanvas);
	WardrobeInvalidateCanvasCache(WardrobeID.sideCanvas);
}

/**
 * @param {string} characterId
 * @returns {void} - Nothing
 */
function WardrobeDeletePreviewCharacter(characterId) {
	const existing = Character.find(c => c.CharacterID === characterId);
	if (existing) CharacterDelete(existing);
}

/**
 * Delete temporary Load/Save preview characters.
 * @returns {void} - Nothing
 */
function WardrobeClearActionPreviewCharacters() {
	WardrobeDeletePreviewCharacter(WardrobeID.loadPreview);
	WardrobeDeletePreviewCharacter(WardrobeID.savePreview);
	Wardrobe.previewLoadCharacter = null;
	Wardrobe.previewSaveCharacter = null;
}

/**
 * Build a character that mirrors applying {@link WardrobeFastLoad} to {@link Wardrobe.selectedCharacter}.
 * @returns {Character | null}
 */
function WardrobeBuildLoadPreviewCharacter() {
	Wardrobe.previewLoadCharacter = null;
	const target = Wardrobe.selectedCharacter;
	const slot = Wardrobe.previewSlot;
	if (!target || slot < 0 || WardrobeIsSlotEmpty(slot)) return null;

	WardrobeDeletePreviewCharacter(WardrobeID.loadPreview);
	const preview = CharacterLoadSimple(WardrobeID.loadPreview);
	WardrobeFastLoad(preview, slot, false, {
		ExcludeBodyparts: true,
		BodyCharacter: target,
		ExpressionSource: target.IsPlayer() ? target : undefined,
	});
	Wardrobe.previewLoadCharacter = preview;
	return preview;
}

/**
 * Build a character that mirrors how the selected slot will look after {@link WardrobeFastSave}.
 * With {@link Wardrobe.excludeBodyparts}, keeps the side dummy's body and applies the main dummy's clothes.
 * @returns {Character | null}
 */
function WardrobeBuildSavePreviewCharacter() {
	Wardrobe.previewSaveCharacter = null;
	const target = Wardrobe.selectedCharacter;
	const slot = WardrobeSelection;
	if (!target || slot < 0) return null;

	const appearance = WardrobeBuildAppearanceBundle(target);
	if (appearance.length === 0) return null;

	WardrobeDeletePreviewCharacter(WardrobeID.savePreview);
	const preview = CharacterLoadSimple(WardrobeID.savePreview);
	/** @type {WardrobeFastLoadOptions} */
	const options = { Appearance: appearance };
	if (Wardrobe.excludeBodyparts) {
		options.ExcludeBodyparts = true;
		options.BodyCharacter = WardrobeCharacter[slot] ?? target;
	}
	WardrobeFastLoad(preview, slot, false, options);
	Wardrobe.previewSaveCharacter = preview;
	return preview;
}

/**
 * Pointer/focus handlers so Load/Save preview the appearance that action would apply.
 * @param {WardrobeActionPreview} action
 * @param {() => number | null} [getSlot] - Slot to preview for grid Load; defaults to {@link WardrobeSelection}.
 * @returns {Partial<Record<"button", Omit<HTMLOptions<"button">, "tag">>>}
 */
function WardrobeActionPreviewButtonOptions(action, getSlot) {
	const preview = () => {
		if (getSlot) {
			const slot = getSlot();
			if (slot == null || WardrobeIsSlotEmpty(slot)) return;
			WardrobeSetActionPreview(action, false, slot);
			return;
		}
		WardrobeSetActionPreview(action);
	};
	return {
		button: {
			eventListeners: {
				pointerenter: preview,
				pointerleave: () => WardrobeSetActionPreview(null),
				focus: preview,
				blur: () => WardrobeSetActionPreview(null),
			},
		},
	};
}

/**
 * Outfit currently shown in a visible grid cell.
 * @param {number} cellIndex
 * @returns {number | null}
 */
function WardrobeGetVisibleSlot(cellIndex) {
	const slot = WardrobeGetFilteredSlots()[cellIndex + WardrobeOffset];
	return slot == null ? null : slot;
}

/**
 * Loads the player's wardrobe safe spots. If a spot is not named yet, initializes it with the player's name
 * @deprecated Handled at login
 * @returns {void} - Nothing
 */
function WardrobeLoadCharacterNames() { }

/**
 * Makes sure the wardrobe is of the correct length.
 * If someone tampered with the wardrobe's size, all extended slots are deleted.
 * @returns {void} - Nothing
 */
function WardrobeFixLength() {
	let Push = false;
	if (Player.Wardrobe.length > WardrobeSize) {
		Player.Wardrobe = Player.Wardrobe.slice(0, WardrobeSize - 1);
		Push = true;
	}
	while (Player.Wardrobe.length < WardrobeSize) {
		Player.Wardrobe.push(null);
		Push = true;
	}
	while (Player.WardrobeCharacterNames.length <= WardrobeSize) {
		Player.WardrobeCharacterNames.push(Player.Name);
		Push = true;
	}
	if (Push) {
		ServerAccountUpdate.QueueData({ WardrobeCharacterNames: Player.WardrobeCharacterNames });
	}
}

/**
 * Reset wardrobe preview characters. Characters are loaded lazily for the visible page.
 * @returns {void} - Nothing
 */
function WardrobeLoadCharacters() {
	WardrobeClearCharacters();
	WardrobeCharacter = new Array(WardrobeSize).fill(null);
	WardrobeEnsureVisibleCharacters();
}

/**
 * Loads the preview character for a wardrobe slot if it is not loaded yet.
 * @param {number} slot
 * @returns {Character | null}
 */
function WardrobeEnsureSlotCharacter(slot) {
	if (slot < 0 || slot >= WardrobeSize) return null;
	if (WardrobeCharacter.length < WardrobeSize) {
		WardrobeCharacter.length = WardrobeSize;
	}
	if (WardrobeIsSlotEmpty(slot)) {
		if (WardrobeCharacter[slot]) {
			CharacterDelete(WardrobeCharacter[slot]);
			WardrobeCharacter[slot] = null;
			WardrobeInvalidateCanvasCache();
		}
		Player.WardrobeCharacterNames[slot] = "";
		return null;
	}
	if (WardrobeCharacter[slot]) return WardrobeCharacter[slot];

	const C = CharacterLoadSimple(`wardrobe-${slot}`);
	C.Name = Player.WardrobeCharacterNames[slot];
	WardrobeCharacter[slot] = C;
	WardrobeFastLoad(C, slot, false);
	return C;
}

/**
 * Ensure preview characters exist for the current page (and selected overlay slot).
 * Releases off-page characters to keep memory bounded.
 * @param {number[]} [filteredSlots]
 * @returns {void} - Nothing
 */
function WardrobeEnsureVisibleCharacters(filteredSlots = WardrobeGetFilteredSlots()) {
	// Keep the current page loaded even while the overlay is open, so closing it does not rebuild previews.
	const page = WardrobeShowsCharacters()
		? filteredSlots.slice(WardrobeOffset, WardrobeOffset + WardrobeGetSlotsPerPage())
		: [];
	const keep = new Set([
		...(WardrobeSelection >= 0 ? [WardrobeSelection] : []),
		...page,
	]);

	for (const slot of keep) WardrobeEnsureSlotCharacter(slot);

	let released = false;
	for (let slot = 0; slot < WardrobeCharacter.length; slot++) {
		if (keep.has(slot) || !WardrobeCharacter[slot]) continue;
		CharacterDelete(/** @type {Character} */ (WardrobeCharacter[slot]));
		WardrobeCharacter[slot] = null;
		released = true;
	}
	// Recreated slots reuse CharacterIDs; drop blit signatures so Run cannot skip stale pixels.
	if (released) WardrobeInvalidateCanvasCache();
}

/**
 * Open the wardrobe screen with the given character as a target
 * @param {Character} C
 */
async function WardrobeOpenCharacter(C) {
	Wardrobe.returnScreen = CommonGetScreen();
	Wardrobe.selectedCharacter = C;
	return CommonSetScreen("Character", "Wardrobe");
}

/**
 * Advance to the next reordering mode, or set the mode to the specified
 * value.  The reordering mode cycles through the values:
 * "None" -> "Select" -> "Place"
 *
 * @param {WardrobeReorderType | null} newMode - The mode to set.  If null, advance to next mode.
 */
function WardrobeReorderModeSet(newMode = null) {
	let push = true;
	/** @type {Record<WardrobeReorderType, WardrobeReorderType>} */
	const cycle = {
		"None": "Select",
		"Select": "Place",
		"Place": "None",
	};
	newMode ??= cycle[WardrobeReorderMode];
	if (newMode === "Place" && WardrobeReorderList.length <= 0) {
		// If selection list is empty, flip back to "None"; skip unnecessary network traffic.
		push = false;
		newMode = "None";
	}

	if (newMode == "None" && WardrobeReorderMode != "None") {
		// We may have been in the middle of reordering things.
		// Commit the current state, and empty the list.
		if (push) {
			WardrobePushAll();
		}
		WardrobeReorderList = [];
	}
	if (newMode !== "None") {
		WardrobeSetSearch("");
		WardrobeTogglePreviewOverlay(-1);
	}
	WardrobeReorderMode = newMode;
	WardrobeUpdateElements();
}

/**
 * Set a wardrobe character name, sync it with server
 * @param {number} W - The number of the wardrobe slot to save
 * @param {string} Name - The name of the wardrobe slot
 * @param {boolean} [Push=false] -If set to true, the changes are pushed to the server
 */
function WardrobeSetCharacterName(W, Name, Push = false) {
	Player.WardrobeCharacterNames[W] = Name;
	if (WardrobeCharacter[W]) {
		WardrobeCharacter[W].Name = Name;
	}
	WardrobeInvalidateFilteredSlots();
	if (Push) {
		ServerAccountUpdate.QueueData({ WardrobeCharacterNames: Player.WardrobeCharacterNames });
	}
}

/**
 * Reduces a given asset to the attributes needed for the wardrobe
 * @param {Item} A - The asset that should be reduced
 * @returns {ItemBundle} - The bundled asset
 */
function WardrobeAssetBundle(A) {
	const bundle = ServerBundledItemFromAppearanceItem(A);
	if (bundle.Property?.Expression) {
		delete bundle.Property.Expression; // Don't add expressions to the wardrobe
		if (Object.keys(bundle.Property).length === 0) delete bundle.Property;
	}
	return bundle;
}

/**
 * Load character appearance from wardrobe, only load clothes on others
 * @param {Character} C - The character the appearance should be loaded for
 * @param {number} W - The spot in the wardrobe the appearance should be loaded to
 * @param {boolean} [Update=false] - If set to true, the appearance will be updated to the server
 * @param {WardrobeFastLoadOptions} [Options]
 * @returns {void} - Nothing
 */
function WardrobeFastLoad(C, W, Update = false, Options = {}) {
	const wardrobe = Options.Appearance ?? Player.Wardrobe[W];
	if (!wardrobe || wardrobe.length === 0 || !Wardrobe.selectedCharacter) return;

	const excludeBodyparts = !!Options.ExcludeBodyparts && Wardrobe.excludeBodyparts;
	const bodySource = Options.BodyCharacter ?? Wardrobe.selectedCharacter;
	const expressionSource = Options.ExpressionSource ?? (C.IsPlayer() ? Player : null);
	const savedExpression = expressionSource ? WardrobeGetExpression(expressionSource) : {};
	// Snapshot before clearing, in case bodySource is C itself.
	const base = excludeBodyparts
		? bodySource.Appearance.filter(a => a.Asset.Group.IsBody())
		: null;

	C.Appearance = C.Appearance
		.filter(a => !a.Asset.Group.IsAppearance() || !WardrobeGroupAccessible(C, a.Asset.Group, { ExcludeNonCloth: true }));

	const safeWardrobe = wardrobe
		.filter(w => w.Name != null && w.Group != null)
		.filter(w => !InventoryGet(C, w.Group));
	for (const w of safeWardrobe) {
		const A = AssetGet(C.AssetFamily, w.Group, w.Name);
		if (!A || !A.Group.IsAppearance()) continue;
		if (!InventoryAvailable(Player, A.Name, A.Group.Name)) continue;
		if (!WardrobeGroupAccessible(C, A.Group, { ExcludeNonCloth: true })) continue;

		const item = CharacterAppearanceSetItem(C, w.Group, A, w.Color, 0);
		if (item && w.Property) {
			item.Property ??= {};
			for (const key of CommonKeys(w.Property)) {
				if (key !== "Expression") {
					// @ts-ignore Strict-TS
					item.Property[key] = w.Property[key];
				}
			}
		}
	}

	// Adds any critical appearance asset that could be missing, adds the default one
	const appearanceGroups = AssetGroup
		.filter(g => g.IsAppearance() && !g.AllowNone);
	for (const g of appearanceGroups) {
		const item = InventoryGet(C, g.Name);
		if (item) continue;
		// For a group with a mirrored group, we copy the opposite if it exists
		const mirrorItem = g.MirrorGroup ? InventoryGet(C, g.MirrorGroup) : null;
		if (mirrorItem) {
			CharacterAppearanceSetItem(
				C, g.Name,
				AssetGet(C.AssetFamily, g.Name, mirrorItem.Asset.Name),
				mirrorItem.Color
			);
			continue;
		}
		const firstAsset = AssetGroupGet(C.AssetFamily, g.Name)?.Asset[0];
		if (firstAsset) {
			CharacterAppearanceSetItem(
				C, g.Name,
				firstAsset
			);
		}
	}
	if (base) {
		C.Appearance = [...base, ...C.Appearance.filter(a => !a.Asset.Group.IsBody())];
	}
	if (expressionSource) {
		for (const item of C.Appearance) {
			if (!item.Asset.Group.HasExpression()) continue;
			if (!savedExpression[item.Asset.Group.Name]) continue;
			item.Property ??= {};
			item.Property.Expression = savedExpression[item.Asset.Group.Name];
		}
	}
	CharacterRefresh(C, Update);
	WardrobeInvalidateCanvasCache();
	if (Update) {
		if (C.IsPlayer()) ServerPlayerAppearanceSync();
		if (C.IsPlayer() || C.IsOnline()) ChatRoomCharacterUpdate(C);
	}
}

/**
 * Build the appearance bundle that {@link WardrobeFastSave} would write for a character.
 * When {@link Wardrobe.excludeBodyparts} is set, only clothing is saved (no body groups).
 * @param {Character} C
 * @returns {ItemBundle[]}
 */
function WardrobeBuildAppearanceBundle(C) {
	const addAll = C.IsPlayer() || WardrobeIsPreviewCharacter(C);
	const clothesOnly = Wardrobe.excludeBodyparts;
	/** @type {ItemBundle[]} */
	let bundles = C.Appearance
		.filter(a => a.Asset.Group.IsAppearance())
		.filter(a => !clothesOnly || !a.Asset.Group.IsBody())
		.filter(a => WardrobeGroupAccessible(C, a.Asset.Group, { ExcludeNonCloth: addAll }))
		.map(WardrobeAssetBundle);
	if (!addAll && !clothesOnly) {
		// Using Player's body as base
		bundles = bundles.concat(Player.Appearance
			.filter(a => a.Asset.Group.IsAppearance())
			.filter(a => a.Asset.Group.IsBody())
			.map(WardrobeAssetBundle));
	}
	return bundles;
}

/**
 * Refresh the slot dummy after a save. Clothes-only saves keep the existing dummy body
 * (or the source character's body when the slot was empty).
 * @param {number} slot
 * @param {Character} source
 * @returns {void} - Nothing
 */
function WardrobeRefreshSlotCharacter(slot, source) {
	const outfit = WardrobeCharacter[slot];
	if (outfit) {
		if (source === outfit) return;
		WardrobeFastLoad(outfit, slot, false, Wardrobe.excludeBodyparts
			? { ExcludeBodyparts: true, BodyCharacter: outfit }
			: undefined);
		return;
	}
	if (!WardrobeShowsCharacters() && WardrobeSelection !== slot) return;
	const dummy = WardrobeEnsureSlotCharacter(slot);
	if (!dummy || !Wardrobe.excludeBodyparts) return;
	WardrobeFastLoad(dummy, slot, false, { ExcludeBodyparts: true, BodyCharacter: source });
}

/**
 * Saves character appearance in player's wardrobe, use player's body as base for others
 * @param {Character} C - The character, whose appearance should be saved
 * @param {number} W - The spot in the wardrobe the current outfit should be saved to
 * @param {boolean} [Push=false] - If set to true, the wardrobe is saved on the server
 * @returns {void} - Nothing
 */
function WardrobeFastSave(C, W, Push = false) {
	Player.Wardrobe[W] = WardrobeBuildAppearanceBundle(C);
	WardrobeFixLength();
	WardrobeRefreshSlotCharacter(W, C);
	WardrobeInvalidateFilteredSlots();
	if (Push) {
		ServerAccountUpdate.QueueData({ Wardrobe: CharacterCompressWardrobe(Player.Wardrobe) });
	}
}

/**
 * Swap two slots in the wardrobe.  Will silently do nothing if either
 * index is out of range.
 *
 * @param {number} a - Slot index
 * @param {number} b - The other slot index
 * @returns {void} - Nothing
 */
function WardrobeSwapSlots(a, b) {
	if (a < 0 || b < 0) {
		return;
	}
	if (a < Player.Wardrobe.length && b < Player.Wardrobe.length) {
		// Swap item arrays
		const tmp = Player.Wardrobe[a];
		Player.Wardrobe[a] = Player.Wardrobe[b];
		Player.Wardrobe[b] = tmp;
	}
	if (a < Player.WardrobeCharacterNames.length && b < Player.WardrobeCharacterNames.length) {
		// Swap slot names
		const tmp = Player.WardrobeCharacterNames[a];
		Player.WardrobeCharacterNames[a] = Player.WardrobeCharacterNames[b];
		Player.WardrobeCharacterNames[b] = tmp;
	}
	if (a < WardrobeCharacter.length && b < WardrobeCharacter.length) {
		// Swap "character" entries.
		const tmp = WardrobeCharacter[a];
		WardrobeCharacter[a] = WardrobeCharacter[b];
		WardrobeCharacter[b] = tmp;
	}
	WardrobeInvalidateFilteredSlots();
	WardrobeInvalidateCanvasCache();
}

/**
 * Unconditionally pushes entire wardrobe to the server.  Used primarily after
 * reordering the wardrobe slots.
 *
 * @returns {void} - Nothing
 */
function WardrobePushAll() {
	ServerAccountUpdate.QueueData({
		Wardrobe: CharacterCompressWardrobe(Player.Wardrobe),
		WardrobeCharacterNames: Player.WardrobeCharacterNames,
	});
}

/** @returns {boolean} */
function WardrobeShowsCharacters() { return Player.VisualSettings.ShowCharactersInWardrobe; }

/** @returns {number} */
function WardrobeGetSlotsPerPage() { return WardrobeShowsCharacters() ? Wardrobe.previewPerPage() : Wardrobe.labelPerPage(); }

/**
 * Grid columns/rows for the current wardrobe display mode.
 * @returns {{ columns: number, rows: number }}
 */
function WardrobeGetGridDimensions() {
	if (WardrobeShowsCharacters()) {
		return { columns: Wardrobe.previewColumns, rows: Wardrobe.previewRows };
	}
	return { columns: Wardrobe.labelColumns, rows: Wardrobe.labelRows };
}

/**
 * @param {number} slot
 * @returns {string}
 */
function WardrobeGetSlotIndexLabel(slot) {
	return `${(slot + 1).toString().padStart(String(WardrobeSize).length, "\u2007")}: `;
}

/**
 * Invalidate cached canvas blits after appearance or DOM canvas changes.
 * @param {string} [canvasId] - Specific canvas, or all when omitted
 * @returns {void} - Nothing
 */
function WardrobeInvalidateCanvasCache(canvasId) {
	if (canvasId) {
		Wardrobe.canvasCache.delete(canvasId);
		return;
	}
	Wardrobe.canvasCache.clear();
	Wardrobe.drawGeneration++;
}

/**
 * Resolve a cached 2D context for a wardrobe canvas.
 * @param {string} canvasId
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, signature: string } | null}
 */
function WardrobeGetCanvasCacheEntry(canvasId) {
	let entry = Wardrobe.canvasCache.get(canvasId);
	if (entry?.canvas.isConnected) return entry;

	const canvas = /** @type {HTMLCanvasElement | null} */ (ElementWrap(canvasId));
	if (!canvas) return null;
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;
	entry = { canvas, ctx, signature: "" };
	Wardrobe.canvasCache.set(canvasId, entry);
	return entry;
}

/**
 * Draw a character onto a wardrobe DOM canvas, skipping the blit when nothing changed.
 * @param {string} canvasId
 * @param {Character} character
 * @param {number} [zoom=1]
 * @returns {void} - Nothing
 */
function WardrobeDrawToCanvas(canvasId, character, zoom = 1) {
	const entry = WardrobeGetCanvasCacheEntry(canvasId);
	if (!entry || entry.canvas.hasAttribute("hidden")) return;

	const blinking = !CommonPhotoMode && (Math.round(CurrentTime / 400) % character.BlinkFactor === 0);
	const signature = `${character.CharacterID}\0${blinking ? 1 : 0}\0${character.MustDraw ? 1 : 0}\0${Wardrobe.drawGeneration}\0${zoom}`;
	// Scripted assets may animate; keep redrawing those. Otherwise skip unchanged frames.
	if (!character.HasScriptedAssets && !character.MustDraw && entry.signature === signature) {
		return;
	}

	const { ctx, canvas } = entry;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	DrawCharacter(character, 0, 0, zoom, true, ctx);
	entry.signature = signature;
}

function WardrobeCreateMenuButtons() {
	return [
		ElementButton.Create(WardrobeID.exit, WardrobeExit, { image: "Icons/Exit.png", tooltip: TextGet("Return") }),
		ElementButton.Create(WardrobeID.showPreviews, WardrobeToggleCharacterPreviews, {
			image: WardrobeShowsCharacters() ? "Icons/Character.png" : "Icons/CharacterOff.png",
			tooltip: TextGet("ShowCharacterPreviews"),
		}),
		ElementButton.Create(WardrobeID.reorder, () => WardrobeReorderModeSet(), { image: "Icons/Swap.png", tooltip: TextGet("ReorderSlots") }),
		ElementButton.Create(WardrobeID.next, () => WardrobeChangePage(1), { image: "Icons/Next.png", tooltip: TextGet("NextPage") }),
		ElementButton.Create(WardrobeID.previous, () => WardrobeChangePage(-1), { image: "Icons/Prev.png", tooltip: TextGet("PreviousPage") }),
	];
}

/**
 * @param {number} slot
 * @returns {void} - Nothing
 */
function WardrobeTogglePreviewOverlay(slot) {
	if (slot !== WardrobeSelection) {
		WardrobeSelection = slot;
	} else {
		WardrobeSelection = -1;
	}

	WardrobeSetActionPreview(null, true);

	const elm = ElementWrap(WardrobeID.previewOverlay);
	if (elm) elm.remove();
	if (WardrobeSelection === -1) {
		const main = ElementWrap(WardrobeID.screen)?.querySelector(".screen-main");
		if (!main) return;
		WardrobeResize(false);
		WardrobeUpdateElements();
		return;
	};

	WardrobeEnsureSlotCharacter(slot);

	const name = ElementCreateInput(WardrobeID.name, "text", "", 20);
	name.placeholder = TextGet("OutfitName");
	name.setAttribute("aria-label", TextGet("OutfitName"));
	ElementSetValue(name, WardrobeGetOutfitName(slot));
	name.addEventListener("keydown", WardrobeNameKeyDown);

	ElementCreate({
		tag: "div",
		attributes: { id: WardrobeID.previewOverlay },
		classList: ["HideOnPopup", "no-select"],
		children: [
			ElementButton.Create(WardrobeID.previewOverlayClose, () => WardrobeTogglePreviewOverlay(-1), {
				image: "Icons/cross.svg",
				tooltip: TextGet("Close"),
			}),
			{
				tag: "div",
				classList: ["wardrobe-preview-overlay-content"],
				children: [
					{
						tag: "div",
						classList: ["outfit-naming"],
						children: [
							name,
							ElementButton.Create(WardrobeID.rename, () => WardrobeRenameSelectedOutfit(true), { label: TextGet("Rename") }),
						],
					},
					{
						tag: "div",
						classList: ["outfit-controls"],
						children: [
							ElementButton.Create(
								WardrobeID.load,
								() => WardrobeLoadOutfit(WardrobeSelection),
								{ label: TextGet("Load") },
								WardrobeActionPreviewButtonOptions("Load"),
							),
							ElementButton.Create(
								WardrobeID.save,
								WardrobeSaveSelectedOutfit,
								{ label: TextGet("Save") },
								WardrobeActionPreviewButtonOptions("Save"),
							),
							ElementButton.Create(WardrobeID.delete, WardrobeDeleteSelectedOutfit, { label: TextGet("Delete") }),
						],
					},
				],
			},
		],
		parent: ElementWrap(WardrobeID.screen)?.querySelector(".screen-main"),
	});
	WardrobeResize(false);
	WardrobeUpdateElements();
}

/**
 * @param {string} id
 * @param {object} [options]
 * @param {ParentNode} [options.parent]
 * @param {boolean} [options.hidden]
 * @returns {HTMLCanvasElement}
 */
function WardrobeCreateCharacterCanvas(id, { parent, hidden = false } = {}) {
	const { width, height } = Wardrobe.characterPreview;
	return ElementCreate({
		tag: "canvas",
		attributes: {
			id,
			width: width.toString(),
			height: height.toString(),
			"screen-generated": CurrentScreen,
			"aria-hidden": "true",
			...(hidden ? { hidden: true } : {}),
		},
		classList: ["HideOnPopup", "wardrobe-character-canvas"],
		parent,
	});
}

/**
 * Create DOM controls used by the wardrobe screen.
 * @returns {void} - Nothing
 */
function WardrobeCreateElements() {
	const main = ElementWrap(WardrobeID.screen)?.querySelector(".screen-main");
	if (!main) return;

	WardrobeCreateCharacterCanvas(WardrobeID.mainCanvas, { parent: main });
	WardrobeCreateCharacterCanvas(WardrobeID.sideCanvas, { parent: main, hidden: true });

	ElementCreate({
		tag: "span",
		attributes: { id: WardrobeID.noMatches, "screen-generated": CurrentScreen, "aria-live": "polite" },
		classList: ["HideOnPopup", "no-select"],
		children: [
			TextGet("NoOutfitMatches")
		],
		parent: main,
	});

	ElementCheckbox.CreateLabelled(WardrobeID.excludeBodyparts, TextGet("ExcludeBodyParts"), WardrobeExcludeBodypartsChange, null, { container: { parent: main } });

	WardrobeCreateOutfitSlots();
}

/**
 * @returns {void} - Nothing
 */
function WardrobeCreateOutfitSlots() {
	const main = ElementWrap(WardrobeID.screen)?.querySelector(".screen-main");
	if (!main) return;

	const gridElm = ElementWrap(WardrobeID.slotGrid);
	if (gridElm) gridElm.remove();

	const showPreviews = WardrobeShowsCharacters();
	const { columns, rows } = WardrobeGetGridDimensions();
	const slotCanvasSize = WardrobeGetSlotCanvasSize();
	const grid = ElementCreate({
		tag: "div",
		attributes: { id: WardrobeID.slotGrid, "screen-generated": CurrentScreen },
		classList: [
			"HideOnPopup",
			"wardrobe-slot-grid",
			showPreviews ? "wardrobe-slot-grid-preview" : "wardrobe-slot-grid-labels",
		],
		style: {
			["grid-template-columns"]: `repeat(${columns}, 1fr)`,
			["grid-template-rows"]: `repeat(${rows}, 1fr)`,
		},
		parent: main,
	});

	const slotsPerPage = WardrobeGetSlotsPerPage();
	for (let C = 0; C < slotsPerPage; C++) {
		/** @type {(HTMLOptions<any> | HTMLElement)[]} */
		const previewChildren = showPreviews ? [
			ElementCreate({
				tag: "canvas",
				attributes: {
					id: WardrobeID.slotCanvas(C),
					width: String(slotCanvasSize.width),
					height: String(slotCanvasSize.height),
					"aria-hidden": "true",
					hidden: true,
				},
				classList: ["wardrobe-slot-canvas"],
			})
		] : [];

		const cell = ElementCreate({
			tag: "div",
			attributes: { id: WardrobeID.slotCell(C), "screen-generated": CurrentScreen },
			classList: ["wardrobe-slot"],
			parent: grid,
		});

		ElementButton.Create(
			WardrobeID.slotButton(C),
			() => {
				const slot = WardrobeGetVisibleSlot(C);
				if (slot == null) return;
				WardrobeHandleSlotActivate(slot);
			},
			{
				label: [
					{ tag: "span", classList: ["wardrobe-slot-index"] },
					{ tag: "span", classList: ["wardrobe-slot-name"] },
				],
				labelPosition: showPreviews ? "bottom" : "center",
				noStyling: showPreviews,
				image: Wardrobe.emptySlotImage,
			},
			{
				button: {
					parent: cell,
					classList: ["wardrobe-slot-button", showPreviews ? "wardrobe-slot-preview" : null],
					children: previewChildren,
				},
				img: {
					attributes: {
						id: WardrobeID.slotEmpty(C),
						hidden: true,
					},
					classList: ["wardrobe-slot-empty"],
				},
			},
		);

		const loadPreview = WardrobeActionPreviewButtonOptions("Load", () => WardrobeGetVisibleSlot(C));
		const loadLabel = TextGet("Load");
		ElementButton.Create(
			WardrobeID.slotLoad(C),
			(ev) => {
				ev.stopPropagation();
				const slot = WardrobeGetVisibleSlot(C);
				if (slot == null) return;
				WardrobeLoadOutfit(slot);
			},
			{
				image: "Icons/Dress.png",
				...(showPreviews ? {} : {
					tooltip: loadLabel,
					tooltipPosition: "left",
				}),
			},
			{
				button: {
					...loadPreview.button,
					parent: cell,
					classList: ["wardrobe-slot-load"],
					attributes: {
						hidden: true,
						...(showPreviews ? { "aria-label": loadLabel } : {}),
					},
				},
			},
		);
	}
}

/**
 * @param {number} slot
 * @returns {void} - Nothing
 */
function WardrobeHandleSlotActivate(slot) {
	switch (WardrobeReorderMode) {
		case "None":
			WardrobeTogglePreviewOverlay(slot);
			break;

		case "Select": {
			const idx = WardrobeReorderList.indexOf(slot);
			if (idx >= 0) {
				WardrobeReorderList.splice(idx, 1);
			} else {
				WardrobeReorderList.push(slot);
			}
			WardrobeUpdateElements();
			break;
		}

		case "Place": {
			const sourceSlot = WardrobeReorderList.shift();
			if (sourceSlot === undefined) return;
			WardrobeSwapSlots(sourceSlot, slot);

			if (WardrobeReorderList.length <= 0) {
				WardrobeReorderModeSet("None");
			} else {
				WardrobeUpdateElements();
			}
			break;
		}
	}
}

/**
 * @returns {void} - Nothing
 */
function WardrobeToggleCharacterPreviews() {
	Player.VisualSettings.ShowCharactersInWardrobe = !Player.VisualSettings.ShowCharactersInWardrobe;
	ServerAccountUpdate.QueueData({ VisualSettings: Player.VisualSettings });
	WardrobeOffset = 0;
	WardrobeLoadCharacters();
	WardrobeCreateOutfitSlots();
	WardrobeUpdateElements();
	WardrobeResize(false);
}

/**
 * Update DOM controls with the current wardrobe state.
 * @param {number[]} [filteredSlots]
 * @returns {void} - Nothing
 */
function WardrobeUpdateElements(filteredSlots = WardrobeGetFilteredSlots()) {
	const header = ElementWrap(WardrobeID.screen)?.querySelector(".screen-header");
	const slotsPerPage = WardrobeGetSlotsPerPage();
	const page = filteredSlots.length > 0 ? Math.floor(WardrobeOffset / slotsPerPage) + 1 : 0;
	const pageCount = Math.ceil(filteredSlots.length / slotsPerPage);
	ElementDOMScreen.setHeading(WardrobeID.status, WardrobeGetStatusText());
	ElementSetText(WardrobeID.page, `Page ${page}/${pageCount}`);
	header?.toggleAttribute("hidden", WardrobeSelection !== -1);

	WardrobeEnsureVisibleCharacters(filteredSlots);

	const hasSelection = WardrobeSelection !== -1;
	const hasMultiplePages = filteredSlots.length > slotsPerPage;
	const selectionEmpty = hasSelection && WardrobeIsSlotEmpty(WardrobeSelection);

	ElementWrap(WardrobeID.previous)?.toggleAttribute("disabled", !hasMultiplePages);
	ElementWrap(WardrobeID.next)?.toggleAttribute("disabled", !hasMultiplePages);
	ElementWrap(WardrobeID.load)?.toggleAttribute("disabled", !hasSelection || selectionEmpty);
	ElementWrap(WardrobeID.save)?.toggleAttribute("disabled", !hasSelection);
	ElementWrap(WardrobeID.delete)?.toggleAttribute("disabled", !hasSelection || selectionEmpty);
	ElementWrap(WardrobeID.name)?.toggleAttribute("disabled", !hasSelection);
	ElementWrap(WardrobeID.rename)?.toggleAttribute("disabled", !hasSelection || selectionEmpty);
	ElementWrap(WardrobeID.noMatches)?.toggleAttribute("hidden", filteredSlots.length > 0 || Wardrobe.search.trim().length === 0);

	const search = /** @type {HTMLInputElement | null} */ (ElementWrap(WardrobeID.search));
	search?.toggleAttribute("disabled", WardrobeReorderMode !== "None");
	ElementSetValue(search, Wardrobe.search);
	ElementSetChecked(WardrobeID.excludeBodyparts, Wardrobe.excludeBodyparts);

	const previewsButton = ElementWrap(WardrobeID.showPreviews);
	if (previewsButton) {
		ElementButton.SetImage(previewsButton, WardrobeShowsCharacters() ? "Icons/Character.png" : "Icons/CharacterOff.png");
	}

	const gridHidden = WardrobeSelection !== -1;
	const showPreviews = WardrobeShowsCharacters();
	ElementWrap(WardrobeID.slotGrid)?.toggleAttribute("hidden", gridHidden);
	WardrobeUpdateSidePreviewVisibility();

	for (let C = 0; C < slotsPerPage; C++) {
		const slot = filteredSlots[C + WardrobeOffset];
		const cell = ElementWrap(WardrobeID.slotCell(C));
		const button = ElementWrap(WardrobeID.slotButton(C));
		if (!button) continue;
		cell?.toggleAttribute("hidden", slot == null);
		button.toggleAttribute("hidden", slot == null);
		const buttonLabel = button.querySelector(".button-label");
		if (buttonLabel && slot != null) {
			ElementSetText(buttonLabel.querySelector(".wardrobe-slot-index"), WardrobeGetSlotIndexLabel(slot));
			ElementSetText(buttonLabel.querySelector(".wardrobe-slot-name"), WardrobeGetOutfitName(slot));
		}
		button.classList.toggle("reorder-select", WardrobeReorderMode === "Select" && slot != null && WardrobeReorderList.includes(slot));
		button.classList.toggle("reorder-place", WardrobeReorderMode === "Place" && slot != null && WardrobeReorderList.includes(slot));

		const isEmpty = slot != null && WardrobeIsSlotEmpty(slot);
		button.classList.toggle("wardrobe-slot-empty-button", isEmpty);

		const loadBtn = ElementWrap(WardrobeID.slotLoad(C));
		const shouldHideLoadButton = slot == null || isEmpty || WardrobeReorderMode !== "None";
		loadBtn?.toggleAttribute("hidden", shouldHideLoadButton);

		const slotIcon = ElementWrap(WardrobeID.slotEmpty(C));
		if (slotIcon) {
			const showIcon = slot != null && (isEmpty || !showPreviews);
			slotIcon.toggleAttribute("hidden", !showIcon);
			if (showIcon) {
				const nextSrc = isEmpty ? Wardrobe.emptySlotImage : Wardrobe.filledSlotImage;
				ElementButton.SetImage(slotIcon, nextSrc);
			}
		}

		if (!showPreviews) continue;
		const slotCanvas = ElementWrap(WardrobeID.slotCanvas(C));
		const wasHidden = slotCanvas?.hasAttribute("hidden");
		slotCanvas?.toggleAttribute("hidden", slot == null || isEmpty);
		// Force a fresh blit when a slot canvas becomes visible again.
		if (wasHidden && slotCanvas && !slotCanvas.hasAttribute("hidden")) {
			WardrobeInvalidateCanvasCache(WardrobeID.slotCanvas(C));
		}
	}
	WardrobeFitSlotLabels();
}

/**
 * @param {number} slot
 * @returns {boolean}
 */
function WardrobeIsSlotEmpty(slot) {
	const outfit = Player.Wardrobe[slot];
	return outfit == null || outfit.length === 0;
}

/**
 * @param {number} slot
 * @returns {string}
 */
function WardrobeGetOutfitName(slot) {
	return Player.WardrobeCharacterNames[slot] || TextGet("EmptyOutfitSlot");
}

/**
 * @returns {string}
 */
function WardrobeGetStatusText() {
	switch (WardrobeReorderMode) {
		case "None":
			return TextGet("SelectAppareance");
		case "Select":
			return TextGet("ReorderSelect");
		case "Place":
			return TextGet("ReorderPlace");
		default:
			return "";
	}
}

/**
 * Invalidate cached outfit filtering.
 * @returns {void} - Nothing
 */
function WardrobeInvalidateFilteredSlots() {
	Wardrobe.filteredSlotsCache = null;
	Wardrobe.filteredSlotsQuery = null;
	Wardrobe.filteredSlotsSize = -1;
}

/**
 * @returns {number[]}
 */
function WardrobeGetFilteredSlots() {
	const query = Wardrobe.search.trim().toLocaleLowerCase();
	if (
		Wardrobe.filteredSlotsCache
		&& Wardrobe.filteredSlotsQuery === query
		&& Wardrobe.filteredSlotsSize === WardrobeSize
	) {
		return Wardrobe.filteredSlotsCache;
	}
	const slots = [];
	for (let W = 0; W < WardrobeSize; W++) {
		const slotLabel = WardrobeGetSlotIndexLabel(W) + " " + WardrobeGetOutfitName(W);
		if (!query || slotLabel.toLocaleLowerCase().includes(query)) {
			slots.push(W);
		}
	}
	Wardrobe.filteredSlotsCache = slots;
	Wardrobe.filteredSlotsQuery = query;
	Wardrobe.filteredSlotsSize = WardrobeSize;
	return slots;
}

/**
 * @param {string} search
 * @param {boolean} [resetOffset]
 * @returns {void} - Nothing
 */
function WardrobeSetSearch(search, resetOffset = true) {
	Wardrobe.search = search;
	if (resetOffset) WardrobeOffset = 0;
	const filteredSlots = WardrobeGetFilteredSlots();
	if (WardrobeSelection !== -1 && !filteredSlots.includes(WardrobeSelection)) {
		WardrobeTogglePreviewOverlay(-1);
	}
}

/**
 * @this {HTMLInputElement}
 * @returns {void} - Nothing
 */
function WardrobeSearchInput() {
	WardrobeSetSearch(this.value);
	WardrobeUpdateElements();
}

/**
 * @returns {void} - Nothing
 */
function WardrobeSyncNameInput() {
	const name = /** @type {HTMLInputElement | null} */ (ElementWrap(WardrobeID.name));
	if (name) {
		name.value = WardrobeSelection === -1 ? "" : WardrobeGetOutfitName(WardrobeSelection);
	}
}

/** @type {KeyboardEventListener} */
function WardrobeNameKeyDown(event) {
	if (CommonKey.IsPressed(event, "Enter")) {
		WardrobeRenameSelectedOutfit(true);
		return true;
	}

	return false;
}

/**
 * @param {1 | -1} change
 * @returns {void} - Nothing
 */
function WardrobeChangePage(change) {
	const filteredSlots = WardrobeGetFilteredSlots();
	const slotsPerPage = WardrobeGetSlotsPerPage();

	if (filteredSlots.length === 0) {
		WardrobeOffset = 0;
		return;
	}

	if (filteredSlots.length <= slotsPerPage) return;
	const lastPageOffset = Math.floor((filteredSlots.length - 1) / slotsPerPage) * slotsPerPage;
	WardrobeOffset += change * slotsPerPage;
	if (WardrobeOffset < 0) {
		WardrobeOffset = lastPageOffset;
	} else if (WardrobeOffset > lastPageOffset) {
		WardrobeOffset = 0;
	}
	WardrobeInvalidateCanvasCache();
	WardrobeUpdateElements(filteredSlots);
}

/**
 * @returns {void} - Nothing
 */
function WardrobeDeleteSelectedOutfit() {
	if (!Wardrobe.selectedCharacter || WardrobeSelection < 0 || WardrobeIsSlotEmpty(WardrobeSelection)) return;

	if (!confirm(TextGet("DeleteOutfitConfirm"))) {
		return;
	}

	const slot = WardrobeSelection;
	Player.Wardrobe[slot] = null;
	Player.WardrobeCharacterNames[slot] = "";
	if (WardrobeCharacter[slot]) {
		CharacterDelete(WardrobeCharacter[slot]);
		WardrobeCharacter[slot] = null;
	}

	WardrobeFixLength();
	WardrobeInvalidateFilteredSlots();
	WardrobeInvalidateCanvasCache();
	WardrobePushAll();
	ToastManager.success(TextGet("OutfitDeleted"));
	WardrobeTogglePreviewOverlay(-1);
	WardrobeUpdateElements();
}

/**
 * @returns {boolean}
 */
function WardrobeRenameSelectedOutfit(push = false) {
	if (WardrobeSelection === -1) return false;

	const name = ElementValue(WardrobeID.name);
	const validName = /^[a-zA-Z0-9 ]+$/.test(name) || name.length === 0;
	if (!validName) {
		ToastManager.error(TextGet("OutfitNameError"));
		return false;
	}

	WardrobeSetCharacterName(WardrobeSelection, name, push);
	ToastManager.success(TextGet("OutfitRenamed"));
	WardrobeSetSearch(Wardrobe.search, false);
	return true;
}

/**
 * Confirm and apply a wardrobe slot onto the current character.
 * @param {number} slot
 * @returns {void} - Nothing
 */
function WardrobeLoadOutfit(slot) {
	if (!Wardrobe.selectedCharacter || slot < 0 || WardrobeIsSlotEmpty(slot)) return;

	WardrobeSetActionPreview("Load", true, slot);
	Wardrobe.previewLocked = true;
	let confirmed = false;
	try {
		const mainCharacter = WardrobeGetMainPreviewCharacter();
		if (mainCharacter) WardrobeDrawToCanvas(WardrobeID.mainCanvas, mainCharacter, 1);
		confirmed = confirm(TextGet("LoadOutfitConfirm"));
	} finally {
		Wardrobe.previewLocked = false;
		WardrobeSetActionPreview(null, true);
	}
	if (!confirmed) return;

	WardrobeFastLoad(Wardrobe.selectedCharacter, slot, false, { ExcludeBodyparts: true });
	if (WardrobeSelection !== -1) {
		WardrobeTogglePreviewOverlay(-1);
	}
	WardrobeUpdateElements();
}

/**
 * @returns {void} - Nothing
 */
function WardrobeSaveSelectedOutfit() {
	if (!Wardrobe.selectedCharacter || WardrobeSelection < 0) return;

	WardrobeSetActionPreview("Save", true);
	Wardrobe.previewLocked = true;
	let confirmed = false;
	try {
		const sideCharacter = WardrobeGetSidePreviewCharacter();
		if (sideCharacter) WardrobeDrawToCanvas(WardrobeID.sideCanvas, sideCharacter, 1);
		confirmed = confirm(TextGet("SaveOutfitConfirm"));
	} finally {
		Wardrobe.previewLocked = false;
		WardrobeSetActionPreview(null, true);
	}
	if (!confirmed) return;

	WardrobeFastSave(Wardrobe.selectedCharacter, WardrobeSelection);
	if (WardrobeRenameSelectedOutfit()) {
		WardrobePushAll();
	} else {
		ServerAccountUpdate.QueueData({ Wardrobe: CharacterCompressWardrobe(Player.Wardrobe) });
	}
	WardrobeUpdateElements();
}

/**
 * @returns {void} - Nothing
 */
function WardrobeExcludeBodypartsChange() {
	Wardrobe.excludeBodyparts = !!/** @type {HTMLInputElement | null} */ (ElementWrap(WardrobeID.excludeBodyparts))?.checked;
	if (!Wardrobe.previewAction) return;
	if (Wardrobe.previewAction === "Load") WardrobeBuildLoadPreviewCharacter();
	else WardrobeBuildSavePreviewCharacter();
	WardrobeInvalidateCanvasCache(WardrobeID.mainCanvas);
	WardrobeInvalidateCanvasCache(WardrobeID.sideCanvas);
}

/**
 * Returns the expressions of character C as a single big object
 * @param {Character} C - The character whose expressions should be returned
 * @returns {Partial<Record<ExpressionGroupName, ExpressionName>>} Expression - The expresssion of a character
 */
function WardrobeGetExpression(C) {
	/** @type {Partial<Record<ExpressionGroupName, ExpressionName>>} */
	const characterExpression = {};
	for (const item of C.Appearance) {
		if (!item.Asset.Group.HasExpression()) continue;
		characterExpression[item.Asset.Group.Name] = item.Property?.Expression;
	}
	return characterExpression;
}

/**
 * Checks if a given group of a character can be accessed.
 * @param {Character} C - The character in the wardrobe
 * @param {AssetGroup} Group - The group to check for accessibility
 * @param {object} [Options] - Options to use for the check
 * @param {boolean} Options.ExcludeNonCloth - Removes anything that's not clothing.
 * @returns {boolean} - Whether the zone can be altered or not.
 */
function WardrobeGroupAccessible(C, Group, Options) {

	// You can always edit yourself.
	if (C.IsPlayer() || WardrobeIsPreviewCharacter(C)) return true;

	// You cannot always change body cosplay
	if (Group.BodyCosplay && C.OnlineSharedSettings && C.OnlineSharedSettings.BlockBodyCosplay) return false;

	// Clothes can always be edited
	if (Group.Clothing) return true;

	// You can filter out non-clothing options
	if (!Options || !Options.ExcludeNonCloth) {
		// If the player allows all
		if (C.OnlineSharedSettings && C.OnlineSharedSettings.AllowFullWardrobeAccess) return true;
	}

	return false;
}
