import hashlib
import html
import json
import re
import time

import frappe
from bs4 import BeautifulSoup
from frappe.monitor import add_data_to_monitor
from frappe.utils.data import get_url
from frappe.utils.error import log_error
from frappe.utils.jinja_globals import is_rtl
from frappe.utils.pdf import pdf_body_html as fw_pdf_body_html


def _get_pdf_generator(print_format=None) -> str:
	return (
		frappe.form_dict.get("pdf_generator")
		or (getattr(print_format, "pdf_generator", None) if print_format else None)
		or "wkhtmltopdf"
	)


def _append_style(style: str | None, extra: str) -> str:
	style = (style or "").strip()
	if style and not style.endswith(";"):
		style += ";"
	return f"{style} {extra}".strip()


def _is_probable_letterhead_image(img) -> bool:
	# Explicit wrappers used by print formats
	for parent in [img, *img.parents]:
		classes = parent.get("class", []) if getattr(parent, "get", None) else []
		if any(c in {"letter-head", "letter-head-footer"} for c in classes):
			return True

	# Legacy/generated letter head HTML usually carries width/height attrs
	if img.get("width") or img.get("height"):
		return True

	# Existing patched variants often have these markers in inline style
	style = (img.get("style") or "").lower()
	if "max-height" in style or "max-width" in style:
		return True

	return False


def _normalize_letterhead_images_for_chrome(content, html_id: str | None = None):
	if not content:
		return content

	for img in content.find_all("img"):
		if not _is_probable_letterhead_image(img):
			continue

		raw_width_attr = img.get("width")
		raw_height_attr = img.get("height")
		existing_style = img.get("style") or ""

		# Prefer explicit Letter Head doctype dimensions/alignment when available.
		# Works for both generated and manually edited legacy HTML when alt carries doc name.
		max_width_css = None
		max_height_css = None
		align_value = "left"
		if letterhead_name := (img.get("alt") or "").strip():
			if frappe.db.exists("Letter Head", letterhead_name):
				if html_id == "footer-html":
					w = frappe.db.get_value("Letter Head", letterhead_name, "footer_image_width") or 0
					h = frappe.db.get_value("Letter Head", letterhead_name, "footer_image_height") or 0
					align_db = frappe.db.get_value("Letter Head", letterhead_name, "footer_align")
				else:
					w = frappe.db.get_value("Letter Head", letterhead_name, "image_width") or 0
					h = frappe.db.get_value("Letter Head", letterhead_name, "image_height") or 0
					align_db = frappe.db.get_value("Letter Head", letterhead_name, "align")

				if w and w > 0:
					max_width_css = f"{w}px"
				if h and h > 0:
					max_height_css = f"{h}px"
				if align_db:
					align_value = str(align_db).lower()

		# Preserve explicit configured constraints from legacy HTML
		# (e.g. width="150" or style="width: 150px") as max constraints.
		if raw_width_attr and not max_width_css:
			max_width_css = f"{raw_width_attr}px" if str(raw_width_attr).isdigit() else str(raw_width_attr)
		if raw_height_attr and not max_height_css:
			max_height_css = (
				f"{raw_height_attr}px" if str(raw_height_attr).isdigit() else str(raw_height_attr)
			)

		if not max_width_css:
			if m := re.search(r"(?:^|;)\s*max-width\s*:\s*([^;]+)", existing_style, flags=re.I):
				max_width_css = m.group(1).strip()
			elif m := re.search(r"(?:^|;)\s*width\s*:\s*([^;]+)", existing_style, flags=re.I):
				max_width_css = m.group(1).strip()

		if not max_height_css:
			if m := re.search(r"(?:^|;)\s*max-height\s*:\s*([^;]+)", existing_style, flags=re.I):
				max_height_css = m.group(1).strip()
			elif m := re.search(r"(?:^|;)\s*height\s*:\s*([^;]+)", existing_style, flags=re.I):
				max_height_css = m.group(1).strip()

		# Do not force fixed bitmap dimensions in chromium header/footer rendering.
		img.attrs.pop("width", None)
		img.attrs.pop("height", None)

		size_constraints = "max-width:100% !important;"
		if max_width_css:
			size_constraints = f"max-width:{max_width_css} !important;"
		if max_height_css:
			size_constraints += f" max-height:{max_height_css} !important;"

		img_align_style = "margin-left:0 !important; margin-right:auto !important;"
		if align_value == "center":
			img_align_style = "margin-left:auto !important; margin-right:auto !important;"
		elif align_value == "right":
			img_align_style = "margin-left:auto !important; margin-right:0 !important;"

		img["style"] = _append_style(
			existing_style,
			f"width:auto !important; height:auto !important; {size_constraints} object-fit:contain; display:block; {img_align_style}",
		)

		# Ensure container can align image predictably.
		parent = img.parent
		if getattr(parent, "get", None):
			parent["style"] = _append_style(parent.get("style"), f"width:100%; text-align:{align_value};")

	return content


