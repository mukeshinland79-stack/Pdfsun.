# PDFSun.in — Phase 12 Architecture & Technical Implementation Plan
## Next-Generation Universal PDF-to-Word & Financial Document Intelligence Engine

**Canonical Production:** `https://www.pdfsun.in/`  
**Production Status:** **STRICTLY FROZEN — ZERO PRODUCTION MODIFICATIONS OR DEPLOYMENTS**  
**Authorized Local Scope:** Verified Development Workspace (`port: 3000`)  
**Primary Mission:** Transform PDFSun's PDF-to-Word converter into a privacy-first, enterprise-grade financial and business document reconstruction engine.

---

## User Review & Confirmed Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed in Phase 1 interactive planning:

- **Confirmed Decision 1 (Document Profiling):** **Auto-detect profile with manual mode override.** The engine analyzes spatial layout and content markers upon PDF load to detect whether the file is a GST Tax Invoice, Bank/Ledger Statement, Commercial Contract, Scanned Receipt, or Standard Text document, while giving the user full freedom to switch modes before conversion.
- **Confirmed Decision 2 (Quality Assurance UI):** **Inline interactive Quality HUD with audit checklist.** After conversion, an interactive, collapsible Financial Integrity HUD appears directly in the workspace, detailing line item equality, GSTIN/PAN preservation, debit/credit parity, and table completeness.
- **Confirmed Decision 3 (OCR Ambiguity Handling):** **Highlight ambiguous characters with review indicators.** Commonly confused financial characters (`0`/`O`, `1`/`I`/`l`, `5`/`S`, `8`/`B`, `.`/`,`, `-`/`—`) in amounts and identifiers are preserved as recognized but highlighted in the Quality HUD with amber review indicators rather than silently guessed or altered.
- **Recommended Architectural Standard:** **100% Client-Side In-Memory Execution.** No cloud uploads, no third-party paid APIs, zero data retention. All AST transformations occur in local browser memory via WebAssembly and Web Workers.

---

## 1. Overview & Core Concept

PDFSun is upgrading its PDF-to-Word conversion core into a **Universal Document Intelligence Engine**. While general PDF converters treat pages as arbitrary text blocks or flat images, this engine performs deep structural parsing:
- **18 Universal Document Classes:** Ordinary text documents, GST invoices, purchase/sales bills, retail receipts, financial statements, bank statements, balance sheets, profit & loss reports, purchase orders, credit/debit notes, quotations, delivery challans, utility bills, medical bills, payroll slips, tax forms, international VAT invoices, and scanned receipts.
- **Strict Content Fidelity:** The engine never omits, hallucinates, recalculates, or silently alters financial numbers, currency signs, debit/credit assignments, or tax totals.
- **Three Professional Conversion Modes:**
  1. `Mode 1: Editable Word` — Prioritizes continuous paragraphs, heading typography, native Word tables, lists, and vector graphics.
  2. `Mode 2: Financial & Business Fidelity` — Prioritizes precise coordinate alignment, table cell boundaries, ledger column mapping, GSTIN/PAN formatting, and strict debit/credit separation.
  3. `Mode 3: Scanned PDF to Editable Word` — Executes local-first adaptive binarization, Sauvola contrast enhancement, OCR with confusable-character tracking, and spatial grid synthesis.

---

## 2. User Experience & Visual Design

Following our SaaS & Dashboard Design Constitution (`frontend-design`):

### Key User Flows

```
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────────┐     ┌──────────────────────┐
│  Upload PDF     │ ──> │ Auto-Detection &     │ ──> │ Client-Side Processing │ ──> │ Inline Quality HUD & │
│  (Drag & Drop)  │     │ Mode Selection Bar   │     │ (WASM / Web Worker)    │     │ Instant Word Download│
└─────────────────┘     └──────────────────────┘     └────────────────────────┘     └──────────────────────┘
```

1. **Upload State:** User drops a PDF into the existing upload container. The file is validated locally (`File.size`, `application/pdf`).
2. **Profile & Mode Bar:** An interactive segmented control displays the auto-detected classification (e.g., `🇮🇳 GST Tax Invoice Detected` or `🏦 Bank Statement Detected`) with an instant selector for the 3 professional modes:
   - `Editable Word` (Flow & Typography)
   - `Financial Fidelity` (Exact Invoices & Ledgers)
   - `Scanned OCR` (Image-to-DOCX with Ambiguity HUD)
