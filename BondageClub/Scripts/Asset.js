//@ts-check
"use strict";

/** @type {Asset[]} */
var Asset = [];
/** @type {AssetGroup[]} */
var AssetGroup = [];
/** @type {Map<string, Asset>} */
var AssetMap = new Map();
/** @type {Map<AssetGroupName, AssetGroup>} */
var AssetGroupMap = new Map();
/** @type {Pose[]} */
var Pose = [];
/** A record mapping pose names to their respective {@link Pose}. */
const PoseRecord = /** @type {Record<AssetPoseName, Pose>} */({});
/** @type {Map<AssetGroupName, AssetGroup[]>} */
var AssetActivityMirrorGroups = new Map();

/** Special values for {@link AssetDefinition.PoseMapping} for hiding or using pose-agnostic assets. */
const PoseType = /** @type {const} */({
	/**
	 * Ensures that the asset is hidden for a specific pose.
	 * Supercedes the old `HideForPose` property.
	 */
	HIDE: "Hide",
	/**
	 * Ensures that the default (pose-agnostic) asset used for a particular pose.
	 * Supercedes the old `AllowPose` property.
	 */
	DEFAULT: "",
});

/**
 * Adds a new asset group to the main list
 * @param {IAssetFamily} Family
 * @param {AssetGroupDefinition} GroupDef
 * @returns {AssetGroup}
 */
function AssetGroupAdd(Family, GroupDef) {
	const AllowNone = typeof GroupDef.AllowNone === "boolean" ? GroupDef.AllowNone : true;
	/** @type {AssetGroup} */
	var A = {
		Family: Family,
		Name: GroupDef.Group,
		Description: GroupDef.Group,
		Asset: [],
		ParentGroupName: GroupDef.ParentGroup || null,
		Category: (GroupDef.Category == null) ? "Appearance" : GroupDef.Category,
		IsDefault: (GroupDef.Default == null) ? true : GroupDef.Default,
		IsRestraint: (GroupDef.IsRestraint == null) ? false : GroupDef.IsRestraint,
		AllowNone,
		AllowColorize: (GroupDef.AllowColorize == null) ? true : GroupDef.AllowColorize,
		AllowCustomize: (GroupDef.AllowCustomize == null) ? true : GroupDef.AllowCustomize,
		Random: (GroupDef.Random == null) ? true : GroupDef.Random,
		ColorSchema: (GroupDef.Color == null) ? ["Default"] : GroupDef.Color,
		ParentSize: (GroupDef.ParentSize == null) ? "" : GroupDef.ParentSize,
		ParentColor: (GroupDef.ParentColor == null) ? "" : GroupDef.ParentColor,
		Clothing: (GroupDef.Clothing == null) ? false : GroupDef.Clothing,
		Underwear: (GroupDef.Underwear == null) ? false : GroupDef.Underwear,
		BodyCosplay: (GroupDef.BodyCosplay == null) ? false : GroupDef.BodyCosplay,
		Hide: GroupDef.Hide,
		Block: GroupDef.Block,
		Zone: GroupDef.Zone,
		SetPose: GroupDef.SetPose,
		PoseMapping: GroupDef.PoseMapping || {},
		AllowExpression: GroupDef.AllowExpression,
		Effect: Array.isArray(GroupDef.Effect) ? GroupDef.Effect : [],
		MirrorGroup: (GroupDef.MirrorGroup == null) ? "" : GroupDef.MirrorGroup,
		RemoveItemOnRemove: (GroupDef.RemoveItemOnRemove == null) ? [] : GroupDef.RemoveItemOnRemove,
		DrawingPriority: (GroupDef.Priority == null) ? AssetGroup.length : GroupDef.Priority,
		DrawingLeft: (GroupDef.Left == null) ? 0 : GroupDef.Left,
		DrawingTop: (GroupDef.Top == null) ? 0 : GroupDef.Top,
		DrawingFullAlpha: (GroupDef.FullAlpha == null) ? true : GroupDef.FullAlpha,
		DrawingBlink: (GroupDef.Blink == null) ? false : GroupDef.Blink,
		InheritColor: (typeof GroupDef.InheritColor === "string" ? GroupDef.InheritColor : null),
		PreviewZone: GroupDef.PreviewZone,
		DynamicGroupName: GroupDef.DynamicGroupName || GroupDef.Group,
		MirrorActivitiesFrom: GroupDef.MirrorActivitiesFrom || undefined,
		ArousalZone: (typeof GroupDef.ArousalZone === "string" ? GroupDef.ArousalZone : undefined),
		ColorSuffix: GroupDef.ColorSuffix || {},
		ExpressionPrerequisite: GroupDef.ExpressionPrerequisite || [],
		HasPreviewImages: typeof GroupDef.HasPreviewImages === "boolean" ? GroupDef.HasPreviewImages : AllowNone,
		IsAppearance() { return this.Category === "Appearance"; },
		IsItem() { return this.Category === "Item"; },
		IsScript() { return this.Category === "Script"; },
	};
	AssetGroupMap.set(A.Name, A);
	AssetActivityMirrorGroupSet(A);
	AssetGroup.push(A);
	return A;
}

