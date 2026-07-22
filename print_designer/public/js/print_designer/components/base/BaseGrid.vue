<template>
	<div
		:ref="setElements(object, index)"
		@mousedown.left="handleMouseDown($event, object)"
		@mouseup="handleMouseUp($event)"
		:style="[
			postionalStyles(startX, startY, width, height),
			style.zIndex && { zIndex: style.zIndex },
		]"
		:class="[
			'grid-container',
			classes,
			MainStore.getCurrentElementsId.includes(id) && 'active-elements',
		]"
	>
		<div :style="['overflow: visible;', widthHeightStyle(width, height)]">
			<table class="printGrid">
				<colgroup>
					<col
						v-for="columnIndex in columns"
						:key="`col-${columnIndex}`"
						:style="{ width: `${getColumnWidth(columnIndex - 1)}%` }"
					/>
				</colgroup>
				<tbody>
					<tr
						v-for="rowIndex in rows"
						:key="rowIndex"
						:style="{ height: `${getRenderedRowHeight(rowIndex - 1)}px` }"
					>
						<td
							v-for="columnIndex in columns"
							:key="`${rowIndex}-${columnIndex}`"
							v-show="!getCell(rowIndex - 1, columnIndex - 1)?.mergedInto"
							:rowspan="getCell(rowIndex - 1, columnIndex - 1)?.rowSpan || 1"
							:colspan="getCell(rowIndex - 1, columnIndex - 1)?.colSpan || 1"
							:class="{
								'current-grid-cell': isSelectedCell(
									getCell(rowIndex - 1, columnIndex - 1)
								),
								'merged-grid-cell':
									(getCell(rowIndex - 1, columnIndex - 1)?.rowSpan || 1) > 1 ||
									(getCell(rowIndex - 1, columnIndex - 1)?.colSpan || 1) > 1,
								'truncate-grid-cell':
									getCell(rowIndex - 1, columnIndex - 1)?.textOverflow ===
									'truncate',
							}"
							:style="[
								gridCellBaseStyle,
								getCell(rowIndex - 1, columnIndex - 1)?.style,
								getCellBoxStyle(getCell(rowIndex - 1, columnIndex - 1)),
								gridTableCellStyle,
							]"
							@mousedown.left.stop="
								handleCellMouseDown($event, getCell(rowIndex - 1, columnIndex - 1))
							"
							@dblclick.stop="editCell(getCell(rowIndex - 1, columnIndex - 1))"
						>
							<div
								class="grid-cell grid-cell-content"
								:style="[
									gridCellBaseStyle,
									getCell(rowIndex - 1, columnIndex - 1)?.style,
									getCellTextOverflowStyle(
										getCell(rowIndex - 1, columnIndex - 1)
									),
									getCellContentBoxStyle(getCell(rowIndex - 1, columnIndex - 1)),
								]"
							>
								<div
									v-if="getCell(rowIndex - 1, columnIndex - 1)?.label"
									class="printGrid label-text"
									:style="[
										labelStyle,
										getCell(rowIndex - 1, columnIndex - 1)?.labelStyle,
									]"
									v-text="getCell(rowIndex - 1, columnIndex - 1).label"
								></div>
								<BaseGridCellValue
									v-if="getCell(rowIndex - 1, columnIndex - 1)?.value"
									:cell="getCell(rowIndex - 1, columnIndex - 1)"
								/>
								<template
									v-for="field in getCell(rowIndex - 1, columnIndex - 1)
										?.dynamicContent"
									:key="`${field?.parentField}${field?.fieldname}`"
								>
									<BaseDynamicTextSpanTag
										v-bind="{
											field,
											labelStyle,
											index: 0,
											selectedDynamicText,
											setSelectedDynamicText,
											parentClass: 'printGrid',
											inheritedStyle: getCell(rowIndex - 1, columnIndex - 1)
												?.style,
										}"
									/>
								</template>
								<span
									v-if="isCellEmpty(getCell(rowIndex - 1, columnIndex - 1))"
									class="empty-grid-cell"
								>
									Cell
								</span>
							</div>
							<span
								v-if="isSelectedCell(getCell(rowIndex - 1, columnIndex - 1))"
								class="grid-column-resize-handle"
								@mousedown.left.stop.prevent="
									handleColumnResizeMouseDown(
										$event,
										getCell(rowIndex - 1, columnIndex - 1)
									)
								"
							></span>
							<span
								v-if="isSelectedCell(getCell(rowIndex - 1, columnIndex - 1))"
								class="grid-row-resize-handle"
								@mousedown.left.stop.prevent="
									handleRowResizeMouseDown(
										$event,
										getCell(rowIndex - 1, columnIndex - 1)
									)
								"
							></span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div
			v-if="selectedToolbarCell"
			class="grid-cell-toolbar"
			:style="selectedToolbarStyle"
			@mousedown.stop.prevent
			@click.stop.prevent
		>
			<div
				v-for="group in gridToolbarGroups(selectedToolbarCell)"
				:key="group.name"
				class="grid-toolbar-group"
			>
				<button
					v-for="action in group.actions"
					:key="action.name"
					type="button"
					:class="['grid-toolbar-button', action.icon]"
					:title="action.title"
					:disabled="action.disabled"
					@click="action.run"
				>
					<span></span>
				</button>
			</div>
		</div>
		<BaseResizeHandles
			v-if="
				MainStore.activeControl == 'mouse-pointer' &&
				MainStore.getCurrentElementsId.includes(id)
			"
		/>
	</div>
