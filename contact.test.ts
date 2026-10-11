import { createHash } from "crypto";
import {
  handleContact, resetContactState, stampInput, leadingZeroBits, clientIp, validationError,
  POW_BITS, type ContactPayload, type SendMail,
} from "./contact";
import { handler } from "./index";

const NOW = 1_800_000_000_000;

const mint = (fields: Omit<ContactPayload, "nonce" | "website" | "elapsedMs">): number => {
  for (let nonce = 0; ; nonce++) {
    const digest = createHash("sha256").update(stampInput({ ...fields, nonce })).digest();
    if (leadingZeroBits(digest) >= POW_BITS) return nonce;
  }
};

const BASE = { name: "Ada", email: "ada@example.com", message: "Loved the JP-08 bank, thanks!", ts: NOW - 10_000 };
const GOOD_NONCE = mint(BASE);

const payload = (over: Partial<ContactPayload> = {}): ContactPayload => ({
  ...BASE, website: "", elapsedMs: 20_000, nonce: GOOD_NONCE, ...over,
});

const event = (body: unknown, headers: Record<string, string> = {}) => ({
  body: typeof body === "string" ? body : JSON.stringify(body),
  headers: { origin: "https://alanmarcero.com", "cloudfront-viewer-address": "203.0.113.9:4431", ...headers },
});

let send: jest.MockedFunction<SendMail>;
const run = (e: ReturnType<typeof event>) => handleContact(e, { now: NOW, send });

beforeEach(() => {
  resetContactState();
  process.env.CONTACT_EMAIL = "owner@example.net";
  delete process.env.CONTACT_FROM_EMAIL;
  send = jest.fn().mockResolvedValue(undefined);
});

