'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './checkin.module.css';

export default function CheckinPage() {
    const router = useRouter();
    const [step, setStep] = useState('phone');
    const [phoneLast4, setPhoneLast4] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const timeoutRef = useRef(null);

    // 음성 재생 (볼륨 페이드인) 함수
    const playAudioWithFadeIn = async (audioSrc) => {
        return new Promise((resolve) => {
            // 50ms 후 음성 재생 시작
            setTimeout(async () => {
                const audio = new Audio();
                audio.src = audioSrc;
                audio.crossOrigin = 'anonymous';
                audio.volume = 0; // 초기 볼륨 0

                try {
                    await audio.play();

                    // 10ms마다 볼륨을 0.1씩 증가 (약 100ms에 최대 볼륨)
                    let volume = 0;
                    const fadeInInterval = setInterval(() => {
                        volume += 0.1;
                        audio.volume = Math.min(volume, 1);

                        if (volume >= 1) {
                            clearInterval(fadeInInterval);
                        }
                    }, 10);

                    // 페이드인이 백그라운드에서 진행되도록 즉시 resolve
                    resolve();
                } catch (err) {
                    // 오류 발생 시 그냥 진행
                    resolve();
                }
            }, 50);
        });
    };

    // 타이머 리셋 함수
    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            router.push('/kiosk');
        }, 20000); // 20초
    };

    // 첫 마운트 시 타이머 시작 및 이벤트 리스너 추가
    useEffect(() => {
        resetTimeout();

        // 사용자 interaction 감지
        const handleUserActivity = () => {
            resetTimeout();
        };

        window.addEventListener('click', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);
        window.addEventListener('touchstart', handleUserActivity);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            window.removeEventListener('click', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
            window.removeEventListener('touchstart', handleUserActivity);
        };
    }, [router]);

    const handlePhoneSearch = async (e, searchValue = null) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const valueToSearch = searchValue !== null ? searchValue : phoneLast4;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/search?phoneLast4=${valueToSearch}`
            );

            if (res.status === 404) {
                setError('해당하는 참가자를 찾을 수 없습니다.');
                setLoading(false);
                return;
            }

            if (!res.ok) {
                const err = await res.json();
                setError(err.message || '검색 중 오류가 발생했습니다.');
                setLoading(false);
                return;
            }

            const data = await res.json();
            console.log('API Response:', data);
            setCandidates(data);
            setStep('select');
        } catch (err) {
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectParticipant = (participant) => {
        if (participant.checked_in_status) {
            setError('이미 체크인된 참가자입니다.');
            return;
        }

        setSelectedParticipant(participant);
        // localStorage에 참가자 정보 저장
        localStorage.setItem('participantInfo', JSON.stringify(participant));
        setStep('confirm');
        setError('');
    };

    const handleConfirmCheckin = async (confirmed) => {
        if (!confirmed) {
            setSelectedParticipant(null);
            setStep('select');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/checkin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ participantId: selectedParticipant.id }),
            });

            if (res.status === 409) {
                router.push('/kiosk/error/already-checkin');
                return;
            }

            if (!res.ok) {
                const err = await res.json();
                setError(err.message || '체크인 중 오류가 발생했습니다.');
                setLoading(false);
                return;
            }

            // 운영진인지 확인 (team_number === 0)
            const isStaff = selectedParticipant.team_number === 0 || selectedParticipant.team_number === '0';

            // 음성 재생 시작 (볼륨 페이드인)
            const audioSrc = isStaff ? '/correctAdmin.mp3' : '/correct.mp3';
            await playAudioWithFadeIn(audioSrc);

            // 음성 재생이 시작된 후 페이지 이동
            if (isStaff) {
                router.push(`/kiosk/success-staff?name=${encodeURIComponent(selectedParticipant.name)}`);
            } else {
                router.push('/kiosk/success');
            }
        } catch (err) {
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const leftTextByStep = {
        phone: { a: '휴대폰 번호로', b: '본인 확인', c: '해주세요' },
        select: { a: '본인 이름을', b: '선택', c: '해주세요' },
        confirm: { a: '마지막으로', b: '확인', c: '해주세요' },
    };

    const leftDescByStep = {
        phone: '휴대폰 번호 뒤 4자리를 입력해 주세요.',
        select: '검색된 후보 중 본인을 선택해 주세요. (스크롤 가능)',
        confirm: '선택한 참가자가 맞으면 "네"를 눌러 체크인을 완료합니다.',
    };

    const isStaffConfirm = step === 'confirm' && selectedParticipant && (selectedParticipant.team_number === 0 || selectedParticipant.team_number === '0');
    const leftText = isStaffConfirm ? { a: '운영진님', b: '해커톤', c: '잘부탁드립니다!' } : leftTextByStep[step];

    const isSelectStep = step === 'select';
    const isCandidateMany = candidates.length > 1;

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.left}>
                    <div className={styles.leftText}>
                        <div className={styles.leftLineBlack}>{leftText.a}</div>
                        <div className={styles.leftLineAccent}>{leftText.b}</div>
                        <div className={styles.leftLineBlack}>{leftText.c}</div>
                    </div>

                    <div className={styles.leftDesc}>
                        {leftDescByStep[step]}
                    </div>
                </div>

                <div className={styles.right}>
                    <div
                        className={[
                            styles.card,
                            isSelectStep ? styles.cardSelect : '',
                            isSelectStep ? (isCandidateMany ? styles.cardSelectTall : styles.cardSelectCompact) : '',
                        ].join(' ')}
                    >
                        {step === 'phone' && (
                            <div className={styles.phoneContainer}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={phoneLast4}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                        setPhoneLast4(value);
                                        setError('');

                                        // 4자리 다 채워지면 자동 검색
                                        if (value.length === 4) {
                                            setTimeout(() => {
                                                handlePhoneSearch({ preventDefault: () => {} }, value);
                                            }, 100);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    placeholder="휴대폰 번호 뒷4자리"
                                    maxLength="4"
                                    autoFocus
                                    className={styles.phoneInput}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                />

                                {/* 3x4 숫자 키패드 */}
                                <div className={styles.numpadGrid}>
                                    {/* 1-9 */}
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            className={styles.numpadBtn}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (phoneLast4.length < 4) {
                                                    setError('');
                                                    const newValue = phoneLast4 + num.toString();
                                                    setPhoneLast4(newValue);

                                                    // 4자리 다 채워지면 자동 검색
                                                    if (newValue.length === 4) {
                                                        setTimeout(() => {
                                                            handlePhoneSearch({ preventDefault: () => {} }, newValue);
                                                        }, 100);
                                                    }
                                                }
                                            }}
                                        >
                                            {num}
                                        </button>
                                    ))}

                                    {/* 4행: Reset, 0, Backspace */}
                                    <button
                                        type="button"
                                        className={styles.numpadBtnReset}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setPhoneLast4('');
                                            setError('');
                                        }}
                                    >
                                        Reset
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.numpadBtn}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (phoneLast4.length < 4) {
                                                setError('');
                                                const newValue = phoneLast4 + '0';
                                                setPhoneLast4(newValue);

                                                // 4자리 다 채워지면 자동 검색
                                                if (newValue.length === 4) {
                                                    setTimeout(() => {
                                                        handlePhoneSearch({ preventDefault: () => {} }, newValue);
                                                    }, 100);
                                                }
                                            }
                                        }}
                                    >
                                        0
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.numpadBtnBackspace}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setPhoneLast4(phoneLast4.slice(0, -1));
                                        }}
                                    >
                                        ←
                                    </button>
                                </div>

                                {error && (
                                    <div className={styles.errorBox}>
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 'select' && (
                            <>
                                <div className={styles.cardTitle}>
                                    본인의 이름을 선택해주세요
                                </div>

                                <div className={styles.subTitle}>
                                    {candidates.length}명의 참가자가 검색되었습니다.
                                </div>

                                {error ? (
                                    <div className={styles.errorBox}>
                                        {error}
                                    </div>
                                ) : (
                                    <div className={styles.errorSpacer} />
                                )}

                                <div
                                    className={[
                                        styles.candidateScrollArea,
                                        candidates.length <= 1 ? styles.candidateScrollCompact : styles.candidateScrollTall,
                                    ].join(' ')}
                                >
                                    <div className={styles.candidateList}>
                                        {candidates.map((candidate) => (
                                            <button
                                                key={candidate.id}
                                                type="button"
                                                className={`${styles.candidateBtn} ${candidate.checked_in_status ? styles.candidateDisabled : ''}`}
                                                onClick={() => handleSelectParticipant(candidate)}
                                                disabled={candidate.checked_in_status}
                                            >
                                                <div className={styles.candidateRow}>
                                                    <div className={styles.discordCircle} title={candidate.status?.trim() === 'APPROVED' ? '가입함' : candidate.status?.trim() === 'PENDING' ? '확인중' : '거절됨'}>
                                                        <div className={`${styles.circle} ${candidate.status?.trim() === 'APPROVED' ? styles.approved : candidate.status?.trim() === 'PENDING' ? styles.pending : styles.rejected}`}>
                                                        </div>
                                                    </div>

                                                    <div className={styles.candidateName}>
                                                        {candidate.name}
                                                    </div>

                                                    <div className={styles.badgeContainer}>
                                                        {(candidate.team_number === 0 || candidate.team_number === '0') && (
                                                            <div className={styles.staffBadge}>
                                                                STAFF
                                                            </div>
                                                        )}

                                                        {candidate.checked_in_status && (
                                                            <div className={styles.badge}>
                                                                이미 체크인됨
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className={styles.secondaryBtn}
                                    onClick={() => {
                                        setStep('phone');
                                        setCandidates([]);
                                        setError('');
                                    }}
                                >
                                    돌아가기
                                </button>
                            </>
                        )}

                        {step === 'confirm' && selectedParticipant && (
                            <>
                                <div className={styles.confirmName}>
                                    {selectedParticipant.name}
                                </div>

                                <div className={styles.confirmDesc}>
                                    {(selectedParticipant.team_number === 0 || selectedParticipant.team_number === '0')
                                        ? `운영진 ${selectedParticipant.name} 님이 맞습니까?`
                                        : '위 이름이 맞습니까?'}
                                </div>

                                {error && (
                                    <div className={styles.errorBox}>
                                        {error}
                                    </div>
                                )}

                                <div className={styles.confirmActions}>
                                    <button
                                        type="button"
                                        className={`${styles.confirmBtn} ${styles.secondary}`}
                                        onClick={() => handleConfirmCheckin(false)}
                                        disabled={loading}
                                    >
                                        아니오
                                    </button>

                                    <button
                                        type="button"
                                        className={`${styles.confirmBtn} ${styles.primary} ${loading ? styles.disabled : ''}`}
                                        onClick={() => handleConfirmCheckin(true)}
                                        disabled={loading}
                                    >
                                        {loading ? '진행 중...' : '네'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
