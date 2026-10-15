"use strict";

/** @type {readonly AssetName[] | null} */
let InventoryItemDevicesBarStoolDecalNames = null;

/**
 * The top of the seat, an oval seen from above, per style (`s0` modern, `s1` dirty, `s2` wooden), relative to the `Decal` layer
 * @type {readonly { centerY: number, width: number, height: number }[]}
 */
const InventoryItemDevicesBarStoolSeatTop = [
	{ centerY: 37, width: 139, height: 72 },
	{ centerY: 36, width: 145, height: 72 },
	{ centerY: 41, width: 146, height: 81 },
];

/** The horizontal center of the stool, relative to the `Decal` layer */
const InventoryItemDevicesBarStoolCenterX = 250;

/** The size of the stool's image layers; the decal is drawn on a canvas of that size so it transforms like them */
const InventoryItemDevicesBarStoolLayerSize = /** @type {const} */ ([500, 445]);

/**
 * The decals that can go on the seat: every single-image asset of the `Decals` group, so new decals show up
 * on the stool without any change here. Option `d0` is no decal, option `d<n>` the n-th decal of this list.
 * Only available once the `Decals` group has loaded, which is before the stool's own group.
 * @returns {readonly AssetName[]}
 */
function InventoryItemDevicesBarStoolDecals() {
	if (!InventoryItemDevicesBarStoolDecalNames) {
		const group = AssetGroupGet("Female3DCG", "Decals");
		if (!group) throw new Error("BarStool: the Decals group has not loaded yet");
		InventoryItemDevicesBarStoolDecalNames = group.Asset
			.filter(asset => asset.Layer.length === 1 && !asset.Layer[0].Name && !asset.Extended)
			.map(asset => asset.Name);
	}
	return InventoryItemDevicesBarStoolDecalNames;
}

/**
 * The stool's `Decal` module. Its options are only read when the stool loads (see {@link AssetBuildExtended}),
 * after the decals they are made from.
 * @type {ModularItemModuleConfig}
 */
const InventoryItemDevicesBarStoolDecalModule = {
	Name: "Decal",
	Key: "d",
	get Options() {
		return [{}, ...InventoryItemDevicesBarStoolDecals().map(() => ({}))];
	},
	get DrawData() {
		return {
			elementData: [
				{ imagePath: "Screens/Inventory/ItemHandheld/Plushies/None.png" },
				...InventoryItemDevicesBarStoolDecals().map((name) => ({
					imagePath: `Assets/Female3DCG/Decals/Preview/${name}.png`,
					label: () => AssetGet("Female3DCG", "Decals", name)?.Description ?? name,
				})),
			],
		};
	},
};

/**
 * Gets the decal on a bar stool
 * @param {Item} item - The bar stool
 * @returns {Asset | null} - The decal, from the `Decals` group
 */
function InventoryItemDevicesBarStoolGetDecal(item) {
	const name = InventoryItemDevicesBarStoolDecals()[(item.Property?.TypeRecord?.d ?? 0) - 1];
	return name ? AssetGet("Female3DCG", "Decals", name) : null;
}

/**
 * Gets the image of a decal
 * @param {Asset} decal
 * @returns {string}
 */
function InventoryItemDevicesBarStoolDecalImage(decal) {
	return `Assets/Female3DCG/Decals/${decal.Name}.png`;
}

/**
 * Draws the decal on the top of the seat
 * @type {ExtendedItemScriptHookCallbacks.AfterDraw<ModularItemData>}
 */
function AssetsItemDevicesBarStoolAfterDrawHook(data, originalFunction, { C, A, CA, X, Y, L, Property, Color, drawCanvas, drawCanvasBlink, AlphaMasks }) {
	if (L !== "Decal") return;

	const decal = InventoryItemDevicesBarStoolGetDecal(CA);
	const image = decal ? DrawGetImage(InventoryItemDevicesBarStoolDecalImage(decal)) : undefined;
	if (!decal || !image) return;

	// The decal lies flat on the seat: fit it in the oval, then flatten it like the oval
	const seatTop = InventoryItemDevicesBarStoolSeatTop[Property.TypeRecord?.s ?? 0];
	const flatten = seatTop.height / seatTop.width;
	const scale = 0.85 * Math.min(seatTop.width / image.width, seatTop.height / (image.height * flatten));
	const width = Math.round(image.width * scale);
	const height = Math.round(image.height * scale * flatten);

	const tempCanvas = AnimationGenerateTempCanvas(C, A, ...InventoryItemDevicesBarStoolLayerSize);
	const ctx = tempCanvas.getContext("2d");
	if (!ctx) return;
	ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
	DrawImageEx(image, ctx, InventoryItemDevicesBarStoolCenterX - width / 2, seatTop.centerY - height / 2, {
		Width: width,
		Height: height,
		HexColor: Color?.[0] === "#" ? /** @type {HexColor} */ (Color) : undefined,
		FullAlpha: decal.Layer[0]?.FullAlpha ?? true,
	});

	// The same size as the stool's image layers, so it moves, turns and scales with them
	drawCanvas(tempCanvas, X, Y, AlphaMasks);
	drawCanvasBlink(tempCanvas, X, Y, AlphaMasks);
}

/**
 * @typedef {{ DrawnImage?: string | null } & AnimationPersistentData} BarStoolPersistentData
 */

/**
 * Redraws the character once the decal's image has loaded
 * @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ModularItemData, BarStoolPersistentData>}
 */
function AssetsItemDevicesBarStoolScriptDrawHook(data, originalFunction, { C, Item, PersistentData }) {
	const decal = InventoryItemDevicesBarStoolGetDecal(Item);
	const url = decal ? InventoryItemDevicesBarStoolDecalImage(decal) : null;
	const persistentData = PersistentData();
	if (persistentData.DrawnImage === url) return;
	if (url && !DrawGetImage(url)) {
		AnimationRequestRefreshRate(C, 100);
		return;
	}
	persistentData.DrawnImage = url;
	AnimationRequestDraw(C);
}
