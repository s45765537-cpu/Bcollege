"use strict";

/** A configuration object containing constants used by the ItemColor UI scripts */
const ItemColorConfig = /** @type {const} */({
	buttonSpacing: 20,
	buttonSize: 65,
	headerButtonSize: 90,
	colorPickerButtonWidth: 65,
	colorDisplayWidth: 160,
	colorInputHeight: 45,
});

/** An enum for the possible item color UI modes */
const ItemColorMode = /** @type {const} */({
	DEFAULT: "Default",
	COLOR_PICKER: "ColorPicker",
});

/**
 * Initialized in {@link ItemColorLoad} and valid until {@link ItemColorReset} is called
 * @type {Character}
 */
let ItemColorCharacter = /** @type {never} */ (null);
/**
 * Initialized in {@link ItemColorLoad} and valid until {@link ItemColorReset} is called
 * @type {ItemColorItem}
 */
let ItemColorItem = /** @type {never} */ (null);
/** @type {null | ItemColorMode} */
let ItemColorCurrentMode = ItemColorMode.DEFAULT;
/**
 * Initialized in {@link ItemColorStateBuild} and valid until {@link ItemColorReset} is called
 * @type {string}
 */
let ItemColorStateKey = /** @type {never} */ (null);
/**
 * Initialized in {@link ItemColorStateBuild} and valid until {@link ItemColorReset} is called
 * @type {ItemColorStateType}
 */
let ItemColorState = /** @type {never} */ (null);
/** @type {number} */
let ItemColorPage = 0;
/** @type {Record<string, number>} */
let ItemColorLayerPages = {};
/** @type {string | null} */
let ItemColorPickerBackup = null;
/**
 * The indices of to-be colored layers within a {@link Item.Color}/{@link ItemColorGetColorableLayers}-returned array.
 *
 * Note that these layers (and their indices) belong to a colorable _subset_ of {@link Asset.Layer}.
 * @type {number[]}
 */
let ItemColorPickerIndices = [];
/**
 * The {@link Asset.Layer} indices of to-be colored layers mapped to their respective layer.
 * @type {Map<number, AssetLayer>}
 */
const ItemColorPickerLayers = new Map();
/** @type {ItemColorExitListener[]} */
let ItemColorExitListeners = [];
/** @type {string} */
let ItemColorBackup;
let ItemColorText = new TextCache("Screens/Character/ItemColor/ItemColor.csv");
/**
 * Initialized in {@link ItemColorLoad} and valid until {@link ItemColorReset} is called
 * @type {TextCache}
 */
let ItemColorLayerNames;
/**
 * Initialized in {@link ItemColorLoad} and valid until {@link ItemColorReset} is called
 * @type {TextCache}
 */
let ItemColorGroupNames;
/**
 * All (hex code) colors used within the current lifetime of the ItemColor subscreen.
 * @type {Set<BCColor>}
 */
const ItemColorHistory = new Set();

/**
 * Sanitize the color of the passed item, returning an array of valid color strings and of length {@link Asset.ColorableLayerCount}.
 * @param {Item} item - The item whose colors are to be validated
 * @returns {BCColor[]} - The validated colors returned as array
 */
function ItemColorSanitizeColor(item) {
	const color = [...item.Asset.DefaultColor];
	if (Array.isArray(item.Color)) {
		for (const [i, colorValue] of item.Color.entries()) {
			if (i >= color.length) {
				break;
			} else if (!CommonDrawColorValid(colorValue, item.Asset.Group)) {
				continue;
			} else {
				color[i] = colorValue;
			}
		}
	} else if (typeof item.Color === "string" && CommonDrawColorValid(item.Color, item.Asset.Group)) {
		color.fill(item.Color);
	}
	return color;
}

/**
 * Sanitize the properties of the passed item in relation to any and all color & opacity related fields.
 * @param {Item} item - The item whose properties are to be validated
 * @returns {ItemColorProperties} - The validated item properties
 */
function ItemColorSanitizeProperty(item) {
	let layerOpacities = item.Asset.Layer.map(l => l.Opacity);
	item.Property ??= {};
	const opacity = item.Property?.Opacity;
	if (CommonIsFinite(opacity)) {
		if (item.Asset.Layer.some(l => CommonClamp(opacity, l.MinOpacity, l.MaxOpacity) === opacity)) {
			// The value fits in all of our layers min/max, use that
			layerOpacities.fill(opacity);
		} else {
			// It doesn't, so make a fake array with that value and let the next block validate it
			item.Property.Opacity = Array(item.Asset.Layer.length).fill(item.Property?.Opacity);
		}
	}
	if (Array.isArray(item.Property?.Opacity)) {
		for (const [i, opacityValue] of item.Property.Opacity.entries()) {
			if (i >= layerOpacities.length) {
				break;
			}
			if (!CommonIsFinite(opacityValue)) {
				continue;
			} else {
				layerOpacities[i] = CommonClamp(opacityValue, item.Asset.Layer[i].MinOpacity, item.Asset.Layer[i].MaxOpacity);
			}
		}
	}
	return Object.assign(item.Property, { Opacity: layerOpacities });
}

