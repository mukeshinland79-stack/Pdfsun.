/**
 * Pure TypeScript Lightweight QR Code Matrix Generator
 * Supports Byte Encoding Mode (URLs, Text) with Reed-Solomon Error Correction.
 * Produces a 2D matrix of booleans (true = dark, false = light).
 */

// Galois Field (256) Math tables for Reed-Solomon Error Correction
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d; // GF(256) primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
    }
  }
  for (let i = 255; i < 256; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255];
}

function polyMul(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function polyGenerator(numEcc: number): number[] {
  let g = [1];
  for (let i = 0; i < numEcc; i++) {
    g = polyMul(g, [1, EXP_TABLE[i]]);
  }
  return g;
}

function calculateEcc(data: number[], numEcc: number): number[] {
  const gen = polyGenerator(numEcc);
  const msg = [...data, ...new Array(numEcc).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

// QR Code Specifications for Version 2 (25x25) and Version 3 (29x29)
// Version 2-M: Total 44 codewords (28 data + 16 ECC) -> 28 bytes capacity (fits https://pdfsun.in = 18 bytes!)
// Version 3-M: Total 70 codewords (44 data + 26 ECC) -> 44 bytes capacity
interface QRVersionSpec {
  version: number;
  size: number;
  totalDataBytes: number;
  eccBytes: number;
  alignPos: number[];
}

const VERSIONS: QRVersionSpec[] = [
  { version: 2, size: 25, totalDataBytes: 28, eccBytes: 16, alignPos: [6, 18] },
  { version: 3, size: 29, totalDataBytes: 44, eccBytes: 26, alignPos: [6, 22] },
  { version: 4, size: 33, totalDataBytes: 64, eccBytes: 36, alignPos: [6, 26] },
];

export function generateQrMatrix(text: string): boolean[][] {
  const textBytes = new TextEncoder().encode(text);
  
  // Choose smallest version that fits
  let spec = VERSIONS.find((v) => textBytes.length + 3 <= v.totalDataBytes);
  if (!spec) spec = VERSIONS[VERSIONS.length - 1]; // fallback

  const size = spec.size;

  // Initialize module matrix: null = unset, true = dark, false = light
  const grid: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  // Helper to set module
  const setModule = (r: number, c: number, val: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      grid[r][c] = val;
    }
  };

  // 1. Finder Patterns (7x7)
  const drawFinder = (topR: number, topC: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = topR + r;
        const nc = topC + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r === -1 || r === 7 || c === -1 || c === 7) {
            grid[nr][nc] = false; // separator
          } else if (r === 0 || r === 6 || c === 0 || c === 6) {
            grid[nr][nc] = true;
          } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
            grid[nr][nc] = true;
          } else {
            grid[nr][nc] = false;
          }
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment Patterns (5x5)
  for (const r of spec.alignPos) {
    for (const c of spec.alignPos) {
      if (grid[r][c] !== null) continue; // skip if overlaps finder
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const isCenter = dr === 0 && dc === 0;
          setModule(r + dr, c + dc, isBorder || isCenter);
        }
      }
    }
  }

  // 3. Timing Patterns (Row 6 and Col 6)
  for (let i = 0; i < size; i++) {
    if (grid[6][i] === null) setModule(6, i, i % 2 === 0);
    if (grid[i][6] === null) setModule(i, 6, i % 2 === 0);
  }

  // 4. Dark Module
  setModule(4 * spec.version + 9, 8, true);

  // Reserve Format Info Area (around finders)
  for (let i = 0; i < 9; i++) {
    if (grid[8][i] === null) grid[8][i] = false;
    if (grid[i][8] === null) grid[i][8] = false;
    if (grid[8][size - 1 - i] === null) grid[8][size - 1 - i] = false;
    if (grid[size - 1 - i][8] === null) grid[size - 1 - i][8] = false;
  }

  // 5. Encode Data
  // Byte Mode Indicator: 0100 (4 bits)
  // Character Count Indicator: 8 bits for versions 1-9
  const bitBuffer: number[] = [];
  const addBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bitBuffer.push((val >> i) & 1);
    }
  };

  addBits(0b0100, 4); // Byte mode
  addBits(textBytes.length, 8); // length
  for (const b of textBytes) {
    addBits(b, 8);
  }

  // Terminator
  const totalDataBits = spec.totalDataBytes * 8;
  const termLen = Math.min(4, totalDataBits - bitBuffer.length);
  addBits(0, termLen);

  // Bit padding to byte boundary
  while (bitBuffer.length % 8 !== 0) {
    bitBuffer.push(0);
  }

  // Byte padding with 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitBuffer.length < totalDataBits) {
    addBits(padBytes[padIdx], 8);
    padIdx = (padIdx + 1) % 2;
  }

  // Convert bitBuffer to data codewords
  const dataCodewords: number[] = [];
  for (let i = 0; i < spec.totalDataBytes; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitBuffer[i * 8 + b];
    }
    dataCodewords.push(byteVal);
  }

  // Calculate ECC codewords
  const eccCodewords = calculateEcc(dataCodewords, spec.eccBytes);

  // Interleave data and ECC (here single block)
  const finalCodewords = [...dataCodewords, ...eccCodewords];

  // Convert final codewords to bit stream
  const finalBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let b = 7; b >= 0; b--) {
      finalBits.push((cw >> b) & 1);
    }
  }

  // 6. Place Bits in Matrix (Zig-Zag)
  let bitIdx = 0;
  let dir = -1; // -1 = going up, 1 = going down
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip timing column

    const rowStart = dir === -1 ? size - 1 : 0;
    const rowEnd = dir === -1 ? -1 : size;

    for (let r = rowStart; r !== rowEnd; r += dir) {
      for (let c = 0; c < 2; c++) {
        const curCol = col - c;
        if (grid[r][curCol] === null) {
          const bitVal = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          grid[r][curCol] = bitVal === 1;
        }
      }
    }
    dir = -dir; // reverse direction
  }

  // 7. Format Info (Mask 0: (r + c) % 2 === 0, ECC Level M = 00)
  // Format info bit pattern for Level M, Mask 0 with BCH(15, 5): 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Apply Mask 0 to data modules only & Set format bits
  const resultMatrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let isDark = grid[r][c] ?? false;

      // Apply Mask 0 to unreserved modules
      const isReserved =
        (r <= 8 && c <= 8) ||
        (r <= 8 && c >= size - 8) ||
        (r >= size - 8 && c <= 8) ||
        r === 6 ||
        c === 6 ||
        (spec.alignPos.includes(r) && spec.alignPos.includes(c));

      if (!isReserved && (r + c) % 2 === 0) {
        isDark = !isDark;
      }
      resultMatrix[r][c] = isDark;
    }
  }

  // Draw Format Info onto final matrix
  // Top-Left around finder
  const formatCoordsTopLeft: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  formatCoordsTopLeft.forEach(([r, c], i) => {
    resultMatrix[r][c] = formatBits[i] === 1;
  });

  // Top-Right & Bottom-Left around finders
  const formatCoordsOther: [number, number][] = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
  ];
  formatCoordsOther.forEach(([r, c], i) => {
    resultMatrix[r][c] = formatBits[i] === 1;
  });

  return resultMatrix;
}
