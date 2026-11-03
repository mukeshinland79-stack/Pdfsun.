# PDFSun.in — Phase 11F Technical Remediation & Independent Acceptance Plan
## Elite Engineering Remediation & 66/66 Customer Acceptance Certification

**System Role:** Unified Elite Engineering Organization (Principal Architect, AppSec Lead, Document Conversion Specialist, Independent QA Lead)  
**Canonical Production:** `https://www.pdfsun.in/`  
**Production Status:** **STRICTLY FROZEN — ZERO MODIFICATIONS — ZERO DEPLOYMENTS**  
**Execution Context:** Authorized Local Development Workspace (`port: 3000`)  
**Primary Owner:** `mukeshinland79@gmail.com`

---

## 1. Absolute Production Protection Boundary

- **Production Canonical Domain (`https://www.pdfsun.in/`):** STRICTLY FROZEN.
- **Prohibited Production Actions:**
  - Zero source code changes in production.
  - Zero deployment, traffic routing, or Cloud Run configuration alterations.
  - Zero Firebase/Firestore remote writes, rule modifications, or database migrations.
  - Zero production secret access or live payment gateway alterations.
- All testing and execution occurs exclusively within the local development workspace (`port: 3000`).

---

## 2. Phase 11E Baseline & Real-World File Audit Summary

The comprehensive 66-tool real-file audit conducted via `scripts/verify-phase11e-acceptance.ts` yielded the following verified baseline:
- **Total Registered Tools:** 66 / 66 audited
- **Passing Tools:** 48 PASS
- **Passing with Warnings:** 12 PASS WITH WARNINGS (AI tools mapped to Gemini Server Proxy `/api/ai/*` awaiting optional runtime `GEMINI_API_KEY`)
- **Failing Tools:** 6 FAIL (caused by 4 headless/bundler constructor interop limitations)
- **Untested Tools:** 0 NOT TESTED

### Prioritized Eight Video Workflows Baseline Status

| Workflow | Tool ID | Input Fixture | Output Expectation | Status | Root Cause Category |
|---|---|---|---|---|---|
| 1 | `image-to-excel` | Real PNG Receipt (68 KB) | Valid XLSX workbook | **FAIL** | Defect A (Canvas DOM dependency in OCR) |
| 2 | `image-to-word` | Real PNG Receipt (68 KB) | Valid DOCX document | **FAIL** | Defect A (Canvas DOM dependency in OCR) |
| 3 | `pdf-to-word` | Real Multi-Page Tax Invoice (INV-2026-994) | DOCX with GSTIN `27AABCU9603R1ZM` | **PASS** | Fully functional in both browser & Node |
| 4 | `pdf-to-powerpoint` | Real Multi-Page Tax Invoice (INV-2026-994) | Editable PPTX presentation | **FAIL** | Defect B (PptxGenJS ESM/CJS interop) |
| 5 | `pdf-to-excel` | Real Multi-Page Tax Invoice (INV-2026-994) | XLSX table with GSTIN & HSN codes | **PASS** | Fully functional in both browser & Node |
| 6 | `excel-to-pdf` | Real Quarterly Ledger XLSX (4 columns) | Clean PDF with zero dot-matrix noise | **FAIL** | Defect C (jsPDF ESM/CJS interop) |
| 7 | `word-to-pdf` | Real Operational Agreement DOCX | Clean PDF with typography & tables | **FAIL** | Defect D (Mammoth buffer mismatch) + Defect C |
| 8 | `powerpoint-to-pdf` | Real Roadmap PPTX presentation | Clean PDF presentation slides | **FAIL** | Defect C (jsPDF ESM/CJS interop) |

---

## 3. Forensic Investigation: Four Defect Categories & Exact Root Causes

### Defect A: Canvas DOM Dependency in OCR
- **Affected File:** `src/lib/enterpriseImageOcrEngine.ts`
- **Failing Tools:** `image-to-excel`, `image-to-word`
- **Exact Error:** `ReferenceError: document is not defined`
- **Root Cause:** At lines 135, 215, 263, 1426, and 1619, `document.createElement("canvas")` is called unconditionally. In web browsers this works natively, but in Node.js, headless test runners, or SSR environments without a global `document`, the process throws `ReferenceError`.
- **Targeted Fix:** Introduce a resilient canvas factory `createSafeCanvas(w, h)` that checks `typeof document !== "undefined"` first, falls back to `OffscreenCanvas` if available, and provides a headless canvas shim with 2D context methods for Node.js / automated verification.

### Defect B: PptxGenJS ESM/CommonJS Constructor Interop
- **Affected File:** `src/lib/enterprisePdfToPowerPointEngine.ts`
- **Failing Tool:** `pdf-to-powerpoint`
- **Exact Error:** `TypeError: PptxGenJS is not a constructor`
- **Root Cause:** Line 21 imports `import PptxGenJS from "pptxgenjs"`. In Vite/Node.js/ESM interop environments, the constructor may be located at `PptxGenJS.default` or `PptxGenJS`. Calling `new PptxGenJS()` directly at line 661 throws when the default export is wrapped in an ESM namespace object.
- **Targeted Fix:** Resolve constructor dynamically:
  ```typescript
  const PptxConstructor = (PptxGenJS as any).default || PptxGenJS;
  const pptx = new PptxConstructor();
  ```

