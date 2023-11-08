<template>
	<div>
		<div
			class="canvas"
			id="canvas"
			v-marquee="marqueeOptions"
			v-show="MainStore.mode != 'preview'"
			:style="[MainStore.mode == 'editing' && { cursor: MainStore.cursor }]"
		>
			<div
				class="main-container"
				:ref="
					(el) => {
						MainStore.mainContainer = el;
					}
				"
				:style="MainStore.getPageSettings"
				@mousedown.left="handleMouseDown"
				@mousemove="handleMouseMove"
				@mouseleave="handleMouseLeave"
				@mouseup.left="handleMouseUp"
			>
				<AppPdfSetup v-if="MainStore.mode == 'pdfSetup'" />
				<template v-for="(object, index) in ElementStore.Elements" :key="object.id">
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
			<AppWidthHeightModal v-if="!!MainStore.openModal" :openModal="MainStore.openModal" />
			<AppDynamicTextModal
				v-if="!!MainStore.openDynamicModal || !!MainStore.openTableColumnModal?.table"
				:openDynamicModal="
					MainStore.openDynamicModal || MainStore.openTableColumnModal.column
				"
				:table="
					MainStore.openTableColumnModal ? MainStore.openTableColumnModal.table : null
				"
			/>
			<AppBarcodeModal
				v-if="!!MainStore.openBarcodeModal"
				:openBarcodeModal="MainStore.openBarcodeModal"
			/>
			<AppImageModal
				v-if="!!MainStore.openImageModal"
				:openImageModal="MainStore.openImageModal"
			/>
		</div>
		<AppPreviewPdf v-if="MainStore.mode == 'preview'" />
	</div>
</template>
<script setup>
import BaseRectangle from "../base/BaseRectangle.vue";
import BaseStaticText from "../base/BaseStaticText.vue";
import BaseDynamicText from "../base/BaseDynamicText.vue";
import BaseImage from "../base/BaseImage.vue";
import BaseTable from "../base/BaseTable.vue";
import AppPdfSetup from "./AppPdfSetup.vue";
import AppPreviewPdf from "./AppPreviewPdf.vue";
import AppWidthHeightModal from "./AppWidthHeightModal.vue";
import AppDynamicTextModal from "./AppDynamicTextModal.vue";
import AppBarcodeModal from "./AppBarcodeModal.vue";
import AppImageModal from "./AppImageModal.vue";
import { watch, watchEffect, onMounted, nextTick } from "vue";
import { useMainStore } from "../../store/MainStore";
import { useElementStore } from "../../store/ElementStore";
import { useMarqueeSelection } from "../../composables/MarqueeSelectionTool";
import { useDraw } from "../../composables/Draw";
import { updateElementParameters, setCurrentElement, recursiveChildrens } from "../../utils";
import { useChangeValueUnit } from "../../composables/ChangeValueUnit";
import BaseBarcode from "../base/BaseBarcode.vue";
const isComponent = Object.freeze({
	rectangle: BaseRectangle,
	text: {
		static: BaseStaticText,
		dynamic: BaseDynamicText,
	},
	image: BaseImage,
	table: BaseTable,
	barcode: BaseBarcode
});
const MainStore = useMainStore();
const ElementStore = useElementStore();
const { vMarquee } = useMarqueeSelection();
const marqueeOptions = {
	beforeDraw: "isMarqueeActive",
};

const { drawEventHandler, parameters } = useDraw();

