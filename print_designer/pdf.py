import hashlib
import html
import json

import frappe
from frappe.monitor import add_data_to_monitor
from frappe.utils.error import log_error
from frappe.utils.jinja_globals import is_rtl


def pdf_header_footer_html(soup, head, content, styles, html_id, css):
	if soup.find(id="__print_designer"):
		try:
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
		except Exception as e:
			error = log_error(title=e, reference_doctype="Print Format")
			frappe.throw(
				msg=f"Something went wrong ( Error ) : If you don't know what just happened, and wish to file a ticket or issue on github, please copy the error from <b>Error Log {error.name}</b> or ask Administrator.",
				exc=e,
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
		print_format_name = hashlib.md5(print_format.name.encode(), usedforsecurity=False).hexdigest()
		add_data_to_monitor(print_designer=print_format_name, print_designer_action="download_pdf")
		# DEPRECATED: remove this in few months added for backward compatibility incase user didn't update frappe framework.
		if not frappe.get_hooks("get_print_format_template"):
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
		try:
			template = jenv.from_string(template_source)
			return template.render(args, filters={"len": len})

		except Exception as e:
			error = log_error(title=e, reference_doctype="Print Format", reference_name=print_format.name)
			if frappe.conf.developer_mode:
				return f"<h1><b>Something went wrong while rendering the print format.</b> <hr/> If you don't know what just happened, and wish to file a ticket or issue on Github <hr /> Please copy the error from <code>Error Log {error.name}</code> or ask Administrator.<hr /><h3>Error rendering print format: {error.reference_name}</h3><h4>{error.method}</h4><pre>{html.escape(error.error)}</pre>"
			else:
				return f"<h1><b>Something went wrong while rendering the print format.</b> <hr/> If you don't know what just happened, and wish to file a ticket or issue on Github <hr /> Please copy the error from <code>Error Log {error.name}</code> or ask Administrator.</h1>"

	return template.render(args, filters={"len": len})


def get_print_format_template(jenv, print_format):
	# if print format is created using print designer, then use print designer template
	if print_format and print_format.print_designer and print_format.print_designer_body:
		return jenv.loader.get_source(jenv, "print_designer/page/print_designer/jinja/main.html")[0]
