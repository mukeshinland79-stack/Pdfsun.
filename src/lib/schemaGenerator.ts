/**
 * Comprehensive JSON-LD Schema Generator for PDFSun.in
 * Generates valid Schema.org entities for SoftwareApplication, WebApplication,
 * HowTo, FAQPage, BreadcrumbList, WebSite, and Organization.
 * Engineered for maximum Rich Snippet and search dominance on Google, Bing, Yahoo & DuckDuckGo.
 */

import { ToolItem } from "../types";
import { PSEOLandingPage } from "../data/pSEOData";

export interface HowToStepDefinition {
  name: string;
  text: string;
  position: number;
  url?: string;
  image?: string;
}

/**
 * Standard default HowTo guides mapped by tool slug/id
 */
export const DEFAULT_HOW_TO_GUIDES: Record<
  string,
  { title: string; description: string; steps: HowToStepDefinition[] }
> = {
  "merge-pdf": {
    title: "How to Merge PDF Files Online for Free",
    description: "Combine multiple PDF documents into one single file in 3 simple steps without uploading to external servers.",
    steps: [
      {
        position: 1,
        name: "Upload PDF Documents",
        text: "Drag and drop your PDF files into the PDFSun merge workspace or click 'Choose Files' to select them from your device.",
      },
      {
        position: 2,
        name: "Arrange Document Sequence",
        text: "Drag and reorder individual PDF files or pages to set your desired reading order.",
      },
      {
        position: 3,
        name: "Merge & Instant Download",
        text: "Click 'Merge PDF' to combine pages using client-side WebAssembly and immediately save the consolidated PDF.",
      },
    ],
  },
  "compress-pdf": {
    title: "How to Compress PDF File Size Without Losing Quality",
    description: "Reduce PDF file size up to 90% to meet email attachments or government portal limits (e.g., 100KB or 200KB).",
    steps: [
      {
        position: 1,
        name: "Select Your PDF",
        text: "Drop your oversized PDF into the compressor box or browse files on your device.",
      },
      {
        position: 2,
        name: "Choose Compression Target",
        text: "Select Recommended, Extreme, or target custom size limits such as 100KB, 200KB, or 500KB.",
      },
      {
        position: 3,
        name: "Download Compressed File",
        text: "Click 'Compress PDF' and watch the instant sub-second size reduction before 1-click downloading.",
      },
    ],
  },
  "split-pdf": {
    title: "How to Split and Extract Pages from PDF Online",
    description: "Extract specific page ranges or break a large document into separate individual PDF files instantly.",
    steps: [
      {
        position: 1,
        name: "Upload the PDF Document",
        text: "Choose the PDF you want to split or drag it into the browser window.",
      },
      {
        position: 2,
        name: "Specify Page Range",
        text: "Enter specific page numbers (e.g. 1-3, 5, 8-10) or choose to extract all pages as individual files.",
      },
      {
        position: 3,
        name: "Export Split PDFs",
        text: "Click 'Split PDF' to immediately download your extracted PDF or a organized ZIP bundle.",
      },
    ],
  },
  "pdf-to-word": {
    title: "How to Convert PDF to Editable Microsoft Word (.docx)",
    description: "Convert PDF documents to editable Microsoft Word files with preserved typography, formatting, and tables.",
    steps: [
      {
        position: 1,
        name: "Upload PDF File",
        text: "Select the PDF contract, report, or document you want to edit.",
      },
      {
        position: 2,
        name: "Run Client-Side Conversion",
        text: "Click 'Convert to Word' to parse text blocks and tables into editable OpenXML docx format.",
      },
      {
        position: 3,
        name: "Save & Open in Word",
        text: "Click download to instantly save the .docx document and edit freely in Microsoft Word or Google Docs.",
      },
    ],
  },
  "ai-chat-pdf": {
    title: "How to Chat with PDF Documents Using AI",
    description: "Interrogate research papers, ask questions, and summarize legal contracts instantly with AI.",
    steps: [
      {
        position: 1,
        name: "Upload Document for AI Analysis",
        text: "Drag your PDF report, book, or study guide into the AI Chat workspace.",
      },
      {
        position: 2,
        name: "Ask Questions & Prompt",
        text: "Type any question, request key takeaways, bullet point summaries, or language translations.",
      },
      {
        position: 3,
        name: "Copy or Export Answers",
        text: "Receive instantaneous cited answers and export summary notes with zero server data retention.",
      },
    ],
  },
};

