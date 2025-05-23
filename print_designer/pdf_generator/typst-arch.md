# Architecture of PDF generation using Typst.

## Overview
```mermaid
graph TD
    A[Download PDF Request] -->|Fetch Print Format + Settings| B["Layout Converter"]
    B -->|Generate Typst Code| C["Typst Engine (WASM)"]
    C -->|Compile to PDF| D["PDF Blob"]
    D -->|Return Final PDF| E["Output to Client"]
```

## Class Diagram
```mermaid
classDiagram

    class PrintFormatService {
        + fetch_layout(print_format)
        + fetch_settings(print_format)
    }

    class LayoutConverter {
        + convert_to_typst(layout, settings)
        + sanitize_content()
        + apply_styles()
    }

    class TypstEngine {
        + compile(source_code) : PDF
        Note: Uses typst.ts WASM in browser
    }

    class PDFOutput {
        + generate_blob(pdf_bytes)
        + trigger_download()
    }

    Client --> PrintFormatService
    PrintFormatService --> LayoutConverter
    LayoutConverter --> TypstEngine
    TypstEngine --> PDFOutput
    PDFOutput --> Client
```

## Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Svc as PrintFormatService
    participant Conv as LayoutConverter
    participant Engine as TypstEngine (WASM)
    participant PDF as PDFOutput

    Client->>Svc: Request PDF
    Svc->>Svc: Fetch layout + settings
    Svc-->>Conv: Pass layout + style
    Conv->>Conv: Convert to Typst
    Conv-->>Engine: Typst source code
    Engine->>Engine: Compile to PDF
    Engine-->>PDF: PDF bytes
    PDF->>PDF: Generate Blob
    PDF->>Client: Return/download PDF
```
