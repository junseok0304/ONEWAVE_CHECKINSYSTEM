'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParticipants, useToggleCheckin, useToggleCheckout, useUpdateParticipantMemo, useUpdateCheckoutMemo, useRefreshParticipants } from '@/hooks/useParticipants';
import { formatPhoneNumber } from '@/lib/format';

// 상수
const FILTER_OPTIONS = {
    ALL: 'all',
    UNCHECKED: 'unchecked',
    CHECKED: 'checked',
    CHECKEDOUT: 'checkedout',
};

const SORT_OPTIONS = {
    NAME: 'name',
    TEAM: 'team',
};

/**
 * 날짜 포맷팅
 */
function formatDate(dateValue) {
    if (!dateValue) return '-';
    try {
        const date = typeof dateValue === 'string' ? new Date(dateValue) : new Date(dateValue);
        return isNaN(date.getTime()) ? '-' : date.toLocaleString('ko-KR');
    } catch (e) {
        return '-';
    }
}

export default function StatusManagementPage() {
    const { data: participants = [], isLoading, error } = useParticipants();
    const toggleCheckin = useToggleCheckin();
    const toggleCheckout = useToggleCheckout();
    const updateParticipantMemo = useUpdateParticipantMemo();
    const updateCheckoutMemo = useUpdateCheckoutMemo();
    const refreshParticipants = useRefreshParticipants();

    // 필터 및 정렬
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState(FILTER_OPTIONS.ALL);
    const [sortBy, setSortBy] = useState(SORT_OPTIONS.TEAM);

    // 메모 편집
    const [editingId, setEditingId] = useState(null);
    const [editingMemo, setEditingMemo] = useState('');
    const [editingMemoType, setEditingMemoType] = useState(null); // 'participant' or 'checkout'

    /**
     * 필터링 및 정렬된 참가자 목록
     */
    const filteredParticipants = useMemo(() => {
        return participants
            .filter(p => {
                const matchesSearch = p.name?.includes(searchTerm) || p.id?.includes(searchTerm);
                let matchesFilter = true;

                if (filterStatus === FILTER_OPTIONS.UNCHECKED) {
                    matchesFilter = !p.isCheckedIn;
                } else if (filterStatus === FILTER_OPTIONS.CHECKED) {
                    matchesFilter = p.isCheckedIn && !p.checkedOutAt;
                } else if (filterStatus === FILTER_OPTIONS.CHECKEDOUT) {
                    matchesFilter = p.checkedOutAt;
                }

                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => {
                if (sortBy === SORT_OPTIONS.TEAM) {
                    // 팀순: 팀번호로 먼저 정렬, 같은 팀이면 이름으로 정렬
                    const teamA = parseInt(a.team_number) || 0;
                    const teamB = parseInt(b.team_number) || 0;
                    if (teamA !== teamB) {
                        return teamA - teamB;
                    }
                    return (a.name || '').localeCompare(b.name || '', 'ko-KR');
                } else {
                    // 이름순: 팀 상관없이 이름으로만 정렬
                    return (a.name || '').localeCompare(b.name || '', 'ko-KR');
                }
            });
    }, [participants, searchTerm, filterStatus, sortBy]);

    /**
     * 메모 저장
     */
    const handleSaveMemo = useCallback(async (participantId) => {
        try {
            if (editingMemoType === 'participant') {
                await updateParticipantMemo.mutateAsync({ participantId, memo: editingMemo });
            } else if (editingMemoType === 'checkout') {
                await updateCheckoutMemo.mutateAsync({ participantId, checkedOutMemo: editingMemo });
            }
            setEditingId(null);
            setEditingMemoType(null);
            setEditingMemo('');
        } catch (err) {
            alert(err.message || '저장에 실패했습니다.');
        }
    }, [editingMemoType, editingMemo, updateParticipantMemo, updateCheckoutMemo]);

    /**
     * 메모 편집 시작
     */
    const startEditMemo = useCallback((participantId, currentMemo, memoType) => {
        setEditingId(participantId);
        setEditingMemo(currentMemo || '');
        setEditingMemoType(memoType);
    }, []);

    /**
     * 체크인 토글
     */
    const handleToggleCheckin = useCallback(async (participantId, currentStatus) => {
        const newStatus = !currentStatus;
        if (!window.confirm(newStatus ? '체크인 처리하시겠습니까?' : '체크인을 취소하시겠습니까?')) {
            return;
        }

        try {
            await toggleCheckin.mutateAsync({ participantId, status: newStatus });
        } catch (err) {
            alert(err.message || '처리에 실패했습니다.');
        }
    }, [toggleCheckin]);

    /**
     * 체크아웃 토글
     */
    const handleToggleCheckout = useCallback(async (participantId, currentCheckoutStatus) => {
        if (!window.confirm(currentCheckoutStatus ? '체크아웃을 취소하시겠습니까?' : '체크아웃 처리하시겠습니까?')) {
            return;
        }

        try {
            const checkedOutAt = currentCheckoutStatus ? null : new Date().toISOString();
            await toggleCheckout.mutateAsync({ participantId, checkedOutAt });
        } catch (err) {
            alert(err.message || '처리에 실패했습니다.');
        }
    }, [toggleCheckout]);

    if (isLoading) return <div style={{ padding: '20px' }}>로딩 중...</div>;

    return (
        <div>
            <h1>상태관리</h1>

            {error && (
                <div style={{
                    padding: '12px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '4px',
                    marginBottom: '20px',
                }}>
                    {error.message}
                </div>
            )}

            {/* 검색 및 필터 */}
            <div style={{ marginTop: '28px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="이름 또는 ID 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: '220px',
                        padding: '12px 16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: '#f9fafb',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        outline: 'none',
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#3282f6';
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.boxShadow = '0 0 0 3px rgba(50, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = '#f9fafb';
                        e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                    }}
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        padding: '12px 14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: '#f9fafb',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <option value="all">전체</option>
                    <option value="unchecked">미체크인</option>
                    <option value="checked">체크인됨</option>
                    <option value="checkedout">체크아웃됨</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                        padding: '12px 14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: '#f9fafb',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <option value="name">이름순</option>
                    <option value="team">팀순</option>
                </select>
                <button
                    onClick={refreshParticipants}
                    disabled={isLoading}
                    style={{
                        padding: '12px 16px',
                        backgroundColor: '#3282f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        opacity: isLoading ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoading) {
                            e.target.style.backgroundColor = '#2d6fd9';
                            e.target.style.boxShadow = '0 4px 8px rgba(50, 130, 246, 0.3)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isLoading) {
                            e.target.style.backgroundColor = '#3282f6';
                            e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                        }
                    }}
                >
                    {isLoading ? '새로고침 중...' : '새로고침'}
                </button>
            </div>

            {/* 테이블 */}
            <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    minWidth: '1600px',
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '100px' }}>이름</th>
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '50px' }}>팀</th>
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '60px' }}>파트</th>
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '120px' }}>전화번호</th>
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '70px' }}>체크인</th>
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '150px' }}>체크인 시간</th>
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '150px' }}>참가자 메모</th>
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '70px' }}>체크아웃</th>
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '150px' }}>체크아웃 시간</th>
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '150px' }}>체크아웃 메모</th>
                            <th style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap', minWidth: '80px' }}>작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParticipants.map((p) => (
                            <tr
                                key={p.id}
                                style={{
                                    borderBottom: '1px solid #dee2e6',
                                    backgroundColor: p.isAdmin ? '#fff3cd' : 'white', // 운영진은 노란색 배경
                                }}
                            >
                                <td style={{ padding: '12px', whiteSpace: 'nowrap', minWidth: '100px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{p.name}</span>
                                        {p.isAdmin && (
                                            <span
                                                style={{
                                                    padding: '2px 6px',
                                                    backgroundColor: '#ffc107',
                                                    color: '#856404',
                                                    borderRadius: '3px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                운영진
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '12px', whiteSpace: 'nowrap', minWidth: '50px' }}>{p.team_number === 0 ? '0' : (p.team_number || '-')}</td>
                                <td style={{ padding: '12px', whiteSpace: 'nowrap', minWidth: '60px' }}>{p.part || '-'}</td>
                                <td style={{ padding: '12px', fontSize: '12px', whiteSpace: 'nowrap', minWidth: '120px' }}>
                                    {formatPhoneNumber(p.phone_number)}
                                </td>
                                <td style={{ padding: '12px', whiteSpace: 'nowrap', minWidth: '70px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: p.isCheckedIn ? '#d4edda' : '#f8d7da',
                                        color: p.isCheckedIn ? '#155724' : '#721c24',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                    }}>
                                        {p.isCheckedIn ? '체크인' : '미체크인'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', fontSize: '12px', whiteSpace: 'nowrap', minWidth: '150px' }}>
                                    {formatDate(p.checkedInAt)}
                                </td>
                                {/* 참가자 메모 */}
                                <td style={{ padding: '12px', minWidth: '150px', maxWidth: '150px' }}>
                                    {editingId === p.id && editingMemoType === 'participant' ? (
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            <input
                                                type="text"
                                                value={editingMemo}
                                                onChange={(e) => setEditingMemo(e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    minWidth: '80px',
                                                    padding: '6px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                }}
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleSaveMemo(p.id)}
                                                style={{
                                                    padding: '6px 8px',
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                저장
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                style={{
                                                    padding: '6px 8px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                취소
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startEditMemo(p.id, p.memo, 'participant')}
                                            style={{
                                                padding: '6px 8px',
                                                backgroundColor: p.memo ? '#e3f2fd' : '#e9ecef',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                width: '100%',
                                                textAlign: 'left',
                                                fontWeight: p.memo ? '600' : '400',
                                                fontSize: '12px',
                                                whiteSpace: 'normal',
                                                wordWrap: 'break-word',
                                                minHeight: '36px',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                            title="클릭하여 메모 수정"
                                        >
                                            {p.memo || '클릭해서 추가'}
                                        </button>
                                    )}
                                </td>
                                <td style={{ padding: '12px', whiteSpace: 'nowrap', minWidth: '70px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: p.checkedOutAt ? '#d4edda' : '#f8d7da',
                                        color: p.checkedOutAt ? '#155724' : '#721c24',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                    }}>
                                        {p.checkedOutAt ? '체크아웃' : '대기'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', fontSize: '12px', whiteSpace: 'nowrap', minWidth: '150px' }}>
                                    {formatDate(p.checkedOutAt)}
                                </td>
                                {/* 체크아웃 메모 */}
                                <td style={{ padding: '12px', minWidth: '150px', maxWidth: '150px' }}>
                                    {editingId === p.id && editingMemoType === 'checkout' ? (
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            <input
                                                type="text"
                                                value={editingMemo}
                                                onChange={(e) => setEditingMemo(e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    minWidth: '80px',
                                                    padding: '6px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                }}
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleSaveMemo(p.id)}
                                                style={{
                                                    padding: '6px 8px',
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                저장
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                style={{
                                                    padding: '6px 8px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                취소
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startEditMemo(p.id, p.checkedOutMemo, 'checkout')}
                                            style={{
                                                padding: '6px 8px',
                                                backgroundColor: p.checkedOutMemo ? '#e3f2fd' : '#e9ecef',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                width: '100%',
                                                textAlign: 'left',
                                                fontWeight: p.checkedOutMemo ? '600' : '400',
                                                fontSize: '12px',
                                                whiteSpace: 'normal',
                                                wordWrap: 'break-word',
                                                minHeight: '36px',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                            title="클릭하여 메모 수정"
                                        >
                                            {p.checkedOutMemo || '클릭해서 추가'}
                                        </button>
                                    )}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', minWidth: '80px', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => handleToggleCheckin(p.id, p.isCheckedIn)}
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: p.isCheckedIn ? '#dc3545' : '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                            }}
                                            title={p.isCheckedIn ? '체크인 취소' : '체크인'}
                                        >
                                            {p.isCheckedIn ? '체크인✓' : '체크인✗'}
                                        </button>

                                        {p.isCheckedIn && (
                                            <button
                                                onClick={() => handleToggleCheckout(p.id, p.checkedOutAt)}
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: p.checkedOutAt ? '#dc3545' : '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                }}
                                                title={p.checkedOutAt ? '체크아웃 취소' : '체크아웃'}
                                            >
                                                {p.checkedOutAt ? '아웃✓' : '아웃✗'}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredParticipants.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    해당하는 참가자가 없습니다.
                </div>
            )}
        </div>
    );
}
