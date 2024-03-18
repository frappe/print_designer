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
		<div
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
			:style="[field?.style, 'display: inline-block']"
			v-html="parsedValue"
		></div>
		<br v-if="field.nextLine" />
	</span>
</template>

<script setup>
import { useMainStore } from "../../store/MainStore";
import { ref, reactive, watch, onMounted } from "vue";

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

const {
	field,
	labelStyle,
	selectedDynamicText,
	setSelectedDynamicText,
	index,
	parentClass,
	table,
} = reactive({ ...props });

const selectDynamicText = (isLabel = false) => {
	field.labelStyleEditing = isLabel;
	setSelectedDynamicText(field, isLabel);
};

const parsedValue = ref("");
const row = ref({});

onMounted(() => {
	watch(
		() => [MainStore.docData],
		async () => {
			if (Object.keys(MainStore.docData).length == 0) return;
			if (table) {
				row.value = MainStore.docData[table.fieldname]?.[index - 1];
			}
		},
		{ immediate: true, deep: true }
	);
});

const parseJinja = async () => {
	if (field.value != "" && field.parseJinja) {
		try {
			// call render_user_text_withdoc method using frappe.call and return the result
			const MainStore = useMainStore();
			let result = await frappe.call({
				method: "print_designer.print_designer.page.print_designer.print_designer.render_user_text_withdoc",
				args: {
					string: field.value,
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
			console.error("Error in Jinja Template\n", { value_string: field.value, error });
			frappe.show_alert(
				{
					message: "Unable Render Jinja Template. Please Check Console",
					indicator: "red",
				},
				5
			);
			parsedValue.value = field.value;
		}
	} else {
		parsedValue.value = field.value;
	}
};

watch(
	() => [
		field.value,
		field.parseJinja,
		MainStore.docData,
		MainStore.mainParsedJinjaData,
		row.value,
	],
	async () => {
		const isDataAvailable = table ? row.value : Object.keys(MainStore.docData).length > 0;
		if (field.is_static) {
			if (field.parseJinja) {
				parseJinja();
				return;
			}
			parsedValue.value = field.value;
			return;
		} else if (table) {
			if (isDataAvailable && typeof row.value[field.fieldname] != "undefined") {
				parsedValue.value = frappe.format(
					row.value[field.fieldname],
					{ fieldtype: field.fieldtype, options: field.options },
					{ inline: true },
					row.value
				);
			} else {
				parsedValue.value =
					["Image, Attach Image"].indexOf(field.fieldtype) != -1
						? null
						: `{{ ${field.fieldname} }}`;
			}
			return;
		} else {
			parsedValue.value =
				field.value ||
				`{{ ${field.parentField ? field.parentField + "." : ""}${field.fieldname} }}`;
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
