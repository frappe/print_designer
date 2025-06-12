// typst_converter/renderers/body.ts
import type { BodyNode } from "@typst/typst_converter/types";
import { escapeText } from "@typst/typst_converter/utils/text";
import { toPt } from "@typst/typst_converter/utils/size";
import type { Settings } from "@typst/typst_converter/types";

const SKIP_IF_EMPTY_LABELS = new Set(["Address:", "Amount in Words"]);

export function renderBodyToTypst(body: BodyNode[], settings: any): string {
  return body
    .map((node) => renderBodyNode(node))
    .filter((line): line is string => line !== null)
    .join("\n");
}

function renderBodyNode(node: BodyNode): string | null {
  const wrapWithPlace = (content: string): string => {
    if (!node.position) return content;

    const { x, y, width, height } = node.position;

    return `#place(dx: ${x}, dy: ${y},
  block(
    width: ${width},
    height: ${height},
    ${content}
  )
)`;
  };

  switch (node.type) {
    case "staticText": {
      const label = (node.label || "").trim();
      if (!label) return null;

      const content = `${node.styleName || "staticText"}([${escapeText(label)}])`;
      return wrapWithPlace(content);
    }

    case "dataField": {
      const label = (node.label || "").trim();
      const value = (node.value || "").toString().trim();
      if (!value || SKIP_IF_EMPTY_LABELS.has(label)) return null;

      const body = `${escapeText(label)} ${escapeText(value)}`;
      const content = `${node.styleName || "dynamicText"}([${body}])`;
      return wrapWithPlace(content);
    }

    default:
      return null;
  }
}

export function flattenPrintDesignerToBodyNodes(raw: any[]): BodyNode[] {
  const result: BodyNode[] = [];

  function recurse(nodes: any[]) {
    for (const node of nodes) {
      const position = {
        x: toPt(node.startX),
        y: toPt(node.startY),
        width: toPt(node.width),
        height: toPt(node.height),
      };

      if (node.type === "text" && Array.isArray(node.dynamicContent)) {
        for (const dc of node.dynamicContent) {
          if (dc.fieldtype === "StaticText") {
            const textValue = (dc.value || "")
              .replace(/&nbsp;/g, " ")
              .trim();
            if (!textValue || SKIP_IF_EMPTY_LABELS.has(textValue)) continue;

            result.push({
              type: "staticText",
              label: textValue,
              styleName: "staticText",
              position,
            });
          } else {
            const label = (dc.label || "").replace(/&nbsp;/g, " ").trim();
            if (!label || SKIP_IF_EMPTY_LABELS.has(label)) continue;

            result.push({
              type: "dataField",
              label,
              value: `{{ ${dc.fieldname} }}`,
              fieldname: dc.fieldname,
              styleName: "dynamicText",
              position,
            });
          }
        }
      }

      if (Array.isArray(node.childrens)) {
        recurse(node.childrens);
      }
    }
  }

  recurse(raw);
  return result;
}