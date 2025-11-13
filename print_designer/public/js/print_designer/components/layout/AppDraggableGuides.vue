<template>
	<!-- Système de Guides Glissables pour Print Designer -->
	<div class="draggable-guides-system" v-if="MainStore.showRulers">
		
		<!-- Guides Horizontaux (glissés depuis la règle du haut) -->
		<div
			v-for="(guide, index) in horizontalGuides"
			:key="`h-guide-${guide.id}`"
			class="horizontal-guide"
			:class="{ 
				'guide-selected': guide.selected, 
				'guide-highlighted': guide.highlighted,
				'guide-dragging': isDragging && dragData.id === guide.id
			}"
			:style="{
				top: `${guide.position}px`,
				left: '0px',
				right: '0px',
				cursor: isDragging && dragData.id === guide.id ? 'grabbing' : (guide.highlighted ? 'grab' : 'ns-resize'),
				pointerEvents: 'auto',
				height: guide.highlighted || guide.selected ? '6px' : '4px',
				transform: `translateY(${guide.highlighted || guide.selected ? '-3px' : '-2px'})`
			}"
			@mousedown.stop="startDragGuide('horizontal', guide.id, $event)"
			@dblclick.stop="removeGuideById('horizontal', guide.id)"
			@click.stop="selectGuideById('horizontal', guide.id, $event)"
			@mouseenter="guide.highlighted = true"
			@mouseleave="guide.highlighted = false"
			:title="`Guide horizontal: ${formatGuidePosition(guide.position, 'vertical')} - Glisser pour déplacer, Double-clic pour supprimer`"
		>
			<div class="guide-line horizontal-line"></div>
			<div class="guide-handle left-handle">
				<svg width="8" height="12" viewBox="0 0 8 12">
					<path d="M1 2l6 4-6 4z" fill="currentColor"/>
				</svg>
			</div>
			<!-- Bouton de suppression pour guide sélectionné -->
			<div 
				v-if="guide.selected" 
				class="guide-delete-btn"
				@click.stop="removeGuideById('horizontal', guide.id)"
				title="Supprimer ce guide"
			>
				<svg width="14" height="14" viewBox="0 0 24 24">
					<line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="2"/>
					<line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="2"/>
				</svg>
			</div>
		</div>

		<!-- Guides Verticaux (glissés depuis la règle de gauche) -->
		<div
			v-for="(guide, index) in verticalGuides"
			:key="`v-guide-${guide.id}`"
			class="vertical-guide"
			:class="{ 
				'guide-selected': guide.selected, 
				'guide-highlighted': guide.highlighted,
				'guide-dragging': isDragging && dragData.id === guide.id
			}"
			:style="{
				left: `${guide.position}px`,
				top: '0px',
				bottom: '0px',
				cursor: isDragging && dragData.id === guide.id ? 'grabbing' : (guide.highlighted ? 'grab' : 'ew-resize'),
				pointerEvents: 'auto',
				width: guide.highlighted || guide.selected ? '6px' : '4px',
				transform: `translateX(${guide.highlighted || guide.selected ? '-3px' : '-2px'})`
			}"
			@mousedown.stop="startDragGuide('vertical', guide.id, $event)"
			@dblclick.stop="removeGuideById('vertical', guide.id)"
			@click.stop="selectGuideById('vertical', guide.id, $event)"
			@mouseenter="guide.highlighted = true"
			@mouseleave="guide.highlighted = false"
			:title="`Guide vertical: ${formatGuidePosition(guide.position, 'horizontal')} - Glisser pour déplacer, Double-clic pour supprimer`"
		>
			<div class="guide-line vertical-line"></div>
			<div class="guide-handle top-handle">
				<svg width="12" height="8" viewBox="0 0 12 8">
					<path d="M2 1l4 6 4-6z" fill="currentColor"/>
				</svg>
			</div>
			<!-- Bouton de suppression pour guide sélectionné -->
			<div 
				v-if="guide.selected" 
				class="guide-delete-btn"
				@click.stop="removeGuideById('vertical', guide.id)"
				title="Supprimer ce guide"
			>
				<svg width="14" height="14" viewBox="0 0 24 24">
					<line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="2"/>
					<line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="2"/>
				</svg>
			</div>
		</div>

		<!-- Zone de création des guides depuis les règles -->
		<div
			class="horizontal-ruler-drag-zone"
			@mousedown="startCreateGuide('horizontal', $event)"
			:style="{ 
				top: '0px', 
				left: '30px', 
				right: '0px', 
				height: '30px',
				cursor: isDragging ? 'grabbing' : 'ns-resize'
			}"
		></div>

		<div
			class="vertical-ruler-drag-zone"
			@mousedown="startCreateGuide('vertical', $event)"
			:style="{ 
				left: '0px', 
				top: '30px', 
				bottom: '0px', 
				width: '30px',
				cursor: isDragging ? 'grabbing' : 'ew-resize'
			}"
		></div>

		<!-- Guide temporaire pendant le glissement -->
		<div
			v-if="tempGuide.active"
			:class="['temp-guide', tempGuide.type === 'horizontal' ? 'temp-horizontal' : 'temp-vertical']"
			:style="tempGuide.type === 'horizontal' ? 
				{ top: `${tempGuide.position}px`, left: '0px', right: '0px' } :
				{ left: `${tempGuide.position}px`, top: '0px', bottom: '0px' }"
		>
			<div :class="['guide-line', tempGuide.type === 'horizontal' ? 'horizontal-line' : 'vertical-line']"></div>
		</div>

		<!-- Lignes de snap intelligentes -->
		<div v-if="snapConfig.showSnapLines && snapState.snapLines.length > 0" class="snap-lines-container">
			<div
				v-for="(snapLine, index) in snapState.snapLines"
				:key="`snap-${index}`"
				:class="[
					'snap-line',
					snapLine.type === 'horizontal' ? 'snap-horizontal' : 'snap-vertical',
					{ 'snap-special': snapLine.special, 'snap-highlight': snapLine.highlight }
				]"
				:style="snapLine.type === 'horizontal' ? 
					{ top: `${snapLine.position}px`, left: '0px', right: '0px' } :
					{ left: `${snapLine.position}px`, top: '0px', bottom: '0px' }"
			>
				<div class="snap-line-visual"></div>
				<div v-if="snapLine.label" class="snap-label">{{ snapLine.label }}</div>
			</div>
		</div>

		<!-- Indicateur de zone magnétique -->
		<div
			v-if="snapState.isSnapping && isDragging"
			class="magnetic-zone-indicator"
			:class="{ 'magnetic-active': snapState.isSnapping }"
		>
			<div class="magnetic-pulse"></div>
		</div>
	</div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useMainStore } from "../../store/MainStore";

