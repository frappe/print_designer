/**
 * SVG Preloader utility to load SVG resources only when needed
 * This prevents unnecessary preload warnings in browser console
 */

class SVGPreloader {
	constructor() {
		this.loadedSvgs = new Set();
		this.loadingPromises = new Map();
	}

	/**
	 * Load SVG and cache it for immediate use
	 * @param {string} svgPath - Path to the SVG file
	 * @returns {Promise<void>}
	 */
	async preloadSvg(svgPath) {
		if (this.loadedSvgs.has(svgPath)) {
			return Promise.resolve();
		}

		if (this.loadingPromises.has(svgPath)) {
			return this.loadingPromises.get(svgPath);
		}

		const loadPromise = new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				this.loadedSvgs.add(svgPath);
				this.loadingPromises.delete(svgPath);
				resolve();
			};
			img.onerror = () => {
				this.loadingPromises.delete(svgPath);
				reject(new Error(`Failed to load SVG: ${svgPath}`));
			};
			img.src = svgPath;
		});

		this.loadingPromises.set(svgPath, loadPromise);
		return loadPromise;
	}

	/**
	 * Get cursor string with SVG preloading
	 * @param {string} svgPath - Path to the SVG file
	 * @param {string} fallback - Fallback cursor
	 * @param {number} hotspotX - X hotspot position
	 * @param {number} hotspotY - Y hotspot position
	 * @returns {string} CSS cursor value
	 */
	getCursorWithPreload(svgPath, fallback = 'default', hotspotX = 0, hotspotY = 0) {
		// Start loading the SVG in the background
		this.preloadSvg(svgPath).catch(console.warn);
		
		// Return cursor string immediately
		if (hotspotX || hotspotY) {
			return `url('${svgPath}') ${hotspotX} ${hotspotY}, ${fallback}`;
		}
		return `url('${svgPath}'), ${fallback}`;
	}

	/**
	 * Preload multiple SVGs at once
	 * @param {string[]} svgPaths - Array of SVG paths
	 * @returns {Promise<void[]>}
	 */
	async preloadMultiple(svgPaths) {
		const promises = svgPaths.map(path => this.preloadSvg(path));
		return Promise.allSettled(promises);
	}
}

// Create singleton instance
const svgPreloader = new SVGPreloader();

export default svgPreloader;