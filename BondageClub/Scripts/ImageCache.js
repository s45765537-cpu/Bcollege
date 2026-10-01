"use strict";

/**
 * What state is the image in.
 *
 * - UNCACHED (initial) -> LOADING
 * - LOADING -> LOADED (final)
 * - LOADING -> ERRORED (entering retry loop)
 * - ERRORED -> LOADING
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
	/** Image is being loaded, but experiencing an error and will be retried */
	ERRORED: 'errored',
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
		/** @type {number} */
		this.errorCount = 0;
		/** @type {number | null} */
		this.backoffTimer = null;
		/** @type {CachedImage.LifetimeCallback | undefined} */
		this.loadCallback = options?.loadCallback;
		/** @type {CachedImage.LifetimeCallback | undefined} */
		this.unloadCallback = options?.unloadCallback;
		/** @type {HTMLImageElement | HTMLCanvasElement | null} */
		this.element = null;
		/** @type {ImageMetadata} */
		this.userData = {};
		/** @type {number} */
		this.lastUsed = 0;
		/** @type {boolean} */
		this.manual = false;
	}

	/**
	 * Load the cached image if it's not already available
	 */
	load() {
		// Ensure there's only one image load in progress
		if (this.isLoading() || this.isDoneLoading()) return;

		// Get a new image element to perform the loading for us
		this.element = new Image();

		// Set up listeners to keep track of the loading process
		this.element.addEventListener("load", () => {
			this.state = CachedImageState.LOADED;
			this.cache._imageStateDidChange(this);
		});

		this.element.addEventListener("error", () => {
			this.state = CachedImageState.ERRORED;
			this.cache._imageStateDidChange(this);
		});

		// Start loading, reset error count
		this.errorCount = 0;
		this._refresh();
	}

	/**
	 * Unload the image from the cache
	 */
	unload() {
		if (this.state === CachedImageState.UNCACHED) return;

		if (this.unloadCallback)
			this.unloadCallback(this);

		// Workaround to get Safari to free up canvas memory quicker
		// https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/
		const canvas = this.element;
		if (canvas instanceof HTMLCanvasElement) {
			canvas.width = 1;
			canvas.height = 1;
			const ctx = canvas.getContext('2d');
			if (ctx) ctx.clearRect(0, 0, 1, 1);
		}

		if (this.backoffTimer)
			clearTimeout(this.backoffTimer);

		this.element = null;
		this.userData = {};
		this.state = CachedImageState.UNCACHED;
	}

	/**
	 * Manually set the cached image to the given element.
	 * @param {HTMLImageElement | HTMLCanvasElement} element - The element to set
	 */
	setElement(element) {
		this.unload();
		this.element = element;
		this.errorCount = 0;
		this.state = CachedImageState.LOADED;
		this.manual = true;
		this.cache._imageStateDidChange(this);
	}

	/**
	 * Refresh the given image.
	 */
	_refresh() {
		if ([CachedImageState.LOADING, CachedImageState.FAILED].includes(this.state)) return;

		this.unload();
		if (this.element instanceof HTMLImageElement) {
			this.state = CachedImageState.LOADING;
			this.element.crossOrigin = "anonymous";
			// On the third attempt, we try without the crossOrigin
			// TODO: this needs to be looked at closer
			if (this.errorCount == 2) this.element.crossOrigin = null;
			this.element.src = this.url;
		} else {
			// Canvas element, mark it as failed so the purge yanks it,
			// or it gets manually set by the drawing system.
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
	isLoading() { return [CachedImageState.LOADING, CachedImageState.ERRORED].includes(this.state); }

	/**
	 * Is the image loading complete (either succesfully or not)?
	 */
	isDoneLoading() { return [CachedImageState.LOADED, CachedImageState.FAILED].includes(this.state); }

	/**
	 * Is the image experiencing problems loading?
	 */
	isFailing() { return [CachedImageState.FAILED, CachedImageState.ERRORED].includes(this.state); }

	/**
	 * Is the image loaded and ready?
	 */
	isLoaded() { return this.state == CachedImageState.LOADED; }

	/** Get the image's width */
	get width() {
		return this.isLoaded() && this.element ? this.element.width : 0;
	}

	/** Get the image's height */
	get height() {
		return this.isLoaded() && this.element ? this.element.height : 0;
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
		this.loadedCount = 0;
		this.missingCount = 0;
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
	 * Add a cached image to the cache.
	 * @param {string} url - The URL of the image to store
	 * @param {HTMLImageElement|HTMLCanvasElement} image - The element to use as the image
	 * @param {CachedImage.Options} [options]
	 * @returns CachedImage
	 */
	set(url, image, options = {}) {
		let img = new CachedImage(this, url, options);
		this.delete(url);

		this.cache.set(url, img);
		img.setElement(image);
		return img;
	}

	/**
	 * Remove a cached image by its URL.
	 * @param {string} url - The URL of the image to delete
	 */
	delete(url) {
		const known = this.cache.get(url);
		if (!known) return;

		// That's already in the cache, correct our counters depending on the state
		if (known.isLoaded())
			this.loadedCount -= 1;
		else if (known.isFailing())
			this.missingCount -= 1;

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

		this.loadedCount = 0;
		this.missingCount = 0;
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

		const RetryTimers = [1000, 10000, 30000, 60000, 120000, 300000];
		if (image.isLoaded()) {
			// That image had some failure before we finally succeeded, meaning
			// it has been considered missing at some point.
			if (image.errorCount > 0) {
				this.missingCount -= 1;
				image.errorCount = 0;
			}

			this.loadedCount += 1;
			if (image.loadCallback)
				image.loadCallback(image);

			this._refreshCharactersForImage(image);
		} else if (image.state == CachedImageState.ERRORED) {
			// First reported failure, count it as a missing image
			if (image.errorCount === 0)
				this.missingCount += 1;
			image.errorCount += 1;

			// Attempt to refresh again, waiting increasingly longer in case it's
			// a transient issue.
			if (image.errorCount < RetryTimers.length) {
				let backoff = RetryTimers[image.errorCount - 1];
				if (!image.backoffTimer) {
					console.warn("Error loading image, retrying after " + backoff + "ms: " + image.url);
					image.backoffTimer = setTimeout(() => {
						image.backoffTimer = null;
						image._refresh();
					}, backoff);
				}
			} else {
				// Load failed. Display the error in the console and mark it as failed.
				console.error("Failed to load image " + image.url);
				image.state = CachedImageState.FAILED;
				this._refreshCharactersForImage(image);
			}
		}
	}

	/**
	 * Given an image, refresh all characters that would be impacted by its load
	 *
	 * @param {CachedImage<ImageMetadata>} img
	 * @returns {void}
	 */
	_refreshCharactersForImage(img) {
		if (!img || !img.isAsset() || img.manual || !(img.element instanceof HTMLImageElement)) return;

		const url = new URL(img.element.src);
		const path = url.pathname;
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
			if (image.state == CachedImageState.ERRORED
				|| image.state == CachedImageState.FAILED
				|| image.lastUsed && (image.lastUsed + (ImageCachePurgeDelay / 2)) < CommonTime()) {
				this.delete(url);
			}
		});
		console.log(`Cache purged, ${startingTotal - this.totalImages()} images removed`);
		this.lastPurge = CurrentTime;
		this.stats();
	}

	/**
	 * Output some stats about the cache and recalculate our counts
	 */
	stats() {
		/** @type {{ [key: string]: number}} */
		let stats = { total: this.cache.size, loaded: 0, missing: 0, errored: 0 };
		this.cache.forEach((image) => {
			// Clear errored images
			if (image.state == CachedImageState.ERRORED) {
				stats.missing += 1;
			} else if (image.state == CachedImageState.FAILED) {
				stats.missing += 1;
			} else if (image.state == CachedImageState.LOADED) {
				stats.loaded += 1;
				// Sort loaded images into 5-minute wide "generations"
				const key = `gen${Math.floor((CurrentTime - image.lastUsed) / (5 * 60 * 1000))}`;
				stats[key] = (stats[key] || 0) + 1;
			}
		});

		this.loadedCount = stats.loaded;
		this.missingCount = stats.missing + stats.errored;

		console.log(`Cache stats: ${[...Object.entries(stats)].map(e => e[0] + ": " + e[1]).join(", ")}`);
	}

	/**
	 * Get the count of cached images.
	 */
	totalImages() { return this.cache.size; }

	/**
	 * Get the count of loaded images.
	 */
	loadedImages() { return this.loadedCount; }

	/**
	 * Get the count of missing images (failing or errored).
	 */
	missingImages() { return this.missingCount; }
}

const ImageCache = /** @type {ImageCacheClass<GLImageMetadata>} */ (new ImageCacheClass());
