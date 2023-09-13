import { defineStore } from "pinia";
import { useMainStore } from "./MainStore";
import {
	createText,
	createRectangle,
	createDynamicText,
	createImage,
	createTable,
	createBarcode
} from "../defaultObjects";
import { handlePrintFonts } from "../utils";
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
			if (MainStore.mode == "preview") return;
			let mainPrintFonts = {};
			let headerPrintFonts = {};
			let footerprintFonts = {};
			const childrensSave = (element, printFonts) => {
				let saveEl = { ...element };
				delete saveEl.DOMRef;
				delete saveEl.index;
				delete saveEl.snapPoints;
				delete saveEl.snapEdges;
				delete saveEl.parent;
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
							} ${isHeaderOverlapping && isFooterOverlapping ? " and " : ""} ${isFooterOverlapping ? "footer" : ""}`,
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
						element.dynamicContent.filter((el) => ["page", "topage", "date", "time"].indexOf(el.fieldname) != -1).forEach((field) =>  {
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
			if (pageInfoInBody.length){
				frappe.show_alert({
					message: "Please move <b>" + pageInfoInBody.join(", ") + "</b> to header / footer",
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
				Object.keys(settings).forEach( async (key) => {
					if (key != "currentDoc" || await frappe.db.exists(MainStore.doctype, settings[key])) {
						MainStore[key] = settings[key];
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
						},
						{
							id: 1,
							label: "",
						},
						{
							id: 2,
							label: "",
						},
						{
							id: 3,
							label: "",
						},
						{
							id: 4,
							label: "",
						},
						{
							id: 5,
							label: "",
						},
						{
							id: 6,
							label: "",
						},
					],
					PreviewRowNo: 1,
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
	},
});
