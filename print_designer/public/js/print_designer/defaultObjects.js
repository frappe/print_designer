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
		imageFit: "contain",
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

const createGridCell = (rowIndex, columnIndex) => ({
	id: frappe.utils.get_random(10),
	rowIndex,
	columnIndex,
	rowSpan: 1,
	colSpan: 1,
	mergedInto: null,
	label: "",
	value: "",
	parseJinja: false,
	textOverflow: "wrap",
	dynamicContent: [],
	style: {},
	labelStyle: {},
});

const GRID_MIN_ROW_HEIGHT = 1;
const GRID_DEFAULT_ROW_HEIGHT = 30;
const GRID_MIN_COLUMN_WIDTH = 3;
const GRID_RENDERED_HEIGHT_CLEARANCE = 2;

const numericCssValue = (value) => {
	if (typeof value == "number") return value;
	if (typeof value != "string") return 0;
	const parsed = parseFloat(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCount = (value) => Math.max(parseInt(value) || 1, 1);

const normalizePercentages = (values, count) => {
	const normalizedValues = Array.isArray(values)
		? values.map((value) => numericCssValue(value)).filter((value) => value > 0)
		: [];
	const fallback = 100 / count;
	const widths = [];
	for (let index = 0; index < count; index++) {
		widths.push(normalizedValues[index] || fallback);
	}
	const total = widths.reduce((sum, value) => sum + value, 0) || 100;
	if (Math.abs(total - 100) < 1e-9) return widths;
	return widths.map((value) => (value * 100) / total);
};

const normalizeSpans = (cell) => {
	cell.rowSpan = Math.max(parseInt(cell.rowSpan) || 1, 1);
	cell.colSpan = Math.max(parseInt(cell.colSpan) || 1, 1);
	cell.mergedInto = cell.mergedInto || null;
	cell.textOverflow = cell.textOverflow || "wrap";
	return cell;
};

export const ensureGridMinimumHeight = (grid = {}, previousRows = null) => {
	const rows = normalizeCount(grid.rows);
	const oldRows = normalizeCount(previousRows || rows);
	const currentHeight = numericCssValue(grid.height);
	const currentRowHeight = currentHeight > 0 ? currentHeight / oldRows : 0;
	const rowHeight = Math.max(GRID_MIN_ROW_HEIGHT, currentRowHeight || GRID_MIN_ROW_HEIGHT);
	grid.rowHeights = createGridRowHeights(rows, grid.height, grid.rowHeights, rowHeight);
	syncGridRenderedGeometry(grid);
	return grid.height;
};

export const createGridCells = (rows, columns, existingCells = []) => {
	const cellsByPosition = {};
	existingCells.forEach((cell) => {
		cellsByPosition[`${cell.rowIndex}:${cell.columnIndex}`] = cell;
	});

	const cells = [];
	for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
		for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
			cells.push(
				normalizeSpans(
					cellsByPosition[`${rowIndex}:${columnIndex}`] ||
						createGridCell(rowIndex, columnIndex)
				)
			);
		}
	}
	return cells;
};

export const createGridRowHeights = (
	rows,
	height = 0,
	existingRowHeights = [],
	fallbackHeight = null
) => {
	const rowCount = normalizeCount(rows);
	const currentHeight = numericCssValue(height);
	const explicitFallbackHeight = numericCssValue(fallbackHeight);
	const fallback = Math.max(
		GRID_MIN_ROW_HEIGHT,
		explicitFallbackHeight > 0
			? explicitFallbackHeight
			: currentHeight > 0
			? currentHeight / rowCount
			: 0
	);
	const heights = Array.from({ length: rowCount }, (_, index) =>
		Math.max(GRID_MIN_ROW_HEIGHT, numericCssValue(existingRowHeights[index]) || fallback)
	);
	return heights;
};

export const createGridColumnWidths = (columns, existingColumnWidths = []) => {
	const columnCount = normalizeCount(columns);
	return normalizePercentages(existingColumnWidths, columnCount);
};