const MainStore = useMainStore();

// State des guides
const horizontalGuides = ref([]);
const verticalGuides = ref([]);
const isDragging = ref(false);
const dragData = reactive({
	type: null,        // 'horizontal' | 'vertical'
	id: null,          // ID du guide en cours de glissement
	index: null,       // Index du guide en cours de glissement (pour compatibilité)
	startY: 0,         // Position Y de début
	startX: 0,         // Position X de début
	isCreating: false  // true si on crée un nouveau guide
});

// Compteur pour générer des ID uniques
let guideIdCounter = 0;

// Configuration du système de snap intelligent
const snapConfig = reactive({
	enabled: true,
	tolerance: 8, // pixels de tolérance pour le snap
	showSnapLines: true,
	snapToGrid: true,
	snapToGuides: true,
	snapToElements: true,
	gridSize: 10 // taille de la grille pour le snap
});

// État du système de snap
const snapState = reactive({
	isSnapping: false,
	snapLines: [],
	magneticZone: null
});

// Guide temporaire pendant le glissement
const tempGuide = reactive({
	active: false,
	type: 'horizontal',
	position: 0
});

// Formatage de la position des guides selon l'unité
const formatGuidePosition = (positionPx, axis) => {
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
	const unitValue = positionPx / pixelsPerUnit;
	
	// Ajustement pour tenir compte des règles (30px d'offset)
	const adjustedValue = axis === 'horizontal' ? 
		(positionPx - 30) / pixelsPerUnit : 
		(positionPx - 30) / pixelsPerUnit;
	
	return `${adjustedValue.toFixed(1)}${unit}`;
};

// Commencer à créer un guide depuis une règle
const startCreateGuide = (type, event) => {
	event.preventDefault();
	isDragging.value = true;
	dragData.type = type;
	dragData.isCreating = true;
	dragData.startX = event.clientX;
	dragData.startY = event.clientY;

	// Activer le guide temporaire
	tempGuide.active = true;
	tempGuide.type = type;
	
	if (type === 'horizontal') {
		tempGuide.position = event.clientY - event.currentTarget.getBoundingClientRect().top + 30;
	} else {
		tempGuide.position = event.clientX - event.currentTarget.getBoundingClientRect().left + 30;
	}

	// Ajouter les listeners globaux avec once: true pour mouseup
	document.addEventListener('mousemove', handleMouseMove, { passive: false });
	document.addEventListener('mouseup', handleMouseUp, { once: true });
};

