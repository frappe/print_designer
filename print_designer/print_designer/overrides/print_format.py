import os

import frappe
from frappe.modules.utils import scrub
from frappe.printing.doctype.print_format.print_format import PrintFormat


class PDPrintFormat(PrintFormat):
	def export_doc(self):
		if (
			not self.standard
			or not frappe.conf.developer_mode
			or frappe.flags.in_patch
			or frappe.flags.in_install
			or frappe.flags.in_migrate
			or frappe.flags.in_import
			or frappe.flags.in_setup_wizard
		):
			return

		if not self.print_designer:
			return super().export_doc()

		self.write_document_file()

	def write_document_file(self):
		doc = self
		doc_export = doc.as_dict(no_nulls=True)
		doc.run_method("before_export", doc_export)

		# create folder
		folder = self.create_folder(doc.doc_type, doc.name)

		fname = scrub(doc.name)

		# write the data file
		path = os.path.join(folder, f"{fname}.json")
		with open(path, "w+") as jsonfile:
			jsonfile.write(frappe.as_json(doc_export))
		print(f"Wrote document file for {doc.doctype} {doc.name} at {path}")

	def create_folder(self, dt, dn):
		app = scrub(frappe.get_doctype_app(dt))
		dn = scrub(dn)
		pd_folder = frappe.get_hooks(
			"pd_standard_format_folder", app_name=self.print_designer_template_app
		)
		if len(pd_folder) == 0:
			pd_folder = ["default_templates"]
		folder = os.path.join(
			frappe.get_app_path(self.print_designer_template_app), os.path.join(pd_folder[0], app)
		)
		frappe.create_folder(folder)
		return folder
