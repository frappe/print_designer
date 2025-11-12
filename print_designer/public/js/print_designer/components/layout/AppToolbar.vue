<template>
	<div class="sidebar">
		<div class="toolbar-section mt-3">
			<div>
				<template
					v-for="({ id, aria_label, icon, isDisabled }, key) in MainStore.controls"
					:key="id"
				>
					<span
						v-if="!isDisabled"
						:key="id"
						:title="aria_label"
						:class="iconClasses(id, icon)"
						@click="MainStore.setActiveControl(key)"
					>
						<svg :viewBox="`0 0 24 24`" width="16" height="16">
							<use
								:href="`#${icon}`"
								:style="[
									MainStore.activeControl == icon && `color:var(--primary)`,
								]"
							/>
						</svg>
					</span>
				</template>
			</div>
			
			<!-- Boutons Undo/Redo -->
			<div class="history-controls">
				<span
					title="Annuler (Ctrl+Z)"
					:class="[
						'tool-icons',
						'undo-icon',
						{ 'disabled-tool': !HistoryStore.canUndo }
					]"
					@click="HistoryStore.canUndo && HistoryStore.undo()"
				>
					<svg viewBox="0 0 24 24" width="16" height="16">
						<path d="M7 7h8.5a3.5 3.5 0 1 1 0 7H9m-2-7l-4 4m4-4l-4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</span>
				<span
					title="Refaire (Ctrl+Shift+Z)"
					:class="[
						'tool-icons',
						'redo-icon',
						{ 'disabled-tool': !HistoryStore.canRedo }
					]"
					@click="HistoryStore.canRedo && HistoryStore.redo()"
				>
					<svg viewBox="0 0 24 24" width="16" height="16">
						<path d="M17 7H8.5a3.5 3.5 0 1 0 0 7H15m2-7l4 4m-4-4l4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</span>
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
import { useHistoryStore } from "../../store/HistoryStore";
import LayersPanel from "./LayersPanel.vue";
const MainStore = useMainStore();
const HistoryStore = useHistoryStore();

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
	display: flex;
	align-items: center;
	justify-content: center;
	user-select: none;
	cursor: pointer;
	width: 32px;
	height: 32px;
	margin: 6px;
}
.active-layer-icon {
	cursor: pointer;
	--icon-stroke: #f9f3e6;
	border-radius: var(--border-radius-sm);
	background-color: var(--primary);
	margin: 6px;
}
.active-tool-icon {
	background-color: var(--primary);
	--icon-stroke: #f9f3e6;
	border-radius: var(--border-radius-sm);
}

.tool-icons:hover:not(.active-tool-icon):not(.disabled-tool) {
	border-radius: var(--border-radius-md);
	--icon-stroke: #f9f3e6;
	background-color: var(--primary);
}

.history-controls {
	display: flex;
	flex-direction: column;
	margin: 10px 0;
	border-top: 1px solid var(--border-color);
	border-bottom: 1px solid var(--border-color);
	padding: 8px 0;
}

.disabled-tool {
	opacity: 0.3;
	cursor: not-allowed !important;
}

.disabled-tool svg {
	color: var(--gray-500) !important;
}

.undo-icon:not(.disabled-tool):hover,
.redo-icon:not(.disabled-tool):hover {
	background-color: var(--primary);
	border-radius: var(--border-radius-sm);
}

.undo-icon:not(.disabled-tool):hover svg,
.redo-icon:not(.disabled-tool):hover svg {
	color: #f9f3e6;
}
</style>
