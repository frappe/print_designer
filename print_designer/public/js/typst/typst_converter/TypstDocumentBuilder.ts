import type {
  Layout, Settings, StyleObject, TableStyles, Element
} from "@typst/typst_converter/types";
import {
  renderPageSettings,
  renderPage,
} from "@typst/typst_converter/core/page";
import {
  rectangleStyleToTypst,
  dynamicLabelStyleToTypst,
  tableGlobalStylesToTypst,
  globalTextStyleToTypst,
} from "@typst/typst_converter/core/style";

export class TypstDocumentBuilder {
  layout: Layout;
  settings: Settings;
  typstStyleBlocks: string[];

  constructor(layout: Layout, settings: Settings) {
    this.layout = layout;
    this.settings = settings;
    this.typstStyleBlocks = [];
  }

  /** Public API: Build Typst code */
  build(): string {
    this.typstStyleBlocks = [];
    const header = this.renderHeader();
    this.collectGlobalStyles();

    const pageSetup = renderPageSettings(this.settings);
    const pages = this.layout.body || [];
    const body = pages.map(renderPage).join('\n\n');

    return [
      header,
      pageSetup,
      ...this.typstStyleBlocks.filter(Boolean),
      body,
    ].join('\n\n');
  }

  /** Internal: Renders doc header (comments) */
  protected renderHeader(): string {
    return [
      `// Document: ${this.settings.currentDoc || ""}`,
      `// Schema Version: ${this.settings.schema_version || ""}`,
    ].join('\n');
  }

  /** Internal: Collect global style blocks as needed */
  protected collectGlobalStyles(): void {
    const gs = this.settings.globalStyles || {};
    if (gs.table)
      this.typstStyleBlocks.push(tableGlobalStylesToTypst(gs.table));
    if (gs.rectangle?.style)
      this.typstStyleBlocks.push(`#let rectangle_style = (\n  ${rectangleStyleToTypst(gs.rectangle.style)}\n)`);
    if (gs.barcode?.style)
      this.typstStyleBlocks.push(`#let barcode_style = (\n  ${rectangleStyleToTypst(gs.barcode.style)}\n)`);
    if (gs.image?.style)
      this.typstStyleBlocks.push(`#let image_style = (\n  ${rectangleStyleToTypst(gs.image.style)}\n)`);
    if (gs.staticText?.style)
      this.typstStyleBlocks.push(globalTextStyleToTypst(gs.staticText.style));
    if (gs.dynamicText?.labelStyle && Object.keys(gs.dynamicText.labelStyle).length)
      this.typstStyleBlocks.push(dynamicLabelStyleToTypst(gs.dynamicText.labelStyle));
  }
}