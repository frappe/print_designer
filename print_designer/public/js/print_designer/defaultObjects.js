import { useMainStore } from "./store/MainStore";

export const createRectangle = (cordinates, parent = null) => {
	const MainStore = useMainStore();

	let id = frappe.utils.get_random(10);
	if (cordinates instanceof MouseEvent) {
		cordinates = {
			startX: cordinates.offsetX,
			startY: cordinates.offsetY,
			pageX: cordinates.x,
			pageY: cordinates.y,
		};
	}
	const newRectangle = {
		id: id,
		type: "rectangle",
		DOMRef: null,
		childrens: [],
		parent: parent,
		isDraggable: false,
		isResizable: false,
		isDropZone: false,
		startX: cordinates.startX,
		startY: cordinates.startY,
		pageX: cordinates.pageX,
		pageY: cordinates.pageY,
		width: 0,
		height: 0,
		styleEditMode: "main",
		style: {},
		classes: [],
	};

	parent.childrens?.push(newRectangle);
	MainStore.lastCreatedElement = newRectangle;
	return newRectangle;
};
export const createImage = (cordinates, parent = null) => {
	const MainStore = useMainStore();

	let id = frappe.utils.get_random(10);
	if (cordinates instanceof MouseEvent) {
		cordinates = {
			startX: cordinates.offsetX,
			startY: cordinates.offsetY,
			pageX: cordinates.x,
			pageY: cordinates.y,
		};
	}
	const newImage = {
		id: id,
		type: "image",
		DOMRef: null,
		parent: parent,
		isDraggable: false,
		isResizable: false,
		isDropZone: false,
		isDynamic: false,
		image: null,
		startX: cordinates.startX,
		startY: cordinates.startY,
		pageX: cordinates.pageX,
		pageY: cordinates.pageY,
		width: 0,
		height: 0,
		styleEditMode: "main",
		style: {},
		classes: [],
	};

	parent.childrens?.push(newImage) || parent.childrens.push(newImage);
	MainStore.lastCreatedElement = newImage;
	return newImage;
};
export const createBarcode = (cordinates, parent = null) => {
	const MainStore = useMainStore();

	let id = frappe.utils.get_random(10);
	if (cordinates instanceof MouseEvent) {
		cordinates = {
			startX: cordinates.offsetX,
			startY: cordinates.offsetY,
			pageX: cordinates.x,
			pageY: cordinates.y,
		};
	}
	const newBarcode = {
		id: id,
		type: "barcode",
		barcodeFormat: MainStore.globalStyles["barcode"].barcodeFormat || "qrcode",
		barcodeColor: "#000000",
		barcodeBackgroundColor: "#ffffff",
		DOMRef: null,
		parent: parent,
		isDraggable: false,
		isResizable: false,
		isDropZone: false,
		isDynamic: false,
		value: "",
		dynamicContent: [],
		startX: cordinates.startX,
		startY: cordinates.startY,
		pageX: cordinates.pageX,
		pageY: cordinates.pageY,
		width: 0,
		height: 0,
		styleEditMode: "main",
		style: {},
		classes: [],
	};

	parent.childrens?.push(newBarcode) || parent.childrens.push(newBarcode);
	MainStore.lastCreatedElement = newBarcode;
	return newBarcode;
};
export const createTable = (cordinates, parent = null) => {
	const MainStore = useMainStore();

	let id = frappe.utils.get_random(10);
	if (cordinates instanceof MouseEvent) {
		cordinates = {
			startX: cordinates.offsetX,
			startY: cordinates.offsetY,
			pageX: cordinates.x,
			pageY: cordinates.y,
		};
	}
	const newTable = {
		id: id,
		type: "table",
		DOMRef: null,
		parent: parent,
		isDraggable: false,
		isResizable: false,
		isDropZone: false,
		table: null,
		columns: [],
		PreviewRowNo: 1,
		selectedColumn: null,
		selectedDynamicText: null,
		startX: cordinates.startX,
		startY: cordinates.startY,
		pageX: cordinates.pageX,
		pageY: cordinates.pageY,
		width: 0,
		height: 0,
		styleEditMode: "main",
		labelDisplayStyle: "standard",
		style: {},
		labelStyle: {},
		headerStyle: {},
		altStyle: {},
		heightType: "auto",
		classes: [],
	};

	parent.childrens?.push(newTable) || parent.childrens.push(newTable);
	MainStore.lastCreatedElement = newTable;
	return newTable;
};

