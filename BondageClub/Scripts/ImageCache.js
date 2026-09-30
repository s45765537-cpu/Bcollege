"use strict";

/**
 * What state is the image in.
 *
 * - UNCACHED (initial) -> LOADING
 * - LOADING -> LOADED (final)
 * - LOADING -> FAILED (final)
 *
 * @enum {string}
 */
const CachedImageState = {
	/** Image is known, but not yet cached */
	UNCACHED: 'uncached',
	/** Image is currently being loaded */
	LOADING: 'loading',
	/** Image is available in cache */
	LOADED: 'loaded',
	/** Image couldn't be cached */
	FAILED: 'failed',
};

/**
 * Cached image data
 * @template {object} ImageMetadata
 */
class CachedImage {
	/**
	 * Create a new cached image.
	 *
	 * @param {ImageCacheClass<ImageMetadata>} cache - The cache holding the image
	 * @param {string} url - The URL for the image to cache
	 * @param {CachedImage.Options} [options]
	 */
	constructor(cache, url, options) {
		/**
		 * Only used to inform the cache of loading progress
		 * @type {ImageCacheClass<any>}
		 * @private
		 */
		this.cache = cache;
		/** @type {string} */
		this.url = url;
		/** @type {CachedImageState} */
		this.state = CachedImageState.UNCACHED;
		/** @type {CachedImage.LifetimeCallback | undefined} */
		this.loadCallback = options?.loadCallback;
		/** @type {CachedImage.LifetimeCallback | undefined} */
		this.unloadCallback = options?.unloadCallback;
		/**
		 * The decoded pixels; `null` until decoding completes.
		 * @type {ImageBitmap | null}
		 */
		this.bitmap = null;
		/** @type {ImageMetadata} */
		this.userData = /** @type {ImageMetadata} */ ({});
		/** @type {number} */
		this.lastUsed = 0;
		/**
		 * Bumped on every unload so that in-flight asynchronous work knows its
		 * result is no longer wanted.
		 * @type {number}
		 * @private
		 */
		this._generation = 0;
	}

	/**
	 * Load the cached image if it's not already available
	 */
	load() {
		// Ensure there's only one image load in progress
		if (this.isLoading() || this.isDoneLoading()) return;

		this.state = CachedImageState.LOADING;
		// _load reports its outcome through the state, and never rejects
		void this._load(this._generation);
	}

	/**
	 * Unload the image from the cache
	 */
	unload() {
		if (this.state === CachedImageState.UNCACHED) return;

		if (this.unloadCallback)
			this.unloadCallback(this);

		// Anything still in flight for this entry must drop its result
		this._generation += 1;

		if (this.bitmap) {
			this.bitmap.close();
			this.bitmap = null;
		}

		this.userData = /** @type {ImageMetadata} */ ({});
		this.state = CachedImageState.UNCACHED;
	}

	/**
	 * Fetch the raw bytes of the image.
	 *
	 * @param {string} url - The URL to fetch
	 * @returns {Promise<Blob>}
	 * @private
	 */
	async _fetchBlob(url) {
		const response = await CommonFetch(url);
		if (!response.ok)
			throw new Error(`HTTP ${response.status}`);
		return response.blob();
	}

	/**
	 * Perform the actual load.
	 *
	 * @param {number} generation - The generation this load belongs to
	 * @returns {Promise<void>}
	 * @private
	 */
	async _load(generation) {
		try {
			const blob = await this._fetchBlob(this.url);
			if (generation !== this._generation) return;

			// Keep the alpha channel straight, the same way an <img> upload
			// would hand it to WebGL; the default would premultiply it and
			// lose precision on translucent pixels.
			const bitmap = await createImageBitmap(blob, { premultiplyAlpha: "none" });
			if (generation !== this._generation) {
				bitmap.close();
				return;
			}

			this.bitmap = bitmap;
			this.state = CachedImageState.LOADED;
			this.cache._imageStateDidChange(this);
		} catch (err) {
			if (generation !== this._generation) return;

			// Load failed. Display the error in the console and mark it as failed.
			console.error("Failed to load image " + this.url, err);
			this.state = CachedImageState.FAILED;
			this.cache._imageStateDidChange(this);
		}
	}

	/**
	 * Is the image an asset image?
	 * @returns boolean
	 */
	isAsset() { return (this.url.indexOf("Assets") >= 0); }

	/**
	 * Is the image currently being loaded?
	 */
	isLoading() { return this.state == CachedImageState.LOADING; }

	/**
	 * Is the image loading complete (either succesfully or not)?
	 */
	isDoneLoading() { return [CachedImageState.LOADED, CachedImageState.FAILED].includes(this.state); }

	/**
	 * Is the image experiencing problems loading?
	 */
	isFailing() { return this.state == CachedImageState.FAILED; }

	/**
	 * Is the image loaded and ready?
	 *
	 * When this is true, `bitmap` is available.
	 * @returns {this is LoadedCachedImage<ImageMetadata>}
	 */
	isLoaded() { return this.state == CachedImageState.LOADED; }

	get complete() {
		return this.isLoaded();
	}

	/**
	 * Get the image's width
	 * @returns {number}
	 */
	get width() {
		return this.isLoaded() ? this.bitmap.width : 0;
	}

	/**
	 * Get the image's height
	 * @returns {number}
	 */
	get height() {
		return this.isLoaded() ? this.bitmap.height : 0;
	}
}

/**
 * The delay between each cache purge event, in milliseconds.
 *
 * When the cache purges, this value is halved, and used to find any assets that
 * haven't been used. Those are the ones that will be removed.
 */
