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

import html2canvas from "html2canvas";

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
		// This is mofiied version of upload function used in frappe/FileUploader.vue
		async upload_file(file) {
			const MainStore = useMainStore();
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
				frappe.db.set_value(
					"Print Format",
					MainStore.printDesignName,
					"print_designer_preview_img",
					null
				);
			}

			return new Promise((resolve, reject) => {
				let xhr = new XMLHttpRequest();
				xhr.onreadystatechange = () => {
					if (xhr.readyState == XMLHttpRequest.DONE) {
						if (xhr.status === 200) {
							try {
								r = JSON.parse(xhr.responseText);
								if (r.message.doctype === "File") {
									file_doc = r.message;
									frappe.db.set_value(
										"Print Format",
										MainStore.printDesignName,
										"print_designer_preview_img",
										file_doc.file_url
									);
								}
							} catch (e) {
								r = xhr.responseText;
							}
							try {
								r = JSON.parse(xhr.responseText);
								if (r.message.doctype === "File") {
									file_doc = r.message;
									frappe.db.set_value(
										"Print Format",
										MainStore.printDesignName,
										"print_designer_preview_img",
										file_doc.file_url
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
			const options = {
				backgroundColor: "#ffffff",
				height: MainStore.page.height / 2,
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
			preview_canvas.toBlob((blob) => {
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
				this.upload_file(file_data);
			});
		},
		async saveElements() {
			const MainStore = useMainStore();
			if (this.checkIfAnyTableIsEmpty()) return;
			if (MainStore.mode == "preview") return;
			let is_standard = await frappe.db.get_value(
				"Print Format",
				MainStore.printDesignName,
				"standard"
			);
			is_standard = is_standard.message.standard == "Yes";
			// Update the header and footer height with margin
			MainStore.page.headerHeightWithMargin =
				MainStore.page.headerHeight + MainStore.page.marginTop;
			MainStore.page.footerHeightWithMargin =
				MainStore.page.footerHeight + MainStore.page.marginBottom;

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
			this.generatePreview();
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
					currentEl.startY >=
						MainStore.page.height -
							MainStore.page.footerHeightWithMargin -
							MainStore.page.marginTop
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

			if (containerType == "header") {
				offsetRect.top = 0;
				offsetRect.bottom = MainStore.page.headerHeight;
			}
			// if its the first element then update top to header height
			// also checking if element is below header ( just safe guard )
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
			this.cleanUpDynamicContent(saveEl);
			if (saveEl.type == "table") {
				delete saveEl.table.childfields;
				delete saveEl.table.default_layout;
			}
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
		cleanUpDynamicContent(element) {
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
					if (is_standard) {
						// remove file_url and file_name if format is standard
						["value", "name", "file_name", "file_url", "modified"].forEach((key) => {
							element.image[key] = "";
						});
					}
				}
			}
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
					if (containerType == "header") {
						el.startY += MainStore.page.marginTop;
					}
				});
				wrapperRectangleEl.style.backgroundColor = "";
			});
			return wrapperContainers.childrens.map((el) => this.childrensSave(el));
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
