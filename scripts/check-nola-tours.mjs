#!/usr/bin/env node
/* Validator for neworleans-tours.html. Run: node scripts/check-nola-tours.js
   Checks the invariants that matter on this page:
   - every card carries a dated verification state (.vfy or .unver)
   - every retracted figure is wrapped in <s class="retracted"> so price scrapes can exclude it
   - every internal #anchor resolves
   - every filter chip's data-filter matches at least one card's data-tags
   - the master matrix row count matches the number of numbered tour cards
   - no unescaped bare ampersands, no duplicate ids, tag balance */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'neworleans-tours.html');
const html = fs.readFileSync(file, 'utf8');
/* Comments are not markup a reader ever sees, and "CATEGORY 4: PACKAGES & COMBOS"
   is not a bare-ampersand bug. Strip them before the character-level checks. */
const body = html.replace(/<!--[\s\S]*?-->/g, '');
/* <style> and <script> bodies are not markup. A CSS comment explaining what
   display:flex did to an inline <b> is prose about a tag, not a tag, and a
   naive tag-balance walk reads it as an unclosed element. Blank the contents
   but keep the wrapper tags so the balance check still sees them open/close. */
const markup = body.replace(
  /(<(style|script)\b[^>]*>)[\s\S]*?(<\/\2>)/gi,
  (m, open, tag, close) => open + close
);
const problems = [];
const notes = [];

const fail = (m) => problems.push(m);
const note = (m) => notes.push(m);

/* ---------- cards ---------- */
const cardRe = /<div class="tcard[^"]*"[\s\S]*?(?=\n      <\/div>\n    <\/div>|<!--|<\/div>\s*<\/div>\s*<\/div>)/g;
const cardBlocks = html.split(/<div class="tcard/).slice(1);
note(`cards found: ${cardBlocks.length}`);

cardBlocks.forEach((block, i) => {
  const nameMatch = block.match(/class="tname">([^<]+)/);
  const name = nameMatch ? nameMatch[1].trim() : `card #${i + 1}`;
  if (!/class="vfy"|class="unver"/.test(block)) fail(`no dated verification state: ${name}`);
});

/* ---------- photo assignment ---------- */
/* The insertion script once used html.indexOf(match) instead of the match
   offset, and because plain cards open with byte-identical markup, twelve of
   them silently inherited one swamp photo. Nothing about that page was
   invalid -- it just quietly lied. Assert the shape that failure had. */
const photoUse = new Map();
cardBlocks.forEach((block, i) => {
  const nameMatch = block.match(/class="tname">([^<]+)/);
  const name = nameMatch ? nameMatch[1].trim() : `card #${i + 1}`;
  const photo = block.match(/tphoto has-img" style="background-image:url\(([^)]+)\)/);
  if (!photo) { fail(`no photo: ${name}`); return; }
  const list = photoUse.get(photo[1]) || [];
  list.push(name);
  photoUse.set(photo[1], list);
});
photoUse.forEach((names, src) => {
  if (names.length > 3) fail(`${names.length} cards share ${src}: ${names.slice(0, 4).join(', ')}…`);
});
note(`distinct photos: ${photoUse.size} across ${cardBlocks.length} cards`);

/* ---------- retracted figures ---------- */
const strikes = html.match(/<s(?![a-z])[^>]*>/g) || [];
strikes.forEach((s) => {
  if (!/class="retracted"/.test(s)) fail(`<s> without class="retracted": ${s}`);
});
note(`retracted figures: ${strikes.length}`);

/* ---------- anchors ---------- */
const ids = new Set();
const dupes = [];
for (const m of html.matchAll(/\sid="([^"]+)"/g)) {
  if (ids.has(m[1])) dupes.push(m[1]);
  ids.add(m[1]);
}
if (dupes.length) fail(`duplicate ids: ${dupes.join(', ')}`);
for (const m of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.has(m[1])) fail(`dangling anchor: #${m[1]}`);
}

/* ---------- filter chips ---------- */
const chipFilters = [...html.matchAll(/data-filter="([^"]+)"/g)].map((m) => m[1]);
const cardTags = new Set();
for (const m of html.matchAll(/data-tags="([^"]+)"/g)) {
  m[1].split(/\s+/).filter(Boolean).forEach((t) => cardTags.add(t));
}
[...new Set(chipFilters)].forEach((f) => {
  if (f !== 'all' && !cardTags.has(f)) fail(`filter chip "${f}" matches no card`);
});
[...cardTags].forEach((t) => {
  if (!chipFilters.includes(t)) note(`card tag "${t}" has no chip (fine if intentional)`);
});

/* ---------- matrix rows vs numbered cards ---------- */
const tnums = [...html.matchAll(/class="tnum">(?:Tour|Package) #(\d+)</g)].map((m) => +m[1]);
const matrixRows = [...html.matchAll(/<tr>\s*<td>(\d+)<\/td>/g)].map((m) => +m[1]);
const missingRows = tnums.filter((n) => !matrixRows.includes(n));
const orphanRows = matrixRows.filter((n) => !tnums.includes(n));
if (missingRows.length) fail(`numbered cards with no matrix row: ${missingRows.join(', ')}`);
if (orphanRows.length) fail(`matrix rows with no card: ${orphanRows.join(', ')}`);
note(`numbered cards: ${tnums.length}, matrix rows: ${matrixRows.length}`);

/* ---------- bare ampersands ---------- */
const bare = [...body.matchAll(/&(?!#?\w{1,8};)/g)];
if (bare.length) {
  const lines = bare.slice(0, 6).map((m) => body.slice(0, m.index).split('\n').length);
  fail(`${bare.length} bare & (first on lines ${lines.join(', ')})`);
}

/* ---------- external links ---------- */
const ext = [...html.matchAll(/href="(https?:\/\/[^"]+)"([^>]*)>/g)];
ext.forEach(([, url, attrs]) => {
  if (/target="_blank"/.test(attrs) && !/rel="[^"]*noopener/.test(attrs)) {
    fail(`target=_blank without rel=noopener: ${url}`);
  }
});
note(`external links: ${ext.length}`);

/* ---------- tag balance ---------- */
const voids = new Set(['br','img','input','meta','link','hr','path','rect','circle','use','source','col','area','base','embed','track','wbr','polygon','line','ellipse','stop','feGaussianBlur']);
const stack = [];
for (const m of markup.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g)) {
  const [, slash, tag, attrs] = m;
  const t = tag.toLowerCase();
  if (voids.has(t) || attrs.trim().endsWith('/')) continue;
  if (t === '!doctype') continue;
  if (!slash) stack.push({ t, at: markup.slice(0, m.index).split('\n').length });
  else {
    const top = stack.pop();
    if (!top || top.t !== t) {
      fail(`tag mismatch: </${t}> at line ${markup.slice(0, m.index).split('\n').length} closes ${top ? `<${top.t}> from line ${top.at}` : 'nothing'}`);
      break;
    }
  }
}
if (stack.length) fail(`unclosed tags: ${stack.slice(-5).map((s) => `<${s.t}>@${s.at}`).join(', ')}`);

/* ---------- report ---------- */
notes.forEach((n) => console.log(`  · ${n}`));
if (problems.length) {
  console.log(`\n✗ ${problems.length} problem(s):`);
  problems.forEach((p) => console.log(`  ✗ ${p}`));
  process.exit(1);
}
console.log('\n✓ neworleans-tours.html passes');
