'use client';

import { useState } from 'react';
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from '@/hooks/useMembers';
import { formatPhoneNumber } from '@/lib/format';
import { DEFAULT_TYPES } from '@/constants/types';
import styles from './members.module.css';

export default function MembersPage() {
    const { data, isLoading } = useMembers();
    const createMember = useCreateMember();
    const updateMember = useUpdateMember();
    const deleteMember = useDeleteMember();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPhoneKey, setEditingPhoneKey] = useState(null);
    const [editingCollection, setEditingCollection] = useState('member_database');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [selectedTypes, setSelectedTypes] = useState([]);

    const [formData, setFormData] = useState({
        phoneNumber: '',
        name: '',
        part: '',
        schoolName: '',
        position: '',
        gen: '',
        memo: '',
        type: ['allMembers'],
        collection: 'participants_member',
    });

    // 모든 멤버가 최소한 allMembers를 가지도록 정규화
    const normalizedMembers = (data?.members || []).map(m => ({
        ...m,
        type: Array.isArray(m.type) && m.type.length > 0
            ? m.type
            : (m.type ? [m.type] : ['allMembers'])
    }));

    const members = normalizedMembers;

    // 검색, 타입 필터, 정렬
    const filteredAndSortedMembers = members
        .filter(m => {
            // 검색 필터
            const query = searchQuery.toLowerCase();
            const matchesSearch = (
                m.name?.toLowerCase().includes(query) ||
                m.phoneNumber?.toLowerCase().includes(query) ||
                m.phone?.toLowerCase().includes(query) ||
                m.phoneKey?.toLowerCase().includes(query)
            );

            // 타입 필터
            if (selectedTypes.length === 0) {
                return matchesSearch;
            }

            const memberTypes = m.type;
            const matchesType = selectedTypes.some(selectedType =>
                memberTypes.includes(selectedType)
            );

            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '', 'ko-KR');
            } else if (sortBy === 'phoneKey') {
                return (a.phoneKey || '').localeCompare(b.phoneKey || '');
            }
            return 0;
        });

    const handleCreateOpen = () => {
        setFormData({
            phoneNumber: '',
            name: '',
            part: '',
            schoolName: '',
            position: '',
            gen: '',
            memo: '',
            type: ['allMembers'],
            collection: 'participants_member',
        });
        setEditingPhoneKey(null);
        setShowCreateModal(true);
    };

    const handleEditOpen = (member) => {
        setFormData({
            phoneNumber: member.phoneNumber || member.phone || '',
            name: member.name,
            part: member.part,
            schoolName: member.schoolName || member.school || '',
            position: member.position || '',
            gen: member.gen || '',
            memo: member.memo || '',
            type: Array.isArray(member.type) ? member.type : (member.type ? [member.type] : ['allMembers']),
            collection: member.collection || 'participants_member',
        });
        setEditingPhoneKey(member.phoneKey);
        setEditingCollection(member.collection || 'participants_member');
        setShowCreateModal(true);
    };

    const handleDelete = async (member) => {
        if (!confirm(`${member.name} 멤버를 삭제하시겠습니까?`)) {
            return;
        }

        try {
            await deleteMember.mutateAsync({
                phoneKey: member.phoneKey,
                collection: member.collection || 'participants_member'
            });
            alert('멤버가 삭제되었습니다.');
        } catch (error) {
            alert(error.message || '삭제 중 오류가 발생했습니다.');
        }
    };

    const handleTypeToggle = (type) => {
        setFormData(prev => {
            const newTypes = prev.type.includes(type)
                ? prev.type.filter(t => t !== type)
                : [...prev.type, type];
            return { ...prev, type: newTypes };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phoneNumber || !formData.part) {
            alert('필수 정보를 입력해주세요.');
            return;
        }

        try {
            // 전화번호에서 숫자만 추출하여 phoneKey 생성
            const phoneKey = formData.phoneNumber.replace(/[^0-9]/g, '');

            if (editingPhoneKey) {
                // 수정
                const { collection, ...updateData } = formData;
                await updateMember.mutateAsync({
                    phoneKey: editingPhoneKey,
                    data: updateData,
                    collection: collection || editingCollection
                });
                alert('멤버 정보가 수정되었습니다.');
            } else {
                // 추가
                const { collection, ...memberData } = formData;
                await createMember.mutateAsync({
                    memberData: {
                        ...memberData,
                        phoneKey
                    },
                    collection: collection || 'participants_member'
                });
                alert('새 멤버가 추가되었습니다.');
            }
            setShowCreateModal(false);
        } catch (error) {
            alert(error.message || '오류가 발생했습니다.');
        }
    };

    if (isLoading) return <div className={styles.loading}>로딩 중...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>멤버 관리</h1>
                <button
                    className={styles.createBtn}
                    onClick={handleCreateOpen}
                    disabled={createMember.isPending}
                >
                    {createMember.isPending ? '추가 중...' : '+ 새 멤버 추가'}
                </button>
            </div>

            <div className={styles.controls}>
                <input
                    type="text"
                    placeholder="이름, 전화번호, ID로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={styles.sortSelect}
                >
                    <option value="name">이름순</option>
                    <option value="phoneKey">ID순</option>
                </select>
                <span className={styles.count}>총 {filteredAndSortedMembers.length}명</span>
            </div>

            <div className={styles.typeFilters}>
                <button
                    className={`${styles.typeFilterBtn} ${selectedTypes.length === 0 ? styles.active : ''}`}
                    onClick={() => setSelectedTypes([])}
                >
                    전체 ({members.length}명)
                </button>
                {DEFAULT_TYPES.map(type => {
                    const count = members.filter(m => {
                        const memberTypes = Array.isArray(m.type) ? m.type : (m.type ? [m.type] : ['allMembers']);
                        return memberTypes.includes(type);
                    }).length;

                    return (
                        <button
                            key={type}
                            className={`${styles.typeFilterBtn} ${selectedTypes.includes(type) ? styles.active : ''}`}
                            onClick={() => {
                                setSelectedTypes(prev =>
                                    prev.includes(type)
                                        ? prev.filter(t => t !== type)
                                        : [...prev, type]
                                );
                            }}
                        >
                            {type} ({count}명)
                        </button>
                    );
                })}
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID (phoneKey)</th>
                            <th>이름</th>
                            <th>전화번호</th>
                            <th>파트</th>
                            <th>학교</th>
                            <th>직책</th>
                            <th>타입</th>
                            <th>분류</th>
                            <th>작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedMembers.map((member) => (
                            <tr key={`${member.phoneKey}-${member.collection}`}>
                                <td className={styles.phoneKey}>{member.phoneKey}</td>
                                <td><strong>{member.name}</strong></td>
                                <td>{formatPhoneNumber(member.phoneNumber || member.phone)}</td>
                                <td>{member.part || '-'}</td>
                                <td>{member.schoolName || member.school || '-'}</td>
                                <td>{member.position || '-'}</td>
                                <td>
                                    <div className={styles.typeContainer}>
                                        {Array.isArray(member.type) && member.type.length > 0
                                            ? member.type
                                                .filter(t => t !== 'allMembers')
                                                .map(type => (
                                                    <span key={type} className={styles.typeBadge}>
                                                        {type}
                                                    </span>
                                                ))
                                            : <span className={styles.typeBadge}>allMembers</span>
                                        }
                                    </div>
                                </td>
                                <td>
                                    <span className={`${styles.collectionBadge} ${styles[member.collection || 'member_database']}`}>
                                        {member.collection === 'participants_admin' ? '운영진'
                                            : member.collection === 'participants_others' ? '외부'
                                            : '정회원'}
                                    </span>
                                </td>
                                <td style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className={styles.editBtn}
                                        onClick={() => handleEditOpen(member)}
                                    >
                                        수정
                                    </button>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => handleDelete(member)}
                                        disabled={deleteMember.isPending}
                                    >
                                        {deleteMember.isPending ? '삭제 중...' : '삭제'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>{editingPhoneKey ? '멤버 수정' : '새 멤버 추가'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>
                                    이름 *
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="김철수"
                                        required
                                    />
                                </label>
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    전화번호 *
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        placeholder="010-1234-5678"
                                        required
                                    />
                                </label>
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    파트 *
                                    <input
                                        type="text"
                                        value={formData.part}
                                        onChange={(e) => setFormData({ ...formData, part: e.target.value })}
                                        placeholder="Backend"
                                        required
                                    />
                                </label>
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    학교
                                    <input
                                        type="text"
                                        value={formData.schoolName}
                                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                                        placeholder="성공회대학교"
                                    />
                                </label>
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    직책
                                    <input
                                        type="text"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        placeholder="Member"
                                    />
                                </label>
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    기수 (Gen)
                                    <input
                                        type="text"
                                        value={formData.gen}
                                        onChange={(e) => setFormData({ ...formData, gen: e.target.value })}
                                        placeholder="25-26"
                                    />
                                </label>
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    분류 *
                                    <select
                                        value={formData.collection}
                                        onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                                        required
                                    >
                                        <option value="participants_member">정회원</option>
                                        <option value="participants_others">외부</option>
                                        <option value="participants_admin">운영진</option>
                                    </select>
                                </label>
                            </div>

                            <div className={styles.formGroup}>
                                <label>멤버 타입</label>
                                <div className={styles.typeCheckboxes}>
                                    {DEFAULT_TYPES.map(type => (
                                        <label key={type} className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={formData.type.includes(type)}
                                                onChange={() => handleTypeToggle(type)}
                                            />
                                            {type}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    유저메모
                                    <textarea
                                        value={formData.memo}
                                        onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                                        placeholder="메모 입력"
                                        style={{ minHeight: '80px' }}
                                    />
                                </label>
                            </div>

                            <div className={styles.buttonGroup}>
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={createMember.isPending || updateMember.isPending}
                                >
                                    {editingPhoneKey ? '수정' : '추가'}
                                </button>
                                <button
                                    type="button"
                                    className={styles.cancelBtn}
                                    onClick={() => setShowCreateModal(false)}
                                >
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
