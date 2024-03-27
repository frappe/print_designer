import { defineStore } from "pinia";
import { useMainStore } from "./MainStore";
import {
	createText,
	createRectangle,
	createDynamicText,
	createImage,
	createTable,
	createBarcode,
} from "../defaultObjects";
import { handlePrintFonts, setCurrentElement } from "../utils";
export const useElementStore = defineStore("ElementStore", {
	state: () => ({
		Elements: new Array(),
	}),
	actions: {
		createNewObject(event, element) {
			let newElement;
			const MainStore = useMainStore();
			if (MainStore.activeControl == "text") {
				if (MainStore.textControlType == "static") {
					newElement = createText(event, element);
				} else {
					newElement = createDynamicText(event, element);
				}
			} else if (MainStore.activeControl == "rectangle") {
				newElement = createRectangle(event, element);
			} else if (MainStore.activeControl == "image") {
				newElement = createImage(event, element);
			} else if (MainStore.activeControl == "table") {
				newElement = createTable(event, element);
			} else if (MainStore.activeControl == "barcode") {
				newElement = createBarcode(event, element);
			}
			return newElement;
		},
		async saveElements() {
			const MainStore = useMainStore();
			if (this.checkIfAnyTableIsEmpty()) return;
			const [headerElements, bodyElements, footerElements] = await this.computeLayout();
			if (!this.handleHeaderFooterOverlapping(headerElements.flat())) return;
			if (!this.handleHeaderFooterOverlapping(bodyElements.flat())) return;
			if (!this.handleHeaderFooterOverlapping(footerElements.flat())) return;

			const headerDimensions = this.computeElementDimensions(headerElements, "header");
			const bodyDimensions = this.computeElementDimensions(bodyElements, "body");
			const footerDimensions = this.computeElementDimensions(footerElements, "footer");

			const header = this.cleanUpElementsForSave(headerElements, "header");
			const body = this.cleanUpElementsForSave(bodyElements, "body");
			const footer = this.cleanUpElementsForSave(footerElements, "footer");

			if (!body) return;

			const [cleanedBodyElements, bodyFonts] = body;
			const [cleanedHeaderElements, headerFonts] = header || [[], null];
			const [cleanedFooterElements, footerFonts] = footer || [[], null];

			MainStore.currentFonts.length = 0;
			MainStore.currentFonts.push(
				...Object.keys({
					...(headerFonts || {}),
					...(bodyFonts || {}),
					...(footerFonts || {}),
				})
			);
			const updatedPage = { ...MainStore.page };
			updatedPage.headerHeightWithMargin =
				MainStore.page.headerHeight + MainStore.page.marginTop;
			updatedPage.footerHeightWithMargin =
				MainStore.page.footerHeight + MainStore.page.marginBottom;
			const settingsForSave = {
				page: updatedPage,
				pdfPrintDPI: MainStore.pdfPrintDPI,
				globalStyles: MainStore.globalStyles,
				currentPageSize: MainStore.currentPageSize,
				isHeaderFooterAuto: MainStore.isHeaderFooterAuto,
				currentDoc: MainStore.currentDoc,
				textControlType: MainStore.textControlType,
				currentFonts: MainStore.currentFonts,
				printHeaderFonts: MainStore.printHeaderFonts,
				printFooterFonts: MainStore.printFooterFonts,
				printBodyFonts: MainStore.printBodyFonts,
				userProvidedJinja: MainStore.userProvidedJinja,
				schema_version: MainStore.schema_version,
			};
			await frappe.dom.freeze();
			const convertCsstoString = (stylesheet) => {
				let cssRule = Array.from(stylesheet.cssRules)
					.map((rule) => rule.cssText || "")
					.join(" ");
				return stylesheet.cssRules ? cssRule : "";
			};
			const css =
				convertCsstoString(MainStore.screenStyleSheet) +
				convertCsstoString(MainStore.printStyleSheet);

			const objectToSave = {
				print_designer_header: JSON.stringify(cleanedHeaderElements[0]),
				print_designer_body: JSON.stringify(cleanedBodyElements.flat()),
				print_designer_after_table: null,
				print_designer_footer: JSON.stringify(cleanedFooterElements[0]),
				print_designer_settings: JSON.stringify(settingsForSave),
				css: css,
			};
			const PrintFormatData = this.getPrintFormatData({
				header: {
					elements: cleanedHeaderElements,
					dimensions: headerDimensions,
				},
				body: {
					elements: cleanedBodyElements,
					dimensions: bodyDimensions,
				},
				footer: {
					elements: cleanedFooterElements,
					dimensions: footerDimensions,
				},
			});

			objectToSave.print_designer_print_format = PrintFormatData;

			await frappe.db.set_value("Print Format", MainStore.printDesignName, objectToSave);
			await frappe.dom.unfreeze();
			frappe.show_alert(
				{
					message: `Print Format Saved Successfully`,
					indicator: "green",
				},
				5
			);
		},
		checkIfAnyTableIsEmpty() {
			const emptyTable = this.Elements.find((el) => el.type == "table" && el.table == null);
			if (emptyTable) {
				let message = __("You have Empty Table. Please add table fields or remove table.");
				setCurrentElement({}, emptyTable);
				frappe.show_alert(
					{
						message: message,
						indicator: "red",
					},
					5
				);
				return true;
			}
			return false;
		},
		async computeLayout(element = null) {
			const MainStore = useMainStore();
			const elements = [...this.Elements].map((el, index) => {
				return {
					index,
					startY: parseInt(el.startY),
					endY: parseInt(el.startY + el.height),
					element: el,
				};
			});
			elements.sort((a, b) => {
				return a.startY < b.startY ? -1 : 1;
			});
			const fullWidthElements = elements.filter(
				(currentEl) => !currentEl.element.isElementOverlapping
			);
			const headerContainer = [];
			const bodyContainer = [];
			const footerContainer = [];
			const tempElementsArray = [];
			elements.forEach((currentEl) => {
				if (MainStore.page.headerHeight && currentEl.endY <= MainStore.page.headerHeight) {
					headerContainer.push(currentEl);
				} else if (
					MainStore.page.footerHeight &&
					currentEl.startY >= MainStore.page.height - MainStore.page.footerHeight
				) {
					footerContainer.push(currentEl);
				} else if (
					fullWidthElements.includes(currentEl) &&
					currentEl.element.isDynamicHeight
				) {
					if (tempElementsArray.length) {
						bodyContainer.push([...tempElementsArray]);
					}
					bodyContainer.push([currentEl]);
					tempElementsArray.length = 0;
				} else {
					tempElementsArray.push(currentEl);
				}
			});
			if (tempElementsArray.length) {
				bodyContainer.push(tempElementsArray);
			}
			return [[headerContainer], bodyContainer, [footerContainer]];
		},
		handleHeaderFooterOverlapping(elements) {
			const MainStore = useMainStore();
			const tableElement = this.Elements.filter((el) => el.type == "table");
			let isOverlapping = false;

			if (tableElement.length == 1 && MainStore.isHeaderFooterAuto) {
				isOverlapping = !this.autoCalculateHeaderFooter(tableElement[0]);
			} else {
				isOverlapping = elements.some((element) => {
					element = element.element;
					if (
						(element.startY < MainStore.page.headerHeight &&
							element.startY + element.height > MainStore.page.headerHeight) ||
						(element.startY <
							MainStore.page.height -
								MainStore.page.footerHeight -
								MainStore.page.marginTop -
								MainStore.page.marginBottom &&
							element.startY + element.height >
								MainStore.page.height -
									MainStore.page.footerHeight -
									MainStore.page.marginTop -
									MainStore.page.marginBottom)
					) {
						return true;
					}
					return false;
				});
			}
			if (!isOverlapping) return true;
			MainStore.mode = "pdfSetup";
			frappe.show_alert(
				{
					message: "Please resolve overlapping header/footer elements",
					indicator: "red",
				},
				5
			);
		},
		autoCalculateHeaderFooter(tableEl) {
			const MainStore = useMainStore();

			if (this.isElementOverlapping(tableEl)) return false;

			MainStore.page.headerHeight = tableEl.startY;
			MainStore.page.footerHeight =
				MainStore.page.height -
				(tableEl.startY +
					tableEl.height +
					MainStore.page.marginTop +
					MainStore.page.marginBottom);

			return true;
		},
		computeElementDimensions(elements, containerType = "body") {
			const dimensions = [];
			elements.reduce(
				(prevDimensions, container, index) => {
					const calculatedDimensions = this.calculateWrapperElementDimensions(
						prevDimensions,
						container,
						containerType,
						index
					);
					dimensions.push(calculatedDimensions);
					return calculatedDimensions;
				},
				{ top: 0, bottom: 0 }
			);
			return dimensions;
		},
		calculateWrapperElementDimensions(prevDimensions, children, containerType, index) {
			// basically returns lowest left - top  highest right - bottom from all of the children elements
			const MainStore = useMainStore();
			const parentRect = MainStore.mainContainer.getBoundingClientRect();
			let offsetRect = children.reduce(
				(offset, currentElement) => {
					currentElement = currentElement.element;
					let currentElementRect = currentElement.DOMRef.getBoundingClientRect();
					currentElementRect.left < offset.left &&
						(offset.left = currentElementRect.left);
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

			if (containerType == "header") {
				offsetRect.top = 0;
				offsetRect.bottom = MainStore.page.headerHeight;
			}
			// if its the first element then update top to header height
			// also checking if element is below header ( just safe gaurd )
			if (containerType == "body") {
				if (index == 0 && offsetRect.top >= MainStore.page.headerHeight) {
					offsetRect.top = MainStore.page.headerHeight;
				}
				if (index != 0) {
					offsetRect.top = prevDimensions.bottom;
				}
			}
			return offsetRect;
		},
		cleanUpElementsForSave(elements, type) {
			if (this.checkIfPrintFormatIsEmpty(elements, type)) return;
			const fontsArray = [];
			const cleanedElements = [];
			elements.forEach((container) => {
				const cleanedContainer = [];
				container.forEach((element) => {
					let newElement = this.childrensSave(element.element, fontsArray);
					newElement.classes = newElement.classes.filter(
						(name) => ["inHeaderFooter", "overlappingHeaderFooter"].indexOf(name) == -1
					);
					if (element.type == "rectangle" && element.childrens.length) {
						let childrensArray = element.childrens;
						newElement.childrens = [];
						childrensArray.forEach((el) => {
							newElement.childrens.push(this.childrensSave(el, printFonts));
						});
					}
					cleanedContainer.push(newElement);
				});
				cleanedElements.push(cleanedContainer);
			});
			return [cleanedElements, fontsArray];
		},
		checkIfPrintFormatIsEmpty(elements, type) {
			const MainStore = useMainStore();
			if (elements.length == 0) {
				switch (type) {
					case "header":
						MainStore.printHeaderFonts = null;
						break;
					case "body":
						MainStore.printBodyFonts = null;
						frappe.show_alert(
							{
								message: "Atleast 1 element is required inside body",
								indicator: "red",
							},
							5
						);
						// This is intentionally using throw to stop the execution
						throw new Error(__("Atleast 1 element is required inside body"));
					case "footer":
						MainStore.printFooterFonts = null;
						break;
				}
				return true;
			}
			return false;
		},
		childrensSave(element, printFonts) {
			let saveEl = { ...element };
			delete saveEl.DOMRef;
			delete saveEl.index;
			delete saveEl.snapPoints;
			delete saveEl.snapEdges;
			delete saveEl.parent;
			if (printFonts && ["text", "table"].indexOf(saveEl.type) != -1) {
				handlePrintFonts(saveEl, printFonts);
			}
			if (saveEl.type == "rectangle") {
				const childrensArray = saveEl.childrens;
				saveEl.childrens = [];
				childrensArray.forEach((el) => {
					const child = this.childrensSave(el, printFonts);
					child && saveEl.childrens.push(child);
				});
			}

			return saveEl;
		},
		getPrintFormatData({ header, body, footer }) {
			const headerElements = this.createWrapperElement(
				header.elements,
				header.dimensions,
				"header"
			);
			const bodyElements = this.createWrapperElement(body.elements, body.dimensions, "body");
			const footerElements = this.createWrapperElement(
				footer.elements,
				footer.dimensions,
				"footer"
			);
			return JSON.stringify({
				header: headerElements,
				body: bodyElements,
				footer: footerElements,
			});
		},
		createWrapperElement(containers, dimensions, containerType = "body") {
			const MainStore = useMainStore();
			const wrapperContainers = { childrens: [] };
			containers.forEach((container, index) => {
				const calculatedDimensions = dimensions[index];
				const cordinates = {
					startY: calculatedDimensions.top,
					pageY: calculatedDimensions.top,
					startX: 0,
					pageX: 0,
				};
				const wrapperRectangleEl = createRectangle(cordinates, wrapperContainers);
				wrapperRectangleEl.height = calculatedDimensions.bottom - calculatedDimensions.top;
				wrapperRectangleEl.width =
					MainStore.page.width - MainStore.page.marginLeft - MainStore.page.marginRight;
				wrapperRectangleEl.childrens = container;
				if (
					containerType == "body" &&
					wrapperRectangleEl.childrens.length == 1 &&
					wrapperRectangleEl.childrens[0].isDynamicHeight == true
				) {
					wrapperRectangleEl.isDynamicHeight = true;
				}
				wrapperRectangleEl.childrens.forEach((el) => {
					el.startY -= cordinates.startY;
				});
				wrapperRectangleEl.style.backgroundColor = "";
			});
			return wrapperContainers.childrens.map((el) => this.childrensSave(el));
		},

		handleDynamicContent(element) {
			const MainStore = useMainStore();
			if (
				element.type == "table" ||
				(["text", "image", "barcode"].indexOf(element.type) != -1 && element.isDynamic)
			) {
				if (["text", "barcode"].indexOf(element.type) != -1) {
					element.dynamicContent = [
						...element.dynamicContent.map((el) => {
							return { ...el };
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
								return { ...el };
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
		},
		childrensLoad(element, parent) {
			element.parent = parent;
			element.DOMRef = null;
			delete element.printY;
			element.isDraggable = true;
			element.isResizable = true;
			this.handleDynamicContent(element);
			if (element.type == "rectangle") {
				element.isDropZone = true;
				const childrensArray = element.childrens;
				element.childrens = [];
				childrensArray.forEach((el) => {
					const child = this.childrensLoad(el, element);
					child && element.childrens.push(child);
				});
			} else if (element.type == "text" && !element.isDynamic) {
				element.contenteditable = false;
			}

			return element;
		},
		async loadElements(printDesignName) {
			const MainStore = useMainStore();
			frappe.dom.freeze(__("Loading Print Format"));
			const printFormat = await frappe.db.get_value("Print Format", printDesignName, [
				"print_designer_header",
				"print_designer_body",
				"print_designer_after_table",
				"print_designer_footer",
				"print_designer_settings",
			]);
			let ElementsHeader = JSON.parse(printFormat.message.print_designer_header);
			let ElementsBody = JSON.parse(printFormat.message.print_designer_body);
			let ElementsAfterTable = JSON.parse(printFormat.message.print_designer_after_table);
			let ElementsFooter = JSON.parse(printFormat.message.print_designer_footer);
			let settings = JSON.parse(printFormat.message.print_designer_settings);
			settings &&
				Object.keys(settings).forEach(async (key) => {
					if (
						["currentDoc", "schema_version"].indexOf(key) == -1 ||
						(await frappe.db.exists(MainStore.doctype, settings[key]))
					) {
						MainStore[key] = settings[key];
					}
					if (key == "schema_version" && settings[key] != MainStore.schema_version) {
						MainStore.old_schema_version = settings[key];
					}
				});
			this.Elements = [
				...(ElementsHeader || []),
				...(ElementsBody || []),
				...(ElementsFooter || []),
				...(ElementsAfterTable || []),
			];
			if (this.Elements.length === 0 && !!MainStore.getTableMetaFields.length) {
				const newTable = {
					id: frappe.utils.get_random(10),
					type: "table",
					DOMRef: null,
					parent: this.Elements,
					isDraggable: true,
					isResizable: true,
					isDropZone: false,
					table: null,
					columns: [
						{
							id: 0,
							label: "",
							style: {},
							applyStyleToHeader: false,
						},
						{
							id: 1,
							label: "",
							style: {},
							applyStyleToHeader: false,
						},
						{
							id: 2,
							label: "",
							style: {},
							applyStyleToHeader: false,
						},
						{
							id: 3,
							label: "",
							style: {},
							applyStyleToHeader: false,
						},
						{
							id: 4,
							label: "",
							style: {},
							applyStyleToHeader: false,
						},
						{
							id: 5,
							label: "",
							style: {},
							applyStyleToHeader: false,
						},
						{
							id: 6,
							label: "",
							style: {},
							applyStyleToHeader: false,
						},
					],
					PreviewRowNo: 1,
					selectedColumn: null,
					selectedDynamicText: null,
					startX: 11.338582677,
					startY: 393.826771658,
					pageX: 228,
					pageY: 435,
					width: 771.0236220564,
					height: 442.20472441469997,
					styleEditMode: "main",
					labelDisplayStyle: "standard",
					style: {},
					labelStyle: {},
					headerStyle: {},
					altStyle: {},
					classes: [],
				};
				this.Elements.push(newTable);
			}
			this.Elements.map((element) => {
				element.DOMRef = null;
				element.parent = this.Elements;
				delete element.printY;
				element.isDraggable = true;
				element.isResizable = true;
				this.handleDynamicContent(element);
				if (element.type == "rectangle") {
					element.isDropZone = true;
					if (element.childrens.length) {
						let childrensArray = element.childrens;
						element.childrens = [];
						childrensArray.forEach((el) => {
							element.childrens.push(this.childrensLoad(el, element));
						});
					}
				} else if (element.type == "text" && !element.isDynamic) {
					element.contenteditable = false;
				}
				return element;
			});
			frappe.dom.unfreeze();
		},
		setPrimaryTable(tableEl, value) {
			if (!value) {
				tableEl.isPrimaryTable = value;
				return;
			}
			tables = this.Elements.filter((el) => el.type == "table");
			tables.forEach((t) => {
				t.isPrimaryTable = t == tableEl;
			});
		},
		// This is called to check if the element is overlapping with any other element
		isElementOverlapping(currentEl, elements = this.Elements) {
			const currentElIndex =
				currentEl.index || this.Elements.findIndex((el) => el === currentEl);
			const currentStartY = parseInt(currentEl.startY);
			const currentEndY = currentEl.endY || parseInt(currentEl.startY + currentEl.height);

			return (
				elements.findIndex((el, index) => {
					if (index == currentElIndex) return false;
					const elStartY = parseInt(el.startY);
					const elEndY = el.endY || parseInt(el.startY + el.height);
					if (currentStartY <= elStartY && elStartY <= currentEndY) {
						return true;
					} else if (currentStartY <= elEndY && elEndY <= currentEndY) {
						return true;
					} else if (elStartY <= currentStartY && currentStartY <= elEndY) {
						return true;
					} else if (elStartY <= currentEndY && currentEndY <= elEndY) {
						return true;
					} else {
						return false;
					}
				}) != -1
			);
		},
	},
});
