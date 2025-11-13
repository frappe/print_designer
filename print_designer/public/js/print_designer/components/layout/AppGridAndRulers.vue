<template>
	<!-- Système de Grille et Règles pour Print Designer -->
	<div class="grid-ruler-system" v-show="MainStore.showGrid || MainStore.showRulers">
		<!-- Règle Horizontale (en haut) -->
		<div 
			class="horizontal-ruler" 
			v-if="MainStore.showRulers"
		>
			<!-- Arrière-plan de la règle -->
			<div class="ruler-background"></div>
			
			<!-- Zone des marques -->
			<svg class="ruler-svg" :width="canvasSize.width + 40" height="30">
				<!-- Marques de la règle horizontale -->
				<g v-for="mark in horizontalMarks" :key="`h-${mark.position}`">
					<!-- Ligne de marque -->
					<line 
						:x1="mark.position + 30" 
						:y1="30 - mark.height" 
						:x2="mark.position + 30" 
						:y2="30" 
						:stroke="mark.color" 
						:stroke-width="mark.width"
					/>
					<!-- Étiquette -->
					<text 
						v-if="mark.showLabel" 
						:x="mark.position + 32" 
						:y="12" 
						class="ruler-text"
						:class="mark.type"
					>
						{{ mark.label }}
					</text>
				</g>
			</svg>
		</div>

		<!-- Règle Verticale (à gauche) -->
		<div 
			class="vertical-ruler" 
			v-if="MainStore.showRulers"
		>
			<!-- Arrière-plan de la règle -->
			<div class="ruler-background"></div>
			
			<!-- Zone des marques -->
			<svg class="ruler-svg" width="30" :height="canvasSize.height + 40">
				<!-- Marques de la règle verticale -->
				<g v-for="mark in verticalMarks" :key="`v-${mark.position}`">
					<!-- Ligne de marque -->
					<line 
						:x1="30 - mark.height" 
						:y1="mark.position + 30" 
						:x2="30" 
						:y2="mark.position + 30" 
						:stroke="mark.color" 
						:stroke-width="mark.width"
					/>
					<!-- Étiquette -->
					<text 
						v-if="mark.showLabel" 
						:x="8" 
						:y="mark.position + 32" 
						class="ruler-text vertical-text"
						:class="mark.type"
						:transform="`rotate(-90, 8, ${mark.position + 32})`"
					>
						{{ mark.label }}
					</text>
				</g>
			</svg>
		</div>

		<!-- Zone de coin entre les règles -->
		<div 
			class="ruler-corner" 
			v-if="MainStore.showRulers"
			@click="toggleGridRulerSettings"
			title="Options Grille/Règles"
		>
			<svg width="16" height="16" viewBox="0 0 16 16">
				<path d="M2 2h12v12H2z" fill="none" stroke="currentColor" stroke-width="1"/>
				<line x1="6" y1="2" x2="6" y2="14" stroke="currentColor" stroke-width="0.5"/>
				<line x1="10" y1="2" x2="10" y2="14" stroke="currentColor" stroke-width="0.5"/>
				<line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" stroke-width="0.5"/>
				<line x1="2" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="0.5"/>
			</svg>
		</div>

		<!-- Grille sur le canvas -->
		<div 
			class="grid-overlay" 
			v-show="MainStore.showGrid"
			:style="{
				left: `30px`,
				top: `30px`,
				right: `0px`,
				bottom: `0px`,
				backgroundImage: gridPattern,
				backgroundSize: `${MainStore.gridSize}px ${MainStore.gridSize}px`,
				opacity: MainStore.gridOpacity
			}"
		>
		</div>
	</div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useMainStore } from "../../store/MainStore";

const MainStore = useMainStore();

// Props pour recevoir les dimensions et offsets du canvas parent
const props = defineProps({
	canvasElement: Object,
	pageContainer: Object
});

// State réactif
const canvasSize = ref({ width: 0, height: 0 });
const scrollOffset = ref({ x: 0, y: 0 });
const rulerOffset = ref({ x: 20, y: 20 }); // Taille des règles

