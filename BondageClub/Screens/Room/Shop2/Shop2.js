"use strict";
var Shop2Background = "Shop";

/**
 * Namespace with shop-specific variables that are expected to mutate over the course of the (sub-)screens lifetime
 * @namespace
 */
const Shop2Vars = CommonVariableContainer(
	{
		/**
		 * The item (if any) currently equipped in preview mode
		 * @type {null | Item}
		 */
		EquippedItem: null,

		/**
		 * The current page
		 * @type {number}
		 */
		Page: 0,

		/**
		 * Whether any item has been bought or sold, thus requiring a push to the server
		 * @type {boolean}
		 */
		Push: false,

		/**
		 * The current shop mode
		 * @type {ShopMode}
		 */
		Mode: "Preview",

		/**
		 * The current dressing state of the preview character
		 * @type {ShopClothesMode}
		 */
		ClothesMode: "Clothes",

		/**
		 * All (filtered) items that can still be bought
		 * @type {ShopItem[]}
		 */
		BuyItems: [],

		/**
		 * All (filtered) items that can still be sold
		 * @type {ShopItem[]}
		 */
		SellItems: [],

		/**
		 * All (filtered) items that can be equipped in preview mode
		 * @type {ShopItem[]}
		 */
		PreviewItems: [],

		/**
		 * Whether the group-selection dropdown menu should be displayed
		 * @type {boolean}
		 */
		DisplayDropdown: false,
		/**
		 * A record mapping filter ID to filter callbacks.
		 * Each callback is expected to return a list denoting for which modes the item is to-be shown.
		 * Note that an item will only be shown if the respective mode is included in the output list of every callback.
		 * @type {Record<string, (item: ShopItem) => ("Buy" | "Sell" | "Preview")[]>}
		 */
		Filters: {},
	},
	{
		/**
		 * Get the maximum number of pages for the current {@link Shop2Vars.Mode}.
		 * @type {number}
		 */
		get PageCount() {
			switch (Shop2Vars.Mode) {
				case "Preview":
					return Math.max(1, Math.ceil(Shop2Vars.PreviewItems.length / 12));
				case "Buy":
					return Math.max(1, Math.ceil(Shop2Vars.BuyItems.length / 12));
				case "Sell":
					return Math.max(1, Math.ceil(Shop2Vars.SellItems.length / 12));
				default:
					return 1;
			}
		},

		/**
		 * Get all <=12 assets given the current {@link Shop2Vars.Page} and {@link Shop2Vars.Mode}.
		 * @type {readonly ShopItem[]}
		 */
		get CurrentAssets() {
			switch (Shop2Vars.Mode) {
				case "Preview":
					return Shop2Vars.PreviewItems.slice(12 * Shop2Vars.Page, 12 * (1 + Shop2Vars.Page));
				case "Buy":
					return Shop2Vars.BuyItems.slice(12 * Shop2Vars.Page, 12 * (1 + Shop2Vars.Page));
				case "Sell":
					return Shop2Vars.SellItems.slice(12 * Shop2Vars.Page, 12 * (1 + Shop2Vars.Page));
				default:
					return [];
			}
		},
	},
);

/**
 * Namespace with shop-specific variables that are expected to remain constant over the course of the (sub-)screens lifetime.
 * @namespace
 */
const Shop2InitVars = CommonVariableContainer(
	{
		/**
		 * The shop background
		 * @type {string}
		 */
		Background: "Shop",

		/**
		 * The shop preview character
		 * @type {null | Character}
		 */
		Preview: null,

		/**
		 * The module- and screen-name of the previous screen (if any)
		 * @type {null | [module: ModuleType, screen: string]}
		 */
		PreviousScreen: null,

		/**
		 * Whether the shop screen has been initialized or not.
		 * Useful in `Load` for identifying whether we're loading or reloading a (sub-)scren.
		 * @type {boolean}
		 */
		Init: false,

		/**
		 * Super set of all items that be bought or sold
		 * @type {readonly ShopItem[]}
		 */
		Items: [],
	},
	{
		/** The shop background */
		get Background() { return Shop2Background; },
		set Background(value) { Shop2Background = value; },
	},
	{
		replacer: (_, value) => value instanceof Set ? ["__Set__", ...value] : value,
		reviver: (_, value) => Array.isArray(value) && value[0] === "__Set__" ? new Set(value.slice(1)) : value,
	},
);

/**
 * Namespace with shop-specific constants.
 * @namespace
 */
