<template>
	<td
		v-for="column in columns"
		:key="column.fieldname"
		:style="[style, altStyle && row.idx % 2 == 0 && altStyle, column.style]"
		@click.self="setSelectedDynamicText(null)"
	>
		<template
			v-for="field in column?.dynamicContent"
			:key="`${field?.parentField}${field?.fieldname}`"
		>
			<BaseDynamicTextSpanTag
				v-bind="{
					field,
					labelStyle,
					index: row.idx,
					selectedDynamicText,
					setSelectedDynamicText,
					parentClass: 'printTable',
					table,
				}"
			/>
		</template>
	</td>
</template>

<script setup>
import BaseDynamicTextSpanTag from "./BaseDynamicTextSpanTag.vue";
const props = defineProps({
	table: {
		type: Object,
		required: true,
	},
	row: {
		type: Object,
		required: true,
	},
	columns: {
		type: Object,
		required: true,
	},
	style: {
		type: Object,
		required: true,
	},
	labelStyle: {
		type: Object,
		required: true,
	},
	altStyle: {
		type: Object,
		required: false,
	},
	selectedDynamicText: {
		type: Object,
		required: false,
	},
	setSelectedDynamicText: {
		type: Function,
		required: false,
	},
});
</script>

<style lang="scss" scoped>
tr:last-child td {
	border-bottom-style: solid !important;
}
tr td:first-child {
	border-left-style: solid !important;
}
tr td:last-child {
	border-right-style: solid !important;
}
</style>
