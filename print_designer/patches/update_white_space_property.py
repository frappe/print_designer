import frappe


def execute():
	"""Updates white-space style property in globalStyles of print formats that uses print designer"""
	print_formats = frappe.get_all(
		"Print Format",
		filters={"print_designer": 1},
		fields=["name", "print_designer_settings"],
		as_list=1,
	)
	for pf in print_formats:
		settings = frappe.parse_json(pf[1])
		if settings:
			gs = settings["globalStyles"]
			for type in ["staticText", "dynamicText", "rectangle", "image", "table"]:
				if gs.get(type).get("style"):
					gs[type]["style"]["whiteSpace"] = "normal"
				if gs.get(type).get("labelStyle"):
					gs[type]["labelStyle"]["whiteSpace"] = "normal"
				if gs.get(type).get("headerStyle"):
					gs[type]["headerStyle"]["whiteSpace"] = "normal"
			frappe.db.set_value("Print Format", pf[0], "print_designer_settings", frappe.as_json(settings))
