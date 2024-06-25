<template>
	<div :class="section.title && 'settings-section'" v-if="section.sectionCondtional()">
		<p v-if="section.title" class="section-title">{{ section.title }}</p>
		<div class="fields-container">
			<template v-for="field in section.fields" :key="field.name">
				<div
					:class="[
						'panel-container',
						{
							'panel-border-top':
								field.findIndex(
									(fd) =>
										(typeof fd.condtional != 'function' || fd.condtional()) &&
										fd.parentBorderTop
								) != -1,
							'panel-border-bottom':
								field.findIndex(
									(fd) =>
										(typeof fd.condtional != 'function' || fd.condtional()) &&
										fd.parentBorderBottom
								) != -1,
						},
					]"
					v-if="Array.isArray(field)"
				>
					<template v-for="fd in field" :key="fd.name">
						<div
							:class="[
								'flex-container',
								{
									'flex-column': fd.labelDirection == 'column',
									'flex-row': fd.labelDirection == 'row',
									'has-frappe-control': !!fd.frappeControl,
								},
							]"
							:style="[fd.flex && { flex: fd.flex }]"
							v-if="typeof fd.condtional != 'function' || fd.condtional()"
							@loadstart="borderCheckOnLoad(fd)"
						>
							<IconsUse
								v-if="fd.icon"
								:name="fd.icon.name"
								:key="fd.icon.name"
								:size="fd.icon.size || 20"
								:padding="fd.icon.padding || 0"
								:margin="fd.icon.margin || 0"
								:color="
									(
										typeof fd.icon.isActive != 'function'
											? fd.icon.isActive
											: fd.icon.isActive()
									)
										? 'var(--primary-color)'
										: fd.icon.color || 'var(--gray-600)'
								"
								@click="
									typeof fd.icon.onClick != 'function' || fd.icon.onClick($event)
								"
							/>
							<button
								v-if="fd.button"
								:class="[
									`btn btn-${fd.button.size || 'md'}`,
									fd.button.style && typeof fd.button.style == 'function'
										? `btn-${fd.button.style()}`
										: `btn-${fd.button.style}`,
								]"
								@click="
									(event) => {
										fd.button.onClick(event, fd);
										event.target.blur();
									}
								"
								:style="[
									fd.flex && { flex: fd.flex },
									`padding: ${fd.button.padding}px; margin-top: ${fd.button.margin}px; margin-bottom: ${fd.button.margin}px;`,
									'font-size:11px;',
								]"
							>
								{{
									typeof fd.button.label == "function"
										? fd.button.label()
										: fd.button.label
								}}
							</button>
							<AppPropertiesFrappeControl
								:key="`FC_${fd.name}`"
								v-if="fd.frappeControl"
								:field="fd"
							/>
							<label
								v-if="
									!fd.frappeControl &&
									fd.isLabelled &&
									(fd.icon == null || !fd.icon?.onlyIcon) &&
									!fd.button
								"
								class="main-label"
								v-text="typeof fd.label == 'function' ? fd.label() : fd.label"
							></label>
							<input
								v-if="
									!fd.frappeControl &&
									(fd.icon == null || !fd.icon.onlyIcon) &&
									!fd.button
								"
								:value="
									fd.isStyle
										? styleFormattedValue(
												fd.isStyle
													? MainStore.getCurrentStyle(fd.propertyName)
													: MainStore.getCurrentStyle({
															reactiveObject: fd.reactiveObject,
															isStyle: fd.isStyle,
															property: fd.propertyName,
													  }),
												typeof fd.inputUnit == 'function'
													? fd.inputUnit()
													: fd.inputUnit,
												fd.isRaw,
												fd.isCustomUOM
										  )
										: fd.isRaw
										? getConditonalObject(fd)[fd.propertyName]
										: uomFormattedValue(
												fd.isStyle
													? MainStore.getCurrentStyle(fd.propertyName)
													: getConditonalObject({
															reactiveObject: fd.reactiveObject,
															isStyle: fd.isStyle,
															property: fd.propertyName,
													  }),
												(convertionUnit =
													typeof fd.inputUnit == 'function'
														? fd.inputUnit()
														: fd.inputUnit)
										  )
								"
								@blur="
									($event) => {
										let object = fd.isStyle
											? MainStore.getStyleObject(fd.isFontStyle)
											: getConditonalObject(fd);
										return handleBlur({
											$event,
											object,
											property: fd.propertyName,
											defaultInputUnit:
												typeof fd.inputUnit == 'function'
													? fd.inputUnit()
													: fd.inputUnit,
											convertionUnit:
												typeof fd.inputUnit == 'function'
													? fd.inputUnit()
													: fd.inputUnit,
											withUom: fd.saveWithUom,
											isRaw: fd.isRaw,
											isCustomUOM: fd.isCustomUOM,
										});
									}
								"
								@keydown="
									($event) => {
										let object = fd.isStyle
											? MainStore.getStyleObject(fd.isFontStyle)
											: getConditonalObject(fd);
										return handleKeyDown({
											$event,
											object,
											property: fd.propertyName,
											defaultInputUnit:
												typeof fd.inputUnit == 'function'
													? fd.inputUnit()
													: fd.inputUnit,
											convertionUnit:
												typeof fd.inputUnit == 'function'
													? fd.inputUnit()
													: fd.inputUnit,
											withUom: fd.saveWithUom,
											isRaw: fd.isRaw,
											isCustomUOM: fd.isCustomUOM,
										});
									}
								"
								@keyup.enter="
									(e) => {
										e.target.blur();
									}
								"
								spellcheck="false"
								@focus="(ev) => ev.target.select()"
								autocomplete="off"
								class="form-control panel-input"
							/>
						</div>
					</template>
				</div>
				<div
					v-else-if="
						field.frappeControl &&
						(typeof field.condtional != 'function' || field.condtional())
					"
					:class="['frappeControl']"
				>
					<label
						v-if="field.isLabelled"
						class="main-label"
						v-text="typeof field.label == 'function' ? field.label() : field.label"
					></label>
					<div
						:ref="
							(el) => {
								field.frappeControl(el, field.name);
							}
						"
					></div>
				</div>
				<button
					v-else-if="field.button"
					:class="[
						`btn btn-${field.button.size || 'md'}`,
						field.button.style && `btn-${field.button.style}`,
					]"
					@click="
						(event) => {
							field.button.onClick(event, field);
							event.target.blur();
						}
					"
					:style="[
						field.flex && { flex: field.flex },
						`padding: ${field.button.padding}px; margin-top: ${field.button.margin}px; margin-bottom: ${field.button.margin}px;`,
						'font-size:11px;',
					]"
				>
					{{
						typeof field.button.label == "function"
							? field.button.label()
							: field.button.label
					}}
				</button>
			</template>
		</div>
	</div>
