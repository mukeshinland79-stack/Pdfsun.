/**
 * Vercel Serverless Function Catch-All Adapter for PDFSun.in Express Backend.
 * Routes all /api/* traffic on Vercel directly into the canonical Express app
 * defined in ../server.ts without binding a TCP listener.
 */
import type { IncomingMessage, ServerResponse } from "http";
import app from "../server";

export default function handler(req: IncomingMessage & { url?: string }, res: ServerResponse) {
  // Normalize URL when invoked via Vercel rewrite (/api/(.*) -> /api)
  if (req.url) {
    if (req.url === "/" || req.url.startsWith("/?")) {
      req.url = `/api${req.url === "/" ? "" : req.url}`;
    } else if (!req.url.startsWith("/api")) {
      req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
    }
  }
  return (app as any)(req, res);
}
