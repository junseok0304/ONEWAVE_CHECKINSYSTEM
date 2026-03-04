import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'your-firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'test-checkin-c8dcb'
});

const db = admin.firestore();

async function fixYunhaType() {
    try {
        // 이윤하 찾기
        const snapshot = await db.collection('participants_member').where('name', '==', '이윤하').get();

        if (snapshot.empty) {
            console.log('❌ 이윤하를 찾을 수 없습니다.');
            process.exit(1);
        }

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const types = Array.isArray(data.type) ? data.type : (data.type ? [data.type] : []);

            // gdgSKHU 추가
            if (!types.includes('gdgSKHU')) {
                types.push('gdgSKHU');
                await doc.ref.update({ type: types });
                console.log(`✅ ${data.name}의 타입 업데이트 완료`);
                console.log(`   이전: ${data.type}`);
                console.log(`   이후: ${types.join(', ')}`);
            } else {
                console.log(`ℹ️  ${data.name}는 이미 gdgSKHU 타입을 가지고 있습니다.`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

fixYunhaType();
