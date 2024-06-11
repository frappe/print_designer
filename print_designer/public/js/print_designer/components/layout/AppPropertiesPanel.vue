<template>
	<div
		class="properties-container"
		@keydown.stop
		@keyup.stop
		:ref="
			(el) => {
				MainStore.propertiesContainer = el;
			}
		"
	>
		<Icons style="display: none" />
		<div class="primary-actions">
			<button
				class="btn btn-sm add-data-button"
				@click="(event) => (MainStore.openJinjaModal = true)"
			>
				Custom Data
			</button>
			<button
				class="btn btn-sm btn-primary"
				@click="
					(event) => {
						if (MainStore.mode == 'pdfSetup') {
							MainStore.mode = 'editing';
						}
						ElementStore.saveElements();
						event.target.blur();
					}
				"
			>
				Save
			</button>
		</div>
		<AppPropertiesPanelSection
			v-for="section in MainStore.propertiesPanel"
			:section="section"
			:key="section.title ? section.title.replace(' ', '') : section.name"
		/>
	</div>
</template>
<script setup>
import { useMainStore } from "../../store/MainStore";
import { useElementStore } from "../../store/ElementStore";
import { createPropertiesPanel } from "../../PropertiesPanelState";
import AppPropertiesPanelSection from "./AppPropertiesPanelSection.vue";
import { onMounted } from "vue";
import Icons from "../../icons/Icons.vue";

const MainStore = useMainStore();
const ElementStore = useElementStore();
onMounted(() => createPropertiesPanel());
</script>
<style deep lang="scss">
.properties-container {
	* {
		user-select: none;
	}
	cursor: default;
	position: relative;
	overflow: auto;
	.designer-icon {
		height: 24px;
		width: 24px;
		fill: var(--gray-600);
	}
	.primary-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--subtle-fg);
		padding: 5px 10px;
		.btn {
			background-color: var(--bg-color);
			font-size: var(--text-sm) !important;
			font-size: var(--weight-regular);
		}
		.btn-primary {
			background-color: var(--btn-primary);
		}
		button {
			margin: 5px 10px;
			min-width: 60px;
			.button-with-icon {
				margin: 2px 10px 2px 0px;
				font-size: 16px;
			}
		}
	}
	.secondary-actions {
		@extend .primary-actions;
		background-color: var(--bg-color);
		.add-data-button {
			flex: 1;
			background-color: var(--subtle-fg);
		}
	}
	.text-type-container,
	.align-items-container {
		border-top: 1px solid var(--border-color);
	}
	.text-type-container {
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--subtle-fg);
		.text-type {
			padding: 6px 16px;
			margin: 6px 0px;
		}
		.text-type-active {
			background-color: white;
			box-shadow: var(--card-shadow);
			border-radius: var(--border-radius);
		}
	}
	.align-items-container {
		padding: 10px 8px;
		display: flex;
		.align-container {
			display: flex;
			width: 50%;
			justify-content: space-around;
			&:last-child {
				border-left: 1px solid var(--border-color);
			}
		}
	}
	.border-container {
		display: flex;
		align-items: center;
		.designer-icon {
			margin-left: 3.5px;
		}
	}
	.section-title {
		margin: 6px 0px 2px 8px;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--border-color);
		font-weight: 500;
		font-size: 12px;
	}
	.main-label {
		flex: 2;
		margin-left: 3.5px;
		margin-top: 5px;
		margin-bottom: 4px;
		font-size: 10px;
		color: var(--gray-600);
		vertical-align: middle;
		font-weight: 400;
	}
	.panel-container {
		display: flex !important;
		justify-content: space-between;
		align-items: center;
		margin: 0px 9px;
		&.panel-border-top {
			margin-top: 8px;
			border-top: 1px solid var(--border-color);
		}
		&.panel-border-bottom {
			margin-bottom: 8px;
			border-bottom: 1px solid var(--border-color);
		}
		.flex-container {
			display: flex !important;
			margin-top: 0px;
		}
		.flex-container.flex-column {
			flex-direction: column;
			margin-top: 3.5px;
		}
	}
	.panel-input {
		font-size: 10px;
		color: var(--invert-neutral);
		background-color: var(--fg-color);
		border-bottom: 1px solid var(--border-color);
		border-radius: 0px;
		box-shadow: none;
		flex: 5;
		padding: 0.375rem 0.25rem;
		&:focus {
			box-shadow: none;
			border-bottom-color: var(--primary);
		}
		&:after {
			left: 70px;
			font-size: 11px;
		}
	}
	.settings-section {
		padding: 8px 5px;
		border-top: 1px solid var(--border-color);
	}
	.frappeControl {
		padding: 4px 15px;
		width: 100%;
		.main-label {
			margin-top: 2px;
		}
		.awesomplete {
			& > ul {
				min-width: 210px !important;
			}
		}
		.frappe-control {
			input {
				font-size: 12px;
			}
			&[data-fieldtype="Select"] {
				select {
					font-size: 11px;
				}
				.select-icon {
					top: 4px;
					right: 6px;
				}
			}
			&[data-fieldtype="Color"] {
				input {
					font-size: 11.5px;
					padding-left: 29px;
					font-weight: 300;
				}
				.input-active {
					border: 1px solid var(--primary) !important;
				}
				.selected-color {
					width: 18px;
					height: 18px;
					left: 6px;
				}
			}
		}
	}
	.form-group .form-control {
		border: 1px solid transparent !important;
		&:focus {
			box-shadow: none;
			border: 1px solid var(--primary) !important;
		}
	}
	.control-label {
		font-size: 11px;
	}
	.borderColorSelector {
		margin-top: 10px;
	}
}
.picker-arrow.arrow {
	display: none;
}
</style>
