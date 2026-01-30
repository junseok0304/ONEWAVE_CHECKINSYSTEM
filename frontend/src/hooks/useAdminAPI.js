import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const apiRequest = async (endpoint, method = 'GET', data = null) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, options);

        if (!res.ok) {
            const contentType = res.headers.get('content-type');
            let errorMessage = '요청 실패';

            if (contentType && contentType.includes('application/json')) {
                try {
                    const error = await res.json();
                    errorMessage = error.message || `오류: ${res.status}`;
                } catch (e) {
                    errorMessage = `오류 (상태: ${res.status})`;
                }
            } else {
                errorMessage = `오류 (상태: ${res.status}) - ${res.statusText}`;
            }

            throw new Error(errorMessage);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('잘못된 응답 형식');
        }

        return res.json();
    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error);
        throw error;
    }
};

// 모든 멤버 목록 조회
export const useMembers = () => {
    return useQuery({
        queryKey: ['members'],
        queryFn: () => apiRequest('/members'),
        staleTime: 1000 * 60, // 1분
    });
};

// 특정 멤버 상세정보
export const useMemberDetail = (phoneKey) => {
    return useQuery({
        queryKey: ['member', phoneKey],
        queryFn: () => apiRequest(`/members/${phoneKey}`),
        enabled: !!phoneKey,
    });
};

// 멤버 정보 수정
export const useUpdateMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ phoneKey, data }) => apiRequest(`/members/${phoneKey}`, 'PATCH', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
    });
};

// 멤버 추가
export const useAddMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => apiRequest('/members', 'POST', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
    });
};

// 멤버 메모 수정 (이벤트와 무관하게 멤버 DB에 저장)
export const useUpdateMemberMemo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ phoneKey, memo }) => apiRequest(`/members/${phoneKey}/memo`, 'PATCH', { memo }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
    });
};

// 대시보드 통계
export const useDashboardStats = () => {
    return useQuery({
        queryKey: ['dashboardStats'],
        queryFn: () => apiRequest('/dashboard/stats'),
        staleTime: 1000 * 60, // 1분
        retry: 1,
    });
};

// 실시간 체크인 현황
export const useRealtimeCheckin = (autoRefresh = false) => {
    return useQuery({
        queryKey: ['realtimeCheckin'],
        queryFn: async () => {
            try {
                return await apiRequest('/realtime/checkin');
            } catch (error) {
                // 오늘 이벤트가 없으면 정상 반응
                if (error.message.includes('404') || error.message.includes('없습니다')) {
                    return { success: true, data: null, message: '오늘 이벤트가 없습니다.' };
                }
                throw error;
            }
        },
        staleTime: 0,
        refetchInterval: autoRefresh ? 1000 * 5 : false, // 사용자가 수동으로 켜야 함
        retry: 1,
    });
};

// ============ 관리자 페이지 이벤트 관리 훅 ============

// 이벤트 목록
export const useEvents = () => {
    return useQuery({
        queryKey: ['events'],
        queryFn: () => apiRequest('/events'),
        staleTime: 1000 * 60,
        retry: 1,
    });
};

// 이벤트 상세
export const useEventDetail = (date) => {
    return useQuery({
        queryKey: ['event', date],
        queryFn: async () => {
            try {
                return await apiRequest(`/events/${date}`);
            } catch (error) {
                // 404는 정상 (이벤트가 아직 없음)
                if (error.message.includes('404')) {
                    return { event: null, checkedInMembers: [], notCheckedInMembers: [] };
                }
                throw error;
            }
        },
        enabled: !!date,
        retry: 0, // 재시도 안 함
        throwOnError: false, // 에러를 throw하지 않음
    });
};

// 이벤트 수정
export const useUpdateEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ date, data }) => apiRequest(`/events/${date}`, 'PATCH', data),
        onSuccess: (_, { date }) => {
            queryClient.invalidateQueries({ queryKey: ['event', date] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
};

// 이벤트 삭제
export const useDeleteEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (date) => apiRequest(`/events/${date}`, 'DELETE'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
};

// 수동 체크인
export const useManualCheckIn = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ phoneKey, date }) => apiRequest('/checkin/manual', 'POST', { phoneKey, date }),
        onSuccess: (_, { date }) => {
            queryClient.invalidateQueries({ queryKey: ['event', date] });
            queryClient.invalidateQueries({ queryKey: ['realtimeCheckin'] });
        },
    });
};

// 체크인 취소
export const useCancelCheckIn = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ date, phoneKey }) => apiRequest(`/checkin/${date}/${phoneKey}`, 'DELETE'),
        onSuccess: (_, { date }) => {
            queryClient.invalidateQueries({ queryKey: ['event', date] });
            queryClient.invalidateQueries({ queryKey: ['realtimeCheckin'] });
        },
    });
};

// 메모 수정
export const useUpdateMemo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ date, phoneKey, memo }) =>
            apiRequest(`/checkin/${date}/${phoneKey}/memo`, 'PATCH', { memo }),
        onSuccess: (_, { date }) => {
            queryClient.invalidateQueries({ queryKey: ['event', date] });
            queryClient.invalidateQueries({ queryKey: ['realtimeCheckin'] });
        },
    });
};