/**
 * Collects the group equivalence classes defined by the MirrorActivitiesFrom property into a map for easy access to
 * mirror group sets (i.e. all groups that are mirror activities from, or are mirrored by, each other).
 * @param {AssetGroup} group - The group to register
 */
function AssetActivityMirrorGroupSet(group) {
	if (group.MirrorActivitiesFrom) {
		const mirrorGroups = AssetActivityMirrorGroups.get(group.MirrorActivitiesFrom);
		if (mirrorGroups) {
			mirrorGroups.push(group);
			AssetActivityMirrorGroups.set(group.Name, mirrorGroups);
			return;
		}
	}
	AssetActivityMirrorGroups.set(group.Name, [group]);
}

/**
 * Adds a new asset to the main list
 * @param {AssetGroup} Group
 * @param {AssetDefinition} AssetDef
 * @param {ExtendedItemMainConfig} ExtendedConfig
 * @returns {void} - Nothing
 */
function AssetAdd(Group, AssetDef, ExtendedConfig) {
	/** @type {Mutable<Asset>} */
	var A = {
		Name: AssetDef.Name,
		Description: AssetDef.Name,
		Group: Group,
		ParentItem: AssetDef.ParentItem,
		ParentGroupName: AssetDef.ParentGroup === undefined ? Group.ParentGroupName : AssetDef.ParentGroup,
		Enable: (AssetDef.Enable == null) ? true : AssetDef.Enable,
		Visible: (AssetDef.Visible == null) ? true : AssetDef.Visible,
		NotVisibleOnScreen: Array.isArray(AssetDef.NotVisibleOnScreen) ? AssetDef.NotVisibleOnScreen : [],
		Wear: (AssetDef.Wear == null) ? true : AssetDef.Wear,
		Activity: (typeof AssetDef.Activity === "string" ? AssetDef.Activity : null),
		ActivityAudio: Array.isArray(AssetDef.ActivityAudio) ? AssetDef.ActivityAudio : [],
		AllowActivity: Array.isArray(AssetDef.AllowActivity) ? AssetDef.AllowActivity : [],
		AllowActivityOn: Array.isArray(AssetDef.AllowActivityOn) ? AssetDef.AllowActivityOn : [],
		ActivityExpression: Array.isArray(AssetDef.ActivityExpression) ? AssetDef.ActivityExpression : {},
		BuyGroup: AssetDef.BuyGroup,
		PrerequisiteBuyGroups: AssetDef.PrerequisiteBuyGroups,
		Effect: (AssetDef.Effect == null) ? Group.Effect : AssetDef.Effect,
		Bonus: AssetDef.Bonus,
		Block: (AssetDef.Block == null) ? Group.Block : AssetDef.Block,
		Expose: (AssetDef.Expose == null) ? [] : AssetDef.Expose,
		Hide: (AssetDef.Hide == null) ? Group.Hide : AssetDef.Hide,
		HideItem: AssetDef.HideItem,
		HideItemExclude: AssetDef.HideItemExclude || [],
		HideItemAttribute: AssetDef.HideItemAttribute || [],
		Require: (!Array.isArray(AssetDef.Require) ? [] : AssetDef.Require),
		SetPose: (AssetDef.SetPose == null) ? Group.SetPose : AssetDef.SetPose,
		AllowActivePose: AssetDef.AllowActivePose,
		Value: (AssetDef.Value == null) ? 0 : AssetDef.Value,
		Difficulty: (AssetDef.Difficulty == null) ? 0 : AssetDef.Difficulty,
		SelfBondage: (AssetDef.SelfBondage == null) ? 0 : AssetDef.SelfBondage,
		SelfUnlock: (AssetDef.SelfUnlock == null) ? true : AssetDef.SelfUnlock,
		ExclusiveUnlock: (AssetDef.ExclusiveUnlock == null) ? false : AssetDef.ExclusiveUnlock,
		Random: (AssetDef.Random == null) ? true : AssetDef.Random,
		RemoveAtLogin: (AssetDef.RemoveAtLogin == null) ? false : AssetDef.RemoveAtLogin,
		WearTime: (AssetDef.Time == null) ? 0 : AssetDef.Time,
		RemoveTime: (AssetDef.RemoveTime == null) ? ((AssetDef.Time == null) ? 0 : AssetDef.Time) : AssetDef.RemoveTime,
		RemoveTimer: (AssetDef.RemoveTimer == null) ? 0 : AssetDef.RemoveTimer,
		MaxTimer: (AssetDef.MaxTimer == null) ? 0 : AssetDef.MaxTimer,
		DrawingPriority: AssetDef.Priority,
		DrawingLeft: AssetDef.Left,
		DrawingTop: AssetDef.Top,
		HeightModifier: (AssetDef.Height == null) ? 0 : AssetDef.Height,
		ZoomModifier: (AssetDef.Zoom == null) ? 1 : AssetDef.Zoom,
		Alpha: AssetDef.Alpha,
		Prerequisite: (typeof AssetDef.Prerequisite === "string" ? [AssetDef.Prerequisite] : Array.isArray(AssetDef.Prerequisite) ? AssetDef.Prerequisite : []),
		Extended: (AssetDef.Extended == null) ? false : AssetDef.Extended,
		AlwaysExtend: (AssetDef.AlwaysExtend == null) ? false : AssetDef.AlwaysExtend,
		AlwaysInteract: (AssetDef.AlwaysInteract == null) ? false : AssetDef.AlwaysInteract,
		AllowLock: typeof AssetDef.AllowLock === "boolean" ? AssetDef.AllowLock : false,
		LayerVisibility: (AssetDef.LayerVisibility == null) ? false : AssetDef.LayerVisibility,
		IsLock: (AssetDef.IsLock == null) ? false : AssetDef.IsLock,
		PickDifficulty: (AssetDef.PickDifficulty == null) ? 0 : AssetDef.PickDifficulty,
		OwnerOnly: (AssetDef.OwnerOnly == null) ? false : AssetDef.OwnerOnly,
		LoverOnly: (AssetDef.LoverOnly == null) ? false : AssetDef.LoverOnly,
		FamilyOnly: (AssetDef.FamilyOnly == null) ? false : AssetDef.FamilyOnly,
		ExpressionTrigger: AssetDef.ExpressionTrigger,
		RemoveItemOnRemove: (AssetDef.RemoveItemOnRemove == null) ? Group.RemoveItemOnRemove : Group.RemoveItemOnRemove.concat(AssetDef.RemoveItemOnRemove),
		AllowEffect: AssetDef.AllowEffect,
		AllowBlock: AssetDef.AllowBlock,
		AllowTighten: AssetDef.AllowTighten,
		AllowTypes: AssetDef.AllowTypes,
		AllowHide: AssetDef.AllowHide,
		AllowHideItem: AssetDef.AllowHideItem,
		DefaultColor: [],
		Opacity: AssetParseOpacity(AssetDef.Opacity),
		MinOpacity: typeof AssetDef.MinOpacity === "number" ? AssetParseOpacity(AssetDef.MinOpacity) : 1,
		MaxOpacity: typeof AssetDef.MaxOpacity === "number" ? AssetParseOpacity(AssetDef.MaxOpacity) : 1,
		Audio: AssetDef.Audio,
		Category: AssetDef.Category,
		Fetish: AssetDef.Fetish,
		ArousalZone: typeof AssetDef.ArousalZone === "string" ? AssetDef.ArousalZone : (Group.ArousalZone ? Group.ArousalZone : /** @type {AssetGroupItemName} */ (Group.Name)),
		IsRestraint: (AssetDef.IsRestraint == null) ? ((Group.IsRestraint == null) ? false : Group.IsRestraint) : AssetDef.IsRestraint,
		BodyCosplay: (AssetDef.BodyCosplay == null) ? Group.BodyCosplay : AssetDef.BodyCosplay,
		OverrideBlinking: (AssetDef.OverrideBlinking == null) ? false : AssetDef.OverrideBlinking,
		DialogSortOverride: AssetDef.DialogSortOverride,
		// @ts-ignore: this has no type, because we are in JS file
		DynamicDescription: (typeof AssetDef.DynamicDescription === 'function') ? AssetDef.DynamicDescription : function () { return this.Description; },
		DynamicPreviewImage: (typeof AssetDef.DynamicPreviewImage === 'function') ? AssetDef.DynamicPreviewImage : function () { return ""; },
		DynamicAllowInventoryAdd: (typeof AssetDef.DynamicAllowInventoryAdd === 'function') ? AssetDef.DynamicAllowInventoryAdd : function () { return true; },
		// @ts-ignore: this has no type, because we are in JS file
		DynamicName: (typeof AssetDef.DynamicName === 'function') ? AssetDef.DynamicName : function () { return this.Name; },
		DynamicGroupName: (AssetDef.DynamicGroupName || Group.DynamicGroupName),
		DynamicActivity: (typeof AssetDef.DynamicActivity === 'function') ? AssetDef.DynamicActivity : function () { return AssetDef.Activity; },
		DynamicAudio: (typeof AssetDef.DynamicAudio === 'function') ? AssetDef.DynamicAudio : null,
		CharacterRestricted: typeof AssetDef.CharacterRestricted === 'boolean' ? AssetDef.CharacterRestricted : false,
		AllowRemoveExclusive: typeof AssetDef.AllowRemoveExclusive === 'boolean' ? AssetDef.AllowRemoveExclusive : false,
		InheritColor: AssetDef.InheritColor || Group.InheritColor,
		DynamicBeforeDraw: (typeof AssetDef.DynamicBeforeDraw === 'boolean') ? AssetDef.DynamicBeforeDraw : false,
		DynamicAfterDraw: (typeof AssetDef.DynamicAfterDraw === 'boolean') ? AssetDef.DynamicAfterDraw : false,
		DynamicScriptDraw: (typeof AssetDef.DynamicScriptDraw === 'boolean') ? AssetDef.DynamicScriptDraw : false,
		HasType: (typeof AssetDef.HasType === 'boolean') ? AssetDef.HasType : true,
		AllowLockType: AssetDef.AllowLockType,
		AllowColorizeAll: typeof AssetDef.AllowColorizeAll === "boolean" ? AssetDef.AllowColorizeAll : true,
		AvailableLocations: AssetDef.AvailableLocations || [],
		OverrideHeight: AssetDef.OverrideHeight,
		DrawLocks: typeof AssetDef.DrawLocks === "boolean" ? AssetDef.DrawLocks : true,
		AllowExpression: AssetDef.AllowExpression,
		MirrorExpression: AssetDef.MirrorExpression,
		FixedPosition: typeof AssetDef.FixedPosition === "boolean" ? AssetDef.FixedPosition : false,
		Layer: [],
		ColorableLayerCount: 0,
		CustomBlindBackground: typeof AssetDef.CustomBlindBackground === 'string' ? AssetDef.CustomBlindBackground : undefined,
		Attribute: AssetDef.Attribute || [],
		PreviewIcons: AssetDef.PreviewIcons || [],
		PoseMapping: AssetDef.PoseMapping || Group.PoseMapping,
		Tint: Array.isArray(AssetDef.Tint) ? AssetDef.Tint : [],
		AllowTint: Array.isArray(AssetDef.Tint) && AssetDef.Tint.length > 0,
		DefaultTint: typeof AssetDef.DefaultTint === "string" ? AssetDef.DefaultTint : undefined,
		Gender: AssetDef.Gender,
		CraftGroup: typeof AssetDef.CraftGroup === "string" ? AssetDef.CraftGroup : AssetDef.Name,
		ColorSuffix: AssetDef.ColorSuffix || Group.ColorSuffix,
		ExpressionPrerequisite: Array.isArray(AssetDef.ExpressionPrerequisite) ? AssetDef.ExpressionPrerequisite : Group.ExpressionPrerequisite,
	};

	if (A.SetPose) {
		Object.assign(A, AssetParsePosePrerequisite(A));
	}

	// Ensure opacity value is valid
	if (A.MinOpacity > A.Opacity) A.MinOpacity = A.Opacity;
	if (A.MaxOpacity < A.Opacity) A.MaxOpacity = A.Opacity;

	A.Layer = AssetBuildLayer(AssetDef, A);
	AssetAssignColorIndices(A);
	A.DefaultColor = AssetParseDefaultColor(A.ColorableLayerCount, AssetDef.DefaultColor);

	// Unwearable assets are not visible but can be overwritten
	if (!A.Wear && AssetDef.Visible != true) A.Visible = false;
	// @ts-ignore: ignore `readonly` while still building the group properties
	Group.Asset.push(A);
	AssetMap.set(Group.Name + "/" + A.Name, A);
	Asset.push(A);

	// Initialize the extended item data of archetypical items
	if (ExtendedConfig) {
		const assetBaseConfig = AssetFindExtendedConfig(ExtendedConfig, A.Group.Name, A.Name);
		if (assetBaseConfig != null) {
			AssetBuildExtended(A, assetBaseConfig, ExtendedConfig);
		}
	}
}

