<template>
	<div class="menu" v-if="typeof index == 'number'" :style="{ top, left }" ref="DOMRef">
		<ul class="menu-list">
			<span class="menu-title">
				<i class="fa fa-columns" aria-hidden="true"></i>
				Insert Column
			</span>
			<hr />
			<li class="menu-item">
				<button class="menu-button" @click="$emit('handleMenuClick', index, 'before')">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M4.2666 7.99778L12.2666 8"
							stroke="#525252"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M7.2002 11.5535L3.64464 7.99791L7.2002 4.44236"
							stroke="#525252"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>

					<span>Insert Left</span>
				</button>
			</li>
			<li class="menu-item">
				<button class="menu-button" @click="$emit('handleMenuClick', index, 'after')">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M11.7334 8.00222L3.7334 8"
							stroke="#383838"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M8.7998 4.44653L12.3554 8.00209L8.7998 11.5576"
							stroke="#383838"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>

					<span>Insert Right</span>
				</button>
			</li>
		</ul>
		<ul class="menu-list">
			<li class="menu-item">
				<button
					class="menu-button menu-button delete-btn"
					@click="$emit('handleMenuClick', index, 'delete')"
				>
					Delete
				</button>
			</li>
		</ul>
	</div>
</template>

<script setup>
import { ref, toRefs } from "vue";
import { onClickOutside } from "@vueuse/core";
const props = defineProps({
	menu: {
		type: Object,
		required: true,
	},
});
defineEmits(["handleMenuClick"]);
const DOMRef = ref(null);
const { left, top, index } = toRefs(props.menu);
onClickOutside(DOMRef, () => {
	props.menu.index = null;
});
</script>

<style lang="scss" scoped>
.menu {
	position: absolute;
	display: flex;
	flex-direction: column;
	background-color: var(--fg-color);
	border-radius: 10px;
	border: 1px solid var(--dark-border-color);
	box-shadow: 0px 2px 10px 1px rgb(0 0 0 / 15%);
	z-index: 9999;
}
.menu-list {
	margin: 0;
	display: block;
	width: 100%;
	min-width: 160px;
	padding: 8px;
	list-style: none;
	& + .menu-list {
		border-top: 1px solid var(--dark-border-color);
	}
	.menu-title {
		padding: 8px;
		font-weight: 500;
		i {
			margin-right: 5px;
			font-size: 0.85rem;
		}
	}
}
.menu-item {
	position: relative;
	padding-left: 5px;
	min-height: 36px;
}
.delete-btn:hover {
	color: var(--danger);
}
.menu-button {
	font: inherit;
	border: 0;
	padding: 5px 8px;
	padding-right: 24px;
	width: 100%;
	border-radius: 8px;
	text-align: left;
	display: flex;
	align-items: center;
	position: relative;
	background-color: var(--fg-color);
	&:hover {
		background-color: var(--gray-100);
	}
	&:active,
	&:focus {
		background-color: var(--gray-100);
		outline: unset;
		border-style: inset;
	}
	span {
		padding-left: 5px;
	}
}
</style>
