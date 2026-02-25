'use client';

import { useState } from 'react';
import { useMembers, useUpdateMember } from '@/hooks/useMembers';
import { useTypes, useAddType } from '@/hooks/useTypes';
import styles from './types.module.css';

export default function TypeManagementPage() {
    const { data, isLoading } = useMembers();
    const { data: allTypes = [], isLoading: isTypesLoading } = useTypes();
    const updateMember = useUpdateMember();
    const addType = useAddType();

    const [selectedType, setSelectedType] = useState('allMembers');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [selectedMembersToAdd, setSelectedMembersToAdd] = useState([]);
    const [showAddTypeModal, setShowAddTypeModal] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');

    // 모든 멤버가 최소한 allMembers를 가지도록 정규화
    const normalizedMembers = (data?.members || []).map(m => ({
        ...m,
        type: Array.isArray(m.type) && m.type.length > 0
            ? m.type
            : (m.type ? [m.type] : ['allMembers'])
    }));

    const members = normalizedMembers;

    // 선택된 타입에 속한 멤버들
    const membersInType = members.filter(m => {
        return m.type.includes(selectedType);
    }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko-KR'));

    // 선택된 타입에 속하지 않은 멤버들
    const membersNotInType = members.filter(m => {
        return !m.type.includes(selectedType) && selectedType !== 'allMembers';
    }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko-KR'));


    // 타입별 멤버 수
    const getTypeCount = (type) => {
        return members.filter(m => {
            return m.type.includes(type);
        }).length;
    };

    // 새 타입 추가
    const handleAddType = async () => {
        if (!newTypeName.trim()) {
            alert('타입명을 입력해주세요.');
            return;
        }

        if (allTypes.includes(newTypeName)) {
            alert('이미 존재하는 타입입니다.');
            return;
        }

        try {
            await addType.mutateAsync({ typeName: newTypeName });
            setNewTypeName('');
            setShowAddTypeModal(false);
            alert('새 타입이 추가되었습니다.');
        } catch (error) {
            alert(error.message || '타입 추가 중 오류가 발생했습니다.');
        }
    };

    // 멤버를 타입에서 제거
    const handleRemoveMember = async (member) => {
        if (!confirm(`${member.name}을(를) ${selectedType}에서 제거하시겠습니까?`)) return;

        try {
            const newTypes = Array.isArray(member.type)
                ? member.type.filter(t => t !== selectedType)
                : [member.type || 'allMembers'];

            await updateMember.mutateAsync({
                phoneKey: member.phoneKey,
                data: { type: newTypes.length > 0 ? newTypes : ['allMembers'] },
                collection: member.collection || 'participants_member'
            });

            alert('멤버가 제거되었습니다.');
        } catch (error) {
            alert(error.message || '오류가 발생했습니다.');
        }
    };

    // 멤버를 타입에 추가
    const handleAddMembers = async () => {
        if (selectedMembersToAdd.length === 0) {
            alert('추가할 멤버를 선택해주세요.');
            return;
        }

        try {
            for (const phoneKey of selectedMembersToAdd) {
                const member = members.find(m => m.phoneKey === phoneKey);
                if (!member) continue;

                const newTypes = Array.isArray(member.type)
                    ? member.type
                    : (member.type ? [member.type] : ['allMembers']);

                if (!newTypes.includes(selectedType)) {
                    newTypes.push(selectedType);
                }

                await updateMember.mutateAsync({
                    phoneKey: member.phoneKey,
                    data: { type: newTypes },
                    collection: member.collection || 'participants_member'
                });
            }

            alert('멤버가 추가되었습니다.');
            setShowAddMemberModal(false);
            setSelectedMembersToAdd([]);
        } catch (error) {
            alert(error.message || '오류가 발생했습니다.');
        }
    };

    if (isLoading || isTypesLoading) return <div className={styles.loading}>로딩 중...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>타입 관리</h1>
                <p className={styles.subtitle}>멤버들의 타입을 관리하고 분류합니다</p>
            </div>

            <div className={styles.layout}>
                {/* 좌측: 타입 목록 */}
                <div className={styles.typeList}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 className={styles.typeListTitle}>타입 목록</h2>
                        <button
                            className={styles.addBtn}
                            onClick={() => setShowAddTypeModal(true)}
                            title="새 타입 추가"
                            style={{ padding: '8px 12px', fontSize: '12px' }}
                        >
                            + 타입 추가
                        </button>
                    </div>
                    <div className={styles.typeButtons}>
                        {allTypes.map(type => (
                            <button
                                key={type}
                                className={`${styles.typeButton} ${selectedType === type ? styles.active : ''}`}
                                onClick={() => setSelectedType(type)}
                            >
                                <div className={styles.typeName}>{type}</div>
                                <div className={styles.typeCount}>{getTypeCount(type)}명</div>
                            </button>
                        ))}
                    </div>
                    <p className={styles.typeInfo}>
                        총 {allTypes.length}개 타입
                    </p>
                </div>

                {/* 우측: 타입별 멤버 명단 */}
                <div className={styles.memberSection}>
                    <div className={styles.sectionHeader}>
                        <h2>{selectedType} 멤버</h2>
                        {selectedType !== 'allMembers' && (
                            <button
                                className={styles.addBtn}
                                onClick={() => setShowAddMemberModal(true)}
                            >
                                + 멤버 추가
                            </button>
                        )}
                    </div>

                    {membersInType.length > 0 ? (
                        <div className={styles.memberTable}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>이름</th>
                                        <th>전화번호</th>
                                        <th>파트</th>
                                        <th>학교</th>
                                        <th>분류</th>
                                        {selectedType !== 'allMembers' && <th>작업</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {membersInType.map(member => (
                                        <tr key={`${member.phoneKey}-${member.collection}`}>
                                            <td><strong>{member.name}</strong></td>
                                            <td>{member.phone || member.phoneNumber || '-'}</td>
                                            <td>{member.part || '-'}</td>
                                            <td>{member.schoolName || member.school || '-'}</td>
                                            <td>
                                                <span className={`${styles.badge} ${styles[member.collection || 'participants_member']}`}>
                                                    {member.collection === 'participants_admin' ? '운영진'
                                                        : member.collection === 'participants_others' ? '외부'
                                                        : '정회원'}
                                                </span>
                                            </td>
                                            {selectedType !== 'allMembers' && (
                                                <td>
                                                    <button
                                                        className={styles.removeBtn}
                                                        onClick={() => handleRemoveMember(member)}
                                                        disabled={updateMember.isPending}
                                                    >
                                                        제거
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            이 타입에 속한 멤버가 없습니다.
                        </div>
                    )}

                    <div className={styles.stats}>
                        {selectedType !== 'allMembers' && (
                            <p>이 타입에 속하지 않은 멤버: {membersNotInType.length}명</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 멤버 추가 모달 */}
            {showAddMemberModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>{selectedType}에 멤버 추가</h2>
                        <p className={styles.modalSubtitle}>추가할 멤버를 선택하세요</p>

                        <div className={styles.memberList}>
                            {membersNotInType.length > 0 ? (
                                membersNotInType.map(member => (
                                    <label key={`${member.phoneKey}-${member.collection}`} className={styles.memberItem}>
                                        <input
                                            type="checkbox"
                                            checked={selectedMembersToAdd.includes(member.phoneKey)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedMembersToAdd([...selectedMembersToAdd, member.phoneKey]);
                                                } else {
                                                    setSelectedMembersToAdd(selectedMembersToAdd.filter(k => k !== member.phoneKey));
                                                }
                                            }}
                                        />
                                        <span className={styles.memberName}>{member.name}</span>
                                        <span className={styles.memberSchool}>{member.schoolName || '-'}</span>
                                    </label>
                                ))
                            ) : (
                                <div className={styles.empty}>추가할 수 있는 멤버가 없습니다.</div>
                            )}
                        </div>

                        <div className={styles.modalButtons}>
                            <button
                                className={styles.confirmBtn}
                                onClick={handleAddMembers}
                                disabled={updateMember.isPending || selectedMembersToAdd.length === 0}
                            >
                                {updateMember.isPending ? '추가 중...' : '추가'}
                            </button>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => {
                                    setShowAddMemberModal(false);
                                    setSelectedMembersToAdd([]);
                                }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 새 타입 추가 모달 */}
            {showAddTypeModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
                        <h2>새 타입 추가</h2>
                        <p className={styles.modalSubtitle}>새로운 멤버 분류 타입을 만들어보세요</p>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                타입명:
                            </label>
                            <input
                                type="text"
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                placeholder="예: newbie, mentor, sponsor"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleAddType();
                                }}
                            />
                        </div>

                        <div className={styles.modalButtons}>
                            <button
                                className={styles.confirmBtn}
                                onClick={handleAddType}
                            >
                                추가
                            </button>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => {
                                    setShowAddTypeModal(false);
                                    setNewTypeName('');
                                }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
