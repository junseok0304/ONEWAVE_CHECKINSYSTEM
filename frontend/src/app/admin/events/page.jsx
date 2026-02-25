'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { useTypes } from '@/hooks/useTypes';
import styles from './events.module.css';

export default function EventsPage() {
    const router = useRouter();
    const { data, isLoading, refetch } = useEvents();
    const { data: allTypes = [] } = useTypes();
    const createEvent = useCreateEvent();
    const deleteEvent = useDeleteEvent();
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        eventName: '',
        eventType: 'allMembers',
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createEvent.mutateAsync(formData);
            setShowModal(false);
            setFormData({ date: '', eventName: '', eventType: 'allMembers' });
            await refetch();
        } catch (error) {
            alert(error.message || '이벤트 생성 실패');
        }
    };

    const handleDelete = async (date) => {
        if (!confirm('이벤트를 삭제하시겠습니까?')) return;
        try {
            await deleteEvent.mutateAsync(date);
            await refetch();
        } catch (error) {
            alert(error.message || '이벤트 삭제 실패');
        }
    };

    if (isLoading) return <div className={styles.loading}>로딩 중...</div>;

    const events = data?.events || [];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>이벤트 관리</h1>
                <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                    새 이벤트 생성
                </button>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>날짜</th>
                        <th>이벤트명</th>
                        <th>타입</th>
                        <th>참가자</th>
                        <th>체크인</th>
                        <th>진행률</th>
                        <th>작업</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => (
                        <tr key={event.date}>
                            <td>{event.date}</td>
                            <td>{event.eventName}</td>
                            <td>{event.eventType}</td>
                            <td>{event.totalParticipants}명</td>
                            <td>{event.checkedInCount}명</td>
                            <td>{event.checkInRate}%</td>
                            <td>
                                <button
                                    className={styles.viewBtn}
                                    onClick={() => router.push(`/admin/events/${event.date}`)}
                                >
                                    상세보기
                                </button>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => handleDelete(event.date)}
                                >
                                    삭제
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {events.length === 0 && (
                <div className={styles.empty}>이벤트가 없습니다.</div>
            )}

            {showModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>새 이벤트 생성</h2>
                        <form onSubmit={handleCreate}>
                            <label>
                                날짜:
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                이벤트명:
                                <input
                                    type="text"
                                    value={formData.eventName}
                                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                                    placeholder="예: GDG 정기 모임"
                                    required
                                />
                            </label>
                            <label>
                                이벤트 타입:
                                <select
                                    value={formData.eventType}
                                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                >
                                    {allTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className={styles.buttonGroup}>
                                <button type="submit" disabled={createEvent.isLoading}>
                                    {createEvent.isLoading ? '생성 중...' : '생성'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)}>
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
