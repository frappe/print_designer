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
import {
	handlePrintFonts,
	setCurrentElement,
	createHeaderFooterElement,
	getParentPage,
} from "../utils";

import html2canvas from "html2canvas";

export const useElementStore = defineStore("ElementStore", {
	state: () => ({
		Elements: new Array(),
		Headers: new Array(),
		Footers: new Array(),
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
		computeLayoutForSave() {
			this.handleHeaderFooterOverlapping();

			const { header, body, footer } = this.computeMainLayout();
			// before modifying save json object that is used by loadElements and UI.
			const objectToSave = {
				print_designer_header: JSON.stringify(header || []),
				print_designer_body: JSON.stringify(body),
				print_designer_footer: JSON.stringify(footer || []),
				print_designer_after_table: null,
			};
			const layout = {
				header: [],
				body: [],
				footer: [],
			};
			let headerElements = [];
			let bodyElements = [];
			let footerElements = [];
			if (header) {
				const headerArray = header.map((h) => {
					h.childrens = this.computeRowLayout(h.childrens, headerElements, "header");
					return h;
				});
				layout.header = {
					firstPage: headerArray.find((h) => h.firstPage).childrens,
					oddPage: headerArray.find((h) => h.oddPage).childrens,
					evenPage: headerArray.find((h) => h.evenPage).childrens,
					lastPage: headerArray.find((h) => h.lastPage).childrens,
				};
			}
			// it will throw error if body is empty so no need to check here
			layout.body = body.map((b) => {
				b.childrens = this.computeRowLayout(b.childrens, bodyElements, "body");
				return b;
			});
			if (footer) {
				const footerArray = footer.map((f) => {
					f.childrens = this.computeRowLayout(f.childrens, footerElements, "footer");
					return f;
				});
				layout.footer = {
					firstPage: footerArray.find((h) => h.firstPage).childrens,
					oddPage: footerArray.find((h) => h.oddPage).childrens,
					evenPage: footerArray.find((h) => h.evenPage).childrens,
					lastPage: footerArray.find((h) => h.lastPage).childrens,
				};
			}
			// WARNING: lines below are for debugging purpose only.
			// this.Elements.length = 0;
			// this.Headers.length = 0;
			// this.Footers.length = 0;
			// this.Headers.push(...header);
			// this.Elements.push(...body);
			// this.Footers.push(...footer);
			// this.Elements.forEach((page, index) => {
			// 	page.header = [createHeaderFooterElement(this.getHeaderObject(index).childrens, "header")];
			// 	page.footer = [createHeaderFooterElement(this.getFooterObject(index).childrens, "footer")]
			// });
			// End of debugging code
			objectToSave.print_designer_print_format = JSON.stringify(layout);

			// update fonts in store
			const MainStore = useMainStore();
			MainStore.currentFonts.length = 0;
			MainStore.currentFonts.push(
				...Object.keys({
					...(MainStore.printHeaderFonts || {}),
					...(MainStore.printBodyFonts || {}),
					...(MainStore.printFooterFonts || {}),
				})
			);
			return objectToSave;
		},
		// This is modified version of upload function used in frappe/FileUploader.vue
		async upload_file(file) {
			const MainStore = useMainStore();
			MainStore.print_designer_preview_img = null;
			return new Promise((resolve, reject) => {
				let xhr = new XMLHttpRequest();
				xhr.onreadystatechange = () => {
					if (xhr.readyState == XMLHttpRequest.DONE) {
						if (xhr.status === 200) {
							try {
								r = JSON.parse(xhr.responseText);
								if (r.message.doctype === "File") {
									file_url = r.message.file_url;
									frappe.db.set_value(
										"Print Format",
										MainStore.printDesignName,
										"print_designer_preview_img",
										file_url
									);
								}
							} catch (e) {
								r = xhr.responseText;
							}
						}
					}
				};
				xhr.open("POST", "/api/method/upload_file", true);
				xhr.setRequestHeader("Accept", "application/json");
				xhr.setRequestHeader("X-Frappe-CSRF-Token", frappe.csrf_token);

				let form_data = new FormData();
				if (file.file_obj) {
					form_data.append("file", file.file_obj, file.name);
				}
				form_data.append("is_private", 1);

				form_data.append("doctype", "Print Format");
				form_data.append("docname", MainStore.printDesignName);

				form_data.append("fieldname", "print_designer_preview_img");

				if (file.optimize) {
					form_data.append("optimize", true);
				}
				xhr.send(form_data);
			});
		},
		async generatePreview() {
			const MainStore = useMainStore();
			// first delete old preview image
			const filter = {
				attached_to_doctype: "Print Format",
				attached_to_name: MainStore.printDesignName,
				attached_to_field: "print_designer_preview_img",
			};
			// get filename before uploading new file
			let old_filename = await frappe.db.get_value("File", filter, "name");
			old_filename = old_filename.message.name;
			if (old_filename) {
				frappe.db.delete_doc("File", old_filename);
			}

			const options = {
				backgroundColor: "#ffffff",
				height: MainStore.page.height,
				width: MainStore.page.width,
			};
			const print_stylesheet = document.createElement("style");
			print_stylesheet.rel = "stylesheet";
			let st = `.main-container::after {
				display: none;
			}`;
			document.getElementsByClassName("main-container")[0].appendChild(print_stylesheet);
			print_stylesheet.sheet.insertRule(st, 0);
			const preview_canvas = await html2canvas(
				document.getElementsByClassName("main-container")[0],
				options
			);
			document.getElementsByClassName("main-container")[0].removeChild(print_stylesheet);
			preview_canvas.toBlob(async (blob) => {
				const file = new File(
					[blob],
					`print_designer-${frappe.scrub(MainStore.printDesignName)}-preview.jpg`,
					{ type: "image/jpeg" }
				);
				const file_data = {
					file_obj: file,
					optimize: 1,
					name: file.name,
					private: true,
				};
				await this.upload_file(file_data);
			});
		},
		async saveElements() {
			const MainStore = useMainStore();
			if (this.checkIfAnyTableIsEmpty()) return;
			let is_standard = await frappe.db.get_value(
				"Print Format",
				MainStore.printDesignName,
				"standard"
			);
			MainStore.is_standard = is_standard.message.standard == "Yes";
			// Update the header and footer height with margin
			MainStore.page.headerHeightWithMargin =
				MainStore.page.headerHeight + MainStore.page.marginTop;
			MainStore.page.footerHeightWithMargin =
				MainStore.page.footerHeight + MainStore.page.marginBottom;
			const objectToSave = this.computeLayoutForSave();
			if (!objectToSave) return;
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

			objectToSave.print_designer_settings = JSON.stringify(settingsForSave);
			objectToSave.print_designer_after_table = null;
			objectToSave.css = css;
			if (MainStore.isOlderSchema("1.3.0")) {
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
				await this.generatePreview();
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
		computeMainLayout() {
			let header = [];
			let body = [];
			let footer = [];
			const pages = [...this.Elements];
			const headerArray = [...this.Headers];
			const footerArray = [...this.Footers];
			headerArray.forEach((h) => {
				const headerCopy = { ...h };
				delete headerCopy.DOMRef;
				delete headerCopy.parent;
				h.childrens = this.cleanUpElementsForSave(h.childrens, "header") || [];
				header.push(headerCopy);
			});
			pages.forEach((page) => {
				const pageCopy = { ...page };
				delete pageCopy.DOMRef;
				delete pageCopy.parent;
				delete pageCopy.header;
				delete pageCopy.footer;
				pageCopy.childrens.sort((a, b) => {
					return a.startY < b.startY ? -1 : 1;
				});
				pageCopy.childrens = this.cleanUpElementsForSave(pageCopy.childrens, "body");
				body.push(pageCopy);
			});
			footerArray.forEach((f) => {
				const footerCopy = { ...f };
				delete footerCopy.DOMRef;
				delete footerCopy.parent;
				footerCopy.childrens = this.cleanUpElementsForSave(f.childrens, "footer") || [];
				footer.push(footerCopy);
			});
			return { header, body, footer };
		},
		// TODO: Refactor this function
		computeRowLayout(column, parentContainer = null, type = "row") {
			const MainStore = useMainStore();
			const rowElements = [];
			let prevDimension = null;
			column.sort((a, b) => (a.startY < b.startY ? -1 : 1));
			const rows = column.reduce((currentRow, currentEl) => {
				if (currentRow.length == 0) {
					currentRow.push(currentEl);
					return currentRow;
				}
				// replace with .at() after checking compatibility for our user base.
				const el = currentRow.at(-1);
				const currentStartY = parseInt(currentEl.startY);
				const currentEndY = parseInt(currentEl.startY + currentEl.height);
				const maxEndY = parseInt(el.startY + el.height);

				if (currentStartY >= maxEndY) {
					const dimension = this.computeRowElementDimensions(
						currentRow,
						rowElements.length,
						prevDimension,
						type
					);
					prevDimension = dimension;
					const wrapper = this.createRowWrapperElement(
						dimension,
						currentRow,
						parentContainer
					);
					rowElements.push(wrapper);
					currentRow.length = 0;
					currentRow.push(currentEl);
					return currentRow;
				}

				if (currentEndY > maxEndY) {
					currentRow.push(currentEl);
				} else {
					currentRow.splice(-1, 0, currentEl);
				}
				return currentRow;
			}, []);
			// don't create row if it is there is only one row and parent is column
			if (parentContainer?.layoutType == "column" && rowElements.length == 0) {
				return;
			}
			if (rows.length != 0) {
				const dimension = this.computeRowElementDimensions(
					rows,
					rowElements.length,
					prevDimension,
					type
				);
				if (parentContainer.layoutType == "column") {
					dimension.bottom = parentContainer.height;
				}
				prevDimension = dimension;
				const wrapper = this.createRowWrapperElement(dimension, rows, parentContainer);
				rowElements.push(wrapper);
			}
			rowElements.sort((a, b) => (a.startY < b.startY ? -1 : 1));
			if (type == "header" && rowElements.length) {
				const lastHeaderRow = rowElements[rowElements.length - 1];
				lastHeaderRow.height =
					MainStore.page.headerHeight - MainStore.page.marginTop - lastHeaderRow.startY;
			} else if (type == "footer" && rowElements.length) {
				const lastFooterRow = rowElements[rowElements.length - 1];
				lastFooterRow.height = MainStore.page.footerHeight - lastFooterRow.startY;
			}
			return rowElements;
		},
		// TODO: extract repeated code to a function
		computeColumnLayout(row, parentContainer) {
			const columnElements = [];
			let prevDimension = null;
			row.sort((a, b) => (a.startX < b.startX ? -1 : 1));
			const columns = row.reduce((currentColumn, currentEl) => {
				if (currentColumn.length == 0) {
					currentColumn.push(currentEl);
					return currentColumn;
				}
				const el = currentColumn.at(-1);
				const currentStartX = parseInt(currentEl.startX);
				const currentEndX = parseInt(currentEl.startX + currentEl.width);
				const maxEndX = parseInt(el.startX + el.width);
				if (currentStartX >= maxEndX) {
					const dimension = this.computeColumnElementDimensions(
						currentColumn,
						columnElements.length,
						prevDimension
					);
					prevDimension = dimension;
					const wrapper = this.createColumnWrapperElement(
						dimension,
						currentColumn,
						parentContainer
					);
					columnElements.push(wrapper);
					currentColumn.length = 0;
					currentColumn.push(currentEl);
					return currentColumn;
				}
				if (currentEndX > maxEndX) {
					currentColumn.push(currentEl);
				} else {
					currentColumn.splice(-1, 0, currentEl);
				}
				return currentColumn;
			}, []);
			if (columnElements.length == 0) {
				return;
			}
			if (columns.length != 0) {
				// column is defined so now run row layout
				const dimension = this.computeColumnElementDimensions(
					columns,
					columnElements.length,
					prevDimension
				);
				// if parent is row then set right to parent width else page width
				if (parentContainer.layoutType == "row") {
					dimension.right = parentContainer.width;
				} else {
					dimension.right =
						MainStore.page.width -
						MainStore.page.marginLeft -
						MainStore.page.marginRight;
				}
				prevDimension = dimension;
				const wrapper = this.createColumnWrapperElement(
					dimension,
					columns,
					parentContainer
				);
				columnElements.push(wrapper);
			}
			return columnElements;
		},
		computeLayoutInsideRectangle(childElements) {
			if (childElements.at(-1).type == "rectangle") {
				const el = childElements.at(-1);
				if (el.type == "rectangle") {
					el.childrens = this.computeRowLayout(el.childrens, el);
					el.layoutType = "column";
					el.classes = el.classes.filter((c) => c != "relative-column");
					el.rectangleContainer = true;
					if (el.childrens.some((e) => e.heightType == "auto-min-height")) {
						el.heightType = "auto-min-height";
					} else if (el.childrens.some((e) => e.heightType == "auto")) {
						el.heightType = "auto";
					} else {
						el.heightType = "fixed";
					}
				}
			}
		},
		handleHeaderFooterOverlapping() {
			const elements = this.Elements;
			const MainStore = useMainStore();

			const throwOverlappingError = (type) => {
				let message = __(`Please resolve overlapping elements `);
				const messageType = Object.freeze({
					header: "<b>" + __("in header") + "</b>",
					footer: "<b>" + __("in footer") + "</b>",
					auto: __("in table, auto layout failed"),
				});
				message += messageType[type];
				frappe.show_alert(
					{
						message: message,
						indicator: "red",
					},
					6
				);
				throw new Error(message);
			};

			const tableElement = this.Elements.filter((el) => el.type == "table");

			if (tableElement.length == 1 && MainStore.isHeaderFooterAuto) {
				if (!this.autoCalculateHeaderFooter(tableElement[0])) {
					throwOverlappingError("auto");
				}
			} else {
				elements.forEach((element) => {
					if (
						element.startY < MainStore.page.headerHeight &&
						element.startY + element.height > MainStore.page.headerHeight
					) {
						throwOverlappingError("header");
					} else if (
						element.startY <
							MainStore.page.height -
								MainStore.page.footerHeight -
								MainStore.page.marginTop -
								MainStore.page.marginBottom &&
						element.startY + element.height >
							MainStore.page.height -
								MainStore.page.footerHeight -
								MainStore.page.marginTop -
								MainStore.page.marginBottom
					) {
						throwOverlappingError("footer");
					}
				});
			}
		},
		autoCalculateHeaderFooter(tableEl) {
			const MainStore = useMainStore();

			if (this.isElementOverlapping(tableEl)) return false;

			MainStore.page.headerHeight = tableEl.startY - 1;
			MainStore.page.footerHeight =
				MainStore.page.height +
				1 -
				(tableEl.startY +
					tableEl.height +
					MainStore.page.marginTop +
					MainStore.page.marginBottom);

			return true;
		},
		computeRowElementDimensions(row, index, prevDimensions = null, containerType = "row") {
			const MainStore = useMainStore();
			if (!prevDimensions) {
				prevDimensions = {
					left:
						MainStore.page.width -
						MainStore.page.marginRight -
						MainStore.page.marginLeft,
					bottom: 0,
				};
			}
			return this.calculateWrapperElementDimensions(
				prevDimensions,
				row,
				containerType,
				index
			);
		},
		computeColumnElementDimensions(column, index, prevDimensions = null) {
			if (!prevDimensions) {
				prevDimensions = {
					right: 0,
				};
			}
			return this.calculateWrapperElementDimensions(prevDimensions, column, "column", index);
		},
		// TODO: move logic to computeRowElementDimensions
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
			// element is parent level row.
			if (index > 0 && ["header", "body", "footer"].includes(containerType)) {
				offsetRect.top = prevDimensions.bottom;
			}
			if (containerType == "column") {
				offsetRect.left = prevDimensions.right;
				offsetRect.top = 0;
			}
			if (containerType == "row") {
				if (index == 0) {
					offsetRect.top = 0;
				} else {
					offsetRect.top = prevDimensions.bottom;
				}
			}
			return offsetRect;
		},
		cleanUpElementsForSave(rows, type) {
			if (this.checkIfPrintFormatIsEmpty(rows, type)) return;
			const MainStore = useMainStore();
			const fontsObject = {};
			switch (type) {
				case "header":
					MainStore.printHeaderFonts = fontsObject;
					break;
				case "body":
					MainStore.printBodyFonts = fontsObject;
					break;
				case "footer":
					MainStore.printFooterFonts = fontsObject;
			}
			return rows.map((element) => {
				let newElement = this.childrensSave(element, fontsObject);
				newElement.classes = newElement.classes.filter(
					(name) => ["inHeaderFooter", "overlappingHeaderFooter"].indexOf(name) == -1
				);
				return newElement;
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
						let message = __("Atleast 1 element is required inside body");
						frappe.show_alert(
							{
								message: message,
								indicator: "red",
							},
							5
						);
						// This is intentionally using throw to stop the execution
						throw new Error(message);
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
			delete saveEl.snapPoints;
			delete saveEl.snapEdges;
			delete saveEl.parent;
			this.cleanUpDynamicContent(saveEl);
			if (saveEl.type == "table") {
				saveEl.table = { ...saveEl.table };
				delete saveEl.table.childfields;
				delete saveEl.table.default_layout;
			}
			if (printFonts && ["text", "table"].indexOf(saveEl.type) != -1) {
				handlePrintFonts(saveEl, printFonts);
			}
			if (saveEl.type == "rectangle" || saveEl.type == "page") {
				const childrensArray = saveEl.childrens;
				saveEl.childrens = [];
				childrensArray.forEach((el) => {
					const child = this.childrensSave(el, printFonts);
					child && saveEl.childrens.push(child);
				});
			}

			return saveEl;
		},
		cleanUpDynamicContent(element) {
			const MainStore = useMainStore();
			if (
				["table", "image"].includes(element.type) ||
				(["text", "barcode"].includes(element.type) && element.isDynamic)
			) {
				if (["text", "barcode"].indexOf(element.type) != -1) {
					element.dynamicContent = [
						...element.dynamicContent.map((el) => {
							const newEl = { ...el };
							if (!el.is_static) {
								newEl.value = "";
							}
							return newEl;
						}),
					];
					element.selectedDynamicText = null;
				} else if (element.type === "table") {
					element.columns = [
						...element.columns.map((el) => {
							const newEl = { ...el };
							delete newEl.DOMRef;
							return newEl;
						}),
					];
					element.columns.forEach((col) => {
						if (!col.dynamicContent) return;
						col.dynamicContent = [
							...col.dynamicContent.map((el) => {
								const newEl = { ...el };
								if (!el.is_static) {
									newEl.value = "";
								}
								return newEl;
							}),
						];
						col.selectedDynamicText = null;
					});
				} else {
					element.image = { ...element.image };
					if (MainStore.is_standard) {
						// remove file_url and file_name if format is standard
						["value", "name", "file_name", "file_url", "modified"].forEach((key) => {
							element.image[key] = "";
						});
					}
				}
			}
		},
		createWrapperElement(dimensions, parent) {
			const MainStore = useMainStore();
			const coordinates = {};
			if (parent.type == "page") {
				coordinates["startY"] = dimensions.top;
				coordinates["pageY"] = dimensions.top;
				coordinates["startX"] = 0;
				coordinates["pageX"] = 0;
			} else if (parent.layoutType == "row") {
				coordinates["startY"] = 0;
				coordinates["pageY"] = 0;
				coordinates["startX"] = dimensions.left;
				coordinates["pageX"] = dimensions.left;
			} else {
				coordinates["startY"] = dimensions.top;
				coordinates["pageY"] = dimensions.top;
				coordinates["startX"] = dimensions.left;
				coordinates["pageX"] = dimensions.left;
			}
			const wrapper = createRectangle(coordinates, parent);
			wrapper.layoutType = parent.layoutType == "row" ? "column" : "row";
			if (wrapper.layoutType == "column") {
				wrapper.width = dimensions.right - dimensions.left;
				wrapper.height = parent.height || 0;
				wrapper.classes = wrapper.classes.filter((c) => c != "relative-column");
				wrapper.classes.push("relative-column");
				wrapper.relativeColumn = true;
			} else {
				wrapper.width =
					parent.width ||
					MainStore.page.width - MainStore.page.marginLeft - MainStore.page.marginRight;
				wrapper.height = dimensions.bottom - dimensions.top;
				wrapper.classes = wrapper.classes.filter((c) => c != "relative-row");
				wrapper.classes.push("relative-row");
				wrapper.classes.push(wrapper.id);
			}
			return wrapper;
		},
		updateChildrenInRowWrapper(wrapper, children) {
			wrapper.childrens = children;
			if (
				(wrapper.childrens.length == 1 &&
					wrapper.childrens[0].heightType == "auto-min-height") ||
				wrapper.childrens.some(
					(el) =>
						["row", "column"].includes(el.layoutType) &&
						el.heightType == "auto-min-height"
				)
			) {
				wrapper.heightType = "auto-min-height";
			} else if (
				(wrapper.childrens.length == 1 && wrapper.childrens[0].heightType == "auto") ||
				wrapper.childrens.some(
					(el) => ["row", "column"].includes(el.layoutType) && el.heightType == "auto"
				)
			) {
				wrapper.heightType = "auto";
			} else {
				wrapper.heightType = "fixed";
			}
			wrapper.childrens.sort((a, b) => (a.startY < b.startY ? -1 : 1));
			wrapper.startX = 0;
			return;
		},
		updateRowChildrenDimensions(wrapper, children, parent) {
			if (parent.type == "page") {
				children.forEach((el) => {
					el.startY -= wrapper.startY;
				});
				return;
			}
			children.forEach((el) => {
				el.startY -= wrapper.startY;
			});
		},
		updateColumnChildrenDimensions(wrapper, children) {
			children.sort((a, b) => (a.startX < b.startX ? -1 : 1));

			children.forEach((el) => {
				el.startY -= wrapper.startY;
				el.startX -= wrapper.startX;
			});
		},
		updateChildrenInColumnWrapper(wrapper, children) {
			wrapper.childrens = children;
			wrapper.childrens.forEach((el) => {
				el.startY += wrapper.startY;
			});
			// TODO: add better control for dynamic height
			wrapper.startY = 0;
			if (
				wrapper.childrens.some(
					(el) => el.layoutType == "row" || el.heightType == "auto-min-height"
				)
			) {
				wrapper.heightType = "auto-min-height";
			} else if (
				wrapper.childrens.some(
					(el) => el.layoutType == "column" || el.heightType == "auto"
				)
			) {
				wrapper.heightType = "auto";
			} else {
				wrapper.heightType = "fixed";
			}
		},
		createRowWrapperElement(dimension, currentRow, parent) {
			const MainStore = useMainStore();
			const coordinates = {};
			if (parent.type == "page") {
				coordinates["startY"] = dimension.top;
				coordinates["pageY"] = dimension.top;
				coordinates["startX"] = 0;
				coordinates["pageX"] = 0;
			} else {
				coordinates["startY"] = dimension.top;
				coordinates["pageY"] = dimension.top;
				coordinates["startX"] = dimension.left;
				coordinates["pageX"] = dimension.left;
			}
			const wrapper = createRectangle(coordinates, parent);
			wrapper.layoutType = "row";
			wrapper.width =
				parent.width ||
				MainStore.page.width - MainStore.page.marginLeft - MainStore.page.marginRight;
			wrapper.height = dimension.bottom - dimension.top;
			wrapper.classes = wrapper.classes.filter((c) => c != "relative-row");
			wrapper.classes.push("relative-row");
			delete wrapper.parent;
			this.updateRowElement(wrapper, currentRow, parent);
			return wrapper;
		},
		updateRowElement(wrapper, currentRow, parent) {
			wrapper.layoutType = "row";
			this.updateRowChildrenDimensions(wrapper, currentRow, parent);
			let childElements = [...currentRow];
			const columnEls = this.computeColumnLayout(childElements, wrapper);
			if (columnEls) {
				childElements = columnEls;
			} else {
				this.computeLayoutInsideRectangle(childElements);
			}
			this.updateChildrenInRowWrapper(wrapper, childElements);
			if (
				(childElements.length == 1 && childElements[0].heightType == "auto-min-height") ||
				childElements.some(
					(el) =>
						["row", "column"].includes(el.layoutType) &&
						el.heightType == "auto-min-height"
				)
			) {
				wrapper.heightType = "auto-min-height";
			} else if (
				(childElements.length == 1 && childElements[0].heightType == "auto") ||
				childElements.some(
					(el) => ["row", "column"].includes(el.layoutType) && el.heightType == "auto"
				)
			) {
				wrapper.heightType = "auto";
			} else {
				wrapper.heightType = "fixed";
			}
		},
		createColumnWrapperElement(dimension, currentColumn, parent) {
			const coordinates = {
				startY: dimension.top,
				pageY: dimension.top,
				startX: dimension.left,
				pageX: dimension.left,
			};
			const wrapper = createRectangle(coordinates, parent);
			wrapper.layoutType = "column";
			wrapper.width = dimension.right - dimension.left;
			wrapper.height = parent.height;
			wrapper.classes = wrapper.classes.filter((c) => c != "relative-column");
			wrapper.classes.push("relative-column");
			wrapper.relativeColumn = true;
			delete wrapper.parent;
			this.updateColumnElement(wrapper, currentColumn);
			return wrapper;
		},
		updateColumnElement(wrapper, currentColumn) {
			wrapper.layoutType = "column";
			this.updateColumnChildrenDimensions(wrapper, currentColumn);
			let childElements = [...currentColumn];
			const rowEls = this.computeRowLayout(childElements, wrapper);
			if (rowEls) {
				childElements = rowEls;
			} else {
				this.computeLayoutInsideRectangle(childElements);
			}
			this.updateChildrenInColumnWrapper(wrapper, childElements);
			if (
				(childElements.length == 1 && childElements[0].heightType == "auto-min-height") ||
				childElements.some(
					(el) =>
						["row", "column"].includes(el.layoutType) &&
						el.heightType == "auto-min-height"
				)
			) {
				wrapper.heightType = "auto-min-height";
			} else if (
				(childElements.length == 1 && childElements[0].heightType == "auto") ||
				childElements.some(
					(el) => ["row", "column"].includes(el.layoutType) && el.heightType == "auto"
				)
			) {
				wrapper.heightType = "auto";
			} else {
				wrapper.heightType = "fixed";
			}
		},
		async printFormatCopyOnOlderSchema(objectToSave) {
			// TODO: have better message.
			let message = __(
				"<b>This Print Format was created from older version of Print Designer.</b>"
			);
			message += "<hr />";
			message += __(
				"It is not compatible with current version so instead make copy of this format using new version"
			);
			message += "<hr />";
			message += __(`Do you want to save copy of it ?`);

			frappe.confirm(
				message,
				async () => {
					this.promptUserForNewFormatName(objectToSave);
				},
				async () => {
					frappe.show_alert(
						{
							message: `Print Format not saved`,
							indicator: "red",
						},
						5
					);
					// intentionally throwing error to stop the saving the format
					throw new Error(__("Print Format not saved"));
				}
			);
		},
		async promptUserForNewFormatName(objectToSave) {
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
			// This is just default value for the new print format name
			const print_format_name =
				MainStore.printDesignName +
				" ( Copy " +
				(nextFormatCopyNumber ? nextFormatCopyNumber : "") +
				" )";

			let d = new frappe.ui.Dialog({
				title: "New Print Format",
				fields: [
					{
						label: "Name",
						fieldname: "print_format_name",
						fieldtype: "Data",
						reqd: 1,
						default: print_format_name,
					},
				],
				size: "small",
				primary_action_label: "Save",
				static: true,
				async primary_action(values) {
					try {
						await frappe.db.insert({
							doctype: "Print Format",
							name: values.print_format_name,
							doc_type: MainStore.doctype,
							print_designer: 1,
							print_designer_header: objectToSave.print_designer_header,
							print_designer_body: objectToSave.print_designer_body,
							print_designer_after_table: null,
							print_designer_footer: objectToSave.print_designer_footer,
							print_designer_print_format: objectToSave.print_designer_print_format,
							print_designer_settings: objectToSave.print_designer_settings,
						});
						d.hide();
						frappe.set_route("print-designer", values.print_format_name);
					} catch (error) {
						console.error(error);
					}
				},
			});
			d.get_close_btn().on("click", () => {
				frappe.show_alert(
					{
						message: `Print Format not saved`,
						indicator: "red",
					},
					5
				);
			});
			d.show();
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
							const newEl = { ...el };
							if (!el.is_static) {
								newEl.value = "";
							}
							return newEl;
						}),
					];
					element.selectedDynamicText = null;
					MainStore.dynamicData.push(...element.dynamicContent);
				} else if (element.type === "table") {
					if (element.table) {
						const mf = MainStore.metaFields.find(
							(field) => field.fieldname == element.table.fieldname
						);
						if (mf) {
							element.table = mf;
						}
					}

					element.columns = [
						...element.columns.map((el) => {
							return { ...el };
						}),
					];
					element.columns.forEach((col) => {
						if (!col.dynamicContent) return;
						col.dynamicContent = [
							...col.dynamicContent.map((el) => {
								const newEl = { ...el };
								if (!el.is_static) {
									newEl.value = "";
								}
								return newEl;
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
			if (element.type == "rectangle" || element.type == "page") {
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
		getHeaderObject(index) {
			if (index == 0) {
				return this.Headers.find((header) => header.firstPage == true);
			} else if (index == this.Elements.length - 1) {
				return this.Headers.find((header) => header.lastPage == true);
			} else if (index % 2 != 0) {
				return this.Headers.find((header) => header.oddPage == true);
			} else {
				return this.Headers.find((header) => header.evenPage == true);
			}
		},
		getFooterObject(index) {
			if (index == 0) {
				return this.Footers.find((footer) => footer.firstPage == true);
			} else if (index == this.Elements.length - 1) {
				return this.Footers.find((footer) => footer.lastPage == true);
			} else if (index % 2 != 0) {
				return this.Footers.find((footer) => footer.oddPage == true);
			} else {
				return this.Footers.find((footer) => footer.evenPage == true);
			}
		},
		setElementProperties(parent) {
			parent.childrens.map((element) => {
				element.DOMRef = null;
				element.parent = parent;
				delete element.printY;
				element.isDraggable = true;
				element.isResizable = true;
				this.handleDynamicContent(element);
				if (element.type == "rectangle" || element.type == "page") {
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
		},
		createPageElement(element, type) {
			return {
				type: "page",
				childrens: [...element],
				firstPage: true,
				oddPage: true,
				evenPage: true,
				lastPage: true,
				DOMRef: null,
			};
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
			let settings = JSON.parse(printFormat.message.print_designer_settings);
			this.loadSettings(settings);

			let ElementsBody = JSON.parse(printFormat.message.print_designer_body);
			let ElementsAfterTable = JSON.parse(printFormat.message.print_designer_after_table);
			const headers = JSON.parse(printFormat.message.print_designer_header);
			const footers = JSON.parse(printFormat.message.print_designer_footer);
			headers.forEach((header) => {
				this.Headers.push(header);
			});
			footers.forEach((footer) => {
				this.Footers.push(footer);
			});
			// backwards compatibility :(
			if (ElementsAfterTable && ElementsAfterTable.length) {
				ElementsBody[0].childrens.push(...ElementsAfterTable);
			}
			this.Elements.length = 0;
			this.Elements.push(...ElementsBody);
			ElementsBody.forEach((page, index) => {
				page.header = [
					createHeaderFooterElement(this.getHeaderObject(index).childrens, "header"),
				];
				page.footer = [
					createHeaderFooterElement(this.getFooterObject(index).childrens, "footer"),
				];
			});
			this.Elements.forEach((page) => this.setElementProperties(page));
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
		isElementOverlapping(currentEl, elements = null) {
			const MainStore = useMainStore();
			MainStore.activePage = getParentPage(currentEl.parent);
			if (!elements) {
				elements = MainStore.activePage.childrens;
			}
			const currentElIndex = currentEl.index || elements.findIndex((el) => el === currentEl);
			const currentStartY = parseInt(currentEl.startY);
			const currentStartX = parseInt(currentEl.startX);
			const currentEndY = parseInt(currentEl.startY + currentEl.height);
			const currentEndX = parseInt(currentEl.startX + currentEl.width);
			return (
				elements.findIndex((el, index) => {
					if (index == currentElIndex) return false;
					const elStartY = parseInt(el.startY);
					const elEndY = parseInt(el.startY + el.height);
					const elStartX = parseInt(el.startX);
					const elEndX = parseInt(el.startX + el.width);
					if (
						currentStartY <= elStartY &&
						elStartY <= currentEndY &&
						!(currentStartY <= elEndY && elEndY <= currentEndY) &&
						currentStartX <= elStartX &&
						elStartX <= currentEndX &&
						!(currentStartX <= elEndX && elEndX <= currentEndX)
					) {
						return true;
					} else if (
						!(currentStartY <= elStartY && elStartY <= currentEndY) &&
						currentStartY <= elEndY &&
						elEndY <= currentEndY &&
						!(currentStartX <= elStartX && elStartX <= currentEndX) &&
						currentStartX <= elEndX &&
						elEndX <= currentEndX
					) {
						return true;
					} else if (
						elStartY <= currentStartY &&
						currentStartY <= elEndY &&
						elStartY <= currentEndY &&
						currentEndY <= elEndY &&
						elStartX <= currentStartX &&
						currentStartX <= elEndX &&
						elStartX <= currentEndX &&
						currentEndX <= elEndX
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
