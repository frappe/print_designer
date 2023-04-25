<template>
	<div class="sidebar">
		<div class="toolbar-section mt-3">
			<div>
				<template v-for="({ id, aria_label, icon, isDisabled }, key) in MainStore.controls" :key="id">
					<span
						v-if="!isDisabled"
						:key="id"
						:title="aria_label"
						:class="iconClasses(id, icon)"
						@click="MainStore.setActiveControl(key)"
					></span>
				</template>
			</div>
			<IconsUse
				name="layerPanel"
				key="layerPanel"
				:size="44"
				:padding="14"
				:color="MainStore.isLayerPanelEnabled ? 'var(--primary-color)' : 'var(--gray-800)'"
				@click="MainStore.isLayerPanelEnabled = !MainStore.isLayerPanelEnabled"
			/>
		</div>
		<LayersPanel v-if="MainStore.isLayerPanelEnabled" />
	</div>
</template>

<script setup>
import IconsUse from "../../icons/IconsUse.vue";
import { useMainStore } from "../../store/MainStore";
import LayersPanel from "./LayersPanel.vue";
const MainStore = useMainStore();

const iconClasses = (id, icon) => [
	icon,
	"tool-icons",
	{ "active-tool-icon": MainStore.activeControl == id },
];
</script>

<style scoped>
.sidebar {
	display: flex;
}
.toolbar-section {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}
.tool-icons {
	text-align: center;
	user-select: none;
	width: 44px;
	height: 44px;
}

.active-tool-icon {
	color: var(--primary-color);
}
</style>
