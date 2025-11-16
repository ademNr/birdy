import useSWR from 'swr';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  const data = await response.json();
  return data.notifications || [];
};

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR('/api/notifications', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 10000, // 10 seconds for notifications
    refreshInterval: 30000, // Auto-refresh every 30 seconds
    keepPreviousData: true,
  });

  return {
    notifications: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

