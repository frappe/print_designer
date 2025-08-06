// @typst/typst_converter/test/test_text.ts
import { describe, it, expect } from "vitest";
import { escapeText, sanitizeFontFamily } from "../utils/text";

describe("escapeText", () => {
  it("should escape special characters in Typst", () => {
    const raw = `This is [escaped] with "quotes" and \\slashes\\`;
    const escaped = escapeText(raw);
    expect(escaped).toBe('This is \\[escaped\\] with \\"quotes\\" and \\\\slashes\\\\');
  });
});

describe("sanitizeFontFamily", () => {
  it("should clean and format font family list", () => {
    const raw = `"Inter", "Arial", "sans-serif"`;
    const result = sanitizeFontFamily(raw);
    expect(result).toBe('("Inter", "Arial", "Helvetica")');
  });
});