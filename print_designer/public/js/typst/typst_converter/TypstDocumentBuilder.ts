import { renderPageSettings } from "@typst/typst_converter/core/page";
import type { Settings } from "@typst/typst_converter/types";
import { renderGlobalStyles } from "@typst/typst_converter/core/global_styles";

type PageMargin = {
	top: number;
	bottom: number;
	left: number;
	right: number;
};

export class TypstDocumentBuilder {
	settings: Settings;
	pageMargin: PageMargin;
	headerHeight: number;
	footerHeight: number;
	pageSize: string;

	constructor(settings: Settings) {
		if (settings.page) {
			settings.page.margin = {
				top: settings.page.marginTop ?? 0,
				bottom: settings.page.marginBottom ?? 0,
				left: settings.page.marginLeft ?? 0,
				right: settings.page.marginRight ?? 0,
			};
			settings.page.backgroundImage = "";
		}
		this.settings = settings;
		this.pageSize = settings.currentPageSize?.toLowerCase() || "a4";
		this.pageMargin = this.extractMargin(settings.page?.margin || {});
		this.headerHeight = settings.page?.headerHeight || 0;
		this.footerHeight = settings.page?.footerHeight || 0;
	}

	protected extractMargin(rawMargin: Partial<PageMargin>): PageMargin {
		return {
			top: rawMargin.top || 0,
			bottom: rawMargin.bottom || 0,
			left: rawMargin.left || 0,
			right: rawMargin.right || 0,
		};
	}

	build(): string {
		const fileInfo = this.renderFileInfo();
		const pageSetup = renderPageSettings(this.settings);
		const globalStyles = renderGlobalStyles(this.settings || {});
		const body = "[]";
		return [fileInfo, pageSetup, globalStyles, body].join("\n\n");
	}

	protected renderFileInfo(): string {
		return [
			`// Document: ${this.settings.currentDoc || ""}`,
			`// Schema Version: ${this.settings.schema_version || ""}`,
		].join("\n");
	}
}