// Copyright (c) 2024, Frappe Technologies Pvt Ltd. and contributors
// For license information, please see license.txt

const set_template_app_options = (frm) => {
	frappe.xcall("frappe.core.doctype.module_def.module_def.get_installed_apps").then((r) => {
		frm.set_df_property("export_template_app", "options", JSON.parse(r));
		if (!frm.doc.export_template_app) {
			frm.set_value("export_template_app", "print_designer");
		}
	});
};

frappe.ui.form.on("PD Header Footer", {
	refresh(frm) {
		set_template_app_options(frm);
	},
});
