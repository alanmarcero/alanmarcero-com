/** The keys a machine answers to, as a printable list. */
export const keyLine = (game) => {
  const keys = Object.values(game.controls?.keyboard || {});
  if (!keys.length) return 'Mouse';
  return keys
    .map((key) => key.replace(/^Arrow/, '').toUpperCase())
    .join(' · ');
};
