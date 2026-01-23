'use client';

import { useRouter } from 'next/navigation';
import styles from './main.module.css';

export default function KioskMainPage() {
    const router = useRouter();

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.text}>
                    <div>여기서</div>
                    <div className={styles.highlight}>출석체크</div>
                    <div>해주세요</div>
                </div>

                <div className={styles.right}>
                    <div className={styles.card}>
                        <div className={styles.icon} aria-hidden="true">
                            🌊
                        </div>

                        <div className={styles.title}>
                            ONEWAVE 해커톤
                        </div>

                        <button
                            type="button"
                            className={styles.button}
                            onClick={() => router.push('/kiosk/agreement')}
                        >
                            참가자 체크인
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
