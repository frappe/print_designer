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
		async computedLayoutForSave() {
			const { headerRowElements, bodyRowElements, footerRowElements } =
				await this.computeRowLayout();
			// check if any element is overlapping with header or footer and raise errors.
			if (!this.handleHeaderFooterOverlapping(headerRowElements.flat())) return;
			if (!this.handleHeaderFooterOverlapping(bodyRowElements.flat())) return;
			if (!this.handleHeaderFooterOverlapping(footerRowElements.flat())) return;

			// calculate dimensions for rows
			const headerDimensions = this.computeRowElementDimensions(headerRowElements, "header");
			const bodyDimensions = this.computeRowElementDimensions(bodyRowElements, "body");
			const footerDimensions = this.computeRowElementDimensions(footerRowElements, "footer");
			// calculate columns inside rows and update dimensions to passed array
			const headerColumnsInsideRows = await this.computeColumnLayout(
				headerRowElements,
				headerDimensions
			);
			const bodyColumnsInsideRows = await this.computeColumnLayout(
				bodyRowElements,
				bodyDimensions
			);
			const footerColumnsInsideRows = await this.computeColumnLayout(
				footerRowElements,
				footerDimensions
			);

			const headerFonts = [];
			const bodyFonts = [];
			const footerFonts = [];
			// clean up elements for save
			const cleanedHeaderElements = this.cleanUpElementsForSave(
				headerColumnsInsideRows,
				"header",
				headerFonts
			);
			const cleanedBodyElements = this.cleanUpElementsForSave(
				bodyColumnsInsideRows,
				"body",
				bodyFonts
			);
			const cleanedFooterElements = this.cleanUpElementsForSave(
				footerColumnsInsideRows,
				"footer",
				footerFonts
			);

			// update fonts in store
			const MainStore = useMainStore();
			MainStore.currentFonts.length = 0;
			MainStore.currentFonts.push(
				...Object.keys({
					...(headerFonts || {}),
					...(bodyFonts || {}),
					...(footerFonts || {}),
				})
			);
			return {
				header: {
					layout: cleanedHeaderElements,
					dimensions: headerDimensions,
				},
				body: {
					layout: cleanedBodyElements,
					dimensions: bodyDimensions,
				},
				footer: {
					layout: cleanedFooterElements,
					dimensions: footerDimensions,
				},
			};
		},
		async saveElements() {
			const MainStore = useMainStore();
			if (this.checkIfAnyTableIsEmpty()) return;

			// Update the header and footer height with margin
			MainStore.page.headerHeightWithMargin =
				MainStore.page.headerHeight + MainStore.page.marginTop;
			MainStore.page.footerHeightWithMargin =
				MainStore.page.footerHeight + MainStore.page.marginBottom;
			const layout = await this.computedLayoutForSave();
			if (!layout) return;
			const { header, body, footer } = layout;

			const updatedPage = { ...MainStore.page };
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
				// flatten the layout array to 2 levels to remove row and column structure
				print_designer_header: JSON.stringify(header.layout?.flat(2) || []),
				print_designer_body: JSON.stringify(body.layout.flat(2)),
				print_designer_footer: JSON.stringify(footer.layout?.flat(2) || []),
				print_designer_settings: JSON.stringify(settingsForSave),
				print_designer_after_table: null,
				css: css,
			};
			const PrintFormatData = this.getPrintFormatData({ header, body, footer });

			objectToSave.print_designer_print_format = PrintFormatData;
			if (MainStore.isOlderSchema("1.1.0")) {
				await this.printFormatCopyOnOlderSchema(objectToSave);
			} else {
				await frappe.db.set_value("Print Format", MainStore.printDesignName, objectToSave);
				frappe.show_alert(
					{
						message: `Print Format Saved Successfully`,
						indicator: "green",
					},
					5
				);
			}
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
		async computeRowLayout(columnContainer = null, activeSection = null) {
			const MainStore = useMainStore();
			if (!columnContainer) {
				columnContainer = [...this.Elements].map((el, index) => {
					return {
						index,
						startY: parseInt(el.startY),
						endY: parseInt(el.startY + el.height),
						startX: parseInt(el.startX),
						endX: parseInt(el.startX + el.width),
						element: el,
					};
				});
			}
			columnContainer.sort((a, b) => {
				return a.startY < b.startY ? -1 : 1;
			});
			return columnContainer.reduce(
				(computedLayout, currentEl) => {
					let rows = computedLayout[activeSection || computedLayout.activeSection];
					if (
						!activeSection &&
						computedLayout.activeSection == "headerRowElements" &&
						currentEl.startY >= MainStore.page.headerHeight
					) {
						// handle empty headerRowElements
						rows.length == 0 && rows.push([]);
						// change activeSection and rows to bodyRowElements
						computedLayout.activeSection = "bodyRowElements";
						rows = computedLayout["bodyRowElements"];
					}
					if (
						!activeSection &&
						computedLayout.activeSection == "bodyRowElements" &&
						currentEl.startY >=
							MainStore.page.height -
								MainStore.page.marginTop -
								MainStore.page.footerHeightWithMargin
					) {
						// no need to handle empty bodyRowElements as it will throw error and never reach here
						// change activeSection and rows to footerRowElements
						computedLayout.activeSection = "footerRowElements";
						rows = computedLayout["footerRowElements"];
					}
					if (rows.length == 0) {
						rows.push([currentEl]);
						return computedLayout;
					}

					// replace with .at() after checking compatibility for our user base.
					const lastRow = rows[rows.length - 1];
					const elementWithMaxEndY = lastRow[lastRow.length - 1];

					if (currentEl.startY >= elementWithMaxEndY.endY) {
						rows.push([currentEl]);
						return computedLayout;
					}

					if (currentEl.endY > elementWithMaxEndY.endY) {
						lastRow.push(currentEl);
					} else {
						lastRow.splice(-1, 0, currentEl);
					}

					return computedLayout;
				},
				{
					headerRowElements: [],
					bodyRowElements: [],
					footerRowElements: [],
					activeSection: "headerRowElements",
				}
			);
		},
		async computeColumnLayout(rows, rowDimensions) {
			const columns = rows.map((elements) => {
				elements.sort((a, b) => {
					return a.startX < b.startX ? -1 : 1;
				});
				return elements.reduce((columns, currentEl) => {
					if (columns.length == 0) {
						columns.push([currentEl]);
						return columns;
					}
					// replace with .at() after checking compatibility for our user base.
					const lastColumn = columns[columns.length - 1];
					const elementWithMaxEndX = lastColumn[lastColumn.length - 1];

					if (currentEl.startX >= elementWithMaxEndX.endX) {
						columns.push([currentEl]);
						return columns;
					}
					if (currentEl.endX > elementWithMaxEndX.endX) {
						lastColumn.push(currentEl);
					} else {
						lastColumn.splice(-1, 0, currentEl);
					}
					return columns;
				}, []);
			});
			// sort elements inside columns by startY
			columns.forEach((column) => column.sort((a, b) => (a.startY < b.startY ? -1 : 1)));
			// This will add column dimensions under key columnDimensions inside bodyDimensions.
			this.computeColumnElementDimensions(columns, rowDimensions);
			return columns;
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
		computeRowElementDimensions(elements, containerType = "body") {
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
				{ bottom: 0 }
			);
			return dimensions;
		},
		computeColumnElementDimensions(rows, rowDimensions) {
			const MainStore = useMainStore();
			rows.forEach((row, index) => {
				const dimensions = [];
				row.reduceRight(
					(prevDimensions, container, index) => {
						const calculatedDimensions = this.calculateWrapperElementDimensions(
							prevDimensions,
							container,
							"column",
							index
						);
						dimensions.push(calculatedDimensions);
						return calculatedDimensions;
					},
					{
						left:
							MainStore.page.width -
							MainStore.page.marginRight -
							MainStore.page.marginLeft,
					}
				);
				rowDimensions[index]["columnDimensions"] = dimensions.reverse();
			});
		},
		calculateWrapperElementDimensions(prevDimensions, children, containerType, index) {
			// basically returns lowest left - top  highest right - bottom from all of the children elements
			const MainStore = useMainStore();
			const parentRect = {
				top: 0,
				left: 0,
				width:
					MainStore.page.width - MainStore.page.marginLeft - MainStore.page.marginRight,
				height:
					MainStore.page.height - MainStore.page.marginTop - MainStore.page.marginBottom,
			};
			let offsetRect = children.reduce(
				(offset, currentElement) => {
					currentElement = currentElement.element;
					let currentElementRect = {
						top: currentElement.startY,
						left: currentElement.startX,
						right: currentElement.startX + currentElement.width,
						bottom: currentElement.startY + currentElement.height,
					};
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

			if (containerType == "header" && index == 0) {
				offsetRect.top = 0;
			}
			if (containerType == "body") {
				if (index == 0 && offsetRect.top >= MainStore.page.headerHeight) {
					offsetRect.top = MainStore.page.headerHeight;
				}
			}
			if (containerType == "footer" && index == 0) {
				offsetRect.top =
					MainStore.page.height -
					MainStore.page.footerHeightWithMargin -
					MainStore.page.marginTop;
			}
			if (index != 0) {
				offsetRect.top = prevDimensions.bottom;
			}
			if (containerType == "column") {
				offsetRect.right = prevDimensions.left;
			}
			return offsetRect;
		},
		cleanUpElementsForSave(rows, type, fontsArray = null) {
			if (this.checkIfPrintFormatIsEmpty(rows, type)) return;
			return rows.map((columns) => {
				return columns.map((column) => {
					return column.map((element) => {
						let newElement = this.childrensSave(element.element, fontsArray);
						newElement.classes = newElement.classes.filter(
							(name) =>
								["inHeaderFooter", "overlappingHeaderFooter"].indexOf(name) == -1
						);
						if (element.type == "rectangle" && element.childrens.length) {
							let childrensArray = element.childrens;
							newElement.childrens = [];
							childrensArray.forEach((el) => {
								newElement.childrens.push(this.childrensSave(el, printFonts));
							});
						}
						return newElement;
					});
				});
			});
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
		childrensSave(element, printFonts = null) {
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
			const headerElements = this.createRowWrapperElement(
				header.layout,
				header.dimensions,
				"header"
			);
			const bodyElements = this.createRowWrapperElement(
				body.layout,
				body.dimensions,
				"body"
			);
			const footerElements = this.createRowWrapperElement(
				footer.layout,
				footer.dimensions,
				"footer"
			);
			const data = JSON.stringify({
				header: headerElements,
				body: bodyElements,
				footer: footerElements,
			});
			const layoutElements = [...headerElements, ...bodyElements, ...footerElements];
			this.Elements.push(
				...layoutElements.map((row) => {
					row.childrens.map((column) => {
						column.childrens = [];
					});
					return this.childrensLoad(row);
				})
			);
			return data;
		},
		createRowWrapperElement(rows, dimensions, containerType = "body") {
			if (!rows) return [];
			const MainStore = useMainStore();
			const wrapperContainer = { childrens: [] };
			rows.forEach((row, index) => {
				const calculatedDimensions = dimensions[index];
				const cordinates = {
					startY: calculatedDimensions.top,
					pageY: calculatedDimensions.top,
					startX: 0,
					pageX: 0,
				};
				const wrapperRectangleEl = createRectangle(cordinates, wrapperContainer);
				wrapperRectangleEl.width =
					MainStore.page.width - MainStore.page.marginLeft - MainStore.page.marginRight;
				wrapperRectangleEl.height = calculatedDimensions.bottom - calculatedDimensions.top;
				wrapperRectangleEl.childrens = this.createColumnWrapperElement(
					row,
					calculatedDimensions.columnDimensions,
					wrapperRectangleEl
				);
				if (wrapperRectangleEl.childrens.some((el) => el.isDynamicHeight == true)) {
					wrapperRectangleEl.isDynamicHeight = true;
				}
				wrapperRectangleEl.classes.push("relative-row");
			});
			return wrapperContainer.childrens.map((el) => this.childrensSave(el));
		},
		createColumnWrapperElement(row, dimensions, rowContainer = null) {
			return row.map((column, index) => {
				const calculatedDimensions = dimensions[index];
				if (index == 0) {
					calculatedDimensions.left = 0;
				}
				const cordinates = {
					startY: 0, // parentDimensions.top,
					pageY: 0,
					startX: calculatedDimensions.left,
					pageX: calculatedDimensions.left,
				};
				const wrapperRectangleEl = createRectangle(cordinates, rowContainer);
				wrapperRectangleEl.width = calculatedDimensions.right - calculatedDimensions.left;
				wrapperRectangleEl.height = rowContainer.height;
				wrapperRectangleEl.childrens = column;
				if (
					wrapperRectangleEl.childrens.length == 1 &&
					wrapperRectangleEl.childrens[0].isDynamicHeight == true
				) {
					wrapperRectangleEl.isDynamicHeight = true;
				}
				wrapperRectangleEl.childrens.forEach((el) => {
					el.startY -= rowContainer.startY;
					el.startX -= cordinates.startX;
					["startX", "startY", "height", "width"].forEach((property) => {
						if (typeof el[property] == "string") {
							el[property] = parseFloat(el[property]);
						}
						el[property] = parseFloat(el[property].toFixed(3));
					});
				});
				["startX", "startY", "height", "width"].forEach((property) => {
					wrapperRectangleEl[property] = parseFloat(
						wrapperRectangleEl[property].toFixed(3)
					);
				});
				wrapperRectangleEl.classes.push("relative-column");
				wrapperRectangleEl.relativeColumn = true;
				return wrapperRectangleEl;
			});
		},
		async printFormatCopyOnOlderSchema(objectToSave) {
			const MainStore = useMainStore();
			let nextFormatCopyNumber = 0;
			for (let i = 0; i < 100; i++) {
				const pf_exists = await frappe.db.exists(
					"Print Format",
					MainStore.printDesignName + " ( Copy " + (i ? i : "") + " )"
				);
				if (pf_exists) continue;
				nextFormatCopyNumber = i;
				break;
			}
			const newName =
				MainStore.printDesignName +
				" ( Copy " +
				(nextFormatCopyNumber ? nextFormatCopyNumber : "") +
				" )";
			// TODO: have better message.
			let message = __(
				"<b>This Print Format was created from older version of Print Designer.</b>"
			);
			message += "<hr />";
			message += __(
				"It is not compatible with current version so instead we will make copy of this format for you using new version"
			);
			message += "<hr />";
			message += __(`Do you want to save it as <b>${newName}</b> ?`);

			frappe.confirm(
				message,
				async () => {
					await frappe.db.insert({
						doctype: "Print Format",
						name: newName,
						doc_type: MainStore.doctype,
						print_designer: 1,
						print_designer_header: objectToSave.print_designer_header,
						print_designer_body: objectToSave.print_designer_body,
						print_designer_after_table: null,
						print_designer_footer: objectToSave.print_designer_footer,
						print_designer_print_format: objectToSave.print_designer_print_format,
						print_designer_settings: objectToSave.print_designer_settings,
					});
					frappe.set_route("print-designer", newName);
				},
				async () => {
					throw new Error(__("Print Format not saved"));
				}
			);
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
		loadSettings(settings) {
			const MainStore = useMainStore();
			if (!settings) return;
			Object.keys(settings).forEach((key) => {
				switch (key) {
					case "schema_version":
						MainStore.old_schema_version = settings["schema_version"];
					case "currentDoc":
						frappe.db
							.exists(MainStore.doctype, settings["currentDoc"])
							.then((exists) => {
								if (exists) {
									MainStore.currentDoc = settings["currentDoc"];
								}
							});
						break;
					default:
						MainStore[key] = settings[key];
						break;
				}
			});
			return;
		},
		async loadElements(printDesignName) {
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
			this.loadSettings(settings);
			this.Elements = [
				...(ElementsHeader || []),
				...(ElementsBody || []),
				...(ElementsAfterTable || []),
				...(ElementsFooter || []),
			];
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
		// This is called to check if the element is overlapping with any other element (row only)
		// TODO: add column calculations
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
					if (
						currentStartY <= elStartY &&
						elStartY <= currentEndY &&
						!(currentStartY <= elEndY && elEndY <= currentEndY)
					) {
						return true;
					} else if (
						!(currentStartY <= elStartY && elStartY <= currentEndY) &&
						currentStartY <= elEndY &&
						elEndY <= currentEndY
					) {
						return true;
					} else if (
						elStartY <= currentStartY &&
						currentStartY <= elEndY &&
						elStartY <= currentEndY &&
						currentEndY <= elEndY
					) {
						return true;
					} else {
						return false;
					}
				}) != -1
			);
		},
	},
});
