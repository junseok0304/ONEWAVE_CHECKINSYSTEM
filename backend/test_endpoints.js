import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'your-firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'test-checkin-c8dcb'
});

const db = admin.firestore();

async function testEndpoints() {
    try {
        console.log('🧪 각 엔드포인트 데이터 확인\n');

        const endpoints = [
            { name: 'members (participants_member)', collection: 'participants_member' },
            { name: 'admin-members (participants_admin)', collection: 'participants_admin' },
            { name: 'others-members (participants_others)', collection: 'participants_others' }
        ];

        let totalCount = 0;

        for (const endpoint of endpoints) {
            const snapshot = await db.collection(endpoint.collection).get();
            const members = snapshot.docs.map(doc => ({
                phoneKey: doc.id,
                collection: endpoint.collection,
                ...doc.data(),
            }));

            console.log(`📋 ${endpoint.name}:`);
            console.log(`   총 멤버 수: ${members.length}명\n`);
            totalCount += members.length;
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📊 전체 합계: ${totalCount}명\n`);

        // members, adminRes, othersRes 배열이 실제로 어떻게 합쳐지는지 테스트
        const memberRes = await db.collection('participants_member').get();
        const adminRes = await db.collection('participants_admin').get();
        const othersRes = await db.collection('participants_others').get();

        const membersList = memberRes.docs.map(doc => ({
            phoneKey: doc.id,
            collection: 'participants_member',
            ...doc.data(),
        }));

        const adminList = adminRes.docs.map(doc => ({
            phoneKey: doc.id,
            collection: 'participants_admin',
            ...doc.data(),
        }));

        const othersList = othersRes.docs.map(doc => ({
            phoneKey: doc.id,
            collection: 'participants_others',
            ...doc.data(),
        }));

        const combined = [
            ...membersList,
            ...adminList,
            ...othersList
        ];

        console.log('배열 병합 결과:');
        console.log(`  • membersList: ${membersList.length}명`);
        console.log(`  • adminList: ${adminList.length}명`);
        console.log(`  • othersList: ${othersList.length}명`);
        console.log(`  • combined: ${combined.length}명\n`);

        // phoneKey 중복 확인
        const phoneKeys = new Set();
        const duplicates = [];

        combined.forEach(m => {
            if (phoneKeys.has(m.phoneKey)) {
                duplicates.push(m.phoneKey);
            }
            phoneKeys.add(m.phoneKey);
        });

        if (duplicates.length > 0) {
            console.log(`⚠️  중복된 phoneKey (${duplicates.length}개):`);
            duplicates.forEach(pk => console.log(`  • ${pk}`));
        } else {
            console.log('✅ 중복된 phoneKey 없음');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

testEndpoints();
