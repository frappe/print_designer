import frappe

from print_designer.patches.patch_utils import patch_formats


def execute():
	"""Introduce suffix to dynamic content elements"""

	def dynamic_content_callback(el):
		if not el.get("is_static", True):
			if not "suffix" in el:
				el["suffix"] = None

	patch_formats(
		{"dynamic_content": dynamic_content_callback},
		types=["text", "table"],
	)
