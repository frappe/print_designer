import frappe

from print_designer.patches.patch_utils import patch_formats


def execute():
	"""Updating Table and Dynamic Text Elements to have property isDynamicHeight with default value as True"""

	def element_callback(el):
		if el.get("type") == "text" and not el.get("isDynamic"):
			return

		if not "isDynamicHeight" in el:
			el["isDynamicHeight"] = False

	patch_formats(
		{"element": element_callback},
		types=["text", "table"],
	)
