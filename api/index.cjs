/**
 * Vercel Serverless Function Catch-All Adapter (CommonJS) for PDFSun.in Express Backend.
 *
 * Uses explicit `.cjs` so Node.js 22 loads this entrypoint in CommonJS mode regardless of
 * `"type": "module"` in package.json, eliminating `ERR_MODULE_NOT_FOUND` on extensionless
 * TypeScript imports and `ERR_IMPORT_ATTRIBUTE_MISSING` on JSON imports.
 *
 * Loads the prebuilt backend bundle `../dist-server/server.cjs` (included via vercel.json
 * `functions["api/index.cjs"].includeFiles`) without binding a TCP listener.
 */
"use strict";

const serverModule = require("../dist-server/server.cjs");

const app =
  typeof serverModule === "function"
    ? serverModule
    : serverModule && typeof serverModule.default === "function"
      ? serverModule.default
      : serverModule && typeof serverModule.app === "function"
        ? serverModule.app
        : null;

if (typeof app !== "function") {
  throw new Error(
    "[PDFSun Vercel Adapter] dist-server/server.cjs did not export a callable Express app handler."
  );
}

/**
 * Normalizes Vercel rewritten paths (`/api/(.*)` -> `/api`) and delegates to Express.
 * @param {import("http").IncomingMessage & { url?: string }} req
 * @param {import("http").ServerResponse} res
 */
function handler(req, res) {
  if (req && typeof req.url === "string") {
    if (req.url === "/" || req.url.startsWith("/?")) {
      req.url = `/api${req.url === "/" ? "" : req.url}`;
    } else if (!req.url.startsWith("/api")) {
      req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
    }
  }
  return app(req, res);
}

module.exports = handler;
module.exports.default = handler;
