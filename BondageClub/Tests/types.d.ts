type ColorAssetMock = (
    Omit<Partial<Asset>, "Group" | "ColorableLayerCount" | "DefaultColor" >
    & { Group?: Partial<AssetGroup> }
    & Pick<Asset, "ColorableLayerCount" | "DefaultColor">
);
