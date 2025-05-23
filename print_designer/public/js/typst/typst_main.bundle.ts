import { TypstDocumentBuilder } from "@typst/typst_converter/TypstDocumentBuilder";
import { convertToTypst } from "@typst/typst_exporter";

window.convertToTypst = convertToTypst;
window.TypstDocumentBuilder = TypstDocumentBuilder;
