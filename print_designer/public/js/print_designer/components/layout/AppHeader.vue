<template>
	<div class="header">
		<img class="app-icon" style="width: 32px" src="/assets/print_designer/images/print-designer-logo.svg">
		<h3 class="title">{{ print_format_name }}</h3>
		<span class="indicator-pill no-indicator-dot ellipsis gray">Beta</span>
		<!-- TODO: Add Exit Button -->
	</div>
</template>
<script setup>
const props = defineProps({
	print_format_name: String,
});
</script>
<style scoped lang="scss">
.header {
	position: absolute;
	top: 0;
	left: 0;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	height: calc(var(--navbar-height) - 1px);
	z-index: 1020;
	user-select: none;
	background-color: var(--navbar-bg);
	
	.app-icon {
		flex: 1;
		margin-left: 6px;
	}
	.title {
		flex: auto;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		letter-spacing: 0.015em;
		margin-bottom: 0;
		user-select: none;
	}
}
</style>
