// Typst color as rgb("#aabbccdd") or rgb("#rrggbb")
export type HexColor = `#${string}`; // can refine further later!
export type TypstRGBColor = `rgb("${HexColor}")`;

// Style object for any element
export interface StyleObject {
	backgroundColor?: TypstRGBColor; // Accepts CSS or Typst color for now
	borderColor?: TypstRGBColor;
	borderRadius?: string | number;
	borderStyle?: string;
	borderWidth?: string | number;
	boxShadow?: string;
	color?: TypstRGBColor;
	fontFamily?: string;
	fontSize?: string | number;
	fontWeight?: string | number;
	letterSpacing?: string | number;
	lineHeight?: string | number;
	margin?: string;
	marginTop?: string;
	marginRight?: string;
	marginBottom?: string;
	marginLeft?: string;
	opacity?: number;
	padding?: string;
	paddingTop?: string;
	paddingRight?: string;
	paddingBottom?: string;
	paddingLeft?: string;
	textAlign?: string;
	[key: string]: string | number | undefined; // Allow for extra CSS-like keys for now
}

// Element base interface
export interface ElementBase {
	type: string;
	childrens?: Element[]; // recursive!
	style?: StyleObject;
}

interface PositionedElement {
	pageX?: number | string;
	pageY?: number | string;
	width?: number | string;
	height?: number | string;
}


// Text element (for both static/dynamic text)
export interface TextElement extends ElementBase, PositionedElement {
	type: "text";
	dynamicContent?: Array<{
		is_static?: boolean;
		print_hide?: boolean;
		label?: string;
		fieldname?: string;
	}>;
}

// Rectangle element (for box, container, etc.)
export interface RectangleElement extends ElementBase {
	type: "rectangle";
	width?: number | string;
	height?: number | string;
	pageX?: number | string;
	pageY?: number | string;
}

export interface ImageElement extends ElementBase {
	type: "image";
	image?: {
		name?: string;
		doctype?: string;
		fieldname?: string;
		fieldtype?: string;
		label?: string;
		parentField?: string;
		value?: string;
		file_name?: string;
		file_url?: string;
		modified?: string;
	};
	width?: number | string;
	height?: number | string;
	pageX?: number | string;
	pageY?: number | string;
}

// (Add more element interfaces later as needed)
export type Element = TextElement | RectangleElement | ImageElement; // | TableElement | etc.

// Page settings interface
export interface PageSettings {
	key?: string;
	width?: number;
	height?: number;
	orientation?: "portrait" | "landscape";
	marginTop?: number | string;
	marginBottom?: number | string;
	marginLeft?: number | string;
	marginRight?: number | string;
	backgroundColor?: TypstRGBColor;
	backgroundImage?: string;
	opacity?: number;
	header?: string;
	footer?: string;
	// ...add more as you encounter them
}

export interface GlobalStyles {
	table?: TableStyles;
	rectangle?: { style?: StyleObject };
	barcode?: { style?: StyleObject };
	image?: { style?: StyleObject };
	staticText?: { style?: StyleObject };
	dynamicText?: { labelStyle?: StyleObject };
	// For any other unknown keys, allow them but require an object
	[key: string]: { [key: string]: unknown } | undefined;
}

// Main settings
export interface Settings {
	page?: PageSettings;
	currentPageSize?: string;
	currentDoc?: string;
	schema_version?: string;
	globalStyles?: GlobalStyles; // you can further type this for each section
	// ...other settings fields
}

// TableStyle interface
export interface TableStyles {
	style?: StyleObject;
	headerStyle?: StyleObject;
	labelStyle?: StyleObject;
	altStyle?: StyleObject;
	[key: string]: StyleObject | undefined;
}

export interface Page {
	childrens: Element[];
	// Add other page properties as needed
}

export interface Page {
	childrens: Element[];
	// ...other page-level fields
}

export interface Layout {
	body: Page[];
	// ...other fields if needed
}
