import os
from pathlib import Path

import frappe
from frappe.modules.import_file import import_file_by_path

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

	for json_file_path in print_formats:
		import_file_by_path(json_file_path)
		frappe.db.commit()


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
	for folder in folders.iterdir():
		if folder.is_dir() and folder.name in frappe.get_installed_apps():
			formats.update(get_json_files(folder))
	return formats


def get_json_files(folder):
	formats = set()
	for json_file in folder.glob("*.json"):
		formats.add(json_file)
	return formats
