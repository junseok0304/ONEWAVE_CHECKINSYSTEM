'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './agree.module.css';

export default function AgreementPage() {
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.left}>
                    <div className={styles.leftText}>
                        <div className={styles.leftLineBlack}>이제</div>
                        <div className={styles.leftLineAccent}>약관 동의</div>
                        <div className={styles.leftLineBlack}>해주세요</div>
                    </div>

                    <div className={styles.leftDesc}>
                        체크인을 위해 꼭 필요한 정보만 수집합니다.
                    </div>
                </div>

                <div className={styles.right}>
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            개인정보 처리 방침
                        </div>

                        <div className={styles.cardBody}>
                            <p>
                                본 행사는 참가자의 원활한 체크인 처리를 위해 다음 정보를 수집합니다:
                            </p>

                            <ul>
                                <li>이름</li>
                                <li>휴대폰 번호(끝 4자리)</li>
                                <li>체크인 여부 및 시간</li>
                            </ul>

                            <p>
                                수집된 정보는 행사 운영 목적으로만 사용되며, 행사 종료 후 안전하게 삭제됩니다.
                            </p>
                        </div>

                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                            />
                            <span>위 약관에 동의합니다</span>
                        </label>

                        <div className={styles.actions}>
                            <button
                                type="button"
                                className={`${styles.button} ${styles.secondary}`}
                                onClick={() => router.back()}
                            >
                                돌아가기
                            </button>

                            <button
                                type="button"
                                className={`${styles.button} ${styles.primary} ${agreed ? '' : styles.disabled}`}
                                onClick={() => router.push('/kiosk/checkin')}
                                disabled={!agreed}
                            >
                                다음
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
