import frappe


def execute():
    for name, print_format in frappe.get_all("Print Format", filters={"print_designer": 1}, fields=["name", "print_designer_settings"], as_list=1):
        print_format = frappe.parse_json(print_format)
        if print_format and "barcode" in print_format["globalStyles"]:
            print_format["globalStyles"]["barcode"]["showBarcodeText"] = True
            frappe.set_value("Print Format", name, "print_designer_settings", frappe.as_json(print_format))
