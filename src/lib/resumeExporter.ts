import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import jsPDF from "jspdf";
import { ResumeData, ResumeStyle } from "../types";

/**
 * Downloads a binary blob as a named file in the browser.
 */
export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * Generates an ATS-compliant Microsoft Word (.docx) document from ResumeData.
 */
export async function exportResumeToDocx(data: ResumeData, filename = "Resume_PDFSun.docx") {
  const docParagraphs: Paragraph[] = [];

  // 1. Header: Name & Title
  docParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: data.personal.fullName || "Candidate Name",
          bold: true,
          size: 32, // 16pt
          font: "Calibri",
          color: "111827",
        }),
      ],
      spacing: { after: 80 },
    })
  );

  if (data.personal.title) {
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: data.personal.title,
            size: 24, // 12pt
            font: "Calibri",
            color: "4B5563",
            bold: true,
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  // 2. Contact Line
  const contactParts = [
    data.personal.email,
    data.personal.phone,
    data.personal.location,
    data.personal.linkedin,
    data.personal.portfolio,
    data.personal.github,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: contactParts.join(" | "),
            size: 19, // 9.5pt
            font: "Calibri",
            color: "374151",
          }),
        ],
        spacing: { after: 240 },
      })
    );
  }

  // Helper for Section Headings
  const addSectionHeading = (title: string) => {
    docParagraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 22, // 11pt
            font: "Calibri",
            color: "1F2937",
          }),
        ],
        border: {
          bottom: {
            color: "D1D5DB",
            space: 4,
            style: BorderStyle.SINGLE,
            size: 8,
          },
        },
        spacing: { before: 240, after: 120 },
      })
    );
  };

  // 3. Professional Summary
  if (data.summary && data.summary.trim()) {
    addSectionHeading("Professional Summary");
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.summary,
            size: 20, // 10pt
            font: "Calibri",
            color: "374151",
          }),
        ],
        spacing: { after: 160 },
      })
    );
  }

  // 4. Work Experience
  if (data.experience && data.experience.length > 0) {
    addSectionHeading("Work Experience");
    for (const exp of data.experience) {
      const dates = [exp.startDate, exp.isCurrent ? "Present" : exp.endDate].filter(Boolean).join(" - ");
      
      // Role & Dates line
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.role,
              bold: true,
              size: 21,
              font: "Calibri",
              color: "111827",
            }),
            new TextRun({
              text: ` | ${exp.company}${exp.location ? ` (${exp.location})` : ""}`,
              size: 20,
              font: "Calibri",
              color: "4B5563",
            }),
            new TextRun({
              text: dates ? `\t${dates}` : "",
              bold: true,
              size: 19,
              font: "Calibri",
              color: "6B7280",
            }),
          ],
          spacing: { before: 120, after: 60 },
        })
      );

      // Highlights
      if (exp.highlights && exp.highlights.length > 0) {
        for (const hl of exp.highlights) {
          if (!hl.trim()) continue;
          docParagraphs.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: hl,
                  size: 20,
                  font: "Calibri",
                  color: "374151",
                }),
              ],
              spacing: { after: 40 },
            })
          );
        }
      }
    }
  }

  // 5. Education
  if (data.education && data.education.length > 0) {
    addSectionHeading("Education");
    for (const edu of data.education) {
      const degText = [edu.degree, edu.field].filter(Boolean).join(" in ");
      const dates = [edu.startYear, edu.endYear].filter(Boolean).join(" - ");
      
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: degText || "Degree",
              bold: true,
              size: 21,
              font: "Calibri",
              color: "111827",
            }),
            new TextRun({
              text: ` | ${edu.school}${edu.location ? ` (${edu.location})` : ""}`,
              size: 20,
              font: "Calibri",
              color: "4B5563",
            }),
            new TextRun({
              text: dates ? `\t${dates}` : "",
              bold: true,
              size: 19,
              font: "Calibri",
              color: "6B7280",
            }),
          ],
          spacing: { before: 100, after: edu.gpa || edu.honors ? 40 : 100 },
        })
      );

      if (edu.gpa || edu.honors) {
        const extra = [edu.gpa ? `GPA: ${edu.gpa}` : "", edu.honors ? `Honors: ${edu.honors}` : ""].filter(Boolean).join(" | ");
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: extra,
                size: 19,
                font: "Calibri",
                color: "6B7280",
                italics: true,
              }),
            ],
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // 6. Skills
  const technicalSkills = data.skills?.technical || [];
  const softSkills = data.skills?.soft || [];
  const tools = data.skills?.tools || [];

  if (technicalSkills.length > 0 || softSkills.length > 0 || tools.length > 0) {
    addSectionHeading("Skills & Competencies");
    if (technicalSkills.length > 0) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Technical Skills: ", bold: true, size: 20, font: "Calibri", color: "1F2937" }),
            new TextRun({ text: technicalSkills.join(", "), size: 20, font: "Calibri", color: "374151" }),
          ],
          spacing: { after: 60 },
        })
      );
    }
    if (tools.length > 0) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Tools & Technologies: ", bold: true, size: 20, font: "Calibri", color: "1F2937" }),
            new TextRun({ text: tools.join(", "), size: 20, font: "Calibri", color: "374151" }),
          ],
          spacing: { after: 60 },
        })
      );
    }
    if (softSkills.length > 0) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Soft Skills: ", bold: true, size: 20, font: "Calibri", color: "1F2937" }),
            new TextRun({ text: softSkills.join(", "), size: 20, font: "Calibri", color: "374151" }),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // 7. Projects
  if (data.projects && data.projects.length > 0) {
    addSectionHeading("Key Projects");
    for (const proj of data.projects) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: proj.name, bold: true, size: 21, font: "Calibri", color: "111827" }),
            new TextRun({ text: proj.link ? ` (${proj.link})` : "", size: 19, font: "Calibri", color: "2563EB" }),
          ],
          spacing: { before: 80, after: 40 },
        })
      );
      if (proj.description) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: proj.description, size: 20, font: "Calibri", color: "374151" }),
            ],
            spacing: { after: 40 },
          })
        );
      }
      if (proj.technologies && proj.technologies.length > 0) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Technologies: ", bold: true, size: 19, font: "Calibri", color: "4B5563" }),
              new TextRun({ text: proj.technologies.join(", "), size: 19, font: "Calibri", color: "6B7280" }),
            ],
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // 8. Certifications
  if (data.certifications && data.certifications.length > 0) {
    addSectionHeading("Certifications");
    for (const cert of data.certifications) {
      docParagraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: "111827" }),
            new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Calibri", color: "374151" }),
            new TextRun({ text: cert.date ? ` (${cert.date})` : "", size: 19, font: "Calibri", color: "6B7280" }),
          ],
          spacing: { after: 40 },
        })
      );
    }
  }

  // 9. Languages
  if (data.languages && data.languages.length > 0) {
    addSectionHeading("Languages");
    const langStr = data.languages.map((l) => `${l.language} (${l.proficiency})`).join(" | ");
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: langStr, size: 20, font: "Calibri", color: "374151" }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  // Build Word Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: docParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerBrowserDownload(blob, filename);
}