</template>

<script setup>
import { useChangeValueUnit } from "../../composables/ChangeValueUnit";
import IconsUse from "../../icons/IconsUse.vue";
import { useElementStore } from "../../store/ElementStore";
import { useMainStore } from "../../store/MainStore";
import { getConditonalObject } from "../../utils";
import AppPropertiesFrappeControl from "./AppPropertiesFrappeControl.vue";
const MainStore = useMainStore();
const ElementStore = useElementStore();
const props = defineProps({
	section: {
		type: Object,
		required: true,
	},
});
const handleKeyDown = ({
	$event: e,
	object,
	property,
	defaultInputUnit = MainStore.page.UOM,
	convertionUnit = MainStore.page.UOM,
	withUom = false,
	isRaw = false,
	isCustomUOM = false,
}) => {
	if (["ArrowUp", "ArrowDown"].indexOf(e.key) == -1) return;
	e.preventDefault();
	let parsedNumber = useChangeValueUnit({
		inputString: e.target.value,
		defaultInputUnit,
		convertionUnit,
	});
	if (parsedNumber && !parsedNumber.error) {
		if (e.key == "ArrowUp") {
			if (e.shiftKey) {
				parsedNumber.value += 10;
			} else if (e.metaKey || e.ctrlKey) {
				parsedNumber.value += 0.1;
			} else {
				parsedNumber.value += 1;
			}
		} else {
			if (e.shiftKey) {
				parsedNumber.value -= 10;
			} else if (e.metaKey || e.ctrlKey) {
				parsedNumber.value -= 0.1;
			} else {
				parsedNumber.value -= 1;
			}
		}
	}
	let finalValue = useChangeValueUnit({
		inputString: parsedNumber.value,
		defaultInputUnit: parsedNumber.unit,
		convertionUnit: "px",
	});
	if (!finalValue.error) {
		if (object && !object.isStyle && object.UOM == MainStore.page.UOM) {
			if (property == "marginTop") {
				ElementStore.Elements.forEach((element) => {
					element.startY -= finalValue.value - object[property];
				});
				MainStore.page.headerHeight += object[property] - finalValue.value;
				if (MainStore.page.headerHeight < 0) {
					MainStore.page.headerHeight = 0;
				}
			} else if (property == "marginLeft") {
				ElementStore.Elements.forEach((element) => {
					element.startX -= finalValue.value - object[property];
				});
			}
		}
		object[property] = withUom
			? finalValue.value.toFixed(2) + finalValue.unit
			: finalValue.value.toFixed(2);
	}
};

