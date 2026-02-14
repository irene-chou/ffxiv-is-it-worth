import { useQuery } from '@tanstack/react-query';
import { fetchAllRecipes } from '../lib/xivapi';

export function useRecipes(craftTypeId: number | null) {
  return useQuery({
    queryKey: ['recipes', craftTypeId],
    queryFn: ({ signal }) => fetchAllRecipes(craftTypeId!, signal),
    enabled: craftTypeId !== null,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });
}
