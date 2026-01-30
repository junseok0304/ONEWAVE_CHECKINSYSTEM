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
    console.log('🔍 키오스크 체크인 상태 진단\n');

    try {
        // 1. 현재 날짜 확인
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const koreaTime = new Date(today.getTime() + 9 * 60 * 60 * 1000);
        const koreaDateString = koreaTime.toISOString().split('T')[0];

        console.log('📅 현재 시간 정보:');
        console.log(`   UTC: ${today.toISOString()}`);
        console.log(`   UTC 기반 날짜: ${todayString}`);
        console.log(`   한국 시간: ${koreaTime.toISOString()}`);
        console.log(`   한국 기반 날짜: ${koreaDateString}`);
        console.log(`   백엔드가 사용하는 날짜: checkIn_${todayString}\n`);

        // 2. checkIn 컬렉션 목록 확인
        console.log('📊 현재 존재하는 checkIn 컬렉션:');
        const collections = await db.listCollections();
        const checkInCollections = [];

        for (const collection of collections) {
            if (collection.id.startsWith('checkIn_')) {
                const count = (await collection.get()).size;
                checkInCollections.push({ id: collection.id, count });
                console.log(`   ${collection.id}: ${count}명`);
            }
        }

        if (checkInCollections.length === 0) {
            console.log('   (없음)\n');
        } else {
            console.log();
        }

        // 3. 오늘의 checkIn 데이터 확인
        console.log(`📝 checkIn_${todayString} 데이터:`);
        const checkInSnapshot = await db.collection(`checkIn_${todayString}`).get();

        if (checkInSnapshot.empty) {
            console.log('   (데이터 없음)\n');
        } else {
            console.log(`   총 ${checkInSnapshot.size}명 체크인됨:`);
            checkInSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - ${data.name} (ID: ${doc.id})`);
            });
            console.log();
        }

        // 4. 뒷번호 0304인 사용자 찾기
        console.log('🔎 뒷번호 0304인 사용자 찾기:');
        const participantsSnapshot = await db.collection('participants_checkin').get();
        const adminsSnapshot = await db.collection('participants_admin').get();

        let found = false;

        // 참가자 검색
        for (const doc of participantsSnapshot.docs) {
            const data = doc.data();
            const phone = data.phone || '';
            const phoneLast4 = phone.replace(/-/g, '').slice(-4);

            if (phoneLast4 === '0304') {
                const checkedInIds = new Set();
                const checkInSnap = await db.collection(`checkIn_${todayString}`).get();
                checkInSnap.forEach(cdoc => {
                    checkedInIds.add(cdoc.id);
                });

                const isCheckedIn = checkedInIds.has(doc.id);

                console.log('   [참가자]');
                console.log(`   이름: ${data.name}`);
                console.log(`   ID: ${doc.id}`);
                console.log(`   전화번호: ${phone}`);
                console.log(`   상태: ${isCheckedIn ? '✅ 체크인됨' : '⭕ 미체크인'}`);
                console.log(`   participants_checkin.checked_in_status: ${data.checked_in_status}`);
                console.log(`   checkIn_${todayString}에 있는가: ${checkedInIds.has(doc.id)}`);
                console.log();
                found = true;
            }
        }

        // 운영진 검색
        for (const doc of adminsSnapshot.docs) {
            const data = doc.data();
            const phone = data.phone || '';
            const phoneLast4 = phone.replace(/-/g, '').slice(-4);

            if (phoneLast4 === '0304') {
                const checkedInIds = new Set();
                const checkInSnap = await db.collection(`checkIn_${todayString}`).get();
                checkInSnap.forEach(cdoc => {
                    checkedInIds.add(cdoc.id);
                });

                const isCheckedIn = checkedInIds.has(doc.id);

                console.log('   [운영진]');
                console.log(`   이름: ${data.name}`);
                console.log(`   ID: ${doc.id}`);
                console.log(`   전화번호: ${phone}`);
                console.log(`   상태: ${isCheckedIn ? '✅ 체크인됨' : '⭕ 미체크인'}`);
                console.log(`   participants_admin.checked_in_status: ${data.checked_in_status}`);
                console.log(`   checkIn_${todayString}에 있는가: ${isCheckedIn}`);
                console.log();
                found = true;
            }
        }

        if (!found) {
            console.log('   0304 사용자를 찾을 수 없습니다\n');
        }

        console.log('✅ 진단 완료!');
        process.exit(0);

    } catch (error) {
        console.error('❌ 진단 중 오류:', error);
        process.exit(1);
    }
}

diagnose();
