import fs from 'fs';
import path from 'path';

import { plates, plateFor, credits, srcSetFor, sourceFor } from './plates';
import { patchBanks } from '../../../../src/data/patchBanks';

const PLATE_DIR = path.join(__dirname, '..', '..', 'assets', 'plates');

// The generator refuses anything outside this set, so the shipped data must
// not contain anything outside it either.
const ALLOWED_LICENCE = /^(CC BY(-SA)? \d|CC0|Public domain)/i;

// The three register entries that have no photograph on purpose. A commit
// that quietly gives one of them a lookalike should fail here.
const DRAWN_INSTEAD = ['Roland SH-01A', 'Waves CODEX', 'Audio Demo MIDIs'];

const entries = Object.entries(plates);

describe('plates', () => {
  it('keys every plate on a bank name that exists in the catalogue', () => {
    const catalogue = patchBanks.map((bank) => bank.name);
    entries.forEach(([bank]) => expect(catalogue).toContain(bank));
  });

  it('leaves the three unphotographable banks without a plate', () => {
    DRAWN_INSTEAD.forEach((bank) => expect(plateFor(bank)).toBeNull());
    expect(entries).toHaveLength(patchBanks.length - DRAWN_INSTEAD.length);
  });

  it('carries a licence that permits commercial use and modification', () => {
    entries.forEach(([, plate]) => expect(plate.licence).toMatch(ALLOWED_LICENCE));
  });

  it('credits an author for every plate', () => {
    entries.forEach(([, plate]) => {
      expect(plate.author).toBeTruthy();
      expect(plate.author).not.toBe('Unknown');
    });
  });

  it("preserves the Slim Phatty's two-step derivative chain", () => {
    // CC requires the whole chain, so this attribution names both the
    // original photographer and the editor who cropped it.
    const phatty = plateFor('Moog Slim Phatty and Little Phatty');
    expect(phatty.author).toMatch(/Pete Brown/);
    expect(phatty.author).toMatch(/Clusternote/);
  });

  it('links back to the Commons file page it came from', () => {
    entries.forEach(([, plate]) => {
      expect(plate.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    });
  });

  it('names the machine that is really in the frame, not the bank', () => {
    // The Nord Lead 2X bank's photograph is a Nord Rack 2. Fudging that in
    // the alt text is the failure this guards.
    expect(plateFor('Nord Lead 2X, Nord Lead 2, DiscoDSP Discovery Pro').alt)
      .toMatch(/Nord Rack 2/);
    entries.forEach(([, plate]) => {
      expect(plate.alt).not.toMatch(/^(an? )?(image|photo|picture) of/i);
    });
  });

  it('records ascending widths, the widest of which is the recorded size', () => {
    entries.forEach(([, plate]) => {
      expect(plate.widths.length).toBeGreaterThan(0);
      expect([...plate.widths].sort((a, b) => a - b)).toEqual(plate.widths);
      expect(new Set(plate.widths).size).toBe(plate.widths.length);
      expect(plate.width).toBe(plate.widths[plate.widths.length - 1]);
      // Square, because the plate on the page is a circle.
      expect(plate.height).toBe(plate.width);
    });
  });
});

describe('the files on disk', () => {
  it('exists at every width the data advertises, and at no other', () => {
    entries.forEach(([, plate]) => {
      plate.widths.forEach((width) => {
        const file = path.join(PLATE_DIR, `${plate.slug}-${width}.webp`);
        expect(fs.existsSync(file)).toBe(true);
        expect(fs.statSync(file).size).toBeGreaterThan(0);
      });
    });

    const declared = entries.flatMap(([, plate]) =>
      plate.widths.map((width) => `${plate.slug}-${width}.webp`));
    expect(fs.readdirSync(PLATE_DIR).filter((f) => f.endsWith('.webp')).sort())
      .toEqual([...declared].sort());
  });
});

describe('srcSetFor / sourceFor', () => {
  it('describes each candidate with the width it really is', () => {
    const plate = plateFor('Sequential Prophet 08 and Rev2');
    expect(srcSetFor(plate)).toBe(
      '/pages/opus-max-mac/assets/plates/prophet-08-320.webp 320w, '
      + '/pages/opus-max-mac/assets/plates/prophet-08-640.webp 640w',
    );
  });

  it('offers a single candidate when only one derivative exists', () => {
    // The JP-08 original is 600x281, so its square crop is 281px and there
    // is nothing to build a second candidate from.
    const plate = plateFor('Roland JP-08');
    expect(plate.widths).toEqual([281]);
    expect(srcSetFor(plate)).toBe('/pages/opus-max-mac/assets/plates/jp-08-281.webp 281w');
  });

  it('falls back to the widest derivative', () => {
    entries.forEach(([, plate]) => {
      expect(sourceFor(plate)).toBe(`/pages/opus-max-mac/assets/plates/${plate.slug}-${plate.width}.webp`);
    });
  });
});

describe('credits', () => {
  it('names the bank alongside everything the licence requires', () => {
    expect(credits).toHaveLength(entries.length);
    credits.forEach((credit) => {
      expect(credit.bank).toBeTruthy();
      expect(credit).toMatchObject({
        author: expect.any(String),
        licence: expect.any(String),
        source: expect.any(String),
      });
    });
  });
});