def pdf_header_footer_html(soup, head, content, styles, html_id, css):
	if soup.find(id="__print_designer"):
		if frappe.form_dict.get("pdf_generator", "wkhtmltopdf") == "chrome":
			path = "print_designer/page/print_designer/jinja/header_footer.html"
		else:
			path = "print_designer/page/print_designer/jinja/header_footer_old.html"
		try:
			return frappe.render_template(
				path,
				{
					"head": head,
					"content": content,
					"styles": styles,
					"html_id": html_id,
					"css": css,
					"headerFonts": soup.find(id="headerFontsLinkTag"),
					"footerFonts": soup.find(id="footerFontsLinkTag"),
					"lang": frappe.local.lang,
					"layout_direction": "rtl" if is_rtl() else "ltr",
				},
			)
		except Exception as e:
			error = log_error(title=e, reference_doctype="Print Format")
			frappe.throw(
				msg=f"Something went wrong ( Error ) : If you don't know what just happened, and wish to file a ticket or issue on github, please copy the error from <b>Error Log {error.name}</b> or ask Administrator.",
				exc=e,
			)
	else:
		from frappe.utils.pdf import pdf_footer_html, pdf_header_html

		# same default path is defined in fw pdf_header_html function if no path is passed it will use default path
		path = "templates/print_formats/pdf_header_footer.html"
		if frappe.local.form_dict.get("pdf_generator", "wkhtmltopdf") == "chrome":
			path = "print_designer/pdf_generator/framework fromats/pdf_header_footer_chrome.html"
			content = _normalize_letterhead_images_for_chrome(content, html_id=html_id)

		if html_id == "header-html":
			return pdf_header_html(
				soup=soup,
				head=head,
				content=content,
				styles=styles,
				html_id=html_id,
				css=css,
				path=path,
			)
		elif html_id == "footer-html":
			return pdf_footer_html(
				soup=soup,
				head=head,
				content=content,
				styles=styles,
				html_id=html_id,
				css=css,
				path=path,
			)


def _normalize_chrome_preview_letterheads(rendered_html: str, print_format=None) -> str:
	"""Normalize legacy letterhead html in browser print preview (alt + chrome path)."""
	if _get_pdf_generator(print_format) != "chrome":
		return rendered_html
	if "id=\"footer-html\"" not in rendered_html and "id=\"header-html\"" not in rendered_html:
		return rendered_html
	if "id=\"__print_designer\"" in rendered_html:
		# Print Designer templates have their own renderer path/styles.
		return rendered_html

	soup = BeautifulSoup(rendered_html, "html5lib")

	header = soup.find(id="header-html")
	if header:
		_normalize_letterhead_images_for_chrome(header, html_id="header-html")

	footer = soup.find(id="footer-html")
	if footer:
		_normalize_letterhead_images_for_chrome(footer, html_id="footer-html")

	return str(soup)


def pdf_body_html(print_format, jenv, args, template):
	if print_format and print_format.print_designer and print_format.print_designer_body:
		print_format_name = hashlib.md5(print_format.name.encode(), usedforsecurity=False).hexdigest()
		add_data_to_monitor(print_designer=print_format_name, print_designer_action="download_pdf")

		settings = json.loads(print_format.print_designer_settings)

		args.update(
			{
				"headerElement": json.loads(print_format.print_designer_header),
				"bodyElement": json.loads(print_format.print_designer_body),
				"footerElement": json.loads(print_format.print_designer_footer),
				"settings": settings,
				"pdf_generator": _get_pdf_generator(print_format),
			}
		)

		if not is_older_schema(settings=settings, current_version="1.1.0"):
			args.update({"pd_format": json.loads(print_format.print_designer_print_format)})
		else:
			args.update({"afterTableElement": json.loads(print_format.print_designer_after_table or "[]")})

		# replace placeholder comment with user provided jinja code
		template_source = template.replace(
			"<!-- user_generated_jinja_code -->", args["settings"].get("userProvidedJinja", "")
		)
		try:
			template = jenv.from_string(template_source)
			return template.render(args, filters={"len": len})

		except Exception as e:
			error = log_error(title=e, reference_doctype="Print Format", reference_name=print_format.name)
			if frappe.conf.developer_mode:
				return f"<h1><b>Something went wrong while rendering the print format.</b> <hr/> If you don't know what just happened, and wish to file a ticket or issue on Github <hr /> Please copy the error from <code>Error Log {error.name}</code> or ask Administrator.<hr /><h3>Error rendering print format: {error.reference_name}</h3><h4>{error.method}</h4><pre>{html.escape(error.error)}</pre>"
			else:
				return f"<h1><b>Something went wrong while rendering the print format.</b> <hr/> If you don't know what just happened, and wish to file a ticket or issue on Github <hr /> Please copy the error from <code>Error Log {error.name}</code> or ask Administrator.</h1>"
	rendered = fw_pdf_body_html(template, args)
	return _normalize_chrome_preview_letterheads(rendered, print_format=print_format)


def is_older_schema(settings, current_version):
	format_version = settings.get("schema_version", "1.0.0")
	format_version = format_version.split(".")
	current_version = current_version.split(".")
	if int(format_version[0]) < int(current_version[0]):
		return True
	elif int(format_version[0]) == int(current_version[0]) and int(format_version[1]) < int(
		current_version[1]
	):
		return True
	elif (
		int(format_version[0]) == int(current_version[0])
		and int(format_version[1]) == int(current_version[1])
		and int(format_version[2]) < int(current_version[2])
	):
		return True
	else:
		return False


def get_print_format_template(jenv, print_format):
	# if print format is created using print designer, then use print designer template
	if print_format and print_format.print_designer and print_format.print_designer_body:
		settings = json.loads(print_format.print_designer_settings)
		if is_older_schema(settings, "1.1.0"):
			return jenv.loader.get_source(
				jenv, "print_designer/page/print_designer/jinja/old_print_format.html"
			)[0]
		else:
			return jenv.loader.get_source(
				jenv, "print_designer/page/print_designer/jinja/print_format.html"
			)[0]


def measure_time(func):
	def wrapper(*args, **kwargs):
		start_time = time.time()
		result = func(*args, **kwargs)
		end_time = time.time()
		print(f"Function {func.__name__} took {end_time - start_time:.4f} seconds")
		return result

	return wrapper


def get_host_url():
	if frappe.request:
		return frappe.request.host_url
	else:
		return get_url() + "/"
