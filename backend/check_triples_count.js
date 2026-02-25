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

async function checkTripleS() {
    try {
        console.log('📊 TripleS 타입 정확한 개수 확인\n');

        const collections = ['participants_member', 'participants_others', 'participants_admin'];
        let totalTripleS = 0;
        const triplesList = [];

        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName).get();
            let collectionCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                const types = Array.isArray(data.type) ? data.type : (data.type ? [data.type] : []);

                if (types.includes('TripleS')) {
                    collectionCount++;
                    totalTripleS++;
                    triplesList.push({
                        name: data.name,
                        phoneKey: doc.id,
                        collection: collectionName,
                    });
                }
            });

            console.log(`📂 ${collectionName}: ${collectionCount}명`);
        }

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log(`📊 TripleS 타입 총합: ${totalTripleS}명\n`);

        console.log('상세 목록:');
        triplesList.forEach(m => {
            console.log(`  • ${m.name} (${m.phoneKey}) - ${m.collection}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

checkTripleS();
