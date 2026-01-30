import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    fs.readFileSync('./onewave-bot-firebase-adminsdk-fbsvc-3966f945a4.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function removeTypesField() {
    try {
        console.log('🔍 participants_admin에서 types 필드 제거 중...');

        const adminSnapshot = await db.collection('participants_admin').get();
        let adminCount = 0;

        for (const doc of adminSnapshot.docs) {
            const data = doc.data();
            if (data.types) {
                await db.collection('participants_admin').doc(doc.id).update({
                    types: admin.firestore.FieldValue.delete(),
                });
                adminCount++;
            }
        }

        console.log(`✅ participants_admin: ${adminCount}개 문서에서 types 필드 제거`);

        console.log('\n🔍 participants_checkin에서 types 필드 제거 중...');

        const checkinSnapshot = await db.collection('participants_checkin').get();
        let checkinCount = 0;

        for (const doc of checkinSnapshot.docs) {
            const data = doc.data();
            if (data.types) {
                await db.collection('participants_checkin').doc(doc.id).update({
                    types: admin.firestore.FieldValue.delete(),
                });
                checkinCount++;
            }
        }

        console.log(`✅ participants_checkin: ${checkinCount}개 문서에서 types 필드 제거`);

        console.log('\n✅ types 필드 제거 완료!');
        console.log(`   - participants_admin: ${adminCount}개`);
        console.log(`   - participants_checkin: ${checkinCount}개`);

        process.exit(0);
    } catch (error) {
        console.error('❌ 필드 제거 실패:', error);
        process.exit(1);
    }
}

removeTypesField();
