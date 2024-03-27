import frappe

from print_designer.patches.patch_utils import patch_formats


def execute():
	"""Add altStyle object for alternate rows in table elements and in globalStyles of print formats that uses print designer"""
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

			gs["table"]["altStyle"] = {}
			frappe.db.set_value("Print Format", pf[0], "print_designer_settings", frappe.as_json(settings))

	def element_callback(el):
		el["altStyle"] = {}

	patch_formats(
		{"element": element_callback},
		types=["table"],
	)
