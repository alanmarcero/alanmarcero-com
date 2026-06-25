/** True when a track title denotes a remix (e.g. "Melbourne (Alan-M Remix)"). */
export const isRemix = (title = '') => /\bre-?mix\b/i.test(title);
