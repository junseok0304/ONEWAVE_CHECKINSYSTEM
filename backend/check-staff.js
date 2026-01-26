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

async function checkStaffData() {
    try {
        console.log('🔍 운영진 데이터 확인\n');

        // position이 특정 값인 사람들 확인
        const snapshot = await db.collection('participants_discord').get();

        const positions = {};
        const teams = {};
        let count = 0;

        snapshot.forEach(doc => {
            const data = doc.data();

            // position 카운팅
            const pos = data.position || 'N/A';
            positions[pos] = (positions[pos] || 0) + 1;

            // teamNumber 카운팅
            const team = data.teamNumber || 'N/A';
            teams[team] = (teams[team] || 0) + 1;

            // 첫 3개만 로그
            if (count < 3) {
                console.log(`${count + 1}. ${data.name}`);
                console.log(`   - position: ${data.position}`);
                console.log(`   - teamNumber: ${data.teamNumber}`);
                console.log(`   - status: ${data.status}`);
                console.log();
            }
            count++;
        });

        console.log('📊 Position 분포:');
        Object.entries(positions).forEach(([pos, count]) => {
            console.log(`  ${pos}: ${count}명`);
        });

        console.log('\n📊 Team 분포:');
        Object.entries(teams)
            .sort((a, b) => {
                const aNum = isNaN(a[0]) ? 999 : parseInt(a[0]);
                const bNum = isNaN(b[0]) ? 999 : parseInt(b[0]);
                return aNum - bNum;
            })
            .forEach(([team, count]) => {
                console.log(`  Team ${team}: ${count}명`);
            });

        process.exit(0);
    } catch (error) {
        console.error('❌ 오류:', error.message);
        process.exit(1);
    }
}

checkStaffData();
