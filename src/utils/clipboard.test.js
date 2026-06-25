/**
 * @jest-environment jsdom
 */
import { copyToClipboard } from "./clipboard";

describe("copyToClipboard", () => {
  afterEach(() => {
    delete navigator.clipboard;
    delete document.execCommand; // jsdom has no native execCommand to restore
  });

  it("uses the async Clipboard API when available", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    navigator.clipboard = { writeText };

    const ok = await copyToClipboard("https://example.com/#snake");

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://example.com/#snake");
  });

  it("falls back to execCommand when the Clipboard API rejects", async () => {
    navigator.clipboard = { writeText: jest.fn().mockRejectedValue(new Error("denied")) };
    document.execCommand = jest.fn().mockReturnValue(true);

    const ok = await copyToClipboard("text");

    expect(ok).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("falls back to execCommand when the Clipboard API is absent", async () => {
    document.execCommand = jest.fn().mockReturnValue(true);

    const ok = await copyToClipboard("text");

    expect(ok).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("returns false when the legacy copy command fails", async () => {
    document.execCommand = jest.fn().mockReturnValue(false);

    const ok = await copyToClipboard("text");

    expect(ok).toBe(false);
  });
});
