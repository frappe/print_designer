<template>
	<svg
		:viewBox="`0 0 24 24`"
		:width="size"
		:height="size"
		:style="`padding: ${padding}px; margin-top: ${margin}px; margin-bottom: ${margin}px;`"
	>
		<use :href="`#${name}`" :style="`fill: ${color};`" />
	</svg>
</template>

<script setup>
const props = defineProps({
	name: {
		type: String,
		required: true,
	},
	size: {
		type: Number,
		default: 16,
	},
	padding: {
		type: Number,
		default: 0,
	},
	margin: {
		type: Number,
		default: 0,
	},
	color: {
		default: "#000000",
	},
});
</script>
