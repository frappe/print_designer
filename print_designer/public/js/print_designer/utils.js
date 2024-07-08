/**
 *
 * @param {String} inputText
 * @param {'px'|'mm'|'cm'|'in'} defaultUnit px is considered by default
 * @example
 * parseFloatAndUnit("110.5 mm") => {
 * value: 110.5,
 * unit: "mm"
 * };
 * @returns {{value: number, unit: 'px'|'mm'|'cm'|'in' }}
 */
export const parseFloatAndUnit = (inputText, defaultUnit = "px") => {
	if (typeof inputText == "number") {
		return {
			value: inputText,
			unit: defaultUnit,
		};
	} else if (typeof inputText != "string") return;
	const number = parseFloat(inputText.match(/[+-]?([0-9]*[.])?[0-9]+/g));
	const validUnits = [/px/, /mm/, /cm/, /in/];
	const unit = [];
	validUnits.forEach(
		(rx) =>
			rx.test(inputText) &&
			unit.indexOf(rx.exec(inputText)[0]) == -1 &&
			unit.push(rx.exec(inputText)[0])
	);
	return {
		value: number,
		unit: unit.length == 1 ? unit[0] : defaultUnit,
	};
};

import interact from "@interactjs/interact";
import { useMainStore } from "./store/MainStore";
import { useElementStore } from "./store/ElementStore";
import { useDraggable } from "./composables/Draggable";
import { useResizable } from "./composables/Resizable";
import { useDropZone } from "./composables/DropZone";
import { ref, isRef, nextTick } from "vue";
import { getValue } from "./store/fetchMetaAndData";

export const changeDraggable = (element) => {
	if (element.relativeContainer || element.DOMRef == null) {
		return;
	}
	if (
		!element.isDraggable &&
		interact.isSet(element.DOMRef) &&
		interact(element.DOMRef).draggable().enabled
	) {
		interact(element.DOMRef).draggable().enabled = false;
	} else if (
		element.isDraggable &&
		interact.isSet(element.DOMRef) &&
		!interact(element.DOMRef).draggable().enabled
	) {
		interact(element.DOMRef).draggable().enabled = true;
	} else if (element.isDraggable && !interact.isSet(element.DOMRef)) {
		useDraggable({ element });
	}
};

export const lockAxis = (element, toggle) => {
	if (toggle) {
		interact(element.DOMRef).options.drag.lockAxis = "start";
		interact(element.DOMRef).options.resize.modifiers.push(
			interact.modifiers.aspectRatio({
				ratio: "preserve",
				modifiers: [interact.modifiers.restrictSize({ max: "parent" })],
			})
		);
	} else {
		interact(element.DOMRef).options.drag.lockAxis = "xy";
		interact(element.DOMRef).options.resize.modifiers = interact(
			element.DOMRef
		).options.resize.modifiers.filter((e) => e.name != "aspectRatio");
	}
};

export const changeDropZone = (element) => {
	if (
		!element.isDropZone &&
		interact.isSet(element.DOMRef) &&
		interact(element.DOMRef).dropzone().enabled
	) {
		interact(element.DOMRef).dropzone().enabled = false;
	} else if (
		element.isDropZone &&
		interact.isSet(element.DOMRef) &&
		!interact(element.DOMRef).dropzone().enabled
	) {
		interact(element.DOMRef).dropzone().enabled = true;
	} else if (element.isDropZone && !interact.isSet(element.DOMRef)) {
		useDropZone({ element });
	}
};

export const changeResizable = (element) => {
	if (
		!element.isResizable &&
		interact.isSet(element.DOMRef) &&
		interact(element.DOMRef).resizable().enabled
	) {
		interact(element.DOMRef).resizable().enabled = false;
	} else if (
		element.isResizable &&
		interact.isSet(element.DOMRef) &&
		!interact(element.DOMRef).resizable().enabled
	) {
		interact(element.DOMRef).resizable().enabled = true;
	} else if (element.isResizable && !interact.isSet(element.DOMRef)) {
		useResizable({ element });
	}
};

