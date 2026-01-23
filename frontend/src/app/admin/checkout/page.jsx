'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export default function CheckoutPage() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMemoId, setEditingMemoId] = useState(null);
  const [editingMemoValue, setEditingMemoValue] = useState('');
  const [checkoutMemo, setCheckoutMemo] = useState({});

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest(
        '/participants',
        'GET',
        undefined,
        process.env.NEXT_PUBLIC_MASTER_PASSWORD || ''
      );
      setParticipants(data.filter(p => p.isCheckedIn));
    } catch (err) {
      setError(err.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (participantId) => {
    const memo = checkoutMemo[participantId] || '';
    if (!window.confirm('체크아웃 처리하시겠습니까?')) {
      return;
    }

    try {
      await apiRequest(
        `/participants/${participantId}`,
        'PUT',
        { checkedOutMemo: memo },
        process.env.NEXT_PUBLIC_MASTER_PASSWORD || ''
      );
      setCheckoutMemo((prev) => {
        const newMemo = { ...prev };
        delete newMemo[participantId];
        return newMemo;
      });
      fetchParticipants();
    } catch (err) {
      alert(err.message || '체크아웃 처리에 실패했습니다.');
    }
  };

  const handleSaveMemo = async (participantId) => {
    try {
      await apiRequest(
        `/participants/${participantId}`,
        'PUT',
        { checkedOutMemo: editingMemoValue },
        process.env.NEXT_PUBLIC_MASTER_PASSWORD || ''
      );
      setEditingMemoId(null);
      fetchParticipants();
    } catch (err) {
      alert(err.message || '메모 저장에 실패했습니다.');
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : new Date(dateValue);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString('ko-KR');
    } catch (e) {
      return '-';
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.name?.includes(searchTerm) || p.id?.includes(searchTerm)
  );

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      <h1>체크아웃 관리</h1>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="이름 또는 ID 검색"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '20px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxSizing: 'border-box',
        }}
      />

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>이름</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>체크인 시간</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>체크아웃 시간</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>체크아웃 메모</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>작업</th>
          </tr>
        </thead>
        <tbody>
          {filteredParticipants.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '12px' }}>{p.name}</td>
              <td style={{ padding: '12px' }}>
                {formatDate(p.checkedInAt)}
              </td>
              <td style={{ padding: '12px' }}>
                {formatDate(p.checkedOutAt)}
              </td>
              <td style={{ padding: '12px' }}>
                {!p.checkedOutAt ? (
                  // 체크아웃되지 않은 참가자: 메모 입력 필드
                  <input
                    type="text"
                    placeholder="체크아웃 메모"
                    value={checkoutMemo[p.id] || ''}
                    onChange={(e) =>
                      setCheckoutMemo((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : editingMemoId === p.id ? (
                  // 체크아웃된 참가자: 메모 수정 모드
                  <input
                    type="text"
                    value={editingMemoValue}
                    onChange={(e) => setEditingMemoValue(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  // 체크아웃된 참가자: 메모 표시
                  p.checkedOutMemo || '-'
                )}
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                {!p.checkedOutAt ? (
                  // 체크아웃되지 않은 참가자: 체크아웃 버튼
                  <button
                    onClick={() => handleCheckout(p.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    체크아웃
                  </button>
                ) : editingMemoId === p.id ? (
                  // 체크아웃된 참가자: 메모 수정 버튼들
                  <>
                    <button
                      onClick={() => handleSaveMemo(p.id)}
                      style={{
                        marginRight: '5px',
                        padding: '6px 12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditingMemoId(null)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      취소
                    </button>
                  </>
                ) : (
                  // 체크아웃된 참가자: 메모 수정 버튼
                  <button
                    onClick={() => {
                      setEditingMemoId(p.id);
                      setEditingMemoValue(p.checkedOutMemo || '');
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    수정
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredParticipants.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          해당하는 참가자가 없습니다.
        </div>
      )}
    </div>
  );
}
