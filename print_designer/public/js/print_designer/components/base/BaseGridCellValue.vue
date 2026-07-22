<template>
	<span class="printGrid static-cell-value" v-html="parsedValue"></span>
</template>

<script setup>
import { ref, watch } from "vue";
import { useMainStore } from "../../store/MainStore";
import { getFormattedValue } from "../../utils";

const MainStore = useMainStore();
const props = defineProps({
	cell: {
		type: Object,
		required: true,
	},
});

const parsedValue = ref("");

watch(
	() => [
		props.cell.value,
		props.cell.parseJinja,
		MainStore.docData,
		MainStore.mainParsedJinjaData,
	],
	async () => {
		parsedValue.value = await getFormattedValue({
			fieldtype: "Data",
			is_static: true,
			parseJinja: props.cell.parseJinja,
			value: props.cell.value,
		});
	},
	{ immediate: true, deep: true }
);
</script>
