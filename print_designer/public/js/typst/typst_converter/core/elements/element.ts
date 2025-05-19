import { renderText } from '@typst/typst_converter/core/elements/text';
import { renderRectangle } from '@typst/typst_converter/core/elements/rectangle';
import type { Element, TextElement, RectangleElement } from '@typst/typst_converter/types';

export function renderElement(el: Element): string {
  switch (el.type) {
    case 'text':
      return renderText(el as TextElement);
    case 'rectangle':
      return renderRectangle(el as RectangleElement);
    default: {
      // For future-proofing, if an unknown type is passed, this will error at compile time
      const _exhaustiveCheck: never = el;
      return `% [UNSUPPORTED]: ${(el as any).type}`;
    }
  }
}