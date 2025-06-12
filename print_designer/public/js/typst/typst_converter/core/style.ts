import type { StyleObject, TableStyles } from "@typst/typst_converter/types";
import { cssColorWithOpacityToTypstHex } from "@typst/typst_converter/utils/color";
import { parseCssSize } from "@typst/typst_converter/utils/size";
import { toPt } from "@typst/typst_converter/utils/size";
import { cssTextAlignToTypst } from "@typst/typst_converter/utils/text";

export function collectBoxSpacing(
	style: StyleObject,
	prefix = "margin",
): string | null {
	const dirs = ["Top", "Right", "Bottom", "Left"];
	const out: Record<string, string> = {};
	if (style[prefix]) {
		const v = parseCssSize(style[prefix]);
		for (const dir of dirs) {
			out[dir.toLowerCase()] = v;
		}
	}
	for (const dir of dirs) {
		const key = prefix + dir;
		if (style[key]) out[dir.toLowerCase()] = parseCssSize(style[key]);
	}
	const entries = Object.entries(out).filter(([, v]) => v && v !== "0mm");
	if (!entries.length) return null;
	return `${prefix}: (${entries.map(([k, v]) => `${k}: ${v}`).join(", ")})`;
}

export function rectangleStyleToTypst(styleObj: StyleObject): string {
	const lines: string[] = [];
	const marginLine = collectBoxSpacing(styleObj, "margin");
	if (marginLine) lines.push(marginLine);
	const paddingLine = collectBoxSpacing(styleObj, "padding");
	if (paddingLine) lines.push(paddingLine);

	for (const [key, value] of Object.entries(styleObj)) {
		if (
			value === "" ||
			value === "none" ||
			value === undefined ||
			value === null
		)
			continue;

		switch (key) {
			case "backgroundColor":
			case "borderColor":
				// Accept only string colors
				if (typeof value === "string") {
					lines.push(
						key === "backgroundColor"
							? `fill: rgb("${cssColorWithOpacityToTypstHex(value, styleObj.opacity)}")`
							: `stroke: rgb("${cssColorWithOpacityToTypstHex(value, styleObj.opacity)}")`,
					);
				}
				break;
			case "borderWidth":
			case "borderRadius":
				// Accept both string (e.g. '2px') and number
				lines.push(
					`${key === "borderWidth" ? "stroke-width" : "radius"}: ${toPt(
						typeof value === "number" ? value : String(value),
					)}`,
				);
				break;
			case "borderStyle":
				if (typeof value === "string") {
					lines.push(`stroke-style: "${value}"`);
				}
				break;
			// ...other cases as needed
		}
	}
	return lines.join(",\n  ");
}

// --- Dynamic Text Label Style ---
export function dynamicLabelStyleToTypst(labelStyleObj: StyleObject): string {
	const lines: string[] = [];
	for (const [key, value] of Object.entries(labelStyleObj)) {
		if (
			value === "" ||
			value === "none" ||
			value === undefined ||
			value === null
		)
			continue;
		switch (key) {
			case "color":
				if (typeof value === "string") {
					lines.push(
						`fill: rgb("${cssColorWithOpacityToTypstHex(value, labelStyleObj.opacity)}")`,
					);
				}
				break;
			case "fontFamily":
				if (typeof value === "string") {
					lines.push(`font: "${value}"`);
				}
				break;
			case "fontSize":
				// Accept both string (e.g. '12px') and number
				lines.push(
					`size: ${toPt(typeof value === "number" ? value : String(value))}`,
				);
				break;
			case "fontWeight":
				// Accept both string and number
				lines.push(
					`weight: ${typeof value === "number" ? value : `"${value}"`}`,
				);
				break;
			case "letterSpacing":
				lines.push(
					`tracking: ${toPt(typeof value === "number" ? value : String(value))}`,
				);
				break;
		}
	}
	if (!lines.length) return "";
	return `#let dynamic_label_style = (\n  ${lines.join(",\n  ")}\n)`;
}

// --- Text/Table Style Converter ---

export function textOrTableStyleToTypst(styleObj: StyleObject): string {
	const lines: string[] = [];
	const marginLine = collectBoxSpacing(styleObj, "margin");
	if (marginLine) lines.push(marginLine);
	const paddingLine = collectBoxSpacing(styleObj, "padding");
	if (paddingLine) lines.push(paddingLine);

	for (const [key, value] of Object.entries(styleObj)) {
		if (
			value === "" ||
			value === "none" ||
			value === undefined ||
			value === null
		)
			continue;

		switch (key) {
			case "color":
				if (typeof value === "string") {
					lines.push(
						`fill: rgb("${cssColorWithOpacityToTypstHex(value, styleObj.opacity)}")`,
					);
				}
				break;
			case "backgroundColor":
				if (typeof value === "string") {
					lines.push(
						`highlight: rgb("${cssColorWithOpacityToTypstHex(value, styleObj.opacity)}")`,
					);
				}
				break;
			case "fontFamily":
				if (typeof value === "string") {
					lines.push(`font: "${value}, Arial, sans-serif"`);
				}
				break;
			case "fontSize":
				lines.push(`size: ${toPt(value)}`);
				break;
			case "fontWeight":
				lines.push(`weight: ${value}`);
				break;
			case "letterSpacing":
				lines.push(`tracking: ${toPt(value)}`);
				break;
			case "textAlign":
				if (typeof value === "string") {
					lines.push(`align: ${cssTextAlignToTypst(value)}`);
				}
				break;
			// add other style keys as needed
		}
	}
	return lines.join(",\n  ");
}

export function tableGlobalStylesToTypst(
	tableStyles: TableStyles = {},
): string {
	const out: string[] = [];
	if (tableStyles.style) {
		out.push(
			`#let table_cell_style = (\n  ${textOrTableStyleToTypst(tableStyles.style)}\n)`,
		);
	}
	if (tableStyles.headerStyle) {
		out.push(
			`#let table_header_style = (\n  ${textOrTableStyleToTypst(tableStyles.headerStyle)}\n)`,
		);
	}
	if (tableStyles.labelStyle) {
		out.push(
			`#let table_label_style = (\n  ${textOrTableStyleToTypst(tableStyles.labelStyle)}\n)`,
		);
	}
	if (tableStyles.altStyle && Object.keys(tableStyles.altStyle).length) {
		out.push(
			`#let table_alt_row_style = (\n  ${textOrTableStyleToTypst(tableStyles.altStyle)}\n)`,
		);
	}
	return out.join("\n\n");
}

export function globalTextStyleToTypst(styleObj: StyleObject): string {
	const lines: string[] = [];
	for (const [key, value] of Object.entries(styleObj)) {
		if (value === "" || value === "none" || value == null) continue;
		switch (key) {
			case "color":
				// Ensure value is string for color
				lines.push(
					`fill: rgb("${cssColorWithOpacityToTypstHex(value as string, styleObj.opacity)}")`,
				);
				break;
			case "fontFamily":
				lines.push(`font: "${value}"`);
				break;
			case "fontSize":
				lines.push(`size: ${toPt(value)}`);
				break;
			case "fontWeight":
				lines.push(`weight: ${value}`);
				break;
			case "letterSpacing":
				lines.push(`tracking: ${toPt(value)}`);
				break;
		}
	}
	if (!lines.length) return "";
	return `#set text(\n  ${lines.join(",\n  ")}\n)`;
}