</template>

<script setup>
import { computed, nextTick, onMounted, toRefs, watch } from "vue";
import { useMainStore } from "../../store/MainStore";
import { useElementStore } from "../../store/ElementStore";
import { useElement } from "../../composables/Element";
import { useDraw } from "../../composables/Draw";
import { setFrappeControlValueSilently } from "../../frappeControl";
import {
	getGridCell,
	getGridRenderedHeight,
	getGridRenderedRowHeights,
	insertGridColumn,
	insertGridRow,
	mergeGridCellDown,
	mergeGridCellRight,
	resizeGridColumnWidth,
	removeGridColumn,
	removeGridRow,
	setGridRowHeight,
	splitGridCell,
	normalizeGridStructure,
} from "../../defaultObjects";
import {
	postionalStyles,
	setCurrentElement,
	lockAxis,
	cloneElement,
	deleteCurrentElements,
	widthHeightStyle,
} from "../../utils";
import BaseResizeHandles from "./BaseResizeHandles.vue";
import BaseDynamicTextSpanTag from "./BaseDynamicTextSpanTag.vue";
import BaseGridCellValue from "./BaseGridCellValue.vue";

const MainStore = useMainStore();
const ElementStore = useElementStore();
const props = defineProps({
	object: {
		type: Object,
		required: true,
	},
	index: {
		type: Number,
		required: true,
	},
});

const {
	id,
	rows,
	columns,
	cells,
	rowHeights,
	columnWidths,
	startX,
	startY,
	width,
	height,
	style,
	labelStyle,
	classes,
	selectedCell,
	selectedDynamicText,
	DOMRef,
} = toRefs(props.object);

const { setElements } = useElement({
	draggable: true,
	resizable: true,
});
const { drawEventHandler, parameters } = useDraw();

const isGridActive = computed(
	() =>
		MainStore.getCurrentElementsId.length === 1 &&
		MainStore.getCurrentElementsId.includes(id.value)
);

const selectedToolbarCell = computed(() => {
	if (!isGridActive.value || !selectedCell.value) return null;
	return selectedCell.value.mergedInto
		? cells.value.find((candidate) => candidate.id == selectedCell.value.mergedInto)
		: selectedCell.value;
});

const renderedRowHeights = computed(() => getGridRenderedRowHeights(props.object));

const getRowsHeightBefore = (rowIndex) =>
	Array.from({ length: Math.max(0, rowIndex) }, (_, index) =>
		getRenderedRowHeight(index)
	).reduce((total, rowHeight) => total + rowHeight, 0);

const getColumnsWidthBefore = (columnIndex) =>
	Array.from({ length: Math.max(0, columnIndex) }, (_, index) => getColumnWidth(index)).reduce(
		(total, columnWidth) => total + columnWidth,
		0
	);

const getColumnSpanWidth = (cell) =>
	Array.from({ length: Math.max(1, cell?.colSpan || 1) }, (_, index) =>
		getColumnWidth((cell?.columnIndex || 0) + index)
	).reduce((total, columnWidth) => total + columnWidth, 0);

