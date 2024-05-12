"use strict";

/**
 * Namespace with functions for managing the layering sub screen
 *
 * Below is an example of some basic usage of the {@link Layering} subscreen,
 * including a `Click` function for initializing the screen and a set of
 * `Resize` and `Exit` functions for, respectively, handling the screens
 * drawing/resizing and exiting
 *
 * @namespace
 * @example
 *
 * let FancyScreenMode: "default" | "layering" = "default";
 *
 * // Make sure the fancy screen mode is changed back to its default upon exiting the layering subscreen
 * Layering.RegisterExitCallbacks({
 *     screen: "FancyScreen",
 *     callback: () => FancyScreenMode = "default",
 * });
 *
 * function FancyScreenClick() {
 *     const C: Character;
 *     const item: Item;
 *     switch (FancyScreenMode) {
 *         case "default": {
 *             if Mousein(...) {
 *                 FancyScreenMode = "layering";
 *                 Layering.Init(C, item);
 *             }
 *             return;
 *         }
 *     }
 * }
 *
 * function FancyScreenResize(load) {
 *     switch (FancyScreenMode) {
 *         case "layering":
 *             Layering.Resize(load);
 *             return;
 *     }
 * }
 *
 * function FancyScreenExit() {
 *     switch (FancyScreenMode) {
 *         case "layering":
 *             Layering.Exit();
 *             return;
 *     }
 * }
 */
