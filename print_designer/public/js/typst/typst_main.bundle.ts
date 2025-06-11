import { TypstDocumentBuilder } from "@typst/typst_converter/TypstDocumentBuilder";
import { convertToTypst } from "@typst/typst_exporter";
import "@typst/typst_pdf"

window.convertToTypst = convertToTypst;
window.TypstDocumentBuilder = TypstDocumentBuilder;
