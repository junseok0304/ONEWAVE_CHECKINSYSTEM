'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './success.module.css';

export default function SuccessPage() {
    const router = useRouter();
    const [count, setCount] = useState(5);
    const audioRef = useRef(null);
    const hasPlayedRef = useRef(false);
    const [showTouchModal, setShowTouchModal] = useState(true);

    // HTML audio 태그를 DOM에 추가하고 사용자 제스처로 재생
    useEffect(() => {
        // audio 요소 생성 및 DOM에 추가
        if (!audioRef.current) {
            const audio = new Audio();
            audio.src = '/correct.mp3';
            audio.crossOrigin = 'anonymous';
            audio.preload = 'auto';
            audioRef.current = audio;
        }

        const audio = audioRef.current;

        const attemptPlay = async () => {
            if (hasPlayedRef.current) return;

            try {
                await audio.play();
                hasPlayedRef.current = true;
            } catch (err) {
                // 실패 시 사용자 제스처 대기
            }
        };

        // 방법 1: 즉시 시도 (최신 브라우저)
        attemptPlay();

        // 방법 2: 사용자 제스처 감지 시 즉시 재생 (Safari 구형 기기)
        const handleUserGesture = async (e) => {
            if (hasPlayedRef.current) return;

            // 실제 사용자 인터랙션에서 호출됨
            try {
                await audio.play();
                hasPlayedRef.current = true;
                // 성공하면 리스너 제거
                document.removeEventListener('click', handleUserGesture);
                document.removeEventListener('touchstart', handleUserGesture);
                document.removeEventListener('touchmove', handleUserGesture);
            } catch (err) {
                // 재시도
            }
        };

        // 여러 이벤트 등록 (어느 것이든 작동하도록)
        document.addEventListener('click', handleUserGesture, { once: false });
        document.addEventListener('touchstart', handleUserGesture, { once: false });
        document.addEventListener('touchmove', handleUserGesture, { once: false });

        // 방법 3: 페이지 가시성 변경 시도 (일부 Safari 버전)
        const handleVisibilityChange = async () => {
            if (!document.hidden && !hasPlayedRef.current) {
                try {
                    await audio.play();
                    hasPlayedRef.current = true;
                } catch (err) {
                    // 실패 무시
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('click', handleUserGesture);
            document.removeEventListener('touchstart', handleUserGesture);
            document.removeEventListener('touchmove', handleUserGesture);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (audio) {
                audio.pause();
            }
        };
    }, []);

    // 터치 감지 및 모달 닫기
    useEffect(() => {
        const handleTouchOrClick = () => {
            setShowTouchModal(false);
            // 리스너 제거
            document.removeEventListener('click', handleTouchOrClick);
            document.removeEventListener('touchstart', handleTouchOrClick);
        };

        // 2.6초 후 모달 제거 (자동 페이드아웃)
        const fadeOutTimer = setTimeout(() => {
            setShowTouchModal(false);
        }, 2600);

        if (showTouchModal) {
            document.addEventListener('click', handleTouchOrClick);
            document.addEventListener('touchstart', handleTouchOrClick);
        }

        return () => {
            clearTimeout(fadeOutTimer);
            document.removeEventListener('click', handleTouchOrClick);
            document.removeEventListener('touchstart', handleTouchOrClick);
        };
    }, [showTouchModal]);

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
        <>
            {showTouchModal && (
                <div className={styles.touchModal}>
                    <div className={styles.touchModalContent}>
                        <div className={styles.touchIcon}>👆</div>
                        <div className={styles.touchModalText}>화면을 터치해주세요!</div>
                    </div>
                </div>
            )}
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
        </>
    );
}
