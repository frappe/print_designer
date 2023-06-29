<template>
	<div
		@dblclick.stop="handleDblClick($event, object, index)"
		@mousedown.left="handleMouseDown($event, object, index)"
		@mouseup="handleMouseUp"
		:style="[
			postionalStyles(startX, startY, width, height),
			!isFixedSize && 'width:fit-content; height:fit-content; white-space:nowrap;',
		]"
		:class="MainStore.getCurrentElementsId.includes(id) ? 'active-elements' : 'text-hover'"
		:ref="setElements(object, index)"
		:key="id"
	>
		<p
			:contenteditable="contenteditable"
			@keydown.stop="handleKeyDown"
			@focus="handleFocus"
			@blur="handleBlur"
			@keyup.stop
			:style="[
				style,
				widthHeightStyle(width, height),
				!isFixedSize && 'width:fit-content; height:fit-content; white-space:nowrap;',
			]"
			:class="['staticText', classes]"
			v-if="type == 'text'"
			data-placeholder=""
			v-html="content"
		></p>
		<BaseResizeHandles
			v-if="!contenteditable && MainStore.getCurrentElementsId.includes(id)"
		/>
	</div>
</template>

<script setup>
import BaseResizeHandles from "./BaseResizeHandles.vue";
import { toRefs, watch, onMounted, onUpdated } from "vue";
import { useMainStore } from "../../store/MainStore";
import { useElement } from "../../composables/Element";
import { useDraw } from "../../composables/Draw";
import {
	postionalStyles,
	setCurrentElement,
	lockAxis,
	cloneElement,
	widthHeightStyle,
	deleteCurrentElements,
} from "../../utils";

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
	content,
	contenteditable,
	isFixedSize,
	isDraggable,
	isResizable,
	startX,
	startY,
	width,
	height,
	style,
	classes,
} = toRefs(props.object);

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
		element && setCurrentElement(e, element);
		cloneElement();
		drawEventHandler.mousedown(e);
	}
	e.stopPropagation();
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

const handleDblClick = (e, element, index) => {
	element && setCurrentElement(e, element);
	contenteditable.value = true;
	isDraggable.value = false;
	isResizable.value = false;
	MainStore.setActiveControl("Text");
	setTimeout(function () {
		DOMRef.value.firstElementChild.focus();
	}, 0);
};

onMounted(() => {
	if (!!DOMRef.value.firstElementChild.innerText) return;
	setTimeout(function () {
		DOMRef.value.firstElementChild.focus();
		DOMRef.value.firstElementChild.dataset.placeholder = "Type Something...";
	}, 0);
});
onUpdated(() => {
	if (!isFixedSize.value) {
		let targetRect = DOMRef.value.getBoundingClientRect();
		width.value = targetRect.width + 2;
		height.value = targetRect.height + 2;
	}
});

const handleBlur = (e) => {
	let targetRect = e.target.getBoundingClientRect();
	if (!isFixedSize.value) {
		width.value = targetRect.width + 2;
		height.value = targetRect.height + 2;
	}
	content.value = DOMRef.value.firstElementChild.innerHTML;
	MainStore.getCurrentElementsId.includes(id.value) &&
		DOMRef.value.classList.add("active-elements");
};

const handleKeyDown = (e) => {
	if (e.key == "Tab") {
		handleBlur(e);
		e.target.blur();
		e.preventDefault();
	} else if (e.key == "Escape") {
		handleBlur(e);
		e.target.blur();
	}
};

const handleFocus = (e) => {
	DOMRef.value.classList.remove("active-elements");
};
</script>

<style scoped>
[contenteditable] {
	outline: none;
	min-width: 1px;
}
[contenteditable]:empty:before {
	content: attr(data-placeholder);
}
[contenteditable]:empty:focus:before {
	content: "";
}
</style>
