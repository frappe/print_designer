<template>
	<label
		v-if="field.isLabelled && (field.icon == null || !field.icon?.onlyIcon)"
		class="main-label"
		v-text="field.label"
	></label>
	<div
		:ref="
			(el) => {
				field.frappeControl(el, field.name);
			}
		"
		:key="getControlKey()"
		class="frappeControl"
	></div>
</template>

<script setup>
import { onUnmounted, onBeforeUnmount } from "vue";
import { useMainStore } from "../../store/MainStore";
const MainStore = useMainStore();
const props = defineProps({
	field: {
		type: Object,
		required: true,
	},
});
const getControlKey = () => {
	const element = MainStore.getCurrentElementsValues[0];
	const selectedGridCellId =
		element?.type == "grid" ? element.selectedCell?.id || "no-cell" : "";
	const selectedDynamicTextId =
		element?.type == "grid" ? element.selectedDynamicText?.id || "no-dynamic-text" : "";
	return [
		element?.id || "no-element",
		selectedGridCellId,
		selectedDynamicTextId,
		props.field.name,
	].join(":");
};
onBeforeUnmount(() => {
	if (MainStore.frappeControls[props.field.name]?.df.fieldtype == "Color") {
		MainStore.frappeControls[props.field.name].$wrapper.off("show.bs.popover", "**");
		MainStore.frappeControls[props.field.name].$wrapper.off("hidden.bs.popover", "**");
	}
});
onUnmounted(() => {
	if (MainStore.frappeControls[props.field.name]?.awesomplete) {
		MainStore.frappeControls[props.field.name].awesomplete.destroy();
		Awesomplete.all.splice(
			[MainStore.frappeControls[props.field.name].awesomplete.count - 1],
			1
		);
	}
	delete MainStore.frappeControls[props.field.name];
});
</script>

<style lang="scss" scoped></style>
