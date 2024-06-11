<template>
	<div
		@dblclick.stop="handleDblClick($event, object)"
		@mousedown.left="handleMouseDown($event, object)"
		@mouseup="handleMouseUp"
		:style="[
			postionalStyles(startX, startY, width, height),
			!isFixedSize && {
				width: 'fit-content',
				height: 'fit-content',
				maxWidth:
					MainStore.page.width -
					MainStore.page.marginLeft -
					MainStore.page.marginRight -
					startX +
					'px',
			},
			style.zIndex && { zIndex: style.zIndex },
		]"
		:class="MainStore.getCurrentElementsId.includes(id) ? 'active-elements' : 'text-hover'"
		:ref="setElements(object, index)"
		:key="id"
	>
		<div
			:style="[
				style,
				style.backgroundColor == '' && { backgroundColor: 'transparent' },
				widthHeightStyle(width, height),
				!isFixedSize && {
					width: 'fit-content',
					height: 'fit-content',
					maxWidth:
						MainStore.page.width -
						MainStore.page.marginLeft -
						MainStore.page.marginRight -
						startX +
						'px',
				},
			]"
			:class="['dynamicText', classes]"
			v-if="type == 'text'"
			data-placeholder=""
		>
			<template
				v-for="(field, index) in dynamicContent"
				:key="`${field.parentField}${field.fieldname}`"
			>
				<BaseDynamicTextSpanTag
					v-bind="{
						field,
						labelStyle,
						selectedDynamicText,
						setSelectedDynamicText,
						index,
						parentClass: '',
					}"
				/>
			</template>
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
import BaseDynamicTextSpanTag from "./BaseDynamicTextSpanTag.vue";
import BaseResizeHandles from "./BaseResizeHandles.vue";
import { toRefs, onUpdated, watch, onMounted, nextTick } from "vue";
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
	selectedDynamicText,
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
const setSelectedDynamicText = (value, isLabel) => {
	if (
		MainStore.activeControl != "text" ||
		MainStore.getCurrentElementsId.indexOf(id.value) == -1
	)
		return;
	if (
		selectedDynamicText.value === value &&
		styleEditMode.value == (isLabel ? "label" : "main")
	) {
		selectedDynamicText.value = null;
	} else {
		selectedDynamicText.value = value;
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

const showWarning = frappe.utils.debounce((pageInfoInBody) => {
	frappe.show_alert({
		message: "Please move <b>" + pageInfoInBody.join(", ") + "</b> to header / footer",
		indicator: "orange",
	});
}, 500);
// Remove If Becomes Unnecessary Overhead. This will be fine once temparary state is introduced.
watch(
	() => [startY.value],
	() => {
		if (
			startY.value + height.value < MainStore.page.headerHeight + MainStore.page.marginTop ||
			startY.value >
				MainStore.page.height -
					MainStore.page.footerHeight -
					MainStore.page.marginTop -
					MainStore.page.marginBottom
		) {
			classes.value.splice(classes.value.indexOf("error"), 1);
			return;
		}
		let pageInfoInBody = [];
		dynamicContent.value
			.filter((el) => ["page", "topage", "date", "time"].indexOf(el.fieldname) != -1)
			.forEach((field) => {
				pageInfoInBody.push(field.fieldname);
			});
		if (pageInfoInBody.length) {
			if (classes.value.indexOf("error") == -1) {
				classes.value.push("error");
			}
			showWarning(pageInfoInBody);
		}
	},
	{ flush: "post" }
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
		element.selectedDynamicText = null;
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
	MainStore.setActiveControl("Text");
	MainStore.openDynamicModal = element;
};

onMounted(() => {
	selectedDynamicText.value = null;
	if (!DOMRef || !!DOMRef.value.firstElementChild.innerText) return;
	nextTick(() => {
		DOMRef.value.firstElementChild.dataset.placeholder = "Choose Dynamic Field...";
	});
});

onUpdated(() => {
	if (!isFixedSize.value) {
		let targetRect = DOMRef.value.getBoundingClientRect();
		width.value = targetRect.width + 2;
		height.value = targetRect.height + 2;
	}
});
</script>
<style deep lang="scss">
[contenteditable] {
	outline: none;
}
p:empty:before {
	content: attr(data-placeholder);
}
[contenteditable]:empty:focus:before {
	content: "";
}

.error {
	color: var(--red-500) !important;
	border: 1px solid var(--red-500) !important;
}

.text-hover:hover {
	box-sizing: border-box !important;
	border-bottom: 1px solid var(--primary-color) !important;
}
.flexDynamicText {
	.baseSpanTag {
		display: flex;
		.labelSpanTag {
			flex: 1;
		}
		.valueSpanTag {
			flex: 2;
		}
	}
}
.flexDirectionColumn {
	.baseSpanTag {
		flex-direction: column;
	}
}
</style>
