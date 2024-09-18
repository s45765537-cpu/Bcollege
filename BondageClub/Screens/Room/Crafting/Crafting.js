"use strict";

// NOTE: Keep as `var` to enable `window`-based lookup
/** The background of the crafting screen. */
var CraftingBackground = "CraftingWorkshop";

/**
 * The active subscreen within the crafting screen:
 * * `"Slot"`: The main crafting screens wherein the {@link CraftingItem} is selected, created or destroyed.
 * * `"Name"`: The main menu wherein the crafted item is customized, allowing for the specification of names, descriptions, colors, extended item types, _etc._
 * * `"Color"`: A dedicated coloring screen for the crafted item.
 * * `"Extended"`: The extended item menu.
 * @type {CraftingMode}
 */
let CraftingMode = "Slot";

/** Whether selecting a crafted item in the crafting screen should destroy it. */
let CraftingDestroy = false;

/** The index of the selected crafted item within the crafting screen. */
let CraftingSlot = 0;

/**
 * The currently selected crafted item in the crafting screen.
 * @type {CraftingItemSelected | null}
 */
let CraftingSelectedItem = null;

/** An offset used for the pagination of {@link Player.Crafting}. */
let CraftingOffset = 0;

/**
 * A list of all assets valid for crafting, potentially filtered by a user-provided keyword.
 * @type {never}
 * @deprecated
 */
let CraftingItemList = /** @type {never} */([]);

/**
 * The character used for the crafting preview.
 * @type {Character | null}
 */
let CraftingPreview = null;

/** Whether the crafting character preview should be naked or not. */
let CraftingNakedPreview = false;

/** Whether exiting the crafting menu should return you to the chatroom or, otherwise, the main hall. */
let CraftingReturnToChatroom = false;

/** List of item indices collected for swapping.
 * @type {number[]}
 */
let CraftingReorderList = [];

/** @type {CraftingReorderType} */
let CraftingReorderMode = "None";

/**
 * A record mapping all crafting-valid asset names to a list of matching elligble assets.
 *
 * Elligble assets are defined as crafting-valid assets with either a matching {@link Asset.Name} or {@link Asset.CraftGroup}.
 *
 * The first asset in each list is guaranteed to satisfy `Asset.Group.Name === Asset.DynamicGroupName` _if_ any of the list members satisfy this condition.
 * @type {Record<string, Asset[]>}
 */
let CraftingAssets = {};

/** The separator used between different crafted items when serializing them. */
const CraftingSerializeItemSep = "§";

/** The separator used between fields within a single crafted item when serializing them. */
const CraftingSerializeFieldSep = "¶";

/**
 * Regexp pattern for sanitizing to-be serialized crafted item string data by finding all
 * special separator characters (see {@link CraftingSerializeItemSep} and {@link CraftingSerializeFieldSep}).
 */
const CraftingSerializeSanitize = new RegExp(`${CraftingSerializeItemSep}|${CraftingSerializeFieldSep}`);

/**
 * Map crafting properties to their respective validation function.
 * @type {Map<CraftingPropertyType, (asset: Asset) => boolean>}
 */
const CraftingPropertyMap = new Map([
	["Normal", function(Item) { return true; }],
	["Large", function(Item) { return CraftingItemHasEffect(Item, CommonKeys(SpeechGagLevelLookup)); }],
	["Small", function(Item) { return CraftingItemHasEffect(Item, CommonKeys(SpeechGagLevelLookup)); }],
	["Thick", function(Item) { return CraftingItemHasEffect(Item, [...CharacterBlindLevels.keys()]); }],
	["Thin", function(Item) { return CraftingItemHasEffect(Item, [...CharacterBlindLevels.keys()]); }],
	["Secure", function(Item) { return true; }],
	["Loose", function(Item) { return true; }],
	["Decoy", function(Item) { return true; }],
	["Malleable", function(Item) { return true; }],
	["Rigid", function(Item) { return true; }],
	["Simple", function(Item) { return Item.AllowLock; }],
	["Puzzling", function(Item) { return Item.AllowLock; }],
	["Painful", function(Item) { return true; }],
	["Comfy", function(Item) { return true; }],
	["Strong", function(Item) { return Item.IsRestraint || (Item.Difficulty > 0); }],
	["Flexible", function(Item) { return Item.IsRestraint || (Item.Difficulty > 0); }],
	["Nimble", function(Item) { return Item.IsRestraint || (Item.Difficulty > 0); }],
	["Arousing", function(Item) { return CraftingItemHasEffect(Item, ["Egged", "Vibrating"]); }],
	["Dull", function(Item) { return CraftingItemHasEffect(Item, ["Egged", "Vibrating"]); } ],
	["Heavy", function(Item) { return CraftingItemHasEffect(Item, ["Slow"]); }],
	["Light", function(Item) { return CraftingItemHasEffect(Item, ["Slow"]); }],
]);

/**
 * An enum with status codes for crafting validation.
 * @property OK - The validation proceded without errors
 * @property ERROR - The validation produced one or more errors that were successfully resolved
 * @property CRITICAL_ERROR - The validation produced an unrecoverable error
 * @type {{OK: 2, ERROR: 1, CRITICAL_ERROR: 0}}
 */
const CraftingStatusType = {
	OK: 2,
	ERROR: 1,
	CRITICAL_ERROR: 0,
};

/**
 * The Names of all locks that can be automatically applied to crafted items.
 * An empty string implies the absence of a lock.
 * @type {readonly (AssetLockType | "")[]}
 */
const CraftingLockList = ["", "MetalPadlock", "IntricatePadlock", "HighSecurityPadlock", "OwnerPadlock", "LoversPadlock", "FamilyPadlock", "MistressPadlock", "PandoraPadlock", "ExclusivePadlock"];

/**
 * A set of item property names that should never be stored in {@link CraftingItem.ItemProperty}.
 * @type {Set<keyof ItemProperties>}
 */
const CraftingPropertyExclude = new Set([
	"HeartRate",
	"TriggerCount",
	"OrgasmCount",
	"RuinedOrgasmCount",
	"TimeWorn",
	"TimeSinceLastOrgasm",
	"BlinkState",
	"AutoPunishUndoTime",
	"NextShockTime",
]);

const CraftingID = /** @type {const} */({
	root: "crafting-screen",

	topBar: "crafting-top-bar",
	header: "crafting-header",
	menuBar: "crafting-menu-bar",
	downloadButton: "crafting-download-button",
	uploadButton: "crafting-upload-button",
	acceptButton: "crafting-accept-button",
	cancelButton: "crafting-cancel-button",
	exitButton: "crafting-exit-button",

	leftPanel: "crafting-left-panel",
	assetButton: "crafting-asset-button",
	assetPanel: "crafting-asset-panel",
	assetGrid: "crafting-asset-grid",
	assetSearch: "crafting-asset-search",
	assetHeader: "crafting-asset-header",
	padlockButton: "crafting-padlock-button",
	padlockPanel: "crafting-padlock-panel",
	padlockGrid: "crafting-padlock-grid",
	padlockSearch: "crafting-padlock-search",
	padlockHeader: "crafting-padlock-header",
	propertyButton: "crafting-property-button",
	propertyPanel: "crafting-property-panel",
	propertyGrid: "crafting-property-grid",
	propertySearch: "crafting-property-search",
	propertyHeader: "crafting-property-header",

	centerPanel: "crafting-center-panel",
	undressButton: "crafting-undress-button",

	rightPanel: "crafting-right-panel",
	nameInput: "crafting-name-input",
	nameLabel: "crafting-name-label",
	descriptionInput: "crafting-description-input",
	descriptionLabel: "crafting-description-label",
	colorsButton: "crafting-colors-button",
	colorsInput: "crafting-colors-input",
	colorsLabel: "crafting-colors-label",
	layeringInput: "crafting-layering-input",
	layeringButton: "crafting-layering-button",
	layeringLabel: "crafting-layering-label",
	privateCheckbox: "crafting-private-checkbox",
	privateLabel: "crafting-private-label",
	extendedButton: "crafting-extended-button",
	extendedLabel: "crafting-extended-label",
});

/**
 * Construct a record mapping all crafting-valid asset names to a list of matching elligble assets.
 * Elligble assets are defined as crafting-valid assets with either a matching {@link Asset.Name} or {@link Asset.CraftGroup}.
 * @see {@link CraftingAssets}
 * @returns {Record<string, Asset[]>}
 */
function CraftingAssetsPopulate() {
	/** @type {Record<string, Asset[]>} */
	const ret = {};
	/** @type {Record<string, Asset[]>} */
	const craftGroups = {};
	for (const a of Asset) {
		if (!a.Group.IsItem() || a.IsLock || !a.Wear || !a.Enable) {
			continue;
		} else if (a.CraftGroup) {
			craftGroups[a.CraftGroup] ??= [];
			craftGroups[a.CraftGroup].push(a);
		} else {
			ret[a.Name] ??= [];
			ret[a.Name].push(a);
		}
	}

	for (const assetList of Object.values(craftGroups)) {
		const names = new Set(assetList.map(a => a.Name));
		for (const name of names) {
			ret[name] ??= [];
			ret[name].push(...assetList);
		}
	}

	// Ensure that the first member satisfies `Asset.Group.Name === Asset.DynamicGroupName` if possible at all
	for (const assetList of Object.values(ret)) {
		assetList.sort((a1, a2) => {
			if (a1.Group.Name === a1.DynamicGroupName) {
				return -1;
			} else if (a2.Group.Name === a2.DynamicGroupName) {
				return 1;
			} else {
				return (
					a1.Group.Category.localeCompare(a2.Group.Category)
					|| a1.Group.Name.localeCompare(a2.Group.Name)
					|| a1.Name.localeCompare(a2.Name)
				);
			}
		});
	}
	return ret;
}