const Shop2Consts = {
	/**
	 * Grid parameters for the to-be displayed shop items
	 */
	Grid: {
		x: 1115,
		y: 185,
		width: 860,
		height: 772,
		itemWidth: 200,
		itemHeight: 244,
	},

	/**
	 * Coordinates for the `Color` mode
	 * @type {RectTuple}
	 */
	ItemColorCoords: [
		1115,
		25,
		860,
		772 + (185 - 25),
	],

	/**
	 * A list denoting the rotation order between the respective shop modes.
	 * @type {readonly ShopMode[]}
	 */
	BuyModeCycleOrder: ["Preview", "Buy", "Sell"],

	/**
	 * A list denoting the rotation order (and their callbacks) between the respective clothing modes.
	 * @type {readonly { Mode: ShopClothesMode, Callback: (C: Character, items: Item[]) => void }[]}
	 */
	ClothesCycleOrder: [
		{
			Mode: "Clothes",
			Callback: (C, items) => C.Appearance = items,
		},
		{
			Mode: "Underwear",
			Callback: (C, items) => C.Appearance = items.filter(i => !i.Asset.Group.AllowNone || i.Asset.BodyCosplay || i.Asset.Group.Underwear),
		},
		{
			Mode: "Cosplay",
			Callback: (C, items) => C.Appearance = items.filter(i => !i.Asset.Group.AllowNone || i.Asset.BodyCosplay),
		},
		{
			Mode: "Nude",
			Callback: (C, items) => C.Appearance = items.filter(i => !i.Asset.Group.AllowNone),
		},
	],

	// NOTE: Initialized in `AssetLoadAll`
	/**
	 * A record mapping {@link Asset.BuyGroup} names to the asset's value and all members of the buygroup.
	 * Only includes buy groups with at least 2 members.
	 * @type {Record<string, { Value: number, Assets: readonly ItemBundle[] }>}
	 */
	BuyGroups: {},

	// NOTE: Initialized in `TranslationAssetProcess` or `AssetBuildDescription` depending on the language
	/**
	 * A record mapping {@link AssetGroup.Description} to a list with all respective (shop-elligble) group names.
	 *
	 * Note that keys will vary based on the users active language.
	 *
	 * Groups require at least one asset with a >0 {@link Asset.Value} to be considered elligble.
	 * @type {Record<string, AssetGroupName[]>}
	 */
	GroupDescriptions: {},

	// NOTE: Initialized in `AssetLoadAll`
	/**
	 * A set with the group + asset names of all asset keys.
	 * @type {Set<string>}
	 */
	Keys: new Set(),

	// NOTE: Initialized in `AssetLoadAll`
	/**
	 * A set with the group + asset names of all asset remotes.
	 * @type {Set<string>}
	 */
	Remotes: new Set(),
};

/**
 * Namespace with shop-related functions.
 * @namespace
 */
