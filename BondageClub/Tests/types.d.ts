type GroupMock = Partial<AssetGroup>;
type AssetMock = Omit<Partial<Asset>, "Group"> & { Group: GroupMock };

type ColorAssetMock = (
    AssetMock
    & Pick<Asset, "ColorableLayerCount" | "DefaultColor">
);

type AssetName = string;
type AssetString = `${AssetGroupName}/${AssetName}`;
