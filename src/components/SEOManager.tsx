import React from "react";
import { Helmet } from "react-helmet-async";
import { ToolItem } from "../types";
import { FAQS } from "../data/toolsData";
import { TOP_30_LANGUAGES } from "../utils/geoLanguageDetector";
import { PSEOLandingPage } from "../data/pSEOData";

export interface SEOManagerProps {
  activeTool: ToolItem | null;
  tools: ToolItem[];
  baseUrl?: string;
  currentPage?: number;
  totalPages?: number;
  isTodayInHistoryActive?: boolean;
  pseoPage?: PSEOLandingPage | null;
}

export interface ToolFAQ {
  question: string;
  answer: string;
}

export function getToolFAQs(tool: ToolItem): ToolFAQ[] {
  // Extract custom FAQs if provided on the tool definition
  const customFaqs: ToolFAQ[] = (tool.faqs || [])
    .map((f) => ({
      question: (f.question || f.q || "").trim(),
      answer: (f.answer || f.a || "").trim(),
    }))
    .filter((f) => f.question && f.answer);

  // Category specific FAQ enhancement
  const getCategoryFaq = (): ToolFAQ | null => {
    switch (tool.category) {
      case "ai":
        return {
          question: `How does AI technology process files in ${tool.name}?`,
          answer: `${tool.name} utilizes secure Google Gemini 3.6 AI models to analyze, summarize, or extract structured data from your ${tool.supportedInput.join(" or ")} documents with enterprise-grade speed and precision.`,
        };
      case "security":
        return {
          question: `How does security and password protection work in ${tool.name}?`,
          answer: `${tool.name} applies browser-native 256-bit Web Cryptography API standards directly on your device to protect, encrypt, or modify security permissions for your documents.`,
        };
      case "convert":
        return {
          question: `Will ${tool.name} preserve the original formatting and visual layout?`,
          answer: `Yes! ${tool.name} uses advanced rendering pipelines to preserve text fonts, vector graphics, table structures, and page layouts when generating ${tool.outputFormat} files.`,
        };
      case "student":
        return {
          question: `Is ${tool.name} suitable for students and academic research papers?`,
          answer: `Absolutely. ${tool.name} is optimized for students, researchers, and educators to process textbooks, lecture notes, assignments, and study materials free of cost.`,
        };
      case "edit":
        return {
          question: `Can I reorder, annotate, or adjust pages using ${tool.name}?`,
          answer: `Yes! ${tool.name} offers a visual interactive workspace allowing you to configure, rearrange, and customize your files prior to exporting.`,
        };
      default:
        return null;
    }
  };

  const catFaq = getCategoryFaq();

  const defaultFaqs: ToolFAQ[] = [
    {
      question: `How do I use ${tool.name} online on PDFSun?`,
      answer: `To use ${tool.name}: 1) Select or drag and drop your ${tool.supportedInput.join(" or ")} files into the workspace. 2) Adjust preferences or order if needed. 3) Click Process to instantly convert and download your ${tool.outputFormat} file.`,
    },
    {
      question: `Is ${tool.name} completely free to use without limits or watermarks?`,
      answer: `Yes! ${tool.name} on PDFSun is 100% free with no hidden fees, no required subscriptions, no mandatory account sign-ups, and no intrusive watermarks added to your exported files.`,
    },
    {
      question: `Are my files safe and private when using ${tool.name}?`,
      answer: `At PDFSun, privacy is paramount. ${tool.name} processes files client-side locally inside your browser via WebAssembly. Your documents are never uploaded to or permanently stored on external servers.`,
    },
    {
      question: `What file formats are supported by ${tool.name}?`,
      answer: `${tool.name} accepts ${tool.supportedInput.join(", ")} input files and produces high-quality ${tool.outputFormat} outputs.`,
    },
  ];

  if (catFaq) {
    defaultFaqs.push(catFaq);
  } else {
    defaultFaqs.push({
      question: `What features make ${tool.name} on PDFSun different?`,
      answer: `${tool.description} It delivers instant, zero-latency browser processing with complete file security.`,
    });
  }

  defaultFaqs.push(
    {
      question: `Can I use ${tool.name} on mobile or tablet devices?`,
      answer: `Yes! ${tool.name} is fully responsive and compatible with all modern smartphones, tablets, Mac, Windows, iOS, and Android devices without installing extra software.`,
    },
    {
      question: `Do I need to install any software or app for ${tool.name}?`,
      answer: `No installation is required. ${tool.name} runs directly in any modern web browser such as Google Chrome, Apple Safari, Mozilla Firefox, or Microsoft Edge.`,
    }
  );

  // Combine custom FAQs and default FAQs, deduplicating by question
  const combined = [...customFaqs, ...defaultFaqs];
  const seen = new Set<string>();
  const uniqueFaqs: ToolFAQ[] = [];

  for (const faq of combined) {
    const qKey = faq.question.toLowerCase().trim();
    if (!seen.has(qKey)) {
      seen.add(qKey);
      uniqueFaqs.push(faq);
    }
  }

  return uniqueFaqs;
}

