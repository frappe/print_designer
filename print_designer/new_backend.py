import time

import frappe

from print_designer.pdf import measure_time
from print_designer.pdf_generator.browser import Browser
from print_designer.pdf_generator.generator import FrappePDFGenerator
from print_designer.pdf_generator.pdf_merge import PDFTransformer


def before_request():
	new_pdf_backend = frappe.request.args.get(
		"force_new_backend",
		frappe.get_cached_value(
			"Print Format", frappe.request.args.get("format", "Standard"), "new_pdf_backend"
		),
	)
	if (
		frappe.request.path == "/api/method/frappe.utils.print_format.download_pdf" and new_pdf_backend
	):
		# Initialize the browser
		FrappePDFGenerator()
		return


def after_request():
	if (
		frappe.request.path == "/api/method/frappe.utils.print_format.download_pdf"
		and FrappePDFGenerator._instance
	):
		# Not Heavy operation as if proccess is not available it returns
		if not FrappePDFGenerator().USE_PERSISTENT_CHROMIUM:
			FrappePDFGenerator()._close_browser()


@measure_time
def get_pdf(print_format, html, options, output, new_pdf_backend=True):
	# scrubbing url to expand url is not required as we have set url.
	# also, planning to remove network requests anyway 🤞
	generator = FrappePDFGenerator()
	browser = Browser(generator, print_format, html, options, output, new_pdf_backend)
	transformer = PDFTransformer(browser)
	# transforms and merges header, footer into body pdf and returns merged pdf
	return transformer.transform_pdf()
