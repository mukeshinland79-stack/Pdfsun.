/**
 * PDFSun Universal Financial Document Intelligence Engine
 * Phase 12 — Global Document Classification, Entity Extraction & Tax Profile Engine
 * 
 * Complies with Phase 12 Mandate:
 * - 18 Universal Document Classes (GST Invoices, Bank Statements, Balance Sheets, P&L,
 *   Purchase Orders, Credit/Debit Notes, Utility Bills, Payroll, International VAT, etc.)
 * - Indian GST Rule 46 Reference Entity Model (Supplier, Recipient, GSTIN, HSN, CGST/SGST/IGST)
 * - International Tax Profiles (UK VAT, EU VAT, US Sales Tax, Australian GST, Canadian HST)
 * - Bank Ledger Strict Debit/Credit Column Segregation
 * - 100% Client-Side Privacy: zero server uploads, purely in-memory regex & spatial classification.
 */

export type DocumentProfileKey =
  | "gst_invoice"
  | "bank_statement"
  | "balance_sheet"
  | "profit_loss"
  | "cash_flow"
  | "purchase_order"
  | "sales_order"
  | "credit_note"
  | "debit_note"
  | "quotation"
  | "delivery_challan"
  | "retail_receipt"
  | "utility_bill"
  | "medical_bill"
  | "payroll_statement"
  | "tax_compliance"
  | "vat_invoice"
  | "general_document";

export interface DocumentProfileMeta {
  key: DocumentProfileKey;
  name: string;
  category: "tax_invoice" | "banking_ledger" | "commercial" | "billing" | "general";
  description: string;
  badgeLabel: string;
  iconName: string;
}

