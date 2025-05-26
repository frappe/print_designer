import type { ImageElement } from "@typst/typst_converter/types";

export function renderImage(el: ImageElement): string {
	const img = el.image || {};
	const url = img.file_url || img.value || "";
	const width = el.width ? `width: ${el.width}, ` : "";
	const height = el.height ? `height: ${el.height}, ` : "";
	return `#image("${url}", ${width}${height}fit: cover)`;
}