export const getGridRenderedRowHeights = (grid = {}) => {
	const rows = normalizeCount(grid.rows);
	return createGridRowHeights(rows, grid.height, grid.rowHeights);
};

export const getGridRenderedHeight = (grid = {}) =>
	getGridRenderedRowHeights(grid).reduce((total, rowHeight) => total + rowHeight, 0) +
	GRID_RENDERED_HEIGHT_CLEARANCE;

const syncGridRenderedGeometry = (grid = {}) => {
	grid.renderedRowHeights = getGridRenderedRowHeights(grid);
	grid.height =
		grid.renderedRowHeights.reduce((total, rowHeight) => total + rowHeight, 0) +
		GRID_RENDERED_HEIGHT_CLEARANCE;
	return grid.height;
};

export const resizeGridHeight = (grid, height, preserveRowProportions = true) => {
	normalizeGridStructure(grid);
	const contentHeight = Math.max(
		grid.rows * GRID_MIN_ROW_HEIGHT,
		numericCssValue(height) - GRID_RENDERED_HEIGHT_CLEARANCE
	);
	const sourceHeights = preserveRowProportions
		? grid.rowHeights
		: Array(grid.rows).fill(GRID_MIN_ROW_HEIGHT);
	const sourceHeight = sourceHeights.reduce(
		(total, rowHeight) => total + numericCssValue(rowHeight),
		0
	);
	const proportionalHeights = sourceHeights.map(
		(rowHeight) => (numericCssValue(rowHeight) * contentHeight) / sourceHeight
	);
	if (proportionalHeights.every((rowHeight) => rowHeight >= GRID_MIN_ROW_HEIGHT)) {
		grid.rowHeights = proportionalHeights;
		return syncGridRenderedGeometry(grid);
	}
	const sourceFlexibleHeight = sourceHeights.reduce(
		(total, rowHeight) =>
			total + Math.max(0, numericCssValue(rowHeight) - GRID_MIN_ROW_HEIGHT),
		0
	);
	const targetFlexibleHeight = contentHeight - grid.rows * GRID_MIN_ROW_HEIGHT;
	grid.rowHeights = sourceHeights.map((rowHeight) => {
		if (!sourceFlexibleHeight) return contentHeight / grid.rows;
		const weight =
			Math.max(0, numericCssValue(rowHeight) - GRID_MIN_ROW_HEIGHT) / sourceFlexibleHeight;
		return GRID_MIN_ROW_HEIGHT + targetFlexibleHeight * weight;
	});
	return syncGridRenderedGeometry(grid);
};

export const getGridCell = (grid = {}, rowIndex, columnIndex) =>
	(Array.isArray(grid.cells) ? grid.cells : []).find(
		(cell) => cell.rowIndex == rowIndex && cell.columnIndex == columnIndex
	);

export const getGridVisibleCell = (grid = {}, rowIndex, columnIndex) => {
	const cell = getGridCell(grid, rowIndex, columnIndex);
	if (!cell?.mergedInto) return cell;
	return (grid.cells || []).find((candidate) => candidate.id == cell.mergedInto) || cell;
};

export const applyGridSpanCoverage = (grid = {}) => {
	const cells = Array.isArray(grid.cells) ? grid.cells : [];
	cells.forEach((cell) => {
		if (cell.mergedInto) {
			cell.mergedInto = null;
		}
	});
	cells.forEach((cell) => {
		normalizeSpans(cell);
		cell.rowSpan = Math.min(cell.rowSpan, normalizeCount(grid.rows) - cell.rowIndex);
		cell.colSpan = Math.min(cell.colSpan, normalizeCount(grid.columns) - cell.columnIndex);
		if (cell.rowSpan <= 1 && cell.colSpan <= 1) return;
		for (let rowIndex = cell.rowIndex; rowIndex < cell.rowIndex + cell.rowSpan; rowIndex++) {
			for (
				let columnIndex = cell.columnIndex;
				columnIndex < cell.columnIndex + cell.colSpan;
				columnIndex++
			) {
				if (rowIndex == cell.rowIndex && columnIndex == cell.columnIndex) continue;
				const coveredCell = getGridCell(grid, rowIndex, columnIndex);
				if (coveredCell) {
					coveredCell.rowSpan = 1;
					coveredCell.colSpan = 1;
					coveredCell.mergedInto = cell.id;
				}
			}
		}
	});
	return grid;
};

