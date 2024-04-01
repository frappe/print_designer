<template>
	<div
		v-if="isTable"
		style="display: flex; align-items: baseline; height: 26px; margin: 0.8rem 0"
	>
		<label for="column-name" style="padding-right: 1rem; padding-left: 0.5rem">Label : </label>
		<input
			type="text"
			id="column-name"
			class="form-control input-sm col-4 my-2"
			:placeholder="__('Enter Label')"
			v-model="label"
		/>
	</div>
	<div
		class="preview-container"
		@click.self.stop="selectedEl = null"
		@dragover="allowDrop"
		@dblclick.self="addStaticText"
		@drop.self="drop($event, fieldnames.length)"
	>
		<template v-for="(field, index) in fieldnames" :key="index">
			<div
				:class="[
					'dynamic-field',
					field.fieldtype == 'StaticText' && 'static-text',
					selectedEl?.field == field &&
						(field.fieldtype == 'StaticText'
							? 'static-text-selected'
							: 'dynamic-field-selected'),
				]"
				:value="field.fieldname"
				draggable="true"
				@click.stop="handleClick($event, field, index)"
				@dragstart="dragstart($event, index)"
				@dragover="allowDrop"
				@dragleave="dragleave"
				@drop="drop($event, index)"
			>
				<span
					v-if="!field.is_static && field.is_labelled"
					:contenteditable="contenteditable"
					:class="['label-text', selectedEl?.field == field && 'label-text-selected']"
					:ref="(el) => (field.labelRef = el)"
					@dblclick="handleDblClick($event, field, 'label')"
					@blur="handleBlur($event, field)"
					v-html="field.label || 'Add Label'"
				></span>
				<span
					:ref="(el) => (field.spanRef = el)"
					class="preview-text"
					:class="{ 'preview-text-selected': selectedEl?.field == field }"
					:contenteditable="contenteditable"
					@dblclick="handleDblClick($event, field, 'main')"
					@blur="handleBlur($event, field)"
					v-html="
						field.value ||
						(field.is_static
							? 'Add Text'
							: `{{ ${field.parentField ? field.parentField + '.' : ''}${
									field.fieldname
							  } }}`)
					"
				></span>
				<span
					v-if="field.suffix"
					:contenteditable="contenteditable"
					:class="['label-text', selectedEl?.field == field && 'label-text-selected']"
					:ref="(el) => (field.suffixRef = el)"
					@dblclick="handleDblClick($event, field, 'suffix')"
					@blur="handleBlur($event, field)"
					v-html="field.suffix || 'Add Suffix'"
				></span>
				<span v-if="field.nextLine" class="next-line fa fa-level-down"></span>
			</div>
			<br v-if="field.nextLine" />
		</template>
	</div>
	<div class="footer">
		<div class="icons">
			<div @click="addStaticText">
				<em style="font-weight: 900">T</em>
				<sub style="font-weight: 600; font-size: 1em bottom:-0.15em">+</sub>
				<span style="font-size: 12px; padding: 0px 5px">Add Text</span>
			</div>
			<div
				v-if="selectedEl && !selectedEl.field.is_static"
				@click="selectedEl.field.is_labelled = !selectedEl.field.is_labelled"
			>
				<span
					class="fa fa-tag"
					:style="[selectedEl.field.is_labelled && 'color:var(--primary)']"
				></span>
				<span
					:style="[
						'font-size: 12px; padding: 0px 5px',
						selectedEl.field.is_labelled && 'color:var(--primary)',
					]"
					>{{ selectedEl.field.is_labelled ? "Remove Label" : "Add Label" }}</span
				>
			</div>
			<div
				v-if="selectedEl"
				@click="selectedEl.field.suffix = !selectedEl.field.suffix && 'Add Suffix'"
			>
				<span
					class="fa fa-angle-double-right"
					:style="[selectedEl.field.suffix && 'color:var(--primary)']"
				></span>
				<span
					:style="[
						'font-size: 12px; padding: 0px 5px',
						selectedEl.field.suffix && 'color:var(--primary)',
					]"
					>{{ selectedEl.field.suffix ? "Remove Suffix" : "Add Suffix" }}</span
				>
			</div>
			<div v-if="selectedEl" @click="selectedEl.field.nextLine = !selectedEl.field.nextLine">
				<span
					class="next-line fa fa-level-down"
					:style="[selectedEl.field.nextLine && 'color:var(--primary)']"
				></span>
				<span
					:style="[
						'font-size: 12px; padding: 0px 5px',
						selectedEl.field.nextLine && 'color:var(--primary)',
					]"
					>{{ selectedEl.field.nextLine ? "Remove Line" : "New Line" }}</span
				>
			</div>
			<div
				v-if="selectedEl && selectedEl.field.is_static"
				@click="selectedEl.field.parseJinja = !selectedEl.field.parseJinja"
			>
				<span
					class="jinja-toggle fa fa-code"
					:style="[selectedEl.field.parseJinja && 'color:var(--primary)']"
				></span>
				<span
					:style="[
						'font-size: 12px; padding: 0px 5px',
						selectedEl.field.parseJinja && 'color:var(--primary)',
					]"
					>{{ selectedEl.field.parseJinja ? "Disable Jinja" : "Render Jinja" }}</span
				>
			</div>
		</div>
		<div
			class="deleteIcon"
			v-if="fieldnames.length"
			@click.stop="handleDeleteClick"
			@dragover="allowDeleteDrop"
			@dragleave="dragleave"
			@drop="(ev) => deleteField(ev)"
		>
			<span class="fa fa-trash"></span>
			<span style="font-size: 12px; padding: 0px 5px">Delete</span>
		</div>
	</div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, watchPostEffect } from "vue";
