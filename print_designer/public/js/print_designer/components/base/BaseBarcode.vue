<template>
	<div
		@dblclick.stop="handleDblClick($event, object)"
		@mousedown.left="handleMouseDown($event, object)"
		@mouseup="handleMouseUp"
		:style="[
			postionalStyles(startX, startY, width, height),
			!isFixedSize && 'width:fit-content; height:fit-content;',
		]"
		:class="MainStore.getCurrentElementsId.includes(id) ? 'active-elements' : 'text-hover'"
		:ref="setElements(object, index)"
		:key="id"
	>
		<p
			:style="[
				style,
				widthHeightStyle(width, height),
				!isFixedSize && 'width:fit-content; height:fit-content;',
			]"
			:class="['dynamicText', classes]"
			v-if="type == 'barcode'"
			data-placeholder=""
		>
			<template
				v-for="(field, index) in dynamicContent"
				:key="`${field.parentField}${field.fieldname}`"
			>
				<BaseDynamicBarcodeSvgTag
					v-bind="{
						field,
						labelStyle,
						selectedDyanmicText,
						setSelectedDyanmicText,
						index,
						parentClass: '',
					}"
				/>
			</template>
		</p>
		<BaseResizeHandles
			v-if="
				MainStore.activeControl == 'mouse-pointer' &&
				MainStore.getCurrentElementsId.includes(id)
			"
		/>
	</div>
</template>

<script setup>
import BaseDynamicBarcodeSvgTag from "./BaseDynamicBarcodeSvgTag.vue";
import BaseResizeHandles from "./BaseResizeHandles.vue";
import { toRefs, onUpdated, watch, onMounted } from "vue";
import { useMainStore } from "../../store/MainStore";
import { useElement } from "../../composables/Element";
import { useDraw } from "../../composables/Draw";
import {
	postionalStyles,
	widthHeightStyle,
	setCurrentElement,
	lockAxis,
	cloneElement,
} from "../../utils";
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
const {
	id,
	type,
	DOMRef,
	isFixedSize,
	dynamicContent,
	selectedDyanmicText,
	isDraggable,
	isResizable,
	startX,
	startY,
	width,
	height,
	style,
	labelStyle,
	styleEditMode,
	classes,
} = toRefs(props.object);
const setSelectedDyanmicText = (value, isLabel) => {
	if (
		MainStore.activeControl != "text" ||
		MainStore.getCurrentElementsId.indexOf(id.value) == -1
	)
		return;
	if (
		selectedDyanmicText.value === value &&
		styleEditMode.value == (isLabel ? "label" : "main")
	) {
		selectedDyanmicText.value = null;
	} else {
		selectedDyanmicText.value = value;
		let removeSelectedText = onClickOutside(DOMRef.value, (event) => {
			for (let index = 0; index < event.composedPath().length; index++) {
				if (event.composedPath()[index].id === "canvas") {
					selectedDyanmicText.value = null;
					removeSelectedText();
				}
			}
		});
	}
	styleEditMode.value = isLabel ? "label" : "main";
};

const { setElements } = useElement({
	draggable: true,
	resizable: true,
});

const { drawEventHandler, parameters } = useDraw();

const toggleDragResize = (toggle) => {
	isDraggable.value = toggle;
	isResizable.value = toggle;
	props.object.contenteditable = !toggle;
};
watch(
	() => MainStore.activeControl,
	() => {
		if (MainStore.activeControl == "text") {
			toggleDragResize(false);
		} else {
			toggleDragResize(true);
		}
	}
);

const handleMouseDown = (e, element) => {
	lockAxis(element, e.shiftKey);
	if (MainStore.openModal) return;
	MainStore.currentDrawListener = { drawEventHandler, parameters };
	element && setCurrentElement(e, element);
	if (MainStore.activeControl == "mouse-pointer" && e.altKey) {
		cloneElement();
		drawEventHandler.mousedown(e);
	}
	e.stopPropagation();
	if (e.target.parentElement === element.DOMRef) {
		element.selectedDyanmicText = null;
	}
};

const handleMouseUp = (e) => {
	if (MainStore.activeControl == "mouse-pointer") {
		MainStore.currentDrawListener?.drawEventHandler.mouseup(e);
		MainStore.isMoved = MainStore.isMoveStart = false;
		MainStore.lastCloned = null;
		if (MainStore.isDropped) {
			MainStore.currentElements = MainStore.isDropped;
			MainStore.isDropped = null;
			return;
		}
	}
};

const handleDblClick = (e, element) => {
	element && setCurrentElement(e, element);
	MainStore.setActiveControl("Barcode");
	MainStore.openDynamicModal = element;
};

onMounted(() => {
	selectedDyanmicText.value = null;
	DOMRef.value.firstElementChild.dataset.placeholder = "Choose Dynamic Field...";
});

onUpdated(() => {
	if (!isFixedSize.value) {
		let targetRect = DOMRef.value.getBoundingClientRect();
		width.value = targetRect.width + 2;
		height.value = targetRect.height + 2;
	}
});
</script>