var Shop2 = {
	/**
	 * Populate {@link Shop2Consts.BuyGroups} with buy groups.
	 * @private
	 */
	_PopulateBuyGroups: function _PopulateBuyGroups() {
		/** @type {Record<string, ({ Money: number } & ItemBundle)[]>} */
		const buyGroups = {};
		for (const asset of Asset) {
			if (asset.BuyGroup) {
				buyGroups[asset.BuyGroup] ??= [];
				buyGroups[asset.BuyGroup].push({ Group: asset.Group.Name, Name: asset.Name, Money: asset.Value });
			}
		}

		for (const [buyGroup, members] of Object.entries(buyGroups)) {
			if (members.length <= 1) {
				continue;
			}

			// Find the smallest >0 money value; fall back to -1 | >0 if it cannot be found
			const allMoney = members.map(i => i.Money);
			let money = Math.min(...allMoney.filter(i => i > 0));
			if (money === Infinity) {
				money = -1;
			}
			Shop2Consts.BuyGroups[buyGroup] = { Value: money, Assets: members.map(i => CommonOmit(i, ["Money"])) };
		}
	},

	/**
	 * Populate {@link Shop2Consts.GroupDescriptions} with group descriptions and {@link Shop2InitVars.Filters.Groups} with all shop-elligble groups.
	 * @private
	 */
	_PopulateGroupDescriptions: function _PopulateGroupDescriptions() {
		Shop2Consts.GroupDescriptions = {};
		for (const group of AssetGroup) {
			if (group.Asset.some(a => a.Value > 0)) {
				Shop2Consts.GroupDescriptions[group.Description] ??= [];
				Shop2Consts.GroupDescriptions[group.Description].push(group.Name);
			}
		}
	},

	/**
	 * Populate {@link Shop2Consts.Keys} and {@link Shop2Consts.Remote} with the name of all asset keys and remotes.
	 * @private
	 */
	_PopulateKeysAndRemotes: function _PopulateKeysAndRemotes() {
		for (const asset of Asset) {
			if (asset.Effect.some(e => e.startsWith("Unlock"))) {
				Shop2Consts.Keys.add(`${asset.Group.Name}${asset.Name}`);
			}
			if (asset.Effect.some(e => e === E.Remote)) {
				Shop2Consts.Remotes.add(`${asset.Group.Name}${asset.Name}`);
			}
		}
	},

	/**
	 * Run function for a single item in the shop
	 * @param {number} time
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 * @param {number} assetIndex - The assets index within {@link Shop2Vars.CurrentAssets}
	 * @satisfies {ShopScreenFunctions["Run"]}
	 * @private
	 */
	_AssetElementRun: function _AssetElementRun(time, x, y, w, h, assetIndex) {
		const { Asset } = Shop2Vars.CurrentAssets[assetIndex] ?? {};
		if (!Asset) {
			return;
		}

		/** @type {InventoryIcon[]} */
		const Icons = [];
		if (Asset.Extended) {
			Icons.push("Extended");
		}
		if (Shop2Consts.BuyGroups[Asset.BuyGroup]) {
			Icons.push("BuyGroup");
		}

		/** @type {PreviewDrawOptions} */
		const options = { Width: w, Height: h };
		const hover = MouseIn(x, y, w, h) && !CommonIsMobile;
		let money = Shop2Consts.BuyGroups[Asset.BuyGroup]?.Value ?? Asset.Value;
		switch (Shop2Vars.Mode) {
			case "Preview": {
				const item = Shop2Vars.EquippedItem;
				if (hover) {
					options.Background = "cyan";
				} else if (item && item.Asset.Name === Asset.Name && item.Asset.Group.Name === Asset.Group.Name) {
					options.Background = "gray";
				} else {
					options.Background = "white";
				}
				DrawItemPreview({ Asset, Icons }, Shop2.Preview, x, y, options);
				break;
			}
			case "Sell":
			case "Buy": {
				if (Shop2Vars.Mode === "Sell") {
					money = Math.ceil(money * 0.5);
				}

				let label = "";
				if (money <= 0) {
					options.Background = "gray";
					options.Hover = false;
					label = "N.A.";
				} else if (Shop2Vars.Mode === "Buy" && money > Player.Money) {
					options.Background = "gray";
					options.Hover = false;
					label = `$${money}`;
				} else if (hover) {
					options.Background = "cyan";
					label = `$${money}`;
				} else {
					options.Background = "white";
					label = `$${money}`;
				}

				DrawItemPreview({ Asset, Icons }, Shop2.Preview, x, y, options);
				Shop2.DrawPriceRibbon(label, x, y, w, Shop2Vars.Mode === "Buy" ? "Red" : "Green");
				break;
			}
		}
	},

	/**
	 * Click function for a single item in the shop
	 * @param {MouseEvent | TouchEvent} event
	 * @param {number} assetIndex - The assets index within {@link Shop2Vars.CurrentAssets}
	 * @satisfies {ShopScreenFunctions["Click"]}
	 * @private
	 */
	_AssetElementClick: function _AssetElementClick(event, assetIndex) {
		const asset = Shop2Vars.CurrentAssets[assetIndex]?.Asset;
		if (!asset) {
			return;
		}

		const buyGroups = Shop2Consts.BuyGroups[asset.BuyGroup] ?? { Value: asset.Value, Assets: [{ Group: asset.Group.Name, Name: asset.Name }] };
		switch (Shop2Vars.Mode) {
			case "Preview": {
				const item = Shop2Vars.EquippedItem;

				const index = Shop2Consts.ClothesCycleOrder.findIndex(({ Mode }) => Mode === Shop2Vars.ClothesMode);
				if (index === -1) {
					return;
				}
				const { Callback } = Shop2Consts.ClothesCycleOrder[index];
				Callback(Shop2InitVars.Preview, Player.Appearance.filter(i => i.Asset.Group.IsAppearance()));

				if (item && item.Asset.Name === asset.Name && item.Asset.Group.Name === asset.Group.Name) {
					Shop2Vars.EquippedItem = null;
					CharacterRefresh(Shop2InitVars.Preview, false, false);
				} else {
					Shop2Vars.EquippedItem = CharacterAppearanceSetItem(Shop2InitVars.Preview, asset.Group.Name, asset, [...asset.DefaultColor]) ?? null;
				}
				break;
			}
			case "Buy":
			case "Sell": {
				let money = buyGroups.Value;
				if (money <= 0) {
					return;
				}

				let removalField = /** @type {"BuyItems" | "SellItems"} */(undefined);
				let additionField = /** @type {"BuyItems" | "SellItems"} */(undefined);
				let modifyInventory = /** @type {typeof InventoryAdd} */(undefined);
				if (Shop2Vars.Mode === "Buy") {
					removalField = "BuyItems";
					additionField = "SellItems";
					modifyInventory = InventoryAdd;
				} else {
					removalField = "SellItems";
					additionField = "BuyItems";
					money = -Math.ceil(money * 0.5);
					modifyInventory = InventoryDelete;
				}

				if (money > Player.Money) {
					return;
				}

				Shop2Vars.Push = true;
				for (const { Group, Name } of buyGroups.Assets) {
					modifyInventory(Player, Name, Group, false);

					// An index -1 can be expected here in a few cases, namely for -1-valued buygroup members that cannot be directly bought and
					// are thus absent from `Shop2Vars.BuyItems`/`.SellItems`
					const indexOld = Shop2Vars[removalField].findIndex(({ Asset }) => Asset.Name === Name && Asset.Group.Name === Group);
					if (indexOld === -1) {
						continue;
					}
					const shopItem = Shop2Vars[removalField][indexOld];
					shopItem.Buy = Shop2Vars.Mode !== "Buy";
					Shop2Vars[removalField].splice(indexOld, 1);

					// Do not move items to the sell list if they should never be sold
					if (Shop2Vars.Mode !== "Buy" || !shopItem.NeverSell) {
						let indexNew = Shop2Vars[additionField].findIndex(({ SortPriority }) => SortPriority >= shopItem.SortPriority);
						if (indexNew === -1) {
							indexNew = Shop2Vars[additionField].length;
						}
						Shop2Vars[additionField].splice(indexNew, 0, shopItem);
					}
				}
				Player.Money -= money;

				if (Shop2Vars.Page >= Shop2Vars.PageCount) {
					Shop2Vars.Page = Shop2Vars.PageCount - 1;
				}
				break;
			}
		}
	},

	/**
	 * Construct screen functions for the <=12 items displayed in the shop.
	 * @returns {Record<string, ShopScreenFunctions>}
	 */
	_GenerateAssetElements: function _GenerateAssetElements() {
		const coordsList = CommonGenerateGridCoords(12, Shop2Consts.Grid);
		return Object.fromEntries(coordsList.map((coords, i) => {
			return [
				`Asset${i}`,
				{
					Coords: coords,
					Mode: new Set(["Preview", "Buy", "Sell"]),
					Run: (...args) => Shop2._AssetElementRun(...args, i),
					Click: (...args) => Shop2._AssetElementClick(...args, i),
				},
			];
		}));
	},

	/**
	 * Filter the buy & sell assets in {@link Shop2Vars} based on the {@link Shop2InitVars.Filters} settings.
	 * @private
	 */
	_ApplyAssetFilter: function _ApplyAssetFilter() {
		// Empty the filter caches and mark all relevant assets as filtered or not
		Shop2Vars.BuyItems = [];
		Shop2Vars.SellItems = [];
		Shop2Vars.PreviewItems = [];
		for (const item of Shop2InitVars.Items) {
			const fieldNames = Object.values(Shop2Vars.Filters).reduce((prev, func) => {
				const next = func(item);
				return prev.filter(mode => next.includes(mode));
			}, /** @type {("Preview" | "Buy" | "Sell")[]} */(["Preview", "Buy", "Sell"]));

			for (const fieldName of fieldNames) {
				Shop2Vars[`${fieldName}Items`].push(item);
			}
		}

		// Ensure that after the filtering we're still the [0, Shop2Vars.PageCount) range
		if (Shop2Vars.Page >= Shop2Vars.PageCount) {
			Shop2Vars.Page = Shop2Vars.PageCount - 1;
		}
	},

	/** Click handler for the group-selection checkboxes */
	_SetCheckboxFilters: function _SetCheckboxFilters() {
		/** @type {Set<AssetGroupName>} */
		const checkedSet = new Set();
		for (const [groupDescription, groupNames] of Object.entries(Shop2Consts.GroupDescriptions)) {
			const checkBox = /** @type {null | HTMLInputElement} */(document.getElementById(`Shop2Checkbox-${groupDescription}`));
			if (!checkBox) {
				continue;
			}
			if (checkBox.checked) {
				groupNames.forEach(i => checkedSet.add(i));
			}
		}

		Shop2Vars.Filters.AssetGroup = (item) => checkedSet.has(item.Asset.Group.Name) ? ["Buy", "Sell", "Preview"] : [];
		Shop2._ApplyAssetFilter();
	},

	/**
	 * Draw a ribbon with the specified label in the top-right corner of the passed square.
	 * @type {(label: string, x: number, y: number, w: number, color?: string) => void}
	 */
	DrawPriceRibbon: function DrawPriceRibbon(label, x, y, w, color="Red") {
		MainCanvas.save();

		// Draw a ribbon (i.e. triangle with the tip removed)
		const triangle = 85;
		const tip = 30;
		MainCanvas.beginPath();
		MainCanvas.fillStyle = color;
		MainCanvas.moveTo(x + w - triangle, y);
		MainCanvas.lineTo(x + w - tip, y);
		MainCanvas.lineTo(x + w, y + tip);
		MainCanvas.lineTo(x + w, y + triangle);
		MainCanvas.closePath();
		MainCanvas.fill();
		MainCanvas.strokeStyle = "Black";
		MainCanvas.lineWidth = 1;
		MainCanvas.stroke();

		// Draw 45 degree rotated text inside the triangle
		const textX = x + w - 30;
		const textY = y + 30;
		MainCanvas.translate(textX, textY);
		MainCanvas.rotate(Math.PI / 4);
		MainCanvas.translate(-textX, -textY);
		DrawTextFit(label, textX, textY, triangle * 0.8, "White");

		MainCanvas.restore();
	},

	/**
	 * Convert the passed asset list into a list consisting of shop items
	 * @param {readonly Asset[]} assets - The assets in question
	 * @returns {ShopItem[]} - The shop items constructed from the passed assets
	 */
	ParseAssets: function ParseAssets(assets) {
		return assets.map((a, i) => {
			const Buy = !InventoryAvailable(Player, a.Name, a.Group.Name);
			const NeverSell = (
				a.NeverSell
				|| (LogQuery("BlockKey", "OwnerRule") && Shop2Consts.Keys.has(`${a.Group.Name}${a.Name}`))
				|| (LogQuery("BlockRemote", "OwnerRule") && Shop2Consts.Remotes.has(`${a.Group.Name}${a.Name}`))
			);
			return { Asset: a, SortPriority: i, Buy, NeverSell };
		});
	},

	// NOTE: Asset-specific entries are assigned further down below outside the `Shop2` namespace
	/**
	 * Namespace with the individual screen function components of the shop screen
	 * @type {Record<string, ShopScreenFunctions>}
	 */
	Elements: {
		DarkFactor: {
			Coords: [0, 0, 2000, 1000],
			Mode: new Set(["Preview", "Buy", "Sell", "Extended", "Color"]),
			Run: (time, ...coords) => DrawRect(...coords, "rgba(0,0,0,0.5)"),
		},
		InputSearch: {
			Coords: [25, 38, 660, 60],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Load: () => {
				if (Shop2InitVars.Init) {
					return;
				}

				// We've got a caching related race condition going on for `TextGet("InputSearch")`, so hard code the english text as fallback
				const elem = ElementCreateInput("Shop2InputSearch", "text", "", "50");
				elem.placeholder = TextGet("InputSearch") || "Filter by item name";
				elem.addEventListener("input", () => {
					if (!elem.value) {
						delete Shop2Vars.Filters.Keyword;
					} else {
						Shop2Vars.Filters.Keyword = (item) => {
							const description = item.Asset.Description.toUpperCase();
							return description.includes(elem.value.toUpperCase().trim()) ? ["Buy", "Sell", "Preview"] : [];
						};
					}
					Shop2._ApplyAssetFilter();
				});
			},
			Run: (time, ...coords) => {
				const font = MainCanvas.canvas.clientWidth <= MainCanvas.canvas.clientHeight * 2 ? MainCanvas.canvas.clientWidth / 50 : MainCanvas.canvas.clientHeight / 25;
				ElementPositionFix("Shop2InputSearch", font, ...coords);
			},
			Unload: () => {
				const elem = document.getElementById("Shop2InputSearch");
				if (elem) {
					elem.style.display = "none";
				}
			},
			Exit: () => ElementRemove("Shop2InputSearch"),
		},
		GroupSelectHeader: {
			Coords: [345, 155, 0, 0],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, x, y) => DrawText(TextGet("GroupSelectHeader"), x, y, "White"),
		},
		GroupSelectCollapse: {
			Coords: [25, Shop2Consts.Grid.y, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, ...coords) => DrawButton(...coords, "", "White", "Icons/Next.png", TextGet("GroupSelectCollapse")),
			Click: () => {
				Shop2Vars.DisplayDropdown = !Shop2Vars.DisplayDropdown;
				const elem = document.getElementById("Shop2GroupSelect");
				if (elem) {
					elem.style.display = "none";
				}
			},
		},
		GroupSelectAll: {
			Coords: [135, Shop2Consts.Grid.y, 200, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, ...coords) => DrawButton(...coords, TextGet("GroupSelectAll"), "White"),
			Click: () => {
				for (const groupDescr of Object.keys(Shop2Consts.GroupDescriptions)) {
					const elem = /** @type {null | HTMLInputElement} */(document.getElementById(`Shop2Checkbox-${groupDescr}`));
					if (elem) {
						elem.checked = true;
					}
				}
				delete Shop2Vars.Filters.AssetGroup;
				Shop2._ApplyAssetFilter();
			},
		},
		GroupSelectNone: {
			Coords: [355, Shop2Consts.Grid.y, 200, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, ...coords) => DrawButton(...coords, TextGet("GroupSelectNone"), "White"),
			Click: () => {
				for (const groupDescr of Object.keys(Shop2Consts.GroupDescriptions)) {
					const elem = /** @type {null | HTMLInputElement} */(document.getElementById(`Shop2Checkbox-${groupDescr}`));
					if (elem) {
						elem.checked = false;
					}
				}
				Shop2Vars.Filters.AssetGroup = () => [];
				Shop2._ApplyAssetFilter();
			},
		},
		GroupSelect: {
			Coords: [25, Shop2Consts.Grid.y + 100, 660, Shop2Consts.Grid.height - 100],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Load: () => {
				if (Shop2InitVars.Init) {
					return;
				}

				const elem = ElementCreateDiv("Shop2GroupSelect");

				let content = `<div class="Shop2CheckboxGrid">`;
				const groupNames = Object.keys(Shop2Consts.GroupDescriptions).sort((i, j) => i.localeCompare(j));
				for (const groupDescr of groupNames) {
					content += `
						<label class="Shop2Checkbox">
							<input type="checkbox" id="Shop2Checkbox-${groupDescr}" onclick="Shop2._SetCheckboxFilters()", checked=true />
							${groupDescr}
						</label>
					`;
				}
				content += `</div> </div>`;

				elem.innerHTML = content;
				elem.style.display = "none";
			},
			Run: (time, ...coords) => {
				if (!Shop2Vars.DisplayDropdown) {
					return;
				}
				const font = MainCanvas.canvas.clientWidth <= MainCanvas.canvas.clientHeight * 2 ? MainCanvas.canvas.clientWidth / 50 : MainCanvas.canvas.clientHeight / 25;
				ElementPositionFix("Shop2GroupSelect", font, ...coords);
			},
			Unload: () => {
				const elem = document.getElementById("Shop2GroupSelect");
				if (elem) {
					elem.style.display = "none";
				}
			},
			Exit: () => ElementRemove("Shop2GroupSelect"),
		},
		ItemHeader: {
			Coords: [Shop2Consts.Grid.x + 20 + 1.5 * Shop2Consts.Grid.itemWidth, 155, 0, 0],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, x, y) => {
				let i = 0;
				let j = Shop2Consts.BuyModeCycleOrder.indexOf(Shop2Vars.Mode);
				const hideShopItems = Player.GenderSettings.HideShopItems;
				if (hideShopItems.Male === hideShopItems.Female) {
					i = 0;
				} else if (hideShopItems.Male) {
					i = 1;
				} else if (hideShopItems.Female) {
					i = 2;
				}

				const txt = TextGet(`ItemHeader${i}${j}`).replace("0", `${1 + Shop2Vars.Page}/${Shop2Vars.PageCount}`);
				DrawText(txt, x, y, "White");
			},
		},
		MoneyHeader: {
			Coords: [Shop2Consts.Grid.x + 3 * 20 + 3.5 * Shop2Consts.Grid.itemWidth, 155, 0, 0],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, x, y) => {
				const money = Intl.NumberFormat(
					"en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 },
				).format(Math.min(999999, Player.Money));
				DrawText(money, x, y, "White");
			},
		},
		Character: {
			Coords: [650, 0, 0, 0],
			Mode: new Set(["Preview", "Buy", "Sell", "Extended", "Color"]),
			Load: () => {
				if (Shop2InitVars.Init) {
					return;
				}
				Shop2InitVars.Preview = CharacterLoadSimple("Shop2Preview");
				Shop2InitVars.Preview.Appearance = Player.Appearance.filter(i => i.Asset.Group.IsAppearance());
				Shop2InitVars.Preview.HeightRatio = 1;
				// @ts-expect-error: partially initialized shared settings
				Shop2InitVars.Preview.OnlineSharedSettings = { ItemsAffectExpressions: false };
				CharacterRefresh(Shop2InitVars.Preview, false, false);
			},
			Run: (time, x, y) => DrawCharacter(Shop2InitVars.Preview, x, y, 1),
			Exit: () => {
				switch (Shop2Vars.Mode) {
					case "Buy":
					case "Sell":
					case "Preview":
						CharacterDelete(Shop2InitVars.Preview);
						Shop2InitVars.Preview = null;
						break;
				}
			},
		},
		BuyMode: {
			Coords: [1225, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, ...coords) => {
				DrawButton(...coords, "", "Lime", "Icons/Shop.png", TextGet(`BuyMode${Shop2Vars.Mode}`));
			},
			Click: () => {
				const i = Shop2Consts.BuyModeCycleOrder.indexOf(Shop2Vars.Mode);
				if (i !== -1) {
					Shop2Vars.Mode = Shop2Consts.BuyModeCycleOrder[(i + 1) % Shop2Consts.BuyModeCycleOrder.length];
				}
				Shop2Vars.Page = 0;
			},
		},
		Color: {
			Coords: [1335, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, ...coords) => {
				const asset = Shop2Vars.EquippedItem?.Asset;
				const icon = (asset?.DefaultColor?.length ?? 1) <= 1 ? "ColorChange" : "ColorChangeMulti";
				if (!asset || Shop2Vars.Mode !== "Preview") {
					DrawButton(...coords, "", "Gray", `Icons/${icon}.png`, TextGet("Color"), true);
				} else {
					DrawButton(...coords, "", "White", `Icons/${icon}.png`, TextGet("Color"));
				}
			},
			Click: () => {
				if (Shop2Vars.EquippedItem && Shop2Vars.Mode === "Preview") {
					Shop2Unload();
					ItemColorLoad(Shop2InitVars.Preview, Shop2Vars.EquippedItem, ...Shop2Consts.ItemColorCoords, true);
					ItemColorOnExit(() => {
						Shop2Vars.Mode = "Preview";
						Shop2Load();
					});
					Shop2Vars.Mode = "Color";
				}
			},
		},
		ExtendedItemButton: {
			Coords: [1445, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, ...coords) => {
				const asset = Shop2Vars.EquippedItem?.Asset;
				if (!asset || !asset.Archetype || asset.IsLock || Shop2Vars.Mode !== "Preview") {
					DrawButton(...coords, "", "Gray", "Icons/Use.png", TextGet("ExtendedItemButton"), true);
				} else {
					DrawButton(...coords, "", "White", "Icons/Use.png", TextGet("ExtendedItemButton"));
				}
			},
			Click: () => {
				const asset = Shop2Vars.EquippedItem?.Asset;
				if (!asset || !asset.Archetype || asset.IsLock || Shop2Vars.Mode !== "Preview") {
					return;
				}
				Shop2Unload();
				DialogExtendItem(Shop2Vars.EquippedItem);
				Shop2Vars.Mode = "Extended";
			},
		},
		Clothes: {
			Coords: [1555, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, ...coords) => {
				if (Shop2Vars.Mode !== "Preview") {
					DrawButton(...coords, "", "Gray", "Icons/Dress.png", TextGet(`ClothesMode${Shop2Vars.ClothesMode}`));
				} else {
					DrawButton(...coords, "", "white", "Icons/Dress.png", TextGet(`ClothesMode${Shop2Vars.ClothesMode}`));
				}
			},
			Click: () => {
				if (Shop2Vars.Mode !== "Preview") {
					return;
				}

				let index = Shop2Consts.ClothesCycleOrder.findIndex(({ Mode }) => Mode === Shop2Vars.ClothesMode);
				if (index === -1) {
					index = 0;
				}

				const clothesMode = Shop2Consts.ClothesCycleOrder[(index + 1) % Shop2Consts.ClothesCycleOrder.length];
				Shop2Vars.ClothesMode = clothesMode.Mode;
				clothesMode.Callback(Shop2InitVars.Preview, Player.Appearance.filter(i => i.Asset.Group.IsAppearance()));
				if (Shop2Vars.EquippedItem !== null) {
					const item = CharacterAppearanceSetItem(
						Shop2InitVars.Preview,
						Shop2Vars.EquippedItem.Asset.Group.Name,
						Shop2Vars.EquippedItem.Asset,
						Shop2Vars.EquippedItem.Color,
						undefined,
						undefined,
						false,
					);
					if (item) {
						item.Property = Shop2Vars.EquippedItem.Property;
					}
					Shop2Vars.EquippedItem = item ?? null;
				}
				CharacterRefresh(Shop2InitVars.Preview, false, false);
			},
		},
		PagePrev: {
			Coords: [1665, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, ...coords) => {
				if (Shop2Vars.PageCount > 1) {
					DrawButton(...coords, "", "White", "Icons/Prev.png", TextGet("PagePrev"));
				} else {
					DrawButton(...coords, "", "Gray", "Icons/Prev.png", TextGet("PagePrev"), true);
				}
			},
			Click: () => {
				if (Shop2Vars.PageCount > 1) {
					Shop2Vars.Page = Shop2Vars.Page === 0 ? Shop2Vars.PageCount - 1 : (Shop2Vars.Page - 1) % Shop2Vars.PageCount;
				}
			},
		},
		PageNext: {
			Coords: [1775, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Run: (time, ...coords) => {
				if (Shop2Vars.PageCount > 1) {
					DrawButton(...coords, "", "White", "Icons/Next.png", TextGet("PageNext"));
				} else {
					DrawButton(...coords, "", "Gray", "Icons/Next.png", TextGet("PageNext"), true);
				}
			},
			Click: () => {
				if (Shop2Vars.PageCount > 1) {
					Shop2Vars.Page = (Shop2Vars.Page + 1) % Shop2Vars.PageCount;
				}
			},
		},
		Exit: {
			Coords: [1885, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell", "Extended"]),
			Run: (time, ...coords) => DrawButton(...coords, "", "White", "Icons/Exit.png", TextGet("Exit")),
			Click: () => Shop2Exit(),
		},
		// Keep these two at the very button as we can't reliably perform `MouseIn(...Coords)` checks on them
		ExtendedItemScreen: {
			Coords: [0, 0, 2000, 1000],
			Mode: new Set(["Extended"]),
			Run: (time, ...coords) => {
				CommonCallFunctionByNameWarn(`Inventory${DialogFocusItem.Asset.Group.Name}${DialogFocusItem.Asset.Name}Draw`);
			},
			Click: () => {
				CommonCallFunctionByNameWarn(`Inventory${DialogFocusItem.Asset.Group.Name}${DialogFocusItem.Asset.Name}Click`);
			},
			Exit: () => DialogLeaveFocusItem(),
		},
		ColorScreen: {
			Coords: [0, 0, 2000, 1000],
			Mode: new Set(["Color"]),
			Run: (time, ...coords) => {
				ItemColorDraw(Shop2InitVars.Preview, ItemColorItem.Asset.Group.Name, ...Shop2Consts.ItemColorCoords, true);
			},
			Click: () => {
				ItemColorClick(Shop2InitVars.Preview, ItemColorItem.Asset.Group.Name, ...Shop2Consts.ItemColorCoords, true);
			},
			Exit: () => ItemColorExitClick(),
		},
	},

	/**
	 * Helper function for initializing the `Shop2` screen.
	 * @param {null | string} background - The shops background image
	 * @param {null | [module: ModuleType, screen: string]} screen - A 2-tuple containing the module and name of the previous screen
	 * @param {null | readonly Asset[]} assets - A list of all assets that should appear in the shop
	 */
	Init(background=null, screen=null, assets=null) {
		Shop2Vars.Reset();
		Shop2InitVars.Reset();
		if (background != null) {
			Shop2InitVars.Background = background;
		}
		if (screen != null) {
			Shop2InitVars.PreviousScreen = screen;
		}
		if (assets != null) {
			Shop2InitVars.Items = Shop2.ParseAssets(assets);
		}
		CommonSetScreen("Room", "Shop2");
	}
};

