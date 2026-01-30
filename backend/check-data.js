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

async function checkCollectionData(collectionName) {
    try {
        console.log(`\n📂 === ${collectionName} 컬렉션 ===\n`);

        const snapshot = await db.collection(collectionName).limit(1).get();

        if (snapshot.empty) {
            console.log('(데이터 없음)');
            return;
        }

        const doc = snapshot.docs[0];
        console.log(`문서 ID: ${doc.id}\n`);
        console.log('필드:');
        const data = doc.data();
        Object.keys(data).forEach(key => {
            const value = data[key];
            const displayValue =
                typeof value === 'object'
                    ? JSON.stringify(value).substring(0, 50) + '...'
                    : String(value).substring(0, 50);
            console.log(`  - ${key}: ${displayValue}`);
        });
    } catch (error) {
        console.error(`❌ 오류: ${error.message}`);
    }
}

async function main() {
    const collectionNames = [
        'participants',
        'participants_checkin',
        'participants_discord',
    ];

    for (const name of collectionNames) {
        await checkCollectionData(name);
    }

    process.exit(0);
}

main();
