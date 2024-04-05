import os
import shutil
from pathlib import Path

import frappe
from frappe.modules.import_file import import_file_by_path
from frappe.utils import get_files_path

"""
features:
	- Print Designer App can have default formats for all installed apps.
	- Any Custom/Standard App can have default formats for any installed apps
	  ( This will only install formats if print_designer is installed ).
	- This will be useful when we have standalone formats that can be used without print designer app.

when print_designer app is installed
	- get hooks from all installed apps including pd and load default formats from defined folders.

when any new app is installed
	- if exists in print_designer/default_templates, load default formats for newly installed app.
	- get hooks from new app and load default formats for all installed apps from app's format dir.
"""

# TODO: handle override of default formats from different apps or even Custom Formats with same name.

# add default formats for all installed apps.
def on_print_designer_install():
	for app in frappe.get_installed_apps():
		install_default_formats(app=app, load_pd_formats=False)


def get_preview_image_folder_path(print_format):
	app = frappe.scrub(frappe.get_doctype_app(print_format.doc_type))
	pd_folder = frappe.get_hooks(
		"pd_standard_format_folder", app_name=print_format.print_designer_template_app
	)
	if len(pd_folder) == 0:
		pd_folder = ["default_templates"]
	return os.path.join(
		frappe.get_app_path(print_format.print_designer_template_app), os.path.join(pd_folder[0], app)
	)


def update_preview_img(file):
	print_format = frappe.get_doc(file.attached_to_doctype, file.attached_to_name)
	folder = get_preview_image_folder_path(print_format)
	file_name = print_format.print_designer_preview_img.split("/")[-1]
	org_path = os.path.join(folder, file_name)
	target_path = get_files_path(file_name, is_private=1)
	shutil.copy2(org_path, target_path)


# called after install of any new app.
def install_default_formats(app, filter_by="", load_pd_formats=True):
	if load_pd_formats:
		# load formats from print_designer app if some new app is installed and have default formats
		install_default_formats(app="print_designer", filter_by=app, load_pd_formats=False)

	# get dir path and load formats from installed app
	pd_folder = frappe.get_hooks("pd_standard_format_folder", app_name=app)
	if len(pd_folder) == 0:
		return

	print_formats = get_filtered_formats_by_app(
		app=app, templates_folder=pd_folder[0], filter_by=filter_by
	)

	# preview_files = [f for f in print_formats if f.name.endswith("-preview.json")]
	print_formats = [f for f in print_formats if not f.name.endswith("-preview.json")]

	for json_file_path in print_formats:
		import_file_by_path(path=json_file_path)
		frappe.db.commit()
	# TODO: enable this after this is released in v15 https://github.com/frappe/frappe/pull/25779
	# for json_file_path in preview_files:
	# 	import_file_by_path(path=json_file_path, pre_process=update_preview_img)
	# 	frappe.db.commit()

	# for pf in frappe.db.get_all("Print Format", filters={"standard": "Yes", "print_designer": 1}):
	# 	updated_url = frappe.db.get_value(
	# 		"File",
	# 		{
	# 			"attached_to_doctype": "Print Format",
	# 			"attached_to_name": pf.name,
	# 			"attached_to_field": "print_designer_preview_img",
	# 		},
	# 		"file_url",
	# 	)
	# 	if updated_url:
	# 		frappe.set_value("Print Format", pf.name, "print_designer_preview_img", updated_url)


def get_filtered_formats_by_app(app, templates_folder, filter_by=""):
	app_path = frappe.get_app_path(app)
	if filter_by == "":
		folders = Path(os.path.join(app_path, templates_folder))
		return get_formats_from_folders(folders=folders)
	else:
		folder = Path(os.path.join(app_path, templates_folder, filter_by))
		return get_json_files(folder)


def get_formats_from_folders(folders):
	formats = set()
	if not folders.exists():
		return formats
	for folder in folders.iterdir():
		if folder.is_dir() and folder.name in frappe.get_installed_apps():
			formats.update(get_json_files(folder))
	return formats


def get_json_files(folder):
	formats = set()
	for json_file in folder.glob("*.json"):
		formats.add(json_file)
	return formats
