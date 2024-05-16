# Print Designer's entire schema is in JSON and have some predefined schema,
# This file contains Functions that can be used on almost all patches that needs to manipulate element data structure.
# Go through the code once to understand how it works before using it.
from typing import Callable, Dict, List, Optional, Union

import frappe

from print_designer.pdf import is_older_schema

"""
Example Callback Functions used to Demonstrate Data Structure.
Example functions are just printing the values of the object passed to them.

Warning: Creating another object and returning it will not work. you need to update the existing object.
"""


# The 'element' callback is executed on every element object that is included in the 'types' list.
def element(element):
	print("*" * 80, "-" * 32 + " Element Object " + "-" * 32, element, "*" * 80, sep="\n")


# The 'dynamic_content' callback is executed on every 'dynamicContent' field within an element object that is included in the 'types' list.
# The 'dynamicContent' is currently used in text with 'isDynamic', barcode, and inside table columns.
def dynamic_content(element):
	print("*" * 80, "-" * 28 + " Dynamic Content Object " + "-" * 28, element, "*" * 80, sep="\n")


# The 'style' callback is executed on every style object from all element objects that are included in the 'types' list.
def style(style):
	print("*" * 80, "-" * 33 + " Style Object " + "-" * 33, style, "*" * 80, sep="\n")


# 'dynamic_content_style' callback is executed on every style object from the 'dynamicContent' field within an element object that is included in the 'types' list.
def dynamic_content_style(style):
	print("*" * 80, "-" * 25 + " Dynamic Content Style Object " + "-" * 25, style, "*" * 80, sep="\n")


"""
Example callbacks object that should be passed to patch_formats function
You don't need to pass all the callbacks, you can pass only the callbacks that you need.
"""
callbacks = {
	"element": element,
	"dynamic_content": dynamic_content,
	"style": style,
	"dynamic_content_style": dynamic_content_style,
}

"""
See how it works
you need print designer print formats with actual elements to see the output of this function.

1. Open Console

	bench --site your-site-name console --autorelod

2. run this command to see the structure and how it works

	from print_designer.patches.patch_utils import *
	patch_formats(callbacks)

If you want to run callback on specific Element Type just pass types to function

	e.g. callbacks will only run on elements that are text, barcode and table
		patch_formats(callbacks, types=["text", "barcode", "table"])

While developing patches, pass save=False to function so that it will not save the changes to database.
	patch_formats(callbacks, save=False)
"""


def patch_formats(
	callbacks: Union[Callable[[Dict], None], Dict[str, Callable[[Dict], None]]],
	types: Optional[List[str]] = None,
	update_print_json: bool = False,
	save: bool = True,
) -> None:
	"""
	This function applies the given callbacks to all of the print formats that are created using print designer.

	:param callbacks: A single callback function or a dictionary of callback functions.
	                                  If a dictionary is provided, it should contain keys
	                                  `element, dynamic_content, style, dynamic_content_style` each with a function as its value.
	                                  Each callback function should take a dictionary as an argument and can modify it and return nothing.
	                                  The dictionary passed to the callback function represents a element or style object.
	:param update_print_json: If True, the function will update the generated print format json that is used by jinja template.
	:param types: A list of print format types to which the callback function should be applied.
	                          If not provided, it defaults to ["text", "image", "barcode", "rectangle", "table"].
	"""

	if not types:
		types = ["text", "image", "barcode", "rectangle", "table"]

	print_formats = frappe.get_all(
		"Print Format",
		filters={"print_designer": 1},
		fields=[
			"name",
			"print_designer_header",
			"print_designer_body",
			"print_designer_after_table",
			"print_designer_footer",
			"print_designer_print_format",
			"print_designer_settings",
		],
		as_list=1,
	)
	for pf in print_formats:
		print_json = pf[5] or "{}"
		# print_designer_print_format was introduced in schema version 1.1.0 so running this on older version is not required
		pf_doc = frappe.get_doc("Print Format", pf[0])
		if update_print_json and not is_older_schema(
			settings=frappe.json.loads(pf[6] or "{}"), current_version="1.1.0"
		):
			print_json = frappe.json.loads(print_json)
			if print_json.get("header", None):
				print_json["header"] = patch_elements(print_json["header"], callbacks, types)
			if print_json.get("body", None):
				print_json["body"] = patch_elements(print_json["body"], callbacks, types)
			if print_json.get("footer", None):
				print_json["footer"] = patch_elements(print_json["footer"], callbacks, types)
			print_json = frappe.json.dumps(print_json)
			pf_doc.update({"print_designer_print_format": print_json})

		pf_doc.update(
			{
				"print_designer_header": frappe.json.dumps(
					patch_elements(frappe.json.loads(pf[1] or "[]"), callbacks, types)
				),
				"print_designer_body": frappe.json.dumps(
					patch_elements(frappe.json.loads(pf[2] or "[]"), callbacks, types)
				),
				"print_designer_after_table": frappe.json.dumps(
					patch_elements(frappe.json.loads(pf[3] or "[]"), callbacks, types)
				),
				"print_designer_footer": frappe.json.dumps(
					patch_elements(frappe.json.loads(pf[4] or "[]"), callbacks, types)
				),
			}
		)
		if save:
			pf_doc.save(ignore_permissions=True, ignore_version=False)


