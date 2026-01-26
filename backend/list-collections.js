import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';

dotenv.config();

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function listCollections() {
    try {
        console.log('📚 Firestore 컬렉션 목록:\n');

        const collections = await db.listCollections();

        if (collections.length === 0) {
            console.log('컬렉션이 없습니다.');
            process.exit(0);
        }

        for (const collection of collections) {
            console.log(`📂 ${collection.id}`);

            const snapshot = await collection.limit(3).get();
            console.log(`   (문서 수: ${snapshot.size}개 이상)\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 오류:', error.message);
        process.exit(1);
    }
}

listCollections();
