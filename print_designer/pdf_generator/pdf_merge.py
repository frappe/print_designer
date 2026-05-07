from io import BytesIO

import frappe
from pypdf import PdfWriter, Transformation


class PDFTransformer:
	def __init__(self, browser):
		self.browser = browser
		self.body_pdf = browser.body_pdf
		self.is_print_designer = browser.is_print_designer
		self._set_header_pdf()
		self._set_footer_pdf()
		if not self.header_pdf and not self.footer_pdf:
			return
		self.no_of_pages = len(self.body_pdf.pages)
		self.encrypt_password = self.browser.options.get("password", None)
		# if not header / footer then return body pdf

	def _set_header_pdf(self):
		self.header_pdf = None
		if hasattr(self.browser, "header_pdf"):
			self.header_pdf = self.browser.header_pdf
			self.is_header_dynamic = self.browser.is_header_dynamic

	def _set_footer_pdf(self):
		self.footer_pdf = None
		if hasattr(self.browser, "footer_pdf"):
			self.footer_pdf = self.browser.footer_pdf
			self.is_footer_dynamic = self.browser.is_footer_dynamic

	def _page_has_image(self, page) -> bool:
		try:
			resources = page.get("/Resources")
			if not resources:
				return False
			xobjects = resources.get("/XObject")
			if not xobjects:
				return False
			for key in xobjects:
				obj = xobjects[key]
				if hasattr(obj, "get") and obj.get("/Subtype") == "/Image":
					return True
		except Exception:
			return False
		return False

	def _page_has_counter_text(self, page) -> bool:
		try:
			text = (page.extract_text() or "").lower()
			return ("seite" in text) or ("page" in text) or ("von" in text) or ("of" in text)
		except Exception:
			return False

	def _dbg(self, label, **data):
		try:
			frappe.logger("print_designer").info(f"[PD_MERGE_DEBUG] {label} | {frappe.as_json(data)}")
		except Exception:
			pass

	def transform_pdf(self, output=None):
		header = self.header_pdf
		body = self.body_pdf
		footer = self.footer_pdf

		if footer:
			try:
				img_flags = [self._page_has_image(pg) for pg in footer.pages]
				text_flags = [self._page_has_counter_text(pg) for pg in footer.pages]
				frappe.logger("print_designer").info(
					f"[PD_FOOTER_PASS] footer_pages={len(footer.pages)} img_flags={img_flags} text_flags={text_flags}"
				)
			except Exception:
				pass

		if not header and not footer:
			return body

		body_height = body.pages[0].mediabox.top
		body_transform = header_height = footer_height = header_body_top = 0

		if footer:
			footer_height = footer.pages[0].mediabox.top
			body_transform = footer_height

		if header:
			header_height = header.pages[0].mediabox.top
			header_transform = body_height + footer_height
			header_body_top = header_height + body_height + footer_height

		if header and not self.is_header_dynamic:
			for h in header.pages:
				self._transform(h, header_body_top, header_transform)

		for p in body.pages:
			if header_body_top:
				self._transform(p, header_body_top, body_transform)
			if header:
				if self.is_header_dynamic:
					p.merge_page(self._transform(header.pages[p.page_number], header_body_top, header_transform))
				elif self.is_print_designer:
					if p.page_number == 0:
						p.merge_page(header.pages[0])
					elif p.page_number == self.no_of_pages - 1:
						p.merge_page(header.pages[3])
					elif p.page_number % 2 == 0:
						p.merge_page(header.pages[2])
					else:
						p.merge_page(header.pages[1])
				else:
					p.merge_page(header.pages[0])

			if footer:
				if self.is_footer_dynamic:
					# Hybrid handling for Chromium dynamic footer output:
					# - normal: one footer page per body page
					# - interleaved: two footer pages per body page (e.g. letterhead + counter layer)
					if len(footer.pages) == (self.no_of_pages * 2):
						base_idx = p.page_number * 2
						idx2 = base_idx + 1
						pair = []
						if base_idx < len(footer.pages):
							pair.append((base_idx, footer.pages[base_idx]))
						if idx2 < len(footer.pages):
							pair.append((idx2, footer.pages[idx2]))

						if len(pair) == 2:
							(i1, p1), (i2, p2) = pair
							p1_img, p2_img = self._page_has_image(p1), self._page_has_image(p2)
							p1_txt, p2_txt = self._page_has_counter_text(p1), self._page_has_counter_text(p2)
							chosen = []

							# Prefer single-layer page if it already has both image+counter text.
							if p1_img and p1_txt and not (p2_img and p2_txt):
								p.merge_page(p1)
								chosen = [i1]
							elif p2_img and p2_txt and not (p1_img and p1_txt):
								p.merge_page(p2)
								chosen = [i2]
							else:
								# Merge image-bearing page first, then text-bearing page on top.
								if p1_img and not p2_img:
									p.merge_page(p1)
									p.merge_page(p2)
									chosen = [i1, i2]
								elif p2_img and not p1_img:
									p.merge_page(p2)
									p.merge_page(p1)
									chosen = [i2, i1]
								else:
									# fallback: keep original deterministic order
									p.merge_page(p1)
									p.merge_page(p2)
									chosen = [i1, i2]
							self._dbg("pair_decision", page=p.page_number, i1=i1, i2=i2, p1_img=p1_img, p2_img=p2_img, p1_txt=p1_txt, p2_txt=p2_txt, chosen=chosen)
						elif len(pair) == 1:
							p.merge_page(pair[0][1])
					else:
						p.merge_page(footer.pages[p.page_number])
				elif self.is_print_designer:
					if p.page_number == 0:
						p.merge_page(footer.pages[0])
					elif p.page_number == self.no_of_pages - 1:
						p.merge_page(footer.pages[3])
					elif p.page_number % 2 == 0:
						p.merge_page(footer.pages[2])
					else:
						p.merge_page(footer.pages[1])
				else:
					p.merge_page(footer.pages[0])

		if output:
			output.append_pages_from_reader(body)
			return output

		writer = PdfWriter()
		writer.append_pages_from_reader(body)
		if self.encrypt_password:
			writer.encrypt(self.encrypt_password)

		return self.get_file_data_from_writer(writer)

	def _transform(self, page, page_top, ty):
		transform = Transformation().translate(ty=ty)
		page.mediabox.upper_right = (page.mediabox.right, page_top)
		page.add_transformation(transform)
		return page

	def get_file_data_from_writer(self, writer_obj):
		# https://docs.python.org/3/library/io.html
		stream = BytesIO()
		writer_obj.write(stream)

		# Change the stream position to start of the stream
		stream.seek(0)

		# Read up to size bytes from the object and return them
		return stream.read()
