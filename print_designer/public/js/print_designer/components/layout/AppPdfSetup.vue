<template>
	<div class="pdf-setting-mode">
		<div
			class="pdf-resize pdf-resize-header"
			:style="`min-height: ${MainStore.page.headerHeight}px`"
			:ref="
				(DOMRef) => {
					setResizable(DOMRef, 'bottom');
				}
			"
		>
			<div class="resize-body"></div>
			<BaseResizeHandles />
		</div>
		<div class="main"></div>
		<div
			class="pdf-resize pdf-resize-footer"
			:style="`min-height: ${MainStore.page.footerHeight}px`"
			:ref="
				(DOMRef) => {
					setResizable(DOMRef, 'top');
				}
			"
		>
			<div class="resize-body"></div>
			<BaseResizeHandles />
		</div>
	</div>
</template>

<script setup>
import interact from "@interactjs/interact";
import { watch, onMounted, onUnmounted } from "vue";
import { useElementStore } from "../../store/ElementStore";
import { useMainStore } from "../../store/MainStore";
import BaseResizeHandles from "../base/BaseResizeHandles.vue";

const MainStore = useMainStore();
const ElementStore = useElementStore();

const setResizable = (ref, edges) => {
	if (!ref || (interact.isSet(ref) && interact(ref).resizable().enabled)) {
		return;
	}
	interact(ref).resizable({
		edges: { top: ".top-middle", bottom: ".bottom-middle" },
		listeners: {
			move: (e) => {
				if (edges == "bottom") {
					if (
						MainStore.page["headerHeight"] + e.dy <=
						MainStore.page.height - MainStore.page.footerHeight
					) {
						if (MainStore.page["headerHeight"] + e.dy < 0) {
							MainStore.page["headerHeight"] = 0;
						} else {
							MainStore.page["headerHeight"] = MainStore.page["headerHeight"] + e.dy;
						}
						MainStore.isHeaderFooterAuto && (MainStore.isHeaderFooterAuto = false);
					}
				} else {
					if (
						MainStore.page["footerHeight"] - e.dy <=
						MainStore.page.height - MainStore.page.headerHeight
					) {
						if (MainStore.page["footerHeight"] - e.dy < 0) {
							MainStore.page["footerHeight"] = 0;
						} else {
							MainStore.page["footerHeight"] = MainStore.page["footerHeight"] - e.dy;
						}
						MainStore.isHeaderFooterAuto && (MainStore.isHeaderFooterAuto = false);
					}
				}
			},
		},
	});
};

onMounted(() => {
	MainStore.getCurrentElementsId.forEach((id) => {
		delete MainStore.currentElements[id];
	});
	if (MainStore.isHeaderFooterAuto) {
		let tableElement = ElementStore.Elements.filter((el) => el.type == "table");
		let isOverlapping = false;
		if (tableElement.length == 1) {
			ElementStore.Elements.forEach((element) => {
				if (
					element !== tableElement[0] &&
					((element.startY < tableElement[0].startY + MainStore.page.marginTop &&
						element.startY + element.height >
							tableElement[0].startY + MainStore.page.marginTop) ||
						(element.startY <
							MainStore.page.height -
								(MainStore.page.height -
									(tableElement[0].startY + tableElement[0].height)) -
								MainStore.page.marginTop -
								MainStore.page.marginBottom &&
							element.startY + element.height >
								MainStore.page.height -
									(MainStore.page.height -
										(tableElement[0].startY + tableElement[0].height)) -
									MainStore.page.marginTop -
									MainStore.page.marginBottom))
				) {
					isOverlapping = true;
				}
			});
			if (!isOverlapping) {
				MainStore.page.headerHeight = tableElement[0].startY;
				MainStore.page.footerHeight =
					MainStore.page.height -
					(tableElement[0].startY +
						tableElement[0].height +
						MainStore.page.marginTop +
						MainStore.page.marginBottom);
			}
		}
	}
	watch(
		() => [MainStore.page.headerHeight, MainStore.page.footerHeight],
		() => {
			ElementStore.Elements.forEach((element) => {
				let location = "main";
				if (
					element.startY + element.height < MainStore.page.headerHeight ||
					element.startY >
						MainStore.page.height -
							MainStore.page.footerHeight -
							MainStore.page.marginTop -
							MainStore.page.marginBottom
				) {
					location = "inside";
					element.classes.push("inHeaderFooter");
				} else if (
					element.startY < MainStore.page.headerHeight ||
					element.startY + element.height >
						MainStore.page.height -
							MainStore.page.footerHeight -
							MainStore.page.marginTop -
							MainStore.page.marginBottom
				) {
					location = "overlapping";
					element.classes.push("overlappingHeaderFooter");
				}
				switch (location) {
					case "main":
						element.classes = element.classes.filter(
							(name) => ["inHeaderFooter", "overlappingHeaderFooter"].indexOf(name) == -1
						);
						break;
					case "inside":
						element.classes = element.classes.filter(
							(name) => ["overlappingHeaderFooter"].indexOf(name) == -1
						);
						break;
					case "overlapping":
						element.classes = element.classes.filter(
							(name) => ["inHeaderFooter"].indexOf(name) == -1
						);
						break;
				}
			});
		},
		{ immediate: true }
	);
});

onUnmounted(() => {
	ElementStore.Elements.forEach((element) => {
		element.classes = element.classes.filter(
			(name) => ["inHeaderFooter", "overlappingHeaderFooter"].indexOf(name) == -1
		);
	});
});
</script>

<style lang="scss" deep>
.pdf-setting-mode {
	position: absolute;
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	.resize-body {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0.1;
		background-color: var(--subtle-fg);
	}
	.pdf-resize {
		position: relative;
		left: 0;
		width: 100%;
		z-index: 1001;
		outline: 1px solid var(--primary);
		.resize-handle {
			display: none;
			border-color: var(--primary) !important;
		}
		&.pdf-resize-header {
			.bottom-middle {
				display: block;
			}
		}
		&.pdf-resize-footer {
			.top-middle {
				display: block;
			}
		}
	}
	.main {
		flex: auto;
		background-color: var(--subtle-fg);
		opacity: 0.7;
		z-index: 1000;
	}
}
</style>
