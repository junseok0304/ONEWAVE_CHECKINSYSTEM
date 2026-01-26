/**
 * 이메일 컬렉션 → participants_checkin 컬렉션 마이그레이션 스크립트
 *
 * 실행: node migrate.js
 */

import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';

dotenv.config();

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * 휴대폰 번호 정규화 (010-2140-7614 → 01021407614)
 */
const normalizePhone = (phone) => {
    if (!phone) return null;
    return phone.replace(/-/g, '');
};

/**
 * 이메일 컬렉션에서 데이터를 읽어 participants_checkin으로 마이그레이션
 */
async function migrateData() {
    try {
        console.log('🚀 마이그레이션 시작...\n');

        // 1️⃣ participants_discord 컬렉션 조회
        console.log('📖 participants_discord 컬렉션에서 데이터 읽는 중...');
        const emailSnapshot = await db.collection('participants_discord').get();
        console.log(`✅ ${emailSnapshot.size}명의 데이터 발견\n`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // 2️⃣ 각 문서를 participants_checkin으로 복제
        for (const emailDoc of emailSnapshot.docs) {
            try {
                const emailData = emailDoc.data();
                const normalizedPhone = normalizePhone(emailData.phone);

                if (!normalizedPhone) {
                    throw new Error('휴대폰 번호가 없습니다');
                }

                // participants_checkin 문서 구조 생성
                const checkinData = {
                    // 원본 데이터 (이메일 컬렉션에서 복제)
                    email: emailData.email,
                    phone: emailData.phone,
                    name: emailData.name,
                    teamNumber: emailData.teamNumber,
                    position: emailData.position || '',
                    status: emailData.status,
                    isVerified: emailData.isVerified || false,
                    discordId: emailData.discordId || '',

                    // 체크인 전용 필드 (초기값)
                    checked_in_status: false,
                    checkedInAt: null,
                    checkedOutAt: null,
                    memo: '',
                    checkedOutMemo: '',

                    // 타임스탬프
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                // participants_checkin 컬렉션에 저장
                await db
                    .collection('participants_checkin')
                    .doc(normalizedPhone)
                    .set(checkinData);

                console.log(`✅ ${emailData.name} (${normalizedPhone}) - 마이그레이션 완료`);
                successCount++;
            } catch (error) {
                console.error(`❌ ${emailData.email} - 오류: ${error.message}`);
                errorCount++;
                errors.push({
                    email: emailData.email,
                    error: error.message,
                });
            }
        }

        // 3️⃣ 결과 출력
        console.log('\n' + '='.repeat(50));
        console.log('📊 마이그레이션 완료');
        console.log('='.repeat(50));
        console.log(`✅ 성공: ${successCount}명`);
        console.log(`❌ 실패: ${errorCount}명`);

        if (errors.length > 0) {
            console.log('\n⚠️ 오류 목록:');
            errors.forEach((err) => {
                console.log(`  - ${err.email}: ${err.error}`);
            });
        }

        console.log('\n🎉 마이그레이션 완료!');
        process.exit(0);
    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error);
        process.exit(1);
    }
}

// 실행
migrateData();
