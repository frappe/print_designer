import { useHistoryStore } from "../store/HistoryStore";

export function useHistoryTracking() {
	const HistoryStore = useHistoryStore();

	// Wrapper pour les actions qui doivent être trackées dans l'historique
	const trackAction = (actionType, actionFunction) => {
		// Sauvegarder l'état avant l'action
		HistoryStore.saveState(`before_${actionType}`);
		
		// Exécuter l'action
		const result = actionFunction();
		
		// Si l'action est asynchrone, gérer la promesse
		if (result && typeof result.then === 'function') {
			return result.then((res) => {
				// Sauvegarder l'état après l'action asynchrone
				setTimeout(() => HistoryStore.saveState(`after_${actionType}`), 100);
				return res;
			}).catch((error) => {
				// En cas d'erreur, on peut optionnellement faire un undo automatique
				console.error('Action failed:', error);
				throw error;
			});
		} else {
			// Sauvegarder l'état après l'action synchrone
			setTimeout(() => HistoryStore.saveState(`after_${actionType}`), 100);
			return result;
		}
	};

	// Actions spécifiques trackées
	const trackElementCreation = (createFunction) => {
		return trackAction('element_creation', createFunction);
	};

	const trackElementDeletion = (deleteFunction) => {
		return trackAction('element_deletion', deleteFunction);
	};

	const trackElementMove = (moveFunction) => {
		return trackAction('element_move', moveFunction);
	};

	const trackElementResize = (resizeFunction) => {
		return trackAction('element_resize', resizeFunction);
	};

	const trackElementModification = (modifyFunction) => {
		return trackAction('element_modification', modifyFunction);
	};

	// Sauvegarder l'état actuel manuellement
	const saveCurrentState = (actionType = 'manual_save') => {
		HistoryStore.saveState(actionType);
	};

	return {
		trackAction,
		trackElementCreation,
		trackElementDeletion,
		trackElementMove,
		trackElementResize,
		trackElementModification,
		saveCurrentState,
		canUndo: () => HistoryStore.canUndo,
		canRedo: () => HistoryStore.canRedo,
	};
}