import { useMainStore } from "../../store/MainStore";
import { selectElementContents } from "../../utils";
const MainStore = useMainStore();
const props = defineProps({
	fieldnames: {
		type: Array,
		required: true,
	},
	modalLabel: {
		type: String,
		default: "",
	},
	isTable: {
		type: Boolean,
		default: false,
	},
});
const draggableEl = ref(-1);
const label = ref("");

const setLabel = (value) => {
	if (label.value != value) {
		label.value = value;
	}
};

onMounted(() => {
	label.value = props.modalLabel;
	watchPostEffect(() => {
		document.body.addEventListener("keyup", handleInputKeyUp);
	});
});
onUnmounted(() => {
	document.body.removeEventListener("keyup", handleInputKeyUp);
});

const handleInputKeyUp = (e) => {
	if (
		document.activeElement.tagName == "INPUT" ||
		document.activeElement.contentEditable == "true"
	) {
		return;
	}
	if (selectedEl.value) {
		if (e.key === "Delete" || e.key === "Backspace") {
			handleDeleteClick();
		}
	}
};

const parentField = ref("");
const setParentField = (value) => {
	if (parentField.value != value) {
		parentField.value = value;
	}
};
const selectedEl = ref(null);
const setSelectedEl = (value) => {
	if (selectedEl.value != value) {
		selectedEl.value = value;
	}
};
const contenteditable = ref(false);
defineExpose({ parentField, setParentField, selectedEl, setSelectedEl, label, setLabel });

const handleClick = (event, field, index) => {
	selectedEl.value = { index, field };
	parentField.value = field.parentField;
};

const handleDblClick = (event, field, type) => {
	let ref = null;
	if (type == "label") {
		ref = field.labelRef;
	} else if (type == "suffix") {
		ref = field.suffixRef;
	} else if (type == "main" && field.is_static) {
		ref = field.spanRef;
	}
	if (!ref) return;
	contenteditable.value = true;
	setTimeout(() => {
		event.target.focus();
		selectElementContents(ref);
	}, 0);
};

const handleBlur = (event, field) => {
	contenteditable.value = false;
	if (!event.target.innerHTML) {
		// If the field is empty, set the default value in HTML as well as in the field object
		switch (event.target) {
			case field.spanRef:
				event.target.innerHTML = "Add Text";
				break;
			case field.labelRef:
				event.target.innerHTML = "Add Label";
				break;
			case field.suffixRef:
				event.target.innerHTML = "Add Suffix";
				break;
		}
	}
	switch (event.target) {
		case field.spanRef:
			field.value = event.target.innerHTML;
			break;
		case field.labelRef:
			field.label = event.target.innerHTML;
			break;
		case field.suffixRef:
			field.suffix = event.target.innerHTML;
			break;
	}
};

const addStaticText = (event) => {
	let index = props.fieldnames.length;
	let newText = {
		doctype: "",
		parentField: "",
		fieldname: frappe.utils.get_random(10),
		value: "Add Text",
		fieldtype: "StaticText",
		is_static: true,
		is_labelled: false,
		nextLine: false,
		parseJinja: false,
		style: {},
	};
	if (selectedEl.value) {
		index = selectedEl.value.index + 1;
		props.fieldnames.splice(index, 0, newText);
	} else {
		props.fieldnames.push(newText);
	}
	contenteditable.value = true;
	nextTick(() => {
		props.fieldnames.at(index).spanRef.focus();
		selectElementContents(props.fieldnames.at(index).spanRef);
		selectedEl.value = { index, field: newText };
	});
};

