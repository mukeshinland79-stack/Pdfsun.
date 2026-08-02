import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client lazily or gracefully handle missing key
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// AI API Endpoints
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, documentText, history } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `You are PDFSun AI Document Assistant.
You answer user questions accurately based on the provided document content.
If the document content is provided, quote or reference specific sections where relevant.
Be professional, structured, and helpful. Use clear markdown formatting.
Document Content Context:
---
${documentText ? documentText.slice(0, 15000) : "No document text uploaded yet."}
---`;

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push(`${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`);
      }
    }
    contents.push(`User Question: ${message}`);

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents.join("\n\n"),
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    res.json({ result: response.text || "No response generated." });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process AI chat request." });
  }
});

app.post("/api/ai/summarize", async (req, res) => {
  try {
    const { documentText, format = "executive" } = req.body;
    const ai = getGeminiClient();

    let formatPrompt = "Provide an executive summary with key takeaways and bullet points.";
    if (format === "bullets") formatPrompt = "Provide concise, high-impact bullet points of the main ideas.";
    if (format === "detailed") formatPrompt = "Provide a section-by-section detailed summary with deep insights.";

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Please summarize the following document content.\nFormat requirement: ${formatPrompt}\n\nDocument Text:\n${(documentText || "").slice(0, 20000)}`,
      config: {
        systemInstruction: "You are PDFSun AI Summarizer. Generate highly structured, clear, and actionable markdown summaries.",
      },
    });

    res.json({ result: response.text || "Summary generated." });
  } catch (error: any) {
    console.error("AI Summarize Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate AI summary." });
  }
});

app.post("/api/ai/translate", async (req, res) => {
  try {
    const { documentText, targetLanguage } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Translate the following text into ${targetLanguage || "English"}. Maintain original structure and paragraph formatting.\n\nText:\n${(documentText || "").slice(0, 15000)}`,
      config: {
        systemInstruction: `You are PDFSun AI Translator. Accurately translate document text into ${targetLanguage || "English"} while preserving formatting and technical accuracy.`,
      },
    });

    res.json({ result: response.text || "Translation complete." });
  } catch (error: any) {
    console.error("AI Translate Error:", error);
    res.status(500).json({ error: error?.message || "Failed to translate document." });
  }
});

app.post("/api/ai/flashcards", async (req, res) => {
  try {
    const { documentText, count = 8 } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Generate ${count} flashcards (Question & Answer pairs) based on key concepts in this document text.
Return ONLY valid JSON format like:
[
  {"question": "...", "answer": "..."},
  ...
]

Document Text:
${(documentText || "").slice(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
      },
    });

    let flashcards = [];
    try {
      flashcards = JSON.parse(response.text || "[]");
    } catch {
      flashcards = [{ question: "Key Concept", answer: response.text }];
    }

    res.json({ flashcards });
  } catch (error: any) {
    console.error("AI Flashcards Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate flashcards." });
  }
});

app.post("/api/ai/notes", async (req, res) => {
  try {
    const { documentText } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Create structured study notes with key terms, definitions, formulas/concepts, and review questions from this document:\n\n${(documentText || "").slice(0, 18000)}`,
      config: {
        systemInstruction: "You are PDFSun AI Study Notes Generator. Produce beautifully formatted Markdown study notes.",
      },
    });

    res.json({ result: response.text || "Study notes created." });
  } catch (error: any) {
    console.error("AI Notes Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate study notes." });
  }
});

app.post("/api/ai/grammar", async (req, res) => {
  try {
    const { documentText, mode = "proofread" } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Perform ${mode} on the following text. Point out corrections, list improvements, and provide a fully polished version.\n\nText:\n${(documentText || "").slice(0, 15000)}`,
      config: {
        systemInstruction: "You are PDFSun AI Grammar & Style Inspector. Enhance writing clarity, fix spelling, grammar, and tone.",
      },
    });

    res.json({ result: response.text || "Grammar check completed." });
  } catch (error: any) {
    console.error("AI Grammar Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process grammar check." });
  }
});

app.post("/api/ai/explain", async (req, res) => {
  try {
    const { documentText, targetAudience = "beginner" } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Explain this document in simple terms suited for a ${targetAudience} level. Break down jargon, complex clauses, math equations, or legal jargon.\n\nText:\n${(documentText || "").slice(0, 15000)}`,
      config: {
        systemInstruction: "You are PDFSun AI Explainer. Simplify complex documents into clear, easy-to-understand explanations with real-world analogies.",
      },
    });

    res.json({ result: response.text || "Explanation ready." });
  } catch (error: any) {
    console.error("AI Explain Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate explanation." });
  }
});

app.post("/api/ai/ocr", async (req, res) => {
  try {
    const { imageBase64, mimeType = "application/pdf" } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: "You are an advanced OCR document processing engine. Extract all readable text from this document/image accurately. Preserve document hierarchy, page titles, section headings, list items, paragraphs, and table structures. Return the full raw extracted plain text.",
          },
        ],
      },
    });

    res.json({ result: response.text || "No text could be extracted from the document." });
  } catch (error: any) {
    console.error("AI OCR Error:", error);
    res.status(500).json({ error: error?.message || "Failed to perform AI OCR." });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "PDFSun", domain: "pdfsun.vercel.app" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PDFSun server listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
