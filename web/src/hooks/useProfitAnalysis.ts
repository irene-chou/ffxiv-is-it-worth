import { useMemo } from 'react';
import { useRecipes } from './useRecipes';
import { usePrices } from './usePrices';
import { useItemNames } from './useItemNames';
import { calculateProfits } from '@shared/calculator.js';

export function useProfitAnalysis(craftTypeId: number | null, world: string) {
  const recipesQuery = useRecipes(craftTypeId);
  const pricesQuery = usePrices(recipesQuery.data, world, craftTypeId);
  const namesQuery = useItemNames();

  const results = useMemo(() => {
    if (!recipesQuery.data || !pricesQuery.data) return undefined;
    return calculateProfits(recipesQuery.data, pricesQuery.data);
  }, [recipesQuery.data, pricesQuery.data]);

  return {
    data: results,
    itemNames: namesQuery.data,
    isLoading: recipesQuery.isFetching || pricesQuery.isFetching || namesQuery.isLoading,
    error: recipesQuery.error || pricesQuery.error || namesQuery.error,
    isLoadingRecipes: recipesQuery.isFetching,
    isLoadingPrices: pricesQuery.isFetching,
  };
}
