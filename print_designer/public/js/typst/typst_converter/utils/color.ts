export function toTypstHex(
  context: "block" | "text",
  color?: string,
  opacity?: number
): string | null {
  if (typeof color !== "string" || !color.startsWith("#")) return null;

  let hex = color.slice(1).toLowerCase();

  if (context === "text" && opacity !== undefined) {
    const alpha = Math.round(Math.max(0, Math.min(opacity, 1)) * 255)
      .toString(16)
      .padStart(2, "0");
    hex = hex.slice(0, 6) + alpha;
  }

  // Accept both 6-digit and 8-digit formats
  if (hex.length === 6 || hex.length === 8) {
    return `rgb("#${hex}")`;
  }

  return null;
}