import type { PaddingValues } from "@typst/typst_converter/types";
import { toPt } from "@typst/typst_converter/utils/size";

export function extractTablePadding(style: Record<string, unknown>): string | undefined {
	const padding: PaddingValues = {
		paddingTop: style.paddingTop as string,
		paddingRight: style.paddingRight as string,
		paddingBottom: style.paddingBottom as string,
		paddingLeft: style.paddingLeft as string,
	};

	const paddingParts: string[] = [];

	for (const [side, value] of Object.entries(padding)) {
		if (typeof value === "string" && value.trim().endsWith("px")) {
			const pt = toPt(value);
			if (pt !== undefined) paddingParts.push(pt);
		}
	}

	// Typst expects shorthand padding (top right bottom left)
	// Only return if we have all 4 sides
	if (paddingParts.length === 4) {
		return `padding: (${paddingParts.join(", ")})`;
	}

	return;
}