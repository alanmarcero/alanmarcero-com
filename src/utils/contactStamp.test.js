import { webcrypto, createHash } from 'crypto';
import { mintStamp, sha256Hex, stampInput, leadingZeroBits } from './contactStamp';
import { CONTACT_POW_BITS } from '../config';
import { POW_BITS } from '../../contact';

const subtle = webcrypto.subtle;
const fields = { ts: 1_800_000_000_000, name: 'Ada', email: 'ada@example.com', message: 'Hello there, friend.' };

describe('contactStamp', () => {
  it('uses the same difficulty as the Lambda', () => {
    expect(CONTACT_POW_BITS).toBe(POW_BITS);
  });

  it('counts leading zero bits', () => {
    expect(leadingZeroBits([0, 0, 0x80])).toBe(16);
    expect(leadingZeroBits([0, 0x0f])).toBe(12);
    expect(leadingZeroBits([0xff])).toBe(0);
    expect(leadingZeroBits([0, 0])).toBe(16);
  });

  // Full difficulty takes seconds under a loaded test run; 10 bits proves the
  // same agreement with Node's hash, and the test above pins the real value.
  it('mints a nonce whose Node SHA-256 meets the difficulty', async () => {
    const nonce = await mintStamp(fields, { bits: 10, subtle });
    const digest = createHash('sha256').update(stampInput({ ...fields, nonce })).digest();
    expect(leadingZeroBits(digest)).toBeGreaterThanOrEqual(10);
  });

  it('hex-encodes a SHA-256', async () => {
    expect(await sha256Hex('abc', subtle)).toBe(createHash('sha256').update('abc').digest('hex'));
  });
});