export const postionalStyles = (startX, startY, width, height) => {
	const MainStore = useMainStore();
	return {
		position: "absolute",
		top: MainStore.convertToPageUOM(startY) + MainStore.page.UOM,
		left: MainStore.convertToPageUOM(startX) + MainStore.page.UOM,
		width: MainStore.convertToPageUOM(width) + MainStore.page.UOM,
		height: MainStore.convertToPageUOM(height) + MainStore.page.UOM,
	};
};

export const widthHeightStyle = (width, height) => {
	const MainStore = useMainStore();
	return {
		width: MainStore.convertToPageUOM(width) + MainStore.page.UOM,
		height: MainStore.convertToPageUOM(height) + MainStore.page.UOM,
	};
};

export const setCurrentElement = (event, element) => {
	const MainStore = useMainStore();
	if (!event.shiftKey && !MainStore.getCurrentElementsValues.includes(element)) {
		MainStore.getCurrentElementsId.forEach((element) => {
			delete MainStore.currentElements[element];
		});
	}
	if (MainStore.getCurrentElementsId.length < 2 && !MainStore.currentElements[element.id]) {
		MainStore.currentElements[element.id] = element;
	}
	if (event.shiftKey && !event.metaKey && !event.ctrlKey) {
		MainStore.currentElements[element.id] = element;
		return;
	} else if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
		delete MainStore.currentElements[element.id];
		return;
	}
};
const childrensCleanUp = (parentElement, element, isClone, isMainElement) => {
	const MainStore = useMainStore();
	!isMainElement && (element = { ...element });
	!isClone && element && deleteSnapObjects(element);
	element.id = frappe.utils.get_random(10);
	element.index = null;
	element.DOMRef = null;
	!isMainElement && (element.parent = parentElement);
	element.style = { ...element.style };
	element.labelStyle && (element.labelStyle = { ...element.labelStyle });
	element.headerStyle && (element.headerStyle = { ...element.headerStyle });
	element.altStyle && (element.altStyle = { ...element.altStyle });
	element.classes = [...element.classes];
	element.snapPoints = [];
	element.snapEdges = [];
	if (
		element.type == "table" ||
		element.type == "barcode" ||
		(["text", "image"].indexOf(element.type) != -1 && element.isDynamic)
	) {
		if (["text", "barcode"].indexOf(element.type) != -1) {
			element.dynamicContent = [
				...element.dynamicContent.map((el) => {
					let clone_el = { ...el };
					clone_el.style = { ...clone_el.style };
					clone_el.labelStyle = { ...clone_el.labelStyle };
					return clone_el;
				}),
			];
			element.selectedDynamicText = null;
			MainStore.dynamicData.push(...element.dynamicContent);
		} else if (element.type === "table") {
			element.columns = [
				...element.columns.map((el) => {
					return { ...el };
				}),
			];
			element.columns.forEach((col) => {
				if (!col.dynamicContent) return;
				col.dynamicContent = [
					...col.dynamicContent.map((el) => {
						let clone_el = { ...el };
						clone_el.style = { ...clone_el.style };
						clone_el.labelStyle = { ...clone_el.labelStyle };
						return clone_el;
					}),
				];
				col.selectedDynamicText = null;
				MainStore.dynamicData.push(...col.dynamicContent);
			});
		} else {
			element.image = { ...element.image };
			MainStore.dynamicData.push(element.image);
		}
	}
	if (isMainElement && isClone) {
		parentElement.parent.childrens.push(element);
	} else if (!isMainElement) {
		parentElement.childrens.push(element);
		recursiveChildrens({ element, isClone, isMainElement: false });
	}
};
export const recursiveChildrens = ({ element, isClone = false, isMainElement = true }) => {
	const parentElement = element;
	const childrensArray = parentElement.childrens;
	isMainElement && childrensCleanUp(parentElement, element, isClone, isMainElement);
	parentElement.childrens = [];
	if (
		parentElement.type == "rectangle" ||
		(element.type == "page" && childrensArray.length > 0)
	) {
		childrensArray.forEach((element) => {
			childrensCleanUp(parentElement, element, isClone, false);
		});
	}
};

