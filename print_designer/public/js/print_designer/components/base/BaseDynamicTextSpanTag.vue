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
						selectedDyanmicText === field && field?.labelStyleEditing,
				},
			]"
			@click="selectDyanmicText(true)"
			:style="[labelStyle, field?.labelStyle]"
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
						selectedDyanmicText === field && !field.labelStyleEditing,
				},
				{ valueSpanTag: !field.is_static && field.is_labelled },
			]"
			@click="selectDyanmicText()"
			:style="[field?.style]"
			v-html="getHTML(field, index)"
		>
		</span>
		<br v-if="field.nextLine" />
	</span>
</template>

<script setup>
import { useMainStore } from "../../store/MainStore";

const selectDyanmicText = (isLabel = false) => {
	props.field.labelStyleEditing = isLabel;
	props.setSelectedDyanmicText(props.field, isLabel);
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
	selectedDyanmicText: {
		type: Object,
		required: false,
	},
	setSelectedDyanmicText: {
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
});
const getHTML = (field, index) => {
	if (props.table) {
		if (field.is_static) {
			return field.value;
		} else if (field.fieldtype == "Currency") {
			return frappe.format(
				MainStore.docData[props.table.fieldname][index - 1][field.fieldname],
				{ fieldtype: "Currency", options: field.options },
				{ inline: true },
				MainStore.docData
			);
		} else {
			return MainStore.docData[props.table.fieldname][index - 1][field.fieldname];
		}
	} else {
		return (
			field.value ||
			`{{ ${field.parentField ? field.parentField + "." : ""}${field.fieldname} }}`
		);
	}
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
