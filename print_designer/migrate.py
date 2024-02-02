import click
import frappe


def after_migrate():
	if bool(frappe.db.exists("DocField", {"parent": "Print Format", "fieldname": "print_from_file"})):
		frappe.modules.patch_handler.run_single(
			"print_designer.patches.set_print_format_print_from_file_as_false"
		)
	else:
		click.secho(
			"Please Update to Latest Framework Version to use Standard Print Formats created using Print Designer",
			fg="yellow",
		)