export const updateElementParameters = (e) => {
	const MainStore = useMainStore();
	let parameters = MainStore.currentDrawListener.parameters;
	let restrict = MainStore.currentDrawListener.restrict;
	if (restrict && !e.metaKey && !e.ctrlKey) {
		if (parameters.isReversedY) {
			if (restrict.top > parameters.startY) {
				MainStore.lastCreatedElement.startY = restrict.top;
				MainStore.lastCreatedElement.height = Math.abs(
					parameters.height - (restrict.top - parameters.startY)
				);
			} else {
				MainStore.lastCreatedElement.startY = parameters.startY;
				MainStore.lastCreatedElement.height = parameters.height;
			}
		} else {
			if (restrict.bottom && restrict.bottom - parameters.startY < parameters.height) {
				MainStore.lastCreatedElement.height = Math.abs(
					restrict.bottom - parameters.startY
				);
			} else {
				MainStore.lastCreatedElement.startY = parameters.startY;
				MainStore.lastCreatedElement.height = parameters.height;
			}
		}
		if (parameters.isReversedX) {
			if (restrict.left > parameters.startX) {
				MainStore.lastCreatedElement.startX = restrict.left;
				MainStore.lastCreatedElement.width = Math.abs(
					parameters.width - (restrict.left - parameters.startX)
				);
			} else {
				MainStore.lastCreatedElement.startX = parameters.startX;
				MainStore.lastCreatedElement.width = parameters.width;
			}
		} else {
			if (restrict.right && restrict.right - parameters.startX < parameters.width) {
				MainStore.lastCreatedElement.width = Math.abs(restrict.right - parameters.startX);
			} else {
				MainStore.lastCreatedElement.startX = parameters.startX;
				MainStore.lastCreatedElement.width = parameters.width;
			}
		}
	} else {
		MainStore.lastCreatedElement.startX = parameters.startX;
		MainStore.lastCreatedElement.startY = parameters.startY;
		MainStore.lastCreatedElement.height = parameters.height;
		MainStore.lastCreatedElement.width = parameters.width;
	}
};

export const createHeaderFooterElement = (childrens, elementType) => {
	const MainStore = useMainStore();
	const ElementStore = useElementStore();
	let id = frappe.utils.get_random(10);
	const pageHeader = {
		type: "rectangle",
		childrens: [],
		DOMRef: null,
		id: id,
		isDraggable: false,
		isResizable: false,
		isDropZone: true,
		relativeContainer: true,
		elementType: elementType,
		startX: 0,
		startY:
			elementType == "header"
				? 0
				: MainStore.page.height -
				  MainStore.page.footerHeight -
				  MainStore.page.marginTop -
				  MainStore.page.marginBottom,
		pageX: 0,
		pageY: 0,
		width: MainStore.page.width - MainStore.page.marginLeft - MainStore.page.marginRight,
		height:
			elementType == "header" ? MainStore.page.headerHeight : MainStore.page.footerHeight,
		styleEditMode: "main",
		style: { border: "none" },
		classes: [],
	};
	pageHeader.childrens = childrens.map((el) => ElementStore.childrensSave(el));
	ElementStore.setElementProperties(pageHeader);
	return { ...pageHeader };
};

export const deleteSnapObjects = (element, recursive = false) => {
	const MainStore = useMainStore();
	if (!element || !element.snapPoints || !element.snapEdges) {
		return;
	}
	element.snapPoints.forEach((point) => {
		MainStore.snapPoints.splice(MainStore.snapPoints.indexOf(point), 1);
	});
	element.snapEdges.forEach((point) => {
		MainStore.snapEdges.splice(MainStore.snapEdges.indexOf(point), 1);
	});
	if (
		(recursive && element.type == "rectangle") ||
		(element.type == "page" && element.childrens.length > 0)
	) {
		element.childrens.forEach((el) => {
			deleteSnapObjects(el, recursive);
		});
	}
};

