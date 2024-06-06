import { onMounted, onUnmounted } from "vue";
import { useMainStore } from "../store/MainStore";
import { useElementStore } from "../store/ElementStore";
import { checkUpdateElementOverlapping, deleteCurrentElements } from "../utils";

export function useAttachKeyBindings() {
	const MainStore = useMainStore();
	const ElementStore = useElementStore();
	function updateStartXY(axis, value) {
		MainStore.getCurrentElementsValues.forEach((element) => {
			let restrict;
			restrict = element.parent.DOMRef.getBoundingClientRect();
			if (element[`start${axis}`] + value <= -1) {
				element[`start${axis}`] = -1;
			} else if (
				element[`start${axis}`] + element[axis == "X" ? "width" : "height"] + value >=
				restrict[axis == "X" ? "width" : "height"] - 1
			) {
				element[`start${axis}`] =
					restrict[axis == "X" ? "width" : "height"] -
					element[axis == "X" ? "width" : "height"] -
					1;
			} else {
				element[`start${axis}`] += value;
			}
		});
		checkUpdateElementOverlapping();
	}
	function updateWidthHeight(key, value) {
		MainStore.getCurrentElementsValues.forEach((element) => {
			let restrict = element.parent.DOMRef.getBoundingClientRect();
			if (element[key] + value <= -1) {
				element[key] = -1;
			} else if (
				element[key] + element[key == "width" ? "startX" : "startY"] + value >=
				restrict[key] - 1
			) {
				element[key] = restrict[key] - element[key == "width" ? "startX" : "startY"] - 1;
			} else {
				element[key] += value;
			}
		});
		checkUpdateElementOverlapping();
	}
	const handleKeyDown = async (e) => {
		MainStore.isAltKey = e.altKey;
		MainStore.isShiftKey = e.shiftKey;
		if (e.target !== document.body || MainStore.openModal) return;
		if (e.ctrlKey || e.metaKey) {
			if (["a", "A"].indexOf(e.key) != -1) {
				ElementStore.Elements.forEach((page) => {
					page.childrens.forEach((element) => {
						MainStore.currentElements[element.id] = element;
					});
				});
			} else if (!e.repeat && ["s", "S"].indexOf(e.key) != -1) {
				await ElementStore.saveElements();
			} else if (!e.repeat && ["l", "L"].indexOf(e.key) != -1) {
				e.preventDefault();
				MainStore.isLayerPanelEnabled = !MainStore.isLayerPanelEnabled;
			}
		}
		if (
			(!MainStore.isDrawing ||
				(MainStore.isDrawing &&
					(MainStore.currentDrawListener
						? !MainStore.currentDrawListener.parameters.isMouseDown
						: true))) &&
			MainStore.getCurrentElementsId.length &&
			["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) != -1
		) {
			e.preventDefault();
			switch (e.key) {
				case "ArrowUp":
					if (e.altKey) {
						updateWidthHeight("height", e.shiftKey ? -10 : -1);
						break;
					}
					updateStartXY("Y", e.shiftKey ? -10 : -1);
					break;
				case "ArrowDown":
					if (e.altKey) {
						updateWidthHeight("height", e.shiftKey ? 10 : 1);
						break;
					}
					updateStartXY("Y", e.shiftKey ? 10 : 1);
					break;
				case "ArrowLeft":
					if (e.altKey) {
						updateWidthHeight("width", e.shiftKey ? -10 : -1);
						break;
					}
					updateStartXY("X", e.shiftKey ? -10 : -1);
					break;
				case "ArrowRight":
					if (e.altKey) {
						updateWidthHeight("width", e.shiftKey ? 10 : 1);
						break;
					}
					updateStartXY("X", e.shiftKey ? 10 : 1);
					break;
			}
		}
		if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return;
		if ((e.key == "M") | (e.key == "m")) {
			MainStore.setActiveControl("MousePointer");
		} else if (e.key == "A" || e.key == "a") {
			MainStore.setActiveControl("Text");
		} else if (e.key == "M" || e.key == "m") {
			MainStore.setActiveControl("MousePointer");
		} else if (e.key == "R" || e.key == "r") {
			MainStore.setActiveControl("Rectangle");
		} else if (e.key == "I" || e.key == "i") {
			MainStore.setActiveControl("Image");
		} else if (e.key == "T" || e.key == "t") {
			MainStore.setActiveControl("Table");
			// } else if (e.key == "C" || e.key == "c") {
			// 	MainStore.setActiveControl("Components");
		} else if (e.key == "B" || e.key == "b") {
			MainStore.setActiveControl("Barcode");
		} else if (e.key === "Delete" || e.key === "Backspace") {
			deleteCurrentElements();
		}
	};
	const handleKeyUp = (e) => {
		MainStore.isAltKey = e.altKey;
		MainStore.isShiftKey = e.shiftKey;
	};
	onMounted(() => {
		window.addEventListener("keydown", handleKeyDown, false);
		window.addEventListener("keyup", handleKeyUp);
	});
	onUnmounted(() => {
		window.removeEventListener("keydown", handleKeyDown, false);
		window.removeEventListener("keyup", handleKeyUp);
	});
}
