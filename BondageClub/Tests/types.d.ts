type GroupMock = Partial<AssetGroup>;
type AssetMock = Omit<Partial<Asset>, "Group"> & { Group: GroupMock };

type ColorAssetMock = (
    AssetMock
    & Pick<Asset, "ColorableLayerCount" | "DefaultColor">
);

type AssetName = string;
type AssetString = `${AssetGroupName}/${AssetName}`;

interface AccountCreationData {
	InputCharacter: string;
	InputName: string;
	InputPassword1: string;
	InputPassword2: string;
	InputEmail: string;
}

type AccountCreationStatus = "ok" | "invalid_field" | "already_exists";