var Layering = {
	/**
	 * The character in question
	 * @type {null | Character}
	 */
	Character: null,

	/**
	 * The (rectangular) shape and inter-button gap of the layering screen
	 * @type {null | LayeringDisplay}
	 */
	Display: null,

	/**
	 * The selected item in question
	 * @type {null | Item}
	 */
	Item: null,

	/**
	 * Get the item's asset
	 * @readonly
	 * @type {Asset}
	 */
	get Asset() { return this.Item.Asset; },

	/**
	 * Get or set the items `Property.OverridePriority`
	 * @returns {undefined | AssetLayerOverridePriority}
	 */
	get OverridePriority() {
		return this.Item.Property.OverridePriority;
	},
	set OverridePriority(value) {
		this.Item.Property.OverridePriority = value;
	},

	/**
	 * The items default `Property.OverridePriority` value.
	 *
	 * This is generally `undefined`, though certain extended item options do overwrite it.
	 * @private
	 * @type {undefined | AssetLayerOverridePriority}
	 */
	_PriorityDefault: undefined,

	/**
	 * Return whether the layering sub screen has currently been initialized (be it either active or unloaded)
	 * @returns {this is typeof this & Pick<Required<typeof this>, "Character" | "Display" | "Item">}
	 */
	IsActive() { return !!document.getElementById(this.ID.root); },

	/**
	 * The default (rectangular) shape and inter-button gap of the layering screen
	 * @readonly
	 * @type {Readonly<LayeringDisplay>}
	 */
	DisplayDefault: Object.freeze({
		buttonGap: 20,
		x: 2000 - (9 * 110) - 25,
		y: 25,
		w: (9 * 110),
		h: 1000 - (2 * 25),
	}),

	/**
	 * The IDs of layering-specific DOM elements
	 * @readonly
	 */
	ID: Object.freeze({
		root: "layering",

		buttonGrid: "layering-button-grid",
		resetButton: "layering-reset-button",
		exitButton: "layering-exit-button",

		assetHeader: "layering-asset-header",
		assetGrid: "layering-asset-grid",

		layerHeader: "layering-layer-header",
		layerDIV: "layering-layer-div",
		layerOuterGrid: "layering-layer-outer-grid",
	}),

	/**
	 * Screen-specific callbacks that will be executed after calling {@link Layering.Exit}.
	 *
	 * Used as helpers for setting up the next screen.
	 * @private
	 * @readonly
	 * @type {((screen: string, C: Character, item: Item) => void)[]}
	 * @see {@link Layering.RegisterExitCallbacks}
	 */
	_ExitCallbacks: [],

	/**
	 * @private
	 * Initialize the object-based variant of {@link AssetLayerOverridePriority}
	 */
	_InitOverridePriorityObject() {
		this.OverridePriority = {};
		const layerElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-layer-priority]"));
		layerElements.forEach(e => {
			const value = e.valueAsNumber;
			if (!Number.isNaN(value) && value.toString() !== e.dataset.layerPriority) {
				this.OverridePriority[e.dataset.name] = CommonClamp(Math.round(value), -99, 99);
			}
		});
	},

	/**
	 * @private
	 * @param {string} name - The name of the layer
	 * @param {number} priority - The stringified layer priority
	 * @param {string} defaultPriority - The stringified default priority of the layer
	 */
	_ApplyLayerPriority(name, priority, defaultPriority) {
		const old = this.OverridePriority?.[name];
		if (!CommonIsObject(this.OverridePriority)) {
			this._UpdateInputColors("layer-priority");
			this._InitOverridePriorityObject();
		}

		if (!Number.isNaN(priority) && priority.toString() !== defaultPriority) {
			this.OverridePriority[name] = CommonClamp(priority, -99, 99);
		} else {
			delete this.OverridePriority[name];
		}

		if (old !== this.OverridePriority[name]) {
			this._CharacterRefresh(this.Character, false, false);
		}
	},

	/**
	 * @private
	 * @param {number} priority - The layer priority
	 * @param {string} defaultPriority - The stringified default priority of the layer
	 */
	_ApplyAssetPriority(priority, defaultPriority) {
		const old = this.OverridePriority;
		if (!Number.isInteger(old)) {
			this._UpdateInputColors("asset-priority");
		}

		if (!Number.isNaN(priority) && priority.toString() !== defaultPriority) {
			this.OverridePriority = CommonClamp(Math.round(priority), -99, 99);
		} else {
			delete this.OverridePriority;
		}

		if (old !== this.OverridePriority) {
			this._CharacterRefresh(this.Character, false, false);
		}
	},

	/**
	 * Event listener for `input` events involving layer priorities
	 * @private
	 * @param {Event} event
	 */
	_LayerInputListener(event) {
		const target = /** @type {HTMLInputElement} */(event.target);
		this._ApplyLayerPriority(target.dataset.name, target.valueAsNumber, target.dataset.layerPriority);
	},

	/**
	 * Event listener for `input` events involving asset priorities
	 * @private
	 * @param {Event} event
	 */
	_AssetInputListener(event) {
		const target = /** @type {HTMLInputElement} */(event.target);
		this._ApplyAssetPriority(target.valueAsNumber, target.dataset["asset-priority"]);
	},

	/**
	 * Event listener for `blur` events of number-based input elements.
	 * Sanitizes the elements value upon deselecting the element.
	 * @private
	 * @param {HTMLInputElement} elem
	 */
	_BlurListener(elem) {
		if (Number.isNaN(elem.valueAsNumber)) {
			elem.value = elem.defaultValue;
		} else {
			elem.value = CommonClamp(Math.round(elem.valueAsNumber), -99, 99).toString();
		}
	},

	/**
	 * A limited version of {@link CharacterRefresh}
	 * @private
	 */
	_CharacterRefresh: CommonLimitFunction(CharacterRefresh, 100, 100),

	/**
	 * Event listener for `click` events of the reset button
	 * @private
	 */
	_ResetClickListener() {
		this.OverridePriority = this._PriorityDefault == null ? undefined : CommonCloneDeep(this._PriorityDefault);

		const layerElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-layer-priority]"));
		layerElements.forEach(e => e.value = e.dataset.layerPriority);

		const assetElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-asset-priority]"));
		assetElements.forEach(e => e.value = e.dataset.assetPriority);

		this._CharacterRefresh(this.Character, false, false);
	},

	/**
	 * Update the background colors of the `number`-based input elements, the color change depending on whether one is changing an asset- or layer-specific priority.
	 * @private
	 * @param {"layer-priority" | "asset-priority"} activeType
	 */
	_UpdateInputColors(activeType) {
		const layerColor = activeType === "layer-priority" ? "" : "lightgray";
		const layerElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-layer-priority]"));
		layerElements.forEach(e => e.style.backgroundColor = layerColor);

		const assetColor = activeType === "asset-priority" ? "" : "lightgray";
		const assetElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-asset-priority]"));
		assetElements.forEach(e => e.style.backgroundColor = assetColor);
	},

	/**
	 * Group all layers by their {@link AssetLayer.CopyLayerColor} properties
	 * @private
	 * @param {readonly AssetLayer[]} layers
	 * @returns {Record<string, AssetLayer[]>}
	 */
	_GroupLayers(layers) {
		/** @type {Record<string, AssetLayer[]>} */
		const ret = {};
		for (const layer of layers) {
			const name = layer.CopyLayerColor ?? layer.Name ?? "";
			ret[name] ??= [];
			ret[name].push(layer);
		}

		for (const layerList of Object.values(ret)) {
			layerList.sort((l1, l2) => {
				const name1 = l1.Name ?? l1.Asset.Name;
				const name2 = l2.Name ?? l2.Asset.Name;
				return name1.localeCompare(name2);
			});
		}
		return ret;
	},

	/**
	 * Return the default `Property.OverridePriority` of the current item.
	 *
	 * This is generally `undefined`, though certain extended item options do overwrite it.
	 * @private
	 * @returns {undefined | AssetLayerOverridePriority}
	 */
	_GetDefaultPriority() {
		if (!this.Item.Property.TypeRecord) {
			return undefined;
		}

		// Recreate the items default state (given a provided type record) and extract its default priority
		/** @type {Item} */
		const item = { Asset: this.Item.Asset };
		ExtendedItemInit(this.Character, item, false, false);
		ExtendedItemSetOptionByRecord(this.Character, item, this.Item.Property.TypeRecord, { push: false, refresh: false });
		return item.Property.OverridePriority;
	},

	/**
	 * Initialize the layering subscreen
	 * @param {Item} item - The affected item
	 * @param {Character} character - The item's owning character
	 * @param {null | Partial<LayeringDisplay>} display - The shape of the layering subscreen
	 * @param {boolean} reload - Whether we're loading or reloading the screen.
	 * A reload pushes any current changes towards the server and reinitializes all DOM elements.
	 * @returns {HTMLDivElement} The div containing the layering subscreen
	 */
	Init(item, character, display=null, reload=false) {
		if (this.IsActive()) {
			if (reload) {
				this.Exit(true);
			} else {
				console.error('Layering screen is already active; re-initialization requires passing the "reload" parameter');
				return /** @type {HTMLDivElement} */(document.getElementById(this.ID.root));
			}
		}

		this.Item = item;
		this.Item.Property ??= {};
		this.Character = character;
		this.Display = {
			...this.DisplayDefault,
			...(display ?? {}),
		};

		this.Load();
		return /** @type {HTMLDivElement} */(document.getElementById(this.ID.root));
	},

	/** @type {ScreenFunctions["Load"]} */
	Load() {
		let elem = document.getElementById(this.ID.root);
		if (elem != null) {
			this.Resize(true);
			return;
		}

		let innerHTML = "";
		this._PriorityDefault = this._GetDefaultPriority();
		const layerGroupings = this._GroupLayers(this.Asset.Layer);
		for (const [layerGroupName, layerList] of Object.entries(layerGroupings)) {
			innerHTML += `
				<h2 data-layering-group=${layerGroupName}></h2>
				<div class=layering-layer-inner-grid>
			`;
			for (let { Name, Priority } of layerList) {
				/** @type {number} */
				const layerPriority = this.OverridePriority?.[Name] ?? Priority;
				/** @type {number} */
				const defaultLayerPriority = this._PriorityDefault?.[Name] ?? Priority;
				Name ??= this.Asset.Name;
				innerHTML += `
					<div class=layering-pair>
						<input type=number data-layer-priority=${defaultLayerPriority} data-name=${Name} min=-99 max=99 value=${layerPriority} inputmode="numeric"></input>
						<span class=layering-pair-text>${Name}</span>
					</div>
				`;
			}
			innerHTML += "</div>";
		}

		const assetPriority = this.Asset.DrawingPriority ?? this.Asset.Group.DrawingPriority;
		const itemPriority = Number.isInteger(this.OverridePriority) ? this.OverridePriority : assetPriority;
		const defaultItemPriority = Number.isInteger(this._PriorityDefault) ? this._PriorityDefault : assetPriority;
		elem = ElementCreateDiv(this.ID.root);
		// NOTE: Button ordering in the grid is from right to left
		elem.innerHTML = `
			<h1 id=${this.ID.assetHeader}>${InterfaceTextGet("LayeringAsset")}</h1>
			<div id=${this.ID.buttonGrid} class=layering-button-grid>
				<div class=layering-button-container>
					<button id=${this.ID.exitButton} class=layering-button></button>
					<div class=layering-button-tooltip>${InterfaceTextGet("LayeringExit")}</div>
				</div>
				<div class=layering-button-container>
					<button id=${this.ID.resetButton} class=layering-button></button>
					<div class=layering-button-tooltip>${InterfaceTextGet("LayeringReset")}</div>
				</div>
			</div>
			<div class=layering-pair id=${this.ID.assetGrid}>
				<input type=number data-asset-priority=${defaultItemPriority} min=-99 max=99 value=${itemPriority} inputmode="numeric" />
				<span class=layering-pair-text>${this.Asset.Description}</span>
			</div>
			<h1 id=${this.ID.layerHeader}>${InterfaceTextGet("LayeringLayer")}</h1>
			<div id=${this.ID.layerDIV}>
				<div id=${this.ID.layerOuterGrid}>${innerHTML}</div>
			</div>
		`;

		// These somewhat non-conventional units exactly reproduce BC's canvas scaling
		elem.style.setProperty("--button-gap", `min(${this.Display.buttonGap / 10}vh, ${this.Display.buttonGap / 20}vw)`);

		const [resetButton, exitButton, assetElements, layerElements] = [
			/** @type {HTMLButtonElement} */(document.getElementById(this.ID.resetButton)),
			/** @type {HTMLButtonElement} */(document.getElementById(this.ID.exitButton)),
			/** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-asset-priority]")),
			/** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-layer-priority]")),
		];

		// Add all the event listeners
		resetButton.addEventListener("click", () => this._ResetClickListener());
		exitButton.addEventListener("click", () => this.Exit());
		assetElements.forEach(e => {
			e.addEventListener("input", (event) => this._AssetInputListener(event));
			e.addEventListener("focus", (event) => /** @type {HTMLInputElement} */(event.target).select());
			e.addEventListener("blur", (event) => () => this._BlurListener(e));
		});
		layerElements.forEach(e => {
			e.addEventListener("input", (event) => this._LayerInputListener(event));
			e.addEventListener("focus", (event) => /** @type {HTMLInputElement} */(event.target).select());
			e.addEventListener("blur", (event) => () => this._BlurListener(e));
		});

		// Color either the asset- or layer-specific input elements light gray,
		// depending on which one of the two is active
		if (CommonIsObject(this.OverridePriority)) {
			assetElements.forEach(e => e.style.backgroundColor = "lightgray");
		} else {
			layerElements.forEach(e => e.style.backgroundColor = "lightgray");
		}

		// Load and set all translated text
		TextCache.buildAsync(`Assets/${this.Character.AssetFamily}/LayerNames.csv`).then((cache) => {
			const headers = /** @type {NodeListOf<HTMLHeadingElement>} */(document.querySelectorAll("[data-layering-group]"));
			headers.forEach(h => {
				const key = `${this.Asset.DynamicGroupName}${this.Asset.Name}${h.dataset.layeringGroup}`;
				h.innerText = cache.cache[key] ?? (h.dataset.layeringGroup || this.Asset.Description);
			});
		});

		this.Resize(true);
	},

	/**
	 * Can be also be used, alternatively, as a {@link ScreenFunctions.Draw} function
	 * @type {ScreenFunctions["Resize"]}
	 */
	Resize(load) {
		ElementPositionFix(this.ID.root, 0, this.Display.x, this.Display.y, this.Display.w, this.Display.h);
		const elem = document.getElementById(this.ID.root);
		elem.style.display = "";
	},

	/** @type {ScreenFunctions["Unload"]} */
	Unload() {
		// Need the null check here due to `CommonSetScreen` calling `Unload` after `Exit`
		const elem = document.getElementById(this.ID.root);
		if (elem) {
			elem.style.display = "none";
		}
	},

	/**
	 * @satisfies {ScreenFunctions["Exit"]}
	 * @param {boolean} reload - Whether the exit call is part of a reload (see {@link Layering.Init})
	 */
	Exit(reload=false) {
		ElementRemove(this.ID.root);
		ChatRoomCharacterItemUpdate(this.Character, this.Asset.Group.Name);
		if (this.Character.IsPlayer()) {
			ServerPlayerAppearanceSync();
		}

		if (!reload) {
			this._ExitCallbacks.forEach(func => func(CurrentScreen, this.Character, this.Item));
		}

		this.Item = null;
		this.Character = null;
		this.Display = null;
		this._PriorityDefault = undefined;
	},

	/**
	 * Register screen-specific callbacks to-be executed after calling {@link Layering.Exit}.
	 *
	 * Callbacks registered herein must be used _exclusively_ for setting up the next screen, and not for tearing down the layering sub screen.
	 * As such, they are ignored when performing a reload of the layering sub screen (see {@link Layering.Init})
	 * @param {readonly LayeringExitOptions[]} options
	 */
	RegisterExitCallbacks(...options) {
		for (let { screen, callback } of options) {
			if (screen) {
				callback ??= CommonNoop;
				this._ExitCallbacks.push((currentScreen, ...args) => currentScreen === screen ? callback(...args) : undefined);
			} else if (callback) {
				this._ExitCallbacks.push((currentScreen, ...args) => callback(...args));
			}
		}
	},
};

Layering.RegisterExitCallbacks(
	{
		screen: "Crafting",
		callback: (C, item) => {
			CraftingSelectedItem.ItemProperty.OverridePriority = item.Property.OverridePriority;
			CraftingModeSet("Name");
		},
	},
	{
		callback: () => DialogMenuMode === "layering" ? DialogChangeMode("items") : undefined,
	},
	{
		screen: "Shop2",
		callback: () => {
			Shop2Vars.Mode = "Preview";
		},
	},
);