/** @type {ScreenFunctions["Load"]} */
function Shop2Load() {
	if (!Shop2InitVars.Init) {
		if (Shop2InitVars.Items.length === 0) {
			Shop2InitVars.Items = Shop2.ParseAssets(
				Asset.filter(a => {
					return (
						a.Value !== 0
						&& a.Group.Name === a.DynamicGroupName
						&& (Shop2Consts.BuyGroups[a.BuyGroup]?.Value ?? a.Value) > 0
						&& !ShopHideGenderedAsset(a)
					);
				}).sort((a1, a2) => {
					return `${a1.Group.Description}${a1.Description}`.localeCompare(`${a2.Group.Description}${a2.Description}`);
				}),
			);
		}

		Shop2Vars.Filters.NeverSell ??= (item) => item.NeverSell ? ["Buy", "Preview"] : ["Sell", "Buy", "Preview"];
		Shop2Vars.Filters.Buy ??= (item) => item.Buy ? ["Buy", "Preview"] : ["Sell", "Preview"];
		Shop2.ApplyItemFilters();
	}

	Object.values(Shop2.Elements).forEach((e) => {
		if (e.Mode.has(Shop2Vars.Mode)) {
			e.Load?.();
		}
	});

	if (!Shop2InitVars.Init) {
		Shop2InitVars.Init = true;
	}
}

