// Standard page sizes
const STANDARD_SIZES = {
  A4: { width: 210, height: 297, unit: 'mm' },
  A5: { width: 148, height: 210, unit: 'mm' },
  Letter: { width: 8.5, height: 11, unit: 'in' },
  Legal: { width: 8.5, height: 14, unit: 'in' },
  // Add more if needed later
};


function convertToTypst(layout, settings) {
	const pages = layout.body || [];

	// key environment values
	const pageSetup = renderPageSettings(settings);
	const pdfPrintDPI = settings.page?.pdfPrintDPI || 96;
	const headerHeight = toPt(settings.page.headerHeight);
	const footerHeight = toPt(settings.page.footerHeight);
	const uom = settings.page.UOM || 'mm';

	// Conver content to Typst code
	const body = pages.map(renderPage).join('\n\n');


	return `${pageSetup}\n\n${body}`;
}

function renderPageSettings(settings) {
  const pageSizeKey = settings.currentPageSize || 'A4';
  const size = STANDARD_SIZES[pageSizeKey] || STANDARD_SIZES['A4'];
  const unit = size.unit || 'mm';

  const layoutWidth = `${size.width}${unit}`;
  const layoutHeight = `${size.height}${unit}`;

  const layoutMarginTop = toMm(settings.page?.marginTop || 0);
  const layoutMarginBottom = toMm(settings.page?.marginBottom || 0);
  const layoutMarginLeft = toMm(settings.page?.marginLeft || 0);
  const layoutMarginRight = toMm(settings.page?.marginRight || 0);

  return `#set page(
  width: ${layoutWidth},
  height: ${layoutHeight},
  margin: (
    top: ${layoutMarginTop},
    bottom: ${layoutMarginBottom},
    left: ${layoutMarginLeft},
    right: ${layoutMarginRight}
  )
)`;
}

function toMm(px) {
  return (px * 25.4 / 96).toFixed(2) + 'mm';
}

function renderPage(page) {
	return page.childrens.map(renderElement).join('\n\n');
}

function renderElement(el) {
	switch (el.type) {
		case 'text':
			return renderText(el);
		case 'rectangle':
			return renderRectangle(el);
		default:
			return `% [UNSUPPORTED]: ${el.type}`;
	}
}

function renderText(el) {
	const dynamicLines = (el.dynamicContent || [])
		.map(dc => {
			if (dc.is_static || dc.print_hide) return null;

			let label = (dc.label || '').trim().replace(/:$/, ''); // remove trailing colon
			const field = dc.fieldname?.trim();

			if (!field) return null;

			return `${label ? label + ': ' : ''}{{ ${field} }}`;
		})
		.filter(Boolean)
		.join('\\\\\n');

	return `#align(left)[\n#text[\n${indent(dynamicLines)}\n]\n]`;
}

function renderRectangle(el) {
	const childrenText = (el.childrens || [])
		.map(renderElement)
		.join('\n\n');

	const width = toPt(el.width);
	const height = toPt(el.height);
	const x = toPt(el.pageX || 0);
	const y = toPt(el.pageY || 0);

	return `#box(
  width: ${width},
  height: ${height},
  inset: (x: ${x}, y: ${y})
)[
${indent(childrenText)}
]`;
}

function toPt(px) {
	return (px / 1.333).toFixed(2) + 'pt';
}

function indent(text) {
	return text.split('\n').map(line => '  ' + line).join('\n');
}

export {
  convertToTypst,
  renderPageSettings,
  renderPage,
  renderRectangle,
  renderText,
  toPt,
  toMm,
};