/**
 * Loads the item color UI with the provided character, item and positioning parameters.
 * @param {Character} c - The character being colored
 * @param {Item} item - The item being colored
 * @param {number} x - The x-coordinate at which to draw the UI
 * @param {number} y - The y-coordinate at which to draw the UI
 * @param {number} width - The width the UI should be drawn at
 * @param {number} height - The height the UI should be drawn at
 * @param {boolean} [includeResetButton] - Whether or not to include the "Reset to default" button
 * @returns {Promise<void>} - Nothing
 * @satisfies {ScreenLoadHandler}
 */
async function ItemColorLoad(c, item, x, y, width, height, includeResetButton) {
	ItemColorReset();
	ItemColorBackup = AppearanceItemStringify(item);
	ItemColorStateBuild(c, item, x, y, width, height);
	ItemColorLayerNames = new TextCache(`Assets/${c.AssetFamily}/LayerNames.csv`);
	ItemColorGroupNames = new TextCache(`Assets/${c.AssetFamily}/ColorGroups.csv`);

	await ItemColorLayerNames.loadedPromise;
	await ItemColorGroupNames.loadedPromise;
	await ItemColorText.loadedPromise;

	const state = ItemColorState;
	// Add 25 from the width to correct for the hard-coded scrollbar gutter
	const shape = /** @type {const} */([x, y, width + 25, height]);
	if (state.simpleMode) {
		await ItemColorOpenPicker(state.colorGroups[0], { shape });
	} else {
		// Pre-loaded (and hide) the color picker subscreen again
		await ColorPickerInit({ shape, dispatch: false });
		ColorPickerUnload();
	}
}

/**
 * Draws the item color UI according to its current state
 * @param {Character} c - The character being colored
 * @param {AssetGroupName} group - The name of the item group being colored
 * @param {number} x - The x-coordinate at which to draw the UI
 * @param {number} y - The y-coordinate at which to draw the UI
 * @param {number} width - The width the UI should be drawn at
 * @param {number} height - The height the UI should be drawn at
 * @returns {void} - Nothing
 */
function ItemColorDraw(c, group, x, y, width, height) {
	const item = InventoryGet(c, group);
	if (!item || !ItemColorState || !ItemColorItem) {
		return;
	}

	const headerButtonSize = ItemColorConfig.headerButtonSize;

	if (ItemColorCurrentMode === ItemColorMode.DEFAULT && ItemColorState.pageCount > 1) {
		DrawButton(
			ItemColorState.paginationButtonX, y, headerButtonSize, headerButtonSize, "", "#fff", "Icons/Next.png",
			ItemColorText.get("Next"),
		);
	}

	if (ItemColorCurrentMode === ItemColorMode.DEFAULT) {
		DrawButton(
			ItemColorState.cancelButtonX, y, headerButtonSize, headerButtonSize, "", "#fff", "Icons/Cancel.png",
		);

		DrawButton(
			ItemColorState.saveButtonX, y, headerButtonSize, headerButtonSize, "", "#fff", "Icons/Accept.png",
		);

		DrawButton(
			ItemColorState.resetButtonX, y, headerButtonSize, headerButtonSize, "", "#fff", "Icons/Reset.png",
		);
	}

	const contentY = ItemColorState.contentY;

	switch (ItemColorCurrentMode) {
		case ItemColorMode.COLOR_PICKER:
			ColorPickerResize(false);
			return;
		default:
			return ItemColorDrawDefault(x, contentY);
	}
}

/**
 * Draws the item color UI in default mode
 * @param {number} x - The x-coordinate at which to draw the default UI
 * @param {number} y - The y-coordinate at which to draw the default UI
 * @returns {void} - Nothing
 */