const deleteDynamicReferance = (curobj) => {
	const MainStore = useMainStore();
	if (curobj.type == "text" && curobj.isDynamic) {
		curobj.dynamicContent.forEach((element) => {
			MainStore.dynamicData.splice(MainStore.dynamicData.indexOf(element), 1);
		});
	} else if (curobj.type == "table") {
		curobj.columns.forEach((element) => {
			element?.dynamicContent?.forEach((el) => {
				MainStore.dynamicData.splice(MainStore.dynamicData.indexOf(el), 1);
			});
		});
	}
};
export const parseJinja = async (field, row) => {
	if (field.value != "" && field.parseJinja) {
		try {
			// call render_user_text_withdoc method using frappe.call and return the result
			const MainStore = useMainStore();
			let result = await frappe.call({
				method: "print_designer.print_designer.page.print_designer.print_designer.render_user_text_withdoc",
				args: {
					string: field.value,
					doctype: MainStore.doctype,
					docname: MainStore.currentDoc,
					row: row,
					send_to_jinja: MainStore.mainParsedJinjaData || {},
				},
			});
			result = result.message;
			if (result.success) {
				return result.message;
			} else {
				console.error("Error From User Provided Jinja String\n\n", result.error);
			}
		} catch (error) {
			console.error("Error in Jinja Template\n", { value_string: field.value, error });
			frappe.show_alert(
				{
					message: "Unable Render Jinja Template. Please Check Console",
					indicator: "red",
				},
				5
			);
			return field.value;
		}
	} else {
		return field.value;
	}
};

export const getFormattedValue = async (field, row = null) => {
	const MainStore = useMainStore();

	if (isRef(row)) {
		row = row.value;
	}
	if (!row && field.tableName && Object.keys(MainStore.docData).length > 0) {
		row = MainStore.docData[field.tableName][0];
	}

	const isDataAvailable = !!row || Object.keys(MainStore.docData).length > 0;

	const formattedValue = ref(field.value);

	if (field.is_static) {
		if (field.parseJinja) {
			formattedValue.value = await parseJinja(field, row);
		}
	} else if (row) {
		if (field.fieldtype == "Image") {
			formattedValue.value = frappe.format(
				row[field.options],
				{ fieldtype: "Image" },
				{ inline: true },
				row
			);
			formattedValue.value = `<img class="print-item-image" src="${formattedValue.value}" alt="">`;
		} else if (isDataAvailable && typeof row[field.fieldname] != "undefined") {
			formattedValue.value = frappe.format(
				row[field.fieldname],
				{ fieldtype: field.fieldtype, options: field.options },
				{ inline: true },
				row
			);
		} else {
			formattedValue.value =
				["Image, Attach Image"].indexOf(field.fieldtype) != -1
					? null
					: `{{ ${field.fieldname} }}`;
		}
	} else {
		let rawValue = MainStore.docData[field.fieldname];
		if (field.parentField) {
			rawValue = await getValue(
				field.doctype,
				MainStore.docData[field.parentField],
				field.fieldname
			);
		}
		if (!(field.fieldtype == "Image") && !(field.fieldtype == "Attach Image")) {
			formattedValue.value = frappe.format(
				rawValue,
				{ fieldtype: field.fieldtype, options: field.options },
				{ inline: true },
				MainStore.docData
			);
		} else {
			formattedValue.value = rawValue;
		}
		if (!formattedValue.value) {
			if (["Image", "Attach Image"].indexOf(field.fieldtype) != -1) {
				formattedValue.value = null;
			} else {
				switch (field.fieldname) {
					case "page":
						formattedValue.value = "0";
						break;
					case "topage":
						formattedValue.value = "999";
						break;
					case "date":
						formattedValue.value = frappe.datetime.now_date();
						break;
					case "time":
						formattedValue.value = frappe.datetime.now_time();
						break;
					default:
						formattedValue.value = `{{ ${
							field.parentField ? field.parentField + "." : ""
						}${field.fieldname} }}`;
				}
			}
		}
	}
	if (field.fieldtype == "Signature") {
		formattedValue.value = `<img class="print-item-image" src="${formattedValue.value}" alt="">`;
	}
	return formattedValue.value;
};

