'use client';

import { useRouter } from 'next/navigation';

export default function AlreadyCheckinPage() {
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
      <div style={{ fontSize: '80px', marginBottom: '20px' }}>⚠️</div>
      <h1 style={{ fontSize: '40px', marginBottom: '20px', color: '#ffc107' }}>
        이미 체크인 완료됨
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>
        이미 체크인을 완료한 참가자입니다.
      </p>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
        중복 체크인은 불가능합니다.
      </p>
      <button
        onClick={() => router.push('/kiosk')}
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
        메인화면으로
      </button>
    </div>
  );
}