function ItemColorDrawDefault(x, y) {
	if (!ItemColorState || !ItemColorItem || !ItemColorLayerNames) return;
	const colorPickerButtonWidth = ItemColorConfig.colorPickerButtonWidth;
	const buttonSpacing = ItemColorConfig.buttonSpacing;
	const colorDisplayWidth = ItemColorConfig.colorDisplayWidth;
	const buttonHeight = ItemColorConfig.buttonSize;
	const colorPickerButtonX = ItemColorState.colorPickerButtonX;
	const colorDisplayButtonX = ItemColorState.colorDisplayButtonX;
	const groupButtonWidth = ItemColorState.groupButtonWidth;
	const pageStart = ItemColorPage * ItemColorState.pageSize;
	const colorGroups = ItemColorState.colorGroups.slice(pageStart, pageStart + ItemColorState.pageSize);
	const colors = ItemColorState.colors;

	colorGroups.forEach((colorGroup, i) => {
		const groupY = y + (i * (buttonHeight + buttonSpacing));
		const asset = /** @type {Item} */ (ItemColorItem).Asset;
		const layerNames = /** @type {TextCache} */ (ItemColorLayerNames);
		const groupNames = /** @type {TextCache} */ (ItemColorGroupNames);
		let groupName, buttonText, buttonColor;
		let isBackNextButton = false;
		if (colorGroup.name === null) {
			groupName = ItemColorText.get("WholeItem");
			buttonText = ItemColorGetColorButtonText(colors);
			buttonColor = buttonText.startsWith("#") ? buttonText : "#fff";
		} else if (colorGroup.layers.length === 1) {
			groupName = layerNames.get(asset.DynamicGroupName + asset.Name + colorGroup.name);
			buttonText = colors[colorGroup.layers[0].ColorIndex];
			buttonColor = buttonText.startsWith("#") ? buttonText : "#fff";
		} else {
			let currentColors;
			const layerPage = ItemColorLayerPages[colorGroup.name];
			const colorGroupName = groupNames.get(asset.DynamicGroupName + asset.Name + colorGroup.name);
			if (layerPage === 0) {
				currentColors = colorGroup.layers.map(layer => colors[layer.ColorIndex]);
				groupName = colorGroupName + ": " + ItemColorText.get("All");
			} else {
				const layer = colorGroup.layers[layerPage - 1];
				currentColors = colors[layer.ColorIndex];
				groupName = colorGroupName + ": " + layerNames.get(asset.DynamicGroupName + asset.Name + (layer.Name || ""));
			}
			buttonText = ItemColorGetColorButtonText(currentColors);
			buttonColor = buttonText.startsWith("#") ? buttonText : "#fff";
			isBackNextButton = true;
		}
		if (isBackNextButton) {
			DrawBackNextButton(x, groupY, groupButtonWidth, buttonHeight, groupName, "#fff", undefined, () => "Previous", () => "Next");
		} else {
			DrawButton(x, groupY, groupButtonWidth, buttonHeight, groupName, "#fff");
		}
		DrawButton(colorDisplayButtonX, groupY, colorDisplayWidth, buttonHeight, buttonText, buttonColor);
		DrawButton(colorPickerButtonX, groupY, colorPickerButtonWidth, buttonHeight, "", "#fff", "Icons/Color.png");
	});
}

/**
 * A debounced callback for when the item color picker changes its value. This sets the color for the currently selected set of color
 * indices
 * @deprecated - Superseded by {@link ColorPicker.eventListeners.inputItemColor}
 * @type {(color: BCColor) => void}
 */
const ItemColorOnPickerChange = () => undefined;

/**
 * Click handler for the item color UI according to its current state
 * @param {Character} c - The character being colored
 * @param {AssetGroupName} group - The name of the item group being colored
 * @param {number} x - The x-coordinate at which the UI was drawn
 * @param {number} y - The y-coordinate at which the UI was drawn
 * @param {number} width - The width with which the UI was drawn
 * @param {number} height - The height with which the UI was drawn
 * @returns {void} - Nothing
 */
function ItemColorClick(c, group, x, y, width, height) {
	const item = InventoryGet(c, group);
	if (!item || !ItemColorState || ItemColorCurrentMode === ItemColorMode.COLOR_PICKER) {
		return;
	}

	const headerButtonSize = ItemColorConfig.headerButtonSize;

	if (MouseIn(ItemColorState.cancelButtonX, y, headerButtonSize, headerButtonSize)) {
		return ItemColorExitClick();
	}

	if (MouseIn(ItemColorState.saveButtonX, y, headerButtonSize, headerButtonSize)) {
		return ItemColorSaveClick();
	}

	if (MouseIn(ItemColorState.resetButtonX, y, headerButtonSize, headerButtonSize)) {
		ItemColorRevert("initial");
		return;
	}

	if (
		ItemColorCurrentMode === ItemColorMode.DEFAULT &&
		ItemColorState.pageCount > 1 &&
		MouseIn(ItemColorState.paginationButtonX, y, headerButtonSize, headerButtonSize)
	) {
		return ItemColorPaginationClick();
	}

	const shape = /** @type {const} */([x, y, width + 25, height]);
	return ItemColorClickDefault(x, ItemColorState.contentY, width, shape);
}

