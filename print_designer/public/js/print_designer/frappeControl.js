import { watch, isRef, nextTick, shallowReactive } from "vue";
import { useMainStore } from "./store/MainStore";
import { onClickOutside } from "@vueuse/core";
import { getConditonalObject } from "./utils";
export const makeFeild = ({
	name,
	ref,
	fieldtype,
	requiredData,
	options,
	reactiveObject,
	propertyName,
	isStyle = false,
	isFontStyle = false,
	onChangeCallback = null,
	formatValue = (object, property, isStyle, toDB = false) => {
		if (isStyle) {
			const MainStore = useMainStore();
			return MainStore.getCurrentStyle(property);
		}
		return getConditonalObject({
			reactiveObject: object,
			isStyle,
			isFontStyle,
			property,
		});
	},
}) => {
	const MainStore = useMainStore();
	if (ref === null) MainStore.frappeControls[name]?.vueWatcher?.();
	if (!ref || MainStore.frappeControls[name]?.parent?.[0] === ref) return;
	if (MainStore.frappeControls[name]?.awesomplete) {
		MainStore.frappeControls[name].awesomplete.destroy();
		Awesomplete.all.splice([MainStore.frappeControls[name].awesomplete.count - 1], 1);
	}
	const createField = () => {
		obj_value = null;
		last_value = null;
		MainStore.frappeControls[name] = shallowReactive(
			frappe.ui.form.make_control({
				parent: $(ref),
				df: {
					fieldtype: fieldtype,
					options: typeof options == "function" ? options() : options || "",
					change: () => {
						let object;
						if (isStyle) {
							object = MainStore.getStyleObject(isFontStyle);
						} else {
							object = reactiveObject;
							isRef(reactiveObject) && (object = object.value);
							typeof reactiveObject == "function" && (object = object());
						}
						if (!object) return;
						let value = MainStore.frappeControls[name].get_value();
						last_value = value;
						obj_value = formatValue(object, propertyName, isStyle);

						if (
							(!(typeof value == "undefined" || value === null) ||
								fieldtype == "Color") &&
							obj_value != value
						) {
							object[propertyName] = value;
							onChangeCallback && onChangeCallback(value);
						} else if (!value && formatValue(object, propertyName, isStyle)) {
							if (
								fieldtype == "Color" &&
								propertyName == "backgroundColor" &&
								!value
							)
								return;
							MainStore.frappeControls[name].set_value(
								formatValue(object, propertyName, isStyle)
							);
							onChangeCallback && onChangeCallback();
						}
					},
				},
				only_input: true,
				render_input: true,
			})
		);
		let object;
		if (isStyle) {
			object = MainStore.getStyleObject(isFontStyle);
		} else {
			object = reactiveObject;
			isRef(reactiveObject) && (object = object.value);
			typeof reactiveObject == "function" && (object = object());
		}
		MainStore.frappeControls[name].set_value(formatValue(object, propertyName, isStyle));
		if (["Link", "Autocomplete"].indexOf(fieldtype) != -1) {
			MainStore.frappeControls[name].$input[0].onfocus = () => {
				MainStore.frappeControls[name].$input.select();
				MainStore.frappeControls[name].$input.one("blur", () => {
					let value = MainStore.frappeControls[name].value;
					if (
						typeof value == "undefined" ||
						value === null ||
						(fieldtype == "Int" && !Number.isInteger(value))
					) {
						value = MainStore.frappeControls[name].last_value;
					}
					MainStore.frappeControls[name].$input.val(value);
				});
			};
		} else if (fieldtype === "Select") {
			MainStore.frappeControls[name].$input.change((event) => {
				event.target.blur();
			});
		} else if (fieldtype === "Color") {
			if (MainStore.frappeControls[name]) {
				let hidePicker;
				MainStore.frappeControls[name].$wrapper.on("show.bs.popover", () => {
					if (!MainStore.frappeControls[name]) return;
					MainStore.frappeControls[name].$input[0].classList.add("input-active");
					hidePicker = onClickOutside(
						MainStore.frappeControls[name].picker.parent,
						() => {
							MainStore.frappeControls[name] &&
								MainStore.frappeControls[name].$wrapper.popover("hide");
						}
					);
				});
				MainStore.frappeControls[name].$wrapper.on("hidden.bs.popover", () => {
					if (!MainStore.frappeControls[name]) return;
					MainStore.frappeControls[name].$input[0].classList.remove("input-active");
					hidePicker && hidePicker();
				});
			}
		}
		if (isStyle && !MainStore.frappeControls[name].vueWatcher) {
			MainStore.frappeControls[name].vueWatcher = watch(
				() => MainStore.getCurrentStyle(propertyName),
				() => {
					if (MainStore.getCurrentElementsValues.length < 2) {
						MainStore.frappeControls[name]?.refresh();
						nextTick(() => {
							MainStore.frappeControls[name]?.set_value(
								MainStore.getCurrentStyle(propertyName)
							);
							onChangeCallback &&
								onChangeCallback(MainStore.getCurrentStyle(propertyName));
						});
					}
				}
			);
		}
		if (object === MainStore && !MainStore.frappeControls[name].vueWatcher) {
			MainStore.frappeControls[name].vueWatcher = watch(
				() => object[propertyName],
				(newValue) => {
					MainStore.frappeControls[name]?.refresh();
					nextTick(() => {
						MainStore.frappeControls[name]?.set_value(
							formatValue(object, propertyName, isStyle)
						);
						onChangeCallback &&
							onChangeCallback(formatValue(object, propertyName, isStyle));
					});
				},
				{ immediate: true }
			);
		} else if (
			!isStyle &&
			["styleEditMode"].indexOf(propertyName) != -1 &&
			!MainStore.frappeControls[name].vueWatcher
		) {
			MainStore.frappeControls[name].vueWatcher = watch(
				() => [
					MainStore.getGlobalStyleObject,
					MainStore.getCurrentElementsValues[0]?.styleEditMode,
				],
				() => {
					let styleClass = "table";
					if (MainStore.activeControl == "text") {
						if (MainStore.textControlType == "dynamic") {
							styleClass = "dynamicText";
						} else {
							styleClass = "staticText";
						}
					}
					nextTick(() => {
						if (!MainStore.frappeControls[name]) return;
						if (
							("text" == MainStore.getCurrentElementsValues[0]?.type &&
								MainStore.getCurrentElementsValues[0]?.isDynamic) ||
							("text" == MainStore.activeControl &&
								MainStore.textControlType == "dynamic")
						) {
							MainStore.frappeControls[name].df.options = [
								{ label: "Label Element", value: "label" },
								{ label: "Main Element", value: "main" },
							];
						} else if (
							"text" == MainStore.getCurrentElementsValues[0]?.type ||
							"text" == MainStore.activeControl
						) {
							MainStore.frappeControls[name].df.options = [
								{ label: "Main Element", value: "main" },
							];
						} else {
							MainStore.frappeControls[name].df.options = [
								{ label: "Table Header", value: "header" },
								{ label: "All Rows", value: "main" },
								{ label: "Alternate Rows", value: "alt" },
								{ label: "Field Labels", value: "label" },
							];
						}
						MainStore.frappeControls[name].refresh();
						MainStore.frappeControls[name]?.set_value(
							MainStore.getCurrentElementsValues[0]?.styleEditMode ||
								MainStore.globalStyles[styleClass].styleEditMode
						);
						onChangeCallback &&
							onChangeCallback(formatValue(object, propertyName, isStyle));
					});
				},
				{ immediate: true }
			);
		}
	};
	if (
		Array.isArray(requiredData)
			? requiredData.every((condition) =>
					isRef(condition) ? !!condition.value : !!condition
			  )
			: requiredData
	) {
		createField();
	} else {
		let removeWatcher = watch(
			() => requiredData,
			() => {
				if (!ref || MainStore.frappeControls[name]?.parent?.[0] === ref) return;
				if (
					Array.isArray(requiredData)
						? requiredData.every((condition) =>
								isRef(condition) ? !!condition.value : !!condition
						  )
						: requiredData
				)
					return;
				createField();
				removeWatcher();
			}
		);
	}
};