/**
 * Automatically generated pose-related asset prerequisites
 * @param {Partial<Pick<Asset, "AllowActivePose" | "SetPose" | "Prerequisite" | "Effect">>} asset The asset or any other object with the expected asset interface subset
 * @returns {{ Prerequisite?: AssetPrerequisite[], AllowActivePose?: AssetPoseName[] }} The newly generated prerequisites
 */
function AssetParsePosePrerequisite({ SetPose, AllowActivePose, Effect, Prerequisite }) {
	if (SetPose == null) {
		return {};
	}
	const allowActivePose = CommonArrayConcatDedupe([...(AllowActivePose || [])], SetPose);

	/** @type {AssetPrerequisite[]} */
	const posePrerequisite = SetPose.map(i => /** @type {const} */(`Can${i}`));
	const standingPoses = /** @type {const} */(["BaseLower", "LegsClosed", "LegsOpen", "Spread"]);
	if (standingPoses.some(p => SetPose.includes(p)) && !allowActivePose.includes("Kneel")) {
		posePrerequisite.push("NotKneeling");
	}

	if (Effect && Effect.includes("Suspended")) {
		posePrerequisite.push("NotChained");
	}

	return {
		Prerequisite: CommonArrayConcatDedupe([...(Prerequisite || [])], posePrerequisite),
		AllowActivePose: allowActivePose,
	};
}

