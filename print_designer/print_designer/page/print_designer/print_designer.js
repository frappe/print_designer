frappe.pages["print-designer"].on_page_load = function (wrapper) {
	// hot reload in development
	if (frappe.boot.developer_mode) {
		frappe.hot_update = frappe.hot_update || [];
		frappe.hot_update.push(() => load_print_designer(wrapper));
	}
};

frappe.pages["print-designer"].on_page_show = function (wrapper) {
	load_print_designer(wrapper);
};

const printDesignerDialog = () => {
	let d = new frappe.ui.Dialog({
		title: __("Create or Edit Print Format"),
		fields: [
			{
				label: __("Action"),
				fieldname: "action",
				fieldtype: "Select",
				options: [
					{ label: __("Create New"), value: "Create" },
					{ label: __("Edit Existing"), value: "Edit" },
				],
				change() {
					let action = d.get_value("action");
					d.get_primary_btn().text(action === "Create" ? __("Create") : __("Edit"));
				},
			},
			{
				label: __("Select Document Type"),
				fieldname: "doctype",
				fieldtype: "Link",
				options: "DocType",
				filters: {
					istable: 0,
				},
				reqd: 1,
				default: frappe.route_options ? frappe.route_options.doctype : null,
			},
			{
				label: __("Print Format Name"),
				fieldname: "print_format_name",
				fieldtype: "Data",
				depends_on: (doc) => doc.action === "Create",
				mandatory_depends_on: (doc) => doc.action === "Create",
			},
			{
				label: __("Select Print Format"),
				fieldname: "print_format",
				fieldtype: "Link",
				options: "Print Format",
				only_select: 1,
				depends_on: (doc) => doc.action === "Edit",
				get_query() {
					return {
						filters: {
							doc_type: d.get_value("doctype"),
							print_designer: 1,
						},
					};
				},
				mandatory_depends_on: (doc) => doc.action === "Edit",
			},
		],
		static: true,
		primary_action_label: __("Edit"),
		primary_action({ action, doctype, print_format, print_format_name }) {
			if (action === "Edit") {
				frappe.set_route("print-designer", print_format);
			} else if (action === "Create") {
				d.get_primary_btn().prop("disabled", true);
				frappe.db
					.insert({
						doctype: "Print Format",
						name: print_format_name,
						doc_type: doctype,
						print_designer: 1,
						print_designer_header: JSON.stringify([
							{
								type: "page",
								childrens: [],
								firstPage: true,
								oddPage: true,
								evenPage: true,
								lastPage: true,
								DOMRef: null,
							},
						]),
						print_designer_body: JSON.stringify([
							{
								type: "page",
								index: 0,
								DOMRef: null,
								isDropZone: true,
								childrens: [],
							},
						]),
						print_designer_footer: JSON.stringify([
							{
								type: "page",
								childrens: [],
								firstPage: true,
								oddPage: true,
								evenPage: true,
								lastPage: true,
								DOMRef: null,
							},
						]),
					})
					.then((doc) => {
						// Incase Route is Same, set_route() is needed to refresh.
						set_current_doc(doc.name).then(() => {
							frappe.set_route("print-designer", doc.name);
						});
					})
					.finally(() => {
						d.get_primary_btn().prop("disabled", false);
					});
			}
		},
		secondary_action_label: __("Exit"),
		secondary_action() {
			let prev_route = frappe.get_prev_route();
			prev_route.length ? frappe.set_route(...prev_route) : frappe.set_route();
		},
	});
	return d;
};

const set_current_doc = async (format_name) => {
	let currentDoc = null;
	let doctype = await frappe.db.get_value("Print Format", format_name, "doc_type");
	doctype = doctype.message?.doc_type;
	let route_history = [
		...frappe.route_history.filter(
			(r) => ["print", "Form"].indexOf(r[0]) != -1 && r[1] == doctype
		),
	].reverse();
	if (route_history.length) {
		currentDoc = route_history[0][2];
	}
	if (!currentDoc) return;
	let isdocvalid = await frappe.db.exists(doctype, currentDoc);
	if (!isdocvalid) return;
	let settings = await frappe.db.get_value(
		"Print Format",
		format_name,
		"print_designer_settings"
	);
	if (!settings.message?.print_designer_settings) return;
	settings = JSON.parse(settings.message.print_designer_settings);
	settings["currentDoc"] = currentDoc;
	await frappe.db.set_value(
		"Print Format",
		format_name,
		"print_designer_settings",
		JSON.stringify(settings)
	);
};

const load_print_designer = async (wrapper) => {
	let route = frappe.get_route();
	let $parent = $(wrapper);
	let is_print_format;
	let message = `Print Format <b>${route[1]}</b> not found. <hr/> Would you like to Create or Edit other Print Format?`;

	if (route.length > 1 && route[1].length) {
		is_print_format = await frappe.db.get_value("Print Format", route[1], "print_designer");
		if (typeof is_print_format.message.print_designer == "number") {
			is_print_format = is_print_format.message.print_designer;
			message = `Print Format <b>${route[1]}</b> is not made using Print Designer. <hr/> Would you like to Create or Edit other Print Format?`;
		} else {
			is_print_format = false;
		}
	}
	if (route.length > 1 && route[1].length) {
		if (is_print_format) {
			await set_current_doc(route[1]);
			await frappe.require("print_designer.bundle.js");
			frappe.print_designer = new frappe.ui.PrintDesigner({
				wrapper: $parent,
				print_format: route[1],
			});
		} else {
			frappe.confirm(
				message,
				() => {
					let d = printDesignerDialog();
					if (typeof is_print_format == "number") {
						d.set_value("action", "Create");
					} else {
						d.set_value("action", "Edit");
					}
				},
				() => {
					let prev_route = frappe.get_prev_route();
					prev_route.length ? frappe.set_route(...prev_route) : frappe.set_route();
				}
			);
		}
	} else {
		let d = printDesignerDialog();
		d.set_value("action", "Create");
	}
};