export const updateDynamicData = async () => {
	const MainStore = useMainStore();
	if (!Object.keys(MainStore.docData).length) return;
	MainStore.dynamicData.forEach(async (el) => {
		if (el.is_static) return;
		let row;
		if (el.tableName) {
			row = MainStore.docData[el.tableName];
			row && (row = row[0]);
		}
		let value = await getFormattedValue(el, row);
		if (typeof value == "string" && value.startsWith("<svg")) {
			value.match(new RegExp(`data-barcode-value="(.*?)">`));
			value = result[1];
		}
		if (!value) {
			if (["Image, Attach Image"].indexOf(el.fieldtype) != -1) {
				value = null;
			} else {
				switch (el.fieldname) {
					case "page":
						value = "0";
						break;
					case "topage":
						value = "999";
						break;
					case "date":
						value = frappe.datetime.now_date();
						break;
					case "time":
						value = frappe.datetime.now_time();
						break;
					default:
						value = `{{ ${el.parentField ? el.parentField + "." : ""}${
							el.fieldname
						} }}`;
				}
			}
		}
		el.value = value;
	});
};
export const deleteCurrentElements = () => {
	const MainStore = useMainStore();
	const ElementStore = useElementStore();
	if (MainStore.getCurrentElementsValues.length === 1) {
		let curobj = MainStore.getCurrentElementsValues[0];
		deleteDynamicReferance(curobj);
		deleteSnapObjects(curobj.parent.childrens.splice(curobj.index, 1)[0], true);
	} else {
		MainStore.getCurrentElementsValues.forEach((element) => {
			deleteSnapObjects(
				element.parent.childrens.splice(element.parent.childrens.indexOf(element), 1)[0],
				true
			);
		});
	}
	MainStore.lastCreatedElement = null;
	MainStore.getCurrentElementsId.forEach((element) => {
		delete MainStore.currentElements[element];
	});
	checkUpdateElementOverlapping();
};

export const cloneElement = () => {
	const MainStore = useMainStore();
	const clonedElements = {};
	MainStore.getCurrentElementsValues.forEach((element) => {
		const clonedElement = { ...element };
		recursiveChildrens({ element: clonedElement, isClone: true });
		clonedElements[clonedElement.id] = clonedElement;
	});
	MainStore.getCurrentElementsId.forEach((id) => {
		delete MainStore.currentElements[id];
	});
	Object.entries(clonedElements).forEach((element) => {
		MainStore.currentElements[element[0]] = element[1];
	});
	MainStore.lastCloned = clonedElements;
};

export const getSnapPointsAndEdges = (element) => {
	const boundingRect = {};
	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			boundingRect["x"] = entry.boundingClientRect.x;
			boundingRect["y"] = entry.boundingClientRect.y;
		}
		observer.disconnect();
	});
	observer.observe(element.DOMRef);
	const MainStore = useMainStore();
	const rowSnapPoint = () => {
		if (MainStore.getCurrentElementsId.indexOf(element.id) != -1) return;
		return {
			x: boundingRect.x + element.width,
			y: boundingRect.y,
			range: 10,
			direction: "row-append",
		};
	};
	MainStore.snapPoints.push(rowSnapPoint);
	const columnSnapPoint = () => {
		if (MainStore.getCurrentElementsId.indexOf(element.id) != -1) return;
		observer.observe(element.DOMRef);
		return {
			x: boundingRect.x,
			y: boundingRect.y + element.height,
			range: 10,
			direction: "column-append",
		};
	};
	MainStore.snapPoints.push(columnSnapPoint);
	const leftSnapEdge = () => {
		if (MainStore.getCurrentElementsId.indexOf(element.id) != -1) return;
		observer.observe(element.DOMRef);
		return {
			x: boundingRect.x,
			range: 10,
			direction: "row-append",
		};
	};
	const rightSnapEdge = () => {
		if (MainStore.getCurrentElementsId.indexOf(element.id) != -1) return;
		observer.observe(element.DOMRef);
		return {
			x: boundingRect.x + element.width,
			range: 10,
			direction: "row-append",
		};
	};
	MainStore.snapEdges.push(leftSnapEdge, rightSnapEdge);
	const topSnapEdge = () => {
		if (MainStore.getCurrentElementsId.indexOf(element.id) != -1) return;
		observer.observe(element.DOMRef);
		return {
			y: boundingRect.y,
			range: 10,
			direction: "column-append",
		};
	};
	const bottomSnapEdge = () => {
		if (MainStore.getCurrentElementsId.indexOf(element.id) != -1) return;
		observer.observe(element.DOMRef);
		return {
			y: boundingRect.y + element.height,
			range: 10,
			direction: "column-append",
		};
	};
	MainStore.snapEdges.push(topSnapEdge, bottomSnapEdge);
	return {
		rowSnapPoint,
		columnSnapPoint,
		leftSnapEdge,
		rightSnapEdge,
		topSnapEdge,
		bottomSnapEdge,
	};
};

