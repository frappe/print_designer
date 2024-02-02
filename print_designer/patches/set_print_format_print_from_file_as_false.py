import frappe


def execute():
	"""Update print_from_file to 0 for all print formats created with print_designer."""
	# This is called from after_migrate hook, because we need to run this conditionally
	print_formats = frappe.get_all(
		"Print Format",
		filters={"print_designer": 1, "Standard": "Yes"},
		fields=["name"],
	)
	for pf in print_formats:
		frappe.db.set_value("Print Format", pf.name, "print_from_file", 0)
