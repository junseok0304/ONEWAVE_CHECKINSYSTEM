'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParticipants, useRefreshParticipants } from '@/hooks/useParticipants';
import { formatPhoneNumber } from '@/lib/format';
import styles from './realtime.module.css';

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

/**
 * 경과시간 포맷팅 (N초/분/시간 전)
 */
function formatUpdateTime(date) {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    return `${Math.floor(diff / 3600)}시간 전`;
}

export default function RealtimePage() {
    const { data: participants = [], isLoading, error, refetch } = useParticipants();
    const manualRefresh = useRefreshParticipants();

    // UI 상태
    const [selectedTeamNumber, setSelectedTeamNumber] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [, setUpdateCounter] = useState(0);

    // 경과시간 자동 갱신 (1초마다)
    useEffect(() => {
        const interval = setInterval(() => {
            setUpdateCounter(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // 데이터 로드 후 lastUpdate 설정 (초기 로드시만)
    useEffect(() => {
        if (participants.length > 0 && !lastUpdate) {
            setLastUpdate(new Date());
        }
    }, []);

    /**
     * 팀 상태 계산
     */
    const teamStatus = useMemo(() => {
        const teamMap = {};

        // 1-50 팀 초기화
        for (let i = 1; i <= 50; i++) {
            teamMap[i] = { teamNumber: i, members: [], allCheckedIn: false };
        }

        // 운영진 팀 (team_number === 0) 초기화
        teamMap[0] = { teamNumber: 0, members: [], allCheckedIn: false, isAdmin: true };

        // 참가자 그룹화
        participants.forEach(p => {
            const teamNum = parseInt(p.team_number);
            if (teamNum === 0 || (teamNum >= 1 && teamNum <= 50)) {
                teamMap[teamNum].members.push(p);
            }
        });

        // 각 팀의 체크인 완료 여부 계산
        Object.values(teamMap).forEach(team => {
            if (team.members.length > 0) {
                team.allCheckedIn = team.members.every(m => m.isCheckedIn);
            }
        });

        // 1-50, 운영진 순서로 반환
        const result = Array.from({ length: 50 }, (_, i) => teamMap[i + 1]);
        result.push(teamMap[0]);
        return result;
    }, [participants]);

    /**
     * 통계 계산 (운영진 제외)
     */
    const stats = useMemo(() => {
        const regularTeams = teamStatus.filter(t => !t.isAdmin);
        const completeTeams = regularTeams.filter(t => t.allCheckedIn).length;
        const incompleteTeams = regularTeams.filter(t => !t.allCheckedIn).length;

        return {
            total: 50,
            complete: completeTeams,
            incomplete: incompleteTeams,
        };
    }, [teamStatus]);

    /**
     * 최근 체크인 목록
     */
    const recentCheckins = useMemo(() => {
        return participants
            .filter(p => p.isCheckedIn && p.checkedInAt)
            .sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt));
    }, [participants]);

    /**
     * 선택된 팀의 멤버 목록
     */
    const selectedTeamMembers = useMemo(() => {
        if (selectedTeamNumber === null) return [];

        return participants
            .filter(p => parseInt(p.team_number) === selectedTeamNumber)
            .sort((a, b) => {
                if (a.isCheckedIn !== b.isCheckedIn) {
                    return b.isCheckedIn - a.isCheckedIn;
                }
                return (a.name || '').localeCompare(b.name || '');
            });
    }, [participants, selectedTeamNumber]);

    const handleManualRefresh = useCallback(async () => {
        await refetch();
        setLastUpdate(new Date());
    }, [refetch]);

    if (isLoading) {
        return <div className={styles.loadingWrap}>로딩 중...</div>;
    }

    return (
        <div className={styles.wrap}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>실시간 체크인 현황</h1>
                </div>
                <div className={styles.headerRight}>
                    <button
                        className={`${styles.refreshBtn} ${isLoading ? styles.loading : ''}`}
                        onClick={handleManualRefresh}
                        disabled={isLoading}
                        title="새로고침"
                    >
                        ⟳
                    </button>
                    {lastUpdate && (
                        <div className={styles.lastUpdate}>
                            {formatUpdateTime(lastUpdate)}
                        </div>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && <div className={styles.errorBox}>{error.message}</div>}

            {/* 통계 */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>전체 팀</div>
                    <div className={styles.statValue}>{stats.total}</div>
                    <div className={styles.statUnit}>팀</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>완료된 팀</div>
                    <div className={`${styles.statValue}`} style={{ color: '#22c55e' }}>
                        {stats.complete}
                    </div>
                    <div className={styles.statUnit}>팀 ({Math.round((stats.complete / stats.total) * 100)}%)</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>미완료 팀</div>
                    <div className={`${styles.statValue}`} style={{ color: '#ef4444' }}>
                        {stats.incomplete}
                    </div>
                    <div className={styles.statUnit}>팀 ({Math.round((stats.incomplete / stats.total) * 100)}%)</div>
                </div>
            </div>

            {/* 최근 체크인 */}
            <div className={styles.tableContainer}>
                <div className={styles.tableTitle}>최근 체크인 참가자</div>
                {recentCheckins.length === 0 ? (
                    <div className={styles.emptyState}>아직 체크인한 참가자가 없습니다.</div>
                ) : (
                    <table className={styles.participantTable}>
                        <thead className={styles.tableHead}>
                            <tr className={styles.tableRow}>
                                <th className={styles.tableCell}>체크인 시간</th>
                                <th className={styles.tableCell}>이름</th>
                                <th className={styles.tableCell}>팀</th>
                                <th className={styles.tableCell}>파트</th>
                                <th className={styles.tableCell}>전화번호</th>
                            </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                            {recentCheckins.map(p => (
                                <tr key={p.id} className={styles.tableRow}>
                                    <td className={styles.tableCell} data-label="체크인 시간">
                                        {formatDate(p.checkedInAt)}
                                    </td>
                                    <td className={styles.tableCell} data-label="이름">
                                        {p.name}
                                    </td>
                                    <td className={styles.tableCell} data-label="팀">
                                        {p.team_number || '-'}
                                    </td>
                                    <td className={styles.tableCell} data-label="파트">
                                        {p.part || '-'}
                                    </td>
                                    <td className={styles.tableCell} data-label="전화번호">
                                        {formatPhoneNumber(p.phone_number)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 팀 그리드 */}
            <div className={styles.gridContainer}>
                <div className={styles.gridTitle}>팀 체크인 현황 (GitHub Grass 스타일) - 팀을 클릭하면 명단 보기</div>
                <div className={styles.teamGrid}>
                    {teamStatus.map(team => (
                        <div
                            key={team.teamNumber}
                            className={`${styles.teamBlock} ${team.allCheckedIn ? styles.complete : styles.incomplete} ${selectedTeamNumber === team.teamNumber ? styles.selected : ''} ${team.isAdmin ? styles.adminTeam : ''}`}
                            title={`${team.isAdmin ? '운영진' : `팀 ${team.teamNumber}`}: ${team.members.length}명 (${team.members.filter(m => m.isCheckedIn).length}명 체크인)`}
                            onClick={() => setSelectedTeamNumber(selectedTeamNumber === team.teamNumber ? null : team.teamNumber)}
                        >
                            {team.isAdmin ? '운영진' : team.teamNumber}
                        </div>
                    ))}
                </div>
            </div>

            {/* 선택된 팀의 멤버 */}
            {selectedTeamNumber !== null && (
                <div className={styles.tableContainer}>
                    <div className={styles.tableTitle}>{selectedTeamNumber === 0 ? '운영진' : `팀 ${selectedTeamNumber}`} 명단</div>
                    {selectedTeamMembers.length === 0 ? (
                        <div className={styles.emptyState}>이 팀에 등록된 참가자가 없습니다.</div>
                    ) : (
                        <table className={styles.participantTable}>
                            <thead className={styles.tableHead}>
                                <tr className={styles.tableRow}>
                                    <th className={styles.tableCell}>이름</th>
                                    <th className={styles.tableCell}>상태</th>
                                    <th className={styles.tableCell}>체크인 시간</th>
                                    <th className={styles.tableCell}>파트</th>
                                    <th className={styles.tableCell}>전화번호</th>
                                </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                                {selectedTeamMembers.map(p => (
                                    <tr key={p.id} className={styles.tableRow}>
                                        <td className={styles.tableCell} data-label="이름">
                                            {p.name}
                                        </td>
                                        <td className={styles.tableCell} data-label="상태">
                                            <span
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '700',
                                                    backgroundColor: p.isCheckedIn ? '#d4edda' : '#f8d7da',
                                                    color: p.isCheckedIn ? '#155724' : '#721c24',
                                                }}
                                            >
                                                {p.isCheckedIn ? '✓ 체크인' : '✗ 미체크인'}
                                            </span>
                                        </td>
                                        <td className={styles.tableCell} data-label="체크인 시간">
                                            {formatDate(p.checkedInAt)}
                                        </td>
                                        <td className={styles.tableCell} data-label="파트">
                                            {p.part || '-'}
                                        </td>
                                        <td className={styles.tableCell} data-label="전화번호">
                                            {formatPhoneNumber(p.phone_number)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