export const DOCUMENT_PROFILES: Record<DocumentProfileKey, DocumentProfileMeta> = {
  gst_invoice: {
    key: "gst_invoice",
    name: "GST Tax Invoice (India)",
    category: "tax_invoice",
    description: "Indian CGST Rule 46 compliant B2B/B2C invoice with GSTIN, HSN/SAC, CGST/SGST/IGST tax breakdowns.",
    badgeLabel: "GST Tax Invoice",
    iconName: "Receipt",
  },
  bank_statement: {
    key: "bank_statement",
    name: "Bank Statement & Ledger",
    category: "banking_ledger",
    description: "Account transaction ledger with strict debit/credit columns, running balances, and cheque references.",
    badgeLabel: "Bank Statement",
    iconName: "Landmark",
  },
  balance_sheet: {
    key: "balance_sheet",
    name: "Balance Sheet",
    category: "banking_ledger",
    description: "Corporate financial position report with Assets, Liabilities, and Equity matrices.",
    badgeLabel: "Balance Sheet",
    iconName: "Scale",
  },
  profit_loss: {
    key: "profit_loss",
    name: "Profit & Loss Statement",
    category: "banking_ledger",
    description: "Income, operational expenditure, gross margin, EBITDA, and net profit report.",
    badgeLabel: "P&L Statement",
    iconName: "TrendingUp",
  },
  cash_flow: {
    key: "cash_flow",
    name: "Cash Flow Statement",
    category: "banking_ledger",
    description: "Operating, investing, and financing cash movement statement with net cash change.",
    badgeLabel: "Cash Flow",
    iconName: "ArrowLeftRight",
  },
  purchase_order: {
    key: "purchase_order",
    name: "Purchase Order (PO)",
    category: "commercial",
    description: "Commercial buyer procurement order with item specifications, delivery schedule, and billing terms.",
    badgeLabel: "Purchase Order",
    iconName: "FileCheck2",
  },
  sales_order: {
    key: "sales_order",
    name: "Sales Order",
    category: "commercial",
    description: "Vendor confirmed sales order referencing customer PO, quantities, and delivery milestones.",
    badgeLabel: "Sales Order",
    iconName: "ShoppingBag",
  },
  credit_note: {
    key: "credit_note",
    name: "Credit Note",
    category: "tax_invoice",
    description: "Tax credit adjustment for returned goods, price variances, or volume discounts.",
    badgeLabel: "Credit Note",
    iconName: "FileMinus2",
  },
  debit_note: {
    key: "debit_note",
    name: "Debit Note",
    category: "tax_invoice",
    description: "Supplementary debit billing for goods undercharged, extra freight, or interest.",
    badgeLabel: "Debit Note",
    iconName: "FilePlus2",
  },
  quotation: {
    key: "quotation",
    name: "Quotation / Proforma",
    category: "commercial",
    description: "Commercial estimate, proforma invoice, or cost proposal with price validity period.",
    badgeLabel: "Quotation",
    iconName: "FileSpreadsheet",
  },
  delivery_challan: {
    key: "delivery_challan",
    name: "Delivery Challan / Waybill",
    category: "commercial",
    description: "Goods transit document, lorry receipt (LR), or job work challan with transport details.",
    badgeLabel: "Delivery Challan",
    iconName: "Truck",
  },
  retail_receipt: {
    key: "retail_receipt",
    name: "Retail & POS Receipt",
    category: "billing",
    description: "Itemized store, restaurant, supermarket, or fuel bill with cash/card payment acknowledgment.",
    badgeLabel: "Retail Bill",
    iconName: "ShoppingBag",
  },
  utility_bill: {
    key: "utility_bill",
    name: "Utility & Telecom Bill",
    category: "billing",
    description: "Electricity, water, gas, broadband, or mobile statement with meter readings and tariff breakdown.",
    badgeLabel: "Utility Bill",
    iconName: "Zap",
  },
  medical_bill: {
    key: "medical_bill",
    name: "Medical & Pharmacy Bill",
    category: "billing",
    description: "Hospital discharge bill, pharmacy receipt, consultation invoice, or insurance claim document.",
    badgeLabel: "Medical Bill",
    iconName: "Activity",
  },
  payroll_statement: {
    key: "payroll_statement",
    name: "Salary Slip / Payroll",
    category: "billing",
    description: "Employee monthly compensation advice with basic salary, HRA, PF, TDS deductions, and net pay.",
    badgeLabel: "Salary Slip",
    iconName: "CreditCard",
  },
  tax_compliance: {
    key: "tax_compliance",
    name: "Tax Compliance / Certificate",
    category: "tax_invoice",
    description: "Income tax computation, TDS Form 16/16A, Advance Tax receipt, or statutory audit certificate.",
    badgeLabel: "Tax Certificate",
    iconName: "ShieldCheck",
  },
  vat_invoice: {
    key: "vat_invoice",
    name: "International VAT / Sales Tax",
    category: "tax_invoice",
    description: "UK VAT, EU VAT, US State Sales Tax, or Australian GST commercial invoice with cross-border tax rates.",
    badgeLabel: "VAT Invoice",
    iconName: "Globe2",
  },
  general_document: {
    key: "general_document",
    name: "Standard Document",
    category: "general",
    description: "General textual document, business report, legal contract, thesis, or academic presentation.",
    badgeLabel: "Document",
    iconName: "FileText",
  },
};

export interface ExtractedFinancialEntities {
  supplierName?: string;
  supplierGstin?: string;
  recipientName?: string;
  recipientGstin?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  irn?: string;
  hsnSacCodes: string[];
  pan?: string;
  totalTaxableValue?: string;
  cgstAmount?: string;
  sgstAmount?: string;
  igstAmount?: string;
  grandTotal?: string;
  currencySymbol: string;
  taxRatesDetected: string[];
  debitTotal?: string;
  creditTotal?: string;
  openingBalance?: string;
  closingBalance?: string;
  reverseCharge?: boolean;
  ifscCode?: string;
  stateCode?: string;
  accountNumberMasked?: string;
}

