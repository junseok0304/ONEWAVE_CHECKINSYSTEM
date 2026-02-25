'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './main.module.css';

export default function KioskMainPage() {
    const router = useRouter();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTodayEvent = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/event/today`);

                if (!res.ok) {
                    throw new Error(`API Error: ${res.status}`);
                }

                const data = await res.json();

                if (data.event) {
                    setEvent(data.event);
                    if (data.autoCreated) {
                        console.log('✅ 오늘 이벤트가 자동으로 생성되었습니다.');
                    }
                } else {
                    setError('오늘은 예정된 이벤트가 없습니다.');
                }
            } catch (err) {
                setError('이벤트 정보를 불러오지 못했습니다.');
                console.error('Event fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTodayEvent();
    }, []);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.loading}>로딩 중...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.errorContainer}>
                        <h1>{error}</h1>
                        <p>관리자에게 문의해주세요.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.text}>
                    <div>여기서</div>
                    <div className={styles.highlight}>출석체크</div>
                    <div>해주세요</div>
                </div>

                <div className={styles.right}>
                    <div className={styles.card}>
                        <div className={styles.icon}>
                            <img
                                src="/GDGoC25logo.png"
                                alt="GDG"
                                style={{
                                    maxWidth: '80px',
                                    maxHeight: '80px',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>

                        <div className={styles.title}>
                            {event?.eventName || 'GDG 체크인 시스템'}
                        </div>

                        {event?.eventType && (
                            <div className={styles.eventType}>
                                {event.eventType === 'allMembers' ? '전체 멤버' : event.eventType}
                            </div>
                        )}

                        <button
                            type="button"
                            className={styles.button}
                            onClick={() => router.push('/kiosk/agreement')}
                        >
                            체크인
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
