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

async function checkGdgSKHU() {
    try {
        console.log('📊 gdgSKHU 타입 분포 확인\n');

        const collections = ['participants_member', 'participants_others', 'participants_admin'];
        let totalGdgSKHU = 0;
        const gdgSKHUMembers = [];

        for (const collectionName of collections) {
            console.log(`📂 ${collectionName}:`);
            const snapshot = await db.collection(collectionName).get();
            let collectionGdgSKHUCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                const types = Array.isArray(data.type) ? data.type : (data.type ? [data.type] : []);

                if (types.includes('gdgSKHU')) {
                    collectionGdgSKHUCount++;
                    totalGdgSKHU++;
                    gdgSKHUMembers.push({
                        name: data.name,
                        phoneKey: doc.id,
                        collection: collectionName,
                        allTypes: types.join(', ')
                    });
                }
            });

            console.log(`  • gdgSKHU 포함: ${collectionGdgSKHUCount}명\n`);
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📊 gdgSKHU 타입 총합: ${totalGdgSKHU}명\n`);

        if (gdgSKHUMembers.length > 0) {
            console.log('gdgSKHU 멤버 목록:');
            gdgSKHUMembers.forEach(m => {
                console.log(`  • ${m.name} (${m.phoneKey}) - ${m.collection} - 타입: ${m.allTypes}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

checkGdgSKHU();
