from typing import Literal

import frappe
from frappe.model.document import BaseDocument
from frappe.utils.jinja import get_jenv


@frappe.whitelist(allow_guest=False)
def render_user_text_withdoc(string, doctype, docname=None, row=None, send_to_jinja=None):
	if not row:
		row = {}
	if not send_to_jinja:
		send_to_jinja = {}

	if not docname or docname == "":
		return render_user_text(string=string, doc={}, row=row, send_to_jinja=send_to_jinja)
	doc = frappe.get_cached_doc(doctype, docname)
	doc.check_permission()
	return render_user_text(string=string, doc=doc, row=row, send_to_jinja=send_to_jinja)


@frappe.whitelist(allow_guest=False)
def get_meta(doctype):
	return frappe.get_meta(doctype).as_dict()


@frappe.whitelist(allow_guest=False)
def render_user_text(string, doc, row=None, send_to_jinja=None):
	if not row:
		row = {}
	if not send_to_jinja:
		send_to_jinja = {}

	jinja_vars = {}
	if isinstance(send_to_jinja, dict):
		jinja_vars = send_to_jinja
	elif send_to_jinja != "" and isinstance(send_to_jinja, str):
		try:
			jinja_vars = frappe.parse_json(send_to_jinja)
		except Exception:
			pass

	if not (isinstance(row, dict) or issubclass(row.__class__, BaseDocument)):
		if isinstance(row, str):
			try:
				row = frappe.parse_json(row)
			except Exception:
				raise TypeError("row must be a dict")
		else:
			raise TypeError("row must be a dict")

	if not issubclass(doc.__class__, BaseDocument):
		# This is when we send doc from client side as a json string
		if isinstance(doc, str):
			try:
				doc = frappe.parse_json(doc)
			except Exception:
				raise TypeError("doc must be a dict or subclass of BaseDocument")

	jenv = get_jenv()
	result = {}
	try:
		result["success"] = 1
		result["message"] = jenv.from_string(string).render({"doc": doc, "row": row, **jinja_vars})
	except Exception as e:
		"""
		string is provided by user and there is no way to know if it is correct or not so log the error from client side
		"""
		result["success"] = 0
		result["error"] = e
	return result


@frappe.whitelist(allow_guest=False)
def get_data_from_main_template(string, doctype, docname=None, settings=None):
	if not settings:
		settings = {}

	result = {}
	if string.find("send_to_jinja") == -1:
		result["success"] = 1
		result["message"] = ""
		return result
	string = string + "{{ send_to_jinja|tojson }}"
	if not isinstance(settings, dict):
		if isinstance(settings, str):
			try:
				settings = frappe.parse_json(settings)
			except Exception:
				raise TypeError("settings must be a dict")
		else:
			raise TypeError("settings must be a dict")
	if not docname or docname == "":
		doc = {}
	else:
		doc = frappe.get_cached_doc(doctype, docname)

	jenv = get_jenv()
	try:
		result["success"] = 1
		result["message"] = jenv.from_string(string).render({"doc": doc, "settings": settings}).strip()
	except Exception as e:
		"""
		string is provided by user and there is no way to know if it is correct or not
		also doc is required if used in string else it is not required so there is no way
		for us to decide whether to run this or not if doc is not available
		"""
		result["success"] = 0
		result["error"] = e

	return result


@frappe.whitelist(allow_guest=False)
def get_image_docfields():
	docfield = frappe.qb.DocType("DocField")
	image_docfields = (
		frappe.qb.from_(docfield)
		.select(
			docfield.name,
			docfield.parent,
			docfield.fieldname,
			docfield.fieldtype,
			docfield.label,
			docfield.options,
		)
		.where((docfield.fieldtype == "Image") | (docfield.fieldtype == "Attach Image"))
		.orderby(docfield.parent)
	).run(as_dict=True)
	return image_docfields


@frappe.whitelist()
def convert_css(css_obj):
	string_css = ""
	if css_obj:
		for item in css_obj.items():
			string_css += (
				"".join(["-" + i.lower() if i.isupper() else i for i in item[0]]).lstrip("-")
				+ ":"
				+ str(item[1] if item[1] != "" or item[0] != "backgroundColor" else "transparent")
				+ "!important;"
			)
	string_css += "user-select: all;"
	return string_css


