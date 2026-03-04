import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export function useMembers() {
    return useQuery({
        queryKey: ['members'],
        queryFn: async () => {
            // 세 개 컬렉션을 병렬로 조회
            const [memberRes, adminRes, othersRes] = await Promise.all([
                apiRequest('/members', 'GET').catch((err) => {
                    console.error('[DEBUG] /members 에러:', err);
                    return { members: [] };
                }),
                apiRequest('/admin-members', 'GET').catch((err) => {
                    console.error('[DEBUG] /admin-members 에러:', err);
                    return { members: [] };
                }),
                apiRequest('/others-members', 'GET').catch((err) => {
                    console.error('[DEBUG] /others-members 에러:', err);
                    return { members: [] };
                })
            ]);

            console.log('[DEBUG] API 응답:', {
                members: memberRes.members?.length || 0,
                admin: adminRes.members?.length || 0,
                others: othersRes.members?.length || 0,
            });

            // 세 배열을 합치기
            const members = [
                ...(memberRes.members || []),
                ...(adminRes.members || []),
                ...(othersRes.members || [])
            ];

            console.log('[DEBUG] 최종 합계:', members.length);
            return { members, count: members.length };
        },
        staleTime: 60 * 1000, // 1분
    });
}

export function useMemberDetail(phoneKey) {
    return useQuery({
        queryKey: ['member-detail', phoneKey],
        queryFn: () => apiRequest(`/members/${phoneKey}`, 'GET'),
        enabled: !!phoneKey,
        staleTime: 30 * 1000,
    });
}

export function useCreateMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ memberData, collection = 'participants_member' }) => {
            // collection 파라미터에 따라 다른 엔드포인트 사용
            // 기본은 participants_member로 저장
            return apiRequest('/members', 'POST', { ...memberData, _collection: collection });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
    });
}

export function useUpdateMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ phoneKey, data, collection = 'participants_member' }) => {
            // collection 파라미터에 따라 다른 엔드포인트 사용
            const endpoint = collection === 'participants_admin'
                ? `/admin-members/${phoneKey}`
                : collection === 'participants_others'
                ? `/others-members/${phoneKey}`
                : `/members/${phoneKey}`;

            return apiRequest(endpoint, 'PATCH', data);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['member-detail', variables.phoneKey] });
        },
    });
}

export function useUpdateMemberMemo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ phoneKey, memo, date }) => {
            // 멤버 메모 저장
            await apiRequest(`/members/${phoneKey}/memo`, 'PATCH', { memo });

            // 체크인 메모도 저장 (date가 제공되면)
            if (date) {
                await apiRequest(`/checkin/${date}/${phoneKey}/memo`, 'PATCH', { memo });
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['member-detail', variables.phoneKey] });
        },
    });
}

export function useDeleteMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ phoneKey, collection = 'participants_member' }) => {
            // collection 파라미터에 따라 다른 엔드포인트 사용
            const endpoint = collection === 'participants_admin'
                ? `/admin-members/${phoneKey}`
                : collection === 'participants_others'
                ? `/others-members/${phoneKey}`
                : `/members/${phoneKey}`;

            return apiRequest(endpoint, 'DELETE');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
    });
}
