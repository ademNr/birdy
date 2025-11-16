import useSWR from 'swr';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch materials');
  }
  const data = await response.json();
  return data.materials || [];
};

export function useMaterials() {
  const { data, error, isLoading, mutate } = useSWR('/api/materials', fetcher, {
    revalidateOnFocus: false, // Don't refetch on window focus
    revalidateOnReconnect: true, // Refetch on reconnect
    dedupingInterval: 5000, // Dedupe requests within 5 seconds
    refreshInterval: 0, // Don't auto-refresh
    keepPreviousData: true, // Keep previous data while fetching
  });

  return {
    materials: data || [],
    isLoading,
    isError: error,
    mutate, // For manual refresh
  };
}

