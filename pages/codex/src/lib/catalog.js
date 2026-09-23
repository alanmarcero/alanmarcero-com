import { matchesQuery } from '../../../matrix/src/lib/catalog';
import { count } from '../../../matrix/src/lib/format';
import {
  codexImages,
  credits as opusCredits,
  imageFor as opusImageFor,
} from '../../../opus5ios/src/data/synthImages';

/** This route's own photograph where it has one, the /opus5ios one otherwise. */
export const imageFor = (bankName) => codexImages[bankName] || opusImageFor(bankName);

/** One credit per photograph this route actually shows — never both for one bank. */
export const credits = [
  ...opusCredits.filter(({ bank }) => !codexImages[bank]),
  ...Object.entries(codexImages).map(([bank, image]) => ({ bank, ...image })),
];

/** The MIDI bank carries no patch count, so it is described by what it holds. */
export const bankSizeLabel = (bank) => (bank.count ? `${bank.count} patches` : 'MIDI files');

export const filterBanks = (banks, query) => banks.filter((bank) => matchesQuery(
  query,
  bank.name,
  bank.description,
  ...(bank.instruments || []),
));

export const filterReleases = (items, query) =>
  items.filter((item) => matchesQuery(query, item.title, item.description));

/**
 * The finder's readout. `releaseCount` is null while the releases are
 * unknown (loading or failed), and an unknown count is left out rather than
 * printed as zero.
 */
export const resultSummary = (bankCount, releaseCount) => [
  count(bankCount, 'bank'),
  releaseCount === null ? null : count(releaseCount, 'release'),
].filter(Boolean).join(' · ');

/** Whether a keypress belongs to a field the reader is typing into. */
export const isTypingTarget = (element) => Boolean(element && (
  element.tagName === 'INPUT'
  || element.tagName === 'TEXTAREA'
  || element.isContentEditable
));