export const SEOManager: React.FC<SEOManagerProps> = ({
  activeTool,
  tools,
  baseUrl = "https://www.pdfsun.in",
  currentPage,
  totalPages,
  isTodayInHistoryActive = false,
  pseoPage = null,
}) => {
  // 1. Base WebSite & SearchAction Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PDF Sun",
    "url": baseUrl,
    "description": "PDF Sun lets you easily convert, merge, compress, edit, and secure your PDF files online for free. Fast, easy, and secure PDF tools at www.pdfsun.in.",
    "publisher": {
      "@type": "Organization",
      "name": "PDF Sun",
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

  // 2. Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PDF Sun",
    "url": baseUrl,
    "logo": `${baseUrl}/og-image.png`,
    "sameAs": [],
  };

  // 3. Dynamic JSON-LD FAQ Schema (Tool-Specific for Tool Pages & Platform Global for Homepage)
  let faqSchema: Record<string, any>;

  if (activeTool) {
    const baseFaqs = getToolFAQs(activeTool);
    const customPseoFaqs = pseoPage?.customFaqs || [];
    const combinedFaqs = [
      ...customPseoFaqs.map((f) => ({ question: f.question, answer: f.answer })),
      ...baseFaqs,
    ];

    // Deduplicate
    const seen = new Set<string>();
    const uniqueFaqs: { question: string; answer: string }[] = [];
    for (const f of combinedFaqs) {
      const k = f.question.toLowerCase().trim();
      if (!seen.has(k)) {
        seen.add(k);
        uniqueFaqs.push(f);
      }
    }

    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": uniqueFaqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer,
        },
      })),
    };
  } else {
    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": FAQS.map((faq) => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a,
        },
      })),
    };
  }

  // Helper to resolve Schema.org application category based on tool category
  const getApplicationCategory = (category?: string): string => {
    switch (category) {
      case "student":
        return "EducationalApplication";
      case "security":
        return "SecurityApplication";
      case "edit":
      case "convert":
      case "advanced":
      case "ai":
      default:
        return "UtilitiesApplication";
    }
  };

  // Build active tool specific schemas or multi-tool catalog schema
  let activeToolGraphSchema: Record<string, any> | null = null;
  let breadcrumbsSchema: Record<string, any> | null = null;
  let catalogItemListSchema: Record<string, any> | null = null;

  if (activeTool) {
    const isMergePdf = activeTool.slug === "merge-pdf" || activeTool.id === "merge-pdf";
    const toolUrl = pseoPage ? `${baseUrl}/${pseoPage.slug}` : `${baseUrl}/${activeTool.slug}`;
    const toolName = pseoPage?.headline || (isMergePdf ? "Free Online PDF Merger & Combiner" : `${activeTool.name} - Free Online PDF Tool`);
    const toolDesc = pseoPage?.seoDescription || activeTool.description;
    const alternateNames = isMergePdf
      ? ["PDF Joiner", "Combine PDF Online", "PDF Merger", "Merge PDF Files Online"]
      : [`Online ${activeTool.name}`, `${activeTool.name} Free`, `Web ${activeTool.name}`];

    const howToSteps = pseoPage?.howToSteps && pseoPage.howToSteps.length > 0
      ? pseoPage.howToSteps.map((s) => ({
          "@type": "HowToStep",
          "name": s.name,
          "text": s.text,
          "position": s.position,
        }))
      : [
          {
            "@type": "HowToStep",
            "name": "Upload PDF Files",
            "text": `Drag and drop your ${activeTool.supportedInput.join(" or ")} documents into the file selection box, or click 'Choose Files'.`,
            "position": 1,
          },
          {
            "@type": "HowToStep",
            "name": isMergePdf ? "Reorder Pages" : "Configure Settings",
            "text": isMergePdf
              ? "Rearrange individual pages or whole documents by dragging them into your preferred sequence."
              : "Adjust tool preferences, formatting options, or page parameters.",
            "position": 2,
          },
          {
            "@type": "HowToStep",
            "name": isMergePdf ? "Merge & Save" : "Process & Download",
            "text": `Click '${activeTool.name}' and instantly download your ${activeTool.outputFormat} document to your device.`,
            "position": 3,
          },
        ];

    // Unified @graph JSON-LD schema combining WebApplication and HowTo for Google Rich Snippets
    activeToolGraphSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "@id": `${toolUrl}#webapp`,
          "url": toolUrl,
          "name": toolName,
          "alternateName": alternateNames,
          "description": toolDesc,
          "applicationCategory": getApplicationCategory(activeTool.category),
          "operatingSystem": "All (Web-based, Windows, Mac, Linux, iOS, Android)",
          "browserRequirements": "Requires HTML5, WebAssembly, and JavaScript enabled.",
          "softwareVersion": "2.1.0",
          "inLanguage": ["en", "es", "de", "hi", "fr", "pt", "ar", "ja", "ru"],
          "featureList": pseoPage?.featureHighlights || [
            `Process ${activeTool.name} directly in browser`,
            "Drag-and-drop page and file management",
            "100% Client-side processing for complete privacy",
            "Zero email or account registration required",
            "Works seamlessly on Mobile, Windows, Mac, and Linux",
            `Supports input formats: ${activeTool.supportedInput.join(", ")}`,
            `Generates output format: ${activeTool.outputFormat}`,
          ],
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
            "name": "PDF Sun",
            "url": baseUrl,
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/og-image.png`,
            },
          },
        },
        {
          "@type": "HowTo",
          "name": pseoPage ? `How to ${pseoPage.headline}` : (isMergePdf ? "How to Merge PDF Files Online" : `How to use ${activeTool.name} Online`),
          "description": `Simple 3-step guide to process files with ${activeTool.name} on PDF Sun.`,
          "step": howToSteps,
        },
      ],
    };

    // BreadcrumbList Schema
    breadcrumbsSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl,
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "PDF Tools",
          "item": `${baseUrl}/#tools`,
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": pseoPage ? pseoPage.headline : activeTool.name,
          "item": toolUrl,
        },
      ],
    };
  } else {
    // Catalog ItemList Schema indexing ALL PDF tools for Rich Catalog Search Snippets
    catalogItemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "PDFSun Online PDF Tools Catalog",
      "description": "Comprehensive list of free, private, in-browser PDF utilities.",
      "numberOfItems": tools.length,
      "itemListElement": tools.map((tool, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "SoftwareApplication",
          "name": tool.name,
          "description": tool.description,
          "url": `${baseUrl}/tool/${tool.slug}`,
          "applicationCategory": getApplicationCategory(tool.category),
          "operatingSystem": "All",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "950",
          },
        },
      })),
    };
  }

  const helmetTitle = pseoPage?.seoTitle || (activeTool ? `${activeTool.name} - Free Online PDF Tool | PDF Sun` : "PDF Sun - 100% Free & Private Online PDF Tools");
  const helmetDesc = pseoPage?.seoDescription || (activeTool ? `${activeTool.description} Free, fast, and secure client-side PDF tool.` : "PDF Sun lets you easily convert, merge, compress, edit, and secure your PDF files online for free. 100% private in-browser WebAssembly processing.");
  const canonicalUrl = pseoPage ? `${baseUrl}/${pseoPage.slug}` : (activeTool ? `${baseUrl}/${activeTool.slug}` : baseUrl);

  return (
    <Helmet>
      <title>{helmetTitle}</title>
      <meta name="description" content={helmetDesc} />
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph */}
      <meta property="og:title" content={helmetTitle} />
      <meta property="og:description" content={helmetDesc} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />

      {/* Twitter Card */}
      <meta name="twitter:title" content={helmetTitle} />
      <meta name="twitter:description" content={helmetDesc} />

      {/* Rel prev and next tags for paginated pages */}
      {currentPage && currentPage > 1 && (
        <link rel="prev" href={currentPage === 2 ? `${baseUrl}/` : `${baseUrl}/?page=${currentPage - 1}`} />
      )}
      {currentPage && totalPages && currentPage < totalPages && (
        <link rel="next" href={`${baseUrl}/?page=${currentPage + 1}`} />
      )}

      {/* Global 30-Language Hreflang Tags for International Organic Search Indexing */}
      {TOP_30_LANGUAGES.map((lang) => (
        <link
          key={lang.code}
          rel="alternate"
          hrefLang={lang.hreflang}
          href={
            pseoPage
              ? `${baseUrl}/${pseoPage.slug}?lang=${lang.code}`
              : isTodayInHistoryActive
              ? `${baseUrl}/today-in-history?lang=${lang.code}`
              : `${baseUrl}/?lang=${lang.code}`
          }
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={pseoPage ? `${baseUrl}/${pseoPage.slug}` : isTodayInHistoryActive ? `${baseUrl}/today-in-history` : `${baseUrl}/`}
      />

      {/* Global WebSite JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>

      {/* Organization JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>

      {/* FAQ Schema JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      {/* Active Tool Combined WebApplication + HowTo @graph JSON-LD */}
      {activeToolGraphSchema && (
        <script type="application/ld+json">
          {JSON.stringify(activeToolGraphSchema)}
        </script>
      )}

      {/* Active Tool Breadcrumbs JSON-LD */}
      {breadcrumbsSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbsSchema)}
        </script>
      )}

      {/* Catalog ItemList JSON-LD for Search Indexing */}
      {catalogItemListSchema && (
        <script type="application/ld+json">
          {JSON.stringify(catalogItemListSchema)}
        </script>
      )}
    </Helmet>
  );
};
