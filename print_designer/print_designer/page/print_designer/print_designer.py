from typing import Literal
import frappe

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
				+ str(item[1])
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
	return f"{round(number * converstion_factor[0][f'from_{from_uom}'][0][f'to_{to_uom}'], 3)}{to_uom}"


@frappe.whitelist()
def get_barcode(barcode_format, barcode_value, options={}, width=None, height=None, png_base64=False):
	options = frappe.parse_json(options)

	if (isinstance(barcode_value, str) and barcode_value.startswith("<svg")):
		import re
		barcode_value = re.search(r'data-barcode-value="(.*?)">', barcode_value).group(1)
	
	if barcode_format == "qrcode": return get_qrcode(barcode_value, options, png_base64)
	
	import barcode
	from barcode.writer import ImageWriter, SVGWriter
	from io import BytesIO

	class PDSVGWriter(SVGWriter):
		def __init__(self):
			SVGWriter.__init__(self)

		def calculate_viewbox(self, code):
			vw, vh = self.calculate_size(len(code[0]), len(code), self.dpi)
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
		return f"Barcode format {barcode_format} not supported. Valid formats are: {barcode.PROVIDED_BARCODES}"
	writer = ImageWriter() if png_base64 else PDSVGWriter()	
	barcode_class = barcode.get_barcode_class(barcode_format)

	try:
		barcode = barcode_class(barcode_value, writer)
	except:
		frappe.msgprint(f"Invalid barcode value <b>{barcode_value}</b> for format <b>{barcode_format}</b>", raise_exception=True, alert=True, indicator="red")

	stream = BytesIO()
	barcode.write(stream, options)
	barcode_value = stream.getvalue().decode('utf-8')
	stream.close()

	if png_base64:
		import base64
		barcode_value = base64.b64encode(barcode_value)
	
	return { "type": "png_base64" if png_base64 else "svg", "value": barcode_value }


def get_qrcode(barcode_value, options={}, png_base64=False):
	import pyqrcode
	from io import BytesIO
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
		options.update({
			"svgclass": "print-qrcode",
			"lineclass": "print-qrcode-path",
			"omithw": True,
			"xmldecl": False
		})
		qr.svg(stream, **options)
		qrcode_svg = stream.getvalue().decode('utf-8')
		stream.close()

	return { "type": "png_base64" if png_base64 else "svg", "value": qrcode_svg}