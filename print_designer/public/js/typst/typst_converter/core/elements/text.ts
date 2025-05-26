import type { TextElement } from "@typst/typst_converter/types";
<<<<<<< HEAD
import { indent } from "@typst/typst_converter/utils/indent"; // or the correct path

export function renderText(el: TextElement) {
	const style = el.style || {};
	const leading = style.lineHeight ? `, leading: ${style.lineHeight}` : "";
	const dynamicLines = (el.dynamicContent || [])
		.map((dc) => {
			if (dc.is_static || dc.print_hide) return null;
			const label = (dc.label || "").trim().replace(/:$/, "");
			const field = dc.fieldname?.trim();
			if (!field) return null;
			const labelPrefix = label ? `${label}: ` : "";
			return `${labelPrefix}{{ ${field} }}`;
		})
		.filter(Boolean)
		.join("\\\\\n");
	return `#align(left)[\n#text[\n${indent(dynamicLines)}\n]${leading}\n]`;
}
=======
import { indent } from "@typst/typst_converter/utils/indent";
import { toPt } from "@typst/typst_converter/utils/size";
import { textOrTableStyleToTypst } from "@typst/typst_converter/core/style";

/**
 * Render a TextElement as Typst code using #place and #block.
 */
export function renderText(el: TextElement): string {
	const style = el.style || {};
	const dx = el.pageX ? toPt(el.pageX) : "0pt";
	const dy = el.pageY ? toPt(el.pageY) : "0pt";
	const width = el.width ? toPt(el.width) : undefined;
	const height = el.height ? toPt(el.height) : undefined;

	// Compose Typst block options
	const blockOptions: string[] = [];
	const styleStr = textOrTableStyleToTypst(style);
	if (styleStr) blockOptions.push(styleStr);
	if (width) blockOptions.push(`width: ${width}`);
	if (height) blockOptions.push(`height: ${height}`);

	// Compose text content: prefer dynamicContent, fallback to content/static
	let textLines: string[] = [];

	if (Array.isArray(el.dynamicContent) && el.dynamicContent.length) {
		for (const dc of el.dynamicContent) {
			if (dc.print_hide) continue; // skip hidden
			if (dc.is_static && dc.label) {
				// Render static label as-is
				textLines.push(dc.label);
			} else if (dc.fieldname) {
				const label = dc.label ? dc.label.replace(/:$/, "") + ": " : "";
				textLines.push(`${label}{{ ${dc.fieldname} }}`);
			}
		}
	}
	// Fallback: static text (e.g., el.content or el.label, handle gracefully)
	if (textLines.length === 0 && (el as any).content) {
		textLines.push((el as any).content);
	}

	// If still empty, render a placeholder (for debugging)
	if (textLines.length === 0) {
		textLines.push("%[EMPTY TEXT]");
	}

	const typstText = textLines.join("\\\\\n"); // Typst linebreaks

	return `#place(dx: ${dx}, dy: ${dy})[
  #block(${blockOptions.join(", ")})[
${indent(typstText)}
  ]
]`;
}
>>>>>>> 2630548 (Recovered!)
