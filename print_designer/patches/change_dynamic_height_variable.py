import frappe

from print_designer.patches.patch_utils import patch_formats


def execute():
	"""changing isDynamicHeight property to heightType property in text and table elements"""

	def element_callback(el):
		if el.get("type") == "text" and not (el.get("isDynamic") or el.get("parseJinja")):
			return

		if not "isDynamicHeight" in el:
			el["isDynamicHeight"] = False

		if el["isDynamicHeight"]:
			el["heightType"] = "auto"
		else:
			el["heightType"] = "fixed"

	patch_formats(
		{"element": element_callback},
		types=["text", "table"],
	)
