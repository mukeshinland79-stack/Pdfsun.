/**
 * Binary buffer narrowing utilities for ArrayBuffer / BlobPart compatibility.
 * Zero-copy when backed by a standard ArrayBuffer; copies safely only if backed by SharedArrayBuffer.
 */
export function toStrictUint8Array(bytes: Uint8Array): Uint8Array {
  if (bytes.buffer instanceof ArrayBuffer) {
    return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

export function toBlobPart(part: BlobPart | Uint8Array): BlobPart {
  return part instanceof Uint8Array ? toStrictUint8Array(part) : part;
}

export function toStrictArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (bytes.buffer instanceof ArrayBuffer) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}