// Calcul des marques de la règle horizontale (style Illustrator)
const horizontalMarks = computed(() => {
	const marks = [];
	const maxWidth = canvasSize.value.width;
	const unit = MainStore.unit;
	const dpi = 96; // Standard web DPI
	
	// Conversion des unités en pixels
	const getPixelsPerUnit = (unit) => {
		switch (unit) {
			case 'mm': return dpi / 25.4;  // ~3.78px
			case 'cm': return dpi / 2.54;  // ~37.8px
			case 'in': return dpi;         // 96px
			case 'px': return 1;           // 1px
			default: return 1;
		}
	};
	
	const pixelsPerUnit = getPixelsPerUnit(unit);
	const minorStep = pixelsPerUnit / 10;  // Marques très fines (0.1 unité)
	const mediumStep = pixelsPerUnit / 2;  // Marques moyennes (0.5 unité)
	const majorStep = pixelsPerUnit;       // Marques principales (1 unité)
	
	for (let pos = 0; pos <= maxWidth + majorStep; pos += minorStep) {
		const unitValue = pos / pixelsPerUnit;
		let type = 'minor';
		let height = 4;
		let color = '#d0d0d0';
		let width = 0.5;
		let showLabel = false;
		let label = '';

		// Marques principales (chaque unité entière)
		if (Math.abs(pos % majorStep) < 0.1) {
			type = 'major';
			height = 20;
			color = '#333333';
			width = 1;
			showLabel = true;
			label = Math.round(unitValue).toString();
		}
		// Marques moyennes (chaque demi-unité)
		else if (Math.abs(pos % mediumStep) < 0.1) {
			type = 'medium';
			height = 12;
			color = '#666666';
			width = 0.7;
		}
		// Marques fines (chaque dixième)
		else {
			type = 'minor';
			height = 6;
			color = '#b0b0b0';
			width = 0.5;
		}

		marks.push({
			position: Math.round(pos),
			type,
			height,
			color,
			width,
			showLabel,
			label
		});
	}

	return marks;
});

// Calcul des marques de la règle verticale (style Illustrator)
const verticalMarks = computed(() => {
	const marks = [];
	const maxHeight = canvasSize.value.height;
	const unit = MainStore.unit;
	const dpi = 96;
	
	const getPixelsPerUnit = (unit) => {
		switch (unit) {
			case 'mm': return dpi / 25.4;
			case 'cm': return dpi / 2.54;
			case 'in': return dpi;
			case 'px': return 1;
			default: return 1;
		}
	};
	
	const pixelsPerUnit = getPixelsPerUnit(unit);
	const minorStep = pixelsPerUnit / 10;
	const mediumStep = pixelsPerUnit / 2;
	const majorStep = pixelsPerUnit;
	
	for (let pos = 0; pos <= maxHeight + majorStep; pos += minorStep) {
		const unitValue = pos / pixelsPerUnit;
		let type = 'minor';
		let height = 4;
		let color = '#d0d0d0';
		let width = 0.5;
		let showLabel = false;
		let label = '';

		if (Math.abs(pos % majorStep) < 0.1) {
			type = 'major';
			height = 20;
			color = '#333333';
			width = 1;
			showLabel = true;
			label = Math.round(unitValue).toString();
		}
		else if (Math.abs(pos % mediumStep) < 0.1) {
			type = 'medium';
			height = 12;
			color = '#666666';
			width = 0.7;
		}
		else {
			type = 'minor';
			height = 6;
			color = '#b0b0b0';
			width = 0.5;
		}

		marks.push({
			position: Math.round(pos),
			type,
			height,
			color,
			width,
			showLabel,
			label
		});
	}

	return marks;
});

// Pattern CSS pour la grille
const gridPattern = computed(() => {
	const size = MainStore.gridSize;
	const color = MainStore.gridColor || '#e0e0e0';
	
	return `
		linear-gradient(to right, ${color} 1px, transparent 1px),
		linear-gradient(to bottom, ${color} 1px, transparent 1px)
	`.replace(/\s+/g, ' ').trim();
});

// Mise à jour des dimensions et positions
const updateDimensions = () => {
	if (props.canvasElement) {
		const rect = props.canvasElement.getBoundingClientRect();
		canvasSize.value = {
			width: rect.width,
			height: rect.height
		};
	}

	if (props.pageContainer) {
		scrollOffset.value = {
			x: -props.pageContainer.scrollLeft,
			y: -props.pageContainer.scrollTop
		};
	}
};

// Observer pour les changements de taille et de scroll
let resizeObserver = null;
let scrollElement = null;

const setupObservers = () => {
	// Observer les changements de taille
	if (props.canvasElement) {
		resizeObserver = new ResizeObserver(updateDimensions);
		resizeObserver.observe(props.canvasElement);
	}

	// Observer le scroll
	if (props.pageContainer) {
		scrollElement = props.pageContainer;
		scrollElement.addEventListener('scroll', updateDimensions, { passive: true });
	}

	// Mise à jour initiale
	updateDimensions();
};