/**
 * Click handler for the item color UI when it's in default mode
 * @param {number} x - The x-coordinate at which the default UI was drawn
 * @param {number} y - The y-coordinate at which the default UI was drawn
 * @param {number} width - The width with which the default UI was drawn
 * @param {Readonly<RectTuple>} shape - The shape of the color picker
 * @returns {void} - Nothing
 */
function ItemColorClickDefault(x, y, width, shape) {
	if (!ItemColorState) return;
	const pageStart = ItemColorPage * ItemColorState.pageSize;
	const colorGroups = ItemColorState.colorGroups.slice(pageStart, pageStart + ItemColorState.pageSize);
	const colorPickerButtonWidth = ItemColorConfig.colorPickerButtonWidth;
	const colorDisplayWidth = ItemColorConfig.colorDisplayWidth;
	const colorPickerButtonX = ItemColorState.colorPickerButtonX;
	const colorDisplayButtonX = ItemColorState.colorDisplayButtonX;
	const groupButtonWidth = ItemColorState.groupButtonWidth;
	const buttonHeight = ItemColorConfig.buttonSize;
	const rowHeight = buttonHeight + ItemColorConfig.buttonSpacing;
	const clickZoneHeight = colorGroups.length * (rowHeight);

	if (!MouseIn(x, y, width, clickZoneHeight)) {
		return;
	}

	colorGroups.some((colorGroup, i) => {
		if (MouseYIn(y + i * rowHeight, buttonHeight)) {
			if (MouseXIn(colorPickerButtonX, colorPickerButtonWidth)) {
				// Color picker button
				CommonPromiseCatch(ItemColorOpenPicker(colorGroup, { shape }));
			} else if (MouseXIn(colorDisplayButtonX, colorDisplayWidth)) {
				// Cycle through the color schema
				ItemColorNextColor(colorGroup);
			} else if (colorGroup.layers.length > 1) {
				if (MouseXIn(x, groupButtonWidth / 2)) {
					// Previous layer button
					ItemColorPreviousLayer(colorGroup);
				} else if (MouseXIn(x + groupButtonWidth / 2, x + groupButtonWidth)) {
					// Next layer button
					ItemColorNextLayer(colorGroup);
				}
			}
			return true;
		}
	});
}

/**
 * Handles pagination clicks on the item color UI
 * @returns {void} - Nothing
 */
function ItemColorPaginationClick() {
	ItemColorPage = (ItemColorPage + 1) % (ItemColorState?.pageCount ?? 1);
}

/**
 *  Handles exit button clicks on the item color UI
 *  @returns {void} - Nothing
 */
function ItemColorExitClick() {
	if (!ItemColorItem) return;
	switch (ItemColorCurrentMode) {
		case ItemColorMode.COLOR_PICKER:
			return ItemColorPickerCancel();
		case ItemColorMode.DEFAULT:
		default:
			if (ItemColorBackup && ItemColorCharacter) {
				Object.assign(ItemColorItem, AppearanceItemParse(ItemColorBackup));
				CharacterLoadCanvas(ItemColorCharacter);
			}
			ItemColorFireExit(false);
	}
}

/**
 * Saves any item color changes and exits the item color screen completely
 * @returns {void} - Nothing
 */
function ItemColorSaveAndExit() {
	ItemColorFireExit(true);
}

/**
 * Discards any item color changes and exits the item color screen completely
 * @returns {void} - Nothing
 */
function ItemColorCancelAndExit() {
	if (ItemColorItem && ItemColorBackup && ItemColorCharacter) {
		Object.assign(ItemColorItem, AppearanceItemParse(ItemColorBackup));
		CharacterLoadCanvas(ItemColorCharacter);
	}
	ItemColorFireExit(false);
}

/**
 * Handles save button clicks on the item color UI
 * @returns {void} - Nothing
 */
function ItemColorSaveClick() {
	switch (ItemColorCurrentMode) {
		case ItemColorMode.COLOR_PICKER:
			return ItemColorCloseColorPicker(true);
		case ItemColorMode.DEFAULT:
		default:
			ItemColorFireExit(true);
	}
}

/**
 * Revert the {@link ItemColorItem} colors and opacity.
 * @param {"initial" | "default" | "intermediateSaved"} type - The type of revertion: the initial state prior to opening the color picker or the assets default
 */