3. **Progress & Feedback:** Real-time progress bar (0–100%) showing deterministic phase labels (*Parsing spatial bounding boxes*, *Reconstructing invoice tables*, *Validating financial parity*, *Compiling OpenXML DOCX*).
4. **Post-Conversion Inline Quality HUD:**
   - **Quality Scorecard:** PASS / WARNING / FAIL / NOT TESTED badges based on algorithmic source-to-output verification.
   - **Financial Integrity Audit:** Collapsible checklist comparing detected Invoice Numbers, GSTINs, Tax Totals, and Debit/Credit balances.
   - **Ambiguity Review:** Badges highlighting any uncertain OCR characters (e.g., `INV-202[6/O]`) for one-click copy and manual verification.
   - **One-Click Actions:** Download DOCX, Download Quality Report, Instant Text Preview, and Open in Pipeline.

### Visual Styling & Component Hierarchy
- **Palette:** Deep obsidian background (`#0A0A0C`), elevated cards (`#141418`), subtle 1px borders (`rgba(255, 255, 255, 0.08)`), vibrant orange primary accent (`#F97316`), and emerald integrity accents (`#10B981`).
- **Tabular Figures:** Monospace tabular numerals (`font-mono tabular-nums`) across all financial tables, currencies, and timestamps to eliminate decimal jitter.
- **Zero-Pill Restraint:** Metadata displayed as clean, unboxed text separated by typographic middots (`·`). Interactive controls use segmented functional buttons.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Hybrid Profile Engine vs. Generic Parser
- **Chosen Approach:** Implement a dedicated Financial Classifier & Document Intelligence module (`src/lib/financialDocumentIntelligence.ts`) that extracts semantic entities (GSTIN, HSN, Tax Breakdown, Debit/Credit columns) while utilizing the existing UDIR AST framework.
- **Why:** Invoices and balance sheets require distinct typographic line-heights, right-aligned monetary cells, and merged header cells that degrade when parsed as standard narrative text.
- **Alternatives Considered:** A generic text-box exporter produces disjointed floating frames in Microsoft Word that are difficult to edit.

### Decision 2: Rule-Based Deterministic Auditing vs. External AI Quality Verification
- **Chosen Approach:** 100% deterministic, rule-based verification comparing extracted PDF tokens against compiled DOCX OpenXML nodes.
- **Why:** Guarantees zero document leaks, works completely offline, incurs zero latency or token costs, and ensures strict compliance with our privacy mandate.
- **Alternatives Considered:** Sending documents to an LLM for quality checking would violate the zero-server-upload privacy guarantee and fail offline.

### Decision 3: Character Confidence Flagging vs. Automated Character Guessing
- **Chosen Approach:** Preserve the exact character recognized by Tesseract/WASM, but extract confidence scores and flag confusable pairs (`0`/`O`, `1`/`I`, `5`/`S`) in the Quality HUD.
- **Why:** Silently "correcting" an invoice number like `INV-0100` to `INV-O1OO` or vice-versa leads to accounting and tax audit rejections.

---

## 4. Technical Architecture & Data Strategy

