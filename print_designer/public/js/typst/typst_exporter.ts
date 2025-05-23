import { TypstDocumentBuilder } from "@typst/typst_converter/TypstDocumentBuilder";
import type { Layout, Settings } from "@typst/typst_converter/types";

// Direct OOP usage (recommended)
export { TypstDocumentBuilder };

// (Optional) Legacy API for quick function-style usage:
export function convertToTypst(layout: Layout, settings: Settings): string {
	const builder = new TypstDocumentBuilder(layout, settings);
	return builder.build();
}