def patch_elements(
	data: List[Dict],
	callbacks: Union[Callable[[Dict], None], Dict[str, Callable[[Dict], None]]],
	types: Optional[List[str]] = None,
) -> List[Dict]:
	"""
	This function iterates over a list of elements, applying a callback function to each element of a specified type.

	:param data: A list of elements where each element is a dictionary.
	:param callbacks: A callback function or a dictionary of callback functions to be applied to each element of the specified types.
	                        If a dictionary is provided, it should contain keys `element, dynamic_content, style, dynamic_content_style` each with a function as its value.
	:param types: A list of element types to which the callback function should be applied.
	                Defaults to ["text", "image", "barcode", "rectangle", "table"].
	return: The original data list, with the callback function applied to each element of the specified types.
	"""

	if not types:
		types = ["text", "image", "barcode", "rectangle", "table"]

	if isinstance(callbacks, dict):
		callback = callbacks.get("element", None)
		dynamic_content_callback = callbacks.get("dynamic_content", None)
		style_callback = callbacks.get("style", None)
		dynamic_content_style_callback = callbacks.get("dynamic_content_style", None)
	else:
		callback = callbacks
	for element in data:
		if element.get("type") not in types:
			if element.get("type") == "rectangle":
				childrens = (
					frappe.json.loads(element.get("childrens", "[]"))
					if isinstance(element.get("childrens"), str)
					else element.get("childrens")
				)
				if len(childrens) > 0:
					element["childrens"] = patch_elements(data=childrens, callbacks=callbacks, types=types)
			continue
		if callback:
			callback(element)
		if dynamic_content_callback:
			if "dynamicContent" in element:
				for dy in element.get("dynamicContent"):
					dynamic_content_callback(dy)
					if dynamic_content_style_callback:
						dynamic_content_style_callback(dy.get("style"))
			elif "columns" in element:
				for col in element.get("columns"):
					if "dynamicContent" in col:
						for dy in col.get("dynamicContent"):
							dynamic_content_callback(dy)
							if dynamic_content_style_callback:
								dynamic_content_style_callback(dy.get("style"))
		if style_callback and "style" in element:
			style_callback(element.get("style"))

		if element.get("type") == "rectangle":
			childrens = (
				frappe.json.loads(element.get("childrens", "[]"))
				if isinstance(element.get("childrens"), str)
				else element.get("childrens")
			)
			if len(childrens) > 0:
				element["childrens"] = patch_elements(data=childrens, callbacks=callbacks, types=types)
	return data
