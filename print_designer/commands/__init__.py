import click
import frappe
from frappe.commands import pass_context
from frappe.exceptions import SiteNotSpecifiedError
from frappe.utils.bench_helper import CliCtxObj


@click.command("setup-chrome", help="setup chrome (server-side) for pdf generation")
@pass_context
def setup_chrome(context: CliCtxObj):
	from print_designer.install import setup_chromium

	if not context.sites:
		raise SiteNotSpecifiedError

	for site in context.sites:
		try:
			frappe.init(site)
			frappe.connect()
			setup_chromium()
			frappe.db.commit()
		finally:
			frappe.destroy()


commands = [setup_chrome]