### Defect C: jsPDF ESM/CommonJS Constructor Interop
- **Affected Files:** `src/lib/enterpriseExcelToPdfEngine.ts` (line 281), `src/lib/enterprisePowerPointToPdfEngine.ts` (line 523), `src/lib/enterpriseWordToPdfEngine.ts` (line 433)
- **Failing Tools:** `excel-to-pdf`, `powerpoint-to-pdf`, `word-to-pdf`
- **Exact Error:** `TypeError: jsPDF is not a constructor`
- **Root Cause:** `import jsPDF from "jspdf"` imports a module object where the constructor resides on `(jsPDF as any).default || (jsPDF as any).jsPDF || jsPDF`. Calling `new jsPDF(...)` directly throws in Node/bundler runtime environments.
- **Targeted Fix:** Safe constructor unwrapping:
  ```typescript
  const JsPdfConstructor = (jsPDF as any).default || (jsPDF as any).jsPDF || jsPDF;
  const doc = new JsPdfConstructor({...});
  ```

### Defect D: Mammoth Input Buffer Mismatch
- **Affected File:** `src/lib/enterpriseWordToPdfEngine.ts` (lines 192, 196)
- **Failing Tool:** `word-to-pdf`
- **Exact Error:** `Error: Could not find file in options`
- **Root Cause:** `mammoth.convertToHtml({ arrayBuffer })` passes only `{ arrayBuffer }`. While browser Mammoth accepts `{ arrayBuffer }`, the Node.js package distribution requires `{ buffer: Buffer }` or `{ path }`.
- **Targeted Fix:** Pass a dual-compatible input payload:
  ```typescript
  const mammothInput: any = typeof Buffer !== "undefined"
    ? { buffer: Buffer.from(arrayBuffer), arrayBuffer }
    : { arrayBuffer };
  const mammothRes = await mammoth.convertToHtml(mammothInput, mammothOptions);
  ```

---

## 4. Minimal Targeted Patch Specification

### File 1: `src/lib/enterpriseImageOcrEngine.ts`
- Add `createSafeCanvas(width, height)` utility at the top of Module 1.
- Replace direct `document.createElement("canvas")` invocations with `createSafeCanvas()` at lines 135, 215, 263, 1426, 1619.
- Preserve all existing 60 FPS yielding, Sauvola thresholding, deskew profile analysis, and OpenXML AST generation logic.

### File 2: `src/lib/enterprisePdfToPowerPointEngine.ts`
- At line 661, unwrap `PptxConstructor = (PptxGenJS as any).default || PptxGenJS`.
- Preserve slide geometry calculations, aspect ratio layouts (`PORTRAIT_16x9`, `LAYOUT_4x3`, `LAYOUT_16x9`), text box placements, and ephemeral RAM cleanup.

### File 3: `src/lib/enterpriseExcelToPdfEngine.ts`
- At line 281, unwrap `JsPdfConstructor = (jsPDF as any).default || (jsPDF as any).jsPDF || jsPDF`.
- Preserve pure white background initialization (`#FFFFFF`), single-pass collapsed vector gridlines, sub-pixel column width normalization, and auto-fit pagination.

### File 4: `src/lib/enterprisePowerPointToPdfEngine.ts`
- At line 523, unwrap `JsPdfConstructor = (jsPDF as any).default || (jsPDF as any).jsPDF || jsPDF`.
- Preserve slide hierarchy XML parsing, SmartArt vector rendering, typographic metrics, and slide dimension scaling.

### File 5: `src/lib/enterpriseWordToPdfEngine.ts`
- At line 192 and 196, provide `{ buffer: Buffer.from(arrayBuffer), arrayBuffer }` to Mammoth.
- At line 433, unwrap `JsPdfConstructor = (jsPDF as any).default || (jsPDF as any).jsPDF || jsPDF`.
- Preserve CSS font fallback trees, orphan heading avoidance, vector table drawing, and ephemeral RAM clearing.

---

## 5. Risk Assessment & Regression Strategy

| Risk Factor | Probability | Impact | Mitigation Strategy |
|---|---|---|---|
| Browser functionality regression | Very Low | High | The constructor unwrapping `(C as any).default || C` evaluates to `C` in standard browser ESM and `C.default` in CJS/bundler interop. Zero breaking changes in browser runtime. |
| Memory leaks or canvas corruption | Very Low | Medium | `createSafeCanvas` maintains identical CanvasRenderingContext2D API and canvas dimension assignment. |
| Production environment contamination | Zero | Critical | Local workspace isolation on port 3000. Cloud Run production remains untouched and strictly frozen. |

---

## 6. Verification & Certification Plan Upon Approval

1. **Static Analysis:** Execute `npx tsc --noEmit` to verify 0 TypeScript compiler diagnostics across the entire codebase.
2. **Automated Real-File Acceptance:** Re-execute `npx tsx scripts/verify-phase11e-acceptance.ts`:
   - All 6 previously failing tools transition to **PASS**.
   - 66/66 tools reach **PASS** (or **PASS WITH WARNINGS** for optional Gemini AI tools).
   - Zero HTTP 404 errors during in-memory blob generation and download triggering.
3. **Build Integrity Verification:** Execute `compile_applet` (`npm run build`) to ensure Vite bundle succeeds with zero errors.
4. **Final Deliverable:** Generate Phase 11F Independent Customer Acceptance Certificate.

---

## 7. Implementation Authorization Gate

**STATUS: READ-ONLY FORENSIC INVESTIGATION COMPLETE.**  
**SOURCE CODE REMAINS UNMODIFIED.**  
**AWAITING EXPLICIT OWNER APPROVAL (`mukeshinland79@gmail.com`) BEFORE APPLYING CODE EDITS.**
