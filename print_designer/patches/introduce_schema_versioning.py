import frappe


def execute():
	"""Adds Schema Versioning for Print Designer inside Print Format Settings to handle changes that are not patchable and needs to be handled in the code"""
	print_formats = frappe.get_all(
		"Print Format",
		filters={"print_designer": 1},
		fields=["name", "print_designer_settings"],
		as_list=1,
	)
	for pf in print_formats:
		settings = frappe.parse_json(pf[1])
		if settings:
			settings["schema_version"] = "1.0.0"
			frappe.db.set_value("Print Format", pf[0], "print_designer_settings", frappe.as_json(settings))
