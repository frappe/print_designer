import frappe;
from typing import Literal
@frappe.whitelist(allow_guest=False)
def get_image_docfields():
	docfield = frappe.qb.DocType('DocField')
	image_docfields = (
		frappe.qb.from_(docfield)
			.select(docfield.name, docfield.parent, docfield.fieldname, docfield.fieldtype, docfield.label, docfield.options)
			.where((docfield.fieldtype == 'Image') | (docfield.fieldtype == 'Attach Image'))
			.orderby(docfield.parent)
	).run(as_dict=True)
	return image_docfields;
@frappe.whitelist()
def convert_css(css_obj):
	string_css = "";
	if css_obj:
		for item in css_obj.items():
			string_css += ''.join(['-'+i.lower() if i.isupper()
				else i for i in item[0]]).lstrip('-') + ":" + str(item[1]) + "!important;"
	string_css += "user-select: all;"
	return string_css

@frappe.whitelist()
def convert_uom(number: float, from_uom: Literal["px", "mm", "cm", "in"] = "px", to_uom: Literal["px", "mm", "cm", "in"] = "px") -> float:
	unit_values = {
		"px": 1,
		"mm": 3.7795275591,
		"cm": 37.795275591,
		"in": 96,
	}
	from_px = {
		"to_px": 1,
		"to_mm": unit_values["px"] / unit_values["mm"],
		"to_cm": unit_values["px"] / unit_values["cm"],
		"to_in": unit_values["px"] / unit_values["in"]
	},
	from_mm = {
		"to_mm": 1,
		"to_px": unit_values["mm"] / unit_values["px"],
		"to_cm": unit_values["mm"] / unit_values["cm"],
		"to_in": unit_values["mm"] / unit_values["in"],
	},
	from_cm = {
		"to_cm": 1,
		"to_px": unit_values["cm"] / unit_values["px"],
		"to_mm": unit_values["cm"] / unit_values["mm"],
		"to_in": unit_values["cm"] / unit_values["in"],
	},
	from_in = {
		"to_in": 1,
		"to_px": unit_values["in"] / unit_values["px"],
		"to_mm": unit_values["in"] / unit_values["mm"],
		"to_cm": unit_values["in"] / unit_values["cm"],
	}
	converstion_factor = {
		"from_px": from_px,
		"from_mm": from_mm,
		"from_cm": from_cm,
		"from_in": from_in
	},
	return f"{round(number * converstion_factor[0][f'from_{from_uom}'][0][f'to_{to_uom}'], 3)}{to_uom}";