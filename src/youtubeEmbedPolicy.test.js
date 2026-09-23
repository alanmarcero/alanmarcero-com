import fs from "node:fs";
import path from "node:path";

// The redesigned pages each draw their own player, and two of them once
// shipped without a sandbox. Scanning the source catches the next one.
const ROOT = path.join(__dirname, "..");
const SOURCE_DIRS = ["src", "pages"];

const sourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : sourceFiles(full);
    return /\.jsx?$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : [];
  });

const iframeTags = (text) => text.match(/<iframe\b[\s\S]*?\/?>/g) ?? [];

const embeds = SOURCE_DIRS
  .flatMap((dir) => sourceFiles(path.join(ROOT, dir)))
  .flatMap((file) => iframeTags(fs.readFileSync(file, "utf8"))
    .map((tag) => [path.relative(ROOT, file), tag]));

describe("YouTube embed policy", () => {
  it("finds the players it is guarding", () => {
    expect(embeds.length).toBeGreaterThanOrEqual(4);
  });

  it.each(embeds)("%s uses the shared sandbox and permissions", (_file, tag) => {
    expect(tag).toContain("sandbox={YOUTUBE_EMBED_SANDBOX}");
    expect(tag).toContain("allow={YOUTUBE_EMBED_ALLOW}");
  });
});
