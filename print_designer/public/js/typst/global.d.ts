export {}; // makes this a module

declare global {
  interface Window {
    convertToTypst: any;
    TypstDocumentBuilder: any;
  }
}