function ItemColorRevert(type) {
	const colorField = /** @type {const} */(`${type}Colors`);
	const opacityField = /** @type {const} */(`${type}Opacity`);
	const C = ItemColorCharacter;
	const state = ItemColorState;
	const item = ItemColorItem;
	if (!state || !item || !ItemColorCharacter) {
		return;
	}
	for (const i of ItemColorPickerIndices) {
		state.colors[i] = state[colorField][i];
		item.Color[i] = state[colorField][i];
	}
	for (const i of ItemColorPickerLayers.keys()) {
		ItemColorState.opacity[i] = ItemColorState[opacityField][i];
		item.Property.Opacity[i] = ItemColorState[opacityField][i];
	}
	CharacterLoadCanvas(C);
}

/**
 * Handles color picker cancellation clicks when the item color UI is in color picker mode
 * @returns {void} - Nothing
 */
function ItemColorPickerCancel() {
	ItemColorRevert("intermediateSaved");
	ItemColorCloseColorPicker(false);
}

/**
 * Takes the item color UI out of color picker mode. If the item being colored only has a single color index, this function calls any
 * registered item color exit handlers
 * @param {boolean} save - Whether or not changes should be saved on exiting color picker mode
 * @returns {void} - Nothing
 */
function ItemColorCloseColorPicker(save) {
	if (!ItemColorState) return;
	if (ItemColorState.simpleMode) {
		ItemColorFireExit(save);
	} else {
		ColorPickerHide();
		ItemColorCurrentMode = ItemColorMode.DEFAULT;
		if (save) {
			ItemColorState.colors.forEach(color => {
				if (CommonIsColor(color)) {
					ItemColorHistory.add(color);
				}
			});
			ItemColorState.intermediateSavedColors = [...ItemColorState.colors];
			ItemColorState.intermediateSavedOpacity = [...ItemColorState.opacity];
		}
	}
}

/**
 * Gets the color indices that belong in the provided color group
 * @param {ColorGroup} colorGroup - The color group to fetch color indices for
 * @returns {number[]} - A list of color indices for any layers within the provided color group
 */
function ItemColorGetColorIndices(colorGroup) {
	if (!ItemColorState) return [];
	if (colorGroup.name === null) {
		return ItemColorState.colors.map((c, i) => i);
	} else if (colorGroup.layers.length === 1) {
		return [colorGroup.layers[0].ColorIndex];
	} else {
		const layerPage = ItemColorLayerPages[colorGroup.name];
		if (layerPage === 0) {
			return colorGroup.layers.map(layer => layer.ColorIndex);
		} else if (layerPage <= colorGroup.layers.length) {
			return [colorGroup.layers[layerPage - 1].ColorIndex];
		}
	}
	return [];
}

/**
 * Toggles the item color UI into color picker mode
 * @param {ColorGroup} colorGroup - The color group that is being colored
 * @param {null | ColorPickerInitOptions} options - Further load options to be passed along to {@link ColorPickerInit}
 * @returns {Promise<HTMLElement>} - The root element of the color picker subscreen
 */
function ItemColorOpenPicker(colorGroup, options=null) {
	if (!ItemColorItem) throw new Error("eh");

	ItemColorCurrentMode = ItemColorMode.COLOR_PICKER;
	ItemColorPickerBackup = AppearanceItemStringify(ItemColorItem);
	ItemColorPickerIndices = ItemColorGetColorIndices(colorGroup);
	const asset = ItemColorItem.Asset;

	const layerPage = ItemColorLayerPages[colorGroup.name ?? 0];
	const protoLayers = colorGroup.name === null ? asset.Layer : (layerPage === 0 ? colorGroup.layers : [colorGroup.layers[layerPage - 1]]);
	const layers = new Set(protoLayers.flatMap(layer => asset.Layer.filter(l => l.ColorIndex === layer.ColorIndex)));
	ItemColorPickerLayers.clear();
	for (const layer of layers) {
		const index = asset.Layer.indexOf(layer);
		if (index !== -1) {
			ItemColorPickerLayers.set(index, layer);
		}
	}

	options ??= {};
	if (options.heading == null) {
		// Construct a user-facing name of what exactly is being colored
		let nameList = [asset.Description];
		getName: if (colorGroup.name != null) {
			if (colorGroup.layers.length !== 1) {
				nameList.push(ItemColorGroupNames.get(`${asset.DynamicGroupName}${asset.Name}${colorGroup.name}`));
			} else {
				// We're not dealing with a color group here; abort
				nameList.push(ItemColorLayerNames.get(`${asset.DynamicGroupName}${asset.Name}${colorGroup.name}`));
				break getName;
			}
			if (layerPage !== 0) {
				// Only add the layer name if we're not in the color group's "All" category
				const layer = colorGroup.layers[layerPage - 1];
				nameList.push(ItemColorLayerNames.get(`${asset.DynamicGroupName}${asset.Name}${layer.Name ?? ""}`));
			}
		}

		options.heading = TextSubstitute(
			"Heading",
			{ "{item}": ElementCreate({ tag: "q", children: [nameList.join("/")] }) },
			{ textCache: ItemColorText }
		);
	}
	options.onExit ??= (_, save) => ItemColorCloseColorPicker(save);
	return ColorPickerInit(options);
}

