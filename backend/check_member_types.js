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

async function checkMemberTypes() {
    try {
        console.log('📊 participants_member 타입 분석\n');

        const snapshot = await db.collection('participants_member').get();
        const typeMap = {};
        const typeCount = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const types = Array.isArray(data.type) ? data.type : (data.type ? [data.type] : []);

            // 각 멤버의 타입 기록
            if (!typeMap[doc.id]) typeMap[doc.id] = { name: data.name, types: [] };
            typeMap[doc.id].types = types;

            // 타입별 카운트
            types.forEach(type => {
                typeCount[type] = (typeCount[type] || 0) + 1;
            });
        });

        console.log('타입별 개수:');
        Object.entries(typeCount).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
            console.log(`  • ${type}: ${count}명`);
        });

        console.log(`\n총 ${snapshot.size}명\n`);

        // gdgSKHU가 없는 멤버 확인
        const noGdgSKHU = Object.entries(typeMap).filter(([, data]) => !data.types.includes('gdgSKHU'));
        if (noGdgSKHU.length > 0) {
            console.log(`⚠️  gdgSKHU가 없는 멤버 (${noGdgSKHU.length}명):`);
            noGdgSKHU.forEach(([id, data]) => {
                console.log(`  • ${data.name} - 타입: ${data.types.length > 0 ? data.types.join(', ') : '(없음)'}`);
            });
        } else {
            console.log('✅ 모든 멤버가 gdgSKHU 타입을 가지고 있습니다.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

checkMemberTypes();
