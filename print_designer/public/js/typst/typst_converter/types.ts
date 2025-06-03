export interface PageMargin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PageSettings {
  width?: number;
  height?: number;
  orientation?: "portrait" | "landscape";
  margin?: PageMargin;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  headerHeight?: number;
  footerHeight?: number;
  backgroundColor?: string;
  backgroundImage?: string;
  opacity?: number;
}

export interface GlobalStyleBlock {
  style: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GlobalStyles {
  staticText?: GlobalStyleBlock;
  dynamicText?: GlobalStyleBlock;
  rectangle?: GlobalStyleBlock;
  image?: GlobalStyleBlock;
  barcode?: GlobalStyleBlock;
  table?: GlobalStyleBlock;
}

export interface Settings {
  page?: PageSettings;
  currentPageSize?: string;
  header?: unknown[];
  footer?: unknown[];
  currentDoc?: string;
  schema_version?: string;
  globalStyles?: GlobalStyles;
}
export interface PaddingValues {
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
}