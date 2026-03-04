'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEventDetail, useManualCheckin, useCancelCheckin } from '@/hooks/useEvents';
import { useUpdateMemberMemo } from '@/hooks/useMembers';
import { formatPhoneNumber, formatTimeKST } from '@/lib/format';
import styles from './detail.module.css';

export default function EventDetailPage() {
    const params = useParams();
    // date가 배열로 들어올 수 있으므로 첫 번째 요소 사용
    const date = Array.isArray(params.date) ? params.date[0] : params.date;
    const router = useRouter();
    const { data, isLoading, refetch } = useEventDetail(date);
    const manualCheckin = useManualCheckin();
    const cancelCheckin = useCancelCheckin();
    const updateMemo = useUpdateMemberMemo();

    // 메모 수정 상태
    const [editingMemoPhoneKey, setEditingMemoPhoneKey] = useState(null);
    const [editingMemoType, setEditingMemoType] = useState('checkin'); // 'checkin' | 'user'
    const [memoText, setMemoText] = useState('');

    const handleManualCheckin = async (phoneKey) => {
        if (!confirm('수동 체크인을 진행하시겠습니까?')) return;

        try {
            await manualCheckin.mutateAsync({ phoneKey, date });
            await refetch();
        } catch (error) {
            alert(error.message || '수동 체크인 실패');
        }
    };

    const handleCancelCheckin = async (phoneKey, name) => {
        if (!confirm(`${name}의 체크인을 취소하시겠습니까?`)) return;

        try {
            await cancelCheckin.mutateAsync({ phoneKey, date });
            alert('체크인이 취소되었습니다.');
            await refetch();
        } catch (error) {
            alert(error.message || '체크인 취소 실패');
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

            if (editingMemoType === 'checkin') {
                // 특이사항메모
                const apiPath = `/checkin/${date}/${phoneKey}/memo`;
                const payload = { memo: memoText, type: 'checkin' };
                await request(apiPath, 'PATCH', payload);
                alert('특이사항메모가 저장되었습니다.');
            } else if (editingMemoType === 'user') {
                // 유저메모
                const apiPath = `/members/${phoneKey}/memo`;
                const payload = { memo: memoText };
                await request(apiPath, 'PATCH', payload);
                alert('유저메모가 저장되었습니다.');
            }

            setEditingMemoPhoneKey(null);
            setMemoText('');
            await refetch();
        } catch (err) {
            alert(err.message || '저장 실패');
        }
    };

    if (isLoading) return <div className={styles.loading}>로딩 중...</div>;

    if (!data?.data) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>이벤트를 찾을 수 없습니다.</div>
            </div>
        );
    }

    const { event, checkedIn, notCheckedIn, stats } = data.data;

    // 최신 체크인순 정렬 (최근 체크인한 사람이 맨 위)
    const sortedCheckedIn = [...checkedIn].sort((a, b) => {
        const aTime = a.checkedInAt ? new Date(a.checkedInAt) : new Date(0);
        const bTime = b.checkedInAt ? new Date(b.checkedInAt) : new Date(0);
        return bTime - aTime; // 최신순
    });

    // 미체크인은 가나다순
    const sortedNotCheckedIn = [...notCheckedIn].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'ko-KR')
    );

    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => router.back()}>
                ← 뒤로가기
            </button>

            <div className={styles.header}>
                <div>
                    <h1>{event.eventName}</h1>
                    <p>날짜: {date} | 타입: {event.eventType}</p>
                </div>
            </div>

            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>전체 참가자</div>
                    <div className={styles.statValue}>{stats.totalParticipants}명</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>체크인 완료</div>
                    <div className={styles.statValue}>{stats.checkedInCount}명</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>미체크인</div>
                    <div className={styles.statValue}>{stats.notCheckedInCount}명</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>진행률</div>
                    <div className={styles.statValue}>{stats.percentage}%</div>
                </div>
            </div>

            <section className={styles.section}>
                <h2>체크인 완료 ({sortedCheckedIn.length}명)</h2>
                {sortedCheckedIn.length > 0 ? (
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
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCheckedIn.map((p) => (
                                <tr key={p.phoneKey}>
                                    <td>{p.name}</td>
                                    <td>{p.part || '-'}</td>
                                    <td>{p.school || '-'}</td>
                                    <td>{formatPhoneNumber(p.phoneNumber)}</td>
                                    <td>{formatTimeKST(p.checkedInAt)}</td>
                                    <td className={styles.memoCell}>
                                        {editingMemoPhoneKey === p.phoneKey && editingMemoType === 'checkin' ? (
                                            <div className={styles.memoEditContainer}>
                                                <textarea
                                                    value={memoText}
                                                    onChange={(e) => setMemoText(e.target.value)}
                                                    className={styles.memoInput}
                                                    placeholder="메모 입력"
                                                />
                                                <div className={styles.memoActions}>
                                                    <button
                                                        className={styles.saveMemoBtn}
                                                        onClick={() => handleSaveMemo(p.phoneKey)}
                                                        disabled={updateMemo.isLoading}
                                                    >
                                                        저장
                                                    </button>
                                                    <button
                                                        className={styles.cancelMemoBtn}
                                                        onClick={() => setEditingMemoPhoneKey(null)}
                                                        disabled={updateMemo.isLoading}
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={styles.memoDisplay}
                                                onClick={() => startEditMemo(p.phoneKey, p.checkInMemo, 'checkin')}
                                            >
                                                {p.checkInMemo || <span className={styles.emptyMemo}>메모 없음</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className={styles.memoCell}>
                                        {editingMemoPhoneKey === p.phoneKey && editingMemoType === 'user' ? (
                                            <div className={styles.memoEditContainer}>
                                                <textarea
                                                    value={memoText}
                                                    onChange={(e) => setMemoText(e.target.value)}
                                                    className={styles.memoInput}
                                                    placeholder="메모 입력"
                                                />
                                                <div className={styles.memoActions}>
                                                    <button
                                                        className={styles.saveMemoBtn}
                                                        onClick={() => handleSaveMemo(p.phoneKey)}
                                                        disabled={updateMemo.isLoading}
                                                    >
                                                        저장
                                                    </button>
                                                    <button
                                                        className={styles.cancelMemoBtn}
                                                        onClick={() => setEditingMemoPhoneKey(null)}
                                                        disabled={updateMemo.isLoading}
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={styles.memoDisplay}
                                                onClick={() => startEditMemo(p.phoneKey, p.userMemo, 'user')}
                                            >
                                                {p.userMemo || <span className={styles.emptyMemo}>메모 없음</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className={styles.cancelCheckinBtn}
                                            onClick={() => handleCancelCheckin(p.phoneKey, p.name)}
                                            disabled={cancelCheckin.isLoading}
                                        >
                                            체크인 취소
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className={styles.empty}>체크인한 참가자가 없습니다.</p>
                )}
            </section>

            <section className={styles.section}>
                <h2>미체크인 ({sortedNotCheckedIn.length}명)</h2>
                {sortedNotCheckedIn.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>이름</th>
                                <th>파트</th>
                                <th>학교</th>
                                <th>전화번호</th>
                                <th>특이사항메모</th>
                                <th>유저메모</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedNotCheckedIn.map((p) => (
                                <tr key={p.phoneKey}>
                                    <td>{p.name}</td>
                                    <td>{p.part || '-'}</td>
                                    <td>{p.school || '-'}</td>
                                    <td>{formatPhoneNumber(p.phoneNumber)}</td>
                                    <td className={styles.memoCell}>
                                        {editingMemoPhoneKey === p.phoneKey && editingMemoType === 'checkin' ? (
                                            <div className={styles.memoEditContainer}>
                                                <textarea
                                                    value={memoText}
                                                    onChange={(e) => setMemoText(e.target.value)}
                                                    className={styles.memoInput}
                                                    placeholder="메모 입력"
                                                />
                                                <div className={styles.memoActions}>
                                                    <button
                                                        className={styles.saveMemoBtn}
                                                        onClick={() => handleSaveMemo(p.phoneKey)}
                                                        disabled={updateMemo.isLoading}
                                                    >
                                                        저장
                                                    </button>
                                                    <button
                                                        className={styles.cancelMemoBtn}
                                                        onClick={() => setEditingMemoPhoneKey(null)}
                                                        disabled={updateMemo.isLoading}
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={styles.memoDisplay}
                                                onClick={() => startEditMemo(p.phoneKey, p.checkInMemo, 'checkin')}
                                            >
                                                {p.checkInMemo || <span className={styles.emptyMemo}>메모 없음</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className={styles.memoCell}>
                                        {editingMemoPhoneKey === p.phoneKey && editingMemoType === 'user' ? (
                                            <div className={styles.memoEditContainer}>
                                                <textarea
                                                    value={memoText}
                                                    onChange={(e) => setMemoText(e.target.value)}
                                                    className={styles.memoInput}
                                                    placeholder="메모 입력"
                                                />
                                                <div className={styles.memoActions}>
                                                    <button
                                                        className={styles.saveMemoBtn}
                                                        onClick={() => handleSaveMemo(p.phoneKey)}
                                                        disabled={updateMemo.isLoading}
                                                    >
                                                        저장
                                                    </button>
                                                    <button
                                                        className={styles.cancelMemoBtn}
                                                        onClick={() => setEditingMemoPhoneKey(null)}
                                                        disabled={updateMemo.isLoading}
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={styles.memoDisplay}
                                                onClick={() => startEditMemo(p.phoneKey, p.userMemo, 'user')}
                                            >
                                                {p.userMemo || <span className={styles.emptyMemo}>메모 없음</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className={styles.checkinBtn}
                                            onClick={() => handleManualCheckin(p.phoneKey)}
                                            disabled={manualCheckin.isLoading}
                                        >
                                            수동 체크인
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className={styles.empty}>모든 참가자가 체크인했습니다.</p>
                )}
            </section>
        </div>
    );
}