export const normalizeGridStructure = (grid = {}, previousRows = null) => {
	grid.rows = normalizeCount(grid.rows);
	grid.columns = normalizeCount(grid.columns);
	grid.cells = createGridCells(grid.rows, grid.columns, grid.cells || []);
	const persistedRowHeights =
		Array.isArray(grid.renderedRowHeights) && grid.renderedRowHeights.length == grid.rows
			? grid.renderedRowHeights
			: grid.rowHeights;
	grid.rowHeights = createGridRowHeights(
		grid.rows,
		grid.height,
		persistedRowHeights,
		previousRows ? numericCssValue(grid.height) / normalizeCount(previousRows) : undefined
	);
	grid.columnWidths = createGridColumnWidths(grid.columns, grid.columnWidths);
	applyGridSpanCoverage(grid);
	syncGridRenderedGeometry(grid);
	return grid;
};

export const setGridRowHeight = (grid, rowIndex, height) => {
	normalizeGridStructure(grid);
	if (rowIndex < 0 || rowIndex >= grid.rows) return;
	const rowHeight = numericCssValue(height);
	if (!Number.isFinite(rowHeight) || rowHeight <= 0) return false;
	grid.rowHeights[rowIndex] = Math.max(GRID_MIN_ROW_HEIGHT, rowHeight);
	syncGridRenderedGeometry(grid);
	return true;
};

export const setGridColumnWidth = (grid, columnIndex, width) => {
	normalizeGridStructure(grid);
	if (columnIndex < 0 || columnIndex >= grid.columns) return false;
	const columnWidth = numericCssValue(width);
	if (!Number.isFinite(columnWidth) || columnWidth <= 0) return false;
	if (grid.columns == 1) {
		grid.columnWidths[0] = 100;
		return true;
	}

	const currentWidth = grid.columnWidths[columnIndex];
	const targetWidth = Math.max(GRID_MIN_COLUMN_WIDTH, columnWidth);
	if (columnIndex < grid.columns - 1) {
		resizeGridColumnWidth(grid, columnIndex, targetWidth - currentWidth);
	} else {
		resizeGridColumnWidth(grid, columnIndex - 1, currentWidth - targetWidth);
	}
	return true;
};

export const resizeGridColumnWidth = (grid, columnIndex, deltaPercent) => {
	normalizeGridStructure(grid);
	if (columnIndex < 0 || columnIndex >= grid.columns - 1) return;
	const currentWidth = grid.columnWidths[columnIndex];
	const nextWidth = grid.columnWidths[columnIndex + 1];
	const delta = Math.max(
		GRID_MIN_COLUMN_WIDTH - currentWidth,
		Math.min(deltaPercent, nextWidth - GRID_MIN_COLUMN_WIDTH)
	);
	grid.columnWidths[columnIndex] = currentWidth + delta;
	grid.columnWidths[columnIndex + 1] = nextWidth - delta;
};

export const insertGridRow = (grid, insertIndex) => {
	normalizeGridStructure(grid);
	const rowIndex = Math.max(0, Math.min(parseInt(insertIndex) || 0, grid.rows));
	const fallbackHeight =
		grid.rowHeights[Math.max(0, rowIndex - 1)] ||
		grid.rowHeights[rowIndex] ||
		GRID_MIN_ROW_HEIGHT;
	grid.cells.forEach((cell) => {
		if (cell.rowIndex >= rowIndex) {
			cell.rowIndex += 1;
		} else if (!cell.mergedInto && cell.rowIndex + cell.rowSpan > rowIndex) {
			cell.rowSpan += 1;
		}
	});
	grid.rows += 1;
	grid.rowHeights.splice(rowIndex, 0, fallbackHeight);
	grid.cells = createGridCells(grid.rows, grid.columns, grid.cells);
	applyGridSpanCoverage(grid);
	syncGridRenderedGeometry(grid);
};

