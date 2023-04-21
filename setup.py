from setuptools import find_packages, setup

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in print_designer/__init__.py
from print_designer import __version__ as version

setup(
	name="print_designer",
	version=version,
	description="Frappe App to Design Print Formats using interactive UI.",
	author="Frappe Technologies Pvt Ltd.",
	author_email="hello@frappe.io",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires,
)
