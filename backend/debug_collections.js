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

async function debugCollections() {
    try {
        console.log('🔍 모든 컬렉션 확인\n');

        const collections = [
            'participants_member',
            'participants_admin',
            'participants_others',
            'member_database',
            'member',
            'members'
        ];

        for (const collectionName of collections) {
            try {
                const snapshot = await db.collection(collectionName).get();
                console.log(`✅ ${collectionName}: ${snapshot.size}명`);

                if (snapshot.size > 0) {
                    const firstDoc = snapshot.docs[0].data();
                    console.log(`   샘플 데이터:`, {
                        name: firstDoc.name,
                        phone: firstDoc.phone || firstDoc.phoneNumber,
                        type: firstDoc.type || firstDoc.types
                    });
                }
            } catch (error) {
                console.log(`❌ ${collectionName}: 접근 불가`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

debugCollections();
