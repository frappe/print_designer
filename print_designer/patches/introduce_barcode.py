import frappe


def execute():
	"""Adds globalStyles for barcode for all print formats that uses print designer"""
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
			gs["barcode"] = {
				"isGlobalStyle": True,
				"barcodeFormat": "qrcode",
				"styleEditMode": "main",
				"type": "barcode",
				"isDynamic": False,
				"mainRuleSelector": ".barcode",
				"style": {
					"display": "block",
					"border": "none",
					"borderWidth": "0px",
					"borderColor": "#000000",
					"borderStyle": "solid",
					"borderRadius": 0,
					"backgroundColor": "",
					"paddingTop": "0px",
					"paddingBottom": "0px",
					"paddingLeft": "0px",
					"paddingRight": "0px",
					"margin": "0px",
					"minWidth": "0px",
					"minHeight": "0px",
					"boxShadow": "none",
					"whiteSpace": "normal",
					"userSelect": "none",
					"opacity": 1,
				},
			}
			frappe.db.set_value("Print Format", pf[0], "print_designer_settings", frappe.as_json(settings))
