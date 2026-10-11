import { createHash } from "crypto";
import type { SESv2Client } from "@aws-sdk/client-sesv2";
import type { APIGatewayProxyResult } from "aws-lambda";

// The recipient never appears in the repo or the page bundle: the deploy
// workflow copies the CONTACT_EMAIL GitHub secret into the Lambda environment.
// The sender is a verified SES identity on the site's own domain.
const DEFAULT_FROM = "alanmarcero.com contact form <contact@alanmarcero.com>";

// Spam defences, in the order the handler applies them:
//   origin      — the browser's Origin must be this site
//   honeypot    — a field humans never see; a filled one is a bot
//   fill time   — a form completed faster than a person could type it
//   stamp       — proof of work bound to the message: costs a browser about a
//                 second, makes sending thousands of messages expensive
//   freshness   — the stamp's timestamp must be recent (no stockpiling)
//   replay      — the same stamp is accepted once per container
//   rate limit  — a few messages per IP per window, per container
//   content     — length caps and a link limit
// Bot-detected submissions get the same 200 a real one does, so a bot learns
// nothing from the response.
export const POW_BITS = 16;
const MIN_FILL_MS = 3_000;
const MAX_STAMP_AGE_MS = 15 * 60_000;
const MAX_CLOCK_SKEW_MS = 60_000;
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 3;
const MAX_LINKS = 2;

const LIMITS = { name: 100, email: 254, message: 5000 } as const;
const MIN_MESSAGE = 10;

const ALLOWED_ORIGINS = new Set([
  "https://alanmarcero.com",
  "https://www.alanmarcero.com",
  "http://localhost:5173",
]);

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
const LINK_RE = /https?:\/\/|www\./gi;

const HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

export interface ContactEvent {
  body?: string | null;
  isBase64Encoded?: boolean;
  headers?: Record<string, string | undefined>;
  requestContext?: { http?: { sourceIp?: string } };
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  website: string;
  elapsedMs: number;
  ts: number;
  nonce: number;
}

export type SendMail = (args: { from: string; to: string; replyTo: string; subject: string; text: string }) => Promise<void>;

const respond = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: HEADERS,
  body: JSON.stringify(body),
});
const OK = () => respond(200, { ok: true });
const reject = (statusCode: number, error: string) => respond(statusCode, { error });

// Must match src/utils/contactStamp.js byte for byte.
export const stampInput = (p: Pick<ContactPayload, "name" | "email" | "message" | "ts" | "nonce">): string =>
  [p.ts, p.name, p.email, p.message, p.nonce].join("\n");

export const leadingZeroBits = (digest: Buffer): number => {
  let bits = 0;
  for (const byte of digest) {
    if (byte === 0) {
      bits += 8;
      continue;
    }
    return bits + Math.clz32(byte) - 24;
  }
  return bits;
};

export const stampIsValid = (p: ContactPayload): boolean =>
  leadingZeroBits(createHash("sha256").update(stampInput(p)).digest()) >= POW_BITS;

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const asNumber = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : NaN);

export const parsePayload = (event: ContactEvent): ContactPayload | null => {
  if (!event.body) return null;
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  return {
    name: asString(data.name).trim(),
    email: asString(data.email).trim(),
    message: asString(data.message).trim(),
    website: asString(data.website),
    elapsedMs: asNumber(data.elapsedMs),
    ts: asNumber(data.ts),
    nonce: asNumber(data.nonce),
  };
};

// Validation failures a person can fix; returned as a message they can read.
export const validationError = (p: ContactPayload): string | null => {
  if (!p.name || p.name.length > LIMITS.name) return "Please enter your name.";
  if (p.email.length > LIMITS.email || !EMAIL_RE.test(p.email)) return "Please enter a valid email address.";
  if (p.message.length < MIN_MESSAGE) return "Your message is a little short.";
  if (p.message.length > LIMITS.message) return "Your message is too long.";
  if ((p.message.match(LINK_RE) ?? []).length > MAX_LINKS) return "Please include no more than two links.";
  return null;
};

