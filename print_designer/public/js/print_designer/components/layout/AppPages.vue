<template>
	<div :style="['pointer-events: none;', getMarginContainerStyle]" class="margin-container">
		<div
			:class="['main-container', { 'active-page': MainStore.activePage == page }]"
			:ref="setElements(page, page.index)"
			:style="[MainStore.getPageStyle, 'pointer-events: auto;']"
			@mousedown.left="handleMouseDown"
			@mousemove="handleMouseMove"
			@mouseleave="handleMouseLeave"
			@mouseup.left="handleMouseUp"
			@click="
				(e) => {
					MainStore.activePage = getParentPage(e.currentTarget.piniaElementRef);
				}
			"
		>
			<template v-for="(object, index) in page.header" :key="object.id" v-if="page.DOMRef">
				<component
					:is="
						object.type == 'text'
							? isComponent[object.type][object.isDynamic ? 'dynamic' : 'static']
							: isComponent[object.type]
					"
					v-bind="{ object, index }"
				></component>
			</template>
			<template
				v-for="(object, index) in page.childrens"
				:key="object.id"
				v-if="page.DOMRef"
			>
				<component
					:is="
						object.type == 'text'
							? isComponent[object.type][object.isDynamic ? 'dynamic' : 'static']
							: isComponent[object.type]
					"
					v-bind="{ object, index }"
				></component>
			</template>
			<template v-for="(object, index) in page.footer" :key="object.id" v-if="page.DOMRef">
				<component
					:is="
						object.type == 'text'
							? isComponent[object.type][object.isDynamic ? 'dynamic' : 'static']
							: isComponent[object.type]
					"
					v-bind="{ object, index }"
				></component>
			</template>
		</div>
	</div>
</template>

<script setup>
import { nextTick, onMounted, computed, watch } from "vue";

import { useMainStore } from "../../store/MainStore";
import { useElementStore } from "../../store/ElementStore";
import BaseRectangle from "../base/BaseRectangle.vue";
import BaseStaticText from "../base/BaseStaticText.vue";
import BaseDynamicText from "../base/BaseDynamicText.vue";
import BaseImage from "../base/BaseImage.vue";
import BaseTable from "../base/BaseTable.vue";
import BaseBarcode from "../base/BaseBarcode.vue";

import { useDraw } from "../../composables/Draw";
import { useElement } from "../../composables/Element";
import {
	updateElementParameters,
	setCurrentElement,
	recursiveChildrens,
	checkUpdateElementOverlapping,
	getParentPage,
} from "../../utils";

const props = defineProps({
	page: Object,
});

const { drawEventHandler, parameters } = useDraw();

const { setElements } = useElement({
	draggable: false,
	resizable: false,
});

const isComponent = Object.freeze({
	rectangle: BaseRectangle,
	text: {
		static: BaseStaticText,
		dynamic: BaseDynamicText,
	},
	image: BaseImage,
	table: BaseTable,
	barcode: BaseBarcode,
});

const getMarginContainerStyle = computed(() => {
	if (MainStore.mode == "header") {
		return {
			height: MainStore.page.headerHeight + MainStore.page.marginTop + "px",
			width: MainStore.page.width + "px",
			paddingTop: MainStore.page.marginTop + "px",
		};
	} else if (MainStore.mode == "footer") {
		return {
			height: MainStore.page.footerHeight + MainStore.page.marginBottom + "px",
			width: MainStore.page.width + "px",
			paddingBottom: MainStore.page.marginBottom + "px",
		};
	}
	return {
		height: MainStore.page.height + "px",
		width: MainStore.page.width + "px",
		paddingTop: MainStore.page.marginTop + "px",
	};
});

onMounted(() => {
	// TODO: Refactor this as per the new store structure
	ElementStore.$subscribe((mutation, state) => {
		if (
			(mutation.events.type === "set" && mutation.events.key == "Elements") ||
			(mutation.events.type === "add" && mutation.events.newValue.parent?.type == "page")
		) {
			checkUpdateElementOverlapping();
		}
	});
	watch(
		() => [MainStore.page.headerHeight, MainStore.page.footerHeight],
		() => {
			props.page.header[0].height = MainStore.page.headerHeight;
			props.page.footer[0].startY =
				MainStore.page.height -
				MainStore.page.footerHeight -
				MainStore.page.marginTop -
				MainStore.page.marginBottom;
			props.page.footer[0].height = MainStore.page.footerHeight;
		}
	);
	const observer = new IntersectionObserver(
		function (entries, observer) {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					MainStore.visiblePages.push(props.page);
				} else {
					MainStore.visiblePages = MainStore.visiblePages.filter(
						(page) => page.index != props.page.index
					);
				}
			});
		},
		{ root: document.getElementsByClassName("print-format-container")[0] }
	);
	observer.observe(props.page.DOMRef);
});