// Commencer à déplacer un guide existant
const startDragGuide = (type, id, event) => {
	event.preventDefault();
	event.stopPropagation();
	
	// Empêcher le démarrage si déjà en cours de drag
	if (isDragging.value) {
		return;
	}
	
	// Assurer que le guide existe avant de commencer le déplacement
	const guides = type === 'horizontal' ? horizontalGuides.value : verticalGuides.value;
	const guide = guides.find(g => g.id === id);
	if (!guide) {
		return;
	}
	
	// Configuration immédiate du drag (sans nextTick pour éviter les problèmes de timing)
	isDragging.value = true;
	dragData.type = type;
	dragData.id = id;
	dragData.index = findGuideIndexById(type, id);
	dragData.isCreating = false;
	dragData.startX = event.clientX;
	dragData.startY = event.clientY;

	// Sélectionner automatiquement le guide en cours de déplacement
	clearSelection();
	guide.selected = true;
	
	// Réinitialiser le système de snap
	snapState.isSnapping = false;
	snapState.snapLines = [];
	snapState.magneticZone = null;

	// Ajouter les event listeners de manière sécurisée
	document.addEventListener('mousemove', handleMouseMove, { passive: false });
	document.addEventListener('mouseup', handleMouseUp, { once: true });
};

// Fonction de nettoyage simple de l'état de drag
const cleanupDragState = () => {
	// Supprimer les event listeners
	document.removeEventListener('mousemove', handleMouseMove);
	document.removeEventListener('mouseup', handleMouseUp);
	
	// Réinitialiser l'état (isDragging est déjà géré dans handleMouseUp)
	tempGuide.active = false;
	tempGuide.type = 'horizontal';
	tempGuide.position = 0;
	
	// Reset de dragData
	Object.assign(dragData, {
		type: null,
		id: null,
		index: null,
		startY: 0,
		startX: 0,
		isCreating: false
	});
	
	// Nettoyer le système de snap
	snapState.isSnapping = false;
	snapState.snapLines = [];
	snapState.magneticZone = null;
};


// Trouver l'index d'un guide par son ID
const findGuideIndexById = (type, id) => {
	const guides = type === 'horizontal' ? horizontalGuides.value : verticalGuides.value;
	return guides.findIndex(guide => guide.id === id);
};

// ================================
// SYSTÈME DE SNAP INTELLIGENT
// ================================

// Fonction principale de snap intelligent
const applyIntelligentSnap = (newPosition, dragType, excludeId = null) => {
	if (!snapConfig.enabled) return newPosition;

	let bestSnapPosition = newPosition;
	let bestSnapDistance = Infinity;
	snapState.snapLines = [];

	// 1. Snap à la grille
	if (snapConfig.snapToGrid) {
		const gridSnap = snapToGrid(newPosition, dragType);
		const gridDistance = Math.abs(newPosition - gridSnap.position);
		if (gridDistance <= snapConfig.tolerance && gridDistance < bestSnapDistance) {
			bestSnapPosition = gridSnap.position;
			bestSnapDistance = gridDistance;
		}
	}

	// 2. Snap aux autres guides
	if (snapConfig.snapToGuides) {
		const guidesSnap = snapToOtherGuides(newPosition, dragType, excludeId);
		if (guidesSnap.distance <= snapConfig.tolerance && guidesSnap.distance < bestSnapDistance) {
			bestSnapPosition = guidesSnap.position;
			bestSnapDistance = guidesSnap.distance;
			snapState.snapLines.push(guidesSnap.snapLine);
		}
	}

	// 3. Snap aux éléments du canvas
	if (snapConfig.snapToElements) {
		const elementsSnap = snapToCanvasElements(newPosition, dragType);
		if (elementsSnap.distance <= snapConfig.tolerance && elementsSnap.distance < bestSnapDistance) {
			bestSnapPosition = elementsSnap.position;
			bestSnapDistance = elementsSnap.distance;
			snapState.snapLines.push(...elementsSnap.snapLines);
		}
	}

	// 4. Snap aux repères spéciaux (centre, tiers, etc.)
	const specialSnap = snapToSpecialPoints(newPosition, dragType);
	if (specialSnap.distance <= snapConfig.tolerance && specialSnap.distance < bestSnapDistance) {
		bestSnapPosition = specialSnap.position;
		bestSnapDistance = specialSnap.distance;
		snapState.snapLines.push(specialSnap.snapLine);
	}

	// Indiquer si on est en train de snapper
	snapState.isSnapping = bestSnapDistance <= snapConfig.tolerance;

	return bestSnapPosition;
};