/**
 * Construct the items extended item config, merging via {@link AssetArchetypeConfig.CopyConfig} if required.
 * Potentially updates the passed {@link AssetArchetypeConfig} object inplace.
 * @param {Asset} A - The asset to configure
 * @param {AssetArchetypeConfig} config - The extended item configuration of the base item
 * @param {ExtendedItemMainConfig} extendedConfig - The extended item configuration object for the asset's family
 * @returns {null | AssetArchetypeConfig} - The oiginally passed base item configuration, potentially updated inplace.
 * Returns `null` insstead if an error was encountered.
 */
function AssetBuildConfig(A, config, extendedConfig) {
	const visited = new Set([`${A.Group.Name}:${A.Name}`]);
	while (config.CopyConfig) {
		const { GroupName, AssetName } = config.CopyConfig;

		const key = `${GroupName || A.Group.Name}:${AssetName}`;
		if (visited.has(key)) {
			console.error(`Found cyclic CopyConfig reference ${key} in ${A.Group.Name}:${A.Name}:`, visited);
			return null;
		} else {
			visited.add(key);
		}

		const superConfig = AssetFindExtendedConfig(extendedConfig, GroupName || A.Group.Name, AssetName);
		if (!superConfig) {
			console.error(`CopyConfig ${GroupName || A.Group.Name}:${AssetName} not found for ${A.Group.Name}:${A.Name}`);
			return null;
		}
		if (config.Archetype !== superConfig.Archetype) {
			console.error(`Archetype for ${GroupName || A.Group.Name}:${AssetName} (${superConfig.Archetype}) doesn't match archetype for ${A.Group.Name}:${A.Name} (${config.Archetype})`);
			return null;
		}

		config = Object.assign({}, superConfig, config);
		delete config.CopyConfig;
	}
	return config;
}