const handleMouseDown = (e) => {
	if (MainStore.openModal) return;
	if (
		(MainStore.isDrawing && !MainStore.isMarqueeActive) ||
		e.target != MainStore.mainContainer
	) {
		e.stopPropagation();
	}
	if (e.target == MainStore.mainContainer) {
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
			const newElement = ElementStore.createNewObject(e);
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
				const newElement = ElementStore.createNewObject(e);
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
		(e.target != MainStore.mainContainer && !MainStore.isMarqueeActive)
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
			!elementColumns.length && elementColumns.push({ id: 0, label: "" });
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
	if (e.target == MainStore.mainContainer) {
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
			}
		} else {
			MainStore.currentDrawListener?.drawEventHandler.mouseup(e);
		}
		MainStore.isMoveStart = false;
		MainStore.isMoved = false;
	}
	if (MainStore.isDrawing && MainStore.isMoved && MainStore.lastCreatedElement?.type == "image") {
		!MainStore.openImageModal &&
			nextTick(() => (MainStore.openImageModal = MainStore.lastCreatedElement));
		MainStore.setActiveControl("MousePointer");
	}
	if (MainStore.isDrawing && MainStore.isMoved && MainStore.lastCreatedElement?.type == "barcode") {
		!MainStore.openBarcodeModal &&
			nextTick(() => (MainStore.openBarcodeModal = MainStore.lastCreatedElement));
		MainStore.setActiveControl("MousePointer");
	}
	if (MainStore.isDrawing && MainStore.lastCreatedElement?.type == "rectangle") {
		const recursiveParentLoop = (currentElement, offset = { startX: 0, startY: 0 }) => {
			if (currentElement.parent != ElementStore.Elements) {
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
			} else if (MainStore.lastCreatedElement.parent != ElementStore.Elements) {
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
		let parentElement;
		if (MainStore.lastCreatedElement.parent == ElementStore.Elements) {
			parentElement = MainStore.lastCreatedElement.parent;
		} else {
			parentElement = MainStore.lastCreatedElement.parent.childrens;
		}
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
						let splicedElement;
						if (element.parent == ElementStore.Elements) {
							splicedElement = {
								...element.parent.splice(element.parent.indexOf(element), 1)[0],
							};
						} else {
							splicedElement = {
								...element.parent.childrens.splice(
									element.parent.childrens.indexOf(element),
									1
								)[0],
							};
						}
						splicedElement.startX =
							element.startX - MainStore.lastCreatedElement.startX;
						splicedElement.startY =
							element.startY - MainStore.lastCreatedElement.startY;
						splicedElement.parent = MainStore.lastCreatedElement;
						recursiveChildrens({ element: splicedElement, isClone: false });
						if (splicedElement.parent === ElementStore.Elements) {
							splicedElement.parent.push(splicedElement);
						} else {
							splicedElement.parent.childrens.push(splicedElement);
						}
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

onMounted(() => {
	let globalRulesWatcher = watch(
		() => [MainStore.screenStyleSheet, MainStore.globalStyles],
		() => {
			if (MainStore.screenStyleSheet && MainStore.globalStyles) {
				MainStore.addGlobalRules();
				globalRulesWatcher();
				Object.entries(MainStore.globalStyles).forEach((element) => {
					watch(
						() => MainStore.globalStyles[element[0]].style,
						() => {
							if (MainStore.screenStyleSheet && element[1].mainCssRule) {
								Object.entries(MainStore.globalStyles[element[0]].style).forEach(
									(style) => {
										if (element[1].mainCssRule.style[style[0]] != style[1]) {
											element[1].mainCssRule.style[style[0]] = style[1];
										}
									}
								);
							}
						},
						{ deep: true, immediate: true }
					);
					if (element[1].labelStyle) {
						watch(
							() => MainStore.globalStyles[element[0]].labelStyle,
							() => {
								if (MainStore.screenStyleSheet && element[1].labelCssRule) {
									Object.entries(
										MainStore.globalStyles[element[0]].labelStyle
									).forEach((style) => {
										if (element[1].labelCssRule.style[style[0]] != style[1]) {
											element[1].labelCssRule.style[style[0]] = style[1];
										}
									});
								}
							},
							{ deep: true, immediate: true }
						);
					}
					if (element[1].headerStyle) {
						watch(
							() => MainStore.globalStyles[element[0]].headerStyle,
							() => {
								if (MainStore.screenStyleSheet && element[1].headerCssRule) {
									Object.entries(
										MainStore.globalStyles[element[0]].headerStyle
									).forEach((style) => {
										if (element[1].headerCssRule.style[style[0]] != style[1]) {
											element[1].headerCssRule.style[style[0]] = style[1];
										}
									});
								}
							},
							{ deep: true, immediate: true }
						);
					}
				});
			}
		}
	);
	watchEffect(() => {
		if (MainStore.screenStyleSheet) {
			if (MainStore.screenStyleSheet.CssRuleIndex != null) {
				MainStore.screenStyleSheet.deleteRule(MainStore.screenStyleSheet.CssRuleIndex);
			}
			MainStore.screenStyleSheet.CssRuleIndex = MainStore.addStylesheetRules([
				[
					":root, ::after, ::before",
					[
						"--print-width",
						MainStore.convertToPageUOM(MainStore.page.width) + MainStore.page.UOM,
					],
					[
						"--print-height",
						MainStore.convertToPageUOM(MainStore.page.height) + MainStore.page.UOM,
					],
					[
						"--print-container-width",
						MainStore.convertToPageUOM(
							MainStore.page.width + MainStore.page.marginLeft
						) + MainStore.page.UOM,
					],
					[
						"--print-container-height",
						MainStore.convertToPageUOM(
							MainStore.page.height + MainStore.page.marginTop
						) + MainStore.page.UOM,
					],
					[
						"--print-margin-top",
						-MainStore.convertToPageUOM(MainStore.page.marginTop) + MainStore.page.UOM,
					],
					[
						"--print-margin-bottom",
						MainStore.convertToPageUOM(MainStore.page.marginBottom) +
							MainStore.page.UOM,
					],
					[
						"--print-margin-left",
						-MainStore.convertToPageUOM(MainStore.page.marginLeft) +
							MainStore.page.UOM,
					],
					[
						"--print-margin-right",
						MainStore.convertToPageUOM(MainStore.page.marginRight) +
							MainStore.page.UOM,
					],
				],
			]);
		}
	});
});
watchEffect(() => {
	if (MainStore.printStyleSheet && MainStore.page) {
		const convertToMM = (input) => {
			let convertedUnit = useChangeValueUnit({
				inputString: input,
				defaultInputUnit: "px",
				convertionUnit: "mm",
			});
			if (convertedUnit.error) return;
			return convertedUnit.value.toFixed(3) + `${convertedUnit.unit}`;
		};
		MainStore.addStylesheetRules(
			[
				[
					"@page",
					[
						"size",
						convertToMM(MainStore.page.width) +
							" " +
							convertToMM(MainStore.page.height),
					],
					["margin-top", convertToMM(MainStore.page.marginTop)],
					["margin-bottom", convertToMM(MainStore.page.marginBottom)],
					["margin-left", convertToMM(MainStore.page.marginLeft)],
					["margin-right", convertToMM(MainStore.page.marginRight)],
				],
			],
			"print"
		);
	}
});
watchEffect(() => {
	if (MainStore.screenStyleSheet && MainStore.modalLocation) {
		MainStore.addStylesheetRules([
			[
				":root",
				["--scale-factor", window.devicePixelRatio + "px"],
				["--modal-x", MainStore.modalLocation.x + "px"],
				["--modal-y", MainStore.modalLocation.y + "px"],
			],
		]);
	}
});
</script>
<style deep lang="scss">
.active-elements {
	will-change: left, top, width, height;
	z-index: 1000 !important;
	outline: 1px solid var(--primary) !important;
}
.inHeaderFooter {
	outline: 1px solid var(--primary) !important;
	outline-offset: -1px;
}
.overlappingHeaderFooter {
	outline: 1px solid var(--danger) !important;
	outline-offset: -1px;
}
.selection {
	border: 1px solid var(--primary);
	background-color: rgba(196, 183, 150, 0.1);
	position: absolute;
}
.canvas {
	display: block;
	z-index: 0;
	position: relative;
	flex: 1;
}
.main-container {
	position: relative;
	background-color: white;
	margin: 50px auto;
	margin-top: calc((-1 * var(--print-margin-top)) + 50px);
	height: 100%;
}
.main-container:after {
	display: block;
	position: absolute;
	content: "";
	background: var(--gray-300);
	height: var(--print-height);
	width: var(--print-width);
	z-index: -1;
	margin-top: var(--print-margin-top);
	margin-left: var(--print-margin-left);
	margin-right: calc(var(--print-margin-right) * -1);
	margin-bottom: calc(var(--print-margin-bottom) * -1);
}
</style>
