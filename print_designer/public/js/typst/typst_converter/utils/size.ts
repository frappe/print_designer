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


export function toPt(value: number | string): string {
  const px = typeof value === "string" ? parseFloat(value) : value;
  const pt = (px * 72) / 96;
  return `${pt.toFixed(2)}pt`;
}
