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

async function findStaff() {
    try {
        console.log('🔍 운영진(teamNumber = 0) 찾기\n');

        const snapshot = await db.collection('participants_discord').get();
        let foundStaff = false;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.teamNumber === 0) {
                foundStaff = true;
                console.log(`✅ 운영진 발견:`);
                console.log(`   - 이름: ${data.name}`);
                console.log(`   - 이메일: ${data.email}`);
                console.log(`   - 휴대폰: ${data.phone}`);
                console.log(`   - teamNumber: ${data.teamNumber}`);
                console.log(`   - position: ${data.position}`);
                console.log();
            }
        });

        if (!foundStaff) {
            console.log('❌ teamNumber = 0인 운영진을 찾을 수 없습니다.');
            console.log('   모든 참가자의 teamNumber는 1~35 범위입니다.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 오류:', error.message);
        process.exit(1);
    }
}

findStaff();
