'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';

export function Providers({ children }) {
    const queryClient = useMemo(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,      // 5분
                gcTime: 10 * 60 * 1000,        // 10분 (구 cacheTime)
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    }), []);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