/**
 * Cycles a color group's color to the next color in the asset group's color schema, or to "Default" if the color group is not currently
 * colored with a single color from the color schema
 * @param {ColorGroup} colorGroup - The color group that is being colored
 * @returns {void} - Nothing
 */
function ItemColorNextColor(colorGroup) {
	if (!ItemColorState || !ItemColorItem || !ItemColorCharacter) return;
	const colorIndicesToSet = ItemColorGetColorIndices(colorGroup);
	const groupColors = ItemColorState.colors.filter((c, i) => colorIndicesToSet.includes(i));
	const defaultGroupColors = ItemColorState.defaultColors.filter((c, i) => colorIndicesToSet.includes(i));
	const colorTextKey = ItemColorGetColorButtonTextKey(groupColors);
	const defaultColorTextKey = ItemColorGetColorButtonTextKey(defaultGroupColors);
	const schema = ItemColorItem.Asset.Group.ColorSchema;
	const nextIndex = (schema.indexOf(colorTextKey === defaultColorTextKey ? "Default" : colorTextKey) + 1) % schema.length;
	const nextColor = schema[nextIndex];
	for (const i of colorIndicesToSet) {
		ItemColorItem.Color[i] = nextColor === "Default" ? ItemColorState.defaultColors[i] : nextColor;
		ItemColorState.colors[i] = nextColor === "Default" ? ItemColorState.defaultColors[i] : nextColor;
	}
	CharacterLoadCanvas(ItemColorCharacter);
}

/**
 * Switches the item color UI to the next layer within the provided color group
 * @param {ColorGroup} colorGroup - The color group whose layers to cycle
 * @returns {void} - Nothing
 */
function ItemColorNextLayer(colorGroup) {
	if (colorGroup.name === null) return;
	const currentPage = ItemColorLayerPages[colorGroup.name];
	ItemColorLayerPages[colorGroup.name] = (currentPage + 1) % (colorGroup.layers.length + 1);
}

/**
 * Switches the item color UI to the previous layer within the provided color group
 * @param {ColorGroup} colorGroup - The color group whose layers to cycle
 * @returns {void} - Nothing
 */
function ItemColorPreviousLayer(colorGroup) {
	if (colorGroup.name === null) return;
	const currentPage = ItemColorLayerPages[colorGroup.name];
	const totalPages = colorGroup.layers.length + 1;
	ItemColorLayerPages[colorGroup.name] = (currentPage + totalPages - 1) % totalPages;
}

/**
 * @param {Item} item
 * @param {readonly AssetLayer[]} colorableLayers
 * @returns {ColorGroup[]}
 */
function ItemColorGetGroups(item, colorableLayers) {
	const groupMap = colorableLayers.reduce((groupLookup, layer) => {
		const groupKey = layer.ColorGroup || layer.Name || "";
		(groupLookup[groupKey] || (groupLookup[groupKey] = [])).push(layer);
		return groupLookup;
	}, /** @type {Record<String, AssetLayer[]>} */({}));

	const colorGroups = Object.keys(groupMap)
		.map(key => {
			ItemColorLayerPages[key] = ItemColorLayerPages[key] || 0;
			return /** @type {ColorGroup} */ ({
				name: key,
				layers: groupMap[key],
				colorIndex: groupMap[key].reduce((min, layer) => Math.min(min, layer.ColorIndex), Infinity),
			});
		})
		.sort((g1, g2) => g1.colorIndex - g2.colorIndex);
	colorGroups.unshift({ name: null, layers: [], colorIndex: -1 });
	return colorGroups;
}

/**
 * Builds the item color UI's current state based on the provided character, item and position parameters. This only rebuilds the state if
 * needed.
 * @param {Character} c - The character being colored
 * @param {Item} item - The item being colored
 * @param {number} x - The x-coordinate at which to draw the UI
 * @param {number} y - The y-coordinate at which to draw the UI
 * @param {number} width - The width the UI should be drawn at
 * @param {number} height - The height the UI should be drawn at
 * @returns {void} - Nothing
 */