export const handleAlignIconClick = (value) => {
	const MainStore = useMainStore();
	let currentElements = MainStore.getCurrentElementsValues;
	let parent;
	MainStore.getCurrentElementsValues.forEach((element) => {
		if (parent == null) {
			if (element.parent.type == "page") {
				parent = false;
				return;
			}
			parent = element.parent;
		} else if (parent != element.parent) {
			parent = false;
			return;
		}
	});
	if (currentElements.length == 1) {
		switch (value) {
			case "alignTop":
				MainStore.getCurrentElementsValues.forEach((element) => {
					element.startY = 0;
				});
				break;
			case "alignVerticalCenter":
				MainStore.getCurrentElementsValues.forEach((element) => {
					if (parent) {
						element.startY = (element.parent.height - element.height) / 2;
					} else {
						element.startY =
							(MainStore.page.height -
								MainStore.page.marginTop -
								MainStore.page.marginBottom -
								element.height) /
							2;
					}
				});
				break;
			case "alignBottom":
				MainStore.getCurrentElementsValues.forEach((element) => {
					if (parent) {
						element.startY = element.parent.height - element.height;
					} else {
						element.startY =
							MainStore.page.height -
							MainStore.page.marginTop -
							MainStore.page.marginBottom -
							element.height;
					}
				});
				break;
			case "alignLeft":
				MainStore.getCurrentElementsValues.forEach((element) => {
					element.startX = 0;
				});
				break;
			case "alignHorizontalCenter":
				MainStore.getCurrentElementsValues.forEach((element) => {
					if (parent) {
						element.startX = (element.parent.width - element.width) / 2;
					} else {
						element.startX =
							(MainStore.page.width -
								MainStore.page.marginLeft -
								MainStore.page.marginRight -
								element.width) /
							2;
					}
				});
				break;
			case "alignRight":
				MainStore.getCurrentElementsValues.forEach((element) => {
					if (parent) {
						element.startX = element.parent.width - element.width;
					} else {
						element.startX =
							MainStore.page.width -
							MainStore.page.marginLeft -
							MainStore.page.marginRight -
							element.width;
					}
				});
				break;
		}
	} else if (currentElements.length > 1) {
		let parentRect = getParentPage(
			MainStore.getCurrentElementsValues[0].parent
		).DOMRef.getBoundingClientRect();
		if (parent) {
			parentRect = parent.DOMRef.getBoundingClientRect();
		}
		let offsetRect = MainStore.getCurrentElementsValues.reduce(
			(offset, currentElement) => {
				let currentElementRect = currentElement.DOMRef.getBoundingClientRect();
				currentElementRect.left < offset.left && (offset.left = currentElementRect.left);
				currentElementRect.top < offset.top && (offset.top = currentElementRect.top);
				currentElementRect.right > offset.right &&
					(offset.right = currentElementRect.right);
				currentElementRect.bottom > offset.bottom &&
					(offset.bottom = currentElementRect.bottom);
				return offset;
			},
			{ left: 9999, top: 9999, right: 0, bottom: 0 }
		);
		(offsetRect.top -= parentRect.top), (offsetRect.left -= parentRect.left);
		(offsetRect.right -= parentRect.left), (offsetRect.bottom -= parentRect.top);
		switch (value) {
			case "alignTop":
				MainStore.getCurrentElementsValues.forEach((element) => {
					element.startY = offsetRect.top;
				});
				break;
			case "alignVerticalCenter":
				MainStore.getCurrentElementsValues.forEach((element) => {
					element.startY =
						offsetRect.top +
						(offsetRect.bottom - offsetRect.top) / 2 -
						element.height / 2;
				});
				break;
			case "alignBottom":
				MainStore.getCurrentElementsValues.forEach((element) => {
					element.startY = offsetRect.bottom - element.height;
				});
				break;
			case "alignLeft":
				MainStore.getCurrentElementsValues.forEach((element) => {
					element.startX = offsetRect.left;
				});
				break;
			case "alignHorizontalCenter":
				MainStore.getCurrentElementsValues.forEach((element) => {
					element.startX =
						offsetRect.left +
						(offsetRect.right - offsetRect.left) / 2 -
						element.width / 2;
				});
				break;
			case "alignRight":
				MainStore.getCurrentElementsValues.forEach((element) => {
					element.startX = offsetRect.right - element.width;
				});
				break;
		}
	}
};

