"use strict";

/**
 * Prepares the character's drawing canvases before drawing the character's appearance.
 * @param {Character} C - The character to prepare
 * @returns {void} - Nothing
 */
function CommonDrawCanvasPrepare(C) {
	if (C.Canvas == null) {
		C.Canvas = document.createElement("canvas");
		C.Canvas.width = 500;
		C.Canvas.height = CanvasDrawHeight;
	} else C.Canvas.getContext("2d").clearRect(0, 0, 500, CanvasDrawHeight);
	if (C.CanvasBlink == null) {
		C.CanvasBlink = document.createElement("canvas");
		C.CanvasBlink.width = 500;
		C.CanvasBlink.height = CanvasDrawHeight;
	} else C.CanvasBlink.getContext("2d").clearRect(0, 0, 500, CanvasDrawHeight);

	C.MustDraw = true;
}

/**
 * Draws the given character's appearance using the provided drawing callbacks
 * @param {Character} C - The character whose appearance to draw
 * @param {CommonDrawCallbacks} callbacks - The drawing callbacks to be used
 */
function CommonDrawAppearanceBuild(C, {
	clearRect,
	clearRectBlink,
	drawCanvas,
	drawCanvasBlink,
	drawImage,
	drawImageBlink,
	drawImageColorize,
	drawImageColorizeBlink,
}) {
	// Loop through all layers in the character appearance
	for (const layer of C.AppearanceLayers) {
		const asset = layer.Asset;
		const group = asset.Group;
		let item = C.Appearance.find(i => i.Asset === asset);
		let groupName = asset.DynamicGroupName;

		// If the layer belongs to a specific parent group, grab the group's current asset name to use it as a suffix
		let parentAssetName = "";
		if (layer.ParentGroupName) {
			const parentItem = C.Appearance.find(Item => Item.Asset.Group.Name === layer.ParentGroupName);
			if (parentItem) parentAssetName = parentItem.Asset.Name;
		}

		// If there's a pose style we must add (items take priority over groups, layers may override completely)
		let pose = CommonDrawResolveAssetPose(C, layer);

		// Check if we need to draw a different expression (for facial features)
		const currentExpression = CommonDrawResolveLayerExpression(C, item, layer);
		const expressionSegment = currentExpression ? currentExpression + "/" : "";
		const blinkExpressionSegment = (asset.OverrideBlinking ? !group.DrawingBlink : group.DrawingBlink) ? "Closed/" : expressionSegment;

		// Find the X and Y position to draw on
		let { X, Y, fixedYOffset } = CommonDrawComputeDrawingCoordinates(C, asset, layer, groupName);

		CommonDrawApplyLayerAlphaMasks(C, layer, fixedYOffset, clearRect, clearRectBlink);

		// Check if we need to draw a different variation (from type property)
		const typeRecord = (item.Property && item.Property.TypeRecord) || {};
		let layerSegment = "";
		let layerType = "";
		if (layer.CreateLayerTypes.length > 0) {
			layerType = layer.CreateLayerTypes.map(k => `${k}${typeRecord[k] || 0}`).join("");
		}
		if (layer.Name) layerSegment = layer.Name;

		let opacity = (item.Property && typeof item.Property.Opacity === "number") ? item.Property.Opacity : layer.Opacity;
		let blendingMode = layer.BlendingMode;
		opacity = Math.min(layer.MaxOpacity, Math.max(layer.MinOpacity, opacity));
		/** @type {RectTuple[]} */
		let masks = layer.GroupAlpha
			.filter(({ Pose: P }) => !P || !!CommonDrawFindPose(C, P))
			.reduce((Acc, { Masks }) => {
				Acc.push(...Masks);
				return Acc;
			}, []);

		// Resolve the layer color; handles color inheritance and schema validation
		let layerColor = CommonDrawResolveLayerColor(C, item, layer, groupName);

		// Before drawing hook, receives all processed data. Any of them can be overriden if returned inside an object.
		// CAREFUL! The dynamic function should not contain heavy computations, and should not have any side effects.
		// Watch out for object references.
		if (asset.DynamicBeforeDraw && (!Player.GhostList || Player.GhostList.indexOf(C.MemberNumber) == -1)) {
			/** @type {DynamicDrawingData} */
			const DrawingData = {
				C, X, Y, CA: item, GroupName: groupName, Color: layerColor, Opacity: opacity, Property: item.Property, A: asset, G: parentAssetName, AG: group, L: layerSegment, Pose: pose, LayerType: layerType, BlinkExpression: blinkExpressionSegment,
				drawCanvas, drawCanvasBlink, AlphaMasks: masks,
				PersistentData: () => AnimationPersistentDataGet(C, asset),
			};
			/** @type {DynamicBeforeDrawOverrides} */
			const OverriddenData = CommonCallFunctionByNameWarn(`Assets${asset.Group.Name}${asset.Name}BeforeDraw`, DrawingData);
			if (typeof OverriddenData === "object") {
				for (const key in OverriddenData) {
					switch (key) {
						case "Property": {
							item.Property = OverriddenData[key];
							break;
						}
						case "CA": {
							item = OverriddenData[key];
							break;
						}
						case "GroupName": {
							groupName = OverriddenData[key];
							break;
						}
						case "Color": {
							layerColor = OverriddenData[key];
							break;
						}
						case "Opacity": {
							opacity = OverriddenData[key];
							break;
						}
						case "X": {
							X = OverriddenData[key];
							break;
						}
						case "Y": {
							Y = OverriddenData[key];
							break;
						}
						case "LayerType": {
							layerType = OverriddenData[key];
							break;
						}
						case "L": {
							layerSegment = OverriddenData[key];
							break;
						}
						case "AlphaMasks": {
							masks = OverriddenData[key];
							break;
						}
						case "Pose": {
							pose = OverriddenData[key];
							break;
						}
					}
				}
			}
		}

		// Safeguard against a null pose
		if (typeof pose !== "string") pose = /** @type {AssetPoseName} */("");

		// Redo some checks in case BeforeDraw overrode the color back to default.
		if (layerColor === "Default" && asset.DefaultColor) {
			layerColor = CommonDrawResolveLayerColor(C, item, layer, groupName, layerColor);
		}

		masks = masks.map(([x, y, w, h]) => [x, y + CanvasUpperOverflow + fixedYOffset, w, h]);

		let mirrored = false;
		let inverted = false;
		if (asset.FixedPosition && C.IsInverted()) {
			mirrored = !mirrored;
			inverted = !inverted;
		}

		const itemIsLocked = !!(item.Property && item.Property.LockedBy);

		// Check the current pose against the assets' supported pose mapping
		/** @type {string} */
		let poseSegment = layer.PoseMapping[pose];
		switch (poseSegment) {
			case PoseType.HIDE:
			case PoseType.DEFAULT:
			case undefined:
				poseSegment = "";
				break;
			default:
				poseSegment += "/";
				break;
		}

		if (layer.HasImage && (!layer.LockLayer || itemIsLocked)) {
			// Handle the layer's color suffix mapping, transforming it back into a named color so we still use the correct base
			/** @type {string | undefined} */
			let colorSuffix = undefined;
			if (layer.ColorSuffix && layerColor) {
				colorSuffix = (layerColor[0] === "#") ? layer.ColorSuffix.HEX_COLOR : layer.ColorSuffix[layerColor];
				if (colorSuffix && colorSuffix[0] === "#") {
					layerColor = colorSuffix;
					colorSuffix = undefined;
				}
			}

			const baseURL = `Assets/${group.Family}/${groupName}/${poseSegment}${expressionSegment}`;
			const baseURLBlink = `Assets/${group.Family}/${groupName}/${poseSegment}${blinkExpressionSegment}`;

			const shouldColorize = layer.AllowColorize && layerColor && layerColor[0] === "#";
			let colorSegment = "";

			if (shouldColorize) {
				// The layer is colorizable and has an explicit hexcode, it needs to be drawn colorized
				colorSegment = (colorSuffix != undefined) ? colorSuffix : "";
			} else {
				// The layer isn't colorizable, so validate that the layer color is a named color
				// If a color suffix is specified and isn't Default, it'll completely override the final color
				if (layerColor != null && layerColor !== "Default" && layerColor[0] !== "#") {
					colorSegment = layerColor;
				}
				if (colorSuffix) {
					colorSegment = colorSuffix !== "Default" ? colorSuffix : "";
				}
			}

			const urlParts = [asset.Name, parentAssetName, layerType, colorSegment, layerSegment].filter(c => c);
			const layerURL = urlParts.join("_") + ".png";
			if (shouldColorize) {
				drawImageColorize(
					baseURL + layerURL,
					X, Y,
					{ HexColor: layerColor, FullAlpha: asset.FullAlpha, AlphaMasks: masks, Alpha: opacity, Invert: inverted, Mirror: mirrored, BlendingMode: blendingMode }
				);
				drawImageColorizeBlink(
					baseURLBlink + layerURL,
					X, Y,
					{ HexColor: layerColor, FullAlpha: asset.FullAlpha, AlphaMasks: masks, Alpha: opacity, Invert: inverted, Mirror: mirrored, BlendingMode: blendingMode }
				);
			} else {
				drawImage(
					baseURL + layerURL,
					X, Y,
					{ AlphaMasks: masks, Alpha: opacity, Invert: inverted, Mirror: mirrored, BlendingMode: blendingMode }
				);
				drawImageBlink(
					baseURLBlink + layerURL,
					X, Y,
					{ AlphaMasks: masks, Alpha: opacity, Invert: inverted, Mirror: mirrored, BlendingMode: blendingMode }
				);
			}
		}

		// After drawing hook, receives all processed data.
		// CAREFUL! The dynamic function should not contain heavy computations, and should not have any side effects.
		// Watch out for object references.
		if (asset.DynamicAfterDraw && (!Player.GhostList || Player.GhostList.indexOf(C.MemberNumber) == -1)) {
			/** @type {DynamicDrawingData} */
			const DrawingData = {
				C, X, Y, CA: item, GroupName: groupName, Property: item.Property, Color: layerColor, Opacity: opacity, A: asset, G: parentAssetName, AG: group, L: layerSegment, Pose: pose, LayerType: layerType, BlinkExpression: blinkExpressionSegment, drawCanvas, drawCanvasBlink, AlphaMasks: masks,
				PersistentData: () => AnimationPersistentDataGet(C, asset),
			};
			CommonCallFunctionByNameWarn(`Assets${asset.Group.Name}${asset.Name}AfterDraw`, DrawingData);
		}
	}
}

