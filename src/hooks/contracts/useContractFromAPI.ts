import { useQuery } from '@tanstack/react-query';

export function useContractsFromAPI() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contracts`);
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}