/**
 * Returns TRUE if a crafting item has an effect from a list or allows that effect
 * @param {Asset} Item - The item asset to validate
 * @param {EffectName[]} Effect - The list of effects to validate
 * @returns {Boolean} - TRUE if the item has that effect
 */
function CraftingItemHasEffect(Item, Effect) {
	if (Item.Effect != null)
		for (let E of Effect)
			if (Item.Effect.indexOf(E) >= 0)
				return true;
	if (Item.AllowEffect != null)
		for (let E of Effect)
			if (Item.AllowEffect.indexOf(E) >= 0)
				return true;
	return false;
}

/**
 * Shows the crating screen and remember if the entry came from an online chat room
 * @param {boolean} FromChatRoom - TRUE if we come from an online chat room
 * @returns {void} - Nothing
 */
function CraftingShowScreen(FromChatRoom) {
	CraftingReturnToChatroom = FromChatRoom;
	CommonSetScreen("Room", "Crafting");
}

var CraftingEventListeners = {
	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => void}
	 */
	_ClickPrivate: function _ClickPrivate() {
		if (CraftingSelectedItem) {
			CraftingSelectedItem.Private = this.checked;
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => void}
	 */
	_InputLayering: function _InputLayering() {
		if (CraftingSelectedItem) {
			const value = (this.defaultValue !== this.value && !Number.isNaN(this.valueAsNumber)) ? this.valueAsNumber : undefined;
			if (value !== CraftingSelectedItem.OverridePriority) {
				CraftingSelectedItem.ItemProperty.OverridePriority = value;
				CraftingUpdatePreview();
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => void}
	 */
	_ChangeName: function _ChangeName() {
		if (CraftingSelectedItem) {
			CraftingSelectedItem.Name = this.value.trim() || this.defaultValue;
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLTextAreaElement, ev: Event) => void}
	 */
	_ChangeDescription: function _ChangeDescription() {
		if (CraftingSelectedItem) {
			CraftingSelectedItem.Description = this.value.trim();
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => void}
	 */
	_ChangeColor: function _ChangeColor() {
		if (CraftingSelectedItem) {
			const value = this.value.trim() || this.defaultValue;
			if (value !== CraftingSelectedItem.Color) {
				CraftingSelectedItem.Color = value;
				CraftingUpdatePreview();
			}
			if (!this.checkValidity()) {
				this.value = this.defaultValue;
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickExtended: function _ClickExtended() {
		if (CraftingPreview && CraftingSelectedItem?.Asset.Extended) {
			const item = InventoryGet(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName);
			if (item) {
				DialogExtendItem(item);
				CraftingModeSet("Extended");
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickLayering: function _ClickLayering() {
		if (CraftingPreview && CraftingSelectedItem) {
			const item = InventoryGet(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName);
			if (item) {
				Layering.Init(item, CraftingPreview, {
					x: Layering.DisplayDefault.x,
					y: Layering.DisplayDefault.y - 10,
					w: Layering.DisplayDefault.w + 10,
					h: Layering.DisplayDefault.h + 10,
					buttonGap: 15,
				});
				CraftingModeSet("OverridePriority");
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickColors: function _ClickColors() {
		if (CraftingPreview && CraftingSelectedItem) {
			const item = InventoryGet(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName);
			if (item) {
				CraftingModeSet("Color");
				ItemColorLoad(CraftingPreview, item, 1200, 25, 775, 950, true);
				ItemColorOnExit((c, i) => {
					CraftingSelectedItem.Color = (Array.isArray(i.Color) ? i.Color.join(",") : i.Color) || "Default";
					ElementValue(CraftingID.colorsInput, CraftingSelectedItem.Color);
					CraftingModeSet("Name");
				});
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickUndress: function _ClickUndress() {
		CraftingNakedPreview = !CraftingNakedPreview;
		CraftingUpdatePreview();
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickAccept: function _ClickAccept() {
		// blur the active element in order to trigger any `change` event listeners
		document.activeElement?.dispatchEvent(new Event("blur"));
		Player.Crafting[CraftingSlot] = CraftingConvertSelectedToItem();
		CraftingSelectedItem = null;
		CraftingSaveServer();
		CraftingModeSet("Slot");
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickExit: function _ClickExit() {
		CraftingExit(false);
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickUpload: function _ClickUpload() {
		const settingsString = prompt(TextGet("UploadPrompt"));
		if (!settingsString) {
			alert(TextGet("UploadFailure"));
			return;
		}

		const craft = CommonJSONParse(LZString.decompressFromBase64(settingsString));
		if (!craft) {
			alert(TextGet("UploadFailure"));
			return;
		}

		const status = CraftingValidate(craft, null, true, true);
		switch (status) {
			case CraftingStatusType.ERROR:
			case CraftingStatusType.OK:
				CraftingExitResetElements();
				CraftingSelectedItem = CraftingConvertItemToSelected(craft);
				document.querySelector(`#${CraftingID.assetGrid} [data-asset='${CraftingSelectedItem.Asset.Name}'][data-group='${CraftingSelectedItem.Asset.DynamicGroupName}']`)?.dispatchEvent(new Event("click"));
				alert(TextGet("UploadSucces"));
				return;
			case CraftingStatusType.CRITICAL_ERROR:
				alert(TextGet("UploadFailure"));
				return;
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickDownload: function _ClickDownload() {
		const craft = CraftingConvertSelectedToItem();
		navigator.clipboard.writeText(LZString.compressToBase64(JSON.stringify(craft)));
		alert(TextGet("DownloadSucces"));
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickExpand: function _ClickExpand() {
		if (this.getAttribute("aria-expanded") !== "true") {
			return;
		}

		// Focus the search input in the side pannel if it exists
		const panel = document.querySelector(`#${this.getAttribute("aria-controls")} > .crafting-grid`);
		const activeRadio = panel?.querySelector(`[aria-checked='true']`);
		if (activeRadio) {
			activeRadio.scrollIntoView();
		} else {
			panel?.scrollTo({ top: 0 });
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickProperty: function _ClickProperty() {
		CraftingSelectedItem.Property = /** @type {CraftingPropertyType} */(this.dataset.property);
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickPadlock: function _ClickPadlock() {
		const newLock = this.getAttribute("aria-checked") === "true" ? AssetGet("Female3DCG", "ItemMisc", this.dataset.asset) : null;
		const needsRefresh = (!newLock && CraftingSelectedItem.Lock) || (newLock && !CraftingSelectedItem);
		CraftingSelectedItem.Lock = newLock;
		if (needsRefresh) {
			CraftingUpdatePreview();
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickAsset: function _ClickAsset() {
		const assets = CraftingAssets[this.dataset.asset];
		if (!assets) {
			return;
		}

		// Only relevant when switching between two assets from within the `Name` subscreen
		const needsPropertyUpdate = CraftingSelectedItem.Asset && CraftingSelectedItem.Asset !== assets[0];
		CraftingSelectedItem.Assets = assets;

		// Set the various input fields
		const [nameInput, colorsInput, descriptionInput, priorityInput, privateInput] = /** @type {HTMLInputElement[]} */([
			document.getElementById(CraftingID.nameInput),
			document.getElementById(CraftingID.colorsInput),
			document.getElementById(CraftingID.descriptionInput),
			document.getElementById(CraftingID.layeringInput),
			document.getElementById(CraftingID.privateCheckbox),
		]);
		priorityInput.defaultValue = priorityInput.placeholder = (CraftingSelectedItem.Asset.DrawingPriority ?? CraftingSelectedItem.Asset.Group.DrawingPriority).toString();
		colorsInput.defaultValue = colorsInput.placeholder = CraftingSelectedItem.Asset.DefaultColor.join(",");
		nameInput.defaultValue = nameInput.placeholder = CraftingSelectedItem.Asset.Description;
		nameInput.value = CraftingSelectedItem.Name;
		descriptionInput.value = CraftingSelectedItem.Description;
		privateInput.checked = CraftingSelectedItem.Private;

		// Either we're switching between two distinct assets (in which case color and the likes cannot safely be assumed to be compatible) or we're just initializing everything after opening the `Name` subscreen
		if (needsPropertyUpdate) {
			CraftingSelectedItem.ItemProperty = {};
			priorityInput.value = priorityInput.defaultValue;
			colorsInput.value = CraftingSelectedItem.Color = colorsInput.defaultValue;
		} else {
			priorityInput.value = typeof CraftingSelectedItem.OverridePriority === "number" ? CraftingSelectedItem.OverridePriority.toString() : priorityInput.defaultValue;
			colorsInput.value = CraftingSelectedItem.Color;
		}

		// Re-enable the accept button as we now have an asset selected
		document.getElementById(CraftingID.acceptButton)?.setAttribute("aria-disabled", "false");

		// Disable the buttons for all invalid properties
		document.querySelectorAll(`#${CraftingID.propertyGrid} [data-property]`).forEach(e => {
			const propertyType = /** @type {CraftingPropertyType} */(e.getAttribute("data-property"));
			const callback = CraftingPropertyMap.get(propertyType);
			e.setAttribute("aria-disabled", propertyType === "Normal" || (callback && CraftingSelectedItem.Assets.some(a => callback(a))) ? "false" : "true");
		});

		// Set the item property, falling back to `Normal` of an invalid property is selected
		const propertyCallback = CraftingPropertyMap.get(CraftingSelectedItem.Property);
		if (propertyCallback && CraftingSelectedItem.Assets.some(a => propertyCallback(a))) {
			document.querySelector(`#${CraftingID.propertyGrid} [data-property='${CraftingSelectedItem.Property}'][aria-checked='false']`)?.dispatchEvent(new Event("click"));
		} else {
			document.querySelector(`#${CraftingID.propertyGrid} [data-property='Normal'][aria-checked='false']`)?.dispatchEvent(new Event("click"));
		}

		// Disable the extended item config button for non-extended items
		const extendedButton = /** @type {HTMLButtonElement} */(document.getElementById(CraftingID.extendedButton));
		extendedButton.disabled = !CraftingSelectedItem.Asset.Extended;

		// Set the lock, removing any locks it the item does not support them
		const allowLock = CraftingSelectedItem.Assets.some(a => a.AllowLock);
		if (CraftingSelectedItem.Lock && allowLock) {
			const lockButton = document.querySelector(`#${CraftingID.padlockGrid} [data-asset='${CraftingSelectedItem.Lock.Name}'][aria-checked='false']`);
			lockButton?.setAttribute("aria-disabled", "false");
			lockButton?.dispatchEvent(new Event("click"));
		} else {
			const lockButton = document.querySelector(`#${CraftingID.padlockGrid} [data-asset][aria-checked='true']`);
			lockButton?.setAttribute("aria-disabled", "false");
			lockButton?.dispatchEvent(new Event("click"));
		}

		// Disable the lock buttons if none of the items supports any lock
		if (allowLock) {
			document.querySelectorAll(`#${CraftingID.padlockGrid} [data-asset]`).forEach(e => e.setAttribute("aria-disabled", "false"));
		} else {
			document.querySelectorAll(`#${CraftingID.padlockGrid} [data-asset]`).forEach(e => e.setAttribute("aria-disabled", "true"));
		}

		CraftingUpdatePreview();
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickRadio: function _ClickRadio(ev) {
		if (!CraftingSelectedItem) {
			ev.stopImmediatePropagation();
			return;
		}

		const sidePannel = this.closest(".crafting-panel");
		const controlButton = document.querySelector(`[aria-controls='${sidePannel?.id}']`);
		if (!sidePannel || !controlButton) {
			return;
		}

		// Trigger a search query in order to filter the results by whatever input the user has specified
		const searchInput = sidePannel.querySelector("input[type='search']");
		searchInput?.dispatchEvent(new Event("input"));

		if (this.getAttribute("aria-checked") === "true") {
			controlButton.innerHTML = this.innerHTML;
			return;
		} else {
			controlButton.innerHTML = "";
		}

		switch (controlButton.id) {
			case CraftingID.padlockButton:
				ElementButton._ParseLabel(controlButton.id, TextGet("NoLock"), "bottom", { parent: controlButton });
				ElementButton._ParseImage(controlButton.id, "./Icons/NoLock.png", { parent: controlButton });
				break;
			case CraftingID.propertyButton:
				ElementButton._ParseLabel(controlButton.id, TextGet(`PropertyNormal`) + ": " + TextGet(`DescriptionNormal`), null, { parent: controlButton });
				break;
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => Promise<void>}
	 */
	_InputSearch: async function _InputSearch() {
		const query = this.value.toUpperCase().trim();
		const searchResultCandidates = document.getElementById(this.getAttribute("aria-controls"));
		searchResultCandidates?.querySelectorAll("button.button").forEach(button => {
			const label = button.querySelector(".button-label");
			if (label) {
				const displayStyle = (button.getAttribute("aria-checked") === "true" || label.textContent.toUpperCase().includes(query)) ? "" : "none";
				/** @type {HTMLButtonElement} */(button).style.display = displayStyle;
			}
		});
	},
};

var CraftingElements = {
	/**
	 * @private
	 * @param {string} controls
	 * @returns {() => string[]}
	 */
	_SearchInputGetDataList: function _SearchInputGetDataList(controls) {
		return () => {
			const searchResults = document.getElementById(controls);
			return Array.from(searchResults?.querySelectorAll("button > label") ?? []).map(e => e.textContent);
		};
	},

	/**
	 * @private
	 * @param {string} id
	 * @param {string} controls
	 * @param {string} placeholder
	 * @returns {HTMLInputElement}
	 */
	_SearchInput: function _SearchInput(id, controls, placeholder) {
		const ret = ElementCreateSearchInput(id, CraftingElements._SearchInputGetDataList(controls));
		ret.setAttribute("aria-controls", controls);
		ret.setAttribute("size", 0);
		ret.addEventListener("input", CraftingEventListeners._InputSearch);
		ret.placeholder = placeholder;
		return ret;
	},

	/**
	 * @private
	 * @param {string} id
	 * @param {(this: HTMLButtonElement, ev: Event) => any} onClick
	 * @param {null | Asset} assetImage
	 * @param {null | Partial<Record<string, string | number | boolean>>} dataAttributes
	 * @param {null | string} label
	 * @param {null | readonly (string | Node)[]} children
	 * @param {null | Asset} asset
	 * @param {boolean} first
	 * @returns {HTMLButtonElement}
	 */
	_RadioButton: function _RadioButton(id, onClick, assetImage=null, dataAttributes=null, label=null, children=null, asset=null, first=false) {
		const icons = asset == null ? null : [...DialogGetAssetIcons(asset), ...DialogEffectIcons.GetIcons({ Asset: asset })];
		const ret = ElementButton.Create(
			id,
			CraftingEventListeners._ClickRadio,
			{ image: assetImage ? `./Assets/Female3DCG/${assetImage.DynamicGroupName}/Preview/${assetImage.Name}.png` : null, label, icons, role: "radio" },
			{ button: { dataAttributes, children, attributes: { tabindex: first ? 0 : -1 }, parent: ElementNoParent }},
		);
		ret.addEventListener("click", onClick);
		return ret;
	},
};

/**
 * Loads the club crafting room in slot selection mode, creates a dummy character for previews
 * @returns {void} - Nothing
 */
function CraftingLoad() {
	Player.Crafting ??= [];

	// Re-enable previously disabled items if the player now owns them
	for (const item of Player.Crafting) {
		if (item?.Disabled && Player.Inventory.some(i => i.Asset.Name === item.Name)) {
			delete item.Disabled;
		}
	}

	// Abort if we're loading an already-loaded screen
	if (CraftingPreview) {
		return;
	}

	CraftingPreview = CharacterLoadSimple(`CraftingPreview-${Player.MemberNumber}`);
	CraftingPreview.Appearance = [...Player.Appearance];
	CraftingPreview.Crafting = JSON.parse(JSON.stringify(Player.Crafting));

	// Declare the preview character as being owned/loved by the player so any owner-/lover-related validation checks pass
	CraftingPreview.Owner = Player.Name;
	CraftingPreview.Ownership = { MemberNumber: Player.MemberNumber, Name: Player.Name, Start: CommonTime(), Stage: 1 };
	CraftingPreview.Lovership = [
		{ MemberNumber: Player.MemberNumber, Name: Player.Name, Start: CommonTime(), Stage: 2 },
	];
	// @ts-expect-error: partially initialized interface
	CraftingPreview.OnlineSharedSettings = {
		ItemsAffectExpressions: false,
	};
	CharacterReleaseTotal(CraftingPreview);

	const parent = ElementCreate({
		tag: "div",
		style: { display: "none" },
		attributes: { id: CraftingID.root, "screen-generated": CurrentScreen, "aria-busy": "true" },
		classList: ["HideOnPopup"],
		parent: document.body,
	});

	TextCache.buildAsync("Screens/Room/Crafting/Text_Crafting.csv").then(async () => {
		ElementCreate({
			tag: "div",
			attributes: { id: CraftingID.topBar },
			parent,
			children: [
				{ tag: "h1", attributes: { id: CraftingID.header }, children: [TextGet("SelectName")] },
				ElementMenu.Create(
					CraftingID.menuBar,
					[
						ElementButton.Create(CraftingID.exitButton, CraftingEventListeners._ClickExit, { tooltip: TextGet("Exit") }),
						ElementButton.Create(CraftingID.cancelButton, CraftingEventListeners._ClickExit, { tooltip: TextGet("Cancel") }),
						ElementButton.Create(
							CraftingID.acceptButton, CraftingEventListeners._ClickAccept,
							{
								disabled: true,
								tooltip: [
									TextGet("Accept"),
									ElementCreate({ tag: "span", children: [TextGet("AcceptInvalid")], attributes: { id: `${CraftingID.acceptButton}-tooltip-disabled` } }),
								],
							},
						),
						ElementButton.Create(CraftingID.uploadButton, CraftingEventListeners._ClickUpload, { tooltip: TextGet("Upload") }),
						ElementButton.Create(CraftingID.downloadButton, CraftingEventListeners._ClickDownload, { tooltip: TextGet("Download") }),
					],
					{ direction: "rtl" },
				),
			],
		});

		// Go home eslint, you're drunk
		// eslint-disable-next-line no-unused-expressions
		ElementMenu.Create(
			CraftingID.leftPanel,
			[
				ElementButton.Create(
					CraftingID.propertyButton, CraftingEventListeners._ClickExpand,
					{ role: "menuitemradio" },
					{ button: {
						attributes: { "aria-expanded": false, "aria-controls": CraftingID.propertyPanel },
						children: [TextGet(`PropertyNormal`) + ": " + TextGet(`DescriptionNormal`)],
					}},
				),
				ElementButton.Create(
					CraftingID.assetButton, CraftingEventListeners._ClickExpand,
					{ role: "menuitemradio", label: TextGet("SelectItem"), image: "./Icons/NoCraft.png" },
					{ button: { attributes: { "aria-expanded": false, "aria-controls": CraftingID.assetPanel } } },
				),
				ElementButton.Create(
					CraftingID.padlockButton, CraftingEventListeners._ClickExpand,
					{ role: "menuitemradio", label: TextGet("NoLock"), image: "./Icons/NoLock.png" },
					{ button: { attributes: { "aria-expanded": false, "aria-controls": CraftingID.padlockPanel } } },
				),
				{
					tag: "div",
					attributes: {
						id: CraftingID.propertyPanel,
						"aria-labelledby": CraftingID.propertyHeader,
					},
					classList: ["crafting-panel"],
					children: [
						{
							tag: "label",
							classList: ["crafting-label"],
							attributes: { id: CraftingID.propertyHeader },
							children: [
								{ tag: "span", children: [TextGet("SelectProperty")] },
								CraftingElements._SearchInput(CraftingID.propertySearch, CraftingID.propertyGrid, TextGet("FilterProperty")),
							],
						},
						{
							tag: "div",
							classList: ["crafting-grid"],
							attributes: { id: CraftingID.propertyGrid, role: "radiogroup", "aria-required": true },
							children: Array.from(CraftingPropertyMap.keys()).map((property, i) => {
								return CraftingElements._RadioButton(
									`${CraftingID.propertyButton}-${property}`,
									CraftingEventListeners._ClickProperty,
									null,
									{ property },
									TextGet(`Property${property}`),
									[TextGet(`Property${property}`) + ": " + TextGet(`Description${property}`)],
									null,
									i === 0,
								);
							}),
						},
					],
				},
				{
					tag: "div",
					attributes: {
						id: CraftingID.assetPanel,
						"aria-labelledby": CraftingID.assetHeader,
					},
					classList: ["crafting-panel"],
					children: [
						{
							tag: "label",
							classList: ["crafting-label"],
							attributes: { id: CraftingID.assetHeader },
							children: [
								{ tag: "span", children: [TextGet("SelectItem")] },
								CraftingElements._SearchInput(CraftingID.assetSearch, CraftingID.assetGrid, TextGet("FilterAsset")),
							],
						},
						{
							tag: "div",
							classList: ["crafting-grid"],
							attributes: { id: CraftingID.assetGrid, role: "radiogroup", "aria-required": true },
							children: CraftingItemListBuild().map((a, i) => {
								return CraftingElements._RadioButton(
									`${CraftingID.assetButton}-${a.DynamicGroupName}-${a.Name}`,
									CraftingEventListeners._ClickAsset, a,
									{ asset: a.Name, group: a.DynamicGroupName },
									a.Description,
									null,
									a,
									i === 0,
								);
							}),
						},
					],
				},
				{
					tag: "div",
					attributes: {
						id: CraftingID.padlockPanel,
						"aria-labelledby": CraftingID.padlockHeader,
						"aria-orientation": "vertical",
					},
					classList: ["crafting-panel"],
					children: [
						{
							tag: "label",
							classList: ["crafting-label"],
							attributes: { id: CraftingID.padlockHeader },
							children: [
								{ tag: "span", children: [TextGet("SelectLock")] },
								CraftingElements._SearchInput(CraftingID.padlockSearch, CraftingID.padlockGrid, TextGet("FilterLock")),
							],
						},
						{
							tag: "div",
							classList: ["crafting-grid"],
							attributes: { id: CraftingID.padlockGrid, role: "radiogroup" },
							children: CraftingLockList.filter(name => !!name && InventoryAvailable(Player, name, "ItemMisc")).map((name, i) => {
								const a = AssetGet("Female3DCG", "ItemMisc", name);
								return CraftingElements._RadioButton(
									`${CraftingID.padlockButton}-${a.Name}`, CraftingEventListeners._ClickPadlock, a, { asset: a.Name }, a.Description, null, null, i === 0,
								);
							}).sort((a1, a2) => a1.dataset.asset.localeCompare(a2.dataset.asset)),
						},
					],
				},
			],
			undefined,
			{ menu: { attributes: { "aria-orientation": "vertical" }, parent } },
		),

		ElementCreate({
			tag: "div",
			attributes: { id: CraftingID.centerPanel },
			parent,
			children: [
				ElementButton.Create(CraftingID.undressButton, CraftingEventListeners._ClickUndress),
			],
		});

		ElementCreate({
			tag: "div",
			parent,
			attributes: { id: CraftingID.rightPanel },
			children: [
				{
					tag: "label",
					attributes: { id: CraftingID.nameLabel },
					classList: ["crafting-label"],
					children: [
						{ tag: "span", children: [TextGet("EnterName")] },
						{
							tag: "input",
							attributes: { id: CraftingID.nameInput, type: "input", maxLength: "30", size: 0 },
							eventListeners: { change: CraftingEventListeners._ChangeName },
						},
					],
				},
				{
					tag: "label",
					attributes: { id: CraftingID.descriptionLabel },
					classList: ["crafting-label"],
					children: [
						{ tag: "span", children: [TextGet("EnterDescription")] },
						{
							tag: "textarea",
							attributes: { id: CraftingID.descriptionInput, maxLength: "200", size: 0 },
							eventListeners: { change: CraftingEventListeners._ChangeDescription },
						},
					],
				},
				{
					tag: "label",
					attributes: { id: CraftingID.colorsLabel },
					classList: ["crafting-label"],
					children: [
						{ tag: "span", children: [TextGet("EnterColor")] },
						{
							tag: "input",
							attributes: { id: CraftingID.colorsInput, type: "text", size: 0 },
							eventListeners: { change: CraftingEventListeners._ChangeColor },
						},
						ElementButton.Create(CraftingID.colorsButton, CraftingEventListeners._ClickColors),
					],
				},
				{
					tag: "label",
					attributes: { id: CraftingID.layeringLabel },
					classList: ["crafting-label"],
					children: [
						{
							tag: "input",
							attributes: { id: CraftingID.layeringInput, type: "number", min: -99, max: 99, inputmode: "numeric", size: 0 },
							eventListeners: { blur: ElementNumberInputBlur, input: CraftingEventListeners._InputLayering },
						},
						ElementButton.Create(CraftingID.layeringButton, CraftingEventListeners._ClickLayering),
						{ tag: "span", children: [TextGet("EnterPriority")] },
					],
				},
				{
					tag: "label",
					attributes: { id: CraftingID.privateLabel },
					classList: ["crafting-label"],
					children: [
						{
							tag: "input",
							attributes: { id: CraftingID.privateCheckbox, type: "checkbox" },
							eventListeners: { click: CraftingEventListeners._ClickPrivate },
						},
						{ tag: "span", children: [TextGet("EnterPrivate")] },
					],
				},
				{
					tag: "label",
					attributes: { id: CraftingID.extendedLabel },
					classList: ["crafting-label"],
					children: [
						ElementButton.Create(CraftingID.extendedButton, CraftingEventListeners._ClickExtended),
						{ tag: "span", children: [TextGet("EnterType")] },
					],
				},
			],
		});

		parent.setAttribute("aria-busy", "false");
	});
}

/**
 * Update the crafting character preview image, applies the item on all possible body parts
 */
function CraftingUpdatePreview() {
	CraftingPreview.Appearance = Player.Appearance.slice();
	CharacterReleaseTotal(CraftingPreview, false);
	if (CraftingNakedPreview) CharacterNaked(CraftingPreview, false);
	if (!CraftingSelectedItem) return;
	const Craft = CraftingConvertSelectedToItem();
	const FoundGroups = new Set();
	const RelevantAssets = (CraftingAssets[Craft.Item] ?? []).filter(a => {
		if (FoundGroups.has(a.DynamicGroupName)) {
			return false;
		} else {
			FoundGroups.add(a.DynamicGroupName);
			return true;
		}
	});

	for (const RelevantAsset of RelevantAssets) {
		InventoryWear(CraftingPreview, RelevantAsset.Name, RelevantAsset.DynamicGroupName, null, null, Player.MemberNumber, Craft, false);
		InventoryCraft(CraftingPreview, CraftingPreview, /** @type {AssetGroupItemName} */(RelevantAsset.DynamicGroupName), Craft, false, true, false);
		// Hack for the stuff in ItemAddons, since there's no way to resolve their prerequisites
		if (RelevantAsset.Prerequisite.includes("OnBed")) {
			const bedType = RelevantAsset.Name.includes("Medical") ? "MedicalBed" : "Bed";
			const bed = AssetGet(CraftingPreview.AssetFamily, "ItemDevices", bedType);
			InventoryWear(CraftingPreview, bed.Name, bed.DynamicGroupName, null, null, Player.MemberNumber, null, false);
		}
	}
	CharacterRefresh(CraftingPreview, false, false);
}

/**
 * Run the club crafting room if all possible modes
 * @returns {void} - Nothing
 */
function CraftingRun() {
	// In slot selection mode, we show the slots to select from
	if (CraftingMode == "Slot") {
		let BGColor;
		let TrashCancel = false;

		switch (CraftingReorderMode) {
			case "None":
				BGColor = CraftingDestroy ? "Pink" : "White";
				break;

			case "Select":
				BGColor = "Yellow";
				break;

			case "Place":
				BGColor = "Grey";
				break;
		}

		DrawButton(1475, 15, 90, 90, "", "White", "Icons/Prev.png", TextGet("Previous"));
		DrawButton(1580, 15, 90, 90, "", "White", "Icons/Next.png", TextGet("Next"));
		DrawButton(1685, 15, 90, 90, "", "White", "Icons/Swap.png", TextGet("Reorder"));
		DrawButton(1895, 15, 90, 90, "", "White", "Icons/Exit.png", TextGet("Exit"));
		if (CraftingReorderMode == "Select") {
			DrawText(`${TextGet("ReorderSelect")} ${CraftingReorderList.length}`, 737, 60, "White", "Black");
		} else if (CraftingReorderMode == "Place") {
			DrawText(`${TextGet("ReorderPlace")} ${CraftingReorderList.length}`, 737, 60, "White", "Black");
		} else if (CraftingDestroy) {
			DrawText(`${TextGet("SelectDestroy")} ${Math.floor(CraftingOffset / 20) + 1} / ${80 / 20}.`, 737, 60, "White", "Black");
		} else {
			DrawText(`${TextGet("SelectSlot")} ${Math.floor(CraftingOffset / 20) + 1} / ${80 / 20}.`, 737, 60, "White", "Black");
			TrashCancel = true;
		}
		if (TrashCancel) {
			DrawButton(1790, 15, 90, 90, "", "White", "Icons/Trash.png", TextGet("Destroy"));
		} else {
			DrawButton(1790, 15, 90, 90, "", "White", "Icons/Cancel.png", TextGet("Cancel"));
		}
		for (let S = CraftingOffset; S < CraftingOffset + 20; S++) {
			let X = ((S - CraftingOffset) % 4) * 500 + 15;
			let Y = Math.floor((S - CraftingOffset) / 4) * 180 + 130;
			let Craft = Player.Crafting[S];
			switch (CraftingReorderMode) {
				case "Select":
					BGColor = CraftingReorderList.includes (S) ? "Chartreuse" : "Yellow";
					break;

				case "Place":
					BGColor = CraftingReorderList.includes (S) ? "Green" : "Grey";
					break;

				default:
					break;
			}
			if (!Craft) {
				DrawButton(X, Y, 470, 140, TextGet("EmptySlot"), BGColor);
			} else {
				DrawButton(X, Y, 470, 140, "", BGColor);
				DrawTextFit(Craft.Name, X + 295, Y + 25, 315, "Black", "Silver");
				for (let Item of Player.Inventory) {
					if (Item.Asset.Name == Craft.Item) {
						DrawImageResize("Assets/" + Player.AssetFamily + "/" + Item.Asset.DynamicGroupName + "/Preview/" + Item.Asset.Name + ".png", X + 3, Y + 3, 135, 135);
						DrawTextFit(Item.Asset.Description, X + 295, Y + 70, 315,  "Black", "Silver");
						DrawTextFit(TextGet("Property" + Craft.Property), X + 295, Y + 115, 315, "Black", "Silver");
						if ((Craft.Lock != null) && (Craft.Lock != ""))
							DrawImageResize("Assets/" + Player.AssetFamily + "/ItemMisc/Preview/" + Craft.Lock + ".png", X + 70, Y + 70, 70, 70);
						break;
					}
				}
			}
		}
	}

	if (CraftingMode == "Name") {
		DrawCharacter(CraftingPreview, 775, 100, 0.9, false);
	}

	// In color mode, the player can change the color of each parts of the item
	if (CraftingMode == "Color") {
		DrawText(TextGet("SelectColor"), 600, 60, "White", "Black");
		DrawCharacter(CraftingPreview, -100, 100, 2, false);
		DrawCharacter(CraftingPreview, 700, 100, 0.9, false);
		DrawButton(880, 900, 90, 90, "", "white", `Icons/${CraftingNakedPreview ? "Dress" : "Naked"}.png`);
		ItemColorDraw(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName, 1200, 25, 775, 950, true);
	}

	// Need the `DialogFocusItem` check here as there's a bit of a race condition
	if (CraftingMode == "Extended" && DialogFocusItem) {
		CommonCallFunctionByNameWarn(`Inventory${DialogFocusItem.Asset.Group.Name}${DialogFocusItem.Asset.Name}Draw`);
		DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
		DrawCharacter(CraftingPreview, 500, 100, 0.9, false);
	}

	if (CraftingMode == "OverridePriority") {
		DrawCharacter(CraftingPreview, 500, 100, 0.9, false);
	}
}

/** @type {ScreenFunctions["Resize"]} */
function CraftingResize(load) {
	switch (CraftingMode) {
		case "OverridePriority":
			Layering.Resize(load);
			break;
		case "Name":
			ElementPositionFixed(CraftingID.root, 15, 15, 1970, 970);
			break;
	}
}

/** @type {ScreenFunctions["Unload"]} */
function CraftingUnload() {
	switch (CraftingMode) {
		case "OverridePriority":
			Layering.Unload();
			break;
		case "Name": {
			const elem = document.getElementById(CraftingID.root);
			if (elem) {
				elem.style.display = "none";
			}
			break;
		}
	}
}

/**
 * Update {@link CraftingSelectedItem.ItemProperties} with a select few properties from the passed item.
 * @param {Item} item - The item whose properties should be coppied.
 * @returns {void}
 */
function CraftingUpdateFromItem(item) {
	if (!CraftingSelectedItem || !item.Property) {
		return;
	}

	if (item.Property.TypeRecord) {
		CraftingSelectedItem.TypeRecord = item.Property.TypeRecord;
	}

	/** @type {Set<keyof ItemProperties>} */
	const keys = new Set(["OverridePriority"]);
	if (item.Asset.Archetype) {
		const options = ExtendedItemGatherOptions(item);
		for (const option of options) {
			if (option.OptionType === "VariableHeightOption") {
				keys.add("OverrideHeight");
			}
			for (const key of CommonKeys(option.ParentData.baselineProperty || {})) {
				if (!CraftingPropertyExclude.has(key)) {
					keys.add(key);
				}
			}
		}
	}

	// Basic property validation is conducted later on via CraftingValidate
	for (const key of /** @type {Set<string>} */(keys)) {
		if (item.Property[key] != null) {
			CraftingSelectedItem.ItemProperty[key] = item.Property[key];
		}
	}
}

/**
 * Return a list of all searchable asset names.
 * @returns {string[]}
 */
function CraftingGetAllAssetNames() {
	/** @type {Set<string>} */
	const visited = new Set();

	return Object.values(CraftingAssets).flat().sort((asset1, asset2) => {
		return asset1.Description.localeCompare(asset2.Description);
	}).filter((asset) => {
		const status = InventoryAvailable(Player, asset.Name, asset.Group.Name) && !visited.has(asset.Description);
		if (status) {
			visited.add(asset.Description);
		}
		return status;
	}).map((asset) => asset.Description);
}

/**
 * Sets the new mode and creates or removes the inputs
 * @param {CraftingMode} NewMode - The new mode to set
 * @returns {void} - Nothing
 */
function CraftingModeSet(NewMode) {
	CraftingUnload();
	CraftingDestroy = false;
	if (CraftingMode == "Slot" && NewMode != "Slot") {
		CraftingReorderModeSet ("None");
	}

	CraftingMode = NewMode;
	if (NewMode === "Name") {
		const root = document.getElementById(CraftingID.root);
		if (root) {
			root.style.display = "";
		}
		CraftingResize(false);

		if (CraftingSelectedItem.Asset) {
			// Select the asset
			document.querySelector(`#${CraftingID.assetGrid} [data-asset='${CraftingSelectedItem.Asset.Name}'][data-group='${CraftingSelectedItem.Asset.DynamicGroupName}']`)?.dispatchEvent(new Event("click"));
		} else {
			// Open the side pannel and manually updating the crafting preview to clear it of old items
			document.querySelector(`#${CraftingID.assetButton}[aria-checked='false']`)?.dispatchEvent(new Event("click"));
			CraftingUpdatePreview();
		}

		// Most mobile phones only trigger click events if a touchstart event originates from within the DOM element.
		// For those that do not, the mixture of DOM and canvas buttons can be problematic, as a lingering touch can _instantly_ trigger a click if a DOM button is created where a canvas button previously was.
		// As a workaround, disable the exit button for ~100 ms on mobile when (re-)entering the `Name` subscreen
		if (CommonIsMobile) {
			const exitButton = /** @type {HTMLButtonElement} */(document.getElementById(CraftingID.exitButton));
			if (exitButton) {
				exitButton.disabled = true;
				setTimeout(() => exitButton.disabled = false, 100);
			}
		}
	}
}

/**
 * Serialize a single crafted item into a string in order to prepare it for server saving
 * @param {CraftingItem} craft The crafted item
 * @returns {string} The serialized crafted item
 * @see {@link CraftingSaveServer}
 */
function CraftingSerialize(craft) {
	/** @type {string[]} */
	const stringData = [
		craft.Item,
		(craft.Property == null) ? "" : craft.Property,
		(craft.Lock == null) ? "" : craft.Lock,
		(craft.Name == null) ? "" : craft.Name.substring(0, 30),
		(craft.Description == null) ? "" : craft.Description.substring(0, 200),
		(craft.Color == null) ? "" : craft.Color,
		(craft.Private) ? "T" : "",
		"", // Old field as used by the deprecated `Type` crafted craft property, DO NOT REMOVE!
		"", // Old field as used by the deprecated `OverridePriority` crafted craft property, DO NOT REMOVE!
		(craft.ItemProperty == null) ? "" : JSON.stringify(craft.ItemProperty),
		(craft.TypeRecord == null) ? "" : JSON.stringify(craft.TypeRecord),
	];
	return stringData.map(i => i.replace(CraftingSerializeSanitize, "")).join(CraftingSerializeFieldSep);
}

/**
 * Prepares a compressed packet of the crafting data and sends it to the server
 * @returns {void} - Nothing
 */
function CraftingSaveServer() {
	if (Player.Crafting == null) return;
	let P = Player.Crafting.map(C =>  (C == null) ? "" : CraftingSerialize(C)).join(CraftingSerializeItemSep);
	while ((P.length >= 1) && (P.substring(P.length - 1) == CraftingSerializeItemSep))
		P = P.substring(0, P.length - 1);
	const Obj = { Crafting: LZString.compressToUTF16(P) };
	ServerAccountUpdate.QueueData(Obj, true);
}


/**
 * Deserialize a single crafted item from a string in order to parse data received from the server.
 * @param {string} craftString The serialized crafted item
 * @returns {null | CraftingItem} The crafted item or `null` if either its {@link CraftingItem.Item} or {@link CraftingItem.Name} property is invalid
 * @see {@link CraftingDecompressServerData}
 */
function CraftingDeserialize(craftString) {
	const [
		Item,
		Property,
		Lock,
		Name,
		Description,
		Color,
		Private,
		Type,
		OverridePriority,
		ItemProperty,
		TypeRecord,
	] = craftString.split(CraftingSerializeFieldSep);

	/** @type {CraftingItem} */
	const craft = {
		Item,
		Name,
		Description,
		Color,
		Property: /** @type {CraftingPropertyType} */(Property) || "Normal",
		Lock: /** @type {AssetLockType} */(Lock),
		Private: Private === "T",
		ItemProperty: ItemProperty ? CommonJSONParse(ItemProperty) : {},
		Type: Type || null,
		TypeRecord: TypeRecord ? CommonJSONParse(TypeRecord) : null,
	};

	const priority = Number.parseInt(OverridePriority);
	if (!Number.isNaN(priority)) {
		craft.ItemProperty.OverridePriority = priority;
	}

	return (craft.Item && craft.Name) ? craft : null;
}

/**
 * Deserialize and unpack the crafting data from the server.
 * @param {string | (null | CraftingItem)[]} Data The serialized crafting data or already-decompressed crafting item list
 * @returns {(null | CraftingItem)[]}
 */
function CraftingDecompressServerData(Data) {
	// Arrays are returned right away, only strings can be parsed
	if (Array.isArray(Data)) return Data;
	if (typeof Data !== "string") return [];

	// Decompress the data
	let DecompressedData = null;
	try {
		DecompressedData = LZString.decompressFromUTF16(Data);
	} catch(err) {
		DecompressedData = null;
	}
	if (DecompressedData == null) {
		console.warn("An error occured while decompressing Crafting data, entries have been reset.");
		return [];
	}

	// Builds the craft array to assign to the player
	return DecompressedData.split(CraftingSerializeItemSep).map(CraftingDeserialize);
}

/**
 * Loads the server packet and creates the crafting array for the player
 * @param {string | (null | CraftingItem)[]} Packet - The packet or already-decompressed crafting item list
 * @returns {void} - Nothing
 */
function CraftingLoadServer(Packet) {
	Player.Crafting = [];
	let Refresh = false;
	/** @type {Record<number, unknown>} */
	const CriticalErrors = {};
	const data = CraftingDecompressServerData(Packet);
	for (const [i, item] of CommonEnumerate(data)) {
		if (item == null) {
			Player.Crafting.push(null);
			continue;
		}

		// Make sure that the item is a valid craft
		switch (CraftingValidate(item, undefined, undefined, true)) {
			case CraftingStatusType.OK:
				Player.Crafting.push(item);
				break;
			case CraftingStatusType.ERROR:
				Player.Crafting.push(item);
				Refresh = true;
				break;
			case CraftingStatusType.CRITICAL_ERROR:
				Player.Crafting.push(null);
				Refresh = true;
				CriticalErrors[i] = (item);
				break;
		}

		// Too many items, skip the rest
		if (Player.Crafting.length >= 80) break;
	}

	/**
	 * One or more validation errors were encountered that were successfully resolved;
	 * push the fixed items back to the server */
	if (Refresh) {
		const nCritical = Object.keys(CriticalErrors).length;
		if (nCritical > 0) {
			console.warn(`Removing ${nCritical} corrupted crafted items`, CriticalErrors);
		}
		CraftingSaveServer();
	}
}

/**
 * Advance to the next crafting reordering mode, or set the mode to the specified value.
 * @param {CraftingReorderType} newmode - The mode to set.  If null, advance to next mode.
 */
function CraftingReorderModeSet(newmode=null)
{
	let pushcrafts = true;

	if (newmode == null) {
		switch (CraftingReorderMode) {
			case "None":
				newmode = "Select";
				break;

			case "Select":
				if (CraftingReorderList.length <= 0) {
					// If selection list is empty, flip back to
					// "None"; skip unnecessary network traffic.
					pushcrafts = false;
					newmode = "None";
				} else {
					newmode = "Place";
				}
				break;

			case "Place":
				newmode = "None";
				break;
		}
	}

	if (newmode == "None"  &&  CraftingReorderMode != "None") {
		/*
		 * We may have been in the middle of reordering things.
		 * Commit the current state, and empty the list.
		 */
		if (pushcrafts) {
			CraftingSaveServer();
		}
		CraftingReorderList = [];
	}
	CraftingReorderMode = newmode;
}

/**
 * Handles clicks in the crafting room.
 * @type {ScreenFunctions["Click"]}
 */
function CraftingClick(event) {
	// Can always exit or cancel
	if (MouseIn(1895, 15, 90, 90) && !["Color", "Extended", "OverridePriority", "Name"].includes(CraftingMode)) CraftingExit();
	if (MouseIn(1790, 15, 90, 90) && !["Color", "Extended", "Slot", "OverridePriority", "Name"].includes(CraftingMode)) return CraftingModeSet("Slot");

	// In slot mode, we can select which item slot to craft
	if (CraftingMode == "Slot") {

		// Four-ish pages of slots
		if (MouseIn(1475, 15, 90, 90)) {
			CraftingOffset = CraftingOffset - 20;
			if (CraftingOffset < 0) CraftingOffset = 80 - 20;
		} else if (MouseIn(1580, 15, 90, 90)) {
			CraftingOffset = CraftingOffset + 20;
			if (CraftingOffset >= 80) CraftingOffset = 0;
		}

		// Enter/Exit destroy item mode; or exit reorder mode.
		if (MouseIn(1790, 15, 90, 90)) {
			if (CraftingReorderMode != "None") {
				CraftingReorderModeSet ("None");
			} else {
				CraftingDestroy = !CraftingDestroy;
			}
		}

		// Craft slot reordering mode.
		if (MouseIn (1675, 15, 90, 90)) {
			if (CraftingDestroy) CraftingDestroy = false;

			CraftingReorderModeSet(); // Advance mode
		}

		// Scan 20 items for clicks
		for (let S = 0; S < 20; S++) {

			// If the box was clicked
			let X = (S % 4) * 500 + 15;
			let Y = Math.floor(S / 4) * 180 + 130;
			const Craft = Player.Crafting[S + CraftingOffset];
			if (!MouseIn(X, Y, 470, 140)) continue;

			// Reorder, destroy, edit or create a new crafting item
			if (CraftingReorderMode == "Select") {
				// If the index isn't present, add it.  If it
				// is present, delete it.  This has the effect
				// of toggling the slot in the UI.
				const idx = CraftingReorderList.indexOf (S + CraftingOffset);
				if (idx >= 0) {
					CraftingReorderList.splice (idx, 1);
				} else {
					CraftingReorderList.push (S + CraftingOffset);
				}
			} else if (CraftingReorderMode == "Place") {
				// Swap the slot clicked with the first entry in the list.
				const idx = CraftingReorderList.shift();
				const item = Player.Crafting[S + CraftingOffset];
				Player.Crafting[S + CraftingOffset] = Player.Crafting[idx];
				Player.Crafting[idx] = item;
				if (CraftingReorderList.length <= 0) {
					// List exhausted; commit changes and end reorder mode.
					CraftingReorderModeSet ("None");
				}
			} else if (CraftingDestroy) {
				if (Craft) {
					if (S + CraftingOffset < Player.Crafting.length) Player.Crafting[S + CraftingOffset] = null;
					CraftingSaveServer();
				}
			} else if (Craft) {
				CraftingSlot = S + CraftingOffset;
				CraftingSelectedItem = CraftingConvertItemToSelected(Craft);
				CraftingModeSet("Name");
			} else {
				CraftingSlot = S + CraftingOffset;
				CraftingSelectedItem = {
					Name: "",
					Description: "",
					Color: "Default",
					Assets: [],
					get Asset() {
						return this.Assets[0];
					},
					Property: "Normal",
					Lock: null,
					Private: false,
					TypeRecord: null,
					ItemProperty: {},
					get OverridePriority() {
						return this.ItemProperty.OverridePriority;
					},
					set OverridePriority(value) {
						if (value == null) {
							delete this.ItemProperty.OverridePriority;
						} else {
							this.ItemProperty.OverridePriority = value;
						}
					},
				};
				CraftingModeSet("Name");
			}
		}
		return;
	}

	// In color selection mode, we allow picking a color
	if (CraftingMode == "Color") {
		if (MouseIn(880, 900, 90, 90)) {
			CraftingNakedPreview = !CraftingNakedPreview;
			CraftingUpdatePreview();
		} else if (MouseIn(1200, 25, 775, 950)) {
			ItemColorClick(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName, 1200, 25, 775, 950, true);
			setTimeout(CraftingRefreshPreview, 100);
		}
		return;
	}

	// Need the `DialogFocusItem` check here as there's a bit of a race condition
	if (CraftingMode == "Extended" && DialogFocusItem) {
		CommonCallFunctionByNameWarn(`Inventory${DialogFocusItem.Asset.Group.Name}${DialogFocusItem.Asset.Name}Click`);
	}

	if (CraftingMode == "OverridePriority") {
		return;
	}
}

/**
 * Refreshes the preview model with a slight delay so the item color process is done
 * @returns {void} - Nothing
 * */
function CraftingRefreshPreview() {
	let Item = InventoryGet(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName);
	if ((Item != null) && (Item.Color != null)) {
		CraftingSelectedItem.Color = Array.isArray(Item.Color) ? Item.Color.join(",") : Item.Color || "";
		CraftingUpdatePreview();
	}
}

/**
 * Converts the currently selected item into a crafting item.
 * @return {CraftingItem}
 * */
function CraftingConvertSelectedToItem() {
	return {
		Item: (CraftingSelectedItem.Asset == null) ? "" : CraftingSelectedItem.Asset.Name,
		Property: CraftingSelectedItem.Property,
		Lock: (CraftingSelectedItem.Lock == null) ? "" : /**@type {AssetLockType}*/(CraftingSelectedItem.Lock.Name),
		Name: CraftingSelectedItem.Name,
		Description: CraftingSelectedItem.Description,
		Color: CraftingSelectedItem.Color,
		Private: CraftingSelectedItem.Private,
		TypeRecord: CraftingSelectedItem.TypeRecord || null,
		ItemProperty: CraftingSelectedItem.ItemProperty,
	};
}

/**
 * Convert a crafting item to its selected format.
 * @param {CraftingItem} Craft
 * @returns {CraftingItemSelected}
 */
function CraftingConvertItemToSelected(Craft) {
	return {
		Name: Craft.Name,
		Description: Craft.Description,
		Color: Craft.Color,
		Private: Craft.Private,
		TypeRecord: Craft.TypeRecord || null,
		Property: Craft.Property,
		Assets: CraftingAssets[Craft.Item] ?? [],
		get Asset() {
			return this.Assets[0];
		},
		Lock: Craft.Lock ? Player.Inventory.find(a => a.Asset.IsLock && a.Asset.Name == Craft.Lock).Asset : null,
		ItemProperty: Craft.ItemProperty ? Craft.ItemProperty : {},
		get OverridePriority() {
			return this.ItemProperty.OverridePriority;
		},
		set OverridePriority(value) {
			if (value == null) {
				delete this.ItemProperty.OverridePriority;
			} else {
				this.ItemProperty.OverridePriority = value;
			}
		},
	};
}

/** Restore the DOM elements of the `Name` subscreen to their default state. */
function CraftingExitResetElements() {
	// Reset the various input fields to their default
	const [nameInput, colorsInput, descriptionInput, priorityInput, privateInput] = /** @type {HTMLInputElement[]} */([
		document.getElementById(CraftingID.nameInput),
		document.getElementById(CraftingID.colorsInput),
		document.getElementById(CraftingID.descriptionInput),
		document.getElementById(CraftingID.layeringInput),
		document.getElementById(CraftingID.privateCheckbox),
	]);
	nameInput.value = nameInput.defaultValue = nameInput.placeholder = "";
	colorsInput.value = colorsInput.defaultValue = colorsInput.placeholder = "";
	priorityInput.value = priorityInput.defaultValue = priorityInput.placeholder = "0";
	descriptionInput.value = "";
	privateInput.checked = false;

	// Select the `Normal` property and disable all others
	document.querySelector(`#${CraftingID.propertyGrid} [data-property='Normal'][aria-checked='false']`)?.dispatchEvent(new Event("click"));
	document.querySelectorAll(`#${CraftingID.propertyGrid} [data-property]:not([data-property='Normal'])`).forEach(e => e.setAttribute("aria-disabled", "true"));

	// Deselect the active lock and disable them all
	document.querySelector(`#${CraftingID.padlockGrid} [data-asset][aria-checked='true']`)?.dispatchEvent(new Event("click"));
	document.querySelectorAll(`#${CraftingID.padlockGrid} [data-asset]`).forEach(e => e.setAttribute("aria-disabled", "true"));

	// Deselect the asset and disable the accept button
	const assetSelected = document.querySelector(`#${CraftingID.assetGrid} [aria-checked='true']`);
	assetSelected?.setAttribute("aria-checked", "false");
	assetSelected?.setAttribute("tabindex", "-1");
	document.querySelector(`#${CraftingID.assetGrid} [data-asset]`)?.setAttribute("tabindex", "0");
	document.getElementById(CraftingID.acceptButton)?.setAttribute("aria-disabled", "true");

	// Open the asset-based side panel and reset the styling of its control button
	const assetControlButton = document.getElementById(CraftingID.assetButton);
	assetControlButton.innerHTML = "";
	ElementButton._ParseLabel(assetControlButton.id, TextGet("SelectItem"), "bottom", { parent: assetControlButton });
	ElementButton._ParseImage(assetControlButton.id, "./Icons/NoCraft.png", { parent: assetControlButton });
	if (assetControlButton.getAttribute("aria-checked") === "false") {
		assetControlButton.dispatchEvent(new Event("click"));
	}

	const extendedButton = /** @type {HTMLButtonElement} */(document.getElementById(CraftingID.extendedButton));
	extendedButton.disabled = true;

	// Clear all search inputs and undo their filtering
	const searchInputs = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll(`#${CraftingID.leftPanel} input[type='search']`));
	searchInputs.forEach((searchInp) => {
		if (searchInp.value) {
			searchInp.value = "";
			searchInp.dispatchEvent(new Event("input"));
		}
	});

	// Close the side pannel
	document.querySelector(`#${CraftingID.leftPanel} > [aria-checked='true']`)?.dispatchEvent(new Event("click"));
}

/**
 * When the player exits the crafting room
 * @param {boolean} allowPanelClose - Whether an exit call in the `Name` mode is allowed to close the side panels before performing a proper exit of the subscreen
 * @returns {void} - Nothing
 */
function CraftingExit(allowPanelClose=true) {
	// Return to the `Name` sub-screen, if already there move to the `Slot` sub-screen and if already there exit the crafting screen
	switch (CraftingMode) {
		case "OverridePriority":
			Layering.Exit();
			return;
		case "Color":
			ItemColorExitClick();
			return;
		case "Extended":
			DialogLeaveFocusItem();
			return;
		case "Name": {
			const activePanel = document.querySelector(`#${CraftingID.leftPanel} > [aria-checked='true']`);
			if (activePanel && allowPanelClose) {
				activePanel.dispatchEvent(new Event("click"));
			} else {
				CraftingExitResetElements();
				CraftingUnload();
				CraftingModeSet("Slot");
				CraftingSelectedItem = null;
			}
			return;
		}
		case "Slot": {
			ElementRemove(CraftingID.root);
			CharacterDelete(CraftingPreview);
			CraftingPreview = null;
			CraftingOffset = 0;
			CraftingReorderModeSet("None");
			if (CraftingReturnToChatroom) {
				CommonSetScreen("Online", "ChatRoom");
			} else {
				CommonSetScreen("Room", "MainHall");
			}
			return;
		}
	}
}

/**
 * Applies the craft to all matching items
 * @param {CraftingItem} Craft
 * @param {Asset} Item
 */
function CraftingAppliesToItem(Craft, Item) {
	// Validates the craft asset
	if (!Craft || !Item) return false;

	const elligbleAssets = CraftingAssets[Craft.Item] ?? [];
	return elligbleAssets.includes(Item);
}

/**
 * Builds the item list from the player inventory, filters by the search box content
 * @returns {Asset[]} - Nothing
 */
function CraftingItemListBuild() {
	const assets = new Set(Object.values(CraftingAssets).map(i => i[0]));
	return Array.from(assets).filter(a => {
		return InventoryAvailable(Player, a.Name, a.DynamicGroupName);
	}).sort((a1, a2) => {
		return a1.Description.localeCompare(a2.Description);
	});
}

/**
 * A record with tools for validating {@link CraftingItem} properties.
 * @type {Record<keyof CraftingItem, CratingValidationStruct>}
 * @see {@link CratingValidationStruct}
 * @todo Let the Validate/GetDefault functions take the respective attribute rather than the entire {@link CraftingItem}
 */
const CraftingValidationRecord = {
	Color: {
		Validate: function(craft, asset) {
			if (typeof craft.Color !== "string") {
				return false;
			} else if ((craft.Color === "") || (asset == null)) {
				return true;
			} else {
				const Colors = craft.Color.replace(" ", "").split(",");
				return Colors.every((c) => CommonIsColor(c) || (c === "Default"));
			}
		},
		GetDefault: function(craft, asset) {
			if ((typeof craft.Color !== "string") || (asset == null)) {
				return "";
			} else {
				const Colors = craft.Color.replace(" ", "").split(",");
				const ColorsNew = Colors.map((c, i) => CommonIsColor(c) ? c : asset.DefaultColor[i] || "Default");
				return ColorsNew.join(",");
			}
		},
		StatusCode: CraftingStatusType.ERROR,
	},
	Description: {
		Validate: (c, a) => typeof c.Description === "string",
		GetDefault: (c, a) => "",
		StatusCode: CraftingStatusType.ERROR,
	},
	Disabled: {
		Validate: function (c, a) {
			return c.Disabled == null || typeof c.Disabled === "boolean";
		},
		GetDefault: function (c, a) {
			return undefined;
		},
		StatusCode: CraftingStatusType.ERROR,
	},
	Item: {
		Validate: (c, a, checkPlayerInventory=false) => {
			if (checkPlayerInventory) {
				return Player.Inventory.some((i) => i.Name === c.Item);
			} else {
				return Asset.some((i) => i.Name === c.Item);
			}
		},
		GetDefault: (c, a) => null,
		StatusCode: CraftingStatusType.CRITICAL_ERROR,
	},
	Lock: {
		Validate: function (c, a, checkPlayerInventory=false) {
			if ((a != null) && (!a.AllowLock)) {
				return (c.Lock === "");
			} else if (c.Lock === "") {
				return true;
			}

			const isValidLock = CraftingLockList.includes(c.Lock);
			if (checkPlayerInventory) {
				return isValidLock && Player.Inventory.some((i) => i.Name === c.Lock);
			} else {
				return isValidLock;
			}
		},
		GetDefault: (c, a) => "",
		StatusCode: CraftingStatusType.ERROR,
	},
	MemberName: {
		Validate: (c, a) => c.MemberName == null || typeof c.MemberName === "string",
		GetDefault: (c, a) => null,
		StatusCode: CraftingStatusType.ERROR,
	},
	MemberNumber: {
		Validate: (c, a) => c.MemberNumber == null || typeof c.MemberNumber === "number",
		GetDefault: (c, a) => null,
		StatusCode: CraftingStatusType.ERROR,
	},
	Name: {
		Validate: (c, a) => c.Name && typeof c.Name === "string",
		GetDefault: (c, a) => a ? a.Description : "Crafted Item",
		StatusCode: CraftingStatusType.ERROR,
	},
	OverridePriority: {
		Validate: (c, a) => (c.OverridePriority == null) || Number.isInteger(c.OverridePriority),
		GetDefault: (c, a) => null,
		StatusCode: CraftingStatusType.ERROR,
	},
	Private: {
		Validate: (c, a) => typeof c.Private === "boolean",
		GetDefault: (c, a) => false,
		StatusCode: CraftingStatusType.ERROR,
	},
	Property: {
		Validate: function (c, a) {
			if (a == null) {
				return CraftingPropertyMap.has(c.Property);
			} else {
				const Allow = CraftingPropertyMap.get(c.Property);
				return (Allow !== undefined) ? Allow(a) : false;
			}
		},
		GetDefault: (c, a) => "Normal",
		StatusCode: CraftingStatusType.ERROR,
	},
	ItemProperty: {
		Validate: function (c, a) {
			const property = c.ItemProperty;
			if (property == null) {
				return true;
			} else if (!CommonIsObject(property)) {
				return false;
			} else if (!a) {
				return true;
			}

			// TODO: Add a better way of validating subscreen properties rather than just unconditionally
			// allowing `OverrideHeight`.
			/** @type {ItemProperties} */
			const baseline = {
				OverrideHeight: null,
			};
			if (a.Archetype) {
				const data = ExtendedItemGetData(a, a.Archetype);
				if (data && data.baselineProperty) {
					Object.assign(baseline, data.baselineProperty);
				}
			}

			for (const [key, value] of Object.entries(property)) {
				if (value == null) {
					continue;
				} else if (CraftingPropertyExclude.has(/** @type {keyof ItemProperties} */(key))) {
					return false;
				} else if (key === "OverridePriority") {
					if (Number.isInteger(value)) {
						continue;
					} else if (CommonIsObject(value)) {
						const layers = a.Layer.map(l => l.Name);
						for (const [layerName, priority] of Object.entries(value)) {
							if (!(layers.includes(layerName) && Number.isInteger(priority))) {
								return false;
							}
						}
					} else {
						return false;
					}
				} else if (typeof value !== typeof baseline[key]) {
					return false;
				}
			}
			return true;
		},
		GetDefault: function (c, a) {
			const property = c.ItemProperty;
			if (!CommonIsObject(property) || !a) {
				return {};
			}

			/** @type {ItemProperties} */
			const baseline = {
				OverrideHeight: null,
			};
			if (a.Archetype) {
				let data = ExtendedItemGetData(a, a.Archetype);
				if (data && data.baselineProperty) {
					Object.assign(baseline, data.baselineProperty);
				}
			}

			const ret = {};
			for (const [key, value] of Object.entries(property)) {
				if (value == null || CraftingPropertyExclude.has(/** @type {keyof ItemProperties} */(key))) {
					continue;
				} else if (key === "OverridePriority" && Number.isInteger(value)) {
					ret[key] = value;
				} else if (key === "OverridePriority" && CommonIsObject(value)) {
					ret[key] = {};
					const layers = a.Layer.map(l => l.Name);
					for (const [layerName, priority] of Object.entries(value)) {
						if (layers.includes(layerName) && Number.isInteger(priority)) {
							ret[key][layerName] = priority;
						}
					}
				} else if (typeof value === typeof baseline[key]) {
					ret[key] = value;
				}
			}
			return ret;
		},
		StatusCode: CraftingStatusType.ERROR,
	},
	// NOTE: More thorough `TypeRecord` validation is performed by the extended item `...Init` functions
	TypeRecord: {
		Validate: function (c, a) {
			const typeRecord = c.TypeRecord;
			if (typeRecord == null) {
				return true;
			} else if (!CommonIsObject(typeRecord)) {
				return false;
			} else if (a == null) {
				return true;
			} else if (!a.Archetype) {
				return typeRecord == null;
			} else {
				return true;
			}
		},
		GetDefault: function (c, a) {
			if (a == null || !a.Archetype) {
				return null;
			} else {
				return {};
			}
		},
		StatusCode: CraftingStatusType.ERROR,
	},
	/** @deprecated */
	Type: {
		Validate: function (c, a) {
			return c.Type == null || typeof c.Type === "string";
		},
		GetDefault: function (c, a) {
			return null;
		},
		StatusCode: CraftingStatusType.ERROR,
	}
};

/**
 * Validate and sanitinize crafting properties of the passed item inplace.
 * @param {CraftingItem} Craft - The crafted item properties or `null`
 * @param {Asset | null} asset - The matching Asset. Will be extracted from the player inventory if `null`
 * @param {boolean} Warn - Whether a warning should logged whenever the crafting validation fails
 * @param {boolean} checkPlayerInventory - Whether or not the player must own the crafted item's underlying asset
 * @return {CraftingStatusType} - One of the {@link CraftingStatusType} status codes; 0 denoting an unrecoverable validation error
 */
function CraftingValidate(Craft, asset=null, Warn=true, checkPlayerInventory=false) {
	if (Craft == null) {
		return CraftingStatusType.CRITICAL_ERROR;
	}
	/** @type {Map<string, CraftingStatusType>} */
	const StatusMap = new Map();
	const Name = Craft.Name;

	// Manually search for the Asset if it has not been provided
	/** @type {readonly Asset[]} */
	let assets;
	if (asset == null) {
		assets = CraftingAssets[Craft.Item] ?? [];
		if (assets.length === 0) {
			StatusMap.set("Item", CraftingStatusType.CRITICAL_ERROR);
		}
	} else {
		assets = [asset];
	}

	if (asset != null && Craft.TypeRecord == null && typeof Craft.Type === "string") {
		Craft.TypeRecord = ExtendedItemTypeToRecord(asset, Craft.Type);
	}

	/**
	 * Check all legal attributes.
	 * If `Asset == null` at this point then let all Asset-requiring checks pass, as we
	 * can't properly validate them. Note that this will introduce the potential for false negatives.
	 */
	for (const [AttrName, {Validate, GetDefault, StatusCode}] of Object.entries(CraftingValidationRecord)) {
		if (!assets.some(a => Validate(Craft, a, checkPlayerInventory))) {
			const AttrValue = (typeof Craft[AttrName] === "string") ? `"${Craft[AttrName]}"` : Craft[AttrName];
			if (Warn) {
				console.warn(`Invalid "Craft.${AttrName}" value for crafted item "${Name}": ${AttrValue}`);
			}
			Craft[AttrName] = GetDefault(Craft, asset, checkPlayerInventory);
			StatusMap.set(AttrName, StatusCode);
		} else {
			StatusMap.set(AttrName, CraftingStatusType.OK);
		}
	}

	// If the Asset has been explicetly passed then `Craft.Item` errors are fully recoverable,
	// though the player should actually own the item
	if (asset != null && StatusMap.get("Item") === CraftingStatusType.CRITICAL_ERROR) {
		StatusMap.set("Item", CraftingStatusType.ERROR);
		Craft.Item = asset.Name;
		if (checkPlayerInventory && !Player.Inventory.some((i) => i.Name === asset.Name)) {
			Craft.Disabled = true;
		}
	}

	// Check for extra attributes
	const LegalAttributes = Object.keys(CraftingValidationRecord);
	for (const AttrName of Object.keys(Craft)) {
		if (!LegalAttributes.includes(AttrName)) {
			if (Warn) {
				console.warn(`Invalid extra "Craft.${AttrName}" attribute for crafted item "${Name}"`);
			}
			delete Craft[AttrName];
			StatusMap.set(AttrName, CraftingStatusType.ERROR);
		}
	}
	return /** @type {CraftingStatusType} */(Math.min(...StatusMap.values()));
}
