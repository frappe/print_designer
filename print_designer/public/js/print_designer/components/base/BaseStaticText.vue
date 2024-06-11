<template>
	<div
		@dblclick.stop="handleDblClick($event, object, index)"
		@mousedown.left="handleMouseDown($event, object, index)"
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
		<p
			:contenteditable="contenteditable"
			@keydown.stop="handleKeyDown"
			@focus="handleFocus"
			@blur="handleBlur"
			@keyup.stop
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
			:class="['staticText', classes]"
			v-if="type == 'text'"
			data-placeholder=""
			v-html="parsedValue"
		></p>
		<BaseResizeHandles
			v-if="!contenteditable && MainStore.getCurrentElementsId.includes(id)"
		/>
	</div>
</template>

<script setup>
import BaseResizeHandles from "./BaseResizeHandles.vue";
import { toRefs, watch, onMounted, onUpdated, ref } from "vue";
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
	parseJinja,
} = toRefs(props.object);

const parsedValue = ref("");

const { setElements } = useElement({
	draggable: true,
	resizable: true,
});

const { drawEventHandler, parameters } = useDraw();

watch(
	() => [
		contenteditable.value,
		content.value,
		parseJinja.value,
		MainStore.docData,
		MainStore.mainParsedJinjaData,
	],
	async () => {
		if (
			!contenteditable.value &&
			content.value != "" &&
			parseJinja.value &&
			Object.keys(MainStore.docData).length > 0
		) {
			try {
				// call render_user_text_withdoc method using frappe.call and return the result
				const MainStore = useMainStore();
				let result = await frappe.call({
					method: "print_designer.print_designer.page.print_designer.print_designer.render_user_text_withdoc",
					args: {
						string: content.value,
						doctype: MainStore.doctype,
						docname: MainStore.currentDoc,
						send_to_jinja: MainStore.mainParsedJinjaData || {},
					},
				});
				result = result.message;
				if (result.success) {
					parsedValue.value = result.message;
				} else {
					console.error("Error From User Provided Jinja String\n\n", result.error);
				}
			} catch (error) {
				console.error("Error in Jinja Template\n", { value_string: content.value, error });
				frappe.show_alert(
					{
						message: "Unable Render Jinja Template. Please Check Console",
						indicator: "red",
					},
					5
				);
				parsedValue.value = content.value;
			}
		} else {
			parsedValue.value = content.value;
		}
	},
	{ immediate: true, deep: true }
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
	if (!DOMRef || !!DOMRef.value.firstElementChild.innerText) return;
	setTimeout(function () {
		DOMRef.value.firstElementChild.focus();
		DOMRef.value.firstElementChild.dataset.placeholder = "Type Something...";
	}, 0);
});
onUpdated(() => {
	if (!isFixedSize.value && DOMRef) {
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
	content.value = DOMRef.value.firstElementChild.innerText; // This will break styled texts :(
	MainStore.getCurrentElementsId.includes(id.value) &&
		DOMRef.value.classList.add("active-elements");
	contenteditable.value = false;
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
