import { jsPDF } from "jspdf";
import { PaymentTransaction } from "../components/PaymentHistory";

/**
 * PDFSun Official Payment Receipt & Tax Invoice Generator
 * Generates an instant, vector-crisp, legally compliant PDF payment receipt
 * including PDFSun branding, SSL verification seal, itemized GST breakdown,
 * and an official angled vector "PAID" stamp.
 */
export function generatePaymentReceiptPdf(transaction: PaymentTransaction, userEmail?: string): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const email = userEmail || transaction.email || "customer@pdfsun.in";
  const amountINR = transaction.amountINR || transaction.amount || 0;
  const basePriceINR = Number((amountINR / 1.18).toFixed(2));
  const gstAmountINR = Number((amountINR - basePriceINR).toFixed(2));
  const cgstINR = Number((gstAmountINR / 2).toFixed(2));
  const sgstINR = Number((gstAmountINR / 2).toFixed(2));

  const invoiceNumber = transaction.invoiceNo || `INV-RZP-${transaction.id.replace(/^pay_/, "").toUpperCase().slice(0, 10)}`;
  const transactionId = transaction.id || "pay_mock_verified";
  const orderId = transaction.orderId || transaction.subscriptionId || `ord_${transactionId.slice(-8)}`;
  const paymentDate = transaction.date || new Date().toLocaleDateString("en-GB");
  const formattedDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Calculate validity period
  let validityDays = 365;
  const planLower = (transaction.plan || "").toLowerCase();
  if (planLower.includes("flex") || planLower.includes("7 day")) {
    validityDays = 7;
  } else if (planLower.includes("month")) {
    validityDays = 30;
  }
  const expiryDate = new Date(Date.now() + validityDays * 86400000).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // ==========================================
  // 1. TOP HEADER & BRANDING
  // ==========================================
  // Gradient Slate Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, "F");

  // Accent Orange/Amber Stripe
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 32, pageWidth, 2, "F");

  // PDFSun Logo Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("PDFSun.in", margin, 18);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text("Enterprise Cloud & WebAssembly Document Utility Engine", margin, 24);

  // Header Right: Official Receipt Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text("TAX INVOICE & RECEIPT", pageWidth - margin, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Receipt No: ${invoiceNumber}`, pageWidth - margin, 23, { align: "right" });

  let y = 44;

  // ==========================================
  // 2. SSL VERIFICATION & GATEWAY BADGE BAR
  // ==========================================
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "S");

  doc.setTextColor(16, 185, 129); // emerald-500
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("[SECURE 256-BIT SSL VERIFIED]", margin + 4, y + 7.5);

  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("•  Razorpay Level 1 PCI-DSS Payment Gateway Reconciled", margin + 64, y + 7.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("STATUS: COMPLETED & ACTIVE", pageWidth - margin - 4, y + 7.5, { align: "right" });

  y += 18;

  // ==========================================
  // 3. BILLED TO & PAYMENT SUMMARY CARDS
  // ==========================================
  const colWidth = (contentWidth - 6) / 2;

  // Billed To Box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, colWidth, 38, 2, 2, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, colWidth, 38, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("BILLED TO / SUBSCRIBER", margin + 5, y + 7);

  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(email, margin + 5, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Country: India (IN)", margin + 5, y + 20);
  doc.text(`Account ID: usr_${email.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}`, margin + 5, y + 26);
  doc.text("Platform: WebAssembly In-Browser Sandbox", margin + 5, y + 32);

  // Transaction Info Box
  const col2X = margin + colWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(col2X, y, colWidth, 38, 2, 2, "F");
  doc.roundedRect(col2X, y, colWidth, 38, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("TRANSACTION LEDGER DETAILS", col2X + 5, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment ID: ${transactionId}`, col2X + 5, y + 14);
  doc.text(`Order / Sub ID: ${orderId}`, col2X + 5, y + 20);
  doc.text(`Date & Time: ${paymentDate} (${formattedDate})`, col2X + 5, y + 26);
  doc.text("Payment Method: UPI / Cards / NetBanking (Razorpay)", col2X + 5, y + 32);

  y += 44;

  // ==========================================
  // 4. PLAN VALIDITY BANNER
  // ==========================================
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");
  doc.setDrawColor(52, 211, 153); // emerald-400
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text(`PLAN ACTIVATED: ${transaction.plan.toUpperCase()}`, margin + 5, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text(`Start Date: ${paymentDate}  |  Expiry Date: ${expiryDate}  |  Validity: ${validityDays} Days  |  Status: ACTIVE`, margin + 5, y + 10.5);

  y += 20;

  // ==========================================
  // 5. ITEMIZED BILLING & TAX TABLE
  // ==========================================
  // Table Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("ITEM DESCRIPTION & CODE", margin + 4, y + 5.5);
  doc.text("HSN / SAC", margin + 100, y + 5.5);
  doc.text("TAXABLE AMT", margin + 130, y + 5.5);
  doc.text("TOTAL (INR)", pageWidth - margin - 4, y + 5.5, { align: "right" });

  y += 8;

  // Row 1: Plan Base
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 12, "F");
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 12, pageWidth - margin, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(transaction.plan, margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("PDFSun Client-Side WASM SaaS Subscription", margin + 4, y + 9.5);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("998313", margin + 100, y + 7);
  doc.text(`Rs. ${basePriceINR.toFixed(2)}`, margin + 130, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${basePriceINR.toFixed(2)}`, pageWidth - margin - 4, y + 7, { align: "right" });

  y += 12;

  // Row 2: CGST (9%)
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.line(margin, y + 8, pageWidth - margin, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Central Goods & Services Tax (CGST @ 9%)", margin + 4, y + 5.5);
  doc.text("998313", margin + 100, y + 5.5);
  doc.text(`Rs. ${basePriceINR.toFixed(2)}`, margin + 130, y + 5.5);
  doc.text(`Rs. ${cgstINR.toFixed(2)}`, pageWidth - margin - 4, y + 5.5, { align: "right" });

  y += 8;

  // Row 3: SGST (9%)
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.line(margin, y + 8, pageWidth - margin, y + 8);

  doc.text("State Goods & Services Tax (SGST @ 9%)", margin + 4, y + 5.5);
  doc.text("998313", margin + 100, y + 5.5);
  doc.text(`Rs. ${basePriceINR.toFixed(2)}`, margin + 130, y + 5.5);
  doc.text(`Rs. ${sgstINR.toFixed(2)}`, pageWidth - margin - 4, y + 5.5, { align: "right" });

  y += 8;

  // Grand Total Row
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 12, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("GRAND TOTAL (INCLUSIVE OF ALL TAXES)", margin + 4, y + 8);

  doc.setFontSize(11);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(`Rs. ${amountINR}.00 INR`, pageWidth - margin - 4, y + 8, { align: "right" });

  y += 18;

  // ==========================================
  // 6. OFFICIAL VECTOR "PAID" STAMP WATERMARK
  // ==========================================
  // Draw an authentic angled vector "PAID" stamp in emerald/green
  doc.saveGraphicsState();
  const stampX = margin + 135;
  const stampY = y + 10;

  // Rotated rectangle stamp
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(1.2);
  doc.roundedRect(stampX, stampY, 44, 20, 3, 3, "S");

  // Inner dashed line
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.roundedRect(stampX + 1.5, stampY + 1.5, 41, 17, 2, 2, "S");
  doc.setLineDashPattern([], 0); // reset

  // Stamp Texts
  doc.setTextColor(16, 185, 129);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PAID", stampX + 22, stampY + 9, { align: "center" });

  doc.setFontSize(6.5);
  doc.text("VERIFIED BY RAZORPAY", stampX + 22, stampY + 14, { align: "center" });
  doc.text(`AUTH ${transactionId.slice(-6).toUpperCase()}`, stampX + 22, stampY + 17.5, { align: "center" });

  doc.restoreGraphicsState();

  // ==========================================
  // 7. TAX SUMMARY & LEGAL DISCLAIMER
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Tax & Compliance Declaration:", margin, y + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("1. This is a computer-generated tax invoice and requires no physical signature.", margin, y + 9);
  doc.text("2. Payment verified via Razorpay Technologies (PCI-DSS Level 1 Compliant).", margin, y + 14);
  doc.text("3. Reverse charge applicability: No. Output tax has been discharged in full.", margin, y + 19);
  doc.text("4. 7-Day Money-Back Guarantee applies as per PDFSun Terms of Service.", margin, y + 24);

  // ==========================================
  // 8. FOOTER
  // ==========================================
  const footerY = pageHeight - 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("PDFSun.in • Support: support@pdfsun.in • Canonical Domain: https://pdfsun.in", margin, footerY);
  doc.text(`Generated on ${formattedDate} • Page 1 of 1`, pageWidth - margin, footerY, { align: "right" });

  // Save/Download File
  const filename = `PDFSun_Receipt_${invoiceNumber}_${transactionId.slice(-6)}.pdf`;
  doc.save(filename);
}
