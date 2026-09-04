export interface ToolSeoSentenceData {
  sentence1: string;
  sentence2: string;
  sentence3: string;
  metaDescription: string;
}

export const TOOL_SEO_SENTENCES: Record<string, ToolSeoSentenceData> = {
  "merge-pdf": {
    sentence1:
      "Easily combine multiple PDF files into one single, organized document using PDFSun's free online PDF merger tool.",
    sentence2:
      "Powered by 100% client-side WebAssembly technology, your documents are processed lightning-fast right inside your browser with complete privacy and zero server uploads.",
    sentence3:
      "Join millions of professionals and students worldwide in USA, Europe, Asia, and Australia—merge your PDFs instantly without registration or quality loss.",
    metaDescription:
      "Easily combine multiple PDF files into one single organized document using PDFSun's free online PDF merger tool. Powered by 100% client-side WebAssembly with complete privacy and zero server uploads.",
  },
  "split-pdf": {
    sentence1:
      "Quickly split large PDF documents and extract custom page ranges or individual sheets using our free online PDF splitter tool.",
    sentence2:
      "Engineered with client-side WebAssembly, all page extraction occurs strictly in your device's browser memory with zero cloud uploads and sub-second execution speed.",
    sentence3:
      "Join users across the United States, UK, Europe, and Australia—split and organize your PDF files instantly with no software download or signup required.",
    metaDescription:
      "Quickly split large PDF documents and extract custom page ranges using our free online PDF splitter tool. Engineered with client-side WebAssembly for zero server uploads and instant downloads.",
  },
  "compress-pdf": {
    sentence1:
      "Reduce heavy PDF file sizes up to 90% without losing text clarity or print resolution using PDFSun's free online PDF compressor tool.",
    sentence2:
      "Running locally on your device via compiled WebAssembly, your confidential tax forms, resumes, and reports are compressed securely without remote server uploads.",
    sentence3:
      "Trusted by remote workers, legal teams, and researchers across USA, Europe, Canada, and Australia—shrink your PDF files to 200KB or less instantly for free.",
    metaDescription:
      "Reduce heavy PDF file sizes up to 90% without losing text clarity using PDFSun's free online PDF compressor tool. Local WebAssembly processing guarantees zero data uploads.",
  },
  "pdf-to-word": {
    sentence1:
      "Convert read-only PDF documents into fully editable Microsoft Word (.docx) files online for free with original formatting and tables preserved.",
    sentence2:
      "Our cutting-edge browser-based conversion engine operates directly in your browser using WebAssembly, ensuring 100% data privacy with zero server storage.",
    sentence3:
      "Loved by enterprises and university students across North America, Europe, and Asia—transform your PDFs into editable Word documents instantly with no registration.",
    metaDescription:
      "Convert read-only PDF documents into fully editable Microsoft Word (.docx) files online for free with intact layout. Fast WebAssembly processing with zero server storage.",
  },
  "word-to-pdf": {
    sentence1:
      "Convert Microsoft Word DOCX and DOC documents into clean, professional PDF files online for free with universal formatting preservation.",
    sentence2:
      "Powered by local client-side WebAssembly compilation, your Word documents are converted at native bus speed with zero file uploads to external servers.",
    sentence3:
      "Join professionals and students in the USA, UK, Germany, and Australia—generate crisp, publish-ready PDF files in seconds without watermarks or accounts.",
    metaDescription:
      "Convert Microsoft Word DOCX documents into clean, professional PDF files online for free. Local WebAssembly processing ensures zero file uploads and complete privacy.",
  },
  "pdf-to-excel": {
    sentence1:
      "Extract financial tables and spreadsheet data from PDF files into fully editable Microsoft Excel (.xlsx) spreadsheets online for free.",
    sentence2:
      "Processed 100% in-browser via WebAssembly, your sensitive accounting statements, payroll files, and corporate balance sheets are never uploaded to any cloud server.",
    sentence3:
      "Empowering finance teams and analysts throughout the United States, Europe, and Australia—convert your PDF tables into editable Excel sheets instantly with no signup.",
    metaDescription:
      "Extract financial tables and spreadsheet data from PDF files into fully editable Microsoft Excel spreadsheets online for free. 100% in-browser WebAssembly processing.",
  },
  "excel-to-pdf": {
    sentence1:
      "Convert Microsoft Excel spreadsheets and CSV workbooks into beautifully formatted PDF documents online for free with custom sheet margins.",
    sentence2:
      "Thanks to PDFSun's client-side WebAssembly architecture, spreadsheet rendering happens directly on your device, guaranteeing total data security with zero server uploads.",
    sentence3:
      "Used by businesses and accounting firms worldwide in USA, UK, Europe, and Asia—export your Excel sheets to PDF effortlessly with no registration required.",
    metaDescription:
      "Convert Microsoft Excel spreadsheets into beautifully formatted PDF documents online for free. Client-side WebAssembly rendering ensures total data security.",
  },
  "pdf-to-jpg": {
    sentence1:
      "Convert PDF pages into high-resolution JPG or PNG images online for free with crisp typography and vibrant visual color fidelity.",
    sentence2:
      "Built with browser-side WebAssembly technology, page rendering executes in memory at lightning speed with zero server uploads or image downsampling.",
    sentence3:
      "Join millions of creative designers, educators, and professionals across the USA, Europe, and Australia—extract your PDF pages as images instantly for free.",
    metaDescription:
      "Convert PDF pages into high-resolution JPG or PNG images online for free with crisp typography. Browser-side WebAssembly rendering ensures zero server uploads.",
  },
  "jpg-to-pdf": {
    sentence1:
      "Convert and combine JPG, PNG, and WEBP photos into a single professional PDF document online for free with custom page orientations.",
    sentence2:
      "Executing 100% client-side via WebAssembly, your private photo IDs, passports, receipts, and scans are compiled directly in your browser with zero remote storage.",
    sentence3:
      "Essential for visa applicants, students, and remote workers worldwide in North America, Europe, and Asia—convert your images to PDF instantly without watermarks.",
    metaDescription:
      "Convert and combine JPG, PNG, and WEBP photos into a single professional PDF document online for free. 100% client-side WebAssembly compilation with zero remote storage.",
  },
  "ai-chat-pdf": {
    sentence1:
      "Interrogate any document with Gemini AI to ask natural language questions, extract verified page citations, and generate instant summaries for free.",
    sentence2:
      "Featuring high-speed client-side indexing and secure browser execution, your research papers, legal contracts, and financial reports are analyzed privately and efficiently.",
    sentence3:
      "Accelerate your research and document workflows in the USA, UK, Europe, and Australia—chat with complex PDFs in real time with zero software installation.",
    metaDescription:
      "Interrogate any document with Gemini AI to ask questions, extract citations, and generate instant summaries for free. Fast, private, and browser-based.",
  },
  "ai-summarize-pdf": {
    sentence1:
      "Summarize long PDF research papers, whitepapers, and dense legal briefs in seconds using PDFSun's free online AI document summarizer.",
    sentence2:
      "Our AI summarization engine quickly analyzes document structures and extracts core takeaways with zero permanent data retention on third-party servers.",
    sentence3:
      "Join students, lawyers, and executives across USA, Europe, and Asia—distill hundred-page documents into concise bullet points instantly without an account.",
    metaDescription:
      "Summarize long PDF research papers and dense legal briefs in seconds using PDFSun's free online AI document summarizer. Fast, secure, and accurate.",
  },
  "ocr-pdf": {
    sentence1:
      "Convert scanned, image-only PDF documents into searchable, copyable text files online for free using advanced Optical Character Recognition (OCR).",
    sentence2:
      "Utilizing optimized browser-based OCR engines, image recognition takes place directly on your CPU without uploading sensitive legal or medical records to external servers.",
    sentence3:
      "Adopted by researchers, legal professionals, and archivists worldwide in USA, Europe, and Australia—make your scanned PDFs fully searchable instantly with no signup.",
    metaDescription:
      "Convert scanned image-only PDF documents into searchable, copyable text files online for free using OCR. Browser-based execution guarantees zero server uploads.",
  },
  "ocr-image-to-text": {
    sentence1:
      "Extract clean, editable plain text from photos, book scans, and screenshots online for free with high-precision Optical Character Recognition.",
    sentence2:
      "Computed locally inside your web browser via WebAssembly, your images are parsed with zero cloud uploads and total data privacy.",
    sentence3:
      "Join students and knowledge workers in the United States, UK, Germany, and Australia—extract text from any image instantly with zero character limits.",
    metaDescription:
      "Extract clean, editable plain text from photos and screenshots online for free with high-precision OCR. 100% client-side WebAssembly processing.",
  },
  "protect-pdf": {
    sentence1:
      "Secure sensitive PDF documents with military-grade 256-bit AES password encryption online for free using PDFSun's secure protection tool.",
    sentence2:
      "Encryption algorithms run 100% client-side via WebAssembly, meaning your master passwords and document payloads are never broadcast across the network or stored in cloud databases.",
    sentence3:
      "Trusted by legal firms, healthcare providers, and corporations in the USA, Europe, and Australia—lock and password-protect your PDFs in seconds with no signup.",
    metaDescription:
      "Secure sensitive PDF documents with military-grade 256-bit AES password encryption online for free. 100% client-side WebAssembly encryption with zero server exposure.",
  },
  "unlock-pdf": {
    sentence1:
      "Remove password restrictions and owner security permissions from your PDF documents online for free with PDFSun's fast unlock tool.",
    sentence2:
      "Decryption happens strictly in-browser via WebAssembly, ensuring that sensitive financial disclosures and personal files are decrypted safely without remote server uploads.",
    sentence3:
      "Join users globally across North America, Europe, and Asia—unlock and re-enable printing, editing, and copying on your PDFs instantly without registration.",
    metaDescription:
      "Remove password restrictions and security permissions from your PDF documents online for free. In-browser WebAssembly decryption ensures zero server uploads.",
  },
  "sign-pdf": {
    sentence1:
      "Sign PDF agreements and electronic contracts online for free by drawing, typing, or uploading your digital signature with PDFSun.",
    sentence2:
      "Featuring 100% client-side WebAssembly vector stamping, your signatures and confidential contracts are embedded locally with zero server upload exposure.",
    sentence3:
      "Empowering freelancers, remote teams, and businesses in the USA, UK, Europe, and Australia—sign and finalize PDF documents in seconds without subscriptions.",
    metaDescription:
      "Sign PDF agreements and electronic contracts online for free by drawing or typing your signature. 100% client-side WebAssembly vector stamping with complete privacy.",
  },
  "watermark-pdf": {
    sentence1:
      "Add custom text or image watermarks to your PDF pages online for free to protect intellectual property and assert copyright ownership.",
    sentence2:
      "Engineered with client-side WebAssembly, watermarks are rendered directly onto PDF vector layers at high speed without uploading documents to external servers.",
    sentence3:
      "Adopted by authors, photographers, and corporations across the USA, Europe, and Asia—watermark single or batch PDF pages instantly with no watermark fees.",
    metaDescription:
      "Add custom text or image watermarks to your PDF pages online for free to protect intellectual property. Fast WebAssembly processing with zero server uploads.",
  },
  "page-numbers": {
    sentence1:
      "Insert clean, customized page numbers, headers, and footers into your PDF documents online for free with flexible position formatting.",
    sentence2:
      "Processed locally inside your web browser via WebAssembly, your documents are stamped with precise pagination without cloud server uploads or font alteration.",
    sentence3:
      "Join academic researchers, students, and legal professionals worldwide in USA, Europe, and Australia—number your PDF pages instantly with zero fees or signup.",
    metaDescription:
      "Insert clean, customized page numbers into your PDF documents online for free with flexible formatting. Client-side WebAssembly stamping with zero cloud uploads.",
  },
  "rotate-pdf": {
    sentence1:
      "Permanently rotate upside-down or sideways PDF pages by 90, 180, or 270 degrees online for free with PDFSun's instant rotation tool.",
    sentence2:
      "Running 100% in-browser via WebAssembly, coordinate matrices are modified instantly without recompressing images, degrading resolution, or uploading files.",
    sentence3:
      "Used by millions of professionals and students across North America, Europe, and Asia—fix PDF orientations and save correctly rotated documents in seconds.",
    metaDescription:
      "Permanently rotate upside-down or sideways PDF pages online for free with instant rotation. 100% in-browser WebAssembly with zero quality loss or server uploads.",
  },
  "redact-pdf": {
    sentence1:
      "Permanently redact sensitive personal information, social security numbers, and confidential clauses from PDF documents online for free.",
    sentence2:
      "Unlike cosmetic black boxes, our WebAssembly engine purges underlying text tokens and coordinate objects completely in-browser with zero server upload risk.",
    sentence3:
      "Indispensable for attorneys, compliance officers, and medical teams across USA, Europe, and Australia—redact and sanitize your PDFs with guaranteed confidentiality.",
    metaDescription:
      "Permanently redact sensitive personal information from PDF documents online for free. WebAssembly engine purges underlying text tokens completely in-browser.",
  },
};

export function getToolSeoSentences(toolId: string, toolName: string): ToolSeoSentenceData {
  if (TOOL_SEO_SENTENCES[toolId]) {
    return TOOL_SEO_SENTENCES[toolId];
  }

  // Authoritative fallback matching the exact 3-sentence formula
  const s1 = `Easily process, convert, and manage your documents using PDFSun's free online ${toolName} tool.`;
  const s2 = `Powered by 100% client-side WebAssembly technology, your documents are executed lightning-fast right inside your browser with complete privacy and zero server uploads.`;
  const s3 = `Join millions of professionals, researchers, and students worldwide across USA, Europe, Asia, and Australia—use ${toolName} instantly with no registration required.`;
  const meta = `${s1} ${s2}`;

  return {
    sentence1: s1,
    sentence2: s2,
    sentence3: s3,
    metaDescription: meta,
  };
}
