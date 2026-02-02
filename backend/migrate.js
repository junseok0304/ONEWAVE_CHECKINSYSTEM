/**
 * participants_discord → participants_checkin 마이그레이션 스크립트
 *
 * 기능:
 * - participants_discord를 기반으로 participants_checkin 최신화
 * - CANCELED 상태 사용자는 제외
 * - 기존 체크인 상태는 초기화
 * - Discord에 없는 사용자는 삭제
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
 * participants_discord를 기반으로 participants_checkin 최신화
 */
async function migrateData() {
    try {
        console.log('🚀 participants_discord 동기화 시작...\n');

        // 1️⃣ participants_discord에서 활성 사용자만 조회 (CANCELED 제외)
        console.log('📖 participants_discord 컬렉션에서 데이터 읽는 중...');
        const discordSnapshot = await db.collection('participants_discord').get();

        let totalCount = 0;
        let canceledCount = 0;
        const activeUsers = [];

        discordSnapshot.forEach(doc => {
            const data = doc.data();
            totalCount++;

            if (data.status === 'CANCELED') {
                canceledCount++;
                console.log(`⏭️  ${data.name}: CANCELED 상태 (제외)`);
            } else {
                activeUsers.push({ id: doc.id, ...data });
            }
        });

        console.log(`✅ 총 ${totalCount}명 중 ${activeUsers.length}명 활성 (CANCELED ${canceledCount}명)\n`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // 2️⃣ 활성 사용자를 participants_checkin에 업데이트/추가
        console.log('📝 participants_checkin에 동기화 중...');
        for (const discordUser of activeUsers) {
            try {
                const normalizedPhone = normalizePhone(discordUser.phone);

                if (!normalizedPhone) {
                    throw new Error('유효한 휴대폰 번호 없음');
                }

                // participants_checkin 문서 구조 생성
                const checkinData = {
                    // 원본 데이터 (participants_discord에서 복제)
                    email: discordUser.email,
                    phone: discordUser.phone,
                    name: discordUser.name,
                    teamNumber: discordUser.teamNumber,
                    position: discordUser.position || '',
                    status: discordUser.status,
                    isVerified: discordUser.isVerified || false,
                    discordId: discordUser.discordId || '',

                    // 체크인 전용 필드 (초기값으로 초기화)
                    checked_in_status: false,
                    checkedInAt: null,
                    checkedOutAt: null,
                    memo: '',
                    checkedOutMemo: '',

                    // 타임스탬프
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                // 기존 문서 확인
                const existingDoc = await db.collection('participants_checkin').doc(normalizedPhone).get();

                if (existingDoc.exists) {
                    // 업데이트 (createdAt 보존)
                    await db.collection('participants_checkin').doc(normalizedPhone).update(checkinData);
                    console.log(`✅ ${discordUser.name} (${normalizedPhone}) - 업데이트 완료`);
                } else {
                    // 신규 추가
                    await db.collection('participants_checkin').doc(normalizedPhone).set({
                        ...checkinData,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    console.log(`✨ ${discordUser.name} (${normalizedPhone}) - 신규 추가 완료`);
                }
                successCount++;
            } catch (error) {
                console.error(`❌ ${discordUser.name} - 오류: ${error.message}`);
                errorCount++;
                errors.push({
                    name: discordUser.name,
                    error: error.message,
                });
            }
        }

        // 3️⃣ participants_checkin에서 Discord에 없는 사용자 삭제
        console.log('\n🗑️  Discord에 없는 사용자 삭제 중...');
        const checkinSnapshot = await db.collection('participants_checkin').get();
        let deletedCount = 0;

        for (const doc of checkinSnapshot.docs) {
            const phoneKey = doc.id;
            const inDiscord = activeUsers.some(u => {
                const uPhoneKey = normalizePhone(u.phone);
                return uPhoneKey === phoneKey;
            });

            if (!inDiscord) {
                const docData = doc.data();
                await db.collection('participants_checkin').doc(phoneKey).delete();
                console.log(`🗑️  ${docData.name} (${phoneKey}) - 삭제 완료`);
                deletedCount++;
            }
        }

        // 4️⃣ 결과 출력
        console.log('\n' + '='.repeat(60));
        console.log('📊 동기화 완료');
        console.log('='.repeat(60));
        console.log(`📌 participants_discord 총인원: ${totalCount}명`);
        console.log(`  ├─ 활성: ${activeUsers.length}명`);
        console.log(`  └─ CANCELED: ${canceledCount}명`);
        console.log(`\n📋 participants_checkin 변경사항:`);
        console.log(`  ├─ 추가/업데이트 성공: ${successCount}명`);
        console.log(`  ├─ 삭제: ${deletedCount}명`);
        console.log(`  └─ 오류: ${errorCount}명`);

        if (errors.length > 0) {
            console.log('\n⚠️  오류 목록:');
            errors.forEach((err) => {
                console.log(`  - ${err.name}: ${err.error}`);
            });
        }

        console.log('\n✅ 동기화 완료!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ 동기화 실패:', error);
        process.exit(1);
    }
}

// 실행
migrateData();
