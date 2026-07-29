import { useState, useEffect, useCallback } from 'react';
import { isEra, DEFAULT_ERA } from './eras';
import { writeQueryParam } from '../utils/queryParam';

const readEraFromUrl = () => {
  if (typeof window === 'undefined') return DEFAULT_ERA;
  const value = new URLSearchParams(window.location.search).get('era');
  return isEra(value) ? value : DEFAULT_ERA;
};

/**
 * Manages the active "Take Me Back" era.
 *
 * Reflects the era onto `<html data-era="…">` (so era CSS can re-skin the whole
 * page) and keeps it in the `?era=` query param so a time-travelled view is
 * shareable and survives back/forward. The present era clears both.
 *
 * @returns {[string, (id: string) => void]} `[era, setEra]`
 */
export default function useEra() {
  const [era, setEraState] = useState(readEraFromUrl);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // The present era is the absence of a skin: no data-era, no ?era=.
    const isPresent = era === DEFAULT_ERA;
    const root = document.documentElement;
    if (isPresent) root.removeAttribute('data-era');
    if (!isPresent) root.setAttribute('data-era', era);

    writeQueryParam('era', isPresent ? null : era);
  }, [era]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onPopstate = () => setEraState(readEraFromUrl());
    window.addEventListener('popstate', onPopstate);
    return () => window.removeEventListener('popstate', onPopstate);
  }, []);

  const setEra = useCallback((id) => setEraState(isEra(id) ? id : DEFAULT_ERA), []);

  return [era, setEra];
}