/**
 * Get the layer's resolved & validated current expression.
 *
 * Resolution handles mirroring from another group, and validation checks its value against the asset definition.
 *
 * @param {Character} C
 * @param {Item} item
 * @param {AssetLayer} layer
 */
function CommonDrawResolveLayerExpression(C, item, layer) {
	// Check if we need to draw a different expression (for facial features)
	let currentExpression = InventoryGetItemProperty(item, "Expression");
	if (!currentExpression && layer.MirrorExpression) {
		const MirroredItem = InventoryGet(C, layer.MirrorExpression);
		const expr = InventoryGetItemProperty(MirroredItem, "Expression");
		if (CharacterIsExpressionAllowed(C, item, expr)) {
			currentExpression = expr;
		}
	}
	return currentExpression;
}

/**
 * Get the X and Y drawing coordinates for a layer
 *
 * @param {Character} C
 * @param {Asset} asset
 * @param {AssetLayer} layer
 * @param {AssetGroupName} groupName
 */
function CommonDrawComputeDrawingCoordinates(C, asset, layer, groupName) {
	const poseX = C.DrawPose.find(p => layer.DrawingLeft[p] != null);
	const poseY = C.DrawPose.find(p => layer.DrawingTop[p] != null);
	let X = poseX === undefined ? layer.DrawingLeft[PoseType.DEFAULT] : layer.DrawingLeft[poseX];
	let Y = poseY === undefined ? layer.DrawingTop[PoseType.DEFAULT] : layer.DrawingTop[poseY];
	for (const drawPose of C.DrawPose) {
		const PoseDef = PoseRecord[drawPose];
		if (PoseDef && PoseDef.MovePosition) {
			const MovePosition = PoseDef.MovePosition.find(MP => MP.Group === groupName);
			if (MovePosition) {
				X += MovePosition.X;
				Y += MovePosition.Y;
			}
		}
	}

	// Offset Y to counteract height modifiers for fixed-position assets
	let fixedYOffset = 0;
	if (asset.FixedPosition || layer.FixedPosition) {
		if (C.IsInverted()) {
			fixedYOffset = -Y + 1000 - (Y + CharacterAppearanceYOffset(C, C.HeightRatio, true) / C.HeightRatio);
		} else {
			fixedYOffset = C.HeightModifier + 1000 * (1 - C.HeightRatio) * (1 - C.HeightRatioProportion) / C.HeightRatio;
		}
	}
	Y += fixedYOffset;

	// Adjust for the increased canvas size
	Y += CanvasUpperOverflow;

	return { X, Y, fixedYOffset };
}

