<template>
	<div
		:ref="setElements(object, index)"
		@mousedown.left="handleMouseDown($event, object)"
		@mouseup="handleMouseUp($event, width)"
		@mousemove="mouseMoveHandler($event, width)"
		@mouseleave="mouseLeaveHandler(width)"
		:style="[
			postionalStyles(startX, startY, width, height),
			style.zIndex && { zIndex: style.zIndex },
		]"
		:class="[
			'table-container',
			classes,
			MainStore.getCurrentElementsId.includes(id) && 'active-elements',
		]"
	>
		<div
			:style="['overflow: hidden;', widthHeightStyle(width, height)]"
			@click.self="
				() => {
					selectedColumn = null;
					selectedDynamicText = null;
				}
			"
		>
			<table class="printTable">
				<thead>
					<tr v-if="columns.length">
						<th
							:style="[
								'cursor: pointer;',
								column.width && {
									width: `${column.width}%`,
									maxWidth: `${column.width}%`,
								},
								headerStyle,
								column.applyStyleToHeader && column.style,
							]"
							v-for="(column, index) in columns"
							:class="
								(menu?.index == index || column == selectedColumn) &&
								'current-column'
							"
							:key="column.fieldname"
							:draggable="columnDragging"
							@dragstart="dragstart($event, index)"
							@drop="drop($event, index)"
							@dragleave="dragleave"
							@dragover="allowDrop"
							@contextmenu.prevent="handleMenu($event, index)"
							@mousedown="handleColumnClick(column)"
							@dblclick.stop="handleDblClick(table, column)"
							:ref="
								(el) => {
									column.DOMRef = el;
								}
							"
						>
							<span :class="{ emptyColumnHead: !Boolean(column.label.length) }">{{
								column?.label
							}}</span>
							<div
								class="resizer"
								draggable="false"
								:ref="
									(el) => {
										column.DOMRef = el;
									}
								"
								@mousedown.left="mouseDownHandler($event, column)"
								@mouseup.left="mouseUpHandler"
								:style="{
									height: DOMRef
										? DOMRef.firstChild.getBoundingClientRect().height + 'px'
										: '100%',
								}"
							></div>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-if="columns.length"
						v-for="row in MainStore.docData[table?.fieldname]?.slice(
							0,
							PreviewRowNo || 3
						) || [{}]"
						:key="row.idx"
					>
						<BaseTableTd
							v-bind="{
								row,
								columns,
								style,
								labelStyle,
								selectedDynamicText,
								setSelectedDynamicText,
								table,
								altStyle,
							}"
						/>
					</tr>
				</tbody>
			</table>
		</div>
		<BaseResizeHandles
			v-if="
				MainStore.activeControl == 'mouse-pointer' &&
				MainStore.getCurrentElementsId.includes(id)
			"
		/>
		<AppTableContextMenu v-if="menu" v-bind="{ menu }" @handleMenuClick="handleMenuClick" />
	</div>
</template>

<script setup>
import { useMainStore } from "../../store/MainStore";
import { useElement } from "../../composables/Element";
import {
	postionalStyles,
	setCurrentElement,
	lockAxis,
	cloneElement,
	deleteCurrentElements,
	widthHeightStyle,
} from "../../utils";
import { toRefs, ref, watch } from "vue";
import { useDraw } from "../../composables/Draw";
import BaseResizeHandles from "./BaseResizeHandles.vue";
import AppTableContextMenu from "../layout/AppTableContextMenu.vue";
import BaseTableTd from "./BaseTableTd.vue";
import { onClickOutside } from "@vueuse/core";
const MainStore = useMainStore();
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
const isResizeOn = ref(false);
const currentColumn = ref(null);
const columnDragging = ref(true);
const draggableEl = ref(-1);
const menu = ref(null);

const {
	id,
	table,
	columns,
	startX,
	startY,
	width,
	height,
	style,
	labelStyle,
	headerStyle,
	altStyle,
	classes,
	PreviewRowNo,
	styleEditMode,
	selectedColumn,
	selectedDynamicText,
	DOMRef,
} = toRefs(props.object);

