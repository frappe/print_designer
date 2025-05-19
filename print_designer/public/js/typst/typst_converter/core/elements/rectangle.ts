import type { RectangleElement } from '@typst/typst_converter/types';
import { renderElement } from '@typst/typst_converter/core/elements/element';
import { toPt } from '@typst/typst_converter/utils/size';
import { indent } from '@typst/typst_converter/utils/indent';

export function renderRectangle(el: RectangleElement) {
  const childrenText = (el.childrens || [])
    .map(renderElement)
    .join('\n\n');
  const width = toPt(el.width ?? 0);
  const height = toPt(el.height ?? 0);
  const x = toPt(el.pageX ?? 0);
  const y = toPt(el.pageY ?? 0);

  return `#box(
    width: ${width},
    height: ${height},
    inset: (x: ${x}, y: ${y})
  )[
${indent(childrenText)}
  ]`;
}