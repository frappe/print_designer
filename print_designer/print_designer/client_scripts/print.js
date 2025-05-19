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
			only_input: true,
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
	createPdfEl(url, wrapperContainer) {
		let pdfEl = document.getElementById("pd-pdf-viewer");
		if (!pdfEl) {
			pdfEl = document.createElement("object");
			pdfEl.id = "pd-pdf-viewer";
			pdfEl.type = "application/pdf";
			wrapperContainer.appendChild(pdfEl);
		}
		pdfEl.style.height = "0px";

		pdfEl.data = url;
		pdfEl.style.width = "100%";

		return pdfEl;
	}
	async designer_pdf(print_format) {
		let print_designer_settings = JSON.parse(print_format.print_designer_settings);
		let page_settings = print_designer_settings.page;
		let canvasContainer = document.getElementById("preview-container");
		canvasContainer.style.display = "block";
		const wrapperContainer = document.getElementsByClassName("print-designer-wrapper")[0];
		canvasContainer.style.minHeight = page_settings.height + "px";
		canvasContainer.style.width = page_settings.width + "px";
		canvasContainer.innerHTML = `${frappe.render_template("print_skeleton_loading")}`;
		let params = new URLSearchParams({
			doctype: this.frm.doc.doctype,
			name: this.frm.doc.name,
			format: this.selected_format(),
			_lang: this.lang_code,
		});
		let url = `${
			window.location.origin
		}/api/method/frappe.utils.print_format.download_pdf?${params.toString()}`;

		const pdfEl = this.createPdfEl(url, wrapperContainer);
		const onError = () => {
			this.print_wrapper.find(".print-designer-wrapper").hide();
			this.inner_msg.show();
			this.full_page_btn.show();
			this.pdf_btn.show();
			this.letterhead_selector.show();
			this.sidebar_dynamic_section.show();
			this.print_btn.show();
			this.sidebar.show();
			this.toolbar_print_format_selector.$wrapper.hide();
			this.toolbar_language_selector.$wrapper.hide();
			super.preview();
			frappe.show_alert(
				{
					message: __("Error Generating PDF..."),
					indicator: "red",
				},
				10
			);
		};
		const onPdfLoad = () => {
			canvasContainer.style.display = "none";
			pdfEl.style.display = "block";
			pdfEl.style.height = "calc(100vh - var(--page-head-height) - var(--navbar-height))";
		};
		pdfEl.addEventListener("load", onPdfLoad);
		pdfEl.addEventListener("error", onError);
	}
	printit() {
		let me = this;
		// Enable Network Printing
		if (parseInt(this.print_settings.enable_print_server)) {
			super.printit();
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
			this.page.add_menu_item("Download PDF", () => this.render_pdf());
			this.print_btn.hide();
			this.letterhead_selector.hide();
			this.sidebar_dynamic_section.hide();
			this.sidebar.hide();
			this.toolbar_print_format_selector.$wrapper.show();
			this.toolbar_language_selector.$wrapper.show();
			return;
		}
		this.print_wrapper.find(".print-designer-wrapper").hide();
		this.inner_msg.show();
		this.full_page_btn.show();
		this.pdf_btn.show();
		this.print_btn.show();
		this.letterhead_selector.show();
		this.sidebar_dynamic_section.show();
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