/**
 * Constructs extended item functions for an asset, if extended item configuration exists for the asset.
 * Updates the passed config inplace if {@link ExtendedItem.CopyConfig} is present.
 * @param {Asset} A - The asset to configure
 * @param {AssetArchetypeConfig} baseConfig - The extended item configuration of the base item
 * @param {ExtendedItemMainConfig} extendedConfig - The extended item configuration object for the asset's family
 * @param {null | ExtendedItemOption} parentOption
 * @param {boolean} createCallbacks
 * @returns {null | AssetArchetypeData} - The extended itemdata or `null` if an error was encoutered
 */
function AssetBuildExtended(A, baseConfig, extendedConfig, parentOption=null, createCallbacks=true) {
	const config = AssetBuildConfig(A, baseConfig, extendedConfig);
	if (config === null) {
		return null;
	}

	/** @type {null | AssetArchetypeData} */
	let data = null;
	switch (config.Archetype) {
		case ExtendedArchetype.MODULAR:
			data = ModularItemRegister(A, config);
			break;
		case ExtendedArchetype.TYPED:
			data = TypedItemRegister(A, config);
			break;
		case ExtendedArchetype.VIBRATING:
			data = VibratorModeRegister(A, config, parentOption);
			break;
		case ExtendedArchetype.VARIABLEHEIGHT:
			data = VariableHeightRegister(A, config, parentOption);
			break;
		case ExtendedArchetype.TEXT:
			data = TextItemRegister(A, config, parentOption, createCallbacks);
			break;
	}

	if (!A.Archetype && parentOption == null) {
		/** @type {Mutable<Asset>} */(A).Archetype = config.Archetype;
	}
	return data;
}

/**
 * Finds the extended item configuration for the provided group and asset name, if any exists
 * @param {ExtendedItemMainConfig} ExtendedConfig - The full extended item configuration object
 * @param {AssetGroupName} GroupName - The name of the asset group to find extended configuration for
 * @param {string} AssetName - The name of the asset to find extended configuration fo
 * @returns {AssetArchetypeConfig | undefined} - The extended asset configuration object for the specified asset, if
 * any exists, or undefined otherwise
 */
function AssetFindExtendedConfig(ExtendedConfig, GroupName, AssetName) {
	const GroupConfig = ExtendedConfig[GroupName] || {};
	return GroupConfig[AssetName];
}

/**
 * Builds the layer array for an asset based on the asset definition. One layer is created for each drawable part of
 * the asset (excluding the lock). If the asset definition contains no layer definitions, a default layer definition
 * will be created.
 * @param {AssetDefinition} AssetDefinition - The raw asset definition
 * @param {Asset} A - The built asset
 * @return {AssetLayer[]} - An array of layer objects representing the drawable layers of the asset
 */
function AssetBuildLayer(AssetDefinition, A) {
	const Layers = Array.isArray(AssetDefinition.Layer) ? AssetDefinition.Layer : /** @type {AssetLayerDefinition[]} */([{}]);
	return Layers.map((Layer, I) => AssetMapLayer(Layer, AssetDefinition, A, I));
}

/**
 * Maps a layer definition to a drawable layer object
 * @param {AssetLayerDefinition} Layer - The raw layer definition
 * @param {AssetDefinition} AssetDefinition - The raw asset definition
 * @param {Asset} A - The built asset
 * @param {number} I - The index of the layer within the asset
 * @return {AssetLayer} - A Layer object representing the drawable properties of the given layer
 */
