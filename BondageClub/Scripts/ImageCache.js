"use strict";

/**
 * What state is the image in.
 * @enum string
 */
const CachedImageState = {
	UNCACHED: 'uncached',
	LOADING: 'loading',
	LOADED: 'loaded',
	ERRORED: 'errored',
	FAILED: 'failed',
};

/**
 * A callback called when an image is loaded.
 * @typedef {function(CachedImage):void} ImageLoadCallback
 */

/**
 * Cached image data
 */
class CachedImage {
	/**
	 * Create a new cached image.
	 *
	 * @param {ImageCacheClass} cache - The cache holding the image
	 * @param {string} url - The URL for the image to cache
	 * @param {ImageLoadCallback} [loadCallback] - The function to call when the image loads
	 */
	constructor(cache, url, loadCallback = null) {
		/**
		 * Only used to inform the cache of loading progress
		 * @type ImageCacheClass
		 * @private
		 */
		this.cache = cache;
		/** @type string */
		this.url = url;
		/** @type CachedImageState */
		this.state = CachedImageState.UNCACHED;
		/** @type number */
		this.errorCount = 0;
		/** @type {function(CachedImage):void} */
		this.loadCallback = loadCallback;
		/** @type HTMLImageElement */
		this.element = null;
		/** @type {{ width: number; height: number; texture: WebGLTexture; }} */
		this.textureInfo = null;
	}

	/**
	 * Load the cached image if it's not already available
	 */
	load() {
		if ((this.state == CachedImageState.LOADING) || (this.state == CachedImageState.LOADED))
			return;

		// Get a new image element to perform the loading for us
		this.element = new Image();

		// Set up listeners to keep track of the loading process
		this.element.addEventListener("load", () => {
			this.errorCount = 0;
			this.state = CachedImageState.LOADED;
			this.cache._imageStateDidChange(this);
		});

		this.element.addEventListener("error", () => {
			this.errorCount += 1;
			this.state = CachedImageState.ERRORED;
			this.cache._imageStateDidChange(this);
		});

		// Start loading, reset error count
		this.errorCount = 0;
		this._refresh();
	}

	/**
	 * Manually set the cached image to the given element.
	 * @param {HTMLImageElement} element - The element to set
	 */
	setElement(element) {
		this.element = element;
		this.errorCount = 0;
		this.state = CachedImageState.LOADED;
		this.cache._imageStateDidChange(this);
	}

	/**
	 * Refresh the given image.
	 */
	_refresh() {
		this.state = CachedImageState.LOADING;
		this.textureInfo = null;
		this.element.src = this.url;
	}

	/**
	 * Is the image an asset image?
	 * @returns boolean
	 */
	isAsset() { return (this.url.indexOf("Assets") >= 0); }

	/**
	 * Is the image loaded?
	 */
	isLoaded() { return this.state == CachedImageState.LOADED; }
}

/**
 * The class responsible for loading and caching images
 */
class ImageCacheClass {
	constructor() {
		/** @type {Map<string, CachedImage>} */
		this.cache = new Map();
		this.loadedCount = 0;
	}

	/**
	 * Get a cached image from the cache.
	 *
	 * @param {string} url - The URL of the image to lookup
	 * @param {function(CachedImage):void} loadCallback - A callback that will be called when the load completes
	 * @returns {CachedImage} The cached image
	 */
	get(url, loadCallback = null) {
		let image = this.cache.get(url);
		if (!image) {
			image = new CachedImage(this, url, loadCallback);
			this.cache.set(url, image);
		}

		// start loading the image
		image.load();

		// returns the final image
		return image;
	}

	/**
	 * Add a cached image to the cache.
	 * @param {string} url - The URL of the image to store
	 * @param {HTMLImageElement|HTMLCanvasElement} image - The element to use as the image
	 */
	set(url, image) {
		let img = new CachedImage(this, url);
		let realImage = null;
		if (image instanceof HTMLCanvasElement) {
			realImage = new Image();
			realImage.src = image.toDataURL();
		} else {
			realImage = image;
		}
		img.setElement(realImage);
		this.loadedCount += 1;
		this.cache.set(url, img);
	}

	/**
	 * Remove a cached image by its URL.
	 * @param {string} url - The URL of the image to delete
	 */
	delete(url) {
		this.cache.delete(url);
	}

	/**
	 * Iterate over all cached images
	 * @param {any} callback - The callback to call on each (URL, image) pair
	 */
	forEach(callback) {
		this.cache.forEach(callback);
	}

	/**
	 * Clear all cached images
	 */
	clear() {
		this.cache.clear();
		this.loadedCount = 0;
	}

	/**
	 * Private function called when an image state changes.
	 *
	 * @param {CachedImage} image - The image whose state changed
	 */
	_imageStateDidChange(image) {
		const RetryTimers = [1000, 10000, 30000, 60000, 120000, 300000];
		if (image.state == CachedImageState.LOADED) {
			this.loadedCount += 1;
			if (image.loadCallback)
				image.loadCallback(image);

			if (this.loadedImages() == this.totalImages()) CharacterLoadCanvasAll();
		} else if (image.state == CachedImageState.ERRORED) {
			if (image.errorCount < RetryTimers.length) {
				let backoff = RetryTimers[image.errorCount - 1];
				console.log("Error loading image, retrying after " + backoff + "ms: " + image.url);
				setTimeout(() => {
					image._refresh();
				}, backoff);
			} else {
				// Load failed. Display the error in the console and mark it as failed.
				console.log("Failed to load image " + image.url);
				image.state = CachedImageState.FAILED;
				if (this.loadedImages() == this.totalImages()) CharacterLoadCanvasAll();
			}
		}
	}

	/**
	 * Get the count of cached images.
	 */
	totalImages() { return this.cache.size; }

	/**
	 * Get the count of loaded images.
	 */
	loadedImages() { return this.loadedCount; }
}

const ImageCache = new ImageCacheClass();
