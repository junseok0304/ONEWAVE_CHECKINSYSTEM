'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParticipants, useRefreshParticipants } from '@/hooks/useParticipants';
import styles from './dashboard.module.css';

// 상수
const EVENT_START_TIME = new Date(new Date().getFullYear(), 1, 6, 12, 0, 0);
const EVENT_END_TIME = new Date(new Date().getFullYear(), 1, 7, 12, 0, 0);

/**
 * 시간 포맷팅 유틸리티
 */
function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 날짜 포맷팅 유틸리티
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

export default function AdminDashboard() {
    const { data: participants = [], isLoading, error, refetch } = useParticipants();
    const manualRefresh = useRefreshParticipants();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);
    const [lastUpdate, setLastUpdate] = useState(null);

    // 시간 업데이트 (1초마다)
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // 경과시간 계산 (currentTime 업데이트시)
    useEffect(() => {
        if (lastUpdate) {
            const diff = Math.floor((currentTime - lastUpdate) / 1000);
            setTimeSinceUpdate(diff);
        }
    }, [currentTime, lastUpdate]);

    // 초기 데이터 로드 시 lastUpdate 설정
    useEffect(() => {
        if (participants.length > 0) {
            setLastUpdate(new Date());
        }
    }, []);

    /**
     * 행사 진행 시간 계산
     */
    const eventTime = useMemo(() => {
        const now = new Date();
        const elapsedMs = now - EVENT_START_TIME;
        const remainingMs = EVENT_END_TIME - now;
        const totalMs = EVENT_END_TIME - EVENT_START_TIME;

        return {
            elapsed: formatTime(elapsedMs),
            remaining: formatTime(remainingMs),
            progress: Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)),
            isEnded: now >= EVENT_END_TIME,
        };
    }, [currentTime]);

    /**
     * 통계 계산
     */
    const stats = useMemo(() => {
        const regular = participants.filter(p => p.team_number !== 0 && p.team_number !== '0');
        const checkedIn = regular.filter(p => p.isCheckedIn).length;
        const total = regular.length;
        const notCheckedIn = total - checkedIn;
        const percentage = total > 0 ? (checkedIn / total) * 100 : 0;

        return {
            checkedIn,
            total,
            notCheckedIn,
            percentage,
        };
    }, [participants]);

    /**
     * 최근 체크인 목록 (상위 10명)
     */
    const recentCheckins = useMemo(() => {
        return participants
            .filter(p => p.isCheckedIn && p.checkedInAt)
            .sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt))
            .slice(0, 10);
    }, [participants]);

    /**
     * 진행률 색상 결정
     */
    const progressColorClass = useMemo(() => {
        if (stats.percentage < 50) return styles.progressDanger;
        if (stats.percentage < 80) return styles.progressWarn;
        return styles.progressGood;
    }, [stats.percentage]);

    const handleRefresh = async () => {
        await refetch();
        setLastUpdate(new Date());
    };

    if (isLoading) {
        return <div className={styles.loadingWrap}>로딩 중...</div>;
    }

    return (
        <div className={styles.wrap}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <div className={styles.title}>ONEWAVE HACKATHON</div>
                    <div className={styles.subtitle}>
                        참가자 체크인 현황을 한 번에 확인할 수 있습니다.
                    </div>
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        type="button"
                        className={`${styles.refreshBtn} ${isLoading ? styles.disabled : ''}`}
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        {isLoading ? '새로고침 중...' : '새로고침'}
                    </button>
                    <div className={styles.lastUpdate}>
                        마지막 업데이트: {timeSinceUpdate}초 전
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className={styles.errorBox}>
                    {error.message || '데이터를 불러오지 못했습니다.'}
                </div>
            )}

            {/* 체크인 진행률 */}
            <div className={styles.progressCard}>
                <div className={styles.progressTop}>
                    <div className={styles.progressTitle}>체크인 진행률</div>
                    <div className={styles.progressPercent}>
                        {stats.total > 0 ? `${stats.percentage.toFixed(1)}%` : '0%'}
                    </div>
                </div>

                <div className={styles.progressTrack}>
                    <div
                        className={`${styles.progressBar} ${progressColorClass}`}
                        style={{ width: `${stats.percentage}%` }}
                    />
                </div>

                <div className={styles.progressHint}>
                    체크인 완료 <b>{stats.checkedIn}명</b> / 전체 <b>{stats.total}명</b>
                </div>
            </div>

            {/* 시간 정보 */}
            <div className={styles.clocksGrid}>
                {/* 현재 시간 */}
                <div className={styles.clockCard}>
                    <div className={styles.clockHeader}>
                        <div className={styles.clockLabel}>현재시간</div>
                        <div className={styles.clockDate}>
                            {currentTime.toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                            })}
                        </div>
                    </div>
                    <div className={styles.clockContent}>
                        <div className={styles.clockTime}>
                            {currentTime.toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                            })}
                        </div>
                    </div>
                </div>

                {/* 행사 진행 */}
                <div className={styles.clockCard}>
                    <div className={styles.clockHeader}>
                        <div className={styles.clockLabel}>행사 진행</div>
                        <div className={styles.progressPercent}>
                            {eventTime.progress.toFixed(1)}%
                        </div>
                    </div>
                    <div className={styles.eventContent}>
                        <div className={styles.eventTimes}>
                            <div className={styles.eventTimeItem}>
                                <span className={styles.eventTimeLabel}>경과</span>
                                <span className={styles.eventTime}>{eventTime.elapsed}</span>
                            </div>
                            <div className={styles.eventTimeItem}>
                                <span className={styles.eventTimeLabel}>남은시간</span>
                                <span className={styles.eventTime} style={{
                                    color: eventTime.isEnded ? '#dc3545' : eventTime.progress > 80 ? '#fd7e14' : '#22c55e'
                                }}>
                                    {eventTime.remaining}
                                </span>
                            </div>
                        </div>
                        <div className={styles.progressTrack}>
                            <div
                                className={styles.progressBar}
                                style={{
                                    width: `${eventTime.progress}%`,
                                    backgroundColor: eventTime.isEnded ? '#dc3545' : eventTime.progress > 80 ? '#fd7e14' : '#22c55e'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 통계 */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statNumberSection}>{stats.total}</div>
                    <div className={styles.statTextSection}>
                        <div className={styles.statLabel}>전체</div>
                        <div className={styles.statLabel}>참가자</div>
                        <div className={styles.statUnit}>명</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.statNumberSection} ${styles.good}`}>{stats.checkedIn}</div>
                    <div className={styles.statTextSection}>
                        <div className={styles.statLabel}>체크인</div>
                        <div className={styles.statLabel}>완료</div>
                        <div className={styles.statMeta}>
                            {stats.total > 0 ? `${stats.percentage.toFixed(1)}%` : '0%'}
                        </div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.statNumberSection} ${styles.danger}`}>{stats.notCheckedIn}</div>
                    <div className={styles.statTextSection}>
                        <div className={styles.statLabel}>미체크인</div>
                        <div className={styles.statUnit}>명</div>
                    </div>
                </div>
            </div>

            {/* 최근 체크인 */}
            <div className={styles.recentSection}>
                <div className={styles.recentTitle}>최근 체크인 (상위 10명)</div>
                {recentCheckins.length === 0 ? (
                    <div className={styles.emptyState}>아직 체크인한 참가자가 없습니다.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            minWidth: '600px',
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>체크인 시간</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>이름</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>팀</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>파트</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentCheckins.map((p) => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '12px', fontSize: '14px' }}>
                                            {formatDate(p.checkedInAt)}
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: '600' }}>
                                            {p.name}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {p.team_number || '-'}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {p.part || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
