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

async function checkAdminTypes() {
    try {
        console.log('📋 participants_admin 타입 확인\n');

        const snapshot = await db.collection('participants_admin').get();

        snapshot.forEach(doc => {
            const data = doc.data();
            const name = data.name || '[빈 이름]';
            const type = data.type;

            console.log(`${name}:`);
            console.log(`  타입: ${Array.isArray(type) ? type.join(', ') : type}`);
        });

        console.log(`\n총 ${snapshot.size}명\n`);

        // 타입별 집계
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 운영진의 타입별 분류:');
        const typeStats = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const types = Array.isArray(data.type) ? data.type : (data.type ? [data.type] : ['allMembers']);
            types.forEach(t => {
                typeStats[t] = (typeStats[t] || 0) + 1;
            });
        });

        Object.entries(typeStats).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
            console.log(`  • ${type}: ${count}명`);
        });
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

checkAdminTypes();
