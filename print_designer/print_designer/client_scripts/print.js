// TODO: revisit and properly implement this client script
frappe.pages["print"].on_page_load = function (wrapper) {
	frappe.require(["pdfjs.bundle.css", "print_designer.bundle.css"]);
	frappe.ui.make_app_page({
		parent: wrapper,
	});

	let print_view = new frappe.ui.form.PrintView(wrapper);

	$(wrapper).bind("show", () => {
		const route = frappe.get_route();
		const doctype = route[1];
		const docname = route.slice(2).join("/");
		if (!frappe.route_options || !frappe.route_options.frm) {
			frappe.model.with_doc(doctype, docname, () => {
				let frm = { doctype: doctype, docname: docname };
				frm.doc = frappe.get_doc(doctype, docname);
				frappe.model.with_doctype(doctype, () => {
					frm.meta = frappe.get_meta(route[1]);
					print_view.show(frm);
				});
			});
		} else {
			print_view.frm = frappe.route_options.frm.doctype
				? frappe.route_options.frm
				: frappe.route_options.frm.frm;
			frappe.route_options.frm = null;
			print_view.show(print_view.frm);
		}
	});
};
frappe.ui.form.PrintView = class PrintView extends frappe.ui.form.PrintView {
	constructor(wrapper) {
		super(wrapper);
		this.pdfDoc = null;
		this.pdfDocumentTask = null;
	}
	make() {
		super.make();
		this.print_wrapper = this.page.main.append(
			`<div class="print-designer-wrapper">
				<div id="preview-container" class="preview-container"
					style="background-color: white; position: relative;">
					${frappe.render_template("print_skeleton_loading")}
				</div>
			</div>`
		);
		this.header_prepend_container = $(
			`<div class="print_selectors flex col align-items-center"></div>`
		).prependTo(this.page.page_actions);
		this.toolbar_print_format_selector = frappe.ui.form.make_control({
			df: {
				fieldtype: "Link",
				fieldname: "print_format",
				options: "Print Format",
				placeholder: __("Print Format"),
				get_query: () => {
					return { filters: { doc_type: this.frm.doctype } };
				},
				change: () => {
					if (
						this.toolbar_print_format_selector.value ==
						this.toolbar_print_format_selector.last_value
					)
						return;
					this.print_format_item.set_value(this.toolbar_print_format_selector.value);
				},
			},
			parent: this.header_prepend_container,
			// only_input: true,
			render_input: true,
		});
		this.toolbar_language_selector = frappe.ui.form.make_control({
			df: {
				fieldtype: "Link",
				fieldname: "language",
				placeholder: __("Language"),
				options: "Language",
				change: () => {
					if (
						this.toolbar_language_selector.value ==
						this.toolbar_language_selector.last_value
					)
						return;
					this.language_item.set_value(this.toolbar_language_selector.value);
				},
			},
			parent: this.header_prepend_container,
			only_input: true,
			render_input: true,
		});

		this.toolbar_print_format_selector.$input_area.addClass("my-0 px-3 hidden-xs hidden-md");
		this.toolbar_language_selector.$input_area.addClass("my-0 px-3 hidden-xs hidden-md");
		this.sidebar_toggle = $(".page-head").find(".sidebar-toggle-btn");
		$(document.body).on("toggleSidebar", () => {
			if (this.sidebar.is(":hidden")) {
				this.toolbar_print_format_selector.$wrapper.show();
				this.toolbar_language_selector.$wrapper.show();
			} else {
				this.toolbar_print_format_selector.$wrapper.hide();
				this.toolbar_language_selector.$wrapper.hide();
			}
		});
	}
	async designer_pdf(print_format) {
		if (typeof pdfjsLib == "undefined") {
			await frappe.require(
				["assets/print_designer/js/pdf.min.js", "pdf.worker.bundle.js"],
				() => {
					pdfjsLib.GlobalWorkerOptions.workerSrc =
						frappe.boot.assets_json["pdf.worker.bundle.js"];
				}
			);
		}
		let me = this;
		let print_designer_settings = JSON.parse(print_format.print_designer_settings);
		let page_settings = print_designer_settings.page;
		let canvasContainer = document.getElementById("preview-container");
		canvasContainer.style.minHeight = page_settings.height + "px";
		canvasContainer.style.width = page_settings.width + "px";
		canvasContainer.innerHTML = `${frappe.render_template("print_skeleton_loading")}`;
		canvasContainer.style.backgroundColor = "white";
		let params = new URLSearchParams({
			doctype: this.frm.doc.doctype,
			name: this.frm.doc.name,
			format: this.selected_format(),
			_lang: this.lang_code,
		});
		let url = `${
			window.location.origin
		}/api/method/frappe.utils.print_format.download_pdf?${params.toString()}`;

		/**
		 * Asynchronously downloads PDF.
		 */
		try {
			this.pdfDocumentTask && this.pdfDocumentTask.destroy();
			this.pdfDocumentTask = await pdfjsLib.getDocument(url);
			this.pdfDoc = await this.pdfDocumentTask.promise;

			// Initial/first page rendering
			canvasContainer.innerHTML = "";
			canvasContainer.style.backgroundColor = "transparent";
			for (let pageno = 1; pageno <= this.pdfDoc.numPages; pageno++) {
				await renderPage(this.pdfDoc, pageno);
			}
			this.pdf_download_btn.prop("disabled", false);
			if (frappe.route_options.trigger_print) {
				this.printit();
			}
			this.print_btn.prop("disabled", false);
		} catch (err) {
			console.error(err);
			frappe.msgprint({
				title: __("Unable to generate PDF"),
				message: `There was error while generating PDF. Please check the error log for more details.`,
				indicator: "red",
				primary_action: {
					label: "Open Error Log",
					action(values) {
						frappe.set_route("List", "Error Log", {
							doctype: "Error Log",
							reference_doctype: "Print Format",
						});
					},
				},
			});
		}
		/**
		 * Get page info from document, resize canvas accordingly, and render page.
		 * @param num Page number.
		 */
		async function renderPage(pdfDoc, num) {
			// Using promise to fetch the page
			let page = await pdfDoc.getPage(num);
			let canvasContainer = document.getElementById("preview-container");
			let canvas = document.createElement("canvas");
			let textLayer = document.createElement("div");
			textLayer.classList.add("textLayer");
			textLayer.style.position = "absolute";
			textLayer.style.left = 0;
			textLayer.style.top = 0;
			textLayer.style.right = 0;
			textLayer.style.bottom = 0;
			textLayer.style.overflow = "hidden";
			textLayer.style.opacity = 0.2;
			textLayer.style.lineHeight = 1.0;
			canvas.style.marginTop = "6px";
			canvasContainer.appendChild(canvas);
			canvasContainer.appendChild(textLayer);
			let ctx = canvas.getContext("2d");
			let viewport = page.getViewport({ scale: 1 });
			let scale = (page_settings.width / viewport.width) * window.devicePixelRatio * 1.5;
			document.documentElement.style.setProperty(
				"--scale-factor",
				page_settings.width / viewport.width
			);
			let scaledViewport = page.getViewport({ scale: scale });
			canvas.style.height = page_settings.height + "px";
			canvas.style.width = page_settings.width + "px";
			canvas.height = scaledViewport.height;
			canvas.width = scaledViewport.width;

			// Render PDF page into canvas context
			let renderContext = {
				canvasContext: ctx,
				viewport: scaledViewport,
				intent: "print",
			};
			await page.render(renderContext);
			let textContent = await page.getTextContent();
			// Assign CSS to the textLayer element
			textLayer.style.left = canvas.offsetLeft + "px";
			textLayer.style.top = canvas.offsetTop + "px";
			textLayer.style.height = canvas.offsetHeight + "px";
			textLayer.style.width = canvas.offsetWidth + "px";

			// Pass the data to the method for rendering of text over the pdf canvas.
			pdfjsLib.renderTextLayer({
				textContentSource: textContent,
				container: textLayer,
				viewport: scaledViewport,
				textDivs: [],
			});
		}
	}
	printit() {
		let me = this;
		// Enable Network Printing
		if (parseInt(this.print_settings.enable_print_server)) {
			super.printit();
			return;
		}
		if (this.get_print_format().print_designer) {
			if (!this.pdfDoc) return;
			this.pdfDoc.getData().then((arrBuff) => {
				let file = new Blob([arrBuff], { type: "application/pdf" });
				let fileUrl = URL.createObjectURL(file);
				let iframe;
				let iframeAvailable = document.getElementById("blob-print-iframe");
				if (!iframeAvailable) {
					iframe = document.createElement("iframe");
					iframe.id = "blob-print-iframe";
					iframe.style.display = "none";
					iframe.src = fileUrl;
					document.body.appendChild(iframe);
					iframe.onload = () => {
						setTimeout(() => {
							iframe.focus();
							iframe.contentWindow.print();
							if (frappe.route_options.trigger_print) {
								setTimeout(function () {
									window.close();
								}, 5000);
							}
						}, 1);
					};
				} else {
					iframeAvailable.src = fileUrl;
				}
				// in case the Blob uses a lot of memory
				setTimeout(() => URL.revokeObjectURL(fileUrl), 7000);
			});
			return;
		}
		super.printit();
	}
	show(frm) {
		super.show(frm);
		this.inner_msg = this.page.add_inner_message(`
				<a style="line-height: 2.4" href="/app/print-designer?doctype=${this.frm.doctype}">
					${__("Try the new Print Designer")}
				</a>
			`);
	}
	preview() {
		let print_format = this.get_print_format();
		if (print_format.print_designer && print_format.print_designer_body) {
			this.inner_msg.hide();
			this.print_wrapper.find(".print-preview-wrapper").hide();
			this.print_wrapper.find(".preview-beta-wrapper").hide();
			this.print_wrapper.find(".print-designer-wrapper").show();
			this.designer_pdf(print_format);
			this.full_page_btn.hide();
			this.pdf_btn.hide();
			this.pdf_download_btn.prop("disabled", true);
			this.print_btn.prop("disabled", true);
			this.pdf_download_btn.show();
			this.letterhead_selector.hide();
			this.sidebar_dynamic_section.hide();
			this.sidebar.hide();
			this.toolbar_print_format_selector.$wrapper.show();
			this.toolbar_language_selector.$wrapper.show();
			return;
		}
		this.pdfDocumentTask && this.pdfDocumentTask.destroy();
		this.print_wrapper.find(".print-designer-wrapper").hide();
		this.inner_msg.show();
		this.full_page_btn.show();
		this.pdf_btn.show();
		this.pdf_download_btn.hide();
		this.letterhead_selector.show();
		this.sidebar_dynamic_section.show();
		this.pdf_download_btn.prop("disabled", false);
		this.print_btn.prop("disabled", false);
		this.sidebar.show();
		this.toolbar_print_format_selector.$wrapper.hide();
		this.toolbar_language_selector.$wrapper.hide();
		super.preview();
	}
	setup_toolbar() {
		this.print_btn = this.page.set_primary_action(
			__("Print"),
			() => this.printit(),
			"printer"
		);

		this.full_page_btn = this.page.add_button(
			__("Full Page"),
			() => this.render_page("/printview?"),
			{
				icon: "full-page",
			}
		);

		this.pdf_btn = this.page.add_button(__("PDF"), () => this.render_pdf(), {
			icon: "small-file",
		});

		this.refresh_btn = this.page.add_button(__("Refresh"), () => this.refresh_print_format(), {
			icon: "refresh",
		});

		this.pdf_download_btn = this.page
			.add_button(__("Download PDF"), () => this.download_pdf(), {
				icon: "small-file",
			})
			.hide();
		this.page.add_action_icon(
			"file",
			() => {
				this.go_to_form_view();
			},
			"",
			__("Form")
		);
	}
	setup_sidebar() {
		this.sidebar = this.page.sidebar.addClass("print-preview-sidebar");

		this.print_format_item = this.add_sidebar_item({
			fieldtype: "Link",
			fieldname: "print_format",
			options: "Print Format",
			placeholder: __("Print Format"),
			get_query: () => {
				return { filters: { doc_type: this.frm.doctype } };
			},
			change: () => {
				if (this.print_format_item.value == this.print_format_item.last_value) return;
				this.toolbar_print_format_selector.set_value(this.print_format_item.value);
				this.refresh_print_format();
			},
		});
		this.print_format_selector = this.print_format_item.$input;

		this.language_item = this.add_sidebar_item({
			fieldtype: "Link",
			fieldname: "language",
			placeholder: __("Language"),
			options: "Language",
			change: () => {
				if (this.language_item.value == this.language_item.last_value) return;
				this.toolbar_language_selector.set_value(this.language_item.value);
				this.set_user_lang();
				this.preview();
			},
		});
		this.language_selector = this.language_item.$input;

		this.letterhead_selector = this.add_sidebar_item({
			fieldtype: "Link",
			fieldname: "letterhead",
			options: "Letter Head",
			placeholder: __("Letter Head"),
			change: () => this.preview(),
		}).$input;
		this.sidebar_dynamic_section = $(`<div class="dynamic-settings"></div>`).appendTo(
			this.sidebar
		);
	}
	set_default_print_language() {
		super.set_default_print_language();
		this.toolbar_language_selector.$input.val(this.lang_code);
	}
	set_default_print_format() {
		super.set_default_print_format();
		if (
			frappe.meta
				.get_print_formats(this.frm.doctype)
				.includes(this.toolbar_print_format_selector.$input.val())
		)
			return;
		if (!this.frm.meta.default_print_format) {
			let pd_print_format = "";
			if (this.frm.doctype == "Sales Invoice") {
				pd_print_format = "Sales Invoice PD Format v2";
			} else if (this.frm.doctype == "Sales Order") {
				pd_print_format = "Sales Order PD v2";
			}
			if (pd_print_format) {
				this.print_format_selector.val(pd_print_format);
				this.toolbar_print_format_selector.$input.val(pd_print_format);
			}
			return;
		}
		this.toolbar_print_format_selector.$input.empty();
		this.toolbar_print_format_selector.$input.val(this.frm.meta.default_print_format);
	}
	download_pdf() {
		this.pdfDoc.getData().then((arrBuff) => {
			const downloadFile = (blob, fileName) => {
				const link = document.createElement("a");
				// create a blobURI pointing to our Blob
				link.href = URL.createObjectURL(blob);
				link.download = fileName;
				// some browser needs the anchor to be in the doc
				document.body.append(link);
				link.click();
				link.remove();
				// in case the Blob uses a lot of memory
				setTimeout(() => URL.revokeObjectURL(link.href), 7000);
			};
			downloadFile(
				new Blob([arrBuff], { type: "application/pdf" }),
				`${frappe.get_route().slice(2).join("/")}.pdf`
			);
		});
	}
};
