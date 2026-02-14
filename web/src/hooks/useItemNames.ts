import { useQuery } from '@tanstack/react-query';
import { loadItemNames } from '../lib/names';

export function useItemNames() {
  return useQuery({
    queryKey: ['itemNames'],
    queryFn: loadItemNames,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