// Snap à la grille
const snapToGrid = (position, dragType) => {
	const offset = 30; // Offset des règles
	const adjustedPosition = position - offset;
	const snappedPosition = Math.round(adjustedPosition / snapConfig.gridSize) * snapConfig.gridSize;
	return {
		position: snappedPosition + offset,
		distance: Math.abs(position - (snappedPosition + offset))
	};
};

// Snap aux autres guides
const snapToOtherGuides = (position, dragType, excludeId) => {
	const otherGuides = dragType === 'horizontal' ? horizontalGuides.value : verticalGuides.value;
	let closestDistance = Infinity;
	let closestPosition = position;
	let snapLine = null;

	otherGuides.forEach(guide => {
		if (guide.id !== excludeId) {
			const distance = Math.abs(position - guide.position);
			if (distance < closestDistance) {
				closestDistance = distance;
				closestPosition = guide.position;
				snapLine = {
					type: dragType,
					position: guide.position,
					highlight: true
				};
			}
		}
	});

	return {
		position: closestPosition,
		distance: closestDistance,
		snapLine
	};
};

// Snap aux éléments du canvas
const snapToCanvasElements = (position, dragType) => {
	const elements = document.querySelectorAll('.canvas [data-element-id], .canvas .element');
	let closestDistance = Infinity;
	let closestPosition = position;
	let snapLines = [];

	elements.forEach(element => {
		const rect = element.getBoundingClientRect();
		const container = document.querySelector('.canvas');
		const containerRect = container?.getBoundingClientRect();
		
		if (!containerRect) return;

		// Calcul des positions relatives au container
		const elementTop = rect.top - containerRect.top;
		const elementLeft = rect.left - containerRect.left;
		const elementRight = elementLeft + rect.width;
		const elementBottom = elementTop + rect.height;
		const elementCenterX = elementLeft + rect.width / 2;
		const elementCenterY = elementTop + rect.height / 2;

		let snapPositions = [];

		if (dragType === 'horizontal') {
			snapPositions = [
				{ pos: elementTop, label: 'top' },
				{ pos: elementBottom, label: 'bottom' },
				{ pos: elementCenterY, label: 'center' }
			];
		} else {
			snapPositions = [
				{ pos: elementLeft, label: 'left' },
				{ pos: elementRight, label: 'right' },
				{ pos: elementCenterX, label: 'center' }
			];
		}

		snapPositions.forEach(({ pos, label }) => {
			const distance = Math.abs(position - pos);
			if (distance < closestDistance) {
				closestDistance = distance;
				closestPosition = pos;
				snapLines = [{
					type: dragType,
					position: pos,
					highlight: true,
					label: `Element ${label}`
				}];
			}
		});
	});

	return {
		position: closestPosition,
		distance: closestDistance,
		snapLines
	};
};

// Snap aux points spéciaux (centre du canvas, tiers, etc.)
const snapToSpecialPoints = (position, dragType) => {
	const container = document.querySelector('.canvas');
	if (!container) return { position, distance: Infinity };

	const rect = container.getBoundingClientRect();
	const containerSize = dragType === 'horizontal' ? rect.height : rect.width;
	const offset = 30;

	// Points spéciaux : centre, tiers, quarts
	const specialPoints = [
		{ pos: containerSize / 2 + offset, label: 'Centre' },
		{ pos: containerSize / 3 + offset, label: 'Tiers' },
		{ pos: (2 * containerSize) / 3 + offset, label: '2/3' },
		{ pos: containerSize / 4 + offset, label: 'Quart' },
		{ pos: (3 * containerSize) / 4 + offset, label: '3/4' }
	];

	let closestDistance = Infinity;
	let closestPosition = position;
	let snapLine = null;

	specialPoints.forEach(({ pos, label }) => {
		const distance = Math.abs(position - pos);
		if (distance < closestDistance) {
			closestDistance = distance;
			closestPosition = pos;
			snapLine = {
				type: dragType,
				position: pos,
				highlight: true,
				label,
				special: true
			};
		}
	});

	return {
		position: closestPosition,
		distance: closestDistance,
		snapLine
	};
};