/**
 * Clears out rects based on the layer's alpha masks
 *
 * @param {Character} C
 * @param {AssetLayer} layer
 * @param {number} fixedYOffset
 * @param {ClearRectCallback} clearRect
 * @param {ClearRectCallback} clearRectBlink
 */
function CommonDrawApplyLayerAlphaMasks(C, layer, fixedYOffset, clearRect, clearRectBlink) {
	for (const AlphaDef of layer.Alpha) {
		// If no groups are defined and the character's pose matches one of the allowed poses (or no poses are defined)
		if ((!AlphaDef.Group || !AlphaDef.Group.length) &&
			(!AlphaDef.Pose || !!CommonDrawFindPose(C, AlphaDef.Pose))) {
			AlphaDef.Masks.forEach(rect => {
				clearRect(rect[0], rect[1] + CanvasUpperOverflow + fixedYOffset, rect[2], rect[3]);
				clearRectBlink(rect[0], rect[1] + CanvasUpperOverflow + fixedYOffset, rect[2], rect[3]);
			});
		}
	}
}

/**
 * Resolve and validates a layer's color, given a character, an item and a layer.
 *
 * This handles grabbing the user-specified color, or the default one, or inherit it from another group, and
 * checks it for validity.
 *
 * @param {Character} C
 * @param {Item} item
 * @param {AssetLayer} layer
 * @param {AssetGroupName} groupName
 * @param {HexColor} [initialColor] Used as the starting value to check that specific color and fully resolve it
 */