@frappe.whitelist()
def convert_uom(
	number: float,
	from_uom: Literal["px", "mm", "cm", "in"] = "px",
	to_uom: Literal["px", "mm", "cm", "in"] = "px",
) -> float:
	unit_values = {
		"px": 1,
		"mm": 3.7795275591,
		"cm": 37.795275591,
		"in": 96,
	}
	from_px = (
		{
			"to_px": 1,
			"to_mm": unit_values["px"] / unit_values["mm"],
			"to_cm": unit_values["px"] / unit_values["cm"],
			"to_in": unit_values["px"] / unit_values["in"],
		},
	)
	from_mm = (
		{
			"to_mm": 1,
			"to_px": unit_values["mm"] / unit_values["px"],
			"to_cm": unit_values["mm"] / unit_values["cm"],
			"to_in": unit_values["mm"] / unit_values["in"],
		},
	)
	from_cm = (
		{
			"to_cm": 1,
			"to_px": unit_values["cm"] / unit_values["px"],
			"to_mm": unit_values["cm"] / unit_values["mm"],
			"to_in": unit_values["cm"] / unit_values["in"],
		},
	)
	from_in = {
		"to_in": 1,
		"to_px": unit_values["in"] / unit_values["px"],
		"to_mm": unit_values["in"] / unit_values["mm"],
		"to_cm": unit_values["in"] / unit_values["cm"],
	}
	converstion_factor = (
		{"from_px": from_px, "from_mm": from_mm, "from_cm": from_cm, "from_in": from_in},
	)
	return (
		f"{round(number * converstion_factor[0][f'from_{from_uom}'][0][f'to_{to_uom}'], 3)}{to_uom}"
	)


@frappe.whitelist()
def get_barcode(
	barcode_format, barcode_value, options=None, width=None, height=None, png_base64=False
):
	if not options:
		options = {}

	options = frappe.parse_json(options)

	if isinstance(barcode_value, str) and barcode_value.startswith("<svg"):
		import re

		barcode_value = re.search(r'data-barcode-value="(.*?)">', barcode_value).group(1)

	if barcode_value == "":
		fallback_html_string = """
			<div class="fallback-barcode">
				<div class="content">
					<span>No Value was Provided to Barcode</span>
				</div>
			</div>
		"""
		return {"type": "svg", "value": fallback_html_string}

	if barcode_format == "qrcode":
		return get_qrcode(barcode_value, options, png_base64)

	from io import BytesIO

	import barcode
	from barcode.writer import ImageWriter, SVGWriter

	class PDSVGWriter(SVGWriter):
		def __init__(self):
			SVGWriter.__init__(self)

		def calculate_viewbox(self, code):
			vw, vh = self.calculate_size(len(code[0]), len(code))
			return vw, vh

		def _init(self, code):
			SVGWriter._init(self, code)
			vw, vh = self.calculate_viewbox(code)
			if not width:
				self._root.removeAttribute("width")
			else:
				self._root.setAttribute("width", f"{width * 3.7795275591}")
			if not height:
				self._root.removeAttribute("height")
			else:
				print(height)
				self._root.setAttribute("height", height)

			self._root.setAttribute("viewBox", f"0 0 {vw * 3.7795275591} {vh * 3.7795275591}")

	if barcode_format not in barcode.PROVIDED_BARCODES:
		return (
			f"Barcode format {barcode_format} not supported. Valid formats are: {barcode.PROVIDED_BARCODES}"
		)
	writer = ImageWriter() if png_base64 else PDSVGWriter()
	barcode_class = barcode.get_barcode_class(barcode_format)

	try:
		barcode = barcode_class(barcode_value, writer)
	except Exception:
		frappe.msgprint(
			f"Invalid barcode value <b>{barcode_value}</b> for format <b>{barcode_format}</b>",
			raise_exception=True,
			alert=True,
			indicator="red",
		)

	stream = BytesIO()
	barcode.write(stream, options)
	barcode_value = stream.getvalue().decode("utf-8")
	stream.close()

	if png_base64:
		import base64

		barcode_value = base64.b64encode(barcode_value)

	return {"type": "png_base64" if png_base64 else "svg", "value": barcode_value}


def get_qrcode(barcode_value, options=None, png_base64=False):
	from io import BytesIO

	import pyqrcode

	if not options:
		options = {}

	options = frappe.parse_json(options)
	options = {
		"scale": options.get("scale", 5),
		"module_color": options.get("module_color", "#000000"),
		"background": options.get("background", "#ffffff"),
		"quiet_zone": options.get("quiet_zone", 1),
	}
	qr = pyqrcode.create(barcode_value)
	stream = BytesIO()
	if png_base64:
		qrcode_svg = qr.png_as_base64_str(**options)
	else:
		options.update(
			{"svgclass": "print-qrcode", "lineclass": "print-qrcode-path", "omithw": True, "xmldecl": False}
		)
		qr.svg(stream, **options)
		qrcode_svg = stream.getvalue().decode("utf-8")
		stream.close()

	return {"type": "png_base64" if png_base64 else "svg", "value": qrcode_svg}
