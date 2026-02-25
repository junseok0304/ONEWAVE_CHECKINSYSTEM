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

async function checkOthersTripleS() {
    try {
        console.log('📋 participants_others의 TripleS 멤버\n');

        const snapshot = await db.collection('participants_others').get();
        const tripleS = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const types = Array.isArray(data.type) ? data.type : (data.type ? [data.type] : []);
            
            if (types.includes('TripleS')) {
                tripleS.push(data.name);
            }
        });

        console.log(`총 ${tripleS.length}명:`);
        tripleS.sort().forEach(name => {
            console.log(`  • ${name}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

checkOthersTripleS();
