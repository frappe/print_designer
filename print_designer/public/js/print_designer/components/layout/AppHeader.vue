<template>
	<div class="header">
		<a class="navbar-brand navbar-home" href="/app">
			<img class="app-icon" style="width: 32px" src="/assets/print_designer/images/print-designer-logo.svg">
		</a>
		<h3 class="title">{{ print_format_name }}</h3>
		<span class="indicator-pill no-indicator-dot ellipsis gray">Beta</span>
		<button class="btn btn-sm btn-default exit-btn" @click="goToLastPage">
			<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
				<use href="#es-line-log-out" style="--icon-stroke: var(--invert-neutral);" />
			</svg>
			<span>Exit</span>
		</button>
	</div>
</template>
<script setup>
const props = defineProps({
	print_format_name: String,
});
const goToLastPage = () => {
	let prev_route = frappe.get_prev_route();
	if (prev_route[0] !== "print-designer") {
		frappe.set_route(prev_route);
	} else {
		frappe.set_route();
	}
};
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

	.exit-btn {
		margin-right: 16px;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
	}
}
</style>
