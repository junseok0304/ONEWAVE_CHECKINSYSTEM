import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(
    fs.readFileSync('./onewave-bot-firebase-adminsdk-fbsvc-3966f945a4.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function importAdminFromTSV() {
    try {
        const tsvPath = path.join(__dirname, '../checkinsystem등록용.tsv');

        if (!fs.existsSync(tsvPath)) {
            console.error('❌ TSV 파일을 찾을 수 없습니다:', tsvPath);
            process.exit(1);
        }

        console.log('🔍 TSV 파일 읽기 중...');

        const adminUsers = [];
        let lineNum = 0;

        const fileStream = fs.createReadStream(tsvPath, { encoding: 'utf-8' });
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        for await (const line of rl) {
            lineNum++;

            // 헤더 스킵
            if (lineNum === 1) {
                console.log(`📋 헤더: ${line}`);
                continue;
            }

            const parts = line.split('\t');
            if (parts.length < 7) {
                console.log(`  ⚠️  Line ${lineNum}: 필드 개수 부족 (스킵)`);
                continue;
            }

            const [phoneKey, name, email, phone, position, teamNumber, schoolName] = parts.map(p => p.trim());

            if (!phoneKey || !name || !phone) {
                console.log(`  ⚠️  Line ${lineNum}: 필수 필드 누락 (스킵)`);
                continue;
            }

            // phoneKey 검증 및 포맷 변환
            let normalizedPhoneKey = phoneKey;
            if (phoneKey.match(/^\d{11}$/)) {
                // 1012345678 형식 → 01012345678 확인 (이미 11자리인지)
                normalizedPhoneKey = phoneKey;
            } else if (phoneKey.match(/^0\d{10}$/)) {
                // 01012345678 형식 → 그대로 사용
                normalizedPhoneKey = phoneKey;
            } else {
                console.log(`  ⚠️  Line ${lineNum} (${name}): 유효하지 않은 phoneKey 형식 (스킵): ${phoneKey}`);
                continue;
            }

            adminUsers.push({
                phoneKey: normalizedPhoneKey,
                name,
                email,
                phone,
                position,
                teamNumber: parseInt(teamNumber) || 0,
                schoolName,
                lineNum,
            });
        }

        console.log(`\n✅ TSV에서 ${adminUsers.length}명의 운영진 발견\n`);

        if (adminUsers.length === 0) {
            console.log('⚠️  운영진 데이터가 없습니다.');
            process.exit(0);
        }

        adminUsers.forEach((admin, idx) => {
            console.log(`${idx + 1}. ${admin.name} (${admin.email}) - ${admin.phoneKey}`);
        });

        console.log('\n📝 participants_admin 컬렉션에 저장 중...\n');

        let successCount = 0;
        let skipCount = 0;

        for (const adminUser of adminUsers) {
            try {
                // 기존 데이터 확인
                const existingDoc = await db.collection('participants_admin').doc(adminUser.phoneKey).get();

                const userData = {
                    name: adminUser.name,
                    email: adminUser.email,
                    phone: adminUser.phone,
                    position: adminUser.position,
                    school: adminUser.schoolName,
                    teamNumber: adminUser.teamNumber,
                    status: 'APPROVED',
                    memo: '',
                    updatedAt: new Date(),
                };

                if (existingDoc.exists) {
                    // 기존 메모 유지
                    const existingMemo = existingDoc.data().memo;
                    if (existingMemo) {
                        userData.memo = existingMemo;
                    }
                    await db.collection('participants_admin').doc(adminUser.phoneKey).update(userData);
                    console.log(`  🔄 ${adminUser.name} 업데이트 (phoneKey: ${adminUser.phoneKey})`);
                } else {
                    // 신규 추가
                    userData.createdAt = new Date();
                    await db.collection('participants_admin').doc(adminUser.phoneKey).set(userData);
                    console.log(`  ✨ ${adminUser.name} 신규 추가 (phoneKey: ${adminUser.phoneKey})`);
                }

                successCount++;
            } catch (error) {
                console.error(`  ❌ ${adminUser.name} 저장 실패:`, error.message);
                skipCount++;
            }
        }

        console.log(`\n✅ 임포트 완료!`);
        console.log(`   - 성공: ${successCount}명`);
        console.log(`   - 실패: ${skipCount}명`);
        console.log(`   - 총 ${adminUsers.length}명 처리`);

        process.exit(0);
    } catch (error) {
        console.error('❌ 임포트 실패:', error);
        process.exit(1);
    }
}

importAdminFromTSV();