describe("handleContact", () => {
  it("sends a valid message to the configured recipient with reply-to set", async () => {
    const res = await run(event(payload()));
    expect(res.statusCode).toBe(200);
    expect(res.headers).toEqual({ "Content-Type": "application/json", "Cache-Control": "no-store" });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      to: "owner@example.net",
      replyTo: "ada@example.com",
      subject: "Contact form: Ada",
      from: expect.stringContaining("@alanmarcero.com"),
    }));
    expect(send.mock.calls[0][0].text).toContain(BASE.message);
    expect(send.mock.calls[0][0].text).toContain("203.0.113.9");
  });

  it("never returns the recipient address", async () => {
    const res = await run(event(payload()));
    expect(res.body).not.toContain("owner@example.net");
  });

  it("is unavailable when CONTACT_EMAIL is not configured", async () => {
    delete process.env.CONTACT_EMAIL;
    expect((await run(event(payload()))).statusCode).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects a foreign or missing Origin", async () => {
    expect((await run(event(payload(), { origin: "https://evil.example" }))).statusCode).toBe(403);
    const noOrigin = { body: JSON.stringify(payload()), headers: {} };
    expect((await handleContact(noOrigin, { now: NOW, send })).statusCode).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    expect((await run(event("{nope"))).statusCode).toBe(400);
  });

  it("decodes a base64 body", async () => {
    const e = { ...event(payload()), isBase64Encoded: true };
    e.body = Buffer.from(e.body).toString("base64");
    expect((await handleContact(e, { now: NOW, send })).statusCode).toBe(200);
    expect(send).toHaveBeenCalled();
  });

  it("silently drops a filled honeypot", async () => {
    const res = await run(event(payload({ website: "http://spam.example" })));
    expect(res.statusCode).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it("silently drops a form filled faster than a person could", async () => {
    const res = await run(event(payload({ elapsedMs: 800 })));
    expect(res.statusCode).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects a missing or wrong proof of work", async () => {
    expect((await run(event(payload({ nonce: GOOD_NONCE + 1 })))).statusCode).toBe(400);
    expect((await run(event({ ...payload(), nonce: "x" }))).statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects a stamp bound to a different message", async () => {
    expect((await run(event(payload({ message: "A different message entirely." })))).statusCode).toBe(400);
  });

  it("rejects a stale or future-dated stamp", async () => {
    const stale = { ...BASE, ts: NOW - 16 * 60_000 };
    const future = { ...BASE, ts: NOW + 5 * 60_000 };
    expect((await run(event(payload({ ...stale, nonce: mint(stale) })))).statusCode).toBe(400);
    expect((await run(event(payload({ ...future, nonce: mint(future) })))).statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("accepts a replayed stamp once", async () => {
    await run(event(payload()));
    const res = await run(event(payload()));
    expect(res.statusCode).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("rate-limits one address after three messages", async () => {
    for (let i = 0; i < 3; i++) {
      const f = { ...BASE, message: `${BASE.message} #${i}` };
      expect((await run(event(payload({ ...f, nonce: mint(f) })))).statusCode).toBe(200);
    }
    const f = { ...BASE, message: `${BASE.message} #4` };
    expect((await run(event(payload({ ...f, nonce: mint(f) })))).statusCode).toBe(429);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("strips line breaks from the subject", async () => {
    const f = { ...BASE, name: "Ada\r\nBcc: x@y.z" };
    await run(event(payload({ ...f, nonce: mint(f) })));
    expect(send.mock.calls[0][0].subject).toBe("Contact form: Ada Bcc: x@y.z");
  });

  it("returns a generic 502 when SES fails", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    send.mockRejectedValue(new Error("MessageRejected: owner@example.net not verified"));
    const res = await run(event(payload()));
    expect(res.statusCode).toBe(502);
    expect(res.body).not.toContain("owner@example.net");
    spy.mockRestore();
  });

  it("uses CONTACT_FROM_EMAIL when set", async () => {
    process.env.CONTACT_FROM_EMAIL = "Site <hello@alanmarcero.com>";
    await run(event(payload()));
    expect(send.mock.calls[0][0].from).toBe("Site <hello@alanmarcero.com>");
  });
});

describe("validationError", () => {
  it.each([
    [{ name: "" }, /name/],
    [{ name: "x".repeat(101) }, /name/],
    [{ email: "not-an-email" }, /email/],
    [{ email: "a@b" }, /email/],
    [{ message: "hi" }, /short/],
    [{ message: "x".repeat(5001) }, /long/],
    [{ message: "see http://a.example http://b.example www.c.example" }, /links/],
  ])("rejects %o", (over, pattern) => {
    expect(validationError(payload(over))).toMatch(pattern);
  });

  it("accepts a normal message with a link", () => {
    expect(validationError(payload({ message: "My track: https://example.com/x" }))).toBeNull();
  });
});

describe("clientIp", () => {
  it("reads the viewer address CloudFront forwards, IPv4 and IPv6", () => {
    expect(clientIp({ headers: { "cloudfront-viewer-address": "198.51.100.4:5000" } })).toBe("198.51.100.4");
    expect(clientIp({ headers: { "cloudfront-viewer-address": "2001:db8::1:443" } })).toBe("2001:db8::1");
  });

  it("falls back to the source IP", () => {
    expect(clientIp({ requestContext: { http: { sourceIp: "192.0.2.1" } } })).toBe("192.0.2.1");
  });
});

describe("handler routing", () => {
  it("sends a Function URL POST to /api/contact to the contact handler", async () => {
    process.env.YOUTUBE_API_KEY = "k";
    global.fetch = jest.fn();
    delete process.env.CONTACT_EMAIL;
    const res = await handler({
      rawPath: "/api/contact",
      requestContext: { http: { method: "POST" } },
      headers: {},
      body: "{}",
    });
    expect(res.statusCode).toBe(503);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("keeps GET /api on the playlist", async () => {
    process.env.YOUTUBE_API_KEY = "k";
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    const res = await handler({ rawPath: "/api", requestContext: { http: { method: "GET" } } });
    expect(res.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalled();
  });
});
