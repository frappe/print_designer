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
