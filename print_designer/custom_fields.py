CUSTOM_FIELDS = {
	"Print Format": [
		{
			"default": "0",
			"fieldname": "print_designer",
			"fieldtype": "Check",
			"hidden": 1,
			"label": "Print Designer",
		},
		{
			"fieldname": "print_designer_print_format",
			"fieldtype": "JSON",
			"hidden": 1,
			"label": "Print Designer Print Format",
			"description": "This has json object that is used by main.html jinja template to render the print format.",
		},
		{
			"fieldname": "print_designer_header",
			"fieldtype": "JSON",
			"hidden": 1,
			"label": "Print Designer Header",
		},
		{
			"fieldname": "print_designer_body",
			"fieldtype": "JSON",
			"hidden": 1,
			"label": "Print Designer Body",
		},
		{
			"fieldname": "print_designer_after_table",
			"fieldtype": "JSON",
			"hidden": 1,
			"label": "Print Designer After Table",
		},
		{
			"fieldname": "print_designer_footer",
			"fieldtype": "JSON",
			"hidden": 1,
			"label": "Print Designer Footer",
		},
		{
			"fieldname": "print_designer_settings",
			"hidden": 1,
			"fieldtype": "JSON",
			"label": "Print Designer Settings",
		},
		{
			"fieldname": "print_designer_preview_img",
			"hidden": 1,
			"fieldtype": "Attach Image",
			"label": "Print Designer Preview Image",
		},
		{
			"depends_on": "eval:doc.print_designer && doc.standard == 'Yes'",
			"fieldname": "print_designer_template_app",
			"fieldtype": "Select",
			"label": "Print Designer Template Location",
			"default": "print_designer",
			"insert_after": "standard",
		},
	]
}
