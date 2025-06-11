# apps/print_designer/print_designer/pdf_generator/typst_generator.py
from typing import Optional
import subprocess


def generate_typst_pdf(
	print_format: str,
	typst_code: Optional[str] = None,
	options: Optional[dict] = None,
	output: Optional[str] = None,
) -> bytes:
	# Temporary test: using `html` as placeholder for Typst code
	typst_code = """
#set page(width: 210mm, height: 297mm)
= Test PDF
Hello from Typst!
"""
	typ_path = "/tmp/preview.typ"
	pdf_path = output or "/tmp/preview.pdf"

	with open(typ_path, "w") as f:
		f.write(typst_code)

	# Compile Typst document
	result = subprocess.run(
		["typst", "compile", typ_path, pdf_path], capture_output=True, text=True
	)

	if result.returncode != 0:
		print("❌ Typst compile failed!")
		print("STDOUT:\n", result.stdout)
		print("STDERR:\n", result.stderr)
		raise RuntimeError("Typst compilation failed")

	with open(pdf_path, "rb") as f:
		return f.read()
