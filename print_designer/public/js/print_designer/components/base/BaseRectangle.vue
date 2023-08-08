<template>
	<div
		:style="[style, postionalStyles(startX, startY, width, height)]"
		:class="[
			'rectangle',
			{ 'active-elements': MainStore.getCurrentElementsId.includes(id) },
			classes,
		]"
		:ref="setElements(object, index)"
		@mousedown.left.stop="handleMouseDown($event, object, index)"
		@mouseup.left="handleMouseUp($event, object, index)"
	>
		<BaseResizeHandles
			v-if="
				MainStore.activeControl == 'mouse-pointer' &&
				MainStore.getCurrentElementsId.includes(id)
			"
		/>
		<template v-for="(object, index) in object.childrens" :key="object.id">
			<component
				:is="
					object.type == 'text'
						? isComponent[object.type][object.isDynamic ? 'dynamic' : 'static']
						: isComponent[object.type]
				"
				v-bind="{ object, index }">
			</component>
		</template>
	</div>
</template>

<script setup>
import BaseStaticText from "./BaseStaticText.vue";
import BaseDynamicText from "./BaseDynamicText.vue";
import BaseImage from "./BaseImage.vue";
import BaseTable from "./BaseTable.vue";
import BaseBarcode from "./BaseBarcode.vue";
import BaseResizeHandles from "./BaseResizeHandles.vue";
import { toRefs } from "vue";
import { useMainStore } from "../../store/MainStore";
import { useElementStore } from "../../store/ElementStore";
import { useElement } from "../../composables/Element";
import { useDraw } from "../../composables/Draw";
import {
	setCurrentElement,
	cloneElement,
	deleteCurrentElements,
	lockAxis,
	postionalStyles,
} from "../../utils";

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
const isComponent = Object.freeze({
	rectangle: "BaseRectangle",
	text: {
		static: BaseStaticText,
		dynamic: BaseDynamicText,
	},
	image: BaseImage,
	table: BaseTable,
	barcode: BaseBarcode
});
const { id, startX, startY, width, height, style, classes } = toRefs(props.object);
const ElementStore = useElementStore();
const MainStore = useMainStore();

const { setElements } = useElement({
	draggable: true,
	resizable: true,
});

const { drawEventHandler, parameters } = useDraw();

const handleMouseDown = (e, element = null, index) => {
	if (MainStore.openModal) return;
	lockAxis(element, e.shiftKey);
	MainStore.isMoveStart = true;
	if (MainStore.activeControl == "mouse-pointer" && e.altKey) {
		element && setCurrentElement(e, element);
		cloneElement();
		drawEventHandler.mousedown(e);
	} else {
		if (MainStore.isDrawing) {
			const newElement = ElementStore.createNewObject(
				{
					startX: e.offsetX,
					startY: e.offsetY,
					pageX: e.x,
					pageY: e.y,
				},
				element
			);
			drawEventHandler.mousedown({
				startX: e.offsetX,
				startY: e.offsetY,
				clientX: e.clientX,
				clientY: e.clientY,
			});
			newElement && setCurrentElement(e, newElement);
		} else if (MainStore.activeControl == "text") {
			if (MainStore.getCurrentElementsId.length) {
				MainStore.getCurrentElementsId.forEach((element) => {
					delete MainStore.currentElements[element];
				});
			} else {
				const newElement = ElementStore.createNewObject(
					{
						startX: e.offsetX,
						startY: e.offsetY,
						pageX: e.x,
						pageY: e.y,
					},
					element
				);
				newElement && setCurrentElement(e, newElement);
				if (MainStore.textControlType == "dynamic") {
					MainStore.openDynamicModal = newElement;
				}
			}
		} else {
			element && setCurrentElement(e, element);
		}
	}
	MainStore.currentDrawListener = {
		drawEventHandler,
		parameters,
		restrict: {
			top: startY.value - e.target.offsetTop - 1,
			bottom: startY.value + height.value - e.target.offsetTop - 1,
			left: startX.value - e.target.offsetLeft - 1,
			right: startX.value + width.value - e.target.offsetLeft - 1,
		},
	};
};

const handleMouseUp = (e, element = null, index) => {
	if (
		e.target.classList.contains("resize-handle")
			? e.target.parentElement !== element.DOMRef
			: e.target !== element.DOMRef
	)
		return;
	if (MainStore.isDropped) {
		MainStore.currentElements = MainStore.isDropped;
		MainStore.isDropped = null;
		MainStore.isMoved = MainStore.isMoveStart = false;
		MainStore.lastCloned = null;
		return;
	}
	if (
		!MainStore.openModal &&
		!MainStore.isMoved &&
		MainStore.activeControl == "mouse-pointer" &&
		e.target == element.DOMRef
	) {
		element && setCurrentElement(e, element);
	}
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
		MainStore.currentDrawListener?.drawEventHandler.mouseup(e);
	}
	MainStore.isMoved = MainStore.isMoveStart = false;
	MainStore.lastCloned = null;
};
</script>

<script>
export default {
	name: "BaseRectangle"
}
</script>

<style lang="scss" scoped></style>
