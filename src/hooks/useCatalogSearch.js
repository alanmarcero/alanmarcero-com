import { useEffect, useState } from 'react';
import usePopstate from './usePopstate';
import { readQueryParam, writeQueryParam } from '../utils/queryParam';

export default function useCatalogSearch() {
  const [searchQuery, setSearchQuery] = useState(() => readQueryParam('q') || '');

  useEffect(() => {
    if (searchQuery === (readQueryParam('q') || '')) return;
    writeQueryParam('q', searchQuery);
  }, [searchQuery]);

  usePopstate(() => setSearchQuery(readQueryParam('q') || ''));

  return [searchQuery, setSearchQuery];
}
