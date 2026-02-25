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

async function cleanupBadData() {
    try {
        console.log('🧹 이상한 데이터 정리 시작...\n');

        const collections = ['member_database', 'participants_admin', 'participants_others'];
        let totalRemoved = 0;

        for (const collectionName of collections) {
            console.log(`📂 ${collectionName} 검사 중...`);
            const snapshot = await db.collection(collectionName).get();
            const toRemove = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                const name = data.name?.trim() || '';

                // 제거할 조건들
                if (!name || 
                    name === 'name' ||  // CSV 헤더
                    name === 'participants_member' || // CSV 헤더
                    name === '백업 데이터' || // 불필요한 데이터
                    name.includes('(백업 데이터)') ||
                    name.includes('(participants_member)')) {
                    toRemove.push({ docId: doc.id, name: name || '[빈 이름]' });
                }
            });

            for (const item of toRemove) {
                await db.collection(collectionName).doc(item.docId).delete();
                console.log(`  ❌ "${item.name}" (${item.docId}) 제거`);
                totalRemoved++;
            }

            if (toRemove.length === 0) {
                console.log(`  ✅ 이상한 데이터 없음`);
            }
        }

        console.log(`\n✨ 총 ${totalRemoved}개 데이터 정리 완료!\n`);

        // 최종 확인
        console.log('📊 최종 데이터 확인:');
        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName).get();
            console.log(`  ✅ ${collectionName}: ${snapshot.size}명`);
        }

        const adminSnapshot = await db.collection('participants_admin').get();
        const memberSnapshot = await db.collection('member_database').get();
        const othersSnapshot = await db.collection('participants_others').get();
        const totalCount = adminSnapshot.size + memberSnapshot.size + othersSnapshot.size;

        console.log(`\n📈 총 인원: ${totalCount}명\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

cleanupBadData();
