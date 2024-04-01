import os
import shutil

import frappe
from frappe.modules.utils import scrub
from frappe.printing.doctype.print_format.print_format import PrintFormat


class PDPrintFormat(PrintFormat):
	def export_doc(self):
		if (
			not self.standard == "Yes"
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
		with open(path, "w+") as json_file:
			json_file.write(frappe.as_json(doc_export))
		print(f"Wrote document file for {doc.doctype} {doc.name} at {path}")
		self.export_preview(folder=folder, fname=fname)

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

	def export_preview(self, folder, fname):
		if self.print_designer_preview_img:
			try:
				file = frappe.get_doc(
					"File",
					{
						"file_url": self.print_designer_preview_img,
						"attached_to_doctype": self.doctype,
						"attached_to_name": self.name,
						"attached_to_field": "print_designer_preview_img",
					},
				)
			except frappe.DoesNotExistError:
				file = None
			if not file:
				return
			file_export = file.as_dict(no_nulls=True)
			file.run_method("before_export", file_export)
			org_path = file.get_full_path()
			target_path = os.path.join(folder, org_path.split("/")[-1])
			shutil.copy2(org_path, target_path)
			print(f"Wrote preview file for {self.doctype} {self.name} at {target_path}")
			# write the data file
			path = os.path.join(folder, f"print_designer-{fname}-preview.json")
			with open(path, "w+") as json_file:
				json_file.write(frappe.as_json(file_export))
			print(f"Wrote document file for {file.doctype} {file.name} at {path}")
