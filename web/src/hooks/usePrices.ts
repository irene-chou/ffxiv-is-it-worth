import { useQuery } from '@tanstack/react-query';
import { fetchMarketPrices } from '../lib/universalis';
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
  return useQuery({
    queryKey: ['prices', world, craftTypeId],
    queryFn: ({ signal }) => fetchMarketPrices(world, collectItemIds(recipes!), signal),
    enabled: !!recipes && recipes.length > 0 && craftTypeId !== null,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,
  });
}
