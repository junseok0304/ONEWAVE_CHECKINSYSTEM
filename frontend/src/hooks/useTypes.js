import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export function useTypes() {
    return useQuery({
        queryKey: ['types'],
        queryFn: async () => {
            const response = await apiRequest('/types', 'GET');
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
            return apiRequest('/types', 'POST', { typeName });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['types'] });
        },
    });
}