export const createText = (cordinates, parent = null) => {
	const MainStore = useMainStore();

	let id = frappe.utils.get_random(10);
	if (cordinates instanceof MouseEvent) {
		cordinates = {
			startX: cordinates.offsetX,
			startY: cordinates.offsetY,
			pageX: cordinates.x,
			pageY: cordinates.y,
		};
	}
	const newStaticText = {
		id: id,
		type: "text",
		DOMRef: null,
		parent: parent,
		content: "",
		contenteditable: true,
		isDynamic: false,
		isFixedSize: false,
		isDraggable: false,
		isResizable: false,
		isDropZone: false,
		parseJinja: false,
		startX: cordinates.startX - 5,
		startY: cordinates.startY - 16,
		pageX: cordinates.pageX,
		pageY: cordinates.pageY,
		width: 0,
		height: 0,
		styleEditMode: "main",
		labelDisplayStyle: "standard",
		style: {},
		classes: [],
	};
	parent.childrens?.push(newStaticText) || parent.childrens.push(newStaticText);
	MainStore.lastCreatedElement = newStaticText;
	return newStaticText;
};
export const createDynamicText = (cordinates, parent = null) => {
	const MainStore = useMainStore();

	let id = frappe.utils.get_random(10);
	if (cordinates instanceof MouseEvent) {
		cordinates = {
			startX: cordinates.offsetX,
			startY: cordinates.offsetY,
			pageX: cordinates.x,
			pageY: cordinates.y,
		};
	}
	const newDynamicText = {
		id: id,
		type: "text",
		DOMRef: null,
		parent: parent,
		content: "",
		contenteditable: false,
		isDynamic: true,
		isFixedSize: false,
		dynamicContent: [],
		selectedDynamicText: null,
		isDraggable: false,
		isResizable: false,
		isDropZone: false,
		startX: cordinates.startX - 5,
		startY: cordinates.startY - 16,
		pageX: cordinates.pageX,
		pageY: cordinates.pageY,
		width: 0,
		height: 0,
		styleEditMode: "main",
		labelDisplayStyle: "standard",
		style: {},
		labelStyle: {},
		heightType: "auto",
		classes: [],
	};
	parent.childrens?.push(newDynamicText) || parent.childrens.push(newDynamicText);
	MainStore.lastCreatedElement = newDynamicText;
	return newDynamicText;
};

