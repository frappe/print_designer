import { convertToTypst } from "@typst/typst_exporter";
import { TypstDocumentBuilder } from "@typst/typst_converter/TypstDocumentBuilder";

window.convertToTypst = convertToTypst;
window.TypstDocumentBuilder = TypstDocumentBuilder;