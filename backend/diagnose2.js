import admin from 'firebase-admin';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = JSON.parse(
    fs.readFileSync('./onewave-bot-firebase-adminsdk-fbsvc-3966f945a4.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function diagnose() {
    console.log('🔍 상세 체크인 상태 진단\n');

    try {
        // 한국 시간 기반 날짜
        const today = new Date();
        const koreaTime = new Date(today.getTime() + 9 * 60 * 60 * 1000);
        const todayString = koreaTime.toISOString().split('T')[0];

        console.log(`📅 현재 한국 시간: ${koreaTime.toISOString()}`);
        console.log(`📝 기준 컬렉션: checkIn_${todayString}\n`);

        // checkIn_{today} 조회
        const checkInSnapshot = await db.collection(`checkIn_${todayString}`).get();
        const checkedInIds = new Set();
        checkInSnapshot.forEach(doc => {
            checkedInIds.add(doc.id);
        });

        console.log(`📊 오늘 체크인된 사용자: ${checkInSnapshot.size}명\n`);

        // 참가자 샘플 5명 조회
        console.log('👥 참가자 샘플 상태 확인 (5명):');
        const participantsSnapshot = await db.collection('participants_checkin').limit(5).get();

        for (const doc of participantsSnapshot.docs) {
            const data = doc.data();
            const phone = data.phone || '';
            const phoneLast4 = phone.replace(/-/g, '').slice(-4);
            const inCheckIn = checkedInIds.has(doc.id);

            console.log(`
   이름: ${data.name}
   ID: ${doc.id}
   전화 뒷4자: ${phoneLast4}
   participants.checked_in_status: ${data.checked_in_status}
   checkIn_${todayString} 포함: ${inCheckIn}
   API 응답값: ${inCheckIn}
   ────────────────────────`);
        }

        // 오늘 이미 체크인한 컬렉션들 확인
        console.log('\n📋 어제 이전 checkIn 컬렉션 확인:');
        const collections = await db.listCollections();
        const oldCheckIns = [];

        for (const collection of collections) {
            if (collection.id.startsWith('checkIn_') && collection.id !== `checkIn_${todayString}`) {
                const count = (await collection.get()).size;
                if (count > 0) {
                    oldCheckIns.push({ id: collection.id, count });
                }
            }
        }

        if (oldCheckIns.length === 0) {
            console.log('   (없음)');
        } else {
            oldCheckIns.forEach(item => {
                console.log(`   ${item.id}: ${item.count}명`);
            });
        }

        console.log('\n✅ 진단 완료!');
        process.exit(0);

    } catch (error) {
        console.error('❌ 진단 중 오류:', error);
        process.exit(1);
    }
}

diagnose();