const selectedToolbarStyle = computed(() => {
	const cell = selectedToolbarCell.value;
	if (!cell) return {};
	const toolbarWidth = 204;
	const cellRight =
		((getColumnsWidthBefore(cell.columnIndex) + getColumnSpanWidth(cell)) / 100) * width.value;
	const left = Math.max(
		2,
		Math.min(width.value - toolbarWidth - 2, cellRight - toolbarWidth - 2)
	);
	const top = getRowsHeightBefore(cell.rowIndex) - 34;
	return {
		left: `${left}px`,
		top: `${top}px`,
	};
});

watch(
	() => MainStore.getCurrentElementsId.join(","),
	() => {
		if (isGridActive.value) {
			syncSelectedCellPanel();
			return;
		}
		selectedCell.value = null;
		selectedDynamicText.value = null;
	}
);

const getCell = (rowIndex, columnIndex) => {
	return getGridCell(props.object, rowIndex, columnIndex);
};

const isSelectedCell = (cell) => {
	if (!cell || !selectedCell.value) return false;
	return selectedCell.value.id == cell.id;
};

const getRowHeight = (rowIndex) =>
	rowHeights?.value?.[rowIndex] ??
	props.object.rowHeights?.[rowIndex] ??
	height.value / rows.value;

const getRenderedRowHeight = (rowIndex) =>
	renderedRowHeights.value?.[rowIndex] ?? getRowHeight(rowIndex);

const getColumnWidth = (columnIndex) =>
	columnWidths?.value?.[columnIndex] ??
	props.object.columnWidths?.[columnIndex] ??
	100 / columns.value;

const getRowSpanHeight = (cell) =>
	Array.from({ length: Math.max(1, cell?.rowSpan || 1) }, (_, index) =>
		getRenderedRowHeight((cell?.rowIndex || 0) + index)
	).reduce((total, rowHeight) => total + rowHeight, 0);

const getCellBoxStyle = (cell) => {
	if (!cell) return {};
	const rowSpanHeight = getRowSpanHeight(cell);
	return {
		height: `${rowSpanHeight}px`,
		maxHeight: `${rowSpanHeight}px`,
	};
};

const gridTableCellStyle = {
	padding: 0,
	overflow: "hidden",
};

const getCellContentBoxStyle = (cell) => {
	if (!cell) return {};
	const rowSpanHeight = getRowSpanHeight(cell);
	return {
		background: "transparent",
		border: "none",
		borderRadius: 0,
		boxShadow: "none",
		boxSizing: "border-box",
		height: `${rowSpanHeight}px`,
		margin: 0,
		maxHeight: `${rowSpanHeight}px`,
		overflow: "hidden",
		width: "100%",
	};
};

const gridCellBaseStyle = computed(() => {
	const { zIndex, ...baseStyle } = style.value || {};
	return baseStyle;
});

const measureLegacyRowHeights = () => {
	if (!props.object._needsMeasuredRowHeights || !DOMRef.value) return;
	nextTick(() => {
		if (!props.object._needsMeasuredRowHeights || !DOMRef.value) return;
		const rowElements = Array.from(
			DOMRef.value.querySelectorAll(":scope > div > table.printGrid > tbody > tr")
		);
		if (rowElements.length !== rows.value) return;
		const measuredHeights = rowElements.map((rowElement) =>
			Math.max(1, rowElement.getBoundingClientRect().height)
		);
		if (measuredHeights.some((rowHeight) => !Number.isFinite(rowHeight))) return;
		const wasRecordingHistory = ElementStore.isRecordingHistory;
		ElementStore.isRecordingHistory = true;
		rowHeights.value = measuredHeights;
		height.value = getGridRenderedHeight(props.object);
		props.object._needsMeasuredRowHeights = false;
		ElementStore.isRecordingHistory = wasRecordingHistory;
		ElementStore.resetHistory();
	});
};

const syncControlValue = (name, value) => {
	const control = MainStore.frappeControls[name];
	if (!control) return;
	setFrappeControlValueSilently(control, value, { refresh: true });
};

const recordGridChange = () => {
	ElementStore.scheduleHistorySnapshot({ immediate: true });
};

