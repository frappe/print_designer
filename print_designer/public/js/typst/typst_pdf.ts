// import { $typst } from "@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs";
import { $typst } from "@myriaddreamin/typst.ts";
frappe.provide("frappe.ui.form");

declare function __(text: string): string;

$typst.setCompilerInitOptions({
	getModule: async () =>
		fetch(
			"https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.6.0/pkg/typst_ts_web_compiler_bg.wasm",
		).then((res) => res.arrayBuffer()),
});

$typst.setRendererInitOptions({
	getModule: async () =>
		fetch(
			"https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.6.0/pkg/typst_ts_renderer_bg.wasm",
		).then((res) => res.arrayBuffer()),
});


function hijackPrintButton(retries = 20) {
	if (retries <= 0) {
		console.warn("⏱️ Timed out waiting for Print button.");
		return;
	}

	const printBtn = [...document.querySelectorAll("button[data-original-title]")].find(
		(btn) => btn.getAttribute("data-original-title")?.toLowerCase() === "print"
	);

	if (!printBtn) {
		setTimeout(() => hijackPrintButton(retries - 1), 100);
		return;
	}

	if ((printBtn as any)._typst_hijacked) return;
	(printBtn as any)._typst_hijacked = true;

	printBtn.addEventListener(
		"click",
		async (e) => {
			e.preventDefault();
			e.stopImmediatePropagation();

			try {
				const currentDoctype = window.cur_frm.doctype;
				const matchingFormats = await frappe.db.get_list("Print Format", {
					filters: {
						doc_type: currentDoctype,
						pdf_generator: "typst",
						disabled: 0,
					},
					fields: ["name"],
					limit: 1,
				});

				if (matchingFormats.length === 0) {
					window.cur_frm.print_doc();
					return;
				}

				const formatName = matchingFormats[0].name;
				const printFormatDoc = await frappe.db.get_doc("Print Format", formatName);
				const body = JSON.parse(printFormatDoc.print_designer_body || "[]");
				const base = JSON.parse(printFormatDoc.print_designer_settings || "{}");
				const header = JSON.parse(printFormatDoc.print_designer_header || "{}");
				const footer = JSON.parse(printFormatDoc.print_designer_footer || "{}");

				const settings = { ...base, header, footer };
				const builder = new window.TypstDocumentBuilder(settings, body);
				const typstCode = builder.build();

				const pdf = await $typst.pdf({ mainContent: typstCode });
				if (!pdf) throw new Error("No output from Typst PDF generation");

				const blob = new Blob([pdf], { type: "application/pdf" });
				const url = URL.createObjectURL(blob);
				window.open(url, "_blank");
			} catch (err) {
				console.error("❌ Typst PDF generation failed:", err);
				frappe.msgprint?.("Typst PDF failed. Falling back to default.");
				window.cur_frm.print_doc();
			}
		},
		true
	);
}

frappe.router.on("change", () => {
	if (frappe.get_route()[0] === "Form") {
		hijackPrintButton();
	}
});