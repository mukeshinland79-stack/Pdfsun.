/**
 * PDFSun.in — Global Document Category Intelligence Engine (Phase 19)
 * 
 * Provides an extensible 25-category taxonomy supporting worldwide commercial,
 * government, industrial, financial, legal, medical, educational, and personal documents.
 * 
 * Designed for 100% Client-Side Privacy: zero remote server calls or API dependencies.
 */

export type GlobalCategoryKey =
  | "government_public_admin"
  | "industrial_manufacturing"
  | "business_commercial_invoices"
  | "banking_finance_accounting"
  | "legal_judicial"
  | "healthcare_medical"
  | "education_research"
  | "construction_real_estate"
  | "logistics_transport_supply_chain"
  | "human_resources_employment"
  | "insurance"
  | "agriculture"
  | "energy_utilities"
  | "telecom_it"
  | "aviation"
  | "automotive"
  | "science_laboratory"
  | "research_statistics"
  | "marketing_media"
  | "personal_individual"
  | "hospitality_tourism"
  | "environment"
  | "defence_public_safety"
  | "nonprofit_ngo"
  | "international_trade"
  | "general_unclassified";

export interface GlobalCategoryMeta {
  key: GlobalCategoryKey;
  id: number;
  name: string;
  badgeLabel: string;
  description: string;
  typicalSubtypes: string[];
  keywords: string[];
  priorityKeywords: string[];
}

export interface GlobalClassificationResult {
  primaryCategory: GlobalCategoryMeta;
  detectedSubtype: string;
  confidenceScore: number; // 0 to 100
  secondaryMatches: { categoryKey: GlobalCategoryKey; confidence: number }[];
  matchedKeywords: string[];
}

