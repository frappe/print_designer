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
def render_raw_print(doctype: str, name: str, print_format: str | None = None):

	document = frappe.get_doc(doctype, name)
	document.check_permission()
	print_format = get_print_format_doc(print_format, meta=document.meta)

	return _render_raw_print(doc=document, print_format=print_format)


def _render_raw_print(
	doc: "Document",
	print_format: str | None = None,
):
	
	print_settings = frappe.get_single("Print Settings").as_dict()
	
	if not frappe.flags.ignore_print_permissions:
		validate_print_permission(doc)
	
	element_List = json.loads(print_format.print_designer_print_format)
	doc.run_method("before_print", print_settings)

	jenv = frappe.get_jenv()
	args = {}
	settings = json.loads(print_format.print_designer_settings)

	raw_cmd_lang = settings.get('rawCmdLang')
	if raw_cmd_lang is None:
		return {'success' : False, 'msg' : 'Language is not selected from Print Designer'}
	
	args.update(
		{
			"doc": doc,
			"settings": settings
		}
	)
	template_source = jenv.loader.get_source( 				
		jenv, "print_designer/page/print_designer/jinja/render_raw_template.html" 
		)[0]
	
	template = jenv.from_string(template_source)
	html_with_raw_cmd_list = []
	paper_type = settings.get('paperType', "'continous_roll'")
	options = {
				"language": raw_cmd_lang,
				"x": settings.get('page').get('marginTop'),
				"y": settings.get('page').get('marginLeft'),
				"dotDensity": settings.get('dotDensity', 'single'),
				"pageWidth": settings.get('page').get('width'),
			}
	if paper_type == "label":
		options.update({'pageHeight' : settings.get('page').get('height')})

	for element in element_List['body']:
		try :
			rawCmdBeforeEle, rawCmdAfterEle = get_raw_cmd(element.get('childrens'), raw_cmd_lang)	if element.get('childrens') is not None else ""
			
			args.update({"element": [element]})
			rendered_html = template.render(args, filters={"len": len})
			if rawCmdBeforeEle:
				html_with_raw_cmd_list.append({'type': 'raw', 'format': 'command', 'flavor': 'plain', 'data': rawCmdBeforeEle})
			
			html_with_raw_cmd_list.append({ 'type': 'raw', 'format': 'html', 'flavor': 'plain', 'data': rendered_html, 'options': options})
			
			if rawCmdAfterEle:
				html_with_raw_cmd_list.append({'type': 'raw', 'format': 'command', 'flavor': 'plain', 'data': rawCmdAfterEle})
		except Exception as e :
			error = log_error(title=e, reference_doctype="Print Format", reference_name=print_format.name)
			if frappe.conf.developer_mode:
				return { 'success' : False, 'msg' : f"<h1><b>Something went wrong while rendering the print format.</b> <hr/> If you don't know what just happened, and wish to file a ticket or issue on Github <hr /> Please copy the error from <code>Error Log {error.name}</code> or ask Administrator.<hr /><h3>Error rendering print format: {error.reference_name}</h3><h4>{error.method}</h4><pre>{html.escape(error.error)}</pre>"}
			else:
				return { 'success' : False, 'msg' : f"<h1><b>Something went wrong while rendering the print format.</b> <hr/> If you don't know what just happened, and wish to file a ticket or issue on Github <hr /> Please copy the error from <code>Error Log {error.name}</code> or ask Administrator.</h1>"}

	return {'success' : True, 'raw_commands' : html_with_raw_cmd_list}

def convert_str_raw_cmd(raw_string, printer_lang):
	str_cmd_dict = {
		'paper_cut' : {
			'ESCPOS' : "\x1D\x56\x30",
		},
		'partial_paper_cut' : {
			'ESCPOS' : "\x1D\x56\x01"
		}
	}
	return str_cmd_dict.get(raw_string).get(printer_lang) or ""


def get_raw_cmd(element_dict, raw_cmd_lang):
	for element in element_dict:
		if element.get('childrens') is not None:
			if "rawCmdBeforeEle" in element  and "rawCmdAfterEle" in element :
				rawCmdBeforeEle = element.get('rawCmdBeforeEle')
				rawCmdAfterEle = element.get('rawCmdAfterEle')
				if rawCmdBeforeEle == "custom":
					rawCmdBeforeEle = element.get('customRawCmdBeforeEle')
				elif rawCmdBeforeEle is not None:
					rawCmdBeforeEle = convert_str_raw_cmd(rawCmdBeforeEle, raw_cmd_lang)
				
				if rawCmdAfterEle == "custom":
					rawCmdAfterEle = element.get('customRawCmdAfterEle')
				elif rawCmdAfterEle is not None:
					rawCmdAfterEle = convert_str_raw_cmd(rawCmdBeforeEle, raw_cmd_lang)
					
				return rawCmdBeforeEle or "", rawCmdAfterEle or ""
			
			return get_raw_cmd(element.get('childrens'), raw_cmd_lang)
		else:
			return ""

def get_element_type(element_dict):
	for element in element_dict:
		if  element.get("childrens"):
			return get_element_type(element.get("childrens"))
		return element.get('type')