const handleMouseDown = (e) => {
	if (MainStore.openModal) return;
	if (
		(MainStore.isDrawing && !MainStore.isMarqueeActive) ||
		e.target.piniaElementRef?.type != "page"
	) {
		e.stopPropagation();
	}
	if (e.target.piniaElementRef?.type == "page") {
		MainStore.isMoveStart = true;
		let top = 0;
		let bottom =
			MainStore.page.height - MainStore.page.marginTop - MainStore.page.marginBottom;
		let left = 0;
		let right = MainStore.page.width - MainStore.page.marginLeft - MainStore.page.marginRight;
		if (MainStore.isDrawing) {
			MainStore.currentDrawListener = {
				drawEventHandler,
				parameters,
				restrict: {
					top,
					bottom,
					left,
					right,
				},
			};
			const newElement = ElementStore.createNewObject(e, e.target.piniaElementRef);
			newElement && setCurrentElement(e, newElement);
			drawEventHandler.mousedown({
				startX: e.offsetX,
				startY: e.offsetY,
				clientX: e.clientX,
				clientY: e.clientY,
			});
		} else if (MainStore.activeControl == "text") {
			if (MainStore.getCurrentElementsId.length) {
				MainStore.getCurrentElementsId.forEach((element) => {
					delete MainStore.currentElements[element];
				});
			} else {
				const newElement = ElementStore.createNewObject(e, e.target.piniaElementRef);
				newElement && setCurrentElement(e, newElement);
				if (MainStore.textControlType == "dynamic") {
					MainStore.openDynamicModal = newElement;
				}
			}
		} else {
			MainStore.currentDrawListener = { drawEventHandler, parameters };
		}
	}
};

const handleMouseMove = (e) => {
	if (MainStore.openModal || !MainStore.isMoveStart) return;
	if (
		(MainStore.isDrawing && !MainStore.isMarqueeActive) ||
		(e.target.piniaElementRef?.type != "page" && !MainStore.isMarqueeActive)
	) {
		e.stopPropagation();
	}
	if (MainStore.activeControl == "text") return;
	MainStore.currentDrawListener?.drawEventHandler.mousemove(e);
	if (
		!MainStore.isMoved &&
		(MainStore.currentDrawListener?.parameters.width > 3 ||
			MainStore.currentDrawListener?.parameters.height > 3)
	) {
		MainStore.isMoved = true;
	}
	if (
		!MainStore.openModal &&
		MainStore.isDrawing &&
		MainStore.lastCreatedElement &&
		MainStore.currentDrawListener?.parameters.isMouseDown
	) {
		updateElementParameters(e);
		if (MainStore.activeControl == "table") {
			let width = MainStore.currentDrawListener.parameters.width;
			let columns = Math.floor(width / 100);
			let elementColumns = MainStore.lastCreatedElement.columns;
			!elementColumns.length &&
				elementColumns.push({ id: 0, label: "", style: {}, applyStyleToHeader: false });
			if (width > 100) {
				let columnDif = columns - elementColumns.length;
				if (columnDif == 0) {
					return;
				} else if (columnDif < 0) {
					elementColumns.pop();
				} else {
					for (let index = 0; index < columnDif; index++) {
						elementColumns.push({
							id: elementColumns.length,
							label: "",
							style: {},
							applyStyleToHeader: false,
						});
					}
				}
			}
		}
	}
};

