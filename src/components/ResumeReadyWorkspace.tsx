import React, { useState, useEffect } from "react";
import {
  Sparkles,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  Globe2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Printer,
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  Sliders,
  ShieldCheck,
  Target,
  FileUp,
  FileCode,
  Edit3,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  ResumeData,
  ResumeStyle,
  AtsAuditResult,
  JobMatchResult,
  ResumeExperience,
  ResumeEducation,
  ResumeProject,
  ResumeCertification,
  ResumeLanguage,
} from "../types";
import { exportResumeToDocx, exportResumeToPdf, printResumeElement } from "../lib/resumeExporter";
import { extractTextFromPdfFile } from "../lib/pdfEngine";

const DEFAULT_RESUME_DATA: ResumeData = {
  personal: {
    fullName: "Alex Rivera",
    title: "Senior Full Stack Software Engineer",
    email: "alex.rivera@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA (Open to Remote)",
    linkedin: "linkedin.com/in/alex-rivera-dev",
    portfolio: "alexrivera.dev",
    github: "github.com/alexrivera",
  },
  summary:
    "Results-driven Software Engineer with 6+ years of experience designing and scaling distributed cloud applications, modern web interfaces, and high-throughput microservices. Proven record in architecting real-time document workflows, driving 35% latency reductions, and mentoring agile engineering squads.",
  experience: [
    {
      id: "exp-1",
      role: "Lead Full Stack Engineer",
      company: "CloudScale Systems",
      location: "San Francisco, CA",
      startDate: "Mar 2022",
      endDate: "Present",
      isCurrent: true,
      highlights: [
        "Spearheaded redesign of real-time PDF processing engine, scaling system throughput by 42% for over 2M active monthly users.",
        "Engineered zero-downtime microservices using TypeScript, Node.js, and Google Cloud Run with automated CI/CD pipelines.",
        "Mentored team of 6 engineers, introduced automated test suites achieving 94% test coverage and reducing production defects by 30%.",
      ],
    },
    {
      id: "exp-2",
      role: "Software Engineer",
      company: "Apex Digital Solutions",
      location: "Austin, TX",
      startDate: "Jul 2019",
      endDate: "Feb 2022",
      isCurrent: false,
      highlights: [
        "Built responsive client-side SPA dashboards with React, Tailwind CSS, and WebSockets, cutting page load latency by 1.8s.",
        "Integrated secure payment gateways and OAuth SSO authentication for enterprise customers, growing ARR by $450K.",
        "Collaborated closely with product managers and UX designers to deliver 15+ high-priority SaaS features on schedule.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.S. in Computer Science",
      field: "Software Engineering & Distributed Systems",
      school: "University of Texas at Austin",
      location: "Austin, TX",
      startYear: "2015",
      endYear: "2019",
      gpa: "3.85 / 4.0",
      honors: "Dean's Honor List",
    },
  ],
  skills: {
    technical: [
      "TypeScript",
      "JavaScript",
      "React",
      "Node.js",
      "Express",
      "Python",
      "GraphQL",
      "PostgreSQL",
      "REST APIs",
      "Microservices",
    ],
    tools: ["Docker", "Kubernetes", "Google Cloud Platform (GCP)", "Git", "Vite", "Tailwind CSS", "Redis"],
    soft: ["Engineering Leadership", "System Architecture", "Agile/Scrum", "Code Reviews", "Cross-functional Collaboration"],
  },
  projects: [
    {
      id: "proj-1",
      name: "High-Performance Document Pipeline",
      link: "github.com/alexrivera/pdf-pipeline",
      description: "An open-source distributed document transformation pipeline processing multi-megabyte PDFs in sub-second intervals.",
      technologies: ["Node.js", "WebAssembly", "TypeScript", "Docker"],
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Google Cloud Certified Professional Cloud Architect",
      issuer: "Google Cloud",
      date: "2023",
    },
    {
      id: "cert-2",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      date: "2021",
    },
  ],
  languages: [
    { language: "English", proficiency: "Native" },
    { language: "Spanish", proficiency: "Professional" },
  ],
  achievements: [
    "Published top-rated engineering blog on zero-downtime microservices with 50K+ reads.",
    "Winner of 2023 Internal Enterprise Innovation Hackathon.",
  ],
};

interface ResumeReadyWorkspaceProps {
  initialDocumentText?: string;
  initialFile?: File | null;
  onAddHistory?: (item: any) => void;
}

export type WorkflowStep = "extraction" | "templates" | "editing" | "ats-check" | "export";

export const ResumeReadyWorkspace: React.FC<ResumeReadyWorkspaceProps> = ({
  initialDocumentText = "",
  initialFile = null,
  onAddHistory,
}) => {
  const [resumeData, setResumeData] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [selectedStyle, setSelectedStyle] = useState<ResumeStyle>("ats");
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(() => {
    return initialDocumentText ? "editing" : "extraction";
  });

  // Multi-Input / Extraction State
  const [rawBioText, setRawBioText] = useState<string>(initialDocumentText || "");
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsingStatus, setParsingStatus] = useState<string>("");
  const [showInputModal, setShowInputModal] = useState<boolean>(false);

  // AI Refinement State
  const [isAiRefining, setIsAiRefining] = useState<boolean>(false);
  const [aiActionMessage, setAiActionMessage] = useState<string>("");

  // ATS Audit State
  const [atsAudit, setAtsAudit] = useState<AtsAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Job Description Match State
  const [jobDescriptionInput, setJobDescriptionInput] = useState<string>("");
  const [jobMatchResult, setJobMatchResult] = useState<JobMatchResult | null>(null);
  const [isMatchingJob, setIsMatchingJob] = useState<boolean>(false);

  // Live Preview Zoom & State
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Active accordion section in editor
  const [openEditorSection, setOpenEditorSection] = useState<string>("personal");

  // Run initial auto-parse if incoming text is substantial
  useEffect(() => {
    if (initialDocumentText && initialDocumentText.length > 80 && resumeData === DEFAULT_RESUME_DATA) {
      handleParseResume(initialDocumentText);
    }
  }, [initialDocumentText]);

  // Extract from File Handler
  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParsingStatus(`Reading ${file.name}...`);
    try {
      let extracted = "";
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        extracted = await extractTextFromPdfFile(file);
      } else {
        extracted = await file.text();
      }
      setRawBioText(extracted);
      await handleParseResume(extracted);
    } catch (err: any) {
      console.error("Resume file extraction failed:", err);
      setParsingStatus("Error reading document. You can paste your details manually.");
    } finally {
      setIsParsing(false);
    }
  };

  // AI Resume Parse Function
  const handleParseResume = async (textToParse: string) => {
    if (!textToParse || !textToParse.trim()) return;
    setIsParsing(true);
    setParsingStatus("PDFSun AI is analyzing, extracting & organizing resume sections...");
    try {
      const res = await fetch("/api/ai/resume-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: textToParse }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResumeData(data.data);
        setParsingStatus("Resume organized successfully!");
        setShowInputModal(false);
        // Automatically run ATS audit in background
        runAtsAudit(data.data);
      } else {
        setParsingStatus("Could not parse all details. Please edit sections manually.");
      }
    } catch (err) {
      console.error("AI Resume Parse Error:", err);
      setParsingStatus("AI extraction failed. Continuing in manual edit mode.");
    } finally {
      setIsParsing(false);
    }
  };

  // AI Targeted Improvement Action
  const handleAiImprove = async (action: string, field?: string, targetText?: string) => {
    setIsAiRefining(true);
    setAiActionMessage(`Applying AI ${action.toUpperCase()} enhancement...`);
    try {
      const res = await fetch("/api/ai/resume-improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          action,
          field,
          targetText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (field && data.improvedText) {
          if (field === "summary") {
            setResumeData((prev) => ({ ...prev, summary: data.improvedText }));
          }
        } else if (data.data) {
          setResumeData(data.data);
        }
        setAiActionMessage("Enhancement applied seamlessly!");
        setTimeout(() => setAiActionMessage(""), 3000);
      }
    } catch (err) {
      console.error("AI Improve Error:", err);
      setAiActionMessage("Could not connect to AI service.");
    } finally {
      setIsAiRefining(false);
    }
  };

  // Run ATS Compatibility Audit
  const runAtsAudit = async (dataToAudit = resumeData) => {
    setIsAuditing(true);
    try {
      const res = await fetch("/api/ai/resume-ats-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: dataToAudit }),
      });
      const data = await res.json();
      if (data.success && data.audit) {
        setAtsAudit(data.audit);
      }
    } catch (err) {
      console.error("ATS Audit error:", err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Match Against Job Description (JD)
  const handleJobMatch = async () => {
    if (!jobDescriptionInput.trim()) return;
    setIsMatchingJob(true);
    try {
      const res = await fetch("/api/ai/resume-job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          jobDescription: jobDescriptionInput,
        }),
      });
      const data = await res.json();
      if (data.success && data.match) {
        setJobMatchResult(data.match);
      }
    } catch (err) {
      console.error("Job Match error:", err);
    } finally {
      setIsMatchingJob(false);
    }
  };

  // Export handlers
  const handleDownloadPdf = () => {
    exportResumeToPdf(resumeData, selectedStyle, `${resumeData.personal.fullName.replace(/\s+/g, "_")}_Resume.pdf`);
    if (onAddHistory) {
      onAddHistory({
        id: Date.now().toString(),
        toolId: "ai-resume-builder",
        toolName: "AI Resume Ready",
        fileName: `${resumeData.personal.fullName || "Resume"}.pdf`,
        timestamp: Date.now(),
        status: "completed",
        outputFileName: `${resumeData.personal.fullName.replace(/\s+/g, "_")}_Resume.pdf`,
      });
    }
  };

  const handleDownloadDocx = () => {
    exportResumeToDocx(resumeData, `${resumeData.personal.fullName.replace(/\s+/g, "_")}_Resume.docx`);
  };

  const handlePrint = () => {
    printResumeElement("resume-live-preview-document");
  };

  const handleCopyText = () => {
    const fullText = [
      resumeData.personal.fullName,
      resumeData.personal.title,
      [resumeData.personal.email, resumeData.personal.phone, resumeData.personal.location].filter(Boolean).join(" | "),
      "",
      "PROFESSIONAL SUMMARY",
      resumeData.summary,
      "",
      "EXPERIENCE",
      ...resumeData.experience.map(
        (e) => `${e.role} | ${e.company} (${e.startDate} - ${e.isCurrent ? "Present" : e.endDate})\n${e.highlights.map((h) => `• ${h}`).join("\n")}`
      ),
      "",
      "EDUCATION",
      ...resumeData.education.map((ed) => `${ed.degree} in ${ed.field} | ${ed.school} (${ed.endYear})`),
      "",
      "SKILLS",
      `Technical: ${resumeData.skills.technical.join(", ")}`,
      `Tools: ${resumeData.skills.tools.join(", ")}`,
      `Soft Skills: ${resumeData.skills.soft.join(", ")}`,
    ].join("\n");

    navigator.clipboard.writeText(fullText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. Feature Banner & Quick Action Header */}
      <div className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-sm flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Resume Ready
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>ATS Compatible</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              Turn your information into a professional, job-ready resume.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowInputModal(true)}
            className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-bold transition flex items-center space-x-1.5"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Upload / Import Bio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentStep("ats-check");
              runAtsAudit();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>ATS Audit {atsAudit ? `(${atsAudit.score}/100)` : ""}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDocx}
            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-xs font-bold transition flex items-center space-x-1.5"
            title="Download formatted Microsoft Word .docx document"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Word (.docx)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition"
            title="Print Resume"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Sequential 5-Step Workflow Progress Bar */}
      <div className="px-4 sm:px-6 py-2 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          {/* Step 1: Extraction */}
          <button
            type="button"
            onClick={() => setCurrentStep("extraction")}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              currentStep === "extraction"
                ? "bg-orange-500 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80"
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
              currentStep === "extraction" ? "bg-white text-orange-600" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}>1</span>
            <FileUp className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">1. Extraction</span>
            <span className="md:hidden">Extract</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">→</span>

          {/* Step 2: Template Selection */}
          <button
            type="button"
            onClick={() => setCurrentStep("templates")}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              currentStep === "templates"
                ? "bg-orange-500 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80"
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
              currentStep === "templates" ? "bg-white text-orange-600" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}>2</span>
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">2. Template Selection</span>
            <span className="md:hidden">Templates</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">→</span>

          {/* Step 3: Live Editing */}
          <button
            type="button"
            onClick={() => setCurrentStep("editing")}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              currentStep === "editing"
                ? "bg-orange-500 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80"
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
              currentStep === "editing" ? "bg-white text-orange-600" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}>3</span>
            <Edit3 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">3. Live Editing</span>
            <span className="md:hidden">Edit</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">→</span>

          {/* Step 4: ATS Check */}
          <button
            type="button"
            onClick={() => {
              setCurrentStep("ats-check");
              if (!atsAudit) runAtsAudit();
            }}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              currentStep === "ats-check"
                ? "bg-orange-500 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80"
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
              currentStep === "ats-check" ? "bg-white text-orange-600" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}>4</span>
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">4. ATS Check {atsAudit ? `(${atsAudit.score}/100)` : ""}</span>
            <span className="md:hidden">ATS</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">→</span>

          {/* Step 5: Export */}
          <button
            type="button"
            onClick={() => setCurrentStep("export")}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              currentStep === "export"
                ? "bg-orange-500 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80"
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
              currentStep === "export" ? "bg-white text-orange-600" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}>5</span>
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">5. Export</span>
            <span className="md:hidden">Export</span>
          </button>
        </div>

        {/* Live Status & Style Pill */}
        <div className="flex items-center space-x-2 shrink-0">
          {aiActionMessage && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold animate-pulse flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>{aiActionMessage}</span>
            </span>
          )}
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            Style: <span className="text-orange-600 dark:text-orange-400">{selectedStyle.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* 3. Main Workspace Grid: Split Editor (Left) & Real-Time Preview (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN: Controls / Editor / AI Tools / ATS Audit */}
        <div className="lg:col-span-5 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-y-auto p-4 space-y-4">
          
          {/* STEP 1: EXTRACTION & BIO IMPORT */}
          {currentStep === "extraction" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
                  <FileUp className="w-4 h-4 text-orange-500" />
                  <span>Step 1: Document Extraction & Bio Import</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Upload an existing resume (PDF, DOCX, TXT) or paste raw bio/LinkedIn text. PDFSun AI will extract and structure every section accurately without hallucination.
                </p>
              </div>

              {/* Drag and drop upload box */}
              <div className="p-6 rounded-2xl border-2 border-dashed border-orange-500/40 hover:border-orange-500 bg-orange-500/5 transition text-center relative cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileUp className="w-8 h-8 text-orange-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Drop existing resume PDF / DOCX file here
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  or click to browse from device
                </div>
              </div>

              {/* Paste Raw Bio Text */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Or Paste Raw Background / Bio / LinkedIn Text:
                </label>
                <textarea
                  rows={5}
                  value={rawBioText}
                  onChange={(e) => setRawBioText(e.target.value)}
                  placeholder="e.g. Alex Rivera, Senior Full Stack Software Engineer with 6+ years experience in TypeScript, React, Node.js, Cloud Architecture..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed"
                />
              </div>

              {parsingStatus && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center space-x-2">
                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isParsing ? "animate-spin" : ""}`} />
                  <span>{parsingStatus}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResumeData(DEFAULT_RESUME_DATA);
                    setCurrentStep("templates");
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Use Sample Profile
                </button>

                <button
                  type="button"
                  disabled={isParsing || !rawBioText.trim()}
                  onClick={async () => {
                    await handleParseResume(rawBioText);
                    setCurrentStep("templates");
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <span>{isParsing ? "Extracting..." : "Extract & Continue →"}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LIVE EDITING */}
          {currentStep === "editing" && (
            <div className="space-y-3">
              {/* Accordion: Personal Info */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => setOpenEditorSection(openEditorSection === "personal" ? "" : "personal")}
                  className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                >
                  <div className="flex items-center space-x-2">
                    <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                    <span>Personal & Contact Info</span>
                  </div>
                  {openEditorSection === "personal" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openEditorSection === "personal" && (
                  <div className="p-4 pt-1 space-y-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={resumeData.personal.fullName}
                        onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, fullName: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Target Professional Title</label>
                      <input
                        type="text"
                        value={resumeData.personal.title}
                        onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, title: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Email</label>
                        <input
                          type="email"
                          value={resumeData.personal.email}
                          onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, email: e.target.value } })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Phone</label>
                        <input
                          type="text"
                          value={resumeData.personal.phone}
                          onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, phone: e.target.value } })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Location</label>
                      <input
                        type="text"
                        value={resumeData.personal.location}
                        onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, location: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">LinkedIn URL</label>
                        <input
                          type="text"
                          value={resumeData.personal.linkedin || ""}
                          onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, linkedin: e.target.value } })}
                          placeholder="linkedin.com/in/username"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Portfolio / Website</label>
                        <input
                          type="text"
                          value={resumeData.personal.portfolio || ""}
                          onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, portfolio: e.target.value } })}
                          placeholder="yourname.dev"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion: Professional Summary */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => setOpenEditorSection(openEditorSection === "summary" ? "" : "summary")}
                  className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>Professional Summary</span>
                  </div>
                  {openEditorSection === "summary" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openEditorSection === "summary" && (
                  <div className="p-4 pt-1 space-y-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">3-4 impactful sentences summarizing your key achievements.</span>
                      <button
                        type="button"
                        onClick={() => handleAiImprove("summary", "summary", resumeData.summary)}
                        className="px-2 py-0.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold transition flex items-center space-x-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Rewrite</span>
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={resumeData.summary}
                      onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-normal leading-relaxed focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Accordion: Work Experience */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => setOpenEditorSection(openEditorSection === "experience" ? "" : "experience")}
                  className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                >
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Work Experience ({resumeData.experience.length})</span>
                  </div>
                  {openEditorSection === "experience" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openEditorSection === "experience" && (
                  <div className="p-4 pt-1 space-y-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                    {resumeData.experience.map((exp, idx) => (
                      <div key={exp.id || idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">Role #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = resumeData.experience.filter((_, i) => i !== idx);
                              setResumeData({ ...resumeData, experience: updated });
                            }}
                            className="text-rose-500 hover:text-rose-600 p-1"
                            title="Remove role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Job Title</label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) => {
                                const copy = [...resumeData.experience];
                                copy[idx].role = e.target.value;
                                setResumeData({ ...resumeData, experience: copy });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Company</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => {
                                const copy = [...resumeData.experience];
                                copy[idx].company = e.target.value;
                                setResumeData({ ...resumeData, experience: copy });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Start Date</label>
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => {
                                const copy = [...resumeData.experience];
                                copy[idx].startDate = e.target.value;
                                setResumeData({ ...resumeData, experience: copy });
                              }}
                              placeholder="e.g. Jan 2022"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">End Date</label>
                            <input
                              type="text"
                              value={exp.isCurrent ? "Present" : exp.endDate}
                              onChange={(e) => {
                                const copy = [...resumeData.experience];
                                copy[idx].endDate = e.target.value;
                                copy[idx].isCurrent = e.target.value.toLowerCase().includes("present");
                                setResumeData({ ...resumeData, experience: copy });
                              }}
                              placeholder="e.g. Present"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                            />
                          </div>
                        </div>

                        {/* Bullet Highlights */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">Impact & Achievement Bullets</label>
                          {exp.highlights.map((hl, hIdx) => (
                            <div key={hIdx} className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                value={hl}
                                onChange={(e) => {
                                  const copy = [...resumeData.experience];
                                  copy[idx].highlights[hIdx] = e.target.value;
                                  setResumeData({ ...resumeData, experience: copy });
                                }}
                                className="flex-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = [...resumeData.experience];
                                  copy[idx].highlights = copy[idx].highlights.filter((_, i) => i !== hIdx);
                                  setResumeData({ ...resumeData, experience: copy });
                                }}
                                className="text-slate-400 hover:text-rose-500 p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...resumeData.experience];
                              copy[idx].highlights.push("");
                              setResumeData({ ...resumeData, experience: copy });
                            }}
                            className="text-[11px] font-bold text-orange-600 dark:text-orange-400 flex items-center space-x-1 hover:underline pt-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Highlight Bullet</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newExp: ResumeExperience = {
                          id: `exp-${Date.now()}`,
                          role: "Software Role",
                          company: "Company Name",
                          startDate: "2023",
                          endDate: "Present",
                          isCurrent: true,
                          highlights: ["Key project accomplishment with quantifiable metric."],
                        };
                        setResumeData({ ...resumeData, experience: [...resumeData.experience, newExp] });
                      }}
                      className="w-full py-2 rounded-xl border border-dashed border-orange-500/40 text-orange-600 dark:text-orange-400 font-bold text-xs hover:bg-orange-500/5 transition flex items-center justify-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Work Experience</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Accordion: Education */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => setOpenEditorSection(openEditorSection === "education" ? "" : "education")}
                  className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                >
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                    <span>Education ({resumeData.education.length})</span>
                  </div>
                  {openEditorSection === "education" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openEditorSection === "education" && (
                  <div className="p-4 pt-1 space-y-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                    {resumeData.education.map((edu, idx) => (
                      <div key={edu.id || idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">Degree #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = resumeData.education.filter((_, i) => i !== idx);
                              setResumeData({ ...resumeData, education: updated });
                            }}
                            className="text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const copy = [...resumeData.education];
                            copy[idx].degree = e.target.value;
                            setResumeData({ ...resumeData, education: copy });
                          }}
                          placeholder="Degree (e.g. B.S. in Computer Science)"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => {
                              const copy = [...resumeData.education];
                              copy[idx].school = e.target.value;
                              setResumeData({ ...resumeData, education: copy });
                            }}
                            placeholder="University / College"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                          />
                          <input
                            type="text"
                            value={edu.endYear}
                            onChange={(e) => {
                              const copy = [...resumeData.education];
                              copy[idx].endYear = e.target.value;
                              setResumeData({ ...resumeData, education: copy });
                            }}
                            placeholder="Graduation Year (e.g. 2023)"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newEdu: ResumeEducation = {
                          id: `edu-${Date.now()}`,
                          degree: "Bachelor of Science",
                          school: "University Name",
                          endYear: "2024",
                        };
                        setResumeData({ ...resumeData, education: [...resumeData.education, newEdu] });
                      }}
                      className="w-full py-1.5 rounded-xl border border-dashed border-purple-500/40 text-purple-600 dark:text-purple-400 font-bold text-xs hover:bg-purple-500/5 transition flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Education</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Accordion: Skills */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => setOpenEditorSection(openEditorSection === "skills" ? "" : "skills")}
                  className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                >
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-3.5 h-3.5 text-amber-500" />
                    <span>Skills & Competencies ({resumeData.skills.technical.length + resumeData.skills.tools.length})</span>
                  </div>
                  {openEditorSection === "skills" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openEditorSection === "skills" && (
                  <div className="p-4 pt-1 space-y-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Technical Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={resumeData.skills.technical.join(", ")}
                        onChange={(e) => {
                          const list = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                          setResumeData({ ...resumeData, skills: { ...resumeData.skills, technical: list } });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Tools & Technologies (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={resumeData.skills.tools.join(", ")}
                        onChange={(e) => {
                          const list = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                          setResumeData({ ...resumeData, skills: { ...resumeData.skills, tools: list } });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Soft Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={resumeData.skills.soft.join(", ")}
                        onChange={(e) => {
                          const list = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                          setResumeData({ ...resumeData, skills: { ...resumeData.skills, soft: list } });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep("templates")}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  ← Step 2: Templates
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep("ats-check");
                    if (!atsAudit) runAtsAudit();
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
                >
                  Proceed to Step 4: ATS Check →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TEMPLATE SELECTION */}
          {currentStep === "templates" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-orange-500" />
                  <span>Step 2: Choose Template & Style</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Switch styles instantly. All content is preserved with zero loss.
                </p>
              </div>

              {/* Style Card 1: ATS Professional */}
              <div
                onClick={() => setSelectedStyle("ats")}
                className={`p-4 rounded-2xl border cursor-pointer transition relative ${
                  selectedStyle === "ats"
                    ? "border-orange-500 bg-orange-500/5 ring-2 ring-orange-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Style 1 — ATS Professional</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                    99% ATS Score
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Optimized for online job portals, Workday, Taleo, Greenhouse, and enterprise scanners. Single-column, clear hierarchy, standard headings.
                </p>
                <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                  <span>✓ Standard Fonts</span>
                  <span>•</span>
                  <span>✓ No Table Traps</span>
                  <span>•</span>
                  <span>✓ Searchable Text</span>
                </div>
              </div>

              {/* Style Card 2: Modern Corporate */}
              <div
                onClick={() => setSelectedStyle("modern")}
                className={`p-4 rounded-2xl border cursor-pointer transition relative ${
                  selectedStyle === "modern"
                    ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Style 2 — Modern Corporate</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold">
                    Clean & Sleek
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Contemporary corporate design with primary navy accents, balanced margin spacing, and high-readability section cards.
                </p>
                <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                  <span>✓ Modern Typography</span>
                  <span>•</span>
                  <span>✓ Tech & Finance Ready</span>
                </div>
              </div>

              {/* Style Card 3: Executive Premium */}
              <div
                onClick={() => setSelectedStyle("executive")}
                className={`p-4 rounded-2xl border cursor-pointer transition relative ${
                  selectedStyle === "executive"
                    ? "border-amber-600 bg-amber-600/5 ring-2 ring-amber-600/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-amber-700" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Style 3 — Executive Premium</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold">
                    Leadership
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Sophisticated editorial layout for senior engineers, directors, managers, and executives. Refined serif headings and luxury framing.
                </p>
                <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                  <span>✓ Executive Polish</span>
                  <span>•</span>
                  <span>✓ Leadership Focus</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep("extraction")}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  ← Step 1: Extraction
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep("editing")}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
                >
                  Proceed to Step 3: Live Editing →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ATS CHECK & AUDIT */}
          {currentStep === "ats-check" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Step 4: ATS Score & Compliance Audit</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Real-time scan against Workday, Taleo & Greenhouse algorithms.</p>
                </div>
                <button
                  type="button"
                  disabled={isAuditing}
                  onClick={() => runAtsAudit()}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-sm hover:bg-orange-600 transition flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
                  <span>Re-scan</span>
                </button>
              </div>

              {atsAudit ? (
                <div className="space-y-3">
                  {/* Score Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Overall ATS Score</span>
                      <div className="text-3xl font-black text-emerald-400">{atsAudit.score} / 100</div>
                      <span className="text-xs font-semibold text-slate-300">{atsAudit.rating}</span>
                    </div>
                    <div className="w-14 h-14 rounded-full border-4 border-emerald-400 flex items-center justify-center font-black text-sm text-emerald-400">
                      {atsAudit.score}%
                    </div>
                  </div>

                  {/* Checklist Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Audit Breakdown
                    </h4>
                    {atsAudit.breakdown.map((item, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{item.section}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              item.status === "good"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : item.status === "warning"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{item.feedback}</p>
                        {item.tip && <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">Tip: {item.tip}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Job Match Section */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <Target className="w-3.5 h-3.5 text-rose-500" />
                      <span>Match Against Target Job Description (JD)</span>
                    </h4>
                    <textarea
                      rows={3}
                      value={jobDescriptionInput}
                      onChange={(e) => setJobDescriptionInput(e.target.value)}
                      placeholder="Paste Job Description (requirements, skills)..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                    />
                    <button
                      type="button"
                      disabled={isMatchingJob || !jobDescriptionInput.trim()}
                      onClick={handleJobMatch}
                      className="w-full py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-xs hover:bg-orange-600 transition disabled:opacity-40 cursor-pointer"
                    >
                      {isMatchingJob ? "Analyzing match..." : "Compare Against JD"}
                    </button>
                    {jobMatchResult && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>Job Match:</span>
                          <span className="text-emerald-500 font-black">{jobMatchResult.matchPercentage}%</span>
                        </div>
                        {jobMatchResult.missingKeywords.length > 0 && (
                          <div>
                            <span className="text-[10px] text-rose-500 font-bold block mb-1">Missing Keywords:</span>
                            <div className="flex flex-wrap gap-1">
                              {jobMatchResult.missingKeywords.map((k, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold">
                                  + {k}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep("editing")}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      ← Step 3: Editing
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("export")}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Proceed to Step 5: Export →</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-500">Running ATS audit scan...</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: EXPORT & DOWNLOAD */}
          {currentStep === "export" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
                  <Download className="w-4 h-4 text-orange-500" />
                  <span>Step 5: Export & Download Suite</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Generate high-resolution vector PDF, editable Microsoft Word (.docx), or print directly.
                </p>
              </div>

              {/* Primary Download PDF Button */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/30 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">ATS-Optimized PDF</h4>
                    <p className="text-[10px] text-slate-500">Universal formatting, machine-readable text & vector typography.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download ATS PDF</span>
                </button>
              </div>

              {/* Word Docx Option */}
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">Microsoft Word (.docx)</h4>
                    <p className="text-[10px] text-slate-500">Editable formatted document for recruiter customized submissions.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Download Word (.docx)</span>
                </button>
              </div>

              {/* Print and Copy Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>Print Resume</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {copiedNotification ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedNotification ? "Copied!" : "Copy Text"}</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep("ats-check")}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  ← Step 4: ATS Check & Score
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real-Time Live Preview Document Stage */}
        <div className="lg:col-span-7 bg-slate-200 dark:bg-slate-950 p-4 sm:p-6 flex flex-col items-center justify-start overflow-y-auto relative">
          {/* Zoom & Quick Controls Bar */}
          <div className="w-full max-w-2xl flex items-center justify-between mb-3 px-1">
            <div className="flex items-center space-x-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 px-1.5 hover:text-orange-500"
              >
                -
              </button>
              <span className="text-[11px] font-bold text-slate-500">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 px-1.5 hover:text-orange-500"
              >
                +
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-300 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-orange-500 transition flex items-center space-x-1 shadow-xs"
              >
                {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNotification ? "Copied!" : "Copy Text"}</span>
              </button>
            </div>
          </div>

          {/* Scaled Sheet Paper Container */}
          <div
            id="resume-live-preview-document"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            className={`w-full max-w-[650px] bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl transition-all border border-slate-200/80 min-h-[840px] text-[13px] leading-relaxed ${
              selectedStyle === "executive" ? "font-serif" : "font-sans"
            }`}
          >
            {/* Header: Personal Info */}
            <div className={`pb-4 border-b ${selectedStyle === "ats" ? "text-center" : "text-left"} border-slate-300`}>
              <h1
                className={`text-2xl font-black tracking-tight ${
                  selectedStyle === "modern" ? "text-blue-900" : selectedStyle === "executive" ? "text-slate-950 font-bold" : "text-slate-900"
                }`}
              >
                {resumeData.personal.fullName || "Your Full Name"}
              </h1>
              {resumeData.personal.title && (
                <div
                  className={`text-xs font-bold mt-1 ${
                    selectedStyle === "modern" ? "text-blue-600" : selectedStyle === "executive" ? "text-amber-800" : "text-slate-600"
                  }`}
                >
                  {resumeData.personal.title}
                </div>
              )}
              <div className="text-[10.5px] text-slate-600 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 justify-center sm:justify-start">
                {[
                  resumeData.personal.email,
                  resumeData.personal.phone,
                  resumeData.personal.location,
                  resumeData.personal.linkedin,
                  resumeData.personal.portfolio,
                ]
                  .filter(Boolean)
                  .map((item, idx, arr) => (
                    <React.Fragment key={idx}>
                      <span>{item}</span>
                      {idx < arr.length - 1 && <span className="text-slate-400">•</span>}
                    </React.Fragment>
                  ))}
              </div>
            </div>

            {/* Section: Professional Summary */}
            {resumeData.summary && (
              <div className="mt-4">
                <h3
                  className={`text-[11.5px] font-black uppercase tracking-wider pb-1 border-b mb-1.5 ${
                    selectedStyle === "modern"
                      ? "text-blue-900 border-blue-200"
                      : selectedStyle === "executive"
                      ? "text-slate-900 border-amber-300"
                      : "text-slate-900 border-slate-300"
                  }`}
                >
                  Professional Summary
                </h3>
                <p className="text-[11px] text-slate-700 leading-relaxed">{resumeData.summary}</p>
              </div>
            )}

            {/* Section: Experience */}
            {resumeData.experience.length > 0 && (
              <div className="mt-4">
                <h3
                  className={`text-[11.5px] font-black uppercase tracking-wider pb-1 border-b mb-2 ${
                    selectedStyle === "modern"
                      ? "text-blue-900 border-blue-200"
                      : selectedStyle === "executive"
                      ? "text-slate-900 border-amber-300"
                      : "text-slate-900 border-slate-300"
                  }`}
                >
                  Work Experience
                </h3>
                <div className="space-y-3">
                  {resumeData.experience.map((exp, i) => (
                    <div key={i} className="text-[11px]">
                      <div className="flex justify-between items-baseline font-bold text-slate-900">
                        <span>{exp.role}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {[exp.startDate, exp.isCurrent ? "Present" : exp.endDate].filter(Boolean).join(" – ")}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-600 font-medium mb-1">
                        {exp.company}
                        {exp.location ? ` • ${exp.location}` : ""}
                      </div>
                      <ul className="list-disc list-outside pl-3.5 space-y-0.5 text-slate-700">
                        {exp.highlights.map((hl, hIdx) => (
                          <li key={hIdx} className="leading-snug">
                            {hl}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Education */}
            {resumeData.education.length > 0 && (
              <div className="mt-4">
                <h3
                  className={`text-[11.5px] font-black uppercase tracking-wider pb-1 border-b mb-2 ${
                    selectedStyle === "modern"
                      ? "text-blue-900 border-blue-200"
                      : selectedStyle === "executive"
                      ? "text-slate-900 border-amber-300"
                      : "text-slate-900 border-slate-300"
                  }`}
                >
                  Education
                </h3>
                <div className="space-y-1.5">
                  {resumeData.education.map((edu, i) => (
                    <div key={i} className="text-[11px]">
                      <div className="flex justify-between items-baseline font-bold text-slate-900">
                        <span>
                          {edu.degree}
                          {edu.field ? ` in ${edu.field}` : ""}
                        </span>
                        <span className="text-[10px] text-slate-500">{edu.endYear}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-600">
                        {edu.school}
                        {edu.location ? ` • ${edu.location}` : ""}
                        {edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Skills */}
            {(resumeData.skills.technical.length > 0 || resumeData.skills.tools.length > 0) && (
              <div className="mt-4">
                <h3
                  className={`text-[11.5px] font-black uppercase tracking-wider pb-1 border-b mb-1.5 ${
                    selectedStyle === "modern"
                      ? "text-blue-900 border-blue-200"
                      : selectedStyle === "executive"
                      ? "text-slate-900 border-amber-300"
                      : "text-slate-900 border-slate-300"
                  }`}
                >
                  Skills & Competencies
                </h3>
                <div className="text-[10.5px] text-slate-700 space-y-1">
                  {resumeData.skills.technical.length > 0 && (
                    <div>
                      <strong className="text-slate-900">Technical Skills:</strong> {resumeData.skills.technical.join(", ")}
                    </div>
                  )}
                  {resumeData.skills.tools.length > 0 && (
                    <div>
                      <strong className="text-slate-900">Tools & Frameworks:</strong> {resumeData.skills.tools.join(", ")}
                    </div>
                  )}
                  {resumeData.skills.soft.length > 0 && (
                    <div>
                      <strong className="text-slate-900">Soft Skills:</strong> {resumeData.skills.soft.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section: Key Projects */}
            {resumeData.projects && resumeData.projects.length > 0 && (
              <div className="mt-4">
                <h3
                  className={`text-[11.5px] font-black uppercase tracking-wider pb-1 border-b mb-1.5 ${
                    selectedStyle === "modern"
                      ? "text-blue-900 border-blue-200"
                      : selectedStyle === "executive"
                      ? "text-slate-900 border-amber-300"
                      : "text-slate-900 border-slate-300"
                  }`}
                >
                  Key Projects
                </h3>
                <div className="space-y-1.5 text-[10.5px]">
                  {resumeData.projects.map((proj, i) => (
                    <div key={i}>
                      <div className="font-bold text-slate-900">{proj.name}</div>
                      <p className="text-slate-700">{proj.description}</p>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="text-[9.5px] text-slate-500 italic">Tech: {proj.technologies.join(", ")}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Certifications */}
            {resumeData.certifications && resumeData.certifications.length > 0 && (
              <div className="mt-4">
                <h3
                  className={`text-[11.5px] font-black uppercase tracking-wider pb-1 border-b mb-1 ${
                    selectedStyle === "modern"
                      ? "text-blue-900 border-blue-200"
                      : selectedStyle === "executive"
                      ? "text-slate-900 border-amber-300"
                      : "text-slate-900 border-slate-300"
                  }`}
                >
                  Certifications
                </h3>
                <ul className="list-disc list-outside pl-3.5 text-[10px] text-slate-700 space-y-0.5">
                  {resumeData.certifications.map((c, i) => (
                    <li key={i}>
                      <strong className="text-slate-900">{c.name}</strong> — {c.issuer} {c.date ? `(${c.date})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Import / Raw Bio Modal */}
      {showInputModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileUp className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Import Resume or Bio Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInputModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Upload an existing PDF / DOCX file or paste raw background text. PDFSun AI will organize it automatically into structured sections without adding fake information.
            </p>

            {/* File Drop Area */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center relative hover:border-orange-500 transition cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileUp className="w-6 h-6 text-orange-500 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Drop your PDF or DOCX resume here
              </div>
              <div className="text-[10px] text-slate-400">or click to browse from device</div>
            </div>

            {/* Paste raw bio text */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Or Paste Details / Raw Bio:
              </label>
              <textarea
                rows={5}
                value={rawBioText}
                onChange={(e) => setRawBioText(e.target.value)}
                placeholder="e.g. John Doe, Senior Frontend Developer with 5 years experience at Acme Inc..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
              />
            </div>

            {parsingStatus && (
              <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center space-x-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${isParsing ? "animate-spin" : ""}`} />
                <span>{parsingStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setResumeData(DEFAULT_RESUME_DATA);
                  setShowInputModal(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Load Sample Profile
              </button>
              <button
                type="button"
                disabled={isParsing || !rawBioText.trim()}
                onClick={() => handleParseResume(rawBioText)}
                className="px-4 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-md hover:bg-orange-600 transition disabled:opacity-40"
              >
                {isParsing ? "Organizing..." : "Extract & Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
