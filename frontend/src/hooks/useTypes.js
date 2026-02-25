import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

const MASTER_PASSWORD = process.env.NEXT_PUBLIC_MASTER_PASSWORD || '';

export function useTypes() {
    return useQuery({
        queryKey: ['types'],
        queryFn: async () => {
            const response = await apiRequest('/types', 'GET', undefined, MASTER_PASSWORD);
            return response.types || [];
        },
        staleTime: 60 * 1000, // 1분
        retry: 2,
    });
}

export function useAddType() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ typeName }) => {
            return apiRequest('/types', 'POST', { typeName }, MASTER_PASSWORD);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['types'] });
        },
    });
}
