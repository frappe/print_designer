export const STANDARD_SIZES = {
	A4: { width: 210, height: 297, unit: "mm" },
	A5: { width: 148, height: 210, unit: "mm" },
	Letter: { width: 8.5, height: 11, unit: "in" },
	Legal: { width: 8.5, height: 14, unit: "in" },
	// Add more as needed
};


export function toMm(value: number | string): string {
  const px = typeof value === "string" ? parseFloat(value) : value;
  const mm = (px * 25.4) / 96;
  return `${mm.toFixed(2)}mm`;
}


export function toPt(value?: string | number): string {
	if (typeof value === "number") return `${value.toFixed(2)}pt`;

	if (typeof value === "string") {
		let parsed = parseFloat(value);
		if (!isNaN(parsed)) {
			if (value.endsWith("px")) {
				parsed *= 0.75;
			}
			return `${parsed.toFixed(2)}pt`;
		}
	}

	return "0pt";
}