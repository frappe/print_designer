<template>
	<div>
		<div
			class="canvas"
			id="canvas"
			ref="canvasContainer"
			v-marquee="marqueeOptions"
			:style="[MainStore.mode == 'editing' && { cursor: MainStore.cursor }]"
		>
			<AppPages v-for="page in ElementStore.Elements" :key="page.index" :page="page" />
			<div class="page-btn-wrapper">
				<button
					class="btn"
					@click="
						async (event) => {
							await addNewPage(event);
						}
					"
				>
					<IconsUse
						:draggable="false"
						:size="18"
						name="es-line-add"
						key="es-line-add"
						color="var(--invert-neutral)"
					/>
					{{
						MainStore.mode == "editing"
							? "Add New Page"
							: `Add New ${
									MainStore.mode.charAt(0).toUpperCase() +
									MainStore.mode.slice(1)
							  }`
					}}
				</button>
				<button
					class="btn"
					v-if="MainStore.mode != 'editing'"
					@click="
						async (event) => {
							await saveHeaderFooter(event, true);
						}
					"
				>
					<IconsUse
						:draggable="false"
						:size="18"
						name="es-line-close"
						key="es-line-close"
						color="var(--invert-neutral)"
					/>
					Close
				</button>
				<button
					class="btn btn-primary"
					v-if="MainStore.mode != 'editing'"
					@click="
						async (event) => {
							await saveHeaderFooter(event);
						}
					"
				>
					<IconsUse
						:draggable="false"
						:size="18"
						name="es-line-check"
						key="es-line-check"
					/>
					{{
						`Save ${MainStore.mode.charAt(0).toUpperCase() + MainStore.mode.slice(1)}`
					}}
				</button>
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
			<AppUserProvidedJinjaModal v-if="!!MainStore.openJinjaModal" />
		</div>
		<AppPreviewPdf v-if="MainStore.mode == 'preview'" />
	</div>
</template>
<script setup>
import AppPages from "./AppPages.vue";
import AppWidthHeightModal from "./AppWidthHeightModal.vue";
import AppDynamicTextModal from "./AppDynamicTextModal.vue";
import AppUserProvidedJinjaModal from "./AppUserProvidedJinjaModal.vue";
import AppBarcodeModal from "./AppBarcodeModal.vue";
import AppImageModal from "./AppImageModal.vue";
import IconsUse from "../../icons/IconsUse.vue";
import { watch, watchEffect, onMounted, ref, nextTick } from "vue";
import { useMainStore } from "../../store/MainStore";
import { useElementStore } from "../../store/ElementStore";
import { updateDynamicData, createHeaderFooterElement } from "../../utils";
import { useMarqueeSelection } from "../../composables/MarqueeSelectionTool";
import { useChangeValueUnit } from "../../composables/ChangeValueUnit";
const MainStore = useMainStore();
const ElementStore = useElementStore();
const { vMarquee } = useMarqueeSelection();
const marqueeOptions = {
	beforeDraw: "isMarqueeActive",
};

const canvasContainer = ref(null);

