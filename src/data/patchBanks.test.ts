import { patchBanks } from './patchBanks';

describe('patchBanks', () => {
  it('each patch bank has required fields', () => {
    patchBanks.forEach((bank) => {
      expect(bank).toHaveProperty('name');
      expect(bank).toHaveProperty('description');
      expect(bank).toHaveProperty('audioDemo');
      expect(bank).toHaveProperty('downloadLink');

      expect(typeof bank.name).toBe('string');
      expect(typeof bank.description).toBe('string');
      expect(typeof bank.downloadLink).toBe('string');
    });
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

  it('audioDemo is always an array', () => {
    patchBanks.forEach((bank) => {
      expect(Array.isArray(bank.audioDemo)).toBe(true);
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
