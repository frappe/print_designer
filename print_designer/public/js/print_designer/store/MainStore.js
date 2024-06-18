import { defineStore } from "pinia";
import { markRaw } from "vue";
import { useChangeValueUnit } from "../composables/ChangeValueUnit";
import { GoogleFonts, barcodeFormats } from "../defaultObjects";
import { globalStyles } from "../globalStyles";
import { pageSizes } from "../pageSizes";
export const useMainStore = defineStore("MainStore", {
	state: () => ({
		/**
		 * @type {'mouse-pointer'|'text'|'rectangle'|'image'|'components'|'table'|'barcode'}  activeControl
		 */
		activeControl: "mouse-pointer",
		/**
		 * @type {'static'|'dynamic'}  textControlType
		 */
		textControlType: "dynamic",
		/**
		 * @type {'editing'|'footer'|'header'} mode
		 */
		schema_version: "1.3.0",
		mode: "editing",
		activePage: null,
		visiblePages: [],
		cursor: "url('/assets/print_designer/images/mouse-pointer.svg'), default !important",
		isMarqueeActive: false,
		isDrawing: false,
		doctype: null,
		currentDoc: null,
		pdfPrintDPI: 96,
		isPDFSetupMode: false,
		isHeaderFooterAuto: true,
		isPreviewMode: false,
		barcodeFormats,
		fonts: GoogleFonts,
		currentFonts: ["Inter"],
		printHeaderFonts: null,
		printBodyFonts: null,
		printFooterFonts: null,
		rawMeta: null,
		metaFields: [],
		docData: {},
		dynamicData: [],
		imageDocFields: [],
		snapPoints: [],
		snapEdges: [],
		propertiesContainer: new Object(),
		openModal: false,
		openDynamicModal: null,
		openImageModal: null,
		openBarcodeModal: null,
		openTableColumnModal: null,
		openJinjaModal: false,
		mainParsedJinjaData: "",
		userProvidedJinja: "",
		frappeControls: {
			documentControl: null,
			tableControl: null,
		},
		isMoveStart: false,
		isDropped: false,
		isAltKey: false,
		isShiftKey: false,
		lastCloned: null,
		currentDrawListener: null,
		isMoved: false,
		isHiddenFieldsVisible: false,
		currentPageSize: "A4",
		pageSizes,
		lastCreatedElement: null,
		screenStyleSheet: null,
		printStyleSheet: null,
		modalLocation: {
			isDragged: false,
			x: 0,
			y: 0,
		},
		toolbarWidth: 44,
		currentElements: {},
		globalStyles,
		printDesignName: "",
		isLayerPanelEnabled: false,
		page: {
			height: 1122.519685,
			width: 793.7007874,
			marginTop: 0,
			marginBottom: 0,
			marginLeft: 0,
			marginRight: 0,
			headerHeight: 0,
			footerHeight: 0,
			headerHeightWithMargin: 0,
			footerHeightWithMargin: 0,
			UOM: "mm",
		},
		controls: {
			MousePointer: {
				icon: "mouseTool",
				control: "MousePointer",
				aria_label: __("Mouse Pointer (M)"),
				id: "mouse-pointer",
				cursor: "url('/assets/print_designer/images/mouse-pointer.svg'), default",
				isDisabled: false,
			},
			Text: {
				icon: "textTool",
				control: "Text",
				aria_label: __("Text (T)"),
				id: "text",
				cursor: "url('/assets/print_designer/images/add-text.svg') 10 10, text",
				isDisabled: false,
			},
			Rectangle: {
				icon: "rectangleTool",
				control: "Rectangle",
				aria_label: __("Rectangle (R)"),
				id: "rectangle",
				cursor: "url('/assets/print_designer/images/add-rectangle.svg') 6 6, crosshair",
				isDisabled: false,
			},
			Image: {
				icon: "imageTool",
				control: "Image",
				aria_label: __("Image (I)"),
				id: "image",
				cursor: "url('/assets/print_designer/images/add-image.svg') 6 6, crosshair",
				isDisabled: false,
			},
			Table: {
				icon: "tableTool",
				control: "Table",
				aria_label: __("Table (A)"),
				id: "table",
				cursor: "url('/assets/print_designer/images/add-table.svg') 6 6, crosshair",
				isDisabled: false,
			},
			// Components: {
			// 	icon: "fa fa-cube",
			// 	control: "Components",
			// 	aria_label: __("Components (C)"),
			// 	id: "components",
			// 	cursor: "default",
			// },
			Barcode: {
				icon: "barcodeTool",
				control: "Barcode",
				aria_label: __("Barcode (B)"),
				id: "barcode",
				cursor: "url('/assets/print_designer/images/add-barcode.svg') 6 6, crosshair",
			},
		},
		propertiesPanel: [],
	}),
	getters: {
		convertToPageUOM() {
			return (input) => {
				let convertedUnit = useChangeValueUnit({
					inputString: input,
					defaultInputUnit: "px",
					convertionUnit: this.page.UOM,
				});
				if (convertedUnit.error) return;
				return convertedUnit.value.toFixed(3);
			};
		},
		convertToPX() {
			return (input, defaultInputUnit = this.page.UOM) => {
				let convertedUnit = useChangeValueUnit({
					inputString: input,
					defaultInputUnit,
					convertionUnit: "px",
				});
				if (convertedUnit.error) return;
				return parseFloat(convertedUnit.value.toFixed(3));
			};
		},
		getPageStyle() {
			switch (this.mode) {
				case "editing":
					return this.getPageSettings;
				case "header":
					return this.getHeaderSettings;
				case "footer":
					return this.getFooterSettings;
			}
		},
		getPageSettings() {
			return {
				height:
					this.convertToPageUOM(
						this.page.height - (this.page.marginTop + this.page.marginBottom)
					) + this.page.UOM,
				width:
					this.convertToPageUOM(
						this.page.width - (this.page.marginLeft + this.page.marginRight)
					) + this.page.UOM,
			};
		},
		getHeaderSettings() {
			return {
				height: this.convertToPageUOM(this.page.headerHeight) + this.page.UOM,
				width:
					this.convertToPageUOM(
						this.page.width - this.page.marginLeft - this.page.marginRight
					) + this.page.UOM,
			};
		},
		getFooterSettings() {
			return {
				height: this.convertToPageUOM(this.page.footerHeight) + this.page.UOM,
				width:
					this.convertToPageUOM(
						this.page.width - this.page.marginLeft - this.page.marginRight
					) + this.page.UOM,
			};
		},
		getCurrentElementsValues() {
			return Object.values(this.currentElements);
		},
		getCurrentElementsId() {
			return Object.keys(this.currentElements);
		},
		getLinkMetaFields: (state) => {
			return (search_string = null, parentField) => {
				let metaFields = state.metaFields.filter((el) => {
					if (el.fieldtype != "Link") return false;
					if (typeof search_string != "string" || !search_string.length) return true;
					if (
						el["label"].toLowerCase().includes(search_string.toLowerCase()) ||
						el["fieldname"].toLowerCase().includes(search_string.toLowerCase()) ||
						el["fieldtype"].toLowerCase().includes(search_string.toLowerCase())
					) {
						return true;
					}
					return false;
				});
				metaFields.sort((a, b) => a.label.localeCompare(b.label));
				if (
					!parentField ||
					typeof search_string != "string" ||
					!search_string.length ||
					state.doctype.toLowerCase().includes(search_string.toLowerCase())
				) {
					// Main DocType is added manually as link :D
					metaFields.unshift({
						fieldname: "",
						label: state.doctype,
						fieldtype: "Link",
						options: state.doctype,
					});
				}
				if (parentField) {
					let currentField = state.metaFields.find(
						(field) => field.fieldname === parentField
					);
					if (metaFields.indexOf(currentField) == -1) {
						metaFields.unshift(currentField);
					}
				}
				return metaFields;
			};
		},
		getTableMetaFields: (state) => {
			return state.metaFields.filter((el) => el.fieldtype == "Table");
		},
		getTypeWiseMetaFields: (state) => {
			return ({
				selectedParentField = null,
				selectedTable = null,
				search_string = null,
				show_hidden_fields = false,
			}) => {
				let fields = {};
				let metaFields = state.metaFields;
				if (selectedParentField) {
					metaFields = metaFields.find(
						(e) => e.fieldname === selectedParentField
					).childfields;
				} else if (selectedTable) {
					metaFields = selectedTable.childfields;
				}
				if (!show_hidden_fields) {
					metaFields = metaFields.filter((field) => !field["print_hide"]);
				}
				if (typeof search_string == "string" && search_string.length) {
					metaFields = metaFields.filter(
						(o) =>
							o["label"]?.toLowerCase().includes(search_string.toLowerCase()) ||
							o["fieldname"]?.toLowerCase().includes(search_string.toLowerCase()) ||
							o["fieldtype"]?.toLowerCase().includes(search_string.toLowerCase())
					);
				}
				if (selectedTable) {
					if (
						typeof search_string != "string" ||
						!search_string.length ||
						"line number no idx".includes(search_string.toLowerCase())
					) {
						fields["Line Number"] = [
							{
								fieldname: "idx",
								fieldtype: "Int",
								label: "No",
								options: undefined,
								table: selectedTable,
							},
						];
					}
				} else if (
					typeof search_string != "string" ||
					!search_string.length ||
					"Name".toLowerCase().includes(search_string.toLowerCase())
				) {
					fields["Document"] = [
						{
							fieldname: "name",
							fieldtype: "Small Text",
							label: "Name",
							options: undefined,
						},
					];
					if (!selectedParentField) {
						fields["Document"].push(
							{
								fieldname: "page",
								fieldtype: "Small Text",
								label: "Current Page",
								options: undefined,
							},
							{
								fieldname: "topage",
								fieldtype: "Small Text",
								label: "Total Pages",
								options: undefined,
							},
							{
								fieldname: "time",
								fieldtype: "Small Text",
								label: "Print Time",
								options: undefined,
							},
							{
								fieldname: "date",
								fieldtype: "Small Text",
								label: "Print Date",
								options: undefined,
							}
						);
					}
				}
				metaFields.forEach((field) => {
					if (
						["Button", "Color", "Table", "Attach"].indexOf(field.fieldtype) == -1 &&
						(selectedTable ||
							["Link", "Image", "Attach", "Attach Image"].indexOf(field.fieldtype) ==
								-1)
					) {
						if (!state.openBarcodeModal && field.fieldtype == "Barcode") return;
						if (fields[field.fieldtype]) {
							fields[field.fieldtype].push(field);
						} else {
							fields[field.fieldtype] = [field];
						}
					}
				});
				return fields;
			};
		},
		getGoogleFonts: (state) => {
			return Object.keys(state.fonts);
		},
		getGoogleFontWeights: (state) => () => {
			let fontName = state.getCurrentStyle("fontFamily");
			if (!fontName) {
				return [
					{ label: "Thin", value: 100 },
					{ label: "Extra Light", value: 200 },
					{ label: "Light", value: 300 },
					{ label: "Regular", value: 400 },
					{ label: "Medium", value: 500 },
					{ label: "Semi Bold", value: 600 },
					{ label: "Bold", value: 700 },
					{ label: "Extra Bold", value: 800 },
					{ label: "Black", value: 900 },
				];
			}
			return [
				{ label: "Thin", value: 100 },
				{ label: "Extra Light", value: 200 },
				{ label: "Light", value: 300 },
				{ label: "Regular", value: 400 },
				{ label: "Medium", value: 500 },
				{ label: "Semi Bold", value: 600 },
				{ label: "Bold", value: 700 },
				{ label: "Extra Bold", value: 800 },
				{ label: "Black", value: 900 },
			].filter((weight) => state.fonts[fontName][0].indexOf(weight.value) != -1);
		},
		getGlobalStyleObject: (state) => {
			let globalStyleName;
			let object = state.getCurrentElementsValues[0];
			const mapper = Object.freeze({
				main: "style",
				label: "labelStyle",
				header: "headerStyle",
				alt: "altStyle",
			});
			let styleEditMode;
			if (object) {
				styleEditMode = mapper[object.styleEditMode];
				globalStyleName = object.type;
				if (globalStyleName == "text") {
					if (object.isDynamic) {
						globalStyleName = "dynamicText";
					} else {
						globalStyleName = "staticText";
					}
				}
			} else {
				if (state.activeControl == "mouse-pointer") return;
				globalStyleName = state.activeControl;
				if (globalStyleName == "text") {
					if (state.textControlType == "dynamic") {
						globalStyleName = "dynamicText";
					} else {
						globalStyleName = "staticText";
					}
				}
				styleEditMode = mapper[state.globalStyles[globalStyleName].styleEditMode];
			}
			return state.globalStyles[globalStyleName][styleEditMode];
		},
		getStyleObject: (state) => (isFontStyle) => {
			let object = state.getCurrentElementsValues[0];
			if (!object) return state.getGlobalStyleObject;
			const mapper = Object.freeze({
				main: "style",
				label: "labelStyle",
				header: "headerStyle",
				alt: "altStyle",
			});
			let styleEditMode = mapper[object.styleEditMode];
			return !isFontStyle
				? object.selectedColumn?.["style"] || object[styleEditMode]
				: object.selectedDynamicText?.[styleEditMode] ||
						object.selectedColumn?.["style"] ||
						object[styleEditMode];
		},
		isValidValue: (state) => (value) => {
			if (typeof value == "string") {
				return value.length != 0;
			} else if (typeof value == "number") {
				return true;
			}
			return false;
		},
		getCurrentStyle: (state) => (propertyName) => {
			let object = state.getCurrentElementsValues[0];
			if (!object) return state.getGlobalStyleObject?.[propertyName];
			const mapper = Object.freeze({
				main: "style",
				label: "labelStyle",
				header: "headerStyle",
				alt: "altStyle",
			});
			let styleEditMode = mapper[object.styleEditMode];
			if (propertyName != "backgroundColor") {
				if (
					state.isValidValue(object.selectedDynamicText?.[styleEditMode][propertyName])
				) {
					return object.selectedDynamicText?.[styleEditMode][propertyName];
				}
				if (state.isValidValue(object.selectedColumn?.["style"]?.[propertyName])) {
					return object.selectedColumn?.["style"][propertyName];
				}
				if (state.isValidValue(object[styleEditMode][propertyName])) {
					return object[styleEditMode][propertyName];
				}
				if (state.isValidValue(state.getGlobalStyleObject[propertyName])) {
					return state.getGlobalStyleObject[propertyName];
				}
			} else {
				// we need to check if empty string incase it is background color and set as transparent
				if (typeof object.selectedDynamicText?.[styleEditMode][propertyName] == "string") {
					return object.selectedDynamicText?.[styleEditMode][propertyName];
				}
				if (typeof object.selectedColumn?.["style"][propertyName] == "string") {
					return object.selectedColumn?.["style"][propertyName];
				}
				if (typeof object[styleEditMode][propertyName] == "string") {
					return object[styleEditMode][propertyName];
				}
				if (typeof state.getGlobalStyleObject[propertyName] == "string") {
					return state.getGlobalStyleObject[propertyName];
				}
			}
		},
		isOlderSchema: (state) => (currentVersion) => {
			if (!state.old_schema_version) return false;
			let formatVersion = state.old_schema_version.split(".");
			if (currentVersion == formatVersion) return false;
			currentVersion = currentVersion.split(".");
			if (parseInt(formatVersion[0]) < parseInt(currentVersion[0])) {
				return true;
			} else if (
				parseInt(formatVersion[0]) === parseInt(currentVersion[0]) &&
				parseInt(formatVersion[1]) < parseInt(currentVersion[1])
			) {
				return true;
			} else if (
				parseInt(formatVersion[0]) === parseInt(currentVersion[0]) &&
				parseInt(formatVersion[1]) === parseInt(currentVersion[1]) &&
				parseInt(formatVersion[2]) < parseInt(currentVersion[2])
			) {
				return true;
			} else {
				return false;
			}
		},
	},
	actions: {
		/**
		 * @param {'MousePointer'|'Text'|'Rectangle'|'Components'|'Image'|'Table'|'Barcode'}  id
		 */
		setActiveControl(id) {
			let control = this.controls[id];
			this.activeControl = control.id;
			this.cursor = control.cursor;
		},
		setPrintDesignName(name) {
			this.printDesignName = name;
		},
		/**
		 * @param {Array} rules Accepts an array of JSON-encoded declarations
		 * @return {String} Id of CssRule
		 * @example
		addStylesheetRules([
		['h2', // Also accepts a second argument as an array of arrays instead
			['color', 'red'],
			['background-color', 'green', true] // 'true' for !important rules
		],
		['.myClass',
			['background-color', 'yellow']
		]
		]);
		*/
		addStylesheetRules(rules, media = "screen") {
			for (let i = 0; i < rules.length; i++) {
				let j = 1,
					rule = rules[i],
					selector = rule[0],
					propStr = "";
				// If the second argument of a rule is an array of arrays, correct our variables.
				if (Array.isArray(rule[1][0])) {
					rule = rule[1];
					j = 0;
				}

				for (let pl = rule.length; j < pl; j++) {
					const prop = rule[j];
					prop[0] = prop[0]
						?.replace(/([a-z])([A-Z])/g, "$1-$2")
						.replace(/[\s_]+/g, "-")
						.toLowerCase();
					propStr += `${prop[0]}: ${prop[1]}${prop[2] ? " !important" : ""};\n`;
				}

				// Insert CSS Rule
				let styleSheet = this.printStyleSheet;
				if (media == "screen") {
					styleSheet = this.screenStyleSheet;
				}
				return styleSheet.insertRule(
					`${selector}{${propStr}}`,
					styleSheet.cssRules.length
				);
			}
		},
		addGlobalRules() {
			Object.entries(this.globalStyles).forEach((element) => {
				if (!element[1].mainCssRule) {
					let mainSelector = element[1].mainRuleSelector;
					const id = this.addStylesheetRules([
						[mainSelector, [...Object.entries(element[1].style)]],
					]);
					element[1].mainCssRule = markRaw(this.screenStyleSheet.cssRules[id]);
				}
				if (!element[1].labelCssRule) {
					let labelSelector = element[1].labelRuleSelector;
					if (labelSelector) {
						const id = this.addStylesheetRules([
							[labelSelector, [...Object.entries(element[1].labelStyle)]],
						]);
						element[1].labelCssRule = markRaw(this.screenStyleSheet.cssRules[id]);
					}
				}
				if (!element[1].headerCssRule) {
					let headerSelector = element[1].headerRuleSelector;
					if (headerSelector) {
						const id = this.addStylesheetRules([
							[headerSelector, [...Object.entries(element[1].headerStyle)]],
						]);
						element[1].headerCssRule = markRaw(this.screenStyleSheet.cssRules[id]);
					}
				}
				if (!element[1].altCssRule) {
					let altSelector = element[1].altRuleSelector;
					if (altSelector) {
						const id = this.addStylesheetRules([
							[altSelector, [...Object.entries(element[1].altStyle)]],
						]);
						element[1].altCssRule = markRaw(this.screenStyleSheet.cssRules[id]);
					}
				}
			});
		},
	},
});
