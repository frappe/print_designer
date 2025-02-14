from . import __version__ as app_version

app_name = "print_designer"
app_title = "Print Designer"
app_publisher = "Frappe Technologies Pvt Ltd."
app_description = "Frappe App to Design Print Formats using interactive UI."
app_email = "hello@frappe.io"
app_license = "AGPLv3"

develop_version = "1.x.x-develop"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_js = ""


# include js, css files in header of web template
# web_include_css = "/assets/print_designer/css/print_designer.css"
# web_include_js = "/assets/print_designer/js/print_designer.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "print_designer/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
page_js = {
	"print": "print_designer/client_scripts/print.js",
	"point-of-sale": "print_designer/client_scripts/point_of_sale.js",
}

# include js in doctype views
doctype_js = {"Print Format": "print_designer/client_scripts/print_format.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
jinja = {
	"methods": [
		"print_designer.print_designer.page.print_designer.print_designer.render_user_text",
		"print_designer.print_designer.page.print_designer.print_designer.convert_css",
		"print_designer.print_designer.page.print_designer.print_designer.convert_uom",
		"print_designer.print_designer.page.print_designer.print_designer.get_barcode",
	]
}

# Installation
# ------------

before_install = "print_designer.install.before_install"
after_install = "print_designer.install.after_install"
after_app_install = "print_designer.install.after_app_install"

# Uninstallation
# ------------

before_uninstall = "print_designer.uninstall.before_uninstall"
# after_uninstall = "print_designer.uninstall.after_uninstall"

# ------------
# PDF
# ------------

pdf_header_html = "print_designer.pdf.pdf_header_footer_html"
pdf_body_html = "print_designer.pdf.pdf_body_html"
pdf_footer_html = "print_designer.pdf.pdf_header_footer_html"

get_print_format_template = "print_designer.pdf.get_print_format_template"


before_request = ["print_designer.pdf_generator.pdf.before_request"]

after_request = ["print_designer.pdf_generator.pdf.after_request"]

pdf_generator = "print_designer.pdf_generator.pdf.get_pdf"
# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "print_designer.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

override_doctype_class = {
	"Print Format": "print_designer.print_designer.overrides.print_format.PDPrintFormat",
}

# Path Relative to the app folder where default templates should be stored
pd_standard_format_folder = "default_templates"
# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"print_designer.tasks.all"
# 	],
# 	"daily": [
# 		"print_designer.tasks.daily"
# 	],
# 	"hourly": [
# 		"print_designer.tasks.hourly"
# 	],
# 	"weekly": [
# 		"print_designer.tasks.weekly"
# 	],
# 	"monthly": [
# 		"print_designer.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "print_designer.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "print_designer.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "print_designer.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["print_designer.utils.before_request"]
# after_request = ["print_designer.utils.after_request"]

# Job Events
# ----------
# before_job = ["print_designer.utils.before_job"]
# after_job = ["print_designer.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"print_designer.auth.validate"
# ]
