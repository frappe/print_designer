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
						selectedDynamicText === field && !field.labelStyleEditing,
				},
				{ valueSpanTag: !field.is_static && field.is_labelled },
				getPageClass(field)
			]"
			@click="selectDynamicText()"
			:style="[field?.style]"
			v-html="getHTML(field, index)"
		>
		</span>
		<br v-if="field.nextLine" />
	</span>
</template>

<script setup>
import { useMainStore } from "../../store/MainStore";

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
});

const parseJinja = (value, context) => {
	if (value == '') return '';
	try {
		return frappe.render(value, context)
	} catch (error) {
		console.error("Error in Jinja Template\n", { value_string: value, error });
		frappe.show_alert(
			{
				message: "Unable Render Jinja Template. Please Check Console",
				indicator: "red",
			},
			5
		);
		return value
	}
}

const getHTML = (field, index) => {
	if (props.table) {
		if (field.is_static) {
			if (field.parseJinja) {
				return parseJinja(field.value, {doc: MainStore.docData, row: MainStore.docData[props.table.fieldname]?.[index - 1]})
			}
			return field.value
		} else {
			if (typeof MainStore.docData[props.table.fieldname]?.[index - 1][field.fieldname] != "undefined"){
				return frappe.format(
							MainStore.docData[props.table.fieldname][index - 1][field.fieldname],
							{ fieldtype: field.fieldtype, options: field.options },
							{ inline: true },
							MainStore.docData
					  )
			}
			return ["Image, Attach Image"].indexOf(field.fieldtype) != -1 ? null : `{{ ${ field.fieldname } }}`;
			}
	} else {
		if (field.is_static) {
			if (field.parseJinja) {
				return parseJinja(field.value, {doc: MainStore.docData})
			}
			return field.value
		}
		return (field.value || `{{ ${field.parentField ? field.parentField + "." : ""}${field.fieldname} }}`);
	}
};

const getPageClass = (field) => {
	if (["page", "frompage", "time", "date"].indexOf(field.fieldname) == -1) return "";
	return `page_info_${field.fieldname}`;
}
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