const syncSelectedCellPanel = () => {
	const cell = selectedToolbarCell.value || selectedCell.value;
	if (!isGridActive.value || !cell) return;
	nextTick(() => {
		const style = MainStore.getStyleObject(true) || {};
		const getCurrentStyle = (property) => MainStore.getCurrentStyle(property) ?? "";
		const styleModeMap = Object.freeze({
			main: "style",
			label: "labelStyle",
			header: "headerStyle",
			alt: "altStyle",
		});
		const cellStyleMode = styleModeMap[props.object.styleEditMode] || "style";
		const getCurrentCellStyle = (property) =>
			cell?.[cellStyleMode]?.[property] ??
			cell?.style?.[property] ??
			props.object?.[cellStyleMode]?.[property] ??
			MainStore.getGlobalStyleObject?.[property] ??
			"";

		syncControlValue("gridSelectedRowHeight", getRowHeight(cell.rowIndex));
		syncControlValue("gridSelectedColumnWidth", getColumnWidth(cell.columnIndex));
		syncControlValue("gridCellTextOverflow", cell.textOverflow || "wrap");
		syncControlValue("gridCellLabel", cell.label || "");
		syncControlValue("gridCellParseJinja", cell.parseJinja ? "Yes" : "No");
		syncControlValue("gridCellValue", cell.value || "");
		syncControlValue("gridCellStyleEditMode", props.object.styleEditMode || "main");
		syncControlValue("gridCellFontFamily", getCurrentStyle("fontFamily"));

		const fontWeightControl = MainStore.frappeControls["gridCellFontWeight"];
		if (fontWeightControl) {
			fontWeightControl.df.options = MainStore.getGoogleFontWeights(style);
			fontWeightControl.refresh();
			syncControlValue("gridCellFontWeight", getCurrentStyle("fontWeight"));
		}

		syncControlValue("fontSize", getCurrentStyle("fontSize"));
		syncControlValue("lineHeight", getCurrentStyle("lineHeight"));
		syncControlValue("gridCellTextColor", getCurrentStyle("color"));
		syncControlValue("gridCellBackgroundColor", getCurrentCellStyle("backgroundColor"));
		syncControlValue("borderWidth", getCurrentStyle("borderWidth"));
		syncControlValue("borderRadius", getCurrentStyle("borderRadius"));
		syncControlValue("gridCellBorderColor", getCurrentStyle("borderColor"));
		syncControlValue("gridCellPaddingTop", getCurrentStyle("paddingTop"));
		syncControlValue("gridCellPaddingBottom", getCurrentStyle("paddingBottom"));
		syncControlValue("gridCellPaddingLeft", getCurrentStyle("paddingLeft"));
		syncControlValue("gridCellPaddingRight", getCurrentStyle("paddingRight"));
	});
};

watch(
	() => selectedCell.value?.id,
	() => syncSelectedCellPanel()
);

onMounted(() => measureLegacyRowHeights());

const getCellTextOverflowStyle = (cell) => {
	if (cell?.textOverflow !== "truncate") return {};
	return {
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	};
};

const isCellEmpty = (cell) => {
	return !cell?.label && !cell?.value && !cell?.dynamicContent?.length;
};

const setSelectedDynamicText = (value, isLabel) => {
	selectedDynamicText.value = selectedDynamicText.value === value ? null : value;
	props.object.styleEditMode = isLabel ? "label" : "main";
};

const handleCellMouseDown = (event, cell) => {
	if (cell?.mergedInto) {
		cell = cells.value.find((candidate) => candidate.id == cell.mergedInto) || cell;
	}
	selectedCell.value = cell;
	selectedDynamicText.value = null;
	handleMouseDown(event, props.object);
};

const editCell = (cell) => {
	if (!cell) return;
	selectedCell.value = cell;
	selectedDynamicText.value = null;
	MainStore.openDynamicModal = cell;
};

const selectCell = (rowIndex, columnIndex) => {
	selectedCell.value = getGridCell(props.object, rowIndex, columnIndex) || selectedCell.value;
};

const syncGridShape = () => {
	normalizeGridStructure(props.object);
	height.value = getGridRenderedHeight(props.object);
};

const addRowAbove = (cell) => {
	insertGridRow(props.object, cell.rowIndex);
	syncGridShape();
	selectCell(cell.rowIndex, cell.columnIndex);
	recordGridChange();
};

const addRowBelow = (cell) => {
	const rowIndex = cell.rowIndex + (cell.rowSpan || 1);
	insertGridRow(props.object, rowIndex);
	syncGridShape();
	selectCell(rowIndex, cell.columnIndex);
	recordGridChange();
};

