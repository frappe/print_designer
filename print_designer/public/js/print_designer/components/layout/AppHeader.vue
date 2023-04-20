<template>
	<div class="header">
		<span class="indicator-pill whitespace-nowrap orange mr-3 py-1">Beta</span>
		<h3 class="title">Editing {{ print_format_name }}</h3>
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
	left: 50px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 50%;
	height: 60px;
	padding: 0px 10px;
	z-index: 1020;
	user-select: none;
}
.app-icon {
	flex: 1;
	max-width: 60px;
}
.title {
	flex: 5;
	font-size: 18px;
	margin-bottom: 0;
	user-select: none;
}
</style>