export const handleBorderIconClick = (element, icon) => {
	if (icon == "borderAll") {
		if (
			["borderTopStyle", "borderBottomStyle", "borderLeftStyle", "borderRightStyle"].every(
				(side) => element[side] != "hidden"
			)
		) {
			element["borderTopStyle"] = "hidden";
			element["borderBottomStyle"] = "hidden";
			element["borderLeftStyle"] = "hidden";
			element["borderRightStyle"] = "hidden";
		} else {
			delete element["borderTopStyle"];
			delete element["borderBottomStyle"];
			delete element["borderLeftStyle"];
			delete element["borderRightStyle"];
		}
	} else {
		if (element[icon] != "hidden") {
			element[icon] = "hidden";
		} else {
			delete element[icon];
		}
	}
};

export const getParentPage = (element) => {
	if (!element) return;
	if (element.type == "page") {
		return element;
	} else {
		if (element.parent) {
			return getParentPage(element.parent);
		}
		return;
	}
};

export const isInHeaderFooter = (element) => {
	if (!element) return false;
	if (!element.parent) return false;
	if (element.elementType == "header") {
		return true;
	} else {
		return isInHeaderFooter(element.parent);
	}
};

const getGlobalStyleObject = (object = null, checkProperty = null) => {
	const MainStore = useMainStore();
	let globalStyleName = MainStore.activeControl;
	if (globalStyleName == "text") {
		if (MainStore.textControlType == "dynamic") {
			globalStyleName = "dynamicText";
		} else {
			globalStyleName = "staticText";
		}
	}
	if (object) {
		globalStyleName = object.type;
		if (globalStyleName == "text") {
			if (object.isDynamic) {
				globalStyleName = "dynamicText";
			} else {
				globalStyleName = "staticText";
			}
		}
	}
	switch (MainStore.globalStyles[globalStyleName].styleEditMode) {
		case "main":
			return MainStore.globalStyles[globalStyleName].style;
		case "label":
			return MainStore.globalStyles[globalStyleName].labelStyle;
		case "header":
			return MainStore.globalStyles[globalStyleName].headerStyle;
		case "alt":
			if (checkProperty && MainStore.globalStyles[globalStyleName].altStyle[checkProperty]) {
				return MainStore.globalStyles[globalStyleName].altStyle;
			} else {
				return MainStore.globalStyles[globalStyleName].style;
			}
	}
};
export const getConditonalObject = (field) => {
	let object = field.reactiveObject;
	let property = field.property;
	if (typeof object == "function") {
		object = object();
	}
	isRef(object) && (object = object.value);
	let orignalObject = object;
	if (field.isStyle) {
		if (object) {
			switch (object.styleEditMode) {
				case "main":
					if (field.isFontStyle) {
						object =
							object.selectedDynamicText?.style ||
							object.selectedColumn?.style ||
							object.style;
					} else {
						object = object.selectedColumn?.style || object.style;
					}
					break;
				case "label":
					if (field.isFontStyle) {
						object = object.selectedDynamicText?.labelStyle || object.labelStyle;
					} else {
						object = object.labelStyle;
					}
					break;
				case "header":
					if (field.isFontStyle) {
						object = object.selectedDynamicText?.headerStyle || object.headerStyle;
					} else {
						object = object.headerStyle;
					}
					break;
				case "alt":
					if (field.isFontStyle) {
						// This is not implemented yet but will be implemented in future if user requests it.
						object = object.selectedDynamicText?.altStyle || object.altStyle;
					} else {
						object = object.altStyle;
					}
					// Incase There is no Alternate Style Fallback to All Row/Main Style
					if (property && !object[property]) {
						object = orignalObject.style;
					}
					break;
			}
			if (property) {
				if (object[property]) return object[property];
				return getGlobalStyleObject(orignalObject, property)[property];
			}
		} else {
			return getGlobalStyleObject();
		}
	}
	if (property) {
		return object[property];
	}
	return object;
};
export const handlePrintFonts = (element, printFonts) => {
	const MainStore = useMainStore();
	const pushFonts = ({ el = null, styleEditMode, globalStyleName }) => {
		let fontFamily =
			el?.[styleEditMode]?.["fontFamily"] ||
			element[styleEditMode]["fontFamily"] ||
			MainStore.globalStyles[globalStyleName][styleEditMode]["fontFamily"];
		let fontWeight =
			el?.[styleEditMode]?.["fontWeight"] ||
			element[styleEditMode]["fontWeight"] ||
			MainStore.globalStyles[globalStyleName][styleEditMode]["fontWeight"];
		let fontStyle =
			el?.[styleEditMode]?.["fontStyle"] ||
			element[styleEditMode]["fontStyle"] ||
			MainStore.globalStyles[globalStyleName][styleEditMode]["fontStyle"];
		// fallback to main style if not available in altstyle
		if (styleEditMode == "altStyle") {
			if (!fontFamily) {
				fontFamily =
					el?.["style"]?.["fontFamily"] ||
					element["style"]["fontFamily"] ||
					MainStore.globalStyles[globalStyleName]["style"]["fontFamily"];
			}
			if (!fontWeight) {
				fontWeight =
					el?.["style"]?.["fontWeight"] ||
					element["style"]["fontWeight"] ||
					MainStore.globalStyles[globalStyleName]["style"]["fontWeight"];
			}
			if (!fontStyle) {
				fontStyle =
					el?.["style"]?.["fontStyle"] ||
					element["style"]["fontStyle"] ||
					MainStore.globalStyles[globalStyleName]["style"]["fontStyle"];
			}
		}
		if (!fontFamily || !fontWeight || !fontStyle) return;
		if (!printFonts[fontFamily]) {
			printFonts[fontFamily] = {
				weight: [],
				italic: [],
			};
		}
		let weightArray = fontStyle == "italic" ? "italic" : "weight";
		if (printFonts[fontFamily][weightArray].indexOf(parseInt(fontWeight)) == -1) {
			printFonts[fontFamily][weightArray].push(parseInt(fontWeight));
			printFonts[fontFamily][weightArray].sort();
		}
	};
	let styleModes = ["style"];
	if (element.type == "text" && element.isDynamic) {
		styleModes.push("labelStyle");
	}
	if (element.type == "table") {
		styleModes.push("headerStyle");
		styleModes.push("altStyle");
	}
	styleModes.forEach((styleEditMode) => {
		let globalStyleName = element.type;
		if (globalStyleName == "text") {
			if (element.isDynamic) {
				globalStyleName = "dynamicText";
			} else {
				globalStyleName = "staticText";
			}
		}
		pushFonts({ styleEditMode, globalStyleName });
		if (element.dynamicContent) {
			element.dynamicContent.forEach((el) => {
				if (["headerStyle", "altStyle"].indexOf(styleEditMode) == -1) {
					pushFonts({ el, styleEditMode, globalStyleName });
				}
			});
		} else if (element.columns) {
			if (["headerStyle", "altStyle"].indexOf(styleEditMode) != -1) {
				pushFonts({ el: element, styleEditMode, globalStyleName });
			} else {
				element.columns.forEach((col) => {
					col.dynamicContent?.forEach((el) => {
						pushFonts({ el, styleEditMode, globalStyleName });
					});
				});
			}
		}
	});
};

export const selectElementContents = (el) => {
	const range = document.createRange();
	range.selectNodeContents(el);
	const sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange(range);
};

export const checkUpdateElementOverlapping = (element = null) => {
	const MainStore = useMainStore();
	const ElementStore = useElementStore();
	nextTick(() => {
		if (!element || element.parent.type != "page") return;
		isOlderSchema = MainStore.isOlderSchema("1.1.0");
		element.parent.childrens.forEach((el) => {
			const isElementOverlapping = ElementStore.isElementOverlapping(el);
			if (el.isElementOverlapping != isElementOverlapping) {
				el.isElementOverlapping = isElementOverlapping;
			}
			if (isOlderSchema && el.type == "table" && !isElementOverlapping) {
				el.heightType = "auto";
			}
		});
	}, {});
};
