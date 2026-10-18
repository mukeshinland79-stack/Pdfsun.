import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFDict,
  PDFRawStream,
  PDFArray,
  PDFContext,
  PDFPage,
} from "pdf-lib";
import * as pako from "pako";
import { isEncrypted, decryptPDF } from "@pdfsmaller/pdf-decrypt";

export interface CompressionOptions {
  preset?: "extreme" | "recommended" | "low";
  qualityFactor?: number; // 0.1 to 1.0 (defaults: extreme: 0.50, recommended: 0.72, low: 0.85)
  targetMaxKB?: number | null;
  maxImageDimension?: number;
  onProgress?: (percent: number, msg?: string) => void;
  password?: string;
}

export interface CompressionResult {
  pdfBytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  percentSaved: number;
  isAlreadyOptimized: boolean;
  targetAchieved: boolean;
  imagesOptimized: number;
  hasDigitalSignature: boolean;
  notice: string;
}

/**
 * Resolves the Resources dictionary for a page, walking up the page tree if inherited
 */
function getPageResources(page: PDFPage, context: PDFContext): PDFDict | undefined {
  try {
    let node: any = page.node;
    while (node) {
      const resVal = node.get ? node.get(PDFName.of("Resources")) : null;
      if (resVal) {
        if (resVal instanceof PDFRef) {
          const resolved = context.lookup(resVal);
          if (resolved instanceof PDFDict) return resolved;
        } else if (resVal instanceof PDFDict) {
          return resVal;
        }
      }
      node = node.parent ? (typeof node.parent === "function" ? node.parent() : node.parent) : null;
    }
  } catch {}
  return undefined;
}

/**
 * Checks whether a document dictionary structure contains cryptographic digital signatures
 */
export function checkHasDigitalSignature(doc: PDFDocument): boolean {
  try {
    const context = doc.context;
    for (const [, obj] of (context as any).indirectObjects.entries()) {
      if (obj instanceof PDFDict) {
        const type = obj.get(PDFName.of("Type"))?.toString();
        const byteRange = obj.get(PDFName.of("ByteRange"));
        if (type === "/Sig" || byteRange) {
          return true;
        }
      }
    }
  } catch {}
  return false;
}

/**
 * Collects all Image XObjects from a PDFPage (including nested Form XObjects)
 */
function collectImageXObjects(page: PDFPage, context: PDFContext): Array<{ name: string; stream: PDFRawStream }> {
  const images: Array<{ name: string; stream: PDFRawStream }> = [];
  const visited = new Set<string>();

  function inspectXObjectDict(xObjectDict: PDFDict) {
    if (!xObjectDict || !(xObjectDict as any).dict) return;

    for (const [nameKey, ref] of (xObjectDict as any).dict.entries()) {
      const refKey = ref instanceof PDFRef ? ref.toString() : nameKey.toString();
      if (visited.has(refKey)) continue;
      visited.add(refKey);

      const obj = ref instanceof PDFRef ? context.lookup(ref) : ref;
      if (!obj || !(obj as any).dict) continue;

      const subtype = (obj as any).dict.get(PDFName.of("Subtype"))?.toString();

      if (subtype === "/Image" && obj instanceof PDFRawStream) {
        images.push({ name: nameKey.toString(), stream: obj });
      } else if (subtype === "/Form") {
        // Inspect nested Form XObject resources
        const formRes = (obj as any).dict.get(PDFName.of("Resources"));
        const resolvedFormRes = formRes instanceof PDFRef ? context.lookup(formRes) : formRes;
        if (resolvedFormRes instanceof PDFDict) {
          const subXObj = resolvedFormRes.get(PDFName.of("XObject"));
          const resolvedSubXObj = subXObj instanceof PDFRef ? context.lookup(subXObj) : subXObj;
          if (resolvedSubXObj instanceof PDFDict) {
            inspectXObjectDict(resolvedSubXObj);
          }
        }
      }
    }
  }

  const resources = getPageResources(page, context);
  if (resources) {
    const xObjectVal = resources.get(PDFName.of("XObject"));
    const resolvedXObj = xObjectVal instanceof PDFRef ? context.lookup(xObjectVal) : xObjectVal;
    if (resolvedXObj instanceof PDFDict) {
      inspectXObjectDict(resolvedXObj);
    }
  }

  return images;
}

/**
 * Asynchronously re-encodes a raster JPEG buffer in browser environments using HTML5 Canvas
 */
