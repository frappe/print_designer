<template>
	<Teleport to="#body">
		<Transition name="modal">
			<div
				:ref="
					(el) => {
						modal = { DOMRef: el };
					}
				"
				v-if="openModal"
				class="modal-dialog modal-sm"
				:style="[
					{ 'min-width': width, 'max-width': width, left, top },
					MainStore.mode == 'editing' && {
						cursor: `url('/assets/print_designer/images/mouse-pointer.svg'), default`,
					},
				]"
			>
				<div class="modal-content">
					<div class="modal-header">
						<p class="modal-title"><slot name="title"></slot></p>
						<button
							class="btn btn-modal-close btn-link"
							data-dismiss="modal"
							@click="handleEmits('cancelClick')"
						>
							<svg class="icon icon-sm" style="font-size: 10px">
								<use class="close-alt" href="#icon-close-alt"></use>
							</svg>
						</button>
						<div class="modal-actions"></div>
					</div>
					<div
						class="modal-body ui-front"
						:style="[{ 'min-height': height, 'max-height': height }]"
					>
						<slot name="body"></slot>
					</div>
					<div class="modal-footer show">
						<button
							type="button"
							class="btn btn-primary btn-sm show btn-modal-primary"
							@click="handleEmits('primaryClick')"
						>
							Confirm
						</button>
						<button
							type="button"
							class="btn btn-default btn-sm show btn-modal-default"
							@click="handleEmits('cancelClick')"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</Transition>
		<Transition name="backdrop">
			<div class="modal-backdrop" v-if="openModal && backdrop" aria-modal="true"></div>
		</Transition>
	</Teleport>
</template>

<script setup>
import { useDraggable } from "../../composables/Draggable";
import { useMainStore } from "../../store/MainStore";
import { onMounted, onUnmounted, watch, watchPostEffect, ref, nextTick } from "vue";
const MainStore = useMainStore();
const modal = ref(null);
const openModal = ref(false);
const props = defineProps({
	size: {
		type: Object,
		required: true,
	},
	backdrop: {
		type: Boolean,
	},
	isDraggable: {
		type: Boolean,
	},
});
const { width, height, top, left } = props.size;
const emit = defineEmits(["primaryClick", "cancelClick"]);
const handleEmits = (emitName) => {
	openModal.value = false;
	MainStore.isMoved = MainStore.isMoveStart = false;
	if (
		document.activeElement.tagName == "INPUT" ||
		document.activeElement.contentEditable == "true"
	) {
		document.activeElement.blur();
	}
	nextTick(() => emit(emitName));
};
const handleInputKeydown = (e) => {
	if (!e.repeat && e.key == "Enter" && (e.ctrlKey || e.metaKey)) {
		handleEmits("primaryClick");
	}
	if (document.activeElement == document.body) {
		if (!e.repeat && e.key == "Escape") {
			handleEmits("cancelClick");
		}
	}
	if (e.key != "Escape") {
		e.stopImmediatePropagation();
	}
};
watch(
	() => modal.value,
	() => {
		if (openModal.value && modal.value?.DOMRef && props.isDraggable) {
			useDraggable({
				element: modal.value,
				restrict: "#body",
				ignore: "input",
				dragStartListener: (e) => {
					e.target.style.left = MainStore.modalLocation.x + "px";
					e.target.style.top = MainStore.modalLocation.y + "px";
				},
				dragMoveListener: (e) => {
					MainStore.modalLocation.isDragged = true;
					e.target.style.top =
						(parseFloat(e.target.style.top) || e.target.getBoundingClientRect().top) +
						e.delta.y +
						"px";
					e.target.style.left =
						(parseFloat(e.target.style.left) ||
							e.target.getBoundingClientRect().left) +
						e.delta.x +
						"px";
				},
				dragStopListener: (e) => {
					MainStore.modalLocation.x = parseFloat(e.target.style.left);
					MainStore.modalLocation.y = parseFloat(e.target.style.top);
				},
			});
		}
	}
);
onMounted(() => {
	openModal.value = true;
	watchPostEffect(() => {
		document.body.addEventListener("keydown", handleInputKeydown);
	});
});
onUnmounted(() => {
	document.body.removeEventListener("keydown", handleInputKeydown);
});
</script>
<style deep>
@keyframes modal {
	from {
		opacity: 0;
		transform: translateY(1rem);
	}
	to {
		opacity: 100;
		transform: translateY(0);
	}
}
@keyframes backdrop {
	from {
		opacity: 0;
	}
	to {
		opacity: 100;
	}
}
.modal-enter-active {
	animation: modal 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-leave-active {
	animation: modal 400ms cubic-bezier(1, 0.2, 0, 0.4) reverse;
}
.backdrop-enter-active {
	animation: backdrop 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.backdrop-leave-active {
	animation: backdrop 200ms cubic-bezier(1, 0.2, 0, 0.4) reverse;
}
</style>
<style lang="scss" scoped>
.modal-dialog {
	--primary: #7b4b57;
	--primary-color: #7b4b57;
	display: flex;
	font-size: 0.75rem;
	position: absolute;
	margin: 0;
	z-index: 1022;
	.modal-header {
		padding: 0;
		margin: 4px 0px 6px 0px;
		align-items: center;
		.modal-title {
			flex: 1;
			user-select: none;
			font-size: 13px;
			font-weight: 500;
			margin-left: 20px;
		}
	}
	.modal-body {
		user-select: none;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
	}
	.modal-content {
		border: 1px solid rgba(0, 0, 0, 0.05);
	}
	.modal-footer {
		padding: 0.25rem 0.75rem;
		flex-direction: row-reverse;
		justify-content: flex-start;
		align-items: center;
	}
}
.modal-backdrop {
	overflow: auto;
	display: block;
	z-index: 1021;
	background-color: rgb(198 202 210 / 40%);
}
</style>
