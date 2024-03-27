import frappe

from print_designer.patches.patch_utils import patch_formats


def execute():
	"""Modify Formats to work with New Column Style Feature"""

	def element_callback(el):
		el["selectedColumn"] = None
		for col in el["columns"]:
			col["style"] = {}
			col["applyStyleToHeader"] = False

	patch_formats(
		{"element": element_callback},
		types=["table"],
	)
