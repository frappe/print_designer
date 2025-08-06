import type { PaddingValues } from "@typst/typst_converter/types";
import { toPt } from "@typst/typst_converter/utils/size";

export function extractStroke(style: Record<string, unknown>): string | null {
	const width = parseFloat(style.borderWidth as string) || 0;
	const color = typeof style.borderColor === "string" ? style.borderColor : "";
	const styleType = typeof style.borderStyle === "string" ? style.borderStyle : "solid";

	if (!color || width <= 0 || styleType === "none") return null;

	// Later we can extract cap, join, dash, etc. from style
	return buildStroke(width, color);
}

export function extractOpacity(style: Record<string, unknown>): number | null {
	const raw = style.opacity;

	if (typeof raw === "number") return isValid(raw) ? raw : null;
	if (typeof raw === "string") {
		const parsed = parseFloat(raw);
		return isValid(parsed) ? parsed : null;
	}

	return null;

	function isValid(value: number): boolean {
		return !isNaN(value) && value >= 0 && value <= 1;
	}
}

export function buildStroke(
	width: number,
	color: string,
	cap?: string,
	join?: string,
	dash?: string
): string {
	const parts: string[] = [`paint: rgb("${color}")`, `thickness: ${width.toFixed(2)}pt`];

	if (cap) parts.push(`cap: "${cap}"`);
	if (join) parts.push(`join: "${join}"`);
	if (dash) parts.push(`dash: "${dash}"`);

	return `stroke: (${parts.join(", ")})`;
}


/**
 * Format padding for Typst `padding` parameter in table/cell blocks.
 * Outputs: `padding: value` or `padding: (top, right, bottom, left)`
 */
export function formatPadding(padding: PaddingValues): string | null {
	const top = toPt(padding.paddingTop);
	const right = toPt(padding.paddingRight);
	const bottom = toPt(padding.paddingBottom);
	const left = toPt(padding.paddingLeft);

	if (!top && !right && !bottom && !left) return null;

	if (top === right && right === bottom && bottom === left) {
		return `padding: ${top}`;
	}

	return `padding: (${top ?? "0pt"}, ${right ?? "0pt"}, ${bottom ?? "0pt"}, ${left ?? "0pt"})`;
}

/**
 * Format inset for Typst `inset` parameter in block().
 * Same logic as `formatPadding`, but emits `inset:` instead.
 */
export function formatInset(padding: PaddingValues): string | null {
	const top = toPt(padding.paddingTop);
	const right = toPt(padding.paddingRight);
	const bottom = toPt(padding.paddingBottom);
	const left = toPt(padding.paddingLeft);

	if (!top && !right && !bottom && !left) return null;

	if (top === right && right === bottom && bottom === left) {
		return `inset: ${top}`;
	}

	return `inset: (${top ?? "0pt"}, ${right ?? "0pt"}, ${bottom ?? "0pt"}, ${left ?? "0pt"})`;
}

export function extractPaddingFromStyle(style: Record<string, unknown>): PaddingValues {
  return {
    paddingTop: style.paddingTop as string,
    paddingRight: style.paddingRight as string,
    paddingBottom: style.paddingBottom as string,
    paddingLeft: style.paddingLeft as string,
  };
}