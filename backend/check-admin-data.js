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

async function checkAdminData() {
    try {
        console.log('🔍 participants_admin 데이터 확인 중...\n');

        const snapshot = await db.collection('participants_admin').limit(5).get();

        console.log(`총 ${snapshot.size}개 문서 (처음 5개만 표시):\n`);

        snapshot.forEach((doc, idx) => {
            const data = doc.data();
            console.log(`${idx + 1}. ${data.name} (${doc.id})`);
            console.log(`   필드:`, Object.keys(data).sort());
            console.log(`   teamNumber: ${data.teamNumber !== undefined ? data.teamNumber : '❌ 없음'}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ 확인 실패:', error);
        process.exit(1);
    }
}

checkAdminData();
