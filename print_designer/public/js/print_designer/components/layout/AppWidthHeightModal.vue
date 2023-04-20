<template>
	<AppModal
		v-bind="{ size }"
		:backdrop="false"
		:isDraggable="true"
		@cancelClick="cancelClick"
		@primaryClick="primaryClick"
	>
		<template #title><span style="margin-left: -8px">Rectangle</span></template>
		<template #body>
			<div class="d-flex">
				<div class="mx-1">
					<label class="mx-1" for="modalWidthInput">Width:</label>
					<div class="input-group">
						<input
							autocomplete="off"
							:value="`${useChangeValueUnit({
								inputString: widthAndHeight.width,
								convertionUnit: MainStore.page.UOM,
							}).value.toFixed(2)} ${MainStore.page.UOM}`"
							@blur="handleBlur($event, widthAndHeight, 'width')"
							@keyup.enter="primaryClick"
							v-focus.select
							class="form-control mx-1"
							id="modalWidthInput"
							style="min-width: 50px"
						/>
					</div>
				</div>
				<div class="mx-1">
					<label class="mx-1" for="modalHeightInput">Height:</label>
					<div class="input-group">
						<input
							autocomplete="off"
							:value="`${useChangeValueUnit({
								inputString: widthAndHeight.height,
								convertionUnit: MainStore.page.UOM,
							}).value.toFixed(2)} ${MainStore.page.UOM}`"
							@blur="handleBlur($event, widthAndHeight, 'height')"
							@keyup.enter="primaryClick"
							class="form-control mx-1"
							id="modalHeightInput"
							style="min-width: 50px"
						/>
					</div>
				</div>
			</div>
		</template>
	</AppModal>
</template>
<script setup>
import { ref, reactive, onMounted, watchEffect } from "vue";
import { useChangeValueUnit } from "../../composables/ChangeValueUnit";
import { useMainStore } from "../../store/MainStore";
import { deleteCurrentElements } from "../../utils";
import AppModal from "./AppModal.vue";
const MainStore = useMainStore();
const props = defineProps({
	openModal: {
		type: Boolean,
		required: true,
	},
});
const prevHeight = ref(0);
const prevWidth = ref(0);
const size = {
	width: "230px",
	height: "80px",
	left: "calc(var(--modal-x) + 1px)",
	top: "calc(var(--modal-y) + 1px)",
};
const widthAndHeight = reactive({
	height: 0,
	width: 0,
});
const handleBlur = (e, object, property) => {
	e.stopImmediatePropagation();
	const convertedValue = useChangeValueUnit({
		inputString: e.target.value,
		defaultInputUnit: MainStore.page.UOM,
		convertionUnit: "px",
	});
	if (!convertedValue.error) {
		object[property] = convertedValue.value;
	}
	const updateInputField = useChangeValueUnit({
		inputString: object[property],
		defaultInputUnit: "px",
		convertionUnit: MainStore.page.UOM,
	});
	e.target.value = updateInputField.value.toFixed(2) + ` ${updateInputField.unit}`;
};
const primaryClick = (e) => {
	if (widthAndHeight.height < 1 || widthAndHeight.width < 1) {
		deleteCurrentElements();
	}
	MainStore.getCurrentElementsValues.forEach((element) => {
		element && (element.height = widthAndHeight.height);
		element && (element.width = widthAndHeight.width);
	});
	widthAndHeight.width = 0;
	widthAndHeight.height = 0;
	MainStore.openModal = false;
};
const cancelClick = () => {
	MainStore.getCurrentElementsValues.forEach((element) => {
		element && (element.height = prevHeight.value);
		element && (element.width = prevWidth.value);
	});
	widthAndHeight.width = 0;
	widthAndHeight.height = 0;
	deleteCurrentElements();
	MainStore.openModal = false;
	MainStore.setActiveControl("MousePointer");
};

onMounted(() => {
	MainStore.getCurrentElementsValues.forEach((element) => {
		element && (prevHeight.value = element.height);
		element && (prevWidth.value = element.width);
	});
});
watchEffect(() => {
	if (props.openModal && (widthAndHeight.height || widthAndHeight.width)) {
		let element = MainStore.lastCreatedElement;
		element && (element.height = widthAndHeight.height);
		element && (element.width = widthAndHeight.width);
	}
});

const vFocus = {
	mounted: (el, binding) => {
		el.focus();
		binding.modifiers.select && el.select();
	},
};
</script>
<style scoped>
label,
input {
	position: relative;
	display: block;
	box-sizing: border-box;
	font-size: 12px;
}

.form-control:focus {
	box-shadow: none;
	border: 1px solid var(--primary);
}
</style>