const deleteRow = (cell) => {
	removeGridRow(props.object, cell.rowIndex);
	syncGridShape();
	selectCell(
		Math.min(cell.rowIndex, rows.value - 1),
		Math.min(cell.columnIndex, columns.value - 1)
	);
	recordGridChange();
};

const addColumnLeft = (cell) => {
	insertGridColumn(props.object, cell.columnIndex);
	syncGridShape();
	selectCell(cell.rowIndex, cell.columnIndex);
	recordGridChange();
};

const addColumnRight = (cell) => {
	const columnIndex = cell.columnIndex + (cell.colSpan || 1);
	insertGridColumn(props.object, columnIndex);
	syncGridShape();
	selectCell(cell.rowIndex, columnIndex);
	recordGridChange();
};

const deleteColumn = (cell) => {
	removeGridColumn(props.object, cell.columnIndex);
	syncGridShape();
	selectCell(
		Math.min(cell.rowIndex, rows.value - 1),
		Math.min(cell.columnIndex, columns.value - 1)
	);
	recordGridChange();
};

const toggleCellOverflow = (cell) => {
	cell.textOverflow = cell.textOverflow === "truncate" ? "wrap" : "truncate";
	recordGridChange();
};

const gridToolbarGroups = (cell) => {
	if (!cell) return [];
	const canSplit = (cell.rowSpan || 1) > 1 || (cell.colSpan || 1) > 1;
	return [
		{
			name: "rows",
			actions: [
				{
					name: "row-above",
					icon: "add-row-above",
					title: "Add row above",
					run: () => addRowAbove(cell),
				},
				{
					name: "row-below",
					icon: "add-row-below",
					title: "Add row below",
					run: () => addRowBelow(cell),
				},
				{
					name: "row-delete",
					icon: "delete-row",
					title: "Delete row",
					disabled: rows.value <= 1,
					run: () => deleteRow(cell),
				},
			],
		},
		{
			name: "columns",
			actions: [
				{
					name: "col-left",
					icon: "add-column-left",
					title: "Add column left",
					run: () => addColumnLeft(cell),
				},
				{
					name: "col-right",
					icon: "add-column-right",
					title: "Add column right",
					run: () => addColumnRight(cell),
				},
				{
					name: "col-delete",
					icon: "delete-column",
					title: "Delete column",
					disabled: columns.value <= 1,
					run: () => deleteColumn(cell),
				},
			],
		},
		{
			name: "merge",
			actions: [
				{
					name: "merge-right",
					icon: "merge-right",
					title: "Merge right",
					disabled: cell.columnIndex + (cell.colSpan || 1) >= columns.value,
					run: () => {
						mergeGridCellRight(props.object, cell);
						recordGridChange();
					},
				},
				{
					name: "merge-down",
					icon: "merge-down",
					title: "Merge down",
					disabled: cell.rowIndex + (cell.rowSpan || 1) >= rows.value,
					run: () => {
						mergeGridCellDown(props.object, cell);
						syncGridShape();
						recordGridChange();
					},
				},
				{
					name: "split",
					icon: "split-cell",
					title: "Split cell",
					disabled: !canSplit,
					run: () => {
						splitGridCell(props.object, cell);
						recordGridChange();
					},
				},
			],
		},
		{
			name: "text",
			actions: [
				{
					name: "overflow",
					icon: cell.textOverflow === "truncate" ? "wrap-text" : "trim-text",
					title: cell.textOverflow === "truncate" ? "Wrap text" : "Trim text",
					run: () => toggleCellOverflow(cell),
				},
			],
		},
	];
};

const handleColumnResizeMouseDown = (event, cell) => {
	if (!cell || cell.columnIndex >= columns.value - 1) return;
	normalizeGridStructure(props.object);
	const tableWidth =
		event.currentTarget.closest("table")?.getBoundingClientRect().width || width.value;
	let lastX = event.clientX;
	const columnIndex = cell.columnIndex + (cell.colSpan || 1) - 1;
	const handleMouseMove = (moveEvent) => {
		const deltaPercent = ((moveEvent.clientX - lastX) * 100) / tableWidth;
		lastX = moveEvent.clientX;
		resizeGridColumnWidth(props.object, columnIndex, deltaPercent);
	};
	const handleMouseUp = () => {
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
		recordGridChange();
	};
	document.addEventListener("mousemove", handleMouseMove);
	document.addEventListener("mouseup", handleMouseUp);
};

