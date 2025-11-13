<template>
	<!-- Modal de paramètres de grille -->
	<div class="grid-settings-modal" v-if="show" @click.self="close">
		<div class="modal-content">
			<div class="modal-header">
				<h3>Paramètres de Grille et Règles</h3>
				<button class="close-btn" @click="close">
					<svg width="16" height="16" viewBox="0 0 16 16">
						<line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="2"/>
						<line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
					</svg>
				</button>
			</div>
			
			<div class="modal-body">
				<!-- Section Affichage -->
				<div class="settings-section">
					<h4>Affichage</h4>
					<div class="setting-row">
						<label class="setting-label">
							<input 
								type="checkbox" 
								:checked="MainStore.showGrid" 
								@change="MainStore.toggleGrid()"
							>
							<span>Afficher la grille</span>
						</label>
					</div>
					
					<div class="setting-row">
						<label class="setting-label">
							<input 
								type="checkbox" 
								:checked="MainStore.showRulers" 
								@change="MainStore.toggleRulers()"
							>
							<span>Afficher les règles</span>
						</label>
					</div>

					<div class="setting-row">
						<label class="setting-label">
							<input 
								type="checkbox" 
								:checked="MainStore.snapToGrid" 
								@change="MainStore.toggleSnapToGrid()"
							>
							<span>Aimantage à la grille</span>
						</label>
					</div>
				</div>

				<!-- Section Taille de Grille -->
				<div class="settings-section">
					<h4>Taille de Grille</h4>
					<div class="setting-row">
						<label class="setting-label-full">
							<span>Taille: {{ MainStore.gridSize }}px</span>
							<input 
								type="range" 
								min="5" 
								max="100" 
								:value="MainStore.gridSize"
								@input="MainStore.setGridSize(parseInt($event.target.value))"
								class="range-slider"
							>
						</label>
					</div>

					<div class="setting-row">
						<label class="setting-label-full">
							<span>Opacité: {{ Math.round(MainStore.gridOpacity * 100) }}%</span>
							<input 
								type="range" 
								min="10" 
								max="100" 
								:value="MainStore.gridOpacity * 100"
								@input="MainStore.setGridOpacity(parseInt($event.target.value) / 100)"
								class="range-slider"
							>
						</label>
					</div>
				</div>

				<!-- Section Unités -->
				<div class="settings-section">
					<h4>Unités d'affichage</h4>
					<div class="setting-row">
						<div class="unit-buttons">
							<button 
								v-for="unit in ['px', 'mm', 'cm', 'in']"
								:key="unit"
								:class="['unit-btn', { active: MainStore.unit === unit }]"
								@click="MainStore.setUnit(unit)"
							>
								{{ unit }}
							</button>
						</div>
					</div>
				</div>

				<!-- Section Couleurs -->
				<div class="settings-section">
					<h4>Couleurs</h4>
					<div class="setting-row">
						<label class="setting-label-full">
							<span>Grille normale</span>
							<input 
								type="color" 
								:value="MainStore.gridColor"
								@input="MainStore.gridColor = $event.target.value"
								class="color-input"
							>
						</label>
					</div>

					<div class="setting-row">
						<label class="setting-label-full">
							<span>Grille majeure</span>
							<input 
								type="color" 
								:value="MainStore.gridMajorColor"
								@input="MainStore.gridMajorColor = $event.target.value"
								class="color-input"
							>
						</label>
					</div>
				</div>

				<!-- Presets -->
				<div class="settings-section">
					<h4>Préréglages</h4>
					<div class="preset-buttons">
						<button class="preset-btn" @click="applyPreset('fine')">
							Fin (10px)
						</button>
						<button class="preset-btn" @click="applyPreset('normal')">
							Normal (20px)
						</button>
						<button class="preset-btn" @click="applyPreset('coarse')">
							Grossier (40px)
						</button>
						<button class="preset-btn" @click="applyPreset('none')">
							Désactiver tout
						</button>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn" @click="resetToDefaults">
					Valeurs par défaut
				</button>
				<button class="btn btn-primary" @click="close">
					Fermer
				</button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useMainStore } from "../../store/MainStore";

const MainStore = useMainStore();

const props = defineProps({
	show: {
		type: Boolean,
		default: false
	}
});

const emit = defineEmits(['close']);

const close = () => {
	emit('close');
};

