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

async function resetStatus() {
    console.log('🔄 모든 사용자 체크인 상태 초기화\n');

    try {
        // participants_checkin 초기화
        console.log('1️⃣ participants_checkin 초기화...');
        const participantsSnapshot = await db.collection('participants_checkin').get();
        let count = 0;

        const batch1 = db.batch();
        participantsSnapshot.forEach(doc => {
            batch1.update(doc.ref, {
                checked_in_status: false,
                checkedInAt: null,
                checkedOutAt: null,
                checkedOutMemo: '',
                updatedAt: new Date(),
            });
            count++;
        });
        await batch1.commit();
        console.log(`   ✅ ${count}명 초기화 완료`);

        // participants_admin 초기화
        console.log('\n2️⃣ participants_admin 초기화...');
        const adminsSnapshot = await db.collection('participants_admin').get();
        count = 0;

        const batch2 = db.batch();
        adminsSnapshot.forEach(doc => {
            batch2.update(doc.ref, {
                checked_in_status: false,
                checkedInAt: null,
                checkedOutAt: null,
                checkedOutMemo: '',
                updatedAt: new Date(),
            });
            count++;
        });
        await batch2.commit();
        console.log(`   ✅ ${count}명 초기화 완료`);

        console.log('\n✅ 모든 초기화 완료!');
        process.exit(0);

    } catch (error) {
        console.error('❌ 오류:', error);
        process.exit(1);
    }
}

resetStatus();
