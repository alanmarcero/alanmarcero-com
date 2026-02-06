import { patchBanks } from './patchBanks';

describe('patchBanks', () => {
  it('exports an array', () => {
    expect(Array.isArray(patchBanks)).toBe(true);
  });

  it('has at least one patch bank', () => {
    expect(patchBanks.length).toBeGreaterThan(0);
  });

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
