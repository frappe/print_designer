<template>
	<div
		:style="[
			postionalStyles(startX, startY, width, height),
			{ padding: '1px' },
			style.zIndex && { zIndex: style.zIndex },
		]"
		:ref="setElements(object, index)"
		:class="[MainStore.getCurrentElementsId.includes(id) && 'active-elements']"
		@mousedown.left="handleMouseDown($event, object)"
		@dblclick.stop="handleDblClick($event, object)"
		@mouseup="handleMouseUp($event, object)"
	>
		<div
			v-if="isDynamic ? image && Boolean(image.value) : image && Boolean(image.file_url)"
			:style="[
				widthHeightStyle(width, height),
				style,
				style.backgroundColor == '' && { backgroundColor: 'transparent' },
				`background-image: url('${isDynamic ? image.value : image.file_url}');`,
			]"
			:class="['image', classes]"
			:key="id"
		></div>
		<div class="fallback-image" v-else>
			<div class="content">
				<IconsUse
					v-if="width >= 30 || height >= 30"
					:draggable="false"
					:size="18"
					name="es-line-image-alt1"
					key="es-line-image-alt1"
				/>
				<span
					v-if="
						(width >= 120 || height >= 120) && isDynamic
							? image && !Boolean(image.value)
							: image && !Boolean(image.file_url)
					"
					>{{ isDynamic ? "Image not Linked" : "Unable to load Image :(" }}</span
				>
				<span v-else-if="width >= 120 || height >= 120"
					>Please Double click to select Image</span
				>
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
import { useMainStore } from "../../store/MainStore";
import { toRefs } from "vue";
import { useElement } from "../../composables/Element";
import {
	postionalStyles,
	setCurrentElement,
	lockAxis,
	cloneElement,
	deleteCurrentElements,
	widthHeightStyle,
} from "../../utils";
import { useDraw } from "../../composables/Draw";
import BaseResizeHandles from "./BaseResizeHandles.vue";
import IconsUse from "../../icons/IconsUse.vue";

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

const { id, image, isDynamic, startX, startY, width, height, style, classes } = toRefs(
	props.object
);

const { setElements } = useElement({
	draggable: true,
	resizable: true,
});

const { drawEventHandler, parameters } = useDraw();

const handleMouseDown = (e, element = null) => {
	e.stopPropagation();
	if (MainStore.openModal) return;
	lockAxis(element, e.shiftKey);
	MainStore.isMoveStart = true;
	if (MainStore.activeControl == "mouse-pointer" && e.altKey) {
		element && setCurrentElement(e, element);
		cloneElement();
	} else {
		element && setCurrentElement(e, element);
	}
	MainStore.setActiveControl("MousePointer");
	MainStore.currentDrawListener = {
		drawEventHandler,
		parameters,
	};
};

const handleMouseUp = (e, element = null) => {
	if (
		e.target.classList.contains("resize-handle")
			? e.target.parentElement !== element.DOMRef
			: e.target !== element.DOMRef
	)
		return;
	if (
		MainStore.lastCreatedElement &&
		!MainStore.openModal &&
		!MainStore.isMoved &&
		MainStore.isDrawing
	) {
		if (!MainStore.modalLocation.isDragged) {
			clientX = e.clientX;
			clientY = e.clientY;
			if (clientX - 250 > 0) clientX = clientX - 250;
			if (clientY - 180 > 0) clientY = clientY - 180;
			MainStore.modalLocation.x = clientX;
			MainStore.modalLocation.y = clientY;
		}
		MainStore.getCurrentElementsId.forEach((element) => {
			delete MainStore.currentElements[element];
		});
		MainStore.currentElements[MainStore.lastCreatedElement.id] = MainStore.lastCreatedElement;
		MainStore.openModal = true;
	} else if (
		MainStore.lastCloned &&
		!MainStore.isMoved &&
		MainStore.activeControl == "mouse-pointer"
	) {
		deleteCurrentElements();
	} else {
		MainStore.activeControl == "image" && (MainStore.openImageModal = element);
	}
	MainStore.setActiveControl("MousePointer");
	MainStore.isMoved = MainStore.isMoveStart = false;
	MainStore.lastCloned = null;
};

const handleDblClick = (e, element) => {
	element && setCurrentElement(e, element);
	MainStore.openImageModal = element;
};
</script>

<style lang="scss" scoped>
.fallback-image {
	width: 100%;
	user-select: none;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--gray-100);
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;

		span {
			font-size: smaller;
			text-align: center;
		}
	}
}
</style>
