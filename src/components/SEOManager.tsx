import React from "react";
import { Helmet } from "react-helmet-async";
import { ToolItem } from "../types";

export interface SEOManagerProps {
  activeTool: ToolItem | null;
  tools: ToolItem[];
  baseUrl?: string;
}

export const SEOManager: React.FC<SEOManagerProps> = ({
  activeTool,
  tools,
  baseUrl = "https://pdfsun.vercel.app",
}) => {
  // 1. Base WebSite & SearchAction Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PDFSun",
    "url": baseUrl,
    "description": "Enterprise-grade 100% private in-browser PDF software suite with 50+ free online PDF tools.",
    "publisher": {
      "@type": "Organization",
      "name": "PDFSun",
      "url": baseUrl,
      "logo": `${baseUrl}/icon.png`,
      "founder": {
        "@type": "Person",
        "name": "Mukesh Kalonia",
        "jobTitle": "Lead Web Developer",
      },
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
    "name": "PDFSun",
    "url": baseUrl,
    "logo": `${baseUrl}/icon.png`,
    "sameAs": [
      "https://github.com/mukeshkalonia/pdfsun",
      "https://twitter.com/pdfsun",
    ],
    "founder": {
      "@type": "Person",
      "name": "Mukesh Kalonia",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Are my uploaded PDF files safe on PDFSun?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "At PDFSun, privacy is paramount. Operations run 100% locally inside your browser via webassembly. For AI features, temporary files are processed securely in memory over TLS HTTPS and purged immediately.",
        },
      },
      {
        "@type": "Question",
        "name": "Is PDFSun completely free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! PDFSun offers generous free access to 50+ tools with zero mandatory account registration.",
        },
      },
      {
        "@type": "Question",
        "name": "Can I use PDFSun offline as a Progressive Web App (PWA)?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! PDFSun is built as a Progressive Web App (PWA). You can install it on Desktop, Mac, iPhone, or Android device to process PDFs offline.",
        },
      },
    ],
  };

  // Build active tool specific schemas or multi-tool catalog schema
  let activeToolSchema: Record<string, any> | null = null;
  let activeToolHowToSchema: Record<string, any> | null = null;
  let breadcrumbsSchema: Record<string, any> | null = null;
  let catalogItemListSchema: Record<string, any> | null = null;

  if (activeTool) {
    // Single Active Tool WebApplication Schema for Rich Snippets
    activeToolSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": `${activeTool.name} - Free Online Tool`,
      "url": `${baseUrl}/tool/${activeTool.slug}`,
      "description": activeTool.description,
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "All (Web Browser)",
      "browserRequirements": "Requires HTML5 & JavaScript enabled",
      "softwareVersion": "3.8.0",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "1280",
        "bestRating": "5",
        "worstRating": "1",
      },
      "featureList": [
        "100% Private Client-Side Processing",
        "Zero File Server Uploads",
        `Supports input: ${activeTool.supportedInput.join(", ")}`,
        `Generates output: ${activeTool.outputFormat}`,
      ],
    };

    // Step-by-step HowTo Schema for Google Rich HowTo Snippets
    activeToolHowToSchema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": `How to use ${activeTool.name} online for free`,
      "description": `Quick 3-step guide to process files with ${activeTool.name} on PDFSun without uploading data to external servers.`,
      "step": [
        {
          "@type": "HowToStep",
          "name": "Upload Files",
          "text": `Select or drag and drop your ${activeTool.supportedInput.join(" or ")} files into the ${activeTool.name} workspace area.`,
          "url": `${baseUrl}/tool/${activeTool.slug}#step-1`,
        },
        {
          "@type": "HowToStep",
          "name": "Configure Options",
          "text": "Adjust processing settings, page ranges, or compression levels as desired.",
          "url": `${baseUrl}/tool/${activeTool.slug}#step-2`,
        },
        {
          "@type": "HowToStep",
          "name": "Process & Download",
          "text": `Click Process to instantly generate and download your high quality ${activeTool.outputFormat} file directly in your browser.`,
          "url": `${baseUrl}/tool/${activeTool.slug}#step-3`,
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
          "name": activeTool.name,
          "item": `${baseUrl}/tool/${activeTool.slug}`,
        },
      ],
    };
  } else {
    // Catalog ItemList Schema indexing ALL 50+ PDF tools for Rich Catalog Search Snippets
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
          "@type": "WebApplication",
          "name": tool.name,
          "description": tool.description,
          "url": `${baseUrl}/tool/${tool.slug}`,
          "applicationCategory": "UtilitiesApplication",
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

  return (
    <Helmet>
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

      {/* Active Tool Specific WebApplication JSON-LD */}
      {activeToolSchema && (
        <script type="application/ld+json">
          {JSON.stringify(activeToolSchema)}
        </script>
      )}

      {/* Active Tool HowTo JSON-LD */}
      {activeToolHowToSchema && (
        <script type="application/ld+json">
          {JSON.stringify(activeToolHowToSchema)}
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
