import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import {
  QrCode,
  ArrowLeft,
  Download,
  Copy,
  Check,
  Printer,
  Upload,
  FileSpreadsheet,
  Sliders,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  Trash2,
  ImagePlus,
  Link2,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  Contact,
  MapPin,
  ClipboardList,
  FileCheck2,
} from "lucide-react";
import {
  QrContentType,
  QrEccLevel,
  QrStudioPayloadInput,
  QrStudioRenderOptions,
  QrVerificationResult,
  buildQrPayload,
  validateQrLogoFile,
  resolveEffectiveEcc,
  generateQrStudioSvg,
  renderAndVerifyQrCanvas,
  verifyQrPayloadViaMatrixPixels,
} from "../lib/qrStudioEngine";
import { sanitizeSpreadsheetCell, escapeCsvField } from "../lib/barcodeEngine";
import { ToolHistoryItem } from "../types";
import { triggerErrorToast } from "./GlobalErrorToast";
import { toStrictArrayBuffer } from "../utils/binaryUtils";
import {
  trackToolOpened,
  trackProcessStarted,
  trackProcessCompleted,
  trackOutputValidated,
  trackDownloadInitiated,
  trackProcessFailed,
} from "../utils/analytics";

export interface QrCodeGeneratorToolProps {
  onClose?: () => void;
  onAddHistory?: (item: ToolHistoryItem) => void;
  onOpenArticle?: (slug: string) => void;
}

const GUIDE_SLUG = "complete-guide-qr-code-generator-wifi-vcard-pdf-links";
const BULK_QR_LIMIT = 500;

const CONTENT_TYPES: Array<{ id: QrContentType; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: "url", label: "Website URL", icon: Link2 },
  { id: "text", label: "Plain Text", icon: FileText },
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone Call", icon: Phone },
  { id: "sms", label: "SMS Message", icon: MessageSquare },
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "vcard", label: "vCard Contact", icon: Contact },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { id: "location", label: "Location GPS", icon: MapPin },
  { id: "google-forms", label: "Google Forms", icon: ClipboardList },
  { id: "pdf-menu", label: "PDF / Menu Link", icon: FileCheck2 },
];

interface BulkQrRow {
  rowIndex: number;
  payload: string;
  caption: string;
  valid: boolean;
  error?: string;
}