function AssetMapLayer(Layer, AssetDefinition, A, I) {
	const opacity = typeof Layer.Opacity === "number" ? AssetParseOpacity(Layer.Opacity) : 1;

	/** @type {AssetLayer} */
	const L = {
		Name: Layer.Name || null,
		AllowColorize: AssetLayerAllowColorize(Layer, AssetDefinition, A.Group),
		CopyLayerColor: typeof Layer.CopyLayerColor === "string" ? Layer.CopyLayerColor : null,
		ColorGroup: typeof Layer.ColorGroup === "string" ? Layer.ColorGroup : null,
		HideColoring: typeof Layer.HideColoring === "boolean" ? Layer.HideColoring : false,
		AllowTypes: Array.isArray(Layer.AllowTypes) ? Layer.AllowTypes : null,
		ModuleType: Array.isArray(Layer.ModuleType) ? Layer.ModuleType : null,
		Visibility: typeof Layer.Visibility === "string" ? Layer.Visibility : null,
		HasType: typeof Layer.HasType === "boolean" ? Layer.HasType : A.HasType,
		ParentGroupName: Layer.ParentGroup === undefined ? A.ParentGroupName : Layer.ParentGroup,
		Priority: Layer.Priority || AssetDefinition.Priority || A.Group.DrawingPriority,
		InheritColor: typeof Layer.InheritColor === "string" ? Layer.InheritColor : A.InheritColor,
		Alpha: AssetLayerAlpha(Layer, AssetDefinition, I),
		Asset: A,
		DrawingLeft: Layer.Left,
		DrawingTop: Layer.Top,
		HideAs: Layer.HideAs,
		FixedPosition: typeof Layer.FixedPosition === "boolean" ? Layer.FixedPosition : false,
		HasImage: typeof Layer.HasImage === "boolean" ? Layer.HasImage : true,
		Opacity: opacity,
		MinOpacity: AssetParseOpacity(typeof Layer.MinOpacity === "number" ? Layer.MinOpacity : A.MinOpacity, opacity, 1),
		MaxOpacity: AssetParseOpacity(typeof Layer.MaxOpacity === "number" ? Layer.MaxOpacity : A.MaxOpacity, 0, opacity),
		BlendingMode: Layer.BlendingMode || "source-over",
		LockLayer: typeof Layer.LockLayer === "boolean" ? Layer.LockLayer : false,
		MirrorExpression: Layer.MirrorExpression,
		AllowModuleTypes: Layer.AllowModuleTypes,
		ColorIndex: 0,
		PoseMapping: Layer.PoseMapping || A.PoseMapping,
		HideForAttribute: Array.isArray(Layer.HideForAttribute) ? Layer.HideForAttribute : null,
		ShowForAttribute: Array.isArray(Layer.ShowForAttribute) ? Layer.ShowForAttribute : null,
		ColorSuffix: Layer.ColorSuffix || A.ColorSuffix,
	};
	return L;
}

/**
 * Parses and validates asset's opacity
 * @param {number|undefined} opacity
 * @param {number} min - The minimum opacity
 * @param {number} max - The maximum opacity
 * @returns {number}
 */
function AssetParseOpacity(opacity, min=0, max=1) {
	if (typeof opacity === "number" && !isNaN(opacity)) {
		return CommonClamp(opacity, min, max);
	}
	return max;
}

/**
 * Determines whether a layer can be colorized, based on the layer definition and its parent asset/group definitions
 * @param {AssetLayerDefinition} Layer - The raw layer definition
 * @param {AssetDefinition} NewAsset - The raw asset definition
 * @param {AssetGroup} Group - The group being processed
 * @return {boolean} - Whether or not the layer should be permit colors
 */
function AssetLayerAllowColorize(Layer, NewAsset, Group) {
	return typeof Layer.AllowColorize === "boolean" ? Layer.AllowColorize :
		typeof NewAsset.AllowColorize === "boolean" ? NewAsset.AllowColorize :
			typeof Group.AllowColorize === "boolean" ? Group.AllowColorize : true;
}

/**
 * Builds the alpha mask definitions for a layer, based on the
 * @param {AssetLayerDefinition} Layer - The raw layer definition
 * @param {AssetDefinition} NewAsset - The raw asset definition
 * @param {number} I - The index of the layer within its asset
 * @return {AlphaDefinition[]} - a list of alpha mask definitions for the layer
 */
function AssetLayerAlpha(Layer, NewAsset, I) {
	var Alpha = Layer.Alpha || [];
	// If the layer is the first layer for an asset, add the asset's alpha masks
	if (I === 0 && NewAsset.Alpha && NewAsset.Alpha.length) {
		Array.prototype.push.apply(Alpha, NewAsset.Alpha);
	}
	return Alpha;
}

/**
 * Assigns color indices to the layers of an asset. These determine which colors get applied to the layer. Also adds
 * a count of colorable layers to the asset definition.
 * @param {Mutable<Asset>} A - The built asset
 * @returns {void} - Nothing
 */
function AssetAssignColorIndices(A) {
	var colorIndex = 0;
	/** @type {Record<string, number>} */
	var colorMap = {};
	A.Layer.forEach(Layer => {
		// If the layer can't be colored, we don't need to set a color index
		if (!Layer.AllowColorize) return;

		var LayerKey = Layer.CopyLayerColor || Layer.Name;
		if (LayerKey === undefined)
			LayerKey = "undefined";
		if (LayerKey === null)
			LayerKey = "null";

		if (typeof colorMap[LayerKey] !== "number") {
			colorMap[LayerKey] = colorIndex;
			colorIndex++;
		}
		/** @type {Mutable<AssetLayer>} */(Layer).ColorIndex = colorMap[LayerKey];
	});
	A.ColorableLayerCount = colorIndex;
}

