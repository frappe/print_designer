<template>
	<span :class="{ baseSpanTag: !field.is_static && field.is_labelled }">
		<span
			v-if="!field.is_static && field.is_labelled"
			:class="[
				parentClass,
				'label-text',
				'labelSpanTag',
				{
					'dynamic-span-hover':
						parentClass == 'printTable' ? true : MainStore.activeControl == 'text',
					'dynamic-span-selected':
						selectedDynamicText === field && field?.labelStyleEditing,
				},
			]"
			@click="selectDynamicText(true)"
			:style="[labelStyle, inheritedTextStyle, field?.labelStyle]"
			v-html="
				field.label ||
				`{{ ${field.parentField ? field.parentField + '.' : ''}${field.fieldname} }}`
			"
		></span>
		<span
			:class="[
				parentClass,
				'dynamic-span',
				{
					'dynamic-span-hover':
						parentClass == 'printTable' ? true : MainStore.activeControl == 'text',
					'dynamic-span-selected':
						selectedDynamicText === field && !field.labelStyleEditing,
				},
				{ valueSpanTag: !field.is_static && field.is_labelled },
				getPageClass(field),
			]"
			@click="selectDynamicText()"
			:style="[inheritedTextStyle, field?.style]"
			v-html="parsedValue"
		>
		</span>
		<span
			v-if="field.suffix"
			:class="[
				parentClass,
				'dynamic-span',
				{
					'dynamic-span-hover':
						parentClass == 'printTable' ? true : MainStore.activeControl == 'text',
					'dynamic-span-selected':
						selectedDynamicText === field && !field.labelStyleEditing,
				},
			]"
			@click="selectDynamicText()"
			:style="[inheritedTextStyle, field?.style]"
			v-html="field.suffix"
		>
		</span>
		<br v-if="field.nextLine" />
	</span>
</template>

<script setup>
import { useMainStore } from "../../store/MainStore";
import { computed, ref, watch, onMounted } from "vue";
import { getFormattedValue } from "../../utils";

const selectDynamicText = (isLabel = false) => {
	props.field.labelStyleEditing = isLabel;
	props.setSelectedDynamicText(props.field, isLabel);
};

const MainStore = useMainStore();
const props = defineProps({
	field: {
		type: Object,
		required: true,
	},
	labelStyle: {
		type: Object,
		required: true,
	},
	selectedDynamicText: {
		type: Object,
		required: false,
	},
	setSelectedDynamicText: {
		type: Function,
		required: true,
	},
	index: {
		type: Number,
		required: true,
	},
	parentClass: {
		type: String,
		required: true,
	},
	table: {
		type: Object,
		default: null,
	},
	inheritedStyle: {
		type: Object,
		default: () => ({}),
	},
});

const parsedValue = ref("");
const row = ref(null);
const inheritedTextStyle = computed(() => {
	const inheritedColor = props.inheritedStyle?.color;
	return inheritedColor ? { color: inheritedColor } : {};
});

onMounted(() => {
	watch(
		() => [MainStore.docData],
		async () => {
			if (Object.keys(MainStore.docData).length == 0) return;
			if (props.table) {
				row.value = MainStore.docData[props.table.fieldname]?.[props.index - 1];
			}
		},
		{ immediate: true, deep: true }
	);
});

watch(
	() => [
		props.field.value,
		props.field.parseJinja,
		MainStore.docData,
		MainStore.mainParsedJinjaData,
		row.value,
	],
	async () => {
		parsedValue.value = await getFormattedValue(props.field, row);
	},
	{ immediate: true, deep: true }
);

const getPageClass = (field) => {
	if (["page", "frompage", "time", "date"].indexOf(field.fieldname) == -1) return "";
	return `page_info_${field.fieldname}`;
};
</script>

<style lang="scss" scoped>
.dynamic-span {
	padding: 1px !important;
}
.dynamic-span-hover:hover:not(.dynamic-span-selected) {
	border-bottom: 1px solid var(--gray-600) !important;
	cursor: default;
}
.dynamic-span-selected {
	border-bottom: 1px solid var(--primary-color) !important;
}
</style>
