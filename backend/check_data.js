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

async function checkData() {
    try {
        const snapshot = await db.collection('member_database').limit(5).get();
        console.log('member_database 샘플 데이터:');
        snapshot.forEach(doc => {
            console.log(doc.id, JSON.stringify(doc.data(), null, 2));
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkData();