export const QrCodeGeneratorTool: React.FC<QrCodeGeneratorToolProps> = ({
  onClose,
  onAddHistory,
  onOpenArticle,
}) => {
  const [workspaceMode, setWorkspaceMode] = useState<"simple" | "advanced" | "bulk">("simple");
  const [contentType, setContentType] = useState<QrContentType>("url");

  // Structured state across all 11 content types
  const [urlVal, setUrlVal] = useState("https://www.pdfsun.in");
  const [textVal, setTextVal] = useState("PDFSun Client-Side Document Workspace");
  const [emailTo, setEmailTo] = useState("support@pdfsun.in");
  const [emailSubject, setEmailSubject] = useState("Document Inquiry");
  const [emailBody, setEmailBody] = useState("");
  const [phoneVal, setPhoneVal] = useState("+919876543210");
  const [smsPhone, setSmsPhone] = useState("+919876543210");
  const [smsMsg, setSmsMsg] = useState("Hello from PDFSun");
  const [wifiSsid, setWifiSsid] = useState("OfficeGuestWiFi");
  const [wifiPassword, setWifiPassword] = useState("GuestPass2026");
  const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);

  const [vcFirst, setVcFirst] = useState("Aarav");
  const [vcLast, setVcLast] = useState("Sharma");
  const [vcOrg, setVcOrg] = useState("PDFSun Studio");
  const [vcTitle, setVcTitle] = useState("Product Lead");
  const [vcPhone, setVcPhone] = useState("+919876543210");
  const [vcEmail, setVcEmail] = useState("contact@pdfsun.in");
  const [vcWebsite, setVcWebsite] = useState("https://www.pdfsun.in");
  const [vcAddress, setVcAddress] = useState("Jaipur, India");

  const [waPhone, setWaPhone] = useState("+919876543210");
  const [waMsg, setWaMsg] = useState("Hi, I scanned your PDFSun QR code.");
  const [locLat, setLocLat] = useState("26.9124");
  const [locLng, setLocLng] = useState("75.7873");
  const [formsUrl, setFormsUrl] = useState("https://forms.gle/exampleFormId");
  const [pdfMenuUrl, setPdfMenuUrl] = useState("https://www.pdfsun.in/menu.pdf");

  // Customization options
  const [size, setSize] = useState<number>(320);
  const [margin, setMargin] = useState<number>(2);
  const [ecc, setEcc] = useState<QrEccLevel>("M");
  const [foreground, setForeground] = useState<string>("#0f172a");
  const [background, setBackground] = useState<string>("#ffffff");
  const [transparentBackground, setTransparentBackground] = useState<boolean>(false);
  const [caption, setCaption] = useState<string>("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string>("");
  const [logoScaleRatio, setLogoScaleRatio] = useState<number>(0.2);

  // Verification & feedback state
  const [verification, setVerification] = useState<QrVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<"payload" | "svg" | "png" | null>(null);
  const [exportStatus, setExportStatus] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Bulk state
  const [bulkRows, setBulkRows] = useState<BulkQrRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState<string>("");
  const [bulkBusy, setBulkBusy] = useState<boolean>(false);
  const [bulkExportFormat, setBulkExportFormat] = useState<"png" | "svg">("png");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    trackToolOpened("qr-code-generator");
  }, []);

  const payloadInput: QrStudioPayloadInput = useMemo(
    () => ({
      type: contentType,
      url: { url: urlVal },
      text: { text: textVal },
      email: { to: emailTo, subject: emailSubject, body: emailBody },
      phone: { phone: phoneVal },
      sms: { phone: smsPhone, message: smsMsg },
      wifi: { ssid: wifiSsid, password: wifiPassword, encryption: wifiEncryption, hidden: wifiHidden },
      vcard: {
        firstName: vcFirst,
        lastName: vcLast,
        organization: vcOrg,
        title: vcTitle,
        phone: vcPhone,
        email: vcEmail,
        website: vcWebsite,
        address: vcAddress,
      },
      whatsapp: { phone: waPhone, message: waMsg },
      location: { latitude: locLat, longitude: locLng },
      googleForms: { url: formsUrl },
      pdfMenu: { url: pdfMenuUrl },
    }),
    [
      contentType,
      urlVal,
      textVal,
      emailTo,
      emailSubject,
      emailBody,
      phoneVal,
      smsPhone,
      smsMsg,
      wifiSsid,
      wifiPassword,
      wifiEncryption,
      wifiHidden,
      vcFirst,
      vcLast,
      vcOrg,
      vcTitle,
      vcPhone,
      vcEmail,
      vcWebsite,
      vcAddress,
      waPhone,
      waMsg,
      locLat,
      locLng,
      formsUrl,
      pdfMenuUrl,
    ]
  );

  const builtPayload = useMemo(() => buildQrPayload(payloadInput), [payloadInput]);

  const effectiveEcc = useMemo(
    () => resolveEffectiveEcc(ecc, Boolean(logoDataUrl)),
    [ecc, logoDataUrl]
  );

  const renderOptions: QrStudioRenderOptions = useMemo(
    () => ({
      size,
      margin,
      ecc: effectiveEcc,
      foreground,
      background,
      transparentBackground,
      logoDataUrl: workspaceMode !== "simple" ? logoDataUrl : null,
      logoScaleRatio,
      caption: workspaceMode !== "simple" ? caption : "",
    }),
    [
      size,
      margin,
      effectiveEcc,
      foreground,
      background,
      transparentBackground,
      workspaceMode,
      logoDataUrl,
      logoScaleRatio,
      caption,
    ]
  );

  // Render live canvas and perform real jsQR round-trip verification
  useEffect(() => {
    let cancelled = false;
    async function renderAndScan() {
      const canvas = canvasRef.current;
      if (!canvas || !builtPayload.valid) {
        setVerification(null);
        return;
      }
      setIsVerifying(true);
      try {
        const res = await renderAndVerifyQrCanvas(canvas, builtPayload.payload, renderOptions);
        if (!cancelled) {
          setVerification(res);
        }
      } catch (err: any) {
        if (!cancelled) {
          setVerification({
            verified: false,
            decodedText: null,
            exactMatch: false,
            error: err?.message || "Failed to render QR code.",
          });
        }
      } finally {
        if (!cancelled) setIsVerifying(false);
      }
    }
    renderAndScan();
    return () => {
      cancelled = true;
    };
  }, [builtPayload, renderOptions]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const headerBuffer = await file.slice(0, 16).arrayBuffer();
      const validation = validateQrLogoFile({
        name: file.name,
        type: file.type,
        size: file.size,
        headerBytes: new Uint8Array(headerBuffer),
      });
      if (!validation.valid) {
        triggerErrorToast("Logo Rejected", validation.error || "Invalid logo file.");
        return;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read logo file."));
        reader.readAsDataURL(file);
      });
      setLogoDataUrl(dataUrl);
      setLogoName(file.name);
      setEcc("H");
    } catch (err: any) {
      triggerErrorToast("Logo Upload Error", err?.message || "Failed to process logo.");
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const recordAnalytics = (ext: string, bytesLength: number, latencyMs: number) => {
    // Strictly privacy-safe metadata: extension + byte size only (never log Wi-Fi passwords/vCards)
    trackProcessCompleted("qr-code-generator", latencyMs, ext, bytesLength);
    trackOutputValidated("qr-code-generator", ext, bytesLength);
    trackDownloadInitiated("qr-code-generator", ext, bytesLength);
    if (onAddHistory) {
      onAddHistory({
        id: String(Date.now()),
        toolId: "qr-code-generator",
        toolName: "QR Code Generator",
        fileName: `qr-${contentType}.${ext}`,
        fileSize: bytesLength,
        timestamp: Date.now(),
        status: "downloaded",
      });
    }
  };

  const handleDownloadPng = async (forceTransparent = false) => {
    if (!builtPayload.valid) return;
    setIsExporting(true);
    const t0 = performance.now();
    trackProcessStarted("qr-code-generator", "png", 0);
    try {
      const exportCanvas = document.createElement("canvas");
      const opts = {
        ...renderOptions,
        size: Math.max(512, renderOptions.size),
        transparentBackground: forceTransparent ? true : renderOptions.transparentBackground,
      };
      await renderAndVerifyQrCanvas(exportCanvas, builtPayload.payload, opts);
      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG generation failed"))), "image/png");
      });
      const suffix = opts.transparentBackground ? "-transparent" : "";
      triggerDownload(blob, `pdfsun-qr-${contentType}${suffix}.png`);
      recordAnalytics("png", blob.size, performance.now() - t0);
      setExportStatus("PNG downloaded");
      setTimeout(() => setExportStatus(""), 2500);
    } catch (err: any) {
      trackProcessFailed("qr-code-generator", performance.now() - t0);
      triggerErrorToast("PNG Export Failed", err?.message || "Could not export QR PNG.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJpg = async () => {
    if (!builtPayload.valid) return;
    setIsExporting(true);
    const t0 = performance.now();
    trackProcessStarted("qr-code-generator", "jpg", 0);
    try {
      const exportCanvas = document.createElement("canvas");
      await renderAndVerifyQrCanvas(exportCanvas, builtPayload.payload, {
        ...renderOptions,
        size: Math.max(512, renderOptions.size),
        transparentBackground: false,
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("JPG generation failed"))),
          "image/jpeg",
          0.95
        );
      });
      triggerDownload(blob, `pdfsun-qr-${contentType}.jpg`);
      recordAnalytics("jpg", blob.size, performance.now() - t0);
      setExportStatus("JPG downloaded");
      setTimeout(() => setExportStatus(""), 2500);
    } catch (err: any) {
      trackProcessFailed("qr-code-generator", performance.now() - t0);
      triggerErrorToast("JPG Export Failed", err?.message || "Could not export QR JPG.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSvg = async () => {
    if (!builtPayload.valid) return;
    setIsExporting(true);
    const t0 = performance.now();
    trackProcessStarted("qr-code-generator", "svg", 0);
    try {
      const svg = await generateQrStudioSvg(builtPayload.payload, renderOptions);
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      triggerDownload(blob, `pdfsun-qr-${contentType}.svg`);
      recordAnalytics("svg", blob.size, performance.now() - t0);
      setExportStatus("Vector SVG downloaded");
      setTimeout(() => setExportStatus(""), 2500);
    } catch (err: any) {
      trackProcessFailed("qr-code-generator", performance.now() - t0);
      triggerErrorToast("SVG Export Failed", err?.message || "Could not generate SVG QR.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!builtPayload.valid) return;
    setIsExporting(true);
    const t0 = performance.now();
    trackProcessStarted("qr-code-generator", "pdf", 0);
    try {
      const exportCanvas = document.createElement("canvas");
      await renderAndVerifyQrCanvas(exportCanvas, builtPayload.payload, {
        ...renderOptions,
        size: 640,
        transparentBackground: false,
      });
      const imgData = exportCanvas.toDataURL("image/png");
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const qrDrawW = 280;
      const qrDrawH = qrDrawW * (exportCanvas.height / Math.max(1, exportCanvas.width));
      const x = (pageW - qrDrawW) / 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(caption.trim() || "PDFSun Verified QR Code", pageW / 2, 72, { align: "center" });
      doc.addImage(imgData, "PNG", x, 108, qrDrawW, qrDrawH);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Scan with any smartphone camera or QR reader.", pageW / 2, 128 + qrDrawH, {
        align: "center",
      });

      const pdfBytes = new Uint8Array(doc.output("arraybuffer"));
      const blob = new Blob([toStrictArrayBuffer(pdfBytes)], { type: "application/pdf" });
      triggerDownload(blob, `pdfsun-qr-${contentType}.pdf`);
      recordAnalytics("pdf", blob.size, performance.now() - t0);
      setExportStatus("Printable PDF downloaded");
      setTimeout(() => setExportStatus(""), 2500);
    } catch (err: any) {
      trackProcessFailed("qr-code-generator", performance.now() - t0);
      triggerErrorToast("PDF Export Failed", err?.message || "Could not create QR PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async (kind: "payload" | "svg" | "png") => {
    if (!builtPayload.valid) return;
    try {
      if (kind === "payload") {
        await navigator.clipboard.writeText(builtPayload.payload);
      } else if (kind === "svg") {
        const svg = await generateQrStudioSvg(builtPayload.payload, renderOptions);
        await navigator.clipboard.writeText(svg);
      } else {
        const canvas = document.createElement("canvas");
        await renderAndVerifyQrCanvas(canvas, builtPayload.payload, renderOptions);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Clipboard PNG failed"))), "image/png");
        });
        if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        } else {
          throw new Error("PNG clipboard copy not supported in this browser.");
        }
      }
      setCopiedType(kind);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err: any) {
      triggerErrorToast("Copy Failed", err?.message || "Clipboard unavailable.");
    }
  };

  // Bulk handlers
  const handleDownloadBulkSample = (format: "csv" | "xlsx") => {
    const sampleRows = [
      ["payload", "caption"],
      ["https://www.pdfsun.in/merge-pdf", "Merge PDF"],
      ["https://www.pdfsun.in/compress-pdf", "Compress PDF"],
      ["https://www.pdfsun.in/barcode-generator", "Barcode Studio"],
      ["mailto:support@pdfsun.in?subject=Help", "Support Email"],
    ];

    if (format === "csv") {
      const csv = sampleRows.map((r) => r.map(escapeCsvField).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      triggerDownload(blob, "pdfsun-qr-bulk-template.csv");
    } else {
      const safeRows = sampleRows.map((r) => r.map(sanitizeSpreadsheetCell));
      const ws = XLSX.utils.aoa_to_sheet(safeRows);
      Object.keys(ws).forEach((k) => {
        if (!k.startsWith("!") && ws[k]) {
          ws[k].t = "s";
          ws[k].z = "@";
        }
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "QRCodes");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
      const blob = new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      triggerDownload(blob, "pdfsun-qr-bulk-template.xlsx");
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", raw: false });
      const first = wb.SheetNames[0];
      if (!first) throw new Error("No worksheet found in spreadsheet.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[first], {
        raw: false,
        defval: "",
      });
      if (!rows.length) throw new Error("Spreadsheet contains zero rows.");

      const limited = rows.slice(0, BULK_QR_LIMIT);
      if (rows.length > BULK_QR_LIMIT) {
        triggerErrorToast(
          "Batch Cap Applied",
          `First ${BULK_QR_LIMIT} QR rows loaded for optimal browser responsiveness.`
        );
      }

      const parsed: BulkQrRow[] = limited.map((row, idx) => {
        const keys = Object.keys(row);
        const payloadKey =
          keys.find((k) => /^(payload|url|link|text|data|value)$/i.test(k.trim())) || keys[0];
        const captionKey = keys.find((k) => /^(caption|label|title|name)$/i.test(k.trim()));

        const rawPayload = String(row[payloadKey] ?? "").trim();
        const rowCaption = captionKey ? String(row[captionKey] ?? "").trim() : "";

        if (!rawPayload) {
          return {
            rowIndex: idx + 1,
            payload: "",
            caption: rowCaption,
            valid: false,
            error: "Empty QR payload",
          };
        }
        const scanCheck = verifyQrPayloadViaMatrixPixels(rawPayload, effectiveEcc);
        return {
          rowIndex: idx + 1,
          payload: rawPayload,
          caption: rowCaption,
          valid: scanCheck.verified && scanCheck.exactMatch,
          error: scanCheck.error,
        };
      });

      setBulkFileName(file.name);
      setBulkRows(parsed);
    } catch (err: any) {
      triggerErrorToast("Import Failed", err?.message || "Could not parse spreadsheet.");
    } finally {
      setBulkBusy(false);
      if (bulkInputRef.current) bulkInputRef.current.value = "";
    }
  };

  const validBulkRows = useMemo(() => bulkRows.filter((r) => r.valid), [bulkRows]);

  const handleBulkExportZip = async () => {
    if (!validBulkRows.length) return;
    setBulkBusy(true);
    const t0 = performance.now();
    trackProcessStarted("qr-code-generator", "zip", validBulkRows.length);
    try {
      const zip = new JSZip();
      for (const item of validBulkRows) {
        const baseName = `${String(item.rowIndex).padStart(3, "0")}-${
          (item.caption || "qr").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32)
        }`;
        const rowOpts = { ...renderOptions, caption: item.caption || renderOptions.caption };
        if (bulkExportFormat === "svg") {
          const svg = await generateQrStudioSvg(item.payload, rowOpts);
          zip.file(`${baseName}.svg`, svg);
        } else {
          const c = document.createElement("canvas");
          await renderAndVerifyQrCanvas(c, item.payload, { ...rowOpts, size: 420 });
          const blob = await new Promise<Blob>((resolve, reject) => {
            c.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG failure"))), "image/png");
          });
          zip.file(`${baseName}.png`, blob);
        }
      }

      const csvRows = [
        ["row", "caption", "status"],
        ...bulkRows.map((r) => [String(r.rowIndex), r.caption, r.valid ? "VERIFIED" : `ERROR: ${r.error || "Invalid"}`]),
      ];
      const csv = csvRows.map((r) => r.map(escapeCsvField).join(",")).join("\n");
      zip.file("manifest.csv", csv);

      const bytes = await zip.generateAsync({ type: "uint8array" });
      const zipBlob = new Blob([toStrictArrayBuffer(bytes)], { type: "application/zip" });
      triggerDownload(zipBlob, `pdfsun-qr-batch-${validBulkRows.length}.zip`);
      recordAnalytics("zip", zipBlob.size, performance.now() - t0);
    } catch (err: any) {
      trackProcessFailed("qr-code-generator", performance.now() - t0);
      triggerErrorToast("ZIP Export Failed", err?.message || "Could not create ZIP archive.");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkExportPdfSheet = async () => {
    if (!validBulkRows.length) return;
    setBulkBusy(true);
    const t0 = performance.now();
    trackProcessStarted("qr-code-generator", "pdf", validBulkRows.length);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 36;
      const cols = 3;
      const gap = 14;
      const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
      const cellH = 185;
      const rowsPerPage = Math.floor((pageH - margin * 2) / cellH);
      const perPage = cols * rowsPerPage;

      for (let i = 0; i < validBulkRows.length; i++) {
        if (i > 0 && i % perPage === 0) doc.addPage();
        const idxOnPage = i % perPage;
        const col = idxOnPage % cols;
        const row = Math.floor(idxOnPage / cols);
        const x = margin + col * (cellW + gap);
        const y = margin + row * cellH;

        const item = validBulkRows[i];
        const c = document.createElement("canvas");
        await renderAndVerifyQrCanvas(c, item.payload, {
          ...renderOptions,
          size: 320,
          transparentBackground: false,
          caption: item.caption || "",
        });
        const imgData = c.toDataURL("image/png");
        const drawW = cellW - 20;
        const drawH = drawW * (c.height / Math.max(1, c.width));
        doc.setDrawColor(226, 232, 240);
        doc.rect(x, y, cellW, cellH - 10);
        doc.addImage(imgData, "PNG", x + 10, y + 10, drawW, Math.min(cellH - 30, drawH));
      }

      const bytes = new Uint8Array(doc.output("arraybuffer"));
      const blob = new Blob([toStrictArrayBuffer(bytes)], { type: "application/pdf" });
      triggerDownload(blob, `pdfsun-qr-sheet-${validBulkRows.length}.pdf`);
      recordAnalytics("pdf", blob.size, performance.now() - t0);
    } catch (err: any) {
      trackProcessFailed("qr-code-generator", performance.now() - t0);
      triggerErrorToast("PDF Export Failed", err?.message || "Could not create PDF label sheet.");
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Top Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer shrink-0"
              aria-label="Back to all PDFSun tools"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
              QR Code Generator
            </h1>
            <p className="text-xs text-slate-300 truncate">
              11 Content Types · jsQR Scan Verified · Transparent PNG, SVG & PDF
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 bg-slate-800 rounded-lg border border-slate-700" role="tablist" aria-label="QR workspace mode">
            {(
              [
                { id: "simple", label: "Simple", icon: Sparkles },
                { id: "advanced", label: "Advanced", icon: Sliders },
                { id: "bulk", label: "Bulk CSV/Excel", icon: Layers },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = workspaceMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setWorkspaceMode(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                    active ? "bg-amber-500 text-white" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <a
            href={`/blog/${GUIDE_SLUG}`}
            onClick={(e) => {
              if (onOpenArticle) {
                e.preventDefault();
                onOpenArticle(GUIDE_SLUG);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 whitespace-nowrap shrink-0 transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>QR Code Guide</span>
          </a>
        </div>
      </div>

      {workspaceMode !== "bulk" ? (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Content Type Selector Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="QR code content type">
            {CONTENT_TYPES.map((ct) => {
              const Icon = ct.icon;
              const active = contentType === ct.id;
              return (
                <button
                  key={ct.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setContentType(ct.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition cursor-pointer ${
                    active
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{ct.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Forms & Customization */}
            <div className="lg:col-span-6 space-y-4">
              {contentType === "url" && (
                <div>
                  <label htmlFor="qr-url-input" className="block text-xs font-bold mb-1.5">
                    Destination Website URL
                  </label>
                  <input
                    id="qr-url-input"
                    type="url"
                    value={urlVal}
                    onChange={(e) => setUrlVal(e.target.value)}
                    placeholder="https://www.pdfsun.in"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
              )}

              {contentType === "text" && (
                <div>
                  <label htmlFor="qr-text-input" className="block text-xs font-bold mb-1.5">
                    Plain Text Message
                  </label>
                  <textarea
                    id="qr-text-input"
                    rows={4}
                    value={textVal}
                    onChange={(e) => setTextVal(e.target.value)}
                    placeholder="Enter any plain text..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
              )}

              {contentType === "email" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Recipient Email</label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Message Body</label>
                    <textarea
                      rows={2}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                    />
                  </div>
                </div>
              )}

              {contentType === "phone" && (
                <div>
                  <label className="block text-xs font-bold mb-1.5">Phone Number (with country code)</label>
                  <input
                    type="tel"
                    value={phoneVal}
                    onChange={(e) => setPhoneVal(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
                  />
                </div>
              )}

              {contentType === "sms" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Recipient Phone</label>
                    <input
                      type="tel"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Pre-filled SMS Message</label>
                    <textarea
                      rows={2}
                      value={smsMsg}
                      onChange={(e) => setSmsMsg(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                    />
                  </div>
                </div>
              )}

              {contentType === "wifi" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Network Name (SSID)</label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Security</label>
                      <select
                        value={wifiEncryption}
                        onChange={(e) => setWifiEncryption(e.target.value as "WPA" | "WEP" | "nopass")}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None (Open)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Password</label>
                      <input
                        type="text"
                        disabled={wifiEncryption === "nopass"}
                        value={wifiEncryption === "nopass" ? "" : wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wifiHidden}
                      onChange={(e) => setWifiHidden(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <span>Hidden SSID Network</span>
                  </label>
                </div>
              )}

              {contentType === "vcard" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">First Name</label>
                    <input
                      type="text"
                      value={vcFirst}
                      onChange={(e) => setVcFirst(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Last Name</label>
                    <input
                      type="text"
                      value={vcLast}
                      onChange={(e) => setVcLast(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Organization</label>
                    <input
                      type="text"
                      value={vcOrg}
                      onChange={(e) => setVcOrg(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Job Title</label>
                    <input
                      type="text"
                      value={vcTitle}
                      onChange={(e) => setVcTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      value={vcPhone}
                      onChange={(e) => setVcPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Email</label>
                    <input
                      type="email"
                      value={vcEmail}
                      onChange={(e) => setVcEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Website</label>
                    <input
                      type="url"
                      value={vcWebsite}
                      onChange={(e) => setVcWebsite(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Work Address</label>
                    <input
                      type="text"
                      value={vcAddress}
                      onChange={(e) => setVcAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>
              )}

              {contentType === "whatsapp" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">WhatsApp Phone (with country code)</label>
                    <input
                      type="tel"
                      value={waPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Pre-filled Greeting</label>
                    <textarea
                      rows={2}
                      value={waMsg}
                      onChange={(e) => setWaMsg(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                    />
                  </div>
                </div>
              )}

              {contentType === "location" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Latitude (-90 to 90)</label>
                    <input
                      type="text"
                      value={locLat}
                      onChange={(e) => setLocLat(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Longitude (-180 to 180)</label>
                    <input
                      type="text"
                      value={locLng}
                      onChange={(e) => setLocLng(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
                    />
                  </div>
                </div>
              )}

              {contentType === "google-forms" && (
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Google Forms Link (forms.gle or docs.google.com/forms)
                  </label>
                  <input
                    type="url"
                    value={formsUrl}
                    onChange={(e) => setFormsUrl(e.target.value)}
                    placeholder="https://forms.gle/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
              )}

              {contentType === "pdf-menu" && (
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Hosted PDF or Digital Menu URL
                  </label>
                  <input
                    type="url"
                    value={pdfMenuUrl}
                    onChange={(e) => setPdfMenuUrl(e.target.value)}
                    placeholder="https://www.pdfsun.in/menu.pdf"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
              )}

              {/* Quick Contrast / Transparent Toggle even in Simple Mode */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transparentBackground}
                    onChange={(e) => setTransparentBackground(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Transparent PNG Background</span>
                </label>

                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  ECC: {effectiveEcc} {logoDataUrl && workspaceMode === "advanced" ? "(Auto-Locked for Logo)" : ""}
                </span>
              </div>

              {/* Advanced Styling Controls */}
              {workspaceMode === "advanced" && (
                <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-bold mb-1">Optional Bottom Caption</label>
                    <input
                      type="text"
                      maxLength={48}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="e.g. Scan for Menu / Wi-Fi"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Error Correction</label>
                      <select
                        value={effectiveEcc}
                        disabled={Boolean(logoDataUrl)}
                        onChange={(e) => setEcc(e.target.value as QrEccLevel)}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-60"
                      >
                        <option value="L">L (7%)</option>
                        <option value="M">M (15%)</option>
                        <option value="Q">Q (25%)</option>
                        <option value="H">H (30%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex justify-between text-xs font-semibold mb-1">
                        <span>Size</span>
                        <span className="font-mono tabular-nums">{size}px</span>
                      </label>
                      <input
                        type="range"
                        min={200}
                        max={640}
                        step={20}
                        value={size}
                        onChange={(e) => setSize(Number(e.target.value))}
                        className="w-full accent-amber-500 mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="flex justify-between text-xs font-semibold mb-1">
                        <span>Margin</span>
                        <span className="font-mono tabular-nums">{margin}</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={6}
                        step={1}
                        value={margin}
                        onChange={(e) => setMargin(Number(e.target.value))}
                        className="w-full accent-amber-500 mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-semibold">Module Color</span>
                      <input
                        type="color"
                        value={foreground}
                        onChange={(e) => setForeground(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-semibold">Background</span>
                      <input
                        type="color"
                        disabled={transparentBackground}
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent disabled:opacity-40"
                      />
                    </label>
                  </div>

                  {/* Safe Center Raster Logo Upload */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold">Center Brand Logo (PNG / JPG / WEBP, max 5 MB)</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          SVG logos are blocked for XSS safety. Uploading a logo automatically enforces ECC-H.
                        </div>
                      </div>
                      {logoDataUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoDataUrl(null);
                            setLogoName("");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold whitespace-nowrap cursor-pointer shrink-0">
                          <ImagePlus className="w-3.5 h-3.5" />
                          <span>Upload Logo</span>
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {logoDataUrl && (
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-xs truncate text-slate-600 dark:text-slate-300">{logoName}</span>
                        <div className="flex items-center gap-2 w-40 shrink-0">
                          <span className="text-[11px] font-mono tabular-nums">
                            {Math.round(logoScaleRatio * 100)}%
                          </span>
                          <input
                            type="range"
                            min={0.12}
                            max={0.22}
                            step={0.01}
                            value={logoScaleRatio}
                            onChange={(e) => setLogoScaleRatio(Number(e.target.value))}
                            className="w-full accent-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Live Canvas + jsQR Verification + Exports */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-6 flex flex-col items-center justify-center min-h-[320px] print:border-0 print:bg-white">
                {builtPayload.valid ? (
                  <>
                    <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 print:hidden">
                      {isVerifying ? (
                        <span className="text-xs font-semibold text-slate-500">Running jsQR scan check...</span>
                      ) : verification?.verified && verification?.exactMatch ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Verified Scannable — Exact Payload Match</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{verification?.error || "Scan contrast warning — test before printing"}</span>
                        </span>
                      )}
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        {builtPayload.payload.length} chars
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs ${
                        transparentBackground
                          ? "bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px]"
                          : "bg-white"
                      }`}
                    >
                      <canvas
                        ref={canvasRef}
                        aria-label={`QR Code preview for ${contentType}`}
                        className="max-w-[260px] max-h-[300px] w-auto h-auto block"
                      />
                    </div>

                    {exportStatus && (
                      <div className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 print:hidden">
                        {exportStatus}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center max-w-sm space-y-2 py-8">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                    <h2 className="text-sm font-bold">Complete QR Input</h2>
                    <p className="text-xs text-red-600 dark:text-red-400">{builtPayload.error}</p>
                  </div>
                )}
              </div>

              {/* Export Buttons */}
              <div className="space-y-3 print:hidden">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    disabled={!builtPayload.valid || isExporting}
                    onClick={() => handleDownloadPng(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-45 text-white text-xs font-bold whitespace-nowrap transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{transparentBackground ? "Transparent PNG" : "Download PNG"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={!builtPayload.valid || isExporting}
                    onClick={handleDownloadSvg}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-45 text-white text-xs font-bold whitespace-nowrap transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Vector SVG</span>
                  </button>
                  <button
                    type="button"
                    disabled={!builtPayload.valid || isExporting}
                    onClick={handleDownloadJpg}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-45 text-slate-800 dark:text-slate-200 text-xs font-bold whitespace-nowrap border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JPG</span>
                  </button>
                  <button
                    type="button"
                    disabled={!builtPayload.valid || isExporting}
                    onClick={handleDownloadPdf}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white text-xs font-bold whitespace-nowrap transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Print PDF</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!builtPayload.valid}
                      onClick={() => handleDownloadPng(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-45 text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Alpha PNG</span>
                    </button>
                    <button
                      type="button"
                      disabled={!builtPayload.valid}
                      onClick={() => handleCopy("png")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-45 text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      {copiedType === "png" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === "png" ? "PNG Copied" : "Copy PNG"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!builtPayload.valid}
                      onClick={() => handleCopy("svg")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-45 text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      {copiedType === "svg" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === "svg" ? "SVG Copied" : "Copy SVG"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!builtPayload.valid}
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-45 text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Zero upload of Wi-Fi / vCard data</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Bulk QR Batch Mode */
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Bulk QR Code Import (CSV / XLS / XLSX)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Upload up to {BULK_QR_LIMIT} rows with <code className="font-mono text-amber-600 dark:text-amber-400">payload</code> (or <code className="font-mono text-amber-600 dark:text-amber-400">url</code>) and optional <code className="font-mono text-amber-600 dark:text-amber-400">caption</code>. Every QR is verified via jsQR before packaging.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadBulkSample("csv")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sample CSV</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadBulkSample("xlsx")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>Sample XLSX</span>
              </button>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold whitespace-nowrap cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{bulkBusy ? "Verifying..." : "Upload CSV / Excel"}</span>
                <input
                  ref={bulkInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleBulkUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {bulkRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-3">
              <QrCode className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold">No QR batch spreadsheet loaded yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Import a CSV or Excel sheet of links, coupon codes, or event passes to generate verified QR codes and export them as a ZIP archive or A4 PDF print sheet.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                  <span className="font-sans font-bold text-slate-800 dark:text-slate-200">{bulkFileName}</span>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {validBulkRows.length} Verified
                  </span>
                  <span>·</span>
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    {bulkRows.length - validBulkRows.length} Failed
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={bulkExportFormat}
                    onChange={(e) => setBulkExportFormat(e.target.value as "png" | "svg")}
                    aria-label="ZIP QR image format"
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="png">ZIP: High-DPI PNG</option>
                    <option value="svg">ZIP: Vector SVG</option>
                  </select>
                  <button
                    type="button"
                    disabled={!validBulkRows.length || bulkBusy}
                    onClick={handleBulkExportZip}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-45 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ZIP ({validBulkRows.length})</span>
                  </button>
                  <button
                    type="button"
                    disabled={!validBulkRows.length || bulkBusy}
                    onClick={handleBulkExportPdfSheet}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>A4 PDF QR Sheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkRows([]);
                      setBulkFileName("");
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    aria-label="Clear imported QR batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[360px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2.5 font-bold">#</th>
                      <th className="px-3 py-2.5 font-bold">Payload</th>
                      <th className="px-3 py-2.5 font-bold">Caption</th>
                      <th className="px-3 py-2.5 font-bold">jsQR Scan Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {bulkRows.map((r) => (
                      <tr key={r.rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-mono tabular-nums text-slate-500">{r.rowIndex}</td>
                        <td className="px-3 py-2 font-mono truncate max-w-[280px]">{r.payload || "(empty)"}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{r.caption || "—"}</td>
                        <td className="px-3 py-2">
                          {r.valid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Scan Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{r.error || "Invalid"}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
