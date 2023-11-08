import { useMainStore } from "./store/MainStore";
import { makeFeild } from "./frappeControl";
import { storeToRefs } from "pinia";
import {
	parseFloatAndUnit,
	handleAlignIconClick,
	handleBorderIconClick,
	getConditonalObject,
} from "./utils";
export const createPropertiesPanel = () => {
	const MainStore = useMainStore();
	const iconControl = ({
		name,
		size,
		padding,
		margin,
		onClick,
		isActive,
		onlyIcon = false,
		parentBorderTop = false,
		parentBorderBottom = false,
		condtional = null,
		...args
	}) => {
		const result = {
			icon: { onlyIcon, name, size, padding, margin, onClick, isActive },
		};
		if (onlyIcon) {
			result["name"] = name;
			result["condtional"] = condtional;
			result["parentBorderTop"] = parentBorderTop;
			result["parentBorderBottom"] = parentBorderBottom;
			if (Object.keys(args).length !== 0 && args.constructor === Object) {
				Object.entries({ ...args })?.forEach((arg) => {
					result[arg[0]] = arg[1];
				});
			}
		}
		return result;
	};
	const AlignIcons = (name) => {
		return iconControl({
			name,
			size: 20,
			padding: 3,
			margin: 4,
			onClick: () => handleAlignIconClick(name),
			onlyIcon: true,
		});
	};
	const textAlignIcons = (name) => {
		const mapper = {
			textAlignLeft: "left",
			textAlignRight: "right",
			textAlignCenter: "center",
			textAlignJustify: "justify",
		};
		return iconControl({
			name,
			size: 20,
			padding: 3,
			margin: 5,
			onClick: () =>
				(getConditonalObject({
					reactiveObject: () => MainStore.getCurrentElementsValues[0],
					isStyle: true,
				})["textAlign"] = mapper[name]),
			isActive: () =>
				getConditonalObject({
					reactiveObject: () => MainStore.getCurrentElementsValues[0],
					isStyle: true,
					property: "textAlign",
				}) == mapper[name],
			onlyIcon: true,
			parentBorderTop: true,
			parentBorderBottom: true,
		});
	};
	const borderWidthIcons = (name, { ...args }) => {
		return iconControl({
			name,
			color: "var(--gray-500)",
			size: 18,
			padding: 2,
			margin: 8,
			condtional: () => {
				return parseFloatAndUnit(
					getConditonalObject({
						reactiveObject: () => MainStore.getCurrentElementsValues[0],
						isStyle: true,
						property: "borderWidth",
					})
				).value;
			},
			onClick: () =>
				handleBorderIconClick(
					getConditonalObject({
						reactiveObject: () => MainStore.getCurrentElementsValues[0],
						isStyle: true,
					}),
					name
				),
			isActive: () => {
				if (name === "borderAll") {
					return [
						"borderTopStyle",
						"borderBottomStyle",
						"borderLeftStyle",
						"borderRightStyle",
					].every(
						(side) =>
							getConditonalObject({
								reactiveObject: () => MainStore.getCurrentElementsValues[0],
								isStyle: true,
								property: side,
							}) != "hidden"
					);
				} else {
					return (
						getConditonalObject({
							reactiveObject: () => MainStore.getCurrentElementsValues[0],
							isStyle: true,
							property: name,
						}) != "hidden"
					);
				}
			},
			onlyIcon: true,
			parentBorderTop: true,
			parentBorderBottom: true,
			...args,
		});
	};
	const inputControl = ({
		label,
		name,
		propertyName,
		inputUnit,
		labelDirection,
		reactiveObject,
		condtional = null,
		...args
	}) => {
		const result = {
			label,
			name,
			propertyName,
			condtional,
			labelDirection,
			isLabelled: true,
			inputUnit,
			reactiveObject,
			saveWithUom: false,
		};
		if (Object.keys(args).length !== 0 && args.constructor === Object) {
			Object.entries({ ...args })?.forEach((arg) => {
				result[arg[0]] = arg[1];
			});
		}
		return result;
	};
	const pageInput = (label, name, propertyName, { ...args }) => {
		return inputControl({
			label,
			name,
			propertyName,
			inputUnit: () => MainStore.page.UOM,
			labelDirection: "column",
			reactiveObject: () => MainStore.page,
			...args,
		});
	};
	const paddingInput = (label, name, propertyName) => {
		return inputControl({
			label,
			name,
			propertyName,
			inputUnit: "px",
			labelDirection: "column",
			reactiveObject: () => MainStore.getCurrentElementsValues[0],
			isStyle: true,
			isFontStyle: true,
			saveWithUom: true,
		});
	};
	const transformInput = (label, name, propertyName) => {
		return inputControl({
			label,
			name,
			propertyName,
			inputUnit: () => MainStore.page.UOM,
			labelDirection: "row",
			reactiveObject: () => MainStore.getCurrentElementsValues[0],
		});
	};
	const inputWithIcon = ({
		label,
		name,
		size,
		padding,
		margin,
		inputUnit,
		reactiveObject,
		propertyName,
		labelDirection = "row",
		condtional = null,
		isStyle = false,
		saveWithUom = false,
		...args
	}) => {
		const result = inputControl({
			label,
			name,
			propertyName,
			inputUnit,
			isLabelled: false,
			condtional,
			reactiveObject,
			labelDirection,
			saveWithUom,
			isStyle,
			...args,
		});
		result["icon"] = iconControl({
			name,
			size,
			padding,
			margin,
		}).icon;
		return result;
	};
	const styleInputwithIcon = (
		name,
		size,
		{ padding = 0, margin = 0, saveWithUom = false, isRaw = false, condtional = null, ...args }
	) =>
		inputWithIcon({
			name,
			propertyName: name,
			size,
			padding,
			margin,
			inputUnit: "px",
			reactiveObject: () => MainStore.getCurrentElementsValues[0],
			isStyle: true,
			isRaw,
			saveWithUom,
			condtional,
			...args,
		});
	const colorStyleFrappeControl = (label, name, propertyName, isFontStyle = false, isStyle=true) => {
		return {
			label,
			name,
			labelDirection: "column",
			isLabelled: true,
			frappeControl: (ref, name) => {
				let styleClass = "table";
				if (MainStore.activeControl == "text") {
					if (MainStore.textControlType == "dynamic") {
						styleClass = "dynamicText";
					} else {
						styleClass = "staticText";
					}
				}
				makeFeild({
					name,
					ref,
					fieldtype: "Color",
					requiredData: [
						MainStore.getCurrentElementsValues[0] ||
							MainStore.globalStyles[styleClass],
					],
					reactiveObject: () => {
						return (
							MainStore.getCurrentElementsValues[0] ||
							MainStore.globalStyles[styleClass]
						);
					},
					propertyName,
					isStyle,
					isFontStyle,
				});
			},
		};
	};
	MainStore.propertiesPanel.push({
		sectionCondtional: () => !!MainStore.getCurrentElementsId.length,
		fields: [
			[
				AlignIcons("alignLeft"),
				AlignIcons("alignHorizontalCenter"),
				AlignIcons("alignRight"),
				AlignIcons("alignTop"),
				AlignIcons("alignVerticalCenter"),
				AlignIcons("alignBottom"),
			],
		],
	});
	MainStore.propertiesPanel.push({
		title: "Page Settings",
		sectionCondtional: () =>
			!MainStore.getCurrentElementsId.length && MainStore.activeControl === "mouse-pointer",
		fields: [
			{
				label: () => `Select ${MainStore.rawMeta?.name || "Document"}`,
				isLabelled: true,
				name: "documentName",
				condtional: () => !!MainStore.currentDoc,
				frappeControl: (ref, name) => {
					const { doctype, currentDoc } = storeToRefs(MainStore);
					makeFeild({
						name: name,
						ref: ref,
						fieldtype: "Link",
						requiredData: [doctype, currentDoc],
						options: MainStore.doctype,
						reactiveObject: MainStore,
						propertyName: "currentDoc",
					});
				},
			},
			{
				label: "Page Size",
				name: "pageSize",
				isLabelled: true,
				condtional: null,
				frappeControl: (ref, name) => {
					const MainStore = useMainStore();
					const { pageSizes } = storeToRefs(MainStore);
					makeFeild({
						name: name,
						ref: ref,
						fieldtype: "Autocomplete",
						requiredData: pageSizes,
						options: Object.keys(pageSizes.value),
						reactiveObject: MainStore,
						propertyName: "currentPageSize",
						onChangeCallback: (value = null) => {
							if (value && value != "CUSTOM") {
								MainStore.currentPageSize = value;
								MainStore.page.width = MainStore.convertToPX(
									MainStore.pageSizes[value][0],
									"mm"
								);
								MainStore.page.height = MainStore.convertToPX(
									MainStore.pageSizes[value][1],
									"mm"
								);
							} else {
								MainStore.frappeControls[name].set_value(
									MainStore.currentPageSize
								);
							}
						},
					});
				},
			},
			{
				label: "Page UOM",
				name: "pageUom",
				isLabelled: true,
				condtional: null,
				frappeControl: (ref, name) => {
					const MainStore = useMainStore();
					const { page } = storeToRefs(MainStore);
					makeFeild({
						name,
						ref,
						fieldtype: "Autocomplete",
						requiredData: () => page.value.UOM,
						options: () => [
							{ label: "Pixels (px)", value: "px" },
							{ label: "Milimeter (mm)", value: "mm" },
							{ label: "Centimeter (cm)", value: "cm" },
							{ label: "Inch (in)", value: "in" },
						],
						reactiveObject: page,
						propertyName: "UOM",
					});
				},
			},
			[
				pageInput("Height", "page_height", "height", { parentBorderTop: true }),
				pageInput("Width", "page_width", "width"),
			],
		],
	});
	MainStore.propertiesPanel.push({
		title: "Page Margins",
		sectionCondtional: () =>
			!MainStore.getCurrentElementsId.length && MainStore.activeControl === "mouse-pointer",
		fields: [
			[
				pageInput("Top", "page_top", "marginTop"),
				pageInput("Bottom", "page_bottom", "marginBottom"),
			],
			[
				pageInput("Left", "page_left", "marginLeft"),
				pageInput("Right", "page_right", "marginRight"),
			],
		],
	});
	MainStore.propertiesPanel.push({
		title: "PDF Settings",
		sectionCondtional: () =>
			MainStore.mode == "pdfSetup" &&
			!MainStore.getCurrentElementsId.length &&
			MainStore.activeControl === "mouse-pointer",
		fields: [
			[
				pageInput("Header", "page_header", "headerHeight"),
				pageInput("Footer", "page_footer", "footerHeight"),
			],
		],
	});
	MainStore.propertiesPanel.push({
		title: "Transform",
		sectionCondtional: () => MainStore.getCurrentElementsId.length === 1,
		fields: [
			[
				transformInput("X", "transformStartX", "startX"),
				transformInput("Y", "transformStartY", "startY"),
			],
			[
				transformInput("H", "transformHeight", "height"),
				transformInput("W", "transformWidth", "width"),
			],
		],
	});
	MainStore.propertiesPanel.push({
		title: "Table Settings",
		sectionCondtional: () =>
			MainStore.getCurrentElementsId.length === 1 &&
			MainStore.getCurrentElementsValues[0]?.type == "table",
		fields: [
			[
				{
					label: "Current Table",
					name: "table",
					isLabelled: true,
					labelDirection: "column",
					flex: 3,
					frappeControl: (ref, name) => {
						const MainStore = useMainStore();
						makeFeild({
							name,
							ref,
							fieldtype: "Autocomplete",
							requiredData: [MainStore.getTableMetaFields.length],
							options: () => {
								let tablefields = [];
								MainStore.getTableMetaFields.map((field) =>
									tablefields.push({
										label: field.label || field.fieldname,
										value: field.fieldname,
									})
								);
								return tablefields;
							},
							reactiveObject: () => MainStore.getCurrentElementsValues[0],
							propertyName: "table",
							isStyle: false,
							onChangeCallback: (value = null) => {
								if (value && MainStore.getCurrentElementsValues[0]) {
									MainStore.getCurrentElementsValues[0]["table"] =
										MainStore.metaFields.find(
											(field) => field.fieldname == value
										);
									MainStore.frappeControls[name].$input.blur();
								}
							},
							formatValue: (object, property, isStyle) => {
								if (!object) return;
								return object[property]?.fieldname || "";
							},
						});
					},
				},
				{
					label: "Rows",
					name: "no_of_rows",
					isLabelled: true,
					labelDirection: "column",
					condtional: () => MainStore.getCurrentElementsValues[0]?.table,
					frappeControl: (ref, name) => {
						const MainStore = useMainStore();
						makeFeild({
							name,
							ref,
							fieldtype: "Int",
							requiredData: [MainStore.getCurrentElementsValues[0]],
							reactiveObject: () => MainStore.getCurrentElementsValues[0],
							propertyName: "PreviewRowNo",
							isStyle: false,
							onChangeCallback: (value = null) => {
								if (
									value &&
									!Number.isInteger(MainStore.frappeControls["no_of_rows"].value)
								) {
									MainStore.frappeControls["no_of_rows"].set_value(
										MainStore.frappeControls["no_of_rows"].last_value
									);
								}
							},
						});
					},
					flex: 1,
				},
			],
		],
	});
	MainStore.propertiesPanel.push({
		title: "Rectangle Settings",
		sectionCondtional: () =>
			MainStore.getCurrentElementsId.length === 1 &&
			MainStore.getCurrentElementsValues[0]?.type == "rectangle",
		fields: [
			[colorStyleFrappeControl("Background", "rectangleBackgroundColor", "backgroundColor")],
		],
	});
	MainStore.propertiesPanel.push({
		title: "Text Tool",
		sectionCondtional: () => MainStore.activeControl === "text",
		fields: [
			[
				{
					label: "Text Control :",
					name: "textControlType",
					labelDirection: "column",
					condtional: () =>
						MainStore.activeControl === "text",
					frappeControl: (ref, name) => {
						const MainStore = useMainStore();
						makeFeild({
							name: name,
							ref: ref,
							fieldtype: "Select",
							requiredData: [MainStore],
							options: () => [
								{ label: "Dynamic Text", value: "dynamic" },
								{ label: "Static Text", value: "static" },
							],
							reactiveObject: MainStore,
							propertyName: "textControlType",
						});
					},
				},
			],
		],
	});
	MainStore.propertiesPanel.push({
		title: "Font Settings",
		sectionCondtional: () =>
			(MainStore.getCurrentElementsId.length === 1 &&
				["text", "table"].indexOf(MainStore.getCurrentElementsValues[0]?.type) != -1) ||
			(["table", "text"].indexOf(MainStore.activeControl) != -1 &&
				MainStore.getCurrentElementsId.length === 0),
		fields: [
			[
				{
					label: "Choose Element :",
					name: "styleEditMode",
					labelDirection: "column",
					condtional: null,
					frappeControl: (ref, name) => {
						const MainStore = useMainStore();
						makeFeild({
							name: name,
							ref: ref,
							fieldtype: "Select",
							requiredData: [MainStore],
							options: () => {
								if (
									"table" == MainStore.getCurrentElementsValues[0]?.type ||
									"table" == MainStore.activeControl
								)
									return [
										{ label: "Label Element", value: "label" },
										{ label: "Main Element", value: "main" },
										{ label: "Header Element", value: "header" },
									];
								if (
									("text" == MainStore.getCurrentElementsValues[0]?.type &&
										MainStore.getCurrentElementsValues[0]?.isDynamic) ||
									("text" == MainStore.activeControl &&
										MainStore.textControlType == "static")
								)
									return [
										{ label: "Label Element", value: "label" },
										{ label: "Main Element", value: "main" },
									];
								return [{ label: "Main Element", value: "main" }];
							},
							reactiveObject: () => {
								let styleClass = "table";
								if (MainStore.activeControl == "text") {
									if (MainStore.textControlType == "dynamic") {
										styleClass = "dynamicText";
									} else {
										styleClass = "staticText";
									}
								}
								return (
									MainStore.getCurrentElementsValues[0] ||
									MainStore.globalStyles[styleClass]
								);
							},
							onChangeCallback: (value) => {
								if (MainStore.getCurrentElementsValues[0]?.selectedDynamicText) {
									if (
										MainStore.getCurrentElementsValues[0].styleEditMode ==
										"label"
									) {
										MainStore.getCurrentElementsValues[0].selectedDynamicText.labelStyleEditing = true;
									} else {
										MainStore.getCurrentElementsValues[0].selectedDynamicText.labelStyleEditing = false;
										if (
											MainStore.getCurrentElementsValues[0].styleEditMode ==
											"header"
										) {
											MainStore.getCurrentElementsValues[0].selectedDynamicText =
												null;
										}
									}
								}
							},
							propertyName: "styleEditMode",
						});
					},
				},
			],
			[
				{
					label: "Label Style :",
					name: "labelDisplayOptions",
					labelDirection: "column",
					condtional: ()=> {
						let styleClass = "table";
								if (MainStore.activeControl == "text") {
									if (MainStore.textControlType == "dynamic") {
										styleClass = "dynamicText";
									} else {
										styleClass = "staticText";
									}
								}
						let curObj = MainStore.getCurrentElementsValues[0] || MainStore.globalStyles[styleClass]
						if (curObj.type == "table" || curObj.type == "text" && curObj.isDynamic) {
							return true
						}
						return false
					},
					frappeControl: (ref, name) => {
						const MainStore = useMainStore();
						makeFeild({
							name: name,
							ref: ref,
							fieldtype: "Select",
							requiredData: [MainStore],
							options: () => {
								return [
									{ label: "Inline", value: "standard" },
									{ label: "Row", value: "flexDynamicText" },
									{ label: "Column", value: "flexDirectionColumn" },
								];
							},
							reactiveObject: () => {
								let styleClass = "table";
								if (MainStore.activeControl == "text") {
									if (MainStore.textControlType == "dynamic") {
										styleClass = "dynamicText";
									} else {
										styleClass = "staticText";
									}
								}
								return (
									MainStore.getCurrentElementsValues[0] ||
									MainStore.globalStyles[styleClass]
								);
							},
							onChangeCallback: (value) => {
								let object = MainStore.getCurrentElementsValues[0];
								if (!object) return;
								if (object.labelDisplayStyle == "standard") {
									object.classes = object.classes.filter(
										(cls) =>
											["flexDynamicText", "flexDirectionColumn"].indexOf(
												cls
											) == -1
									);
								} else if (object.labelDisplayStyle == "flexDynamicText") {
									if (object.classes.indexOf("flexDynamicText") == -1) {
										object.classes.push("flexDynamicText");
									}
									object.classes = object.classes.filter(
										(cls) => cls != "flexDirectionColumn"
									);
								} else if (object.labelDisplayStyle == "flexDirectionColumn") {
									if (object.classes.indexOf("flexDynamicText") == -1) {
										object.classes.push("flexDynamicText");
									}
									if (object.classes.indexOf("flexDirectionColumn") == -1) {
										object.classes.push("flexDirectionColumn");
									}
								}
							},
							propertyName: "labelDisplayStyle",
						});
					},
				},
			],
			[
				{
					label: "Font",
					name: "googleFonts",
					isLabelled: true,
					labelDirection: "column",
					condtional: null,
					parentBorderBottom: true,
					parentBorderTop: true,
					frappeControl: (ref, name) => {
						const MainStore = useMainStore();
						makeFeild({
							name: name,
							ref: ref,
							fieldtype: "Autocomplete",
							requiredData: [MainStore.getGoogleFonts],
							options: () => MainStore.getGoogleFonts,
							reactiveObject: () => MainStore.getCurrentElementsValues[0],
							propertyName: "fontFamily",
							isStyle: true,
							isFontStyle: true,
							onChangeCallback: (value = null) => {
								MainStore.currentFonts.indexOf(value) == -1 &&
									MainStore.currentFonts.push(value);
								if (!MainStore.frappeControls["fontWeight"]) return;
								MainStore.frappeControls["fontWeight"].df.options =
									MainStore.getGoogleFontWeights(MainStore.getStyleObject(true));
								MainStore.frappeControls["fontWeight"].refresh();
								if (
									MainStore.frappeControls["fontWeight"].df.options.indexOf(
										MainStore.frappeControls["fontWeight"].value
									) == -1
								) {
									MainStore.frappeControls["fontWeight"].set_value(400);
									MainStore.frappeControls["fontWeight"].refresh();
								}
							},
						});
					},
				},
				{
					label: "Weight",
					name: "fontWeight",
					isLabelled: true,
					labelDirection: "column",
					condtional: null,
					frappeControl: (ref, name) => {
						const MainStore = useMainStore();
						let styleClass = "table";
						if (MainStore.activeControl == "text") {
							if (MainStore.textControlType == "dynamic") {
								styleClass = "dynamicText";
							} else {
								styleClass = "staticText";
							}
						}
						makeFeild({
							name: name,
							ref: ref,
							fieldtype: "Select",
							requiredData: [
								MainStore.getCurrentElementsValues[0] ||
									MainStore.globalStyles[styleClass],
							],
							options: () => {
								return MainStore.getGoogleFontWeights(
									MainStore.getStyleObject(true)
								);
							},
							reactiveObject: () => MainStore.getCurrentElementsValues[0],
							propertyName: "fontWeight",
							isStyle: true,
							isFontStyle: true,
						});
					},
				},
			],
			[
				styleInputwithIcon("fontSize", 23, {
					padding: 5,
					saveWithUom: true,
					isFontStyle: true,
				}),
				styleInputwithIcon("lineHeight", 23, {
					padding: 5,
					isRaw: true,
					isFontStyle: true,
				}),
			],
			[
				iconControl({
					name: "fontItalic",
					size: 28,
					padding: 8,
					margin: 0,
					parentBorderTop: true,
					parentBorderBottom: true,
					condtional: () => {
						if (
							!MainStore.frappeControls["googleFonts"] ||
							!MainStore.frappeControls["fontWeight"]
						)
							return false;
						let isItalicAvaiable =
							MainStore.fonts[MainStore.getCurrentStyle("fontFamily")]?.[1].indexOf(
								parseInt(MainStore.getCurrentStyle("fontWeight"))
							) != -1;
						if (
							!isItalicAvaiable &&
							MainStore.getCurrentStyle("fontStyle") == "italic"
						) {
							MainStore.getStyleObject(true)["fontStyle"] = "normal";
						}
						return isItalicAvaiable;
					},
					onClick: () => {
						MainStore.getStyleObject(true)["fontStyle"] =
							MainStore.getCurrentStyle("fontStyle") == "italic"
								? "normal"
								: "italic";
					},
					isActive: () => MainStore.getCurrentStyle("fontStyle") == "italic",
					onlyIcon: true,
					flex: "auto",
				}),
				iconControl({
					name: "fontUnderLine",
					size: 21,
					padding: 4,
					margin: 3.5,
					parentBorderTop: true,
					parentBorderBottom: true,
					isActive: () => {
						let field = {
							reactiveObject: () => MainStore.getCurrentElementsValues[0],
							isStyle: true,
							isFontStyle: true,
						};
						return getConditonalObject(field)?.["textDecoration"] == "underline";
					},
					onClick: () => {
						let field = {
							reactiveObject: () => MainStore.getCurrentElementsValues[0],
							isStyle: true,
							isFontStyle: true,
						};
						getConditonalObject(field)["textDecoration"] =
							getConditonalObject(field)?.["textDecoration"] == "underline"
								? "none"
								: "underline";
					},
					onlyIcon: true,
					flex: "auto",
				}),
				styleInputwithIcon("letterSpacing", 31, {
					padding: 7,
					saveWithUom: true,
					isFontStyle: true,
					flex: 10,
				}),
			],
			[
				textAlignIcons("textAlignLeft"),
				textAlignIcons("textAlignCenter"),
				textAlignIcons("textAlignRight"),
				textAlignIcons("textAlignJustify"),
			],
			[
				colorStyleFrappeControl("Text", "textColor", "color", true),
				colorStyleFrappeControl(
					"Background",
					"textBackgroundColor",
					"backgroundColor",
					true
				),
			],
		],
	});
	MainStore.propertiesPanel.push({
		title: "Border",
		sectionCondtional: () => MainStore.getCurrentElementsId.length === 1,
		fields: [
			[
				styleInputwithIcon("borderWidth", 24, {
					padding: 6,
					margin: 4,
					saveWithUom: true,
				}),
				styleInputwithIcon("borderRadius", 24, {
					padding: 7,
					margin: 4,
					saveWithUom: true,
				}),
			],
			[
				borderWidthIcons("borderAll"),
				borderWidthIcons("borderLeftStyle"),
				borderWidthIcons("borderRightStyle"),
				borderWidthIcons("borderTopStyle"),
				borderWidthIcons("borderBottomStyle"),
			],
			{
				label: "Border Color",
				name: "borderColor",
				labelDirection: "column",
				isLabelled: true,
				condtional: () => {
					return parseFloatAndUnit(
						getConditonalObject({
							reactiveObject: () => MainStore.getCurrentElementsValues[0],
							isStyle: true,
							property: "borderWidth",
						})
					).value;
				},
				frappeControl: (ref, name) => {
					makeFeild({
						name: name,
						ref: ref,
						fieldtype: "Color",
						requiredData: [MainStore.getCurrentElementsValues[0]],
						reactiveObject: () => MainStore.getCurrentElementsValues[0],
						propertyName: "borderColor",
						isStyle: true,
					});
				},
			},
		],
	});
	MainStore.propertiesPanel.push({
		title: "Padding",
		sectionCondtional: () =>
			MainStore.getCurrentElementsId.length === 1 &&
			["text", "image", "table"].indexOf(MainStore.getCurrentElementsValues[0].type) !== -1,
		fields: [
			[
				paddingInput("Top", "paddingTop", "paddingTop"),
				paddingInput("Bottom", "paddingBottom", "paddingBottom"),
			],
			[
				paddingInput("Left", "paddingLeft", "paddingLeft"),
				paddingInput("Right", "paddingRight", "paddingRight"),
			],
		],
	});
	MainStore.propertiesPanel.push({
		title: "Barcode Settings",
		sectionCondtional: () =>
			(!MainStore.getCurrentElementsId.length && MainStore.activeControl === "barcode") || 
			(MainStore.getCurrentElementsId.length === 1 && MainStore.getCurrentElementsValues[0].type === "barcode"),
		fields: [
			{
				label: "Barcode Format",
				name: "barcodeFormat",
				isLabelled: true,
				condtional: null,
				frappeControl: (ref, name) => {
					const MainStore = useMainStore();
					const { barcodeFormats } = storeToRefs(MainStore);
					makeFeild({
						name: name,
						ref: ref,
						fieldtype: "Autocomplete",
						requiredData: [
							barcodeFormats,
							MainStore.getCurrentElementsValues[0] ||
								MainStore.globalStyles["barcode"],
						],
						options: () => barcodeFormats.value,
						reactiveObject: () => {
							return (
								MainStore.getCurrentElementsValues[0] ||
								MainStore.globalStyles["barcode"]
							);
						},
						propertyName: "barcodeFormat",
					});
				},
			},
			[colorStyleFrappeControl("Color", "barcodeColor", "barcodeColor", false, false), colorStyleFrappeControl("Background", "barcodeBackgroundColor", "barcodeBackgroundColor", false, false)],
		],
	});
};
