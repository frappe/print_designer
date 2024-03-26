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
				getPageClass(field),
			]"
			@click="selectDynamicText()"
			:style="[field?.style]"
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
			:style="[field?.style]"
			v-html="field.suffix"
		>
		</span>
		<br v-if="field.nextLine" />
	</span>
</template>

<script setup>
import { useMainStore } from "../../store/MainStore";
import { ref, watch, onMounted } from "vue";

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

const parsedValue = ref("");
const row = ref({});

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

const parseJinja = async () => {
	if (props.field.value != "" && props.field.parseJinja) {
		try {
			// call render_user_text_withdoc method using frappe.call and return the result
			const MainStore = useMainStore();
			let result = await frappe.call({
				method: "print_designer.print_designer.page.print_designer.print_designer.render_user_text_withdoc",
				args: {
					string: props.field.value,
					doctype: MainStore.doctype,
					docname: MainStore.currentDoc,
					row: row.value,
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
			console.error("Error in Jinja Template\n", { value_string: props.field.value, error });
			frappe.show_alert(
				{
					message: "Unable Render Jinja Template. Please Check Console",
					indicator: "red",
				},
				5
			);
			parsedValue.value = props.field.value;
		}
	} else {
		parsedValue.value = props.field.value;
	}
};

watch(
	() => [
		props.field.value,
		props.field.parseJinja,
		MainStore.docData,
		MainStore.mainParsedJinjaData,
		row.value,
	],
	async () => {
		const isDataAvailable = props.table
			? row.value
			: Object.keys(MainStore.docData).length > 0;
		if (props.field.is_static) {
			if (props.field.parseJinja) {
				parseJinja();
				return;
			}
			parsedValue.value = props.field.value;
			return;
		} else if (props.table) {
			if (isDataAvailable && typeof row.value[props.field.fieldname] != "undefined") {
				parsedValue.value = frappe.format(
					row.value[props.field.fieldname],
					{ fieldtype: props.field.fieldtype, options: props.field.options },
					{ inline: true },
					row.value
				);
			} else {
				parsedValue.value =
					["Image, Attach Image"].indexOf(props.field.fieldtype) != -1
						? null
						: `{{ ${props.field.fieldname} }}`;
			}
			return;
		} else {
			parsedValue.value =
				props.field.value ||
				`{{ ${props.field.parentField ? props.field.parentField + "." : ""}${
					props.field.fieldname
				} }}`;
			return;
		}
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
