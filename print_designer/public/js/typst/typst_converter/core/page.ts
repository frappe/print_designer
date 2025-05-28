import { toMm } from "@typst/typst_converter/utils/size";
import type { Settings } from "@typst/typst_converter/types";

export function renderPageSettings(settings: Settings): string {
	const page = settings.page;
	if (!page) return "Page Empty";

	const lines: string[] = [];

	// 1. Paper size by key only (e.g. "a4", "letter")
	lines.push(`paper: "${settings.currentPageSize?.toLowerCase() || "a4"}",`);

	// 2. Orientation
	const orientation = page.orientation ?? "portrait";
	lines.push(`flipped: ${orientation === "landscape" ? "true" : "false"},`);

	// 3. Margins
	lines.push(
		`margin: (
		top: ${toMm(page?.margin?.top ?? 0)},
		bottom: ${toMm(page?.marginBottom ?? 0)},
		left: ${toMm(page?.marginLeft ?? 0)},
		right: ${toMm(page?.marginRight ?? 0)}
	),`
	);

	// 4. Header and footer boxes
	if (page.headerHeight) {
		lines.push(`header: [\n  #box(height: ${toMm(page.headerHeight)})[Header Placeholder]\n],`);
	}

	if (page.footerHeight) {
		lines.push(`footer: [\n  #box(height: ${toMm(page.footerHeight)})[Footer Placeholder]\n],`);
	}

	return `#set page(
  ${lines.filter(Boolean).join("\n  ")}
)`;
}