// Gérer le mouvement de la souris
const handleMouseMove = (event) => {
	if (!isDragging.value || !dragData.type) {
		console.debug('handleMouseMove: Not dragging or no drag type');
		return;
	}

	const container = document.querySelector('.canvas, #canvas');
	if (!container) {
		console.warn('handleMouseMove: Container not found');
		return;
	}

	const rect = container.getBoundingClientRect();
	let rawPosition;

	if (dragData.type === 'horizontal') {
		rawPosition = event.clientY - rect.top;
		rawPosition = Math.max(30, Math.min(rect.height, rawPosition));
	} else {
		rawPosition = event.clientX - rect.left;
		rawPosition = Math.max(30, Math.min(rect.width, rawPosition));
	}

	// Appliquer le snap intelligent
	const excludeId = dragData.isCreating ? null : dragData.id;
	const snappedPosition = applyIntelligentSnap(rawPosition, dragData.type, excludeId);

	if (dragData.isCreating) {
		// Création d'un nouveau guide
		tempGuide.position = snappedPosition;
		console.debug(`Creating guide at position: ${snappedPosition}`);
	} else {
		// Déplacement d'un guide existant - utiliser l'ID au lieu de l'index
		if (!dragData.id) {
			console.warn('handleMouseMove: No guide ID for existing guide movement');
			return;
		}
		
		const guides = dragData.type === 'horizontal' ? horizontalGuides.value : verticalGuides.value;
		const guide = guides.find(g => g.id === dragData.id);
		if (guide) {
			guide.position = snappedPosition;
			console.debug(`Moving guide ${dragData.id} to position: ${snappedPosition}`);
		} else {
			console.warn(`handleMouseMove: Guide with ID ${dragData.id} not found during movement`);
		}
	}
};

// Terminer le glissement
const handleMouseUp = (event) => {
	if (!isDragging.value) {
		return;
	}

	// Protection contre les appels multiples - désactiver immédiatement le drag
	const wasDragging = isDragging.value;
	isDragging.value = false;
	
	if (!wasDragging) {
		return;
	}

	// Stocker les infos avant nettoyage pour éviter les problèmes de référence
	const currentDragData = { ...dragData };
	const currentTempGuide = { ...tempGuide };

	if (currentDragData.isCreating && currentTempGuide.active) {
		// Créer un nouveau guide permanent avec un ID unique
		const newGuide = {
			id: ++guideIdCounter,
			position: currentTempGuide.position,
			selected: false,
			highlighted: true, // Mettre en surbrillance temporairement pour la visibilité
			justCreated: true
		};

		if (currentDragData.type === 'horizontal') {
			horizontalGuides.value.push(newGuide);
		} else {
			verticalGuides.value.push(newGuide);
		}
		// Retirer la surbrillance après 2 secondes pour montrer que le guide est interactif
		setTimeout(() => {
			newGuide.highlighted = false;
			newGuide.justCreated = false;
		}, 2000);
	}

	// Vérifier si le guide est glissé hors de la zone (pour suppression)
	const container = document.querySelector('.canvas, #canvas');
	if (container && !currentDragData.isCreating && currentDragData.id) {
		const rect = container.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		
		const isOutside = (
			mouseX < 0 || mouseX > rect.width || 
			mouseY < 0 || mouseY > rect.height
		);

		if (isOutside) {
			removeGuideById(currentDragData.type, currentDragData.id);
		}
	}

	// Nettoyage immédiat sans nextTick
	cleanupDragState();
};

// Sélectionner un guide
const selectGuide = (type, index, event) => {
	event.stopPropagation();
	
	// Désélectionner tous les guides
	clearSelection();
	
	// Sélectionner le guide cliqué
	if (type === 'horizontal') {
		horizontalGuides.value[index].selected = true;
	} else {
		verticalGuides.value[index].selected = true;
	}
};

// Désélectionner tous les guides
const clearSelection = () => {
	horizontalGuides.value.forEach(guide => guide.selected = false);
	verticalGuides.value.forEach(guide => guide.selected = false);
};

// Supprimer un guide (ancienne fonction, conservée pour compatibilité)
const removeGuide = (type, index) => {
	if (type === 'horizontal') {
		horizontalGuides.value.splice(index, 1);
	} else {
		verticalGuides.value.splice(index, 1);
	}
};

// Supprimer un guide par ID (nouvelle fonction corrigée)
const removeGuideById = (type, id) => {
	const guides = type === 'horizontal' ? horizontalGuides.value : verticalGuides.value;
	const index = guides.findIndex(guide => guide.id === id);
	if (index !== -1) {
		guides.splice(index, 1);
	}
};

// Sélectionner un guide par ID (nouvelle fonction corrigée)
const selectGuideById = (type, id, event) => {
	event?.stopPropagation();
	
	// Désélectionner tous les guides si Ctrl n'est pas pressé
	if (!event?.ctrlKey) {
		clearSelection();
	}
	
	// Sélectionner le guide cliqué
	const guides = type === 'horizontal' ? horizontalGuides.value : verticalGuides.value;
	const guide = guides.find(g => g.id === id);
	if (guide) {
		guide.selected = !guide.selected;
	}
};