function ItemColorStateBuild(c, item, x, y, width, height) {
	ItemColorCharacter = c;
	ItemColorItem = Object.assign(item, { Color: ItemColorSanitizeColor(item), Property: ItemColorSanitizeProperty(item) });
	const itemKey = AppearanceItemStringify({ item: ItemColorItem, x, y, width, height });
	if (!item || (ItemColorState && ItemColorStateKey === itemKey)) {
		return;
	}

	ItemColorStateKey = itemKey;
	const colorableLayers = ItemColorGetColorableLayers(item);
	const colorGroups = ItemColorGetGroups(item, colorableLayers);
	const simpleMode = colorableLayers.length === 1;
	ItemColorCurrentMode = simpleMode ? ItemColorMode.COLOR_PICKER : ItemColorMode.DEFAULT;

	const colorPickerButtonWidth = ItemColorConfig.colorPickerButtonWidth;
	const buttonSpacing = ItemColorConfig.buttonSpacing;
	const colorDisplayWidth = ItemColorConfig.colorDisplayWidth;
	const buttonHeight = ItemColorConfig.buttonSize;
	const headerButtonSize = ItemColorConfig.headerButtonSize;

	const drawExport = navigator?.clipboard?.writeText;
	const drawImport = navigator?.clipboard?.readText;
	const paginationButtonX = x + width - 4 * headerButtonSize - 3 * buttonSpacing;
	const resetButtonX = x + width - 3 * headerButtonSize - 2 * buttonSpacing;
	const cancelButtonX = x + width - 2 * headerButtonSize - buttonSpacing;
	const saveButtonX = x + width - headerButtonSize;
	const colorPickerButtonX = x + width - colorPickerButtonWidth;
	const colorDisplayButtonX = colorPickerButtonX - buttonSpacing - colorDisplayWidth;
	const contentY = y + ItemColorConfig.headerButtonSize + buttonSpacing;
	const groupButtonWidth = colorDisplayButtonX - buttonSpacing - x;
	const pageSize = Math.floor((height - headerButtonSize - buttonSpacing) / (buttonHeight + buttonSpacing));
	const pageCount = Math.ceil(colorGroups.length / pageSize);
	const editOpacity = item.Asset.EditOpacity;

	ItemColorState = {
		colorGroups,
		colors: ItemColorItem.Color,
		initialColors: [...ItemColorItem.Color],
		intermediateSavedColors: [...ItemColorItem.Color],
		defaultColors: ItemColorItem.Asset.DefaultColor,
		opacity: ItemColorItem.Property.Opacity,
		initialOpacity: [...ItemColorItem.Property.Opacity],
		intermediateSavedOpacity: [...ItemColorItem.Property.Opacity],
		defaultOpacity: ItemColorItem.Asset.Layer.map(l => l.Opacity),
		simpleMode,
		paginationButtonX,
		cancelButtonX,
		saveButtonX,
		resetButtonX,
		colorPickerButtonX,
		colorDisplayButtonX,
		contentY,
		groupButtonWidth,
		pageSize,
		pageCount,
		editOpacity,
		drawImport,
		drawExport,
	};

	ItemColorPickerIndices = ItemColorGetColorIndices({ name: null, layers: [], colorIndex: -1 });
	ItemColorPickerLayers.clear();
	for (const [index, layer] of ItemColorItem.Asset.Layer.entries()) {
		ItemColorPickerLayers.set(index, layer);
	}

	// Add all currently active colors within the item
	/** @type {ItemColorStateType} */ (ItemColorState).initialColors.forEach(color => {
		if (CommonIsColor(color)) {
			ItemColorHistory.add(color);
		}
	});

	// Add all explicitly saved colors; ignore the defaults
	const defaultSavedColors = GetDefaultSavedColors().map(hsv => ColorPickerHSVToCSS(hsv));
	for (const [i, rgbDefault] of defaultSavedColors.entries()) {
		const hsvSaved = Player.SavedColors[i];
		const rgbSaved = hsvSaved == null ? null : ColorPickerHSVToCSS(hsvSaved);
		if (rgbSaved && rgbSaved !== rgbDefault) {
			ItemColorHistory.add(rgbSaved);
		}
	}
}

/**
 * Returns layers of the asset which can be given distinct colors
 * @param {Item} item - The item to be colored
 * @returns {AssetLayer[]} - The colourable layers
 */
function ItemColorGetColorableLayers(item) {
	return item.Asset.Layer.filter(layer => !layer.CopyLayerColor && layer.AllowColorize && !layer.HideColoring);
}

/**
 * Returns whether or not the item can have only a single color or multiple colors
 * @param {Item} item - The item to be colored
 * @returns {boolean} - Whether the item only allows one color
 */
function ItemColorIsSimple(item) {
	return ItemColorGetColorableLayers(item).length === 1;
}

