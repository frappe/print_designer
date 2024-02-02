import hashlib
import json

import frappe
from frappe.monitor import add_data_to_monitor
from frappe.utils.jinja_globals import is_rtl


def pdf_header_footer_html(soup, head, content, styles, html_id, css):
	if soup.find(id="__print_designer"):
		return frappe.render_template(
			"print_designer/page/print_designer/jinja/header_footer.html",
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
	else:
		from frappe.utils.pdf import pdf_footer_html, pdf_header_html

		if html_id == "header-html":
			return pdf_header_html(
				soup=soup, head=head, content=content, styles=styles, html_id=html_id, css=css
			)
		elif html_id == "footer-html":
			return pdf_footer_html(
				soup=soup, head=head, content=content, styles=styles, html_id=html_id, css=css
			)


def pdf_body_html(print_format, jenv, args, template):
	if print_format and print_format.print_designer and print_format.print_designer_body:
		print_format_name = hashlib.md5(print_format.name, usedforsecurity=False).hexdigest()
		add_data_to_monitor(print_designer=print_format_name, print_designer_action="download_pdf")
		template = jenv.loader.get_source(jenv, "print_designer/page/print_designer/jinja/main.html")[0]
		args.update(
			{
				"headerElement": json.loads(print_format.print_designer_header),
				"bodyElement": json.loads(print_format.print_designer_body),
				"afterTableElement": json.loads(print_format.print_designer_after_table),
				"footerElement": json.loads(print_format.print_designer_footer),
				"settings": json.loads(print_format.print_designer_settings),
			}
		)
		# replace placeholder comment with user provided jinja code
		template_source = template.replace(
			"<!-- user_generated_jinja_code -->", args["settings"].get("userProvidedJinja", "")
		)
		template = jenv.from_string(template_source)
	return template.render(args, filters={"len": len})
