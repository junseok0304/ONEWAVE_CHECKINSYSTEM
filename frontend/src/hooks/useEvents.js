import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export function useEvents() {
    return useQuery({
        queryKey: ['events'],
        queryFn: () => apiRequest('/events', 'GET'),
        staleTime: 60 * 1000, // 1분
    });
}

export function useEventDetail(date) {
    return useQuery({
        queryKey: ['event-detail', date],
        queryFn: () => apiRequest(`/realtime/checkin?date=${date}`, 'GET'),
        enabled: !!date,
        staleTime: 0, // 항상 최신 데이터 조회
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (eventData) =>
            apiRequest('/event/setup', 'POST', eventData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (date) =>
            apiRequest(`/events/${date}`, 'DELETE'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

export function useManualCheckin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ phoneKey, date }) =>
            apiRequest('/checkin/manual', 'POST', { phoneKey, date }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['event-detail', variables.date] });
        },
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ date, eventData }) =>
            apiRequest(`/events/${date}`, 'PATCH', eventData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['event-detail', variables.date] });
        },
    });
}

export function useCancelCheckin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ phoneKey, date }) =>
            apiRequest(`/checkin/${date}/${phoneKey}`, 'DELETE'),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['event-detail', variables.date] });
        },
    });
}