// Supprimer les guides sélectionnés
const removeSelectedGuides = () => {
	// Supprimer les guides horizontaux sélectionnés (en partant de la fin)
	for (let i = horizontalGuides.value.length - 1; i >= 0; i--) {
		if (horizontalGuides.value[i].selected) {
			horizontalGuides.value.splice(i, 1);
		}
	}
	
	// Supprimer les guides verticaux sélectionnés (en partant de la fin)
	for (let i = verticalGuides.value.length - 1; i >= 0; i--) {
		if (verticalGuides.value[i].selected) {
			verticalGuides.value.splice(i, 1);
		}
	}
};

// Sélectionner tous les guides
const selectAllGuides = () => {
	horizontalGuides.value.forEach(guide => guide.selected = true);
	verticalGuides.value.forEach(guide => guide.selected = true);
};

// Supprimer tous les guides
const clearAllGuides = () => {
	horizontalGuides.value = [];
	verticalGuides.value = [];
};

// Configuration du snap (exposée pour permettre les réglages)
const toggleSnap = (type) => {
	switch (type) {
		case 'grid':
			snapConfig.snapToGrid = !snapConfig.snapToGrid;
			break;
		case 'guides':
			snapConfig.snapToGuides = !snapConfig.snapToGuides;
			break;
		case 'elements':
			snapConfig.snapToElements = !snapConfig.snapToElements;
			break;
		case 'all':
			snapConfig.enabled = !snapConfig.enabled;
			break;
	}
};

const setSnapTolerance = (tolerance) => {
	snapConfig.tolerance = Math.max(1, Math.min(20, tolerance));
};

// Exposer les fonctions pour utilisation externe
defineExpose({
	clearAllGuides,
	removeSelectedGuides,
	selectAllGuides,
	clearSelection,
	horizontalGuides,
	verticalGuides,
	toggleSnap,
	setSnapTolerance,
	snapConfig,
	snapState
});

// Lifecycle
onMounted(() => {
	// Écouter les raccourcis clavier pour supprimer tous les guides
	document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
	document.removeEventListener('keydown', handleKeyDown);
	cleanupDragState();
});

const handleKeyDown = (event) => {
	// Ctrl+Shift+; pour supprimer tous les guides (comme Illustrator)
	if (event.ctrlKey && event.shiftKey && event.key === ';') {
		event.preventDefault();
		clearAllGuides();
	}
	
	// Delete ou Backspace pour supprimer les guides sélectionnés
	if (event.key === 'Delete' || event.key === 'Backspace') {
		const hasSelection = [...horizontalGuides.value, ...verticalGuides.value].some(guide => guide.selected);
		if (hasSelection) {
			event.preventDefault();
			removeSelectedGuides();
		}
	}
	
	// Ctrl+A pour sélectionner tous les guides
	if (event.ctrlKey && event.key.toLowerCase() === 'a') {
		const totalGuides = horizontalGuides.value.length + verticalGuides.value.length;
		if (totalGuides > 0) {
			event.preventDefault();
			selectAllGuides();
		}
	}
	
	// Escape pour désélectionner
	if (event.key === 'Escape') {
		clearSelection();
	}
};
</script>

<style scoped lang="scss">
.draggable-guides-system {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: auto; /* CORRIGÉ: Permettre les interactions */
	z-index: 15;
}

// Zones de drag pour créer des guides
.horizontal-ruler-drag-zone,
.vertical-ruler-drag-zone {
	position: absolute;
	pointer-events: auto;
	z-index: 25;
}

// Guide horizontal
.horizontal-guide {
	position: absolute;
	pointer-events: auto !important; /* CORRIGÉ: Force les interactions */
	z-index: 20;
	cursor: ns-resize;
	
	// Zone de frappe élargie pour faciliter la sélection
	&::before {
		content: '';
		position: absolute;
		top: -5px;
		left: 0;
		right: 0;
		height: 10px;
		pointer-events: auto;
		background: transparent;
	}
	
	.horizontal-line {
		width: 100%;
		height: 1px;
		background: #00aaff;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
		pointer-events: none;
		transition: all 0.2s ease;
	}

	.guide-handle {
		position: absolute;
		left: 0;
		top: -6px;
		width: 12px;
		height: 12px;
		background: #00aaff;
		border: 1px solid #fff;
		border-radius: 2px;
		cursor: ns-resize;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 6px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;

		&:hover {
			background: #0088cc;
			transform: scale(1.1);
		}
	}

	.guide-delete-btn {
		position: absolute;
		right: 10px;
		top: -7px;
		width: 14px;
		height: 14px;
		background: #ff4444;
		border: 1px solid #fff;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;

		&:hover {
			background: #cc0000;
			transform: scale(1.1);
		}

		svg {
			width: 8px;
			height: 8px;
		}
	}

	// États du guide
	&.guide-highlighted .horizontal-line {
		background: #0088cc;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 1);
		height: 2px;
	}

	&.guide-selected {
		.horizontal-line {
			background: #0066ff;
			height: 1px;
			animation: guidePulse 2s ease-in-out infinite alternate;
		}

		.guide-handle {
			background: #0066ff;
			border-color: #fff;
			animation: handlePulse 2s ease-in-out infinite alternate;
		}
	}

	&:hover .horizontal-line {
		background: #0088cc;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 1);
	}

	// État pendant le déplacement
	&.guide-dragging {
		z-index: 25;
		
		.horizontal-line {
			background: #00aaff;
			box-shadow: 0 0 0 2px rgba(0, 170, 255, 0.7), 0 0 10px rgba(0, 170, 255, 0.3);
			height: 3px;
		}

		.guide-handle {
			background: #00aaff;
			border-color: #fff;
			box-shadow: 0 0 0 3px rgba(0, 170, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.4);
			transform: scale(1.2);
		}
	}
}

