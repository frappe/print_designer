import type { TypstDocumentBuilder } from "./typst_converter/TypstDocumentBuilder";
import type { convertToTypst } from "./typst_exporter";

declare global {
	interface Window {
		convertToTypst: typeof convertToTypst;
		TypstDocumentBuilder: typeof TypstDocumentBuilder;
	}
}
