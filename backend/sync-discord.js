import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    fs.readFileSync('./onewave-bot-firebase-adminsdk-fbsvc-3966f945a4.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function syncDiscordData() {
    try {
        console.log('🔍 participants_discord에서 데이터 조회 중...');

        const snapshot = await db.collection('participants_discord').get();
        const discordUsers = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            discordUsers.push({ id: doc.id, ...data });
        });

        console.log(`✅ Discord 참가자 ${discordUsers.length}명 발견`);

        if (discordUsers.length === 0) {
            console.log('⚠️  Discord 데이터가 없습니다.');
            process.exit(0);
        }

        discordUsers.forEach((user, idx) => {
            console.log(`${idx + 1}. ${user.name || 'N/A'} (${user.email || 'N/A'})`);
        });

        console.log('\n📝 participants_checkin에 데이터 동기화 중...');

        let skippedCount = 0;

        for (const discordUser of discordUsers) {
            // CANCELED 상태인 사용자는 스킵
            if (discordUser.status === 'CANCELED') {
                console.log(`  ⏭️  ${discordUser.name}: CANCELED 상태 (스킵)`);
                skippedCount++;
                continue;
            }

            // 전화번호로부터 phoneKey 생성 (뒷 11자리)
            const phoneKey = (discordUser.phone || discordUser.phoneNumber || '')
                .replace(/-/g, '')
                .slice(-11);

            if (!phoneKey || phoneKey.length < 11) {
                console.log(`  ⚠️  ${discordUser.name}: 유효한 전화번호 없음 (스킵)`);
                skippedCount++;
                continue;
            }

            const updateData = {
                name: discordUser.name || '',
                email: discordUser.email || '',
                phone: discordUser.phone || discordUser.phoneNumber || '',
                position: discordUser.position || discordUser.part || '',
                school: discordUser.school || discordUser.schoolName || '',
                teamNumber: discordUser.teamNumber || 1,
                status: discordUser.status || 'APPROVED',
                memo: discordUser.memo || '',
                checked_in_status: false,
                updatedAt: new Date(),
            };

            // 기존 데이터 확인
            const existingDoc = await db.collection('participants_checkin').doc(phoneKey).get();

            if (existingDoc.exists) {
                // 업데이트
                await db.collection('participants_checkin').doc(phoneKey).update(updateData);
                console.log(`  ✅ ${discordUser.name} 업데이트 완료 (phoneKey: ${phoneKey})`);
            } else {
                // 신규 추가
                await db.collection('participants_checkin').doc(phoneKey).set({
                    ...updateData,
                    createdAt: new Date(),
                });
                console.log(`  ✨ ${discordUser.name} 신규 추가 완료 (phoneKey: ${phoneKey})`);
            }
        }

        console.log('\n✅ Discord 동기화 완료!');
        console.log(`   - 전체: ${discordUsers.length}명`);
        console.log(`   - 동기화됨: ${discordUsers.length - skippedCount}명`);
        console.log(`   - 스킵됨: ${skippedCount}명`);

        process.exit(0);
    } catch (error) {
        console.error('❌ 동기화 실패:', error);
        process.exit(1);
    }
}

syncDiscordData();
