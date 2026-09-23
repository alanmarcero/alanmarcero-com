import { patchBanks } from './patchBanks';

describe('patchBanks', () => {
  // Guards every per-bank test below: they all iterate the catalog, so an
  // empty catalog would let the whole suite pass while asserting nothing.
  it('ships a non-empty catalog', () => {
    expect(patchBanks.length).toBeGreaterThan(0);
  });

  it('download links point to /banks/ directory', () => {
    patchBanks.forEach((bank) => {
      expect(bank.downloadLink).toMatch(/^\/banks\/.+\.zip$/);
    });
  });

  it('count, when present, is a positive integer', () => {
    patchBanks.forEach((bank) => {
      if ('count' in bank) {
        expect(Number.isInteger(bank.count)).toBe(true);
        expect(bank.count).toBeGreaterThan(0);
      }
    });
  });

  it('audioDemo entries contain valid YouTube video IDs', () => {
    const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/;

    patchBanks.forEach((bank) => {
      bank.audioDemo.forEach((videoId) => {
        expect(videoId).toMatch(youtubeIdPattern);
      });
    });
  });
});