/**
 * Builds the asset description from the CSV file
 * @param {IAssetFamily} Family
 * @param {string[][]} CSV
 */
function AssetBuildDescription(Family, CSV) {

	/** @type {Map<string, string>} */
	const map = new Map();

	for (const line of CSV) {
		if (Array.isArray(line) && line.length === 3) {
			if (map.has(`${line[0]}:${line[1]}`)) {
				console.warn("Duplicate Asset Description: ", line);
			}
			map.set(`${line[0]}:${line[1]}`, line[2].trim());
		} else {
			console.warn("Bad Asset Description line: ", line);
		}
	}

	// For each asset group in family
	for (const G of AssetGroup) {
		if (G.Family !== Family)
			continue;

		const res = map.get(`${G.Name}:`);
		/** @type {Mutable<AssetGroup>} */(G).Description = (res !== undefined) ? res : `MISSING ASSETGROUP DESCRIPTION: ${G.Name}`;
	}

	// For each asset in the family
	for (const A of Asset) {
		if (A.Group.Family !== Family)
			continue;

		const res = map.get(`${A.Group.Name}:${A.Name}`);
		/** @type {Mutable<Asset>} */(A).Description = (res !== undefined) ? res : `MISSING ASSET DESCRIPTION: ${A.Group.Name}:${A.Name}`;
	}

	// Translates the descriptions to a foreign language
	TranslationAsset(Family);

}

/**
 * Loads the description of the assets in a specific language
 * @param {IAssetFamily} Family The asset family to load the description for
 */
function AssetLoadDescription(Family) {

	// Finds the full path of the CSV file to use cache
	var FullPath = "Assets/" + Family + "/" + Family + ".csv";
	if (CommonCSVCache[FullPath]) {
		AssetBuildDescription(Family, CommonCSVCache[FullPath]);
		return;
	}

	// Opens the file, parse it and returns the result it to build the dialog
	CommonGet(FullPath, function () {
		if (this.status == 200) {
			CommonCSVCache[FullPath] = CommonParseCSV(this.responseText);
			AssetBuildDescription(Family, CommonCSVCache[FullPath]);
		}
	});

}

/**
 * Yield the passed group, all its assets and all their layers
 * @param {AssetGroup} group
 * @return {Generator<AssetGroup | Asset | AssetLayer, void>}
 */
function *AssetYieldAll(group) {
	yield group;
	yield *group.Asset;
	for (const asset of group.Asset) {
		yield *asset.Layer;
	}
}

/**
 * Loads a specific asset file
 * @param {readonly AssetGroupDefinition[]} Groups
 * @param {IAssetFamily} Family
 * @param {ExtendedItemMainConfig} ExtendedConfig
 */
function AssetLoad(Groups, Family, ExtendedConfig) {

	// For each group in the asset file
	for (const group of Groups) {
		// Creates the asset group
		const G = AssetGroupAdd(Family, group);

		// Add each assets in the group 1 by 1
		for (const asset of group.Asset) {
			if (typeof asset === "string")
				AssetAdd(G, { Name: asset }, ExtendedConfig);
			else
				AssetAdd(G, asset, ExtendedConfig);
		}
	}

	// Flatten any `InheritColor` graphs, transforming the likes of `A > B > C` into `A > C`
	for (const group of AssetGroup) {
		for (const obj of AssetYieldAll(group)) {
			if (!obj.InheritColor) {
				continue;
			}

			/** @type {undefined | typeof obj} */
			let groupAssetOrLayer = obj;
			while (groupAssetOrLayer && groupAssetOrLayer.InheritColor) {
				groupAssetOrLayer = AssetGroupMap.get(groupAssetOrLayer.InheritColor);
			}
			const parentGroup = /** @type {AssetGroup} */(groupAssetOrLayer);

			/** @type {{ InheritColor: AssetGroupName }} */(obj).InheritColor = parentGroup.Name;
			if (AssetGroupMap.has(/** @type {AssetGroupName} */(obj.Name))) {
				/** @type {Mutable<AssetGroup>} */(obj).ColorSchema = [...parentGroup.ColorSchema];
			}
		}
	}

	// TODO: Figure out how to get the .csv loading to work in Node.js, which we use for the test suite
	if (IsBrowser()) {
		// Loads the description of the assets in a specific language
		AssetLoadDescription(Family);
	}
}

// Reset and load all the assets
function AssetLoadAll() {
	Asset = [];
	AssetGroup = [];
	AssetLoad(AssetFemale3DCG, "Female3DCG", AssetFemale3DCGExtended);
	ExtendedItemManualRegister();
	Pose = PoseFemale3DCG;
	Pose.forEach(p => PoseRecord[p.Name] = p);
	PropertyAutoPunishHandled = new Set(AssetGroup.map((a) => a.Name));
}

/**
 * Gets a specific asset by family/group/name
 * @param {IAssetFamily} Family - The family to search in (Ignored until other family is added)
 * @param {AssetGroupName} Group - Name of the group of the searched asset
 * @param {string} Name - Name of the searched asset
 * @returns {Asset|null}
 */
