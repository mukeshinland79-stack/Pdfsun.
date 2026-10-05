import { ALL_TOOLS } from "../data/toolsData";
import { PSEO_LANDING_PAGES, POPULAR_COMPRESS_SIZES, generateCompressSizePseoPage, matchPSEORoute } from "../data/pSEOData";
import { BLOG_POSTS } from "../data/blogData";

interface PageSeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  ogImage: string;
  keywords: string;
  jsonLdSchemas: object[];
  crawlableHtml: string;
}

/**
 * Builds rich, crawlable HTML semantic content and structured JSON-LD for any route on PDFSun.in.
 * This guarantees Googlebot, Bingbot, and other search crawlers index exact keyword-targeted content
 * directly on the initial HTTP response without waiting for client-side JavaScript execution.
 */
export function getSeoMetadataForPath(rawPath: string, queryParams: Record<string, any> = {}): PageSeoMetadata {
  const cleanPath = (rawPath.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const baseUrl = "https://pdfsun.in";
  const defaultOgImage = `${baseUrl}/og-image.png`;

  // 1. Home Page (/)
  if (cleanPath === "/" || cleanPath === "") {
    return {
      title: "PDFSun - Free Online PDF Tools | Merge, Compress, Split & Convert PDF",
      description: "100% private, free online PDF tools. Merge, compress, split, convert, and sign PDF documents directly in your browser. Zero server upload, ultra-fast WebAssembly processing.",
      canonicalUrl: `${baseUrl}/`,
      ogTitle: "PDFSun - Free Online PDF Tools | 100% Private In-Browser Document Engine",
      ogDescription: "Merge, compress, split, convert, and sign PDF documents directly in your browser with zero server uploads and sub-second WebAssembly speed.",
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: "free pdf tools, merge pdf online free without email, compress pdf under 200kb, split pdf, convert pdf to word, client-side pdf, pdfsun",
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "PDFSun",
          "alternateName": ["PDFSun.in", "PDF Sun", "PDF Sun Online"],
          "url": baseUrl,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${baseUrl}/?search={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "PDFSun Online PDF Engine",
          "operatingSystem": "All",
          "applicationCategory": "UtilitiesApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "32450",
            "bestRating": "5",
          },
        },
      ],
      crawlableHtml: `
        <article style="max-width: 900px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h1>PDFSun - 100% Private In-Browser PDF Suite & Document Utilities</h1>
          <p>Welcome to PDFSun, the premier privacy-first document platform. Unlike traditional converters that upload your sensitive legal contracts, tax records, and medical files to cloud servers, PDFSun executes 100% of processing locally inside your web browser via compiled WebAssembly (WASM).</p>
          <h2>Popular Core PDF Tools</h2>
          <ul>
            <li><a href="/merge-pdf"><strong>Merge PDF</strong></a>: Combine multiple PDF files into one single document with custom page ordering.</li>
            <li><a href="/compress-pdf"><strong>Compress PDF</strong></a>: Reduce PDF size to under 100KB, 200KB, or 500KB while preserving vector text and image clarity.</li>
            <li><a href="/split-pdf"><strong>Split PDF</strong></a>: Extract page ranges or save every page as an individual PDF.</li>
            <li><a href="/pdf-to-word"><strong>PDF to Word</strong></a>: Convert static PDFs into editable Microsoft Word (.docx) documents.</li>
            <li><a href="/sign-pdf-online-free"><strong>Sign PDF</strong></a>: Add electronic signatures, initials, and date stamps without registration.</li>
          </ul>
        </article>
      `,
    };
  }

  // 2. Pricing Page (/pricing)
  if (cleanPath === "/pricing") {
    return {
      title: "PDFSun Pricing - Transparent Free, Flex Pass & Pro Subscription Plans",
      description: "Simple, honest pricing for PDFSun. Free forever tier (₹0), Flex Pass (₹99 for 7 days), Pro Sun Monthly (₹199), and Enterprise SSO. No surprise auto-debits.",
      canonicalUrl: `${baseUrl}/pricing`,
      ogTitle: "PDFSun Pricing - Free, Flex Pass & Pro Sun Plans",
      ogDescription: "Discover flexible plans for individuals, students, and businesses. 100% client-side privacy, unlimited operations, and high-performance WebAssembly processing.",
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: "pdfsun pricing, pdf tools subscription, flex pass pdf, pro sun monthly, enterprise pdf tools",
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "PDFSun Pro & Enterprise Suite",
          "description": "Enterprise-grade client-side WebAssembly document engine with zero server upload.",
          "brand": { "@type": "Brand", "name": "PDFSun" },
          "offers": [
            { "@type": "Offer", "name": "Free Forever", "price": "0", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": `${baseUrl}/pricing` },
            { "@type": "Offer", "name": "Flex Pass (7 Days)", "price": "99", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": `${baseUrl}/pricing` },
            { "@type": "Offer", "name": "Pro Sun Monthly", "price": "199", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": `${baseUrl}/pricing` },
            { "@type": "Offer", "name": "Pro Sun Annual", "price": "1499", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": `${baseUrl}/pricing` },
            { "@type": "Offer", "name": "Enterprise Plan", "price": "3999", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": `${baseUrl}/pricing` },
            { "@type": "Offer", "name": "Enterprise SSO Unlimited", "price": "9999", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": `${baseUrl}/pricing` },
          ],
        },
      ],
      crawlableHtml: `
        <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
          <h1>PDFSun Subscription & Access Plans</h1>
          <p>Choose the plan that fits your document needs. From 100% free daily utilities to enterprise-wide unlimited WebAssembly batch processing.</p>
          <h2>Available Tiers</h2>
          <ul>
            <li><strong>Free Forever (₹0)</strong>: Basic PDF tools, 15 MB file size limit, 3 operations per day.</li>
            <li><strong>Flex Pass (₹99 / 7 Days)</strong>: Pay-as-you-go access, valid for 7 days with no auto-debit commitments.</li>
            <li><strong>Pro Sun Monthly (₹199 / month)</strong>: Full feature access, standard limits, auto-renewed monthly.</li>
            <li><strong>Pro Sun Annual (₹1,499 / year)</strong>: Full feature access, high limits, billed yearly.</li>
            <li><strong>Enterprise Plan (₹3,999 / year)</strong>: Multi-user access (5 seats), high processing limits, priority support.</li>
            <li><strong>Enterprise SSO Unlimited (₹9,999 / year)</strong>: Enterprise SSO (20 seats), unlimited throughput, dedicated infrastructure.</li>
          </ul>
        </article>
      `,
    };
  }

  // 3. Blog Index (/blog)
  if (cleanPath === "/blog") {
    return {
      title: "PDFSun Blog & Engineering Guides - Document Privacy & Tips",
      description: "Expert guides, tutorials, and technical deep-dives on PDF editing, WebAssembly in-browser processing, document security, OCR, and digital workflows.",
      canonicalUrl: `${baseUrl}/blog`,
      ogTitle: "PDFSun Blog & Engineering Insights",
      ogDescription: "In-depth articles on digital document optimization, client-side privacy, file compression benchmarks, and zero-knowledge workflows.",
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: "pdf blog, pdf tutorials, how to compress pdf, webassembly pdf, pdf privacy, pdf security guides",
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "PDFSun Document Insights",
          "url": `${baseUrl}/blog`,
          "description": "Guides and tutorials on PDF manipulation, security, and WebAssembly computing.",
        },
      ],
      crawlableHtml: `
        <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
          <h1>PDFSun Engineering & Document Insights</h1>
          <p>Explore our latest tutorials and technical articles on client-side PDF computing and privacy.</p>
          ${BLOG_POSTS.map(
            (b) => `
            <div style="margin-bottom: 24px;">
              <h2><a href="/blog/${b.slug}">${b.title}</a></h2>
              <p>${b.excerpt}</p>
              <small>By ${b.author} • ${b.date} • ${b.readTime}</small>
            </div>
          `
          ).join("")}
        </article>
      `,
    };
  }

  // 4. Single Blog Article (/blog/:slug)
  if (cleanPath.startsWith("/blog/")) {
    const postSlug = cleanPath.replace("/blog/", "").replace(/\/+$/, "");
    const post = BLOG_POSTS.find((p) => p.slug === postSlug);
    if (post) {
      return {
        title: `${post.title} | PDFSun`,
        description: post.excerpt,
        canonicalUrl: `${baseUrl}/blog/${post.slug}`,
        ogTitle: post.title,
        ogDescription: post.excerpt,
        ogType: "article",
        ogImage: post.image || defaultOgImage,
        keywords: (post.tags || []).join(", ") + ", pdfsun, pdf guide",
        jsonLdSchemas: [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.excerpt,
            "image": post.image || defaultOgImage,
            "datePublished": post.date,
            "dateModified": post.lastModified || post.date,
            "author": {
              "@type": "Person",
              "name": post.author,
            },
            "publisher": {
              "@type": "Organization",
              "name": "PDFSun",
              "logo": {
                "@type": "ImageObject",
                "url": `${baseUrl}/logo.png`,
              },
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `${baseUrl}/blog/${post.slug}`,
            },
          },
          ...(post.faqs && post.faqs.length > 0
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": post.faqs.map((f) => ({
                    "@type": "Question",
                    "name": f.question,
                    "acceptedAnswer": { "@type": "Answer", "text": f.answer },
                  })),
                },
              ]
            : []),
        ],
        crawlableHtml: `
          <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
            <h1>${post.title}</h1>
            <p style="font-weight: bold; color: #475569;">${post.excerpt}</p>
            <p><small>Published by ${post.author} on ${post.date}</small></p>
            <div>${post.executiveSummary ? `<div style="background: #f1f5f9; padding: 16px; border-radius: 8px;"><strong>Executive Summary:</strong> ${post.executiveSummary}</div>` : ""}</div>
            ${post.faqs ? `<h2>Frequently Asked Questions</h2>${post.faqs.map((f) => `<div><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("")}` : ""}
          </article>
        `,
      };
    }
  }

  // 5. Popular Target Size Programmatic SEO Pages (e.g. /compress-pdf-to-200kb, /compress-pdf-to-100kb, etc.)
  const sizeMatch = cleanPath.match(/^\/compress-pdf-to-(\d+)(kb|mb)$/i);
  if (sizeMatch) {
    const rawSize = `${sizeMatch[1]}${sizeMatch[2].toLowerCase()}`;
    const pseoPage = generateCompressSizePseoPage(rawSize, "Global");
    return {
      title: pseoPage.seoTitle,
      description: pseoPage.seoDescription,
      canonicalUrl: `${baseUrl}/${pseoPage.slug}`,
      ogTitle: pseoPage.headline,
      ogDescription: pseoPage.seoDescription,
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: `compress pdf to ${rawSize}, reduce pdf size to ${rawSize} free, shrink pdf to ${rawSize} online, pdf under ${rawSize}`,
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": pseoPage.headline,
          "url": `${baseUrl}/${pseoPage.slug}`,
          "description": pseoPage.seoDescription,
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "All",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": `How to Compress PDF to ${rawSize.toUpperCase()} Online Free`,
          "step": pseoPage.howToSteps.map((s) => ({
            "@type": "HowToStep",
            "position": s.position,
            "name": s.name,
            "text": s.text,
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": pseoPage.customFaqs.map((f) => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer },
          })),
        },
      ],
      crawlableHtml: `
        <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
          <h1>${pseoPage.headline}</h1>
          <p>${pseoPage.subheadline}</p>
          <div style="background: #e0f2fe; padding: 12px; border-radius: 6px; margin: 16px 0;">
            <strong>${pseoPage.complianceBadge}</strong>: ${pseoPage.intentBlockText}
          </div>
          <h2>Step-by-Step Instructions</h2>
          <ol>
            ${pseoPage.howToSteps.map((s) => `<li><strong>${s.name}</strong>: ${s.text}</li>`).join("")}
          </ol>
          <h2>Frequently Asked Questions</h2>
          ${pseoPage.customFaqs.map((f) => `<div><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("")}
        </article>
      `,
    };
  }

  // 6. Curated pSEO Landing Pages (e.g. /merge-pdf-without-email, /sign-pdf-online-free, /compress-pdf-to-100kb, etc.)
  const matchedPseo = matchPSEORoute(cleanPath);
  if (matchedPseo) {
    return {
      title: matchedPseo.seoTitle,
      description: matchedPseo.seoDescription,
      canonicalUrl: `${baseUrl}/${matchedPseo.slug}`,
      ogTitle: matchedPseo.headline,
      ogDescription: matchedPseo.seoDescription,
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: `${matchedPseo.headline.toLowerCase()}, online pdf free, no watermark, no email, pdfsun`,
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": matchedPseo.headline,
          "url": `${baseUrl}/${matchedPseo.slug}`,
          "description": matchedPseo.seoDescription,
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "All",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": `How to Use ${matchedPseo.headline}`,
          "step": matchedPseo.howToSteps.map((s) => ({
            "@type": "HowToStep",
            "position": s.position,
            "name": s.name,
            "text": s.text,
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": matchedPseo.customFaqs.map((f) => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer },
          })),
        },
      ],
      crawlableHtml: `
        <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
          <h1>${matchedPseo.headline}</h1>
          <p>${matchedPseo.subheadline}</p>
          <h2>Key Features</h2>
          <ul>
            ${matchedPseo.featureHighlights.map((f) => `<li>${f}</li>`).join("")}
          </ul>
          <h2>How To Guide</h2>
          <ol>
            ${matchedPseo.howToSteps.map((s) => `<li><strong>${s.name}</strong>: ${s.text}</li>`).join("")}
          </ol>
          <h2>Frequently Asked Questions</h2>
          ${matchedPseo.customFaqs.map((f) => `<div><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("")}
        </article>
      `,
    };
  }

  // 7. Core Individual Tool Pages (e.g. /merge-pdf, /split-pdf, /compress-pdf, /pdf-to-word, etc.)
  const toolSlug = cleanPath.replace(/^\//, "").replace(/\/+$/, "");
  const matchedTool = ALL_TOOLS.find((t) => t.slug === toolSlug || t.id === toolSlug);
  if (matchedTool) {
    const toolTitle = `${matchedTool.name} Online Free - 100% Private In-Browser | PDFSun`;
    const toolDesc = `${matchedTool.description} Free, fast, zero server uploads. Process PDFs securely with client-side WebAssembly on PDFSun.`;
    const faqs = matchedTool.faqs || [
      { question: `Is ${matchedTool.name} free to use?`, answer: `Yes! ${matchedTool.name} on PDFSun is 100% free with no registration or email needed.` },
      { question: `Are my files private when using ${matchedTool.name}?`, answer: `Yes. All processing executes client-side inside your browser via WebAssembly. Your files never touch external servers.` },
    ];

    return {
      title: toolTitle,
      description: toolDesc,
      canonicalUrl: `${baseUrl}/${matchedTool.slug}`,
      ogTitle: `${matchedTool.name} - Free Online PDF Tool | PDFSun`,
      ogDescription: matchedTool.description,
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: `${matchedTool.name.toLowerCase()} free, ${matchedTool.slug}, online pdf ${matchedTool.name.toLowerCase()}, private pdf tool, pdfsun`,
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": `${matchedTool.name} - PDFSun`,
          "url": `${baseUrl}/${matchedTool.slug}`,
          "description": matchedTool.description,
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "All",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "14200",
            "bestRating": "5",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": `How to use ${matchedTool.name} Online Free`,
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Select File", "text": "Choose or drag and drop your document into the tool workspace." },
            { "@type": "HowToStep", "position": 2, "name": "Configure & Process", "text": "Adjust options and execute in-browser processing." },
            { "@type": "HowToStep", "position": 3, "name": "Instant Download", "text": "Download your transformed document directly to your device." },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map((f) => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer },
          })),
        },
      ],
      crawlableHtml: `
        <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
          <h1>${matchedTool.name} - 100% Free & Private Online PDF Tool</h1>
          <p>${matchedTool.description}</p>
          <h2>How to use ${matchedTool.name} Online:</h2>
          <ol>
            <li>Select or drag-and-drop your PDF into the workspace above.</li>
            <li>Click process to execute instant in-browser WebAssembly conversion.</li>
            <li>Download your file instantly. No registration or email required.</li>
          </ol>
          <h2>Frequently Asked Questions</h2>
          ${faqs.map((f) => `<div><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("")}
        </article>
      `,
    };
  }

  // 8. Static legal / policy pages (/privacy-policy, /terms-of-service, /about-us, /contact-us)
  const staticTitles: Record<string, string> = {
    "/privacy-policy": "Privacy Policy - Military-Grade In-Browser Document Protection | PDFSun",
    "/terms-of-service": "Terms of Service | PDFSun",
    "/about-us": "About PDFSun - The Zero-Knowledge Client-Side PDF Engine",
    "/contact-us": "Contact PDFSun Support & Partnerships",
  };

  if (staticTitles[cleanPath]) {
    return {
      title: staticTitles[cleanPath],
      description: `Official document information and compliance policies for PDFSun (pdfsun.in). 100% local WebAssembly processing.`,
      canonicalUrl: `${baseUrl}${cleanPath}`,
      ogTitle: staticTitles[cleanPath],
      ogDescription: `PDFSun official policies and information.`,
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: "pdfsun policy, pdf privacy, terms of service, pdfsun contact",
      jsonLdSchemas: [],
      crawlableHtml: `<article><h1>${staticTitles[cleanPath]}</h1><p>PDFSun compliance and information page.</p></article>`,
    };
  }

  // Fallback to Home metadata with current canonical
  return {
    title: "PDFSun - Free Online PDF Tools | Merge, Compress, Split & Convert PDF",
    description: "100% private, free online PDF tools. Merge, compress, split, convert, and sign PDF documents directly in your browser with zero server uploads.",
    canonicalUrl: `${baseUrl}${cleanPath}`,
    ogTitle: "PDFSun - Free Online PDF Tools",
    ogDescription: "Fast, 100% private in-browser PDF utilities powered by WebAssembly.",
    ogType: "website",
    ogImage: defaultOgImage,
    keywords: "free pdf tools, merge pdf, compress pdf, split pdf, pdfsun",
    jsonLdSchemas: [],
    crawlableHtml: `<article><h1>PDFSun Document Suite</h1></article>`,
  };
}