const uomFormattedValue = (value, convertionUnit = MainStore.page.UOM) => {
	const uomValue = useChangeValueUnit({
		inputString: value,
		defaultInputUnit: "px",
		convertionUnit,
	});
	return uomValue.value.toFixed(2) + ` ${uomValue.unit}`;
};

const styleFormattedValue = (value, UOM = "px", isRaw = false, isCustomUOM = null) => {
	if (isRaw || isCustomUOM) return `${value || 0} ${isCustomUOM ? " " + isCustomUOM : ""}`;
	return uomFormattedValue(value || 0, UOM);
};

const handleBlur = ({
	$event: e,
	object,
	property,
	defaultInputUnit = MainStore.page.UOM,
	convertionUnit = MainStore.page.UOM,
	withUom = false,
	isRaw = false,
	isCustomUOM = false,
}) => {
	e.stopImmediatePropagation();
	if (!object) return;
	const convertedValue = useChangeValueUnit({
		inputString: e.target.value,
		defaultInputUnit,
		convertionUnit: "px",
	});
	if (!object.isStyle && object.UOM == MainStore.page.UOM) {
		if (property == "marginTop") {
			ElementStore.Elements.forEach((page) => {
				page.childrens.forEach((element) => {
					element.startY -= convertedValue.value - object[property];
				});
				page.header[0].height += object[property] - convertedValue.value;
				page.footer[0].startY += object[property] - convertedValue.value;
			});
			MainStore.page.headerHeight += object[property] - convertedValue.value;
			if (MainStore.page.headerHeight < 0) {
				MainStore.page.headerHeight = 0;
			}
		} else if (property == "marginLeft") {
			ElementStore.Elements.forEach((element) => {
				element.startX -= convertedValue.value - object[property];
			});
		} else if (property == "marginBottom") {
			ElementStore.Elements.forEach((page) => {
				page.footer[0].height += object[property] - convertedValue.value;
				MainStore.page.footerHeight += object[property] - convertedValue.value;
				if (MainStore.page.footerHeight < 0) {
					MainStore.page.footerHeight = 0;
				}
			});
		}
		if (["width", "height"].indexOf(property)) {
			let propertyValue = useChangeValueUnit({
				inputString: e.target.value,
				defaultInputUnit: MainStore.page.UOM,
				convertionUnit: "mm",
			});
			cps = [
				MainStore.convertToPageUOM(MainStore.page.width),
				MainStore.convertToPageUOM(MainStore.page.height),
			];
			if (!propertyValue.error) {
				cps.splice(["width", "height"].indexOf(property), 1, propertyValue.value);
			}
			const currentPageSize = Object.entries(MainStore.pageSizes).find((ps) => {
				return ps[1][0] == cps[0] && ps[1][1] == cps[1];
			});
			if (currentPageSize) {
				MainStore.currentPageSize = currentPageSize[0];
			} else {
				MainStore.currentPageSize = "CUSTOM";
			}
		}
	}
	if (!convertedValue.error) {
		object[property] = withUom
			? convertedValue.value + convertedValue.unit
			: convertedValue.value;
	}
	const updateInputField = useChangeValueUnit({
		inputString: object[property],
		defaultInputUnit: "px",
		convertionUnit,
	});
	if (object.isStyle) {
		e.target.value = styleFormattedValue(
			getConditonalObject({
				reactiveObject: object.reactiveObject,
				isStyle: object.isStyle,
				property: object.propertyName,
			}),
			convertionUnit,
			isRaw,
			isCustomUOM
		);
	} else {
		e.target.value = withUom
			? updateInputField.value.toFixed(2) + " " + updateInputField.unit
			: updateInputField.value.toFixed(2);
	}
};
</script>

<style lang="scss" deep>
.fields-container {
	padding: 5px;
	align-items: center;
	.flex-container {
		&.has-frappe-control {
			padding: 2px;
			flex: 1;
		}
		&:not(.has-frappe-control) {
			padding: 0px 7px;
		}
		.frappeControl {
			padding: 0px;
			padding-bottom: 4px;
			.main-label {
				margin-top: 0px;
			}
		}
		&.flex-row {
			flex-direction: row;
			justify-content: center;
			align-items: center;
			margin: 0px !important;
			padding: 5px !important;
		}
	}
}
</style>
