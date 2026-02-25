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

async function verifyAllMembers() {
    try {
        console.log('📊 각 컬렉션의 allMembers 검증\n');

        const collections = ['participants_admin', 'participants_member', 'participants_others'];
        let totalCount = 0;
        let allMembersCount = 0;
        const noAllMembers = [];

        for (const collectionName of collections) {
            console.log(`📂 ${collectionName}:`);
            const snapshot = await db.collection(collectionName).get();
            let collectionAllMembersCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                totalCount++;
                
                const types = Array.isArray(data.type) ? data.type : (data.type ? [data.type] : []);
                
                if (types.includes('allMembers')) {
                    collectionAllMembersCount++;
                    allMembersCount++;
                } else {
                    noAllMembers.push({
                        name: data.name,
                        phoneKey: doc.id,
                        collection: collectionName,
                        types: types.length > 0 ? types.join(', ') : '(없음)'
                    });
                }
            });

            console.log(`  • 총: ${snapshot.size}명`);
            console.log(`  • allMembers: ${collectionAllMembersCount}명\n`);
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📊 전체 집계:`);
        console.log(`  • 전체 멤버: ${totalCount}명`);
        console.log(`  • allMembers 포함: ${allMembersCount}명`);
        console.log(`  • allMembers 미포함: ${noAllMembers.length}명\n`);

        if (noAllMembers.length > 0) {
            console.log('⚠️  allMembers가 없는 멤버들:');
            noAllMembers.forEach(m => {
                console.log(`  • ${m.name} (${m.phoneKey}) - ${m.collection} - 타입: ${m.types}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

verifyAllMembers();