export interface DocumentClassificationResult {
  profile: DocumentProfileKey;
  profileMeta: DocumentProfileMeta;
  name: string;
  category: string;
  description: string;
  confidence: number; // 0 - 100
  region: "IN" | "UK" | "EU" | "US" | "GLOBAL";
  detectedEntities: ExtractedFinancialEntities;
  entities: ExtractedFinancialEntities & {
    gstinSupplier?: string;
    gstinRecipient?: string;
    hsnCodes?: string[];
    taxSummary?: { total?: string };
  };
  isFinancialDocument: boolean;
  tableClassRecommendation: "financial_ledger" | "invoice_items" | "tax_breakdown" | "standard";
}

export type FinancialDocumentClassification = DocumentClassificationResult;

// ---------------------------------------------------------------------------
// REGEX PATTERNS & IDENTIFIERS
// ---------------------------------------------------------------------------

export const GSTIN_REGEX = /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/g;
export const PAN_REGEX = /\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/g;
export const HSN_SAC_REGEX = /\b(HSN|SAC)[\s/:]*([0-9]{4,8})\b/gi;
export const HSN_CODE_STANDALONE = /\b(99[0-9]{4}|84[0-9]{4}|85[0-9]{4}|73[0-9]{4}|39[0-9]{4}|30[0-9]{4})\b/g;
export const INVOICE_NUM_REGEX = /\b(?:Invoice|Inv|Bill|Memo|Receipt)[\s]*(?:(?:No\.?|Num(?:ber)?|#)\.?[\s:=-]*|[:=-]+[\s]*)([A-Z0-9/_-]{3,25})\b/i;
export const PO_NUM_REGEX = /\b(P\.?O\.?|Purchase\s*Order)[\s#.:-]*([A-Z0-9/_-]{3,25})\b/i;
export const UK_VAT_REGEX = /\b(GB)?\s*([0-9]{3}\s*[0-9]{4}\s*[0-9]{2})\b/i;
export const EU_VAT_REGEX = /\b([A-Z]{2})[0-9A-Z]{8,12}\b/g;
export const US_SALES_TAX_REGEX = /\b(State\s*Tax|County\s*Tax|Sales\s*Tax|City\s*Tax)[\s:$]*([0-9,.]+)/i;
export const CURRENCY_DETECTOR = /(₹|Rs\.?|INR|\$|USD|€|EUR|£|GBP|A\$|AUD|C\$|CAD|¥|JPY)/i;
export const IFSC_REGEX = /\b([A-Z]{4}0[A-Z0-9]{6})\b/g;
export const BANK_ACCOUNT_MASKED_REGEX = /\b(?:A\/c|Account|Acc)[\s.:#-]*([0-9X\*\s-]{8,22})\b/i;

export const STATE_CODE_MAP: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "19": "West Bengal",
  "24": "Gujarat",
  "27": "Maharashtra",
  "29": "Karnataka",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "36": "Telangana",
  "37": "Andhra Pradesh",
};

/**
 * Fast client-side document classifier that inspects plain text & spatial patterns
 * to identify the optimal conversion profile and extract key financial metadata.
 */
export function detectDocumentProfile(
  text: string,
  fileName: string = ""
): DocumentClassificationResult {
  const fullText = text || "";
  const lower = fullText.toLowerCase();
  const lowerName = fileName.toLowerCase();

  const entities: ExtractedFinancialEntities = {
    hsnSacCodes: [],
    taxRatesDetected: [],
    currencySymbol: "₹",
  };

  // Currency detection
  const curMatch = fullText.match(CURRENCY_DETECTOR);
  if (curMatch) {
    const raw = curMatch[0];
    if (raw.includes("£") || /GBP/i.test(raw)) entities.currencySymbol = "£";
    else if (raw.includes("€") || /EUR/i.test(raw)) entities.currencySymbol = "€";
    else if (raw.includes("$") || /USD|AUD|CAD/i.test(raw)) entities.currencySymbol = "$";
    else if (raw.includes("¥") || /JPY/i.test(raw)) entities.currencySymbol = "¥";
    else entities.currencySymbol = "₹";
  }

  // GSTIN extraction
  const gstinMatches = Array.from(fullText.matchAll(GSTIN_REGEX)).map((m) => m[1]);
  if (gstinMatches.length > 0) {
    entities.supplierGstin = gstinMatches[0];
    if (gstinMatches.length > 1) {
      entities.recipientGstin = gstinMatches[1];
    }
  }

  // PAN extraction
  const panMatches = Array.from(fullText.matchAll(PAN_REGEX)).map((m) => m[1]);
  if (panMatches.length > 0) {
    entities.pan = panMatches[0];
  }

  // HSN/SAC extraction
  const hsnMatches = Array.from(fullText.matchAll(HSN_SAC_REGEX)).map((m) => m[2]);
  if (hsnMatches.length > 0) {
    entities.hsnSacCodes = Array.from(new Set(hsnMatches));
  } else {
    const standaloneHsn = Array.from(fullText.matchAll(HSN_CODE_STANDALONE)).map((m) => m[1]);
    if (standaloneHsn.length > 0) {
      entities.hsnSacCodes = Array.from(new Set(standaloneHsn)).slice(0, 8);
    }
  }

  // Invoice Number
  const invMatch = fullText.match(INVOICE_NUM_REGEX);
  if (invMatch && invMatch[1]) {
    entities.invoiceNumber = invMatch[1].trim();
  }

  // Tax rates
  const taxRateMatches = Array.from(fullText.matchAll(/\b(0|5|12|18|28)\s*%\b/g)).map((m) => `${m[1]}%`);
  if (taxRateMatches.length > 0) {
    entities.taxRatesDetected = Array.from(new Set(taxRateMatches));
  }

  // Check Reverse Charge
  if (/reverse\s*charge\s*[:=-]*\s*(yes|y|true)/i.test(lower)) {
    entities.reverseCharge = true;
  }

  // IRN Detection
  const irnMatch = fullText.match(/\b([a-f0-9]{64})\b/i);
  if (irnMatch && /irn|e-?invoice/i.test(lower)) {
    entities.irn = irnMatch[1];
  }

  // Grand Total & Taxable Value heuristic
  const totalMatch = fullText.match(/(?:grand\s*total|invoice\s*total|net\s*amount|total\s*payable|balance\s*due)[\s:₹$€£]*([0-9,]+\.[0-9]{2})/i);
  if (totalMatch) {
    entities.grandTotal = totalMatch[1];
  }

  const taxableMatch = fullText.match(/(?:taxable\s*value|taxable\s*amount|sub\s*total)[\s:₹$€£]*([0-9,]+\.[0-9]{2})/i);
  if (taxableMatch) {
    entities.totalTaxableValue = taxableMatch[1];
  }

  // IFSC Code Extraction (Indian Banking)
  const ifscMatches = Array.from(fullText.matchAll(IFSC_REGEX)).map((m) => m[1]);
  if (ifscMatches.length > 0) {
    entities.ifscCode = ifscMatches[0];
  }

  // State Code Extraction (from GSTIN prefix 2 digits)
  if (entities.supplierGstin && entities.supplierGstin.length >= 2) {
    const code = entities.supplierGstin.slice(0, 2);
    entities.stateCode = STATE_CODE_MAP[code] ? `${STATE_CODE_MAP[code]} (${code})` : code;
  }

  // Masked Bank Account Number
  const accMatch = fullText.match(BANK_ACCOUNT_MASKED_REGEX);
  if (accMatch && accMatch[1]) {
    entities.accountNumberMasked = accMatch[1].trim();
  }

  // Scoring matrix for document classification
  let gstScore = 0;
  let bankScore = 0;
  let balanceSheetScore = 0;
  let plScore = 0;
  let poScore = 0;
  let creditNoteScore = 0;
  let debitNoteScore = 0;
  let utilityScore = 0;
  let payrollScore = 0;
  let vatScore = 0;
  let medicalScore = 0;

  // Indian GST Invoice scoring
  if (entities.supplierGstin) gstScore += 45;
  if (entities.hsnSacCodes.length > 0) gstScore += 25;
  if (/tax\s*invoice|gstin|cgst|sgst|igst|e-?way\s*bill/i.test(lower)) gstScore += 30;
  if (/credit\s*note/i.test(lower)) creditNoteScore += 60;
  if (/debit\s*note/i.test(lower)) debitNoteScore += 60;

  // Bank Statement scoring
  if (/bank\s*statement|account\s*statement|transaction\s*history|cheque\s*no|running\s*balance/i.test(lower)) bankScore += 45;
  if (/withdrawal|deposit|debit|credit/i.test(lower) && /balance/i.test(lower)) bankScore += 35;
  if (/ifsc|micr|account\s*number|a\/c\s*no/i.test(lower)) bankScore += 20;

  // Balance Sheet scoring
  if (/balance\s*sheet|statement\s*of\s*financial\s*position/i.test(lower)) balanceSheetScore += 65;
  if (/assets|liabilities|equity|share\s*capital|reserves/i.test(lower)) balanceSheetScore += 30;

  // Profit and Loss scoring
  if (/profit\s*(?:and|&)\s*loss|statement\s*of\s*operations|income\s*statement/i.test(lower)) plScore += 65;
  if (/ebitda|gross\s*profit|operating\s*expenses|revenue\s*from\s*operations/i.test(lower)) plScore += 30;

  // Purchase Order scoring
  if (/purchase\s*order|p\.?o\.?\s*number|vendor\s*order/i.test(lower) || lowerName.includes("po_") || lowerName.includes("purchase_order")) poScore += 60;

  // Utility Bill
  if (/electricity\s*bill|water\s*bill|gas\s*bill|tariff|consumer\s*no|meter\s*reading|kwh/i.test(lower)) utilityScore += 60;

  // Payroll
  if (/salary\s*slip|payslip|earnings|deductions|provident\s*fund|basic\s*pay|hra/i.test(lower)) payrollScore += 60;

  // Medical
  if (/hospital|patient|pharmacy|prescription|consultation\s*fee|diagnosis|doctor/i.test(lower)) medicalScore += 50;

  // International VAT
  if (/vat\s*reg|value\s*added\s*tax|sales\s*tax|vat\s*invoice/i.test(lower) && !entities.supplierGstin) vatScore += 55;

  // Determine winning profile
  let chosenProfile: DocumentProfileKey = "general_document";
  let maxScore = 20;
  let region: "IN" | "UK" | "EU" | "US" | "GLOBAL" = "GLOBAL";

  if (creditNoteScore > maxScore) {
    chosenProfile = "credit_note";
    maxScore = creditNoteScore;
    region = entities.supplierGstin ? "IN" : "GLOBAL";
  } else if (debitNoteScore > maxScore) {
    chosenProfile = "debit_note";
    maxScore = debitNoteScore;
    region = entities.supplierGstin ? "IN" : "GLOBAL";
  } else if (gstScore > maxScore) {
    chosenProfile = "gst_invoice";
    maxScore = gstScore;
    region = "IN";
  } else if (bankScore > maxScore) {
    chosenProfile = "bank_statement";
    maxScore = bankScore;
  } else if (balanceSheetScore > maxScore) {
    chosenProfile = "balance_sheet";
    maxScore = balanceSheetScore;
  } else if (plScore > maxScore) {
    chosenProfile = "profit_loss";
    maxScore = plScore;
  } else if (poScore > maxScore) {
    chosenProfile = "purchase_order";
    maxScore = poScore;
  } else if (payrollScore > maxScore) {
    chosenProfile = "payroll_statement";
    maxScore = payrollScore;
  } else if (utilityScore > maxScore) {
    chosenProfile = "utility_bill";
    maxScore = utilityScore;
  } else if (medicalScore > maxScore) {
    chosenProfile = "medical_bill";
    maxScore = medicalScore;
  } else if (vatScore > maxScore) {
    chosenProfile = "vat_invoice";
    maxScore = vatScore;
    region = entities.currencySymbol === "£" ? "UK" : entities.currencySymbol === "€" ? "EU" : entities.currencySymbol === "$" ? "US" : "GLOBAL";
  }

  const isFinancial = chosenProfile !== "general_document";

  let tableClassRecommendation: "financial_ledger" | "invoice_items" | "tax_breakdown" | "standard" = "standard";
  if (chosenProfile === "bank_statement") tableClassRecommendation = "financial_ledger";
  else if (["gst_invoice", "credit_note", "debit_note", "vat_invoice", "purchase_order"].includes(chosenProfile)) {
    tableClassRecommendation = "invoice_items";
  }

  const meta = DOCUMENT_PROFILES[chosenProfile] || DOCUMENT_PROFILES.general_document;
  const aliasedEntities = {
    ...entities,
    gstinSupplier: entities.supplierGstin,
    gstinRecipient: entities.recipientGstin,
    hsnCodes: entities.hsnSacCodes,
    taxSummary: { total: entities.grandTotal },
  };

  return {
    profile: chosenProfile,
    profileMeta: meta,
    name: meta.name,
    category: meta.category,
    description: meta.description,
    confidence: Math.min(99, Math.max(35, maxScore)),
    region,
    detectedEntities: entities,
    entities: aliasedEntities,
    isFinancialDocument: isFinancial,
    tableClassRecommendation,
  };
}

/**
 * Inspects a table's header tokens or 2D matrix to deduce whether it represents an invoice line-item matrix,
 * bank ledger with debit/credit, or tax rate breakdown.
 */
export function classifyTableSemantics(headersOrGrid: string[] | string[][]): {
  type: "financial_ledger" | "invoice_items" | "tax_breakdown" | "generic";
  hasDebitCredit: boolean;
  debitColIdx?: number;
  creditColIdx?: number;
  balanceColIdx?: number;
  amountColIdx?: number;
  hsnColIdx?: number;
  isFinancialTable: boolean;
  debitColumnIdx?: number;
  creditColumnIdx?: number;
  balanceColumnIdx?: number;
} {
  const headerRow: any[] =
    Array.isArray(headersOrGrid) && Array.isArray(headersOrGrid[0])
      ? headersOrGrid[0]
      : Array.isArray(headersOrGrid)
      ? headersOrGrid
      : [];

  const normHeaders = headerRow.map((h) => String(h ?? "").toLowerCase().trim());
  let debitColIdx: number | undefined;
  let creditColIdx: number | undefined;
  let balanceColIdx: number | undefined;
  let amountColIdx: number | undefined;
  let hsnColIdx: number | undefined;

  normHeaders.forEach((h, idx) => {
    if (/debit|withdrawal|dr\b/i.test(h)) debitColIdx = idx;
    if (/credit|deposit|cr\b/i.test(h)) creditColIdx = idx;
    if (/balance|closing/i.test(h)) balanceColIdx = idx;
    if (/amount|total|taxable|val/i.test(h) && amountColIdx === undefined) amountColIdx = idx;
    if (/hsn|sac/i.test(h)) hsnColIdx = idx;
  });

  const hasDebitCredit = debitColIdx !== undefined && creditColIdx !== undefined;

  if (hasDebitCredit) {
    return {
      type: "financial_ledger",
      hasDebitCredit: true,
      isFinancialTable: true,
      debitColIdx,
      debitColumnIdx: debitColIdx,
      creditColIdx,
      creditColumnIdx: creditColIdx,
      balanceColIdx,
      balanceColumnIdx: balanceColIdx,
    };
  }

  if (hsnColIdx !== undefined || normHeaders.some((h) => /rate|cgst|sgst|igst|tax\s*%/i.test(h))) {
    return {
      type: "tax_breakdown",
      hasDebitCredit: false,
      isFinancialTable: true,
      hsnColIdx,
      amountColIdx,
    };
  }

  if (normHeaders.some((h) => /qty|quantity|rate|unit\s*price|item|desc/i.test(h))) {
    return {
      type: "invoice_items",
      hasDebitCredit: false,
      isFinancialTable: true,
      amountColIdx,
      hsnColIdx,
    };
  }

  return {
    type: "generic",
    hasDebitCredit: false,
    isFinancialTable: false,
    amountColIdx,
  };
}