const handleRowResizeMouseDown = (event, cell) => {
	if (!cell) return;
	normalizeGridStructure(props.object);
	const rowIndex = cell.rowIndex + (cell.rowSpan || 1) - 1;
	const startY = event.clientY;
	const startHeight = getRowHeight(rowIndex);
	const handleMouseMove = (moveEvent) => {
		setGridRowHeight(props.object, rowIndex, startHeight + moveEvent.clientY - startY);
		height.value = getGridRenderedHeight(props.object);
	};
	const handleMouseUp = () => {
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
		recordGridChange();
	};
	document.addEventListener("mousemove", handleMouseMove);
	document.addEventListener("mouseup", handleMouseUp);
};

const handleMouseDown = (event, element = null) => {
	MainStore.setActiveControl("MousePointer");
	lockAxis(element, event.shiftKey);
	event.stopPropagation();
	MainStore.isMoveStart = true;
	if (event.altKey) {
		element && setCurrentElement(event, element);
		cloneElement();
	} else {
		element && setCurrentElement(event, element);
	}
	drawEventHandler.mousedown(event);
	MainStore.currentDrawListener = { drawEventHandler, parameters };
};

const handleMouseUp = (event) => {
	if (MainStore.lastCloned && !MainStore.isMoved && MainStore.activeControl == "mouse-pointer") {
		deleteCurrentElements();
	}
	MainStore.currentDrawListener?.drawEventHandler.mouseup(event);
	MainStore.setActiveControl("MousePointer");
	MainStore.isMoved = MainStore.isMoveStart = false;
	MainStore.lastCloned = null;
};
</script>

