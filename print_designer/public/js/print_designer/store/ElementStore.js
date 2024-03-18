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
import { handlePrintFonts } from "../utils";

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

			return new Promise((resolve, reject) => {
				let xhr = new XMLHttpRequest();
				xhr.onreadystatechange = () => {
					if (xhr.readyState == XMLHttpRequest.DONE) {
						if (xhr.status === 200) {
							// delete old preview image when new image is successfully uploaded
							old_filename && frappe.db.delete_doc("File", old_filename);
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
					`${MainStore.printDesignName}_${MainStore.currentDoc}.jpg`,
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
			let is_standard = await frappe.db.get_value(
				"Print Format",
				MainStore.printDesignName,
				"standard"
			);
			is_standard = is_standard.message.standard == "Yes";
			if (MainStore.mode == "preview") return;
			let mainPrintFonts = {};
			let headerPrintFonts = {};
			let footerprintFonts = {};
			const cleanUpDynamicContent = (element) => {
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
							["value", "name", "file_name", "file_url", "modified"].forEach(
								(key) => {
									element.image[key] = "";
								}
							);
						}
					}
				}
			};
			const childrensSave = (element, printFonts) => {
				let saveEl = { ...element };
				delete saveEl.DOMRef;
				delete saveEl.index;
				delete saveEl.snapPoints;
				delete saveEl.snapEdges;
				delete saveEl.parent;
				cleanUpDynamicContent(saveEl);
				if (saveEl.type == "table") {
					delete saveEl.table.childfields;
					delete saveEl.table.default_layout;
				}
				["text", "table"].indexOf(saveEl.type) != -1 &&
					handlePrintFonts(saveEl, printFonts);
				if (saveEl.type == "rectangle") {
					const childrensArray = saveEl.childrens;
					saveEl.childrens = [];
					childrensArray.forEach((el) => {
						const child = childrensSave(el, printFonts);
						child && saveEl.childrens.push(child);
					});
				}

				return saveEl;
			};
			const headerElements = [];
			const mainElements = [];
			const afterTableElements = [];
			const footerElements = [];
			let tableElement = this.Elements.filter((el) => el.type == "table");
			if (tableElement.some((el) => el.table == null)) {
				let message = __("You have Empty Table. Please add table fields or remove table.");
				frappe.show_alert(
					{
						message: message,
						indicator: "red",
					},
					5
				);
				return;
			}
			let isOverlapping = false;
			if (tableElement.length == 1 && MainStore.isHeaderFooterAuto) {
				this.Elements.forEach((element) => {
					if (
						(element.startY < tableElement[0].startY + MainStore.page.marginTop &&
							element.startY + element.height >
								tableElement[0].startY + MainStore.page.marginTop) ||
						(element.startY <
							MainStore.page.height -
								(MainStore.page.height -
									(tableElement[0].startY + tableElement[0].height)) -
								MainStore.page.marginTop -
								MainStore.page.marginBottom &&
							element.startY + element.height >
								MainStore.page.height -
									(MainStore.page.height -
										(tableElement[0].startY + tableElement[0].height)) -
									MainStore.page.marginTop -
									MainStore.page.marginBottom)
					) {
						isOverlapping = true;
					}
				});
				if (isOverlapping) {
					MainStore.mode = "editing";
				} else if (!isOverlapping) {
					MainStore.page.headerHeight = tableElement[0].startY;
					MainStore.page.footerHeight =
						MainStore.page.height -
						(tableElement[0].startY +
							tableElement[0].height +
							MainStore.page.marginTop +
							MainStore.page.marginBottom);
				}
			} else {
				let isHeaderOverlapping = false;
				let isFooterOverlapping = false;
				this.Elements.forEach((element) => {
					if (
						element.startY < MainStore.page.headerHeight &&
						element.startY + element.height > MainStore.page.headerHeight
					) {
						isHeaderOverlapping = true;
					}
					if (
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
						isFooterOverlapping = true;
					}
				});
				if (isHeaderOverlapping || isFooterOverlapping) {
					MainStore.mode = "pdfSetup";
					frappe.show_alert(
						{
							message: `Please resolve overlapping ${
								isHeaderOverlapping ? "header" : ""
							} ${isHeaderOverlapping && isFooterOverlapping ? " and " : ""} ${
								isFooterOverlapping ? "footer" : ""
							}`,
							indicator: "red",
						},
						5
					);
					return;
				}
			}
			let isHeaderEmpty = true;
			let isBodyEmpty = true;
			let isFooterEmpty = true;
			let pageInfoInBody = [];
			if (tableElement.length == 1) {
				tableElement[0].isPrimaryTable = true;
			} else if (tableElement.length > 1) {
				let primaryTableEl = tableElement.filter((el) => el.isPrimaryTable);
				if (primaryTableEl.length == 1) {
					tableElement = primaryTableEl;
				} else {
					const message = __(
						"As You have multiple tables, you have to select Primary Table. <br></br> 1. Go to Table Element that you wish to set as Primary. <br></br> 2. Select it and from properties panel select <b>Set as Primary Table</b> as <b>Yes</b> "
					);
					frappe.msgprint(
						{
							title: __("Multiple Tables."),
							message: message,
							indicator: "red",
						},
						5
					);
					return;
				}
			}
			this.Elements.forEach((element) => {
				let is_header = false;
				let is_footer = false;
				if (
					element.startY + element.height <
					MainStore.page.headerHeight + MainStore.page.marginTop
				) {
					is_header = true;
				} else if (
					element.startY >
					MainStore.page.height -
						MainStore.page.footerHeight -
						MainStore.page.marginTop -
						MainStore.page.marginBottom
				) {
					is_footer = true;
				} else {
					if (element.type == "text" && element.isDynamic) {
						element.dynamicContent
							.filter(
								(el) =>
									["page", "topage", "date", "time"].indexOf(el.fieldname) != -1
							)
							.forEach((field) => {
								pageInfoInBody.push(field.fieldname);
							});
					}
				}
				let printFonts = is_header
					? headerPrintFonts
					: is_footer
					? footerprintFonts
					: mainPrintFonts;
				let newElement = childrensSave(element, printFonts);
				newElement.classes = newElement.classes.filter(
					(name) => ["inHeaderFooter", "overlappingHeaderFooter"].indexOf(name) == -1
				);
				if (element.type == "rectangle" && element.childrens.length) {
					let childrensArray = element.childrens;
					newElement.childrens = [];
					childrensArray.forEach((el) => {
						newElement.childrens.push(childrensSave(el, printFonts));
					});
				}
				if (is_header) {
					newElement.printY = newElement.startY + MainStore.page.marginTop;
					MainStore.printHeaderFonts = printFonts;
					headerElements.push(newElement);
					isHeaderEmpty = false;
				} else if (is_footer) {
					newElement.printY =
						newElement.startY -
						(MainStore.page.height -
							MainStore.page.footerHeight -
							MainStore.page.marginBottom -
							MainStore.page.marginTop);
					MainStore.printFooterFonts = printFonts;
					footerElements.push(newElement);
					isFooterEmpty = false;
				} else {
					newElement.printY = newElement.startY - MainStore.page.headerHeight;
					MainStore.printBodyFonts = printFonts;
					if (
						tableElement.length == 1 &&
						tableElement[0].startY + tableElement[0].height <= newElement.startY + 2
					) {
						newElement.printY =
							newElement.startY - (tableElement[0].startY + tableElement[0].height);
						newElement.printX = newElement.startX - tableElement[0].startX;

						afterTableElements.push(newElement);
					} else {
						mainElements.push(newElement);
					}
					isBodyEmpty = false;
				}
			});
			if (isHeaderEmpty) {
				MainStore.printHeaderFonts = null;
			}
			if (isBodyEmpty) {
				if (!isHeaderEmpty || !isFooterEmpty) {
					MainStore.mode = "pdfSetup";
					frappe.show_alert(
						{
							message: "Atleast 1 element is required inside body",
							indicator: "red",
						},
						5
					);
					return;
				}
				MainStore.printBodyFonts = null;
			}
			if (pageInfoInBody.length) {
				frappe.show_alert({
					message:
						"Please move <b>" + pageInfoInBody.join(", ") + "</b> to header / footer",
					indicator: "orange",
				});
				return;
			}
			if (isFooterEmpty) {
				MainStore.printFooterFonts = null;
			}
			MainStore.currentFonts.length = 0;
			MainStore.currentFonts.push(
				...Object.keys({
					...(headerPrintFonts || {}),
					...(mainPrintFonts || {}),
					...(footerprintFonts || {}),
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
			await frappe.db.set_value("Print Format", MainStore.printDesignName, {
				print_designer_header: JSON.stringify(headerElements),
				print_designer_body: JSON.stringify(mainElements),
				print_designer_after_table: JSON.stringify(afterTableElements),
				print_designer_footer: JSON.stringify(footerElements),
				print_designer_settings: JSON.stringify(settingsForSave),
				css,
			});
			await frappe.dom.unfreeze();
			frappe.show_alert(
				{
					message: `Print Format Saved Successfully`,
					indicator: "green",
				},
				5
			);
			this.generatePreview();
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
			const handleDynamicContent = (element) => {
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
						const mf = MainStore.metaFields.find(
							(field) => field.fieldname == element.table.fieldname
						);
						if (mf) {
							element.table = mf;
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
			};
			const childrensLoad = (element, parent) => {
				element.parent = parent;
				element.DOMRef = null;
				delete element.printY;
				element.isDraggable = true;
				element.isResizable = true;
				handleDynamicContent(element);
				if (element.type == "rectangle") {
					element.isDropZone = true;
					const childrensArray = element.childrens;
					element.childrens = [];
					childrensArray.forEach((el) => {
						const child = childrensLoad(el, element);
						child && element.childrens.push(child);
					});
				} else if (element.type == "text" && !element.isDynamic) {
					element.contenteditable = false;
				}

				return element;
			};
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
				handleDynamicContent(element);
				if (element.type == "rectangle") {
					element.isDropZone = true;
					if (element.childrens.length) {
						let childrensArray = element.childrens;
						element.childrens = [];
						childrensArray.forEach((el) => {
							element.childrens.push(childrensLoad(el, element));
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
	},
});