/**
 * Fetches the color button text key for the provided item color. If the item's color is already a string, the color string is returned.
 * Otherwise, returns "Many" or "Default" as appropriate.
 * @param {"None" | BCColor | readonly BCColor[]} color - The item color
 * @returns {"Many" | BCColor} - The appropriate color button key for the provided item color(s)
 */
function ItemColorGetColorButtonTextKey(color) {
	if (CommonIsArray(color)) {
		const initialColor = color[0] ?? "Default";
		// FIXME: Add an explicit `typeof` check for when sub-arrays have somehow made their way into the color array
		// xref https://gitgud.io/zorgjeanbe/Bondage-College/-/work_items/19
		return color.some(c => typeof c !== "string" || c !== initialColor) ? "Many" : initialColor;
	} else if (typeof color !== "string" || color === "None") {
		return "Default";
	}
	return color;
}

/**
 * Fetches the color button text for the provided item color. If the item's color is already a string, the color string is returned.
 * Otherwise, returns "Many" or "Default" as appropriate.
 * @param {BCColor | readonly BCColor[]} color - The item color
 * @returns {string} - The appropriate color button text for the provided item color(s), translated to the current game language
 */
function ItemColorGetColorButtonText(color) {
	const textKey = ItemColorGetColorButtonTextKey(color);
	switch (textKey) {
		case "Many":
		case "Default":
			return ItemColorText.get(textKey);
		default:
			return textKey;
	}
}

/**
 * Registers an exit callback to the item color UI which will be called when the UI is exited.
 * @param {ItemColorExitListener} callback - The exit listener to register
 * @returns {void} - Nothing
 */
function ItemColorOnExit(callback) {
	ItemColorExitListeners.push(callback);
}

/**
 * Handles exiting the item color UI. Appropriate text caches are dropped, and any registered exit listeners are called.
 * @param {boolean} save - Whether or not the appearance changes applied by the item color UI should be saved
 * @returns {void} - Nothing
 */
function ItemColorFireExit(save) {
	/** @type {Item} */
	const item = ItemColorItem;
	const state = ItemColorState;
	if (!state || !item) return;
	const colorState = {
		colors: [...state.colors],
		opacity: [...state.opacity],
		initialColors: [...state.initialColors],
		initialOpacity: [...state.initialOpacity],
		defaultColors: [...state.defaultColors],
		defaultOpacity: [...state.defaultOpacity],
		editOpacity: state.editOpacity,
	};
	ItemColorExitListeners.forEach(listener => listener(colorState, save, null));

	// Minify the opacity property if possible
	if (CommonArraysEqual(colorState.opacity, colorState.defaultOpacity)) {
		delete item.Property?.Opacity;
	} else if (colorState.opacity.every(opacity => opacity === colorState.opacity[0])) {
		item.Property ??= {};
		item.Property.Opacity = colorState.opacity[0];
	}

	ColorPickerExit(true);
	ItemColorReset();
}

/**
 * Resets color UI related global variables back to their default states.
 * @returns {void} - Nothing
 */
function ItemColorReset() {
	// @ts-ignore Strict-TS: screen lifetime
	ItemColorCharacter = null;
	// @ts-ignore Strict-TS: screen lifetime
	ItemColorItem = null;
	ItemColorCurrentMode = ItemColorMode.DEFAULT;
	// @ts-ignore Strict-TS: screen lifetime
	ItemColorStateKey = null;
	// @ts-ignore Strict-TS: screen lifetime
	ItemColorState = null;
	ItemColorPage = 0;
	ItemColorLayerPages = {};
	ItemColorPickerBackup = null;
	ItemColorPickerIndices = [];
	ItemColorPickerLayers.clear();
	ItemColorHistory.clear();
	ItemColorExitListeners = [];
	// @ts-ignore Strict-TS: screen lifetime
	ItemColorBackup = null;
	// @ts-ignore Strict-TS: screen lifetime
	ItemColorLayerNames = null;
	// @ts-ignore Strict-TS: screen lifetime
	ItemColorGroupNames = null;
}

/**
 * Check whether the current colors of the item match the item's default colors
 * @param {Item} Item - The appearance item to check
 * @returns {boolean} - Whether the item has default color(s)
 */
function ItemColorIsDefault(Item) {
	/** @type {readonly BCColor[]} */
	let colorArray;
	if (typeof Item.Color === "string") {
		colorArray = Array(Item.Asset.ColorableLayerCount).fill(Item.Color);
	} else if (CommonIsArray(Item.Color)) {
		colorArray = Item.Color;
	} else {
		return Item.Color == null;
	}
	return Item.Asset.DefaultColor.every((defaultColor, i) => defaultColor === colorArray[i]);
}
