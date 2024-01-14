<template>
	<AppModal
		v-bind="{ size }"
		:backdrop="true"
		:isDraggable="false"
		@cancelClick="cancelClick"
		@primaryClick="primaryClick"
	>
		<template #title>
			<span>User Provided Jinja</span>
		</template>
		<template #body>
			<AppCodeEditor
				:modelValue="MainStore.userProvidedJinja"
				@update:aceEditor="updateEditor"
				v-bind="{ aceEditor }"
				type="HTML"
				class="flex-1"
				height="auto"
				:show-line-numbers="true"
			></AppCodeEditor>
		</template>
	</AppModal>
</template>
<script setup>
import { ref } from "vue";
import { useMainStore } from "../../store/MainStore";
import AppModal from "./AppModal.vue";
import AppCodeEditor from "./AppCodeEditor.vue";
const MainStore = useMainStore();

const size = {
	width: "75vw",
	height: "calc(94vh - 90px)",
	left: "6vw",
	top: "3vh",
};

const aceEditor = ref(null);

const updateEditor = (value) => {
	aceEditor.value = value;
};

const primaryClick = async (e) => {
	MainStore.openJinjaModal = false;
	try {
		let value = aceEditor.value.getValue();

		if (value === MainStore.userProvidedJinja) return;

		MainStore.userProvidedJinja = value;
	} catch (e) {
		// do nothing
	}
};
const cancelClick = () => {
	MainStore.openJinjaModal = false;
};
</script>
<style scoped lang="scss"></style>