export const GLOBAL_DOCUMENT_CATEGORIES: Record<GlobalCategoryKey, GlobalCategoryMeta> = {
  government_public_admin: {
    key: "government_public_admin",
    id: 1,
    name: "Government & Public Administration",
    badgeLabel: "Government Document",
    description: "Official notifications, gazettes, citizen identity forms, municipal certificates, and property registries.",
    typicalSubtypes: ["Gazette Notification", "Government Order/Circular", "Identity Certificate (Aadhaar/PAN)", "Land Record/Registry", "Tender Document"],
    priorityKeywords: ["gazette", "government of", "ministry of", "department of", "circular no", "notification no", "pan card", "aadhaar", "domicile", "tehsildar", "collectorate"],
    keywords: ["affidavit", "stamp paper", "notary", "municipal", "revenue department", "public notice", "tender notice", "birth certificate", "death certificate", "caste certificate"],
  },
  industrial_manufacturing: {
    key: "industrial_manufacturing",
    id: 2,
    name: "Industrial & Manufacturing",
    badgeLabel: "Industrial Document",
    description: "Manufacturing work orders, bill of materials (BOM), standard operating procedures (SOP), and quality inspection reports.",
    typicalSubtypes: ["Bill of Materials (BOM)", "Work Order", "Quality Inspection Report (QC)", "ISO Compliance SOP", "Machine Maintenance Log"],
    priorityKeywords: ["bill of materials", "bom", "work order", "job order", "qc inspection", "iso 9001", "sop", "standard operating procedure", "drawing no", "rev no"],
    keywords: ["fabrication", "tolerance", "machining", "batch no", "lot no", "raw material", "assembly line", "quality assurance", "calibration certificate"],
  },
  business_commercial_invoices: {
    key: "business_commercial_invoices",
    id: 3,
    name: "Business, Commercial & Invoices",
    badgeLabel: "Commercial Invoice",
    description: "Commercial B2B/B2C invoices, proforma invoices, sales orders, purchase orders, delivery challans, and receipts.",
    typicalSubtypes: ["GST Tax Invoice", "Proforma Invoice", "Purchase Order", "Sales Order", "Delivery Challan", "Retail Receipt"],
    priorityKeywords: ["tax invoice", "proforma invoice", "commercial invoice", "invoice no", "billed to", "sold by", "gstin", "subtotal", "taxable value", "amount in words"],
    keywords: ["delivery challan", "purchase order", "sales order", "e-way bill", "hsn", "sac", "cgst", "sgst", "igst", "discount", "grand total"],
  },
  banking_finance_accounting: {
    key: "banking_finance_accounting",
    id: 4,
    name: "Banking, Finance & Accounting",
    badgeLabel: "Financial Statement",
    description: "Bank transaction statements, corporate balance sheets, profit and loss reports, cash flows, and credit ledgers.",
    typicalSubtypes: ["Bank Statement & Ledger", "Balance Sheet", "Profit & Loss Statement", "Cash Flow Statement", "Loan Agreement"],
    priorityKeywords: ["bank statement", "balance sheet", "profit & loss", "statement of account", "debit", "credit", "running balance", "ifsc code", "account no"],
    keywords: ["assets", "liabilities", "equity", "ebitda", "gross profit", "net profit", "cheque no", "transaction date", "withdrawal", "deposit", "interest"],
  },
  legal_judicial: {
    key: "legal_judicial",
    id: 5,
    name: "Legal & Judicial",
    badgeLabel: "Legal Document",
    description: "Court judgments, legal notices, bilateral agreements, contracts, deeds, and power of attorney records.",
    typicalSubtypes: ["Court Order / Judgment", "Legal Notice", "Commercial Contract", "Sale / Lease Deed", "Power of Attorney"],
    priorityKeywords: ["in the court of", "versus", "vs.", "petitioner", "respondent", "plaintiff", "defendant", "judgment", "legal notice", "power of attorney"],
    keywords: ["whereas", "hereby agreed", "indemnity", "jurisdiction", "arbitration", "witnesseth", "notary public", "counsel for", "suit no", "affidavit"],
  },
  healthcare_medical: {
    key: "healthcare_medical",
    id: 6,
    name: "Healthcare & Medical",
    badgeLabel: "Medical Record",
    description: "Doctor prescriptions, pathology laboratory reports, hospital discharge summaries, clinical bills, and insurance claims.",
    typicalSubtypes: ["Prescription", "Pathology Lab Report", "Discharge Summary", "Hospital Bill", "Clinical Trial Report"],
    priorityKeywords: ["hospital", "dr.", "patient name", "rx", "diagnosis", "discharge summary", "pathology report", "laboratory test", "blood test"],
    keywords: ["dosage", "symptoms", "treatment", "specimen", "reference range", "haemoglobin", "admission date", "physician", "clinic", "medical record no"],
  },
  education_research: {
    key: "education_research",
    id: 7,
    name: "Education & Research",
    badgeLabel: "Academic Document",
    description: "Academic degree certificates, mark sheets, university transcripts, dissertations, and research papers.",
    typicalSubtypes: ["Mark Sheet / Transcript", "Degree Certificate", "Research Paper", "Dissertation", "Question Paper"],
    priorityKeywords: ["university", "board of education", "roll no", "enrollment no", "marksheet", "transcript", "bachelor of", "master of", "semester"],
    keywords: ["grade", "credits", "subject", "abstract", "methodology", "bibliography", "conclusion", "ph.d.", "academic year", "examination"],
  },
  construction_real_estate: {
    key: "construction_real_estate",
    id: 8,
    name: "Construction, Architecture & Real Estate",
    badgeLabel: "Real Estate & Architecture",
    description: "Architectural blueprints, bills of quantities (BOQ), structural reports, and property valuation assessments.",
    typicalSubtypes: ["Bill of Quantities (BOQ)", "Property Valuation Report", "Architectural Plan", "Site Inspection Report"],
    priorityKeywords: ["bill of quantities", "boq", "sq. ft.", "sq. mtr.", "built-up area", "super area", "architectural", "structural engineer", "carpet area"],
    keywords: ["valuation", "property address", "plot no", "floor plan", "excavation", "reinforcement", "concrete", "contractor", "civil works"],
  },
  logistics_transport_supply_chain: {
    key: "logistics_transport_supply_chain",
    id: 9,
    name: "Logistics, Transport & Supply Chain",
    badgeLabel: "Logistics & Shipping",
    description: "Bills of lading, packing lists, consignment notes, customs manifests, and transport receipts.",
    typicalSubtypes: ["Bill of Lading", "Packing List", "Consignment Note (LR)", "Shipping Manifest", "Customs Declaration"],
    priorityKeywords: ["bill of lading", "packing list", "consignment note", "lorry receipt", "lr no", "shipper", "consignee", "port of loading", "port of discharge"],
    keywords: ["gross weight", "net weight", "container no", "vessel", "carrier", "freight charges", "delivery address", "customs broker", "air waybill"],
  },
  human_resources_employment: {
    key: "human_resources_employment",
    id: 10,
    name: "Human Resources & Employment",
    badgeLabel: "HR & Employment",
    description: "Employment offer letters, salary pay slips, experience letters, appraisal forms, and non-disclosure agreements.",
    typicalSubtypes: ["Salary Pay Slip", "Offer / Appointment Letter", "Experience Certificate", "Relieving Letter", "Performance Appraisal"],
    priorityKeywords: ["pay slip", "payslip", "salary slip", "offer letter", "appointment letter", "employee id", "basic salary", "hra", "provident fund"],
    keywords: ["designation", "date of joining", "ctc", "deductions", "net pay", "relieving", "experience letter", "human resources", "department"],
  },
  insurance: {
    key: "insurance",
    id: 11,
    name: "Insurance",
    badgeLabel: "Insurance Document",
    description: "Insurance policy schedules, renewal notices, endorsements, and claim settlement summaries.",
    typicalSubtypes: ["Policy Schedule", "Claim Form", "Insurance Premium Receipt", "Health Card"],
    priorityKeywords: ["policy no", "sum insured", "premium amount", "insurance company", "claim no", "insured person", "policy schedule"],
    keywords: ["nominee", "coverage", "deductible", "tpa", "underwriter", "period of insurance", "endorsement", "co-pay"],
  },
  agriculture: {
    key: "agriculture",
    id: 12,
    name: "Agriculture",
    badgeLabel: "Agriculture Document",
    description: "Soil test reports, crop health assessments, agricultural land surveys, and mandi trading receipts.",
    typicalSubtypes: ["Soil Test Report", "Crop Advisory", "Khasra / Khatauni Land Record", "APMC Mandi Receipt"],
    priorityKeywords: ["soil test", "crop", "khasra", "khatauni", "apmc", "mandi", "fertilizer", "hectare", "acre"],
    keywords: ["ph value", "nitrogen", "phosphorus", "potassium", "irrigation", "cultivation", "pesticide", "yield"],
  },
  energy_utilities: {
    key: "energy_utilities",
    id: 13,
    name: "Energy & Utilities",
    badgeLabel: "Utility Bill",
    description: "Electricity consumption bills, piped gas bills, water authority invoices, and solar metering statements.",
    typicalSubtypes: ["Electricity Bill", "Water Authority Bill", "Piped Natural Gas Bill", "Solar Net Metering"],
    priorityKeywords: ["electricity bill", "power distribution", "consumer no", "meter no", "kwh", "units consumed", "tariff", "current reading"],
    keywords: ["previous reading", "connected load", "power factor", "fuel surcharge", "due date", "discom", "utility bill"],
  },
  telecom_it: {
    key: "telecom_it",
    id: 14,
    name: "Telecom & IT",
    badgeLabel: "Telecom & IT",
    description: "Broadband and mobile phone bills, cloud hosting invoices, network topology diagrams, and SLA reports.",
    typicalSubtypes: ["Broadband / Telecom Bill", "Cloud Infrastructure Invoice", "Service Level Agreement (SLA)"],
    priorityKeywords: ["broadband", "telecom", "plan speed", "data usage", "ip address", "bandwidth", "circuit id", "hosting"],
    keywords: ["cloud", "server", "aws", "azure", "uptime", "latency", "dns", "billing cycle", "call details"],
  },
  aviation: {
    key: "aviation",
    id: 15,
    name: "Aviation",
    badgeLabel: "Aviation Record",
    description: "Aircraft flight logs, maintenance engineer sign-offs, pilot logbooks, and airworthiness certificates.",
    typicalSubtypes: ["Flight Log", "Aircraft Maintenance Log", "Airworthiness Certificate"],
    priorityKeywords: ["aircraft", "flight no", "airworthiness", "faa", "dgca", "tail no", "avionics", "altimeter"],
    keywords: ["airspeed", "cockpit", "runway", "departure", "arrival", "fuel burn", "propulsion", "airframe"],
  },
  automotive: {
    key: "automotive",
    id: 16,
    name: "Automotive",
    badgeLabel: "Automotive Record",
    description: "Vehicle proforma invoices, workshop repair estimates, job cards, service logs, and inspection sheets.",
    typicalSubtypes: ["Vehicle Proforma Invoice", "Workshop Job Card", "Repair Estimate", "Pre-delivery Inspection (PDI)"],
    priorityKeywords: ["chassis no", "engine no", "vehicle no", "reg no", "model", "job card", "odometer", "km reading", "pro 2049", "eicher"],
    keywords: ["spare parts", "labour charges", "workshop", "dealership", "service scheduled", "lubricant", "wheel alignment", "transmission"],
  },
  science_laboratory: {
    key: "science_laboratory",
    id: 17,
    name: "Science & Laboratory",
    badgeLabel: "Scientific Report",
    description: "Chemical analysis reports, material test certificates, spectroscopy data, and lab protocols.",
    typicalSubtypes: ["Chemical Analysis Certificate", "Material Test Report (MTR)", "Lab Protocol"],
    priorityKeywords: ["spectroscopy", "chromatography", "reagent", "molecular", "chemical formula", "assay", "purity"],
    keywords: ["sample id", "batch analysis", "viscosity", "melting point", "ph", "titration", "laboratory analyst"],
  },
  research_statistics: {
    key: "research_statistics",
    id: 18,
    name: "Research & Statistics",
    badgeLabel: "Research & Statistics",
    description: "Statistical survey reports, demographic censuses, regression matrices, and quantitative research findings.",
    typicalSubtypes: ["Survey Report", "Statistical Data Matrix", "Demographic Study"],
    priorityKeywords: ["statistical", "p-value", "standard deviation", "sample size", "confidence interval", "variance", "correlation"],
    keywords: ["demographic", "median", "mean", "regression", "survey respondents", "methodology", "data points"],
  },
  marketing_media: {
    key: "marketing_media",
    id: 19,
    name: "Marketing & Media",
    badgeLabel: "Marketing & Media",
    description: "Product catalogs, sales brochures, marketing plans, press releases, and campaign performance decks.",
    typicalSubtypes: ["Product Brochure", "Catalog", "Press Release", "Campaign Performance Report"],
    priorityKeywords: ["press release", "brochure", "catalog", "for immediate release", "campaign", "roi", "branding"],
    keywords: ["features", "benefits", "audience", "pr contact", "impressions", "reach", "conversion rate"],
  },
  personal_individual: {
    key: "personal_individual",
    id: 20,
    name: "Personal & Individual",
    badgeLabel: "Personal Document",
    description: "Curriculum Vitae (CV), professional resumes, cover letters, personal bios, and personal statements.",
    typicalSubtypes: ["Curriculum Vitae (CV)", "Resume", "Cover Letter", "Personal Bio"],
    priorityKeywords: ["curriculum vitae", "resume", "work experience", "skills", "education summary", "career objective", "personal profile"],
    keywords: ["projects", "certifications", "hobbies", "languages spoken", "achievements", "contact info", "references"],
  },
  hospitality_tourism: {
    key: "hospitality_tourism",
    id: 21,
    name: "Hospitality & Tourism",
    badgeLabel: "Hospitality & Travel",
    description: "Hotel reservation folios, guest invoices, airline flight e-tickets, and tour itineraries.",
    typicalSubtypes: ["Hotel Guest Folio", "Flight E-Ticket", "Travel Itinerary", "Tour Booking"],
    priorityKeywords: ["hotel", "check-in", "check-out", "room no", "guest folio", "flight ticket", "boarding pass", "pnr"],
    keywords: ["itinerary", "booking reference", "traveler name", "room service", "taxes", "amenities", "departure"],
  },
  environment: {
    key: "environment",
    id: 22,
    name: "Environment",
    badgeLabel: "Environmental Report",
    description: "Environmental impact assessments (EIA), air/water quality monitoring logs, and carbon audit certificates.",
    typicalSubtypes: ["Environmental Impact Assessment (EIA)", "Air Quality Index (AQI) Report", "Water Quality Analysis"],
    priorityKeywords: ["environmental impact", "air quality", "aqi", "pollution control", "effluent", "carbon footprint", "emission"],
    keywords: ["pm2.5", "pm10", "suspended solids", "bod", "cod", "noise level", "monitoring station", "greenhouse gas"],
  },
  defence_public_safety: {
    key: "defence_public_safety",
    id: 23,
    name: "Defence & Public Safety",
    badgeLabel: "Public Safety & Defence",
    description: "Incident hazard reports, fire safety clearance certificates, security audits, and emergency protocols.",
    typicalSubtypes: ["Fire Safety Certificate", "Incident Report", "Security Clearance", "Disaster Response Plan"],
    priorityKeywords: ["fire safety", "clearance certificate", "incident report", "security audit", "emergency protocol", "hazard"],
    keywords: ["inspection officer", "evacuation", "extinguisher", "building safety", "risk assessment", "compliance"],
  },
  nonprofit_ngo: {
    key: "nonprofit_ngo",
    id: 24,
    name: "Non-profit & NGOs",
    badgeLabel: "NGO & Non-Profit",
    description: "Charitable grant proposals, donor utilization certificates, donor contribution receipts, and field reports.",
    typicalSubtypes: ["Grant Proposal", "Utilization Certificate", "Donor Receipt (80G)", "NGO Field Progress Report"],
    priorityKeywords: ["non-profit", "ngo", "charitable trust", "grant proposal", "utilization certificate", "donor receipt", "80g"],
    keywords: ["beneficiaries", "csr", "project fund", "community development", "society registration", "impact report"],
  },
  international_trade: {
    key: "international_trade",
    id: 25,
    name: "International Trade",
    badgeLabel: "International Trade",
    description: "Certificates of origin, letters of credit (LC), import/export declarations, and consular invoices.",
    typicalSubtypes: ["Certificate of Origin", "Letter of Credit (LC)", "Commercial Consular Invoice", "Shipping Bill"],
    priorityKeywords: ["certificate of origin", "letter of credit", "incoterms", "fob", "cif", "import export code", "iec", "hs code"],
    keywords: ["country of origin", "beneficiary bank", "port of entry", "customs tariff", "foreign exchange", "consignee"],
  },
  general_unclassified: {
    key: "general_unclassified",
    id: 0,
    name: "General & Unclassified",
    badgeLabel: "Standard Document",
    description: "General text documents, mixed publications, or unspecified correspondence.",
    typicalSubtypes: ["General Letter", "Summary Report", "Miscellaneous Document"],
    priorityKeywords: [],
    keywords: [],
  },
};