function CommonDrawResolveLayerColor(C, item, layer, groupName, initialColor) {
	// Pick the layer's color out of the item's Color property based on the layer's index, or default it to what the group says
	let layerColor = initialColor ?? item.Asset.Group.DefaultColor;
	if (Array.isArray(item.Color)) {
		layerColor = item.Color[layer.ColorIndex];
	} else {
		layerColor = item.Color;
	}

	// Fix to legacy appearance data when Hands could be different to BodyUpper
	if (groupName === "Hands") layerColor = "Default";

	// If the item specifies a default color, use that
	// Used by extended assets to specify a different default color for a layer depending on its item type
	if (layerColor === "Default" && item.Property) {
		layerColor = Array.isArray(item.Property.DefaultColor) ? item.Property.DefaultColor[layer.ColorIndex] ?? "Default" : item.Property.DefaultColor;
	}

	if (!CommonDrawColorValid(layerColor, item.Asset.Group)) {
		layerColor = "Default";
	}

	// Check if we need to copy the color of another asset
	let colorGroup = layerColor == "Default" ? layer.InheritColor : null;
	while (colorGroup != null) {
		const parentItem = InventoryGet(C, colorGroup);
		if (parentItem != null) {
			const parentColor = Array.isArray(parentItem.Color) ? parentItem.Color[0] : parentItem.Color;
			const inheritedColor = parentColor === "Default" && parentItem.Asset.InheritColor;
			if (inheritedColor) {
				colorGroup = inheritedColor;
			} else {
				layerColor = CommonDrawColorValid(parentColor, parentItem.Asset.Group) ? parentColor : "Default";
				colorGroup = null;
			}
		} else {
			colorGroup = null;
		}
	}

	return layerColor;
}

/**
 * Determines whether the provided color is valid
 * @param {string} Color - The color
 * @param {AssetGroup} AssetGroup - The asset group the color is being used fo
 * @returns {boolean} - Whether the color is valid
 */
function CommonDrawColorValid(Color, AssetGroup) {
	if (typeof Color !== "string") {
		return false;
	}

	if (Color.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})/i)) {
		// Hexcode colors are always valid
		return true;
	}

	// Otherwise it's a named color, and must appear in the schema
	return AssetGroup.ColorSchema.includes(Color);
}

/**
 * Finds the correct pose to draw for drawable layer for the provided character from the provided list of allowed poses
 * @param {Character} C - The character to check for poses against
 * @param {Partial<Record<AssetPoseCategory, readonly AssetPoseName[]>>} AllowedPoses - The list of permitted poses for the current layer
 * @return {AssetPoseName | null} - The name of the pose to draw for the layer, or an empty string if no pose should be drawn
 */
function CommonDrawFindPose(C, AllowedPoses) {
	for (const [category, poses] of CommonEntries(AllowedPoses)) {
		const drawPose = C.DrawPoseMapping[category];
		if (poses.includes(drawPose)) {
			return drawPose;
		}
	}
	return null;
}

/**
 * Finds the pose that should be used when a given asset (and optionally layer) is drawn.
 * @param {Character} C - The character whose poses to check
 * @param {AssetLayer} [Layer] - The layer to check (optional)
 * @returns {AssetPoseName | null} - The pose to use when drawing the given asset (or layer)
 */
function CommonDrawResolveAssetPose(C, Layer) {
	const poseEntries = CommonEntries(Layer.PoseMapping);
	const poses = poseEntries.filter(ij => ij[1] !== PoseType.DEFAULT).map(i => i[0]).sort((p1, p2) => {
		const prio1 = PoseCategoryPriority[PoseRecord[p1]?.Category] ?? 0;
		const prio2 = PoseCategoryPriority[PoseRecord[p2]?.Category] ?? 0;
		return prio2 - prio1;
	});

	return CommonDrawFindPose(C, PoseToMapping.Array(poses, "Layer.PoseMapping"));
}
