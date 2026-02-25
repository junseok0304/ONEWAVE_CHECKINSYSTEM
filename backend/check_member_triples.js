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

async function checkMemberTripleS() {
    try {
        console.log('📋 participants_member의 TripleS 멤버\n');

        const snapshot = await db.collection('participants_member').get();
        const tripleS = [];
        const noTripleS = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const types = Array.isArray(data.type) ? data.type : (data.type ? [data.type] : []);
            
            if (types.includes('TripleS')) {
                tripleS.push(data.name);
            } else {
                noTripleS.push({ name: data.name, types: types.join(', ') });
            }
        });

        console.log(`TripleS 있는 사람: ${tripleS.length}명`);
        if (tripleS.length > 0) {
            tripleS.sort().forEach(name => {
                console.log(`  • ${name}`);
            });
        }

        console.log(`\nTripleS 없는 사람: ${noTripleS.length}명`);
        if (noTripleS.length > 0) {
            noTripleS.slice(0, 10).forEach(p => {
                console.log(`  • ${p.name} (타입: ${p.types})`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 에러:', error);
        process.exit(1);
    }
}

checkMemberTripleS();
