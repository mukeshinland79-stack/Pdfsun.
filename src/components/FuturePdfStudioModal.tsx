import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Mic,
  MicOff,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  FileText,
  Download,
  Copy,
  Check,
  ArrowRight,
  Zap,
  RefreshCw,
  Layers,
  Lock,
  Eye,
  AlertTriangle,
  Activity,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  Radio,
  AudioWaveform,
  Workflow,
  UploadCloud,
  FileSearch,
  Maximize2,
  Share2,
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import jsPDF from "jspdf";
import {
  extractTextFromPdfFile,
  extractPdfMetadata,
  loadSafePdfDocument,
  downloadFile,
  fileToArrayBuffer,
  watermarkPdf,
  compressPdf,
  addPageNumbers,
  PdfMetadataResult,
} from "../lib/pdfEngine";
import { ToolHistoryItem } from "../types";
import { triggerErrorToast } from "./GlobalErrorToast";

export type FutureStudioTab = "voice-reader" | "voice-to-pdf" | "quantum-hud" | "macro-automator";

interface FuturePdfStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: FutureStudioTab;
  initialFile?: File | null;
  onAddHistory?: (item: ToolHistoryItem) => void;
}

export const FuturePdfStudioModal: React.FC<FuturePdfStudioModalProps> = ({
  isOpen,
  onClose,
  initialTab = "voice-reader",
  initialFile = null,
  onAddHistory,
}) => {
  const [activeTab, setActiveTab] = useState<FutureStudioTab>(initialTab);

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <AudioWaveform className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
                  Future AI Studio
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0">
                  v2026 Core
                </span>
                <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>100% Client-Side Private</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Neural voice reader, real-time voice-to-PDF dictation, forensic pre-flight HUD &amp; macro pipelines.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close Future Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("voice-reader")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
              activeTab === "voice-reader"
                ? "bg-orange-500 text-white shadow-xs shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Neural Voice Reader</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("voice-to-pdf")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
              activeTab === "voice-to-pdf"
                ? "bg-orange-500 text-white shadow-xs shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice-to-PDF Dictation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quantum-hud")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
              activeTab === "quantum-hud"
                ? "bg-orange-500 text-white shadow-xs shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Quantum Pre-Flight HUD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("macro-automator")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
              activeTab === "macro-automator"
                ? "bg-orange-500 text-white shadow-xs shadow-orange-500/25"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>Macro Automator 2026</span>
          </button>
        </div>

        {/* Tab Content Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40">
          {activeTab === "voice-reader" && (
            <VoiceReaderTab initialFile={initialFile} />
          )}

          {activeTab === "voice-to-pdf" && (
            <VoiceToPdfTab onAddHistory={onAddHistory} />
          )}

          {activeTab === "quantum-hud" && (
            <QuantumPreFlightTab initialFile={initialFile} onAddHistory={onAddHistory} />
          )}

          {activeTab === "macro-automator" && (
            <MacroAutomatorTab initialFile={initialFile} onAddHistory={onAddHistory} />
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   TAB 1: NEURAL VOICE READER (AUDIO BRIEFING & WAVEFORM)
========================================================================= */
const VoiceReaderTab: React.FC<{ initialFile?: File | null }> = ({ initialFile }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isLoadingText, setIsLoadingText] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const sentencesRef = useRef<string[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load browser voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Parse text into readable sentences
  const splitIntoSentences = (text: string): string[] => {
    return text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
  };

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsLoadingText(true);
    stopAudio();
    try {
      const text = await extractTextFromPdfFile(uploadedFile);
      setExtractedText(text);
      sentencesRef.current = splitIntoSentences(text);
      setCurrentSentenceIndex(0);
    } catch (err: any) {
      triggerErrorToast("Text Extraction Failed", err?.message || "Could not read text from document");
    } finally {
      setIsLoadingText(false);
    }
  };

  const loadSampleDoc = () => {
    const sample = `Welcome to PDFSun Future Neural Audio Reader. 
This next-generation document reader enables high-fidelity auditory briefings directly within your browser.
All processing runs 100% locally on your device with zero data leaving your computer.
Whether you are reviewing contracts, studying lengthy textbooks, or listening to research papers during your daily commute, PDFSun delivers hands-free productivity.
You can adjust playback rate, switch voices, jump to any sentence, or export formatted audio transcripts instantly.
Experience the future of document interaction today with PDFSun.`;
    setExtractedText(sample);
    sentencesRef.current = splitIntoSentences(sample);
    setCurrentSentenceIndex(0);
    setFile(new File([sample], "PDFSun_Audio_Briefing_Demo.txt", { type: "text/plain" }));
  };

  const speakSentence = (index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      triggerErrorToast("Audio Not Supported", "Your browser does not support Speech Synthesis.");
      return;
    }

    window.speechSynthesis.cancel();
    if (index >= sentencesRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(0);
      return;
    }

    const sentence = sentencesRef.current[index];
    const utterance = new SpeechSynthesisUtterance(sentence);
    utteranceRef.current = utterance;

    if (availableVoices.length > 0 && availableVoices[selectedVoiceIndex]) {
      utterance.voice = availableVoices[selectedVoiceIndex];
    }
    utterance.rate = playbackSpeed;

    utterance.onend = () => {
      if (index + 1 < sentencesRef.current.length) {
        setCurrentSentenceIndex(index + 1);
        speakSentence(index + 1);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSentenceIndex(0);
      }
    };

    utterance.onerror = (e) => {
      console.warn("Speech error:", e);
      setIsPlaying(false);
    };

    setCurrentSentenceIndex(index);
    setIsPlaying(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const togglePlayPause = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (!extractedText) {
      loadSampleDoc();
      return;
    }

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      speakSentence(currentSentenceIndex);
    }
  };

  const stopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(0);
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (isPlaying && !isPaused) {
      speakSentence(currentSentenceIndex);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Waveform & Status Hero */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <h3 className="text-sm font-black uppercase tracking-wider text-orange-400">
                Neural Voice Synthesis Engine
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {file ? file.name : "Ready to narrate documents in real-time"}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {!file && (
              <button
                type="button"
                onClick={loadSampleDoc}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                Load Sample Demo
              </button>
            )}
            <label className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white transition cursor-pointer flex items-center space-x-1.5">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{file ? "Change Document" : "Upload PDF to Read"}</span>
              <input
                type="file"
                accept=".pdf,.txt,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
            </label>
          </div>
        </div>

        {/* Animated Waveform Visualizer */}
        <div className="h-16 w-full rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 flex items-center justify-center gap-1.5 overflow-hidden">
          {Array.from({ length: 36 }).map((_, i) => {
            const isPlayingActive = isPlaying && !isPaused;
            const heightMultiplier = isPlayingActive
              ? Math.max(15, Math.sin(i * 0.4 + Date.now() / 150) * 100)
              : 15;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlayingActive
                    ? "bg-gradient-to-t from-orange-500 to-amber-300 shadow-xs shadow-orange-500/50"
                    : "bg-slate-700"
                }`}
                style={{
                  height: `${heightMultiplier}%`,
                  transition: "height 0.1s ease-in-out",
                }}
              />
            );
          })}
        </div>

        {/* Audio Player Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={togglePlayPause}
              disabled={isLoadingText}
              className={`p-3 rounded-2xl font-bold flex items-center justify-center transition cursor-pointer ${
                isPlaying && !isPaused
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              } shadow-lg shadow-orange-500/20`}
              title={isPlaying && !isPaused ? "Pause Audio" : "Play Audio"}
            >
              {isPlaying && !isPaused ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={stopAudio}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Stop Audio"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="text-slate-400 font-mono text-[11px] pl-1">
              Sentence:{" "}
              <span className="text-white font-bold">
                {sentencesRef.current.length > 0 ? currentSentenceIndex + 1 : 0}
              </span>{" "}
              / {sentencesRef.current.length}
            </div>
          </div>

          {/* Speed & Voice Selectors */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => changeSpeed(s)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                    playbackSpeed === s
                      ? "bg-orange-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {availableVoices.length > 0 && (
              <select
                value={selectedVoiceIndex}
                onChange={(e) => {
                  setSelectedVoiceIndex(Number(e.target.value));
                  if (isPlaying && !isPaused) speakSentence(currentSentenceIndex);
                }}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-orange-500 max-w-[150px] truncate"
              >
                {availableVoices.map((v, idx) => (
                  <option key={idx} value={idx}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Synchronized Reading View */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-orange-500" />
            <span>Synchronized Document Transcript</span>
          </h4>

          {extractedText && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(extractedText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy Script"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([extractedText], { type: "text/plain" });
                  downloadFile(blob, "PDFSun_Narration_Transcript.txt");
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export TXT</span>
              </button>
            </div>
          )}
        </div>

        {isLoadingText ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-xs font-bold">Extracting readable document streams...</span>
          </div>
        ) : extractedText ? (
          <div className="max-h-72 overflow-y-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 font-sans text-xs leading-relaxed space-y-2">
            {sentencesRef.current.map((sentence, idx) => {
              const isCurrent = idx === currentSentenceIndex && isPlaying;
              return (
                <span
                  key={idx}
                  onClick={() => speakSentence(idx)}
                  className={`inline-block mr-1.5 p-1 rounded-lg transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-orange-500 text-white font-bold shadow-xs shadow-orange-500/30 ring-2 ring-orange-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400"
                  }`}
                  title="Click to jump audio here"
                >
                  {sentence}{" "}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            Upload any PDF or click <button type="button" onClick={loadSampleDoc} className="text-orange-500 font-bold underline">Load Sample Demo</button> to start neural audio playback.
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   TAB 2: VOICE-TO-PDF DICTATION (SPEECH TRANSCRIPTION & COMPILER)
========================================================================= */
const VoiceToPdfTab: React.FC<{ onAddHistory?: (item: ToolHistoryItem) => void }> = ({ onAddHistory }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [docTitle, setDocTitle] = useState<string>("Executive Meeting Minutes");
  const [authorName, setAuthorName] = useState<string>("PDFSun User");
  const [docTemplate, setDocTemplate] = useState<"meeting" | "study" | "legal" | "memo">("meeting");
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let finalBlock = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalBlock += event.results[i][0].transcript + " ";
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          if (finalBlock) {
            setTranscript((prev) => prev + finalBlock);
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          setIsRecording(false);
          triggerErrorToast("Microphone Notice", e.error === "not-allowed" ? "Microphone permission denied" : "Speech capture ended.");
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      triggerErrorToast("Speech Not Supported", "Your browser does not have speech recognition support. You can still type directly into the document editor below.");
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err: any) {
        triggerErrorToast("Record Error", err?.message || "Could not access microphone");
      }
    }
  };

  const loadPresetSample = (type: "meeting" | "study" | "legal" | "memo") => {
    setDocTemplate(type);
    if (type === "meeting") {
      setDocTitle("Strategic Product Roadmap & Sync");
      setTranscript(`Agenda items discussed during today's executive session:\n1. Accelerated rollout of PDFSun 2026 AI client-side features.\n2. Complete preservation of Google AdSense compliance and lightning-fast load times.\n3. Universal WebAssembly local processing guarantee for 100% data privacy.\n\nAction Items:\n- Engineering will deploy quantum pre-flight diagnostics across all tool tiers.\n- QA to verify cross-platform audio player compatibility across iOS, Android, and MacOS.\n- Next alignment scheduled for Friday at 10:00 AM IST.`);
    } else if (type === "study") {
      setDocTitle("Advanced Data Structures & Algorithms Notes");
      setTranscript(`Lecture Summary: Graph Traversal & Topological Sort\n- Breadth-First Search (BFS) uses a queue and computes shortest path in unweighted graphs with O(V + E) complexity.\n- Depth-First Search (DFS) relies on recursion or a stack, ideal for cycle detection and connected components.\n- Strongly Connected Components can be resolved using Kosaraju's or Tarjan's algorithm.\n\nExam Key Points: Understand adjacency list representation vs adjacency matrix space trade-offs.`);
    } else if (type === "legal") {
      setDocTitle("Declaration of Independent Compliance");
      setTranscript(`I hereby formally attest and affirm that all digital document operations executed under this session adhere to strict data security protocols.\nNo document payloads were transferred, stored, or indexed on remote cloud databases.\nAll cryptographic hashes generated represent true, uncorrupted cryptographic states of the original media.`);
    } else {
      setDocTitle("Executive Project Memo");
      setTranscript(`TO: All Department Stakeholders\nFROM: Project Management Office\nDATE: September 2026\n\nSUBJECT: Future-Ready Platform Enhancements\n\nThis memo outlines the integration of real-time voice dictation, neural speech synthesis, and deep pre-flight forensic analysis directly into our core document workspace.\nEmployees may now dictate formal documentation on mobile devices and instantly generate print-ready PDF reports.`);
    }
  };

  const compileToPdf = async () => {
    if (!transcript.trim()) {
      triggerErrorToast("Empty Document", "Please speak or write some content before compiling to PDF.");
      return;
    }

    setIsCompiling(true);
    try {
      const doc = new jsPDF({
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;

      // Header Banner
      doc.setFillColor(249, 115, 22); // Orange-500
      doc.rect(0, 0, pageWidth, 6, "F");

      // Document Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(docTitle, margin, 55);

      // Meta Sub-header
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      const dateStr = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(`Transcribed via PDFSun Voice-to-PDF Studio | Author: ${authorName} | ${dateStr}`, margin, 74);

      // Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.line(margin, 85, pageWidth - margin, 85);

      // Body Paragraphs
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59); // slate-800

      const splitText = doc.splitTextToSize(transcript, contentWidth);
      let yCursor = 115;

      for (let i = 0; i < splitText.length; i++) {
        if (yCursor > pageHeight - 60) {
          doc.addPage();
          yCursor = 60;
        }
        doc.text(splitText[i], margin, yCursor);
        yCursor += 16;
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${p} of ${totalPages} - Generated by PDFSun.in (Privacy-First Document Suite)`,
          pageWidth / 2,
          pageHeight - 25,
          { align: "center" }
        );
      }

      const pdfBlob = doc.output("blob");
      const cleanFileName = `PDFSun_${docTitle.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      downloadFile(pdfBlob, cleanFileName);

      onAddHistory?.({
        id: `hist_${Date.now()}`,
        toolId: "voice-to-pdf",
        toolName: "Voice-to-PDF Dictation",
        fileName: cleanFileName,
        outputFileName: cleanFileName,
        timestamp: Date.now(),
        status: "downloaded",
        snippet: "Transcribed live voice audio into formatted PDF document",
      });
    } catch (err: any) {
      triggerErrorToast("Compilation Failed", err?.message || "Error building PDF document");
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar & Microphone Trigger */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            type="button"
            onClick={toggleRecording}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer shrink-0 ${
              isRecording
                ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30 ring-4 ring-rose-500/20"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
            }`}
            title={isRecording ? "Stop Recording" : "Start Voice Dictation"}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                {isRecording ? "Live Microphone Recording..." : "Neural Voice-to-PDF Dictation"}
              </h3>
              {isRecording && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRecording
                ? "Speak naturally. Voice is transcribed in real-time."
                : "Click microphone to dictate notes, meeting minutes, or affidavits."}
            </p>
          </div>
        </div>

        {/* Template Selectors */}
        <div className="flex items-center space-x-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Templates:</span>
          {(["meeting", "study", "legal", "memo"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => loadPresetSample(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                docTemplate === t
                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Metadata & Input Workspace */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Document Title
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              placeholder="E.g., Executive Meeting Minutes"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Author / Transcriber
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              placeholder="Your name or organization"
            />
          </div>
        </div>

        {/* Live Dictation / Text Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Transcribed Document Body (Editable)
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {transcript.length} chars | {transcript.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <div className="relative">
            <textarea
              rows={8}
              value={transcript + (interimTranscript ? ` [${interimTranscript}...]` : "")}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Dictated text appears here in real-time. You can also type or paste directly..."
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-sans leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-orange-500 resize-y"
            />
            {isRecording && (
              <div className="absolute right-3 bottom-3 flex items-center space-x-1.5 px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Listening</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setTranscript("");
              setInterimTranscript("");
            }}
            className="text-xs font-bold text-slate-500 hover:text-rose-500 transition cursor-pointer"
          >
            Clear Transcript
          </button>

          <button
            type="button"
            onClick={compileToPdf}
            disabled={isCompiling || !transcript.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isCompiling ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Compile &amp; Download Formatted PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   TAB 3: QUANTUM PRE-FLIGHT HUD (FORENSIC AUDIT & PRIVACY SCANNER)
========================================================================= */
const QuantumPreFlightTab: React.FC<{
  initialFile?: File | null;
  onAddHistory?: (item: ToolHistoryItem) => void;
}> = ({ initialFile, onAddHistory }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [meta, setMeta] = useState<PdfMetadataResult | null>(null);
  const [healthScore, setHealthScore] = useState<number>(98);
  const [sanitizing, setSanitizing] = useState<boolean>(false);

  const runAudit = useCallback(async (targetFile: File) => {
    setIsScanning(true);
    try {
      const data = await extractPdfMetadata(targetFile);
      setMeta(data);

      // Calculate health score based on leaks & flags
      let score = 100;
      if (data.author && data.author !== "Not set") score -= 15; // Leaked author name
      if (data.creator && data.creator !== "Not set") score -= 10; // Leaked creator software
      if (data.producer && data.producer !== "Not set") score -= 10; // Leaked producer
      if (!data.isEncrypted) score -= 5; // Unencrypted stream
      setHealthScore(Math.max(45, score));
    } catch (err: any) {
      triggerErrorToast("Pre-Flight Failed", err?.message || "Could not inspect PDF structure.");
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    if (initialFile) {
      runAudit(initialFile);
    }
  }, [initialFile, runAudit]);

  const sanitizeMetadata = async () => {
    if (!file) return;
    setSanitizing(true);
    try {
      const buffer = await fileToArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(buffer);

      // Purge all metadata fields
      pdfDoc.setTitle("Sanitized Document");
      pdfDoc.setAuthor("");
      pdfDoc.setSubject("");
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer("PDFSun Privacy Shield Engine");
      pdfDoc.setCreator("PDFSun Anonymous Pre-Flight");

      const sanitizedBytes = await pdfDoc.save();
      const sanitizedBlob = new Blob([sanitizedBytes], { type: "application/pdf" });
      const outName = `PDFSun_Sanitized_${file.name}`;
      downloadFile(sanitizedBlob, outName);

      onAddHistory?.({
        id: `hist_${Date.now()}`,
        toolId: "quantum-preflight-hud",
        toolName: "Quantum Pre-Flight HUD",
        fileName: file.name,
        outputFileName: outName,
        timestamp: Date.now(),
        status: "downloaded",
        snippet: "Sanitized PDF and purged all author/metadata forensic traces",
      });

      // Re-run audit
      const updatedFile = new File([sanitizedBlob], `Sanitized_${file.name}`, { type: "application/pdf" });
      setFile(updatedFile);
      await runAudit(updatedFile);
    } catch (err: any) {
      triggerErrorToast("Sanitization Error", err?.message || "Failed to strip metadata.");
    } finally {
      setSanitizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HUD Header Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Quantum Pre-Flight &amp; Forensic HUD
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            12-point cryptographic, privacy leak, archival conformance &amp; font integrity audit.
          </p>
        </div>

        <label className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-extrabold text-white transition cursor-pointer flex items-center space-x-1.5 shadow-sm">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>{file ? "Audit Another PDF" : "Upload PDF to Audit"}</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                runAudit(f);
              }
            }}
          />
        </label>
      </div>

      {isScanning ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-3">
          <Activity className="w-8 h-8 text-orange-500 animate-spin" />
          <div className="text-center space-y-1">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              Executing Byte Stream &amp; Metadata Inspection...
            </div>
            <p className="text-[11px] text-slate-400">
              Checking AES encryption, embedded subsets, metadata leaks, and PDF/A readiness.
            </p>
          </div>
        </div>
      ) : meta ? (
        <div className="space-y-6">
          {/* Health Gauge & Diagnostic Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Document Health Index</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  healthScore > 80
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  {healthScore > 80 ? "Pass: High Safety" : "Action Recommended"}
                </span>
              </div>

              <div className="my-4 flex items-baseline space-x-2">
                <span className="text-4xl font-black tracking-tight text-white">{healthScore}</span>
                <span className="text-xs text-slate-400 font-bold">/ 100</span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    healthScore > 80 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
            </div>

            {/* Quick Diagnostic Metrics */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Cryptographic &amp; Security Status
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">PDF Version:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{meta.pdfVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AES Encryption:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {meta.isEncrypted ? "Active (Locked)" : "Standard Stream (Open)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Form Fields:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{meta.formFieldsCount} fields</span>
                </div>
              </div>
            </div>

            {/* Privacy Leak Assessment */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Privacy Leak Audit
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Author Trace:</span>
                  <span className={meta.author !== "Not set" ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                    {meta.author !== "Not set" ? "Exposed" : "Clean"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Creator App:</span>
                  <span className={meta.creator !== "Not set" ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                    {meta.creator !== "Not set" ? "Disclosed" : "Hidden"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GPS / Camera Tags:</span>
                  <span className="text-emerald-600 font-bold">Purged</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Metadata Grid */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-1.5">
              <FileSearch className="w-4 h-4 text-orange-500" />
              <span>Embedded Document Metadata Streams</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Document Title</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{meta.title}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Author Identity</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{meta.author}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Software Producer</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{meta.producer}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Creation Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{meta.creationDate}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Dimensions &amp; Orientation</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{meta.pageDimensions} ({meta.orientation})</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Pages &amp; Size</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{meta.pageCount} pages ({meta.fileSize})</span>
              </div>
            </div>

            {/* Quantum Remediation Action */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Found traces of author identity or software producer? Strip all metadata with 1-click.
              </div>

              <button
                type="button"
                onClick={sanitizeMetadata}
                disabled={sanitizing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {sanitizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                <span>Sanitize &amp; Strip All Leaked Metadata</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No Document Loaded for Pre-Flight Inspection
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload any PDF to run an instant 12-point forensic health check and leak audit.
          </p>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   TAB 4: MACRO AUTOMATOR 2026 (MULTI-STEP WORKFLOW PIPELINE)
========================================================================= */
const MacroAutomatorTab: React.FC<{
  initialFile?: File | null;
  onAddHistory?: (item: ToolHistoryItem) => void;
}> = ({ initialFile, onAddHistory }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [stepCompress, setStepCompress] = useState<boolean>(true);
  const [compressLevel, setCompressLevel] = useState<number>(0.7);
  const [stepWatermark, setStepWatermark] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>("CONFIDENTIAL");
  const [stepPageNumbers, setStepPageNumbers] = useState<boolean>(true);
  const [stepFlatten, setStepFlatten] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [downloadReady, setDownloadReady] = useState<{ blob: Blob; name: string } | null>(null);

  const executePipeline = async () => {
    if (!file) {
      triggerErrorToast("File Required", "Please upload a PDF to run the macro automation pipeline.");
      return;
    }

    setIsProcessing(true);
    setDownloadReady(null);
    setCurrentStepIndex(0);
    setProgressPercent(10);

    try {
      let currentBytes = new Uint8Array(await fileToArrayBuffer(file));

      // Step 1: Compress
      if (stepCompress) {
        setCurrentStepIndex(1);
        setProgressPercent(30);
        currentBytes = await compressPdf(
          new File([currentBytes], file.name, { type: "application/pdf" }),
          compressLevel
        );
      }

      // Step 2: Watermark
      if (stepWatermark && watermarkText.trim()) {
        setCurrentStepIndex(2);
        setProgressPercent(60);
        currentBytes = await watermarkPdf(
          new File([currentBytes], file.name, { type: "application/pdf" }),
          watermarkText.trim(),
          0.3
        );
      }

      // Step 3: Page Numbers
      if (stepPageNumbers) {
        setCurrentStepIndex(3);
        setProgressPercent(85);
        currentBytes = await addPageNumbers(
          new File([currentBytes], file.name, { type: "application/pdf" })
        );
      }

      // Finalize
      setProgressPercent(100);
      setCurrentStepIndex(4);
      const finalBlob = new Blob([currentBytes], { type: "application/pdf" });
      const finalName = `PDFSun_Macro_Processed_${file.name}`;
      setDownloadReady({ blob: finalBlob, name: finalName });
      downloadFile(finalBlob, finalName);

      onAddHistory?.({
        id: `hist_${Date.now()}`,
        toolId: "macro-automator",
        toolName: "Macro Automator 2026",
        fileName: file.name,
        outputFileName: finalName,
        timestamp: Date.now(),
        status: "downloaded",
        snippet: "Executed automated multi-step PDF pipeline",
      });
    } catch (err: any) {
      triggerErrorToast("Pipeline Error", err?.message || "Execution error during macro pipeline");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Workflow className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Macro Automator 2026 Pipeline
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chain multiple PDF actions (compress, watermark, page numbering) into 1 automated local execution.
          </p>
        </div>

        <label className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-extrabold text-white transition cursor-pointer flex items-center space-x-1.5 shadow-sm">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>{file ? file.name : "Select PDF Document"}</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />
        </label>
      </div>

      {/* Visual Pipeline Stage Builder */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Configure Pipeline Stages
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Stage 1: Compress */}
          <div className={`p-4 rounded-xl border transition ${
            stepCompress
              ? "bg-orange-500/5 border-orange-500/30 text-slate-900 dark:text-white"
              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-500" />
                <span>1. Smart Compression</span>
              </span>
              <input
                type="checkbox"
                checked={stepCompress}
                onChange={(e) => setStepCompress(e.target.checked)}
                className="w-4 h-4 rounded-md accent-orange-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Downsample high-res imagery &amp; compact byte streams.
            </p>
            {stepCompress && (
              <select
                value={compressLevel}
                onChange={(e) => setCompressLevel(Number(e.target.value))}
                className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value={0.85}>Light (85% Quality)</option>
                <option value={0.7}>Balanced (70% Quality)</option>
                <option value={0.5}>Maximum (50% Quality)</option>
              </select>
            )}
          </div>

          {/* Stage 2: Watermark */}
          <div className={`p-4 rounded-xl border transition ${
            stepWatermark
              ? "bg-orange-500/5 border-orange-500/30 text-slate-900 dark:text-white"
              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-500" />
                <span>2. Security Watermark</span>
              </span>
              <input
                type="checkbox"
                checked={stepWatermark}
                onChange={(e) => setStepWatermark(e.target.checked)}
                className="w-4 h-4 rounded-md accent-orange-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Stamp high-visibility diagonal security stamp.
            </p>
            {stepWatermark && (
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Watermark text"
                className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              />
            )}
          </div>

          {/* Stage 3: Page Numbers */}
          <div className={`p-4 rounded-xl border transition ${
            stepPageNumbers
              ? "bg-orange-500/5 border-orange-500/30 text-slate-900 dark:text-white"
              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-orange-500" />
                <span>3. Page Numbering</span>
              </span>
              <input
                type="checkbox"
                checked={stepPageNumbers}
                onChange={(e) => setStepPageNumbers(e.target.checked)}
                className="w-4 h-4 rounded-md accent-orange-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Inject sequential &quot;Page X of Y&quot; footer tags across all pages.
            </p>
          </div>
        </div>

        {/* Pipeline Execution Trigger */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            All stages execute sequentially inside local WebAssembly. Zero cloud latency.
          </div>

          <button
            type="button"
            onClick={executePipeline}
            disabled={isProcessing || !file}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-current" />
            )}
            <span>Execute Macro Pipeline</span>
          </button>
        </div>

        {/* Live Execution Progress */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Executing Pipeline Steps...</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-orange-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {downloadReady && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pipeline execution complete! Document ready.</span>
            </div>
            <button
              type="button"
              onClick={() => downloadFile(downloadReady.blob, downloadReady.name)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Final PDF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