export const removeGridRow = (grid, removeIndex) => {
	normalizeGridStructure(grid);
	if (grid.rows <= 1) return [];
	const rowIndex = Math.max(0, Math.min(parseInt(removeIndex) || 0, grid.rows - 1));
	[...grid.cells].forEach((cell) => {
		if (
			!cell.mergedInto &&
			cell.rowIndex <= rowIndex &&
			cell.rowIndex + cell.rowSpan > rowIndex &&
			(cell.rowSpan > 1 || cell.colSpan > 1)
		) {
			splitGridCell(grid, cell);
		}
	});
	const removedCells = grid.cells.filter((cell) => cell.rowIndex == rowIndex);
	grid.cells = grid.cells
		.filter((cell) => cell.rowIndex != rowIndex)
		.map((cell) => ({
			...cell,
			rowIndex: cell.rowIndex > rowIndex ? cell.rowIndex - 1 : cell.rowIndex,
		}));
	grid.rows -= 1;
	grid.rowHeights.splice(rowIndex, 1);
	grid.cells = createGridCells(grid.rows, grid.columns, grid.cells);
	applyGridSpanCoverage(grid);
	syncGridRenderedGeometry(grid);
	if (grid.selectedCell?.rowIndex >= grid.rows) {
		grid.selectedCell = null;
	}
	return removedCells;
};

export const insertGridColumn = (grid, insertIndex) => {
	normalizeGridStructure(grid);
	const columnIndex = Math.max(0, Math.min(parseInt(insertIndex) || 0, grid.columns));
	const sourceIndex = Math.max(0, Math.min(columnIndex - 1, grid.columns - 1));
	const newWidth = (grid.columnWidths[sourceIndex] || 100 / grid.columns) / 2;
	if (grid.columnWidths[sourceIndex]) {
		grid.columnWidths[sourceIndex] = Math.max(GRID_MIN_COLUMN_WIDTH, newWidth);
	}
	grid.cells.forEach((cell) => {
		if (cell.columnIndex >= columnIndex) {
			cell.columnIndex += 1;
		} else if (!cell.mergedInto && cell.columnIndex + cell.colSpan > columnIndex) {
			cell.colSpan += 1;
		}
	});
	grid.columns += 1;
	grid.columnWidths.splice(columnIndex, 0, newWidth);
	grid.columnWidths = normalizePercentages(grid.columnWidths, grid.columns);
	grid.cells = createGridCells(grid.rows, grid.columns, grid.cells);
	applyGridSpanCoverage(grid);
};

export const removeGridColumn = (grid, removeIndex) => {
	normalizeGridStructure(grid);
	if (grid.columns <= 1) return [];
	const columnIndex = Math.max(0, Math.min(parseInt(removeIndex) || 0, grid.columns - 1));
	[...grid.cells].forEach((cell) => {
		if (
			!cell.mergedInto &&
			cell.columnIndex <= columnIndex &&
			cell.columnIndex + cell.colSpan > columnIndex &&
			(cell.rowSpan > 1 || cell.colSpan > 1)
		) {
			splitGridCell(grid, cell);
		}
	});
	const removedCells = grid.cells.filter((cell) => cell.columnIndex == columnIndex);
	grid.cells = grid.cells
		.filter((cell) => cell.columnIndex != columnIndex)
		.map((cell) => ({
			...cell,
			columnIndex: cell.columnIndex > columnIndex ? cell.columnIndex - 1 : cell.columnIndex,
		}));
	grid.columns -= 1;
	grid.columnWidths.splice(columnIndex, 1);
	grid.columnWidths = normalizePercentages(grid.columnWidths, grid.columns);
	grid.cells = createGridCells(grid.rows, grid.columns, grid.cells);
	applyGridSpanCoverage(grid);
	if (grid.selectedCell?.columnIndex >= grid.columns) {
		grid.selectedCell = null;
	}
	return removedCells;
};

