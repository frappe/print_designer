<template>
	<AppHeader :print_format_name="MainStore.printDesignName || 'Print Formats'" />
	<Editor v-if="MainStore.printDesignName" />
	<GridList v-else />
</template>

<script setup>
import { onMounted } from "vue";
import Editor from "./pages/Editor.vue";
import AppHeader from "./components/layout/AppHeader.vue";
import GridList from "./pages/GridList.vue";
import { useMainStore } from "./store/MainStore";
const props = defineProps({
	print_format_name: {
		type: String,
		required: true,
	},
});

const MainStore = useMainStore();
onMounted(() => {
	if (props.print_format_name) {
		MainStore.printDesignName = props.print_format_name;
	}
});
</script>

<style lang="scss" scoped></style>
