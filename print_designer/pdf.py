import json

import frappe
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
		template = jenv.get_template("print_designer/page/print_designer/jinja/main.html")
		args.update(
			{
				"headerElement": json.loads(print_format.print_designer_header),
				"bodyElement": json.loads(print_format.print_designer_body),
				"afterTableElement": json.loads(print_format.print_designer_after_table),
				"footerElement": json.loads(print_format.print_designer_footer),
				"settings": json.loads(print_format.print_designer_settings),
			}
		)
	return template.render(args, filters={"len": len})
