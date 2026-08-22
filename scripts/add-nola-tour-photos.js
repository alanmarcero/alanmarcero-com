#!/usr/bin/env node
/* Put one photograph at the head of every .tcard on neworleans-tours.html.
   Idempotent: a card that already carries a .tphoto is left alone, so this can
   be re-run after new cards are added.

   Run: node scripts/add-nola-tour-photos.js
   Then: node scripts/check-nola-tours.js

   PHOTOS maps the card's .tname text (as it appears in the HTML, entities and
   curly apostrophes included) to an image path and the emoji to show if the
   image ever 404s. Anything unmapped is reported and left without a photo
   rather than given a stand-in — a generic swamp shot on a food-tour card is
   worse than no shot, because it reads as evidence. */
const fs = require('fs');
const path = require('path');

const T = '/neworleans-tours';
const D = '/neworleans-do';

const PHOTOS = {
  // ---- verified deals ----
  'Nola Tour Guy — French Quarter &amp; St. Louis Cemetery': [`${T}/nola-tour-guy.jpg`, '🚶'],
  'Free Tours by Foot — small-group walks': [`${T}/free-tours-by-foot.jpg`, '🚶'],
  'Garden District — book direct, not through Viator': [`${T}/legendary-garden-district.jpg`, '🌳'],
  'St. Louis Cemetery No. 1 — official tour': [`${D}/st-louis-cemetery-no-1-tour.jpg`, '⚰️'],
  'Steamboat Natchez — daytime jazz cruise': [`${D}/steamboat-natchez-jazz-cruise.jpg`, '🚢'],
  'Go City New Orleans — All-Inclusive Pass': [`${T}/go-city-nola.jpg`, '🎟️'],
  'New Orleans School of Cooking — demo class': [`${D}/new-orleans-school-of-cooking.jpg`, '🍲'],

  // ---- swamp ----
  'Cajun Encounters Swamp Tour': [`${T}/cajun-encounters.jpg`, '🐊'],
  'Jean Lafitte Swamp Tour': [`${T}/jean-lafitte-swamp.jpg`, '🐊'],
  'Cajun Pride Swamp Tours': [`${T}/cajun-pride-swamp.jpg`, '🐊'],
  'Airboat Adventures': [`${T}/airboat-adventures.jpg`, '💨'],
  'Dr. Wagner’s Honey Island Swamp Tour': [`${T}/dr-wagner-honey-island.jpg`, '🐊'],
  'Ultimate Swamp Adventures': [`${T}/ultimate-swamp-adventures.jpg`, '🌲'],
  'Gray Line Standalone Swamp &amp; Bayou': [`${T}/gray-line-swamp.jpg`, '🐊'],

  // ---- French Quarter food ----
  'Doctor Gumbo Food &amp; History Tour': [`${D}/doctor-gumbo-food-history-tour.jpg`, '🍲'],
  'Tastebud Tours - Flavor of New Orleans': [`${D}/tastebud-tours-food-tour.jpg`, '🥪'],
  'Sidewalk Food Tours (French Quarter)': [`${T}/sidewalk-food-tours.jpg`, '🍴'],
  'Devour Tours - French Quarter Culinary Walk': [`${D}/devour-new-orleans-food-tour.jpg`, '🍴'],
  'Destination Kitchen Food &amp; Culture Tour': [`${D}/destination-kitchen-food-tour.jpg`, '🍛'],
  'New Orleans Secrets - Hidden Culinary Tour': [`${T}/nola-secrets.jpg`, '🍸'],

  // ---- Garden District ----
  'Sidewalk Food Tours - Lower Garden District': [`${T}/sidewalk-food-tours.jpg`, '🍴'],
  'Bon Moment Garden District Walk &amp; Food': [`${T}/legendary-garden-district.jpg`, '🏛️'],
  'Confederacy of Cruisers Culinary Crawl': [`${T}/confederacy-of-cruisers.jpg`, '🚲'],
  'Free Tours by Foot (Garden District &amp; Bites)': [`${T}/free-tours-by-foot.jpg`, '🚶'],

  // ---- packages ----
  'Go City New Orleans All-Inclusive Pass': [`${T}/go-city-nola.jpg`, '🎟️'],
  'New Orleans School of Cooking Demo &amp; Meal': [`${D}/new-orleans-school-of-cooking.jpg`, '🍲'],
  'Private Chauffeured Swamp &amp; Dining Day for 4': [`${T}/cajun-encounters.jpg`, '🚐'],
};

const file = path.join(__dirname, '..', 'neworleans-tours.html');
let html = fs.readFileSync(file, 'utf8');

/* every photo path must exist on disk before it is written into the page */
const publicDir = path.join(__dirname, '..', 'public');
const missingFiles = [...new Set(Object.values(PHOTOS).map(([p]) => p))]
  .filter((p) => !fs.existsSync(path.join(publicDir, p.replace(/^\//, ''))));
if (missingFiles.length) {
  console.error('missing image files:\n' + missingFiles.map((m) => `  ✗ public${m}`).join('\n'));
  process.exit(1);
}

let added = 0;
const unmapped = [];

/* Insert the photo as the first child of the card's first inner <div>, i.e.
   immediately before the .tnum chip. The CSS pulls it out to the card edges
   with negative margins, the same trick .et-photo uses on the base page. */
html = html.replace(
  /(<div class="tcard[^"]*"[^>]*>\s*)((?:<span class="badge-top"[^>]*>[\s\S]*?<\/span>\s*)?)(<div>\s*)(<span class="tnum">)/g,
  (match, open, badge, innerOpen, tnum, offset) => {
    /* The offset argument, NOT html.indexOf(match). Card markup repeats
       verbatim -- every plain card opens with the same three lines -- so
       indexOf returns the FIRST such card every time and twelve cards
       silently inherited the ninth card's photograph. */
    const after = html.slice(offset + match.length);
    const nameMatch = after.match(/class="tname">([\s\S]*?)<\/div>/);
    const name = nameMatch ? nameMatch[1].trim() : null;
    if (!name || !PHOTOS[name]) {
      if (name) unmapped.push(name);
      return match;
    }
    if (match.includes('tphoto')) return match;
    const [src, emoji] = PHOTOS[name];
    added++;
    return `${open}${badge}${innerOpen}<span class="tphoto has-img" style="background-image:url(${src})" role="presentation"><span class="tph-emoji">${emoji}</span></span>\n          ${tnum}`;
  }
);

if (html.includes('class="tphoto')) {
  const css = `  .tcard .tphoto{position:relative;display:block;height:168px;margin:-1.1rem -1.25rem .85rem;
    border-radius:14px 14px 0 0;background:linear-gradient(135deg,var(--brass-soft),var(--green-soft));
    background-size:cover;background-position:center;overflow:hidden}
  .tcard .tphoto .tph-emoji{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.6rem;opacity:.45}
  .tcard .tphoto.has-img .tph-emoji{display:none}
  .tcard .tphoto::after{content:"";position:absolute;inset:auto 0 0 0;height:38%;
    background:linear-gradient(180deg,transparent,rgba(10,14,8,.28))}
  @media (max-width:520px){.tcard .tphoto{height:140px}}
`;
  if (!html.includes('.tcard .tphoto{')) {
    html = html.replace(
      /(  \.tcard \.tnum\{)/,
      `${css}$1`
    );
  }
}

fs.writeFileSync(file, html);
console.log(`photos added: ${added}`);
if (unmapped.length) {
  console.log('cards with no mapped photo (add them to PHOTOS):');
  [...new Set(unmapped)].forEach((n) => console.log(`  ✗ ${n}`));
}
