import fs from "fs";
import path from "path";
import os from "os";

// Directory paths
export const TEMP_UPLOAD_DIR = path.join(os.tmpdir(), "pdfsun_uploads");
export const PROCESSED_FILES_DIR = path.join(os.tmpdir(), "pdfsun_processed");

// Ensure directories exist on module load
[TEMP_UPLOAD_DIR, PROCESSED_FILES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

interface FileMetadata {
  id: string;
  filePath: string;
  createdAt: number;
  expiresAt: number;
  fileSizeMb: number;
}

const fileRegistry = new Map<string, FileMetadata>();

/**
 * Pillar 2: High-Performance Multi-Tier Storage Cleanup & Retention Engine
 */

// Tier 1 (Active Tasks): Save active incoming temporary file
export function registerTempFile(id: string, filePath: string, retentionMin: number = 20): FileMetadata {
  const stats = fs.statSync(filePath);
  const fileSizeMb = stats.size / (1024 * 1024);
  const now = Date.now();
  const expiresAt = now + retentionMin * 60 * 1000;

  const metadata: FileMetadata = {
    id,
    filePath,
    createdAt: now,
    expiresAt,
    fileSizeMb,
  };

  fileRegistry.set(id, metadata);
  return metadata;
}

// Tier 2 (Completed Tasks): Delete processed files after expiration window (15-30 mins)
export function cleanupExpiredFiles(): number {
  const now = Date.now();
  let deletedCount = 0;

  fileRegistry.forEach((meta, id) => {
    if (now >= meta.expiresAt) {
      deleteSingleFile(meta.filePath);
      fileRegistry.delete(id);
      deletedCount++;
    }
  });

  // Also clean orphan files in temp directories older than 30 mins
  [TEMP_UPLOAD_DIR, PROCESSED_FILES_DIR].forEach((dir) => {
    try {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > 30 * 60 * 1000) {
          deleteSingleFile(fullPath);
          deletedCount++;
        }
      });
    } catch (err) {
      console.error(`Error sweeping directory ${dir}:`, err);
    }
  });

  return deletedCount;
}

// Emergency Purge Mechanism: Asynchronous purge triggered if SSD storage usage or temp directory exceeds threshold (e.g. 70%)
export function executeEmergencyStoragePurge(): { purgedFiles: number; freedMb: number } {
  let freedBytes = 0;
  let purgedFiles = 0;

  console.warn("[STORAGE ALERT] Executing emergency multi-tier storage purge routine...");

  [TEMP_UPLOAD_DIR, PROCESSED_FILES_DIR].forEach((dir) => {
    try {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        try {
          const stats = fs.statSync(fullPath);
          freedBytes += stats.size;
          fs.unlinkSync(fullPath);
          purgedFiles++;
        } catch {}
      });
    } catch (err) {
      console.error(`Emergency purge error in ${dir}:`, err);
    }
  });

  fileRegistry.clear();
  const freedMb = Math.round(freedBytes / (1024 * 1024));
  console.log(`[STORAGE PURGE COMPLETE] Freed ${freedMb} MB across ${purgedFiles} temporary files.`);
  return { purgedFiles, freedMb };
}

/**
 * Pillar 2: In-Memory Garbage Collection & Buffer Release Helper
 */
export function releaseMemoryPayload(bufferOrStream: any) {
  if (bufferOrStream && Buffer.isBuffer(bufferOrStream)) {
    // Fill buffer with zeroes to allow quick GC reclaiming
    bufferOrStream.fill(0);
  }
  // Invoke Node.js explicit garbage collector if flag --expose-gc is enabled
  if (typeof global.gc === "function") {
    try {
      global.gc();
    } catch {}
  }
}

function deleteSingleFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Failed to delete temp file ${filePath}:`, err);
  }
}

// Periodic background storage sweep every 3 minutes
setInterval(() => {
  const count = cleanupExpiredFiles();
  if (count > 0) {
    console.log(`[STORAGE MANAGER] Periodic sweep deleted ${count} expired PDF/temp artifacts.`);
  }
}, 3 * 60 * 1000);