let ImageCachePurgeDelay = 60 * 60 * 1000;

/**
 * The class responsible for loading and caching images
 * @template {object} ImageMetadata
 */
class ImageCacheClass {
	constructor() {
		/** @type {Map<string, CachedImage<ImageMetadata>>} */
		this.cache = new Map();
		this.lastPurge = 0;
	}

	/**
	 * Check whether an image is in the cache
	 *
	 * @param {string} url - The URL of the image to lookup
	 */
	has(url) {
		return !!this.cache.get(url);
	}

	/**
	 * Get a cached image from the cache.
	 *
	 * @param {string} url - The URL of the image to lookup
	 * @param {CachedImage.Options} [options] Options to use for the image
	 * @returns {CachedImage<ImageMetadata>} The cached image
	 */
	get(url, options = {}) {
		let image = this.cache.get(url);
		if (!image) {
			image = new CachedImage(this, url, options);
			this.cache.set(url, image);
		}

		image.lastUsed = CommonTime();

		// start loading the image
		image.load();

		// returns the final image
		return image;
	}

	/**
	 * Remove a cached image by its URL.
	 * @param {string} url - The URL of the image to delete
	 */
	delete(url) {
		const known = this.cache.get(url);
		if (!known) return;

		known.unload();
		this.cache.delete(url);
	}

	/**
	 * Iterate over all cached images
	 * @param {(img: CachedImage<ImageMetadata>, key: string, map: Map<string, CachedImage<ImageMetadata>>) => void} callback - The callback to call on each (URL, image) pair
	 */
	forEach(callback) {
		this.cache.forEach(callback);
	}

	/**
	 * Clear all cached images
	 */
	clear() {
		this.cache.forEach(img => {
			img.unload();
		});
		this.cache.clear();
	}

	/**
	 * Private function called when an image state changes.
	 *
	 * @param {CachedImage<ImageMetadata>} image - The image whose state changed
	 */
	_imageStateDidChange(image) {
		// Ignore images that aren't in the cache, which can happen if they get
		// pruned while their load is still in progress.
		if (!this.cache.has(image.url)) return;

		if (image.isLoaded()) {
			if (image.loadCallback)
				image.loadCallback(image);

			this._refreshCharactersForImage(image);
		} else if (image.state == CachedImageState.FAILED) {
			// CommonFetch already did the retrying, this is final
			this._refreshCharactersForImage(image);
		}
	}

	/**
	 * Given an image, refresh all characters that would be impacted by its load
	 *
	 * @param {CachedImage<ImageMetadata>} img
	 * @returns {void}
	 */
	_refreshCharactersForImage(img) {
		if (!img) return;

		// Go through URL so a query string or hash doesn't stick to the file name
		const path = new URL(img.url, location.href).pathname;
		const parts = path.split("/");
		let pathPos = parts.indexOf("Assets");
		if (pathPos === -1) return;

		if (parts[++pathPos] !== "Female3DCG") return;

		let groupName = parts[++pathPos];
		if (groupName === "Override") {
			// Overrides have two extra positions
			pathPos += 2;
			groupName = parts[pathPos];
		}
		let layerName = parts[++pathPos];
		if (!layerName.endsWith(".png")) {
			// This is a pose directory
			layerName = parts[++pathPos];
		}
		const assetName = layerName.split("_")[0].replace(".png", "");
		const wearing = Character.filter(c => c.Appearance.some(i => (i.Asset.Group.Name === groupName || i.Asset.DynamicGroupName === groupName) && i.Asset.Name === assetName ));
		for (const char of wearing) {
			char.MustDraw = true;
		}
	}

	/**
	 * Purge all images errored or not used in the last half-purge delay
	 */
	purge(force = false) {
		// Only perform a purge if the last purge time makes sense, and its delta
		// is greater than the purge delay.
		const delta = (CurrentTime - this.lastPurge);
		if (!force && delta > 0 && delta < ImageCachePurgeDelay)
			return;

		const startingTotal = this.totalImages();
		this.cache.forEach((image, url) => {
			// Clear images experiencing problems, or that were loaded for longer
			// than half a purge delay
			if (image.state == CachedImageState.FAILED
				|| image.lastUsed && (image.lastUsed + (ImageCachePurgeDelay / 2)) < CommonTime()) {
				this.delete(url);
			}
		});
		console.log(`Cache purged, ${startingTotal - this.totalImages()} images removed`);
		this.lastPurge = CurrentTime;
		this.stats();
	}

	/**
	 * Output some stats about the cache
	 */
	stats() {
		/** @type {{ [key: string]: number}} */
		let stats = { total: this.cache.size, loaded: 0, missing: 0 };
		this.cache.forEach((image) => {
			// Clear errored images
			if (image.state == CachedImageState.FAILED) {
				stats.missing += 1;
			} else if (image.state == CachedImageState.LOADED) {
				stats.loaded += 1;
				// Sort loaded images into 5-minute wide "generations"
				const key = `gen${Math.floor((CurrentTime - image.lastUsed) / (5 * 60 * 1000))}`;
				stats[key] = (stats[key] || 0) + 1;
			}
		});

		console.log(`Cache stats: ${[...Object.entries(stats)].map(e => e[0] + ": " + e[1]).join(", ")}`);
	}

	/**
	 * Get the count of cached images.
	 */
	totalImages() { return this.cache.size; }
}

const ImageCache = /** @type {ImageCacheClass<GLImageMetadata>} */ (new ImageCacheClass());
