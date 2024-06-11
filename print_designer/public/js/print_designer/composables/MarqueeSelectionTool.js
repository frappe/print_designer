import { useMainStore } from "../store/MainStore";
import { useElementStore } from "../store/ElementStore";
import { useDraw } from "./Draw";
export function useMarqueeSelection() {
	let canvas;
	let marqueeElement = document.createElement("div");
	let isElementInCanvas;
	let beforeDraw, callback;
	const MainStore = useMainStore();
	const ElementStore = useElementStore();

	const vMarquee = {
		mounted: (el, binding) => {
			if (binding.value) {
				beforeDraw = binding.value.beforeDraw;
				callback = binding.value.callback;
			} else {
				callback = undefined;
				beforeDraw = true;
			}
			canvas = el;
			canvas.addEventListener("mousedown", mouseDown);
			canvas.addEventListener("mouseup", mouseUp);
			canvas.addEventListener("mouseleave", mouseUp);
			callback && callback(el);
		},
		unmounted: () => {
			canvas.removeEventListener("mousedown", mouseDown);
			canvas.removeEventListener("mouseup", mouseUp);
			canvas.removeEventListener("mouseleave", mouseUp);
		},
	};

	const { drawEventHandler, parameters } = useDraw();

	function mouseDown(e) {
		if (e.buttons != 1) return;
		if (e.target.id == "canvas" && MainStore.activeControl != "mouse-pointer") {
			MainStore.setActiveControl("MousePointer");
			MainStore.activePage = null;
			MainStore.isMarqueeActive = true;
		}
		if (!MainStore[beforeDraw]) return;
		drawEventHandler.mousedown(e);
		canvas.addEventListener("mousemove", mouseMove);
		if (!e.shiftKey && MainStore.getCurrentElementsId.length) {
			MainStore.getCurrentElementsId.forEach((element) => {
				delete MainStore.currentElements[element];
			});
		}
		if (!canvas) return;
		if (marqueeElement) {
			marqueeElement.remove();
		}
		marqueeElement = document.createElement("div");
		marqueeElement.className = "selection";
		marqueeElement.style.zIndex = 9999;
		marqueeElement.style.left = parameters.startX - canvas.getBoundingClientRect().left + "px";
		marqueeElement.style.top = parameters.startY - canvas.getBoundingClientRect().top + "px";
	}

	function mouseMove(e) {
		if (!MainStore[beforeDraw]) return;
		drawEventHandler.mousemove(e);
		if (
			!isElementInCanvas &&
			parameters.isMouseDown &&
			(parameters.width > 5 || parameters.height > 5)
		) {
			canvas.appendChild(marqueeElement);
			isElementInCanvas = true;
		}
		if (marqueeElement) {
			marqueeElement.style.width = Math.abs(parameters.width) + "px";
			marqueeElement.style.height = Math.abs(parameters.height) + "px";
			marqueeElement.style.left =
				parameters.startX -
				canvas.getBoundingClientRect().left -
				parameters.scrollX +
				"px";
			marqueeElement.style.top =
				parameters.startY - canvas.getBoundingClientRect().top - parameters.scrollY + "px";
		}
	}

	function mouseUp(e) {
		canvas.removeEventListener("mousemove", mouseMove);
		if (!MainStore[beforeDraw]) return;
		drawEventHandler.mouseup(e);

		if (marqueeElement) {
			const inBounds = [];
			if (!e.shiftKey && MainStore.getCurrentElementsId.length) {
				MainStore.getCurrentElementsId.forEach((element) => {
					delete MainStore.currentElements[element];
				});
			}

			const canvas = {
				x: parameters.startX,
				y: parameters.startY,
				width: Math.abs(parameters.width),
				height: Math.abs(parameters.height),
			};
			for (const page of ElementStore.Elements) {
				const pageRect = page.DOMRef.getBoundingClientRect();
				a = { ...canvas };
				a.x -= pageRect.x;
				a.y -= pageRect.y;
				for (const element of page.childrens) {
					const { id, startX, startY, width, height, DOMRef } = element;
					const b = {
						id,
						x: startX,
						y: startY,
						width,
						height,
						DOMRef,
					};
					if (!element.relativeContainer && isInBounds(a, b)) {
						inBounds.push(DOMRef);
						if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
							delete MainStore.currentElements[id];
						} else {
							MainStore.currentElements[id] = element;
						}
					}
				}
			}
			marqueeElement.remove();
			marqueeElement = null;
			isElementInCanvas = false;
		}
	}
	function isInBounds(a, b) {
		return (
			a.x < b.x + b.width &&
			a.x + a.width > b.x &&
			a.y < b.y + b.height &&
			a.y + a.height > b.y
		);
	}
	return { mouseDown, mouseMove, mouseUp, canvas, vMarquee };
}
