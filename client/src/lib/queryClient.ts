import { QueryClient, QueryFunction } from '@tanstack/react-query';

// API request helper with authentication
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Default query function for React Query
const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const [url] = queryKey as string[];
  return apiRequest(url);
};

// Connection search API functions
export const searchConnections = async (searchData: { targetName: string; targetCompany?: string }) => {
  return apiRequest('/api/connections/search', {
    method: 'POST',
    body: JSON.stringify(searchData),
  });
};

// Create query client with default configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401 (auth errors)
        if (error?.message?.includes('401')) return false;
        return failureCount < 3;
      },
    },
  },
});