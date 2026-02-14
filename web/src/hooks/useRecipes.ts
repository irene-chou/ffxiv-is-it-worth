import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllRecipes } from '../lib/xivapi';
import type { FetchProgress } from '../lib/xivapi';

export function useRecipes(craftTypeId: number | null) {
  const [progress, setProgress] = useState<FetchProgress | null>(null);

  const query = useQuery({
    queryKey: ['recipes', craftTypeId],
    queryFn: ({ signal }) => {
      setProgress(null);
      return fetchAllRecipes(craftTypeId!, signal, setProgress);
    },
    enabled: craftTypeId !== null,
    retry: false,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });

  return { ...query, progress };
}
