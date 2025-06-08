import { toMm } from "@typst/typst_converter/utils/size";
import type { Settings } from "@typst/typst_converter/types";
import type { PageMargin } from "@typst/typst_converter/types";


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
	lines.push(formatMargin(page.margin));

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

export function formatMargin(margin?: PageMargin): string {
	if (!margin) return "margin: (top: 0mm, right: 0mm, bottom: 0mm, left: 0mm)";

	const top = toMm(margin.top || 0);
	const right = toMm(margin.right || 0);
	const bottom = toMm(margin.bottom || 0);
	const left = toMm(margin.left || 0);

	if (top === right && right === bottom && bottom === left) {
		return `margin: ${top},`;
	}

	return `margin: (
    top: ${top},
    bottom: ${bottom},
    left: ${left},
    right: ${right}
  ),`;
}