// Proof of work for the contact form: find a nonce whose SHA-256 over the
// message starts with CONTACT_POW_BITS zero bits. Must match stampInput() in
// contact.ts byte for byte. Costs a browser about a second; costs a spammer
// that second for every message.
import { CONTACT_POW_BITS } from '../config';

const BATCH = 256;

export const stampInput = ({ ts, name, email, message, nonce }) =>
  [ts, name, email, message, nonce].join('\n');

export const leadingZeroBits = (bytes) => {
  let bits = 0;
  for (const byte of bytes) {
    if (byte === 0) {
      bits += 8;
      continue;
    }
    return bits + Math.clz32(byte) - 24;
  }
  return bits;
};

const digest = async (subtle, text) => new Uint8Array(await subtle.digest('SHA-256', new TextEncoder().encode(text)));

export const sha256Hex = async (text, subtle = globalThis.crypto.subtle) =>
  Array.from(await digest(subtle, text), (b) => b.toString(16).padStart(2, '0')).join('');

// Hashes in batches so the browser can run digests concurrently.
export async function mintStamp(fields, { bits = CONTACT_POW_BITS, subtle = globalThis.crypto.subtle } = {}) {
  for (let start = 0; ; start += BATCH) {
    const nonces = Array.from({ length: BATCH }, (_, i) => start + i);
    const hashes = await Promise.all(nonces.map((nonce) => digest(subtle, stampInput({ ...fields, nonce }))));
    const hit = hashes.findIndex((h) => leadingZeroBits(h) >= bits);
    if (hit !== -1) return nonces[hit];
  }
}
