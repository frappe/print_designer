export function cssColorWithOpacityToTypstHex(
	color: string,
	opacity?: number,
): string {
	if (typeof color !== "string" || !color.startsWith("#")) return color;
	let hex = color.slice(1);
	if (hex.length === 3)
		hex = hex
			.split("")
			.map((x) => x + x)
			.join("");
	if (hex.length === 8) return `#${hex}`; // already with alpha
	if (hex.length !== 6) return `#${hex}`; // fallback
	let o = Number(opacity);
	if (!Number.isFinite(o) || o < 0 || o > 1) o = 1;
	const alpha = Math.round(o * 255);
	const alphaHex = alpha.toString(16).padStart(2, "0");
	return `#${hex}${alphaHex}`;
}