export const GoogleFonts = {
	Alegreya: [
		[400, 500, 600, 700, 800, 900],
		[400, 500, 600, 700, 800, 900],
	],
	"Alegreya Sans": [
		[100, 300, 400, 500, 700, 800, 900],
		[100, 300, 400, 500, 700, 800, 900],
	],
	"Andada Pro": [
		[400, 500, 600, 700, 800],
		[400, 500, 600, 700, 800],
	],
	Anton: [[400], []],
	Archivo: [
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
	],
	"Archivo Narrow": [
		[400, 500, 600, 700],
		[400, 500, 600, 700],
	],
	BioRhyme: [[200, 300, 400, 700, 800], []],
	Cardo: [[400, 700], [400]],
	Chivo: [
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
	],
	Cormorant: [
		[300, 400, 500, 600, 700],
		[300, 400, 500, 600, 700],
	],
	"Crimson Text": [
		[400, 600, 700],
		[400, 600, 700],
	],
	"DM Sans": [
		[400, 500, 700],
		[400, 500, 700],
	],
	Eczar: [[400, 500, 600, 700, 800], []],
	"Encode Sans": [[100, 200, 300, 400, 500, 600, 700, 800, 900], []],
	"Fira Sans": [
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
	],
	Hahmlet: [[100, 200, 300, 400, 500, 600, 700, 800, 900], []],
	"IBM Plex Sans": [
		[100, 200, 300, 400, 500, 600, 700],
		[100, 200, 300, 400, 500, 600, 700],
	],
	Inconsolata: [[200, 300, 400, 500, 600, 700, 800, 900], []],
	"Inknut Antiqua": [[300, 400, 500, 600, 700, 800, 900], []],
	Inter: [[100, 200, 300, 400, 500, 600, 700, 800, 900], []],
	"JetBrains Mono": [
		[100, 200, 300, 400, 500, 600, 700, 800],
		[100, 200, 300, 400, 500, 600, 700, 800],
	],
	Karla: [
		[200, 300, 400, 500, 600, 700, 800],
		[200, 300, 400, 500, 600, 700, 800],
	],
	Lato: [
		[100, 300, 400, 700, 900],
		[100, 300, 400, 700, 900],
	],
	"Libre Baskerville": [[400, 700], [400]],
	"Libre Franklin": [
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
	],
	Lora: [
		[400, 500, 600, 700],
		[400, 500, 600, 700],
	],
	Manrope: [[200, 300, 400, 500, 600, 700, 800], []],
	Merriweather: [
		[300, 400, 700, 900],
		[300, 400, 700, 900],
	],
	Montserrat: [
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
	],
	Neuton: [[200, 300, 400, 700, 800], [400]],
	Nunito: [
		[200, 300, 400, 500, 600, 700, 800, 900],
		[200, 300, 400, 500, 600, 700, 800, 900],
	],
	"Old Standard TT": [[400, 700], [400]],
	"Open Sans": [
		[300, 400, 500, 600, 700, 800],
		[300, 400, 500, 600, 700, 800],
	],
	Oswald: [[200, 300, 400, 500, 600, 700], []],
	Oxygen: [[300, 400, 700], []],
	"PT Sans": [
		[400, 700],
		[400, 700],
	],
	"PT Serif": [
		[400, 700],
		[400, 700],
	],
	"Playfair Display": [
		[400, 500, 600, 700, 800, 900],
		[400, 500, 600, 700, 800, 900],
	],
	Poppins: [
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
	],
	"Proza Libre": [
		[400, 500, 600, 700, 800],
		[400, 500, 600, 700, 800],
	],
	Raleway: [
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
	],
	Roboto: [
		[100, 300, 400, 500, 700, 900],
		[100, 300, 400, 500, 700, 900],
	],
	"Roboto Slab": [[100, 200, 300, 400, 500, 600, 700, 800, 900], []],
	Rubik: [
		[300, 400, 500, 600, 700, 800, 900],
		[300, 400, 500, 600, 700, 800, 900],
	],
	Sora: [[100, 200, 300, 400, 500, 600, 700, 800], []],
	"Source Sans Pro": [
		[200, 300, 400, 600, 700, 900],
		[200, 300, 400, 600, 700, 900],
	],
	"Source Serif Pro": [
		[200, 300, 400, 600, 700, 900],
		[200, 300, 400, 600, 700, 900],
	],
	"Space Grotesk": [[300, 400, 500, 600, 700], []],
	"Space Mono": [
		[400, 700],
		[400, 700],
	],
	Spectral: [
		[200, 300, 400, 500, 600, 700, 800],
		[200, 300, 400, 500, 600, 700, 800],
	],
	Syne: [[400, 500, 600, 700, 800], []],
	"Work Sans": [
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
		[100, 200, 300, 400, 500, 600, 700, 800, 900],
	],
};

export const barcodeFormats = [
	{ label: "QR Code", value: "qrcode" },
	{ label: "Code39", value: "code39" },
	{ label: "Code128", value: "code128" },
	{ label: "EAN", value: "ean" },
	{ label: "EAN8", value: "ean8" },
	{ label: "EAN13", value: "ean13" },
	{ label: "EAN14", value: "ean14" },
	{ label: "GTIN", value: "gtin" },
	{ label: "JAN", value: "jan" },
	{ label: "UPCA", value: "upc" },
	{ label: "UPCA", value: "upca" },
	{ label: "ISSN", value: "issn" },
	{ label: "ISBN", value: "isbn" },
	{ label: "ISBN10", value: "isbn10" },
	{ label: "ISBN13", value: "isbn13" },
	{ label: "PZN", value: "pzn" },
	{ label: "ITF", value: "itf" },
	{ label: "GS1", value: "gs1" },
	{ label: "Gs1_128", value: "gs1_128" },
];
