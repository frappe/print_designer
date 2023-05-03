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
		>
			<svg ref="domBarcode"></svg>
		</span>
		<br v-if="field.nextLine" />
	</span>
</template>

<script setup>
import JsBarcode from "jsbarcode";
import { ref, onMounted } from "vue";
import { useMainStore } from "../../store/MainStore";

const domBarcode = ref(null);

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

onMounted(() => {
	JsBarcode(domBarcode.value, props.field.value);
});
const getHTML = (field, index) => {
	if (props.table) {
		if (field.is_static) {
			return field.value;
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
		return (
			field.value ||
			`{{ ${field.parentField ? field.parentField + "." : ""}${field.fieldname} }}`
		);
	}
};

</script>
