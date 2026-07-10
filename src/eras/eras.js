/**
 * "Take Me Back" eras — visual skins applied to today's content.
 *
 * Each era is a theme, not a content snapshot: the same React app (patch banks,
 * music, search, downloads) is re-styled to look like a past version of
 * alanmarcero.com. Years for 2007/2014/2020 come from real Wayback Machine
 * captures; 2001 is an estimated "what if it had a GeoCities page" era.
 */

export const DEFAULT_ERA = 'present';

export const ERAS = [
  {
    id: 'present',
    year: 'Today',
    label: 'Present',
    blurb: 'Hard Outrun CRT',
    source: 'live',
  },
  {
    id: 'y2001',
    year: '2001',
    label: 'GeoCities',
    blurb: 'Under construction!!!',
    source: 'estimated',
  },
  {
    id: 'y2007',
    year: '2007',
    label: 'Web 1.0',
    blurb: 'Web developer & music producer',
    source: 'archive',
  },
  {
    id: 'y2014',
    year: '2014',
    label: 'Patch Store',
    blurb: 'Name your price',
    source: 'archive',
  },
  {
    id: 'y2020',
    year: '2020',
    label: 'AM Sounds',
    blurb: 'EDM synth patches',
    source: 'archive',
  },
];

// Eras the visitor can travel to (everything except the present).
export const PAST_ERAS = ERAS.filter((era) => era.id !== DEFAULT_ERA);

export const isEra = (id) => ERAS.some((era) => era.id === id);

export const getEra = (id) => ERAS.find((era) => era.id === id) || null;
