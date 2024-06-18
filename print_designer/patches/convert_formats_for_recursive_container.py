import frappe

from print_designer.pdf import is_older_schema


def patch_format():
	print_formats = frappe.get_all(
		"Print Format",
		filters={"print_designer": 1},
		fields=[
			"name",
			"print_designer_print_format",
			"print_designer_settings",
		],
	)
	for pf in print_formats:
		settings = frappe.json.loads(pf.print_designer_settings or "{}")
		if not is_older_schema(settings=settings, current_version="1.1.0") and is_older_schema(
			settings=settings, current_version="1.3.0"
		):
			pf_print_format = frappe.json.loads(pf.print_designer_print_format or "{}")

			if pf_print_format.get("header", False):
				if type(pf_print_format["header"]) == list:
					# issue #285
					pf_print_format["header"] = {
						"firstPage": pf_print_format["header"],
						"oddPage": pf_print_format["header"],
						"evenPage": pf_print_format["header"],
						"lastPage": pf_print_format["header"],
					}
				for headerType in ["firstPage", "oddPage", "evenPage", "lastPage"]:
					for row in pf_print_format["header"][headerType]:
						row["layoutType"] = "row"
						for column in row["childrens"]:
							column["layoutType"] = "column"

			if pf_print_format.get("footer", False):
				if type(pf_print_format["footer"]) == list:
					# issue #285
					pf_print_format["footer"] = {
						"firstPage": pf_print_format["footer"],
						"oddPage": pf_print_format["footer"],
						"evenPage": pf_print_format["footer"],
						"lastPage": pf_print_format["footer"],
					}
				for footerType in ["firstPage", "oddPage", "evenPage", "lastPage"]:
					for row in pf_print_format["footer"][footerType]:
						row["layoutType"] = "row"
						for column in row["childrens"]:
							column["layoutType"] = "column"

			if pf_print_format.get("body", False):
				for row in pf_print_format["body"]:
					row["layoutType"] = "row"
					for column in row["childrens"]:
						column["layoutType"] = "column"
				# body elements should be inside page object forgot to add it in patch move_header_footers_to_new_schema
				pf_print_format["body"] = [
					{
						"index": 0,
						"type": "page",
						"childrens": pf_print_format["body"],
						"isDropZone": True,
					}
				]

			frappe.set_value(
				"Print Format",
				pf.name,
				{"print_designer_print_format": frappe.json.dumps(pf_print_format)},
			)

	return print_formats


def execute():
	"""add layoutType to rows and columns in old print formats."""
	patch_format()
