import type { TypstDocumentBuilder } from "@typst/typst_converter/TypstDocumentBuilder";
import type { convertToTypst } from "@typst/typst_exporter";

// Extend the global scope
export {};

declare global {
	interface Frappe {
		print_preview?: {
		selected_format?: () => string;
		format?: string;
		selected_language?: () => string;
		};
		msgprint: (message: string | { title?: string; message: string; indicator?: string }) => void;
		show_alert: (message: string) => void;
		ready: (fn: () => void) => void;
		after_ajax: (fn: () => void) => void;
		get_route: () => string[];
		provide: (path: string) => void;
		ui: any;
		db: any;
		router: any;
	}

	var frappe: Frappe;

	interface Window {
		cur_frm?: any;
		frappe: Frappe;
		typstWasmCompile: (code: string) => Promise<Uint8Array>;
		convertToTypst: typeof convertToTypst;
		TypstDocumentBuilder: typeof TypstDocumentBuilder;
	}
}
