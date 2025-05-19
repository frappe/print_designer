export const STANDARD_SIZES = {
  A4:     { width: 210,   height: 297, unit: 'mm' },
  A5:     { width: 148,   height: 210, unit: 'mm' },
  Letter: { width: 8.5,   height: 11,  unit: 'in' },
  Legal:  { width: 8.5,   height: 14,  unit: 'in' },
  // Add more as needed
};

export function toMm(px: number | string): string {
  const value = typeof px === "string" ? parseFloat(px) : px;
  return (value * 25.4 / 96).toFixed(2) + 'mm';
}

export function toPt(px: number | string): string {
  let value: number;
  if (typeof px === "string") {
    value = px.endsWith("px") ? parseFloat(px) : parseFloat(px);
  } else {
    value = px;
  }
  return (value / 1.333).toFixed(2) + 'pt';
}

// If you want parseCssSize here as well:
export function parseCssSize(value: number | string | undefined, defaultUnit: string = "mm"): string {
  if (value === undefined || value === "0" || value === "0px") return `0${defaultUnit}`;
  if (typeof value === "number") return value + defaultUnit;
  if (typeof value === "string" && (value.endsWith("mm") || value.endsWith("in") || value.endsWith("pt"))) return value;
  if (typeof value === "string" && value.endsWith("px")) {
    return toMm(parseFloat(value));
  }
  return toMm(parseFloat(value));
}
