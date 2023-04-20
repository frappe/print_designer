<template>
	<div class="resize-handle top-left resize-top resize-left"></div>
	<div class="resize-handle top-right resize-top resize-right"></div>
	<div class="resize-handle top-middle resize-top"></div>
	<div class="resize-handle left-middle resize-left"></div>
	<div class="resize-handle right-middle resize-right"></div>
	<div class="resize-handle bottom-left resize-bottom resize-left"></div>
	<div class="resize-handle bottom-middle resize-bottom"></div>
	<div class="resize-handle bottom-right resize-bottom resize-right"></div>
</template>

<script setup></script>

<style lang="scss" scoped>
.resize-handle {
	width: 6px;
	height: 6px;
	background: white;
	border: 1px solid var(--primary-color);
	position: absolute;
	z-index: 9999;
}
.top-left {
	left: -4px;
	top: -4px;
	cursor: nwse-resize;
}
.top-middle {
	top: -4px;
	left: calc(50% - 3px);
	cursor: ns-resize;
}
.top-right {
	right: -4px;
	top: -4px;
	cursor: nesw-resize;
}
.right-middle {
	right: -4px;
	top: calc(50% - 3px);
	cursor: ew-resize;
}
.left-middle {
	left: -4px;
	top: calc(50% - 3px);
	cursor: ew-resize;
}
.bottom-middle {
	bottom: -4px;
	left: calc(50% - 3px);
	cursor: ns-resize;
}
.bottom-left {
	left: -4px;
	bottom: -4px;
	cursor: nesw-resize;
}
.bottom-right {
	right: -4px;
	bottom: -4px;
	cursor: nwse-resize;
}
</style>
