import type { Settings, GlobalStyleBlock } from "@typst/typst_converter/types";
import {
	cssTextAlignToTypst,
	extractParAttributes,
	translateFontWeight,
	sanitizeFontFamily,
} from "@typst/typst_converter/utils/text";
import { extractStroke, extractOpacity } from "@typst/typst_converter/utils/block";
import { toTypstHex } from "@typst/typst_converter/utils/color";

export function renderGlobalStyles(settings: Settings): string {
	const blocks: string[] = [];

	const globalStyles = settings.globalStyles;
	if (!globalStyles) return "";

	const definitions: Record<string, GlobalStyleBlock | undefined> = {
		staticText: globalStyles.staticText,
		dynamicText: globalStyles.dynamicText,
		image: globalStyles.image,
		barcode: globalStyles.barcode,
		// table: globalStyles.table,
	};

	for (const [key, styleBlock] of Object.entries(definitions)) {
		if (styleBlock?.style) {
			const definition = renderGlobalStyleDefinition(key, styleBlock.style);
			if (definition) blocks.push(definition);
		}
	}

	return blocks.join("\n\n");
}

function renderGlobalStyleDefinition(
	name: string,
	style: Record<string, unknown>
): string {
	const body = "[#body]";

	let rendered = "";
	if (name === "image") {
		rendered = renderImageBlock(style, body);
	} else if (name === "barcode") {
		rendered = renderBarcodeBlock(style, body);
	} else {
		rendered = renderTextBlock(style, body);
	}

	if (!rendered.trim()) return "";
	return `#let ${name}(body) = {\n${rendered}\n}`;
}

function renderTextBlock(
	style: Record<string, unknown>,
	body: string
): string {
	const textAttrs: string[] = [];
	const parAttrs: string[] = [];
	const blockAttrs: string[] = [];

	// Extract opacity as number if valid
	const opacity = extractOpacity(style);


	/**
	 * Block attributes redering
	 */
	if (typeof style.backgroundColor === "string" && style.backgroundColor.trim()) {
		const blockFill = toTypstHex("block", style.backgroundColor, opacity ?? undefined);
		if (blockFill) blockAttrs.push(`fill: ${blockFill}`);
	}

	if (typeof style.borderRadius === "string" && style.borderRadius.endsWith("px")) {
		const radius = parseFloat(style.borderRadius);
		if (!isNaN(radius)) blockAttrs.push(`radius: ${radius.toFixed(2)}pt`);
	}

	const stroke = extractStroke(style);
	if (stroke) blockAttrs.push(stroke);

	/**
	 * Text attributes rendering
	 */
	const font = sanitizeFontFamily(style.fontFamily as string);
	if (font) {
		textAttrs.push(`font: "${font}"`);
	}

	if (typeof style.fontSize === "string" && style.fontSize.endsWith("px")) {
		const px = parseFloat(style.fontSize);
		if (!isNaN(px)) textAttrs.push(`size: ${px.toFixed(2)}pt`);
	}

	if (typeof style.fontWeight === "number" || typeof style.fontWeight === "string") {
		textAttrs.push(`weight: ${translateFontWeight(style.fontWeight)}`);
	}

	if (style.fontStyle === "italic" || style.fontStyle === "oblique") {
		textAttrs.push(`style: "${style.fontStyle}"`);
	}

	if (typeof style.color === "string" && style.color.trim()) {
		const textFill = toTypstHex("text", style.color, opacity ?? undefined);
		if (textFill) textAttrs.push(`fill: ${textFill}`);
	}

	if (typeof style.letterSpacing === "string" && style.letterSpacing.endsWith("px")) {
		const spacing = parseFloat(style.letterSpacing);
		if (!isNaN(spacing)) textAttrs.push(`tracking: ${spacing.toFixed(2)}pt`);
	}

	// PAR LEVEL
	parAttrs.push(...extractParAttributes(style));

	// ALIGN
	const align = cssTextAlignToTypst(style.textAlign as string);

	if (!textAttrs.length && !parAttrs.length && !blockAttrs.length && align === "left") {
		return "";
	}

	const textBlockimageBlockLines: string[] = [];

	if (align) {
		textBlockimageBlockLines.push(`  set align(${align})`);
	}

	textBlockimageBlockLines.push("  block(");

	if (blockAttrs.length) {
		textBlockimageBlockLines.push(`    ${blockAttrs.join(",\n    ")},`);
	}

	textBlockimageBlockLines.push("    par(");

	if (parAttrs.length) {
		textBlockimageBlockLines.push(`      ${parAttrs.join(",\n      ")},`);
	}

	textBlockimageBlockLines.push("      text(");

	if (textAttrs.length) {
		textBlockimageBlockLines.push(`        ${textAttrs.join(",\n        ")},`);
	}

	textBlockimageBlockLines.push(`        ${body}`);
	textBlockimageBlockLines.push("      )");
	textBlockimageBlockLines.push("    )");
	textBlockimageBlockLines.push("  )");

	return textBlockimageBlockLines.join("\n");
}

