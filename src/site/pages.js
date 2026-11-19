// Shared site map. `id` matches `data-page` / the SiteChrome `page` prop.
// `unlisted` pages stay deployed at `href` but are excluded from nav, the home
// directory, and any index built from this list. See AGENTS.md.
import { YOUTUBE_CHANNEL_URL } from '../config';

export const PAGES = [
  { id: 'home', href: '/', label: 'Home' },
  {
    id: 'plugins',
    href: '/plugins',
    label: 'Plugins',
    blurb: 'Beta audio plugins. OpenVST Manager installs and updates them.',
  },
  {
    id: 'music',
    href: '/music',
    label: 'Music',
    blurb: 'Tracks and remixes.',
  },
  {
    id: 'contact',
    href: '/contact',
    label: 'Contact',
    blurb: 'Send a note.',
  },
  {
    id: 'stocks',
    href: '/stocks',
    label: 'Stocks',
    blurb: 'How far each all-time high fell.',
    unlisted: true,
  },
  {
    id: 'flights',
    href: '/flights',
    label: 'Flights',
    blurb: 'Cheapest nonstop round trips from Boston.',
    unlisted: true,
  },
  {
    id: 'neworleans',
    href: '/neworleans',
    label: 'New Orleans',
    blurb: 'A five-night family itinerary.',
    unlisted: true,
  },
];

const listed = (page) => !page.unlisted;

export const UNLISTED_PAGES = PAGES.filter((page) => page.unlisted);
export const PRIMARY_NAV = PAGES.filter((page) => listed(page) && page.group !== 'secondary');
export const SECONDARY_NAV = PAGES.filter((page) => listed(page) && page.group === 'secondary');
export const SITE_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];
export const HOME_LINKS = SITE_NAV.filter((item) => item.id !== 'home');

// External destinations shown in the header, not in the home directory or sitemap.
export const EXTERNAL_NAV = [
  {
    id: 'youtube',
    href: YOUTUBE_CHANNEL_URL,
    label: 'YouTube',
    external: true,
  },
];