const header = (event: ContactEvent, name: string): string | undefined => {
  const headers = event.headers ?? {};
  return headers[name] ?? Object.entries(headers).find(([k]) => k.toLowerCase() === name)?.[1];
};

// CloudFront forwards the viewer's address in CloudFront-Viewer-Address
// ("ip:port"); behind it, the Function URL's sourceIp is the edge's.
export const clientIp = (event: ContactEvent): string => {
  const viewer = header(event, "cloudfront-viewer-address");
  if (viewer) return viewer.slice(0, viewer.lastIndexOf(":")) || viewer;
  return event.requestContext?.http?.sourceIp ?? "unknown";
};

// Per-container memory: a warm Lambda keeps it, a cold one starts clean.
// Best effort by design — the stamp is the defence that holds across containers.
const recentByIp = new Map<string, number[]>();
const seenStamps = new Map<string, number>();

export const resetContactState = (): void => {
  recentByIp.clear();
  seenStamps.clear();
};

const rateLimited = (ip: string, now: number): boolean => {
  const recent = (recentByIp.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    recentByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  recentByIp.set(ip, recent);
  return false;
};

const replayed = (p: ContactPayload, now: number): boolean => {
  for (const [key, at] of seenStamps) if (now - at > MAX_STAMP_AGE_MS) seenStamps.delete(key);
  const key = `${p.ts}:${p.nonce}:${p.email}`;
  if (seenStamps.has(key)) return true;
  seenStamps.set(key, now);
  return false;
};

// Header values must not carry line breaks or other control characters.
// eslint-disable-next-line no-control-regex
const oneLine = (s: string): string => s.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();

// The SDK ships with the Lambda Node.js runtime, so it is not bundled. It is
// loaded on first send: a playlist request never pays for it, and a problem
// loading it can only break this route.
let sesClient: SESv2Client | undefined;
const sesSend: SendMail = async ({ from, to, replyTo, subject, text }) => {
  const { SESv2Client, SendEmailCommand } = await import("@aws-sdk/client-sesv2");
  sesClient ??= new SESv2Client({});
  await sesClient.send(new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    ReplyToAddresses: [replyTo],
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: { Text: { Data: text, Charset: "UTF-8" } },
      },
    },
  }));
};

export const handleContact = async (
  event: ContactEvent,
  { now = Date.now(), send = sesSend }: { now?: number; send?: SendMail } = {},
): Promise<APIGatewayProxyResult> => {
  const to = process.env.CONTACT_EMAIL;
  if (!to) return reject(503, "Contact form is unavailable.");

  const origin = header(event, "origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return reject(403, "Forbidden");

  const p = parsePayload(event);
  if (!p) return reject(400, "Invalid request.");

  if (p.website) return OK();
  if (!(p.elapsedMs >= MIN_FILL_MS)) return OK();

  if (!Number.isInteger(p.nonce) || !Number.isInteger(p.ts)) return reject(400, "Invalid request.");
  if (now - p.ts > MAX_STAMP_AGE_MS || p.ts - now > MAX_CLOCK_SKEW_MS) {
    return reject(400, "This form has expired. Please reload the page and try again.");
  }
  if (!stampIsValid(p)) return reject(400, "Invalid request.");

  const problem = validationError(p);
  if (problem) return reject(400, problem);

  if (replayed(p, now)) return OK();
  const ip = clientIp(event);
  if (rateLimited(ip, now)) return reject(429, "Too many messages. Please try again later.");

  const name = oneLine(p.name);
  try {
    await send({
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      to,
      replyTo: p.email,
      subject: `Contact form: ${name}`,
      text: `From: ${name} <${p.email}>\nIP: ${ip}\n\n${p.message}\n`,
    });
  } catch (err) {
    console.error("Contact send failed", err);
    return reject(502, "Your message could not be sent. Please try again later.");
  }
  return OK();
};
