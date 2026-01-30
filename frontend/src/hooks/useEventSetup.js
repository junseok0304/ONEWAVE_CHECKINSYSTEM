import { useMutation, useQuery } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useEventSetup = () => {
    return useMutation({
        mutationFn: async ({ date, eventName, eventType, password }) => {
            const res = await fetch(`${API_BASE}/event/setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${password}`,
                },
                body: JSON.stringify({ date, eventName, eventType }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || '이벤트 생성 실패');
            }

            return res.json();
        },
    });
};

export const useTodayEvent = () => {
    return useQuery({
        queryKey: ['todayEvent'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/event/today`);
            if (!res.ok) {
                throw new Error('이벤트 조회 실패');
            }
            return res.json();
        },
        staleTime: 1000 * 60, // 1분
    });
};
