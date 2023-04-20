<template>
	<div class="canvas">
		<div
			id="preview-container"
			class="preview-container"
			:style="[MainStore.getPageSettings, 'height: unset;']"
		></div>
	</div>
</template>
<script setup>
import { onMounted, onUnmounted, watch, shallowRef } from "vue";
import { useMainStore } from "../../store/MainStore";
const MainStore = useMainStore();
const pdfjsLibRef = shallowRef(null);
const pdfDocumentTask = shallowRef(null);

const removePdfWatcher = watch(
	() => [pdfjsLibRef.value, MainStore.doctype, MainStore.printDesignName],
	async () => {
		let pdfjsLib = pdfjsLibRef.value;
		if (pdfjsLib && MainStore.doctype && MainStore.printDesignName) {
			console.time("PdfStart");
			let url = `/api/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent(
				MainStore.doctype
			)}&name=${encodeURIComponent(MainStore.currentDoc)}&format=${encodeURIComponent(
				MainStore.printDesignName
			)}&no_letterhead=1`;

			/**
			 * Get page info from document, resize canvas accordingly, and render page.
			 * @param num Page number.
			 */
			async function renderPage(num) {
				pageRendering = true;
				// Using promise to fetch the page
				let page = await pdfDoc.getPage(num);
				let canvasContainer = document.getElementById("preview-container");
				let canvas = document.createElement("canvas");
				canvasContainer.appendChild(canvas);
				ctx = canvas.getContext("2d");
				let viewport = page.getViewport({ scale: 1 });
				let scale = (MainStore.page.width / viewport.width) * window.devicePixelRatio;
				let scaledViewport = page.getViewport({ scale: scale });
				canvas.style.height = MainStore.page.height + "px";
				canvas.style.width = MainStore.page.width + "px";
				canvas.height = scaledViewport.height;
				canvas.width = scaledViewport.width;

				// Render PDF page into canvas context
				var renderContext = {
					canvasContext: ctx,
					viewport: scaledViewport,
					intent: "print",
				};
				page.render(renderContext);
			}

			/**
			 * Asynchronously downloads PDF.
			 */
			let pdfDoc = null;
			frappe.dom.freeze("Generating PDF Preview...");
			try {
				pdfDocumentTask.value = await pdfjsLib.getDocument(url);
				pdfDoc = await pdfDocumentTask.value.promise;
				console.timeEnd("PdfStart", pdfDoc);

				// Initial/first page rendering
				for (let pageno = 1; pageno <= pdfDoc.numPages; pageno++) {
					await renderPage(pageno);
				}
				frappe.dom.unfreeze();
			} catch {
				frappe.dom.unfreeze();
				frappe.show_alert(
					{
						message: "Unable to generate PDF",
						indicator: "red",
					},
					5
				);
				MainStore.mode = "editing";
			}

			removePdfWatcher();
		}
	}
);
onMounted(() => {
	let waitingForpdfJsLib = setInterval(() => {
		if (window.pdfjsLib) {
			pdfjsLibRef.value = window.pdfjsLib;
			clearInterval(waitingForpdfJsLib);
		}
	}, 10);
});
onUnmounted(() => {
	pdfDocumentTask.value.destroy();
});
</script>

<style lang="scss" scoped>
.preview-container {
	position: relative;
	margin: 50px auto;
	margin-top: calc((-1 * var(--print-margin-top)) + 50px);
	height: 100%;
	background-color: #f2f3f3;

	canvas {
		margin-top: 20px;
	}
}
</style>
