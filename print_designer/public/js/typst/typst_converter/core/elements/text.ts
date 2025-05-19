import type { TextElement } from '@typst/typst_converter/types';
import { indent } from '@typst/typst_converter/utils/indent'; // or the correct path

export function renderText(el: TextElement) {
  const style = el.style || {};
  const leading = style.lineHeight ? `, leading: ${style.lineHeight}` : "";
  const dynamicLines = (el.dynamicContent || [])
    .map(dc => {
      if (dc.is_static || dc.print_hide) return null;
      let label = (dc.label || '').trim().replace(/:$/, '');
      const field = dc.fieldname?.trim();
      if (!field) return null;
      return `${label ? label + ': ' : ''}{{ ${field} }}`;
    })
    .filter(Boolean)
    .join('\\\\\n');
  return `#align(left)[\n#text[\n${indent(dynamicLines)}\n]${leading}\n]`;
}