/**
 * Classifies extracted PDF text tokens into one of the 25 Global Document Categories
 */
export function classifyGlobalDocument(
  tokens: { text: string }[],
  pageCount: number = 1
): GlobalClassificationResult {
  const fullText = tokens.map((t) => t.text).join(" ").toLowerCase();

  const scores: { key: GlobalCategoryKey; score: number; matchedWords: string[] }[] = [];

  for (const [keyStr, meta] of Object.entries(GLOBAL_DOCUMENT_CATEGORIES)) {
    const key = keyStr as GlobalCategoryKey;
    if (key === "general_unclassified") continue;

    let score = 0;
    const matchedWords: string[] = [];

    // Priority keywords have 5x weight
    for (const kw of meta.priorityKeywords) {
      if (fullText.includes(kw)) {
        score += 5;
        matchedWords.push(kw);
      }
    }

    // Standard keywords have 1x weight
    for (const kw of meta.keywords) {
      if (fullText.includes(kw)) {
        score += 1;
        if (!matchedWords.includes(kw)) {
          matchedWords.push(kw);
        }
      }
    }

    if (score > 0) {
      scores.push({ key, score, matchedWords });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0 || scores[0].score < 2) {
    return {
      primaryCategory: GLOBAL_DOCUMENT_CATEGORIES.general_unclassified,
      detectedSubtype: "General Document",
      confidenceScore: 30,
      secondaryMatches: [],
      matchedKeywords: [],
    };
  }

  const best = scores[0];
  const primaryMeta = GLOBAL_DOCUMENT_CATEGORIES[best.key];

  // Calculate confidence score (normalized to 100)
  const confidence = Math.min(99, Math.max(50, 45 + best.score * 5));

  // Determine detected subtype based on highest matching keywords
  let detectedSubtype = primaryMeta.typicalSubtypes[0] || primaryMeta.name;
  for (const subtype of primaryMeta.typicalSubtypes) {
    const stLower = subtype.toLowerCase();
    for (const kw of best.matchedWords) {
      if (stLower.includes(kw) || kw.includes(stLower.split(" ")[0])) {
        detectedSubtype = subtype;
        break;
      }
    }
  }

  const secondaryMatches = scores.slice(1, 4).map((s) => ({
    categoryKey: s.key,
    confidence: Math.min(90, Math.max(20, 20 + s.score * 4)),
  }));

  return {
    primaryCategory: primaryMeta,
    detectedSubtype,
    confidenceScore: confidence,
    secondaryMatches,
    matchedKeywords: best.matchedWords.slice(0, 10),
  };
}
