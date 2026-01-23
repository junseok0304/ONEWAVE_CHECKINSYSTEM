'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './success.module.css';

export default function SuccessPage() {
    const router = useRouter();
    const [count, setCount] = useState(5);

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
                        <div className={styles.icon} aria-hidden="true">
                            ✅
                        </div>

                        <div className={styles.title}>
                            체크인 완료!
                        </div>

                        <div className={styles.desc}>
                            행사에 참가해주셔서 감사합니다.
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
