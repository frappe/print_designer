import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	"""Add print_designer_print_format field for Print Format."""
	CUSTOM_FIELDS = {
		"Print Format": [
			{
				"fieldname": "print_designer_print_format",
				"fieldtype": "JSON",
				"hidden": 1,
				"label": "Print Designer Print Format",
				"description": "This has json object that is used by jinja template to render the print format.",
			}
		]
	}
	create_custom_fields(CUSTOM_FIELDS, ignore_validate=True)
