import { createApp } from "vue";
import { createPinia } from "pinia";
import Designer from "./App.vue";
class PrintDesigner {
	constructor({ wrapper, print_format }) {
		this.$wrapper = $(wrapper);
		this.print_format = print_format;
		const mountTarget = this.$wrapper.find(".layout-main-section").get(0) || this.$wrapper.get(0);
		this.app = createApp(Designer, { print_format_name: this.print_format });
		this.app.use(createPinia());
		SetVueGlobals(this.app);
		this.app.mount(mountTarget);
		const headerContainer = document.querySelector("header .container");
		if (headerContainer) {
			headerContainer.style.width = "100%";
			headerContainer.style.minWidth = "100%";
			headerContainer.style.userSelect = "none";
			this.resetHeader = () => {
				headerContainer.style.width = null;
				headerContainer.style.minWidth = null;
				headerContainer.style.userSelect = "auto";
			};
		}
		frappe.router.once("change", () => this.destroy());
	}
	destroy() {
		this.resetHeader?.();
		this.app?.unmount?.();
		this.app = null;
	}
}

frappe.provide("frappe.ui");
frappe.ui.PrintDesigner = PrintDesigner;
export default PrintDesigner;
