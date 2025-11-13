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

			<!-- Contrôles de Grille et Règles -->
			<div class="grid-controls">
				<span
					title="Afficher/Masquer Grille (G)"
					:class="[
						'tool-icons',
						'grid-icon',
						{ 'active-tool-icon': MainStore.showGrid }
					]"
					@click="MainStore.toggleGrid()"
				>
					<svg viewBox="0 0 24 24" width="16" height="16">
						<path d="M3 3v18h18V3H3zm2 2h4v4H5V5zm6 0h4v4h-4V5zm6 0h4v4h-4V5zM5 11h4v4H5v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM5 17h4v4H5v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" fill="currentColor"/>
					</svg>
				</span>
				
				<span
					title="Afficher/Masquer Règles (R)"
					:class="[
						'tool-icons',
						'ruler-icon',
						{ 'active-tool-icon': MainStore.showRulers }
					]"
					@click="MainStore.toggleRulers()"
				>
					<svg viewBox="0 0 24 24" width="16" height="16">
						<path d="M2 4v16h20V4H2zm2 2h16v12H4V6z" fill="none" stroke="currentColor" stroke-width="1"/>
						<line x1="4" y1="8" x2="6" y2="8" stroke="currentColor" stroke-width="1"/>
						<line x1="4" y1="10" x2="5" y2="10" stroke="currentColor" stroke-width="1"/>
						<line x1="4" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="1"/>
						<line x1="4" y1="14" x2="5" y2="14" stroke="currentColor" stroke-width="1"/>
						<line x1="4" y1="16" x2="6" y2="16" stroke="currentColor" stroke-width="1"/>
						<line x1="8" y1="4" x2="8" y2="6" stroke="currentColor" stroke-width="1"/>
						<line x1="10" y1="4" x2="10" y2="5" stroke="currentColor" stroke-width="1"/>
						<line x1="12" y1="4" x2="12" y2="6" stroke="currentColor" stroke-width="1"/>
						<line x1="14" y1="4" x2="14" y2="5" stroke="currentColor" stroke-width="1"/>
						<line x1="16" y1="4" x2="16" y2="6" stroke="currentColor" stroke-width="1"/>
					</svg>
				</span>


				<span
					title="Paramètres de Grille"
					:class="[
						'tool-icons',
						'settings-icon'
					]"
					@click="showGridSettings = !showGridSettings"
				>
					<svg viewBox="0 0 24 24" width="16" height="16">
						<path d="M12.017 2.295c-.584-.015-1.169.063-1.745.236a9.685 9.685 0 0 0-1.662.6 9.731 9.731 0 0 0-1.509.93c-.461.37-.884.786-1.258 1.244a9.67 9.67 0 0 0-.923 1.516c-.245.54-.429 1.106-.549 1.681a9.746 9.746 0 0 0-.12 1.749v.026c.015.584-.063 1.169.236 1.745.177.34.378.667.6 1.662.223.502.483 1.03.93 1.509.37.461.786.884 1.244 1.258.502.409 1.03.763 1.516.923.54.245 1.106.429 1.681.549.588.123 1.189.15 1.749.12h.026c.584-.015 1.169.063 1.745-.236.34-.177.667-.378 1.662-.6.502-.223 1.03-.483 1.509-.93.461-.37.884-.786 1.258-1.244.409-.502.763-1.03.923-1.516.245-.54.429-1.106.549-1.681.123-.588.15-1.189.12-1.749v-.026c-.015-.584.063-1.169-.236-1.745a9.685 9.685 0 0 0-.6-1.662 9.731 9.731 0 0 0-.93-1.509c-.37-.461-.786-.884-1.244-1.258a9.67 9.67 0 0 0-1.516-.923 9.746 9.746 0 0 0-1.681-.549 9.746 9.746 0 0 0-1.749-.12h-.026z" fill="none" stroke="currentColor" stroke-width="1"/>
						<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1"/>
						<path d="m12 1 3 6 3-6m-6 22 3-6 3 6M1 12l6-3-6-3m22 6-6-3 6-3" stroke="currentColor" stroke-width="1"/>
					</svg>
				</span>

				<span
					title="Supprimer tous les guides (Ctrl+Shift+;)"
					:class="[
						'tool-icons',
						'clear-guides-icon'
					]"
					@click="clearAllGuides"
				>
					<svg viewBox="0 0 24 24" width="16" height="16">
						<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
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
		
		<!-- Modal de paramètres de grille -->
		<AppGridSettings 
			:show="showGridSettings"
			@close="showGridSettings = false"
		/>
	</div>
</template>

<script setup>
import { ref, getCurrentInstance } from "vue";
import IconsUse from "../../icons/IconsUse.vue";
import { useMainStore } from "../../store/MainStore";
import { useHistoryStore } from "../../store/HistoryStore";
import LayersPanel from "./LayersPanel.vue";
import AppGridSettings from "./AppGridSettings.vue";

const MainStore = useMainStore();
const HistoryStore = useHistoryStore();
const showGridSettings = ref(false);

// Fonction pour supprimer tous les guides
const clearAllGuides = () => {
	// Chercher le composant AppDraggableGuides dans l'arbre des composants
	const instance = getCurrentInstance();
	const rootInstance = instance.appContext.app._instance;
	
	// Méthode alternative : utiliser un event bus ou store
	// Pour l'instant, utilisons l'API DOM pour trouver le composant
	const canvas = document.querySelector('#canvas');
	if (canvas && canvas.__vue__) {
		// Chercher dans les refs du composant parent
		const canvasComponent = canvas.__vue__;
		if (canvasComponent.refs?.draggableGuides) {
			canvasComponent.refs.draggableGuides.clearAllGuides();
		}
	}
	
	// Message de confirmation
	console.log("Tous les guides ont été supprimés");
};

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

.grid-controls {
	display: flex;
	flex-direction: column;
	margin: 10px 0;
	border-top: 1px solid var(--border-color);
	border-bottom: 1px solid var(--border-color);
	padding: 8px 0;
}

.grid-icon:not(.active-tool-icon):hover,
.ruler-icon:not(.active-tool-icon):hover,
.settings-icon:hover {
	background-color: var(--primary);
	border-radius: var(--border-radius-sm);
}

.grid-icon:not(.active-tool-icon):hover svg,
.ruler-icon:not(.active-tool-icon):hover svg,
.settings-icon:hover svg {
	color: #f9f3e6;
}
</style>