/** @type {ScreenFunctions["Click"]} */
function Shop2Click(event) {
	Object.values(Shop2.Elements).some((e) => {
		if (e.Click && e.Mode.has(Shop2Vars.Mode) && MouseIn(...e.Coords)) {
			e.Click(event);
			return true;
		} else {
			return false;
		}
	});
}

/** @type {ScreenFunctions["Run"]} */
function Shop2Run(time) {
	Object.values(Shop2.Elements).forEach((e) => {
		if (e.Mode.has(Shop2Vars.Mode)) {
			e.Run(time, ...e.Coords);
		}
	});
}

/** @type {ScreenFunctions["Unload"]} */
function Shop2Unload() {
	Object.values(Shop2.Elements).forEach((e) => {
		if (e.Mode.has(Shop2Vars.Mode)) {
			e.Unload?.();
		}
	});
}

/** @type {ScreenFunctions["Exit"]} */
function Shop2Exit() {
	const oldMode = Shop2Vars.Mode;
	Object.values(Shop2.Elements).forEach((e) => {
		if (e.Mode.has(Shop2Vars.Mode)) {
			e.Exit?.();
		}
	});

	switch (oldMode) {
		case "Buy":
		case "Sell":
		case "Preview": {
			if (Shop2Vars.Push) {
				ServerPlayerInventorySync();
				ServerPlayerSync();
			}
			if (Shop2InitVars.PreviousScreen) {
				CommonSetScreen(...Shop2InitVars.PreviousScreen);
			} else {
				CommonSetScreen("Room", "Shop");
			}
			Shop2Vars.Reset();
			Shop2InitVars.Reset();
		}
	}
}

Object.assign(Shop2.Elements, Shop2._GenerateAssetElements());
