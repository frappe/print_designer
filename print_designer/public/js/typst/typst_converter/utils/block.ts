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