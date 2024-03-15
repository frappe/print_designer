import click
import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

from print_designer.custom_fields import CUSTOM_FIELDS
from print_designer.default_formats import install_default_formats, on_print_designer_install


def check_frappe_version():
	def major_version(v: str) -> str:
		return v.split(".")[0]

	frappe_version = major_version(frappe.__version__)
	if int(frappe_version) >= 15:
		return

	click.secho(
		f"You're attempting to install Print Designer with Frappe version {frappe_version}. "
		"This is not supported and will result in broken install. Please install it using Version 15 or Develop branch.",
		fg="red",
	)
	raise SystemExit(1)


def before_install():
	check_frappe_version()


def after_install():
	create_custom_fields(CUSTOM_FIELDS, ignore_validate=True)
	on_print_designer_install()


def after_app_install(app):
	if app != "print_designer":
		install_default_formats(app)