// Appliquer des préréglages
const applyPreset = (preset) => {
	switch (preset) {
		case 'fine':
			MainStore.setGridSize(10);
			MainStore.showGrid = true;
			MainStore.showRulers = true;
			MainStore.snapToGrid = true;
			MainStore.setGridOpacity(0.3);
			break;
		case 'normal':
			MainStore.setGridSize(20);
			MainStore.showGrid = true;
			MainStore.showRulers = true;
			MainStore.snapToGrid = true;
			MainStore.setGridOpacity(0.5);
			break;
		case 'coarse':
			MainStore.setGridSize(40);
			MainStore.showGrid = true;
			MainStore.showRulers = true;
			MainStore.snapToGrid = true;
			MainStore.setGridOpacity(0.7);
			break;
		case 'none':
			MainStore.showGrid = false;
			MainStore.showRulers = false;
			MainStore.snapToGrid = false;
			break;
	}
};

// Réinitialiser aux valeurs par défaut
const resetToDefaults = () => {
	MainStore.showGrid = true;
	MainStore.showRulers = true;
	MainStore.setGridSize(20);
	MainStore.gridColor = "#e0e0e0";
	MainStore.gridMajorColor = "#c0c0c0";
	MainStore.setGridOpacity(0.5);
	MainStore.snapToGrid = true;
	MainStore.setUnit("mm");
};
</script>

<style scoped lang="scss">
.grid-settings-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	background: var(--bg-color);
	border-radius: 8px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	width: 400px;
	max-width: 90vw;
	max-height: 80vh;
	overflow-y: auto;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px;
	border-bottom: 1px solid var(--border-color);

	h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: var(--heading-color);
	}

	.close-btn {
		background: none;
		border: none;
		padding: 4px;
		cursor: pointer;
		border-radius: 4px;
		color: var(--text-muted);
		
		&:hover {
			background: var(--bg-light);
			color: var(--heading-color);
		}
	}
}

.modal-body {
	padding: 20px;
}

.modal-footer {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	padding: 20px;
	border-top: 1px solid var(--border-color);
	
	.btn {
		padding: 8px 16px;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		background: var(--bg-color);
		color: var(--text-color);
		cursor: pointer;
		font-size: 14px;
		
		&:hover {
			background: var(--bg-light);
		}
		
		&.btn-primary {
			background: var(--primary-color);
			color: white;
			border-color: var(--primary-color);
			
			&:hover {
				background: var(--primary-dark);
			}
		}
	}
}

.settings-section {
	margin-bottom: 24px;
	
	h4 {
		margin: 0 0 12px 0;
		font-size: 14px;
		font-weight: 600;
		color: var(--heading-color);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
}

.setting-row {
	margin-bottom: 12px;
}

.setting-label {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	color: var(--text-color);
	cursor: pointer;
	
	input[type="checkbox"] {
		margin: 0;
	}
}

.setting-label-full {
	display: block;
	font-size: 14px;
	color: var(--text-color);
	
	span {
		display: block;
		margin-bottom: 4px;
	}
}

.range-slider {
	width: 100%;
	margin: 4px 0;
	height: 4px;
	border-radius: 2px;
	background: var(--bg-light);
	outline: none;
	
	&::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--primary-color);
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}
	
	&::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--primary-color);
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}
}

.color-input {
	width: 100%;
	height: 32px;
	border: 1px solid var(--border-color);
	border-radius: 4px;
	padding: 2px;
	background: var(--bg-color);
	cursor: pointer;
}

.unit-buttons {
	display: flex;
	gap: 4px;
}

.unit-btn {
	flex: 1;
	padding: 8px;
	border: 1px solid var(--border-color);
	border-radius: 4px;
	background: var(--bg-color);
	color: var(--text-color);
	cursor: pointer;
	font-size: 12px;
	text-align: center;
	
	&:hover {
		background: var(--bg-light);
	}
	
	&.active {
		background: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
	}
}

.preset-buttons {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.preset-btn {
	width: 100%;
	padding: 8px 12px;
	border: 1px solid var(--border-color);
	border-radius: 4px;
	background: var(--bg-color);
	color: var(--text-color);
	cursor: pointer;
	font-size: 12px;
	text-align: left;
	
	&:hover {
		background: var(--bg-light);
	}
}
</style>