function renderImageBlock(
	style: Record<string, unknown>,
	body: string
): string {
	const blockAttrs: string[] = [];

	const opacity = extractOpacity(style);

	if (typeof style.backgroundColor === "string" && style.backgroundColor.trim()) {
		const fill = toTypstHex("block", style.backgroundColor, opacity ?? undefined);
		if (fill) blockAttrs.push(`fill: ${fill}`);
	}

	if (typeof style.borderRadius === "string" && style.borderRadius.endsWith("px")) {
		const radius = parseFloat(style.borderRadius);
		if (!isNaN(radius)) blockAttrs.push(`radius: ${radius.toFixed(2)}pt`);
	}

	const stroke = extractStroke(style);
	if (stroke) blockAttrs.push(stroke);

	const align = cssTextAlignToTypst(style.textAlign as string || "left");

	/**
	 * No useful attributes? Return empty string.
	 */
	if (align === "left" && blockAttrs.length === 0) {
		return "";
	}

	const imageBlockLines: string[] = [];

	if (align) imageBlockLines.push(`  set align(${align})`);

	imageBlockLines.push("  block(");

	if (blockAttrs.length) {
		imageBlockLines.push(`    ${blockAttrs.join(",\n    ")},`);
	}

	imageBlockLines.push(`    ${body}`);
	imageBlockLines.push("  )");

	return imageBlockLines.join("\n");
}

function renderBarcodeBlock(
	style: Record<string, unknown>,
	body: string
): string {
	const blockAttrs: string[] = [];

	const opacity = extractOpacity(style);

	if (typeof style.backgroundColor === "string" && style.backgroundColor.trim()) {
		const fill = toTypstHex("block", style.backgroundColor, opacity ?? undefined);
		if (fill) blockAttrs.push(`fill: ${fill}`);
	}

	if (typeof style.borderRadius === "string" && style.borderRadius.endsWith("px")) {
		const radius = parseFloat(style.borderRadius);
		if (!isNaN(radius)) blockAttrs.push(`radius: ${radius.toFixed(2)}pt`);
	}

	const stroke = extractStroke(style);
	if (stroke) blockAttrs.push(stroke);

	// Optional: Align barcode to left (can be extended later)
	const align = cssTextAlignToTypst(style.textAlign as string || "left");

	// Skip output if nothing is customized
	if (!blockAttrs.length && align === "left") return "";

	const barcodeLines: string[] = [];

	if (align) barcodeLines.push(`  set align(${align})`);

	barcodeLines.push("  block(");

	if (blockAttrs.length) {
		barcodeLines.push(`    ${blockAttrs.join(",\n    ")},`);
	}

	barcodeLines.push(`    ${body}`);
	barcodeLines.push("  )");

	return barcodeLines.join("\n");
}