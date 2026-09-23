import useMediaQuery from './useMediaQuery';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Tracks the user's `prefers-reduced-motion` setting.
 *
 * CSS animations are already disabled globally via a media query, but SMIL
 * (`<animate>`) and JS-driven motion are not — components use this hook to
 * opt out of those explicitly.
 */
export default function usePrefersReducedMotion() {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}