function AssetGet(Family, Group, Name) {
	return AssetMap.get(Group + "/" + Name) || null;
}

/**
 * Gets all activities on a family and name
 * @param {IAssetFamily} family - The family to search in
 * @returns {Activity[]}
 */
function AssetAllActivities(family) {
	if (family == "Female3DCG")
		return ActivityFemale3DCG;
	return [];
}

/**
 * Gets an activity asset by family and name
 * @param {IAssetFamily} family - The family to search in
 * @param {string} name - Name of activity to search for
 * @returns {Activity|undefined}
 */
function AssetGetActivity(family, name) {
	return AssetAllActivities(family).find(a => (a.Name === name));
}

/**
 * Get the list of all activities on a group for a given family.
 *
 * @description Note that this just returns activities as defined, no checks are
 * actually done on whether the activity makes sense.
 *
 * @param {IAssetFamily} family
 * @param {AssetGroupName} groupname
 * @param {"self" | "other" | "any"} onSelf
 * @returns {Activity[]}
 */
function AssetActivitiesForGroup(family, groupname, onSelf = "other") {
	const activities = AssetAllActivities(family);
	/** @type {Activity[]} */
	const defined = [];
	activities.forEach(a => {
		/** @type {string[] | undefined} */
		let targets;
		// Get the correct target list
		if (onSelf === "self") {
			targets = (typeof a.TargetSelf === "boolean" ? a.Target : a.TargetSelf);
		} else if (onSelf === "any") {
			targets = a.Target;
			if (Array.isArray(a.TargetSelf))
				targets = targets.concat(a.TargetSelf);
		} else {
			targets = a.Target;
		}
		if (targets && targets.includes(groupname))
			defined.push(a);
	});
	return defined;
}

/**
 * Cleans the given array of assets of any items that no longer exists
 * @param {readonly ItemPermissions[]} AssetArray - The arrays of items to clean
 * @returns {ItemPermissions[]} - The cleaned up array
 */
function AssetCleanArray(AssetArray) {
	return AssetArray.filter(({ Group, Name }) => AssetGet('Female3DCG', Group, Name) != null);
}

/**
 * Gets an asset group by the asset family name and group name
 * @param {IAssetFamily} Family - The asset family that the group belongs to (Ignored until other family is added)
 * @param {AssetGroupName} Group - The name of the asset group to find
 * @returns {AssetGroup|null} - The asset group matching the provided family and group name
 */
function AssetGroupGet(Family, Group) {
	return AssetGroupMap.get(Group) || null;
}

/**
 * Utility function for retrieving the preview image directory path for an asset
 * @param {Asset} A - The asset whose preview path to retrieve
 * @returns {string} - The path to the asset's preview image directory
 */
function AssetGetPreviewPath(A) {
	return `Assets/${A.Group.Family}/${A.DynamicGroupName}/Preview`;
}

/**
 * Utility function for retrieving the base path of an asset's inventory directory, where extended item scripts are
 * held
 * @param {Asset} A - The asset whose inventory path to retrieve
 * @returns {string} - The path to the asset's inventory directory
 */
function AssetGetInventoryPath(A) {
	return `Screens/Inventory/${A.DynamicGroupName}/${A.Name}`;
}

/**
 * Sort a list of asset layers for the {@link Character.AppearanceLayers } property.
 * Performs an inplace update of the passed array and then returns it.
 * @param {AssetLayer[]} layers - The to-be sorted asset layers
 * @returns {AssetLayer[]} - The newly sorted asset layers
 */
function AssetLayerSort(layers) {
	return layers.sort((l1, l2) => {
		// If priorities are different, sort by priority
		if (l1.Priority !== l2.Priority) return l1.Priority - l2.Priority;
		// If the priorities are identical and the layers belong to the same Asset, ensure layer order is preserved
		if (l1.Asset === l2.Asset) return l1.Asset.Layer.indexOf(l1) - l1.Asset.Layer.indexOf(l2);
		// If priorities are identical, first try to sort by group name
		if (l1.Asset.Group !== l2.Asset.Group) return l1.Asset.Group.Name.localeCompare(l2.Asset.Group.Name);
		// If the groups are identical, then sort by asset name - this shouldn't actually be possible unless you've
		// somehow equipped two different assets from the same group, but use it as an if-the-unexpected-happens
		// fallback.
		return l1.Asset.Name.localeCompare(l2.Asset.Name);
	});
}

/**
 * Convert {@link AssetDefinition} default color into a {@link Asset} default color list
 * @param {number} colorableLayerCount The number of colorable layers
 * @param {string | readonly string[]} [color] See {@link AssetDefinition.DefaultColor}
 * @returns {string[]} See {@link Asset.DefaultColor}
 */
function AssetParseDefaultColor(colorableLayerCount, color) {
	/** @type {string[]} */
	const defaultColor = Array(colorableLayerCount).fill("Default");
	if (typeof color === "string") {
		defaultColor.fill(color);
	} else if (CommonIsArray(color)) {
		color.slice(0, colorableLayerCount).forEach((c, i) => defaultColor[i] = c);
	}
	return defaultColor;
}
