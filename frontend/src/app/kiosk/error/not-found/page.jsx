'use client';

import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div style={{
      textAlign: 'center',
      paddingTop: '100px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{ fontSize: '80px', marginBottom: '20px' }}>❌</div>
      <h1 style={{ fontSize: '40px', marginBottom: '20px', color: '#dc3545' }}>
        체크인 실패
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>
        입력하신 정보로 참가자를 찾을 수 없습니다.
      </p>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
        이름과 휴대폰 번호를 다시 확인해주세요.
      </p>
      <button
        onClick={() => router.push('/kiosk/checkin')}
        style={{
          padding: '12px 30px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        다시 시도
      </button>
    </div>
  );
}
