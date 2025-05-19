import { cssColorWithOpacityToTypstHex } from '@typst/typst_converter/utils/color';
import { STANDARD_SIZES, toMm, toPt } from '@typst/typst_converter/utils/size';
import type { Page } from '@typst/typst_converter/types';
import { Settings } from '@typst/typst_converter/types';
import { renderElement } from '@typst/typst_converter/core/elements/element';

type StandardSizeKey = keyof typeof STANDARD_SIZES;

export function renderPage(page: Page) {
  return page.childrens.map(renderElement).join('\n\n');
}

function isStandardSizeKey(key: string): key is StandardSizeKey {
  return Object.keys(STANDARD_SIZES).includes(key);
}

export function renderPageSettings(settings: Settings) {
  const page = settings.page || {};
  const keyCandidate = page.key || settings.currentPageSize || 'A4';

  const lines: string[] = [];
  if (isStandardSizeKey(keyCandidate)) {
    lines.push(`paper: "${keyCandidate.toLowerCase()}",`);
  } else {
    lines.push(
      `width: ${toMm(page.width || 210)},`,
      `height: ${toMm(page.height || 297)},`
    );
  }

  const orientation = page.orientation || 'portrait';
  lines.push(`flipped: ${orientation === 'landscape' ? 'true' : 'false'},`);

  lines.push(
    `margin: (
      top: ${toMm(page.marginTop || 0)},
      bottom: ${toMm(page.marginBottom || 0)},
      left: ${toMm(page.marginLeft || 0)},
      right: ${toMm(page.marginRight || 0)}
    ),`
  );
  if (page.backgroundImage) {
    lines.push(
      `background: image("${page.backgroundImage}", width: ${toMm(page.width ?? 210)}, height: ${toMm(page.height ?? 297)}, fit: cover),`
    );
  }
  if (page.backgroundColor) {
    lines.push(`fill: rgb("${cssColorWithOpacityToTypstHex(page.backgroundColor, page.opacity)}"),`);
  }

  if (page.header) lines.push(`header: ${page.header},`);
  if (page.footer) lines.push(`footer: ${page.footer},`);

  return `#set page(
  ${lines.filter(Boolean).join('\n  ')}
)`;
}