export function cssColorWithOpacityToTypstHex(
  color: string,
  opacity?: number
): string {
  const hex = color.replace("#", "").trim();
  const alpha = opacity !== undefined
    ? Math.round(opacity * 255).toString(16).padStart(2, "0")
    : "";
  return `rgb("#${hex}${alpha}")`;
}
