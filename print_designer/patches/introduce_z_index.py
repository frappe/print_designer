import frappe

from print_designer.patches.patch_utils import patch_formats


def execute():
	"""Updating all style objects to have zIndex 0 in print formats that uses print designer"""

	def style(style):
		style["zIndex"] = 0

	patch_formats(
		{"style": style},
	)
