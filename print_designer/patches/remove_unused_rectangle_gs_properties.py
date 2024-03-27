import frappe


def execute():
	"""Remove unused style properties in globalStyles for rectangle of print formats that uses print designer"""
	print_formats = frappe.get_all(
		"Print Format",
		filters={"print_designer": 1},
		fields=["name", "print_designer_settings"],
		as_list=1,
	)
	for pf in print_formats:
		settings = frappe.parse_json(pf[1])
		if settings:
			# If globalStyles is not present, skip
			if not (gs := settings.get("globalStyles")):
				continue

			for key in ["display", "justifyContent", "alignItems", "alignContent", "flex"]:
				if gs["rectangle"]["style"].get(key, False):
					del gs["rectangle"]["style"][key]

			frappe.db.set_value("Print Format", pf[0], "print_designer_settings", frappe.as_json(settings))
