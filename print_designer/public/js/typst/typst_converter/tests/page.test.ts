// @typst/typst_converter/test/test_page.ts
import { describe, it, expect } from "vitest";
import { renderPageSettings } from "../core/page";

describe("renderPageSettings", () => {
  it("should generate correct Typst page settings", () => {
    const settings = {
      page: {
        size: "a4",
        flipped: false,
        margin: "0mm",
        headerHeight: "43.64mm",
        footerHeight: "39.36mm",
      },
    };

    const result = renderPageSettings(settings as any);
    expect(result).toContain('#set page(');
    expect(result).toContain('paper: "a4"');
    expect(result).toContain('flipped: false');
    expect(result).toContain('margin: 0.00mm');
    expect(result).toContain('header: [');
    expect(result).toContain('Header Placeholder');
    expect(result).toContain('footer: [');
    expect(result).toContain('Footer Placeholder');
  });
});