/**
 * 1. WebSite Schema with Sitelinks Searchbox
 */
export function buildWebSiteSchema(baseUrl: string = "https://pdfsun.in") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    "name": "PDFSun",
    "url": baseUrl,
    "description": "Free online PDF tools: Merge, Compress, Split, Convert & Edit PDFs safely with client-side WebAssembly.",
    "publisher": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": "PDFSun",
      "url": baseUrl,
      "logo": `${baseUrl}/og-image.png`,
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * 2. Organization Schema
 */
export function buildOrganizationSchema(baseUrl: string = "https://pdfsun.in") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    "name": "PDFSun",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/og-image.png`,
      "width": "1200",
      "height": "630",
    },
    "founder": {
      "@type": "Person",
      "name": "Mukesh Kalonia",
    },
    "sameAs": [
      "https://twitter.com/pdfsun_in",
      "https://github.com/mukeshinland",
    ],
  };
}

/**
 * 3. WebApplication & SoftwareApplication Schema
 */
export function buildWebApplicationSchema(
  tool?: ToolItem | null,
  baseUrl: string = "https://pdfsun.in"
) {
  const isTool = !!tool;
  const name = isTool ? `${tool.name} - Free Online PDF Tool` : "PDFSun - Free Online PDF Tools & AI Engine";
  const url = isTool ? `${baseUrl}/${tool.slug}` : baseUrl;
  const description = isTool
    ? `${tool.description} Free, fast, client-side WebAssembly tool by PDFSun.`
    : "Free PDF converter, merge PDF online, compress PDF size, edit PDF documents safely with PDFSun. 100% private, client-side WebAssembly processing.";

  const features = isTool
    ? [
        `${tool.name} with instant processing`,
        "100% Client-Side WebAssembly execution",
        "Zero server file uploads or logging",
        "Unlimited free access with no watermarks",
        "Compatible with mobile, desktop, and tablets",
      ]
    : [
        "Merge multiple PDF files into one single document",
        "Compress PDF to 50KB, 100KB, 200KB, 500KB with sub-second speeds",
        "Split and extract PDF pages instantly",
        "Convert PDF to Word, Excel, PowerPoint, JPG, PNG",
        "AI PDF Chat, Summarization, and Translation",
        "OCR Text Recognition directly in browser",
        "Password Protect and Unlock PDF files",
        "100% Client-Side WebAssembly Processing for zero data leaks",
      ];

  return {
    "@context": "https://schema.org",
    "@type": ["WebApplication", "SoftwareApplication"],
    "@id": `${url}#software`,
    "name": name,
    "url": url,
    "description": description,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All (Web-based, Windows, macOS, Linux, iOS, Android)",
    "browserRequirements": "Requires HTML5 and WebAssembly compatible browser.",
    "softwareVersion": "2.1.0",
    "inLanguage": ["en", "es", "de", "hi", "fr", "pt", "ar", "ja", "ru", "it", "nl"],
    "featureList": features,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "18420",
      "bestRating": "5",
      "worstRating": "1",
    },
    "author": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": "PDFSun",
      "url": baseUrl,
    },
  };
}

/**
 * 4. HowTo Schema for Step-by-Step Rich Snippets
 */
