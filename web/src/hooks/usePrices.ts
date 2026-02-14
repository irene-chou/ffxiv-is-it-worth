import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMarketPrices } from '../lib/universalis';
import type { FetchProgress } from '../lib/xivapi';
import type { Recipe } from '@shared/types.js';

function collectItemIds(recipes: Recipe[]): number[] {
  const ids = new Set<number>();
  for (const r of recipes) {
    ids.add(r.resultItemId);
    for (const ing of r.ingredients) ids.add(ing.itemId);
  }
  return [...ids].filter(id => id > 0);
}

export function usePrices(
  recipes: Recipe[] | undefined,
  world: string,
  craftTypeId: number | null,
) {
  const [progress, setProgress] = useState<FetchProgress | null>(null);

  const query = useQuery({
    queryKey: ['prices', world, craftTypeId],
    queryFn: ({ signal }) => {
      setProgress(null);
      return fetchMarketPrices(world, collectItemIds(recipes!), signal, setProgress);
    },
    enabled: !!recipes && recipes.length > 0 && craftTypeId !== null,
    retry: false, // fetchWithRetry handles retries internally
    staleTime: 30 * 60 * 1000, // 30 min — after this, refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hr — keep in IDB so refresh doesn't lose it
  });

  return { ...query, progress };
}
