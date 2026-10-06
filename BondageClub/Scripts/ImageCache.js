"use strict";

/**
 * The main BC image cache.
 *
 * Images requested through it will be saved to memory (as decoded ImageBitmaps)
 * and backed by the browser Cache API (bc-images-v1 is the cache name).
 *
 * It bypasses the /R\d+/ version slug in the BC urls so that files can be
 * kept around even if the URL changes every release; only their mtime matters.
 *
 * The stored images are also kept on disk: a hit is returned immediately, but
 * will get revalidated and swapped in in the background; a 304 status keeps the
 * entry; a 200 replaces it and the in-memory bitmap is rebuilt.
 *
 * When the Cache API isn't available, `browserCache` stays unset and fetches fall
 * through to CommonFetch as usual.
 */

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
	 * @param {ImageCache<ImageMetadata>} cache - The cache holding the image
	 * @param {string} url - The URL for the image to cache
	 */
	constructor(cache, url) {
		/**
		 * Only used to inform the cache of loading progress
		 * @type {ImageCache<any>}
		 * @private
		 */
		this.cache = cache;
		/** @type {string} */
		this.url = url;
		/** @type {CachedImageState} */
		this.state = CachedImageState.UNCACHED;
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

		this.cache.imageDidUnload(this);

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
	 * @param {number} generation - The generation the fetch belongs to
	 * @returns {Promise<Blob>}
	 * @private
	 */
	async _fetchBlob(url, generation) {
		const store = this.cache.browserCache;
		const response = store
			? await store.fetch(url, {
				onUpdate: (fresh) => void this._update(generation, fresh),
			})
			: await CommonFetch(url);
		if (!response.ok)
			throw new Error(`HTTP ${response.status}`);
		return response.blob();
	}

	/**
	 * Decode fetched bytes into a bitmap.
	 *
	 * @param {Blob} blob - The image bytes
	 * @returns {Promise<ImageBitmap>}
	 * @private
	 */
	_decode(blob) {
		// Keep the alpha channel straight, the same way an <img> upload
		// would hand it to WebGL; the default would premultiply it and
		// lose precision on translucent pixels.
		return createImageBitmap(blob, { premultiplyAlpha: "none" });
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
			const blob = await this._fetchBlob(this.url, generation);
			if (generation !== this._generation) return;

			const bitmap = await this._decode(blob);
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
	 * Swap in a newer version of the image found by a background revalidation.
	 *
	 * Behaves like an unload immediately followed by a load, so that anything
	 * derived from the old bitmap (GL textures, user data) is rebuilt.
	 *
	 * @param {number} generation - The generation of the load that got updated
	 * @param {Response} response - The fresh response
	 * @returns {Promise<void>}
	 * @private
	 */
	async _update(generation, response) {
		try {
			const blob = await response.blob();
			const bitmap = await this._decode(blob);
			// The image has been unloaded, or is no longer the one we fetched
			if (generation !== this._generation || !this.isLoaded()) {
				bitmap.close();
				return;
			}

			this.cache.imageDidUnload(this);
			this.bitmap.close();

			this.userData = /** @type {ImageMetadata} */ ({});
			this.bitmap = bitmap;
			this.cache._imageStateDidChange(this);
		} catch (err) {
			// The version we have is still perfectly usable
			console.warn(`Failed to update image: ${this.url}`, err);
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
 * Persistent browser-level Cache store for images.
 */
class BrowserCache {
	/**
	 * @param {Cache} cache
	 * @param {string} name
	 * @private
	 */
	constructor(cache, name) {
		if (!cache) throw new Error("BrowserCache requires an open Cache");
		/**
		 * Name of the Cache bucket. Bump only if what's stored in it
		 * changes shape.
		 * @type {string}
		 */
		this.name = name;
		/**
		 * The opened Cache.
		 * @type {Cache}
		 */
		this.cache = cache;
		/**
		 * Matches the release directory at the start of a resource path, e.g. the
		 * `/R123/` in `/R123/Game/Assets/...`.
		 * @type {RegExp}
		 * @private
		 */
		this._releasePattern = /^\/R\d+[^/]*\//;
		/**
		 * Keys that have been revalidated this session.
		 * @type {Set<string>}
		 * @private
		 */
		this._revalidated = new Set();
	}

	/**
	 * Open the named bucket.
	 * @returns {Promise<BrowserCache>}
	 */
	static async open() {
		if (typeof caches === "undefined") throw new Error("Cache API unavailable");
		const cacheName = "bc-images-v1";
		return new BrowserCache(await caches.open(cacheName), cacheName);
	}

	/**
	 * Compute the key an image URL is stored under.
	 *
	 * The R$VERSION directory, query string and fragment are dropped, so that the
	 * same file can be reused across versions, assuming its mtime doesn't change.
	 *
	 * @param {string} url
	 * @returns {string}
	 */
	key(url) {
		const parsed = new URL(url, location.href);
		parsed.pathname = parsed.pathname.replace(this._releasePattern, "/");
		parsed.search = "";
		parsed.hash = "";
		return parsed.href;
	}

	/**
	 * Can this response go in the store?
	 *
	 * Only complete, successful, readable responses are worth keeping. Opaque
	 * ones have a status of 0, so they're excluded by the status check.
	 *
	 * @param {Response} response
	 * @returns {boolean}
	 * @private
	 */
	_isStorable(response) {
		return response.status === 200;
	}

	/**
	 * Store a response into the cache.
	 *
	 * @param {string} key The cache key of the resource
	 * @param {Response} response - The response to store.
	 * @returns {Promise<boolean>} Whether the response was stored.
	 * @private
	 */
	async _put(key, response) {
		// Ignore storage failures (quota, eviction) to not stop the fetch.
		try {
			await this.cache.put(key, response.clone());
			return true;
		} catch (err) {
			console.warn(`Failed to cache image "${key}"`, err);
			return false;
		}
	}

	/**
	 * Check with the server whether a stored image is still current.
	 *
	 * Runs at most once per key per session.
	 *
	 * @param {string} key - The cache key of the resource
	 * @param {string} url - The URL to revalidate against
	 * @param {Response} cached - The response we currently hold
	 * @param {BrowserCache.FetchOptions} options
	 * @returns {void}
	 * @private
	 */
	_revalidate(key, url, cached, options) {
		if (this._revalidated.has(key)) return;
		this._revalidated.add(key);

		/** @type {Record<string, string>} */
		const headers = {};
		const lastModified = cached.headers.get("Last-Modified");
		if (lastModified) headers["If-Modified-Since"] = lastModified;
		const etag = cached.headers.get("ETag");
		if (etag) headers["If-None-Match"] = etag;

		void (async () => {
			try {
				const response = await CommonFetch(new Request(url, { headers }));
				if (response.status === 304) return;
				if (!this._isStorable(response)) return;

				if (await this._put(key, response)) {
					options.onUpdate?.(response);
				}
			} catch (err) {
				// The cached copy stays in use; we'll try again next session
				console.warn(`Failed to revalidate image "${url}"`, err);
			}
		})();
	}

	/**
	 * Fetch an image, through the persistent store when possible.
	 *
	 * @param {string} url - The URL of the image
	 * @param {BrowserCache.FetchOptions} [options]
	 * @returns {Promise<Response>}
	 */
	async fetch(url, options = {}) {
		const key = this.key(url);
		const cached = await this.cache.match(key);
		if (cached) {
			this._revalidate(key, url, cached, options);
			return cached;
		}

		const response = await CommonFetch(url);
		if (this._isStorable(response)) {
			await this._put(key, response);
			// No point revalidating what we just downloaded
			this._revalidated.add(key);
		}
		return response;
	}

	/**
	 * Throw the whole persistent store away and open a fresh bucket.
	 * @returns {Promise<boolean>} Whether there was a store to delete
	 */
	async clear() {
		this._revalidated.clear();
		const deleted = await caches.delete(this.name);
		this.cache = await caches.open(this.name);
		return deleted;
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
class ImageCache {
	/**
	 * @param {string} name
	 * @param {BrowserCache} browserCache
	 * @param {ImageCache.Options} [options] Options to use for the image
	 */
	constructor(name, browserCache, options) {
		/** @type {Map<string, CachedImage<ImageMetadata>>} */
		this.cache = new Map();
		this.name = name;
		this.lastPurge = 0;
		/**
		 * Persistent byte store, or null if the Cache API isn't usable.
		 * @type {BrowserCache | null}
		 */
		this.browserCache = browserCache;
		this.imageOptions = options;
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
	 * @returns {CachedImage<ImageMetadata>} The cached image
	 */
	get(url) {
		let image = this.cache.get(url);
		if (!image) {
			image = new CachedImage(this, url);
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

		if (image.state == CachedImageState.LOADED) {
			this.imageDidLoad(image);

			this._refreshCharactersForImage(image);
		} else if (image.state == CachedImageState.FAILED) {
			// CommonFetch already did the retrying, this is final
			this._refreshCharactersForImage(image);
		}
	}

	/**
	 * @param {CachedImage<ImageMetadata>} image - The image whose state changed
	 */
	imageDidLoad(image) {
		this.imageOptions?.loadCallback?.(image);
	}

	/**
	 * @param {CachedImage<ImageMetadata>} image - The image whose state changed
	 */
	imageDidUnload(image) {
		this.imageOptions?.unloadCallback?.(image);
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
		console.log(`Cache ${this.name} purged, ${startingTotal - this.totalImages()} images removed`);
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

		console.log(`Cache ${this.name} stats: ${[...Object.entries(stats)].map(e => e[0] + ": " + e[1]).join(", ")}`);
	}

	/**
	 * Get the count of cached images.
	 */
	totalImages() { return this.cache.size; }
}
