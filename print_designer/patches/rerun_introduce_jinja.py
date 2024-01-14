import frappe

from print_designer.patches.patch_utils import patch_formats


def execute():
	"""Rerun patch due to bug in patch utils"""

	def element_callback(el):
		if el.get("type") == "text" and not el.get("isDynamic"):
			if not "parseJinja" in el:
				el["parseJinja"] = False

	def dynamic_content_callback(el):
		if el.get("is_static", False):
			if not "parseJinja" in el:
				el["parseJinja"] = False

	patch_formats(
		{"element": element_callback, "dynamic_content": dynamic_content_callback},
		types=["text", "table", "barcode"],
	)
