'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { formatPhoneNumber } from '@/lib/format';
import { useUpdateEvent } from '@/hooks/useEvents';
import { useUpdateMemberMemo } from '@/hooks/useMembers';
import styles from './dashboard.module.css';

/**
 * 날짜 포맷팅 유틸리티
 */
function formatDate(dateValue) {
    if (!dateValue) return '-';
    try {
        const date = typeof dateValue === 'string' ? new Date(dateValue) : new Date(dateValue);
        return isNaN(date.getTime()) ? '-' : date.toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return '-';
    }
}

export default function AdminDashboard() {
    const [event, setEvent] = useState(null);
    const [checkedInList, setCheckedInList] = useState([]);
    const [notCheckedInList, setNotCheckedInList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const updateEvent = useUpdateEvent();
    const updateMemo = useUpdateMemberMemo();

    // 이벤트 이름 수정 상태
    const [editEventName, setEditEventName] = useState(false);
    const [newEventName, setNewEventName] = useState('');

    // 메모 수정 상태
    const [editingMemoPhoneKey, setEditingMemoPhoneKey] = useState(null);
    const [editingMemoType, setEditingMemoType] = useState('checkin'); // 'checkin' | 'user'
    const [memoText, setMemoText] = useState('');

    // 데이터 로드
    const loadData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const res = await apiRequest(`/realtime/checkin?date=${today}`, 'GET');

            if (res.data) {
                setEvent(res.data.event);
                setCheckedInList(res.data.checkedIn || []);
                setNotCheckedInList(res.data.notCheckedIn || []);
            }
            setLastUpdate(new Date());
            setError(null);
        } catch (err) {
            setError(err.message || '데이터를 불러오지 못했습니다.');
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // 통계 계산
    const stats = useMemo(() => {
        const total = (checkedInList.length || 0) + (notCheckedInList.length || 0);
        const checkedIn = checkedInList.length || 0;
        const notCheckedIn = notCheckedInList.length || 0;
        const percentage = total > 0 ? (checkedIn / total) * 100 : 0;

        return {
            total,
            checkedIn,
            notCheckedIn,
            percentage: percentage.toFixed(1),
        };
    }, [checkedInList, notCheckedInList]);

    // 최근 30명 (최신순)
    const recentCheckins = useMemo(() => {
        return [...checkedInList]
            .sort((a, b) => {
                const aTime = a.checkedInAt ? new Date(a.checkedInAt) : new Date(0);
                const bTime = b.checkedInAt ? new Date(b.checkedInAt) : new Date(0);
                return bTime - aTime;
            })
            .slice(0, 30);
    }, [checkedInList]);

    const handleRefresh = async () => {
        await loadData();
    };

    // 이벤트 이름 수정
    const handleUpdateEventName = async () => {
        if (!newEventName.trim()) {
            alert('이벤트 이름을 입력해주세요.');
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            await updateEvent.mutateAsync({
                date: today,
                eventData: { eventName: newEventName }
            });
            setEvent({ ...event, eventName: newEventName });
            setEditEventName(false);
            setNewEventName('');
            alert('이벤트 이름이 수정되었습니다.');
        } catch (err) {
            alert(err.message || '수정 실패');
        }
    };

    // 메모 수정 시작
    const startEditMemo = (phoneKey, currentMemo, type = 'checkin') => {
        setEditingMemoPhoneKey(phoneKey);
        setMemoText(currentMemo || '');
        setEditingMemoType(type);
    };

    // 메모 저장
    const handleSaveMemo = async (phoneKey) => {
        try {
            const { apiRequest: request } = await import('@/lib/api');
            const today = new Date().toISOString().split('T')[0];

            if (editingMemoType === 'checkin') {
                // 특이사항메모
                const apiPath = `/checkin/${today}/${phoneKey}/memo`;
                const payload = { memo: memoText, type: 'checkin' };
                await request(apiPath, 'PATCH', payload);

                // 화면의 메모도 업데이트
                setCheckedInList(prev => prev.map(p =>
                    p.phoneKey === phoneKey ? { ...p, checkInMemo: memoText } : p
                ));
                setNotCheckedInList(prev => prev.map(p =>
                    p.phoneKey === phoneKey ? { ...p, checkInMemo: memoText } : p
                ));

                alert('특이사항메모가 저장되었습니다.');
            } else if (editingMemoType === 'user') {
                // 유저메모
                const apiPath = `/members/${phoneKey}/memo`;
                const payload = { memo: memoText };
                await request(apiPath, 'PATCH', payload);

                // 화면의 메모도 업데이트
                setCheckedInList(prev => prev.map(p =>
                    p.phoneKey === phoneKey ? { ...p, userMemo: memoText } : p
                ));
                setNotCheckedInList(prev => prev.map(p =>
                    p.phoneKey === phoneKey ? { ...p, userMemo: memoText } : p
                ));

                alert('유저메모가 저장되었습니다.');
            }

            setEditingMemoPhoneKey(null);
            setMemoText('');
        } catch (err) {
            alert(err.message || '저장 실패');
        }
    };

    if (loading) {
        return <div className={styles.loadingWrap}>로딩 중...</div>;
    }

    return (
        <div className={styles.wrap}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <div className={styles.title}>GDG 체크인 현황</div>
                    {event && (
                        <div className={styles.subtitle} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span>📅 {event.eventName} ({event.eventType})</span>
                            <button
                                onClick={() => {
                                    setEditEventName(true);
                                    setNewEventName(event.eventName);
                                }}
                                style={{
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    backgroundColor: '#3282f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                수정
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        type="button"
                        className={`${styles.refreshBtn} ${loading ? styles.disabled : ''}`}
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        {loading ? '새로고침 중...' : '새로고침'}
                    </button>
                    <div className={styles.lastUpdate}>
                        마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className={styles.errorBox}>
                    {error}
                </div>
            )}

            {/* 체크인 현황 요약 */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>체크인 대상</div>
                    <div className={styles.summaryValue}>{stats.total}명</div>
                </div>
                <div className={`${styles.summaryCard} ${styles.checkedIn}`}>
                    <div className={styles.summaryLabel}>체크인 완료</div>
                    <div className={styles.summaryValue}>{stats.checkedIn}명</div>
                </div>
                <div className={`${styles.summaryCard} ${styles.notCheckedIn}`}>
                    <div className={styles.summaryLabel}>미체크인</div>
                    <div className={styles.summaryValue}>{stats.notCheckedIn}명</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>진행률</div>
                    <div className={styles.summaryValue}>{stats.percentage}%</div>
                </div>
            </div>

            {/* 최근 체크인 목록 (30명) */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>✅ 최근 체크인 ({recentCheckins.length}명)</h2>
                    <Link href="/admin/checkin" className={styles.seeAllLink}>
                        전체보기 →
                    </Link>
                </div>

                {recentCheckins.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>이름</th>
                                    <th>파트</th>
                                    <th>학교</th>
                                    <th>전화번호</th>
                                    <th>체크인 시간</th>
                                    <th>특이사항메모</th>
                                    <th>유저메모</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentCheckins.map((p) => (
                                    <tr key={p.phoneKey}>
                                        <td><strong>{p.name}</strong></td>
                                        <td>{p.part || '-'}</td>
                                        <td>{p.schoolName || p.school || '-'}</td>
                                        <td>{formatPhoneNumber(p.phoneNumber)}</td>
                                        <td>{formatDate(p.checkedInAt)}</td>
                                        <td style={{ maxWidth: '150px' }}>
                                            {editingMemoPhoneKey === p.phoneKey && editingMemoType === 'checkin' ? (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <input
                                                        type="text"
                                                        value={memoText}
                                                        onChange={(e) => setMemoText(e.target.value)}
                                                        placeholder="메모..."
                                                        style={{
                                                            flex: 1,
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            border: '1px solid #3282f6',
                                                            borderRadius: '4px'
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleSaveMemo(p.phoneKey)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            backgroundColor: '#22c55e',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        저장
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => startEditMemo(p.phoneKey, p.checkInMemo, 'checkin')}
                                                    style={{ fontSize: '12px', color: '#666', cursor: 'pointer' }}
                                                >
                                                    {p.checkInMemo || '-'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ maxWidth: '150px' }}>
                                            {editingMemoPhoneKey === p.phoneKey && editingMemoType === 'user' ? (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <input
                                                        type="text"
                                                        value={memoText}
                                                        onChange={(e) => setMemoText(e.target.value)}
                                                        placeholder="메모..."
                                                        style={{
                                                            flex: 1,
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            border: '1px solid #3282f6',
                                                            borderRadius: '4px'
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleSaveMemo(p.phoneKey)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            backgroundColor: '#22c55e',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        저장
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => startEditMemo(p.phoneKey, p.userMemo, 'user')}
                                                    style={{ fontSize: '12px', color: '#666', cursor: 'pointer' }}
                                                >
                                                    {p.userMemo || '-'}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        체크인한 참가자가 없습니다.
                    </div>
                )}
            </div>

            {/* 이벤트 이름 수정 모달 */}
            {editEventName && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '32px',
                        borderRadius: '12px',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h2 style={{ marginBottom: '16px' }}>이벤트 이름 수정</h2>
                        <input
                            type="text"
                            value={newEventName}
                            onChange={(e) => setNewEventName(e.target.value)}
                            placeholder="새 이벤트 이름"
                            style={{
                                width: '100%',
                                padding: '10px',
                                marginBottom: '16px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleUpdateEventName();
                            }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleUpdateEventName}
                                disabled={updateEvent.isPending}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: '#3282f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                {updateEvent.isPending ? '저장 중...' : '저장'}
                            </button>
                            <button
                                onClick={() => {
                                    setEditEventName(false);
                                    setNewEventName('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: '#e5e7eb',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 미체크인 현황 */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>⏳ 미체크인 ({notCheckedInList.length}명)</h2>
                    <Link href="/admin/events" className={styles.seeAllLink}>
                        수동 체크인 →
                    </Link>
                </div>

                {notCheckedInList.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>이름</th>
                                    <th>파트</th>
                                    <th>학교</th>
                                    <th>전화번호</th>
                                    <th>타입</th>
                                    <th>특이사항메모</th>
                                    <th>유저메모</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notCheckedInList.map((p) => (
                                    <tr key={p.phoneKey} className={styles.pendingRow}>
                                        <td><strong>{p.name}</strong></td>
                                        <td>{p.part || '-'}</td>
                                        <td>{p.schoolName || p.school || '-'}</td>
                                        <td>{formatPhoneNumber(p.phoneNumber)}</td>
                                        <td>
                                            {Array.isArray(p.type)
                                                ? p.type.filter(t => t !== 'allMembers').join(', ') || 'allMembers'
                                                : 'allMembers'
                                            }
                                        </td>
                                        <td style={{ maxWidth: '150px' }}>
                                            {editingMemoPhoneKey === p.phoneKey && editingMemoType === 'checkin' ? (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <input
                                                        type="text"
                                                        value={memoText}
                                                        onChange={(e) => setMemoText(e.target.value)}
                                                        placeholder="메모..."
                                                        style={{
                                                            flex: 1,
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            border: '1px solid #3282f6',
                                                            borderRadius: '4px'
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleSaveMemo(p.phoneKey)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            backgroundColor: '#22c55e',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        저장
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => startEditMemo(p.phoneKey, p.checkInMemo, 'checkin')}
                                                    style={{ fontSize: '12px', color: '#666', cursor: 'pointer' }}
                                                >
                                                    {p.checkInMemo || '-'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ maxWidth: '150px' }}>
                                            {editingMemoPhoneKey === p.phoneKey && editingMemoType === 'user' ? (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <input
                                                        type="text"
                                                        value={memoText}
                                                        onChange={(e) => setMemoText(e.target.value)}
                                                        placeholder="메모..."
                                                        style={{
                                                            flex: 1,
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            border: '1px solid #3282f6',
                                                            borderRadius: '4px'
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleSaveMemo(p.phoneKey)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            backgroundColor: '#22c55e',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        저장
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => startEditMemo(p.phoneKey, p.userMemo, 'user')}
                                                    style={{ fontSize: '12px', color: '#666', cursor: 'pointer' }}
                                                >
                                                    {p.userMemo || '-'}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        모든 참가자가 체크인했습니다! 🎉
                    </div>
                )}
            </div>
        </div>
    );
}
