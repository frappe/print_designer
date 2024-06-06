import interact from "@interactjs/interact";
import "@interactjs/actions/drag";
import "@interactjs/auto-start";
import "@interactjs/modifiers";
import { useMainStore } from "../store/MainStore";
import { useElementStore } from "../store/ElementStore";
import { recursiveChildrens, checkUpdateElementOverlapping } from "../utils";

export function useDraggable({
	element,
	restrict = "parent",
	ignore = "th",
	dragMoveListener,
	dragStartListener,
	dragStopListener,
}) {
	if (interact.isSet(element["DOMRef"]) && interact(element["DOMRef"]).draggable().enabled)
		return;
	const MainStore = useMainStore();
	let elementPreviousZAxis;
	let top, left, bottom, right;
	if (typeof restrict != "string") {
		let rect = restrict.getBoundingClientRect();
		(top = rect.top), (left = rect.left), (bottom = rect.bottom), (right = rect.right);
	}
	const restrictToParent = interact.modifiers.restrictRect({
		restriction:
			typeof restrict == "string"
				? restrict
				: {
						top,
						left,
						bottom,
						right,
				  },
	});
	interact(element["DOMRef"])
		.draggable({
			ignoreFrom: ignore,
			autoScroll: true,
			modifiers: [
				restrictToParent,
				interact.modifiers.snap({
					targets: MainStore.snapPoints,
					relativePoints: [{ x: 0, y: 0 }],
				}),
			],
			listeners: {
				move: dragMoveListener,
			},
		})
		.on("dragstart", dragStartListener)
		.on("dragend", function (e) {
			element.style && (element.style.zIndex = elementPreviousZAxis);
			dragStopListener && dragStopListener(e);
			if (element.DOMRef.className == "modal-dialog modal-sm") {
				return;
			}
			checkUpdateElementOverlapping(element);
		});
	return;
}