// Guide vertical
.vertical-guide {
	position: absolute;
	pointer-events: auto !important; /* CORRIGÉ: Force les interactions */
	z-index: 20;
	cursor: ew-resize;
	
	// Zone de frappe élargie pour faciliter la sélection
	&::before {
		content: '';
		position: absolute;
		left: -5px;
		top: 0;
		bottom: 0;
		width: 10px;
		pointer-events: auto;
		background: transparent;
	}
	
	.vertical-line {
		height: 100%;
		width: 1px;
		background: #00aaff;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
		pointer-events: none;
		transition: all 0.2s ease;
	}

	.guide-handle {
		position: absolute;
		top: 0;
		left: -6px;
		width: 12px;
		height: 12px;
		background: #00aaff;
		border: 1px solid #fff;
		border-radius: 2px;
		cursor: ew-resize;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 6px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;

		&:hover {
			background: #0088cc;
			transform: scale(1.1);
		}
	}

	.guide-delete-btn {
		position: absolute;
		top: 10px;
		left: -7px;
		width: 14px;
		height: 14px;
		background: #ff4444;
		border: 1px solid #fff;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;

		&:hover {
			background: #cc0000;
			transform: scale(1.1);
		}

		svg {
			width: 8px;
			height: 8px;
		}
	}

	// États du guide
	&.guide-highlighted .vertical-line {
		background: #0088cc;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 1);
		width: 2px;
	}

	&.guide-selected {
		.vertical-line {
			background: #0066ff;
			width: 1px;
			animation: guidePulse 2s ease-in-out infinite alternate;
		}

		.guide-handle {
			background: #0066ff;
			border-color: #fff;
			animation: handlePulse 2s ease-in-out infinite alternate;
		}
	}

	&:hover .vertical-line {
		background: #0088cc;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 1);
	}

	// État pendant le déplacement
	&.guide-dragging {
		z-index: 25;
		
		.vertical-line {
			background: #00aaff;
			box-shadow: 0 0 0 2px rgba(0, 170, 255, 0.7), 0 0 10px rgba(0, 170, 255, 0.3);
			width: 3px;
		}

		.guide-handle {
			background: #00aaff;
			border-color: #fff;
			box-shadow: 0 0 0 3px rgba(0, 170, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.4);
			transform: scale(1.2);
		}
	}
}

// Guide temporaire
.temp-guide {
	position: absolute;
	pointer-events: none;
	z-index: 30;

	.guide-line {
		background: #00aaff;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9);
		opacity: 0.8;
	}

	&.temp-horizontal {
		height: 0;
		.guide-line {
			width: 100%;
			height: 2px;
		}
	}

	&.temp-vertical {
		width: 0;
		.guide-line {
			height: 100%;
			width: 2px;
		}
	}
}

// ================================
// SYSTÈME DE SNAP INTELLIGENT
// ================================

// Container des lignes de snap
.snap-lines-container {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
	z-index: 35;
}

