const set_template_app_options = (frm) => {
	frappe.xcall("frappe.core.doctype.module_def.module_def.get_installed_apps").then((r) => {
		frm.set_df_property("print_designer_template_app", "options", JSON.parse(r));
		if (!frm.doc.print_designer_template_app) {
			frm.set_value("print_designer_template_app", "print_designer");
		}
	});
};

frappe.ui.form.on("Print Format", {
	refresh: function (frm) {
		frm.trigger("render_buttons");
		set_template_app_options(frm);
	},
	render_buttons: function (frm) {
		frm.page.clear_inner_toolbar();
		if (!frm.is_new()) {
			if (!frm.doc.custom_format) {
				frm.add_custom_button(__("Edit Format"), function () {
					if (!frm.doc.doc_type) {
						frappe.msgprint(__("Please select DocType first"));
						return;
					}
					if (frm.doc.print_format_builder_beta) {
						frappe.set_route("print-format-builder-beta", frm.doc.name);
					} else if (frm.doc.print_designer) {
						frappe.set_route("print-designer", frm.doc.name);
					} else {
						frappe.set_route("print-format-builder", frm.doc.name);
					}
				});
			} else if (frm.doc.custom_format && !frm.doc.raw_printing) {
				frm.set_df_property("html", "reqd", 1);
			}
			if (frappe.model.can_write("Customize Form")) {
				frappe.model.with_doctype(frm.doc.doc_type, function () {
					let current_format = frappe.get_meta(frm.doc.DocType)?.default_print_format;
					if (current_format == frm.doc.name) {
						return;
					}

					frm.add_custom_button(__("Set as Default"), function () {
						frappe.call({
							method: "frappe.printing.doctype.print_format.print_format.make_default",
							args: {
								name: frm.doc.name,
							},
							callback: function () {
								frm.refresh();
							},
						});
					});
				});
			}
		}
	},
});