watch(
	() => selectedColumn.value,
	(value) => {
		if (value) {
			MainStore.frappeControls.applyStyleToHeader?.set_value(value.applyStyleToHeader);
		}
	}
);

const setSelectedDynamicText = (value, isLabel) => {
	if (
		selectedDynamicText.value === value &&
		styleEditMode.value == (isLabel ? "label" : "main")
	) {
		selectedDynamicText.value = null;
	} else {
		selectedDynamicText.value = value;
		selectedColumn.value = null;
		let removeSelectedText = onClickOutside(DOMRef.value, (event) => {
			for (let index = 0; index < event.composedPath().length; index++) {
				if (event.composedPath()[index].id === "canvas") {
					selectedDynamicText.value = null;
					removeSelectedText();
				}
			}
		});
	}
	styleEditMode.value = isLabel ? "label" : "main";
};

const handleColumnClick = (column) => {
	if (!props.object.table) {
		MainStore.frappeControls.table.set_focus();
	} else if (MainStore.activeControl == "mouse-pointer") {
		selectedColumn.value = column;
		MainStore.frappeControls.tableStyleEditMode?.set_value("main");
		selectedDynamicText.value = null;
		let removeSelectedColumn = onClickOutside(DOMRef.value, (event) => {
			for (let index = 0; index < event.composedPath().length; index++) {
				if (event.composedPath()[index].id === "canvas") {
					selectedColumn.value = null;
					removeSelectedColumn();
				}
			}
		});
	}
};

const handleDblClick = (table, column) => {
	if (!props.object.table) {
		MainStore.frappeControls.table.set_focus();
		MainStore.frappeControls.table.$input.one("blur", () => {
			MainStore.openTableColumnModal = {
				table: MainStore.getCurrentElementsValues[0]?.table,
				column,
			};
		});
	} else {
		MainStore.openTableColumnModal = { table, column };
	}
};

const handleMenuClick = (index, action) => {
	switch (action) {
		case "before":
			columns.value.splice(index, 0, {
				id: index,
				label: "",
				style: {},
				applyStyleToHeader: false,
			});
			break;
		case "after":
			columns.value.splice(index + 1, 0, {
				id: index + 1,
				label: "",
				style: {},
				applyStyleToHeader: false,
			});
			break;
		case "delete":
			columns.value.splice(index, 1)[0].dynamicContent?.forEach((el) => {
				MainStore.dynamicData.splice(MainStore.dynamicData.indexOf(el), 1);
			});
			break;
	}
	columns.value.forEach((element, index) => {
		element.id = index;
	});
	menu.value.index = null;
};

const { setElements } = useElement({
	draggable: true,
	resizable: true,
});

const handleMenu = (e, index) => {
	if (!menu.value) {
		menu.value = {
			left: e.x - DOMRef.value.getBoundingClientRect().x + "px",
			top: e.y - DOMRef.value.getBoundingClientRect().y + "px",
			index: index,
		};
	} else {
		menu.value.left = e.x - DOMRef.value.getBoundingClientRect().x + "px";
		menu.value.top = e.y - DOMRef.value.getBoundingClientRect().y + "px";
		menu.value.index = index;
	}
};

