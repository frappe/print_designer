import { createApp } from "vue";
import { createPinia } from "pinia";
import Designer from "./App.vue";
class PrintDesigner {
	constructor({ wrapper, print_format }) {
		this.$wrapper = $(wrapper);
		this.print_format = print_format;
		const app = createApp(Designer, { print_format_name: this.print_format });
		app.use(createPinia());
		SetVueGlobals(app);
		app.mount(this.$wrapper.get(0));
		let headerContainer = document.querySelector("header .container");
		headerContainer.style.width = "100%";
		headerContainer.style.minWidth = "100%";
		headerContainer.style.userSelect = "none";
		frappe.router.once("change", () => {
			headerContainer.style.width = null;
			headerContainer.style.minWidth = null;
			headerContainer.style.userSelect = "auto";
			app.unmount();
		});
	}
}

frappe.provide("frappe.ui");
frappe.ui.PrintDesigner = PrintDesigner;
export default PrintDesigner;
