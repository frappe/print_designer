// apps/print_designer/print_designer/public/js/typst/typst_converter/utils/text.ts

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