// Lignes de snap
.snap-line {
	position: absolute;
	pointer-events: none;
	z-index: 35;

	.snap-line-visual {
		transition: all 0.1s ease;
	}

	.snap-label {
		position: absolute;
		background: rgba(0, 170, 255, 0.9);
		color: white;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 10px;
		font-weight: 500;
		white-space: nowrap;
		backdrop-filter: blur(4px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		z-index: 40;
	}

	&.snap-horizontal {
		height: 0;
		left: 0;
		right: 0;

		.snap-line-visual {
			width: 100%;
			height: 1px;
			background: #00aaff;
			box-shadow: 
				0 0 0 1px rgba(255, 255, 255, 0.8),
				0 0 8px rgba(0, 170, 255, 0.6);
			opacity: 0.9;
		}

		.snap-label {
			right: 10px;
			top: -12px;
		}
	}

	&.snap-vertical {
		width: 0;
		top: 0;
		bottom: 0;

		.snap-line-visual {
			height: 100%;
			width: 1px;
			background: #00aaff;
			box-shadow: 
				0 0 0 1px rgba(255, 255, 255, 0.8),
				0 0 8px rgba(0, 170, 255, 0.6);
			opacity: 0.9;
		}

		.snap-label {
			top: 10px;
			left: 8px;
		}
	}

	// Lignes de snap spéciales (centre, tiers, etc.)
	&.snap-special {
		.snap-line-visual {
			background: #0066ff;
			box-shadow: 
				0 0 0 1px rgba(255, 255, 255, 0.9),
				0 0 12px rgba(0, 102, 255, 0.8);
		}

		.snap-label {
			background: rgba(255, 102, 0, 0.95);
			font-weight: 600;
		}
	}

	// Lignes de snap en surbrillance
	&.snap-highlight .snap-line-visual {
		animation: snapPulse 0.8s ease-in-out infinite alternate;
	}
}

// Indicateur de zone magnétique
.magnetic-zone-indicator {
	position: fixed;
	pointer-events: none;
	z-index: 50;
	
	.magnetic-pulse {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(0, 170, 255, 0.8) 0%, rgba(0, 170, 255, 0.2) 70%, transparent 100%);
		animation: magneticPulse 1.2s ease-in-out infinite;
	}
	
	&.magnetic-active .magnetic-pulse {
		background: radial-gradient(circle, rgba(255, 102, 0, 0.9) 0%, rgba(255, 102, 0, 0.3) 70%, transparent 100%);
		animation: magneticActivePulse 0.6s ease-in-out infinite;
	}
}

// Animations
@keyframes snapPulse {
	0% { 
		opacity: 0.7; 
		transform: scaleY(1);
	}
	100% { 
		opacity: 1; 
		transform: scaleY(1.1);
	}
}

@keyframes magneticPulse {
	0% { 
		transform: scale(0.8); 
		opacity: 0.4; 
	}
	50% { 
		transform: scale(1.2); 
		opacity: 0.8; 
	}
	100% { 
		transform: scale(0.8); 
		opacity: 0.4; 
	}
}

@keyframes magneticActivePulse {
	0% { 
		transform: scale(1); 
		opacity: 0.9; 
		box-shadow: 0 0 0 0 rgba(255, 102, 0, 0.7);
	}
	50% { 
		transform: scale(1.1); 
		opacity: 1; 
		box-shadow: 0 0 0 8px rgba(255, 102, 0, 0.3);
	}
	100% { 
		transform: scale(1); 
		opacity: 0.9; 
		box-shadow: 0 0 0 0 rgba(255, 102, 0, 0.7);
	}
}

// États améliorés des guides pendant le snap
.horizontal-guide.guide-dragging.snap-active,
.vertical-guide.guide-dragging.snap-active {
	.guide-handle {
		box-shadow: 
			0 0 0 3px rgba(0, 170, 255, 0.8), 
			0 4px 12px rgba(0, 170, 255, 0.4),
			0 0 20px rgba(0, 170, 255, 0.2);
		animation: snapGlow 0.8s ease-in-out infinite alternate;
	}
}

@keyframes snapGlow {
	0% { 
		box-shadow: 
			0 0 0 3px rgba(0, 170, 255, 0.6), 
			0 4px 8px rgba(0, 170, 255, 0.3);
	}
	100% { 
		box-shadow: 
			0 0 0 5px rgba(0, 170, 255, 0.9), 
			0 6px 16px rgba(0, 170, 255, 0.5),
			0 0 25px rgba(0, 170, 255, 0.3);
	}
}

// Animations pour les guides sélectionnés (subtiles, guides fins)
@keyframes guidePulse {
	0% { 
		box-shadow: 0 0 2px rgba(0, 102, 255, 0.6), 0 0 4px rgba(0, 102, 255, 0.3);
	}
	100% { 
		box-shadow: 0 0 4px rgba(0, 102, 255, 0.9), 0 0 8px rgba(0, 102, 255, 0.5);
	}
}

@keyframes handlePulse {
	0% { 
		box-shadow: 0 0 2px rgba(0, 102, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.2);
	}
	100% { 
		box-shadow: 0 0 4px rgba(0, 102, 255, 0.9), 0 3px 6px rgba(0, 0, 0, 0.3);
	}
}

// Animations
.horizontal-guide,
.vertical-guide {
	transition: opacity 0.2s ease;
}

.guide-handle {
	transition: all 0.2s ease;
}
</style>