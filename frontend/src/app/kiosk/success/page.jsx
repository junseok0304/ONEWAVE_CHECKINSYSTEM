'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './success.module.css';

export default function SuccessPage() {
    const router = useRouter();
    const [count, setCount] = useState(5);

    // 페이지 마운트 시 오디오 재생
    useEffect(() => {
        let audioElement = null;
        let retryCount = 0;
        const maxRetries = 5;

        const playAudio = async () => {
            try {
                if (!audioElement) {
                    audioElement = new Audio('/correct.mp3');
                    audioElement.volume = 1;
                    audioElement.crossOrigin = 'anonymous';
                }

                // iOS에서 재생 시도
                const playPromise = audioElement.play();
                if (playPromise !== undefined) {
                    await playPromise;
                }
            } catch (err) {
                // 재생 실패 시 재시도 (최대 5번)
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(() => {
                        playAudio();
                    }, 500 + (retryCount * 500));
                }
            }
        };

        // 초기 재생 시도 - 더 긴 딜레이
        const initialTimer = setTimeout(() => {
            playAudio();
        }, 800);

        // 사용자 인터랙션 감지 시 재시도
        const handleInteraction = () => {
            retryCount = 0;
            playAudio();
            // 한 번 재생되면 이벤트 리스너 제거
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
        };

        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);

        return () => {
            clearTimeout(initialTimer);
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
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
                        <div className={styles.leftLineBlack}>체크인이</div>
                        <div className={styles.leftLineAccent}>완료</div>
                        <div className={styles.leftLineBlack}>되었습니다</div>
                    </div>

                    <div className={styles.leftDesc}>
                        감사합니다! 해커톤을 즐겨주세요.
                    </div>
                </div>

                <div className={styles.right}>
                    <div className={styles.card}>
                        <div className={styles.icon}>
                            <img
                                src="/checkCorrect.gif"
                                alt="체크인 완료"
                                style={{
                                    width: '50%',
                                    height: 'auto',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>

                        <div className={styles.title}>
                            체크인 완료!
                        </div>

                        <div className={styles.desc}>
                            즐거운 개발 되세요!
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