const cleanupObservers = () => {
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}
	
	if (scrollElement) {
		scrollElement.removeEventListener('scroll', updateDimensions);
		scrollElement = null;
	}
};

// Fonction pour toggle les paramètres de grille
const toggleGridRulerSettings = () => {
	// Sera implémenté avec un modal de paramètres
	console.log('Toggle grid/ruler settings');
	// MainStore.showGridSettings = !MainStore.showGridSettings;
};

// Lifecycle
onMounted(() => {
	setupObservers();
});

onUnmounted(() => {
	cleanupObservers();
});
</script>

<style scoped lang="scss">
.grid-ruler-system {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
	z-index: 1;
	width: 100%;
	height: 100%;
}

// Règle horizontale (en haut) - Style Illustrator
.horizontal-ruler {
	position: absolute;
	top: 0;
	left: 30px;
	right: 0;
	height: 30px;
	background: linear-gradient(to bottom, #f5f5f5 0%, #e8e8e8 50%, #d9d9d9 100%);
	border-bottom: 1px solid #bbb;
	border-left: 1px solid #bbb;
	overflow: visible;
	z-index: 20;
	pointer-events: auto;
	box-shadow: inset 0 -1px 0 rgba(255,255,255,0.8);

	.ruler-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(to bottom, #f5f5f5 0%, #e0e0e0 100%);
	}

	.ruler-svg {
		position: absolute;
		top: 0;
		left: -30px;
		pointer-events: none;
	}

	.ruler-text {
		font-family: 'Segoe UI', Arial, sans-serif;
		font-size: 9px;
		font-weight: normal;
		fill: #333;
		dominant-baseline: middle;
		text-anchor: start;

		&.major {
			font-weight: 500;
			font-size: 10px;
			fill: #222;
		}

		&.medium {
			font-size: 8px;
			fill: #555;
		}

		&.minor {
			font-size: 7px;
			fill: #777;
		}
	}
}

// Règle verticale (à gauche) - Style Illustrator  
.vertical-ruler {
	position: absolute;
	top: 30px;
	left: 0;
	bottom: 0;
	width: 30px;
	background: linear-gradient(to right, #f5f5f5 0%, #e8e8e8 50%, #d9d9d9 100%);
	border-right: 1px solid #bbb;
	border-top: 1px solid #bbb;
	overflow: visible;
	z-index: 20;
	pointer-events: auto;
	box-shadow: inset -1px 0 0 rgba(255,255,255,0.8);

	.ruler-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(to right, #f5f5f5 0%, #e0e0e0 100%);
	}

	.ruler-svg {
		position: absolute;
		top: -30px;
		left: 0;
		pointer-events: none;
	}

	.ruler-text {
		font-family: 'Segoe UI', Arial, sans-serif;
		font-size: 9px;
		font-weight: normal;
		fill: #333;
		dominant-baseline: middle;
		text-anchor: middle;

		&.vertical-text {
			writing-mode: sideways-lr;
		}

		&.major {
			font-weight: 500;
			font-size: 10px;
			fill: #222;
		}

		&.medium {
			font-size: 8px;
			fill: #555;
		}

		&.minor {
			font-size: 7px;
			fill: #777;
		}
	}
}

// Zone de coin entre les règles - Style Illustrator
.ruler-corner {
	position: absolute;
	top: 0;
	left: 0;
	width: 30px;
	height: 30px;
	background: linear-gradient(135deg, #f5f5f5 0%, #d9d9d9 100%);
	border-right: 1px solid #bbb;
	border-bottom: 1px solid #bbb;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	z-index: 25;
	pointer-events: auto;
	color: #666;
	box-shadow: 
		inset -1px 0 0 rgba(255,255,255,0.8),
		inset 0 -1px 0 rgba(255,255,255,0.8);

	&:hover {
		background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%);
		color: #444;
	}

	&:active {
		background: linear-gradient(135deg, #d0d0d0 0%, #c0c0c0 100%);
		box-shadow: inset 1px 1px 2px rgba(0,0,0,0.2);
	}

	svg {
		width: 14px;
		height: 14px;
		filter: drop-shadow(0 1px 0 rgba(255,255,255,0.8));
	}
}

// Grille overlay - Style Illustrator
.grid-overlay {
	position: absolute;
	pointer-events: none;
	background-repeat: repeat;
	background-position: 0 0, 0 0;
	z-index: 1;
	background-color: transparent;
}
</style>