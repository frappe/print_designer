import frappe
import os
from frappe.utils.data import cint

from print_designer.pdf_generator.typst_generator import generate_typst_pdf
from print_designer.pdf import measure_time
from print_designer.pdf_generator.browser import Browser
from print_designer.pdf_generator.generator import FrappePDFGenerator
from print_designer.pdf_generator.pdf_merge import PDFTransformer


def before_request():
	if frappe.request.path == "/api/method/frappe.utils.print_format.download_pdf":
		frappe.local.form_dict.pdf_generator = (
			frappe.request.args.get(
				"pdf_generator",
				frappe.get_cached_value(
					"Print Format", frappe.request.args.get("format"), "pdf_generator"
				),
			)
			or "wkhtmltopdf"
		)
		if frappe.local.form_dict.pdf_generator == "chrome":
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
def get_pdf(print_format, html, options, output, pdf_generator=None):
	# Check if Typst engine directory is present in the app
	typst_js_path = os.path.join(
		frappe.get_app_path("print_designer"), "public", "js", "typst"
	)

	# Hijack Chrome requests if Typst engine is available
	# Until a plugable print format engine is added to Frappe.
	if pdf_generator == "chrome" and os.path.isdir(typst_js_path):
		return generate_typst_pdf(print_format, html, options, output)

	# Fall back to Chromium-based generation
	generator = FrappePDFGenerator()
	browser = Browser(generator, print_format, html, options)
	transformer = PDFTransformer(browser)
	return transformer.transform_pdf(output=output)
