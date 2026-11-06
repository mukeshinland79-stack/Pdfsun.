/**
 * PDFSun.in — Phase 20 Test Canvas Shim
 * Provides clean headless DOM/Canvas primitives for Node.js test runners
 * Eliminates noisy WorkerTransport.#cacheSimpleMethod and getOptionalContentConfig warnings
 */

export function setupTestCanvasShim(): void {
  if (typeof globalThis === "undefined") return;

  // DOMMatrix Polyfill if missing
  if (typeof (globalThis as any).DOMMatrix === "undefined") {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m21 = 0; m22 = 1; m41 = 0; m42 = 0;
      constructor(init?: number[]) {
        if (Array.isArray(init) && init.length >= 6) {
          this.a = this.m11 = init[0];
          this.b = this.m12 = init[1];
          this.c = this.m21 = init[2];
          this.d = this.m22 = init[3];
          this.e = this.m41 = init[4];
          this.f = this.m42 = init[5];
        }
      }
      transformPoint(p?: { x: number; y: number }) {
        return {
          x: (p?.x ?? 0) * this.a + (p?.y ?? 0) * this.c + this.e,
          y: (p?.x ?? 0) * this.b + (p?.y ?? 0) * this.d + this.f,
        };
      }
    };
  }

  // Ensure standardFontDataUrl warning is muted if standard fonts aren't needed in tests
  if (typeof process !== "undefined" && process.env) {
    process.env.PDFJS_DISABLE_WORKER = "true";
  }
}