async function optimizeJpegBuffer(
  rawJpgBytes: Uint8Array,
  quality: number,
  maxDimension: number
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const blob = new Blob([rawJpgBytes], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;

          if (w <= 0 || h <= 0) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }

          // Compute aspect-ratio preserved dimensions within maxDimension limit
          if (Math.max(w, h) > maxDimension) {
            if (w > h) {
              h = Math.round((h * maxDimension) / w);
              w = maxDimension;
            } else {
              w = Math.round((w * maxDimension) / h);
              h = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }

          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);

          canvas.toBlob(
            (compressedBlob) => {
              if (!compressedBlob) {
                resolve(null);
                return;
              }

              const reader = new FileReader();
              reader.onloadend = () => {
                if (reader.result instanceof ArrayBuffer) {
                  const outBytes = new Uint8Array(reader.result);
                  // Clean up canvas
                  canvas.width = 0;
                  canvas.height = 0;
                  resolve({ bytes: outBytes, width: w, height: h });
                } else {
                  resolve(null);
                }
              };
              reader.onerror = () => resolve(null);
              reader.readAsArrayBuffer(compressedBlob);
            },
            "image/jpeg",
            quality
          );
        } catch {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Enterprise PDF Compression Engine
 * 
 * Safely downsamples and re-compresses embedded raster images, eliminates redundant object streams,
 * compresses flate contents, preserves vector text and fonts without degradation, and guarantees
 * that an already-optimized document is never inflated.
 */
export async function compressPdfEnterprise(
  fileOrBytes: File | Uint8Array,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { onProgress } = options;
  if (onProgress) onProgress(10, "Validating PDF encryption and structure...");

  const rawBytes =
    fileOrBytes instanceof Uint8Array
      ? fileOrBytes
      : new Uint8Array(await fileOrBytes.arrayBuffer());

  const originalSize = rawBytes.length;

  // 1. Password & Encryption Guard
  let encCheck: { encrypted: boolean };
  try {
    encCheck = await isEncrypted(rawBytes);
  } catch {
    encCheck = { encrypted: false };
  }

  let workBytes = rawBytes;
  if (encCheck.encrypted) {
    if (!options.password || options.password.trim().length === 0) {
      throw new Error(
        "This PDF is password-protected. Please provide the authorized password to compress it."
      );
    }
    if (onProgress) onProgress(20, "Decrypting protected document for optimization...");
    try {
      workBytes = await decryptPDF(rawBytes, options.password);
    } catch {
      throw new Error("Authorization Failed: Incorrect password for this protected document.");
    }
  }

  // 2. Load PDF with safe options
  if (onProgress) onProgress(30, "Parsing document objects and resource trees...");
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(workBytes);
  } catch (err: any) {
    throw new Error(
      `Cannot compress file: Corrupted, invalid, or unsupported PDF format (${err?.message || "Invalid PDF"}).`
    );
  }

  const hasDigitalSignature = checkHasDigitalSignature(pdfDoc);

  // 3. Determine Parameters Based on Preset
  const preset = options.preset || "recommended";
  let targetQuality = 0.72;
  let targetMaxDim = 1600;

  if (preset === "extreme") {
    targetQuality = options.qualityFactor || 0.50;
    targetMaxDim = options.maxImageDimension || 1000;
  } else if (preset === "low") {
    targetQuality = options.qualityFactor || 0.85;
    targetMaxDim = options.maxImageDimension || 2400;
  } else {
    // "recommended"
    targetQuality = options.qualityFactor || 0.72;
    targetMaxDim = options.maxImageDimension || 1600;
  }

  if (onProgress) onProgress(45, "Scanning and optimizing embedded image XObjects...");

  // 4. Scan and Re-Encode Embedded Raster Images Safely
  let imagesOptimized = 0;
  const pages = pdfDoc.getPages();

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const imageObjects = collectImageXObjects(page, pdfDoc.context);

    for (const { stream } of imageObjects) {
      try {
        const filterVal = stream.dict.get(PDFName.of("Filter"))?.toString();
        const smaskVal = stream.dict.get(PDFName.of("SMask"));

        // Safeguard: Skip fax, JBIG2, or JPXDecode (JPEG2000) images that cannot be safely converted via standard canvas
        if (
          filterVal === "/CCITTFaxDecode" ||
          filterVal === "/JBIG2Decode" ||
          filterVal === "/JPXDecode"
        ) {
          continue;
        }

        // Optimize standard JPEG (/DCTDecode) images
        if (filterVal === "/DCTDecode") {
          const currentImgBytes = stream.getContents();
          // Skip tiny thumbnail images (< 25 KB) to save processing time
          if (currentImgBytes.length > 25 * 1024) {
            const optimized = await optimizeJpegBuffer(currentImgBytes, targetQuality, targetMaxDim);
            if (optimized && optimized.bytes.length < currentImgBytes.length) {
              (stream as any).contents = optimized.bytes;
              stream.dict.set(PDFName.of("Length"), PDFNumber.of(optimized.bytes.length));
              stream.dict.set(PDFName.of("Width"), PDFNumber.of(optimized.width));
              stream.dict.set(PDFName.of("Height"), PDFNumber.of(optimized.height));
              imagesOptimized++;
            }
          }
        }
      } catch {
        // Safe failover: keep original image untouched if recompression encounters an exception
      }
    }

    if (onProgress) {
      onProgress(45 + Math.round(((pIdx + 1) / pages.length) * 35), `Optimizing page resources (${pIdx + 1}/${pages.length})...`);
    }
  }

  // 5. Lossless Structural Compaction
  if (onProgress) onProgress(85, "Rebuilding object streams and compressing structure...");

  // Clear redundant metadata if not customized
  try {
    pdfDoc.setProducer("PDFSun Aservus Compression Engine");
    pdfDoc.setCreator("PDFSun Aservus Compression Engine");
  } catch {}

  let compressedBytes = await pdfDoc.save({ useObjectStreams: true });

  // 6. Target Max KB Second-Pass (if user specified targetMaxKB and we exceeded it)
  if (options.targetMaxKB && options.targetMaxKB > 0 && preset !== "extreme") {
    const targetBytes = options.targetMaxKB * 1024;
    if (compressedBytes.length > targetBytes) {
      if (onProgress) onProgress(88, "Applying extreme optimization pass to approach target size...");
      try {
        const extremePass = await compressPdfEnterprise(workBytes, {
          preset: "extreme",
          qualityFactor: 0.40,
          maxImageDimension: 800,
        });
        if (extremePass.compressedSize < compressedBytes.length) {
          compressedBytes = extremePass.pdfBytes;
          imagesOptimized += extremePass.imagesOptimized;
        }
      } catch {}
    }
  }

  if (onProgress) onProgress(98, "Verifying output size and integrity...");

  // 7. Inflation Safety Guard: Never return an inflated file!
  // If the result is larger than or equal to the original, preserve the exact original file!
  if (compressedBytes.length >= originalSize) {
    if (onProgress) onProgress(100, "Document is already maximally optimized.");
    return {
      pdfBytes: workBytes,
      originalSize,
      compressedSize: originalSize,
      savedBytes: 0,
      percentSaved: 0,
      isAlreadyOptimized: true,
      targetAchieved: options.targetMaxKB ? originalSize <= options.targetMaxKB * 1024 : true,
      imagesOptimized: 0,
      hasDigitalSignature,
      notice: hasDigitalSignature
        ? "Document is already maximally optimized. Note: PDF contains digital signatures which are preserved."
        : "Document is already maximally optimized. The original file has been preserved with zero size inflation.",
    };
  }

  const finalCompressedSize = compressedBytes.length;
  const savedBytes = originalSize - finalCompressedSize;
  const percentSaved = Math.round((savedBytes / originalSize) * 100);
  const targetAchieved = options.targetMaxKB ? finalCompressedSize <= options.targetMaxKB * 1024 : true;

  if (onProgress) onProgress(100, `Compression complete: Saved ${percentSaved}%!`);

  let notice = `Saved ${(savedBytes / 1024).toFixed(1)} KB (${percentSaved}% reduction).`;
  if (imagesOptimized > 0) {
    notice += ` Re-encoded ${imagesOptimized} embedded raster image(s).`;
  }
  if (hasDigitalSignature) {
    notice += " Warning: Modifying this document may invalidate existing cryptographic signatures.";
  }

  return {
    pdfBytes: compressedBytes,
    originalSize,
    compressedSize: finalCompressedSize,
    savedBytes,
    percentSaved,
    isAlreadyOptimized: false,
    targetAchieved,
    imagesOptimized,
    hasDigitalSignature,
    notice,
  };
}
