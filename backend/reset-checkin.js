import admin from 'firebase-admin';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = JSON.parse(
    fs.readFileSync('./onewave-bot-firebase-adminsdk-fbsvc-3966f945a4.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function resetCheckin() {
    console.log('🔄 오늘 체크인 데이터 초기화\n');

    try {
        // 한국 시간 기반 날짜
        const today = new Date();
        const koreaTime = new Date(today.getTime() + 9 * 60 * 60 * 1000);
        const todayString = koreaTime.toISOString().split('T')[0];

        console.log(`📅 대상 컬렉션: checkIn_${todayString}\n`);

        // 기존 데이터 확인
        const beforeSnapshot = await db.collection(`checkIn_${todayString}`).get();
        console.log(`현재 데이터: ${beforeSnapshot.size}명`);

        if (beforeSnapshot.size > 0) {
            console.log('삭제할 사용자:');
            beforeSnapshot.forEach(doc => {
                console.log(`   - ${doc.data().name}`);
            });
        }

        console.log('\n🗑️  삭제 중...');

        // 배치 삭제
        const batch = db.batch();
        beforeSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // 확인
        const afterSnapshot = await db.collection(`checkIn_${todayString}`).get();
        console.log(`\n✅ 삭제 완료! 남은 데이터: ${afterSnapshot.size}명`);

        process.exit(0);

    } catch (error) {
        console.error('❌ 오류:', error);
        process.exit(1);
    }
}

resetCheckin();
