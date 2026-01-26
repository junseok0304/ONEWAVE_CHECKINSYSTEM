'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './success-staff.module.css';

export default function SuccessStaffContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [name, setName] = useState('');
    const [count, setCount] = useState(5);

    useEffect(() => {
        const nameParam = searchParams.get('name');
        if (nameParam) {
            setName(decodeURIComponent(nameParam));
        }
    }, [searchParams]);

    // 페이지 마운트 시 오디오 재생 (운영진용 음성)
    useEffect(() => {
        let audioElement = null;
        let played = false;

        const playAudio = () => {
            if (played) return;

            try {
                if (!audioElement) {
                    audioElement = new Audio('/correctAdmin.mp3');
                    audioElement.volume = 1;
                    audioElement.crossOrigin = 'anonymous';
                }

                const playPromise = audioElement.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        played = true;
                    }).catch(() => {
                        // 실패 시 재시도
                        setTimeout(playAudio, 100);
                    });
                } else {
                    played = true;
                }
            } catch (err) {
                setTimeout(playAudio, 100);
            }
        };

        // 가장 빠른 방법: 즉시 시도
        playAudio();

        // 폴백: 100ms 후 재시도
        const timer1 = setTimeout(playAudio, 100);

        // 사용자 제스처 감지 (가장 확실함)
        const handleUserGesture = () => {
            playAudio();
            document.removeEventListener('click', handleUserGesture);
            document.removeEventListener('touchstart', handleUserGesture);
        };

        document.addEventListener('click', handleUserGesture, { once: true });
        document.addEventListener('touchstart', handleUserGesture, { once: true });

        return () => {
            clearTimeout(timer1);
            document.removeEventListener('click', handleUserGesture);
            document.removeEventListener('touchstart', handleUserGesture);
            if (audioElement) {
                audioElement.pause();
                audioElement.src = '';
            }
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCount((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (count <= 0) {
            router.push('/kiosk');
        }
    }, [count, router]);

    const progress = ((5 - count) / 5) * 100;

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.left}>
                    <div className={styles.leftText}>
                        <div className={styles.leftLineBlack}>운영진</div>
                        <div className={styles.leftLineAccent}>{name}</div>
                        <div className={styles.leftLineBlack}>님 환영합니다</div>
                    </div>

                    <div className={styles.leftDesc}>
                        행사 운영을 위해 함께해주세요.
                    </div>
                </div>

                <div className={styles.right}>
                    <div className={styles.card}>
                        <div className={styles.iconContainer}>
                            <div className={styles.icon}>
                                <img
                                    src="/checkCorrect.gif"
                                    alt="체크인 완료"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                        </div>

                        <div className={styles.title}>
                            운영진 체크인 완료!
                        </div>

                        <div className={styles.staffBadge}>
                            STAFF
                        </div>

                        <div className={styles.subDesc}>
                            행사가 성공적으로 진행되기를 바랍니다.
                        </div>

                        <div className={styles.timer}>
                            <span className={styles.timerCount}>{count}</span>초 후 메인 화면으로 돌아갑니다.
                        </div>

                        <div className={styles.progressTrack} aria-hidden="true">
                            <div
                                className={styles.progressBar}
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <button
                            type="button"
                            className={styles.button}
                            onClick={() => router.push('/kiosk')}
                        >
                            지금 메인으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
