import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
    fs.readFileSync('./your-firebase-adminsdk.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'onewave-bot',
});

const db = admin.firestore();

async function rollback() {
    try {
        console.log('🔄 participants_checkin 롤백 중...');

        const snapshot = await db.collection('participants_checkin').get();
        let count = 0;

        for (const doc of snapshot.docs) {
            await doc.ref.delete();
            count++;
        }

        console.log(`✅ ${count}개 레코드 삭제 완료`);
        process.exit(0);
    } catch (error) {
        console.error('❌ 롤백 실패:', error);
        process.exit(1);
    }
}

rollback();
