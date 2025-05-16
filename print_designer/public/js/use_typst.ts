import { $typst } from '@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs';

// 👇 Inject manual WASM paths (CDN or local)
$typst.setCompilerInitOptions({
  getModule: async () =>
    // fetch('/assets/print_designer/typst/typst_ts_web_compiler_bg.wasm')
    fetch('https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.6.0/pkg/typst_ts_web_compiler_bg.wasm')
      .then(res => res.arrayBuffer()),
});

$typst.setRendererInitOptions({
  getModule: async () =>
    // fetch('/assets/print_designer/typst/typst_ts_renderer_bg.wasm')
    fetch('https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.6.0/pkg/typst_ts_renderer_bg.wasm')
      .then(res => res.arrayBuffer()),
});

// 👇 Actual usage
export async function exportTypstPdf(typstCode: string): Promise<void> {
  const pdf = await $typst.pdf({ mainContent: typstCode });
  if (!pdf) {
    throw new Error('Failed to generate PDF: output is undefined');
  }
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'typst-export.pdf';
  link.click();
}
