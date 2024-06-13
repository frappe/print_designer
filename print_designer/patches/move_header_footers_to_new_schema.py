import frappe

from print_designer.pdf import is_older_schema


def patch_format():
	print_formats = frappe.get_all(
		"Print Format",
		filters={"print_designer": 1},
		fields=[
			"name",
			"print_designer_header",
			"print_designer_body",
			"print_designer_after_table",
			"print_designer_footer",
			"print_designer_print_format",
			"print_designer_settings",
		],
	)
	for pf in print_formats:
		settings = frappe.json.loads(pf.print_designer_settings or "{}")

		header_childrens = frappe.json.loads(pf.print_designer_header or "[]")
		header_data = [
			{
				"type": "page",
				"childrens": header_childrens,
				"firstPage": True,
				"oddPage": True,
				"evenPage": True,
				"lastPage": True,
			}
		]

		footer_childrens = frappe.json.loads(pf.print_designer_footer or "[]")
		footer_data = [
			{
				"type": "page",
				"childrens": footer_childrens,
				"firstPage": True,
				"oddPage": True,
				"evenPage": True,
				"lastPage": True,
			}
		]
		for child in footer_childrens:
			child["startY"] -= (
				settings["page"].get("height", 0)
				- settings["page"].get("marginTop", 0)
				- settings["page"].get("footerHeight", 0)
			)

		childrens = frappe.json.loads(pf.print_designer_body or "[]")
		bodyPage = [
			{
				"index": 0,
				"type": "page",
				"childrens": childrens,
				"isDropZone": True,
			}
		]
		object_to_save = {
			"print_designer_header": frappe.json.dumps(header_data),
			"print_designer_body": frappe.json.dumps(bodyPage),
			"print_designer_footer": frappe.json.dumps(footer_data),
			"print_designer_settings": frappe.json.dumps(settings),
		}
		if not is_older_schema(settings=settings, current_version="1.1.0"):
			pf_print_format = frappe.json.loads(pf.print_designer_print_format)
			if "header" in pf_print_format:
				pf_print_format["header"] = {
					"firstPage": pf_print_format["header"],
					"oddPage": pf_print_format["header"],
					"evenPage": pf_print_format["header"],
					"lastPage": pf_print_format["header"],
				}
			if "footer" in pf_print_format:
				pf_print_format["footer"] = {
					"firstPage": pf_print_format["footer"],
					"oddPage": pf_print_format["footer"],
					"evenPage": pf_print_format["footer"],
					"lastPage": pf_print_format["footer"],
				}
			object_to_save["print_designer_print_format"] = frappe.json.dumps(pf_print_format)

		frappe.set_value(
			"Print Format",
			pf.name,
			object_to_save,
		)
	return print_formats


def execute():
	"""Moved header and footer to new schema."""
	patch_format()