<style lang="scss" scoped>
.grid-container {
	background-color: var(--gray-50);
	overflow: visible;
}
.printGrid {
	border-collapse: collapse;
	box-sizing: border-box;
	border-spacing: 0;
	height: auto;
	table-layout: fixed;
	width: 100%;
	td {
		border-style: solid;
		box-sizing: border-box;
		cursor: pointer;
		overflow: hidden;
		overflow-wrap: break-word;
		padding: 0 !important;
		position: relative;
		vertical-align: top;
	}
	.grid-cell-content {
		box-sizing: border-box;
		display: block;
		overflow: hidden;
		width: 100%;
	}
	.current-grid-cell {
		outline: 1.5px solid var(--primary-color);
		outline-offset: -1.5px;
	}
	.merged-grid-cell {
		background-clip: padding-box;
	}
	.truncate-grid-cell {
		overflow-wrap: normal;
		.grid-cell-content,
		.label-text,
		.static-cell-value {
			display: block;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
	.grid-column-resize-handle,
	.grid-row-resize-handle {
		position: absolute;
		z-index: 2147483647;
	}
	.grid-column-resize-handle {
		bottom: 0;
		cursor: col-resize;
		right: -3px;
		top: 0;
		width: 6px;
	}
	.grid-row-resize-handle {
		bottom: -3px;
		cursor: row-resize;
		height: 6px;
		left: 0;
		right: 0;
	}
	.label-text {
		display: block;
		margin-bottom: 2px;
	}
	.static-cell-value {
		display: inline;
	}
	.empty-grid-cell {
		color: var(--text-muted);
		font-size: var(--text-xs);
	}
}
.grid-cell-toolbar {
	background: var(--fg-color);
	border: 1px solid var(--border-color);
	border-radius: 4px;
	box-shadow: var(--shadow-sm);
	display: flex;
	gap: 3px;
	padding: 3px;
	position: absolute;
	z-index: 2147483647;
	.grid-toolbar-group {
		border-right: 1px solid var(--border-color);
		display: flex;
		gap: 1px;
		padding-right: 3px;
		&:last-child {
			border-right: 0;
			padding-right: 0;
		}
	}
	.grid-toolbar-button {
		align-items: center;
		background: var(--control-bg);
		border: 1px solid transparent;
		border-radius: 3px;
		display: inline-flex;
		height: 22px;
		justify-content: center;
		padding: 0;
		position: relative;
		width: 22px;
		span,
		&::before,
		&::after,
		span::before,
		span::after {
			box-sizing: border-box;
			content: "";
			display: block;
			position: absolute;
		}
		&:hover:not(:disabled) {
			border: 1px solid var(--border-color);
			background: var(--bg-color);
		}
		&:disabled {
			opacity: 0.4;
		}
	}
	.add-row-above,
	.add-row-below,
	.delete-row {
		span {
			border-bottom: 1px solid var(--text-color);
			border-top: 1px solid var(--text-color);
			height: 8px;
			left: 5px;
			top: 7px;
			width: 12px;
		}
		span::before {
			background: var(--text-color);
			height: 1px;
			left: 0;
			top: 3px;
			width: 12px;
		}
	}
	.add-column-left,
	.add-column-right,
	.delete-column {
		span {
			border-left: 1px solid var(--text-color);
			border-right: 1px solid var(--text-color);
			height: 12px;
			left: 7px;
			top: 5px;
			width: 8px;
		}
		span::before {
			background: var(--text-color);
			height: 12px;
			left: 3px;
			top: 0;
			width: 1px;
		}
	}
	.add-row-above::before,
	.add-row-below::before,
	.add-column-left::before,
	.add-column-right::before {
		background: var(--primary-color);
		height: 1px;
		width: 7px;
	}
	.add-row-above::after,
	.add-row-below::after,
	.add-column-left::after,
	.add-column-right::after {
		background: var(--primary-color);
		height: 7px;
		width: 1px;
	}
	.add-row-above::before,
	.add-row-above::after {
		left: 8px;
		top: 2px;
	}
	.add-row-below::before,
	.add-row-below::after {
		bottom: 2px;
		left: 8px;
	}
	.add-column-left::before,
	.add-column-left::after {
		left: 2px;
		top: 8px;
	}
	.add-column-right::before,
	.add-column-right::after {
		right: 2px;
		top: 8px;
	}
	.delete-row::before,
	.delete-column::before {
		background: var(--danger);
		height: 1px;
		left: 7px;
		top: 10px;
		width: 8px;
	}
	.merge-right span,
	.merge-down span,
	.split-cell span {
		border: 1px solid var(--text-color);
		height: 12px;
		left: 5px;
		top: 5px;
		width: 12px;
	}
	.merge-right span::before {
		background: var(--primary-color);
		height: 1px;
		left: 3px;
		top: 5px;
		width: 7px;
	}
	.merge-right span::after {
		border-right: 1px solid var(--primary-color);
		border-top: 1px solid var(--primary-color);
		height: 4px;
		right: 1px;
		top: 3px;
		transform: rotate(45deg);
		width: 4px;
	}
	.merge-down span::before {
		background: var(--primary-color);
		height: 7px;
		left: 5px;
		top: 3px;
		width: 1px;
	}
	.merge-down span::after {
		border-bottom: 1px solid var(--primary-color);
		border-right: 1px solid var(--primary-color);
		bottom: 1px;
		height: 4px;
		left: 3px;
		transform: rotate(45deg);
		width: 4px;
	}
	.split-cell span::before {
		background: var(--text-color);
		height: 12px;
		left: 5px;
		top: 0;
		width: 1px;
	}
	.split-cell span::after {
		background: var(--text-color);
		height: 1px;
		left: 0;
		top: 5px;
		width: 12px;
	}
	.wrap-text span,
	.trim-text span {
		height: 12px;
		left: 5px;
		top: 5px;
		width: 12px;
	}
	.wrap-text span::before,
	.wrap-text span::after,
	.trim-text span::before,
	.trim-text span::after {
		background: var(--text-color);
		height: 1px;
		left: 0;
		width: 12px;
	}
	.wrap-text span::before,
	.trim-text span::before {
		top: 2px;
	}
	.wrap-text span::after,
	.trim-text span::after {
		top: 6px;
	}
	.wrap-text::after {
		border-bottom: 1px solid var(--primary-color);
		border-left: 1px solid var(--primary-color);
		height: 5px;
		left: 11px;
		top: 12px;
		width: 6px;
	}
	.trim-text::after {
		background: var(--primary-color);
		border-radius: 50%;
		box-shadow: 4px 0 0 var(--primary-color);
		height: 2px;
		left: 9px;
		top: 15px;
		width: 2px;
	}
	.trim-text::before {
		background: var(--text-color);
		height: 1px;
		left: 5px;
		top: 15px;
		width: 4px;
	}
}
</style>
