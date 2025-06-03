export function cssTextAlignToTypst(value: string): string {
	switch (value) {
		case "left":
			return "left";
		case "right":
			return "right";
		case "center":
			return "center";
		case "justify":
			return "justify";
		default:
			return "left";
	}
}

export function translateFontWeight(weight: string | number): string {
  const weightMap: Record<number, string> = {
    100: "thin",
    200: "extralight",
    300: "light",
    400: "regular",
    500: "medium",
    600: "semibold",
    700: "bold",
    800: "extrabold",
    900: "black",
  };

  const num = typeof weight === "string" ? parseInt(weight, 10) : weight;

  if (weightMap[num]) {
    return `"${weightMap[num]}"`;
  }

  // If weight is a known string like "bold", pass it through
  if (typeof weight === "string" && isNaN(num)) {
    return `"${weight}"`;
  }

  // Fallback to regular
  return `"regular"`;
}

export function extractParAttributes(style: Record<string, unknown>): string[] {
	const attrs: string[] = [];

	// lineHeight → leading
	if (typeof style.lineHeight === "number" && style.lineHeight > 0) {
		attrs.push(`leading: ${style.lineHeight}pt`);
	}

	// textAlign → justify
	if (style.textAlign === "justify") {
		attrs.push(`justify: true`);
	}

	return attrs;
}

export function sanitizeFontFamily(input: string): string | undefined {
	const fontList = input
		.split(",")
		.map(f => f.trim().replace(/^["']|["']$/g, "")) // Remove quotes
		.filter(name =>
			name &&
			!["sans-serif", "serif", "monospace"].includes(name.toLowerCase())
		);

	// Fallback fonts
	fontList.push("Arial", "Helvetica");

	const uniqueFonts = [...new Set(fontList)];

	if (uniqueFonts.length) {
		return uniqueFonts.join(", ");
	}

	return;
}