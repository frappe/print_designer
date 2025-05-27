import {
	renderPageSettings,
} from "@typst/typst_converter/core/page";
import type {
	Layout,
	Settings,
} from "@typst/typst_converter/types";

export class TypstDocumentBuilder {
	layout: Layout;
	settings: Settings;

	constructor(layout: Layout, settings: Settings) {
		this.layout = layout;
		this.settings = settings;
	}

	/** Public API: Build Typst code */
	build(): string {
		const header = this.renderFileInfo();
		const pageSetup = renderPageSettings(this.settings);

		return [
			header,
			pageSetup,
			"[]" // empty page content placeholder
		].join("\n\n");
	}

	/** Internal: Renders doc header (comments) */
	protected renderFileInfo(): string {
		return [
			`// Document: ${this.settings.currentDoc || ""}`,
			`// Schema Version: ${this.settings.schema_version || ""}`,
		].join("\n");
	}
}