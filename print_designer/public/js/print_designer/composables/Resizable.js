import interact from "@interactjs/interact";
import "@interactjs/actions/resize";
import "@interactjs/auto-start";
import "@interactjs/modifiers";
import { useMainStore } from "../store/MainStore";
import { useElementStore } from "../store/ElementStore";
import { recursiveChildrens, checkUpdateElementOverlapping, getParentPage } from "../utils";

export function useResizable({
	element,
	resizeMoveListener,
	resizeStartListener,
	resizeStopListener,
	restrict = "parent",
}) {
	if (element && restrict) {
		if (interact.isSet(element.DOMRef) && interact(element.DOMRef).resizable().enabled) {
			return;
		}
		const MainStore = useMainStore();
		const ElementStore = useElementStore();
		const edges = {
			bottom: ".resize-bottom",
		};
		if (!element.relativeContainer) {
			edges.left = ".resize-left";
			edges.right = ".resize-right";
			edges.top = ".resize-top";
		}
		interact(element.DOMRef)
			.resizable({
				ignoreFrom: ".resizer",
				edges: edges,
				modifiers: [
					interact.modifiers.restrictEdges(),
					interact.modifiers.snapEdges({
						targets: MainStore.snapEdges,
					}),
				],
				listeners: {
					move: resizeMoveListener,
				},
			})
			.on("resizestart", resizeStartListener)
			.on("resizeend", function (e) {
				resizeStopListener && resizeStopListener(e);
				if (element.DOMRef.className == "modal-dialog modal-sm") {
					return;
				}
				checkUpdateElementOverlapping(element);
				if (element.parent == e.target.piniaElementRef.parent) return;
				if (
					!e.dropzone &&
					e.target.piniaElementRef.parent.type != "page" &&
					!MainStore.lastCloned
				) {
					let splicedElement;
					let currentRect = e.target.getBoundingClientRect();
					let canvasRect = getParentPage(
						e.target.piniaElementRef.parent
					).DOMRef.getBoundingClientRect();
					let currentParent = e.target.piniaElementRef.parent;
					if (currentParent.type == "page") {
						splicedElement = currentParent.splice(
							e.target.piniaElementRef.index,
							1
						)[0];
					} else {
						splicedElement = currentParent.childrens.splice(
							e.target.piniaElementRef.index,
							1
						)[0];
					}
					splicedElement = { ...splicedElement };
					splicedElement.startX = currentRect.left - canvasRect.left;
					splicedElement.startY = currentRect.top - canvasRect.top;
					splicedElement.parent = ElementStore.Elements;
					recursiveChildrens({ element: splicedElement, isClone: false });
					ElementStore.Elements.push(splicedElement);
					let droppedElement = new Object();
					droppedElement[splicedElement.id] = splicedElement;
					MainStore.isDropped = droppedElement;
				}
			});
	}

	return;
}