### System Component Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                PDFSun Browser Client Runtime                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   ActiveToolWorkspace.tsx                                                              │
│   ├── DocumentProfileSelector (Auto-detect: GST / Banking / Commercial / General)      │
│   ├── ModeSwitchControls (Editable Word / Financial Fidelity / Scanned OCR)            │
│   └── FinancialQualityHud (Inline Audit Checklist: PASS / WARN / FAIL)                 │
│                                │                                                       │
│                                ▼                                                       │
│   src/lib/enterprisePdfToWordEngine.ts (Universal Orchestrator)                        │
│   │                                                                                    │
│   ├── 1. pdfjs-dist WASM Parser ─────> Spatial Coordinate Matrix (X, Y, Font, Glyphs)  │
│   │                                                                                    │
│   ├── 2. financialDocumentIntelligence.ts (Specialized Profiles)                       │
│   │      ├── GstRule46Detector (Supplier, Recipient, GSTIN, HSN, CGST/SGST/IGST)      │
│   │      ├── BankingLedgerEngine (Debit/Credit balance preservation)                   │
│   │      └── InternationalTaxProfile (UK VAT, EU VAT, US Sales Tax)                    │
│   │                                                                                    │
│   ├── 3. financialDataIntegrityEngine.ts (Source-to-Output Validator)                  │
│   │      ├── Numeric & Currency Integrity (₹, $, €, %, leading zeroes)                 │
│   │      ├── Identifier Lock (PAN, GSTIN, IBAN, SWIFT, Invoice #)                      │
│   │      └── Ambiguous Character Detector (0/O, 1/I, 5/S review flags)                │
│   │                                                                                    │
│   ├── 4. src/core/udir/ (Universal Document AST)                                       │
│   │      Document ──> Section ──> Page ──> Table ──> Row ──> Cell ──> Paragraph ──> Run│
│   │                                                                                    │
│   └── 5. docx OpenXML Compiler ──────> Output DOCX Stream (Uint8Array)                 │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Subsystems to Implement

1. **`src/lib/financialDocumentIntelligence.ts`**:
   - `detectDocumentProfile(tokens: SpatialTextToken[])`: Classifies document into `gst_invoice`, `bank_statement`, `balance_sheet`, `purchase_order`, `utility_bill`, `retail_receipt`, or `general_doc`.
   - `extractGstInvoiceEntities(tokens)`: Recognizes Indian GST Rule 46 fields (Supplier, GSTIN, HSN, Taxable Value, CGST, SGST, IGST, Cess, Reverse Charge).
   - `extractBankingLedgerEntities(tokens)`: Detects Date, Particulars/Description, Cheque/Ref #, Withdrawals/Debit, Deposits/Credit, and Balance columns.
   - `extractInternationalTaxEntities(tokens)`: Recognizes UK VAT, EU VAT, and US Sales Tax configurations without hardcoding.
2. **`src/lib/financialDataIntegrityEngine.ts`**:
   - `auditFinancialIntegrity(sourceTokens, compiledDocx)`: Cross-validates source numbers, currency symbols, and identifiers against the generated DOCX.
   - `detectConfusableCharacters(text, confidence)`: Highlights ambiguous pairs (`0`/`O`, `1`/`I`, `5`/`S`, `8`/`B`, `.`/`,`).
   - Produces structured QA result: `{ overallStatus: 'PASS' | 'WARNING' | 'FAIL', checks: QualityCheckItem[], warnings: string[] }`.
3. **`src/lib/enterprisePdfToWordEngine.ts` Enhancement**:
   - Support `mode`: `"editable_word" | "financial_fidelity" | "scanned_ocr"`.
   - Integrate `financialDocumentIntelligence` for cell alignment, columnar grouping, and table mesh generation.
   - Attach `qualityAudit` to conversion result.
4. **`src/components/ActiveToolWorkspace.tsx` Enhancement**:
   - Render the **Inline Financial Quality HUD** below conversion output with interactive audit metrics, detected document type, and confusable character badges.
   - Add conversion mode selector and document profile indicators.

---

## 5. Automated Verification & Testing Strategy

A dedicated test harness `scripts/verify-phase12-financial-word.ts` will validate 25 synthetic fixtures:
1. Indian GST B2B Invoice with HSN codes & multi-tier tax rates.
2. Indian GST B2C Retail Invoice with QR Code & e-invoice reference.
3. Credit Note with negative tax adjustments.
4. Debit Note with supplementary tax charge.
5. Bill of Supply with exempt items.
6. Bank Statement with 40+ debit/credit rows and running balance check.
7. Balance Sheet with Assets and Liabilities columns.
8. Profit & Loss Statement with operational revenue and tax line items.
9. Purchase Order with shipping terms, item matrix, and approval blocks.
10. International UK VAT Invoice with GBP and 20% standard rate.
11. US Sales Tax Invoice with state/county sales tax breakdown.
12. Hindi-English bilingual tax invoice with Unicode Devanagari text.
13. Scanned PDF Invoice requiring WASM OCR and ambiguity flagging.
14. Complex multi-page financial ledger spanning 3 pages with continuous headers.
15. Large 10-page corporate financial report.

### Quality Verification Gates
- `npx tsc --noEmit` returns **0 errors**.
- `npm run build` succeeds cleanly.
- `scripts/verify-phase12-financial-word.ts` confirms:
  - Numeric equality across all 25 fixtures.
  - Zero swapping of Debit and Credit columns.
  - GSTIN `27AABCU9603R1ZM` and PAN identifiers strictly preserved.
  - Valid OpenXML DOCX archives generated (`PK\x03\x04`).

---

## 6. Production Safety & Rollback Plan

- **Canonical Production (`https://www.pdfsun.in/`):** **STRICTLY FROZEN.** Zero deployments, zero production database operations.
- **Rollback Snapshot:** Complete backup of `src/lib/enterprisePdfToWordEngine.ts` and `src/components/ActiveToolWorkspace.tsx` saved to `backups/phase12-pre/` prior to editing.
