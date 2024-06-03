import hashlib
import html
import json

import frappe
from frappe.monitor import add_data_to_monitor
from frappe.utils.error import log_error
from frappe.utils.jinja_globals import is_rtl
from frappe.utils.pdf import pdf_body_html as fw_pdf_body_html
from frappe.www.printview import get_print_format_doc, validate_print_permission
from frappe.model.document import Document

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
			template = get_print_format_template(jenv, print_format)

		settings = json.loads(print_format.print_designer_settings)

		args.update(
			{
				"headerElement": json.loads(print_format.print_designer_header),
				"bodyElement": json.loads(print_format.print_designer_body),
				"footerElement": json.loads(print_format.print_designer_footer),
				"settings": settings,
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
	return fw_pdf_body_html(template, args)


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

@frappe.whitelist()
def get_raw_cmd_render_pd(doc: str, name: str | None = None, print_format: str | None = None):
	
	if isinstance(name, str):
		document = frappe.get_doc(doc, name)
	else:
		document = frappe.get_doc(json.loads(doc))
	document.check_permission()
	print_format = get_print_format_doc(print_format, meta=document.meta)
	
	return get_rendered_template_pd(doc=document, print_format=print_format)


def get_rendered_template_pd(
	doc: "Document",
	print_format: str | None = None,
):
	
	print_settings = frappe.get_single("Print Settings").as_dict()
	
	if not frappe.flags.ignore_print_permissions:
		validate_print_permission(doc)
	
	element_List = json.loads(print_format.print_designer_print_format)
	doc.run_method("before_print", print_settings)

	jenv = frappe.get_jenv()
	format_data, format_data_map = [], {}
	args = {}
	settings = json.loads(print_format.print_designer_settings)
	args.update(
		{
			"settings": settings,
			"doc": doc,
		}
	)
	template_source = jenv.loader.get_source( 				
		jenv, "print_designer/page/print_designer/jinja/redner_element.html" 
		)[0]
	args.update({"afterTableElement": json.loads(print_format.print_designer_after_table or "[]")})
	template = jenv.from_string(template_source)
	html_with_raw_cmd_list = []
	options = {
				"language": 'ESCPOS',
				"x": settings.get('page').get('marginTop'),
				"y": settings.get('page').get('marginLeft'),
				"dotDensity": "double",
				"pageWidth": settings.get('page').get('width'),
				"pageHeight": settings.get('page').get('height')
			}
	
	raw_cmd_lang = settings.get('page').get('rawCmdLang')
	if raw_cmd_lang is None:
		return {'status' : False, 'msg' : 'Language is not selected from Print Designer'}
	
	for set_type in element_List:
		for element in element_List[set_type]:
			try :
				rawCmdBeforeEle = element.get('childrens')[0].get('rawCmdBeforeEle', ' ').strip()
				rawCmdAfterEle = element.get('childrens')[0].get('rawCmdAfterEle', ' ').strip()
				
				if rawCmdBeforeEle != "" and rawCmdBeforeEle != 'custom':
					rawCmdBeforeEle = convert_str_raw_cmd(rawCmdBeforeEle, raw_cmd_lang)
				elif rawCmdBeforeEle == 'custom':
					rawCmdBeforeEle = element.get('childrens')[0].get('customRawCmdBeforeEle', ' ').strip()

				if rawCmdAfterEle != "" and rawCmdAfterEle != 'custom':
					rawCmdAfterEle = convert_str_raw_cmd(rawCmdAfterEle, raw_cmd_lang)
				elif rawCmdAfterEle == 'custom':
					rawCmdAfterEle = element.get('childrens')[0].get('customRawCmdAfterEle', ' ').strip()

				args.update({"element": [element]})
				#Need to change options value to raw_cmd
				rendered_html = template.render(args, filters={"len": len})

				html_with_raw_cmd_list.append({'type': 'raw', 'format': 'command', 'flavor': 'plain', 'data': rawCmdBeforeEle})
				html_with_raw_cmd_list.append({ 'type': 'raw', 'format': 'html', 'flavor': 'plain', 'data': rendered_html, 'options': options})
				html_with_raw_cmd_list.append({'type': 'raw', 'format': 'command', 'flavor': 'plain', 'data': rawCmdAfterEle})
			except Exception as e :
				error = log_error(title=e, reference_doctype="Print Format", reference_name=print_format.name)
				if frappe.conf.developer_mode:
					return { 'status' : False, 'msg' : f"<h1><b>Something went wrong while rendering the print format.</b> <hr/> If you don't know what just happened, and wish to file a ticket or issue on Github <hr /> Please copy the error from <code>Error Log {error.name}</code> or ask Administrator.<hr /><h3>Error rendering print format: {error.reference_name}</h3><h4>{error.method}</h4><pre>{html.escape(error.error)}</pre>"}
				else:
					return { 'status' : False, 'msg' : f"<h1><b>Something went wrong while rendering the print format.</b> <hr/> If you don't know what just happened, and wish to file a ticket or issue on Github <hr /> Please copy the error from <code>Error Log {error.name}</code> or ask Administrator.</h1>"}

	return {'status' : True, 'raw_commands' : html_with_raw_cmd_list}

def convert_str_raw_cmd(raw_string, printer_lang):
	str_cmd_dict = {
		'paper_cut' : {
			'ESCPOS' : "\x1D\x56\x30",
		},
		'partial_paper_cut' : {
			'ESCPOS' : "\x1D\x56\x01"
		}
	}
	return str_cmd_dict[raw_string][printer_lang]