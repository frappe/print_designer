import frappe

from print_designer.custom_fields import CUSTOM_FIELDS
from print_designer.install import set_pdf_generator_option


def delete_custom_fields(custom_fields):
	"""
	:param custom_fields: a dict like `{'Sales Invoice': [{fieldname: 'test', ...}]}`
	"""

	for doctypes, fields in custom_fields.items():
		if isinstance(fields, dict):
			# only one field
			fields = [fields]

		if isinstance(doctypes, str):
			# only one doctype
			doctypes = (doctypes,)

		for doctype in doctypes:
			frappe.db.delete(
				"Custom Field",
				{
					"fieldname": ("in", [field["fieldname"] for field in fields]),
					"dt": doctype,
				},
			)

			frappe.clear_cache(doctype=doctype)


def remove_pdf_generator_option():
	set_pdf_generator_option("remove")


def before_uninstall():
	delete_custom_fields(CUSTOM_FIELDS)
	remove_pdf_generator_option()
