from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

from print_designer.custom_fields import CUSTOM_FIELDS


def custom_field_patch():
	create_custom_fields(CUSTOM_FIELDS, ignore_validate=True)
