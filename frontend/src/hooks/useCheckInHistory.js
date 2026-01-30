import { useQuery } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useCheckInHistory = (date, password) => {
    return useQuery({
        queryKey: ['checkInHistory', date],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/checkin-history/${date}`, {
                headers: {
                    'Authorization': `Bearer ${password}`,
                },
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || '이력 조회 실패');
            }

            return res.json();
        },
        enabled: !!date && !!password,
    });
};