const addNewPage = async (event) => {
	if (MainStore.mode == "editing") {
		const newPage = {
			type: "page",
			index: ElementStore.Elements.length,
			DOMRef: null,
			isDropZone: true,
			childrens: [],
		};
		ElementStore.Elements.push(newPage);
		MainStore.activePage = newPage;
		// TODO: make this Object instead of array
		newPage.header = [
			createHeaderFooterElement(
				ElementStore.getHeaderObject(newPage.index).childrens,
				"header"
			),
		];
		ElementStore.Elements.at(-2).header = [
			createHeaderFooterElement(
				ElementStore.getHeaderObject(ElementStore.Elements.at(-2).index).childrens,
				"header"
			),
		];
		newPage.footer = [
			createHeaderFooterElement(
				ElementStore.getFooterObject(newPage.index).childrens,
				"footer"
			),
		];
		ElementStore.Elements.at(-2).footer = [
			createHeaderFooterElement(
				ElementStore.getFooterObject(ElementStore.Elements.at(-2).index).childrens,
				"footer"
			),
		];
		await updateDynamicData();
		nextTick(() => {
			newPage.DOMRef?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
	} else {
		const newPage = {
			type: "page",
			childrens: [],
			firstPage: false,
			oddPage: false,
			evenPage: false,
			lastPage: false,
			DOMRef: null,
		};
		ElementStore.Elements.push(newPage);
		nextTick(() => {
			newPage.DOMRef?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
	}
	event.target.blur();
};
const saveHeaderFooter = async (e, isCanceled = false) => {
	let object, headerFooterObj;
	if (MainStore.mode == "header") {
		object = [...ElementStore.HeadersRawObject];
		headerFooterObj = ElementStore.Headers;
	} else {
		object = [...ElementStore.FootersRawObject];
		headerFooterObj = ElementStore.Footers;
	}
	if (!isCanceled) {
		headerFooterObj.length = 0;
		ElementStore.Elements.forEach((element) => {
			const el = { ...element };
			delete el.DOMRef;
			delete el.parent;
			el.childrens = [...element.childrens.map((el) => ElementStore.childrensSave(el))];
			headerFooterObj.push(el);
		});
	} else {
		headerFooterObj = [];
		headerFooterObj.push(
			...object.map((el) => ElementStore.childrensLoad(el, headerFooterObj))
		);
	}
	if (MainStore.mode == "header") {
		ElementStore.Headers = headerFooterObj;
	} else {
		ElementStore.Footers = headerFooterObj;
	}
	ElementStore.Elements.length = 0;
	ElementStore.Elements.push(
		...ElementStore.ElementsRawObject.map((el) =>
			ElementStore.childrensLoad(el, ElementStore.Elements)
		)
	);
	ElementStore.Elements.map(
		(el) =>
			(el.header = [
				createHeaderFooterElement(
					ElementStore.getHeaderObject(el.index).childrens,
					"header"
				),
			])
	);
	ElementStore.Elements.map(
		(el) =>
			(el.footer = [
				createHeaderFooterElement(
					ElementStore.getFooterObject(el.index).childrens,
					"footer"
				),
			])
	);
	MainStore.mode = "editing";
	await updateDynamicData();
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
					if (element[1].altStyle) {
						watch(
							() => MainStore.globalStyles[element[0]].altStyle,
							() => {
								if (MainStore.screenStyleSheet && element[1].altCssRule) {
									Object.entries(
										MainStore.globalStyles[element[0]].altStyle
									).forEach((style) => {
										if (element[1].altCssRule.style[style[0]] != style[1]) {
											element[1].altCssRule.style[style[0]] = style[1];
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
	// 	function getViewPercentage(element) {
	// 		const viewport = {
	// 			top: window.scrollY,
	// 			bottom: window.scrollY + window.innerHeight
	// 		};

	// 		const elementBoundingRect = element.getBoundingClientRect();
	// 		const elementPos = {
	// 			top: elementBoundingRect.y + window.scrollY,
	// 			bottom: elementBoundingRect.y + elementBoundingRect.height + window.scrollY
	// 		};

	// 		if (viewport.top > elementPos.bottom || viewport.bottom < elementPos.top) {
	// 			return 0;
	// 		}

	// 		// Element is fully within viewport
	// 		if (viewport.top < elementPos.top && viewport.bottom > elementPos.bottom) {
	// 			return 100;
	// 		}

	// 		// Element is bigger than the viewport
	// 		if (elementPos.top < viewport.top && elementPos.bottom > viewport.bottom) {
	// 			return 100;
	// 		}

	// 		const elementHeight = elementBoundingRect.height;
	// 		let elementHeightInView = elementHeight;

	// 		if (elementPos.top < viewport.top) {
	// 			elementHeightInView = elementHeight - (window.scrollY - elementPos.top);
	// 		}

	// 		if (elementPos.bottom > viewport.bottom) {
	// 			elementHeightInView = elementHeightInView - (elementPos.bottom - viewport.bottom);
	// 		}

	// 		const percentageInView = (elementHeightInView / window.innerHeight) * 100;

	// 		return Math.round(percentageInView);
	// }
	// 	const handleScroll = (e) => {
	// 		if (MainStore.visiblePages.length == 1) {
	// 			if (MainStore.visiblePages[0].index != MainStore.activePage) {
	// 				MainStore.activePage = MainStore.visiblePages[0].index;
	// 			}
	// 		} else {
	// 			MainStore.visiblePages.sort((a, b) => a.index < b.index ? -1 : 1);
	// 			firstPage = MainStore.visiblePages[0].DOMRef;
	// 			secondPage = MainStore.visiblePages[1].DOMRef;
	// 			if (getViewPercentage(firstPage) > getViewPercentage(secondPage)) {
	// 				MainStore.activePage = MainStore.visiblePages[0].index;
	// 			} else {
	// 				MainStore.activePage = MainStore.visiblePages[1].index;
	// 			}
	// 		};
	// 	};
	// 	canvasContainer.value.parentElement.addEventListener("scroll", handleScroll);
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

watch(
	() => [MainStore.userProvidedJinja, MainStore.doctype, MainStore.currentDoc],
	async () => {
		let result = await frappe.call({
			method: "print_designer.print_designer.page.print_designer.print_designer.get_data_from_main_template",
			args: {
				string: MainStore.userProvidedJinja,
				doctype: MainStore.doctype,
				docname: MainStore.currentDoc,
				settings: {},
			},
		});
		result = result.message;
		if (result.success) {
			MainStore.mainParsedJinjaData = result.message;
			console.log(
				"%cUser Provided Custom Data Template was successfully rendered. You can ignore any User Provided Custom Data Template errors that are shown before this",
				"background: #185A37; color: #ffffff; font-size: 14px;"
			);
		} else {
			console.error("Error From User Provided Custom Data Template\n\n", result.error);
		}
	}
);
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
.page-btn-wrapper {
	display: flex;
	gap: 10px;
	justify-content: center;
	align-items: center;

	.btn {
		background-color: var(--bg-color);
		font-size: var(--text-sm) !important;
		font-size: var(--weight-regular);
		margin-bottom: var(--margin-2xl);
	}
	.btn-primary {
		background-color: var(--btn-primary);
	}
}
.relative-row {
	background-color: transparent !important;
	border: none !important;
	z-index: 9999 !important;
	outline: 1px double var(--primary) !important;
}
.relative-column {
	background-color: transparent !important;
	outline: 1px double var(--primary) !important;
	border: none !important;
	z-index: 9999 !important;
}
</style>