const dragstart = (ev, index) => {
	ev.dataTransfer.dropEffect = "move";
	draggableEl.value = index;
};

const allowDrop = (ev) => {
	ev.dataTransfer.dropEffect = "move";
	ev.target.classList.contains("dynamic-field") || ev.target.classList.contains("deleteIcon")
		? ev.target.classList.add("dropzone")
		: ev.target.parentElement.classList.add("dropzone");
	ev.preventDefault();
};

const dragleave = (ev) => {
	ev.target.classList.contains("dynamic-field") || ev.target.classList.contains("deleteIcon")
		? ev.target.classList.remove("dropzone")
		: ev.target.parentElement.classList.remove("dropzone");
};

const drop = (ev, index) => {
	ev.target.classList.contains("dynamic-field") || ev.target.classList.contains("deleteIcon")
		? ev.target.classList.remove("dropzone")
		: ev.target.parentElement.classList.remove("dropzone");
	let dragField = props.fieldnames.splice(draggableEl.value, 1);
	props.fieldnames.splice(index, 0, dragField[0]);
	ev.preventDefault();
	selectedEl.value = null;
};

const allowDeleteDrop = (ev) => {
	ev.dataTransfer.dropEffect = "move";
	ev.target.classList.contains("dynamic-field") || ev.target.classList.contains("deleteIcon")
		? ev.target.classList.add("dropzone")
		: ev.target.parentElement.classList.add("dropzone");
	ev.preventDefault();
};

const handleDeleteClick = () => {
	if (selectedEl.value) {
		let el = props.fieldnames.splice(selectedEl.value.index, 1);
		MainStore.dynamicData.splice(MainStore.dynamicData.indexOf(el), 1);
		selectedEl.value = null;
	}
};

const deleteField = (ev) => {
	ev.target.classList.contains("dynamic-field") || ev.target.classList.contains("deleteIcon")
		? ev.target.classList.remove("dropzone")
		: ev.target.parentElement.classList.remove("dropzone");
	let el = props.fieldnames.splice(draggableEl.value, 1);
	MainStore.dynamicData.splice(MainStore.dynamicData.indexOf(el), 1);
	if (draggableEl.value == selectedEl.value?.index) {
		selectedEl.value = null;
	}
	draggableEl.value = -1;
};
</script>

<style lang="scss" scoped>
.preview-container {
	flex: 1;
	padding: 0px 15px;
	border: 1px solid var(--gray-200);
	border-radius: var(--border-radius);
	height: calc(23vh - 45px);
	min-height: 100px;
	width: 100%;
	background-color: var(--subtle-fg);
	overflow: auto;
	margin-top: 15px;
	padding-top: 10px;

	.dynamic-field {
		width: fit-content;
		display: inline-block;
		vertical-align: top;
		box-sizing: border-box;
		padding: 8px 1px;
		color: var(--text-muted);
		cursor: pointer;

		&:hover,
		&.dynamic-field-selected {
			border: 1px solid var(--primary);
			padding: 7px 0;
			border-radius: var(--border-radius);
		}

		.label-text {
			padding: 6px 1px;
			margin: 0px 3px;
			&:hover,
			&.label-text-selected {
				border: 1px solid var(--gray-900);
				padding: 6px 1px;
				margin: 0px 2px;
				border-radius: var(--border-radius);
			}
		}

		&.static-text:hover,
		&.static-text-selected {
			border: 1px solid var(--gray-900);
			padding: 7px 0;
			border-radius: var(--border-radius);
		}

		.preview-text {
			padding: 0;
			padding-left: 2px;
			&:hover,
			&.preview-text-selected {
				color: var(--dark);
			}
		}

		.next-line,
		.jinja-toggle {
			margin: 0px 7px;
			color: var(--text-muted);
		}
	}
}
.footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	.icons {
		display: flex;
		flex: 1;
		align-items: center;
		font-size: 16px;
		justify-content: flex-start;
		padding: 10px;
		color: var(--text-muted);

		& > * {
			font-weight: 500;
			padding: 0px 10px;
			border-left: 1px solid var(--gray-300);
			&:first-child {
				padding-left: 0px;
				border-left: 0px;
			}
			cursor: pointer;
		}
	}
	.deleteIcon {
		display: flex;
		flex: 1;
		max-width: 60px;
		margin-right: 20px;
		align-items: center;
		font-size: medium;
		justify-content: center;
		padding: 10px 20px;
		margin-right: 6px;
		color: var(--danger);
		cursor: pointer;
	}
}

.dropzone {
	background-color: var(--gray-200);
}
</style>
