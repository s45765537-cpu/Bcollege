type GroupMock = Partial<AssetGroup>;
type AssetMock = Omit<Partial<Asset>, "Group"> & { Group: GroupMock };

type ColorAssetMock = (
    AssetMock
    & Pick<Asset, "ColorableLayerCount" | "DefaultColor">
);

type AssetName = string;
type AssetString = AssetFullPath;

interface AccountCreationData {
	InputCharacter: string;
	InputName: string;
	InputPassword1: string;
	InputPassword2: string;
	InputEmail: string;
}

type AccountCreationStatus = "ok" | "invalid_field" | "already_exists";

class BrowserCache {
	name: string;
	cache: Cache;
	private _releasePattern: RegExpstring;
	private _revalidated: Set<string>
	private new (cache: Cache, name: string);
	static async open(): Promise<BrowserCache>;
	key(url: string): string;
	async fetch(url: string, options: BrowserCache.FetchOptions = {}): Promise<Response>
	async clear(): Promise<boolean>;
}

type CachedImageState = 'uncached' | 'loading' | 'loaded' | 'failed';

class CachedImage<T> {
	cache: ImageCache<T>;
	url: string;
	state: CachedImageState;
	data: T | null;
	lastUsed: number;
	private _generation: number;

	new (cache: ImageCache<T>, url: string);

	unload(): void;

	get width(): number;
	get height(): number;
	isLoading(): boolean;
	isLoaded(): this is LoadedCachedImage<T>;
	isDoneLoading(): boolean;
	isFailing(): boolean;
};

class ImageCache<T extends { width: number, height: number }> {
	cache: Map<string, CachedImage<T>>;
	name: string;
	lastPurge: number;
	browserCache: BrowserCache | null;
	_decode: (blob: Blob) => T | Promise<T>;
	_dispose: ((data: T) => void) | undefined;

	new (name: string, browserCache: BrowserCache | null, options: ImageCache.Options<T>);

	has(url: string): boolean;
	get(url: string): CachedImage<T>;
	delete(url: string): void;
	forEach(callback: (img: CachedImage<T>, key: string, map: Map<string, CachedImage<T>>) => void): void;
	clear(): void;
	private _imageStateDidChange(image: CachedImage<T>): void;
	_refreshCharactersForImage(img: CachedImage<T>): void;
	purge(force = false): void;
	stats(): void;
	totalImages(): number;
}