/**
 * Generates high-fidelity ATS and styled PDF from ResumeData using jsPDF.
 */
export function exportResumeToPdf(data: ResumeData, style: ResumeStyle = "ats", filename = "Resume_PDFSun.pdf") {
  const doc = new jsPDF({
    unit: "pt",
    format: "letter", // 612 x 792 pt
  });

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin + 15;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin + 15;
    }
  };

  // Theme color palette based on selected style
  const colors = {
    ats: {
      primary: [17, 24, 39], // Slate 900
      secondary: [75, 85, 99], // Gray 600
      text: [31, 41, 55], // Gray 800
      divider: [209, 213, 219], // Gray 300
      accent: [249, 115, 22], // Orange
      font: "helvetica",
    },
    modern: {
      primary: [15, 76, 129], // Classic Corporate Navy
      secondary: [37, 99, 235], // Vibrant Blue
      text: [30, 41, 59], // Slate 800
      divider: [226, 232, 240], // Slate 200
      accent: [37, 99, 235],
      font: "helvetica",
    },
    executive: {
      primary: [15, 23, 42], // Deep Charcoal Navy
      secondary: [120, 53, 15], // Warm Amber/Bronze
      text: [30, 41, 59],
      divider: [203, 213, 225],
      accent: [180, 83, 9],
      font: "times",
    },
  }[style] || {
    primary: [17, 24, 39],
    secondary: [75, 85, 99],
    text: [31, 41, 55],
    divider: [209, 213, 219],
    accent: [249, 115, 22],
    font: "helvetica",
  };

  // Header
  doc.setFont(colors.font, "bold");
  doc.setFontSize(22);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  
  if (style === "ats") {
    doc.text(data.personal.fullName || "Candidate Name", pageWidth / 2, y, { align: "center" });
    y += 18;

    if (data.personal.title) {
      doc.setFont(colors.font, "bold");
      doc.setFontSize(12);
      doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      doc.text(data.personal.title, pageWidth / 2, y, { align: "center" });
      y += 15;
    }
  } else {
    // Modern / Executive Left-Aligned or Premium Banner
    doc.text(data.personal.fullName || "Candidate Name", margin, y);
    y += 18;

    if (data.personal.title) {
      doc.setFont(colors.font, "bold");
      doc.setFontSize(12);
      doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      doc.text(data.personal.title, margin, y);
      y += 15;
    }
  }

  // Contact line
  const contactParts = [
    data.personal.email,
    data.personal.phone,
    data.personal.location,
    data.personal.linkedin,
    data.personal.portfolio,
    data.personal.github,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    doc.setFont(colors.font, "normal");
    doc.setFontSize(9);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const contactStr = contactParts.join("  |  ");
    if (style === "ats") {
      doc.text(contactStr, pageWidth / 2, y, { align: "center" });
    } else {
      doc.text(contactStr, margin, y);
    }
    y += 16;
  }

  // Top divider
  doc.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2]);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  // Helper function to render standard Section Header
  const renderSectionHeader = (title: string) => {
    checkPageBreak(35);
    doc.setFont(colors.font, "bold");
    doc.setFontSize(11);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(title.toUpperCase(), margin, y);
    y += 4;
    doc.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2]);
    doc.setLineWidth(0.75);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
  };

  // 1. Professional Summary
  if (data.summary && data.summary.trim()) {
    renderSectionHeader("Professional Summary");
    doc.setFont(colors.font, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const lines = doc.splitTextToSize(data.summary, contentWidth);
    checkPageBreak(lines.length * 12);
    doc.text(lines, margin, y);
    y += lines.length * 12 + 10;
  }

  // 2. Work Experience
  if (data.experience && data.experience.length > 0) {
    renderSectionHeader("Work Experience");
    for (const exp of data.experience) {
      checkPageBreak(40);
      const dates = [exp.startDate, exp.isCurrent ? "Present" : exp.endDate].filter(Boolean).join(" - ");

      // Role (Bold) & Company
      doc.setFont(colors.font, "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(exp.role, margin, y);

      if (dates) {
        doc.setFont(colors.font, "bold");
        doc.setFontSize(9);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.text(dates, pageWidth - margin, y, { align: "right" });
      }
      y += 13;

      // Company & Location
      doc.setFont(colors.font, "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      doc.text(`${exp.company}${exp.location ? ` | ${exp.location}` : ""}`, margin, y);
      y += 12;

      // Bullet highlights
      if (exp.highlights && exp.highlights.length > 0) {
        doc.setFont(colors.font, "normal");
        doc.setFontSize(9);
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        for (const hl of exp.highlights) {
          if (!hl.trim()) continue;
          const bulletLines = doc.splitTextToSize(hl, contentWidth - 14);
          checkPageBreak(bulletLines.length * 11 + 4);
          doc.text("•", margin + 2, y);
          doc.text(bulletLines, margin + 12, y);
          y += bulletLines.length * 11 + 3;
        }
      }
      y += 6;
    }
  }

  // 3. Education
  if (data.education && data.education.length > 0) {
    renderSectionHeader("Education");
    for (const edu of data.education) {
      checkPageBreak(30);
      const degText = [edu.degree, edu.field].filter(Boolean).join(" in ");
      const dates = [edu.startYear, edu.endYear].filter(Boolean).join(" - ");

      doc.setFont(colors.font, "bold");
      doc.setFontSize(10);
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(degText || "Degree", margin, y);

      if (dates) {
        doc.setFont(colors.font, "bold");
        doc.setFontSize(9);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.text(dates, pageWidth - margin, y, { align: "right" });
      }
      y += 12;

      doc.setFont(colors.font, "normal");
      doc.setFontSize(9);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.text(`${edu.school}${edu.location ? ` | ${edu.location}` : ""}`, margin, y);
      y += 10;

      if (edu.gpa || edu.honors) {
        const extra = [edu.gpa ? `GPA: ${edu.gpa}` : "", edu.honors ? `Honors: ${edu.honors}` : ""].filter(Boolean).join(" | ");
        doc.setFont(colors.font, "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.text(extra, margin, y);
        y += 10;
      }
      y += 4;
    }
  }

  // 4. Skills
  const technicalSkills = data.skills?.technical || [];
  const tools = data.skills?.tools || [];
  const softSkills = data.skills?.soft || [];

  if (technicalSkills.length > 0 || tools.length > 0 || softSkills.length > 0) {
    renderSectionHeader("Skills & Competencies");
    doc.setFontSize(9);

    const renderSkillLine = (label: string, items: string[]) => {
      if (!items || items.length === 0) return;
      checkPageBreak(20);
      doc.setFont(colors.font, "bold");
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.text(`${label}: `, margin, y);

      doc.setFont(colors.font, "normal");
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      const skillText = items.join(", ");
      const skillLines = doc.splitTextToSize(skillText, contentWidth - labelWidth);
      doc.text(skillLines, margin + labelWidth, y);
      y += skillLines.length * 11 + 3;
    };

    renderSkillLine("Technical", technicalSkills);
    renderSkillLine("Tools & Frameworks", tools);
    renderSkillLine("Soft Skills", softSkills);
    y += 6;
  }

  // 5. Projects
  if (data.projects && data.projects.length > 0) {
    renderSectionHeader("Key Projects");
    for (const proj of data.projects) {
      checkPageBreak(30);
      doc.setFont(colors.font, "bold");
      doc.setFontSize(10);
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(proj.name, margin, y);

      if (proj.link) {
        doc.setFont(colors.font, "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(37, 99, 235);
        doc.text(proj.link, pageWidth - margin, y, { align: "right" });
      }
      y += 12;

      if (proj.description) {
        doc.setFont(colors.font, "normal");
        doc.setFontSize(9);
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        const projLines = doc.splitTextToSize(proj.description, contentWidth);
        doc.text(projLines, margin, y);
        y += projLines.length * 11 + 2;
      }

      if (proj.technologies && proj.technologies.length > 0) {
        doc.setFont(colors.font, "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.text(`Tech: ${proj.technologies.join(", ")}`, margin, y);
        y += 11;
      }
      y += 4;
    }
  }

  // 6. Certifications
  if (data.certifications && data.certifications.length > 0) {
    renderSectionHeader("Certifications");
    doc.setFont(colors.font, "normal");
    doc.setFontSize(9);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    for (const cert of data.certifications) {
      checkPageBreak(15);
      const text = `•  ${cert.name} — ${cert.issuer}${cert.date ? ` (${cert.date})` : ""}`;
      doc.text(text, margin, y);
      y += 12;
    }
    y += 6;
  }

  // 7. Languages
  if (data.languages && data.languages.length > 0) {
    renderSectionHeader("Languages");
    doc.setFont(colors.font, "normal");
    doc.setFontSize(9);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const langStr = data.languages.map((l) => `${l.language} (${l.proficiency})`).join("  •  ");
    doc.text(langStr, margin, y);
    y += 14;
  }

  doc.save(filename);
}

/**
 * Native Print Utility for seamless in-browser resume printing.
 */
export function printResumeElement(elementId: string) {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.print();
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Resume - PDFSun</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: letter; margin: 0.4in; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #ffffff !important; color: #111827 !important; }
        </style>
      </head>
      <body class="p-4">
        ${elem.outerHTML}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 1000);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
