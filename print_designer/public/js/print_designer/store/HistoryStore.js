import { defineStore } from "pinia";
import { useMainStore } from "./MainStore";
import { useElementStore } from "./ElementStore";

export const useHistoryStore = defineStore("HistoryStore", {
	state: () => ({
		history: [],
		currentIndex: -1,
		maxHistorySize: 50,
		isUndoRedoInProgress: false,
	}),
	
	getters: {
		canUndo: (state) => state.currentIndex > 0,
		canRedo: (state) => state.currentIndex < state.history.length - 1,
	},
	
	actions: {
		// Sauvegarde l'état actuel dans l'historique
		saveState(actionType = "action") {
			if (this.isUndoRedoInProgress) return;
			
			const MainStore = useMainStore();
			const ElementStore = useElementStore();
			
			// Créer une copie profonde de l'état actuel
			const currentState = {
				timestamp: Date.now(),
				actionType,
				elements: this.deepClone(ElementStore.Elements),
				headers: this.deepClone(ElementStore.Headers),
				footers: this.deepClone(ElementStore.Footers),
				currentElements: { ...MainStore.currentElements },
				lastCreatedElement: MainStore.lastCreatedElement ? 
					this.deepClone(MainStore.lastCreatedElement) : null,
			};
			
			// Si nous ne sommes pas à la fin de l'historique, supprimer les états futurs
			if (this.currentIndex < this.history.length - 1) {
				this.history = this.history.slice(0, this.currentIndex + 1);
			}
			
			// Ajouter le nouvel état
			this.history.push(currentState);
			this.currentIndex = this.history.length - 1;
			
			// Limiter la taille de l'historique
			if (this.history.length > this.maxHistorySize) {
				this.history.shift();
				this.currentIndex--;
			}
		},
		
		// Annuler la dernière action (Ctrl+Z)
		undo() {
			if (!this.canUndo) return;
			
			this.isUndoRedoInProgress = true;
			this.currentIndex--;
			this.restoreState(this.history[this.currentIndex]);
			this.isUndoRedoInProgress = false;
			
			// Notification visuelle
			frappe.show_alert({
				message: "Action annulée",
				indicator: "blue"
			}, 2);
		},
		
		// Refaire la prochaine action (Ctrl+Shift+Z)
		redo() {
			if (!this.canRedo) return;
			
			this.isUndoRedoInProgress = true;
			this.currentIndex++;
			this.restoreState(this.history[this.currentIndex]);
			this.isUndoRedoInProgress = false;
			
			// Notification visuelle
			frappe.show_alert({
				message: "Action refaite",
				indicator: "green"
			}, 2);
		},
		
		// Restaurer un état depuis l'historique
		restoreState(state) {
			const MainStore = useMainStore();
			const ElementStore = useElementStore();
			
			// Nettoyer l'état actuel
			this.clearCurrentState();
			
			// Restaurer les éléments
			ElementStore.Elements = this.deepClone(state.elements);
			ElementStore.Headers = this.deepClone(state.headers);
			ElementStore.Footers = this.deepClone(state.footers);
			
			// Restaurer les sélections
			MainStore.currentElements = { ...state.currentElements };
			MainStore.lastCreatedElement = state.lastCreatedElement ? 
				this.deepClone(state.lastCreatedElement) : null;
			
			// Reconfigurer les propriétés des éléments
			this.restoreElementProperties();
		},
		
		// Nettoyer l'état actuel avant restoration
		clearCurrentState() {
			const MainStore = useMainStore();
			const ElementStore = useElementStore();
			
			// Nettoyer les références DOM et les interactions
			const allElements = [
				...ElementStore.Elements,
				...ElementStore.Headers, 
				...ElementStore.Footers
			];
			
			this.clearElementReferences(allElements);
			
			// Vider les sélections actuelles
			MainStore.currentElements = {};
			MainStore.lastCreatedElement = null;
		},
		
		// Nettoyer récursivement les références DOM
		clearElementReferences(elements) {
			elements.forEach(element => {
				if (element.DOMRef) {
					element.DOMRef = null;
				}
				if (element.childrens && element.childrens.length > 0) {
					this.clearElementReferences(element.childrens);
				}
			});
		},
		
		// Restaurer les propriétés des éléments après restoration
		restoreElementProperties() {
			const ElementStore = useElementStore();
			
			// Restaurer les éléments de pages
			ElementStore.Elements.forEach((page) => {
				ElementStore.setElementProperties(page);
			});
			
			// Restaurer les headers et footers si nécessaire
			ElementStore.Headers.forEach((header) => {
				if (header.childrens) {
					header.childrens.forEach(child => {
						child.parent = header;
						child.DOMRef = null;
					});
				}
			});
			
			ElementStore.Footers.forEach((footer) => {
				if (footer.childrens) {
					footer.childrens.forEach(child => {
						child.parent = footer;
						child.DOMRef = null;
					});
				}
			});
		},
		
		// Clonage profond pour éviter les références partagées et les références circulaires
		deepClone(obj, visited = new WeakSet()) {
			if (obj === null || typeof obj !== "object") return obj;
			if (obj instanceof Date) return new Date(obj.getTime());
			
			// Éviter les références circulaires
			if (visited.has(obj)) {
				return null; // ou {} selon le contexte
			}
			visited.add(obj);
			
			if (obj instanceof Array) return obj.map(item => this.deepClone(item, visited));
			if (obj instanceof Object) {
				const clonedObj = {};
				for (let key in obj) {
					if (obj.hasOwnProperty(key)) {
						// Éviter de cloner les références DOM et propriétés problématiques
						if (key === 'DOMRef' || 
							key === 'parent' || 
							key === 'snapPoints' || 
							key === 'snapEdges' || 
							key === 'piniaElementRef' || 
							key === '__vueParentComponent' ||
							key === '__vue__' ||
							key === '_vnode' ||
							key.startsWith('__v') ||
							key.startsWith('_')) {
							clonedObj[key] = null;
						} else if (key === 'childrens' && obj[key]) {
							// Cloner récursivement les enfants
							clonedObj[key] = obj[key].map(child => this.deepClone(child, visited));
						} else {
							try {
								clonedObj[key] = this.deepClone(obj[key], visited);
							} catch (e) {
								// Si échec, mettre null pour éviter les erreurs
								clonedObj[key] = null;
							}
						}
					}
				}
				return clonedObj;
			}
			return obj;
		},
		
		// Initialiser l'historique avec l'état initial
		initializeHistory() {
			this.history = [];
			this.currentIndex = -1;
			this.saveState("initial");
		},
		
		// Nettoyer l'historique
		clearHistory() {
			this.history = [];
			this.currentIndex = -1;
		}
	}
});