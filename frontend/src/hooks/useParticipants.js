import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

const QUERY_KEY = {
    PARTICIPANTS: ['participants'],
};

const MASTER_PASSWORD = process.env.NEXT_PUBLIC_MASTER_PASSWORD || '';

/**
 * 모든 참가자 데이터를 조회하는 Hook (participants_checkin + participants_admin)
 * 자동 캐싱 및 중복 요청 방지
 */
export function useParticipants() {
    return useQuery({
        queryKey: QUERY_KEY.PARTICIPANTS,
        queryFn: async () => {
            try {
                // 참가자 조회 (일반 참가자)
                const participantsData = await apiRequest(
                    '/participants',
                    'GET',
                    undefined,
                    MASTER_PASSWORD
                );

                // 운영진 조회
                const adminData = await apiRequest(
                    '/members',
                    'GET',
                    undefined,
                    MASTER_PASSWORD
                );

                // 운영진 데이터 변환 (participants 포맷에 맞추기)
                const adminAsParticipants = (adminData?.members || []).map(admin => {
                    const converted = {
                        id: admin.phoneKey,
                        email: admin.email || '',
                        name: admin.name,
                        team_number: 0, // 운영진 표시 - 반드시 숫자
                        part: admin.part || '',
                        phone_number: admin.phoneNumber,
                        status: admin.status || 'APPROVED',
                        isCheckedIn: admin.checked_in_status || false,
                        checkedInAt: admin.checkedInAt,
                        memo: admin.memo || '',
                        checkedOutAt: admin.checkedOutAt,
                        checkedOutMemo: admin.checkedOutMemo || '',
                        isAdmin: true, // 운영진 플래그
                    };
                    return converted;
                });

                // 참가자와 운영진 데이터 합치기 (중복 제거)
                // Map을 사용하여 같은 ID를 가진 데이터는 운영진 데이터(adminAsParticipants)로 덮어씀
                const participantMap = new Map();

                // 먼저 일반 참가자 추가
                (participantsData || []).forEach(p => {
                    participantMap.set(p.id, p);
                });

                // 운영진 추가 (같은 ID가 있으면 덮어씀 - 운영진이 source of truth)
                adminAsParticipants.forEach(admin => {
                    participantMap.set(admin.id, admin);
                });

                const allParticipants = Array.from(participantMap.values());

                // 디버깅: 운영진 데이터 확인
                const admins = allParticipants.filter(p => p.isAdmin);
                if (admins.length > 0) {
                    console.log('✅ 운영진 데이터 로드 완료:', admins.length + '명');
                    console.log('첫 번째 운영진:', admins[0]);
                }

                return allParticipants;
            } catch (error) {
                console.error('참가자 데이터 조회 실패:', error);
                throw error;
            }
        },
        staleTime: 30 * 1000,  // 30초 (기본값 5분보다 빠름)
        gcTime: 10 * 60 * 1000, // 10분
        refetchInterval: false,  // 자동 갱신 안함
    });
}

/**
 * 참가자 메모를 업데이트하는 Mutation
 * 낙관적 업데이트 포함
 */
export function useUpdateParticipantMemo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ participantId, memo }) =>
            apiRequest(
                `/participants/${participantId}`,
                'PUT',
                { memo },
                MASTER_PASSWORD
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY.PARTICIPANTS });
        },
        onError: (error) => {
            console.error('메모 업데이트 실패:', error);
        },
    });
}

/**
 * 체크아웃 메모를 업데이트하는 Mutation
 */
export function useUpdateCheckoutMemo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ participantId, checkedOutMemo }) =>
            apiRequest(
                `/participants/${participantId}`,
                'PUT',
                { checkedOutMemo },
                MASTER_PASSWORD
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY.PARTICIPANTS });
        },
        onError: (error) => {
            console.error('체크아웃 메모 업데이트 실패:', error);
        },
    });
}

/**
 * 체크인 상태를 토글하는 Mutation
 */
export function useToggleCheckin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ participantId, status }) =>
            apiRequest(
                `/participants/${participantId}`,
                'PUT',
                { checked_in_status: status },
                MASTER_PASSWORD
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY.PARTICIPANTS });
        },
    });
}

/**
 * 체크아웃 상태를 토글하는 Mutation
 */
export function useToggleCheckout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ participantId, checkedOutAt }) =>
            apiRequest(
                `/participants/${participantId}`,
                'PUT',
                { checkedOutAt },
                MASTER_PASSWORD
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY.PARTICIPANTS });
        },
    });
}

/**
 * 수동 새로고침 함수
 */
export function useRefreshParticipants() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY.PARTICIPANTS });
    };
}
