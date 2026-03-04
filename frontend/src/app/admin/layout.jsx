'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './adminLayout.module.css';

export default function AdminLayout({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('/api/admin/session', {
                    credentials: 'same-origin',
                });
                const data = await res.json();
                setIsAuthenticated(Boolean(data.authenticated));
            } catch (err) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/admin/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message || '비밀번호가 올바르지 않습니다.');
                setPassword('');
                return;
            }

            setIsAuthenticated(true);
            setPassword('');
            setError('');
        } catch (err) {
            setError('인증 요청에 실패했습니다.');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/admin/session', {
            method: 'DELETE',
            credentials: 'same-origin',
        }).catch(() => {});
        setIsAuthenticated(false);
    };

    if (isLoading) {
        return <div style={{ padding: '20px' }}>로딩 중...</div>;
    }

    if (!isAuthenticated) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f7fa',
            }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    padding: '40px',
                    maxWidth: '360px',
                    width: '100%',
                }}>
                    <h1 style={{
                        textAlign: 'center',
                        marginBottom: '8px',
                        fontSize: '28px',
                        fontWeight: '800',
                        color: '#1d2244',
                    }}>
                        GDG 체크인
                    </h1>
                    <p style={{
                        textAlign: 'center',
                        color: '#666',
                        marginBottom: '32px',
                        fontSize: '14px',
                    }}>
                        관리자 페이지
                    </p>

                    <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333',
                            }}>
                                비밀번호 (6자리)
                            </label>
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength="6"
                                placeholder="000000"
                                value={password}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                                    setPassword(value);
                                    setError('');
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    letterSpacing: '0.15em',
                                    backgroundColor: '#f9fafb',
                                    transition: 'all 0.2s ease',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3282f6';
                                    e.target.style.backgroundColor = '#ffffff';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e5e7eb';
                                    e.target.style.backgroundColor = '#f9fafb';
                                }}
                                autoFocus
                                required
                            />
                        </div>

                        {error && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#f8d7da',
                                color: '#721c24',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                textAlign: 'center',
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            style={{
                                padding: '12px 16px',
                                backgroundColor: '#3282f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(50, 130, 246, 0.2)',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#2d6fd9';
                                e.target.style.boxShadow = '0 4px 8px rgba(50, 130, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#3282f6';
                                e.target.style.boxShadow = '0 2px 4px rgba(50, 130, 246, 0.2)';
                            }}
                        >
                            접속
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <nav className={styles.nav}>
                <div className={styles.navInner}>
                    <Link href="/admin" className={styles.brand}>
                        GDG 체크인
                    </Link>

                    <div className={styles.links}>
                        <Link href="/admin" className={styles.link}>
                            대시보드
                        </Link>
                        <Link href="/admin/checkin" className={styles.link}>
                            타입 관리
                        </Link>
                        <Link href="/admin/events" className={styles.link}>
                            이벤트 관리
                        </Link>
                        <Link href="/admin/members" className={styles.link}>
                            멤버 관리
                        </Link>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                marginLeft: 'auto',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#c82333';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#dc3545';
                            }}
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </nav>

            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
