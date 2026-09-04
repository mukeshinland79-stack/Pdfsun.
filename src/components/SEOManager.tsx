import React from "react";
import { Helmet } from "react-helmet-async";
import { ToolItem } from "../types";
import { FAQS } from "../data/toolsData";
import { TOP_30_LANGUAGES } from "../utils/geoLanguageDetector";
import { PSEOLandingPage } from "../data/pSEOData";
import { getLocalizedToolFAQs, buildFaqJsonLd, ToolFAQ } from "../lib/toolFaqHelper";
import { useLanguage } from "../lib/i18n";

export interface SEOManagerProps {
  activeTool: ToolItem | null;
  tools: ToolItem[];
  baseUrl?: string;
  currentPage?: number;
  totalPages?: number;
  isTodayInHistoryActive?: boolean;
  isPricingActive?: boolean;
  pseoPage?: PSEOLandingPage | null;
}

export type { ToolFAQ };

export function getToolFAQs(tool: ToolItem): ToolFAQ[] {
  return getLocalizedToolFAQs(tool);
}

export const SEOManager: React.FC<SEOManagerProps> = ({
  activeTool,
  tools,
  baseUrl = "https://pdfsun.in",
  currentPage,
  totalPages,
  isTodayInHistoryActive = false,
  isPricingActive = false,
  pseoPage = null,
}) => {
  const { t, currentLanguage, isRtl, getToolName, getToolDescription } = useLanguage();

  // 1. Base WebSite & SearchAction Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PDFSun",
    "url": baseUrl,
    "description": "Free PDF converter, merge PDF online, compress PDF size, edit PDF documents safely with PDFSun.",
    "publisher": {
      "@type": "Organization",
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

  // 2. Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PDFSun",
    "url": baseUrl,
    "logo": `${baseUrl}/og-image.png`,
    "sameAs": [],
  };

  // 3. WebApplication & SoftwareApplication Schema for PDFSun
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": ["WebApplication", "SoftwareApplication"],
    "name": "PDFSun - Free Online PDF Tools",
    "url": baseUrl,
    "description": "Free PDF converter, merge PDF online, compress PDF size, edit PDF documents safely with PDFSun.",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All (Web-based, Windows, macOS, Linux, iOS, Android)",
    "browserRequirements": "Requires HTML5 and WebAssembly compatible browser.",
    "softwareVersion": "2.1.0",
    "inLanguage": ["en", "es", "de", "hi", "fr", "pt", "ar", "ja", "ru"],
    "featureList": [
      "Merge multiple PDF files into one",
      "Split and extract PDF pages",
      "Compress PDF to 100KB, 200KB, 300KB, 500KB with sub-second speeds",
      "Convert PDF to Word, Excel, PowerPoint, JPG, PNG",
      "OCR Text Recognition directly in browser",
      "AI PDF Chat, Summarization, and Translation",
      "Password Protect and Unlock PDF files",
      "Add and Remove Watermarks",
      "Edit PDF Text and Annotate documents",
      "100% Client-Side WebAssembly Processing for zero data leaks"
    ],
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "18420",
      "reviewCount": "4",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "itemReviewed": {
          "@type": "SoftwareApplication",
          "name": "PDFSun - Online PDF Tools",
          "operatingSystem": "All",
          "applicationCategory": "UtilitiesApplication"
        },
        "author": {
          "@type": "Person",
          "name": "Aarav Sharma"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "reviewBody": "PDFSun AI Notes Generator and AI Chat saved me hundreds of hours during exam prep. Combining research papers and querying formulas is flawless!"
      },
      {
        "@type": "Review",
        "itemReviewed": {
          "@type": "SoftwareApplication",
          "name": "PDFSun - Online PDF Tools",
          "operatingSystem": "All",
          "applicationCategory": "UtilitiesApplication"
        },
        "author": {
          "@type": "Person",
          "name": "Priya Patel"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "reviewBody": "Redacting confidential client data and flattening PDF contracts is client-side instant. The security auto-delete guarantee gives our practice 100% peace of mind."
      },
      {
        "@type": "Review",
        "itemReviewed": {
          "@type": "SoftwareApplication",
          "name": "PDFSun - Online PDF Tools",
          "operatingSystem": "All",
          "applicationCategory": "UtilitiesApplication"
        },
        "author": {
          "@type": "Person",
          "name": "David Miller"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "reviewBody": "Converting complex PDF tables to Excel with zero broken formatting is incredible. PDFSun is easily the fastest PDF workspace on the web."
      },
      {
        "@type": "Review",
        "itemReviewed": {
          "@type": "SoftwareApplication",
          "name": "PDFSun - Online PDF Tools",
          "operatingSystem": "All",
          "applicationCategory": "UtilitiesApplication"
        },
        "author": {
          "@type": "Person",
          "name": "Ananya Gupta"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "reviewBody": "The AI PDF Translator and Explain tool helps our global medical team dissect complex international research quickly. Highly recommended!"
      }
    ],
    "author": {
      "@type": "Organization",
      "name": "PDFSun",
      "url": baseUrl,
      "logo": `${baseUrl}/og-image.png`
    }
  };

  // Pricing SoftwareApplication & Product Schema with AggregateRating
  const pricingProductSchema = isPricingActive ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "PDFSun Pro & Enterprise SSO Plans",
    "description": "High-speed WebAssembly PDF processing with 100% private in-browser security, Gemini 3.6 AI, and SAML 2.0 Enterprise SSO.",
    "brand": {
      "@type": "Brand",
      "name": "PDFSun",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "1280",
      "bestRating": "5",
      "worstRating": "1",
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": `${baseUrl}/pricing`,
      },
      {
        "@type": "Offer",
        "name": "Flexi Pack (100 Lifetime Credits)",
        "price": "99",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://rzp.io/rzp/pdfsun-flexi",
      },
      {
        "@type": "Offer",
        "name": "Pro Sun Monthly",
        "price": "199",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://rzp.io/rzp/pdfsun-monthly",
      },
      {
        "@type": "Offer",
        "name": "Pro Sun Annual (Save 40%)",
        "price": "1499",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://rzp.io/rzp/pdfsun-annual",
      },
      {
        "@type": "Offer",
        "name": "Enterprise Plan (5 Seats)",
        "price": "3999",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://rzp.io/rzp/pdfsun-enterprise",
      },
      {
        "@type": "Offer",
        "name": "Enterprise SSO Unlimited (20 Seats)",
        "price": "9999",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://rzp.io/rzp/DTBivZF",
      },
    ],
  } : null;

  // 4. Dynamic JSON-LD FAQ Schema (Tool-Specific for Tool Pages & Platform Global for Homepage)
  let faqSchema: Record<string, any>;

  if (activeTool) {
    const baseFaqs = getLocalizedToolFAQs(activeTool, {
      t,
      currentLanguage,
      getToolName,
      getToolDescription,
    });
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

    faqSchema = buildFaqJsonLd(uniqueFaqs);
  } else {
    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is PDFSun completely free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! PDFSun offers 100% free access to all 57+ PDF tools including Merge PDF, Split PDF, Compress PDF, PDF to Word converter, and AI PDF tools with zero registration required."
          }
        },
        {
          "@type": "Question",
          "name": "How to merge PDF online with PDFSun?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Simply drag and drop your PDF files into the PDFSun Merge tool, rearrange the pages in your desired sequence, and click 'Merge PDF' to instantly download your combined document."
          }
        },
        {
          "@type": "Question",
          "name": "How to compress PDF size safely?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Upload your PDF file to the PDFSun Compress tool, choose your target size or quality level (such as 100KB, 200KB, or 500KB), and download your reduced file in sub-second speeds without losing clarity."
          }
        },
        {
          "@type": "Question",
          "name": "Are my uploaded PDF files safe on PDFSun?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Privacy is guaranteed. Core PDF operations execute 100% locally inside your browser via WebAssembly. Your files are never uploaded, stored, or shared."
          }
        },
        {
          "@type": "Question",
          "name": "Can I use PDFSun on mobile, Mac, and Windows?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! PDFSun works smoothly across all modern web browsers on iPhone, Android, Windows, Mac, and Linux, and can be installed as a Progressive Web App (PWA)."
          }
        },
        ...FAQS.slice(0, 5).map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a,
          },
        }))
      ],
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

  const defaultTitle = `PDFSun - ${t("hero.title", "Enterprise PDF Tools & Document Engine")} | ${t("hero.statsPrivate", "100% In-Browser Privacy")}`;
  const defaultDesc = `${t("hero.subtitle", "100% Client-Side WebAssembly Processing. Private, Fast, & Secure.")} ${t("badges.privacyTitle", "100% In-Browser Privacy")}.`;

  const localizedToolName = activeTool ? getToolName(activeTool) : "";
  const localizedToolDesc = activeTool ? getToolDescription(activeTool) : "";

  const helmetTitle = pseoPage?.seoTitle || (isPricingActive ? `${t("pricing.title", "Simple, Transparent")} ${t("pricing.titleHighlight", "Pricing Plans")} - PDFSun | pdfsun.in` : (activeTool ? `${localizedToolName} - ${t("badges.privacyTitle", "100% In-Browser Privacy")} | PDFSun` : defaultTitle));
  const helmetDesc = pseoPage?.seoDescription || (isPricingActive ? `${t("pricing.subtitle", "100% private WebAssembly PDF processing with zero data uploads. Multi-currency billing for India (Razorpay) & Global enterprises (Stripe). First 7 Days 100% Money-Back Guarantee.")}` : (activeTool ? `${localizedToolDesc} ${t("hero.subtitle", "100% Client-Side WebAssembly Processing. Private, Fast, & Secure.")}` : defaultDesc));
  const canonicalUrl = pseoPage ? `${baseUrl}/${pseoPage.slug}` : (isPricingActive ? `${baseUrl}/pricing` : (activeTool ? `${baseUrl}/${activeTool.slug}` : baseUrl));

  return (
    <Helmet
      htmlAttributes={{
        lang: currentLanguage,
        dir: isRtl ? "rtl" : "ltr",
      }}
    >
      <title>{helmetTitle}</title>
      <meta name="description" content={helmetDesc} />
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph / Social Sharing Meta */}
      <meta property="og:title" content={helmetTitle} />
      <meta property="og:description" content={helmetDesc} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="PDFSun" />
      <meta property="og:image" content={`${baseUrl}/og-image.png`} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={helmetTitle} />
      <meta name="twitter:description" content={helmetDesc} />
      <meta name="twitter:image" content={`${baseUrl}/og-image.png`} />

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
              : isPricingActive
              ? `${baseUrl}/pricing?lang=${lang.code}`
              : isTodayInHistoryActive
              ? `${baseUrl}/today-in-history?lang=${lang.code}`
              : activeTool
              ? `${baseUrl}/${activeTool.slug}?lang=${lang.code}`
              : `${baseUrl}/?lang=${lang.code}`
          }
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={pseoPage ? `${baseUrl}/${pseoPage.slug}` : isPricingActive ? `${baseUrl}/pricing` : isTodayInHistoryActive ? `${baseUrl}/today-in-history` : activeTool ? `${baseUrl}/${activeTool.slug}` : `${baseUrl}/`}
      />

      {/* Global WebSite JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>

      {/* WebApplication & SoftwareApplication JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(webAppSchema)}
      </script>

      {/* Organization JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>

      {/* FAQ Schema JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      {/* Pricing Product & Offer Schema */}
      {pricingProductSchema && (
        <script type="application/ld+json">
          {JSON.stringify(pricingProductSchema)}
        </script>
      )}

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
