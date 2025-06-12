import { renderImage } from "@typst/typst_converter/core/elements/image";
import { renderRectangle } from "@typst/typst_converter/core/elements/rectangle";
import { renderText } from "@typst/typst_converter/core/elements/text";
import type {
	Element,
	ImageElement,
	RectangleElement,
	TextElement,
} from "@typst/typst_converter/types";

export function renderElement(el: Element): string {
	switch (el.type) {
		case "text":
			return renderText(el as TextElement);
		case "rectangle":
			return renderRectangle(el as RectangleElement);
		case "image":
			return renderImage(el as ImageElement);
		default: {
			// TypeScript will enforce exhaustiveness
			const _exhaustiveCheck: never = el;
			console.error(
				"Unsupported element type in renderElement:",
				// Print the actual type for debugging
				(el as { type?: string }).type ?? el,
			);
			return `% [UNSUPPORTED]: ${(el as { type?: string }).type ?? "[UNKNOWN]"}`;
		}
	}
}
