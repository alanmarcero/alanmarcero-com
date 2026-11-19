// Shared site map. `id` matches `data-page` / the SiteChrome `page` prop.
export const PRIMARY_NAV = [
  { id: 'home', href: '/', label: 'Home' },
  {
    id: 'plugins',
    href: '/plugins',
    label: 'Plugins',
    blurb: 'Beta audio plugins. OpenVST Manager installs and updates them.',
  },
  {
    id: 'patches',
    href: '/patches',
    label: 'Patches',
    blurb: 'Free synthesizer patch banks.',
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
];

export const SECONDARY_NAV = [
  {
    id: 'codex',
    href: '/codex',
    label: 'Codex',
    blurb: 'Patch banks and releases in a catalogue layout.',
  },
  {
    id: 'stocks',
    href: '/stocks',
    label: 'Stocks',
    blurb: 'How far each all-time high fell.',
  },
  {
    id: 'flights',
    href: '/flights',
    label: 'Flights',
    blurb: 'Cheapest nonstop round trips from Boston.',
  },
  {
    id: 'neworleans',
    href: '/neworleans',
    label: 'New Orleans',
    blurb: 'A five-night family itinerary.',
  },
];

export const SITE_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export const HOME_LINKS = SITE_NAV.filter((item) => item.id !== 'home');
