/*
 * The words and figures the sheet prints about its entries. Pure, so every
 * piece of copy that is computed rather than written can be asserted.
 */

/** A running number set two digits wide — 01, 02 … — as a printed list numbers its rows. */
export const serialNumber = (index) => String(index + 1).padStart(2, '0');

/** The demo count on a plate's spec line; a bank with none says so. */
export const demoCountLegend = (count) => {
  if (!count) return 'No demo on file';
  return `${count} audio demo${count > 1 ? 's' : ''}`;
};

/**
 * The cue printed on one of a bank's demos, and the name it is announced by.
 * A lone demo needs no number; one of several has to say which.
 */
export const demoCopy = (bankName, demoIndex, demoCount) => {
  if (demoCount <= 1) return { cue: 'Hear it', label: `Hear ${bankName}` };
  const ordinal = demoIndex + 1;
  return {
    cue: `Demo ${ordinal}`,
    label: `Hear ${bankName}, demo ${ordinal} of ${demoCount}`,
  };
};
