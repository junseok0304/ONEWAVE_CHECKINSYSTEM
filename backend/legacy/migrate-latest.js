import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Firebase 초기화
const serviceAccount = JSON.parse(
    fs.readFileSync('./your-firebase-adminsdk.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function migrateParticipants() {
    try {
        console.log('🔄 participants_discord에서 데이터 조회 중...');

        const discordSnapshot = await db.collection('participants_discord').get();
        const discordData = [];

        discordSnapshot.forEach(doc => {
            discordData.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        console.log(`✅ Discord 데이터 ${discordData.length}개 조회 완료`);

        if (discordData.length === 0) {
            console.log('⚠️  participants_discord에 데이터가 없습니다.');
            process.exit(0);
        }

        // 기존 participants_checkin 초기화
        console.log('🗑️  기존 participants_checkin 삭제 중...');
        const checkinSnapshot = await db.collection('participants_checkin').get();
        let deletedCount = 0;

        for (const doc of checkinSnapshot.docs) {
            await doc.ref.delete();
            deletedCount++;
        }

        console.log(`✅ ${deletedCount}개 레코드 삭제 완료`);

        // 데이터 마이그레이션
        console.log('📝 새 데이터를 participants_checkin에 저장 중...');
        let successCount = 0;
        let errorCount = 0;

        for (const participant of discordData) {
            try {
                // 필드 매핑 및 정규화
                const normalizedData = {
                    id: participant.id,
                    email: participant.email || '',
                    name: participant.name || '',
                    team_number: participant.teamNumber || participant.team_number || null,
                    part: participant.position || participant.part || '',
                    phone_number: normalizePhoneNumber(participant.phone_number),
                    status: participant.status || 'REJECTED',
                    isCheckedIn: false,
                    checkedInAt: null,
                    memo: '',
                    checkedOutAt: null,
                    checkedOutMemo: '',
                };

                await db.collection('participants_checkin').doc(participant.id).set(normalizedData);
                successCount++;
            } catch (error) {
                console.error(`❌ ${participant.id} 저장 실패:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n✅ 마이그레이션 완료!`);
        console.log(`   - 성공: ${successCount}개`);
        console.log(`   - 실패: ${errorCount}개`);
        console.log(`   - 총합: ${successCount + errorCount}개`);

        process.exit(0);
    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error);
        process.exit(1);
    }
}

function normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    // 하이픈 제거: 010-1234-5678 → 01012345678
    return phoneNumber.replace(/-/g, '');
}

migrateParticipants();