export function buildHowToSchema(
  toolOrPseo?: ToolItem | PSEOLandingPage | null,
  baseUrl: string = "https://pdfsun.in"
) {
  if (!toolOrPseo) {
    // Default to Merge PDF HowTo
    const guide = DEFAULT_HOW_TO_GUIDES["merge-pdf"];
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": guide.title,
      "description": guide.description,
      "step": guide.steps.map((s) => ({
        "@type": "HowToStep",
        "position": s.position,
        "name": s.name,
        "text": s.text,
      })),
    };
  }

  // Check if it's a PSEOLandingPage with custom steps
  if ("howToSteps" in toolOrPseo && toolOrPseo.howToSteps && toolOrPseo.howToSteps.length > 0) {
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": `How to ${toolOrPseo.headline}`,
      "description": toolOrPseo.subheadline,
      "step": toolOrPseo.howToSteps.map((s) => ({
        "@type": "HowToStep",
        "position": s.position,
        "name": s.name,
        "text": s.text,
      })),
    };
  }

  // Check if ToolItem matches default guides
  const slug = (toolOrPseo as ToolItem).slug || (toolOrPseo as ToolItem).id;
  const guide = DEFAULT_HOW_TO_GUIDES[slug] || {
    title: `How to Use ${(toolOrPseo as ToolItem).name} Online`,
    description: `Fast and secure guide to using ${(toolOrPseo as ToolItem).name} directly in your browser with zero file uploads.`,
    steps: [
      {
        position: 1,
        name: "Upload Your Document",
        text: `Drag and drop your file into the ${(toolOrPseo as ToolItem).name} workspace or browse from your device.`,
      },
      {
        position: 2,
        name: "Configure Options",
        text: "Select your desired settings or preferences.",
      },
      {
        position: 3,
        name: "Instant Process & Download",
        text: "Process your document in sub-seconds and save the output directly to your device.",
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": guide.title,
    "description": guide.description,
    "step": guide.steps.map((s) => ({
      "@type": "HowToStep",
      "position": s.position,
      "name": s.name,
      "text": s.text,
    })),
  };
}

/**
 * 5. FAQPage Schema
 */
export function buildFaqPageSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  if (!faqs || faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

/**
 * 6. BreadcrumbList Schema
 */
export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>,
  baseUrl: string = "https://pdfsun.in"
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": item.name,
      "item": item.path.startsWith("http") ? item.path : `${baseUrl}${item.path.startsWith("/") ? "" : "/"}${item.path}`,
    })),
  };
}

/**
 * Master Schema Graph Assembler
 * Combines all relevant schemas into a single valid JSON-LD graph
 */
export function buildCompleteSchemaGraph(options: {
  tool?: ToolItem | null;
  pseoPage?: PSEOLandingPage | null;
  faqs?: Array<{ question: string; answer: string }>;
  baseUrl?: string;
}) {
  const { tool, pseoPage, faqs = [], baseUrl = "https://pdfsun.in" } = options;

  const graph: any[] = [
    buildWebSiteSchema(baseUrl),
    buildOrganizationSchema(baseUrl),
    buildWebApplicationSchema(tool, baseUrl),
  ];

  // HowTo Schema
  const howTo = buildHowToSchema(pseoPage || tool, baseUrl);
  if (howTo) graph.push(howTo);

  // FAQ Schema
  const faqSchema = buildFaqPageSchema(faqs);
  if (faqSchema) graph.push(faqSchema);

  // Breadcrumbs
  const breadcrumbs = [
    { name: "Home", path: "/" },
  ];
  if (tool) {
    breadcrumbs.push({ name: "Tools", path: "/#tools" });
    breadcrumbs.push({ name: tool.name, path: `/${tool.slug}` });
  } else if (pseoPage) {
    breadcrumbs.push({ name: "Tools", path: "/#tools" });
    breadcrumbs.push({ name: pseoPage.headline, path: `/${pseoPage.slug}` });
  }
  graph.push(buildBreadcrumbSchema(breadcrumbs, baseUrl));

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
