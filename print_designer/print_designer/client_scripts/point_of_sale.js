// overrides the print util function that is used in the point of sale page.
// we should ideally change util function in framework to extend it. this is workaround until that.
frappe.utils.print = (doctype, docname, print_format, letterhead, lang_code) => {
	let w;
	if (frappe.model.get_value("Print Format", print_format, "print_designer")) {
		w = window.open(
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
	} else {
		w = window.open(
			frappe.urllib.get_full_url(
				"/printview?doctype=" +
					encodeURIComponent(doctype) +
					"&name=" +
					encodeURIComponent(docname) +
					"&trigger_print=1" +
					"&format=" +
					encodeURIComponent(print_format) +
					"&no_letterhead=" +
					(letterhead ? "0" : "1") +
					"&letterhead=" +
					encodeURIComponent(letterhead) +
					(lang_code ? "&_lang=" + lang_code : "")
			)
		);
	}

	if (!w) {
		frappe.msgprint(__("Please enable pop-ups"));
		return;
	}
};
