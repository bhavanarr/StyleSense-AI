import type { ProductPhoto } from "@/types";

/**
 * Real product photography, keyed by product id. EMPTY ON PURPOSE.
 * Only add a photo here when you have the rights to use it, and fill in `credit` and `licenseNote`.
 * Example:
 *   "kasa-oxford-white": [{ src: "/products/kasa-oxford-white.jpg", alt: "Model wearing a white oxford shirt",
 *                           credit: "Kasa & Co", licenseNote: "Supplied by brand for this project" }],
 * Remote https images also need their host added to `images.remotePatterns` in next.config.mjs.
 */
export const productPhotos: Record<string, ProductPhoto[]> = {};
