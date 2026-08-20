import { jsPDF } from "jspdf";
import { DayInHistoryData } from "../types/history";

/**
 * Generates a clean, educational study worksheet PDF for Today in History
 */
export function generateHistoryWorksheetPdf(data: DayInHistoryData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;

  // 1. Top Header Banner & Branding
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 28, "F");

  // Accent Line
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 28, pageWidth, 2, "F");

  // Logo & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PDFSun • Daily Knowledge & History Worksheet", 14, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(191, 219, 254); // Blue 200
  doc.text(`Educational Study Sheet • ${data.formattedDate} • ${data.countryName || "Global History"}`, 14, 20);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text("https://www.pdfsun.in/today-in-history", pageWidth - 14, 20, { align: "right" });

  y = 38;

  // 2. Featured Headline Banner Box
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // Slate 800
  const splitHeadline = doc.splitTextToSize(`TODAY'S HIGHLIGHT: ${data.featuredHeadline}`, pageWidth - 36);
  doc.text(splitHeadline, 18, y + 6);

  y += 22;

  // 3. Section: Major Historical Milestones
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Major Historical Milestones & Geopolitics", 14, y);
  y += 6;

  if (data.events && data.events.length > 0) {
    data.events.slice(0, 4).forEach((event) => {
      // Event Year Tag Box
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(14, y - 4, 16, 6, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(String(event.year), 22, y, { align: "center" });

      // Headline
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(event.headline, 34, y);
      y += 4.5;

      // Description
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const splitDesc = doc.splitTextToSize(event.description, pageWidth - 48);
      doc.text(splitDesc, 34, y);
      y += splitDesc.length * 4.2 + 3;
    });
  }

  y += 2;

  // 4. Section: Famous Birthdays & Cultural Pioneers
  if (data.births && data.births.length > 0 && y < pageHeight - 80) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("2. Notable Birthdays & Historical Legends", 14, y);
    y += 6;

    data.births.slice(0, 3).forEach((birth) => {
      doc.setFillColor(147, 51, 234); // Purple 600
      doc.roundedRect(14, y - 4, 16, 6, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(String(birth.year), 22, y, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(birth.headline, 34, y);
      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const splitDesc = doc.splitTextToSize(birth.description, pageWidth - 48);
      doc.text(splitDesc, 34, y);
      y += splitDesc.length * 4.2 + 3;
    });
  }

  y += 2;

  // 5. Section: Daily Trivia Challenge & Study Question
  if (data.dailyTrivia && y < pageHeight - 50) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("3. Daily Student Knowledge & Quiz Challenge", 18, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const splitQ = doc.splitTextToSize(data.dailyTrivia.question, pageWidth - 36);
    doc.text(splitQ, 18, y + 12);

    let optY = y + 18;
    data.dailyTrivia.options.slice(0, 4).forEach((opt, idx) => {
      const letter = String.fromCharCode(65 + idx);
      doc.setFont("helvetica", "bold");
      doc.text(`[  ] ${letter}.`, 20, optY);
      doc.setFont("helvetica", "normal");
      doc.text(opt, 32, optY);
      optY += 4.5;
    });
  }

  // 6. Footer Disclaimer & Watermark
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(
    "Generated for free educational use via PDFSun (https://www.pdfsun.in) • 100% Client-Side WebAssembly Privacy Protected",
    14,
    pageHeight - 8
  );
  doc.text(
    `Page 1 of 1 • ${new Date().toLocaleDateString()}`,
    pageWidth - 14,
    pageHeight - 8,
    { align: "right" }
  );

  // Trigger download
  const cleanDate = (data.formattedDate || "history").toLowerCase().replace(/[^a-z0-9]/g, "-");
  doc.save(`pdfsun-today-in-history-${cleanDate}.pdf`);
}