const dragstart = (ev, index) => {
	draggableEl.value = index;
	ev.dataTransfer.dropEffect = "move";
};
const dragleave = (ev) => {
	ev.target.classList.remove("dropzone");
};
const allowDrop = (ev) => {
	ev.dataTransfer.dropEffect = "move";
	ev.target.classList.add("dropzone");
	ev.preventDefault();
};
const drop = (ev, index) => {
	ev.target.classList.remove("dropzone");
	columns.value.splice(index, 0, columns.value.splice(draggableEl.value, 1)[0]);
	columns.value.forEach((element, index) => {
		element.id = index;
	});
	ev.preventDefault();
	draggableEl.value = null;
};
const mouseDownHandler = (e, column) => {
	column.x = e.clientX;
	columnDragging.value = false;
	isResizeOn.value = true;
	column.DOMRef = e.target;
	!currentColumn.value && (currentColumn.value = column);
	column.DOMRef.classList.add("resizer-active");
	column.w = e.target.parentElement.getBoundingClientRect().width;
	DOMRef.value.style.cursor = "col-resize";
};
const mouseLeaveHandler = (tablewidth) => {
	if (isResizeOn.value) {
		columns.value.forEach((column) => {
			column.width = (column.DOMRef.getBoundingClientRect().width * 100) / tablewidth;
		});
	}
	if (currentColumn.value) {
		document.querySelector(".resizer-active").classList.remove("resizer-active");
		columnDragging.value = true;
		currentColumn.value = null;
		isResizeOn.value = false;
		DOMRef.value.style.cursor = "";
	}
};

const mouseMoveHandler = (e, tablewidth) => {
	if (!isResizeOn.value || !currentColumn.value) return;
	const dx = e.clientX - currentColumn.value.x;
	const newWidth = dx + currentColumn.value.w;
	currentColumn.value.width = (newWidth * 100) / tablewidth;
	if (currentColumn.value.width < 2) {
		currentColumn.value.width = 2;
	}
};
const { drawEventHandler, parameters } = useDraw();

const handleMouseDown = (e, element = null) => {
	MainStore.setActiveControl("MousePointer");
	lockAxis(element, e.shiftKey);
	e.stopPropagation();
	MainStore.isMoveStart = true;
	if (e.altKey) {
		element && setCurrentElement(e, element);
		cloneElement();
	} else {
		element && setCurrentElement(e, element);
	}
	drawEventHandler.mousedown(e);
	MainStore.currentDrawListener = { drawEventHandler, parameters };
	e.stopPropagation();
};

const handleMouseUp = (e, tablewidth) => {
	if (currentColumn.value) {
		document.querySelector(".resizer-active").classList.remove("resizer-active");
		currentColumn.value = null;
		isResizeOn.value = false;
		DOMRef.value.style.cursor = "";
	}
	columnDragging.value = true;
	if (MainStore.lastCloned && !MainStore.isMoved && MainStore.activeControl == "mouse-pointer") {
		deleteCurrentElements();
	}
	MainStore.currentDrawListener?.drawEventHandler.mouseup(e);
	MainStore.setActiveControl("MousePointer");
	MainStore.isMoved = MainStore.isMoveStart = false;
	MainStore.lastCloned = null;
	if (MainStore.frappeControls.table?.get_value() == "") {
		MainStore.frappeControls.table.set_focus();
	}
};
</script>

<style lang="scss" scoped>
.emptyColumnHead::after {
	content: "Select Field";
}
.dropzone {
	background-color: var(--gray-300);
}
.table-container {
	background-color: var(--gray-50);
	.printTable {
		border-collapse: collapse;
		box-sizing: border-box;
		border-spacing: 0px;
		width: 100%;
		overflow: hidden;

		tr:first-child th {
			border-top-style: solid !important;
		}
		tr th:first-child {
			border-left-style: solid !important;
		}
		tr th:last-child {
			border-right-style: solid !important;
		}
		.current-column {
			outline: 1.5px solid var(--primary-color);
			outline-offset: -1.5px;
		}
	}
	th {
		position: relative;
	}
	.resizer {
		position: absolute;
		top: 0;
		right: 0;
		width: 5px;
		cursor: col-resize;
		user-select: none;
		border-right: 1px solid transparent;
	}
}

.resizer:hover,
.resizer-active,
.resizing {
	border-right: 2px solid var(--primary-color);
}

[contenteditable] {
	outline: none;
}
[contenteditable]:empty:before {
	content: attr(data-placeholder);
}
[contenteditable]:empty:focus:before {
	content: "";
}
.text-hover:hover {
	box-sizing: border-box !important;
	border-bottom: 1px solid var(--primary-color) !important;
}
</style>
