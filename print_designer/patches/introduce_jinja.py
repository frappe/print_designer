import frappe

from print_designer.patches.patch_utils import patch_formats


def execute():
	"""Add parseJinja property in DynamicFields (Static) and staticText"""

	def element_callback(el):
		if el.get("type") == "text" and not el.get("isDynamic"):
			el["parseJinja"] = False

	def dynamic_content_callback(el):
		if el.get("is_static", False):
			el["parseJinja"] = False

	patch_formats(
		{"element": element_callback, "dynamic_content": dynamic_content_callback},
		types=["text", "table", "barcode"],
	)