const handleMouseUp = (e) => {
	if (MainStore.isDropped) {
		MainStore.currentElements = MainStore.isDropped;
		MainStore.isDropped = null;
		return;
	}
	if (MainStore.isDrawing && !MainStore.isMarqueeActive) {
		e.stopPropagation();
	}
	if (e.target.piniaElementRef?.type == "page") {
		if (MainStore.isDrawing) {
			if (
				MainStore.lastCreatedElement &&
				!MainStore.openModal &&
				!MainStore.isMoved &&
				MainStore.currentDrawListener?.parameters.isMouseDown
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
				MainStore.currentElements[MainStore.lastCreatedElement.id] =
					MainStore.lastCreatedElement;
				MainStore.openModal = true;
			}
			if (MainStore.activeControl == "table") {
				MainStore.setActiveControl("MousePointer");
				if (MainStore.frappeControls.table?.get_value() == "") {
					MainStore.frappeControls.table.set_focus();
				}
			}
		} else {
			MainStore.currentDrawListener?.drawEventHandler.mouseup(e);
		}
		MainStore.isMoveStart = false;
		MainStore.isMoved = false;
	}
	if (
		MainStore.isDrawing &&
		MainStore.isMoved &&
		MainStore.lastCreatedElement?.type == "image"
	) {
		!MainStore.openImageModal &&
			nextTick(() => (MainStore.openImageModal = MainStore.lastCreatedElement));
		MainStore.setActiveControl("MousePointer");
	}
	if (
		MainStore.isDrawing &&
		MainStore.isMoved &&
		MainStore.lastCreatedElement?.type == "barcode"
	) {
		!MainStore.openBarcodeModal &&
			nextTick(() => (MainStore.openBarcodeModal = MainStore.lastCreatedElement));
		MainStore.setActiveControl("MousePointer");
	}
	if (MainStore.isDrawing && MainStore.lastCreatedElement?.type == "rectangle") {
		const recursiveParentLoop = (currentElement, offset = { startX: 0, startY: 0 }) => {
			if (currentElement.parent.type != "page") {
				let currentDOM = MainStore.lastCreatedElement.DOMRef.getBoundingClientRect();
				let parentDOM = currentElement.parent.DOMRef.getBoundingClientRect();
				if (
					parentDOM.left > currentDOM.left + 1 ||
					parentDOM.top > currentDOM.top + 1 ||
					parentDOM.bottom < currentDOM.bottom - 1 ||
					parentDOM.right < currentDOM.right - 1
				) {
					offset.startX += currentElement.parent.startX + 1;
					offset.startY += currentElement.parent.startY + 1;
					recursiveParentLoop(currentElement.parent, offset);
				} else {
					if (MainStore.lastCreatedElement === currentElement) return;
					let tempElement = { ...MainStore.lastCreatedElement.parent.childrens.pop() };
					tempElement.id = frappe.utils.get_random(10);
					tempElement.index = null;
					tempElement.DOMRef = null;
					tempElement.parent = currentElement.parent;
					tempElement.startX += offset.startX;
					tempElement.startY += offset.startY;
					tempElement.style = { ...tempElement.style };
					currentElement.parent.childrens.push(tempElement);
					MainStore.getCurrentElementsId.forEach((element) => {
						delete MainStore.currentElements[element];
					});
					MainStore.currentElements[tempElement.id] = tempElement;
					return;
				}
			} else if (MainStore.lastCreatedElement.parent.type != "page") {
				let tempElement = { ...MainStore.lastCreatedElement.parent.childrens.pop() };
				tempElement.id = frappe.utils.get_random(10);
				tempElement.index = null;
				tempElement.DOMRef = null;
				tempElement.parent = ElementStore.Elements;
				tempElement.startX += offset.startX;
				tempElement.startY += offset.startY;
				tempElement.style = { ...tempElement.style };
				ElementStore.Elements.push(tempElement);
				MainStore.getCurrentElementsId.forEach((element) => {
					delete MainStore.currentElements[element];
				});
				MainStore.currentElements[tempElement.id] = tempElement;
				return;
			}
		};
		recursiveParentLoop(MainStore.lastCreatedElement);
		let Rect = {
			top: MainStore.lastCreatedElement.startY,
			left: MainStore.lastCreatedElement.startX,
			bottom: MainStore.lastCreatedElement.startY + MainStore.lastCreatedElement.height,
			right: MainStore.lastCreatedElement.startX + MainStore.lastCreatedElement.width,
		};
		const parentElement = MainStore.lastCreatedElement.parent.childrens;
		parentElement.forEach((element) => {
			nextTick(() => {
				if (element.id != MainStore.lastCreatedElement.id) {
					let elementRect = {
						top: element.startY,
						left: element.startX,
						bottom: element.startY + element.height,
						right: element.startX + element.width,
					};
					if (
						Rect.top < elementRect.top &&
						Rect.left < elementRect.left &&
						Rect.right > elementRect.right &&
						Rect.bottom > elementRect.bottom
					) {
						let splicedElement = {
							...element.parent.childrens.splice(
								element.parent.childrens.indexOf(element),
								1
							)[0],
						};
						splicedElement.startX =
							element.startX - MainStore.lastCreatedElement.startX;
						splicedElement.startY =
							element.startY - MainStore.lastCreatedElement.startY;
						splicedElement.parent = MainStore.lastCreatedElement;
						recursiveChildrens({ element: splicedElement, isClone: false });
						splicedElement.parent.childrens.push(splicedElement);
					}
				}
			});
		});
		MainStore.currentDrawListener?.drawEventHandler.mouseup(e);
	}
};

const handleMouseLeave = (e) => {
	if (!e.buttons) return;
	MainStore.setActiveControl("MousePointer");
	if (MainStore.currentDrawListener) {
		MainStore.currentDrawListener?.drawEventHandler.mouseup(e);
	}
	MainStore.isMoveStart = false;
	MainStore.isMoved = false;
	MainStore.lastCloned = null;
};
const MainStore = useMainStore();
const ElementStore = useElementStore();
</script>

<style scoped>
.margin-container {
	margin: 50px auto;
	background: var(--gray-300);

	& .main-container {
		position: relative;
		background-color: white;
		height: 100%;
		margin-left: calc(-1 * var(--print-margin-left));
		scroll-margin-top: 50px;

		&.active-page {
			outline: 1px solid color(from var(--primary) srgb r g b / 0.5) !important;
		}
	}
}
</style>
