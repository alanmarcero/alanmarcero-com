import fs from 'fs';
import path from 'path';
import { HOME_LINKS, PAGES, SITE_NAV, UNLISTED_PAGES } from './pages';

const UNLISTED_HREFS = ['/neworleans', '/flights', '/stocks'];

describe('unlisted pages', () => {
  it('keeps New Orleans, Flights, and Stocks deployed but out of every index', () => {
    expect(UNLISTED_PAGES.map((page) => page.href).sort()).toEqual([...UNLISTED_HREFS].sort());
    UNLISTED_PAGES.forEach((page) => {
      expect(page.unlisted).toBe(true);
    });

    const listedHrefs = [...SITE_NAV, ...HOME_LINKS].map((page) => page.href);
    UNLISTED_HREFS.forEach((href) => {
      expect(listedHrefs).not.toContain(href);
    });

    expect(SITE_NAV.map((page) => page.label)).toEqual([
      'Home',
      'Plugins',
      'Patches',
      'Music',
      'Contact',
    ]);
    expect(PAGES.filter((page) => !page.unlisted).map((page) => page.id)).toEqual(
      SITE_NAV.map((page) => page.id),
    );
  });

  it('leaves them out of the sitemap, disallows them, and keeps noindex', () => {
    const root = path.resolve(__dirname, '../..');
    const sitemap = fs.readFileSync(path.join(root, 'public/sitemap.xml'), 'utf8');
    const robots = fs.readFileSync(path.join(root, 'public/robots.txt'), 'utf8');
    const heads = [
      'pages/neworleans/index.html',
      'pages/neworleans/tours.html',
      'pages/flights/index.html',
      'pages/stocks/index.html',
    ].map((file) => fs.readFileSync(path.join(root, file), 'utf8'));

    UNLISTED_HREFS.forEach((href) => {
      expect(sitemap).not.toContain(`https://alanmarcero.com${href}`);
      expect(robots).toContain(`Disallow: ${href}`);
    });
    heads.forEach((html) => {
      expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
    });
  });
});
