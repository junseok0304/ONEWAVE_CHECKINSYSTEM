import { useMutation, useQuery } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useUserTypes = (phoneNumber) => {
    return useQuery({
        queryKey: ['userTypes', phoneNumber],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/users/${phoneNumber}/types`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminPassword')}`,
                },
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || '사용자 타입 조회 실패');
            }

            return res.json();
        },
        enabled: !!phoneNumber,
    });
};

export const useAddUserType = () => {
    return useMutation({
        mutationFn: async ({ phoneNumber, type, password }) => {
            const res = await fetch(
                `${API_BASE}/users/${phoneNumber}/types/add`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${password}`,
                    },
                    body: JSON.stringify({ type }),
                }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || '타입 추가 실패');
            }

            return res.json();
        },
    });
};

export const useRemoveUserType = () => {
    return useMutation({
        mutationFn: async ({ phoneNumber, type, password }) => {
            const res = await fetch(
                `${API_BASE}/users/${phoneNumber}/types/remove`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${password}`,
                    },
                    body: JSON.stringify({ type }),
                }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || '타입 제거 실패');
            }

            return res.json();
        },
    });
};
