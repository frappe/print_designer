// overrides the print util function that is used in the point of sale page.
// we should ideally change util function in framework to extend it. this is workaround until that.
const original_util = frappe.utils.print;
frappe.utils.print = (doctype, docname, print_format, letterhead, lang_code) => {
	if (frappe.model.get_value("Print Format", print_format, "print_designer")) {
		let w = window.open(
			frappe.urllib.get_full_url(
				"/app/print/" +
					encodeURIComponent(doctype) +
					"/" +
					encodeURIComponent(docname) +
					"?format=" +
					encodeURIComponent(print_format) +
					"&no_letterhead=0" +
					"&trigger_print=1" +
					(lang_code ? "&_lang=" + lang_code : "")
			)
		);
		if (!w) {
			frappe.msgprint(__("Please enable pop-ups"));
			return;
		}
	} else {
		original_util(doctype, docname, print_format, letterhead, lang_code);
	}
};