export const canMergeGridCellRight = (grid, cell) => {
	const sourceCell = getGridVisibleCell(grid, cell?.rowIndex, cell?.columnIndex);
	if (!sourceCell || sourceCell.mergedInto) return false;
	const targetColumn = sourceCell.columnIndex + sourceCell.colSpan;
	const targetCell = getGridCell(grid, sourceCell.rowIndex, targetColumn);
	return !!targetCell && !targetCell.mergedInto && targetCell.rowSpan == sourceCell.rowSpan;
};

export const canMergeGridCellDown = (grid, cell) => {
	const sourceCell = getGridVisibleCell(grid, cell?.rowIndex, cell?.columnIndex);
	if (!sourceCell || sourceCell.mergedInto) return false;
	const targetRow = sourceCell.rowIndex + sourceCell.rowSpan;
	const targetCell = getGridCell(grid, targetRow, sourceCell.columnIndex);
	return !!targetCell && !targetCell.mergedInto && targetCell.colSpan == sourceCell.colSpan;
};

export const mergeGridCellRight = (grid, cell) => {
	normalizeGridStructure(grid);
	const sourceCell = getGridVisibleCell(grid, cell?.rowIndex, cell?.columnIndex);
	if (!canMergeGridCellRight(grid, sourceCell)) return false;
	const targetColumn = sourceCell.columnIndex + sourceCell.colSpan;
	const targetCell = getGridCell(grid, sourceCell.rowIndex, targetColumn);
	sourceCell.colSpan += targetCell.colSpan;
	applyGridSpanCoverage(grid);
	grid.selectedCell = sourceCell;
	return true;
};

export const mergeGridCellDown = (grid, cell) => {
	normalizeGridStructure(grid);
	const sourceCell = getGridVisibleCell(grid, cell?.rowIndex, cell?.columnIndex);
	if (!canMergeGridCellDown(grid, sourceCell)) return false;
	const targetRow = sourceCell.rowIndex + sourceCell.rowSpan;
	const targetCell = getGridCell(grid, targetRow, sourceCell.columnIndex);
	sourceCell.rowSpan += targetCell.rowSpan;
	applyGridSpanCoverage(grid);
	grid.selectedCell = sourceCell;
	return true;
};

export const splitGridCell = (grid, cell) => {
	normalizeGridStructure(grid);
	const sourceCell = getGridVisibleCell(grid, cell?.rowIndex, cell?.columnIndex);
	if (!sourceCell) return;
	const rowSpan = sourceCell.rowSpan;
	const colSpan = sourceCell.colSpan;
	sourceCell.rowSpan = 1;
	sourceCell.colSpan = 1;
	for (
		let rowIndex = sourceCell.rowIndex;
		rowIndex < sourceCell.rowIndex + rowSpan;
		rowIndex++
	) {
		for (
			let columnIndex = sourceCell.columnIndex;
			columnIndex < sourceCell.columnIndex + colSpan;
			columnIndex++
		) {
			const coveredCell = getGridCell(grid, rowIndex, columnIndex);
			if (coveredCell?.mergedInto == sourceCell.id) {
				coveredCell.mergedInto = null;
			}
		}
	}
	applyGridSpanCoverage(grid);
	grid.selectedCell = sourceCell;
};

export const createGrid = (cordinates, parent = null) => {
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
	const rows = 3;
	const columns = 3;
	const newGrid = {
		id,
		type: "grid",
		DOMRef: null,
		parent,
		isDraggable: false,
		isResizable: false,
		isDropZone: false,
		rows,
		columns,
		cells: createGridCells(rows, columns),
		rowHeights: createGridRowHeights(rows, GRID_DEFAULT_ROW_HEIGHT * rows),
		columnWidths: createGridColumnWidths(columns),
		selectedCell: null,
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
		heightType: "fixed",
		classes: [],
	};

	ensureGridMinimumHeight(newGrid);
	parent.childrens?.push(newGrid) || parent.childrens.push(newGrid);
	MainStore.lastCreatedElement = newGrid;
	return newGrid;
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