/**
 * Injects route-specific SEO tags, canonical link, OpenGraph metadata, JSON-LD schemas,
 * and semantic crawlable fallback content into the base index.html template string.
 */
export function injectSeoTagsIntoHtml(htmlTemplate: string, rawPath: string, queryParams: Record<string, any> = {}): string {
  const seo = getSeoMetadataForPath(rawPath, queryParams);

  let updatedHtml = htmlTemplate;

  // 1. Replace <title>
  updatedHtml = updatedHtml.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(seo.title)}</title>`);

  // 2. Replace <meta name="description" content="..." />
  updatedHtml = updatedHtml.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/is,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`
  );

  // 3. Replace <meta name="keywords" content="..." />
  if (updatedHtml.includes('name="keywords"')) {
    updatedHtml = updatedHtml.replace(
      /<meta\s+name="keywords"\s+content=".*?"\s*\/?>/is,
      `<meta name="keywords" content="${escapeHtml(seo.keywords)}" />`
    );
  }

  // 4. Replace <link rel="canonical" href="..." />
  updatedHtml = updatedHtml.replace(
    /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/is,
    `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />`
  );

  // 5. Replace OpenGraph og:title, og:description, og:url, og:type, og:image
  updatedHtml = updatedHtml.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/is,
    `<meta property="og:title" content="${escapeHtml(seo.ogTitle)}" />`
  );
  updatedHtml = updatedHtml.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/is,
    `<meta property="og:description" content="${escapeHtml(seo.ogDescription)}" />`
  );
  updatedHtml = updatedHtml.replace(
    /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/is,
    `<meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}" />`
  );

  // 6. Replace Twitter Card title & description
  updatedHtml = updatedHtml.replace(
    /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/is,
    `<meta name="twitter:title" content="${escapeHtml(seo.ogTitle)}" />`
  );
  updatedHtml = updatedHtml.replace(
    /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/is,
    `<meta name="twitter:description" content="${escapeHtml(seo.ogDescription)}" />`
  );

  // 7. Inject Route-Specific JSON-LD schemas right before </head>
  if (seo.jsonLdSchemas && seo.jsonLdSchemas.length > 0) {
    const jsonLdScripts = seo.jsonLdSchemas
      .map((schema) => `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`)
      .join("\n");
    updatedHtml = updatedHtml.replace("</head>", `${jsonLdScripts}\n</head>`);
  }

  // 8. Replace semantic <noscript> crawlable content so bots get accurate page content
  if (seo.crawlableHtml) {
    updatedHtml = updatedHtml.replace(
      /<noscript>[\s\S]*?<\/noscript>/i,
      `<noscript>\n<div class="crawlable-seo-fallback" style="padding: 24px; max-width: 900px; margin: 0 auto; font-family: sans-serif;">\n${seo.crawlableHtml}\n</div>\n</noscript>`
    );
  }

  return updatedHtml;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
